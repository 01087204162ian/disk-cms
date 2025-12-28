/**
 * ================================================================
 * 주 4일 근무제 스케줄 관리 API 라우터
 * ================================================================
 * 
 * 주요 기능:
 * - 사용자 스케줄 조회 (4주 사이클 기준)
 * - 반차 신청 및 검증
 * - 일시적 휴무일 변경 신청 및 승인
 * - 관리자 승인 워크플로우
 * 
 * 타임존 규칙:
 * - 모든 날짜 계산은 KST (Asia/Seoul, UTC+9) 기준
 * - 서버에서 모든 날짜 계산 수행
 * 
 * Created: 2025-12-28
 * Version: 1.0.0
 * ================================================================
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../../config/database');
const {
  formatDate,
  getWeekStartDate,
  getWeekEndDate,
  calculateOffDayByWeekCycle,
  getDayName,
  getCycleWeek,
  calculateCycleInfo,
  isProbationPeriod,
  isSameWeek,
  hasHolidayInWeek,
  isHoliday,
  validateHalfDay,
  validateTemporaryChange
} = require('./work-schedule-helpers');

// ===========================
// 인증 미들웨어
// ===========================
const requireAuth = (req, res, next) => {
    if (!req.session?.user) {
        return res.status(401).json({
            success: false,
            message: '로그인이 필요합니다.',
            code: 'UNAUTHORIZED'
        });
    }
    next();
};

// 관리자 권한 확인
const requireManager = (req, res, next) => {
    if (!req.session?.user || 
        !['SUPER_ADMIN', 'DEPT_MANAGER', 'SYSTEM_ADMIN'].includes(req.session.user.role)) {
        return res.status(403).json({
            success: false,
            message: '관리자 권한이 필요합니다.',
            code: 'FORBIDDEN'
        });
    }
    next();
};

// ===========================
// 1. 사용자 스케줄 상태 확인
// ===========================

/**
 * GET /api/staff/work-schedules/my-status
 * 현재 사용자의 주4일 근무제 설정 상태 확인
 */
router.get('/my-status', requireAuth, async (req, res) => {
    try {
        const userEmail = req.session.user.email;
        
        // 사용자 정보 조회
        const [userRows] = await pool.execute(`
            SELECT email, name, hire_date, work_schedule, work_days
            FROM users
            WHERE email = ?
        `, [userEmail]);
        
        if (userRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '사용자를 찾을 수 없습니다.',
                code: 'NOT_FOUND'
            });
        }
        
        const user = userRows[0];
        // work_days가 이미 객체인지 확인 (MySQL JSON 타입은 자동 파싱될 수 있음)
        let workDays = null;
        if (user.work_days) {
            if (typeof user.work_days === 'string') {
                try {
                    workDays = JSON.parse(user.work_days);
                } catch (error) {
                    console.error('work_days JSON 파싱 오류:', error);
                    workDays = null;
                }
            } else {
                // 이미 객체인 경우
                workDays = user.work_days;
            }
        }
        
        // 수습 기간 확인
        const today = new Date();
        const isProbation = isProbationPeriod(user.hire_date, today);
        
        res.json({
            success: true,
            data: {
                has_work_days: !!workDays,
                work_days: workDays,
                is_probation: isProbation,
                hire_date: user.hire_date
            }
        });
        
    } catch (error) {
        console.error('스케줄 상태 조회 중 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 내부 오류가 발생했습니다.',
            code: 'SERVER_ERROR'
        });
    }
});

// ===========================
// 2. 기본 휴무일 설정
// ===========================

/**
 * POST /api/staff/work-schedules/set-work-days
 * 사용자가 처음으로 기본 휴무일을 설정
 */
router.post('/set-work-days', requireAuth, async (req, res) => {
    try {
        const userEmail = req.session.user.email;
        const { base_off_day } = req.body;
        
        // 파라미터 검증
        if (!base_off_day || ![1, 2, 3, 4, 5].includes(parseInt(base_off_day, 10))) {
            return res.status(400).json({
                success: false,
                message: '기본 휴무일을 선택해주세요. (1=월, 2=화, 3=수, 4=목, 5=금)',
                code: 'VALIDATION_ERROR'
            });
        }
        
        const offDay = parseInt(base_off_day, 10);
        
        // 사용자 정보 조회
        const [userRows] = await pool.execute(`
            SELECT email, name, work_schedule, work_days
            FROM users
            WHERE email = ?
        `, [userEmail]);
        
        if (userRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '사용자를 찾을 수 없습니다.',
                code: 'NOT_FOUND'
            });
        }
        
        const user = userRows[0];
        
        // 이미 설정되어 있는지 확인
        let existingWorkDays = null;
        if (user.work_days) {
            if (typeof user.work_days === 'string') {
                try {
                    existingWorkDays = JSON.parse(user.work_days);
                } catch (error) {
                    existingWorkDays = null;
                }
            } else {
                existingWorkDays = user.work_days;
            }
        }
        
        if (existingWorkDays && existingWorkDays.base_off_day) {
            return res.status(400).json({
                success: false,
                message: '이미 기본 휴무일이 설정되어 있습니다. 변경하려면 관리자에게 문의하세요.',
                code: 'ALREADY_SET'
            });
        }
        
        // 오늘 날짜 기준으로 주 시작일(월요일) 계산
        const today = new Date();
        today.setHours(12, 0, 0, 0); // 정오로 설정하여 타임존 문제 방지
        
        // 오늘이 주말인 경우 다음 월요일로 조정
        const dayOfWeek = today.getDay(); // 0=일, 1=월, ..., 6=토
        let cycleStartDate = new Date(today);
        
        if (dayOfWeek === 0) {
            // 일요일이면 다음 월요일
            cycleStartDate.setDate(today.getDate() + 1);
        } else if (dayOfWeek === 6) {
            // 토요일이면 다음 월요일
            cycleStartDate.setDate(today.getDate() + 2);
        } else {
            // 평일이면 이번 주 월요일
            cycleStartDate.setDate(today.getDate() - (dayOfWeek - 1));
        }
        
        cycleStartDate.setHours(0, 0, 0, 0);
        const cycleStartDateStr = formatDate(cycleStartDate);
        const initialSelectionDateStr = formatDate(today);
        
        // work_days 업데이트
        const workDaysJson = JSON.stringify({
            base_off_day: offDay,
            cycle_start_date: cycleStartDateStr,
            initial_selection_date: initialSelectionDateStr
        });
        
        await pool.execute(`
            UPDATE users
            SET work_days = ?
            WHERE email = ?
        `, [workDaysJson, userEmail]);
        
        res.json({
            success: true,
            message: '기본 휴무일이 설정되었습니다.',
            data: {
                base_off_day: offDay,
                off_day_name: getDayName(offDay),
                cycle_start_date: cycleStartDateStr,
                initial_selection_date: initialSelectionDateStr
            }
        });
        
    } catch (error) {
        console.error('기본 휴무일 설정 중 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 내부 오류가 발생했습니다.',
            code: 'SERVER_ERROR'
        });
    }
});

// ===========================
// 3. 사용자 스케줄 조회
// ===========================

/**
 * GET /api/staff/work-schedules/my-schedule/:year/:month
 * 특정 월의 상세 스케줄 조회
 */
router.get('/my-schedule/:year/:month', requireAuth, async (req, res) => {
    try {
        const userEmail = req.session.user.email;
        const year = parseInt(req.params.year, 10);
        const month = parseInt(req.params.month, 10);
        
        // 파라미터 검증
        if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
            return res.status(400).json({
                success: false,
                message: '유효하지 않은 연도 또는 월입니다.',
                code: 'VALIDATION_ERROR'
            });
        }
        
        // 사용자 정보 조회
        const [userRows] = await pool.execute(`
            SELECT email, name, hire_date, work_schedule, work_days
            FROM users
            WHERE email = ?
        `, [userEmail]);
        
        if (userRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '사용자를 찾을 수 없습니다.',
                code: 'NOT_FOUND'
            });
        }
        
        const user = userRows[0];
        // work_days가 이미 객체인지 확인 (MySQL JSON 타입은 자동 파싱될 수 있음)
        let workDays = null;
        if (user.work_days) {
            if (typeof user.work_days === 'string') {
                try {
                    workDays = JSON.parse(user.work_days);
                } catch (error) {
                    console.error('work_days JSON 파싱 오류:', error);
                    workDays = null;
                }
            } else {
                // 이미 객체인 경우
                workDays = user.work_days;
            }
        }
        
        if (!workDays) {
            return res.status(400).json({
                success: false,
                message: '주4일 근무제 설정이 없습니다.',
                code: 'WORK_DAYS_NOT_SET'
            });
        }
        
        // 해당 월의 공휴일 조회 (이전/다음 월의 공휴일도 포함)
        // 주의: 12월 28일이 포함된 주는 1월 1일도 포함될 수 있음
        const monthStart = new Date(year, month - 1, 1);
        const monthEnd = new Date(year, month, 0); // 해당 월의 마지막 날
        
        // 주의 시작일과 종료일 계산 (첫 주와 마지막 주의 경계 확인)
        const firstDayWeekStart = getWeekStartDate(monthStart);
        const lastDayWeekEnd = getWeekEndDate(monthEnd);
        
        // 12월의 경우, 마지막 날이 포함된 주의 다음 주도 확인 (1월 1일 포함)
        let queryEndDate = lastDayWeekEnd;
        if (month === 12) {
            // 12월 마지막 날의 다음 주 종료일까지 포함
            const nextWeekEnd = new Date(lastDayWeekEnd);
            nextWeekEnd.setDate(lastDayWeekEnd.getDate() + 7);
            queryEndDate = nextWeekEnd;
        }
        
        // 해당 월과 겹치는 모든 주의 공휴일 조회
        // 주의: 연도 경계를 넘어가는 경우를 대비하여 ±1년 범위로 확장
        const queryStartDate = new Date(firstDayWeekStart);
        queryStartDate.setFullYear(queryStartDate.getFullYear() - 1); // 1년 전까지
        const queryEndDateExtended = new Date(queryEndDate);
        queryEndDateExtended.setFullYear(queryEndDateExtended.getFullYear() + 1); // 1년 후까지
        
        const [holidayRows] = await pool.execute(`
            SELECT holiday_date, name FROM holidays 
            WHERE holiday_date >= ? AND holiday_date <= ?
            AND is_active = 1
            ORDER BY holiday_date ASC
        `, [formatDate(queryStartDate), formatDate(queryEndDateExtended)]);
        
        // 경고: 공휴일이 없거나 부족한 경우 로그
        if (holidayRows.length === 0) {
            console.warn(`[공휴일 경고] ${year}년 ${month}월 조회 시 공휴일 데이터가 없습니다.`);
        } else {
            const holidayYears = [...new Set(holidayRows.map(row => new Date(row.holiday_date).getFullYear()))];
            const requiredYears = [year];
            if (queryEndDateExtended.getFullYear() > year) {
                requiredYears.push(queryEndDateExtended.getFullYear());
            }
            const missingYears = requiredYears.filter(y => !holidayYears.includes(y));
            if (missingYears.length > 0) {
                console.warn(`[공휴일 경고] ${missingYears.join(', ')}년 공휴일 데이터가 없습니다.`);
            }
        }
        
        const holidays = holidayRows.map(row => ({
            date: formatDate(row.holiday_date),
            name: row.name
        }));
        
        // 해당 월의 반차 조회
        const [halfDayRows] = await pool.execute(`
            SELECT id, start_date, leave_type, reason, status
            FROM leaves
            WHERE user_id = ?
            AND YEAR(start_date) = ? AND MONTH(start_date) = ?
            AND leave_type IN ('HALF_AM', 'HALF_PM')
            AND status IN ('PENDING', 'APPROVED')
            ORDER BY start_date ASC
        `, [userEmail, year, month]);
        
        // 해당 월의 일시적 변경 조회
        const [changeRows] = await pool.execute(`
            SELECT id, week_start_date, original_off_day, temporary_off_day, 
                   reason, substitute_employee, status
            FROM schedule_changes
            WHERE user_id = ?
            AND YEAR(week_start_date) = ? AND MONTH(week_start_date) = ?
            AND status = 'APPROVED'
            ORDER BY week_start_date ASC
        `, [userEmail, year, month]);
        
        // 수습 기간 확인
        const today = new Date();
        const isProbation = isProbationPeriod(user.hire_date, today);
        
        // 해당 월의 모든 주에 대해 공휴일 포함 여부 확인
        // dailySchedule을 생성한 후 각 주별로 공휴일 포함 여부를 확인
        const weekHolidayMap = new Map(); // 주 시작일(문자열) -> 공휴일 포함 여부
        const weekOffDayMap = new Map(); // 주 시작일(문자열) -> 휴무일 (1-5)
        
        // 사이클 정보 계산 (해당 월의 첫 날 기준, 공휴일 정보 포함)
        const monthFirstDay = new Date(year, month - 1, 1);
        const cycleInfo = calculateCycleInfo(workDays, monthFirstDay, holidays);
        
        if (!cycleInfo) {
            return res.status(400).json({
                success: false,
                message: '사이클 정보를 계산할 수 없습니다.',
                code: 'CYCLE_CALCULATION_ERROR'
            });
        }
        
        // 현재 월의 work_days 패턴 생성
        const workDaysPattern = {};
        for (let i = 1; i <= 5; i++) {
            workDaysPattern[i] = (i === cycleInfo.currentOffDay) ? 'off' : 'full';
        }
        
        // 월별 각 날짜의 스케줄 정보 계산 (서버에서 계산하여 타임존 문제 해결)
        const daysInMonth = new Date(year, month, 0).getDate();
        const dailySchedule = [];
        const holidaysMap = new Map(holidays.map(h => [h.date, h.name]));
        const halfDaysMap = new Map(halfDayRows.map(h => [formatDate(h.start_date), h]));
        const temporaryChangesMap = new Map(changeRows.map(c => [formatDate(c.week_start_date), c]));
        
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month - 1, day, 12, 0, 0, 0); // 정오 시간으로 설정하여 타임존 문제 방지
            const dayOfWeek = date.getDay(); // 0=일, 1=월, ..., 6=토
            
            // 평일만 처리
            if (dayOfWeek >= 1 && dayOfWeek <= 5) {
                const dateStr = formatDate(date);
                const weekStart = getWeekStartDate(date);
                const weekStartStr = formatDate(weekStart);
                
                // 일시적 변경이 있는지 확인
                const tempChange = temporaryChangesMap.get(weekStartStr);
                let offDay;
                if (tempChange) {
                    // 일시적 변경이 있으면 변경된 휴무일 사용
                    offDay = tempChange.temporary_off_day;
                } else {
                    // 캐시에서 확인
                    offDay = weekOffDayMap.get(weekStartStr);
                    if (offDay === undefined) {
                        // 캐시에 없으면 정상 순환 계산 (공휴일 주 제외)
                        offDay = calculateOffDayByWeekCycle(
                            workDays.cycle_start_date,
                            weekStart,
                            workDays.base_off_day,
                            holidays
                        );
                        // 캐시에 저장
                        weekOffDayMap.set(weekStartStr, offDay);
                    }
                }
                
                const isHolidayDate = holidaysMap.has(dateStr);
                const halfDay = halfDaysMap.get(dateStr);
                
                // 공휴일 포함 주 체크 (캐시 사용하여 중복 계산 방지)
                let weekHasHoliday = weekHolidayMap.get(weekStartStr);
                if (weekHasHoliday === undefined) {
                    // 캐시에 없으면 계산
                    weekHasHoliday = hasHolidayInWeek(weekStart, holidays);
                    weekHolidayMap.set(weekStartStr, weekHasHoliday);
                    
                    // 디버깅: 12월 29일 주 확인 (1월 1일 포함)
                    if (month === 12 && day === 29) {
                        const weekEnd = getWeekEndDate(weekStart);
                        console.log(`[디버깅] 12월 29일 주: ${formatDate(weekStart)} ~ ${formatDate(weekEnd)}, 공휴일 포함: ${weekHasHoliday}`);
                        const weekHolidays = holidays.filter(h => {
                            const hDateStr = typeof h.date === 'string' ? h.date : formatDate(h.date);
                            const weekStartStr = formatDate(weekStart);
                            const weekEndStr = formatDate(weekEnd);
                            return hDateStr >= weekStartStr && hDateStr <= weekEndStr;
                        });
                        console.log(`[디버깅] 해당 주의 공휴일:`, weekHolidays);
                        console.log(`[디버깅] 전체 공휴일 목록:`, holidays.map(h => h.date));
                    }
                }
                
                // 디버깅: 2026년 2월 27일 확인
                if (dateStr === '2026-02-27') {
                    const weekEnd = getWeekEndDate(weekStart);
                    console.log(`[디버깅] 2026-02-27: weekStart=${weekStartStr}, dayOfWeek=${dayOfWeek}, offDay=${offDay}, isHolidayDate=${isHolidayDate}, weekHasHoliday=${weekHasHoliday}`);
                    console.log(`[디버깅] 2026-02-27 주: ${formatDate(weekStart)} ~ ${formatDate(weekEnd)}`);
                }
                
                // 휴무일 판단: 해당 요일이 휴무일이고, 공휴일이 아니며, 공휴일 포함 주가 아닌 경우
                const isOffDay = (dayOfWeek === offDay) && !isHolidayDate && !weekHasHoliday;
                
                dailySchedule.push({
                    date: dateStr,
                    day_of_week: dayOfWeek,
                    off_day: offDay,
                    is_off_day: isOffDay,
                    is_holiday: isHolidayDate,
                    has_half_day: !!halfDay,
                    half_day_type: halfDay ? halfDay.leave_type : null
                });
            }
        }
        
        res.json({
            success: true,
            data: {
                year,
                month,
                user: {
                    email: user.email,
                    name: user.name,
                    hire_date: user.hire_date,
                    work_schedule: user.work_schedule,
                    work_days: workDays
                },
                current_cycle: {
                    cycle_number: cycleInfo.cycleNumber,
                    off_day: cycleInfo.currentOffDay,
                    off_day_name: cycleInfo.currentOffDayName,
                    week_range: cycleInfo.weekRange,
                    cycle_start_date: workDays.cycle_start_date,
                    next_cycle_date: cycleInfo.nextCycleDate,
                    next_off_day: cycleInfo.nextOffDay,
                    next_off_day_name: cycleInfo.nextOffDayName
                },
                schedule: {
                    work_days: workDaysPattern,
                    total_hours: 32,
                    work_days_count: 4
                },
                daily_schedule: dailySchedule,
                temporary_changes: changeRows.map(row => ({
                    id: row.id,
                    week_start_date: formatDate(row.week_start_date),
                    original_off_day: row.original_off_day,
                    temporary_off_day: row.temporary_off_day,
                    reason: row.reason,
                    substitute_employee: row.substitute_employee,
                    status: row.status
                })),
                half_day_list: halfDayRows.map(row => ({
                    id: row.id,
                    start_date: formatDate(row.start_date),
                    leave_type: row.leave_type,
                    reason: row.reason,
                    status: row.status
                })),
                holidays: holidays,
                is_probation: isProbation,
                // 해당 월의 모든 주 중 하나라도 공휴일이 포함되어 있으면 true
                has_holiday_in_week: Array.from(weekHolidayMap.values()).some(hasHoliday => hasHoliday === true)
            }
        });
        
    } catch (error) {
        console.error('스케줄 조회 중 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 내부 오류가 발생했습니다.',
            code: 'SERVER_ERROR'
        });
    }
});

// ===========================
// 3. 반차 신청
// ===========================

/**
 * POST /api/staff/work-schedules/apply-half-day
 * 반차 신청
 */
router.post('/apply-half-day', requireAuth, async (req, res) => {
    try {
        const userEmail = req.session.user.email;
        const { date, leave_type, reason } = req.body;
        
        // 파라미터 검증
        if (!date || !leave_type || !reason) {
            return res.status(400).json({
                success: false,
                message: '필수 파라미터가 누락되었습니다.',
                code: 'VALIDATION_ERROR'
            });
        }
        
        if (!['HALF_AM', 'HALF_PM'].includes(leave_type)) {
            return res.status(400).json({
                success: false,
                message: '유효하지 않은 반차 타입입니다.',
                code: 'VALIDATION_ERROR'
            });
        }
        
        // 사용자 정보 조회
        const [userRows] = await pool.execute(`
            SELECT email, name, hire_date, work_days
            FROM users
            WHERE email = ?
        `, [userEmail]);
        
        if (userRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '사용자를 찾을 수 없습니다.',
                code: 'NOT_FOUND'
            });
        }
        
        const user = userRows[0];
        // work_days가 이미 객체인지 확인 (MySQL JSON 타입은 자동 파싱될 수 있음)
        let workDays = null;
        if (user.work_days) {
            if (typeof user.work_days === 'string') {
                try {
                    workDays = JSON.parse(user.work_days);
                } catch (error) {
                    console.error('work_days JSON 파싱 오류:', error);
                    workDays = null;
                }
            } else {
                // 이미 객체인 경우
                workDays = user.work_days;
            }
        }
        
        if (!workDays) {
            return res.status(400).json({
                success: false,
                message: '주4일 근무제 설정이 없습니다.',
                code: 'WORK_DAYS_NOT_SET'
            });
        }
        
        // 수습 기간 확인
        const isProbation = isProbationPeriod(user.hire_date, new Date());
        if (isProbation) {
            return res.status(400).json({
                success: false,
                message: '수습 기간 중에는 반차를 사용할 수 없습니다.',
                code: 'PROBATION_PERIOD'
            });
        }
        
        // 공휴일 조회
        const applyDate = new Date(date);
        const year = applyDate.getFullYear();
        const month = applyDate.getMonth() + 1;
        
        const [holidayRows] = await pool.execute(`
            SELECT holiday_date, name FROM holidays 
            WHERE holiday_date = ? AND is_active = 1
        `, [date]);
        
        const holidays = holidayRows.map(row => ({
            date: formatDate(row.holiday_date),
            name: row.name
        }));
        
        // 반차 검증
        const validation = validateHalfDay(date, workDays, holidays);
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                message: validation.message,
                code: validation.code
            });
        }
        
        // 반차 신청 저장
        const [result] = await pool.execute(`
            INSERT INTO leaves (user_id, leave_type, start_date, end_date, days_count, reason, status)
            VALUES (?, ?, ?, ?, 0.5, ?, 'PENDING')
        `, [userEmail, leave_type, date, date, reason]);
        
        res.json({
            success: true,
            message: '반차 신청이 완료되었습니다.',
            data: {
                id: result.insertId,
                date: date,
                leave_type: leave_type,
                status: 'PENDING'
            }
        });
        
    } catch (error) {
        console.error('반차 신청 중 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 내부 오류가 발생했습니다.',
            code: 'SERVER_ERROR'
        });
    }
});

// ===========================
// 4. 일시적 휴무일 변경
// ===========================

/**
 * POST /api/staff/work-schedules/temporary-change
 * 일시적 휴무일 변경 신청
 */
router.post('/temporary-change', requireAuth, async (req, res) => {
    try {
        const userEmail = req.session.user.email;
        const { week_start_date, temporary_off_day, reason, substitute_employee } = req.body;
        
        // 파라미터 검증
        if (!week_start_date || !temporary_off_day || !reason) {
            return res.status(400).json({
                success: false,
                message: '필수 파라미터가 누락되었습니다.',
                code: 'VALIDATION_ERROR'
            });
        }
        
        if (temporary_off_day < 1 || temporary_off_day > 5) {
            return res.status(400).json({
                success: false,
                message: '유효하지 않은 휴무일입니다. (1=월, 2=화, 3=수, 4=목, 5=금)',
                code: 'VALIDATION_ERROR'
            });
        }
        
        // 사용자 정보 조회
        const [userRows] = await pool.execute(`
            SELECT email, name, hire_date, work_days
            FROM users
            WHERE email = ?
        `, [userEmail]);
        
        if (userRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '사용자를 찾을 수 없습니다.',
                code: 'NOT_FOUND'
            });
        }
        
        const user = userRows[0];
        // work_days가 이미 객체인지 확인 (MySQL JSON 타입은 자동 파싱될 수 있음)
        let workDays = null;
        if (user.work_days) {
            if (typeof user.work_days === 'string') {
                try {
                    workDays = JSON.parse(user.work_days);
                } catch (error) {
                    console.error('work_days JSON 파싱 오류:', error);
                    workDays = null;
                }
            } else {
                // 이미 객체인 경우
                workDays = user.work_days;
            }
        }
        
        if (!workDays) {
            return res.status(400).json({
                success: false,
                message: '주4일 근무제 설정이 없습니다.',
                code: 'WORK_DAYS_NOT_SET'
            });
        }
        
        // 수습 기간 확인
        const isProbation = isProbationPeriod(user.hire_date, new Date());
        if (isProbation) {
            return res.status(400).json({
                success: false,
                message: '수습 기간 중에는 일시적 변경을 할 수 없습니다.',
                code: 'PROBATION_PERIOD'
            });
        }
        
        // 주 시작일이 월요일인지 확인
        const weekStart = getWeekStartDate(week_start_date);
        const weekStartStr = formatDate(weekStart);
        if (weekStartStr !== week_start_date) {
            return res.status(400).json({
                success: false,
                message: '주 시작일은 월요일이어야 합니다.',
                code: 'VALIDATION_ERROR'
            });
        }
        
        // 공휴일 조회 (사이클 계산을 위해 넓은 범위 조회)
        const weekStartDate = new Date(week_start_date);
        
        // 사이클 시작일부터 해당 주까지의 공휴일 조회
        const cycleStartDate = parseKSTDate(workDays.cycle_start_date);
        const queryStartDate = new Date(cycleStartDate);
        queryStartDate.setFullYear(queryStartDate.getFullYear() - 1); // 1년 전까지
        const queryEndDate = new Date(weekStartDate);
        queryEndDate.setFullYear(queryEndDate.getFullYear() + 1); // 1년 후까지
        
        const [holidayRows] = await pool.execute(`
            SELECT holiday_date, name FROM holidays 
            WHERE holiday_date >= ? AND holiday_date <= ?
            AND is_active = 1
            ORDER BY holiday_date ASC
        `, [formatDate(queryStartDate), formatDate(queryEndDate)]);
        
        const holidays = holidayRows.map(row => ({
            date: formatDate(row.holiday_date),
            name: row.name
        }));
        
        // 원래 휴무일 계산 (공휴일 주 제외)
        const originalOffDay = calculateOffDayByWeekCycle(
            workDays.cycle_start_date,
            weekStart,
            workDays.base_off_day,
            holidays
        );
        
        // 검증
        const validation = validateTemporaryChange(week_start_date, temporary_off_day, workDays, holidays);
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                message: validation.message,
                code: validation.code
            });
        }
        
        // 중복 신청 확인
        const [existingRows] = await pool.execute(`
            SELECT id FROM schedule_changes
            WHERE user_id = ? AND week_start_date = ? AND status = 'PENDING'
        `, [userEmail, week_start_date]);
        
        if (existingRows.length > 0) {
            return res.status(400).json({
                success: false,
                message: '해당 주에 이미 변경 신청이 있습니다.',
                code: 'ALREADY_REQUESTED'
            });
        }
        
        // work_schedules 레코드 찾기 또는 생성
        const [scheduleRows] = await pool.execute(`
            SELECT id FROM work_schedules
            WHERE user_id = ? AND year = ? AND month = ?
        `, [userEmail, year, month]);
        
        let scheduleId;
        if (scheduleRows.length === 0) {
            const [scheduleResult] = await pool.execute(`
                INSERT INTO work_schedules (user_id, year, month, status)
                VALUES (?, ?, ?, 'APPROVED')
            `, [userEmail, year, month]);
            scheduleId = scheduleResult.insertId;
        } else {
            scheduleId = scheduleRows[0].id;
        }
        
        // 일시적 변경 신청 저장
        const [result] = await pool.execute(`
            INSERT INTO schedule_changes 
            (schedule_id, user_id, week_start_date, original_off_day, temporary_off_day, 
             reason, substitute_employee, requested_by, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
        `, [scheduleId, userEmail, week_start_date, originalOffDay, temporary_off_day, 
            reason, substitute_employee || null, userEmail]);
        
        res.json({
            success: true,
            message: '일시적 휴무일 변경 신청이 완료되었습니다.',
            data: {
                id: result.insertId,
                week_start_date: week_start_date,
                original_off_day: originalOffDay,
                temporary_off_day: temporary_off_day,
                status: 'PENDING'
            }
        });
        
    } catch (error) {
        console.error('일시적 변경 신청 중 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 내부 오류가 발생했습니다.',
            code: 'SERVER_ERROR'
        });
    }
});

// ===========================
// 5. 본인 변경 신청 목록 조회
// ===========================

/**
 * GET /api/staff/work-schedules/my-change-requests
 * 본인의 일시적 변경 신청 목록 조회
 */
router.get('/my-change-requests', requireAuth, async (req, res) => {
    try {
        const userEmail = req.session.user.email;
        const { status, year, month } = req.query;
        
        let query = `
            SELECT id, week_start_date, original_off_day, temporary_off_day,
                   reason, substitute_employee, status, created_at
            FROM schedule_changes
            WHERE user_id = ?
        `;
        const params = [userEmail];
        
        if (status) {
            query += ` AND status = ?`;
            params.push(status);
        }
        
        if (year) {
            query += ` AND YEAR(week_start_date) = ?`;
            params.push(parseInt(year, 10));
        }
        
        if (month) {
            query += ` AND MONTH(week_start_date) = ?`;
            params.push(parseInt(month, 10));
        }
        
        query += ` ORDER BY created_at DESC`;
        
        const [rows] = await pool.execute(query, params);
        
        res.json({
            success: true,
            data: rows.map(row => ({
                id: row.id,
                week_start_date: formatDate(row.week_start_date),
                original_off_day: row.original_off_day,
                temporary_off_day: row.temporary_off_day,
                reason: row.reason,
                substitute_employee: row.substitute_employee,
                status: row.status,
                requested_at: row.created_at
            }))
        });
        
    } catch (error) {
        console.error('변경 신청 목록 조회 중 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 내부 오류가 발생했습니다.',
            code: 'SERVER_ERROR'
        });
    }
});

// ===========================
// 6. 관리자 API
// ===========================

/**
 * GET /api/staff/work-schedules/pending-changes
 * 승인 대기 중인 일시적 변경 신청 목록 조회
 */
router.get('/pending-changes', requireAuth, requireManager, async (req, res) => {
    try {
        const userRole = req.session.user.role;
        const userDepartmentId = req.session.user.department_id;
        
        let query = `
            SELECT sc.id, sc.user_id, u.name as user_name, sc.week_start_date,
                   sc.original_off_day, sc.temporary_off_day, sc.reason,
                   sc.substitute_employee, u2.name as substitute_employee_name,
                   sc.status, sc.created_at as requested_at
            FROM schedule_changes sc
            INNER JOIN users u ON sc.user_id = u.email
            LEFT JOIN users u2 ON sc.substitute_employee = u2.email
            WHERE sc.status = 'PENDING'
        `;
        const params = [];
        
        // 부서장의 경우 본인 부서만 조회
        if (userRole === 'DEPT_MANAGER' && userDepartmentId) {
            query += ` AND u.department_id = ?`;
            params.push(userDepartmentId);
        }
        
        query += ` ORDER BY sc.created_at ASC`;
        
        const [rows] = await pool.execute(query, params);
        
        res.json({
            success: true,
            data: rows.map(row => ({
                id: row.id,
                user_id: row.user_id,
                user_name: row.user_name,
                week_start_date: formatDate(row.week_start_date),
                original_off_day: row.original_off_day,
                original_off_day_name: getDayName(row.original_off_day),
                temporary_off_day: row.temporary_off_day,
                temporary_off_day_name: getDayName(row.temporary_off_day),
                reason: row.reason,
                substitute_employee: row.substitute_employee,
                substitute_employee_name: row.substitute_employee_name,
                status: row.status,
                requested_at: row.requested_at
            }))
        });
        
    } catch (error) {
        console.error('승인 대기 목록 조회 중 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 내부 오류가 발생했습니다.',
            code: 'SERVER_ERROR'
        });
    }
});

/**
 * POST /api/staff/work-schedules/approve-change/:changeId
 * 일시적 변경 신청 승인/거부
 */
router.post('/approve-change/:changeId', requireAuth, requireManager, async (req, res) => {
    try {
        const changeId = parseInt(req.params.changeId, 10);
        const { action, rejection_reason } = req.body;
        const approverEmail = req.session.user.email;
        
        if (!action || !['approve', 'reject'].includes(action)) {
            return res.status(400).json({
                success: false,
                message: '유효하지 않은 action입니다. (approve 또는 reject)',
                code: 'VALIDATION_ERROR'
            });
        }
        
        if (action === 'reject' && !rejection_reason) {
            return res.status(400).json({
                success: false,
                message: '거부 사유를 입력해주세요.',
                code: 'VALIDATION_ERROR'
            });
        }
        
        // 변경 신청 조회
        const [changeRows] = await pool.execute(`
            SELECT sc.*, u.department_id
            FROM schedule_changes sc
            INNER JOIN users u ON sc.user_id = u.email
            WHERE sc.id = ?
        `, [changeId]);
        
        if (changeRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '변경 신청을 찾을 수 없습니다.',
                code: 'NOT_FOUND'
            });
        }
        
        const changeRequest = changeRows[0];
        
        // 권한 확인 (부서장의 경우 본인 부서만)
        const userRole = req.session.user.role;
        const userDepartmentId = req.session.user.department_id;
        
        if (userRole === 'DEPT_MANAGER' && changeRequest.department_id !== userDepartmentId) {
            return res.status(403).json({
                success: false,
                message: '본인 부서의 변경 신청만 승인할 수 있습니다.',
                code: 'FORBIDDEN'
            });
        }
        
        // 상태 확인
        if (changeRequest.status !== 'PENDING') {
            return res.status(400).json({
                success: false,
                message: '이미 처리된 변경 신청입니다.',
                code: 'ALREADY_PROCESSED'
            });
        }
        
        // 승인/거부 처리
        const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';
        const approvalDate = action === 'approve' ? new Date() : null;
        
        await pool.execute(`
            UPDATE schedule_changes
            SET status = ?,
                approved_by = ?,
                approval_date = ?,
                rejection_reason = ?
            WHERE id = ?
        `, [newStatus, approverEmail, approvalDate, rejection_reason || null, changeId]);
        
        res.json({
            success: true,
            message: action === 'approve' ? '변경 신청이 승인되었습니다.' : '변경 신청이 거부되었습니다.',
            data: {
                id: changeId,
                status: newStatus,
                approved_at: approvalDate
            }
        });
        
    } catch (error) {
        console.error('승인/거부 처리 중 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 내부 오류가 발생했습니다.',
            code: 'SERVER_ERROR'
        });
    }
});

module.exports = router;


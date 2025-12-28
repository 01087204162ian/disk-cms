/**
 * ================================================================
 * 4일 근무제 시프트 로테이션 시스템 - API 라우터 routes/staff/work-schedules.js
 * ================================================================
 * 
 * 주요 기능:
 * - 사용자 4일제 설정 상태 확인
 * - 초기 휴무일 선택 저장
 * - 개인 스케줄 조회 및 관리 (4주 주기 반대 방향 순환)
 * - 반차 신청 처리 (같은 주 검증)
 * - 일시적 휴무일 변경 요청 및 승인
 * - 관리자 승인 워크플로우
 * 
 * 시프트 패턴 (고도화):
 * - 4주 주기 반대 방향 순환 (금→목→수→화→월→금...)
 * - 주 32시간 근무 원칙
 * - 주 시작일(월요일) 기준으로 계산
 * 
 * Created: 2025-09-19
 * Updated: 2025-01-XX (4주 주기 고도화)
 * Version: 2.0.0
 * ================================================================
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../../config/database');
const {
  getWeekStartDate,
  calculateOffDayByWeekCycle,
  getDayName,
  getCycleWeek,
  isProbationPeriod,
  isSameWeek,
  formatDate,
  hasHolidayInWeek,
  validateHalfDayInSameWeek,
  validateTemporaryChange,
  calculateCycleInfo
} = require('./work-schedule-helpers');

// ===========================
// 인증 미들웨어
// ===========================
const requireAuth = (req, res, next) => {
    if (!req.session?.user) {
        return res.status(401).json({
            success: false,
            message: '로그인이 필요합니다.'
        });
    }
    next();
};

// ===========================
// 헬퍼 함수들
// ===========================

/**
 * 해당 월의 실제 근무일 수 계산
 * @param {Object} schedule - work_schedules 테이블 레코드
 * @returns {number} 근무일 수
 */
const calculateWorkDaysInMonth = (schedule) => {
    const workDays = schedule.work_days;
    const year = schedule.year;
    const month = schedule.month;
    
    // 해당 월의 총 일수
    const daysInMonth = new Date(year, month, 0).getDate();
    let workDayCount = 0;
    
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month - 1, day);
        const dayOfWeek = date.getDay(); // 0=일, 1=월, 2=화, 3=수, 4=목, 5=금, 6=토
        
        // 평일(월-금)인지 확인
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            // workDays 객체의 키는 1-5 (월-금)이므로 dayOfWeek와 일치
            const workType = workDays[dayOfWeek.toString()];
            if (workType && workType !== 'off') {
                workDayCount++;
            }
        }
    }
    
    return workDayCount;
};

/**
 * 특정 월의 반차 사용 횟수 조회
 * @param {string} userEmail - 사용자 이메일
 * @param {number} year - 연도
 * @param {number} month - 월
 * @returns {number} 반차 사용 횟수
 */
const getHalfDaysUsed = async (userEmail, year, month) => {
    try {
        const [rows] = await pool.execute(`
            SELECT COUNT(*) as count 
            FROM leaves 
            WHERE user_id = ? 
              AND YEAR(start_date) = ? 
              AND MONTH(start_date) = ? 
              AND leave_type IN ('HALF_AM', 'HALF_PM') 
              AND status IN ('PENDING', 'APPROVED')
        `, [userEmail, year, month]);
        
        return rows[0].count || 0;
    } catch (error) {
        console.error('반차 사용 횟수 조회 실패:', error);
        return 0;
    }
};

/**
 * 총 근무시간 계산 (반차 적용)
 * @param {number} workDays - 근무일 수
 * @param {number} halfDaysUsed - 반차 사용 횟수
 * @returns {number} 총 근무시간
 */
const calculateTotalWorkHours = (workDays, halfDaysUsed) => {
    // 기본: 근무일 * 8시간
    // 반차 1회당 4시간 차감
    return (workDays * 8) - (halfDaysUsed * 4);
};

/**
 * 다음 달 휴무 요일 계산
 * @param {Object} currentSchedule - 현재 스케줄 정보
 * @returns {string} 다음 달 휴무 요일명
 */
const getNextMonthOffDay = (currentSchedule) => {
    const workDays = currentSchedule.work_days;
    const dayNames = {
        '1': '월요일',
        '2': '화요일', 
        '3': '수요일',
        '4': '목요일',
        '5': '금요일'
    };
    
    // 현재 휴무일 찾기
    const currentOffDay = Object.keys(workDays).find(day => workDays[day] === 'off');
    
    if (!currentOffDay) {
        return '확인 필요';
    }
    
    // 시프트 순환: 5(금) → 1(월) → 2(화) → 3(수) → 4(목) → 5(금)
    let nextOffDay;
    if (currentOffDay === '5') {
        nextOffDay = '1';
    } else {
        nextOffDay = (parseInt(currentOffDay) + 1).toString();
    }
    
    return dayNames[nextOffDay] || '확인 필요';
};

/**
 * 현재 휴무 요일명 반환
 * @param {Object} workDays - work_days JSON 객체
 * @returns {string} 휴무 요일명
 */
const getCurrentOffDayName = (workDays) => {
    const dayNames = {
        '1': '월요일',
        '2': '화요일',
        '3': '수요일', 
        '4': '목요일',
        '5': '금요일'
    };
    
    const offDay = Object.keys(workDays).find(day => workDays[day] === 'off');
    return offDay ? dayNames[offDay] : '확인 필요';
};

// ===========================
// API 엔드포인트들
// ===========================

/**
 * 내 4일제 설정 상태 및 스케줄 정보 조회
 * GET /api/staff/work-schedules/my-status
 */
router.get('/work-schedules/my-status', requireAuth, async (req, res) => {
    try {
        const userEmail = req.session.user.email;
        console.log(`사용자 상태 조회 시작: ${userEmail}`);
        
        // 1. 사용자 정보 조회 (work_days 포함)
        const [userRows] = await pool.execute(
            'SELECT work_schedule, name, hire_date, work_days FROM users WHERE email = ?',
            [userEmail]
        );
        
        if (userRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '사용자를 찾을 수 없습니다.',
                code: 'NOT_FOUND'
            });
        }
        
        const user = userRows[0];
        if (user.work_schedule !== '4_DAY') {
            return res.json({
                success: true,
                data: {
                    initial_choice_completed: false,
                    message: '4일제 대상자가 아닙니다.',
                    user: {
                        email: userEmail,
                        name: user.name,
                        work_schedule: user.work_schedule
                    }
                }
            });
        }
        
        // 2. work_days 확인 (초기 선택 여부)
        const workDays = user.work_days ? (typeof user.work_days === 'string' ? JSON.parse(user.work_days) : user.work_days) : null;
        
        if (!workDays || !workDays.base_off_day || !workDays.cycle_start_date) {
            // 초기 설정 필요
            return res.json({
                success: true,
                data: {
                    initial_choice_completed: false,
                    message: '초기 휴무일 선택이 필요합니다.',
                    user: {
                        email: userEmail,
                        name: user.name,
                        hire_date: user.hire_date,
                        work_schedule: user.work_schedule
                    }
                }
            });
        }
        
        // 3. 현재 날짜 기준으로 주기 정보 계산
        const today = new Date();
        const cycleInfo = calculateCycleInfo(workDays.cycle_start_date, today, workDays.base_off_day);
        
        // 4. 완전한 응답 반환
        res.json({
            success: true,
            data: {
                initial_choice_completed: true,
                user: {
                    email: userEmail,
                    name: user.name,
                    hire_date: user.hire_date,
                    work_schedule: user.work_schedule,
                    work_days: workDays
                },
                current_cycle: {
                    week_range: cycleInfo.weekRange,
                    off_day: cycleInfo.currentOffDay,
                    off_day_name: cycleInfo.currentOffDayName,
                    cycle_start_date: workDays.cycle_start_date,
                    next_cycle_date: cycleInfo.nextCycleDate,
                    next_off_day: cycleInfo.nextOffDay,
                    next_off_day_name: cycleInfo.nextOffDayName
                }
            }
        });
        
    } catch (error) {
        console.error('사용자 상태 확인 중 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 내부 오류가 발생했습니다.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * 반차 신청
 * POST /api/staff/work-schedules/apply-half-day
 */
router.post('/work-schedules/apply-half-day', requireAuth, async (req, res) => {
    try {
        const userEmail = req.session.user.email;
        const { half_day_date, half_day_type, is_emergency, reason } = req.body;
        
        console.log(`반차 신청 시작: ${userEmail}, ${half_day_date}, ${half_day_type}`);
        
        // 1. 입력값 검증
        if (!half_day_date || !half_day_type || !reason) {
            return res.status(400).json({
                success: false,
                message: '필수 입력값이 누락되었습니다.',
                code: 'VALIDATION_ERROR'
            });
        }
        
        if (!['HALF_AM', 'HALF_PM'].includes(half_day_type)) {
            return res.status(400).json({
                success: false,
                message: '올바르지 않은 반차 유형입니다.',
                code: 'VALIDATION_ERROR'
            });
        }
        
        // 2. 신청 날짜 검증
        const applyDate = new Date(half_day_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        applyDate.setHours(0, 0, 0, 0);
        
        if (applyDate < today) {
            return res.status(400).json({
                success: false,
                message: '과거 날짜에 대한 반차 신청은 할 수 없습니다.',
                code: 'VALIDATION_ERROR'
            });
        }
        
        // 3. 4일제 대상자 확인
        const [userRows] = await pool.execute(
            'SELECT work_schedule, department_id, hire_date, work_days FROM users WHERE email = ?',
            [userEmail]
        );
        
        if (userRows.length === 0 || userRows[0].work_schedule !== '4_DAY') {
            return res.status(400).json({
                success: false,
                message: '4일제 대상자가 아닙니다.',
                code: 'VALIDATION_ERROR'
            });
        }
        
        const user = userRows[0];
        
        // 4. 수습 기간 체크
        if (isProbationPeriod(user.hire_date, today)) {
            return res.status(400).json({
                success: false,
                message: '수습 기간 중에는 반차를 신청할 수 없습니다.',
                code: 'PROBATION_PERIOD'
            });
        }
        
        // 5. work_days 정보 확인
        const workDays = user.work_days ? (typeof user.work_days === 'string' ? JSON.parse(user.work_days) : user.work_days) : null;
        
        if (!workDays || !workDays.base_off_day || !workDays.cycle_start_date) {
            return res.status(400).json({
                success: false,
                message: '초기 휴무일 선택이 필요합니다.',
                code: 'VALIDATION_ERROR'
            });
        }
        
        // 6. 같은 주 검증
        const validation = validateHalfDayInSameWeek(
            applyDate,
            workDays.cycle_start_date,
            workDays.base_off_day
        );
        
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                message: validation.message,
                code: 'SAME_WEEK_REQUIRED'
            });
        }
        
        // 7. 공휴일 포함 주 체크
        const year = applyDate.getFullYear();
        const month = applyDate.getMonth() + 1;
        const weekStart = getWeekStartDate(applyDate);
        
        // 해당 월의 공휴일 조회
        const [holidayRows] = await pool.execute(`
            SELECT holiday_date, name FROM holidays 
            WHERE YEAR(holiday_date) = ? AND MONTH(holiday_date) = ?
        `, [year, month]);
        
        const holidays = holidayRows.map(h => ({ date: h.holiday_date, name: h.name }));
        
        if (hasHolidayInWeek(weekStart, holidays)) {
            return res.status(400).json({
                success: false,
                message: '공휴일 포함 주에는 반차를 분할할 수 없습니다.',
                code: 'HOLIDAY_WEEK'
            });
        }
        
        // 8. 중복 신청 확인
        const [duplicateRows] = await pool.execute(`
            SELECT id FROM leaves 
            WHERE user_id = ? AND start_date = ? 
            AND status IN ('PENDING', 'APPROVED')
        `, [userEmail, half_day_date]);
        
        if (duplicateRows.length > 0) {
            return res.status(400).json({
                success: false,
                message: '이미 반차가 신청된 날짜입니다.',
                code: 'DUPLICATE_REQUEST'
            });
        }
        
        // 9. 해당 날짜가 주말인지 확인
        const dayOfWeek = applyDate.getDay();
        
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            return res.status(400).json({
                success: false,
                message: '주말에는 반차 신청을 할 수 없습니다.',
                code: 'VALIDATION_ERROR'
            });
        }
        
        // 10. 승인자 결정 (부서 관리자 또는 상위 관리자)
        let approverEmail = null;
        
        // 부서 관리자 찾기
        if (user.department_id) {
            const [managerRows] = await pool.execute(`
                SELECT manager_id FROM departments 
                WHERE id = ? AND manager_id IS NOT NULL
            `, [user.department_id]);
            
            if (managerRows.length > 0) {
                approverEmail = managerRows[0].manager_id;
            }
        }
        
        // 부서 관리자가 없으면 SYSTEM_ADMIN이나 SUPER_ADMIN 찾기
        if (!approverEmail) {
            const [adminRows] = await pool.execute(`
                SELECT email FROM users 
                WHERE role IN ('SYSTEM_ADMIN', 'SUPER_ADMIN') 
                AND is_active = 1 
                ORDER BY role DESC 
                LIMIT 1
            `);
            
            if (adminRows.length > 0) {
                approverEmail = adminRows[0].email;
            }
        }
        
        // 11. leaves 테이블에 반차 신청 저장
        const [insertResult] = await pool.execute(`
            INSERT INTO leaves 
            (user_id, leave_type, start_date, end_date, days_count, reason, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            userEmail,
            half_day_type,
            half_day_date,
            half_day_date,
            0.5,
            reason,
            'PENDING'
        ]);
        
        const leaveId = insertResult.insertId;
        
        console.log(`반차 신청 완료: ID ${leaveId}, 승인자: ${approverEmail || 'NONE'}`);
        
        // 12. 응답 반환
        res.json({
            success: true,
            data: {
                message: '반차 신청이 완료되었습니다.',
                leave_id: leaveId
            }
        });
        
    } catch (error) {
        console.error('반차 신청 중 오류:', error);
        res.status(500).json({
            success: false,
            message: '반차 신청 처리 중 오류가 발생했습니다.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});
/**
 * 초기 휴무일 선택 저장
 * POST /api/staff/work-schedules/save-initial-choice
 */
router.post('/work-schedules/save-initial-choice', requireAuth, async (req, res) => {
    try {
        const userEmail = req.session.user.email;
        const { off_day, work_days } = req.body;
        
        // 입력값 검증
        if (!off_day || !work_days) {
            return res.status(400).json({
                success: false,
                message: '필수 입력값이 누락되었습니다.',
                code: 'VALIDATION_ERROR'
            });
        }
        
        if (off_day < 1 || off_day > 5) {
            return res.status(400).json({
                success: false,
                message: '올바르지 않은 휴무일입니다.',
                code: 'VALIDATION_ERROR'
            });
        }
        
        // 4일제 대상자 확인
        const [userRows] = await pool.execute(
            'SELECT work_schedule, hire_date FROM users WHERE email = ?',
            [userEmail]
        );
        
        if (userRows.length === 0 || userRows[0].work_schedule !== '4_DAY') {
            return res.status(400).json({
                success: false,
                message: '4일제 대상자가 아닙니다.',
                code: 'VALIDATION_ERROR'
            });
        }
        
        // 수습 기간 체크
        const user = userRows[0];
        if (isProbationPeriod(user.hire_date, new Date())) {
            return res.status(400).json({
                success: false,
                message: '수습 기간 중에는 4일제를 선택할 수 없습니다.',
                code: 'PROBATION_PERIOD'
            });
        }
        
        // 기존 초기 선택 확인
        const [existingRows] = await pool.execute(
            'SELECT work_days FROM users WHERE email = ? AND work_days IS NOT NULL',
            [userEmail]
        );
        
        if (existingRows.length > 0) {
            const existingWorkDays = typeof existingRows[0].work_days === 'string' 
                ? JSON.parse(existingRows[0].work_days) 
                : existingRows[0].work_days;
            
            if (existingWorkDays && existingWorkDays.base_off_day) {
                return res.status(400).json({
                    success: false,
                    message: '이미 초기 선택이 완료되었습니다.',
                    code: 'DUPLICATE_REQUEST'
                });
            }
        }
        
        // work_days 구조 생성
        const today = new Date();
        const cycleStartDate = formatDate(today);
        
        const workDaysData = {
            base_off_day: off_day,
            cycle_start_date: cycleStartDate,
            initial_selection_date: cycleStartDate
        };
        
        // users 테이블의 work_days 필드 업데이트
        await pool.execute(
            'UPDATE users SET work_days = ? WHERE email = ?',
            [JSON.stringify(workDaysData), userEmail]
        );
        
        console.log(`초기 설정 완료: ${userEmail} - 휴무일: ${off_day} (${getDayName(off_day)})`);
        
        res.json({
            success: true,
            data: {
                message: '초기 휴무일이 저장되었습니다.',
                work_days: workDaysData
            }
        });
        
    } catch (error) {
        console.error('초기 설정 저장 중 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 내부 오류가 발생했습니다.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * 내 스케줄 조회 (4주 주기 반영)
 * GET /api/staff/work-schedules/my-schedule/:year/:month
 */
router.get('/work-schedules/my-schedule/:year/:month', requireAuth, async (req, res) => {
    try {
        const userEmail = req.session.user.email;
        const year = parseInt(req.params.year);
        const month = parseInt(req.params.month);
        
        // 1. 사용자 정보 조회
        const [userRows] = await pool.execute(
            'SELECT email, name, hire_date, work_schedule, work_days FROM users WHERE email = ?',
            [userEmail]
        );
        
        if (userRows.length === 0 || userRows[0].work_schedule !== '4_DAY') {
            return res.status(404).json({
                success: false,
                message: '스케줄을 조회할 수 없습니다.',
                code: 'NOT_FOUND'
            });
        }
        
        const user = userRows[0];
        const workDays = user.work_days ? (typeof user.work_days === 'string' ? JSON.parse(user.work_days) : user.work_days) : null;
        
        if (!workDays || !workDays.base_off_day || !workDays.cycle_start_date) {
            return res.status(404).json({
                success: false,
                message: '초기 휴무일 선택이 필요합니다.',
                code: 'NOT_FOUND'
            });
        }
        
        // 2. 해당 월의 첫 날짜 기준으로 주기 정보 계산
        const monthStartDate = new Date(year, month - 1, 1);
        const cycleInfo = calculateCycleInfo(workDays.cycle_start_date, monthStartDate, workDays.base_off_day);
        
        // 3. 해당 월의 반차 목록 조회
        const [halfDayRows] = await pool.execute(`
            SELECT id, start_date, leave_type, reason, status
            FROM leaves 
            WHERE user_id = ? 
            AND YEAR(start_date) = ? 
            AND MONTH(start_date) = ? 
            AND leave_type IN ('HALF_AM', 'HALF_PM') 
            AND status IN ('PENDING', 'APPROVED')
            ORDER BY start_date ASC
        `, [userEmail, year, month]);
        
        // 4. 해당 월의 공휴일 조회
        const [holidayRows] = await pool.execute(`
            SELECT holiday_date, name FROM holidays 
            WHERE YEAR(holiday_date) = ? AND MONTH(holiday_date) = ?
            ORDER BY holiday_date ASC
        `, [year, month]);
        
        // 5. 현재 주의 공휴일 포함 여부 확인
        const today = new Date();
        const currentWeekStart = getWeekStartDate(today);
        const holidaysForCheck = holidayRows.map(h => ({ date: formatDate(h.holiday_date), name: h.name }));
        const hasHoliday = hasHolidayInWeek(currentWeekStart, holidaysForCheck);
        
        // 6. 수습 기간 여부 확인
        const isProbation = isProbationPeriod(user.hire_date, today);
        
        // 7. 해당 월의 일시적 변경 조회
        const [changeRows] = await pool.execute(`
            SELECT * FROM schedule_changes
            WHERE user_id = ? 
            AND YEAR(week_start_date) = ? 
            AND MONTH(week_start_date) = ?
            AND status = 'APPROVED'
            ORDER BY week_start_date ASC
        `, [userEmail, year, month]);
        
        // 8. 현재 월의 work_days 패턴 생성
        const workDaysPattern = {};
        for (let i = 1; i <= 5; i++) {
            workDaysPattern[i] = (i === cycleInfo.currentOffDay) ? 'off' : 'full';
        }
        
        // 9. 월별 각 날짜의 스케줄 정보 계산 (서버에서 계산하여 타임존 문제 해결)
        const daysInMonth = new Date(year, month, 0).getDate();
        const dailySchedule = [];
        const holidaysMap = new Map(holidayRows.map(h => [formatDate(h.holiday_date), h.name]));
        const halfDaysMap = new Map(halfDayRows.map(h => [h.start_date.split('T')[0], h]));
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
                    // 없으면 정상 순환 계산
                    offDay = calculateOffDayByWeekCycle(
                        workDays.cycle_start_date,
                        weekStart,
                        workDays.base_off_day
                    );
                }
                
                const isHoliday = holidaysMap.has(dateStr);
                const halfDay = halfDaysMap.get(dateStr);
                
                // 공휴일 포함 주 체크
                const weekHolidays = holidayRows
                    .filter(h => {
                        const hDate = new Date(h.holiday_date);
                        return hDate >= weekStart && hDate <= new Date(weekStart.getTime() + 4 * 24 * 60 * 60 * 1000);
                    })
                    .map(h => ({ date: formatDate(h.holiday_date), name: h.name }));
                const weekHasHoliday = hasHolidayInWeek(weekStart, weekHolidays);
                
                // 휴무일 판단: 해당 요일이 휴무일이고, 공휴일이 아니며, 공휴일 포함 주가 아닌 경우
                const isOffDay = (dayOfWeek === offDay) && !isHoliday && !weekHasHoliday;
                
                dailySchedule.push({
                    date: dateStr,
                    day_of_week: dayOfWeek,
                    off_day: offDay,
                    is_off_day: isOffDay,
                    is_holiday: isHoliday,
                    has_half_day: !!halfDay,
                    half_day_type: halfDay ? halfDay.leave_type : null
                });
            }
        }
        
        // 10. 응답 반환
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
                    week_range: cycleInfo.weekRange,
                    off_day: cycleInfo.currentOffDay,
                    off_day_name: cycleInfo.currentOffDayName,
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
                temporary_changes: changeRows.map(row => ({
                    id: row.id,
                    week_start_date: row.week_start_date,
                    original_off_day: row.original_off_day,
                    temporary_off_day: row.temporary_off_day,
                    reason: row.reason,
                    substitute_employee: row.substitute_employee
                })),
                half_day_list: halfDayRows.map(row => ({
                    id: row.id,
                    start_date: row.start_date,
                    leave_type: row.leave_type,
                    reason: row.reason
                })),
                holidays: holidayRows.map(row => ({
                    date: formatDate(row.holiday_date),
                    name: row.name
                })),
                daily_schedule: dailySchedule, // 월별 각 날짜의 스케줄 정보
                is_probation: isProbation,
                has_holiday_in_week: hasHoliday
            }
        });
        
    } catch (error) {
        console.error('스케줄 조회 중 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 내부 오류가 발생했습니다.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * 일시적 휴무일 변경 요청
 * POST /api/staff/work-schedules/temporary-change
 */
router.post('/work-schedules/temporary-change', requireAuth, async (req, res) => {
    try {
        const userEmail = req.session.user.email;
        const { week_start_date, temporary_off_day, reason, substitute_employee } = req.body;
        
        // 1. 입력값 검증
        if (!week_start_date || !temporary_off_day || !reason) {
            return res.status(400).json({
                success: false,
                message: '필수 입력값이 누락되었습니다.',
                code: 'VALIDATION_ERROR'
            });
        }
        
        if (temporary_off_day < 1 || temporary_off_day > 5) {
            return res.status(400).json({
                success: false,
                message: '올바르지 않은 휴무일입니다.',
                code: 'VALIDATION_ERROR'
            });
        }
        
        // 2. 사용자 정보 조회
        const [userRows] = await pool.execute(
            'SELECT hire_date, work_days FROM users WHERE email = ?',
            [userEmail]
        );
        
        if (userRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '사용자를 찾을 수 없습니다.',
                code: 'NOT_FOUND'
            });
        }
        
        const user = userRows[0];
        const workDays = user.work_days ? (typeof user.work_days === 'string' ? JSON.parse(user.work_days) : user.work_days) : null;
        
        if (!workDays || !workDays.base_off_day || !workDays.cycle_start_date) {
            return res.status(400).json({
                success: false,
                message: '초기 휴무일 선택이 필요합니다.',
                code: 'VALIDATION_ERROR'
            });
        }
        
        // 3. 공휴일 조회
        const weekStart = new Date(week_start_date);
        const year = weekStart.getFullYear();
        const month = weekStart.getMonth() + 1;
        
        const [holidayRows] = await pool.execute(`
            SELECT holiday_date, name FROM holidays 
            WHERE YEAR(holiday_date) = ? AND MONTH(holiday_date) = ?
        `, [year, month]);
        
        const holidays = holidayRows.map(h => ({ date: h.holiday_date, name: h.name }));
        
        // 4. 검증
        const validation = validateTemporaryChange(
            week_start_date,
            temporary_off_day,
            workDays.cycle_start_date,
            workDays.base_off_day,
            holidays,
            user.hire_date
        );
        
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                message: validation.message,
                code: validation.code || 'VALIDATION_ERROR'
            });
        }
        
        // 5. 원래 휴무일 계산
        const originalOffDay = calculateOffDayByWeekCycle(
            new Date(workDays.cycle_start_date),
            weekStart,
            workDays.base_off_day
        );
        
        // 6. 중복 요청 확인
        const [duplicateRows] = await pool.execute(`
            SELECT id FROM schedule_changes
            WHERE user_id = ? 
            AND week_start_date = ? 
            AND status = 'PENDING'
        `, [userEmail, week_start_date]);
        
        if (duplicateRows.length > 0) {
            return res.status(400).json({
                success: false,
                message: '이미 해당 주에 변경 요청이 있습니다.',
                code: 'DUPLICATE_REQUEST'
            });
        }
        
        // 7. schedule_changes 테이블에 저장
        const [insertResult] = await pool.execute(`
            INSERT INTO schedule_changes
            (user_id, week_start_date, original_off_day, temporary_off_day, reason, substitute_employee, status, requested_at)
            VALUES (?, ?, ?, ?, ?, ?, 'PENDING', NOW())
        `, [
            userEmail,
            week_start_date,
            originalOffDay,
            temporary_off_day,
            reason,
            substitute_employee || null
        ]);
        
        const changeId = insertResult.insertId;
        
        console.log(`일시적 변경 요청 완료: ID ${changeId}, 사용자: ${userEmail}`);
        
        res.json({
            success: true,
            data: {
                message: '일시적 변경 요청이 완료되었습니다.',
                change_id: changeId,
                status: 'PENDING'
            }
        });
        
    } catch (error) {
        console.error('일시적 변경 요청 중 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 내부 오류가 발생했습니다.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * 내 변경 요청 목록 조회
 * GET /api/staff/work-schedules/my-change-requests
 */
router.get('/work-schedules/my-change-requests', requireAuth, async (req, res) => {
    try {
        const userEmail = req.session.user.email;
        const { status, year, month } = req.query;
        
        let query = `
            SELECT 
                id,
                week_start_date,
                original_off_day,
                temporary_off_day,
                reason,
                substitute_employee,
                status,
                requested_at,
                approved_at,
                approved_by,
                notes
            FROM schedule_changes
            WHERE user_id = ?
        `;
        
        const params = [userEmail];
        
        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }
        
        if (year) {
            query += ' AND YEAR(week_start_date) = ?';
            params.push(year);
        }
        
        if (month) {
            query += ' AND MONTH(week_start_date) = ?';
            params.push(month);
        }
        
        query += ' ORDER BY requested_at DESC';
        
        const [rows] = await pool.execute(query, params);
        
        const dayNames = {1: '월요일', 2: '화요일', 3: '수요일', 4: '목요일', 5: '금요일'};
        
        res.json({
            success: true,
            data: rows.map(row => ({
                id: row.id,
                week_start_date: row.week_start_date,
                original_off_day: row.original_off_day,
                original_off_day_name: dayNames[row.original_off_day],
                temporary_off_day: row.temporary_off_day,
                temporary_off_day_name: dayNames[row.temporary_off_day],
                reason: row.reason,
                substitute_employee: row.substitute_employee,
                status: row.status,
                requested_at: row.requested_at,
                approved_at: row.approved_at,
                approved_by: row.approved_by,
                notes: row.notes
            }))
        });
        
    } catch (error) {
        console.error('변경 요청 목록 조회 중 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 내부 오류가 발생했습니다.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * 승인 대기 목록 조회 (팀장용)
 * GET /api/staff/work-schedules/pending-changes
 */
router.get('/work-schedules/pending-changes', requireAuth, async (req, res) => {
    try {
        const currentUser = req.session.user;
        
        // 권한 체크 (팀장 이상)
        if (!['DEPT_MANAGER', 'SYSTEM_ADMIN', 'SUPER_ADMIN'].includes(currentUser.role)) {
            return res.status(403).json({
                success: false,
                message: '권한이 없습니다.',
                code: 'FORBIDDEN'
            });
        }
        
        const { department_id, year, month } = req.query;
        
        let query = `
            SELECT 
                sc.id,
                sc.user_id as user_email,
                u.name as user_name,
                d.name as department_name,
                sc.week_start_date,
                sc.original_off_day,
                sc.temporary_off_day,
                sc.reason,
                sc.substitute_employee,
                sc.status,
                sc.requested_at
            FROM schedule_changes sc
            INNER JOIN users u ON sc.user_id = u.email
            LEFT JOIN departments d ON u.department_id = d.id
            WHERE sc.status = 'PENDING'
        `;
        
        const params = [];
        
        // 부서 필터 (부서장인 경우 자신의 부서만)
        if (currentUser.role === 'DEPT_MANAGER' && currentUser.department_id) {
            query += ' AND u.department_id = ?';
            params.push(currentUser.department_id);
        } else if (department_id) {
            query += ' AND u.department_id = ?';
            params.push(department_id);
        }
        
        if (year) {
            query += ' AND YEAR(sc.week_start_date) = ?';
            params.push(year);
        }
        
        if (month) {
            query += ' AND MONTH(sc.week_start_date) = ?';
            params.push(month);
        }
        
        query += ' ORDER BY sc.requested_at ASC';
        
        const [rows] = await pool.execute(query, params);
        
        const dayNames = {1: '월요일', 2: '화요일', 3: '수요일', 4: '목요일', 5: '금요일'};
        
        // 대체자 이름 조회
        const result = await Promise.all(rows.map(async (row) => {
            let substituteEmployeeName = null;
            if (row.substitute_employee) {
                const [subRows] = await pool.execute(
                    'SELECT name FROM users WHERE email = ?',
                    [row.substitute_employee]
                );
                if (subRows.length > 0) {
                    substituteEmployeeName = subRows[0].name;
                }
            }
            
            return {
                id: row.id,
                user_email: row.user_email,
                user_name: row.user_name,
                department_name: row.department_name,
                week_start_date: row.week_start_date,
                original_off_day: row.original_off_day,
                original_off_day_name: dayNames[row.original_off_day],
                temporary_off_day: row.temporary_off_day,
                temporary_off_day_name: dayNames[row.temporary_off_day],
                reason: row.reason,
                substitute_employee: row.substitute_employee,
                substitute_employee_name: substituteEmployeeName,
                status: row.status,
                requested_at: row.requested_at
            };
        }));
        
        res.json({
            success: true,
            data: result
        });
        
    } catch (error) {
        console.error('승인 대기 목록 조회 중 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 내부 오류가 발생했습니다.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * 변경 요청 승인/거부
 * POST /api/staff/work-schedules/approve-change/:changeId
 */
router.post('/work-schedules/approve-change/:changeId', requireAuth, async (req, res) => {
    try {
        const currentUser = req.session.user;
        const changeId = parseInt(req.params.changeId);
        const { action, notes } = req.body;
        
        // 1. 권한 체크
        if (!['DEPT_MANAGER', 'SYSTEM_ADMIN', 'SUPER_ADMIN'].includes(currentUser.role)) {
            return res.status(403).json({
                success: false,
                message: '권한이 없습니다.',
                code: 'FORBIDDEN'
            });
        }
        
        // 2. 입력값 검증
        if (!action || !['approve', 'reject'].includes(action)) {
            return res.status(400).json({
                success: false,
                message: '올바르지 않은 동작입니다.',
                code: 'VALIDATION_ERROR'
            });
        }
        
        // 3. 변경 요청 조회
        const [changeRows] = await pool.execute(`
            SELECT * FROM schedule_changes WHERE id = ?
        `, [changeId]);
        
        if (changeRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '변경 요청을 찾을 수 없습니다.',
                code: 'NOT_FOUND'
            });
        }
        
        const changeRequest = changeRows[0];
        
        // 4. 이미 처리된 요청인지 확인
        if (changeRequest.status !== 'PENDING') {
            return res.status(400).json({
                success: false,
                message: '이미 처리된 요청입니다.',
                code: 'DUPLICATE_REQUEST'
            });
        }
        
        // 5. 부서장인 경우 자신의 부서인지 확인
        if (currentUser.role === 'DEPT_MANAGER') {
            const [userRows] = await pool.execute(
                'SELECT department_id FROM users WHERE email = ?',
                [changeRequest.user_id]
            );
            
            if (userRows.length === 0 || userRows[0].department_id !== currentUser.department_id) {
                return res.status(403).json({
                    success: false,
                    message: '권한이 없습니다.',
                    code: 'FORBIDDEN'
                });
            }
        }
        
        // 6. 승인/거부 처리
        const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';
        
        await pool.execute(`
            UPDATE schedule_changes
            SET status = ?,
                approved_at = NOW(),
                approved_by = ?,
                notes = ?
            WHERE id = ?
        `, [newStatus, currentUser.email, notes || null, changeId]);
        
        // 7. 승인인 경우 work_schedules 테이블 업데이트
        if (action === 'approve') {
            const weekStart = new Date(changeRequest.week_start_date);
            const year = weekStart.getFullYear();
            const month = weekStart.getMonth() + 1;
            
            // 해당 월의 스케줄 조회
            const [scheduleRows] = await pool.execute(`
                SELECT id, temporary_change FROM work_schedules
                WHERE user_id = ? AND year = ? AND month = ?
            `, [changeRequest.user_id, year, month]);
            
            if (scheduleRows.length > 0) {
                // temporary_change 필드 업데이트
                const tempChange = {
                    week_start_date: changeRequest.week_start_date,
                    original_off_day: changeRequest.original_off_day,
                    temporary_off_day: changeRequest.temporary_off_day,
                    changed_by: changeRequest.user_id,
                    approved_by: currentUser.email,
                    approval_date: formatDate(new Date()),
                    reason: changeRequest.reason,
                    substitute_employee: changeRequest.substitute_employee
                };
                
                await pool.execute(`
                    UPDATE work_schedules
                    SET temporary_change = ?
                    WHERE id = ?
                `, [JSON.stringify(tempChange), scheduleRows[0].id]);
            }
        }
        
        console.log(`변경 요청 ${action} 완료: ID ${changeId}, 처리자: ${currentUser.email}`);
        
        res.json({
            success: true,
            data: {
                message: `변경 요청이 ${action === 'approve' ? '승인' : '거부'}되었습니다.`,
                change_id: changeId,
                status: newStatus
            }
        });
        
    } catch (error) {
        console.error('변경 요청 승인/거부 중 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 내부 오류가 발생했습니다.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * 휴무일 계산
 * GET /api/staff/work-schedules/calculate-off-day
 */
router.get('/work-schedules/calculate-off-day', requireAuth, async (req, res) => {
    try {
        const userEmail = req.session.user.email;
        const { date } = req.query;
        
        if (!date) {
            return res.status(400).json({
                success: false,
                message: '날짜가 필요합니다.',
                code: 'VALIDATION_ERROR'
            });
        }
        
        // 1. 사용자 정보 조회
        const [userRows] = await pool.execute(
            'SELECT work_days FROM users WHERE email = ?',
            [userEmail]
        );
        
        if (userRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '사용자를 찾을 수 없습니다.',
                code: 'NOT_FOUND'
            });
        }
        
        const workDays = userRows[0].work_days ? 
            (typeof userRows[0].work_days === 'string' ? JSON.parse(userRows[0].work_days) : userRows[0].work_days) : null;
        
        if (!workDays || !workDays.base_off_day || !workDays.cycle_start_date) {
            return res.status(400).json({
                success: false,
                message: '초기 휴무일 선택이 필요합니다.',
                code: 'VALIDATION_ERROR'
            });
        }
        
        // 2. 휴무일 계산
        const targetDate = new Date(date);
        const offDay = calculateOffDayByWeekCycle(
            new Date(workDays.cycle_start_date),
            targetDate,
            workDays.base_off_day
        );
        
        const cycleWeek = getCycleWeek(new Date(workDays.cycle_start_date), targetDate);
        
        // 다음 주기 시작일 계산
        const cycleStart = new Date(workDays.cycle_start_date);
        const nextCycleStart = new Date(cycleStart);
        nextCycleStart.setDate(nextCycleStart.getDate() + 28);
        
        res.json({
            success: true,
            data: {
                target_date: formatDate(targetDate),
                off_day: offDay,
                off_day_name: getDayName(offDay),
                cycle_week: cycleWeek,
                cycle_start_date: workDays.cycle_start_date,
                next_cycle_date: formatDate(nextCycleStart)
            }
        });
        
    } catch (error) {
        console.error('휴무일 계산 중 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 내부 오류가 발생했습니다.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;
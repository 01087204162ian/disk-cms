/**
 * ================================================================
 * 4일 근무제 시프트 로테이션 시스템 - API 라우터 routes/staff/work-schedules.js
 * ================================================================
 * 
 * 주요 기능:
 * - 사용자 4일제 설정 상태 확인
 * - 개인 스케줄 조회 및 관리
 * - 반차 신청 처리
 * - 관리자 승인 워크플로우
 * 
 * 시프트 패턴:
 * - 5개월 순환 (금→월→화→수→목→금...)
 * - 주 32시간 근무 원칙
 * - 매월 첫 번째 월요일부터 새 패턴 적용
 * 
 * Created: 2025-09-19
 * Version: 1.0.0
 * ================================================================
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../../config/database');

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
        
        // 1. 4일제 대상자 확인
        const [userRows] = await pool.execute(
            'SELECT work_schedule, name FROM users WHERE email = ?',
            [userEmail]
        );
        
        if (userRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '사용자를 찾을 수 없습니다.'
            });
        }
        
        const user = userRows[0];
        if (user.work_schedule !== '4_DAY') {
            return res.json({
                success: true,
                data: {
                    initial_choice_completed: false,
                    message: '4일제 대상자가 아닙니다.',
                    user_info: {
                        email: userEmail,
                        name: user.name,
                        work_schedule: user.work_schedule
                    }
                }
            });
        }
        
        // 2. 최근 스케줄 정보 조회
        const [scheduleRows] = await pool.execute(`
            SELECT * FROM work_schedules 
            WHERE user_id = ? 
            ORDER BY year DESC, month DESC 
            LIMIT 1
        `, [userEmail]);
        
        if (scheduleRows.length === 0) {
            // 초기 설정 필요
            return res.json({
                success: true,
                data: {
                    initial_choice_completed: false,
                    message: '초기 휴무일 선택이 필요합니다.',
                    user_info: {
                        email: userEmail,
                        name: user.name,
                        needs_initial_setup: true
                    }
                }
            });
        }
        
        // 3. 스케줄 정보가 있는 경우 - 상세 정보 계산
        const schedule = scheduleRows[0];
        console.log(`스케줄 정보 발견: ${schedule.year}-${schedule.month}`);
        
        // 각종 계산 수행
        const workDaysCount = calculateWorkDaysInMonth(schedule);
        const halfDaysUsed = await getHalfDaysUsed(userEmail, schedule.year, schedule.month);
        const totalWorkHours = calculateTotalWorkHours(workDaysCount, halfDaysUsed);
        const nextMonthOffDay = getNextMonthOffDay(schedule);
        const currentOffDay = getCurrentOffDayName(schedule.work_days);
        
        console.log(`계산 결과 - 근무일: ${workDaysCount}, 반차: ${halfDaysUsed}, 총시간: ${totalWorkHours}`);
        const [halfDayRows] = await pool.execute(`
			SELECT DATE_FORMAT(start_date, '%Y-%m-%d') as start_date, leave_type, status 
			FROM leaves 
			WHERE user_id = ? AND YEAR(start_date) = ? AND MONTH(start_date) = ? 
			AND leave_type IN ('HALF_AM', 'HALF_PM') 
			AND status IN ('PENDING', 'APPROVED')
		`, [userEmail, schedule.year, schedule.month]);
        // 4. 완전한 응답 반환
        res.json({
            success: true,
            data: {
                initial_choice_completed: true,
                user_info: {
                    email: userEmail,
                    name: user.name,
                    latest_schedule: {
                        ...schedule,
                        // 계산된 추가 정보들
                        calculated_work_days: workDaysCount,
                        half_days_used: halfDaysUsed,
                        total_work_hours: totalWorkHours,
                        current_off_day_name: currentOffDay,
                        next_month_off_day: nextMonthOffDay,
                        // 상태 정보
                        is_current_month: schedule.year === new Date().getFullYear() && 
                                        schedule.month === (new Date().getMonth() + 1),
						half_day_list: halfDayRows
                    }
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
                message: '필수 입력값이 누락되었습니다.'
            });
        }
        
        if (!['HALF_AM', 'HALF_PM'].includes(half_day_type)) {
            return res.status(400).json({
                success: false,
                message: '올바르지 않은 반차 유형입니다.'
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
                message: '과거 날짜에 대한 반차 신청은 할 수 없습니다.'
            });
        }
        
        // 3. 4일제 대상자 확인
        const [userRows] = await pool.execute(
            'SELECT work_schedule, department_id FROM users WHERE email = ?',
            [userEmail]
        );
        
        if (userRows.length === 0 || userRows[0].work_schedule !== '4_DAY') {
            return res.status(400).json({
                success: false,
                message: '4일제 대상자가 아닙니다.'
            });
        }
        
        // 4. 중복 신청 확인
        const [duplicateRows] = await pool.execute(`
            SELECT id FROM leaves 
            WHERE user_id = ? AND start_date = ? 
            AND status IN ('PENDING', 'APPROVED')
        `, [userEmail, half_day_date]);
        
        if (duplicateRows.length > 0) {
            return res.status(400).json({
                success: false,
                message: '해당 날짜에 이미 휴가/반차 신청이 있습니다.'
            });
        }
        
        // 5. 해당 날짜가 원래 근무일인지 확인
        const dayOfWeek = applyDate.getDay(); // 0=일, 1=월, 2=화, 3=수, 4=목, 5=금, 6=토
		
		// 디버깅용 로그 추가
		console.log('신청 날짜:', half_day_date);
		console.log('Date 객체:', applyDate);
		console.log('요일 (0=일):', dayOfWeek);
        
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            return res.status(400).json({
                success: false,
                message: '주말에는 반차 신청을 할 수 없습니다.'
            });
        }
        
        // 6. 해당 월의 스케줄 확인 (휴무일인지 체크)
        const year = applyDate.getFullYear();
        const month = applyDate.getMonth() + 1;
        
        const [scheduleRows] = await pool.execute(`
            SELECT work_days FROM work_schedules 
            WHERE user_id = ? AND year = ? AND month = ? 
            AND status = 'APPROVED'
        `, [userEmail, year, month]);
        
        if (scheduleRows.length > 0) {
            const workDays = scheduleRows[0].work_days;
            if (workDays[dayOfWeek.toString()] === 'off') {
                return res.status(400).json({
                    success: false,
                    message: '해당 날짜는 원래 휴무일입니다.'
                });
            }
        }
        
        // 7. 승인자 결정 (부서 관리자 또는 상위 관리자)
        let approverEmail = null;
        
        // 부서 관리자 찾기
        if (userRows[0].department_id) {
            const [managerRows] = await pool.execute(`
                SELECT manager_id FROM departments 
                WHERE id = ? AND manager_id IS NOT NULL
            `, [userRows[0].department_id]);
            
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
        
        // 8. leaves 테이블에 반차 신청 저장
        // 수정된 코드
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
        // 9. 해당 주의 휴무일 조정 (새로 추가할 부분)
		//const year = applyDate.getFullYear();
		//const month = applyDate.getMonth() + 1;

		console.log(`반차 신청 후 휴무일 조정 시작: ${year}-${month}`);
		
		// 해당 월의 스케줄 조회
		const [currentScheduleRows] = await pool.execute(`
			SELECT id, work_days FROM work_schedules 
			WHERE user_id = ? AND year = ? AND month = ? 
			AND status = 'APPROVED'
		`, [userEmail, year, month]);

		console.log('현재 스케줄 조회 결과:', currentScheduleRows.length);

		if (currentScheduleRows.length > 0) {
			const currentSchedule = currentScheduleRows[0];
			console.log('기존 work_days:', currentSchedule.work_days);
		}
        // 10. 응답 반환
        res.json({
            success: true,
            message: '반차 신청이 완료되었습니다. 승인을 기다려주세요.',
            data: {
                leave_id: leaveId,
                half_day_date,
                half_day_type,
                is_emergency: !!is_emergency,
                reason,
                approver: approverEmail,
                status: 'PENDING'
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
        const { year, month, work_days, initial_setup } = req.body;
        
        // 입력값 검증
        if (!year || !month || !work_days) {
            return res.status(400).json({
                success: false,
                message: '필수 입력값이 누락되었습니다.'
            });
        }
        
        // 4일제 대상자 확인
        const [userRows] = await pool.execute(
            'SELECT work_schedule FROM users WHERE email = ?',
            [userEmail]
        );
        
        if (userRows.length === 0 || userRows[0].work_schedule !== '4_DAY') {
            return res.status(400).json({
                success: false,
                message: '4일제 대상자가 아닙니다.'
            });
        }
        
        // 기존 데이터 확인
        const [existingRows] = await pool.execute(
            'SELECT id FROM work_schedules WHERE user_id = ? AND year = ? AND month = ?',
            [userEmail, year, month]
        );
        
        if (existingRows.length > 0) {
            return res.status(400).json({
                success: false,
                message: '해당 월의 스케줄이 이미 존재합니다.'
            });
        }
        

        // 새로운 스케줄 저장 (수정)
		await pool.execute(`
			INSERT INTO work_schedules 
			(user_id, year, month, work_days, status, approved_by, approved_at, is_shift_month, created_at) 
			VALUES (?, ?, ?, ?, 'APPROVED', NULL, NOW(), 1, NOW())
		`, [userEmail, year, month, JSON.stringify(work_days)]);
        
        console.log(`초기 설정 완료: ${userEmail} - ${year}/${month}`);
        
        res.json({
            success: true,
            message: '초기 설정이 완료되었습니다.',
            data: {
                user_email: userEmail,
                year,
                month,
                work_days
            }
        });
        
    } catch (error) {
        console.error('초기 설정 저장 중 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 내부 오류가 발생했습니다.'
        });
    }
});
module.exports = router;
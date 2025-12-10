// ==============================
// routes/attendance.js - 출퇴근 라우트
// ==============================
const express = require('express');
const router = express.Router();
const AttendanceService = require('../services/attendanceService');
const { requireAuth } = require('../middleware/auth');

// 출근 처리
router.post('/checkin', requireAuth, async (req, res) => {
    try {
        const userId = req.session.user.email;
        
        console.log(`출근 요청 - 사용자: ${userId}`);
        
        const result = await AttendanceService.checkIn(userId);
        
        if (result.success) {
            console.log(`출근 성공 - 사용자: ${userId}, 시간: ${result.data.checkInTime}`);
        } else {
            console.log(`출근 실패 - 사용자: ${userId}, 사유: ${result.message}`);
        }
        
        res.json(result);

    } catch (error) {
        console.error('출근 처리 API 오류:', error);
        res.status(500).json({
            success: false,
            message: '출근 처리 중 오류가 발생했습니다.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// 퇴근 처리
router.post('/checkout', requireAuth, async (req, res) => {
    try {
        const userId = req.session.user.email;
        
        console.log(`퇴근 요청 - 사용자: ${userId}`);
        
        const result = await AttendanceService.checkOut(userId);
        
        if (result.success) {
            console.log(`퇴근 성공 - 사용자: ${userId}, 시간: ${result.data.checkOutTime}, 근무시간: ${result.data.workHours}h`);
        } else {
            console.log(`퇴근 실패 - 사용자: ${userId}, 사유: ${result.message}`);
        }
        
        res.json(result);

    } catch (error) {
        console.error('퇴근 처리 API 오류:', error);
        res.status(500).json({
            success: false,
            message: '퇴근 처리 중 오류가 발생했습니다.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// 오늘 출퇴근 상태 조회
router.get('/today', requireAuth, async (req, res) => {
    try {
        const userId = req.session.user.email;
        
        const attendance = await AttendanceService.getTodayAttendance(userId);
        
        res.json({
            success: true,
            data: attendance
        });

    } catch (error) {
        console.error('오늘 출퇴근 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '출퇴근 정보를 조회하는 중 오류가 발생했습니다.'
        });
    }
});

// 월별 출근 통계 조회
router.get('/stats/monthly', requireAuth, async (req, res) => {
    try {
        const userId = req.session.user.email;
        const year = parseInt(req.query.year) || new Date().getFullYear();
        const month = parseInt(req.query.month) || new Date().getMonth() + 1;
        
        const stats = await AttendanceService.getMonthlyAttendanceStats(userId, year, month);
        
        res.json({
            success: true,
            data: {
                year,
                month,
                ...stats
            }
        });

    } catch (error) {
        console.error('월별 출근 통계 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '월별 출근 통계를 조회하는 중 오류가 발생했습니다.'
        });
    }
});

// 주간 출근 기록 조회
router.get('/weekly', requireAuth, async (req, res) => {
    try {
        const userId = req.session.user.email;
        
        // 기본값: 이번 주 (월요일~일요일)
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay() + 1); // 월요일
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6); // 일요일
        
        const startDate = req.query.startDate || startOfWeek.toISOString().split('T')[0];
        const endDate = req.query.endDate || endOfWeek.toISOString().split('T')[0];
        
        const weeklyData = await AttendanceService.getWeeklyAttendance(userId, startDate, endDate);
        
        res.json({
            success: true,
            data: {
                startDate,
                endDate,
                records: weeklyData
            }
        });

    } catch (error) {
        console.error('주간 출근 기록 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '주간 출근 기록을 조회하는 중 오류가 발생했습니다.'
        });
    }
});

// 출근 기록 수정 (관리자용)
router.put('/:attendanceId', requireAuth, async (req, res) => {
    try {
        const userRole = req.session.user.role;
        
        // 관리자 권한 확인
        if (!['SUPER_ADMIN', 'SYSTEM_ADMIN', 'DEPT_MANAGER'].includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: '관리자 권한이 필요합니다.'
            });
        }

        const attendanceId = req.params.attendanceId;
        const updateData = req.body;
        
        const result = await AttendanceService.updateAttendance(attendanceId, updateData);
        
        console.log(`출근 기록 수정 - 관리자: ${req.session.user.email}, 대상 ID: ${attendanceId}`);
        
        res.json(result);

    } catch (error) {
        console.error('출근 기록 수정 오류:', error);
        res.status(500).json({
            success: false,
            message: '출근 기록 수정 중 오류가 발생했습니다.'
        });
    }
});

// 출근 상태 일괄 조회 (관리자용)
router.get('/admin/today', requireAuth, async (req, res) => {
    try {
        const userRole = req.session.user.role;
        
        // 관리자 권한 확인
        if (!['SUPER_ADMIN', 'SYSTEM_ADMIN', 'DEPT_MANAGER'].includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: '관리자 권한이 필요합니다.'
            });
        }

        // 오늘 전체 직원 출근 현황 조회
        const today = new Date().toISOString().split('T')[0];
        
        let query = `
            SELECT 
                u.email,
                u.name,
                u.department_id,
                a.check_in_time,
                a.check_out_time,
                a.work_hours,
                a.status,
                DATE_FORMAT(a.check_in_time, '%H:%i') as formatted_check_in,
                DATE_FORMAT(a.check_out_time, '%H:%i') as formatted_check_out
            FROM users u
            LEFT JOIN attendance a ON u.email = a.user_id AND a.work_date = ?
            WHERE u.is_active = 1
        `;
        
        let params = [today];
        
        // 부서 관리자는 자신의 부서만
        if (userRole === 'DEPT_MANAGER') {
            query += ' AND u.department_id = ?';
            params.push(req.session.user.department_id);
        }
        
        query += ' ORDER BY u.name';
        
        const { pool } = require('../config/database');
        const [result] = await pool.execute(query, params);
        
        res.json({
            success: true,
            data: {
                date: today,
                employees: result
            }
        });

    } catch (error) {
        console.error('관리자 출근 현황 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '출근 현황을 조회하는 중 오류가 발생했습니다.'
        });
    }
});

// API 상태 확인 (개발용)
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Attendance API is running',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
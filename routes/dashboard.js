// ==============================
// routes/dashboard.js - 대시보드 라우트
// ==============================
const express = require('express');
const router = express.Router();
const DashboardService = require('../services/dashboardService');

// 인증 미들웨어 (auth.js에서 가져온다고 가정)
const { requireAuth } = require('../middleware/auth');

// 메인 대시보드 데이터 조회
router.get('/', requireAuth, async (req, res) => {
    try {
        const userId = req.session.user.email; // users 테이블의 PK가 email
        const userRole = req.session.user.role;
        const userInfo = req.session.user;

        console.log(`대시보드 데이터 요청 - 사용자: ${userId}, 권한: ${userRole}`);

        // 대시보드 데이터 조회
        const dashboardData = await DashboardService.getDashboardData(userId, userRole, userInfo);

        res.json({
            success: true,
            data: dashboardData
        });

    } catch (error) {
        console.error('대시보드 데이터 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '대시보드 데이터를 불러오는 중 오류가 발생했습니다.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// 개인 통계만 조회
router.get('/stats/personal', requireAuth, async (req, res) => {
    try {
        const userId = req.session.user.email;
        
        const personalStats = await DashboardService.getPersonalStats(userId);
        
        res.json({
            success: true,
            data: personalStats
        });

    } catch (error) {
        console.error('개인 통계 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '개인 통계를 불러오는 중 오류가 발생했습니다.'
        });
    }
});

// 관리자 통계 조회 (관리자만)
router.get('/stats/admin', requireAuth, async (req, res) => {
    try {
        const userRole = req.session.user.role;
        const departmentId = req.session.user.department_id;
        
        // 관리자 권한 확인
        if (!['SUPER_ADMIN', 'SYSTEM_ADMIN', 'DEPT_MANAGER'].includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: '관리자 권한이 필요합니다.'
            });
        }

        const adminStats = await DashboardService.getAdminStats(userRole, departmentId);
        
        res.json({
            success: true,
            data: adminStats
        });

    } catch (error) {
        console.error('관리자 통계 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '관리자 통계를 불러오는 중 오류가 발생했습니다.'
        });
    }
});

// 최근 활동 조회
router.get('/activities/recent', requireAuth, async (req, res) => {
    try {
        const userId = req.session.user.email;
        const limit = parseInt(req.query.limit) || 5;
        
        const activities = await DashboardService.getRecentActivities(userId, limit);
        
        res.json({
            success: true,
            data: activities
        });

    } catch (error) {
        console.error('최근 활동 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '최근 활동을 불러오는 중 오류가 발생했습니다.'
        });
    }
});

// 공지사항 조회
router.get('/announcements', requireAuth, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 3;
        
        const announcements = await DashboardService.getAnnouncements(limit);
        
        res.json({
            success: true,
            data: announcements
        });

    } catch (error) {
        console.error('공지사항 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '공지사항을 불러오는 중 오류가 발생했습니다.'
        });
    }
});

// 알림 개수 조회
router.get('/notifications/count', requireAuth, async (req, res) => {
    try {
        const userId = req.session.user.email;
        
        const count = await DashboardService.getNotificationCount(userId);
        
        res.json({
            success: true,
            data: { count }
        });

    } catch (error) {
        console.error('알림 개수 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '알림 개수를 불러오는 중 오류가 발생했습니다.'
        });
    }
});

// 최근 알림 목록 조회
router.get('/notifications/recent', requireAuth, async (req, res) => {
    try {
        const userId = req.session.user.email;
        const limit = parseInt(req.query.limit) || 5;
        
        const notifications = await DashboardService.getRecentNotifications(userId, limit);
        
        res.json({
            success: true,
            data: notifications
        });

    } catch (error) {
        console.error('최근 알림 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '최근 알림을 불러오는 중 오류가 발생했습니다.'
        });
    }
});

// 오늘 출퇴근 정보만 조회
router.get('/attendance/today', requireAuth, async (req, res) => {
    try {
        const userId = req.session.user.email;
        
        const todayAttendance = await DashboardService.getTodayAttendance(userId);
        
        res.json({
            success: true,
            data: todayAttendance
        });

    } catch (error) {
        console.error('오늘 출퇴근 정보 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '출퇴근 정보를 불러오는 중 오류가 발생했습니다.'
        });
    }
});

// 대시보드 데이터 새로고침
router.post('/refresh', requireAuth, async (req, res) => {
    try {
        const userId = req.session.user.email;
        const userRole = req.session.user.role;
        const userInfo = req.session.user;

        // 캐시된 데이터가 있다면 삭제하고 새로 조회
        const dashboardData = await DashboardService.getDashboardData(userId, userRole, userInfo);

        res.json({
            success: true,
            data: dashboardData,
            message: '대시보드 데이터가 새로고침되었습니다.'
        });

    } catch (error) {
        console.error('대시보드 새로고침 오류:', error);
        res.status(500).json({
            success: false,
            message: '대시보드 새로고침 중 오류가 발생했습니다.'
        });
    }
});

// 헬스체크 (개발용)
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Dashboard API is running',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
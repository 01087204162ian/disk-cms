// ==============================
// routes/users.js - 사용자 관리 라우트 (수정된 버전)
// ==============================
const express = require('express');
const router = express.Router();
const UserService = require('../services/userService');
const { requireAuth, requireRole } = require('../middleware/auth');

// 현재 사용자 정보 API
router.get('/me', requireAuth, (req, res) => {
    res.json({
        success: true,
        user: req.session.user
    });
});

// 부서 목록 API
router.get('/departments', requireAuth, async (req, res) => {
    try {
        const departments = await UserService.getDepartments();
        res.json({
            success: true,
            data: departments
        });
    } catch (error) {
        console.error('부서 목록 조회 오류:', error);
        res.status(500).json({ 
            success: false, 
            message: '부서 목록을 불러올 수 없습니다.' 
        });
    }
});

// 사용자 목록 API (관리자만) - 검색 및 필터링 지원
router.get('/', requireRole(['SUPER_ADMIN', 'SYSTEM_ADMIN', 'DEPT_MANAGER']), async (req, res) => {
    try {
        console.log('사용자 목록 요청 파라미터:', req.query);
        
        // 쿼리 파라미터 정제 및 기본값 설정
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 10));
        
        // 빈 문자열을 null로 변환하여 필터링 로직이 올바르게 작동하도록 함
        const search = req.query.search && req.query.search.trim() ? req.query.search.trim() : null;
        const department = req.query.department && req.query.department.trim() ? req.query.department.trim() : null;
        const role = req.query.role && req.query.role.trim() ? req.query.role.trim() : null;
        const status = req.query.status && req.query.status.trim() ? req.query.status.trim() : 'active';

        console.log('정제된 파라미터:', {
            page,
            limit,
            search,
            department,
            role,
            status,
            currentUser: req.session.user.email
        });

        const result = await UserService.getUsersWithSearch({ 
            page,
            limit,
            search,
            department,
            role,
            status,
            currentUser: req.session.user
        });

        console.log('조회 결과:', {
            userCount: result.users.length,
            totalCount: result.totalCount,
            totalPages: result.totalPages
        });

        res.json({
            success: true,
            data: {
                users: result.users,
                totalCount: result.totalCount,
                totalPages: result.totalPages,
                currentPage: page
            }
        });
    } catch (error) {
        console.error('사용자 목록 조회 오류:', error);
        res.status(500).json({ 
            success: false, 
            message: '사용자 목록을 불러올 수 없습니다.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// 디버깅용 간단한 테스트 엔드포인트
router.get('/test/simple', requireAuth, async (req, res) => {
    try {
        console.log('=== 간단한 테스트 시작 ===');
        
        // 가장 기본적인 쿼리 테스트
        const result = await UserService.getUsersWithSearch({
            page: 1,
            limit: 5,
            search: null,
            department: null,
            role: null,
            status: 'active',
            currentUser: req.session.user
        });
        
        console.log('테스트 성공:', result);
        
        res.json({
            success: true,
            message: '테스트 성공',
            data: result
        });
    } catch (error) {
        console.error('테스트 실패:', error);
        res.status(500).json({
            success: false,
            message: '테스트 실패',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// 특정 사용자 정보 조회 API - email로 조회
router.get('/:email', requireRole(['SUPER_ADMIN', 'SYSTEM_ADMIN', 'DEPT_MANAGER']), async (req, res) => {
    try {
        const email = decodeURIComponent(req.params.email);
        const user = await UserService.getUserByEmail(email);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '사용자를 찾을 수 없습니다.'
            });
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('사용자 정보 조회 오류:', error);
        res.status(500).json({ 
            success: false, 
            message: '사용자 정보를 불러올 수 없습니다.' 
        });
    }
});

// 새 사용자 생성 API
router.post('/', requireRole(['SUPER_ADMIN', 'SYSTEM_ADMIN']), async (req, res) => {
    try {
        const userData = req.body;
        const newUser = await UserService.createUser(userData);
        
        res.status(201).json({
            success: true,
            message: '사용자가 생성되었습니다.',
            data: newUser
        });
    } catch (error) {
        console.error('사용자 생성 오류:', error);
        res.status(400).json({ 
            success: false, 
            message: error.message || '사용자 생성 중 오류가 발생했습니다.' 
        });
    }
});

// 사용자 정보 수정 API - email로 수정
router.put('/:email', requireRole(['SUPER_ADMIN', 'SYSTEM_ADMIN']), async (req, res) => {
    try {
        const email = decodeURIComponent(req.params.email);
        const updateData = req.body;
        
        await UserService.updateUserByEmail(email, updateData);
        
        res.json({
            success: true,
            message: '사용자 정보가 수정되었습니다.'
        });
    } catch (error) {
        console.error('사용자 정보 수정 오류:', error);
        res.status(400).json({ 
            success: false, 
            message: error.message || '사용자 정보 수정 중 오류가 발생했습니다.' 
        });
    }
});

// 사용자 비활성화/삭제 API - email로 처리
router.delete('/:email', requireRole(['SUPER_ADMIN', 'SYSTEM_ADMIN']), async (req, res) => {
    try {
        const email = decodeURIComponent(req.params.email);
        await UserService.deactivateUserByEmail(email);
        
        res.json({
            success: true,
            message: '사용자가 비활성화되었습니다.'
        });
    } catch (error) {
        console.error('사용자 비활성화 오류:', error);
        res.status(400).json({ 
            success: false, 
            message: error.message || '사용자 비활성화 중 오류가 발생했습니다.' 
        });
    }
});

module.exports = router;
// routes/departments.js
const express = require('express');
const router = express.Router();
const UserService = require('../services/userService');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, async (req, res) => {
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

module.exports = router;
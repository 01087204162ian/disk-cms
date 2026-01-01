// ==============================
// routes/approvals.js - 승인 관리 라우터
// ==============================

const express = require('express');
const { pool } = require('../config/database');
const TicketService = require('../services/ticketService');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// 모든 라우트에 인증 필요
router.use(requireAuth);

/**
 * PATCH /approvals/:instance_id - 승인/거부 처리
 */
router.patch('/:instance_id', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const instanceId = parseInt(req.params.instance_id);
        const action = req.body.action; // 'APPROVE' or 'REJECT'
        const comment = req.body.comment || null;
        const userId = req.session.user.email;

        // 승인 인스턴스 조회
        const [instances] = await connection.execute(
            `SELECT 
                tai.*,
                t.id as ticket_id,
                t.ticket_number,
                t.status as ticket_status
            FROM ticket_approval_instances tai
            JOIN tickets t ON tai.ticket_id = t.id
            WHERE tai.id = ?`,
            [instanceId]
        );

        if (instances.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: '승인 인스턴스를 찾을 수 없습니다.'
            });
        }

        const instance = instances[0];

        // 승인자 확인
        if (instance.approver_id !== userId) {
            await connection.rollback();
            return res.status(403).json({
                success: false,
                message: '본인의 승인만 처리할 수 있습니다.'
            });
        }

        // 이미 처리된 경우
        if (instance.status !== 'PENDING') {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: '이미 처리된 승인입니다.'
            });
        }

        // 승인/거부 처리
        const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
        await connection.execute(
            `UPDATE ticket_approval_instances
            SET status = ?, comment = ?, approved_at = ?
            WHERE id = ?`,
            [newStatus, comment, new Date(), instanceId]
        );

        // Activity Log 기록
        await TicketService.logActivity(connection, {
            ticket_id: instance.ticket_id,
            activity_type: action === 'APPROVE' ? 'APPROVAL' : 'REJECTION',
            user_id: userId,
            description: `승인 ${action === 'APPROVE' ? '승인' : '거부'}: ${instance.approver_role}`,
            new_value: newStatus
        });

        await connection.commit();

        // 업데이트된 인스턴스 조회
        const [updated] = await connection.execute(
            `SELECT tai.*, u.name as approver_name
            FROM ticket_approval_instances tai
            LEFT JOIN users u ON tai.approver_id = u.email
            WHERE tai.id = ?`,
            [instanceId]
        );

        res.json({
            success: true,
            data: updated[0]
        });
    } catch (error) {
        await connection.rollback();
        console.error('승인 처리 오류:', error);
        res.status(500).json({
            success: false,
            message: '승인 처리 중 오류가 발생했습니다.'
        });
    } finally {
        connection.release();
    }
});

/**
 * GET /approvals/pending - 대기 중인 승인 목록
 */
router.get('/pending', async (req, res) => {
    try {
        const userId = req.session.user.email;

        const [approvals] = await pool.execute(
            `SELECT 
                tai.*,
                t.ticket_number,
                t.title,
                t.amount,
                t.severity,
                u.name as approver_name
            FROM ticket_approval_instances tai
            JOIN tickets t ON tai.ticket_id = t.id
            LEFT JOIN users u ON tai.approver_id = u.email
            WHERE tai.approver_id = ? AND tai.status = 'PENDING'
            ORDER BY tai.due_date ASC, tai.created_at ASC`,
            [userId]
        );

        res.json({
            success: true,
            data: approvals
        });
    } catch (error) {
        console.error('승인 목록 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '승인 목록 조회 중 오류가 발생했습니다.'
        });
    }
});

module.exports = router;


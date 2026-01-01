// ==============================
// routes/tickets.js - 티켓 관리 라우터
// ==============================

const express = require('express');
const { pool } = require('../config/database');
const TicketService = require('../services/ticketService');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// 모든 라우트에 인증 필요
router.use(requireAuth);

/**
 * POST /tickets - 티켓 생성
 */
router.post('/', async (req, res) => {
    try {
        const ticketData = {
            ticket_type_code: req.body.ticket_type_code,
            contract_id: req.body.contract_id || null,
            title: req.body.title,
            owner_id: req.body.owner_id || null,
            creator_id: req.session.user.email, // 세션에서 가져옴
            priority: req.body.priority || 'medium',
            due_date: req.body.due_date || null,
            description: req.body.description || null,
            amount: req.body.amount || null,
            severity: req.body.severity || 'P2',
            sensitivity_level: req.body.sensitivity_level || 'NORMAL'
        };

        // 필수 필드 검증
        if (!ticketData.ticket_type_code || !ticketData.title) {
            return res.status(400).json({
                success: false,
                message: 'ticket_type_code와 title은 필수입니다.'
            });
        }

        const ticket = await TicketService.createTicket(ticketData);

        res.status(201).json({
            success: true,
            data: ticket
        });
    } catch (error) {
        console.error('티켓 생성 오류:', error);
        res.status(500).json({
            success: false,
            message: '티켓 생성 중 오류가 발생했습니다.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * GET /tickets - 티켓 목록 조회 (필터링 지원)
 */
router.get('/', async (req, res) => {
    try {
        const filters = {
            status: req.query.status,
            ticket_type: req.query.ticket_type,
            contract_id: req.query.contract_id ? parseInt(req.query.contract_id) : null,
            owner_id: req.query.owner_id,
            start_date: req.query.start_date,
            end_date: req.query.end_date,
            limit: req.query.limit ? parseInt(req.query.limit) : 50,
            offset: req.query.offset ? parseInt(req.query.offset) : 0
        };

        const tickets = await TicketService.getTickets(filters);

        res.json({
            success: true,
            data: tickets,
            count: tickets.length
        });
    } catch (error) {
        console.error('티켓 목록 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '티켓 목록 조회 중 오류가 발생했습니다.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

/**
 * GET /tickets/:id - 티켓 상세 조회
 */
router.get('/:id', async (req, res) => {
    try {
        const ticketId = parseInt(req.params.id);
        const ticket = await TicketService.getTicketById(ticketId);

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: '티켓을 찾을 수 없습니다.'
            });
        }

        res.json({
            success: true,
            data: ticket
        });
    } catch (error) {
        console.error('티켓 상세 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '티켓 상세 조회 중 오류가 발생했습니다.'
        });
    }
});

/**
 * PUT /tickets/:id - 티켓 수정
 */
router.put('/:id', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const ticketId = parseInt(req.params.id);
        const userId = req.session.user.email;
        const userRole = req.session.user.role;

        // 현재 티켓 조회
        const [tickets] = await connection.execute(
            'SELECT * FROM tickets WHERE id = ?',
            [ticketId]
        );

        if (tickets.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: '티켓을 찾을 수 없습니다.'
            });
        }

        const ticket = tickets[0];

        // 권한 확인: 작성자, 담당자, 관리자만 수정 가능
        const isCreator = ticket.creator_id === userId;
        const isOwner = ticket.owner_id === userId;
        const isAdmin = ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'DEPT_MANAGER'].includes(userRole);

        if (!isCreator && !isOwner && !isAdmin) {
            await connection.rollback();
            return res.status(403).json({
                success: false,
                message: '티켓을 수정할 권한이 없습니다.'
            });
        }

        // 수정 가능한 필드들
        const updateFields = [];
        const updateValues = [];

        if (req.body.title !== undefined) {
            updateFields.push('title = ?');
            updateValues.push(req.body.title);
        }

        if (req.body.description !== undefined) {
            updateFields.push('description = ?');
            updateValues.push(req.body.description || null);
        }

        if (req.body.owner_id !== undefined) {
            updateFields.push('owner_id = ?');
            updateValues.push(req.body.owner_id || null);
        }

        if (req.body.priority !== undefined) {
            updateFields.push('priority = ?');
            updateValues.push(req.body.priority);
        }

        if (req.body.due_date !== undefined) {
            updateFields.push('due_date = ?');
            updateValues.push(req.body.due_date || null);
        }

        if (req.body.amount !== undefined) {
            updateFields.push('amount = ?');
            updateValues.push(req.body.amount || null);
        }

        if (req.body.severity !== undefined) {
            updateFields.push('severity = ?');
            updateValues.push(req.body.severity);
        }

        if (req.body.sensitivity_level !== undefined) {
            updateFields.push('sensitivity_level = ?');
            updateValues.push(req.body.sensitivity_level);
        }

        if (updateFields.length === 0) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: '수정할 필드가 없습니다.'
            });
        }

        // 업데이트 실행
        updateFields.push('updated_at = NOW()');
        updateValues.push(ticketId);

        await connection.execute(
            `UPDATE tickets SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
        );

        // 활동 로그 기록
        await TicketService.logActivity(connection, {
            ticket_id: ticketId,
            activity_type: 'UPDATE',
            user_id: userId,
            description: '티켓 정보 수정됨'
        });

        // 협업자 업데이트 (제공된 경우)
        if (req.body.collaborators && Array.isArray(req.body.collaborators)) {
            // 기존 협업자 삭제
            await connection.execute(
                'DELETE FROM ticket_collaborators WHERE ticket_id = ?',
                [ticketId]
            );

            // 새 협업자 추가
            for (const collaboratorId of req.body.collaborators) {
                await connection.execute(
                    'INSERT INTO ticket_collaborators (ticket_id, collaborator_id) VALUES (?, ?)',
                    [ticketId, collaboratorId]
                );
            }
        }

        await connection.commit();

        const updatedTicket = await TicketService.getTicketById(ticketId);
        res.json({
            success: true,
            data: updatedTicket
        });
    } catch (error) {
        await connection.rollback();
        console.error('티켓 수정 오류:', error);
        res.status(500).json({
            success: false,
            message: '티켓 수정 중 오류가 발생했습니다.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        connection.release();
    }
});

/**
 * PATCH /tickets/:id/status - 티켓 상태 변경
 */
router.patch('/:id/status', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const ticketId = parseInt(req.params.id);
        const newStatus = req.body.status;
        const userId = req.session.user.email;

        // 현재 티켓 조회
        const [tickets] = await connection.execute(
            'SELECT * FROM tickets WHERE id = ?',
            [ticketId]
        );

        if (tickets.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: '티켓을 찾을 수 없습니다.'
            });
        }

        const ticket = tickets[0];
        const oldStatus = ticket.status;

        // 상태 전환 규칙 검증
        if (ticket.status === 'IN_PROGRESS') {
            // IN_PROGRESS 상태에서는 owner만 수정 가능
            if (ticket.owner_id !== userId) {
                await connection.rollback();
                return res.status(403).json({
                    success: false,
                    message: 'IN_PROGRESS 상태의 티켓은 담당자만 수정할 수 있습니다.'
                });
            }
        }

        // REVIEW → DONE 전환 시 조건 확인
        if (oldStatus === 'REVIEW' && newStatus === 'DONE') {
            // 필수 체크리스트 확인
            const [requiredChecklists] = await connection.execute(
                `SELECT COUNT(*) as total, SUM(CASE WHEN is_checked = 1 THEN 1 ELSE 0 END) as checked
                FROM ticket_checklists
                WHERE ticket_id = ? AND required = 1`,
                [ticketId]
            );

            if (requiredChecklists[0].checked < requiredChecklists[0].total) {
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    message: '모든 필수 체크리스트를 완료해야 합니다.'
                });
            }

            // manager_verified_by 확인
            if (!ticket.manager_verified_by) {
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    message: '팀장 검증이 필요합니다.'
                });
            }

            // 승인 완료 확인
            const [approvals] = await connection.execute(
                `SELECT 
                    ar.approval_mode,
                    ar.completion_rule,
                    COUNT(*) as total,
                    SUM(CASE WHEN tai.status = 'APPROVED' THEN 1 ELSE 0 END) as approved,
                    SUM(CASE WHEN tai.status = 'REJECTED' THEN 1 ELSE 0 END) as rejected
                FROM ticket_approval_instances tai
                JOIN approval_rules ar ON tai.rule_id = ar.id
                WHERE tai.ticket_id = ?
                GROUP BY ar.approval_mode, ar.completion_rule`,
                [ticketId]
            );

            // 승인 완료 조건 확인
            for (const approval of approvals) {
                if (approval.completion_rule === 'ALL' && approval.approved < approval.total) {
                    await connection.rollback();
                    return res.status(400).json({
                        success: false,
                        message: '모든 승인이 완료되어야 합니다.'
                    });
                }
                if (approval.rejected > 0) {
                    await connection.rollback();
                    return res.status(400).json({
                        success: false,
                        message: '거부된 승인이 있어 완료할 수 없습니다.'
                    });
                }
            }
        }

        // 상태 업데이트
        await connection.execute(
            'UPDATE tickets SET status = ? WHERE id = ?',
            [newStatus, ticketId]
        );

        // Activity Log 기록
        await TicketService.logActivity(connection, {
            ticket_id: ticketId,
            activity_type: 'STATUS_CHANGE',
            user_id: userId,
            old_value: oldStatus,
            new_value: newStatus,
            description: `상태 변경: ${oldStatus} → ${newStatus}`
        });

        // REVIEW 상태로 변경 시 승인 인스턴스 생성
        if (newStatus === 'REVIEW') {
            await TicketService.createApprovalInstances(connection, ticketId);
        }

        await connection.commit();

        const updatedTicket = await TicketService.getTicketById(ticketId);
        res.json({
            success: true,
            data: updatedTicket
        });
    } catch (error) {
        await connection.rollback();
        console.error('티켓 상태 변경 오류:', error);
        res.status(500).json({
            success: false,
            message: '티켓 상태 변경 중 오류가 발생했습니다.'
        });
    } finally {
        connection.release();
    }
});

/**
 * POST /tickets/:id/checklists/init - 체크리스트 초기화 (템플릿에서)
 */
router.post('/:id/checklists/init', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const ticketId = parseInt(req.params.id);
        const userId = req.session.user.email;

        // 티켓 조회
        const [tickets] = await connection.execute(
            'SELECT ticket_type_code FROM tickets WHERE id = ?',
            [ticketId]
        );

        if (tickets.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: '티켓을 찾을 수 없습니다.'
            });
        }

        const ticketTypeCode = tickets[0].ticket_type_code;

        // 템플릿 조회
        const [templates] = await connection.execute(
            `SELECT * FROM checklist_templates
            WHERE ticket_type_code = ? AND is_default = 1
            ORDER BY id DESC
            LIMIT 1`,
            [ticketTypeCode]
        );

        if (templates.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: '해당 티켓 유형의 기본 체크리스트 템플릿을 찾을 수 없습니다.'
            });
        }

        const template = templates[0];
        
        // JSON 파싱 (이미 객체일 수도 있고 문자열일 수도 있음)
        let items;
        if (typeof template.items === 'string') {
            items = JSON.parse(template.items);
        } else {
            items = template.items; // 이미 파싱된 객체
        }

        // 배열인지 확인
        if (!Array.isArray(items)) {
            throw new Error('템플릿 items가 배열 형식이 아닙니다.');
        }

        // 기존 체크리스트 삭제
        await connection.execute(
            'DELETE FROM ticket_checklists WHERE ticket_id = ?',
            [ticketId]
        );

        // 체크리스트 항목 생성
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            let itemText;
            let required = true;

            if (typeof item === 'string') {
                // 단순 문자열 배열
                itemText = item;
            } else if (typeof item === 'object' && item !== null) {
                // 객체 형태 {text: "...", required: true/false}
                itemText = item.text || item.item_text || '';
                required = item.required !== undefined ? item.required : true;
            } else {
                continue; // 잘못된 형식은 건너뜀
            }

            await connection.execute(
                `INSERT INTO ticket_checklists (
                    ticket_id, item_text, item_order, required
                ) VALUES (?, ?, ?, ?)`,
                [ticketId, itemText, i + 1, required ? 1 : 0]
            );
        }

        // Activity Log 기록
        await TicketService.logActivity(connection, {
            ticket_id: ticketId,
            activity_type: 'STATUS_CHANGE',
            user_id: userId,
            description: '체크리스트 초기화됨'
        });

        await connection.commit();

        const [checklists] = await connection.execute(
            'SELECT * FROM ticket_checklists WHERE ticket_id = ? ORDER BY item_order ASC',
            [ticketId]
        );

        res.json({
            success: true,
            data: checklists
        });
    } catch (error) {
        await connection.rollback();
        console.error('체크리스트 초기화 오류:', error);
        res.status(500).json({
            success: false,
            message: '체크리스트 초기화 중 오류가 발생했습니다.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    } finally {
        connection.release();
    }
});

/**
 * PATCH /tickets/:id/checklists/:item_id - 체크리스트 항목 체크/해제
 */
router.patch('/:id/checklists/:item_id', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const ticketId = parseInt(req.params.id);
        const itemId = parseInt(req.params.item_id);
        const userId = req.session.user.email;
        const isChecked = req.body.is_checked !== undefined ? req.body.is_checked : true;

        // 체크리스트 항목 조회
        const [items] = await connection.execute(
            'SELECT * FROM ticket_checklists WHERE id = ? AND ticket_id = ?',
            [itemId, ticketId]
        );

        if (items.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: '체크리스트 항목을 찾을 수 없습니다.'
            });
        }

        // 체크 상태 업데이트
        await connection.execute(
            `UPDATE ticket_checklists 
            SET is_checked = ?, checked_by = ?, checked_at = ?
            WHERE id = ?`,
            [
                isChecked ? 1 : 0,
                isChecked ? userId : null,
                isChecked ? new Date() : null,
                itemId
            ]
        );

        // Activity Log 기록
        await TicketService.logActivity(connection, {
            ticket_id: ticketId,
            activity_type: 'CHECKLIST_CHECK',
            user_id: userId,
            description: `체크리스트 ${isChecked ? '체크' : '해제'}: ${items[0].item_text}`
        });

        await connection.commit();

        const [updatedItem] = await connection.execute(
            'SELECT * FROM ticket_checklists WHERE id = ?',
            [itemId]
        );

        res.json({
            success: true,
            data: updatedItem[0]
        });
    } catch (error) {
        await connection.rollback();
        console.error('체크리스트 업데이트 오류:', error);
        res.status(500).json({
            success: false,
            message: '체크리스트 업데이트 중 오류가 발생했습니다.'
        });
    } finally {
        connection.release();
    }
});

/**
 * POST /tickets/:id/collaborators - 협업자 추가
 */
router.post('/:id/collaborators', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const ticketId = parseInt(req.params.id);
        const collaboratorEmail = req.body.collaborator_id;
        const userId = req.session.user.email;

        // 티켓 조회
        const [tickets] = await connection.execute(
            'SELECT * FROM tickets WHERE id = ?',
            [ticketId]
        );

        if (tickets.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: '티켓을 찾을 수 없습니다.'
            });
        }

        const ticket = tickets[0];

        // 권한 확인: owner 또는 manager만 추가 가능
        const isOwner = ticket.owner_id === userId;
        const isManager = ['SUPER_ADMIN', 'DEPT_MANAGER', 'SYSTEM_ADMIN'].includes(req.session.user.role);

        if (!isOwner && !isManager) {
            await connection.rollback();
            return res.status(403).json({
                success: false,
                message: '협업자를 추가할 권한이 없습니다.'
            });
        }

        // SENSITIVE 티켓인 경우 승인 필요
        const requiresApproval = ticket.sensitivity_level === 'SENSITIVE';

        // 협업자 추가
        await connection.execute(
            `INSERT INTO ticket_collaborators (
                ticket_id, collaborator_id, added_by, requires_approval
            ) VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                added_by = VALUES(added_by),
                requires_approval = VALUES(requires_approval)`,
            [ticketId, collaboratorEmail, userId, requiresApproval ? 1 : 0]
        );

        // Activity Log 기록
        await TicketService.logActivity(connection, {
            ticket_id: ticketId,
            activity_type: 'COLLABORATOR_ADD',
            user_id: userId,
            description: `협업자 추가: ${collaboratorEmail}`
        });

        await connection.commit();

        const [collaborators] = await connection.execute(
            `SELECT tc.*, u.name as collaborator_name
            FROM ticket_collaborators tc
            LEFT JOIN users u ON tc.collaborator_id = u.email
            WHERE tc.ticket_id = ? AND tc.collaborator_id = ?`,
            [ticketId, collaboratorEmail]
        );

        res.status(201).json({
            success: true,
            data: collaborators[0]
        });
    } catch (error) {
        await connection.rollback();
        console.error('협업자 추가 오류:', error);
        res.status(500).json({
            success: false,
            message: '협업자 추가 중 오류가 발생했습니다.'
        });
    } finally {
        connection.release();
    }
});

/**
 * DELETE /tickets/:id/collaborators/:email - 협업자 제거
 */
router.delete('/:id/collaborators/:email', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const ticketId = parseInt(req.params.id);
        const collaboratorEmail = req.params.email;
        const userId = req.session.user.email;

        // 협업자 제거
        const [result] = await connection.execute(
            'DELETE FROM ticket_collaborators WHERE ticket_id = ? AND collaborator_id = ?',
            [ticketId, collaboratorEmail]
        );

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: '협업자를 찾을 수 없습니다.'
            });
        }

        // Activity Log 기록
        await TicketService.logActivity(connection, {
            ticket_id: ticketId,
            activity_type: 'COLLABORATOR_REMOVE',
            user_id: userId,
            description: `협업자 제거: ${collaboratorEmail}`
        });

        await connection.commit();

        res.json({
            success: true,
            message: '협업자가 제거되었습니다.'
        });
    } catch (error) {
        await connection.rollback();
        console.error('협업자 제거 오류:', error);
        res.status(500).json({
            success: false,
            message: '협업자 제거 중 오류가 발생했습니다.'
        });
    } finally {
        connection.release();
    }
});

/**
 * PATCH /tickets/:id/approvals/:approvalId - 승인 처리
 */
router.patch('/:id/approvals/:approvalId', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const ticketId = parseInt(req.params.id);
        const approvalId = parseInt(req.params.approvalId);
        const userId = req.session.user.email;
        const { status, comment } = req.body;

        // 승인 상태 검증
        if (!['APPROVED', 'REJECTED'].includes(status)) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: '유효하지 않은 승인 상태입니다.'
            });
        }

        // 승인 인스턴스 조회
        const [approvals] = await connection.execute(
            'SELECT * FROM ticket_approval_instances WHERE id = ? AND ticket_id = ?',
            [approvalId, ticketId]
        );

        if (approvals.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: '승인 인스턴스를 찾을 수 없습니다.'
            });
        }

        const approval = approvals[0];

        // 권한 확인: 승인자만 처리 가능
        if (approval.approver_id !== userId) {
            await connection.rollback();
            return res.status(403).json({
                success: false,
                message: '승인 처리 권한이 없습니다.'
            });
        }

        // 이미 처리된 경우
        if (approval.status !== 'PENDING') {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: '이미 처리된 승인입니다.'
            });
        }

        // 승인 상태 업데이트
        await connection.execute(
            `UPDATE ticket_approval_instances 
            SET status = ?, comment = ?, approved_at = NOW(), updated_at = NOW()
            WHERE id = ?`,
            [status, comment || null, approvalId]
        );

        // Activity Log 기록
        await TicketService.logActivity(connection, {
            ticket_id: ticketId,
            activity_type: 'APPROVAL',
            user_id: userId,
            description: `승인 ${status === 'APPROVED' ? '승인' : '거부'}: ${approval.approver_role || ''}`,
            new_value: status
        });

        await connection.commit();

        // 업데이트된 승인 정보 반환
        const [updatedApproval] = await connection.execute(
            'SELECT * FROM ticket_approval_instances WHERE id = ?',
            [approvalId]
        );

        res.json({
            success: true,
            data: updatedApproval[0],
            message: status === 'APPROVED' ? '승인 처리되었습니다.' : '거부 처리되었습니다.'
        });
    } catch (error) {
        await connection.rollback();
        console.error('승인 처리 오류:', error);
        res.status(500).json({
            success: false,
            message: '승인 처리 중 오류가 발생했습니다.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        connection.release();
    }
});

module.exports = router;


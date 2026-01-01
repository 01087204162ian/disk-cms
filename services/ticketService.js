// ==============================
// services/ticketService.js - 티켓 서비스
// ==============================
const { pool } = require('../config/database');

class TicketService {
    /**
     * 티켓 번호 원자적 생성
     * @param {string} ticketTypeCode - 티켓 유형 코드 (SETTLE, CLAIM 등)
     * @param {string} dateKey - YYYYMMDD 형식 날짜
     * @returns {Promise<string>} 생성된 티켓 번호
     */
    static async generateTicketNumber(ticketTypeCode, dateKey) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // 원자적 증가
            await connection.execute(
                `INSERT INTO ticket_counters (ticket_type_code, date_key, current_seq)
                 VALUES (?, ?, 1)
                 ON DUPLICATE KEY UPDATE current_seq = LAST_INSERT_ID(current_seq + 1)`,
                [ticketTypeCode, dateKey]
            );

            // 시퀀스 조회
            const [result] = await connection.execute('SELECT LAST_INSERT_ID() AS seq');
            const seq = result[0].seq;

            // 티켓 번호 생성: {TYPE}-{YYYYMMDD}-{SEQ4}
            const ticketNumber = `${ticketTypeCode}-${dateKey}-${String(seq).padStart(4, '0')}`;

            await connection.commit();
            return ticketNumber;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * 티켓 생성
     * @param {Object} ticketData - 티켓 데이터
     * @returns {Promise<Object>} 생성된 티켓
     */
    static async createTicket(ticketData) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // 티켓 번호 생성
            const dateKey = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const ticketNumber = await this.generateTicketNumber(
                ticketData.ticket_type_code,
                dateKey
            );

            // 티켓 생성
            const [result] = await connection.execute(
                `INSERT INTO tickets (
                    ticket_number, ticket_type_code, contract_id, title, status,
                    owner_id, creator_id, priority, due_date, description,
                    amount, severity, sensitivity_level
                ) VALUES (?, ?, ?, ?, 'NEW', ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    ticketNumber,
                    ticketData.ticket_type_code,
                    ticketData.contract_id || null,
                    ticketData.title,
                    ticketData.owner_id || null,
                    ticketData.creator_id,
                    ticketData.priority || 'medium',
                    ticketData.due_date || null,
                    ticketData.description || null,
                    ticketData.amount || null,
                    ticketData.severity || 'P2',
                    ticketData.sensitivity_level || 'NORMAL'
                ]
            );

            const ticketId = result.insertId;

            // Activity Log 기록
            await this.logActivity(connection, {
                ticket_id: ticketId,
                activity_type: 'STATUS_CHANGE',
                user_id: ticketData.creator_id,
                description: '티켓 생성됨',
                new_value: 'NEW'
            });

            await connection.commit();

            // 생성된 티켓 조회
            return await this.getTicketById(ticketId);
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * 티켓 목록 조회 (필터링 지원)
     */
    static async getTickets(filters = {}) {
        let query = `
            SELECT 
                t.*,
                u_creator.name as creator_name,
                u_owner.name as owner_name,
                u_manager.name as manager_verified_name,
                c.contract_number,
                p.name as partner_name,
                cust.name as customer_name
            FROM tickets t
            LEFT JOIN users u_creator ON t.creator_id = u_creator.email
            LEFT JOIN users u_owner ON t.owner_id = u_owner.email
            LEFT JOIN users u_manager ON t.manager_verified_by = u_manager.email
            LEFT JOIN contracts c ON t.contract_id = c.id
            LEFT JOIN partners p ON c.partner_id = p.id
            LEFT JOIN customers cust ON c.customer_id = cust.id
            WHERE 1=1
        `;
        const params = [];

        if (filters.status) {
            query += ' AND t.status = ?';
            params.push(filters.status);
        }

        if (filters.ticket_type) {
            query += ' AND t.ticket_type_code = ?';
            params.push(filters.ticket_type);
        }

        if (filters.contract_id) {
            query += ' AND t.contract_id = ?';
            params.push(filters.contract_id);
        }

        if (filters.owner_id) {
            query += ' AND t.owner_id = ?';
            params.push(filters.owner_id);
        }

        if (filters.start_date) {
            query += ' AND DATE(t.created_at) >= ?';
            params.push(filters.start_date);
        }

        if (filters.end_date) {
            query += ' AND DATE(t.created_at) <= ?';
            params.push(filters.end_date);
        }

        query += ' ORDER BY t.created_at DESC';

        // LIMIT/OFFSET은 문자열 삽입 방식 사용 (MySQL 파라미터 바인딩 이슈 방지)
        if (filters.limit) {
            const limitNum = parseInt(filters.limit) || 50;
            const offsetNum = parseInt(filters.offset) || 0;
            query += ` LIMIT ${limitNum} OFFSET ${offsetNum}`;
        }

        const [tickets] = await pool.execute(query, params);
        return tickets;
    }

    /**
     * 티켓 상세 조회 (관련 데이터 포함)
     */
    static async getTicketById(ticketId) {
        // 티켓 기본 정보
        const [tickets] = await pool.execute(
            `SELECT 
                t.*,
                u_creator.name as creator_name,
                u_owner.name as owner_name,
                u_manager.name as manager_verified_name,
                c.contract_number,
                p.name as partner_name,
                cust.name as customer_name
            FROM tickets t
            LEFT JOIN users u_creator ON t.creator_id = u_creator.email
            LEFT JOIN users u_owner ON t.owner_id = u_owner.email
            LEFT JOIN users u_manager ON t.manager_verified_by = u_manager.email
            LEFT JOIN contracts c ON t.contract_id = c.id
            LEFT JOIN partners p ON c.partner_id = p.id
            LEFT JOIN customers cust ON c.customer_id = cust.id
            WHERE t.id = ?`,
            [ticketId]
        );

        if (tickets.length === 0) {
            return null;
        }

        const ticket = tickets[0];

        // 체크리스트
        const [checklists] = await pool.execute(
            `SELECT 
                tcl.*,
                u.name as checked_by_name
            FROM ticket_checklists tcl
            LEFT JOIN users u ON tcl.checked_by = u.email
            WHERE tcl.ticket_id = ?
            ORDER BY tcl.item_order ASC`,
            [ticketId]
        );

        // 협업자
        const [collaborators] = await pool.execute(
            `SELECT 
                tc.*,
                u_collab.name as collaborator_name,
                u_added.name as added_by_name,
                u_approved.name as approved_by_name
            FROM ticket_collaborators tc
            LEFT JOIN users u_collab ON tc.collaborator_id = u_collab.email
            LEFT JOIN users u_added ON tc.added_by = u_added.email
            LEFT JOIN users u_approved ON tc.approved_by = u_approved.email
            WHERE tc.ticket_id = ?`,
            [ticketId]
        );

        // 승인 인스턴스
        const [approvals] = await pool.execute(
            `SELECT 
                tai.*,
                u.name as approver_name,
                ar.approval_mode,
                ar.completion_rule
            FROM ticket_approval_instances tai
            LEFT JOIN users u ON tai.approver_id = u.email
            LEFT JOIN approval_rules ar ON tai.rule_id = ar.id
            WHERE tai.ticket_id = ?
            ORDER BY tai.approval_level ASC, tai.created_at ASC`,
            [ticketId]
        );

        // 활동 로그 (ASC 순서)
        const [logs] = await pool.execute(
            `SELECT * FROM ticket_activity_logs
            WHERE ticket_id = ?
            ORDER BY created_at ASC`,
            [ticketId]
        );

        return {
            ...ticket,
            checklists,
            collaborators,
            approvals,
            activity_logs: logs
        };
    }

    /**
     * 티켓 상태 변경
     */
    static async updateTicketStatus(ticketId, newStatus, userId, oldStatus) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // 상태 업데이트
            await connection.execute(
                'UPDATE tickets SET status = ? WHERE id = ?',
                [newStatus, ticketId]
            );

            // Activity Log 기록
            await this.logActivity(connection, {
                ticket_id: ticketId,
                activity_type: 'STATUS_CHANGE',
                user_id: userId,
                old_value: oldStatus,
                new_value: newStatus,
                description: `상태 변경: ${oldStatus} → ${newStatus}`
            });

            // REVIEW 상태로 변경 시 승인 인스턴스 생성
            if (newStatus === 'REVIEW') {
                await this.createApprovalInstances(connection, ticketId);
            }

            await connection.commit();
            return await this.getTicketById(ticketId);
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * 승인 규칙 매칭 및 인스턴스 생성
     */
    static async createApprovalInstances(connection, ticketId) {
        // 티켓 정보 조회
        const [tickets] = await connection.execute(
            'SELECT * FROM tickets WHERE id = ?',
            [ticketId]
        );

        if (tickets.length === 0) return;

        const ticket = tickets[0];
        // amount를 숫자로 변환 (DECIMAL이 문자열로 올 수 있음)
        const ticketAmount = parseFloat(ticket.amount) || 0;

        // 모든 활성 규칙 조회
        const [allRules] = await connection.execute(
            `SELECT * FROM approval_rules
            WHERE is_active = 1
            ORDER BY priority ASC, step ASC`
        );

        // 규칙 매칭 로직
        const matchedRules = [];
        for (const rule of allRules) {
            // ticket_type 매칭
            if (rule.ticket_type !== '*' && rule.ticket_type !== ticket.ticket_type_code) {
                continue;
            }

            // amount 범위 매칭 (NULL 체크 및 숫자 변환)
            const amountMin = rule.amount_min !== null && rule.amount_min !== undefined 
                ? parseFloat(rule.amount_min) 
                : null;
            const amountMax = rule.amount_max !== null && rule.amount_max !== undefined 
                ? parseFloat(rule.amount_max) 
                : null;

            if (amountMin !== null && ticketAmount < amountMin) {
                continue;
            }
            if (amountMax !== null && ticketAmount > amountMax) {
                continue;
            }

            // sensitivity_level 매칭
            if (rule.sensitivity_level !== null && rule.sensitivity_level !== undefined 
                && rule.sensitivity_level !== ticket.sensitivity_level) {
                continue;
            }

            // severity 매칭
            if (rule.severity !== null && rule.severity !== undefined 
                && rule.severity !== ticket.severity) {
                continue;
            }

            matchedRules.push(rule);
        }

        if (matchedRules.length === 0) return;

        // 매칭된 규칙으로 승인 인스턴스 생성
        for (const rule of matchedRules) {
            const approverRoles = JSON.parse(rule.approver_roles);

            // 역할별 사용자 조회 및 인스턴스 생성
            for (const role of approverRoles) {
                const [users] = await connection.execute(
                    `SELECT email, name, role FROM users
                    WHERE role = ? AND is_active = 1
                    LIMIT 1`,
                    [role]
                );

                if (users.length > 0) {
                    const approver = users[0];
                    await connection.execute(
                        `INSERT INTO ticket_approval_instances (
                            ticket_id, rule_id, approver_id, approver_role,
                            approval_level, status
                        ) VALUES (?, ?, ?, ?, ?, 'PENDING')`,
                        [
                            ticketId,
                            rule.id,
                            approver.email,
                            approver.role,
                            rule.step
                        ]
                    );
                }
            }
        }
    }

    /**
     * Activity Log 기록 헬퍼
     */
    static async logActivity(connection, logData) {
        // 사용자 이름 조회
        const [users] = await connection.execute(
            'SELECT name FROM users WHERE email = ?',
            [logData.user_id]
        );
        const userName = users.length > 0 ? users[0].name : null;

        await connection.execute(
            `INSERT INTO ticket_activity_logs (
                ticket_id, activity_type, user_id, user_name,
                description, old_value, new_value
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                logData.ticket_id,
                logData.activity_type,
                logData.user_id,
                userName,
                logData.description || null,
                logData.old_value || null,
                logData.new_value || null
            ]
        );
    }
}

module.exports = TicketService;


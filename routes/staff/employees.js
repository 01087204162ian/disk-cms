// ==============================
// routes/staff/employees.js - 직원 관리 라우터
// ==============================

const express = require('express');
const { pool } = require('../../config/database');

const router = express.Router();

// 권한 확인 미들웨어
const requireAuth = (req, res, next) => {
    if (!req.session?.user) {
        return res.status(401).json({
            success: false,
            message: '로그인이 필요합니다.'
        });
    }
    next();
};

// 관리자 권한 확인 미들웨어
const requireAdmin = (req, res, next) => {
    if (!req.session?.user || !['SUPER_ADMIN', 'DEPT_MANAGER', 'SYSTEM_ADMIN'].includes(req.session.user.role)) {
        return res.status(403).json({
            success: false,
            message: '관리자 권한이 필요합니다.'
        });
    }
    next();
};
// 직원 상세 조회 API 추가 (기존 라우터들 사이에)
router.get('/employees/:email', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { email } = req.params;

        const [employees] = await pool.execute(`
            SELECT 
                u.*,
                d.name as department_name,
                d.code as department_code
            FROM users u
            LEFT JOIN departments d ON u.department_id = d.id
            WHERE u.email = ?
        `, [email]);

        if (employees.length === 0) {
            return res.status(404).json({
                success: false,
                message: '직원을 찾을 수 없습니다.'
            });
        }

        const employee = employees[0];
        
        // 부서 권한 체크
        if (req.session.user.role === 'DEPT_MANAGER' && 
            req.session.user.department_id && 
            employee.department_id !== req.session.user.department_id) {
            return res.status(403).json({
                success: false,
                message: '해당 직원에 대한 권한이 없습니다.'
            });
        }

        // 비밀번호 제외하고 응답
        const { password, ...employeeData } = employee;

        res.json({
            success: true,
            data: {
                ...employeeData,
                department: {
                    id: employee.department_id,
                    name: employee.department_name,
                    code: employee.department_code
                }
            }
        });

    } catch (error) {
        console.error('직원 상세 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '직원 상세 조회 중 오류가 발생했습니다.'
        });
    }
});
// 직원 상세 조회 API
// 직원 목록 조회 API (기존 코드에서 수정할 부분들)
router.get('/employees', requireAuth, requireAdmin, async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            status = '', // pending(0), active(1), inactive(2)
            department = '',
            role = '',
            search = '',
            sortBy = 'created_at',
            sortOrder = 'desc'
        } = req.query;

        // 페이징 설정
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const limitNum = parseInt(limit);

        // WHERE 조건 구성
        let whereConditions = [];
        let queryParams = [];

        // *** 상태별 필터 수정 ***
        switch (status) {
            case 'pending':
            case '0':
                whereConditions.push('u.is_active = 0'); // 승인대기
                break;
            case 'active':
            case '1':
                whereConditions.push('u.is_active = 1'); // 활성
                break;
            case 'inactive':
            case '2':
                whereConditions.push('u.is_active = 2'); // 비활성
                break;
            // status가 비어있으면 모든 상태 조회
        }

        // 부서별 필터 (기존과 동일)
        if (department) {
            whereConditions.push('u.department_id = ?');
            queryParams.push(department);
        }

        // 권한별 필터 (기존과 동일)
        if (role) {
            whereConditions.push('u.role = ?');
            queryParams.push(role);
        }

        // 검색 조건 (기존과 동일)
        if (search) {
            whereConditions.push('(u.name LIKE ? OR u.email LIKE ? OR u.employee_id LIKE ? OR u.phone LIKE ?)');
            const searchTerm = `%${search}%`;
            queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        // 부서 권한 제한 (기존과 동일)
        if (req.session.user.role === 'DEPT_MANAGER' && req.session.user.department_id) {
            whereConditions.push('u.department_id = ?');
            queryParams.push(req.session.user.department_id);
        }

        const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

        // 정렬 조건 (기존과 동일)
        const validSortFields = ['created_at', 'name', 'email', 'role', 'last_login_at'];
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
        const sortDirection = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

        // 전체 개수 조회 (기존과 동일)
        const countQuery = `
            SELECT COUNT(*) as total
            FROM users u
            LEFT JOIN departments d ON u.department_id = d.id
            ${whereClause}
        `;
        
        const [countResult] = await pool.execute(countQuery, queryParams);
        const totalCount = countResult[0].total;

        // 직원 목록 조회 (기존과 동일)
        const employeeQueryParams = [...queryParams];
        const employeesQuery = `
            SELECT 
                u.email,
                u.name,
                u.phone,
                u.employee_id,
                u.department_id,
                d.name as department_name,
                u.position,
                u.hire_date,
                u.resign_date,
                u.role,
                u.work_type,
                u.work_schedule,
                u.is_active,
                u.created_at,
                u.updated_at,
                u.last_login_at
            FROM users u
            LEFT JOIN departments d ON u.department_id = d.id
            ${whereClause}
            ORDER BY u.${sortField} ${sortDirection}
            LIMIT ${offset}, ${limitNum}
        `;

        const [employees] = await pool.execute(employeesQuery, employeeQueryParams);

        // *** 통계 정보 조회 수정 ***
        const statsQuery = `
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active,
                SUM(CASE WHEN is_active = 2 THEN 1 ELSE 0 END) as inactive,
                COUNT(CASE WHEN role = 'SUPER_ADMIN' THEN 1 END) as super_admin,
                COUNT(CASE WHEN role = 'DEPT_MANAGER' THEN 1 END) as dept_manager,
                COUNT(CASE WHEN role = 'SYSTEM_ADMIN' THEN 1 END) as system_admin,
                COUNT(CASE WHEN role = 'EMPLOYEE' THEN 1 END) as employee
            FROM users u
            ${req.session.user.role === 'DEPT_MANAGER' && req.session.user.department_id ? 
                'WHERE u.department_id = ' + req.session.user.department_id : ''}
        `;

        const [stats] = await pool.execute(statsQuery);

        // *** 응답 데이터 구성 수정 ***
        res.json({
            success: true,
            data: {
                employees: employees.map(emp => ({
                    email: emp.email,
                    name: emp.name,
                    phone: emp.phone,
                    employee_id: emp.employee_id,
                    department: {
                        id: emp.department_id,
                        name: emp.department_name
                    },
                    position: emp.position,
                    hire_date: emp.hire_date,
                    resign_date: emp.resign_date,
                    role: emp.role,
                    work_type: emp.work_type,
                    work_schedule: emp.work_schedule,
                    // *** status 매핑 수정 ***
                    status: emp.is_active === 0 ? 'pending' : 
                           emp.is_active === 1 ? 'active' : 
                           emp.is_active === 2 ? 'inactive' : 'unknown',
                    is_active: emp.is_active, // 숫자값도 함께 전송
                    created_at: emp.created_at,
                    updated_at: emp.updated_at,
                    last_login_at: emp.last_login_at
                })),
                pagination: {
                    current_page: parseInt(page),
                    total_pages: Math.ceil(totalCount / limitNum),
                    total_count: totalCount,
                    limit: limitNum,
                    has_next: parseInt(page) < Math.ceil(totalCount / limitNum),
                    has_prev: parseInt(page) > 1
                },
                // *** 통계 데이터 수정 ***
                statistics: {
                    total: stats[0].total,
                    pending: stats[0].pending,   // 승인대기 (is_active = 0)
                    active: stats[0].active,     // 활성 (is_active = 1)  
                    inactive: stats[0].inactive, // 비활성 (is_active = 2)
                    super_admin: stats[0].super_admin,
                    dept_manager: stats[0].dept_manager,
                    system_admin: stats[0].system_admin,
                    employee: stats[0].employee
                },
                filters: {
                    status,
                    department,
                    role,
                    search,
                    sortBy: sortField,
                    sortOrder: sortDirection
                }
            }
        });

    } catch (error) {
        console.error('직원 목록 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '직원 목록 조회 중 오류가 발생했습니다.'
        });
    }
});

// 직원 정보 수정 API
router.put('/employees/:email', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { email } = req.params;
        const {
            name,
            phone,
            employee_id,
            department_id,  // 이제 이것만 사용
            position,
            hire_date,
            role,
            work_type,
            work_schedule,
            is_active
        } = req.body;
        
        // 현재 직원 정보 조회
        const [currentEmployee] = await pool.execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (currentEmployee.length === 0) {
            return res.status(404).json({
                success: false,
                message: '직원을 찾을 수 없습니다.'
            });
        }

        // 부서 권한 체크
        if (req.session.user.role === 'DEPT_MANAGER' && 
            req.session.user.department_id && 
            currentEmployee[0].department_id !== req.session.user.department_id) {
            return res.status(403).json({
                success: false,
                message: '해당 직원에 대한 권한이 없습니다.'
            });
        }

        // 사번 중복 체크
        if (employee_id && employee_id !== currentEmployee[0].employee_id) {
            const [existingEmployee] = await pool.execute(
                'SELECT email FROM users WHERE employee_id = ? AND email != ?',
                [employee_id, email]
            );

            if (existingEmployee.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: '이미 사용중인 사번입니다.'
                });
            }
        }

        // 수정할 필드 구성
        const updateFields = [];
        const updateValues = [];

        const convertEmptyToNull = (value) => value === '' ? null : value;

        if (name !== undefined) {
            updateFields.push('name = ?');
            updateValues.push(name);
        }
        if (phone !== undefined) {
            updateFields.push('phone = ?');
            updateValues.push(phone);
        }
        if (employee_id !== undefined) {
            updateFields.push('employee_id = ?');
            updateValues.push(convertEmptyToNull(employee_id));
        }
        
        // 부서 처리 (정리된 버전)
        if (department_id !== undefined) {
            // 부서 존재 확인 (부서 ID가 제공된 경우)
            if (department_id !== null && department_id !== '') {
                const [dept] = await pool.execute(
                    'SELECT id FROM departments WHERE id = ? AND is_active = 1',
                    [department_id]
                );
                if (dept.length === 0) {
                    return res.status(400).json({
                        success: false,
                        message: '유효하지 않은 부서입니다.'
                    });
                }
            }
            updateFields.push('department_id = ?');
            updateValues.push(department_id || null);
        }
        
        if (position !== undefined) {
            updateFields.push('position = ?');
            updateValues.push(convertEmptyToNull(position));
        }
        if (hire_date !== undefined) {
            updateFields.push('hire_date = ?');
            updateValues.push(convertEmptyToNull(hire_date));
        }
        if (role !== undefined) {
            updateFields.push('role = ?');
            updateValues.push(role);
        }
        if (work_type !== undefined) {
            updateFields.push('work_type = ?');
            updateValues.push(work_type);
        }
        if (work_schedule !== undefined) {
            updateFields.push('work_schedule = ?');
            updateValues.push(work_schedule);
        }
        if (is_active !== undefined) {
            updateFields.push('is_active = ?');
            updateValues.push(is_active);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: '수정할 필드가 없습니다.'
            });
        }

        // updated_at 필드 추가
        updateFields.push('updated_at = NOW()');
        updateValues.push(email);

        const updateQuery = `
            UPDATE users 
            SET ${updateFields.join(', ')} 
            WHERE email = ?
        `;

        await pool.execute(updateQuery, updateValues);

        console.log('직원 정보 수정:', { email, updatedBy: req.session.user.email });

        res.json({
            success: true,
            message: '직원 정보가 수정되었습니다.',
            data: {
                email,
                updated_by: req.session.user.email,
                updated_at: new Date()
            }
        });

    } catch (error) {
        console.error('직원 정보 수정 오류:', error);
        res.status(500).json({
            success: false,
            message: '직원 정보 수정 중 오류가 발생했습니다.'
        });
    }
});

// 직원 삭제 API (SUPER_ADMIN만)
router.delete('/employees/:email', requireAuth, async (req, res) => {
    try {
        // SUPER_ADMIN만 삭제 가능
        if (req.session.user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({
                success: false,
                message: '최고 관리자만 직원을 삭제할 수 있습니다.'
            });
        }

        const { email } = req.params;

        // 자기 자신은 삭제 불가
        if (email === req.session.user.email) {
            return res.status(400).json({
                success: false,
                message: '자기 자신은 삭제할 수 없습니다.'
            });
        }

        const [result] = await pool.execute(
            'DELETE FROM users WHERE email = ?',
            [email]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: '직원을 찾을 수 없습니다.'
            });
        }

        console.log('직원 삭제:', { email, deletedBy: req.session.user.email });

        res.json({
            success: true,
            message: '직원이 삭제되었습니다.',
            data: {
                deleted_email: email,
                deleted_by: req.session.user.email,
                deleted_at: new Date()
            }
        });

    } catch (error) {
        console.error('직원 삭제 오류:', error);
        res.status(500).json({
            success: false,
            message: '직원 삭제 중 오류가 발생했습니다.'
        });
    }
});

// 부서 목록 조회 API
router.get('/departments', requireAuth, async (req, res) => {
    try {
        const [departments] = await pool.execute(`
            SELECT 
                d.id,
                d.name,
                d.code,
                d.description,
                d.manager_id,
                d.is_active,
                COUNT(u.email) as employee_count,
                u_manager.name as manager_name
            FROM departments d
            LEFT JOIN users u ON d.id = u.department_id AND u.is_active = 1
            LEFT JOIN users u_manager ON d.manager_id = u_manager.email
            WHERE d.is_active = 1
            GROUP BY d.id, d.name, d.code, d.description, d.manager_id, d.is_active, u_manager.name
            ORDER BY d.name
        `);

        res.json({
            success: true,
            data: departments.map(dept => ({
                id: dept.id,
                name: dept.name,
                code: dept.code,
                description: dept.description,
                manager: dept.manager_id ? {
                    id: dept.manager_id,
                    name: dept.manager_name
                } : null,
                employee_count: dept.employee_count,
                is_active: dept.is_active
            }))
        });

    } catch (error) {
        console.error('부서 목록 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '부서 목록 조회 중 오류가 발생했습니다.'
        });
    }
});
// ==============================
// routes/staff/employees.js 기존 라우터에 추가할 엔드포인트들
// ==============================

// 활동 로그 기록 헬퍼 함수
const logUserActivity = async (userEmail, actionBy, action, oldStatus, newStatus, notes = null) => {
    try {
        await pool.execute(`
            INSERT INTO user_activity_logs (user_email, action_by, action, old_status, new_status, notes, created_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        `, [userEmail, actionBy, action, oldStatus, newStatus, notes]);
    } catch (error) {
        console.error('활동 로그 기록 실패:', error);
    }
};

// 계정 비활성화 API
router.patch('/employees/:email/deactivate', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { email } = req.params;
        const { notes, resign_date } = req.body; // 비활성화 사유, 퇴사일 (선택사항)
        
        // 권한 확인 (SUPER_ADMIN, SYSTEM_ADMIN, DEPT_MANAGER 가능)
        const userRole = req.session.user.role;
        if (!['SUPER_ADMIN', 'SYSTEM_ADMIN', 'DEPT_MANAGER'].includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: '계정 비활성화 권한이 없습니다.'
            });
        }
        
        // 자기 자신은 비활성화할 수 없음
        if (email === req.session.user.email) {
            return res.status(400).json({
                success: false,
                message: '자신의 계정은 비활성화할 수 없습니다.'
            });
        }
        
        // 현재 사용자 정보 조회 (부서 정보 포함)
        const [currentUser] = await pool.execute(
            'SELECT email, name, is_active, department_id FROM users WHERE email = ?',
            [email]
        );
        
        if (currentUser.length === 0) {
            return res.status(404).json({
                success: false,
                message: '해당 사용자를 찾을 수 없습니다.'
            });
        }
        
        const user = currentUser[0];
        
        // DEPT_MANAGER의 경우 본인 부서 직원만 비활성화 가능
        if (userRole === 'DEPT_MANAGER') {
            // 현재 로그인한 사용자의 부서 정보 조회 (세션에 없을 수 있으므로 DB에서 조회)
            const [currentManager] = await pool.execute(
                'SELECT department_id FROM users WHERE email = ?',
                [req.session.user.email]
            );
            
            const managerDepartmentId = currentManager.length > 0 ? currentManager[0].department_id : null;
            
            if (!managerDepartmentId || user.department_id !== managerDepartmentId) {
                return res.status(403).json({
                    success: false,
                    message: '본인 부서의 직원만 비활성화할 수 있습니다.'
                });
            }
        }
        
        // 활성 상태(is_active = 1)인지 확인
        if (user.is_active !== 1) {
            const statusMessage = user.is_active === 0 ? '승인대기 상태입니다.' : 
                                 user.is_active === 2 ? '이미 비활성화된 계정입니다.' : 
                                 '알 수 없는 상태입니다.';
            return res.status(400).json({
                success: false,
                message: `활성 상태의 계정만 비활성화할 수 있습니다. (현재: ${statusMessage})`
            });
        }
        
        // 퇴사일 설정 (요청에 포함된 경우 사용, 없으면 오늘 날짜)
        const resignDate = resign_date || new Date().toISOString().split('T')[0];
        
        // 계정 비활성화 실행 (1 -> 2로 변경) 및 퇴사일 기록
        await pool.execute(`
            UPDATE users 
            SET is_active = 2, 
                resign_date = ?,
                updated_at = NOW()
            WHERE email = ?
        `, [resignDate, email]);
        
        // 활동 로그 기록
        await logUserActivity(
            email,
            req.session.user.email,
            'DEACTIVATE',
            1, // 이전 상태: 활성
            2, // 새로운 상태: 비활성
            notes || `관리자에 의한 계정 비활성화`
        );
        
        console.log('계정 비활성화:', { 
            target: email, 
            by: req.session.user.email,
            notes: notes 
        });
        
        res.json({
            success: true,
            message: '계정이 성공적으로 비활성화되었습니다.',
            data: {
                email: email,
                name: user.name,
                deactivated_by: req.session.user.email,
                deactivated_at: new Date(),
                notes: notes
            }
        });
        
    } catch (error) {
        console.error('계정 비활성화 오류:', error);
        res.status(500).json({
            success: false,
            message: '계정 비활성화 중 오류가 발생했습니다.'
        });
    }
});

// 계정 재활성화 API
router.patch('/employees/:email/activate', requireAuth, async (req, res) => {
    try {
        const { email } = req.params;
        const { notes } = req.body; // 재활성화 사유 (선택사항)
        
        // 권한 확인 (SUPER_ADMIN만 가능)
        if (req.session.user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({
                success: false,
                message: '최고관리자만 계정을 재활성화할 수 있습니다.'
            });
        }
        
        // 현재 사용자 정보 조회
        const [currentUser] = await pool.execute(
            'SELECT email, name, is_active FROM users WHERE email = ?',
            [email]
        );
        
        if (currentUser.length === 0) {
            return res.status(404).json({
                success: false,
                message: '해당 사용자를 찾을 수 없습니다.'
            });
        }
        
        const user = currentUser[0];
        
        // 비활성 상태(is_active = 2)인지 확인
        if (user.is_active !== 2) {
            const statusMessage = user.is_active === 0 ? '승인대기 상태입니다.' : 
                                 user.is_active === 1 ? '이미 활성화된 계정입니다.' : 
                                 '알 수 없는 상태입니다.';
            return res.status(400).json({
                success: false,
                message: `비활성 상태의 계정만 재활성화할 수 있습니다. (현재: ${statusMessage})`
            });
        }
        
        // 계정 재활성화 실행
        await pool.execute(`
            UPDATE users 
            SET is_active = 1, updated_at = NOW()
            WHERE email = ?
        `, [email]);
        
        // 활동 로그 기록
        await logUserActivity(
            email,
            req.session.user.email,
            'ACTIVATE',
            2, // 이전 상태: 비활성
            1, // 새로운 상태: 활성
            notes || `최고관리자에 의한 계정 재활성화`
        );
        
        console.log('계정 재활성화:', { 
            target: email, 
            by: req.session.user.email,
            notes: notes 
        });
        
        res.json({
            success: true,
            message: '계정이 성공적으로 재활성화되었습니다.',
            data: {
                email: email,
                name: user.name,
                activated_by: req.session.user.email,
                activated_at: new Date(),
                notes: notes
            }
        });
        
    } catch (error) {
        console.error('계정 재활성화 오류:', error);
        res.status(500).json({
            success: false,
            message: '계정 재활성화 중 오류가 발생했습니다.'
        });
    }
});

// 사용자 활동 로그 조회 API (선택사항)
router.get('/employees/:email/activity-logs', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { email } = req.params;
        const { limit = 50, page = 1 } = req.query;
        
        const offset = (parseInt(page) - 1) * parseInt(limit);
        
        // 권한 확인 (본인 또는 관리자)
        if (req.session.user.email !== email && 
            !['SUPER_ADMIN', 'SYSTEM_ADMIN'].includes(req.session.user.role)) {
            return res.status(403).json({
                success: false,
                message: '활동 로그 조회 권한이 없습니다.'
            });
        }
        
        const [logs] = await pool.execute(`
            SELECT 
                id, user_email, action_by, action, 
                old_status, new_status, notes, created_at
            FROM user_activity_logs 
            WHERE user_email = ?
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        `, [email, parseInt(limit), offset]);
        
        // 관리자 이름 정보 추가
        const enrichedLogs = await Promise.all(logs.map(async (log) => {
            const [adminInfo] = await pool.execute(
                'SELECT name FROM users WHERE email = ?',
                [log.action_by]
            );
            
            return {
                ...log,
                action_by_name: adminInfo.length > 0 ? adminInfo[0].name : log.action_by
            };
        }));
        
        res.json({
            success: true,
            data: {
                logs: enrichedLogs,
                pagination: {
                    current_page: parseInt(page),
                    limit: parseInt(limit),
                    total_count: logs.length
                }
            }
        });
        
    } catch (error) {
        console.error('활동 로그 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '활동 로그 조회 중 오류가 발생했습니다.'
        });
    }
});

// 기존 PUT 라우터에도 로깅 추가 (선택사항)
// 기존 router.put('/employees/:email', ...) 에서 is_active 변경 시에도 로그 남기기
// updateFields에서 is_active 변경을 감지하면 logUserActivity 호출

module.exports = router;
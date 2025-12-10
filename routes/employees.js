// ==============================
// routes/staff/employees.js - 직원 관리 라우터
// ==============================
const express = require('express');
const { pool } = require('../../config/database'); // 상위 두 레벨로 변경
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

// 직원 목록 조회 API
router.get('/employees', requireAuth, requireAdmin, async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            status = '', // all, active, inactive, pending
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

        // 상태별 필터
        switch (status) {
            case 'active':
                whereConditions.push('u.is_active = 1');
                break;
            case 'inactive':
                whereConditions.push('u.is_active = 0');
                break;
            case 'pending':
                whereConditions.push('u.is_active = 0');
                break;
        }

        // 부서별 필터
        if (department) {
            whereConditions.push('u.department_id = ?');
            queryParams.push(department);
        }

        // 권한별 필터
        if (role) {
            whereConditions.push('u.role = ?');
            queryParams.push(role);
        }

        // 검색 조건
        if (search) {
            whereConditions.push('(u.name LIKE ? OR u.email LIKE ? OR u.employee_id LIKE ? OR u.phone LIKE ?)');
            const searchTerm = `%${search}%`;
            queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        // 부서 권한 제한 (DEPT_MANAGER는 자신의 부서만)
        if (req.session.user.role === 'DEPT_MANAGER' && req.session.user.department_id) {
            whereConditions.push('u.department_id = ?');
            queryParams.push(req.session.user.department_id);
        }

        const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

        // 정렬 조건
        const validSortFields = ['created_at', 'name', 'email', 'role', 'last_login_at'];
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
        const sortDirection = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

        // 전체 개수 조회
        const countQuery = `
            SELECT COUNT(*) as total
            FROM users u
            LEFT JOIN departments d ON u.department_id = d.id
            ${whereClause}
        `;
        
        const [countResult] = await pool.execute(countQuery, queryParams);
        const totalCount = countResult[0].total;

        // 직원 목록 조회
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
            LIMIT ? OFFSET ?
        `;

        const [employees] = await pool.execute(employeesQuery, [...queryParams, limitNum, offset]);

        // 통계 정보 조회
        const statsQuery = `
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active,
                SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as pending,
                COUNT(CASE WHEN role = 'SUPER_ADMIN' THEN 1 END) as super_admin,
                COUNT(CASE WHEN role = 'DEPT_MANAGER' THEN 1 END) as dept_manager,
                COUNT(CASE WHEN role = 'SYSTEM_ADMIN' THEN 1 END) as system_admin,
                COUNT(CASE WHEN role = 'EMPLOYEE' THEN 1 END) as employee
            FROM users u
            ${req.session.user.role === 'DEPT_MANAGER' && req.session.user.department_id ? 
                'WHERE u.department_id = ' + req.session.user.department_id : ''}
        `;

        const [stats] = await pool.execute(statsQuery);

        // 응답 데이터 구성
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
                    role: emp.role,
                    work_type: emp.work_type,
                    work_schedule: emp.work_schedule,
                    status: emp.is_active ? 'active' : 'pending',
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
                statistics: stats[0],
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

// 직원 상세 조회 API
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

// 직원 정보 수정 API
router.put('/employees/:email', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { email } = req.params;
        const {
            name,
            phone,
            employee_id,
            department_id,
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

        // 사번 중복 체크 (다른 직원이 사용중인 경우)
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
            updateValues.push(employee_id);
        }
        if (department_id !== undefined) {
            updateFields.push('department_id = ?');
            updateValues.push(department_id);
        }
        if (position !== undefined) {
            updateFields.push('position = ?');
            updateValues.push(position);
        }
        if (hire_date !== undefined) {
            updateFields.push('hire_date = ?');
            updateValues.push(hire_date);
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

module.exports = router;
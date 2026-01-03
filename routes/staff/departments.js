// ==============================
// routes/staff/departments.js - 부서 관리 API 라우터
// ==============================

const express = require('express');
const router = express.Router();
const { pool } = require('../../config/database');

// 미들웨어: 인증 및 권한 체크
const { requireAuth, requireRole } = require('../../middleware/auth');

// ==============================
// 0. 부서 목록 조회 (조직도용 - 모든 사용자 접근 가능)
// GET /api/staff/departments
// ==============================
router.get('/', requireAuth, async (req, res) => {
    try {
        const query = `
            SELECT 
                d.id,
                d.name,
                d.code,
                d.description,
                d.manager_id,
                d.is_active,
                u.name as manager_name
            FROM departments d
            LEFT JOIN users u ON d.manager_id = u.email
            WHERE d.is_active = 1
            ORDER BY d.name ASC
        `;

        const [departments] = await pool.execute(query);

        res.json({
            success: true,
            data: departments,
            message: '부서 목록을 조회했습니다.'
        });

    } catch (error) {
        console.error('부서 목록 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '부서 목록을 조회할 수 없습니다.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ==============================
// 1. 관리용 부서 목록 조회 (상세 정보 포함)
// GET /api/staff/departments/manage
// ==============================
router.get('/manage', requireRole(['SUPER_ADMIN', 'SYSTEM_ADMIN', 'DEPT_MANAGER']), async (req, res) => {
    try {
        const userRole = req.session.user.role;
        
        // DEPT_MANAGER의 경우 본인 부서 ID 조회 (세션에 없을 수 있으므로 DB에서 조회)
        let userDepartmentId = req.session.user.department_id;
        if (userRole === 'DEPT_MANAGER' && !userDepartmentId) {
            const [userInfo] = await pool.execute(
                'SELECT department_id FROM users WHERE email = ?',
                [req.session.user.email]
            );
            userDepartmentId = userInfo.length > 0 ? userInfo[0].department_id : null;
        }
        
        // DEPT_MANAGER의 경우 본인 부서만 조회하도록 제한
        let queryParams = [];
        let whereClause = '';
        if (userRole === 'DEPT_MANAGER' && userDepartmentId) {
            whereClause = 'WHERE d.id = ?';
            queryParams.push(userDepartmentId);
        }
        
        const query = `
            SELECT 
                d.id,
                d.name,
                d.code,
                d.description,
                d.manager_id,
                d.created_at,
                d.updated_at,
                d.is_active,
                u.name as manager_name,
                COUNT(emp.email) as employee_count
            FROM departments d
            LEFT JOIN users u ON d.manager_id = u.email
            LEFT JOIN users emp ON emp.department_id = d.id AND emp.is_active = 1
            ${whereClause}
            GROUP BY d.id, d.name, d.code, d.description, d.manager_id, d.created_at, d.updated_at, d.is_active, u.name
            ORDER BY d.is_active DESC, d.created_at DESC
        `;

        const [departments] = await pool.execute(query, queryParams);

        res.json({
            success: true,
            data: departments,
            message: '부서 목록을 조회했습니다.'
        });

    } catch (error) {
        console.error('부서 관리 목록 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '부서 목록을 조회할 수 없습니다.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ==============================
// 2. 새 부서 생성
// POST /api/staff/departments
// ==============================
router.post('/', requireRole(['SUPER_ADMIN', 'SYSTEM_ADMIN']), async (req, res) => {
    try {
        const { code, name, description, manager_id, is_active = 1 } = req.body;

        // 입력 검증
        if (!code || !name) {
            return res.status(400).json({
                success: false,
                message: '부서코드와 부서명은 필수입니다.'
            });
        }

        if (code.length > 20) {
            return res.status(400).json({
                success: false,
                message: '부서코드는 20자 이내로 입력하세요.'
            });
        }

        if (name.length > 50) {
            return res.status(400).json({
                success: false,
                message: '부서명은 50자 이내로 입력하세요.'
            });
        }

        // 부서코드 중복 체크
        const [existingDept] = await pool.execute(
            'SELECT id FROM departments WHERE code = ?',
            [code.toUpperCase()]
        );

        if (existingDept.length > 0) {
            return res.status(400).json({
                success: false,
                message: '이미 존재하는 부서코드입니다.'
            });
        }

        // 부서장 유효성 체크 (선택사항)
        if (manager_id) {
            const [manager] = await pool.execute(
                'SELECT email, role FROM users WHERE email = ? AND is_active = 1',
                [manager_id]
            );

            if (manager.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: '유효하지 않은 부서장입니다.'
                });
            }

            // 부서장 권한 체크
            const validRoles = ['SUPER_ADMIN', 'DEPT_MANAGER', 'SYSTEM_ADMIN'];
            if (!validRoles.includes(manager[0].role)) {
                return res.status(400).json({
                    success: false,
                    message: '해당 직원은 부서장 권한이 없습니다.'
                });
            }
        }

        // 부서 생성
        const insertQuery = `
            INSERT INTO departments (code, name, description, manager_id, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, NOW(), NOW())
        `;

        const [result] = await pool.execute(insertQuery, [
            code.toUpperCase(),
            name,
            description || null,
            manager_id || null,
            is_active
        ]);

        // 생성된 부서 정보 조회
        const [newDepartment] = await pool.execute(`
            SELECT 
                d.id,
                d.name,
                d.code,
                d.description,
                d.manager_id,
                d.is_active,
                d.created_at,
                u.name as manager_name
            FROM departments d
            LEFT JOIN users u ON d.manager_id = u.email
            WHERE d.id = ?
        `, [result.insertId]);

        res.status(201).json({
            success: true,
            data: newDepartment[0],
            message: '부서가 성공적으로 생성되었습니다.'
        });

    } catch (error) {
        console.error('부서 생성 오류:', error);
        
        // MySQL 제약조건 오류 처리
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                success: false,
                message: '이미 존재하는 부서코드입니다.'
            });
        }

        res.status(500).json({
            success: false,
            message: '부서 생성 중 오류가 발생했습니다.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ==============================
// 3. 특정 부서 정보 조회
// GET /api/staff/departments/:id
// ==============================
router.get('/:id', requireRole(['SUPER_ADMIN', 'SYSTEM_ADMIN', 'DEPT_MANAGER']), async (req, res) => {
    try {
        const { id } = req.params;

        const query = `
            SELECT 
                d.id,
                d.name,
                d.code,
                d.description,
                d.manager_id,
                d.created_at,
                d.updated_at,
                d.is_active,
                u.name as manager_name,
                u.role as manager_role,
                COUNT(emp.email) as employee_count
            FROM departments d
            LEFT JOIN users u ON d.manager_id = u.email
            LEFT JOIN users emp ON emp.department_id = d.id AND emp.is_active = 1
            WHERE d.id = ?
            GROUP BY d.id, d.name, d.code, d.description, d.manager_id, d.created_at, d.updated_at, d.is_active, u.name, u.role
        `;

        const [department] = await pool.execute(query, [id]);

        if (department.length === 0) {
            return res.status(404).json({
                success: false,
                message: '해당 부서를 찾을 수 없습니다.'
            });
        }

        res.json({
            success: true,
            data: department[0],
            message: '부서 정보를 조회했습니다.'
        });

    } catch (error) {
        console.error('부서 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '부서 정보를 조회할 수 없습니다.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ==============================
// 4. 부서 정보 수정
// PUT /api/staff/departments/:id
// ==============================
router.put('/:id', requireRole(['SUPER_ADMIN', 'SYSTEM_ADMIN']), async (req, res) => {
    try {
        const { id } = req.params;
        const { code, name, description, manager_id, is_active } = req.body;

        // 입력 검증
        if (!code || !name) {
            return res.status(400).json({
                success: false,
                message: '부서코드와 부서명은 필수입니다.'
            });
        }

        // 부서 존재 여부 확인
        const [existingDept] = await pool.execute(
            'SELECT id, code FROM departments WHERE id = ?',
            [id]
        );

        if (existingDept.length === 0) {
            return res.status(404).json({
                success: false,
                message: '해당 부서를 찾을 수 없습니다.'
            });
        }

        // 부서코드 중복 체크 (자기 자신 제외)
        if (code.toUpperCase() !== existingDept[0].code) {
            const [duplicateDept] = await pool.execute(
                'SELECT id FROM departments WHERE code = ? AND id != ?',
                [code.toUpperCase(), id]
            );

            if (duplicateDept.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: '이미 존재하는 부서코드입니다.'
                });
            }
        }

        // 비활성화 시 소속 직원 체크
        if (is_active === 0) {
            const [employeeCount] = await pool.execute(
                'SELECT COUNT(*) as count FROM users WHERE department_id = ? AND is_active = 1',
                [id]
            );

            if (employeeCount[0].count > 0) {
                return res.status(400).json({
                    success: false,
                    message: '소속 직원이 있는 부서는 비활성화할 수 없습니다. 먼저 직원들을 다른 부서로 이동시켜 주세요.'
                });
            }
        }

        // 부서장 유효성 체크
        if (manager_id) {
            const [manager] = await pool.execute(
                'SELECT email, role FROM users WHERE email = ? AND is_active = 1',
                [manager_id]
            );

            if (manager.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: '유효하지 않은 부서장입니다.'
                });
            }

            const validRoles = ['SUPER_ADMIN', 'DEPT_MANAGER', 'SYSTEM_ADMIN'];
            if (!validRoles.includes(manager[0].role)) {
                return res.status(400).json({
                    success: false,
                    message: '해당 직원은 부서장 권한이 없습니다.'
                });
            }
        }

        // 부서 정보 업데이트
        const updateQuery = `
            UPDATE departments 
            SET code = ?, name = ?, description = ?, manager_id = ?, is_active = ?, updated_at = NOW()
            WHERE id = ?
        `;

        await pool.execute(updateQuery, [
            code.toUpperCase(),
            name,
            description || null,
            manager_id || null,
            is_active,
            id
        ]);

        // 수정된 부서 정보 조회
        const [updatedDepartment] = await pool.execute(`
            SELECT 
                d.id,
                d.name,
                d.code,
                d.description,
                d.manager_id,
                d.is_active,
                d.updated_at,
                u.name as manager_name,
                COUNT(emp.email) as employee_count
            FROM departments d
            LEFT JOIN users u ON d.manager_id = u.email
            LEFT JOIN users emp ON emp.department_id = d.id AND emp.is_active = 1
            WHERE d.id = ?
            GROUP BY d.id, d.name, d.code, d.description, d.manager_id, d.is_active, d.updated_at, u.name
        `, [id]);

        res.json({
            success: true,
            data: updatedDepartment[0],
            message: '부서 정보가 성공적으로 수정되었습니다.'
        });

    } catch (error) {
        console.error('부서 수정 오류:', error);
        res.status(500).json({
            success: false,
            message: '부서 정보 수정 중 오류가 발생했습니다.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ==============================
// 5. 부서 삭제
// DELETE /api/staff/departments/:id
// ==============================
router.delete('/:id', requireRole(['SUPER_ADMIN']), async (req, res) => {
    try {
        const { id } = req.params;

        // 부서 존재 여부 및 소속 직원 수 확인
        const [departmentInfo] = await pool.execute(`
            SELECT 
                d.id,
                d.name,
                d.code,
                COUNT(u.email) as employee_count
            FROM departments d
            LEFT JOIN users u ON u.department_id = d.id AND u.is_active = 1
            WHERE d.id = ?
            GROUP BY d.id, d.name, d.code
        `, [id]);

        if (departmentInfo.length === 0) {
            return res.status(404).json({
                success: false,
                message: '해당 부서를 찾을 수 없습니다.'
            });
        }

        // 소속 직원이 있는지 확인
        if (departmentInfo[0].employee_count > 0) {
            return res.status(400).json({
                success: false,
                message: '소속 직원이 있는 부서는 삭제할 수 없습니다. 먼저 모든 직원을 다른 부서로 이동시켜 주세요.'
            });
        }

        // 최소 1개 부서는 유지 (선택사항)
        const [totalDepts] = await pool.execute('SELECT COUNT(*) as count FROM departments WHERE is_active = 1');
        if (totalDepts[0].count <= 1) {
            return res.status(400).json({
                success: false,
                message: '최소 1개의 활성 부서는 유지되어야 합니다.'
            });
        }

        // 부서 삭제 (실제 삭제)
        await pool.execute('DELETE FROM departments WHERE id = ?', [id]);

        res.json({
            success: true,
            message: `'${departmentInfo[0].name}' 부서가 성공적으로 삭제되었습니다.`
        });

    } catch (error) {
        console.error('부서 삭제 오류:', error);
        
        // 외래키 제약조건 오류 처리
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({
                success: false,
                message: '다른 데이터에서 참조되고 있는 부서는 삭제할 수 없습니다.'
            });
        }

        res.status(500).json({
            success: false,
            message: '부서 삭제 중 오류가 발생했습니다.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ==============================
// 6. 부서별 직원 목록 조회
// GET /api/staff/departments/:id/employees
// ==============================
router.get('/:id/employees', requireRole(['SUPER_ADMIN', 'SYSTEM_ADMIN', 'DEPT_MANAGER']), async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 50 } = req.query;
        
        const offset = (page - 1) * limit;

        // 부서 존재 확인
        const [department] = await pool.execute('SELECT name FROM departments WHERE id = ?', [id]);
        if (department.length === 0) {
            return res.status(404).json({
                success: false,
                message: '해당 부서를 찾을 수 없습니다.'
            });
        }

        // 부서 직원 목록 조회
        const employeesQuery = `
            SELECT 
                u.email,
                u.name,
                u.phone,
                u.employee_id,
                u.position,
                u.role,
                u.hire_date,
                u.is_active,
                u.created_at,
                u.last_login_at
            FROM users u
            WHERE u.department_id = ?
            ORDER BY u.is_active DESC, u.name ASC
            LIMIT ? OFFSET ?
        `;

        const [employees] = await pool.execute(employeesQuery, [id, parseInt(limit), offset]);

        // 총 직원 수 조회
        const [totalCount] = await pool.execute(
            'SELECT COUNT(*) as count FROM users WHERE department_id = ?',
            [id]
        );

        const total = totalCount[0].count;
        const totalPages = Math.ceil(total / limit);

        res.json({
            success: true,
            data: {
                department: department[0],
                employees,
                pagination: {
                    current_page: parseInt(page),
                    total_pages: totalPages,
                    total_count: total,
                    limit: parseInt(limit),
                    has_next: page < totalPages,
                    has_prev: page > 1
                }
            },
            message: '부서 직원 목록을 조회했습니다.'
        });

    } catch (error) {
        console.error('부서 직원 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '부서 직원 목록을 조회할 수 없습니다.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;
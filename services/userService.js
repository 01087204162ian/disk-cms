// ==============================
// services/userService.js - 사용자 서비스 (구문 오류 수정 버전)
// ==============================
const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class UserService {
    static async getDepartments() {
        const [rows] = await pool.execute(
            'SELECT id, name, code, description FROM departments ORDER BY name'
        );
        return rows;
    }
	// 기본 테스트 메서드
	// userService.js에 테스트 메서드 추가

    // 검색 및 필터링을 지원하는 사용자 목록 조회
    // 검색 및 필터링을 지원하는 사용자 목록 조회 (수정된 버전)
	// 수정된 getUsersWithSearch 메서드 (더 안전한 버전)
		// 로그인 방식을 모방한 getUsersWithSearch (단계별 쿼리)
// userService.js에서 기존 getUsersWithSearch를 이것으로 교체
	static async getUsersWithSearch({ 
		page = 1, 
		limit = 10, 
		search = null, 
		department = null, 
		role = null, 
		status = 'active',
		currentUser = null 
	}) {
		try {
			console.log('=== 최종 해결된 getUsersWithSearch ===');
			
			page = Math.max(1, parseInt(page) || 1);
			limit = Math.max(1, Math.min(100, parseInt(limit) || 10));
			
			// 단일 파라미터로 모든 사용자 조회 (로그인 방식과 동일)
			const [allUsers] = await pool.execute(
				`SELECT 
					u.email, u.name, u.phone, u.employee_id, u.department_id,
					u.position, u.hire_date, u.role, u.work_type, u.work_schedule,
					u.is_active, u.last_login_at, u.created_at, u.updated_at,
					d.name as department_name
				FROM users u
				LEFT JOIN departments d ON u.department_id = d.id
				WHERE u.is_active = ?
				ORDER BY u.created_at DESC`,
				[status === 'inactive' ? 0 : 1]
			);

			console.log('전체 사용자 조회 성공:', allUsers.length);

			// JavaScript에서 필터링
			let filteredUsers = allUsers;

			// 부서장 권한 체크
			if (currentUser && currentUser.role === 'DEPT_MANAGER' && currentUser.department_id) {
				filteredUsers = filteredUsers.filter(user => 
					user.department_id === parseInt(currentUser.department_id)
				);
			}

			// 검색 필터
			if (search && typeof search === 'string' && search.trim()) {
				const searchTerm = search.trim().toLowerCase();
				filteredUsers = filteredUsers.filter(user => 
					(user.name && user.name.toLowerCase().includes(searchTerm)) ||
					(user.email && user.email.toLowerCase().includes(searchTerm)) ||
					(user.employee_id && user.employee_id.toLowerCase().includes(searchTerm))
				);
			}

			// 부서 필터
			if (department && (!currentUser || currentUser.role !== 'DEPT_MANAGER') && !isNaN(parseInt(department))) {
				filteredUsers = filteredUsers.filter(user => 
					user.department_id === parseInt(department)
				);
			}

			// 역할 필터
			if (role && typeof role === 'string' && role.trim()) {
				filteredUsers = filteredUsers.filter(user => user.role === role.trim());
			}

			// JavaScript에서 페이징
			const totalCount = filteredUsers.length;
			const totalPages = Math.ceil(totalCount / limit);
			const offset = (page - 1) * limit;
			const paginatedUsers = filteredUsers.slice(offset, offset + limit);

			console.log('필터링 및 페이징 완료:', {
				totalFiltered: totalCount,
				currentPage: page,
				totalPages
			});

			return {
				users: paginatedUsers,
				totalCount,
				totalPages,
				currentPage: page
			};

		} catch (error) {
			console.error('사용자 목록 조회 오류:', error);
			throw new Error('사용자 목록 조회에 실패했습니다.');
		}
	}

    // 이메일로 사용자 조회
    static async getUserByEmail(email) {
        try {
            const query = `
                SELECT 
                    u.email,
                    u.name,
                    u.phone,
                    u.employee_id,
                    u.department_id,
                    u.position,
                    u.hire_date,
                    u.role,
                    u.work_type,
                    u.work_schedule,
                    u.is_active,
                    u.last_login_at,
                    u.created_at,
                    u.updated_at,
                    d.name as department_name
                FROM users u
                LEFT JOIN departments d ON u.department_id = d.id
                WHERE u.email = ?
            `;

            const [rows] = await pool.execute(query, [email]);
            return rows[0] || null;

        } catch (error) {
            console.error('사용자 조회 오류:', error);
            throw new Error('사용자 조회에 실패했습니다.');
        }
    }

    // 새 사용자 생성
    static async createUser(userData) {
        try {
            const { 
                email, 
                password, 
                name, 
                phone, 
                employee_id, 
                department_id, 
                position,
                hire_date,
                role, 
                work_type, 
                work_schedule 
            } = userData;

            // 이메일 중복 확인
            const existingUser = await this.getUserByEmail(email);
            if (existingUser) {
                throw new Error('이미 존재하는 이메일입니다.');
            }

            // 사번 중복 확인 (있는 경우)
            if (employee_id) {
                const [existingEmp] = await pool.execute(
                    'SELECT email FROM users WHERE employee_id = ?', 
                    [employee_id]
                );
                if (existingEmp.length > 0) {
                    throw new Error('이미 존재하는 사번입니다.');
                }
            }

            // 비밀번호 해싱
            const hashedPassword = await bcrypt.hash(password, 12);

            const query = `
                INSERT INTO users (
                    email, password, name, phone, employee_id, department_id, 
                    position, hire_date, role, work_type, work_schedule, 
                    is_active, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())
            `;

            await pool.execute(query, [
                email, hashedPassword, name, phone, employee_id, department_id,
                position, hire_date, role, work_type || 'FULL_TIME', work_schedule || '4_DAY'
            ]);

            // 생성된 사용자 정보 반환 (비밀번호 제외)
            return await this.getUserByEmail(email);

        } catch (error) {
            console.error('사용자 생성 오류:', error);
            throw new Error(error.message || '사용자 생성에 실패했습니다.');
        }
    }

    // 이메일로 사용자 정보 수정
    static async updateUserByEmail(email, updateData) {
        try {
            const { 
                name, 
                phone, 
                employee_id, 
                department_id, 
                position,
                hire_date,
                role, 
                work_type, 
                work_schedule 
            } = updateData;

            // 사용자 존재 확인
            const existingUser = await this.getUserByEmail(email);
            if (!existingUser) {
                throw new Error('존재하지 않는 사용자입니다.');
            }

            // 사번 중복 확인 (변경하는 경우)
            if (employee_id && employee_id !== existingUser.employee_id) {
                const [existingEmp] = await pool.execute(
                    'SELECT email FROM users WHERE employee_id = ? AND email != ?', 
                    [employee_id, email]
                );
                if (existingEmp.length > 0) {
                    throw new Error('이미 존재하는 사번입니다.');
                }
            }

            const query = `
                UPDATE users 
                SET name = ?, phone = ?, employee_id = ?, department_id = ?, 
                    position = ?, hire_date = ?, role = ?, work_type = ?, 
                    work_schedule = ?, updated_at = NOW()
                WHERE email = ?
            `;

            await pool.execute(query, [
                name, phone, employee_id, department_id, position, hire_date,
                role, work_type, work_schedule, email
            ]);

            return true;

        } catch (error) {
            console.error('사용자 수정 오류:', error);
            throw new Error(error.message || '사용자 정보 수정에 실패했습니다.');
        }
    }

    // 이메일로 사용자 비활성화
    static async deactivateUserByEmail(email) {
        try {
            // 사용자 존재 확인
            const existingUser = await this.getUserByEmail(email);
            if (!existingUser) {
                throw new Error('존재하지 않는 사용자입니다.');
            }

            const query = `
                UPDATE users 
                SET is_active = 0, updated_at = NOW()
                WHERE email = ?
            `;

            await pool.execute(query, [email]);
            return true;

        } catch (error) {
            console.error('사용자 비활성화 오류:', error);
            throw new Error(error.message || '사용자 비활성화에 실패했습니다.');
        }
    }

    // 간단한 테스트용 메서드 (디버깅용)
    static async getUsersTest() {
        try {
            console.log('=== 기본 테스트 시작 ===');
            
            // 1. 가장 간단한 쿼리
            const simpleQuery = 'SELECT COUNT(*) as total FROM users';
            const [countResult] = await pool.execute(simpleQuery);
            console.log('총 사용자 수:', countResult[0].total);
            
            // 2. 파라미터 1개 쿼리
            const paramQuery = 'SELECT COUNT(*) as total FROM users WHERE is_active = ?';
            const [paramResult] = await pool.execute(paramQuery, [1]);
            console.log('활성 사용자 수:', paramResult[0].total);
            
            // 3. LIMIT 쿼리
            const limitQuery = 'SELECT email, name FROM users LIMIT ? OFFSET ?';
            const [limitResult] = await pool.execute(limitQuery, [5, 0]);
            console.log('LIMIT 쿼리 결과:', limitResult.length);
            
            return { success: true, message: '모든 테스트 통과' };
            
        } catch (error) {
            console.error('테스트 쿼리 오류:', error);
            throw error;
        }
    }

    // ==============================
    // 기존 메서드들 (호환성 유지)
    // ==============================
    
    static async getUsers({ page = 1, limit = 10, department_id, status = 'active' }) {
        const offset = (page - 1) * limit;
        let whereConditions = [];
        let params = [];

        // is_active 조건으로 변경
        if (status === 'active') {
            whereConditions.push('u.is_active = 1');
        } else if (status === 'inactive') {
            whereConditions.push('u.is_active = 0');
        }

        if (department_id) {
            whereConditions.push('u.department_id = ?');
            params.push(department_id);
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        // 전체 카운트
        const [countResult] = await pool.execute(
            `SELECT COUNT(*) as total FROM users u ${whereClause}`,
            params
        );

        // 사용자 목록
        const [users] = await pool.execute(
            `SELECT 
                u.email, u.name, u.phone, u.employee_id, 
                u.role, u.hire_date, u.is_active, u.created_at,
                d.name as department_name
             FROM users u 
             LEFT JOIN departments d ON u.department_id = d.id 
             ${whereClause}
             ORDER BY u.created_at DESC 
             LIMIT ? OFFSET ?`,
            [...params, parseInt(limit), offset]
        );

        return {
            users: users.map(user => {
                const { password, ...userWithoutPassword } = user;
                return userWithoutPassword;
            }),
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: countResult[0].total,
                totalPages: Math.ceil(countResult[0].total / limit)
            }
        };
    }

    static async updateUser(userEmail, updateData) {
        const allowedFields = ['name', 'phone', 'department_id', 'position', 'role', 'work_type', 'work_schedule'];
        const fields = [];
        const values = [];

        for (const [key, value] of Object.entries(updateData)) {
            if (allowedFields.includes(key) && value !== undefined) {
                fields.push(`${key} = ?`);
                values.push(value);
            }
        }

        if (fields.length === 0) {
            throw new Error('수정할 데이터가 없습니다.');
        }

        values.push(userEmail);

        await pool.execute(
            `UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE email = ?`,
            values
        );
    }

    static async deactivateUser(userEmail) {
        const [result] = await pool.execute(
            'UPDATE users SET is_active = 0, updated_at = NOW() WHERE email = ?',
            [userEmail]
        );

        if (result.affectedRows === 0) {
            throw new Error('사용자를 찾을 수 없습니다.');
        }
    }

    static async getUserById(userEmail) {
        return await this.getUserByEmail(userEmail);
    }
}

module.exports = UserService;
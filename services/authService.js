// ==============================
// services/authService.js - 인증 서비스
// ==============================
const bcrypt = require('bcrypt');
const { pool } = require('../config/database');

class AuthService {
    static async hashPassword(password) {
        return await bcrypt.hash(password, 10);
    }

    static async verifyPassword(password, hash) {
        return await bcrypt.compare(password, hash);
    }

    static async loginUser(username, password) {
        const [rows] = await pool.execute(
            `SELECT u.*, d.name as department_name 
             FROM users u 
             JOIN departments d ON u.department_id = d.id 
             WHERE u.username = ? AND u.status = 'active'`,
            [username]
        );

        if (rows.length === 0) {
            throw new Error('사용자명 또는 비밀번호가 올바르지 않습니다.');
        }

        const user = rows[0];
        const isValidPassword = await this.verifyPassword(password, user.password);

        if (!isValidPassword) {
            throw new Error('사용자명 또는 비밀번호가 올바르지 않습니다.');
        }

        // 비밀번호 제외하고 사용자 정보 반환
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    static async createUser(userData) {
        const { 
            username, password, name, email, phone, 
            department_id, role, hire_date 
        } = userData;

        // 사용자명 중복 확인
        const [existingUser] = await pool.execute(
            'SELECT id FROM users WHERE username = ?',
            [username]
        );

        if (existingUser.length > 0) {
            throw new Error('이미 존재하는 사용자명입니다.');
        }

        // 이메일 중복 확인
        if (email) {
            const [existingEmail] = await pool.execute(
                'SELECT id FROM users WHERE email = ?',
                [email]
            );

            if (existingEmail.length > 0) {
                throw new Error('이미 존재하는 이메일입니다.');
            }
        }

        const hashedPassword = await this.hashPassword(password);

        const [result] = await pool.execute(
            `INSERT INTO users (username, password, name, email, phone, department_id, role, hire_date, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
            [username, hashedPassword, name, email, phone, department_id, role, hire_date]
        );

        return result.insertId;
    }
}

module.exports = AuthService;
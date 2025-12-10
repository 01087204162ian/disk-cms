// ==============================
// routes/auth.js - 회원가입 라우터
// ==============================
const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const crypto = require('crypto');
const { sendPasswordResetEmail } = require('../config/email');
const router = express.Router();
// routes/auth.js 파일 맨 위에 추가
const requireAuth = (req, res, next) => {
    if (!req.session?.user) {
        return res.status(401).json({
            success: false,
            message: '로그인이 필요합니다.'
        });
    }
    next();
};

const requireAdmin = (req, res, next) => {
    if (!req.session?.user || !['SUPER_ADMIN', 'DEPT_MANAGER', 'SYSTEM_ADMIN'].includes(req.session.user.role)) {
        return res.status(403).json({
            success: false,
            message: '관리자 권한이 필요합니다.'
        });
    }
    next();
};

// 기존 코드 계속...
// 회원가입 API
router.post('/signup', async (req, res) => {
    try {
        console.log('회원가입 요청:', req.body);
        
        const { email, password, name, phone } = req.body;

        // 필수 필드 검증
        if (!email || !password || !name || !phone) {
            return res.status(400).json({
                success: false,
                message: '모든 필수 필드를 입력해주세요.',
                missing: {
                    email: !email,
                    password: !password,
                    name: !name,
                    phone: !phone
                }
            });
        }

        // 이메일 형식 검증
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: '올바른 이메일 형식을 입력해주세요.'
            });
        }

        // 휴대폰번호 형식 검증
        const phoneRegex = /^01[0-9]-\d{4}-\d{4}$/;
        if (!phoneRegex.test(phone)) {
            return res.status(400).json({
                success: false,
                message: '올바른 휴대폰번호 형식을 입력해주세요. (예: 010-1234-5678)'
            });
        }

        // 비밀번호 길이 검증
        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: '비밀번호는 8자 이상이어야 합니다.'
            });
        }

        // 이메일 중복 확인
        const [existingUsers] = await pool.execute(
            'SELECT email FROM users WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                success: false,
                message: '이미 등록된 이메일입니다.',
                field: 'email'
            });
        }

        // 휴대폰번호 중복 확인
        const [existingPhones] = await pool.execute(
            'SELECT phone FROM users WHERE phone = ?',
            [phone]
        );

        if (existingPhones.length > 0) {
            return res.status(409).json({
                success: false,
                message: '이미 등록된 휴대폰번호입니다.',
                field: 'phone'
            });
        }

        // 비밀번호 해시화
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // 사용자 등록
        const [result] = await pool.execute(
            `INSERT INTO users (email, password, name, phone, role, is_active, created_at, updated_at) 
             VALUES (?, ?, ?, ?, 'EMPLOYEE', 0, NOW(), NOW())`,
            [email, hashedPassword, name, phone]
        );

        console.log('새 사용자 등록 성공:', { email, name });

        // 성공 응답 (비밀번호는 응답에 포함하지 않음)
        res.status(201).json({
            success: true,
            message: '회원가입이 완료되었습니다.',
            data: {
                email,
                name,
                phone,
                role: 'EMPLOYEE',
                created_at: new Date()
            }
        });

    } catch (error) {
        console.error('회원가입 오류:', error);
        
        // MySQL 오류 처리
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                message: '이미 등록된 정보입니다.'
            });
        }

        res.status(500).json({
            success: false,
            message: '회원가입 처리 중 오류가 발생했습니다.',
            error: process.env.NODE_ENV === 'development' ? error.message : '서버 오류'
        });
    }
});

// 로그인 API
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 필수 필드 검증
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: '이메일과 비밀번호를 모두 입력해주세요.'
            });
        }

        // 사용자 조회
        const [users] = await pool.execute(
            `SELECT email, password, name, phone, role, department_id, position, is_active, last_login_at, created_at
             FROM users WHERE email = ?`,
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: '이메일 또는 비밀번호가 올바르지 않습니다.'
            });
        }

        const user = users[0];

        // 계정 활성화 상태 확인
        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: '계정이 아직 승인되지 않았습니다. 관리자 승인을 기다려주세요.',
                status: 'pending_approval',
                registered_at: user.created_at
            });
        }
		// 여기에 디버깅 코드 추가 👇
      //  console.log('입력된 이메일:', email);
     //   console.log('입력된 비밀번호:', password);
     //   console.log('DB 비밀번호 해시:', user.password);

        // 비밀번호 확인
     
        
        // 비밀번호 확인
        const isPasswordValid = await bcrypt.compare(password, user.password);
		//console.log('비밀번호 맞나요?', isPasswordValid);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: '이메일 또는 비밀번호가 올바르지 않습니다.'
            });
        }

        // 마지막 로그인 시간 업데이트
        await pool.execute(
            'UPDATE users SET last_login_at = NOW() WHERE email = ?',
            [email]
        );

        // 세션에 사용자 정보 저장
        req.session.user = {
            email: user.email,
            name: user.name,
            phone: user.phone,
            role: user.role,
            department_id: user.department_id,
            position: user.position
        };

        console.log('사용자 로그인 성공:', { email: user.email });

        // 로그인 성공 응답
        res.json({
            success: true,
            message: '로그인되었습니다.',
            data: {
                email: user.email,
                name: user.name,
                role: user.role,
                position: user.position,
                last_login_at: user.last_login_at
            }
        });

    } catch (error) {
        console.error('로그인 오류:', error);
        res.status(500).json({
            success: false,
            message: '로그인 처리 중 오류가 발생했습니다.'
        });
    }
});

// 로그아웃 API
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('로그아웃 오류:', err);
            return res.status(500).json({
                success: false,
                message: '로그아웃 처리 중 오류가 발생했습니다.'
            });
        }

        res.clearCookie('connect.sid'); // 기본 세션 쿠키명
        res.json({
            success: true,
            message: '로그아웃되었습니다.'
        });
    });
});

// 세션 확인 API
router.get('/me', (req, res) => {
    if (req.session && req.session.user) {
        res.json({
            success: true,
            data: req.session.user
        });
    } else {
        res.status(401).json({
            success: false,
            message: '로그인이 필요합니다.'
        });
    }
});

// 이메일 중복 확인 API
router.get('/check-email/:email', async (req, res) => {
    try {
        const { email } = req.params;

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({
                success: false,
                message: '올바른 이메일 형식을 입력해주세요.'
            });
        }

        const [existingUsers] = await pool.execute(
            'SELECT email FROM users WHERE email = ?',
            [email]
        );

        res.json({
            success: true,
            available: existingUsers.length === 0,
            message: existingUsers.length === 0 ? '사용 가능한 이메일입니다.' : '이미 사용 중인 이메일입니다.'
        });

    } catch (error) {
        console.error('이메일 중복 확인 오류:', error);
        res.status(500).json({
            success: false,
            message: '이메일 중복 확인 중 오류가 발생했습니다.'
        });
    }
});

// 계정 상태 확인 API
router.get('/account-status/:email', async (req, res) => {
    try {
        const { email } = req.params;

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({
                success: false,
                message: '올바른 이메일 형식을 입력해주세요.'
            });
        }

        const [users] = await pool.execute(
            'SELECT email, name, is_active, created_at FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: '등록되지 않은 이메일입니다.'
            });
        }

        const user = users[0];

        res.json({
            success: true,
            data: {
                email: user.email,
                name: user.name,
                status: user.is_active ? 'active' : 'pending_approval',
                registered_at: user.created_at
            }
        });

    } catch (error) {
        console.error('계정 상태 확인 오류:', error);
        res.status(500).json({
            success: false,
            message: '계정 상태 확인 중 오류가 발생했습니다.'
        });
    }
});

// 승인 대기 중인 사용자 목록 조회 (관리자만)
router.get('/pending-approvals', async (req, res) => {
    try {
        // 관리자 권한 확인
        if (!req.session?.user || !['SUPER_ADMIN', 'SYSTEM_ADMIN'].includes(req.session.user.role)) {
            return res.status(403).json({
                success: false,
                message: '관리자 권한이 필요합니다.'
            });
        }

        const [pendingUsers] = await pool.execute(
            `SELECT email, name, phone, created_at 
             FROM users 
             WHERE is_active = 0 
             ORDER BY created_at DESC`
        );

        res.json({
            success: true,
            data: {
                pending_users: pendingUsers,
                count: pendingUsers.length
            }
        });

    } catch (error) {
        console.error('승인 대기 목록 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '승인 대기 목록 조회 중 오류가 발생했습니다.'
        });
    }
});

// 사용자 승인/거부 API (관리자만)
// ==============================
// routes/auth/approve-user.js (또는 해당 승인 API 파일)
// ==============================

router.post('/approve-user', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { email, action } = req.body; // action: 'approve' or 'reject'
        
        if (!email || !action) {
            return res.status(400).json({
                success: false,
                message: '이메일과 액션이 필요합니다.'
            });
        }

        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({
                success: false,
                message: '유효하지 않은 액션입니다.'
            });
        }

        // 현재 사용자 정보 조회
        const [users] = await pool.execute(
            'SELECT email, name, is_active FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: '해당 사용자를 찾을 수 없습니다.'
            });
        }

        const user = users[0];

        // 승인대기 상태(is_active = 0)인지 확인
        if (user.is_active !== 0) {
            return res.status(400).json({
                success: false,
                message: '승인대기 상태가 아닌 사용자입니다.'
            });
        }

        if (action === 'approve') {
            // 승인: is_active를 0에서 1로 변경 (승인대기 -> 활성)
            await pool.execute(`
                UPDATE users 
                SET is_active = 1, updated_at = NOW()
                WHERE email = ?
            `, [email]);

            // 활동 로그 기록
            await pool.execute(`
                INSERT INTO user_activity_logs (user_email, action_by, action, old_status, new_status, notes, created_at)
                VALUES (?, ?, 'APPROVE', 0, 1, '관리자에 의한 계정 승인', NOW())
            `, [email, req.session.user.email]);

            console.log('사용자 승인:', { email, approvedBy: req.session.user.email });

            return res.json({
                success: true,
                message: '사용자가 승인되었습니다.',
                data: {
                    email,
                    name: user.name,
                    status: 'approved',
                    approved_by: req.session.user.email,
                    approved_at: new Date()
                }
            });

        } else if (action === 'reject') {
            // 거절: 사용자 계정 삭제
            await pool.execute(
                'DELETE FROM users WHERE email = ?',
                [email]
            );

            // 활동 로그 기록 (삭제되기 전에)
            await pool.execute(`
                INSERT INTO user_activity_logs (user_email, action_by, action, old_status, new_status, notes, created_at)
                VALUES (?, ?, 'REJECT', 0, NULL, '관리자에 의한 계정 거절 및 삭제', NOW())
            `, [email, req.session.user.email]);

            console.log('사용자 거절:', { email, rejectedBy: req.session.user.email });

            return res.json({
                success: true,
                message: '사용자가 거절되어 계정이 삭제되었습니다.',
                data: {
                    email,
                    name: user.name,
                    status: 'rejected',
                    rejected_by: req.session.user.email,
                    rejected_at: new Date()
                }
            });
        }

    } catch (error) {
        console.error('사용자 승인/거절 오류:', error);
        res.status(500).json({
            success: false,
            message: '사용자 승인/거절 중 오류가 발생했습니다.'
        });
    }
});
// 비밀번호 재설정 요청
router.post('/request-password-reset', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                message: '이메일을 입력해주세요.'
            });
        }
        
        // 사용자 존재 확인
        const [users] = await pool.execute(
            'SELECT email, name, is_active FROM users WHERE email = ?',
            [email]
        );
        
        if (users.length === 0) {
            // 보안상 사용자가 없어도 성공 메시지 반환
            return res.json({
                success: true,
                message: '이메일이 등록되어 있다면 재설정 링크가 발송됩니다.'
            });
        }
        
        const user = users[0];
        
        // 비활성 계정 체크
        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: '승인되지 않은 계정입니다.'
            });
        }
        
        // 기존 토큰 삭제
        await pool.execute(
            'DELETE FROM password_reset_tokens WHERE user_email = ?',
            [email]
        );
        
        // 새 토큰 생성 (32바이트 = 64자 hex)
        const resetToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1시간 후
        
        // 토큰 저장
        await pool.execute(
            `INSERT INTO password_reset_tokens (user_email, token, expires_at) 
             VALUES (?, ?, ?)`,
            [email, resetToken, expiresAt]
        );
        
        // 이메일 발송
        await sendPasswordResetEmail(email, resetToken);
        
        console.log('비밀번호 재설정 요청:', { email });
        
        res.json({
            success: true,
            message: '비밀번호 재설정 링크가 이메일로 발송되었습니다.'
        });
        
    } catch (error) {
        console.error('비밀번호 재설정 요청 오류:', error);
        res.status(500).json({
            success: false,
            message: '비밀번호 재설정 요청 중 오류가 발생했습니다.'
        });
    }
});

// 재설정 토큰 검증
router.get('/verify-reset-token/:token', async (req, res) => {
    try {
        const { token } = req.params;
        
        const [tokens] = await pool.execute(
            `SELECT user_email, expires_at, used 
             FROM password_reset_tokens 
             WHERE token = ?`,
            [token]
        );
        
        if (tokens.length === 0) {
            return res.status(404).json({
                success: false,
                message: '유효하지 않은 토큰입니다.'
            });
        }
        
        const tokenData = tokens[0];
        
        // 이미 사용된 토큰
        if (tokenData.used) {
            return res.status(400).json({
                success: false,
                message: '이미 사용된 토큰입니다.'
            });
        }
        
        // 만료된 토큰
        if (new Date() > new Date(tokenData.expires_at)) {
            return res.status(400).json({
                success: false,
                message: '토큰이 만료되었습니다. 다시 요청해주세요.'
            });
        }
        
        res.json({
            success: true,
            data: {
                email: tokenData.user_email,
                expires_at: tokenData.expires_at
            }
        });
        
    } catch (error) {
        console.error('토큰 검증 오류:', error);
        res.status(500).json({
            success: false,
            message: '토큰 검증 중 오류가 발생했습니다.'
        });
    }
});

// 비밀번호 재설정 (실제 변경)
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        
        if (!token || !newPassword) {
            return res.status(400).json({
                success: false,
                message: '필수 정보가 누락되었습니다.'
            });
        }
        
        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: '비밀번호는 8자 이상이어야 합니다.'
            });
        }
        
        // 토큰 검증
        const [tokens] = await pool.execute(
            `SELECT user_email, expires_at, used 
             FROM password_reset_tokens 
             WHERE token = ?`,
            [token]
        );
        
        if (tokens.length === 0) {
            return res.status(404).json({
                success: false,
                message: '유효하지 않은 토큰입니다.'
            });
        }
        
        const tokenData = tokens[0];
        
        if (tokenData.used) {
            return res.status(400).json({
                success: false,
                message: '이미 사용된 토큰입니다.'
            });
        }
        
        if (new Date() > new Date(tokenData.expires_at)) {
            return res.status(400).json({
                success: false,
                message: '토큰이 만료되었습니다.'
            });
        }
        
        // 비밀번호 해시화
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        
        // 비밀번호 업데이트
        await pool.execute(
            'UPDATE users SET password = ?, updated_at = NOW() WHERE email = ?',
            [hashedPassword, tokenData.user_email]
        );
        
        // 토큰 사용 처리
        await pool.execute(
            'UPDATE password_reset_tokens SET used = 1 WHERE token = ?',
            [token]
        );
        
        console.log('비밀번호 재설정 완료:', { email: tokenData.user_email });
        
        res.json({
            success: true,
            message: '비밀번호가 성공적으로 변경되었습니다.'
        });
        
    } catch (error) {
        console.error('비밀번호 재설정 오류:', error);
        res.status(500).json({
            success: false,
            message: '비밀번호 재설정 중 오류가 발생했습니다.'
        });
    }
});
module.exports = router;
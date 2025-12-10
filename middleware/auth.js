// ==============================
// middleware/auth.js - 인증 미들웨어
// ==============================
const requireAuth = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    } else {
        return res.status(401).json({ 
            success: false, 
            message: '로그인이 필요합니다.',
            redirect: '/login.html'
        });
    }
};

const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.session.user) {
            return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
        }
        
        if (roles.includes(req.session.user.role)) {
            return next();
        } else {
            return res.status(403).json({ success: false, message: '권한이 없습니다.' });
        }
    };
};

module.exports = { requireAuth, requireRole };

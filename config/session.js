// ==============================
// config/session.js - 세션 설정 (필요한 경우)
// ==============================
const session = require('express-session');

const sessionConfig = session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-here',
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // HTTPS에서만 true
        httpOnly: true,
        maxAge: 8 * 60 * 60 * 1000     // 8시간 (업무시간)
    }
});

module.exports = sessionConfig;

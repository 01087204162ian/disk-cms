// ==============================
// config/session.js - 세션 설정
// ==============================
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const { pool } = require('./database');

// MySQL 세션 스토어 설정
let store = null;
try {
    // 프로덕션 환경에서는 MySQL 스토어 사용, 개발 환경에서는 선택적 사용
    const useMySQLStore = process.env.USE_MYSQL_SESSION_STORE !== 'false';
    
    if (useMySQLStore) {
        store = new MySQLStore({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'insurance_cms',
            createDatabaseTable: true,
            schema: {
                tableName: 'sessions',
                columnNames: {
                    session_id: 'session_id',
                    expires: 'expires',
                    data: 'data'
                }
            }
        });
        
        // 스토어 에러 핸들링
        store.on('error', (error) => {
            console.error('❌ 세션 스토어 오류:', error);
        });
        
        console.log('✅ MySQL 세션 스토어 초기화 완료');
    } else {
        console.log('ℹ️ 메모리 기반 세션을 사용합니다. (USE_MYSQL_SESSION_STORE=false)');
    }
} catch (error) {
    console.error('❌ MySQL 세션 스토어 초기화 실패:', error.message);
    console.log('⚠️ 메모리 기반 세션을 사용합니다.');
    store = null; // 메모리 기반 세션 사용
}

const sessionConfig = session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-here',
    resave: false,
    saveUninitialized: false,
    rolling: true,
    store: store, // MySQL 스토어 또는 null (메모리 기반)
    name: 'connect.sid', // 기본 세션 쿠키 이름
    cookie: {
        secure: process.env.NODE_ENV === 'production', // HTTPS에서만 true
        httpOnly: true,
        maxAge: 8 * 60 * 60 * 1000,     // 8시간 (업무시간)
        sameSite: 'lax', // CSRF 보호
        path: '/' // 모든 경로에서 쿠키 사용
    }
});

module.exports = sessionConfig;

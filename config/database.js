// ==============================
// config/database.js - 데이터베이스 설정
// ==============================
const mysql = require('mysql2');

// Promise 지원 풀 생성
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'insurance_cms',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
}).promise(); // 👈 이 부분이 핵심!

// 연결 테스트 함수
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ 데이터베이스 연결 성공');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ 데이터베이스 연결 실패:', error.message);
        return false;
    }
}

module.exports = { 
    pool,
    testConnection 
};
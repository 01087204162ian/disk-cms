// ==============================
// server.js - 메인 서버 파일
// ==============================
process.env.TZ = 'Asia/Seoul';
require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');

// 설정 파일들
const { pool } = require('./config/database');
const sessionConfig = require('./config/session');

// 기존 라우트들
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const dashboardRoutes = require('./routes/dashboard');
const attendanceRoutes = require('./routes/attendance');
const employeesRoutes = require('./routes/staff/employees'); // 직원리스트
const departmentRoutes = require('./routes/staff/departments'); // 부서
const workSchedulesRouter = require('./routes/staff/work-schedules'); // 휴가

// 보험 관련 라우트들
const pharmacyRoutes = require('./routes/pharmacy'); // 약국배상책임보험
const pharmacy2Routes = require('./routes/pharmacy/pharmacy2'); // 약국관련 프록시
const pharmacyAdminRoutes = require('./routes/pharmacy/admin'); // 약국 관리자
const pharmacyDepositsRoutes = require('./routes/pharmacy/deposits');
const pharmacyReportsRoutes = require('./routes/pharmacy/reports'); // 🆕 추가
// 근재보험 라우트들 (새로 추가)
const workersCompApplicationsRoutes = require('./routes/workers-comp/applications'); // 근재보험 신청서 관리
const workersCompConsultationsRoutes = require('./routes/workers-comp/consultations'); // 근재보험 상담신청서 관리

// 보험상품 (KJ 대리운전 등)
const kjDriverSearchRoutes = require('./routes/insurance/kj-driver-search');
const kjDriverCompanyRoutes = require('./routes/insurance/kj-driver-company');

const fieldPracticeRoutes = require('./routes/field-practice/applications'); // 현장실습보험 신청
const fieldPracticeClaimsRoutes = require('./routes/field-practice/claims'); // 현장실습보험 클레임리스트
const fieldPracticeAccountsRoutes = require('./routes/field-practice/accounts'); // 현장실습보험 id리스트

const app = express();
const PORT = process.env.PORT || 3000;

// 기본 미들웨어 설정
app.use(express.json({ limit: '50mb' })); // 파일 업로드를 위해 제한 증가
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// CORS 설정
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://geunjae.kr', 'https://imet.kr'] 
        : true,
    credentials: true
}));

// 세션 설정
app.use(sessionConfig);

// 로깅 시스템
const logger = require('./utils/logger');

// 요청 로깅 미들웨어 (라우터 등록 전에 배치)
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.session?.user?.id
    });
    next();
});

// ========== API 라우트 설정 ==========

// 인증 및 사용자 관리
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/attendance', attendanceRoutes);

// 직원 관리
app.use('/api/staff/departments', departmentRoutes);
app.use('/api/staff', workSchedulesRouter);
app.use('/api/staff', employeesRoutes);

// 약국배상책임보험 관련
app.use('/api/pharmacy', pharmacyRoutes);
app.use('/api/pharmacy2', pharmacy2Routes);
app.use('/api/pharmacy-admin', pharmacyAdminRoutes);
app.use('/api/pharmacy-deposits', pharmacyDepositsRoutes); // 🆕 예치
app.use('/api/pharmacy-reports', pharmacyReportsRoutes); // 🆕 실적

// 보험상품 (KJ 대리운전 등)
app.use('/api/insurance', kjDriverSearchRoutes);
app.use('/api/insurance', kjDriverCompanyRoutes);

// 근재보험 관련 (새로 추가)
app.use('/api/workers-comp', workersCompApplicationsRoutes);
app.use('/api/workers-comp/consultations', workersCompConsultationsRoutes); // 신규 추가


//현장실습 보험
app.use('/api/field-practice', fieldPracticeRoutes);
app.use('/api/field-practice/claims', fieldPracticeClaimsRoutes); // ⭐ 추가
app.use('/api/field-practice/accounts', fieldPracticeAccountsRoutes);
// ========== 정적 파일 라우팅 ==========
/*app.get('/', (req, res) => {
    res.redirect('/login.html');
});

// 근재보험 관리 페이지 라우팅 (새로 추가)
app.get('/workers-comp-contracts', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'workers-comp-contracts.html'));
});

app.get('/workers-comp-contracts.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'workers-comp-contracts.html'));
});*/

// ========== 에러 핸들링 ==========

// 404 처리
app.use((req, res) => {
    logger.warn(`404 Not Found: ${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });
    
    res.status(404).json({ 
        success: false, 
        error: '요청한 페이지를 찾을 수 없습니다.',
        path: req.path
    });
});

// 전역 에러 핸들링
app.use((err, req, res, next) => {
    logger.error('서버 오류:', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        ip: req.ip
    });
    
    // 개발 환경에서는 상세 에러 정보 제공
    if (process.env.NODE_ENV === 'development') {
        res.status(500).json({ 
            success: false, 
            error: '서버 내부 오류가 발생했습니다.',
            details: err.message,
            stack: err.stack
        });
    } else {
        res.status(500).json({ 
            success: false, 
            error: '서버 내부 오류가 발생했습니다.' 
        });
    }
});

// ========== 서버 시작 ==========
let server;
server = app.listen(PORT, () => {
    console.log(`🚀 보험 CMS 서버가 포트 ${PORT}에서 실행 중입니다.`);
    console.log(`🔗 접속 URL: http://localhost:${PORT}`);
    console.log(`📋 약국보험: http://localhost:${PORT}/pharmacy-applications.html`);
    console.log(`🏗️ 근재보험: http://localhost:${PORT}/workers-comp-contracts.html`);
    
    if (process.env.NODE_ENV === 'development') {
        console.log('🔧 개발 모드로 실행 중입니다.');
    }
});

// ========== 우아한 종료 처리 ==========
const gracefulShutdown = (signal) => {
    console.log(`\n${signal} 신호를 받았습니다. 서버를 종료합니다...`);
    
    // 새로운 연결 거부
    if (server && server.close) {
        server.close(() => {
            console.log('HTTP 서버가 종료되었습니다.');
            
            // 데이터베이스 연결 종료
            if (pool) {
                pool.end(() => {
                    console.log('데이터베이스 연결이 종료되었습니다.');
                    process.exit(0);
                });
            } else {
                process.exit(0);
            }
        });
    } else {
        console.error('서버 close 핸들러가 없습니다. 강제 종료합니다.');
        process.exit(1);
    }
    
    // 강제 종료 (30초 후)
    setTimeout(() => {
        console.error('강제 종료됩니다.');
        process.exit(1);
    }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ========== 데이터베이스 연결 테스트 ==========
pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ 데이터베이스 연결 실패:', err.message);
        logger.error('Database connection failed', { error: err.message });
    } else {
        console.log('✅ 데이터베이스 연결 성공');
        logger.info('Database connected successfully');
        connection.release();
    }
});

// ========== 개발용 디버그 정보 ==========
if (process.env.NODE_ENV === 'development') {
    console.log('\n=== 개발 환경 정보 ===');
    console.log(`Node.js 버전: ${process.version}`);
    console.log(`메모리 사용량: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
    console.log(`환경 변수:`);
    console.log(`  - PORT: ${process.env.PORT || 3000}`);
    console.log(`  - NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`  - TZ: ${process.env.TZ}`);
    console.log('====================\n');
}

// ========== 헬스체크 엔드포인트 ==========
app.get('/health', (req, res) => {
    const healthCheck = {
        uptime: process.uptime(),
        message: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        memory: {
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
        }
    };
    
    res.status(200).json(healthCheck);
});

module.exports = app;
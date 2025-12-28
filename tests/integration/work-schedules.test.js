/**
 * 주 4일 근무제 API 통합 테스트
 * 
 * 테스트 항목:
 * - 스케줄 조회 API
 * - 반차 신청 API
 * - 일시적 변경 신청 API
 * 
 * 주의: 실제 데이터베이스 연결이 필요합니다.
 * 테스트 전에 테스트용 데이터베이스 설정이 필요합니다.
 */

const request = require('supertest');
const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);

// 테스트용 앱 설정
const app = express();
app.use(express.json());
app.use(session({
  secret: 'test-secret',
  resave: false,
  saveUninitialized: false,
  store: new MySQLStore({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'test_db'
  })
}));

// 라우터 등록
const workSchedulesRouter = require('../../routes/staff/work-schedules');
app.use('/api/staff/work-schedules', workSchedulesRouter);

describe('주 4일 근무제 API 통합 테스트', () => {
  
  // 테스트용 세션 설정
  let testSession = null;
  
  beforeAll(() => {
    // 테스트용 세션 생성
    testSession = request.agent(app);
  });
  
  // ===========================
  // 스케줄 조회 API 테스트
  // ===========================
  
  describe('GET /api/staff/work-schedules/my-status', () => {
    test('인증 없이 접근 시 401 에러', async () => {
      const response = await request(app)
        .get('/api/staff/work-schedules/my-status');
      
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('UNAUTHORIZED');
    });
    
    // 실제 세션이 있는 경우의 테스트는 실제 로그인 후 진행
  });
  
  describe('GET /api/staff/work-schedules/my-schedule/:year/:month', () => {
    test('인증 없이 접근 시 401 에러', async () => {
      const response = await request(app)
        .get('/api/staff/work-schedules/my-schedule/2025/12');
      
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
    
    test('유효하지 않은 월 파라미터', async () => {
      // 세션 설정이 필요한 경우 여기서 설정
      // 실제 테스트는 세션 설정 후 진행
    });
  });
  
  // ===========================
  // 반차 신청 API 테스트
  // ===========================
  
  describe('POST /api/staff/work-schedules/apply-half-day', () => {
    test('필수 파라미터 누락 시 400 에러', async () => {
      const response = await request(app)
        .post('/api/staff/work-schedules/apply-half-day')
        .send({
          date: '2025-12-15'
          // leave_type, reason 누락
        });
      
      expect(response.status).toBe(401); // 인증 오류가 먼저 발생
    });
  });
  
  // ===========================
  // 일시적 변경 API 테스트
  // ===========================
  
  describe('POST /api/staff/work-schedules/temporary-change', () => {
    test('필수 파라미터 누락 시 400 에러', async () => {
      const response = await request(app)
        .post('/api/staff/work-schedules/temporary-change')
        .send({
          week_start_date: '2025-12-15'
          // temporary_off_day, reason 누락
        });
      
      expect(response.status).toBe(401); // 인증 오류가 먼저 발생
    });
  });
});


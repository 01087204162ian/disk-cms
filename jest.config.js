/**
 * Jest 테스트 설정
 * 주 4일 근무제 시스템 테스트용
 */

module.exports = {
  // 테스트 환경
  testEnvironment: 'node',
  
  // 테스트 파일 패턴
  testMatch: [
    '**/tests/**/*.test.js',
    '**/__tests__/**/*.js'
  ],
  
  // 커버리지 수집 대상
  collectCoverageFrom: [
    'routes/staff/work-schedule-helpers.js',
    'routes/staff/work-schedules.js'
  ],
  
  // 커버리지 리포트 형식
  coverageReporters: ['text', 'lcov', 'html'],
  
  // 커버리지 임계값
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // 모듈 경로 매핑
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  },
  
  // 테스트 전 설정
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // 타임존 설정
  globalSetup: '<rootDir>/tests/setup-timezone.js',
  
  // 테스트 타임아웃 (밀리초)
  testTimeout: 10000,
  
  // 상세 출력
  verbose: true
};


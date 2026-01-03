// Playwright 설정 파일
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  // 테스트 파일 위치 (프로젝트 루트 기준)
  testDir: './tests/e2e/scenarios',
  
  // 테스트 실행 옵션
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  // 리포터 설정
  reporter: 'html',
  
  // 공통 설정
  use: {
    baseURL: 'https://disk-cms.simg.kr',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // 타임아웃 설정 (30초)
    actionTimeout: 30000,
    navigationTimeout: 30000,
  },
  
  // 브라우저 프로젝트
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // 필요시 다른 브라우저도 추가 가능
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],
});


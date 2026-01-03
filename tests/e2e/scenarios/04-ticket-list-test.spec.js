// 티켓 목록 페이지 테스트
const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/login.page');

test.describe('티켓 목록 페이지 테스트', () => {
  let loginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    // 로그인 (필요한 경우)
    // await loginPage.goto();
    // await loginPage.login('test@example.com', 'password');
  });

  test('티켓 목록 페이지 접근', async ({ page }) => {
    await page.goto('/pages/tickets/list.html');
    
    // 페이지가 로드되었는지 확인
    await expect(page).toHaveURL(/list\.html/);
    
    // 페이지 타이틀 확인
    await expect(page).toHaveTitle(/티켓|케이스|목록/);
    
    console.log('✅ 티켓 목록 페이지가 정상적으로 로드되었습니다.');
  });

  test('티켓 목록 테이블 표시', async ({ page }) => {
    await page.goto('/pages/tickets/list.html');
    await page.waitForLoadState('networkidle');
    
    // 테이블 또는 목록이 표시되는지 확인
    const table = page.locator('table, .table, #ticketsTable').first();
    const list = page.locator('.list, .ticket-list, #ticketsTableBody').first();
    
    // 테이블 또는 리스트 중 하나는 보여야 함
    const tableVisible = await table.isVisible().catch(() => false);
    const listVisible = await list.isVisible().catch(() => false);
    
    expect(tableVisible || listVisible).toBeTruthy();
    
    console.log('✅ 티켓 목록 테이블이 표시되었습니다.');
  });

  test('필터링 옵션 확인', async ({ page }) => {
    await page.goto('/pages/tickets/list.html');
    await page.waitForLoadState('networkidle');
    
    // 상태 필터
    const statusFilter = page.locator('#statusFilter, select[name="status"], .status-filter').first();
    const statusVisible = await statusFilter.isVisible().catch(() => false);
    
    // 티켓 유형 필터
    const typeFilter = page.locator('#ticketTypeFilter, select[name="ticket_type"], .type-filter').first();
    const typeVisible = await typeFilter.isVisible().catch(() => false);
    
    // 필터가 하나 이상 표시되어야 함
    expect(statusVisible || typeVisible).toBeTruthy();
    
    console.log('✅ 필터링 옵션이 표시되었습니다.');
  });

  test('검색 기능 확인', async ({ page }) => {
    await page.goto('/pages/tickets/list.html');
    await page.waitForLoadState('networkidle');
    
    // 검색 입력 필드
    const searchInput = page.locator('#searchInput, input[type="search"], input[placeholder*="검색"]').first();
    const searchVisible = await searchInput.isVisible().catch(() => false);
    
    if (searchVisible) {
      // 검색 입력 필드가 있으면 입력 가능한지 확인
      await searchInput.fill('테스트');
      const value = await searchInput.inputValue();
      expect(value).toBe('테스트');
      
      console.log('✅ 검색 기능이 정상 작동합니다.');
    } else {
      console.log('ℹ️ 검색 기능이 현재 구현되지 않았습니다.');
    }
  });
});


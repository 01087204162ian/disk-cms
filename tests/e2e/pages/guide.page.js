// Guide Page Object Model
const { expect } = require('@playwright/test');

class GuidePage {
  constructor(page) {
    this.page = page;
    
    // 사이드바 요소들
    this.sidebar = page.locator('.guide-sidebar');
    this.tocItems = page.locator('.guide-toc .toc-item');
    this.tocLinks = page.locator('.guide-toc a');
    
    // 섹션들
    this.section1 = page.locator('#section1');
    this.section2 = page.locator('#section2');
    this.section3 = page.locator('#section3');
    
    // 하위 항목들
    this.s1_1 = page.locator('#s1-1');
    this.s2_1 = page.locator('#s2-1');
    this.s3_1 = page.locator('#s3-1');
    
    // 모바일 네비게이션
    this.mobileNav = page.locator('.guide-nav');
    
    // 맨 위로 버튼
    this.backToTopButton = page.locator('#btnBackToTop');
  }

  /**
   * 가이드 페이지로 이동
   */
  async goto() {
    await this.page.goto('https://disk-cms.simg.kr/pages/tickets/guide.html');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * 섹션 클릭
   * @param {number} sectionNumber - 섹션 번호 (1, 2, 3)
   */
  async clickSection(sectionNumber) {
    const sectionItem = this.tocItems.nth(sectionNumber - 1);
    await sectionItem.locator('> a').click();
    await this.page.waitForTimeout(500); // 스크롤 완료 대기
  }

  /**
   * 하위 항목 클릭
   * @param {number} sectionNumber - 섹션 번호
   * @param {string} itemText - 하위 항목 텍스트 (부분 일치 가능)
   */
  async clickSubItem(sectionNumber, itemText) {
    const section = this.tocItems.nth(sectionNumber - 1);
    const subLink = section.locator('.toc-subitems a', { hasText: itemText });
    await subLink.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * 페이지 하단으로 스크롤
   */
  async scrollToBottom() {
    await this.page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await this.page.waitForTimeout(500);
  }

  /**
   * 맨 위로 스크롤
   */
  async scrollToTop() {
    await this.page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    await this.page.waitForTimeout(500);
  }

  /**
   * 맨 위로 버튼이 표시되는지 확인
   */
  async isBackToTopVisible() {
    return await this.backToTopButton.isVisible();
  }

  /**
   * 맨 위로 버튼 클릭
   */
  async clickBackToTop() {
    await this.backToTopButton.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * 현재 스크롤 위치 확인
   */
  async getScrollPosition() {
    return await this.page.evaluate(() => window.scrollY);
  }

  /**
   * 특정 섹션이 뷰포트에 있는지 확인
   * @param {string} sectionId - 섹션 ID (#section1, #section2 등)
   */
  async isSectionInViewport(sectionId) {
    const section = this.page.locator(sectionId);
    return await section.isInViewport();
  }

  /**
   * 활성 섹션이 하이라이트되었는지 확인
   * @param {number} sectionNumber - 섹션 번호
   */
  async isSectionActive(sectionNumber) {
    const sectionItem = this.tocItems.nth(sectionNumber - 1);
    const classList = await sectionItem.getAttribute('class');
    return classList && classList.includes('active');
  }
}

module.exports = { GuidePage };


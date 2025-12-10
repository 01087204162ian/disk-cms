class TemplateLoader {
  constructor() {
    this.currentPage = null;
    this.init();
  }

  async init() {
    try {
      // 1. 기본 템플릿들 로드
      await this.loadTemplates();
      
      // 2. 메뉴 시스템 로드
      await this.loadMenu();
      
      // 3. 현재 페이지 로드
      this.loadCurrentPage();
      
      // 4. 이벤트 바인딩
      this.bindEvents();
      
      // 5. 시간 업데이트 시작
      this.startTimeUpdater();
      
    } catch (error) {
      console.error('템플릿 로더 초기화 실패:', error);
      this.showError('시스템을 불러올 수 없습니다.');
    }
  }

  async loadTemplates() {
    try {
      // 헤더 로드
      const headerResponse = await fetch('./templates/header.html');
      if (!headerResponse.ok) throw new Error(`헤더 로드 실패: ${headerResponse.status}`);
      const headerHtml = await headerResponse.text();
      
      const headerContainer = document.getElementById('header-container');
      if (!headerContainer) throw new Error('헤더 컨테이너를 찾을 수 없습니다');
      headerContainer.innerHTML = headerHtml;

      // 사이드바 로드
      const sidebarResponse = await fetch('./templates/sidebar.html');
      if (!sidebarResponse.ok) throw new Error(`사이드바 로드 실패: ${sidebarResponse.status}`);
      const sidebarHtml = await sidebarResponse.text();
      
      const sidebarContainer = document.getElementById('sidebar-container');
      if (!sidebarContainer) throw new Error('사이드바 컨테이너를 찾을 수 없습니다');
      sidebarContainer.innerHTML = sidebarHtml;

      // 푸터 로드
      const footerResponse = await fetch('./templates/footer.html');
      if (!footerResponse.ok) throw new Error(`푸터 로드 실패: ${footerResponse.status}`);
      const footerHtml = await footerResponse.text();
      
      const footerContainer = document.getElementById('footer-container');
      if (!footerContainer) throw new Error('푸터 컨테이너를 찾을 수 없습니다');
      footerContainer.innerHTML = footerHtml;

      console.log('✅ 모든 템플릿 로드 완료');

    } catch (error) {
      console.error('템플릿 로드 실패:', error);
      throw error;
    }
  }

  async loadMenu() {
    try {
      // 사이드바가 로드된 후 메뉴 생성
      const sidebarMenu = document.getElementById('sidebarMenu');
      if (!sidebarMenu) {
        console.error('사이드바 메뉴 컨테이너를 찾을 수 없습니다.');
        return;
      }

      // MenuLoader 인스턴스가 없으면 생성
      if (!window.menuLoader) {
        window.menuLoader = new MenuLoader();
      }

      await window.menuLoader.loadMenuConfig();
      const menuHtml = window.menuLoader.generateMenuHTML();
      sidebarMenu.innerHTML = menuHtml;
      
      // 메뉴 이벤트 바인딩
      window.menuLoader.bindMenuEvents();
      
    } catch (error) {
      console.error('메뉴 로드 실패:', error);
      const sidebarMenu = document.getElementById('sidebarMenu');
      if (sidebarMenu) {
        sidebarMenu.innerHTML = '<div class="menu-error">메뉴를 불러올 수 없습니다.</div>';
      }
    }
  }

  async loadPage(pageName) {
    try {
      // 로딩 표시
      this.showLoading('페이지를 불러오는 중...');
      
      const response = await fetch(`./pages/${pageName}.html`);
      if (!response.ok) {
        throw new Error(`페이지를 찾을 수 없습니다: ${pageName} (${response.status})`);
      }
      
      const pageHtml = await response.text();
      
      // 컨텐츠 영역에 페이지 삽입
      const contentContainer = document.getElementById('content-container');
      if (!contentContainer) {
        throw new Error('content-container를 찾을 수 없습니다');
      }
      
      contentContainer.innerHTML = pageHtml;
      
      // 현재 페이지 업데이트
      this.currentPage = pageName;
      
      // 활성 메뉴 설정
      if (window.menuLoader && window.menuLoader.setActiveMenu) {
        window.menuLoader.setActiveMenu(pageName);
      }
      
      // URL 업데이트 (히스토리 관리)
      history.pushState({page: pageName}, '', `#${pageName}`);
      
      // 페이지별 스크립트 실행
      this.executePageScripts();
      
      console.log(`✅ 페이지 로드 완료: ${pageName}`);
      
    } catch (error) {
      console.error('페이지 로드 실패:', error);
      this.showError(`페이지를 불러올 수 없습니다: ${error.message}`);
    }
  }

  loadCurrentPage() {
    // URL 해시에서 페이지 이름 가져오기
    const hash = window.location.hash.substring(1);
    const defaultPage = 'dashboard';
    const page = hash || defaultPage;
    
    this.loadPage(page);
  }

  executePageScripts() {
    // 페이지 내의 script 태그들을 실행
    const scripts = document.getElementById('content-container').querySelectorAll('script');
    scripts.forEach(script => {
      const newScript = document.createElement('script');
      if (script.src) {
        newScript.src = script.src;
      } else {
        newScript.textContent = script.textContent;
      }
      document.head.appendChild(newScript);
      document.head.removeChild(newScript);
    });
  }

  bindEvents() {
    // 햄버거 메뉴 토글
    document.addEventListener('click', (e) => {
      if (e.target.id === 'menuToggle' || e.target.closest('#menuToggle')) {
        this.toggleSidebar();
      }
    });

    // 사이드바 오버레이 클릭
    document.addEventListener('click', (e) => {
      if (e.target.id === 'sidebarOverlay') {
        this.closeSidebar();
      }
    });

    // 로그아웃 버튼
    document.addEventListener('click', (e) => {
      if (e.target.id === 'logoutBtn' || e.target.closest('#logoutBtn')) {
        this.handleLogout();
      }
    });

    // 브라우저 뒒로가기/앞으로가기
    window.addEventListener('popstate', (e) => {
      if (e.state && e.state.page) {
        this.loadPage(e.state.page);
      } else {
        this.loadCurrentPage();
      }
    });

    // ESC 키로 사이드바 닫기
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeSidebar();
      }
    });

    // 윈도우 리사이즈
    window.addEventListener('resize', () => {
      this.handleResize();
    });
  }

  toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    sidebar.classList.toggle('show');
    overlay.classList.toggle('show');
    
    // 모바일에서 스크롤 방지
    if (sidebar.classList.contains('show')) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    sidebar.classList.remove('show');
    overlay.classList.remove('show');
    document.body.style.overflow = '';
  }

  handleResize() {
    if (window.innerWidth > 992) {
      this.closeSidebar();
    }
  }

  async handleLogout() {
    if (confirm('로그아웃 하시겠습니까?')) {
      try {
        // 실제 환경에서는 서버에 로그아웃 요청
        const response = await fetch('/api/auth/logout', { 
          method: 'POST',
          credentials: 'include'
        });
        
        // 로그인 페이지로 리다이렉트
        window.location.href = '/login.html';
        
      } catch (error) {
        console.error('로그아웃 실패:', error);
        // 에러가 발생해도 로그인 페이지로 이동
        window.location.href = '/login.html';
      }
    }
  }

  startTimeUpdater() {
    this.updateTime();
    setInterval(() => this.updateTime(), 1000);
  }

  updateTime() {
    const timeElement = document.getElementById('currentTime');
    if (timeElement) {
      const now = new Date();
      const timeString = now.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      timeElement.textContent = timeString;
    }
  }

  showLoading(message = '로딩 중...') {
    document.getElementById('content-container').innerHTML = `
      <div class="loading">
        <i class="fas fa-spinner"></i>
        <div>${message}</div>
      </div>
    `;
  }

  showError(message) {
    document.getElementById('content-container').innerHTML = `
      <div class="loading">
        <i class="fas fa-exclamation-triangle" style="color: #e53e3e;"></i>
        <div style="color: #e53e3e;">${message}</div>
      </div>
    `;
  }
}

// 전역 함수들
function loadPage(pageName) {
  if (window.templateLoader) {
    window.templateLoader.loadPage(pageName);
  } else {
    console.error('Template loader가 초기화되지 않았습니다.');
  }
}

// 초기화는 script-loader.js에서 처리됩니다
/**
 * 현대화된 템플릿 로더 - 완전 바닐라 JavaScript 버전 (수정판)
 * Tabler 기반, Bootstrap 5 네이티브 API 사용
 */
class ModernTemplateLoader {
  constructor() {
    this.user = null;
    this.isAuthenticated = false;
    this.timeInterval = null;
    this.toastContainer = null;
    this.currentPageId = null;
    this.menuConfig = this.initializeMenuConfig();
    this.componentsLoaded = false;
  }

  // 1. 메뉴 구조 설정 (중앙 관리) - 완전한 설정
  initializeMenuConfig() {
    return {
      'dashboard': { 
        title: '대시보드', 
        parent: null,
        path: '/pages/dashboard.html',
        category: 'main'
      },
      'kj-driver': { 
        title: 'KJ 대리운전', 
        parent: '보험 업무 관리',
        path: '/pages/insurance/kj-driver.html',
        category: 'insurance'
      },
      'das-driver': { 
        title: 'DAS 대리운전', 
        parent: '보험 업무 관리',
        path: '/pages/insurance/das-driver.html',
        category: 'insurance'
      },
      'field-practice-insurance': { 
        title: '현장실습보험', 
        parent: '보험 업무 관리',
        path: '/pages/insurance/field-practice-insurance.html',
        category: 'insurance'
      },
      'kj-driver-search': { 
        title: '기사찾기', 
        parent: '대리운전',
        path: '/pages/insurance/kj-driver-search.html',
        category: 'insurance'
      },
      'kj-driver-company': { 
        title: '대리업체', 
        parent: '대리운전',
        path: '/pages/insurance/kj-driver-company.html',
        category: 'insurance'
      },
      'kj-driver-endorse-list': { 
        title: '배서리스트', 
        parent: '대리운전',
        path: '/pages/insurance/kj-driver-endorse-list.html',
        category: 'insurance'
      },
      'kj-driver-code-by-policy': { 
        title: '증권별코드', 
        parent: '대리운전',
        path: '/pages/insurance/kj-driver-code-by-policy.html',
        category: 'insurance'
      },
      'kj-driver-policy-search': { 
        title: '갱신', 
        parent: '대리운전',
        path: '/pages/insurance/kj-driver-policy-search.html',
        category: 'insurance'
      },
      'travel-insurance': { 
        title: '여행자보험', 
        parent: '보험 업무 관리',
        path: '/pages/insurance/travel-insurance.html',
        category: 'insurance'
      },
      'hole-in-one-insurance': { 
        title: '홀인원보험', 
        parent: '보험 업무 관리',
        path: '/pages/insurance/hole-in-one-insurance.html',
        category: 'insurance'
      },
      'pharmacy-liability': { 
        title: '약국배상책임', 
        parent: '보험 업무 관리',
        path: '/pages/pharmacy/pharmacy-liability.html',
        category: 'insurance'
      },
      'general-liability': { 
        title: '배상책임', 
        parent: '보험 업무 관리',
        path: '/pages/insurance/general-liability.html',
        category: 'insurance'
      },
      'attendance-status': { 
        title: '출근 현황', 
        parent: '출퇴근 관리',
        path: '/pages/attendance/attendance-status.html',
        category: 'attendance'
      },
      'attendance-record': { 
        title: '출퇴근 기록', 
        parent: '출퇴근 관리',
        path: '/pages/attendance/attendance-record.html',
        category: 'attendance'
      },
      'kpi-dashboard': { 
        title: 'KPI 대시보드', 
        parent: '업무 관리',
        path: '/pages/work/kpi-dashboard.html',
        category: 'work'
      },
      'task-management': { 
        title: '업무 처리', 
        parent: '업무 관리',
        path: '/pages/work/task-management.html',
        category: 'work'
      },
      'leave-request': { 
        title: '휴가 신청', 
        parent: '휴가 관리',
        path: '/pages/leave/leave-request.html',
        category: 'leave'
      },
      'leave-status': { 
        title: '휴가 현황', 
        parent: '휴가 관리',
        path: '/pages/leave/leave-status.html',
        category: 'leave'
      },
      'user-list': { 
        title: '직원 목록', 
        parent: '사용자 관리',
        path: '/pages/admin/user-list.html',
        category: 'admin',
        adminOnly: true
      },
      'user-approval': { 
        title: '가입 승인', 
        parent: '사용자 관리',
        path: '/pages/admin/user-approval.html',
        category: 'admin',
        adminOnly: true
      },
      'department-management': { 
        title: '부서 관리', 
        parent: '사용자 관리',
        path: '/pages/admin/department-management.html',
        category: 'admin',
        adminOnly: true
      },
      'attendance-report': { 
        title: '출근 현황 보고서', 
        parent: '보고서',
        path: '/pages/reports/attendance-report.html',
        category: 'reports',
        adminOnly: true
      },
      'performance-report': { 
        title: '성과 분석 보고서', 
        parent: '보고서',
        path: '/pages/reports/performance-report.html',
        category: 'reports',
        adminOnly: true
      },
      'system-settings': { 
        title: '시스템 설정', 
        parent: null,
        path: '/pages/admin/system-settings.html',
        category: 'other',
        adminOnly: true
      },
      'announcements': { 
        title: '공지사항', 
        parent: null,
        path: '/pages/announcements.html',
        category: 'other'
      },
      'help': { 
        title: '도움말', 
        parent: null,
        path: '/pages/help.html',
        category: 'other'
      }
    };
  }

  // 2. 인증 체크 (안정성 개선)
  async checkAuth() {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 200) {
        const data = await response.json();
        if (data.success && data.data) {
          this.user = data.data;
          this.isAuthenticated = true;
          return true;
        }
      } else if (response.status === 401) {
        console.log('인증이 필요합니다.');
      } else {
        console.log(`인증 확인 실패: HTTP ${response.status}`);
      }

      this.redirectToLogin();
      return false;

    } catch (error) {
      console.error('인증 확인 네트워크 오류:', error);
      this.redirectToLogin();
      return false;
    }
  }

  // 3. 로그인 페이지로 리다이렉트
  redirectToLogin() {
    const currentPath = window.location.pathname;
    if (!currentPath.includes('login.html')) {
      const returnUrl = encodeURIComponent(window.location.href);
      window.location.href = `/login.html?return=${returnUrl}`;
    }
  }

  // 4. 컴포넌트 로딩 (안정성 강화)
  async loadComponents() {
    if (this.componentsLoaded) return true;

    try {
      // 컨테이너 존재 여부 확인
      const containers = {
        header: document.getElementById('header-container'),
        sidebar: document.getElementById('sidebar-container'),
        footer: document.getElementById('footer-container')
      };

      // 필요한 컨테이너가 없으면 스킵
      if (!containers.header && !containers.sidebar && !containers.footer) {
        console.log('컴포넌트 컨테이너를 찾을 수 없습니다. 통합 템플릿 모드로 동작합니다.');
        this.componentsLoaded = true;
        return true;
      }

      // 병렬로 컴포넌트 로드
      const loadPromises = [];
      
      if (containers.header) {
        loadPromises.push(this.loadSingleComponent('header', '/components/header.html'));
      }
      if (containers.sidebar) {
        loadPromises.push(this.loadSingleComponent('sidebar', '/components/sidebar.html'));
      }
      if (containers.footer) {
        loadPromises.push(this.loadSingleComponent('footer', '/components/footer.html'));
      }

      const results = await Promise.allSettled(loadPromises);
      
      // 결과 확인
      let successCount = 0;
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successCount++;
        } else {
          console.error(`컴포넌트 로드 실패 (${index}):`, result.reason);
        }
      });

      // 최소 하나의 컴포넌트라도 로드되면 성공으로 간주
      if (successCount > 0) {
        this.componentsLoaded = true;
        await this.executeComponentScripts();
        return true;
      } else {
        throw new Error('모든 컴포넌트 로드 실패');
      }

    } catch (error) {
      console.error('컴포넌트 로딩 오류:', error);
      this.componentsLoaded = true; // 실패해도 재시도 방지
      return false;
    }
  }

  // 5. 개별 컴포넌트 로딩
  async loadSingleComponent(name, url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`${name} 컴포넌트 로드 실패: ${response.status}`);
    }
    
    const html = await response.text();
    const container = document.getElementById(`${name}-container`);
    
    if (container) {
      container.innerHTML = html;
    } else {
      throw new Error(`${name} 컨테이너를 찾을 수 없습니다.`);
    }

    return html;
  }

  // 6. 컴포넌트 스크립트 실행 (안정성 개선)
  async executeComponentScripts() {
    // 약간의 지연을 두어 DOM 안정화
    await new Promise(resolve => setTimeout(resolve, 100));

    // 사이드바의 동적 메뉴 생성
    if (typeof generateDynamicMenu === 'function') {
      try {
        generateDynamicMenu();
      } catch (error) {
        console.error('동적 메뉴 생성 실패:', error);
      }
    }

    // 헤더의 알림 업데이트 함수 연동
    if (typeof updateHeaderNotifications === 'function') {
      this.updateHeaderNotifications = updateHeaderNotifications;
    }

    // 푸터 초기화 (필요한 경우)
    if (typeof window.updateSystemStatus === 'function') {
      this.updateSystemStatus = window.updateSystemStatus;
    }
  }

  // 7. 페이지 네비게이션
  async navigateToPage(pageId) {
    if (!pageId) {
      console.warn('pageId가 제공되지 않았습니다.');
      return;
    }

    const menuInfo = this.menuConfig[pageId];
    if (!menuInfo) {
      console.warn(`페이지 ID '${pageId}'에 대한 정보를 찾을 수 없습니다.`);
      return;
    }

    // 관리자 권한 체크
    if (menuInfo.adminOnly && !this.isAdmin()) {
      this.showWarning('접근 권한이 없습니다.');
      return;
    }

    try {
      this.showPageLoading();
      
      // 실제 페이지 파일로 네비게이션
      if (menuInfo.path) {
        window.location.href = menuInfo.path;
      } else {
        throw new Error('페이지 경로가 설정되지 않았습니다.');
      }

    } catch (error) {
      console.error('페이지 네비게이션 오류:', error);
      this.hidePageLoading();
      this.showError('페이지를 불러올 수 없습니다.');
    }
  }

  // 8. 사용자 정보 업데이트
  updateUserInfo() {
    if (!this.user) return;

    const defaultUserImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(this.user.name || '사용자')}&background=0d6efd&color=fff`;

    // 사용자 이름 업데이트
    document.querySelectorAll('[data-user-name]').forEach(el => {
      el.textContent = this.user.name || '사용자';
    });

    // 사용자 역할 업데이트
    document.querySelectorAll('[data-user-role]').forEach(el => {
      el.textContent = this.getRoleText(this.user.role);
    });

    // 프로필 이미지 업데이트
    document.querySelectorAll('[data-user-image]').forEach(el => {
      if (this.user.profile_image) {
        el.src = this.user.profile_image;
        el.onerror = () => {
          el.src = defaultUserImage;
          el.onerror = null;
        };
      } else {
        el.src = defaultUserImage;
      }
    });

    // 사용자 이메일 업데이트
    document.querySelectorAll('[data-user-email]').forEach(el => {
      el.textContent = this.user.email || '';
    });
  }

  // 9. 역할 텍스트 변환
  getRoleText(role) {
    const roleTexts = {
      'SUPER_ADMIN': '최고관리자',
      'DEPT_MANAGER': '부서장',
      'SYSTEM_ADMIN': '시스템관리자',
      'EMPLOYEE': '직원'
    };
    return roleTexts[role] || '직원';
  }

  // 10. 메뉴 활성화
  setActiveMenu(pageId) {
    if (!pageId) return;

    // 모든 메뉴 비활성화
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
    });

    document.querySelectorAll('.dropdown-toggle').forEach(toggle => {
      toggle.classList.remove('active');
    });

    // 지정된 메뉴 활성화
    const activeLink = document.querySelector(`[data-menu="${pageId}"]`);
    if (activeLink) {
      activeLink.classList.add('active');

      // 부모 드롭다운이 있는 경우 활성화
      const parentDropdown = activeLink.closest('.dropdown');
      if (parentDropdown) {
        const parentToggle = parentDropdown.querySelector('.dropdown-toggle');
        if (parentToggle) {
          parentToggle.classList.add('active');
        }
      }
    }

    // 페이지 정보 업데이트
    this.updatePageInfo(pageId);
  }

  // 11. 페이지 정보 업데이트 (브레드크럼, 제목)
  updatePageInfo(pageId) {
    const menuInfo = this.menuConfig[pageId];
    
    if (!menuInfo) {
      console.warn(`페이지 ID '${pageId}'에 대한 메뉴 정보를 찾을 수 없습니다.`);
      return;
    }

    // 페이지 제목 업데이트
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) {
      pageTitle.textContent = menuInfo.title;
    }

    // 브레드크럼 업데이트
    const pagePretitle = document.getElementById('pagePretitle');
    if (pagePretitle) {
      if (menuInfo.parent && pageId !== 'dashboard') {
        pagePretitle.textContent = menuInfo.parent;
        pagePretitle.style.display = 'block';
      } else {
        pagePretitle.style.display = 'none';
      }
    }

    // HTML title 태그 업데이트
    document.title = `보험 CMS | ${menuInfo.title}`;
  }

  // 12. 관리자 권한 확인
  isAdmin() {
    return this.user && ['SUPER_ADMIN', 'DEPT_MANAGER', 'SYSTEM_ADMIN'].includes(this.user.role);
  }

  // 13. 권한별 UI 제어
  checkAdminPermissions() {
    const adminElements = document.querySelectorAll('.admin-only');
    const isAdmin = this.isAdmin();

    adminElements.forEach(el => {
      el.style.display = isAdmin ? '' : 'none';
    });
  }

  // 14. 현재 시간 업데이트
  startTimeUpdate() {
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }

    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      const timeElements = document.querySelectorAll('#currentTime, [data-current-time]');
      timeElements.forEach(el => {
        el.textContent = timeString;
      });
    };

    updateTime();
    this.timeInterval = setInterval(updateTime, 1000);
  }

  // 15. 토스트 알림 시스템 (Bootstrap 5 네이티브)
  showToast(message, type = 'success') {
    if (!this.toastContainer) {
      this.createToastContainer();
    }

    const toastId = 'toast-' + Date.now();
    const iconClass = this.getToastIcon(type);
    const bgClass = this.getToastBgClass(type);

    const toastHtml = `
      <div id="${toastId}" class="toast align-items-center ${bgClass} border-0" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="d-flex">
          <div class="toast-body d-flex align-items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="icon me-2" width="20" height="20" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
              ${iconClass}
            </svg>
            ${message}
          </div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
      </div>
    `;

    this.toastContainer.insertAdjacentHTML('beforeend', toastHtml);

    const toastElement = document.getElementById(toastId);
    
    // Bootstrap 5의 Toast API 사용
    if (window.bootstrap && window.bootstrap.Toast) {
      const bsToast = new bootstrap.Toast(toastElement, {
        delay: 4000,
        autohide: true
      });
      bsToast.show();
    } else {
      // 백업: 수동으로 표시/숨김
      toastElement.classList.add('show');
      setTimeout(() => {
        toastElement.classList.remove('show');
        setTimeout(() => toastElement.remove(), 300);
      }, 4000);
    }

    // 토스트 제거 이벤트
    toastElement.addEventListener('hidden.bs.toast', () => {
      toastElement.remove();
    });
  }

  // 16. 토스트 컨테이너 생성
  createToastContainer() {
    this.toastContainer = document.getElementById('toastContainer');
    if (!this.toastContainer) {
      this.toastContainer = document.createElement('div');
      this.toastContainer.id = 'toastContainer';
      this.toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
      this.toastContainer.style.zIndex = '1050';
      document.body.appendChild(this.toastContainer);
    }
  }

  // 17. 토스트 아이콘
  getToastIcon(type) {
    const icons = {
      success: '<path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l5 5l10 -10"/>',
      error: '<path stroke="none" d="M0 0h24v24H0z" fill="none"/><circle cx="12" cy="12" r="9"/><path d="M12 8v4"/><path d="M12 16h.01"/>',
      warning: '<path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 9v2m0 4v.01"/><path d="M5 19h14a2 2 0 0 0 1.84 -2.75l-7.1 -12.25a2 2 0 0 0 -3.5 0l-7.1 12.25a2 2 0 0 0 1.75 2.75"/>',
      info: '<path stroke="none" d="M0 0h24v24H0z" fill="none"/><circle cx="12" cy="12" r="9"/><path d="M12 8h.01"/><path d="M11 12h1v4h1"/>'
    };
    return icons[type] || icons.info;
  }

  // 18. 토스트 배경색 클래스
  getToastBgClass(type) {
    const bgClasses = {
      success: 'text-bg-success',
      error: 'text-bg-danger',
      warning: 'text-bg-warning',
      info: 'text-bg-info'
    };
    return bgClasses[type] || bgClasses.info;
  }

  // 19. 로딩 상태 관리
  showPageLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
      loadingOverlay.style.display = 'flex';
    }
  }

  hidePageLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
      loadingOverlay.style.display = 'none';
    }
  }

  // 20. 편의 메서드들
  showError(message) {
    this.showToast(message, 'error');
  }

  showSuccess(message) {
    this.showToast(message, 'success');
  }

  showWarning(message) {
    this.showToast(message, 'warning');
  }

  showInfo(message) {
    this.showToast(message, 'info');
  }

  // 21. 알림 관리 (통합)
  async loadNotifications() {
    try {
      const response = await this.apiRequest('/api/notifications');
      if (response && response.success) {
        this.updateNotificationUI(response.data || []);
      }
    } catch (error) {
      console.error('알림 로드 실패:', error);
      this.updateNotificationUI([]);
    }
  }

  updateNotificationUI(notifications = []) {
    // 헤더의 알림 업데이트
    if (this.updateHeaderNotifications) {
      this.updateHeaderNotifications(notifications);
    }

    // 기본 알림 업데이트 (헤더가 없는 경우 대비)
    const countElement = document.getElementById('notificationCount');
    const listElement = document.getElementById('notificationList');

    if (countElement) {
      countElement.textContent = notifications.length;
      countElement.style.display = notifications.length > 0 ? '' : 'none';
    }

    if (listElement && !this.updateHeaderNotifications) {
      if (notifications.length === 0) {
        listElement.innerHTML = '<div class="dropdown-item text-muted">새로운 알림이 없습니다.</div>';
      } else {
        listElement.innerHTML = notifications.map(notification => `
          <div class="dropdown-item">
            <div class="d-flex">
              <div class="flex-fill">
                <div class="fw-semibold">${notification.title || '알림'}</div>
                <div class="text-muted small">${notification.message || ''}</div>
                <div class="text-muted smaller">${this.formatDateTime(notification.created_at)}</div>
              </div>
              ${!notification.read ? '<span class="badge bg-red ms-2"></span>' : ''}
            </div>
          </div>
        `).join('');
      }
    }
  }

  // 22. 날짜/시간 포맷팅
  formatDateTime(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return '방금 전';
    if (diffMinutes < 60) return `${diffMinutes}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    
    return date.toLocaleDateString('ko-KR');
  }

  // 23. 메인 초기화 함수
  async initializePage(pageId) {
    try {
      console.log(`페이지 초기화 시작: ${pageId}`);
      
      this.showPageLoading();
      this.currentPageId = pageId;

      // 1단계: 컴포넌트 로딩 (필요한 경우에만)
      const hasContainers = document.getElementById('sidebar-container') || 
                           document.getElementById('header-container') || 
                           document.getElementById('footer-container');
      
      if (hasContainers && !this.componentsLoaded) {
        await this.loadComponents();
      }

      // 2단계: 인증 확인
      const isAuth = await this.checkAuth();
      if (!isAuth) {
        console.log('인증 실패 - 로그인 페이지로 이동');
        return;
      }

      // 3단계: 사용자 정보 업데이트
      this.updateUserInfo();

      // 4단계: 메뉴 활성화 및 페이지 정보 설정
      this.setActiveMenu(pageId);

      // 5단계: 권한별 UI 설정
      this.checkAdminPermissions();

      // 6단계: 현재 시간 업데이트 시작
      this.startTimeUpdate();

      // 7단계: 알림 로드
      await this.loadNotifications();

      // 8단계: 로딩 숨김
      this.hidePageLoading();

      console.log(`페이지 초기화 완료: ${pageId}`);

    } catch (error) {
      console.error('페이지 초기화 실패:', error);
      this.hidePageLoading();
      this.showError('페이지를 불러오는 중 오류가 발생했습니다.');
    }
  }

  // 24. 로그아웃 함수
  async logout() {
    if (confirm('로그아웃 하시겠습니까?')) {
      try {
        this.showPageLoading();
        
        const response = await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        // 응답 상태와 관계없이 로그인 페이지로 이동
        window.location.href = '/login.html';
        
      } catch (error) {
        console.error('로그아웃 오류:', error);
        window.location.href = '/login.html';
      }
    }
  }

  // 25. API 요청 헬퍼 (에러 처리 강화)
  async apiRequest(url, options = {}) {
    const defaultOptions = {
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    };

    const config = { ...defaultOptions, ...options };

    try {
      const response = await fetch(url, config);
      
      if (response.status === 401) {
        this.redirectToLogin();
        return null;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return await response.text();
      }

    } catch (error) {
      console.error('API 요청 실패:', error);
      throw error;
    }
  }

  // 26. 정리 함수 (메모리 누수 방지)
  cleanup() {
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
      this.timeInterval = null;
    }
    
    // 토스트 컨테이너 정리
    if (this.toastContainer && this.toastContainer.parentNode) {
      this.toastContainer.innerHTML = '';
    }
  }

  // 27. URL에서 페이지 ID 추출 (편의 함수)
  getCurrentPageId() {
    const path = window.location.pathname;
    const fileName = path.split('/').pop();
    const pageId = fileName.replace('.html', '');
    
    // 메뉴 구성에 있는 유효한 페이지 ID인지 확인
    return this.menuConfig[pageId] ? pageId : 'dashboard';
  }

  // 28. 페이지 컨텐츠 동적 로드 (선택사항)
  async loadPageContent(pageId) {
    try {
      const menuInfo = this.menuConfig[pageId];
      if (!menuInfo) return;

      // 페이지별 컨텐츠 파일이 있다면 로드
      const contentUrl = `/pages/content/${pageId}.html`;
      const response = await fetch(contentUrl);
      
      if (response.ok) {
        const content = await response.text();
        const contentContainer = document.getElementById('page-content');
        if (contentContainer) {
          contentContainer.innerHTML = content;
        }
      }

    } catch (error) {
      console.log(`페이지 컨텐츠 로드 실패 (${pageId}):`, error);
      // 에러가 발생해도 페이지는 계속 작동
    }
  }

  // 29. SPA 스타일 네비게이션 (선택사항)
  async navigateToPageSPA(pageId) {
    if (!pageId || pageId === this.currentPageId) return;

    const menuInfo = this.menuConfig[pageId];
    if (!menuInfo) {
      console.warn(`페이지 ID '${pageId}'에 대한 정보를 찾을 수 없습니다.`);
      return;
    }

    // 관리자 권한 체크
    if (menuInfo.adminOnly && !this.isAdmin()) {
      this.showWarning('접근 권한이 없습니다.');
      return;
    }

    try {
      this.showPageLoading();

      // 브라우저 히스토리 업데이트
      if (menuInfo.path) {
        window.history.pushState({ pageId }, menuInfo.title, menuInfo.path);
      }

      // 페이지 상태 업데이트
      this.currentPageId = pageId;
      this.setActiveMenu(pageId);
      
      // 컨텐츠 동적 로드
      await this.loadPageContent(pageId);

      this.hidePageLoading();
      this.showSuccess(`${menuInfo.title} 페이지로 이동했습니다.`);

    } catch (error) {
      console.error('SPA 네비게이션 오류:', error);
      this.hidePageLoading();
      this.showError('페이지 로드 중 오류가 발생했습니다.');
    }
  }
}

// 전역 인스턴스 생성
window.modernTemplateLoader = new ModernTemplateLoader();

// 페이지 언로드 시 정리
window.addEventListener('beforeunload', () => {
  if (window.modernTemplateLoader) {
    window.modernTemplateLoader.cleanup();
  }
});

// 브라우저 뒤로가기/앞으로가기 처리 (SPA 모드용)
window.addEventListener('popstate', (event) => {
  if (event.state && event.state.pageId) {
    window.modernTemplateLoader.navigateToPageSPA(event.state.pageId);
  }
});
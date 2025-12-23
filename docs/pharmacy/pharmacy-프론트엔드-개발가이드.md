# 약국배상책임보험 프론트엔드 개발 가이드

**작성일**: 2025-01-XX

---

## 📋 목차

1. [페이지 구조](#페이지-구조)
2. [템플릿 시스템](#템플릿-시스템)
3. [JavaScript 구조](#javascript-구조)
4. [주요 기능 구현](#주요-기능-구현)
5. [새 페이지 생성 방법](#새-페이지-생성-방법)

---

## 페이지 구조

### 기본 HTML 구조

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>보험 CMS | 약국배상책임보험</title>
  
  <!-- 공통 리소스 -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="/css/sj-styles.css" rel="stylesheet">
</head>
<body>
  <!-- 로딩 오버레이 -->
  <div class="loading-overlay" id="loadingOverlay">
    <div class="loading">
      <i class="fas fa-spinner"></i>
      <div>페이지를 불러오는 중...</div>
    </div>
  </div>

  <!-- 헤더 컨테이너 -->
  <div id="header-container"></div>

  <!-- 사이드바 오버레이 (모바일용) -->
  <div class="sidebar-overlay" id="sidebarOverlay"></div>

  <!-- 사이드바 컨테이너 -->
  <div id="sidebar-container"></div>

  <!-- 메인 컨텐츠 -->
  <main class="main-content">
    <!-- 페이지별 내용 -->
  </main>

  <!-- 스크립트 -->
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
  <script src="/js/sj-template-loader.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', async function() {
      await window.sjTemplateLoader.initializePage('pharmacy-applications');
    });
  </script>
  <!-- 페이지별 스크립트 -->
</body>
</html>
```

---

## 템플릿 시스템

### sj-template-loader.js

**주요 기능**:
- 헤더/사이드바/푸터 자동 로드
- 인증 체크
- 메뉴 활성화
- 권한별 UI 제어

**초기화**:
```javascript
await window.sjTemplateLoader.initializePage('pharmacy-applications');
```

**pageId 규칙**:
- 사이드바의 `data-menu` 속성과 일치해야 함
- kebab-case 사용 (예: `pharmacy-applications`)

---

## JavaScript 구조

### 전역 변수

```javascript
let currentPage = 1;
let currentPageSize = 20;
let currentSearchTerm = '';
let currentStatusFilter = '13';
let currentAccountFilter = '';
```

### 이벤트 리스너 초기화

```javascript
function initializeEventListeners() {
  // 검색 버튼
  const searchBtn = document.getElementById('search_btn');
  if (searchBtn) {
    searchBtn.addEventListener('click', handleSearch);
  }
  
  // 상태 필터
  const statusFilter = document.getElementById('statusFilter');
  if (statusFilter) {
    statusFilter.addEventListener('change', function() {
      currentStatusFilter = this.value;
      currentPage = 1;
      loadPharmacyData();
    });
  }
  
  // 페이지 크기
  const pageSize = document.getElementById('pageSize');
  if (pageSize) {
    pageSize.addEventListener('change', function() {
      currentPageSize = parseInt(this.value);
      currentPage = 1;
      loadPharmacyData();
    });
  }
}
```

### 데이터 로드 함수

```javascript
async function loadPharmacyData() {
  try {
    // 로딩 상태 표시
    showLoading();
    
    // API 파라미터 구성
    const params = new URLSearchParams({
      page: currentPage,
      limit: currentPageSize,
      search: currentSearchTerm,
      status: currentStatusFilter,
      account: currentAccountFilter
    });
    
    // API 호출
    const response = await fetch(`/api/pharmacy/list?${params}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      renderPharmacyTable(data.data);
      renderPagination(data.pagination);
    } else {
      showError(data.error || '데이터를 불러오는데 실패했습니다.');
    }
    
  } catch (error) {
    console.error('데이터 로드 오류:', error);
    showError('데이터를 불러오는데 실패했습니다.');
  } finally {
    hideLoading();
  }
}
```

### 테이블 렌더링

```javascript
function renderPharmacyTable(pharmacies) {
  const tbody = document.getElementById('pharmacy_table_body');
  if (!tbody) return;
  
  if (pharmacies.length === 0) {
    tbody.innerHTML = '<tr><td colspan="13" class="text-center py-4">데이터가 없습니다.</td></tr>';
    return;
  }
  
  tbody.innerHTML = pharmacies.map(pharmacy => `
    <tr>
      <td>${pharmacy.num}</td>
      <td>
        <button class="btn btn-link p-0" data-num="${pharmacy.num}" onclick="showDetailModal(${pharmacy.num})">
          ${pharmacy.company || '-'}
        </button>
      </td>
      <td>${pharmacy.business_number || '-'}</td>
      <td>${pharmacy.manager || '-'}</td>
      <td class="d-none d-lg-table-cell">${pharmacy.phone || '-'}</td>
      <td class="d-none d-xl-table-cell">${pharmacy.tel || '-'}</td>
      <td class="d-none d-lg-table-cell">${pharmacy.chemist_design || '-'}</td>
      <td class="d-none d-lg-table-cell">${pharmacy.area_design || '-'}</td>
      <td>${formatDate(pharmacy.approval_date)}</td>
      <td><span class="badge badge-${getStatusBadgeClass(pharmacy.status)}">${getStatusText(pharmacy.status)}</span></td>
      <td class="d-none d-xl-table-cell">${pharmacy.memo || '-'}</td>
      <td>${formatCurrency(pharmacy.premium)}</td>
      <td>${pharmacy.account_company || '-'}</td>
    </tr>
  `).join('');
}
```

---

## 주요 기능 구현

### 1. 필터/검색 영역

**HTML 구조**:
```html
<div class="search-filter-row">
  <div class="row align-items-end">
    <!-- 거래처 필터 -->
    <div class="col-md-2 col-sm-6 mb-2 mb-md-0">
      <select id="accountFilter" class="form-control">
        <option value="">전체 거래처</option>
      </select>
    </div>
    
    <!-- 상태 필터 -->
    <div class="col-md-2 col-sm-6 mb-2 mb-md-0">
      <select id="statusFilter" class="form-control">
        <option value="">전체</option>
        <option value="10">메일보냄</option>
        <option value="13" selected>승인</option>
        <option value="7">보류</option>
        <option value="14">증권발급</option>
        <option value="15">해지요청</option>
        <option value="16">해지완료</option>
        <option value="17">설계중</option>
      </select>
    </div>
    
    <!-- 페이지 크기 -->
    <div class="col-md-2 col-sm-6 mb-2 mb-md-0">
      <select id="pageSize" class="form-control">
        <option value="20" selected>20개</option>
        <option value="50">50개</option>
        <option value="100">100개</option>
      </select>
    </div>
    
    <!-- 검색 영역 -->
    <div class="col-md-6">
      <div class="input-group">
        <input type="text" id="search_word" class="form-control" placeholder="업체명, 사업자번호, 담당자로 검색">
        <div class="input-group-append">
          <button class="btn btn-primary" type="button" id="search_btn">
            <i class="fas fa-search"></i> <span class="d-none d-sm-inline">검색</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</div>
```

**JavaScript 초기화**:
```javascript
// 거래처 필터 초기화
async function initializeAccountFilter() {
  try {
    await loadAccountOptions();
    setupAccountFilterEvents();
  } catch (error) {
    console.error('거래처 필터 초기화 실패:', error);
  }
}

// 거래처 옵션 로드
async function loadAccountOptions() {
  const accountSelect = document.getElementById('accountFilter');
  if (!accountSelect) return;
  
  try {
    accountSelect.innerHTML = '<option value="">로딩 중...</option>';
    accountSelect.disabled = true;
    
    const response = await fetch('/api/pharmacy/accounts', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    accountSelect.innerHTML = '<option value="">전체 거래처</option>';
    
    if (data.success && Array.isArray(data.data)) {
      data.data.forEach(account => {
        const option = document.createElement('option');
        option.value = account.num;
        option.textContent = account.directory;
        accountSelect.appendChild(option);
      });
    }
  } catch (error) {
    console.error('거래처 옵션 로드 오류:', error);
    accountSelect.innerHTML = '<option value="">전체 거래처</option>';
  } finally {
    accountSelect.disabled = false;
  }
}
```

### 2. 테이블 영역

**HTML 구조**:
```html
<div class="desktop-table">
  <div class="table-responsive">
    <table class="table table-bordered table-hover table-sm">
      <thead class="thead-light">
        <tr>
          <th class="col-number">#</th>
          <th class="col-company-name">업체명</th>
          <th class="col-business-number">사업자번호</th>
          <th class="col-manager">담당자</th>
          <th class="col-phone d-none d-lg-table-cell">휴대전화</th>
          <th class="col-phone d-none d-xl-table-cell">연락처</th>
          <th class="col-design-number d-none d-lg-table-cell">전문설계번호</th>
          <th class="col-design-number d-none d-lg-table-cell">화재설계번호</th>
          <th class="col-date">승인일</th>
          <th class="col-status">상태</th>
          <th class="col-memo d-none d-xl-table-cell">메모</th>
          <th class="col-premium">보험료</th>
          <th class="col-account">거래처</th>
        </tr>
      </thead>
      <tbody id="pharmacy_table_body">
        <tr>
          <td colspan="13" class="text-center py-4">데이터를 불러오는 중...</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

**반응형 클래스**:
- `d-none d-lg-table-cell`: 태블릿 이상에서만 표시
- `d-none d-xl-table-cell`: 데스크톱 이상에서만 표시

### 3. 페이징 영역

**HTML 구조**:
```html
<div class="row mt-3">
  <div class="col-md-6 col-12 mb-2">
    <div id="pagination_info" class="dataTables_info text-center text-md-left"></div>
  </div>
  <div class="col-md-6 col-12">
    <nav aria-label="Page navigation">
      <ul class="pagination pagination-sm justify-content-center justify-content-md-end" id="pagination_controls">
      </ul>
    </nav>
  </div>
</div>
```

**JavaScript 페이징 렌더링**:
```javascript
function renderPagination(pagination) {
  const info = document.getElementById('pagination_info');
  const controls = document.getElementById('pagination_controls');
  
  if (!info || !controls) return;
  
  // 정보 표시
  const start = (pagination.current_page - 1) * pagination.per_page + 1;
  const end = Math.min(start + pagination.per_page - 1, pagination.total_count);
  info.textContent = `총 ${pagination.total_count}개 중 ${start}-${end}개 표시`;
  
  // 페이징 버튼
  controls.innerHTML = '';
  
  // 이전 버튼
  const prevBtn = document.createElement('li');
  prevBtn.className = `page-item ${pagination.current_page === 1 ? 'disabled' : ''}`;
  prevBtn.innerHTML = `<a class="page-link" href="#" onclick="goToPage(${pagination.current_page - 1}); return false;">이전</a>`;
  controls.appendChild(prevBtn);
  
  // 페이지 번호 버튼
  for (let i = 1; i <= pagination.total_pages; i++) {
    const pageBtn = document.createElement('li');
    pageBtn.className = `page-item ${i === pagination.current_page ? 'active' : ''}`;
    pageBtn.innerHTML = `<a class="page-link" href="#" onclick="goToPage(${i}); return false;">${i}</a>`;
    controls.appendChild(pageBtn);
  }
  
  // 다음 버튼
  const nextBtn = document.createElement('li');
  nextBtn.className = `page-item ${pagination.current_page === pagination.total_pages ? 'disabled' : ''}`;
  nextBtn.innerHTML = `<a class="page-link" href="#" onclick="goToPage(${pagination.current_page + 1}); return false;">다음</a>`;
  controls.appendChild(nextBtn);
}

function goToPage(page) {
  currentPage = page;
  loadPharmacyData();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
```

---

## 새 페이지 생성 방법

### 1. HTML 파일 생성

`public/pages/pharmacy/` 폴더에 새 HTML 파일 생성

### 2. 템플릿 구조 복사

기존 `applications.html`의 기본 구조를 복사

### 3. pageId 설정

```javascript
await window.sjTemplateLoader.initializePage('pharmacy-새페이지');
```

### 4. 사이드바에 메뉴 추가

`public/components/sj-sidebar.html`에 메뉴 항목 추가:
```html
<a href="/pages/pharmacy/새페이지.html" data-menu="pharmacy-새페이지">
  새 페이지
</a>
```

### 5. JavaScript 파일 생성

`public/js/pharmacy/` 폴더에 새 JS 파일 생성

### 6. HTML에 스크립트 추가

```html
<script src="/js/pharmacy/새페이지.js"></script>
```

---

## 유틸리티 함수

### 날짜 포맷팅

```javascript
function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR');
}
```

### 통화 포맷팅

```javascript
function formatCurrency(amount) {
  if (!amount) return '-';
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW'
  }).format(amount);
}
```

### 상태 텍스트 변환

```javascript
function getStatusText(status) {
  const statusMap = {
    '10': '메일보냄',
    '13': '승인',
    '7': '보류',
    '14': '증권발급',
    '15': '해지요청',
    '16': '해지완료',
    '17': '설계중'
  };
  return statusMap[status] || status;
}
```

### 상태 배지 클래스

```javascript
function getStatusBadgeClass(status) {
  const classMap = {
    '10': 'info',
    '13': 'success',
    '7': 'warning',
    '14': 'primary',
    '15': 'danger',
    '16': 'secondary',
    '17': 'warning'
  };
  return classMap[status] || 'secondary';
}
```

---

## 에러 처리

### 에러 표시 함수

```javascript
function showError(message) {
  if (window.sjTemplateLoader && window.sjTemplateLoader.showToast) {
    window.sjTemplateLoader.showToast(message, 'error');
  } else {
    alert(message);
  }
}
```

### 성공 메시지 표시

```javascript
function showSuccess(message) {
  if (window.sjTemplateLoader && window.sjTemplateLoader.showToast) {
    window.sjTemplateLoader.showToast(message, 'success');
  } else {
    alert(message);
  }
}
```

---

## 로딩 상태 관리

### 로딩 표시

```javascript
function showLoading() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) {
    overlay.style.display = 'flex';
  }
}
```

### 로딩 숨김

```javascript
function hideLoading() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) {
    overlay.style.display = 'none';
  }
}
```

---

**문서 버전**: 1.0  
**최종 업데이트**: 2025-01-XX


# 보험 운영 플랫폼 - 티켓 시스템 UI 구현 가이드

이 문서는 티켓 시스템의 프론트엔드 UI 구현을 위한 가이드입니다. 기존 페이지 구조를 참조하여 일관성 있게 구현합니다.

---

## 📚 참고 문서

- **상품페이지 작성 가이드**: `docs/상품페이지_작성가이드.md` ⭐
- **기존 페이지 참고**:
  - `public/pages/pharmacy/applications.html` - 목록 페이지 구조
  - `public/pages/manual/mistake-cases.html` - 목록 페이지 구조
  - `public/pages/manual/mistake-case-detail.html` - 상세 페이지 구조

---

## 🎯 구현할 페이지 목록

### 1. 티켓 목록 페이지
- **파일**: `public/pages/tickets/list.html`
- **pageId**: `tickets-list`
- **기능**: 티켓 목록 조회, 필터링, 검색, 페이징

### 2. 티켓 상세 페이지
- **파일**: `public/pages/tickets/detail.html`
- **pageId**: `tickets-detail`
- **기능**: 티켓 상세 정보, 체크리스트, 협업자, 승인 상태, Activity Log

### 3. 티켓 생성/수정 폼
- **파일**: `public/pages/tickets/form.html`
- **pageId**: `tickets-form`
- **기능**: 티켓 생성 및 수정

### 4. 승인 처리 페이지
- **파일**: `public/pages/tickets/approvals.html`
- **pageId**: `tickets-approvals`
- **기능**: 대기 중인 승인 목록, 승인/거부 처리

---

## 📁 파일 구조

```
disk-cms/
├── public/
│   ├── pages/
│   │   └── tickets/
│   │       ├── list.html          # 티켓 목록
│   │       ├── detail.html        # 티켓 상세
│   │       ├── form.html          # 티켓 생성/수정
│   │       └── approvals.html     # 승인 처리
│   └── js/
│       └── tickets/
│           ├── tickets-list.js       # 목록 관리
│           ├── tickets-detail.js     # 상세 페이지
│           ├── tickets-form.js       # 생성/수정 폼
│           └── tickets-approvals.js  # 승인 처리
```

---

## 1. 티켓 목록 페이지 (`list.html`)

### 1.1 기본 구조

**참고**: `public/pages/manual/mistake-cases.html` 구조를 참고

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>보험 CMS | 업무 티켓 - 목록</title>
  
  <!-- 공용 리소스 -->
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

  <!-- 헤더/사이드바 컨테이너 -->
  <div id="header-container"></div>
  <div class="sidebar-overlay" id="sidebarOverlay"></div>
  <div id="sidebar-container"></div>

  <!-- 메인 컨텐츠 -->
  <main class="main-content">
    <div class="row">
      <div class="col-12">
        <div class="card">
          <div class="card-body">
            
            <!-- 필터/검색 영역 -->
            <div class="search-filter-row mb-4">
              <div class="row align-items-end">
                <!-- 상태 필터 -->
                <div class="col-md-2 col-sm-6 mb-2 mb-md-0">
                  <label class="filter-label">상태</label>
                  <select id="statusFilter" class="form-control filter-select">
                    <option value="">전체</option>
                    <option value="NEW">신규</option>
                    <option value="ASSIGNED">배정됨</option>
                    <option value="IN_PROGRESS">진행중</option>
                    <option value="REVIEW">검토중</option>
                    <option value="DONE">완료</option>
                    <option value="ARCHIVED">보관</option>
                  </select>
                </div>
                
                <!-- 티켓 유형 필터 -->
                <div class="col-md-2 col-sm-6 mb-2 mb-md-0">
                  <label class="filter-label">티켓 유형</label>
                  <select id="ticketTypeFilter" class="form-control filter-select">
                    <option value="">전체</option>
                    <option value="SETTLE">정산</option>
                    <option value="CLAIM">클레임</option>
                    <option value="ACCIDENT">사고</option>
                    <option value="PARTNER">파트너</option>
                    <option value="DEV">개발</option>
                    <option value="PLAN">기획</option>
                    <option value="OTHER">기타</option>
                  </select>
                </div>
                
                <!-- 우선순위 필터 -->
                <div class="col-md-2 col-sm-6 mb-2 mb-md-0">
                  <label class="filter-label">우선순위</label>
                  <select id="priorityFilter" class="form-control filter-select">
                    <option value="">전체</option>
                    <option value="low">낮음</option>
                    <option value="medium">보통</option>
                    <option value="high">높음</option>
                    <option value="urgent">긴급</option>
                  </select>
                </div>
                
                <!-- 페이지 크기 -->
                <div class="col-md-2 col-sm-6 mb-2 mb-md-0">
                  <label class="filter-label">페이지 크기</label>
                  <select id="pageSizeFilter" class="form-control filter-select">
                    <option value="10">10개</option>
                    <option value="20" selected>20개</option>
                    <option value="50">50개</option>
                    <option value="100">100개</option>
                  </select>
                </div>
                
                <!-- 검색 영역 -->
                <div class="col-md-4">
                  <label class="filter-label">검색</label>
                  <div class="input-group">
                    <input type="text" id="searchInput" class="form-control" placeholder="티켓 번호, 제목으로 검색">
                    <div class="input-group-append">
                      <button class="btn btn-primary" type="button" id="searchBtn">
                        <i class="fas fa-search"></i> <span class="d-none d-sm-inline">검색</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 버튼 영역 -->
            <div class="row mb-3">
              <div class="col-12">
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <h5 class="mb-0">업무 티켓 목록</h5>
                    <small class="text-muted" id="totalInfo">전체 0건</small>
                  </div>
                  <a href="/pages/tickets/form.html" class="btn btn-success">
                    <i class="fas fa-plus"></i> 새 티켓 생성
                  </a>
                </div>
              </div>
            </div>
            
            <!-- 목록 테이블 -->
            <div class="table-responsive">
              <table class="table table-hover" id="ticketsTable">
                <thead>
                  <tr>
                    <th style="width: 50px;">번호</th>
                    <th style="width: 150px;">티켓 번호</th>
                    <th style="width: 100px;">유형</th>
                    <th style="width: 80px;">상태</th>
                    <th>제목</th>
                    <th style="width: 100px;">담당자</th>
                    <th style="width: 80px;">우선순위</th>
                    <th style="width: 120px;">생성일</th>
                    <th style="width: 100px;">작업</th>
                  </tr>
                </thead>
                <tbody id="ticketsTableBody">
                  <tr>
                    <td colspan="9" class="text-center py-4">
                      <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- 페이징 -->
            <div class="row mt-3">
              <div class="col-md-6 col-12 mb-2">
                <div id="paginationInfo" class="dataTables_info text-center text-md-left"></div>
              </div>
              <div class="col-md-6 col-12">
                <nav aria-label="Page navigation">
                  <ul class="pagination pagination-sm justify-content-center justify-content-md-end" id="paginationControls">
                    <!-- 페이징 버튼이 여기에 로드됩니다 -->
                  </ul>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>

  <!-- Bootstrap JS -->
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
  
  <!-- SJ 템플릿 로더 -->
  <script src="/js/sj-template-loader.js"></script>
  
  <script>
    document.addEventListener('DOMContentLoaded', async function() {
      await window.sjTemplateLoader.initializePage('tickets-list');
    });
  </script>
  <script src="/js/tickets/tickets-list.js"></script>
</body>
</html>
```

### 1.2 JavaScript 파일 (`tickets-list.js`)

**참고**: `public/js/manual/mistake-cases-list.js` 구조를 참고

```javascript
// ==============================
// js/tickets/tickets-list.js - 티켓 목록 관리
// ==============================

class TicketsManager {
    constructor() {
        this.currentPage = 1;
        this.currentLimit = 20;
        this.currentFilters = {};
        this.tickets = [];
        this.totalCount = 0;
        this.init();
    }

    async init() {
        try {
            this.initDOMElements();
            this.attachEventListeners();
            await this.loadTickets();
        } catch (error) {
            console.error('티켓 목록 초기화 실패:', error);
            this.showError('시스템 초기화 중 오류가 발생했습니다.');
        }
    }

    initDOMElements() {
        // 필터 요소들
        this.statusFilter = document.getElementById('statusFilter');
        this.ticketTypeFilter = document.getElementById('ticketTypeFilter');
        this.priorityFilter = document.getElementById('priorityFilter');
        this.pageSizeFilter = document.getElementById('pageSizeFilter');
        this.searchInput = document.getElementById('searchInput');
        this.searchBtn = document.getElementById('searchBtn');
        
        // 정보 요소들
        this.totalInfo = document.getElementById('totalInfo');
        
        // 테이블 요소들
        this.tableBody = document.getElementById('ticketsTableBody');
        this.paginationInfo = document.getElementById('paginationInfo');
        this.paginationControls = document.getElementById('paginationControls');
    }

    attachEventListeners() {
        this.searchBtn.addEventListener('click', () => this.handleSearch());
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSearch();
        });
        
        this.statusFilter.addEventListener('change', () => this.handleFilterChange());
        this.ticketTypeFilter.addEventListener('change', () => this.handleFilterChange());
        this.priorityFilter.addEventListener('change', () => this.handleFilterChange());
        this.pageSizeFilter.addEventListener('change', () => this.handleFilterChange());
    }

    async loadTickets(page = 1) {
        try {
            this.currentPage = page;
            this.showLoading(true);
            
            const params = new URLSearchParams({
                page: this.currentPage,
                limit: this.currentLimit,
                status: this.statusFilter.value || '',
                ticket_type: this.ticketTypeFilter.value || '',
                priority: this.priorityFilter.value || '',
                search: this.searchInput.value || ''
            });
            
            const response = await fetch(`/api/tickets?${params}`, {
                credentials: 'include'
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.tickets = result.data;
                this.totalCount = result.count;
                this.renderTable();
                this.renderPagination();
                this.updateTotalInfo();
            } else {
                this.showError(result.message || '티켓 목록을 불러오는데 실패했습니다.');
            }
        } catch (error) {
            console.error('티켓 목록 로드 오류:', error);
            this.showError('티켓 목록을 불러오는 중 오류가 발생했습니다.');
        } finally {
            this.showLoading(false);
        }
    }

    renderTable() {
        if (this.tickets.length === 0) {
            this.tableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center py-4">
                        <div class="text-muted">
                            <i class="fas fa-inbox fa-2x mb-2"></i>
                            <div>등록된 티켓이 없습니다.</div>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        this.tableBody.innerHTML = this.tickets.map((ticket, index) => {
            const rowNum = (this.currentPage - 1) * this.currentLimit + index + 1;
            const statusBadge = this.getStatusBadge(ticket.status);
            const typeBadge = this.getTypeBadge(ticket.ticket_type_code);
            const priorityBadge = this.getPriorityBadge(ticket.priority);
            const createdAt = this.formatDate(ticket.created_at);

            return `
                <tr style="cursor: pointer;" onclick="window.location.href='/pages/tickets/detail.html?id=${ticket.id}'">
                    <td>${rowNum}</td>
                    <td><code>${this.escapeHtml(ticket.ticket_number)}</code></td>
                    <td>${typeBadge}</td>
                    <td>${statusBadge}</td>
                    <td>
                        <div class="fw-bold">${this.escapeHtml(ticket.title)}</div>
                        ${ticket.description ? `<small class="text-muted">${this.escapeHtml(ticket.description.substring(0, 50))}${ticket.description.length > 50 ? '...' : ''}</small>` : ''}
                    </td>
                    <td>${this.escapeHtml(ticket.owner_name || ticket.creator_name || '-')}</td>
                    <td>${priorityBadge}</td>
                    <td>${createdAt}</td>
                    <td>
                        <a href="/pages/tickets/detail.html?id=${ticket.id}" class="btn btn-sm btn-primary">
                            <i class="fas fa-eye"></i> 보기
                        </a>
                    </td>
                </tr>
            `;
        }).join('');
    }

    getStatusBadge(status) {
        const badges = {
            'NEW': '<span class="badge bg-secondary">신규</span>',
            'ASSIGNED': '<span class="badge bg-info">배정됨</span>',
            'IN_PROGRESS': '<span class="badge bg-primary">진행중</span>',
            'REVIEW': '<span class="badge bg-warning">검토중</span>',
            'DONE': '<span class="badge bg-success">완료</span>',
            'ARCHIVED': '<span class="badge bg-dark">보관</span>'
        };
        return badges[status] || '<span class="badge bg-secondary">-</span>';
    }

    getTypeBadge(type) {
        const types = {
            'SETTLE': '정산',
            'CLAIM': '클레임',
            'ACCIDENT': '사고',
            'PARTNER': '파트너',
            'DEV': '개발',
            'PLAN': '기획',
            'OTHER': '기타'
        };
        return `<span class="badge bg-primary">${types[type] || type}</span>`;
    }

    getPriorityBadge(priority) {
        const badges = {
            'low': '<span class="badge bg-success">낮음</span>',
            'medium': '<span class="badge bg-warning">보통</span>',
            'high': '<span class="badge bg-danger">높음</span>',
            'urgent': '<span class="badge bg-danger">긴급</span>'
        };
        return badges[priority] || '<span class="badge bg-secondary">-</span>';
    }

    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    renderPagination() {
        const totalPages = Math.ceil(this.totalCount / this.currentLimit);
        const currentPage = this.currentPage;

        // 페이지 정보
        const start = (currentPage - 1) * this.currentLimit + 1;
        const end = Math.min(currentPage * this.currentLimit, this.totalCount);
        this.paginationInfo.textContent = `총 ${this.totalCount}건 중 ${start}-${end}건 표시`;

        // 페이지네이션 버튼 (기존 mistake-cases-list.js 참고)
        // ... 페이징 로직 ...
    }

    updateTotalInfo() {
        this.totalInfo.textContent = `전체 ${this.totalCount}건`;
    }

    handleSearch() {
        this.currentPage = 1;
        this.loadTickets(1);
    }

    handleFilterChange() {
        this.currentPage = 1;
        this.currentLimit = parseInt(this.pageSizeFilter.value);
        this.loadTickets(1);
    }

    showLoading(show) {
        if (show) {
            this.tableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center py-4">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                    </td>
                </tr>
            `;
        }
    }

    showError(message) {
        if (this.tableBody) {
            this.tableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center py-4">
                        <div class="alert alert-danger mb-0">
                            <i class="fas fa-exclamation-circle"></i> ${this.escapeHtml(message)}
                        </div>
                    </td>
                </tr>
            `;
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 전역 인스턴스 생성
let ticketsManager;
document.addEventListener('DOMContentLoaded', () => {
    ticketsManager = new TicketsManager();
    window.ticketsManager = ticketsManager;
});
```

---

## 2. 티켓 상세 페이지 (`detail.html`)

### 2.1 기본 구조

**참고**: `public/pages/manual/mistake-case-detail.html` 구조를 참고

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>보험 CMS | 업무 티켓 - 상세</title>
  
  <!-- 공용 리소스 -->
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

  <!-- 헤더/사이드바 컨테이너 -->
  <div id="header-container"></div>
  <div class="sidebar-overlay" id="sidebarOverlay"></div>
  <div id="sidebar-container"></div>

  <!-- 메인 컨텐츠 -->
  <main class="main-content">
    <div class="row">
      <div class="col-12">
        <div class="card">
          <div class="card-body">
            
            <!-- 티켓 헤더 -->
            <div class="d-flex justify-content-between align-items-start mb-4">
              <div>
                <h4 id="ticketTitle" class="mb-2">-</h4>
                <div class="text-muted" id="ticketMeta">
                  <span id="ticketNumber">-</span> | 
                  <span id="ticketStatus">-</span> | 
                  생성자: <span id="creatorName">-</span> | 
                  생성일: <span id="createdAt">-</span>
                </div>
              </div>
              <div>
                <button id="editBtn" class="btn btn-primary btn-sm" style="display: none;">
                  <i class="fas fa-edit"></i> 수정
                </button>
                <a href="/pages/tickets/list.html" class="btn btn-secondary btn-sm">
                  <i class="fas fa-list"></i> 목록
                </a>
              </div>
            </div>

            <!-- 탭 네비게이션 -->
            <ul class="nav nav-tabs mb-3" id="ticketTabs" role="tablist">
              <li class="nav-item" role="presentation">
                <button class="nav-link active" id="info-tab" data-bs-toggle="tab" data-bs-target="#info" type="button">
                  <i class="fas fa-info-circle"></i> 기본 정보
                </button>
              </li>
              <li class="nav-item" role="presentation">
                <button class="nav-link" id="checklist-tab" data-bs-toggle="tab" data-bs-target="#checklist" type="button">
                  <i class="fas fa-check-square"></i> 체크리스트
                </button>
              </li>
              <li class="nav-item" role="presentation">
                <button class="nav-link" id="approvals-tab" data-bs-toggle="tab" data-bs-target="#approvals" type="button">
                  <i class="fas fa-check-circle"></i> 승인 <span id="approvalsBadge" class="badge bg-warning">0</span>
                </button>
              </li>
              <li class="nav-item" role="presentation">
                <button class="nav-link" id="collaborators-tab" data-bs-toggle="tab" data-bs-target="#collaborators" type="button">
                  <i class="fas fa-users"></i> 협업자
                </button>
              </li>
              <li class="nav-item" role="presentation">
                <button class="nav-link" id="activity-tab" data-bs-toggle="tab" data-bs-target="#activity" type="button">
                  <i class="fas fa-history"></i> 활동 내역
                </button>
              </li>
            </ul>

            <!-- 탭 콘텐츠 -->
            <div class="tab-content" id="ticketTabContent">
              
              <!-- 기본 정보 탭 -->
              <div class="tab-pane fade show active" id="info" role="tabpanel">
                <div class="row">
                  <div class="col-md-6">
                    <table class="table table-bordered">
                      <tr>
                        <th style="width: 150px;">티켓 번호</th>
                        <td id="ticketNumberDetail">-</td>
                      </tr>
                      <tr>
                        <th>상태</th>
                        <td id="ticketStatusDetail">-</td>
                      </tr>
                      <tr>
                        <th>유형</th>
                        <td id="ticketTypeDetail">-</td>
                      </tr>
                      <tr>
                        <th>우선순위</th>
                        <td id="ticketPriorityDetail">-</td>
                      </tr>
                      <tr>
                        <th>심각도</th>
                        <td id="ticketSeverityDetail">-</td>
                      </tr>
                    </table>
                  </div>
                  <div class="col-md-6">
                    <table class="table table-bordered">
                      <tr>
                        <th style="width: 150px;">담당자</th>
                        <td id="ticketOwnerDetail">-</td>
                      </tr>
                      <tr>
                        <th>생성자</th>
                        <td id="ticketCreatorDetail">-</td>
                      </tr>
                      <tr>
                        <th>생성일</th>
                        <td id="ticketCreatedAtDetail">-</td>
                      </tr>
                      <tr>
                        <th>수정일</th>
                        <td id="ticketUpdatedAtDetail">-</td>
                      </tr>
                      <tr>
                        <th>금액</th>
                        <td id="ticketAmountDetail">-</td>
                      </tr>
                    </table>
                  </div>
                </div>
                <div class="mt-3">
                  <h6>설명</h6>
                  <div id="ticketDescription" class="border p-3 rounded">
                    -
                  </div>
                </div>
              </div>

              <!-- 체크리스트 탭 -->
              <div class="tab-pane fade" id="checklist" role="tabpanel">
                <div id="checklistContainer">
                  <div class="text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                      <span class="visually-hidden">Loading...</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 승인 탭 -->
              <div class="tab-pane fade" id="approvals" role="tabpanel">
                <div id="approvalsContainer">
                  <div class="text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                      <span class="visually-hidden">Loading...</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 협업자 탭 -->
              <div class="tab-pane fade" id="collaborators" role="tabpanel">
                <div id="collaboratorsContainer">
                  <div class="text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                      <span class="visually-hidden">Loading...</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 활동 내역 탭 -->
              <div class="tab-pane fade" id="activity" role="tabpanel">
                <div id="activityLogsContainer">
                  <div class="text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                      <span class="visually-hidden">Loading...</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            <!-- 상태 변경 버튼 영역 -->
            <div class="mt-4 border-top pt-3">
              <h6>상태 변경</h6>
              <div class="btn-group" role="group" id="statusChangeButtons">
                <!-- 상태에 따라 버튼이 동적으로 생성됨 -->
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  </main>

  <!-- Bootstrap JS -->
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
  
  <!-- SJ 템플릿 로더 -->
  <script src="/js/sj-template-loader.js"></script>
  
  <script>
    document.addEventListener('DOMContentLoaded', async function() {
      await window.sjTemplateLoader.initializePage('tickets-detail');
    });
  </script>
  <script src="/js/tickets/tickets-detail.js"></script>
</body>
</html>
```

---

## 3. 티켓 생성/수정 폼 (`form.html`)

### 3.1 기본 구조

**참고**: `public/pages/manual/mistake-case-form.html` 구조를 참고

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>보험 CMS | 업무 티켓 - <span id="formTitle">생성</span></title>
  
  <!-- 공용 리소스 -->
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

  <!-- 헤더/사이드바 컨테이너 -->
  <div id="header-container"></div>
  <div class="sidebar-overlay" id="sidebarOverlay"></div>
  <div id="sidebar-container"></div>

  <!-- 메인 컨텐츠 -->
  <main class="main-content">
    <div class="row">
      <div class="col-12">
        <div class="card">
          <div class="card-body">
            
            <form id="ticketForm">
              <!-- 기본 정보 -->
              <div class="mb-4">
                <h5 class="mb-3">기본 정보</h5>
                
                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label for="ticketTypeCode" class="form-label">티켓 유형 <span class="text-danger">*</span></label>
                    <select id="ticketTypeCode" class="form-control" required>
                      <option value="">선택하세요</option>
                      <option value="SETTLE">정산</option>
                      <option value="CLAIM">클레임</option>
                      <option value="ACCIDENT">사고</option>
                      <option value="PARTNER">파트너</option>
                      <option value="DEV">개발</option>
                      <option value="PLAN">기획</option>
                      <option value="OTHER">기타</option>
                    </select>
                  </div>
                  
                  <div class="col-md-6 mb-3">
                    <label for="title" class="form-label">제목 <span class="text-danger">*</span></label>
                    <input type="text" id="title" class="form-control" required>
                  </div>
                </div>

                <div class="row">
                  <div class="col-md-3 mb-3">
                    <label for="priority" class="form-label">우선순위</label>
                    <select id="priority" class="form-control">
                      <option value="low">낮음</option>
                      <option value="medium" selected>보통</option>
                      <option value="high">높음</option>
                      <option value="urgent">긴급</option>
                    </select>
                  </div>
                  
                  <div class="col-md-3 mb-3">
                    <label for="severity" class="form-label">심각도</label>
                    <select id="severity" class="form-control">
                      <option value="P2">P2</option>
                      <option value="P1" selected>P1</option>
                      <option value="P0">P0</option>
                    </select>
                  </div>
                  
                  <div class="col-md-3 mb-3">
                    <label for="sensitivityLevel" class="form-label">민감도</label>
                    <select id="sensitivityLevel" class="form-control">
                      <option value="NORMAL" selected>일반</option>
                      <option value="SENSITIVE">민감</option>
                    </select>
                  </div>
                  
                  <div class="col-md-3 mb-3">
                    <label for="amount" class="form-label">금액</label>
                    <input type="number" id="amount" class="form-control" placeholder="0">
                  </div>
                </div>

                <div class="mb-3">
                  <label for="description" class="form-label">설명</label>
                  <textarea id="description" class="form-control" rows="5" placeholder="티켓에 대한 상세 설명을 입력하세요"></textarea>
                </div>
              </div>

              <!-- 제출 버튼 -->
              <div class="d-flex justify-content-between">
                <a href="/pages/tickets/list.html" class="btn btn-secondary">
                  <i class="fas fa-times"></i> 취소
                </a>
                <button type="submit" class="btn btn-primary">
                  <i class="fas fa-check"></i> 저장
                </button>
              </div>
            </form>

          </div>
        </div>
      </div>
    </div>
  </main>

  <!-- Bootstrap JS -->
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
  
  <!-- SJ 템플릿 로더 -->
  <script src="/js/sj-template-loader.js"></script>
  
  <script>
    document.addEventListener('DOMContentLoaded', async function() {
      await window.sjTemplateLoader.initializePage('tickets-form');
    });
  </script>
  <script src="/js/tickets/tickets-form.js"></script>
</body>
</html>
```

---

## 4. 승인 처리 페이지 (`approvals.html`)

### 4.1 기본 구조

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>보험 CMS | 업무 티켓 - 승인 대기</title>
  
  <!-- 공용 리소스 -->
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

  <!-- 헤더/사이드바 컨테이너 -->
  <div id="header-container"></div>
  <div class="sidebar-overlay" id="sidebarOverlay"></div>
  <div id="sidebar-container"></div>

  <!-- 메인 컨텐츠 -->
  <main class="main-content">
    <div class="row">
      <div class="col-12">
        <div class="card">
          <div class="card-body">
            
            <h5 class="mb-4">승인 대기 목록</h5>
            
            <!-- 승인 목록 -->
            <div id="approvalsListContainer">
              <div class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  </main>

  <!-- Bootstrap JS -->
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
  
  <!-- SJ 템플릿 로더 -->
  <script src="/js/sj-template-loader.js"></script>
  
  <script>
    document.addEventListener('DOMContentLoaded', async function() {
      await window.sjTemplateLoader.initializePage('tickets-approvals');
    });
  </script>
  <script src="/js/tickets/tickets-approvals.js"></script>
</body>
</html>
```

---

## 5. 사이드바 메뉴 등록

### 5.1 메뉴 구조

`public/config/menu-config.json` 또는 `sj-sidebar.html`에 추가:

```html
<!-- 보험 운영 플랫폼 메뉴 -->
<li class="menu-title">보험 운영 플랫폼</li>
<li>
  <a href="/pages/tickets/list.html" data-menu="tickets-list">
    <i class="fas fa-ticket-alt"></i> 티켓 목록
  </a>
</li>
<li>
  <a href="/pages/tickets/approvals.html" data-menu="tickets-approvals">
    <i class="fas fa-check-circle"></i> 승인 대기
  </a>
</li>
```

### 5.2 헤더 업데이트 설정

`public/js/sj-template-loader.js`의 `pageConfig`에 추가:

```javascript
const pageConfig = {
  // ... 기존 설정들 ...
  
  // 티켓 시스템
  'tickets-list': {
    title: '보험 운영 플랫폼',
    description: '티켓 목록'
  },
  'tickets-detail': {
    title: '보험 운영 플랫폼',
    description: '티켓 상세'
  },
  'tickets-form': {
    title: '보험 운영 플랫폼',
    description: '티켓 생성/수정'
  },
  'tickets-approvals': {
    title: '보험 운영 플랫폼',
    description: '승인 대기'
  }
};
```

---

## 6. API 엔드포인트 매핑

티켓 시스템은 Node.js 백엔드만 사용하므로 PHP 프록시가 필요 없습니다.

**API 경로**: `/api/tickets/*`, `/api/approvals/*`

**프론트엔드에서 호출 예시**:
```javascript
// 티켓 목록 조회
const response = await fetch('/api/tickets?status=NEW&limit=20', {
  credentials: 'include'
});

// 티켓 상세 조회
const response = await fetch(`/api/tickets/${ticketId}`, {
  credentials: 'include'
});

// 티켓 생성
const response = await fetch('/api/tickets', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify(ticketData)
});

// 상태 변경
const response = await fetch(`/api/tickets/${ticketId}/status`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ status: 'REVIEW' })
});
```

---

## 7. 구현 체크리스트

### 공통 사항
- [ ] 사이드바 `data-menu`와 `initializePage`의 pageId 일치 확인
- [ ] `sj-template-loader.js`의 `pageConfig`에 새 페이지 추가
- [ ] 공용 리소스 로드 확인 (폰트, Font Awesome, Bootstrap, sj-styles.css)
- [ ] 헤더/사이드바 컨테이너 존재 확인

### 티켓 목록 페이지
- [ ] 필터 영역 구현 (상태, 유형, 우선순위, 검색)
- [ ] 테이블 구조 구현
- [ ] 페이징 구현
- [ ] JavaScript 파일 구현 (`tickets-list.js`)

### 티켓 상세 페이지
- [ ] 탭 구조 구현 (기본 정보, 체크리스트, 승인, 협업자, 활동 내역)
- [ ] 상태 변경 버튼 구현
- [ ] JavaScript 파일 구현 (`tickets-detail.js`)

### 티켓 생성/수정 폼
- [ ] 폼 필드 구현
- [ ] 유효성 검사
- [ ] JavaScript 파일 구현 (`tickets-form.js`)

### 승인 처리 페이지
- [ ] 승인 목록 표시
- [ ] 승인/거부 버튼 구현
- [ ] JavaScript 파일 구현 (`tickets-approvals.js`)

---

## 8. 참고 파일 목록

### 기존 페이지 (구조 참고)
- `public/pages/pharmacy/applications.html` - 목록 페이지
- `public/pages/manual/mistake-cases.html` - 목록 페이지
- `public/pages/manual/mistake-case-detail.html` - 상세 페이지
- `public/pages/manual/mistake-case-form.html` - 폼 페이지

### 기존 JavaScript (로직 참고)
- `public/js/manual/mistake-cases-list.js` - 목록 관리
- `public/js/manual/mistake-case-detail.js` - 상세 페이지
- `public/js/manual/mistake-case-form.js` - 폼 관리

---

## 9. 다음 단계

1. **티켓 목록 페이지 구현** (`list.html` + `tickets-list.js`)
2. **티켓 상세 페이지 구현** (`detail.html` + `tickets-detail.js`)
3. **티켓 생성/수정 폼 구현** (`form.html` + `tickets-form.js`)
4. **승인 처리 페이지 구현** (`approvals.html` + `tickets-approvals.js`)
5. **사이드바 메뉴 등록**
6. **헤더 업데이트 설정**

---

**작성일**: 2026-01-01  
**참고 문서**: `docs/상품페이지_작성가이드.md`


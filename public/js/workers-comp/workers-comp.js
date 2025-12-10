// 전역 변수
let currentPage = 1;
let currentPageSize = 20;
let currentSearchTerm = '';
let currentStatusFilter = 'pending';
let currentAccountFilter = '';
let currentContractTypeFilter = '';

// 페이지 초기화
document.addEventListener('DOMContentLoaded', function() {
  console.log('근재보험 가입신청 관리 페이지가 로드되었습니다.');
  
  // 이벤트 리스너 등록
  initializeEventListeners();
  
  // 전화번호 형식 자동 변환 설정
  setupPhoneInputs();
  
  // 거래처 필터 초기화
  initializeAccountFilter();
  
  // 초기 데이터 로드
  loadApplicationsData();
});

// ========== 거래처 필터 관련 함수들 ==========

// 거래처 필터 초기화
async function initializeAccountFilter() {
  try {
    console.log('거래처 필터 초기화 시작...');
    await loadAccountOptions();
    setupAccountFilterEvents();
    console.log('거래처 필터 초기화 완료');
  } catch (error) {
    console.error('거래처 필터 초기화 실패:', error);
  }
}

// 거래처 옵션 로드
async function loadAccountOptions() {
  const accountSelect = document.getElementById('accountFilter');
  if (!accountSelect) {
    console.warn('거래처 필터 요소를 찾을 수 없습니다.');
    return;
  }

  try {
    // 로딩 상태 표시
    accountSelect.innerHTML = '<option value="">로딩 중...</option>';
    accountSelect.disabled = true;

    // 서버에서 거래처 목록 가져오기
    const response = await fetch('/api/workers-comp/accounts', {
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
    console.log('거래처 데이터:', data);

    // 기본 옵션 추가
    accountSelect.innerHTML = '<option value="">전체 거래처</option>';

    // 성공적으로 데이터를 받았을 때
    if (data.success && Array.isArray(data.data)) {
      data.data.forEach(account => {
        const option = document.createElement('option');
        option.value = account.code;
        option.textContent = account.name;
        option.title = account.name; // 긴 텍스트를 위한 툴팁
        accountSelect.appendChild(option);
      });
      
      console.log(`거래처 옵션 ${data.data.length}개 로드 완료`);
    } else {
      console.warn('거래처 데이터가 비어있거나 형식이 올바르지 않습니다.');
    }

  } catch (error) {
    console.error('거래처 옵션 로드 오류:', error);
    
    // 에러 시 기본 옵션만 표시
    accountSelect.innerHTML = '<option value="">전체 거래처</option>';
    
    // 사용자에게 알림
    if (window.sjTemplateLoader && window.sjTemplateLoader.showToast) {
      window.sjTemplateLoader.showToast(
        '거래처 목록을 불러오는데 실패했습니다.',
        'warning'
      );
    }
    
  } finally {
    // 항상 활성화
    accountSelect.disabled = false;
  }
}

// 거래처 필터 이벤트 설정
function setupAccountFilterEvents() {
  const accountFilter = document.getElementById('accountFilter');
  if (accountFilter) {
    accountFilter.addEventListener('change', function() {
      currentAccountFilter = this.value;
      currentPage = 1; // 페이지 초기화
      console.log('거래처 필터 변경:', currentAccountFilter);
      loadApplicationsData();
    });
  }
}

// 전화번호 입력 필드 자동 형식 설정
function setupPhoneInputs() {
  const phoneInputs = document.querySelectorAll('input[type="tel"], input[data-phone], .phone-input');
  
  phoneInputs.forEach(input => {
    input.addEventListener('input', (e) => {
      window.sjTemplateLoader.formatPhoneNumber(e.target);
    });
    
    input.addEventListener('blur', (e) => {
      window.sjTemplateLoader.formatPhoneNumber(e.target);
    });
  });
}

// 이벤트 리스너 초기화
function initializeEventListeners() {
  // 메뉴 토글
  const menuToggle = document.getElementById('menuToggle');
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  
  if (menuToggle) {
    menuToggle.addEventListener('click', function() {
      sidebar.classList.toggle('show');
      sidebarOverlay.classList.toggle('show');
    });
  }
  
  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', function() {
      sidebar.classList.remove('show');
      sidebarOverlay.classList.remove('show');
    });
  }

  // 검색 버튼
  const searchBtn = document.getElementById('search_btn');
  if (searchBtn) {
    searchBtn.addEventListener('click', handleSearch);
  }

  // 검색어 입력 (Enter 키)
  const searchWord = document.getElementById('search_word');
  if (searchWord) {
    searchWord.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        handleSearch();
      }
    });
    
    // 입력 중 디바운스 검색
    searchWord.addEventListener('input', debounce(handleSearch, 500));
  }

  // 상태 필터 변경
  const statusFilter = document.getElementById('statusFilter');
  if (statusFilter) {
    statusFilter.addEventListener('change', handleSearch);
  }

  // 계약유형 필터 변경
  const contractTypeFilter = document.getElementById('contractTypeFilter');
  if (contractTypeFilter) {
    contractTypeFilter.addEventListener('change', handleSearch);
  }

  // 페이지 크기 변경
  const pageSize = document.getElementById('pageSize');
  if (pageSize) {
    pageSize.addEventListener('change', function() {
      currentPageSize = parseInt(this.value);
      currentPage = 1;
      loadApplicationsData();
    });
  }

  // 각종 버튼들
  document.getElementById('exportExcel')?.addEventListener('click', () => {
    exportToExcel();
  });

  document.getElementById('dailyReport')?.addEventListener('click', () => {
    showDailyReportModal();
  });

  document.getElementById('bulkStatusUpdate')?.addEventListener('click', () => {
    showBulkStatusModal();
  });

  document.getElementById('refreshData')?.addEventListener('click', () => {
    refreshData();
  });
}

// 검색 처리 함수
function handleSearch() {
  const searchWord = document.getElementById('search_word').value.trim();
  const statusFilter = document.getElementById('statusFilter').value;
  const accountFilter = document.getElementById('accountFilter')?.value || '';
  const contractTypeFilter = document.getElementById('contractTypeFilter').value;
  
  currentSearchTerm = searchWord;
  currentStatusFilter = statusFilter;
  currentAccountFilter = accountFilter;
  currentContractTypeFilter = contractTypeFilter;
  currentPage = 1;
  
  console.log('검색 실행:', {
    search: currentSearchTerm,
    status: currentStatusFilter,
    account: currentAccountFilter,
    contractType: currentContractTypeFilter
  });
  
  loadApplicationsData();
}

// 신청서 데이터 로드
async function loadApplicationsData() {
  showLoading(true);
  
  try {
    const params = new URLSearchParams({
      page: currentPage,
      limit: currentPageSize,
      search: currentSearchTerm,
      status: currentStatusFilter,
      contract_type: currentContractTypeFilter
    });
    
    // 거래처 필터 파라미터 추가
    if (currentAccountFilter) {
      params.append('account', currentAccountFilter);
    }

    console.log('API 요청 파라미터:', Object.fromEntries(params));

    const response = await fetch(`/api/workers-comp/applications?${params}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('API 응답 데이터:', data);
    
    if (data.success) {
      displayApplicationsData(data.data || []);
      updatePagination(data.pagination || {});
    } else {
      throw new Error(data.error || '데이터를 불러오는데 실패했습니다.');
    }
  } catch (error) {
    console.error('신청서 데이터 로드 오류:', error);
    showErrorMessage('데이터를 불러오는데 실패했습니다: ' + error.message);
    
    // 에러 시 빈 데이터 표시
    displayApplicationsData([]);
    updatePagination({});
  } finally {
    showLoading(false);
  }
}

// 신청서 데이터 표시
function displayApplicationsData(data) {
  const tableBody = document.getElementById('applications_table_body');
  const mobileCards = document.getElementById('applications_mobile_cards');
  
  // 테이블 초기화
  if (tableBody) {
    tableBody.innerHTML = '';
  }
  if (mobileCards) {
    mobileCards.innerHTML = '';
  }

  if (!data || data.length === 0) {
    const noDataMessage = '<tr><td colspan="10" class="text-center py-4">검색된 데이터가 없습니다.</td></tr>';
    if (tableBody) {
      tableBody.innerHTML = noDataMessage;
    }
    if (mobileCards) {
      mobileCards.innerHTML = '<div class="text-center py-4">검색된 데이터가 없습니다.</div>';
    }
    return;
  }

  // 데스크톱 테이블 생성
  if (tableBody) {
    data.forEach((item, index) => {
      const row = createTableRow(item, index);
      tableBody.appendChild(row);
    });
  }

  // 모바일 카드 생성
  if (mobileCards) {
    data.forEach((item, index) => {
      const card = createMobileCard(item, index);
      mobileCards.appendChild(card);
    });
  }

  // 상태 변경 이벤트 리스너 등록
  attachStatusChangeEvents();
}

// 테이블 행 생성
function createTableRow(item, index) {
  const row = document.createElement('tr');
  
  const statusClass = getStatusClass(item.status);
  const statusText = getStatusText(item.status);
  const contractTypeText = getContractTypeText(item.contract_type);
  
  // 상태별 옵션 생성
  const statusOptions = getStatusOptions(item.status);
  
  row.innerHTML = `
    <td class="col-number">
      <button type="button" class="btn btn-info btn-sm" onclick="openDetailModal('${item.id}')">
        ${(currentPage - 1) * currentPageSize + index + 1}
      </button>
      <input type='hidden' id='app_id_${item.id}' value="${item.id}">
    </td>
    <td class="col-company-name">
      <a href="#" data-toggle="tooltip" title="${formatDate(item.created_at)}">${item.company_name || '-'}</a>
    </td>
    <td class="col-contact-info">
      <div><strong>${item.contact_name || '-'}</strong></div>
    </td>
    <td class="col-contact-info">${item.phone || '-'}</td>
    <td class="col-contract-type">
      <span class="badge ${getContractTypeBadgeClass(item.contract_type)}">${contractTypeText}</span>
    </td>
    <td class="col-business-number d-none d-lg-table-cell">${formatBusinessNumber(item.business_number) || '-'}</td>
    <td class="col-site-name d-none d-xl-table-cell">${item.site_name || '-'}</td>
    <td class="col-date">${formatDate(item.created_at) || '-'}</td>
    <td class="col-status">
      <select id="status_${item.id}" class="form-control form-control-sm select-status" 
        data-id="${item.id}" data-original-status="${item.status}">
        ${statusOptions}
      </select>
    </td>
    <td class="col-memo d-none d-xl-table-cell">
      <input type='text' id="memo_${item.id}" class="form-control form-control-sm input-memo" 
             value='${item.memo || ''}' placeholder="메모" data-id="${item.id}">
    </td>
    <td class="col-account">${item.account_directory || 'workers-comp'}</td>
  `;
  
  return row;
}

// 모바일 카드 생성
function createMobileCard(item, index) {
  const card = document.createElement('div');
  card.className = 'mobile-card';
  
  const statusClass = getStatusClass(item.status);
  const statusText = getStatusText(item.status);
  const contractTypeText = getContractTypeText(item.contract_type);
  const statusOptions = getStatusOptions(item.status);
  
  card.innerHTML = `
    <div class="mobile-card-header">
      <button type="button" class="mobile-card-number-btn" onclick="openDetailModal('${item.id}')">
        ${(currentPage - 1) * currentPageSize + index + 1}
      </button>
      <div class="mobile-card-title">${item.company_name || '업체명 없음'}</div>
      <span class="status-badge ${statusClass}">${statusText}</span>
    </div>
    <div class="mobile-card-body">
      <div class="mobile-card-row">
        <span class="mobile-card-label">담당자:</span>
        <span class="mobile-card-value">${item.contact_name || '-'}</span>
      </div>
      <div class="mobile-card-row">
        <span class="mobile-card-label">연락처:</span>
        <span class="mobile-card-value">${item.phone || '-'}</span>
      </div>
      <div class="mobile-card-row">
        <span class="mobile-card-label">계약유형:</span>
        <span class="mobile-card-value">
          <span class="badge ${getContractTypeBadgeClass(item.contract_type)}">${contractTypeText}</span>
        </span>
      </div>
      <div class="mobile-card-row">
        <span class="mobile-card-label">신청일:</span>
        <span class="mobile-card-value">${formatDate(item.created_at) || '-'}</span>
      </div>
      <div class="mobile-card-row">
        <span class="mobile-card-label">상태:</span>
        <select id="status_mobile_${item.id}" class="form-control form-control-sm select-status mobile-status-select" 
        data-id="${item.id}" data-original-status="${item.status}">
          ${statusOptions}
        </select>
      </div>
      <div class="mobile-card-row">
        <span class="mobile-card-label">거래처:</span>
        <span class="mobile-card-value">${item.account_directory || 'workers-comp'}</span>
      </div>
    </div>
  `;
  
  return card;
}

// 상태별 옵션 생성
function getStatusOptions(currentStatus) {
  const statusMap = {
    'pending': '검토대기',
    'reviewing': '검토중',
    'approved': '승인',
    'rejected': '반려'
  };

  let options = '';
  
  // 상태별 허용 전환 규칙
  let allowedStatuses = [];
  
  switch(currentStatus) {
    case 'pending':
      allowedStatuses = ['pending', 'reviewing', 'approved', 'rejected'];
      break;
    case 'reviewing':
      allowedStatuses = ['reviewing', 'approved', 'rejected', 'pending'];
      break;
    case 'approved':
      allowedStatuses = ['approved']; // 승인된 것은 변경 불가
      break;
    case 'rejected':
      allowedStatuses = ['rejected', 'reviewing', 'pending'];
      break;
    default:
      allowedStatuses = Object.keys(statusMap);
  }
  
  allowedStatuses.forEach(status => {
    const selected = status === currentStatus ? 'selected' : '';
    options += `<option value="${status}" ${selected}>${statusMap[status]}</option>`;
  });
  
  return options;
}

// 상태별 CSS 클래스 반환
function getStatusClass(status) {
  switch(status) {
    case 'approved':
      return 'status-approved';
    case 'reviewing':
      return 'status-reviewing';
    case 'rejected':
      return 'status-rejected';
    case 'pending':
    default:
      return 'status-pending';
  }
}

// 상태별 텍스트 반환
function getStatusText(status) {
  const statusMap = {
    'pending': '검토대기',
    'reviewing': '검토중',
    'approved': '승인',
    'rejected': '반려'
  };
  
  return statusMap[status] || status || '기타';
}

// 계약유형 텍스트 반환
function getContractTypeText(contractType) {
  const contractTypeMap = {
    'annual': '연간계약',
    'project': '구간계약'
  };
  
  return contractTypeMap[contractType] || contractType || '기타';
}

// 계약유형 배지 클래스 반환
function getContractTypeBadgeClass(contractType) {
  switch(contractType) {
    case 'annual':
      return 'bg-primary';
    case 'project':
      return 'bg-success';
    default:
      return 'bg-secondary';
  }
}

// 사업자번호 포맷팅
function formatBusinessNumber(businessNumber) {
  if (!businessNumber) return '';
  
  const cleaned = businessNumber.replace(/[^0-9]/g, '');
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{3})(\d{2})(\d{5})/, '$1-$2-$3');
  }
  
  return businessNumber;
}

// 날짜 포맷팅
function formatDate(dateString) {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch (error) {
    return dateString;
  }
}

// 페이지네이션 업데이트
function updatePagination(pagination) {
  const paginationInfo = document.getElementById('pagination_info');
  const paginationControls = document.getElementById('pagination_controls');
  
  if (!pagination || typeof pagination.total_count === 'undefined') {
    if (paginationInfo) {
      paginationInfo.innerHTML = '';
    }
    if (paginationControls) {
      paginationControls.innerHTML = '';
    }
    return;
  }

  const { total_count, current_page, limit, total_pages } = pagination;
  const startItem = total_count > 0 ? Math.min((current_page - 1) * limit + 1, total_count) : 0;
  const endItem = Math.min(current_page * limit, total_count);

  // 페이지 정보 업데이트
  if (paginationInfo) {
    if (total_count > 0) {
      paginationInfo.innerHTML = `총 ${total_count.toLocaleString()}건 중 ${startItem.toLocaleString()}-${endItem.toLocaleString()}건 표시`;
    } else {
      paginationInfo.innerHTML = '검색된 데이터가 없습니다';
    }
  }

  // 페이지 컨트롤 업데이트
  if (paginationControls) {
    paginationControls.innerHTML = '';
    
    if (total_pages <= 1) {
      return;
    }
    
    // 이전 버튼
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${current_page <= 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `
      <a class="page-link" href="#" data-page="${current_page - 1}">
        <i class="fas fa-chevron-left"></i>
      </a>
    `;
    if (current_page > 1) {
      prevLi.querySelector('a').addEventListener('click', (e) => {
        e.preventDefault();
        goToPage(current_page - 1);
      });
    }
    paginationControls.appendChild(prevLi);

    // 페이지 번호들
    const maxVisible = 5;
    let startPage = Math.max(1, current_page - Math.floor(maxVisible / 2));
    let endPage = Math.min(total_pages, startPage + maxVisible - 1);
    
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    if (startPage > 1) {
      const firstLi = document.createElement('li');
      firstLi.className = 'page-item';
      firstLi.innerHTML = '<a class="page-link" href="#" data-page="1">1</a>';
      firstLi.querySelector('a').addEventListener('click', (e) => {
        e.preventDefault();
        goToPage(1);
      });
      paginationControls.appendChild(firstLi);

      if (startPage > 2) {
        const dotsLi = document.createElement('li');
        dotsLi.className = 'page-item disabled';
        dotsLi.innerHTML = '<span class="page-link">...</span>';
        paginationControls.appendChild(dotsLi);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      const li = document.createElement('li');
      li.className = `page-item ${i === current_page ? 'active' : ''}`;
      li.innerHTML = `<a class="page-link" href="#" data-page="${i}">${i}</a>`;
      
      if (i !== current_page) {
        li.querySelector('a').addEventListener('click', (e) => {
          e.preventDefault();
          goToPage(i);
        });
      }
      
      paginationControls.appendChild(li);
    }

    if (endPage < total_pages) {
      if (endPage < total_pages - 1) {
        const dotsLi = document.createElement('li');
        dotsLi.className = 'page-item disabled';
        dotsLi.innerHTML = '<span class="page-link">...</span>';
        paginationControls.appendChild(dotsLi);
      }

      const lastLi = document.createElement('li');
      lastLi.className = 'page-item';
      lastLi.innerHTML = `<a class="page-link" href="#" data-page="${total_pages}">${total_pages}</a>`;
      lastLi.querySelector('a').addEventListener('click', (e) => {
        e.preventDefault();
        goToPage(total_pages);
      });
      paginationControls.appendChild(lastLi);
    }

    // 다음 버튼
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${current_page >= total_pages ? 'disabled' : ''}`;
    nextLi.innerHTML = `
      <a class="page-link" href="#" data-page="${current_page + 1}">
        <i class="fas fa-chevron-right"></i>
      </a>
    `;
    if (current_page < total_pages) {
      nextLi.querySelector('a').addEventListener('click', (e) => {
        e.preventDefault();
        goToPage(current_page + 1);
      });
    }
    paginationControls.appendChild(nextLi);
  }
}

// 페이지 이동
function goToPage(page) {
  currentPage = page;
  loadApplicationsData();
  
  // 스크롤 최상단으로 이동
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 상태 변경 이벤트 리스너 등록
function attachStatusChangeEvents() {
  document.querySelectorAll('.select-status').forEach(select => {
    select.addEventListener('change', handleStatusChange);
  });
}

// 상태 변경 처리 함수
async function handleStatusChange(event) {
  const selectElement = event.target;
  const applicationId = selectElement.getAttribute('data-id');
  const newStatus = selectElement.value;
  const oldStatus = selectElement.getAttribute('data-original-status') || '';
  
  // 변경사항이 없으면 중단
  if (newStatus === oldStatus) {
    return;
  }

  try {
    // 버튼 비활성화 및 로딩 표시
    selectElement.disabled = true;
    selectElement.style.opacity = '0.6';
    
    // 확인 메시지 표시
    const statusText = getStatusText(newStatus);
    if (!confirm(`상태를 "${statusText}"로 변경하시겠습니까?`)) {
      // 취소 시 원래 값으로 복원
      selectElement.value = oldStatus;
      selectElement.disabled = false;
      selectElement.style.opacity = '1';
      return;
    }

    // 서버에 상태 변경 요청
    const response = await fetch(`/api/workers-comp/applications/${applicationId}/status`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        status: newStatus,
        old_status: oldStatus
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      // 성공 시 원래 상태값 업데이트
      selectElement.setAttribute('data-original-status', newStatus);
      
      // 성공 메시지 표시
      if (window.sjTemplateLoader && window.sjTemplateLoader.showToast) {
        window.sjTemplateLoader.showToast(
          result.message || `상태가 "${statusText}"로 변경되었습니다.`,
          'success'
        );
      } else {
        console.log(`상태 변경 성공: ${statusText}`);
      }

      // UI 업데이트
      updateRowAppearance(selectElement, newStatus);
      
    } else {
      throw new Error(result.message || '상태 변경에 실패했습니다.');
    }

  } catch (error) {
    console.error('상태 변경 오류:', error);
    
    // 오류 시 원래 값으로 복원
    selectElement.value = oldStatus;
    
    // 오류 메시지 표시
    if (window.sjTemplateLoader && window.sjTemplateLoader.showToast) {
      window.sjTemplateLoader.showToast(
        '상태 변경 중 오류가 발생했습니다: ' + error.message,
        'error'
      );
    } else {
      alert('상태 변경 중 오류가 발생했습니다: ' + error.message);
    }
    
  } finally {
    // 버튼 활성화
    selectElement.disabled = false;
    selectElement.style.opacity = '1';
  }
}

// 행의 외관을 상태에 따라 업데이트
function updateRowAppearance(selectElement, status) {
  const row = selectElement.closest('tr');
  const card = selectElement.closest('.mobile-card');
  
  if (row) {
    // 기존 상태 클래스 제거
    row.classList.remove('status-pending', 'status-reviewing', 'status-approved', 'status-rejected');
    
    // 새 상태 클래스 추가
    const statusClass = getStatusClass(status);
    row.classList.add(statusClass);
  }
  
  if (card) {
    const statusBadge = card.querySelector('.status-badge');
    if (statusBadge) {
      // 기존 상태 클래스 제거
      statusBadge.classList.remove('status-pending', 'status-reviewing', 'status-approved', 'status-rejected');
      
      // 새 상태 클래스와 텍스트 추가
      const statusClass = getStatusClass(status);
      const statusText = getStatusText(status);
      
      statusBadge.classList.add(statusClass);
      statusBadge.textContent = statusText;
    }
  }
}

// 로딩 상태 표시
function showLoading(show) {
  const loadingOverlay = document.getElementById('loadingOverlay');
  if (loadingOverlay) {
    loadingOverlay.style.display = show ? 'flex' : 'none';
  }
}

// 에러 메시지 표시
function showErrorMessage(message) {
  if (window.sjTemplateLoader && window.sjTemplateLoader.showToast) {
    window.sjTemplateLoader.showToast(message, 'error');
  } else {
    alert(message);
  }
  console.error(message);
}

// 디바운스 함수 (검색어 입력 지연 처리용)
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// 모든 필터 초기화 함수
function resetAllFilters() {
  currentSearchTerm = '';
  currentStatusFilter = 'pending';
  currentAccountFilter = '';
  currentContractTypeFilter = '';
  currentPage = 1;
  
  // UI 요소들도 초기화
  const searchWord = document.getElementById('search_word');
  const statusFilter = document.getElementById('statusFilter');
  const accountFilter = document.getElementById('accountFilter');
  const contractTypeFilter = document.getElementById('contractTypeFilter');
  
  if (searchWord) searchWord.value = '';
  if (statusFilter) statusFilter.value = 'pending';
  if (accountFilter) accountFilter.value = '';
  if (contractTypeFilter) contractTypeFilter.value = '';
  
  // 데이터 다시 로드
  loadApplicationsData();
}

// 데이터 새로고침
function refreshData() {
  console.log('데이터 새로고침 시작...');
  loadApplicationsData();
  
  // 토스트 메시지
  if (window.sjTemplateLoader && window.sjTemplateLoader.showToast) {
    window.sjTemplateLoader.showToast('데이터를 새로고침했습니다.', 'info');
  }
}

// 엑셀 다운로드
async function exportToExcel() {
  try {
    showLoading(true);
    
    const params = new URLSearchParams({
      search: currentSearchTerm,
      status: currentStatusFilter,
      contract_type: currentContractTypeFilter,
      format: 'excel'
    });
    
    if (currentAccountFilter) {
      params.append('account', currentAccountFilter);
    }

    console.log('엑셀 다운로드 요청:', Object.fromEntries(params));

    const response = await fetch(`/api/workers-comp/export-excel?${params}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    // 파일 다운로드
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `근재보험_가입신청_${new Date().toISOString().slice(0,10)}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    if (window.sjTemplateLoader && window.sjTemplateLoader.showToast) {
      window.sjTemplateLoader.showToast('엑셀 파일이 다운로드되었습니다.', 'success');
    }

  } catch (error) {
    console.error('엑셀 다운로드 오류:', error);
    showErrorMessage('엑셀 다운로드 중 오류가 발생했습니다: ' + error.message);
  } finally {
    showLoading(false);
  }
}

// 일별통계 모달 표시
function showDailyReportModal() {
  // TODO: 일별통계 모달 구현
  if (window.sjTemplateLoader && window.sjTemplateLoader.showToast) {
    window.sjTemplateLoader.showToast('일별통계 기능은 준비 중입니다.', 'info');
  } else {
    alert('일별통계 기능은 준비 중입니다.');
  }
}

// 일괄 상태변경 모달 표시
function showBulkStatusModal() {
  const selectedCheckboxes = document.querySelectorAll('input[type="checkbox"][data-id]:checked');
  const selectedCount = selectedCheckboxes.length;
  
  if (selectedCount === 0) {
    if (window.sjTemplateLoader && window.sjTemplateLoader.showToast) {
      window.sjTemplateLoader.showToast('변경할 항목을 선택해주세요.', 'warning');
    } else {
      alert('변경할 항목을 선택해주세요.');
    }
    return;
  }
  
  // 선택된 개수 표시
  document.getElementById('selectedCount').textContent = selectedCount;
  
  // 모달 표시
  const modal = new bootstrap.Modal(document.getElementById('bulkStatusModal'));
  modal.show();
  
  // 확인 버튼 이벤트
  document.getElementById('confirmBulkStatus').onclick = function() {
    performBulkStatusUpdate();
  };
}

// 일괄 상태변경 실행
async function performBulkStatusUpdate() {
  const selectedStatus = document.getElementById('bulkStatusSelect').value;
  const memo = document.getElementById('bulkStatusMemo').value.trim();
  
  if (!selectedStatus) {
    if (window.sjTemplateLoader && window.sjTemplateLoader.showToast) {
      window.sjTemplateLoader.showToast('변경할 상태를 선택해주세요.', 'warning');
    } else {
      alert('변경할 상태를 선택해주세요.');
    }
    return;
  }
  
  const selectedCheckboxes = document.querySelectorAll('input[type="checkbox"][data-id]:checked');
  const applicationIds = Array.from(selectedCheckboxes).map(cb => cb.getAttribute('data-id'));
  
  if (applicationIds.length === 0) {
    return;
  }
  
  try {
    showLoading(true);
    
    const response = await fetch('/api/workers-comp/applications/bulk-status', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        application_ids: applicationIds,
        status: selectedStatus,
        memo: memo
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      // 모달 닫기
      const modal = bootstrap.Modal.getInstance(document.getElementById('bulkStatusModal'));
      modal.hide();
      
      // 성공 메시지
      if (window.sjTemplateLoader && window.sjTemplateLoader.showToast) {
        window.sjTemplateLoader.showToast(
          `${applicationIds.length}건의 상태가 변경되었습니다.`,
          'success'
        );
      }
      
      // 데이터 새로고침
      loadApplicationsData();
      
    } else {
      throw new Error(result.message || '일괄 상태변경에 실패했습니다.');
    }

  } catch (error) {
    console.error('일괄 상태변경 오류:', error);
    showErrorMessage('일괄 상태변경 중 오류가 발생했습니다: ' + error.message);
  } finally {
    showLoading(false);
  }
}
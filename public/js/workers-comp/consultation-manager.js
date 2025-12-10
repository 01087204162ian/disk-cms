// 전역 변수
let currentPage = 1;
let currentPageSize = 20;
let currentSearchTerm = '';
let currentStatusFilter = 'pending';
let currentIndustryFilter = '';
let currentEmployeesFilter = '';

// 페이지 초기화
document.addEventListener('DOMContentLoaded', function() {
  console.log('상담신청 관리 페이지가 로드되었습니다.');
  
  // 이벤트 리스너 등록
  initializeEventListeners();
  
  // 전화번호 형식 자동 변환 설정
  setupPhoneInputs();
  
  // 초기 데이터 로드
  loadConsultationsData();
});

// 전화번호 입력 필드 자동 형식 설정
function setupPhoneInputs() {
  const phoneInputs = document.querySelectorAll('input[type="tel"], input[data-phone], .phone-input');
  
  phoneInputs.forEach(input => {
    input.addEventListener('input', (e) => {
      if (window.sjTemplateLoader && window.sjTemplateLoader.formatPhoneNumber) {
        window.sjTemplateLoader.formatPhoneNumber(e.target);
      }
    });
    
    input.addEventListener('blur', (e) => {
      if (window.sjTemplateLoader && window.sjTemplateLoader.formatPhoneNumber) {
        window.sjTemplateLoader.formatPhoneNumber(e.target);
      }
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

  // 업종 필터 변경
  const industryFilter = document.getElementById('industryFilter');
  if (industryFilter) {
    industryFilter.addEventListener('change', handleSearch);
  }

  // 직원수 필터 변경
  const employeesFilter = document.getElementById('employeesFilter');
  if (employeesFilter) {
    employeesFilter.addEventListener('change', handleSearch);
  }

  // 페이지 크기 변경
  const pageSize = document.getElementById('pageSize');
  if (pageSize) {
    pageSize.addEventListener('change', function() {
      currentPageSize = parseInt(this.value);
      currentPage = 1;
      loadConsultationsData();
    });
  }

  // 각종 버튼들
  document.getElementById('exportExcel')?.addEventListener('click', () => {
    exportToExcel();
  });

  document.getElementById('dailyReport')?.addEventListener('click', () => {
    showStatisticsModal();
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
  const industryFilter = document.getElementById('industryFilter')?.value || '';
  const employeesFilter = document.getElementById('employeesFilter')?.value || '';
  
  currentSearchTerm = searchWord;
  currentStatusFilter = statusFilter;
  currentIndustryFilter = industryFilter;
  currentEmployeesFilter = employeesFilter;
  currentPage = 1;
  
  console.log('검색 실행:', {
    search: currentSearchTerm,
    status: currentStatusFilter,
    industry: currentIndustryFilter,
    employees: currentEmployeesFilter
  });
  
  loadConsultationsData();
}

// 상담신청 데이터 로드
async function loadConsultationsData() {
  showLoading(true);
  
  try {
    const params = new URLSearchParams({
      page: currentPage,
      limit: currentPageSize,
      search: currentSearchTerm,
      status: currentStatusFilter,
      industry: currentIndustryFilter,
      employees: currentEmployeesFilter
    });

    console.log('API 요청 파라미터:', Object.fromEntries(params));

    const response = await fetch(`/api/workers-comp/consultations?${params}`, {
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
      displayConsultationsData(data.data || []);
      updatePagination(data.pagination || {});
    } else {
      throw new Error(data.error || '데이터를 불러오는데 실패했습니다.');
    }
  } catch (error) {
    console.error('상담신청 데이터 로드 오류:', error);
    showErrorMessage('데이터를 불러오는데 실패했습니다: ' + error.message);
    
    // 에러 시 빈 데이터 표시
    displayConsultationsData([]);
    updatePagination({});
  } finally {
    showLoading(false);
  }
}

// 상담신청 데이터 표시
function displayConsultationsData(data) {
  const tableBody = document.getElementById('consultations_table_body');
  const mobileCards = document.getElementById('consultations_mobile_cards');
  
  // 테이블 초기화
  if (tableBody) {
    tableBody.innerHTML = '';
  }
  if (mobileCards) {
    mobileCards.innerHTML = '';
  }

  if (!data || data.length === 0) {
    const noDataMessage = '<tr><td colspan="11" class="text-center py-4">검색된 데이터가 없습니다.</td></tr>';
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
  
  // 상태별 옵션 생성
  const statusOptions = getStatusOptions(item.status);
  
  // 동의 현황 표시
  const agreementStatus = getAgreementStatus(item);
  
  row.innerHTML = `
    <td class="col-number">
      <button type="button" class="btn btn-info btn-sm" onclick="openDetailModal('${item.id}')">
        ${(currentPage - 1) * currentPageSize + index + 1}
      </button>
      <input type='hidden' id='consultation_id_${item.id}' value="${item.id}">
    </td>
    <td class="col-company-name">
      <a href="#" data-toggle="tooltip" title="${formatDate(item.created_at)}">${item.company_name || '-'}</a>
    </td>
    <td class="col-contact-info">
      <div><strong>${item.contact_name || '-'}</strong></div>
     
    </td>
	<td>
      ${item.email ? `<div class="small text-muted">${item.email}</div>` : ''}
    </td>
    <td class="col-contact-phone">${item.phone || '-'}</td>
    <td class="col-industry">
      <span class="badge ${getIndustryBadgeClass(item.industry)}">${item.industry || '-'}</span>
    </td>
    <td class="col-employees d-none d-lg-table-cell">${item.employees || '-'}</td>
    <td class="col-preferred-time d-none d-xl-table-cell">${item.preferred_time || '-'}</td>
    <td class="col-consultation-date d-none d-lg-table-cell">
      <input type='date' id="consultation_date_${item.id}" class="form-control form-control-sm" 
             value='${item.consultation_date || ''}' data-id="${item.id}">
    </td>
    <td class="col-date">${item.created_at_formatted || '-'}</td>
    <td class="col-status">
      <select id="status_${item.id}" class="form-control form-control-sm select-status" 
        data-id="${item.id}" data-original-status="${item.status}">
        ${statusOptions}
      </select>
    </td>
    <td class="col-agreement d-none d-xl-table-cell">
      <div class="small">${agreementStatus}</div>
    </td>
  `;
  
  return row;
}

// 모바일 카드 생성
function createMobileCard(item, index) {
  const card = document.createElement('div');
  card.className = 'mobile-card';
  
  const statusClass = getStatusClass(item.status);
  const statusText = getStatusText(item.status);
  const statusOptions = getStatusOptions(item.status);
  const agreementStatus = getAgreementStatus(item);
  
  card.innerHTML = `
    <div class="mobile-card-header">
      <button type="button" class="mobile-card-number-btn" onclick="openDetailModal('${item.id}')">
        ${(currentPage - 1) * currentPageSize + index + 1}
      </button>
      <div class="mobile-card-title">${item.company_name || '회사명 없음'}</div>
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
        <span class="mobile-card-label">이메일:</span>
        <span class="mobile-card-value">${item.email || '-'}</span>
      </div>
      <div class="mobile-card-row">
        <span class="mobile-card-label">업종:</span>
        <span class="mobile-card-value">
          <span class="badge ${getIndustryBadgeClass(item.industry)}">${item.industry || '-'}</span>
        </span>
      </div>
      <div class="mobile-card-row">
        <span class="mobile-card-label">직원수:</span>
        <span class="mobile-card-value">${item.employees || '-'}</span>
      </div>
      <div class="mobile-card-row">
        <span class="mobile-card-label">희망시간:</span>
        <span class="mobile-card-value">${item.preferred_time || '-'}</span>
      </div>
      <div class="mobile-card-row">
        <span class="mobile-card-label">상담일:</span>
        <input type='date' id="consultation_date_mobile_${item.id}" class="form-control form-control-sm mobile-input" 
               value='${item.consultation_date || ''}' data-id="${item.id}">
      </div>
      <div class="mobile-card-row">
        <span class="mobile-card-label">접수일:</span>
         <span class="mobile-card-value">${item.created_at_formatted || '-'}</span>
      </div>
      <div class="mobile-card-row">
        <span class="mobile-card-label">상태:</span>
        <select id="status_mobile_${item.id}" class="form-control form-control-sm select-status mobile-status-select" 
        data-id="${item.id}" data-original-status="${item.status}">
          ${statusOptions}
        </select>
      </div>
      <div class="mobile-card-row">
        <span class="mobile-card-label">동의현황:</span>
        <div class="mobile-card-value small">${agreementStatus}</div>
      </div>
    </div>
  `;
  
  return card;
}

// 상태별 옵션 생성
function getStatusOptions(currentStatus) {
  const statusMap = {
    'pending': '접수대기',
    'contacted': '연락완료',
    'completed': '상담완료'
  };

  let options = '';
  
  // 상태별 허용 전환 규칙
  let allowedStatuses = [];
  
  switch(currentStatus) {
    case 'pending':
      allowedStatuses = ['pending', 'contacted', 'completed'];
      break;
    case 'contacted':
      allowedStatuses = ['contacted', 'completed', 'pending'];
      break;
    case 'completed':
      allowedStatuses = ['completed']; // 완료된 것은 변경 불가
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
    case 'completed':
      return 'status-approved';
    case 'contacted':
      return 'status-reviewing';
    case 'pending':
    default:
      return 'status-pending';
  }
}

// 상태별 텍스트 반환
function getStatusText(status) {
  const statusMap = {
    'pending': '접수대기',
    'contacted': '연락완료',
    'completed': '상담완료'
  };
  
  return statusMap[status] || status || '기타';
}

// 업종별 배지 클래스 반환
function getIndustryBadgeClass(industry) {
  switch(industry) {
    case '건설업':
      return 'bg-primary';
    case '제조업':
      return 'bg-success';
    case '서비스업':
      return 'bg-info';
    case '운수업':
      return 'bg-warning';
    default:
      return 'bg-secondary';
  }
}

// 동의현황 표시
function getAgreementStatus(item) {
  const agreements = [];
  if (item.agree_collect === 'Y') agreements.push('수집');
  if (item.agree_third === 'Y') agreements.push('제3자');
  if (item.agree_mkt === 'Y') agreements.push('마케팅');
  
  if (agreements.length === 0) {
    return '<span class="text-danger">미동의</span>';
  } else if (agreements.length === 3) {
    return '<span class="text-success">전체동의</span>';
  } else {
    return `<span class="text-warning">${agreements.join(',')}</span>`;
  }
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
  loadConsultationsData();
  
  // 스크롤 최상단으로 이동
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 상태 변경 이벤트 리스너 등록
function attachStatusChangeEvents() {
  document.querySelectorAll('.select-status').forEach(select => {
    select.addEventListener('change', handleStatusChange);
  });
  
  // 상담일 변경 이벤트
  document.querySelectorAll('input[type="date"][id^="consultation_date_"]').forEach(input => {
    input.addEventListener('change', handleConsultationDateChange);
  });
}

// 상태 변경 처리 함수
async function handleStatusChange(event) {
  const selectElement = event.target;
  const consultationId = selectElement.getAttribute('data-id');
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
    const response = await fetch(`/api/workers-comp/consultations/${consultationId}/status`, {
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

// 상담일 변경 처리 함수
async function handleConsultationDateChange(event) {
  const inputElement = event.target;
  const consultationId = inputElement.getAttribute('data-id');
  const newDate = inputElement.value;
  
  try {
    // 입력 비활성화 및 로딩 표시
    inputElement.disabled = true;
    inputElement.style.opacity = '0.6';

    // 서버에 상담일 변경 요청
    const response = await fetch(`/api/workers-comp/consultations/${consultationId}/consultation-date`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        consultation_date: newDate
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      // 성공 메시지 표시
      if (window.sjTemplateLoader && window.sjTemplateLoader.showToast) {
        window.sjTemplateLoader.showToast(
          '상담일이 변경되었습니다.',
          'success'
        );
      }
    } else {
      throw new Error(result.message || '상담일 변경에 실패했습니다.');
    }

  } catch (error) {
    console.error('상담일 변경 오류:', error);
    
    // 오류 메시지 표시
    if (window.sjTemplateLoader && window.sjTemplateLoader.showToast) {
      window.sjTemplateLoader.showToast(
        '상담일 변경 중 오류가 발생했습니다: ' + error.message,
        'error'
      );
    } else {
      alert('상담일 변경 중 오류가 발생했습니다: ' + error.message);
    }
    
  } finally {
    // 입력 활성화
    inputElement.disabled = false;
    inputElement.style.opacity = '1';
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





// 모달에서 변경사항 저장
async function saveModalChanges(consultationId) {
  try {
    const consultationDate = document.getElementById('modal_consultation_date').value;
    const status = document.getElementById('modal_status').value;
    const originalStatus = document.getElementById('modal_status').getAttribute('data-original-status');
    
    showLoading(true);
    
    // 변경사항이 있는지 확인
    const hasChanges = status !== originalStatus || consultationDate;
    
    if (!hasChanges) {
      if (window.sjTemplateLoader && window.sjTemplateLoader.showToast) {
        window.sjTemplateLoader.showToast('변경된 내용이 없습니다.', 'info');
      }
      return;
    }
    
    const updateData = {};
    if (status !== originalStatus) updateData.status = status;
    if (consultationDate) updateData.consultation_date = consultationDate;
    
    const response = await fetch(`/api/workers-comp/consultations/${consultationId}`, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      // 성공 메시지
      if (window.sjTemplateLoader && window.sjTemplateLoader.showToast) {
        window.sjTemplateLoader.showToast('변경사항이 저장되었습니다.', 'success');
      }
      
      // 모달 닫기
      const modal = bootstrap.Modal.getInstance(document.getElementById('consultationDetailModal'));
      modal.hide();
      
      // 데이터 새로고침
      loadConsultationsData();
      
    } else {
      throw new Error(result.message || '저장에 실패했습니다.');
    }

  } catch (error) {
    console.error('저장 오류:', error);
    showErrorMessage('저장 중 오류가 발생했습니다: ' + error.message);
  } finally {
    showLoading(false);
  }
}

// 날짜시간 포맷팅
function formatDateTime(dateString) {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return dateString;
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

// 데이터 새로고침
function refreshData() {
  console.log('데이터 새로고침 시작...');
  loadConsultationsData();
  
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
      industry: currentIndustryFilter,
      employees: currentEmployeesFilter,
      format: 'excel'
    });

    console.log('엑셀 다운로드 요청:', Object.fromEntries(params));

    const response = await fetch(`/api/workers-comp/consultations/export-excel?${params}`, {
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
    a.download = `상담신청_${new Date().toISOString().slice(0,10)}.xlsx`;
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

// 통계 모달 표시
async function showStatisticsModal() {
  try {
    const modal = new bootstrap.Modal(document.getElementById('statisticsModal'));
    modal.show();
    
    // 통계 데이터 로드
    await loadStatistics();
    
  } catch (error) {
    console.error('통계 모달 오류:', error);
    showErrorMessage('통계 데이터를 불러오는데 실패했습니다: ' + error.message);
  }
}

// 통계 데이터 로드
async function loadStatistics() {
  const statisticsBody = document.getElementById('statisticsBody');
  
  try {
    const response = await fetch('/api/workers-comp/consultations/statistics', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success) {
      displayStatistics(data.data);
    } else {
      throw new Error(data.error || '통계 데이터를 불러오는데 실패했습니다.');
    }
    
  } catch (error) {
    console.error('통계 데이터 로드 오류:', error);
    statisticsBody.innerHTML = `
      <div class="alert alert-danger">
        <i class="fas fa-exclamation-triangle"></i>
        통계 데이터를 불러오는데 실패했습니다: ${error.message}
      </div>
    `;
  }
}

// 통계 데이터 표시
function displayStatistics(stats) {
  const statisticsBody = document.getElementById('statisticsBody');
  
  statisticsBody.innerHTML = `
    <div class="row">
      <div class="col-md-6">
        <h6><i class="fas fa-chart-pie"></i> 상태별 현황</h6>
        <div class="card">
          <div class="card-body">
            <div class="list-group list-group-flush">
              ${Object.entries(stats.industry || {}).map(([industry, count]) => `
                <div class="list-group-item d-flex justify-content-between align-items-center">
                  <span class="badge ${getIndustryBadgeClass(industry)}">${industry}</span>
                  <span class="badge bg-secondary rounded-pill">${count}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="row mt-3">
      <div class="col-md-6">
        <h6><i class="fas fa-users"></i> 직원수별 현황</h6>
        <div class="card">
          <div class="card-body">
            <div class="list-group list-group-flush">
              ${Object.entries(stats.employees || {}).map(([employees, count]) => `
                <div class="list-group-item d-flex justify-content-between align-items-center">
                  <span>${employees}</span>
                  <span class="badge bg-secondary rounded-pill">${count}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
      
      <div class="col-md-6">
        <h6><i class="fas fa-calendar-day"></i> 최근 7일 접수현황</h6>
        <div class="card">
          <div class="card-body">
            <div class="list-group list-group-flush">
              ${(stats.daily || []).map(item => `
                <div class="list-group-item d-flex justify-content-between align-items-center">
                  <span>${item.date}</span>
                  <span class="badge bg-primary rounded-pill">${item.count}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="row mt-3">
      <div class="col-12">
        <h6><i class="fas fa-check-circle"></i> 동의현황 통계</h6>
        <div class="card">
          <div class="card-body">
            <div class="row text-center">
              <div class="col-4">
                <h5 class="text-success">${stats.agreements?.collect || 0}</h5>
                <small>개인정보수집이용 동의</small>
              </div>
              <div class="col-4">
                <h5 class="text-info">${stats.agreements?.third || 0}</h5>
                <small>제3자제공 동의</small>
              </div>
              <div class="col-4">
                <h5 class="text-warning">${stats.agreements?.marketing || 0}</h5>
                <small>마케팅수신 동의</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
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
  const consultationIds = Array.from(selectedCheckboxes).map(cb => cb.getAttribute('data-id'));
  
  if (consultationIds.length === 0) {
    return;
  }
  
  try {
    showLoading(true);
    
    const response = await fetch('/api/workers-comp/consultations/bulk-status', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        consultation_ids: consultationIds,
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
          `${consultationIds.length}건의 상태가 변경되었습니다.`,
          'success'
        );
      }
      
      // 데이터 새로고침
      loadConsultationsData();
      
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

// 모든 필터 초기화 함수
function resetAllFilters() {
  currentSearchTerm = '';
  currentStatusFilter = 'pending';
  currentIndustryFilter = '';
  currentEmployeesFilter = '';
  currentPage = 1;
  
  // UI 요소들도 초기화
  const searchWord = document.getElementById('search_word');
  const statusFilter = document.getElementById('statusFilter');
  const industryFilter = document.getElementById('industryFilter');
  const employeesFilter = document.getElementById('employeesFilter');
  
  if (searchWord) searchWord.value = '';
  if (statusFilter) statusFilter.value = 'pending';
  if (industryFilter) industryFilter.value = '';
  if (employeesFilter) employeesFilter.value = '';
  
  // 데이터 다시 로드
  loadConsultationsData();
}
// 전역 변수
let currentPage = 1;
let currentPageSize = 15;
let currentSearchTerm = '';
let currentSearchType = 'contains';
let currentStatusFilter = ''; // 보험사 필터를 상태 필터로 변경
let currentSearchField = 'school1';  // 기본값: 학교명
// 페이지 초기화
document.addEventListener('DOMContentLoaded', function() {
  console.log('현장실습보험 관리 페이지가 로드되었습니다.');
  
  // 이벤트 리스너 등록
  initializeEventListeners();
  
  // 초기 데이터 로드
  loadFieldPracticeData();
});

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
  
  // 보험사 필터 변경
  const statusFilter = document.getElementById('statusFilter');
  if (statusFilter) {
    statusFilter.addEventListener('change', function() {
      currentStatusFilter = this.value;
      currentPage = 1;
      loadFieldPracticeData();
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
    
    // 사업자번호 실시간 포맷팅
    searchWord.addEventListener('input', function(e) {
      const searchFieldElement = document.getElementById('searchField');
      if (searchFieldElement && searchFieldElement.value === 'school2') {
        handleBusinessNumberInput(e);
      }
    });
  }
  
  // ⭐⭐⭐ searchField 변경
  const searchField = document.getElementById('searchField');
  if (searchField) {
    searchField.addEventListener('change', function() {
      currentSearchField = this.value;
      
      const searchWordInput = document.getElementById('search_word');
      
      // 사업자번호 선택 시
      if (currentSearchField === 'school2') {
        // 1. limit 자동 증가
        const pageSizeSelect = document.getElementById('pageSize');
        if (pageSizeSelect) {
          pageSizeSelect.value = '500';
          currentPageSize = 500;
        }
        
        // 2. 기존 입력값 포맷팅
        if (searchWordInput && searchWordInput.value) {
          searchWordInput.value = formatBusinessNumber(searchWordInput.value);
        }
        
        // 3. placeholder 변경
        if (searchWordInput) {
          searchWordInput.placeholder = '예: 3128210329 또는 312-82-10329';
        }
      } else {
        // 다른 필드 선택 시 원래대로
        if (searchWordInput) {
          searchWordInput.placeholder = '학교명, 사업자번호, 담당자로 검색';
        }
      }
      
      // 검색어가 있으면 즉시 재검색
      if (currentSearchTerm) {
        currentPage = 1;
        loadFieldPracticeData();
      }
    });
  }
  
  // 검색 유형 변경
  const searchType = document.getElementById('searchType');
  if (searchType) {
    searchType.addEventListener('change', function() {
      currentSearchType = this.value;
    });
  }
  
  // 페이지 크기 변경
  const pageSize = document.getElementById('pageSize');
  if (pageSize) {
    pageSize.addEventListener('change', function() {
      currentPageSize = parseInt(this.value);
      currentPage = 1;
      loadFieldPracticeData();
    });
  }
}

// 검색 처리
// 검색 처리
function handleSearch() {
  const searchWord = document.getElementById('search_word').value.trim();
  const searchType = document.getElementById('searchType').value;
  
  // searchField 값 갱신
  const searchFieldElement = document.getElementById('searchField');
  if (searchFieldElement) {
    currentSearchField = searchFieldElement.value;
  }
  
  currentSearchTerm = searchWord;
  currentSearchType = searchType;
  currentPage = 1;
  
  // ⭐⭐⭐ 사업자번호 검색 시 limit 자동 증가 (500)
  if (currentSearchField === 'school2' && currentSearchTerm) {
    const pageSizeSelect = document.getElementById('pageSize');
    const originalSize = currentPageSize;
    
    // limit을 500으로 설정
    currentPageSize = 500;
    if (pageSizeSelect) {
      pageSizeSelect.value = '500';
    }
    
    console.log(`사업자번호 검색: limit ${originalSize} → 500`);
    
    // 사용자 알림 (선택사항)
    if (window.sjTemplateLoader && window.sjTemplateLoader.showToast) {
      window.sjTemplateLoader.showToast(
        '사업자번호 검색: 전체 담당자 분석을 위해 모든 데이터를 조회합니다.',
        'info'
      );
    }
  }
  
  console.log('검색 실행:', {
    search: currentSearchTerm,
    type: currentSearchType,
    field: currentSearchField,
    limit: currentPageSize
  });
  
  loadFieldPracticeData();
}

// 현장실습보험 데이터 로드
async function loadFieldPracticeData() {
  showLoading(true);
  
  try {
    const params = new URLSearchParams({
      page: currentPage,
      limit: currentPageSize,
      search: currentSearchTerm,
      searchType: currentSearchType,
	  searchField: currentSearchField,
	  status: currentStatusFilter  // status로 변경
    });

    console.log('API 요청 파라미터:', Object.fromEntries(params));

    const response = await fetch(`/api/field-practice/list?${params}`, {
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
      displayFieldPracticeData(data.data || []);
      updatePagination(data.pagination || {});
    } else {
      throw new Error(data.error || '데이터를 불러오는데 실패했습니다.');
    }
  } catch (error) {
    console.error('현장실습보험 데이터 로드 오류:', error);
    showErrorMessage('데이터를 불러오는데 실패했습니다: ' + error.message);
    
    // 에러 시 빈 데이터 표시
    displayFieldPracticeData([]);
    updatePagination({});
  } finally {
    showLoading(false);
  }
}

// 데이터 표시
function displayFieldPracticeData(data) {
  const tableBody = document.getElementById('field_practice_table_body');
  const mobileCards = document.getElementById('field_practice_mobile_cards');
  
  
  updateSearchResultSummary(data ? data.length : 0, data);
  // 테이블 초기화
  if (tableBody) {
    tableBody.innerHTML = '';
  }
  if (mobileCards) {
    mobileCards.innerHTML = '';
  }

  if (!data || data.length === 0) {
    const noDataMessage = '<tr><td colspan="15" class="text-center py-4">검색된 데이터가 없습니다.</td></tr>';
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
	
	// ⭐ 메모 입력 필드에 원래 값 설정
    document.querySelectorAll('.memo-input').forEach(input => {
      const originalMemo = input.value;
      input.setAttribute('data-original', originalMemo);
    });
  }

  // 모바일 카드 생성
  if (mobileCards) {
    data.forEach((item, index) => {
      const card = createMobileCard(item, index);
      mobileCards.appendChild(card);
    });
  }
  
  // 변경 이벤트 리스너 추가 (추가)
  attachInsuranceChangeEvents();
}

// 테이블 행 생성
function createTableRow(item, index) {
  const row = document.createElement('tr');
  
  row.setAttribute('data-num', item.num);
  row.setAttribute('data-cnum', item.cNum);
  //const insuranceText = getInsuranceText(item.inscompany);
  //const statusText = getStatusText(item.ch);
  //const statusClass = getStatusClass(item.ch);
  
  // ⭐ 증권번호 표시 로직: certi 우선, 없으면 gabunho
  const displayCerti = item.certi || item.gabunho || '-';
  
  row.innerHTML = `
     <td class="col-number">
		<button type="button" class="btn btn-info btn-sm" 
				onclick="openFieldPracticeDetail(${item.num})">
		  ${(currentPage - 1) * currentPageSize + index + 1}
		</button>
	</td>
    <td class="col-business-number" onclick="openFieldPracticeSecondDetail(${item.num})">${item.school2 || '-'}</td>
    <td class="col-school-name">${item.school1 || '-'}</td>
    <td class="col-number-of-students">${item.week_total || 0}명</td>
    <td class="col-phone d-none d-lg-table-cell">${item.school4 || '-'}</td>
    <td class="field-col-date">${formatDate(item.wdate)}</td>
    <td class="col-design-number d-none d-lg-table-cell">${displayCerti}</td>
    <td class="field-col-premium">${formatCurrency(item.preiminum)}</td>
    <td class="field-col-account">
      <select class="form-control form-control-sm select-insurance" data-id="${item.num}" data-original="${item.inscompany}">
        <option value="1" ${item.inscompany == '1' ? 'selected' : ''}>한화</option>
        <option value="2" ${item.inscompany == '2' ? 'selected' : ''}>Mertiz</option>
        <option value="3" ${item.inscompany == '3' ? 'selected' : ''}>현대해상</option>
        <option value="4" ${item.inscompany == '4' ? 'selected' : ''}>KB손해보험</option>
      </select>
    </td>
    <td class="col-status">
	  <select class="form-control form-control-sm f-status-select" 
			  data-id="${item.num}" 
			  data-original="${item.ch}">
		<option value="1" ${item.ch == 1 ? "selected" : ""}>접수</option>
		<option value="2" ${item.ch == 2 ? "selected" : ""}>보험료 안내중</option>
		<option value="3" ${item.ch == 3 ? "selected" : ""}>청약서</option>
		<option value="4" ${item.ch == 4 ? "selected" : ""}>입금대기중</option>
		<option value="5" ${item.ch == 5 ? "selected" : ""}>입금확인</option>
		<option value="6" ${item.ch == 6 ? "selected" : ""}>증권 발급</option>
		<option value="7" ${item.ch == 7 ? "selected" : ""}>보류</option>
		<option value="12" ${item.ch == 12 ? "selected" : ""}>수정요청</option>
		<option value="38" ${item.ch == 38 ? "selected" : ""}>청약서날인</option>
		<option value="39" ${item.ch == 39 ? "selected" : ""}>질문서날인</option>
		<option value="40" ${item.ch == 40 ? "selected" : ""}>과별인원</option>
	  </select>
	</td>
   
    <td class="field-col-damdanga">
		  <button class="btn btn-sm btn-info" 
				  onclick="openFileUploadModal(${item.num})">
			업로드
		  </button>
	</td>
    <td class="field-col-damdanga">
      <button class="btn btn-sm btn-warning" 
        onclick="openClaimModalByQuestionnaire(${item.num})">
		클레임
      </button>
    </td>
    <td class="col-memo d-none d-xl-table-cell">
      <input type="text" 
             class="form-control form-control-sm memo-input" 
             data-id="${item.num}" 
             value="${(item.memo || '').replace(/"/g, '&quot;')}" 
             placeholder="메모 입력 후 Enter"
             onkeypress="handleMemoKeyPress(event, ${item.num})">
    </td>
	 <td class="field-col-damdanga d-none d-xl-table-cell">${item.damdanga || '-'}</td>
    <td class="field-col-damdanga d-none d-xl-table-cell">${item.manager || '-'}</td>
  `;
  
  return row;
}

// 모바일 카드 생성
function createMobileCard(item, index) {
  const card = document.createElement('div');
  card.className = 'mobile-card';
  
  card.setAttribute('data-num', item.num);
  card.setAttribute('data-cnum', item.cNum);
  
  const statusText = getStatusText(item.ch);
  const statusClass = getStatusClass(item.ch);
  // ⭐ 증권번호 표시 로직: certi 우선, 없으면 gabunho
  const displayCerti = item.certi || item.gabunho || '-';

  card.innerHTML = `
    <div class="mobile-card-header">
		<button type="button" class="mobile-card-number-btn" 
				onclick="openFieldPracticeDetail(${item.num})">
		  ${(currentPage - 1) * currentPageSize + index + 1}
		</button>
      <div class="mobile-card-title">${item.school1 || '학교명 없음'}</div>
      <span class="status-badge ${statusClass}">${statusText}</span>
    </div>
    <div class="mobile-card-body">
      <div class="mobile-card-row">
        <span class="mobile-card-label">사업자번호:</span>
        <span class="mobile-card-value">${item.school2 || '-'}</span>
      </div>
      <div class="mobile-card-row">
        <span class="mobile-card-label">학생수:</span>
        <span class="mobile-card-value">${item.week_total || 0}명</span>
      </div>
      <div class="mobile-card-row">
        <span class="mobile-card-label">연락처:</span>
        <span class="mobile-card-value">${item.school4 || '-'}</span>
      </div>
      <div class="mobile-card-row">
        <span class="mobile-card-label">신청일:</span>
        <span class="mobile-card-value">${formatDate(item.wdate)}</span>
      </div>
      <div class="mobile-card-row">
        <span class="mobile-card-label">증권번호:</span>
        <span class="mobile-card-value">${displayCerti}</span>
      </div>
      <div class="mobile-card-row">
        <span class="mobile-card-label">보험료:</span>
        <span class="mobile-card-value premium-amount">${formatCurrency(item.preiminum)}</span>
      </div>
      <div class="mobile-card-row">
        <span class="mobile-card-label">보험사:</span>
        <select class="form-control form-control-sm select-insurance mobile-status-select" 
                data-id="${item.num}" data-original="${item.inscompany}">
          <option value="1" ${item.inscompany == '1' ? 'selected' : ''}>한화</option>
          <option value="2" ${item.inscompany == '2' ? 'selected' : ''}>Mertiz</option>
          <option value="3" ${item.inscompany == '3' ? 'selected' : ''}>현대해상</option>
          <option value="4" ${item.inscompany == '4' ? 'selected' : ''}>KB손해보험</option>
        </select>
      </div>
	  <div class="mobile-card-row">
		  <span class="mobile-card-label">상태:</span>
		  <select class="form-control form-control-sm f-status-select mobile-status-select" 
				  data-id="${item.num}" 
				  data-original="${item.ch}">
			<option value="1" ${item.ch == 1 ? "selected" : ""}>접수</option>
			<option value="2" ${item.ch == 2 ? "selected" : ""}>보험료 안내중</option>
			<option value="3" ${item.ch == 3 ? "selected" : ""}>청약서</option>
			<option value="4" ${item.ch == 4 ? "selected" : ""}>입금대기중</option>
			<option value="5" ${item.ch == 5 ? "selected" : ""}>입금확인</option>
			<option value="6" ${item.ch == 6 ? "selected" : ""}>증권 발급</option>
			<option value="7" ${item.ch == 7 ? "selected" : ""}>보류</option>
			<option value="12" ${item.ch == 12 ? "selected" : ""}>수정요청</option>
			<option value="38" ${item.ch == 38 ? "selected" : ""}>청약서날인</option>
			<option value="39" ${item.ch == 39 ? "selected" : ""}>질문서날인</option>
			<option value="40" ${item.ch == 40 ? "selected" : ""}>과별인원</option>
		  </select>
	  </div>
	  <div class="mobile-card-row">
		  <span class="mobile-card-label">파일:</span>
		  <button class="btn btn-sm btn-info" 
				  onclick="openFileUploadModal(${item.num})">
			<i class="fas fa-file-alt"></i> 파일 업로드
		  </button>
	   </div>
	   <div class="mobile-card-row">
		  <span class="mobile-card-label">클레임:</span>
		  <button class="btn btn-sm btn-warning" 
				  onclick="openClaimModal(${item.num})">
			<i class="fas fa-file-alt"></i> 파일 업로드
		  </button>
	   </div>
	  
      <div class="mobile-card-row">
        <span class="mobile-card-label">담당자:</span>
        <span class="mobile-card-value">${item.damdanga || '-'}</span>
      </div>
    </div>
  `;
  
  return card;
}

// 보험사 텍스트 변환
function getInsuranceText(code) {
  const insuranceMap = {
    '1': '한화',
    '2': 'Mertiz',
    '3': '현대해상',
    '4': 'KB손해보험'
  };
  return insuranceMap[code] || '기타';
}

// 상태 텍스트 변환
// 상태 텍스트 변환
function getStatusText(status) {
  const statusMap = {
    '1': '접수',
    '2': '보험료 안내중',
    '3': '청약서',
    '4': '입금대기중',
    '5': '입금확인',
    '6': '증권 발급',
    '7': '보류',
    '12': '수정요청',
    '38': '청약서날인',
    '39': '질문서날인',
    '40': '과별인원'
  };
  return statusMap[status] || '기타';
}

// 상태별 CSS 클래스
// 상태별 CSS 클래스
function getStatusClass(status) {
  switch(status) {
    case '1':
      return 'status-other';           // 접수
    case '2':
    case '4':
      return 'status-cancel-request';   // 보험료 안내중, 입금대기중
    case '3':
    case '38':
    case '39':
    case '40':
      return 'status-other';           // 청약서 관련
    case '5':
    case '6':
      return 'status-approved';         // 입금확인, 증권 발급
    case '7':
    case '12':
      return 'status-cancelled';        // 보류, 수정요청
    default:
      return 'status-other';
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

// 통화 포맷팅
function formatCurrency(amount) {
  if (!amount) return '';
  
  try {
    const num = parseInt(amount.toString().replace(/[^0-9]/g, ''));
    if (isNaN(num)) return amount;
    
    return num.toLocaleString('ko-KR') ;
  } catch (error) {
    return amount;
  }
}

// 페이지네이션 업데이트
// 페이지네이션 업데이트
function updatePagination(pagination) {
  const paginationInfo = document.getElementById('pagination_info');
  const paginationControls = document.getElementById('pagination_controls');
  
    // ⭐ 이 부분이 수정되어 있어야 함
  if (!pagination || typeof pagination.total === 'undefined') {
    if (paginationInfo) paginationInfo.innerHTML = '';
    if (paginationControls) paginationControls.innerHTML = '';
    return;
  }

  // ⭐ 이 부분도 수정되어 있어야 함
  const total_count = pagination.total || 0;
  const current_page = pagination.currentPage || 1;
  const limit = pagination.limit || 15;
  const total_pages = pagination.totalPages || 0;

  const startItem = total_count > 0 ? Math.min((current_page - 1) * limit + 1, total_count) : 0;
  const endItem = Math.min(current_page * limit, total_count);

  if (paginationInfo) {
    if (total_count > 0) {
      paginationInfo.innerHTML = `총 ${total_count.toLocaleString()}건 중 ${startItem.toLocaleString()}-${endItem.toLocaleString()}건 표시`;
    } else {
      paginationInfo.innerHTML = '검색된 데이터가 없습니다';
    }
  }

  if (paginationControls) {
    paginationControls.innerHTML = '';
    
    if (total_pages <= 1) return;
    
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${current_page <= 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#"><i class="fas fa-chevron-left"></i></a>`;
    if (current_page > 1) {
      prevLi.querySelector('a').addEventListener('click', (e) => {
        e.preventDefault();
        goToPage(current_page - 1);
      });
    }
    paginationControls.appendChild(prevLi);

    const maxVisible = 5;
    let startPage = Math.max(1, current_page - Math.floor(maxVisible / 2));
    let endPage = Math.min(total_pages, startPage + maxVisible - 1);
    
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    if (startPage > 1) {
      const firstLi = document.createElement('li');
      firstLi.className = 'page-item';
      firstLi.innerHTML = '<a class="page-link" href="#">1</a>';
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
      li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
      
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
      lastLi.innerHTML = `<a class="page-link" href="#">${total_pages}</a>`;
      lastLi.querySelector('a').addEventListener('click', (e) => {
        e.preventDefault();
        goToPage(total_pages);
      });
      paginationControls.appendChild(lastLi);
    }

    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${current_page >= total_pages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#"><i class="fas fa-chevron-right"></i></a>`;
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
  loadFieldPracticeData();
  window.scrollTo({ top: 0, behavior: 'smooth' });
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
  alert(message);
  console.error(message);
}


function attachInsuranceChangeEvents() {
	
	// 보험사 변경 이벤트 리스너 추가
  document.querySelectorAll('.select-insurance').forEach(select => {
    select.addEventListener('change', handleInsuranceChange);
  });
  // 상태 변경 (추가)
  document.querySelectorAll('.f-status-select').forEach(select => {
    select.addEventListener('change', handleStatusChange);
  });
}

// 보험사 변경 처리
async function handleInsuranceChange(event) {
  const selectElement = event.target;
  const fieldPracticeId = selectElement.getAttribute('data-id');
  const newInsurance = selectElement.value;
  const oldInsurance = selectElement.getAttribute('data-original');
  
  // 변경사항이 없으면 중단
  if (newInsurance === oldInsurance) {
    return;
  }

  try {
    // 버튼 비활성화 및 로딩 표시
    selectElement.disabled = true;
    selectElement.style.opacity = '0.6';
    
    // 확인 메시지 표시
    const insuranceText = getInsuranceText(newInsurance);
    if (!confirm(`보험사를 "${insuranceText}"로 변경하시겠습니까?`)) {
      // 취소 시 원래 값으로 복원
      selectElement.value = oldInsurance;
      selectElement.disabled = false;
      selectElement.style.opacity = '1';
      return;
    }

    // 서버에 보험사 변경 요청
    const response = await fetch('/api/field-practice/update-insurance', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        id: fieldPracticeId,
        insurance: newInsurance,
        old_insurance: oldInsurance
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      // 성공 시 원래 값 업데이트
      selectElement.setAttribute('data-original', newInsurance);
      
      // 성공 메시지 표시
      if (window.sjTemplateLoader && window.sjTemplateLoader.showToast) {
        window.sjTemplateLoader.showToast(
          result.message || `보험사가 "${insuranceText}"로 변경되었습니다.`,
          'success'
        );
      } else {
        console.log(`보험사 변경 성공: ${insuranceText}`);
      }
      
    } else {
      throw new Error(result.message || '보험사 변경에 실패했습니다.');
    }

  } catch (error) {
    console.error('보험사 변경 오류:', error);
    
    // 오류 시 원래 값으로 복원
    selectElement.value = oldInsurance;
    
    // 오류 메시지 표시
    if (window.sjTemplateLoader && window.sjTemplateLoader.showToast) {
      window.sjTemplateLoader.showToast(
        '보험사 변경 중 오류가 발생했습니다: ' + error.message,
        'error'
      );
    } else {
      alert('보험사 변경 중 오류가 발생했습니다: ' + error.message);
    }
    
  } finally {
    // 버튼 활성화
    selectElement.disabled = false;
    selectElement.style.opacity = '1';
  }
}


// 상태 변경 처리
async function handleStatusChange(event) {
  const selectElement = event.target;
  const fieldPracticeId = selectElement.getAttribute('data-id');
  const newStatus = selectElement.value;
  const oldStatus = selectElement.getAttribute('data-original');
  
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
    const response = await fetch('/api/field-practice/update-status', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        id: fieldPracticeId,
        status: newStatus,
        old_status: oldStatus
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      // 성공 시 원래 값 업데이트
      selectElement.setAttribute('data-original', newStatus);
      
      // 성공 메시지 표시
      if (window.sjTemplateLoader && window.sjTemplateLoader.showToast) {
        window.sjTemplateLoader.showToast(
          result.message || `상태가 "${statusText}"로 변경되었습니다.`,
          'success'
        );
      } else {
        console.log(`상태 변경 성공: ${statusText}`);
      }
      
      // 데이터 새로고침 (선택사항)
      // loadFieldPracticeData();
      
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


// 메모 입력 시 Enter 키 처리
function handleMemoKeyPress(event, fieldPracticeId) {
  if (event.key === 'Enter') {
    event.preventDefault();
    const inputElement = event.target;
    const memo = inputElement.value.trim();
    
    updateMemo(fieldPracticeId, memo, inputElement);
  }
}

// 메모 업데이트
async function updateMemo(fieldPracticeId, memo, inputElement) {
  // 원래 값 저장
  const originalValue = inputElement.getAttribute('data-original') || '';
  
  // 변경사항이 없으면 중단
  if (memo === originalValue) {
    return;
  }
  
  try {
    // 입력 필드 비활성화
    inputElement.disabled = true;
    inputElement.style.opacity = '0.6';
    
    console.log(`메모 업데이트 시작 - ID: ${fieldPracticeId}`);
    
    // 서버에 메모 업데이트 요청
    const response = await fetch(`/api/field-practice/update-memo/${fieldPracticeId}`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        memo: memo
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      // 성공 시 원래 값 업데이트
      inputElement.setAttribute('data-original', memo);
      
      // 성공 메시지 표시
      if (window.sjTemplateLoader && window.sjTemplateLoader.showToast) {
        window.sjTemplateLoader.showToast(
          '메모가 저장되었습니다.',
          'success'
        );
      } else {
        console.log('메모 저장 성공');
      }
      
      // 입력 필드에서 포커스 제거
      inputElement.blur();
      
    } else {
      throw new Error(result.message || '메모 저장에 실패했습니다.');
    }

  } catch (error) {
    console.error('메모 저장 오류:', error);
    
    // 오류 시 원래 값으로 복원
    inputElement.value = originalValue;
    
    // 오류 메시지 표시
    if (window.sjTemplateLoader && window.sjTemplateLoader.showToast) {
      window.sjTemplateLoader.showToast(
        '메모 저장 중 오류가 발생했습니다: ' + error.message,
        'error'
      );
    } else {
      alert('메모 저장 중 오류가 발생했습니다: ' + error.message);
    }
    
  } finally {
    // 입력 필드 활성화
    inputElement.disabled = false;
    inputElement.style.opacity = '1';
  }
}


// ========================================
// 검색 결과 표시 관련 함수
// ========================================

/**
 * 검색 필드를 한글로 변환
 */
function getSearchFieldText(field) {
  const fieldMap = {
    'school1': '학교명',
    'school2': '사업자번호',
    'school4': '연락처',
    'school5': '이메일',
    'damdanga': '담당자'
  };
  return fieldMap[field] || '학교명';
}

/**
 * 검색 타입을 한글로 변환
 */
function getSearchTypeText(type) {
  const typeMap = {
    'contains': '부분',
    'exact': '정확히',
    'policy': '증권번호'
  };
  return typeMap[type] || '부분';
}

function updateSearchResultSummary(count, data) {
  const summaryDiv = document.getElementById('search-result-summary');
  const summaryText = document.getElementById('result-summary-text');
  
  if (!summaryDiv || !summaryText) {
    console.warn('검색 결과 요약 요소를 찾을 수 없습니다.');
    return;
  }
  
  if (currentSearchTerm && currentSearchTerm.trim() !== '') {
    const searchFieldText = getSearchFieldText(currentSearchField);
    const searchTypeText = getSearchTypeText(currentSearchType);
    
    let summaryHTML = `
      <strong>"${currentSearchTerm}"</strong> 
      ${searchFieldText}에서 ${searchTypeText} 검색 결과: 
      <strong style="font-size: 18px; margin-left: 5px; color: #ffd700;">${count}건</strong>
    `;
    
    // ⭐ cNum 분석 추가 (사업자번호 검색 시에만)
    if (searchFieldText === '사업자번호' && data && data.length > 0) {
      const cNumAnalysis = analyzeCNumDistribution(data);
      
      if (cNumAnalysis && cNumAnalysis.length > 1) {
  summaryHTML += `
    <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.3);">
      <button onclick="toggleCNumAnalysis()" 
              id="cnum-toggle-btn"
              style="
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                padding: 5px 0;
                width: 100%;
                text-align: left;
                font-size: 14px;
                font-weight: 500;
                transition: opacity 0.3s;
              "
              onmouseover="this.style.opacity='0.8'"
              onmouseout="this.style.opacity='1'">
        <i class="fas fa-building"></i> 
        <strong>${cNumAnalysis.length}개 부서/학과</strong>에서 신청
        
        <!-- ⭐⭐⭐ 같은 줄에 표시되는 비교 버튼 -->
        <button onclick="event.stopPropagation(); compareCNums([${cNumAnalysis.map(g => g.cNum).join(',')}])"
                style="
                  display: inline-block;
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: white;
                  border: none;
                  padding: 4px 12px;
                  border-radius: 15px;
                  font-size: 11px;
                  margin-left: 8px;
                  cursor: pointer;
                  transition: all 0.3s;
                  vertical-align: middle;
                "
                onmouseover="this.style.transform='scale(1.05)'"
                onmouseout="this.style.transform='scale(1)'">
          <i class="fas fa-balance-scale"></i> 비교하기
        </button>
        
        <i class="fas fa-chevron-up" id="cnum-chevron" style="float: right; margin-right: 5px;"></i>
      </button>
      
      <div id="cnum-analysis-content" 
           style="
             display: block;
             margin-top: 8px;
             animation: slideDown 0.3s ease-out;
           ">
        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
          ${cNumAnalysis.map((group, index) => `
            <span style="
              background: rgba(255,255,255,0.2);
              padding: 6px 12px;
              border-radius: 15px;
              font-size: 13px;
              white-space: nowrap;
              transition: all 0.3s;
              cursor: pointer;
            "
            onmouseover="this.style.background='rgba(255,255,255,0.3)'; this.style.transform='translateY(-2px)';"
            onmouseout="this.style.background='rgba(255,255,255,0.2)'; this.style.transform='translateY(0)';"
            onclick="highlightByCNum(${group.cNum})"
            title="클릭하면 해당 부서의 데이터를 하이라이트합니다">
              ${group.schoolName} 
              <strong style="color: #ffd700;">${group.count}건</strong>
              <br>
              <span style="opacity: 0.8; font-size: 11px;">
                <i class="fas fa-user" style="margin-right: 3px;"></i>${group.memId}
              </span>
              <span style="opacity: 0.7; font-size: 11px; margin-left: 5px;">(cNum: ${group.cNum})</span>
            </span>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}
    }
    
    summaryText.innerHTML = summaryHTML;
    summaryDiv.style.display = 'block';
    
    console.log(`검색 결과 표시: ${count}건`);
  } else {
    summaryDiv.style.display = 'none';
  }
}

/**
 * 검색 초기화
 */
function clearSearch() {
  console.log('검색 초기화 실행');
  
  // 검색어 입력란 초기화
  const searchWord = document.getElementById('search_word');
  if (searchWord) {
    searchWord.value = '';
  }
  
  // 전역 변수 초기화
  currentSearchTerm = '';
  currentSearchType = 'contains';
  currentSearchField = 'school1';
  currentPage = 1;
  
  // 드롭다운 초기화
  const searchType = document.getElementById('searchType');
  if (searchType) {
    searchType.value = 'contains';
  }
  
  const searchField = document.getElementById('searchField');
  if (searchField) {
    searchField.value = 'school1';
  }
  
  // 상태 필터도 초기화 (선택사항)
  const statusFilter = document.getElementById('statusFilter');
  if (statusFilter) {
    statusFilter.value = '';
  }
  currentStatusFilter = '';
  
  // 데이터 새로고침
  loadFieldPracticeData();
}


/**
 * 검색 결과 데이터에서 cNum 분석
 */
function analyzeCNumDistribution(data) {
  if (!data || data.length === 0) return null;
  
  // cNum별로 그룹화
  const cNumGroups = {};
  
  data.forEach(item => {
    const cNum = item.cNum;
    const schoolName = item.school1 || '알 수 없음';
    const memId = item.mem_id || '-';  // ⭐ mem_id 추가
    
    if (!cNumGroups[cNum]) {
      cNumGroups[cNum] = {
        cNum: cNum,
        schoolName: schoolName,
        memId: memId,  // ⭐ mem_id 저장
        count: 0,
        items: []
      };
    }
    
    cNumGroups[cNum].count++;
    cNumGroups[cNum].items.push(item);
  });
  
  // 배열로 변환하고 건수 순으로 정렬
  const result = Object.values(cNumGroups).sort((a, b) => b.count - a.count);
  
  console.log('cNum 분석 결과:', result);
  return result;
}

/**
 * cNum 분석 영역 펼치기/접기
 */
function toggleCNumAnalysis() {
  const content = document.getElementById('cnum-analysis-content');
  const chevron = document.getElementById('cnum-chevron');
  
  if (!content || !chevron) return;
  
  if (content.style.display === 'none') {
    // 펼치기
    content.style.display = 'block';
    chevron.className = 'fas fa-chevron-up';
    
    console.log('cNum 분석 펼침');
  } else {
    // 접기
    content.style.display = 'none';
    chevron.className = 'fas fa-chevron-up';
    
    console.log('cNum 분석 접음');
  }
}

/**
 * 특정 cNum의 행을 하이라이트
 */
function highlightByCNum(cNum) {
  console.log(`cNum ${cNum} 하이라이트 실행`);
  
  // 데스크톱 테이블 하이라이트
  const tableRows = document.querySelectorAll('#field_practice_table_body tr');
  let highlightCount = 0;
  
  tableRows.forEach(row => {
    const rowCNum = row.getAttribute('data-cnum');
    
    if (rowCNum == cNum) {
      // 매칭되는 행 하이라이트
      row.style.background = 'linear-gradient(90deg, #fff9e6 0%, #fffaed 100%)';
      row.style.transition = 'all 0.3s';
      highlightCount++;
      
      // 5초 후 원래대로
      setTimeout(() => {
        row.style.background = '';
      }, 5000);
    } else {
      // 나머지 행은 흐리게
      row.style.opacity = '0.3';
      
      setTimeout(() => {
        row.style.opacity = '1';
      }, 5000);
    }
  });
  
  // 모바일 카드 하이라이트
  const mobileCards = document.querySelectorAll('.mobile-card');
  
  mobileCards.forEach(card => {
    const cardCNum = card.getAttribute('data-cnum');
    
    if (cardCNum == cNum) {
      card.style.background = 'linear-gradient(135deg, #fff9e6 0%, #fffaed 100%)';
      card.style.boxShadow = '0 6px 12px rgba(255, 193, 7, 0.3)';
      card.style.transition = 'all 0.3s';
      
      setTimeout(() => {
        card.style.background = '';
        card.style.boxShadow = '';
      }, 5000);
    } else {
      card.style.opacity = '0.3';
      
      setTimeout(() => {
        card.style.opacity = '1';
      }, 5000);
    }
  });
  
  // 사용자 피드백
  showToast(`${highlightCount}건의 데이터를 하이라이트했습니다 (cNum: ${cNum})`, 'info');
  
  // 첫 번째 매칭 행으로 스크롤
  if (tableRows.length > 0) {
    tableRows.forEach(row => {
      if (row.getAttribute('data-cnum') == cNum) {
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    });
  }
}

/**
 * 토스트 메시지 표시
 */
function showToast(message, type = 'info') {
  // 기존 토스트 제거
  const existingToast = document.getElementById('custom-toast');
  if (existingToast) {
    existingToast.remove();
  }
  
  // 색상 설정
  const colors = {
    'info': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'success': 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'warning': 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'error': 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)'
  };
  
  // 토스트 생성
  const toast = document.createElement('div');
  toast.id = 'custom-toast';
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${colors[type] || colors['info']};
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    z-index: 9999;
    font-size: 14px;
    font-weight: 500;
    animation: slideInRight 0.3s ease-out;
  `;
  toast.innerHTML = `
    <i class="fas fa-info-circle"></i> ${message}
  `;
  
  document.body.appendChild(toast);
  
  // 3초 후 자동 제거
  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.3s ease-out';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}


// ========================================
// 사업자번호 포맷팅 관련 함수
// ========================================

/**
 * 사업자번호 포맷팅 (3128210329 → 312-82-10329)
 */
function formatBusinessNumber(value) {
  // 숫자만 추출
  const numbers = value.replace(/[^0-9]/g, '');
  
  // 빈 값이면 그대로 반환
  if (!numbers) {
    return value;
  }
  
  // 10자리 미만이면 숫자만 반환
  if (numbers.length < 10) {
    return numbers;
  }
  
  // 10자리 이상이면 3-2-5 형식으로 포맷팅
  return `${numbers.slice(0, 3)}-${numbers.slice(3, 5)}-${numbers.slice(5, 10)}`;
}

/**
 * 사업자번호 입력 필드 실시간 포맷팅
 */
function handleBusinessNumberInput(event) {
  const input = event.target;
  const cursorPosition = input.selectionStart;
  const oldValue = input.value;
  const oldLength = oldValue.length;
  
  // 포맷팅 적용
  const formatted = formatBusinessNumber(oldValue);
  
  // 값이 변경되었으면 업데이트
  if (formatted !== oldValue) {
    input.value = formatted;
    
    // 커서 위치 조정
    const newLength = formatted.length;
    const diff = newLength - oldLength;
    const newCursorPosition = Math.max(0, cursorPosition + diff);
    input.setSelectionRange(newCursorPosition, newCursorPosition);
  }
}
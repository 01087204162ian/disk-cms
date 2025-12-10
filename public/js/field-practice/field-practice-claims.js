/**
 * 현장실습보험 클레임 관리 JavaScript
 */

// 전역 변수
let currentPage = 1;
let currentLimit = 15;
let currentSearchWord = '';
let currentSearchMode = 1;
let currentStatusFilter = ''; // 상태 필터 추가
let isLoading = false;

// 페이지 초기화
document.addEventListener('DOMContentLoaded', function() {
  console.log('클레임 관리 페이지 초기화');
  
  // 이벤트 리스너 등록
  initEventListeners();
  
  // 첫 페이지 로드
  loadClaimList(1);
});

// 이벤트 리스너 초기화
function initEventListeners() {
  // 검색 버튼
  const searchBtn = document.getElementById('search_btn');
  if (searchBtn) {
    searchBtn.addEventListener('click', handleSearch);
  }
  
  // 검색어 입력 (엔터키)
  const searchInput = document.getElementById('search_word');
  if (searchInput) {
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        handleSearch();
      }
    });
  }
  
  // 검색 모드 변경
  const searchMode = document.getElementById('searchMode');
  if (searchMode) {
    searchMode.addEventListener('change', updateSearchPlaceholder);
  }
  
  // 상태 필터 변경
  const statusFilter = document.getElementById('statusFilter');
  if (statusFilter) {
    statusFilter.addEventListener('change', function() {
      currentStatusFilter = this.value;
      loadClaimList(1);
    });
  }
  
  // 페이지 크기 변경
  const pageSize = document.getElementById('pageSize');
  if (pageSize) {
    pageSize.addEventListener('change', function() {
      currentLimit = parseInt(this.value);
      loadClaimList(1);
    });
  }
  
  // 통계 버튼
  const statsBtn = document.getElementById('statistics_btn');
  if (statsBtn) {
    statsBtn.addEventListener('click', showStatistics);
  }
}

// 검색 placeholder 업데이트
function updateSearchPlaceholder() {
  const searchMode = document.getElementById('searchMode').value;
  const searchInput = document.getElementById('search_word');
  
  const placeholders = {
    '1': '증권번호로 검색',
    '2': '접수번호로 검색',
    '3': '학생명으로 검색',
    '4': '계약자명으로 검색'
  };
  
  searchInput.placeholder = placeholders[searchMode] || '검색어를 입력하세요';
}

// 검색 처리
function handleSearch() {
  const searchWord = document.getElementById('search_word').value.trim();
  const searchMode = parseInt(document.getElementById('searchMode').value);
  
  currentSearchWord = searchWord;
  currentSearchMode = searchMode;
  currentPage = 1;
  
  loadClaimList(1);
}

// 클레임 목록 로드
async function loadClaimList(page = 1) {
  if (isLoading) {
    console.log('이미 로딩 중입니다.');
    return;
  }
  
  isLoading = true;
  currentPage = page;
  
  // 로딩 표시
  showLoading();
  
  try {
    const params = new URLSearchParams({
      page: page,
      limit: currentLimit,
      search_school: currentSearchWord,
      search_mode: currentSearchMode
    });
    
    // 상태 필터 추가
    if (currentStatusFilter) {
      params.append('status', currentStatusFilter);
    }
    
    console.log(`클레임 목록 조회: ${params.toString()}`);
    
    const response = await fetch(`/api/field-practice/claims?${params}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || '데이터 조회 실패');
    }
    
    console.log(`총 ${result.data.length}건 조회됨`);
    
    // 테이블 렌더링
    renderTable(result.data);
    
    // 모바일 카드 렌더링
    renderMobileCards(result.data);
    
    // 페이지네이션
    renderPagination(page, result.total);
    
  } catch (error) {
    console.error('클레임 목록 조회 오류:', error);
    showError('데이터를 불러오는 중 오류가 발생했습니다.');
  } finally {
    isLoading = false;
    hideLoading();
  }
}

// 데스크톱 테이블 렌더링
function renderTable(data) {
  const tbody = document.getElementById('claim_table_body');
  
  if (!data || data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="14" class="text-center py-4">검색 결과가 없습니다.</td></tr>';
    return;
  }
  
  let html = '';
  const startNum = (currentPage - 1) * currentLimit;
  
  data.forEach((item, index) => {
    const rowNum = startNum + index + 1;
    const amount = item.claimAmout && !isNaN(item.claimAmout) 
      ? parseInt(item.claimAmout).toLocaleString() 
      : '';
    const description = item.accidentDescription 
      ? item.accidentDescription.substring(0, 30) + (item.accidentDescription.length > 30 ? '...' : '')
      : '';
    
    html += `
      <tr>
        <td class="col-number">
			<button type="button" class="btn btn-info btn-sm" 
					onclick="openClaimModalByClaimId(${item.num})">
			  ${rowNum}
			</button>
		</td>
        <td class="col-date">${item.wdate || ''}</td>
        <td class="col-school-name">${item.school1 || ''}</td>
        <td class="col-policy-number">${item.certi || ''}</td>
        <td class="col-claim-number">${item.claimNumber || ''}</td>
        <td class="claim-col-status">
          <select class="form-control form-control-sm f-status-select" data-id="${item.num}">
            <option value="1" ${item.ch == 1 ? 'selected' : ''}>접수</option>
            <option value="2" ${item.ch == 2 ? 'selected' : ''}>미결</option>
            <option value="3" ${item.ch == 3 ? 'selected' : ''}>종결</option>
            <option value="4" ${item.ch == 4 ? 'selected' : ''}>면책</option>
            <option value="5" ${item.ch == 5 ? 'selected' : ''}>취소</option>
          </select>
        </td>
        <td class="col-payment-date">${item.wdate_2 || ''}</td>
        <td class="col-amount">${amount}</td>
        <td class="col-student">${item.student || ''}</td>
        <td class="col-accident-date">${item.wdate_3 || ''}</td>
        <td class="col-description" title="${item.accidentDescription || ''}">${description}</td>
        <td class="col-action">
          <button class="btn btn-sm btn-upload" onclick="openUploadModal(${item.num})">
            <i class="fas fa-upload"></i>
          </button>
        </td>
        <td class="col-memo d-none d-xl-table-cell">
          <input type="text" class="memo-input" value="${item.memo || ''}" 
                 data-id="${item.num}" onchange="updateMemo(this)">
        </td>
        <td class="col-manager d-none d-xl-table-cell">${item.manager || ''}</td>
      </tr>
    `;
  });
  
  tbody.innerHTML = html;
  
  // 상태 변경 이벤트 리스너
  tbody.querySelectorAll('.f-status-select').forEach(select => {
    select.addEventListener('change', handleStatusChange);
  });
}

// 모바일 카드 렌더링
function renderMobileCards(data) {
  const container = document.getElementById('claim_mobile_cards');
  
  if (!data || data.length === 0) {
    container.innerHTML = '<div class="text-center py-4">검색 결과가 없습니다.</div>';
    return;
  }
  
  let html = '';
  const startNum = (currentPage - 1) * currentLimit;
  
  data.forEach((item, index) => {
    const rowNum = startNum + index + 1;
    const amount = item.claimAmout && !isNaN(item.claimAmout) 
      ? parseInt(item.claimAmout).toLocaleString() + '원'
      : '';
    
    html += `
      <div class="mobile-card">
        <div class="mobile-card-header">
          <div class="mobile-card-number">${rowNum}</div>
          <div class="mobile-card-title">${item.school1 || ''}</div>
        </div>
        <div class="mobile-card-body">
          <div class="mobile-card-row">
            <span class="mobile-card-label">신청일:</span>
            <span class="mobile-card-value">${item.wdate || ''}</span>
          </div>
          <div class="mobile-card-row">
            <span class="mobile-card-label">증권번호:</span>
            <span class="mobile-card-value">${item.certi || ''}</span>
          </div>
          <div class="mobile-card-row">
            <span class="mobile-card-label">접수번호:</span>
            <span class="mobile-card-value">${item.claimNumber || ''}</span>
          </div>
          <div class="mobile-card-row">
            <span class="mobile-card-label">학생명:</span>
            <span class="mobile-card-value">${item.student || ''}</span>
          </div>
          <div class="mobile-card-row">
            <span class="mobile-card-label">사고일자:</span>
            <span class="mobile-card-value">${item.wdate_3 || ''}</span>
          </div>
          <div class="mobile-card-row">
            <span class="mobile-card-label">보험금:</span>
            <span class="mobile-card-value">${amount}</span>
          </div>
          <div class="mobile-card-row">
            <span class="mobile-card-label">상태:</span>
            <span class="mobile-card-value">
              <select class="status-select" data-id="${item.num}" style="width: 100%;">
                <option value="1" ${item.ch == 1 ? 'selected' : ''}>접수</option>
                <option value="2" ${item.ch == 2 ? 'selected' : ''}>미결</option>
                <option value="3" ${item.ch == 3 ? 'selected' : ''}>종결</option>
                <option value="4" ${item.ch == 4 ? 'selected' : ''}>면책</option>
                <option value="5" ${item.ch == 5 ? 'selected' : ''}>취소</option>
              </select>
            </span>
          </div>
          <div class="mobile-card-row">
            <span class="mobile-card-label">담당자:</span>
            <span class="mobile-card-value">${item.manager || ''}</span>
          </div>
        </div>
        <div class="mobile-card-actions">
          <button class="btn btn-sm btn-primary mobile-card-action-btn" onclick="openUploadModal(${item.num})">
            <i class="fas fa-upload"></i> 업로드
          </button>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
  
  // 상태 변경 이벤트 리스너
  container.querySelectorAll('.status-select').forEach(select => {
    select.addEventListener('change', handleStatusChange);
  });
}

// 페이지네이션 렌더링
function renderPagination(currentPage, total) {
  const totalPages = Math.ceil(total / currentLimit);
  const paginationControls = document.getElementById('pagination_controls');
  const paginationInfo = document.getElementById('pagination_info');
  
  // 정보 표시
  const start = (currentPage - 1) * currentLimit + 1;
  const end = Math.min(currentPage * currentLimit, total);
  paginationInfo.textContent = `전체 ${total}건 중 ${start}-${end}건 표시`;
  
  // 페이지 버튼
  let html = '';
  
  // 이전 버튼
  if (currentPage > 1) {
    html += `<li class="page-item"><a class="page-link" href="#" onclick="loadClaimList(${currentPage - 1}); return false;">이전</a></li>`;
  } else {
    html += `<li class="page-item disabled"><span class="page-link">이전</span></li>`;
  }
  
  // 페이지 번호
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);
  
  for (let i = startPage; i <= endPage; i++) {
    if (i === currentPage) {
      html += `<li class="page-item active"><span class="page-link">${i}</span></li>`;
    } else {
      html += `<li class="page-item"><a class="page-link" href="#" onclick="loadClaimList(${i}); return false;">${i}</a></li>`;
    }
  }
  
  // 다음 버튼
  if (currentPage < totalPages) {
    html += `<li class="page-item"><a class="page-link" href="#" onclick="loadClaimList(${currentPage + 1}); return false;">다음</a></li>`;
  } else {
    html += `<li class="page-item disabled"><span class="page-link">다음</span></li>`;
  }
  
  paginationControls.innerHTML = html;
}

// 상태 변경 처리
async function handleStatusChange(event) {
  const select = event.target;
  const id = select.dataset.id;
  const newStatus = select.value;
  
  try {
    const response = await fetch(`/api/field-practice/claims/${id}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: newStatus })
    });
    
    if (!response.ok) {
      throw new Error('상태 변경 실패');
    }
    
    const result = await response.json();
    
    if (result.success) {
      alert('상태가 변경되었습니다.');
    } else {
      throw new Error(result.error || '상태 변경 실패');
    }
    
  } catch (error) {
    console.error('상태 변경 오류:', error);
    alert('상태 변경 중 오류가 발생했습니다.');
    // 원래 값으로 되돌림
    loadClaimList(currentPage);
  }
}

// 메모 업데이트
async function updateMemo(input) {
  const id = input.dataset.id;
  const memo = input.value.trim();
  
  try {
    const response = await fetch(`/api/field-practice/claims/${id}/memo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ memo: memo })
    });
    
    if (!response.ok) {
      throw new Error('메모 업데이트 실패');
    }
    
    const result = await response.json();
    
    if (result.success) {
      input.classList.add('edit-success');
      setTimeout(() => {
        input.classList.remove('edit-success');
      }, 1000);
    } else {
      throw new Error(result.error || '메모 업데이트 실패');
    }
    
  } catch (error) {
    console.error('메모 업데이트 오류:', error);
    alert('메모 업데이트 중 오류가 발생했습니다.');
    input.classList.add('edit-error');
    setTimeout(() => {
      input.classList.remove('edit-error');
    }, 1000);
  }
}

// 파일 업로드 모달 열기
function openUploadModal(claimId) {
  // TODO: 파일 업로드 모달 구현
  console.log('파일 업로드 모달 열기:', claimId);
  alert('파일 업로드 기능은 추후 구현 예정입니다.');
}

// 통계 보기
/*function showStatistics() {
  // TODO: 통계 모달 구현
  console.log('통계 보기');
  alert('통계 기능은 추후 구현 예정입니다.');
}*/

// 로딩 표시/숨김 통합
function showLoading(show = true) {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) {
    overlay.style.display = show ? 'flex' : 'none';
  }
  
  // 로딩 표시 시에만 테이블 업데이트
  if (show) {
    const tbody = document.getElementById('claim_table_body');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="14" class="text-center py-4"><i class="fas fa-spinner fa-spin"></i> 데이터를 불러오는 중...</td></tr>';
    }
    
    const mobileCards = document.getElementById('claim_mobile_cards');
    if (mobileCards) {
      mobileCards.innerHTML = '<div class="text-center py-4"><i class="fas fa-spinner fa-spin"></i> 데이터를 불러오는 중...</div>';
    }
  }
}

// 로딩 숨김
function hideLoading() {
  showLoading(false);
}

// 에러 표시
function showError(message) {
  const tbody = document.getElementById('claim_table_body');
  if (tbody) {
    tbody.innerHTML = `<tr><td colspan="14" class="text-center py-4 text-danger">${message}</td></tr>`;
  }
  
  const mobileCards = document.getElementById('claim_mobile_cards');
  if (mobileCards) {
    mobileCards.innerHTML = `<div class="text-center py-4 text-danger">${message}</div>`;
  }
}
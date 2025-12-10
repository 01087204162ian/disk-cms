/**
 * 예치잔액 관리 모달 관련 함수들
 * pharmacy_deposit.js
 */

// 전역 변수
let currentDepositPage = 1;
let currentDepositPageSize = 20;
let currentDepositSearch = '';

/**
 * 예치잔액 모달 열기 (메인 함수)
 */
async function openDepositBalanceModal() {
  // 모달 제목 설정
  const titleEl = document.getElementById('modalTitle');
  if (titleEl) {
    titleEl.innerHTML = `
      <i class="fas fa-wallet text-primary me-2"></i>
      예치금 관리
    `;
  }

  // 로딩 UI 먼저 표시
  const modalBody = document.getElementById('modalBody');
  if (modalBody) {
    modalBody.innerHTML = `
      <div class="text-center py-4">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">데이터를 불러오는 중...</span>
        </div>
        <div class="mt-2">예치금 정보를 불러오는 중...</div>
      </div>
    `;
  }

  // 모달 열기
  const modal = new bootstrap.Modal(document.getElementById('dynamicModal'));
  modal.show();

  // 전체 거래처 예치금 현황 로드
  await loadDepositSummary();
}

/**
 * 전체 거래처 예치금 현황 로드
 */
async function loadDepositSummary() {
  const modalBody = document.getElementById('modalBody');
  if (!modalBody) return;

  try {
    // API 호출
    const params = new URLSearchParams({
      page: currentDepositPage,
      limit: currentDepositPageSize,
      search: currentDepositSearch
    });

    const response = await fetch(`/api/pharmacy-deposits/summary?${params}`, {
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

    const result = await response.json();

    if (result.success) {
      // UI 표시
      displayDepositSummary(result.data || [], result.pagination || {});
    } else {
      throw new Error(result.message || '데이터를 불러오는데 실패했습니다.');
    }

  } catch (error) {
    console.error('예치금 현황 로드 오류:', error);
    
    // 에러 UI 표시
    modalBody.innerHTML = `
      <div class="alert alert-danger">
        <i class="fas fa-exclamation-circle me-2"></i>
        데이터를 불러오는 중 오류가 발생했습니다: ${error.message}
      </div>
      <div class="text-center">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
         닫기
        </button>
      </div>
    `;
  }
}

/**
 * 예치금 현황 UI 표시 (톤 다운 버전)
 * @param {Array} deposits 예치금 데이터 목록
 * @param {Object} pagination 페이징 정보
 */
function displayDepositSummary(deposits = [], pagination = {}) {
  const modalBody = document.getElementById('modalBody');
  if (!modalBody) return;

  const val = (v, fb = '') => (v === null || v === undefined) ? fb : String(v);
  const formatCurrency = (amount) => {
    if (!amount) return '0';
    return parseInt(amount).toLocaleString('ko-KR');
  };

  // 총계 계산
  const totalDeposit = deposits.reduce((sum, d) => sum + (parseInt(d.total_deposit) || 0), 0);
  const totalUsed = deposits.reduce((sum, d) => sum + (parseInt(d.used_amount) || 0), 0);
  const totalBalance = totalDeposit - totalUsed;

  modalBody.innerHTML = `
    <!-- 통계 카드 영역 (톤 다운) -->
    <div class="row mb-3">
      <div class="col-md-4 col-12 mb-2">
        <div class="card border-0" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
          <div class="card-body text-white text-center py-3">
            <div class="small mb-1 opacity-75">총 예치금액</div>
            <h4 class="mb-0 fw-bold">${formatCurrency(totalDeposit)}원</h4>
          </div>
        </div>
      </div>
      <div class="col-md-4 col-12 mb-2">
        <div class="card border-0" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
          <div class="card-body text-white text-center py-3">
            <div class="small mb-1 opacity-75">총 사용금액</div>
            <h4 class="mb-0 fw-bold">${formatCurrency(totalUsed)}원</h4>
          </div>
        </div>
      </div>
      <div class="col-md-4 col-12 mb-2">
        <div class="card border-0" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
          <div class="card-body text-white text-center py-3">
            <div class="small mb-1 opacity-75">총 잔액</div>
            <h4 class="mb-0 fw-bold">${formatCurrency(totalBalance)}원</h4>
          </div>
        </div>
      </div>
    </div>

    <!-- 검색/필터 영역 -->
    <div class="row mb-3">
      <div class="col-md-6 col-12 mb-2">
        <div class="input-group">
          <input type="text" id="deposit_search_input" class="form-control" 
                 placeholder="거래처명으로 검색" value="${val(currentDepositSearch)}">
          <button class="btn btn-outline-secondary" type="button" onclick="handleDepositSearch()">
            <i class="fas fa-search"></i> 검색
          </button>
        </div>
      </div>
      <div class="col-md-6 col-12 mb-2 text-md-end">
        <button class="btn btn-outline-secondary btn-sm" onclick="refreshDepositSummary()">
          <i class="fas fa-sync-alt"></i> 새로고침
        </button>
      </div>
    </div>

    <!-- 데스크톱 테이블 (768px 이상) -->
    <div class="desktop-deposit-table d-none d-md-block">
      <div class="table-responsive">
        <table class="table table-hover align-middle">
          <thead style="background-color: #f8f9fa; border-bottom: 2px solid #dee2e6;">
            <tr>
              <th class="text-center" style="width: 50px; color: #6c757d;">#</th>
              <th style="color: #6c757d;">거래처명</th>
              <th class="text-end" style="width: 120px; color: #6c757d;">예치금 총액</th>
              <th class="text-end" style="width: 120px; color: #6c757d;">사용금액</th>
              <th class="text-end" style="width: 120px; color: #6c757d;">현재 잔액</th>
              <th class="text-center" style="width: 280px; color: #6c757d;">관리</th>
            </tr>
          </thead>
          <tbody>
            ${deposits.length === 0 ? `
              <tr>
                <td colspan="6" class="text-center py-5 text-muted">
                  <i class="fas fa-inbox fa-3x mb-3 d-block" style="opacity: 0.3;"></i>
                  검색된 데이터가 없습니다.
                </td>
              </tr>
            ` : deposits.map((deposit, index) => {
              const balance = (parseInt(deposit.total_deposit) || 0) - (parseInt(deposit.used_amount) || 0);
              const balanceClass = balance >= 0 ? 'text-success' : 'text-danger';
              
              return `
                <tr style="border-bottom: 1px solid #f0f0f0;">
                  <td class="text-center text-muted">${(currentDepositPage - 1) * currentDepositPageSize + index + 1}</td>
                  <td>
                    <div class="fw-bold" style="color: #2c3e50;">${val(deposit.account_name)}</div>
                    <small class="text-muted">${val(deposit.mem_id)}</small>
                  </td>
                  <td class="text-end" style="color: #667eea; font-weight: 600;">
                    ${formatCurrency(deposit.total_deposit)}원
                  </td>
                  <td class="text-end" style="color: #f5576c; font-weight: 600;">
                    ${formatCurrency(deposit.used_amount)}원
                  </td>
                  <td class="text-end fw-bold ${balanceClass}">
                    ${formatCurrency(balance)}원
                  </td>
                  <td class="text-center">
                    <div class="btn-group btn-group-sm" role="group">
                      <button type="button" class="btn btn-outline-success" 
                              onclick="openDepositChargeModal(${deposit.account_num}, '${val(deposit.account_name).replace(/'/g, "\\'")}')">
                        <i class="fas fa-plus"></i> 충전
                      </button>
                      <button type="button" class="btn btn-outline-primary" 
                              onclick="openDepositListModal(${deposit.account_num}, '${val(deposit.account_name).replace(/'/g, "\\'")}')">
                        <i class="fas fa-list"></i> 예치리스트
                      </button>
                      <button type="button" class="btn btn-outline-info" 
                              onclick="openDepositUsageModal(${deposit.account_num}, '${val(deposit.account_name).replace(/'/g, "\\'")}')">
                        <i class="fas fa-history"></i> 사용내역
                      </button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- 모바일 카드 (768px 미만) -->
    <div class="mobile-deposit-cards d-block d-md-none">
      ${deposits.length === 0 ? `
        <div class="text-center py-5 text-muted">
          <i class="fas fa-inbox fa-3x mb-3" style="opacity: 0.3;"></i>
          <div>검색된 데이터가 없습니다.</div>
        </div>
      ` : deposits.map((deposit, index) => {
        const balance = (parseInt(deposit.total_deposit) || 0) - (parseInt(deposit.used_amount) || 0);
        const balanceClass = balance >= 0 ? 'text-success' : 'text-danger';
        
        return `
          <div class="card mb-3 border-0 shadow-sm">
            <div class="card-header bg-white border-bottom d-flex justify-content-between align-items-center">
              <span class="badge bg-secondary">${(currentDepositPage - 1) * currentDepositPageSize + index + 1}</span>
              <strong style="color: #2c3e50;">${val(deposit.account_name)}</strong>
            </div>
            <div class="card-body">
              <div class="mobile-field-group border-bottom pb-2 mb-2">
                <span class="mobile-field-label text-muted">예치금 총액</span>
                <span class="mobile-field-value fw-bold" style="color: #667eea;">
                  ${formatCurrency(deposit.total_deposit)}원
                </span>
              </div>
              <div class="mobile-field-group border-bottom pb-2 mb-2">
                <span class="mobile-field-label text-muted">사용금액</span>
                <span class="mobile-field-value fw-bold" style="color: #f5576c;">
                  ${formatCurrency(deposit.used_amount)}원
                </span>
              </div>
              <div class="mobile-field-group border-bottom pb-2 mb-2">
                <span class="mobile-field-label text-muted">현재 잔액</span>
                <span class="mobile-field-value fw-bold ${balanceClass}">
                  ${formatCurrency(balance)}원
                </span>
              </div>
              <div class="d-grid gap-2 mt-3">
                <button type="button" class="btn btn-outline-success btn-sm" 
                        onclick="openDepositChargeModal(${deposit.account_num}, '${val(deposit.account_name).replace(/'/g, "\\'")}')">
                  <i class="fas fa-plus me-1"></i>충전
                </button>
                <button type="button" class="btn btn-outline-primary btn-sm" 
                        onclick="openDepositListModal(${deposit.account_num}, '${val(deposit.account_name).replace(/'/g, "\\'")}')">
                  <i class="fas fa-list me-1"></i>예치리스트
                </button>
                <button type="button" class="btn btn-outline-info btn-sm" 
                        onclick="openDepositUsageModal(${deposit.account_num}, '${val(deposit.account_name).replace(/'/g, "\\'")}')">
                  <i class="fas fa-history me-1"></i>사용내역
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>

    <!-- 페이징 영역 -->
    <div class="row mt-3">
      <div class="col-md-6 col-12 mb-2">
        <div id="deposit_pagination_info" class="text-center text-md-start small text-muted"></div>
      </div>
      <div class="col-md-6 col-12">
        <nav aria-label="Page navigation">
          <ul class="pagination pagination-sm justify-content-center justify-content-md-end mb-0" 
              id="deposit_pagination_controls">
          </ul>
        </nav>
      </div>
    </div>
  `;

  // 푸터 설정
  const modalFoot = document.getElementById('modalFoot');
  if (modalFoot) {
    modalFoot.innerHTML = `
      <div class="d-flex justify-content-between align-items-center w-100">
        <small class="text-muted">
          <i class="fas fa-info-circle me-1"></i>
          <span class="d-none d-sm-inline">전체 ${deposits.length}개 거래처</span>
          <span class="d-sm-none">${deposits.length}개</span>
        </small>
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
          <i class="fas fa-times me-1"></i>닫기
        </button>
      </div>
    `;
  }

  // 페이징 업데이트
  updateDepositPagination(pagination);

  // 검색 엔터키 이벤트
  setTimeout(() => {
    const searchInput = document.getElementById('deposit_search_input');
    if (searchInput) {
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          handleDepositSearch();
        }
      });
    }
  }, 100);
}

/**
 * 페이징 업데이트
 * @param {Object} pagination 페이징 정보
 */
function updateDepositPagination(pagination) {
  const paginationInfo = document.getElementById('deposit_pagination_info');
  const paginationControls = document.getElementById('deposit_pagination_controls');
  
  if (!pagination || typeof pagination.total_count === 'undefined') {
    if (paginationInfo) paginationInfo.innerHTML = '';
    if (paginationControls) paginationControls.innerHTML = '';
    return;
  }

  const { total_count, current_page, limit, total_pages } = pagination;
  const startItem = total_count > 0 ? Math.min((current_page - 1) * limit + 1, total_count) : 0;
  const endItem = Math.min(current_page * limit, total_count);

  // 페이지 정보
  if (paginationInfo) {
    if (total_count > 0) {
      paginationInfo.innerHTML = `총 ${total_count.toLocaleString()}건 중 ${startItem.toLocaleString()}-${endItem.toLocaleString()}건`;
    } else {
      paginationInfo.innerHTML = '데이터가 없습니다';
    }
  }

  // 페이지 컨트롤
  if (paginationControls && total_pages > 1) {
    let html = '';
    
    // 이전 버튼
    html += `
      <li class="page-item ${current_page <= 1 ? 'disabled' : ''}">
        <a class="page-link" href="#" onclick="goToDepositPage(${current_page - 1}); return false;">
          <i class="fas fa-chevron-left"></i>
        </a>
      </li>
    `;

    // 페이지 번호
    const maxVisible = 5;
    let startPage = Math.max(1, current_page - Math.floor(maxVisible / 2));
    let endPage = Math.min(total_pages, startPage + maxVisible - 1);
    
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    if (startPage > 1) {
      html += `
        <li class="page-item">
          <a class="page-link" href="#" onclick="goToDepositPage(1); return false;">1</a>
        </li>
      `;
      if (startPage > 2) {
        html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      html += `
        <li class="page-item ${i === current_page ? 'active' : ''}">
          <a class="page-link" href="#" onclick="goToDepositPage(${i}); return false;">${i}</a>
        </li>
      `;
    }

    if (endPage < total_pages) {
      if (endPage < total_pages - 1) {
        html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
      }
      html += `
        <li class="page-item">
          <a class="page-link" href="#" onclick="goToDepositPage(${total_pages}); return false;">${total_pages}</a>
        </li>
      `;
    }

    // 다음 버튼
    html += `
      <li class="page-item ${current_page >= total_pages ? 'disabled' : ''}">
        <a class="page-link" href="#" onclick="goToDepositPage(${current_page + 1}); return false;">
          <i class="fas fa-chevron-right"></i>
        </a>
      </li>
    `;

    paginationControls.innerHTML = html;
  }
}

/**
 * 페이지 이동
 * @param {number} page 페이지 번호
 */
function goToDepositPage(page) {
  currentDepositPage = page;
  loadDepositSummary();
}

/**
 * 검색 처리
 */
function handleDepositSearch() {
  const searchInput = document.getElementById('deposit_search_input');
  if (searchInput) {
    currentDepositSearch = searchInput.value.trim();
    currentDepositPage = 1;
    loadDepositSummary();
  }
}

/**
 * 새로고침
 */
function refreshDepositSummary() {
  currentDepositPage = 1;
  currentDepositSearch = '';
  loadDepositSummary();
}

/**
 * 예치금 충전 모달 열기
 * @param {number} accountNum 거래처 번호
 * @param {string} accountName 거래처명
 */
async function openDepositChargeModal(accountNum, accountName) {
  // 모달 제목 설정
  const titleEl = document.getElementById('modalTitle');
  if (titleEl) {
    titleEl.innerHTML = `
      <i class="fas fa-plus-circle text-success me-2"></i>
      예치금 충전
    `;
  }

  // 충전 입력 폼 표시
  displayDepositChargeForm(accountNum, accountName);

  // 모달 열기
  const modal = new bootstrap.Modal(document.getElementById('dynamicModal'));
  modal.show();
}

/**
 * 예치금 충전 입력 폼 표시
 * @param {number} accountNum 거래처 번호
 * @param {string} accountName 거래처명
 */
function displayDepositChargeForm(accountNum, accountName) {
  const modalBody = document.getElementById('modalBody');
  if (!modalBody) return;

  const val = (v, fb = '') => (v === null || v === undefined) ? fb : String(v);
  
  // 오늘 날짜 (YYYY-MM-DD 형식)
  const today = new Date().toISOString().split('T')[0];

  modalBody.innerHTML = `
    <!-- 거래처 정보 -->
    <div class="alert alert-info mb-4">
      <i class="fas fa-building me-2"></i>
      <strong>${val(accountName)}</strong>
      <small class="text-muted ms-2">(거래처번호: ${accountNum})</small>
    </div>

    <!-- 충전 입력 폼 -->
    <form id="deposit_charge_form" onsubmit="handleDepositChargeSubmit(event, ${accountNum}, '${val(accountName).replace(/'/g, "\\'")}')">
      
      <!-- 입금액 -->
      <div class="mb-3">
        <label for="charge_amount" class="form-label fw-bold">
          <i class="fas fa-won-sign me-1 text-primary"></i>입금액 <span class="text-danger">*</span>
        </label>
        <div class="input-group">
          <input type="text" 
                 class="form-control" 
                 id="charge_amount" 
                 placeholder="예: 5000000" 
                 required 
                 inputmode="numeric"
                 pattern="[0-9,]*">
          <span class="input-group-text">원</span>
        </div>
        <div class="form-text">
          금액을 입력하세요 (콤마는 자동으로 추가됩니다)
        </div>
      </div>

      <!-- 입금일 -->
      <div class="mb-3">
        <label for="charge_date" class="form-label fw-bold">
          <i class="fas fa-calendar me-1 text-primary"></i>입금일 <span class="text-danger">*</span>
        </label>
        <input type="date" 
               class="form-control" 
               id="charge_date" 
               value="${today}" 
               max="${today}"
               required>
        <div class="form-text">
          입금일을 선택하세요 (오늘 이전 날짜만 선택 가능)
        </div>
      </div>

      <!-- 메모 -->
      <div class="mb-3">
        <label for="charge_memo" class="form-label fw-bold">
          <i class="fas fa-comment me-1 text-primary"></i>메모 (선택사항)
        </label>
        <textarea class="form-control" 
                  id="charge_memo" 
                  rows="3" 
                  maxlength="500"
                  placeholder="메모를 입력하세요 (최대 500자)"></textarea>
        <div class="form-text">
          <span id="charge_memo_count">0</span> / 500자
        </div>
      </div>

      <!-- 제출 버튼 -->
      <div class="d-grid gap-2 mt-4">
        <button type="submit" class="btn btn-success btn-lg" id="charge_submit_btn">
          <i class="fas fa-check me-2"></i>충전하기
        </button>
         <button type="button" class="btn btn-outline-secondary" onclick="closeAndReturnToDepositSummary()">
		  <i class="fas fa-times me-2"></i>취소
		</button>
      </div>

    </form>
  `;

  // 푸터 설정
  const modalFoot = document.getElementById('modalFoot');
  if (modalFoot) {
    modalFoot.innerHTML = `
      <small class="text-muted">
        <i class="fas fa-info-circle me-1"></i>
        입금액과 입금일은 필수 입력 사항입니다.
      </small>
    `;
  }

  // 이벤트 리스너 등록
  setTimeout(() => {
    setupDepositChargeFormEvents();
  }, 100);
}

/**
 * 충전 폼 이벤트 설정
 */
function setupDepositChargeFormEvents() {
  // 금액 입력 자동 콤마 포맷팅
  const amountInput = document.getElementById('charge_amount');
  if (amountInput) {
    amountInput.addEventListener('input', (e) => {
      let value = e.target.value.replace(/[^\d]/g, '');
      if (value) {
        e.target.value = parseInt(value).toLocaleString('ko-KR');
      }
    });
  }

  // 메모 글자수 카운터
  const memoInput = document.getElementById('charge_memo');
  const memoCount = document.getElementById('charge_memo_count');
  if (memoInput && memoCount) {
    memoInput.addEventListener('input', (e) => {
      memoCount.textContent = e.target.value.length;
    });
  }

  // 날짜 입력 검증 (오늘 이후 날짜 입력 방지)
  const dateInput = document.getElementById('charge_date');
  if (dateInput) {
    dateInput.addEventListener('change', (e) => {
      const selectedDate = new Date(e.target.value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate > today) {
        alert('입금일은 오늘 이전 날짜만 선택 가능합니다.');
        e.target.value = new Date().toISOString().split('T')[0];
      }
    });
  }
}

/**
 * 예치금 충전 제출 처리
 * @param {Event} event 폼 이벤트
 * @param {number} accountNum 거래처 번호
 * @param {string} accountName 거래처명
 */
async function handleDepositChargeSubmit(event, accountNum, accountName) {
  event.preventDefault();

  // 입력값 수집
  const amountInput = document.getElementById('charge_amount');
  const dateInput = document.getElementById('charge_date');
  const memoInput = document.getElementById('charge_memo');
  const submitBtn = document.getElementById('charge_submit_btn');

  if (!amountInput || !dateInput || !memoInput || !submitBtn) {
    alert('입력 필드를 찾을 수 없습니다.');
    return;
  }

  // 금액 검증 (콤마 제거 후 숫자로 변환)
  const amountStr = amountInput.value.replace(/,/g, '');
  const amount = parseInt(amountStr);
  
  if (!amount || amount <= 0) {
    alert('올바른 금액을 입력해주세요.');
    amountInput.focus();
    return;
  }

  if (amount > 1000000000) { // 10억 이상 입력 방지
    alert('입금액은 10억원 이하로 입력해주세요.');
    amountInput.focus();
    return;
  }

  const depositDate = dateInput.value;
  const memo = memoInput.value.trim();

  // 확인 메시지
  const confirmMsg = `예치금을 충전하시겠습니까?\n\n` +
                     `거래처: ${accountName}\n` +
                     `입금액: ${amount.toLocaleString('ko-KR')}원\n` +
                     `입금일: ${depositDate}` +
                     (memo ? `\n메모: ${memo}` : '');

  if (!confirm(confirmMsg)) {
    return;
  }

  // 버튼 비활성화 및 로딩 표시
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>처리 중...';

  try {
    // API 호출
    const response = await fetch('/api/pharmacy-deposits/deposit', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        account_num: accountNum,
        amount: amount,
        deposit_date: depositDate,
        memo: memo
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      // 성공 처리
      alert(`예치금이 충전되었습니다.\n\n` +
            `거래처: ${accountName}\n` +
            `입금액: ${amount.toLocaleString('ko-KR')}원`);
      
      // 모달 닫기
      const modalEl = document.getElementById('dynamicModal');
      if (modalEl) {
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) {
          modal.hide();
        }
      }

      // 목록 새로고침 (예치잔액 모달이 다시 열림)
      setTimeout(() => {
        openDepositBalanceModal();
      }, 300);

    } else {
      throw new Error(result.message || '예치금 충전에 실패했습니다.');
    }

  } catch (error) {
    console.error('예치금 충전 오류:', error);
    alert(`예치금 충전 중 오류가 발생했습니다.\n\n${error.message}`);
    
    // 버튼 복원
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-check me-2"></i>충전하기';
  }
}

/**
 * 예치 리스트 모달 열기
 * @param {number} accountNum 거래처 번호
 * @param {string} accountName 거래처명
 */
async function openDepositListModal(accountNum, accountName) {
  // 모달 제목 설정
  const titleEl = document.getElementById('modalTitle');
  if (titleEl) {
    titleEl.innerHTML = `
      <i class="fas fa-list text-primary me-2"></i>
      예치 리스트 - ${accountName}
    `;
  }

  // 로딩 UI 먼저 표시
  const modalBody = document.getElementById('modalBody');
  if (modalBody) {
    modalBody.innerHTML = `
      <div class="text-center py-4">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">데이터를 불러오는 중...</span>
        </div>
        <div class="mt-2">예치 리스트를 불러오는 중...</div>
      </div>
    `;
  }

  // 모달 열기
  const modal = new bootstrap.Modal(document.getElementById('dynamicModal'));
  modal.show();

  // 예치 리스트 로드
  await loadDepositList(accountNum, accountName, 1);
}

/**
 * 예치 리스트 로드
 * @param {number} accountNum 거래처 번호
 * @param {string} accountName 거래처명
 * @param {number} page 페이지 번호
 */
async function loadDepositList(accountNum, accountName, page = 1) {
  const modalBody = document.getElementById('modalBody');
  if (!modalBody) return;

  try {
    // API 호출
    const params = new URLSearchParams({
      page: page,
      limit: 20
    });

    const response = await fetch(`/api/pharmacy-deposits/list/${accountNum}?${params}`, {
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

    const result = await response.json();

    if (result.success) {
      // UI 표시
      displayDepositList(accountNum, accountName, result.data || [], result.summary || {}, result.pagination || {});
    } else {
      throw new Error(result.message || '데이터를 불러오는데 실패했습니다.');
    }

  } catch (error) {
    console.error('예치 리스트 로드 오류:', error);
    
    // 에러 UI 표시
    modalBody.innerHTML = `
      <div class="alert alert-danger">
        <i class="fas fa-exclamation-circle me-2"></i>
        데이터를 불러오는 중 오류가 발생했습니다: ${error.message}
      </div>
      <div class="text-center">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
          닫기
        </button>
      </div>
    `;
  }
}

/**
 * 예치 리스트 UI 표시
 * @param {number} accountNum 거래처 번호
 * @param {string} accountName 거래처명
 * @param {Array} deposits 예치 데이터 목록
 * @param {Object} summary 합계 정보
 * @param {Object} pagination 페이징 정보
 */
function displayDepositList(accountNum, accountName, deposits = [], summary = {}, pagination = {}) {
  const modalBody = document.getElementById('modalBody');
  if (!modalBody) return;

  const val = (v, fb = '') => (v === null || v === undefined) ? fb : String(v);
  const formatCurrency = (amount) => {
    if (!amount) return '0';
    return parseInt(amount).toLocaleString('ko-KR');
  };
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      return dateStr.substring(0, 10); // YYYY-MM-DD만
    } catch {
      return dateStr;
    }
  };

  const totalDeposit = summary.total_deposit || 0;
  const currentBalance = summary.current_balance || 0;

  modalBody.innerHTML = `
    <!-- 거래처 정보 및 액션 버튼 -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <div>
        <h6 class="mb-0">
          <i class="fas fa-building me-2 text-primary"></i>${val(accountName)}
        </h6>
        <small class="text-muted">거래처번호: ${accountNum}</small>
      </div>
      <button class="btn btn-outline-success btn-sm" onclick="downloadDepositListExcel(${accountNum}, '${val(accountName).replace(/'/g, "\\'")}')">
        <i class="fas fa-file-excel me-1"></i>엑셀 다운로드
      </button>
    </div>

    <!-- 데스크톱 테이블 (768px 이상) -->
    <div class="desktop-deposit-list d-none d-md-block">
      <div class="table-responsive">
        <table class="table table-hover table-bordered align-middle">
          <thead style="background-color: #f8f9fa;">
            <tr>
              <th class="text-center" style="width: 60px;">#</th>
              <th class="text-center" style="width: 120px;">예치일</th>
              <th class="text-end">예치금액</th>
            </tr>
          </thead>
          <tbody>
            ${deposits.length === 0 ? `
              <tr>
                <td colspan="3" class="text-center py-5 text-muted">
                  <i class="fas fa-inbox fa-3x mb-3 d-block" style="opacity: 0.3;"></i>
                  예치 내역이 없습니다.
                </td>
              </tr>
            ` : deposits.map((deposit, index) => `
              <tr>
                <td class="text-center text-muted">${(pagination.current_page - 1) * pagination.limit + index + 1}</td>
                <td class="text-center">${formatDate(deposit.wdate)}</td>
                <td class="text-end fw-bold" style="color: #667eea;">
                  ${formatCurrency(deposit.money)}원
                </td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot style="background-color: #f8f9fa;">
            <tr>
              <td colspan="2" class="text-center fw-bold">예치금 합계</td>
              <td class="text-end fw-bold text-primary fs-5">
                ${formatCurrency(totalDeposit)}원
              </td>
            </tr>
            <tr style="background-color: #e7f5ff;">
              <td colspan="2" class="text-center fw-bold">예치금 잔액</td>
              <td class="text-end fw-bold text-success fs-5">
                ${formatCurrency(currentBalance)}원
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <!-- 모바일 카드 (768px 미만) -->
    <div class="mobile-deposit-list d-block d-md-none">
      ${deposits.length === 0 ? `
        <div class="text-center py-5 text-muted">
          <i class="fas fa-inbox fa-3x mb-3" style="opacity: 0.3;"></i>
          <div>예치 내역이 없습니다.</div>
        </div>
      ` : deposits.map((deposit, index) => `
        <div class="card mb-2 border-0 shadow-sm">
          <div class="card-body py-2">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <span class="badge bg-secondary me-2">${(pagination.current_page - 1) * pagination.limit + index + 1}</span>
                <span class="text-muted">${formatDate(deposit.wdate)}</span>
              </div>
              <div class="fw-bold" style="color: #667eea;">
                ${formatCurrency(deposit.money)}원
              </div>
            </div>
          </div>
        </div>
      `).join('')}

      <!-- 합계 카드 -->
      <div class="card mt-3 border-0" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
        <div class="card-body text-white">
          <div class="d-flex justify-content-between mb-2">
            <span>예치금 합계</span>
            <span class="fw-bold fs-5">${formatCurrency(totalDeposit)}원</span>
          </div>
          <div class="d-flex justify-content-between">
            <span>예치금 잔액</span>
            <span class="fw-bold fs-4">${formatCurrency(currentBalance)}원</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 페이징 영역 -->
    ${pagination.total_pages > 1 ? `
      <div class="row mt-3">
        <div class="col-12">
          <nav aria-label="Page navigation">
            <ul class="pagination pagination-sm justify-content-center mb-0" id="deposit_list_pagination">
            </ul>
          </nav>
        </div>
      </div>
    ` : ''}
  `;

  // 푸터 설정
  const modalFoot = document.getElementById('modalFoot');
if (modalFoot) {
  modalFoot.innerHTML = `
    <div class="d-flex justify-content-between align-items-center w-100">
      <small class="text-muted">
        <i class="fas fa-info-circle me-1"></i>
        <span class="d-none d-sm-inline">총 ${pagination.total_count || 0}건</span>
        <span class="d-sm-none">${pagination.total_count || 0}건</span>
      </small>
      <button type="button" class="btn btn-secondary" onclick="closeAndReturnToDepositSummary()">
        <i class="fas fa-times me-1"></i>닫기
      </button>
    </div>
  `;
}

  // 페이징 업데이트
  if (pagination.total_pages > 1) {
    updateDepositListPagination(accountNum, accountName, pagination);
  }
}

/**
 * 예치 리스트 페이징 업데이트
 */
function updateDepositListPagination(accountNum, accountName, pagination) {
  const paginationEl = document.getElementById('deposit_list_pagination');
  if (!paginationEl) return;

  const { current_page, total_pages } = pagination;
  let html = '';

  // 이전 버튼
  html += `
    <li class="page-item ${current_page <= 1 ? 'disabled' : ''}">
      <a class="page-link" href="#" onclick="loadDepositList(${accountNum}, '${accountName.replace(/'/g, "\\'")}', ${current_page - 1}); return false;">
        <i class="fas fa-chevron-left"></i>
      </a>
    </li>
  `;

  // 페이지 번호
  const maxVisible = 5;
  let startPage = Math.max(1, current_page - Math.floor(maxVisible / 2));
  let endPage = Math.min(total_pages, startPage + maxVisible - 1);

  if (endPage - startPage + 1 < maxVisible) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    html += `
      <li class="page-item ${i === current_page ? 'active' : ''}">
        <a class="page-link" href="#" onclick="loadDepositList(${accountNum}, '${accountName.replace(/'/g, "\\'")}', ${i}); return false;">${i}</a>
      </li>
    `;
  }

  // 다음 버튼
  html += `
    <li class="page-item ${current_page >= total_pages ? 'disabled' : ''}">
      <a class="page-link" href="#" onclick="loadDepositList(${accountNum}, '${accountName.replace(/'/g, "\\'")}', ${current_page + 1}); return false;">
        <i class="fas fa-chevron-right"></i>
      </a>
    </li>
  `;

  paginationEl.innerHTML = html;
}

/**
 * 예치리스트/사용내역/충전 모달 닫기 후 전체 목록으로 돌아가기
 */
function closeAndReturnToDepositSummary() {
  const modalEl = document.getElementById('dynamicModal');
  const modal = bootstrap.Modal.getInstance(modalEl);
  
  if (modal) {
    // ✅ 모달이 완전히 닫힌 후 실행
    modalEl.addEventListener('hidden.bs.modal', function handler() {
      modalEl.removeEventListener('hidden.bs.modal', handler);
      
      // backdrop 강제 제거
      document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      
      // 전체 목록 모달 열기
      openDepositBalanceModal();
    });
    
    modal.hide();
  } else {
    // 인스턴스가 없으면 바로 정리 후 열기
    document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    
    openDepositBalanceModal();
  }
}
/**
 * 예치 리스트 엑셀 다운로드 (SheetJS 사용)
 * @param {number} accountNum 거래처 번호
 * @param {string} accountName 거래처명
 */
async function downloadDepositListExcel(accountNum, accountName) {
  try {
    // SheetJS 로드 확인
    if (typeof XLSX === 'undefined') {
      alert('엑셀 라이브러리가 로드되지 않았습니다.\n페이지를 새로고침 해주세요.');
      return;
    }

    // 확인 메시지
    if (!confirm(`${accountName}의 예치 리스트를 엑셀로 다운로드하시겠습니까?`)) {
      return;
    }

    // 로딩 표시
    const btn = event?.target?.closest('button');
    let originalHTML = '';
    
    if (btn) {
      originalHTML = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>생성 중...';
    }

    // API 호출 (전체 데이터 - 최대 10,000건)
    const response = await fetch(`/api/pharmacy-deposits/list/${accountNum}?page=1&limit=10000`, {
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

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || '데이터 조회 실패');
    }

    // 데이터가 없는 경우
    if (!result.data || result.data.length === 0) {
      alert('다운로드할 데이터가 없습니다.');
      return;
    }

    // 엑셀 생성 및 다운로드
    generateDepositExcel(result.data, result.summary, accountName, accountNum);

    // 성공 메시지
    setTimeout(() => {
      alert(`엑셀 파일이 다운로드되었습니다.\n총 ${result.data.length}건`);
    }, 500);

  } catch (error) {
    console.error('엑셀 다운로드 오류:', error);
    alert(`엑셀 다운로드 중 오류가 발생했습니다.\n\n${error.message}`);
  } finally {
    // 버튼 복원
    if (btn && originalHTML) {
      setTimeout(() => {
        btn.disabled = false;
        btn.innerHTML = originalHTML;
      }, 1000);
    }
  }
}

/**
 * Excel 파일 생성 및 다운로드 (SheetJS)
 * @param {Array} data 예치 데이터
 * @param {Object} summary 합계 정보
 * @param {string} accountName 거래처명
 * @param {number} accountNum 거래처 번호
 */
function generateDepositExcel(data, summary, accountName, accountNum) {
  // 워크북 생성
  const wb = XLSX.utils.book_new();
  
  // 데이터 배열 생성
  const wsData = [];
  
  // ===== 제목 영역 =====
  wsData.push([`${accountName} 예치 리스트`]);
  wsData.push([`거래처번호: ${accountNum}`]);
  wsData.push([`다운로드 일시: ${new Date().toLocaleString('ko-KR')}`]);
  wsData.push([]); // 빈 행
  
  // ===== 데이터 영역 =====
  // 헤더
  wsData.push(['순번', '예치일', '예치금액(원)']);
  
  // 데이터 행
  data.forEach((item, index) => {
    wsData.push([
      index + 1,
      item.wdate.substring(0, 10), // YYYY-MM-DD
      parseInt(item.money)
    ]);
  });
  
  // 빈 행
  wsData.push([]);
  wsData.push([]); // 구분을 위한 추가 빈 행
  
  // ===== 합계 영역 =====
  wsData.push(['구분', '', '금액(원)']);
  wsData.push(['예치금 합계', '', parseInt(summary.total_deposit || 0)]);
  wsData.push(['현재 잔액', '', parseInt(summary.current_balance || 0)]);
  wsData.push(['사용금액', '', parseInt(summary.used_amount || 0)]);
  
  // 워크시트 생성
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  // ===== 컬럼 너비 설정 =====
  ws['!cols'] = [
    { wch: 8 },   // 순번/구분
    { wch: 12 },  // 예치일
    { wch: 18 }   // 예치금액
  ];
  
  // ===== 행 높이 설정 (선택) =====
  // ws['!rows'] = [
  //   { hpt: 25 }, // 첫 번째 행 (제목)
  // ];
  
  // ===== 셀 병합 =====
  const merges = [];
  
  // 제목 병합 (A1:C1)
  merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } });
  
  // 거래처번호 병합 (A2:C2)
  merges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: 2 } });
  
  // 다운로드일시 병합 (A3:C3)
  merges.push({ s: { r: 2, c: 0 }, e: { r: 2, c: 2 } });
  
  ws['!merges'] = merges;
  
  // ===== 셀 스타일 적용 (기본) =====
  // 제목 셀 (A1)
  if (ws['A1']) {
    ws['A1'].s = {
      font: { bold: true, sz: 14 },
      alignment: { horizontal: 'center', vertical: 'center' }
    };
  }
  
  // 헤더 행 스타일 (5번째 행)
  const headerRow = 4; // 0-based index
  ['A', 'B', 'C'].forEach(col => {
    const cellRef = `${col}${headerRow + 1}`;
    if (ws[cellRef]) {
      ws[cellRef].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: 'F0F0F0' } },
        alignment: { horizontal: 'center' }
      };
    }
  });
  
  // ===== 숫자 포맷 설정 (콤마) =====
  // 예치금액 컬럼에 천단위 콤마 적용
  const startDataRow = 5; // 0-based, 데이터 시작 행
  const endDataRow = startDataRow + data.length - 1;
  
  for (let i = startDataRow; i <= endDataRow; i++) {
    const cellRef = `C${i + 1}`;
    if (ws[cellRef]) {
      ws[cellRef].z = '#,##0'; // 숫자 포맷
    }
  }
  
  // 합계 영역 숫자 포맷
  const summaryStartRow = endDataRow + 4; // 빈 행 2개 + 헤더 1개
  for (let i = summaryStartRow; i <= summaryStartRow + 3; i++) {
    const cellRef = `C${i + 1}`;
    if (ws[cellRef]) {
      ws[cellRef].z = '#,##0';
    }
  }
  
  // 워크북에 시트 추가
  XLSX.utils.book_append_sheet(wb, ws, '예치리스트');
  
  // ===== 파일명 생성 =====
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const safeAccountName = accountName.replace(/[\/\\?%*:|"<>]/g, '_'); // 파일명 특수문자 제거
  const fileName = `예치리스트_${safeAccountName}_${today}.xlsx`;
  
  // ===== 다운로드 =====
  XLSX.writeFile(wb, fileName);
}

/**
 * 사용 내역 모달 열기
 * @param {number} accountNum 거래처 번호
 * @param {string} accountName 거래처명
 */
async function openDepositUsageModal(accountNum, accountName) {
  // 모달 제목 설정
  const titleEl = document.getElementById('modalTitle');
  if (titleEl) {
    titleEl.innerHTML = `
      <i class="fas fa-history text-info me-2"></i>
      사용 내역 - ${accountName}
    `;
  }

  // 로딩 UI 먼저 표시
  const modalBody = document.getElementById('modalBody');
  if (modalBody) {
    modalBody.innerHTML = `
      <div class="text-center py-4">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">데이터를 불러오는 중...</span>
        </div>
        <div class="mt-2">사용 내역을 불러오는 중...</div>
      </div>
    `;
  }

  // 모달 열기
  const modal = new bootstrap.Modal(document.getElementById('dynamicModal'));
  modal.show();

  // 사용 내역 로드
  await loadDepositUsage(accountNum, accountName, 1);
}

/**
 * 사용 내역 로드
 * @param {number} accountNum 거래처 번호
 * @param {string} accountName 거래처명
 * @param {number} page 페이지 번호
 */
async function loadDepositUsage(accountNum, accountName, page = 1) {
  const modalBody = document.getElementById('modalBody');
  if (!modalBody) return;

  try {
    // API 호출
    const params = new URLSearchParams({
      page: page,
      limit: 20
    });

    const response = await fetch(`/api/pharmacy-deposits/usage/${accountNum}?${params}`, {
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

    const result = await response.json();

    if (result.success) {
      // UI 표시
      displayDepositUsage(accountNum, accountName, result.data || [], result.summary || {}, result.pagination || {});
    } else {
      throw new Error(result.message || '데이터를 불러오는데 실패했습니다.');
    }

  } catch (error) {
    console.error('사용 내역 로드 오류:', error);
    
    // 에러 UI 표시
    modalBody.innerHTML = `
      <div class="alert alert-danger">
        <i class="fas fa-exclamation-circle me-2"></i>
        데이터를 불러오는 중 오류가 발생했습니다: ${error.message}
      </div>
      <div class="text-center">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
          닫기
        </button>
      </div>
    `;
  }
}

/**
 * 사용 내역 UI 표시
 * @param {number} accountNum 거래처 번호
 * @param {string} accountName 거래처명
 * @param {Array} usages 사용 데이터 목록
 * @param {Object} summary 합계 정보
 * @param {Object} pagination 페이징 정보
 */
function displayDepositUsage(accountNum, accountName, usages = [], summary = {}, pagination = {}) {
  const modalBody = document.getElementById('modalBody');
  if (!modalBody) return;

  const val = (v, fb = '') => (v === null || v === undefined) ? fb : String(v);
  const formatCurrency = (amount) => {
    if (!amount) return '0';
    return parseInt(amount).toLocaleString('ko-KR');
  };
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      return dateStr.substring(0, 10);
    } catch {
      return dateStr;
    }
  };

  // ✅ 직접 계산: API summary 무시하고 data에서 재계산
  let netChange = 0;
  let netProChange = 0;
  let netAreaChange = 0;
  
  usages.forEach(usage => {
    const isRefund = (usage.sortName === '취소' || usage.sortName === '해지완료' || usage.sortName === '10');
    const multiplier = usage.sortName === '승인' ? -1 : (isRefund ? 1 : 0);
    
    netChange += parseInt(usage.approvalPreminum || 0) * multiplier;
    netProChange += parseInt(usage.proPreminum || 0) * multiplier;
    netAreaChange += parseInt(usage.areaPreminum || 0) * multiplier;
  });

  modalBody.innerHTML = `
    <!-- 거래처 정보 및 액션 버튼 -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <div>
        <h6 class="mb-0">
          <i class="fas fa-building me-2 text-info"></i>${val(accountName)}
        </h6>
        <small class="text-muted">거래처번호: ${accountNum}</small>
      </div>
      <button class="btn btn-outline-success btn-sm" onclick="downloadDepositUsageExcel(${accountNum}, '${val(accountName).replace(/'/g, "\\'")}')">
        <i class="fas fa-file-excel me-1"></i>엑셀 다운로드
      </button>
    </div>

    <!-- 데스크톱 테이블 (768px 이상) -->
    <div class="desktop-usage-list d-none d-md-block">
      <div class="table-responsive">
        <table class="table table-hover table-bordered align-middle table-sm">
          <thead style="background-color: #f8f9fa;">
            <tr>
              <th class="text-center" style="width: 50px;">#</th>
              <th class="text-center" style="width: 150px;">신청번호</th>
              <th class="text-center" style="width: 100px;">사용일</th>
              <th class="text-end" style="width: 110px;">승인보험료</th>
              <th class="text-end" style="width: 110px;">전문인보험료</th>
              <th class="text-end" style="width: 110px;">화재보험료</th>
              <th class="text-center" style="width: 80px;">구분</th>  
            </tr>
          </thead>
          <tbody>
            ${usages.length === 0 ? `
              <tr>
                <td colspan="7" class="text-center py-5 text-muted">
                  <i class="fas fa-inbox fa-3x mb-3 d-block" style="opacity: 0.3;"></i>
                  사용 내역이 없습니다.
                </td>
              </tr>
            ` : usages.map((usage, index) => {
              return `
                <tr>
                  <td class="text-center text-muted">${(pagination.current_page - 1) * pagination.limit + index + 1}</td>
                  <td class="text-center">
                    <div class="text-primary small">${val(usage.company)}(${val(usage.applyNum)})</div>
                  </td>
                  <td class="text-center">${formatDate(usage.wdate)}</td>
                  <td class="text-end fw-bold" style="color: #f5576c;">
                    ${formatCurrency(usage.approvalPreminum)}원
                  </td>
                  <td class="text-end" style="color: #667eea;">
                    ${formatCurrency(usage.proPreminum)}원
                  </td>
                  <td class="text-end" style="color: #f093fb;">
                    ${formatCurrency(usage.areaPreminum)}원
                  </td>
                  <td class="text-center">
                    ${usage.sortName === '승인' ? 
                      '<span class="badge bg-danger">사용</span>' : 
                      (usage.sortName === '취소' || usage.sortName === '해지완료' || usage.sortName === '10') ?
                      '<span class="badge bg-success">환급</span>' :
                      '<span class="badge bg-secondary">기타</span>'}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
          <tfoot style="background-color: #e7f5ff;">
            <tr>
              <td colspan="3" class="text-center fw-bold">순 변동액 (사용-환급)</td>
              <td class="text-end fw-bold ${netChange >= 0 ? 'text-success' : 'text-danger'} fs-5">
                ${formatCurrency(Math.abs(netChange))}원
                ${netChange < 0 ? '<small class="d-block text-muted">(사용)</small>' : netChange > 0 ? '<small class="d-block text-muted">(환급)</small>' : ''}
              </td>
              <td class="text-end fw-bold ${netProChange >= 0 ? 'text-success' : 'text-danger'}">
                ${formatCurrency(Math.abs(netProChange))}원
              </td>
              <td class="text-end fw-bold ${netAreaChange >= 0 ? 'text-success' : 'text-danger'}">
                ${formatCurrency(Math.abs(netAreaChange))}원
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <!-- 모바일 카드 (768px 미만) -->
    <div class="mobile-usage-list d-block d-md-none">
      ${usages.length === 0 ? `
        <div class="text-center py-5 text-muted">
          <i class="fas fa-inbox fa-3x mb-3" style="opacity: 0.3;"></i>
          <div>사용 내역이 없습니다.</div>
        </div>
      ` : usages.map((usage, index) => {
        return `
          <div class="card mb-2 border-0 shadow-sm">
            <div class="card-body py-2">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <div>
                  <span class="badge bg-secondary me-1">${(pagination.current_page - 1) * pagination.limit + index + 1}</span>
                  <small class="text-muted">${formatDate(usage.wdate)}</small>
                </div>
                ${usage.sortName === '승인' ? 
                  '<span class="badge bg-danger">사용</span>' : 
                  (usage.sortName === '취소' || usage.sortName === '해지완료' || usage.sortName === '10') ?
                  '<span class="badge bg-success">환급</span>' :
                  '<span class="badge bg-secondary">기타</span>'}
              </div>
              
              <div class="small mb-1">
                <span class="text-muted">상호:</span> 
                <span class="text-primary">${val(usage.company)}(${val(usage.applyNum)})</span>
              </div>
              <div class="d-flex justify-content-between align-items-center">
                <span class="text-muted small">승인보험료</span>
                <span class="fw-bold" style="color: #f5576c;">
                  ${formatCurrency(usage.approvalPreminum)}원
                </span>
              </div>
              <div class="d-flex justify-content-between align-items-center">
                <span class="text-muted small">전문인</span>
                <span class="small" style="color: #667eea;">
                  ${formatCurrency(usage.proPreminum)}원
                </span>
              </div>
              <div class="d-flex justify-content-between align-items-center">
                <span class="text-muted small">화재</span>
                <span class="small" style="color: #f093fb;">
                  ${formatCurrency(usage.areaPreminum)}원
                </span>
              </div>
            </div>
          </div>
        `;
      }).join('')}

      <!-- 합계 카드 -->
      <div class="card mt-3 border-0" style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);">
        <div class="card-body py-3">
          <div class="d-flex justify-content-between">
            <span class="fw-bold">순 변동액</span>
            <span class="fw-bold fs-4 ${netChange >= 0 ? 'text-success' : 'text-danger'}">
              ${formatCurrency(Math.abs(netChange))}원
              ${netChange < 0 ? '<small class="d-block text-muted">(사용)</small>' : netChange > 0 ? '<small class="d-block text-muted">(환급)</small>' : ''}
            </span>
          </div>
          <div class="d-flex justify-content-between small mt-2">
            <span class="text-muted">전문인</span>
            <span class="${netProChange >= 0 ? 'text-success' : 'text-danger'}">${formatCurrency(Math.abs(netProChange))}원</span>
          </div>
          <div class="d-flex justify-content-between small">
            <span class="text-muted">화재</span>
            <span class="${netAreaChange >= 0 ? 'text-success' : 'text-danger'}">${formatCurrency(Math.abs(netAreaChange))}원</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 페이징 영역 -->
    ${pagination.total_pages > 1 ? `
      <div class="row mt-3">
        <div class="col-12">
          <nav aria-label="Page navigation">
            <ul class="pagination pagination-sm justify-content-center mb-0" id="deposit_usage_pagination">
            </ul>
          </nav>
        </div>
      </div>
    ` : ''}
  `;

  // 푸터 설정
  const modalFoot = document.getElementById('modalFoot');
  if (modalFoot) {
    modalFoot.innerHTML = `
      <div class="d-flex justify-content-between align-items-center w-100">
        <small class="text-muted">
          <i class="fas fa-info-circle me-1"></i>
          <span class="d-none d-sm-inline">총 ${pagination.total_count || 0}건</span>
          <span class="d-sm-none">${pagination.total_count || 0}건</span>
        </small>
        <button type="button" class="btn btn-secondary" onclick="closeAndReturnToDepositSummary()">
          <i class="fas fa-times me-1"></i>닫기
        </button>
      </div>
    `;
  }

  // 페이징 업데이트
  if (pagination.total_pages > 1) {
    updateDepositUsagePagination(accountNum, accountName, pagination);
  }
}

/**
 * 사용 내역 페이징 업데이트
 */
function updateDepositUsagePagination(accountNum, accountName, pagination) {
  const paginationEl = document.getElementById('deposit_usage_pagination');
  if (!paginationEl) return;

  const { current_page, total_pages } = pagination;
  let html = '';

  // 이전 버튼
  html += `
    <li class="page-item ${current_page <= 1 ? 'disabled' : ''}">
      <a class="page-link" href="#" onclick="loadDepositUsage(${accountNum}, '${accountName.replace(/'/g, "\\'")}', ${current_page - 1}); return false;">
        <i class="fas fa-chevron-left"></i>
      </a>
    </li>
  `;

  // 페이지 번호
  const maxVisible = 5;
  let startPage = Math.max(1, current_page - Math.floor(maxVisible / 2));
  let endPage = Math.min(total_pages, startPage + maxVisible - 1);

  if (endPage - startPage + 1 < maxVisible) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    html += `
      <li class="page-item ${i === current_page ? 'active' : ''}">
        <a class="page-link" href="#" onclick="loadDepositUsage(${accountNum}, '${accountName.replace(/'/g, "\\'")}', ${i}); return false;">${i}</a>
      </li>
    `;
  }

  // 다음 버튼
  html += `
    <li class="page-item ${current_page >= total_pages ? 'disabled' : ''}">
      <a class="page-link" href="#" onclick="loadDepositUsage(${accountNum}, '${accountName.replace(/'/g, "\\'")}', ${current_page + 1}); return false;">
        <i class="fas fa-chevron-right"></i>
      </a>
    </li>
  `;

  paginationEl.innerHTML = html;
}

/**
 * 사용 내역 엑셀 다운로드
 * @param {number} accountNum 거래처 번호
 * @param {string} accountName 거래처명
 */
async function downloadDepositUsageExcel(accountNum, accountName) {
  // 클릭된 버튼 찾기
  let btn = null;
  if (window.event) {
    btn = window.event.target.closest('button');
  }
  
  let originalHTML = '';
  
  try {
    // SheetJS 로드 확인
    if (typeof XLSX === 'undefined') {
      alert('엑셀 라이브러리가 로드되지 않았습니다.\n페이지를 새로고침 해주세요.');
      return;
    }

    if (!confirm(`${accountName}의 사용 내역을 엑셀로 다운로드하시겠습니까?`)) {
      return;
    }

    // 로딩 표시
    if (btn) {
      originalHTML = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>생성 중...';
    }

    // API 호출 (전체 데이터)
    const response = await fetch(`/api/pharmacy-deposits/usage/${accountNum}?page=1&limit=10000`, {
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

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || '데이터 조회 실패');
    }

    if (!result.data || result.data.length === 0) {
      alert('다운로드할 데이터가 없습니다.');
      // ✅ 버튼 복원
      if (btn && originalHTML) {
        btn.disabled = false;
        btn.innerHTML = originalHTML;
      }
      return;
    }

    // 엑셀 생성 및 다운로드
    generateUsageExcel(result.data, result.summary, accountName, accountNum);

    // ✅ 성공 시 버튼 복원
    if (btn && originalHTML) {
      btn.disabled = false;
      btn.innerHTML = originalHTML;
    }

    alert(`엑셀 파일이 다운로드되었습니다.\n총 ${result.data.length}건`);

  } catch (error) {
    console.error('엑셀 다운로드 오류:', error);
    alert(`엑셀 다운로드 중 오류가 발생했습니다.\n\n${error.message}`);
    
    // ✅ 에러 시 버튼 복원
    if (btn && originalHTML) {
      btn.disabled = false;
      btn.innerHTML = originalHTML;
    }
  }
}

function generateUsageExcel(data, summary, accountName, accountNum) {
  const wb = XLSX.utils.book_new();
  const wsData = [];
  
  // ✅ 순 변동액 계산 (승인=양수, 환급=음수)
  let netChange = 0;
  let netProChange = 0;
  let netAreaChange = 0;
  
  data.forEach(item => {
    const isRefund = (item.sortName === '취소' || item.sortName === '해지완료' || item.sortName === '10');
    const multiplier = item.sortName === '승인' ? 1 : (isRefund ? -1 : 0);  // ✅ 반대로
    
    netChange += parseInt(item.approvalPreminum || 0) * multiplier;
    netProChange += parseInt(item.proPreminum || 0) * multiplier;
    netAreaChange += parseInt(item.areaPreminum || 0) * multiplier;
  });
  
  // ✅ 구분 텍스트 (양수=사용, 음수=환급)
  let changeType = '';
  if (netChange > 0) {
    changeType = '사용';
  } else if (netChange < 0) {
    changeType = '환급';
  } else {
    changeType = '변동없음';
  }
  
  // 제목
  wsData.push([`${accountName} 사용 내역`]);
  wsData.push([`거래처번호: ${accountNum}`]);
  wsData.push([`다운로드 일시: ${new Date().toLocaleString('ko-KR')}`]);
  wsData.push([]);
  
  // 헤더
  wsData.push(['순번', '신청번호', '상호', '사용일', '승인보험료(원)', '전문인보험료(원)', '화재보험료(원)', '구분']);
  
  // ✅ 데이터 (승인=양수, 환급=음수)
  data.forEach((item, index) => {
    let gubun = '';
    let approvalAmount = parseInt(item.approvalPreminum);
    let proAmount = parseInt(item.proPreminum);
    let areaAmount = parseInt(item.areaPreminum);
    
    if (item.sortName === '승인') {
      gubun = '사용';
      // 양수 그대로
    } else if (item.sortName === '취소' || item.sortName === '해지완료' || item.sortName === '10') {
      gubun = '환급';
      // ✅ 음수로 변경
      approvalAmount = -approvalAmount;
      proAmount = -proAmount;
      areaAmount = -areaAmount;
    } else {
      gubun = item.sortName || '';
    }
    
    wsData.push([
      index + 1,
      item.applyNum,
      item.company || '',
      item.wdate.substring(0, 10),
      approvalAmount,
      proAmount,
      areaAmount,
      gubun 
    ]);
  });
  
  // ✅ 합계 영역
  wsData.push([]);
  wsData.push([]);
  wsData.push(['구분', '', '', '', '승인보험료', '전문인보험료', '화재보험료', '']);
  wsData.push([
    `순 변동액 (${changeType})`, 
    '', 
    '', 
    '', 
    netChange,      // ✅ 양수=사용, 음수=환급
    netProChange,  
    netAreaChange,
    ''
  ]);
  
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  // 컬럼 너비
  ws['!cols'] = [
    { wch: 8 },
    { wch: 15 },
    { wch: 20 },
    { wch: 12 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 8 }
  ];
  
  // 셀 병합
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 7 } }
  ];
  
  // 숫자 포맷 (음수는 빨간색)
  const startRow = 5;
  const endRow = startRow + data.length - 1;
  
  for (let i = startRow; i <= endRow; i++) {
    ['E', 'F', 'G'].forEach(col => {
      const cellRef = `${col}${i + 1}`;
      if (ws[cellRef]) {
        ws[cellRef].z = '#,##0;[Red]-#,##0';
      }
    });
  }
  
  // 합계 영역
  const summaryRow = endRow + 4;
  ['E', 'F', 'G'].forEach(col => {
    const cellRef = `${col}${summaryRow}`;
    if (ws[cellRef]) {
      // ✅ 양수(사용)=파란색, 음수(환급)=빨간색
      ws[cellRef].z = '[Blue]#,##0;[Red]-#,##0';
    }
  });
  
  XLSX.utils.book_append_sheet(wb, ws, '사용내역');
  
  const today = new Date().toISOString().split('T')[0];
  const safeAccountName = accountName.replace(/[\/\\?%*:|"<>]/g, '_');
  const fileName = `사용내역_${safeAccountName}_${today}.xlsx`;
  
  XLSX.writeFile(wb, fileName);
}




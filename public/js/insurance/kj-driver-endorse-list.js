// KJ 대리운전 배서 리스트 - 프론트 스크립트
// API: GET /api/insurance/kj-endorse/list?page=&limit=&push=&endorseDay=&policyNum=&companyNum=&endorseType=

(function () {
  'use strict';

  // DOM 요소
  const tableBody = document.getElementById('endorseListTableBody');
  const mobileCards = document.getElementById('endorseListMobileCards');
  const paginationInfo = document.getElementById('paginationInfo');
  const paginationControls = document.getElementById('paginationControls');

  // 필터 요소
  const statusFilter = document.getElementById('statusFilter');
  const endorseDateFilter = document.getElementById('endorseDateFilter');
  const policyNumFilter = document.getElementById('policyNumFilter');
  const companyFilter = document.getElementById('companyFilter');
  const endorseTypeFilter = document.getElementById('endorseTypeFilter');
  const pageSizeSelect = document.getElementById('pageSize');
  const searchBtn = document.getElementById('searchBtn');
  const resetBtn = document.getElementById('resetBtn');

  // 통계 정보
  const statsSubscription = document.getElementById('statsSubscription');
  const statsCancellation = document.getElementById('statsCancellation');
  const statsTotal = document.getElementById('statsTotal');

  // 상태 변수
  let currentPage = 1;
  let currentLimit = 20;
  let currentPagination = { page: 1, limit: 20, total: 0, totalPages: 1 };

  // ==================== 초기화 ====================

  // 배서기준일 기본값 설정 (오늘 날짜)
  const initEndorseDate = () => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    endorseDateFilter.value = todayStr;
    // 배서기준일이 설정되면 증권번호 목록 로드
    loadPolicyNumList();
  };

  // 배서기준일 변경 시 증권번호 목록 로드
  const loadPolicyNumList = async () => {
    const endorseDay = endorseDateFilter.value;
    if (!endorseDay) {
      policyNumFilter.innerHTML = '<option value="">-- 증권 선택 --</option>';
      policyNumFilter.disabled = true;
      companyFilter.disabled = true;
      return;
    }

    try {
      policyNumFilter.disabled = true;
      policyNumFilter.innerHTML = '<option value="">로딩 중...</option>';

      // API 호출: 배서기준일로 신청된 증권번호 목록 조회
      const response = await fetch(`/api/insurance/kj-endorse/policy-list?endorseDay=${endorseDay}`);
      const json = await response.json();

      if (!json.success) {
        throw new Error(json.error || '증권번호 목록 조회 실패');
      }

      policyNumFilter.innerHTML = '<option value="">-- 증권 선택 --</option>';
      
      if (json.data && json.data.length > 0) {
        json.data.forEach(item => {
          const option = document.createElement('option');
          option.value = item.policyNum || item.policy_num || '';
          option.textContent = `${item.policyNum || item.policy_num || ''} (${item.insuranceCom || item.insurance_com || ''})`;
          policyNumFilter.appendChild(option);
        });
        policyNumFilter.disabled = false;
      } else {
        policyNumFilter.innerHTML = '<option value="">-- 증권 없음 --</option>';
        policyNumFilter.disabled = true;
      }

      // 증권번호가 없으면 대리운전회사 필터도 비활성화
      if (json.data && json.data.length === 0) {
        companyFilter.disabled = true;
        companyFilter.innerHTML = '<option value="">-- 대리운전회사 선택 --</option>';
      } else {
        // 증권번호가 있으면 대리운전회사 목록도 로드
        loadCompanyList();
      }
    } catch (error) {
      console.error('증권번호 목록 로드 오류:', error);
      policyNumFilter.innerHTML = '<option value="">-- 오류 발생 --</option>';
      policyNumFilter.disabled = true;
      companyFilter.disabled = true;
    }
  };

  // 증권번호 선택 시 대리운전회사 목록 로드
  const loadCompanyList = async () => {
    const endorseDay = endorseDateFilter.value;
    const policyNum = policyNumFilter.value;

    if (!endorseDay || !policyNum) {
      companyFilter.innerHTML = '<option value="">-- 대리운전회사 선택 --</option>';
      companyFilter.disabled = true;
      return;
    }

    try {
      companyFilter.disabled = true;
      companyFilter.innerHTML = '<option value="">로딩 중...</option>';

      // API 호출: 배서기준일과 증권번호로 대리운전회사 목록 조회
      const response = await fetch(`/api/insurance/kj-endorse/company-list?endorseDay=${endorseDay}&policyNum=${policyNum}`);
      const json = await response.json();

      if (!json.success) {
        throw new Error(json.error || '대리운전회사 목록 조회 실패');
      }

      companyFilter.innerHTML = '<option value="">-- 대리운전회사 선택 --</option>';
      
      if (json.data && json.data.length > 0) {
        json.data.forEach(item => {
          const option = document.createElement('option');
          option.value = item.companyNum || item.company_num || item.dNum || '';
          option.textContent = item.companyName || item.company_name || item.dName || '';
          companyFilter.appendChild(option);
        });
        companyFilter.disabled = false;
      } else {
        companyFilter.innerHTML = '<option value="">-- 대리운전회사 없음 --</option>';
        companyFilter.disabled = true;
      }
    } catch (error) {
      console.error('대리운전회사 목록 로드 오류:', error);
      companyFilter.innerHTML = '<option value="">-- 오류 발생 --</option>';
      companyFilter.disabled = true;
    }
  };

  // ==================== 데이터 로딩 ====================

  const fetchList = async () => {
    const push = statusFilter.value || '';
    const endorseDay = endorseDateFilter.value || '';
    const policyNum = policyNumFilter.value || '';
    const companyNum = companyFilter.value || '';
    const endorseType = endorseTypeFilter.value || '';

    // 필수 필터 검증
    if (!endorseDay) {
      alert('배서기준일을 선택해주세요.');
      return;
    }

    // 로딩 상태 표시
    tableBody.innerHTML = `
      <tr>
        <td colspan="11" class="text-center py-4">
          <div class="spinner-border spinner-border-sm" role="status">
            <span class="visually-hidden">로딩 중...</span>
          </div>
          데이터를 불러오는 중...
        </td>
      </tr>
    `;
    mobileCards.innerHTML = `<div class="text-center py-4">데이터를 불러오는 중...</div>`;

    // API 파라미터 구성
    const params = new URLSearchParams();
    params.append('page', currentPage);
    params.append('limit', currentLimit);
    if (push) params.append('push', push);
    if (endorseDay) params.append('endorseDay', endorseDay);
    if (policyNum) params.append('policyNum', policyNum);
    if (companyNum) params.append('companyNum', companyNum);
    if (endorseType) params.append('endorseType', endorseType);

    try {
      const res = await fetch(`/api/insurance/kj-endorse/list?${params.toString()}`);
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || 'API 오류');
      }

      const rows = json.data || [];
      currentPagination = json.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 };
      
      // 통계 정보 업데이트
      updateStats(json.stats || { subscription: 0, cancellation: 0, total: 0 });
      
      renderTable(rows, currentPagination);
      renderMobile(rows);
      renderPagination(
        currentPagination.page || 1,
        currentPagination.totalPages || 1,
        currentPagination.total || 0
      );
    } catch (err) {
      console.error(err);
      tableBody.innerHTML = `
        <tr>
          <td colspan="11" class="text-center text-danger py-4">오류가 발생했습니다: ${err.message}</td>
        </tr>`;
      mobileCards.innerHTML = `<div class="text-center text-danger py-4">오류가 발생했습니다: ${err.message}</div>`;
      paginationInfo.textContent = '';
      paginationControls.innerHTML = '';
    }
  };

  // 통계 정보 업데이트
  const updateStats = (stats) => {
    statsSubscription.textContent = stats.subscription || 0;
    statsCancellation.textContent = stats.cancellation || 0;
    statsTotal.textContent = stats.total || 0;
  };

  // ==================== 렌더링 ====================

  const renderTable = (rows, pagination) => {
    if (rows.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="11" class="text-center py-4">조회된 데이터가 없습니다.</td>
        </tr>
      `;
      return;
    }

    let html = '';
    const startNum = (pagination.page - 1) * pagination.limit + 1;

    rows.forEach((row, index) => {
      const rowNum = startNum + index;
      const statusText = row.push == 4 ? '청약' : (row.push == 2 ? '해지' : '');
      const statusClass = row.push == 4 ? 'text-primary' : (row.push == 2 ? 'text-danger' : '');

      html += `
        <tr>
          <td class="text-center">${rowNum}</td>
          <td>${row.policyNum || row.policy_num || ''}</td>
          <td>${row.endorseNum || row.endorse_num || ''}</td>
          <td>${row.insuranceCom || row.insurance_com || ''}</td>
          <td>${row.endorseDay || row.endorse_day || ''}</td>
          <td class="${statusClass}">${statusText}</td>
          <td>${row.manager || row.writer || ''}</td>
          <td>${row.companyName || row.company_name || row.dName || ''}</td>
          <td>${row.name || row.Name || ''}</td>
          <td>${row.jumin || row.Jumin || ''}</td>
          <td>${row.phone || row.Hphone || ''}</td>
        </tr>
      `;
    });

    tableBody.innerHTML = html;
  };

  const renderMobile = (rows) => {
    if (rows.length === 0) {
      mobileCards.innerHTML = `<div class="text-center py-4">조회된 데이터가 없습니다.</div>`;
      return;
    }

    let html = '';
    rows.forEach((row) => {
      const statusText = row.push == 4 ? '청약' : (row.push == 2 ? '해지' : '');
      const statusClass = row.push == 4 ? 'badge bg-primary' : (row.push == 2 ? 'badge bg-danger' : 'badge bg-secondary');

      html += `
        <div class="card mb-2">
          <div class="card-body">
            <h6 class="card-title">
              ${row.name || row.Name || ''}
              <span class="${statusClass} ms-2">${statusText}</span>
            </h6>
            <p class="card-text small mb-1">
              <strong>증권번호:</strong> ${row.policyNum || row.policy_num || ''}<br>
              <strong>배서번호:</strong> ${row.endorseNum || row.endorse_num || ''}<br>
              <strong>보험사:</strong> ${row.insuranceCom || row.insurance_com || ''}<br>
              <strong>배서일자:</strong> ${row.endorseDay || row.endorse_day || ''}<br>
              <strong>대리운전회사:</strong> ${row.companyName || row.company_name || row.dName || ''}<br>
              <strong>작성자:</strong> ${row.manager || row.writer || ''}
            </p>
          </div>
        </div>
      `;
    });

    mobileCards.innerHTML = html;
  };

  const renderPagination = (currentPage, totalPages, total) => {
    // 페이지 정보
    const start = total === 0 ? 0 : (currentPage - 1) * currentLimit + 1;
    const end = Math.min(currentPage * currentLimit, total);
    paginationInfo.textContent = `총 ${total.toLocaleString()}건 중 ${start.toLocaleString()}-${end.toLocaleString()}건 표시`;

    // 페이지네이션 컨트롤
    if (totalPages <= 1) {
      paginationControls.innerHTML = '';
      return;
    }

    let html = '';

    // 이전 버튼
    if (currentPage > 1) {
      html += `
        <li class="page-item">
          <a class="page-link" href="#" data-page="${currentPage - 1}">이전</a>
        </li>
      `;
    }

    // 페이지 번호
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

    if (startPage > 1) {
      html += `<li class="page-item"><a class="page-link" href="#" data-page="1">1</a></li>`;
      if (startPage > 2) {
        html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      html += `
        <li class="page-item ${i === currentPage ? 'active' : ''}">
          <a class="page-link" href="#" data-page="${i}">${i}</a>
        </li>
      `;
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
      }
      html += `<li class="page-item"><a class="page-link" href="#" data-page="${totalPages}">${totalPages}</a></li>`;
    }

    // 다음 버튼
    if (currentPage < totalPages) {
      html += `
        <li class="page-item">
          <a class="page-link" href="#" data-page="${currentPage + 1}">다음</a>
        </li>
      `;
    }

    paginationControls.innerHTML = html;

    // 페이지네이션 이벤트 바인딩
    paginationControls.querySelectorAll('a.page-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = parseInt(link.dataset.page);
        if (page && page !== currentPage) {
          currentPage = page;
          fetchList();
        }
      });
    });
  };

  // ==================== 이벤트 바인딩 ====================

  // 배서기준일 변경 시 증권번호 목록 로드
  endorseDateFilter?.addEventListener('change', () => {
    loadPolicyNumList();
    // 증권번호가 변경되면 대리운전회사도 초기화
    companyFilter.innerHTML = '<option value="">-- 대리운전회사 선택 --</option>';
    companyFilter.disabled = true;
  });

  // 증권번호 변경 시 대리운전회사 목록 로드
  policyNumFilter?.addEventListener('change', () => {
    loadCompanyList();
  });

  // 검색 버튼
  searchBtn?.addEventListener('click', () => {
    currentPage = 1;
    fetchList();
  });

  // 초기화 버튼
  resetBtn?.addEventListener('click', () => {
    statusFilter.value = '';
    initEndorseDate();
    policyNumFilter.innerHTML = '<option value="">-- 증권 선택 --</option>';
    policyNumFilter.disabled = true;
    companyFilter.innerHTML = '<option value="">-- 대리운전회사 선택 --</option>';
    companyFilter.disabled = true;
    endorseTypeFilter.value = '';
    pageSizeSelect.value = '20';
    currentPage = 1;
    currentLimit = 20;
    
    tableBody.innerHTML = `
      <tr>
        <td colspan="11" class="text-center py-4">필터를 선택하고 검색 버튼을 클릭하세요.</td>
      </tr>
    `;
    mobileCards.innerHTML = `<div class="text-center py-4">필터를 선택하고 검색 버튼을 클릭하세요.</div>`;
    paginationInfo.textContent = '';
    paginationControls.innerHTML = '';
    updateStats({ subscription: 0, cancellation: 0, total: 0 });
  });

  // 페이지 크기 변경
  pageSizeSelect?.addEventListener('change', () => {
    currentPage = 1;
    currentLimit = parseInt(pageSizeSelect.value);
    fetchList();
  });

  // 초기화
  initEndorseDate();
})();


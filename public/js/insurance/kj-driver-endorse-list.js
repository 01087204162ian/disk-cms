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
  const policyNumFilter = document.getElementById('policyNumFilter');
  const companyFilter = document.getElementById('companyFilter');
  const pageSizeSelect = document.getElementById('pageSize');

  // 통계 정보
  const statsSubscription = document.getElementById('statsSubscription');
  const statsCancellation = document.getElementById('statsCancellation');
  const statsTotal = document.getElementById('statsTotal');

  // 상태 변수
  let currentPage = 1;
  let currentLimit = 20;
  let currentPagination = { page: 1, limit: 20, total: 0, totalPages: 1 };

  // ==================== 초기화 ====================

  // 증권번호 목록 로드 (초기 로드)
  const loadPolicyNumList = async () => {
    try {
      policyNumFilter.disabled = true;
      policyNumFilter.innerHTML = '<option value="">로딩 중...</option>';

      // API 호출: 증권번호 목록 조회
      const response = await fetch(`/api/insurance/kj-endorse/policy-list`);
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
    } catch (error) {
      console.error('증권번호 목록 로드 오류:', error);
      policyNumFilter.innerHTML = '<option value="">-- 오류 발생 --</option>';
      policyNumFilter.disabled = true;
    }
  };

  // 증권번호 선택 시 대리운전회사 목록 로드
  const loadCompanyList = async () => {
    const policyNum = policyNumFilter.value;

    if (!policyNum) {
      companyFilter.innerHTML = '<option value="">-- 대리운전회사 선택 --</option>';
      companyFilter.disabled = true;
      return;
    }

    try {
      companyFilter.disabled = true;
      companyFilter.innerHTML = '<option value="">로딩 중...</option>';

      // API 호출: 증권번호로 대리운전회사 목록 조회
      const response = await fetch(`/api/insurance/kj-endorse/company-list?policyNum=${policyNum}`);
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
    const policyNum = policyNumFilter.value || '';
    const companyNum = companyFilter.value || '';

    // 로딩 상태 표시
    tableBody.innerHTML = `
      <tr>
        <td colspan="19" class="text-center py-4">
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
    if (policyNum) params.append('policyNum', policyNum);
    if (companyNum) params.append('companyNum', companyNum);

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
          <td colspan="19" class="text-center text-danger py-4">오류가 발생했습니다: ${err.message}</td>
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
          <td colspan="19" class="text-center py-4">조회된 데이터가 없습니다.</td>
        </tr>
      `;
      return;
    }

    let html = '';
    const startNum = (pagination.page - 1) * pagination.limit + 1;

    rows.forEach((row, index) => {
      const rowNum = startNum + index;
      const push = parseInt(row.push) || 0;
      const sangtae = parseInt(row.progressStep) || 0;
      const cancel = parseInt(row.cancel) || 0;
      
      // 상태 판단: push=4 → 청약 / push=2 → 해지
      const statusText = push == 4 ? '청약' : (push == 2 ? '해지' : '');
      const statusClass = push == 4 ? 'text-primary' : (push == 2 ? 'text-danger' : '');
      
      // 보험사 표시 (공통 모듈 사용)
      const insuranceComCode = parseInt(row.insuranceCom) || 0;
      const insuranceComName = window.KJConstants ? window.KJConstants.getInsurerName(insuranceComCode) : (row.insuranceCom || '');
      
      // 증권성격 표시 (공통 모듈 사용)
      const certiTypeCode = parseInt(row.certiType) || 0;
      const certiTypeName = window.KJConstants ? window.KJConstants.getGitaName(certiTypeCode) : (row.certiType || '');
      
      // 배서처리 상태 select 생성 (sangtae: 1=미처리, 2=처리)
      const currentSangtae = sangtae || 1;
      const statusSelect = `
        <select class="form-select form-select-sm endorse-status-select" 
                data-num="${row.num}" 
                data-current-sangtae="${currentSangtae}">
          <option value="1" ${currentSangtae == 1 ? 'selected' : ''}>미처리</option>
          <option value="2" ${currentSangtae == 2 ? 'selected' : ''}>처리</option>
        </select>
      `;

      html += `
        <tr>
          <td class="text-center">${rowNum}</td>
          <td>${row.damdanja || row.manager || ''}</td>
          <td>${row.companyName || ''}</td>
          <td>${row.name || ''}</td>
          <td>${row.jumin || ''}</td>
          <td>${row.phone || ''}</td>
          <td>${row.progressStep || ''}</td>
          <td>${row.manager || ''}</td>
          <td>${row.standardDate || ''}</td>
          <td>${row.applicationDate || ''}</td>
          <td>${row.policyNum || ''}</td>
          <td>${certiTypeName}</td>
          <td>${row.rate || ''}</td>
          <td class="${statusClass}">${statusText}</td>
          <td>${statusSelect}</td>
          <td>${insuranceComName}</td>
          <td>${row.premium || ''}</td>
          <td>${row.cPremium || ''}</td>
          <td>${row.duplicate || ''}</td>
        </tr>
      `;
    });

    tableBody.innerHTML = html;
    
    // 배서처리 상태 select 박스 change 이벤트 리스너 추가
    const statusSelects = tableBody.querySelectorAll('select.endorse-status-select');
    statusSelects.forEach(select => {
      select.addEventListener('change', async (e) => {
        const num = e.target.getAttribute('data-num');
        const newSangtae = parseInt(e.target.value);
        const currentSangtae = parseInt(e.target.getAttribute('data-current-sangtae'));
        
        // 값이 변경되지 않았으면 무시
        if (newSangtae === currentSangtae) {
          return;
        }
        
        // 로딩 상태 표시
        const originalValue = e.target.value;
        e.target.disabled = true;
        
        try {
          await updateEndorseStatus(num, newSangtae);
          // 성공 시 현재 값 업데이트
          e.target.setAttribute('data-current-sangtae', newSangtae);
          // 리스트 새로고침
          fetchList();
        } catch (error) {
          console.error('배서처리 상태 업데이트 오류:', error);
          alert('배서처리 상태 업데이트에 실패했습니다: ' + (error.message || '알 수 없는 오류'));
          // 실패 시 원래 값으로 복원
          e.target.value = currentSangtae;
          e.target.disabled = false;
        }
      });
    });
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
              ${row.name || ''}
              <span class="${statusClass} ms-2">${statusText}</span>
            </h6>
            <p class="card-text small mb-1">
              <strong>증권번호:</strong> ${row.policyNum || ''}<br>
              <strong>배서번호:</strong> ${row.endorseNum || ''}<br>
              <strong>보험사:</strong> ${row.insuranceCom || ''}<br>
              <strong>배서일자:</strong> ${row.standardDate || ''}<br>
              <strong>대리운전회사:</strong> ${row.companyName || ''}<br>
              <strong>작성자:</strong> ${row.manager || ''}
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

  // ==================== 배서처리 상태 업데이트 ====================
  
  const updateEndorseStatus = async (num, sangtae) => {
    try {
      const response = await fetch('/api/insurance/kj-endorse/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          num: num,
          sangtae: sangtae
        })
      });
      
      const json = await response.json();
      
      if (!json.success) {
        throw new Error(json.error || '상태 업데이트 실패');
      }
      
      return json;
    } catch (error) {
      console.error('배서처리 상태 업데이트 API 오류:', error);
      throw error;
    }
  };

  // ==================== 이벤트 바인딩 ====================

  // 상태 필터 변경 시 자동 검색
  statusFilter?.addEventListener('change', () => {
    currentPage = 1;
    fetchList();
  });

  // 증권번호 변경 시 대리운전회사 목록 로드 및 자동 검색
  policyNumFilter?.addEventListener('change', () => {
    // 대리운전회사 초기화
    companyFilter.innerHTML = '<option value="">-- 대리운전회사 선택 --</option>';
    companyFilter.disabled = true;
    
    if (policyNumFilter.value) {
      loadCompanyList();
    }
    
    currentPage = 1;
    fetchList();
  });

  // 대리운전회사 변경 시 자동 검색
  companyFilter?.addEventListener('change', () => {
    currentPage = 1;
    fetchList();
  });

  // 페이지 크기 변경
  pageSizeSelect?.addEventListener('change', () => {
    currentPage = 1;
    currentLimit = parseInt(pageSizeSelect.value);
    fetchList();
  });

  // 초기화: 증권번호 목록 로드
  loadPolicyNumList();
})();


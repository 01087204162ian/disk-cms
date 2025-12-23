// KJ 대리운전 업체 목록 - 프론트 스크립트
// API: GET /api/insurance/kj-company/list?page=&limit=&getDay=&damdanja=&s_contents=

document.addEventListener('DOMContentLoaded', () => {
  const tableBody = document.getElementById('driver_company_table_body');
  const mobileCards = document.getElementById('driver_company_mobile_cards');
  const paginationInfo = document.getElementById('pagination_info');
  const paginationControls = document.getElementById('pagination_controls');

  const dateFilter = document.getElementById('dateFilter');
  const managerFilter = document.getElementById('managerFilter');
  const pageSizeSelect = document.getElementById('pageSize');
  const searchInput = document.getElementById('search_word');
  const searchBtn = document.getElementById('search_btn');

  let currentPage = 1;
  let currentLimit = 20;
  let currentPagination = { page: 1, limit: 20, total: 0, totalPages: 1 };

  // ==================== 초기화 ====================

  // 날짜 필터 초기화 (1-31일, 오늘 날짜 기본값)
  const initDateFilter = () => {
    const today = new Date();
    const todayDay = today.getDate();
    
    dateFilter.innerHTML = '';
    for (let i = 1; i <= 31; i++) {
      const option = document.createElement('option');
      option.value = String(i).padStart(2, '0'); // '01', '02', ..., '31'
      option.textContent = `${i}일`;
      if (i === todayDay) {
        option.selected = true;
      }
      dateFilter.appendChild(option);
    }
  };

  // 담당자 필터 초기화 (API에서 로드)
  const initManagerFilter = async () => {
    try {
      const res = await fetch('/api/insurance/kj-company/managers');
      const json = await res.json();
      
      if (json.success && json.data) {
        managerFilter.innerHTML = '<option value="">전체</option>';
        json.data.forEach(manager => {
          const option = document.createElement('option');
          option.value = String(manager.num);
          option.textContent = manager.name || `담당자 ${manager.num}`;
          managerFilter.appendChild(option);
        });
      }
    } catch (err) {
      console.error('담당자 목록 로드 실패:', err);
      // 실패해도 계속 진행
    }
  };

  // ==================== 렌더링 함수 ====================

  const renderTable = (rows, pagination) => {
    if (!rows || rows.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-4">데이터가 없습니다.</td>
        </tr>`;
      return;
    }

    const startIndex = (pagination.page - 1) * pagination.limit;

    tableBody.innerHTML = rows
      .map((row, idx) => {
        const displayIndex = startIndex + idx + 1;
        const companyName = row.company || row.companyName || '';
        const managerName = row.managerName || row.damdanga || '';
        const phone = row.hphone || row.cphone || '';
        const date = row.FirstStartDay || row.date || '';
        const memberCount = row.memberCount || row.mRnum || 0;
        const dNum = row.num;

        return `
          <tr>
            <td class="col-kj-company-number text-center">${displayIndex}</td>
            <td class="col-kj-company-name">
              <a href="#" class="driver-company-link" 
                 data-role="open-company-modal"
                 data-company-num="${row.num}"
                 data-company-name="${companyName}">
                ${companyName}
              </a>
            </td>
            <td class="col-kj-company-manager d-none d-lg-table-cell">${managerName}</td>
            <td class="col-kj-company-phone">${phone}</td>
            <td class="col-kj-company-date">${date}</td>
            <td class="col-kj-company-count text-center">${memberCount}명</td>
            <td class="text-center">
              <button type="button" class="btn btn-outline-primary btn-sm" 
                data-role="open-settlement"
                data-company-num="${dNum}"
                data-company-name="${companyName}">
                정산
              </button>
            </td>
          </tr>
        `;
      })
      .join('');
  };

  const renderMobile = (rows) => {
    if (!rows || rows.length === 0) {
      mobileCards.innerHTML = `<div class="text-center py-4">데이터가 없습니다.</div>`;
      return;
    }

    mobileCards.innerHTML = rows
      .map((row) => {
        const companyName = row.company || row.companyName || '';
        const managerName = row.managerName || row.damdanga || '';
        const phone = row.hphone || row.cphone || '';
        const date = row.FirstStartDay || row.date || '';
        const memberCount = row.memberCount || row.mRnum || 0;
        const dNum = row.num;

        return `
          <div class="card mb-2">
            <div class="card-body">
              <div class="d-flex justify-content-between mb-2">
                <div>
                  <strong>
                    <a href="#" class="text-primary driver-company-link" 
                       data-role="open-company-modal"
                       data-company-num="${row.num}"
                       data-company-name="${companyName}">
                      ${companyName}
                    </a>
                  </strong>
                </div>
                <div class="text-muted">${memberCount}명</div>
              </div>
              <div class="small text-muted mb-1">담당자: ${managerName}</div>
              <div class="small mb-1">연락처: ${phone}</div>
              <div class="text-muted small">날짜: ${date}</div>
              <div class="mt-2">
                <button type="button" class="btn btn-outline-primary btn-sm" 
                  data-role="open-settlement"
                  data-company-num="${dNum}"
                  data-company-name="${companyName}">
                  정산
                </button>
              </div>
            </div>
          </div>
        `;
      })
      .join('');
  };

  const renderPagination = (page, totalPages, total) => {
    paginationInfo.textContent = `총 ${total}건 / ${page}/${totalPages} 페이지`;
    paginationControls.innerHTML = '';

    const createPageItem = (p, label = p, disabled = false, active = false) => {
      const li = document.createElement('li');
      li.className = `page-item ${disabled ? 'disabled' : ''} ${active ? 'active' : ''}`;
      const a = document.createElement('a');
      a.className = 'page-link';
      a.href = '#';
      a.textContent = label;
      a.addEventListener('click', (e) => {
        e.preventDefault();
        if (!disabled && !active) {
          currentPage = p;
          fetchList();
        }
      });
      li.appendChild(a);
      return li;
    };

    paginationControls.appendChild(createPageItem(Math.max(1, page - 1), '‹', page === 1));

    for (let p = 1; p <= totalPages; p++) {
      paginationControls.appendChild(createPageItem(p, p, false, p === page));
    }

    paginationControls.appendChild(
      createPageItem(Math.min(totalPages, page + 1), '›', page === totalPages || totalPages === 0)
    );
  };

  // ==================== API 호출 ====================

  const fetchList = async () => {
    const getDay = dateFilter.value || '';
    const damdanja = managerFilter.value || '';
    const s_contents = searchInput.value.trim() || '';

    const params = new URLSearchParams({
      page: currentPage,
      limit: currentLimit,
    });

    if (getDay) params.append('getDay', getDay);
    if (damdanja) params.append('damdanja', damdanja);
    if (s_contents) params.append('s_contents', s_contents);

    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-4">데이터를 불러오는 중...</td>
      </tr>`;
    mobileCards.innerHTML = `<div class="text-center py-4">데이터를 불러오는 중...</div>`;

    try {
      const res = await fetch(`/api/insurance/kj-company/list?${params.toString()}`);
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || 'API 오류');
      }

      const rows = json.data || [];
      currentPagination = json.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 };
      
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
          <td colspan="7" class="text-center text-danger py-4">오류가 발생했습니다.</td>
        </tr>`;
      mobileCards.innerHTML = `<div class="text-center text-danger py-4">오류가 발생했습니다.</div>`;
      paginationInfo.textContent = '';
      paginationControls.innerHTML = '';
    }
  };

  // ==================== 정산 모달 ====================
  const settlementModalEl = document.getElementById('settlementModal');
  const settlementModal = settlementModalEl ? new bootstrap.Modal(settlementModalEl) : null;
  const settlementAdjustmentTableBody = document.getElementById('settlementAdjustmentTableBody');
  const settlementTotalPremium = document.getElementById('settlementTotalPremium');
  const settlementMemoInput = document.getElementById('settlementMemoInput');
  const settlementMemoTableBody = document.getElementById('settlementMemoTableBody');
  const settleStartInput = document.getElementById('settleStartDate');
  const settleEndInput = document.getElementById('settleEndDate');
  let currentSettlement = { dNum: null, companyName: '', jumin: '' };

  const setDefaultSettlementDates = async () => {
    if (!settleStartInput || !settleEndInput || !currentSettlement.dNum) return;
    try {
      const res = await fetch(`/api/insurance/kj-company/settlement/endorse-day?dNum=${currentSettlement.dNum}`);
      const json = await res.json();
      if (json.success) {
        if (settleStartInput) settleStartInput.value = json.paymentStartDate;
        if (settleEndInput) settleEndInput.value = json.thisMonthDueDate;
      } else {
        console.error('정산 기간 조회 실패:', json.error);
        // Fallback to default if API fails
        const today = new Date();
        const lastMonth = new Date(today);
        lastMonth.setMonth(today.getMonth() - 1);
        const fmt = (d) => {
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${y}-${m}-${day}`;
        };
        if (settleStartInput) settleStartInput.value = fmt(lastMonth);
        if (settleEndInput) settleEndInput.value = fmt(today);
      }
    } catch (err) {
      console.error('정산 기간 조회 중 오류 발생:', err);
      // Fallback to default if API fails
      const today = new Date();
      const lastMonth = new Date(today);
      lastMonth.setMonth(today.getMonth() - 1);
      const fmt = (d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      };
      if (settleStartInput) settleStartInput.value = fmt(lastMonth);
      if (settleEndInput) settleEndInput.value = fmt(today);
    }
  };

  // 증권번호별 집계 테이블 렌더링
  const renderSettlementAdjustmentTable = (data) => {
    if (!settlementAdjustmentTableBody) return;
    if (!data || data.length === 0) {
      settlementAdjustmentTableBody.innerHTML = `<tr><td colspan="8" class="text-center py-4">데이터가 없습니다.</td></tr>`;
      if (settlementTotalPremium) settlementTotalPremium.textContent = '0원';
      return;
    }

    let totalPremium = 0;
    let body = data
      .map((item) => {
        const diviText = item.divi === '1' ? '10회분납' : item.divi === '2' ? '월납' : '-';
        const monthlyPremium = item.total_AdjustedInsuranceMothlyPremium || 0;
        const companyPremium = item.total_AdjustedInsuranceCompanyPremium || 0;
        const endorseMonthlyPremium = item.eTotalMonthPremium || 0;
        const endorseCompanyPremium = item.eTotalCompanyPremium || 0;
        const conversionPremium = item.Conversion_AdjustedInsuranceCompanyPremium || 0;
        
        const total = monthlyPremium + companyPremium + endorseMonthlyPremium + endorseCompanyPremium;
        totalPremium += total;

        return `
          <tr>
            <td>${item.policyNum || '-'}</td>
            <td>${diviText}</td>
            <td class="text-end">${item.drivers_count || 0}</td>
            <td class="text-end">${monthlyPremium.toLocaleString()}</td>
            <td class="text-end">${companyPremium.toLocaleString()}</td>
            <td class="text-end">${(endorseMonthlyPremium + endorseCompanyPremium).toLocaleString()}</td>
            <td class="text-end">${total.toLocaleString()}</td>
            <td class="text-end">${conversionPremium.toLocaleString()}</td>
          </tr>
        `;
      })
      .join('');

    const summaryRow = `
      <tr class="table-light fw-bold">
        <td colspan="3" class="text-center">합계</td>
        <td class="text-end">${data.reduce((sum, item) => sum + (item.total_AdjustedInsuranceMothlyPremium || 0), 0).toLocaleString()}</td>
        <td class="text-end">${data.reduce((sum, item) => sum + (item.total_AdjustedInsuranceCompanyPremium || 0), 0).toLocaleString()}</td>
        <td class="text-end">${data.reduce((sum, item) => sum + (item.eTotalMonthPremium || 0) + (item.eTotalCompanyPremium || 0), 0).toLocaleString()}</td>
        <td class="text-end">${totalPremium.toLocaleString()}</td>
        <td class="text-end">${data.reduce((sum, item) => sum + (item.Conversion_AdjustedInsuranceCompanyPremium || 0), 0).toLocaleString()}</td>
      </tr>
    `;

    settlementAdjustmentTableBody.innerHTML = body + summaryRow;
    if (settlementTotalPremium) {
      settlementTotalPremium.textContent = `${totalPremium.toLocaleString()}원`;
    }
  };

  // 정산 데이터 로드 (증권번호별 집계)
  const loadSettlementData = async () => {
    if (!settlementAdjustmentTableBody) return;
    if (!currentSettlement.dNum) return;
    const start = settleStartInput?.value || '';
    const end = settleEndInput?.value || '';

    settlementAdjustmentTableBody.innerHTML = `<tr><td colspan="8" class="text-center py-4">데이터를 불러오는 중...</td></tr>`;
    if (settlementTotalPremium) settlementTotalPremium.textContent = '0원';

    try {
      const params = new URLSearchParams({
        dNum: currentSettlement.dNum,
        lastMonthDueDate: start,
        thisMonthDueDate: end,
      });
      const res = await fetch(`/api/insurance/kj-company/settlement/adjustment?${params.toString()}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message || json.error || 'API 오류');
      renderSettlementAdjustmentTable(json.data || []);
    } catch (err) {
      console.error('정산 데이터 조회 실패:', err);
      settlementAdjustmentTableBody.innerHTML = `<tr><td colspan="8" class="text-center text-danger py-4">오류가 발생했습니다: ${err.message}</td></tr>`;
    }
  };

  // 메모 조회
  const loadSettlementMemo = async (jumin) => {
    if (!settlementMemoTableBody || !jumin) return;
    
    try {
      const res = await fetch('/api/insurance/kj-company/settlement/memo-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jumin }),
      });
      const json = await res.json();
      if (json.status === 'error') throw new Error(json.message || 'API 오류');
      
      const memos = json.data || [];
      if (memos.length === 0) {
        settlementMemoTableBody.innerHTML = `<tr><td colspan="5" class="text-center py-4">메모가 없습니다.</td></tr>`;
        return;
      }
      
      const body = memos
        .map((memo, idx) => `
          <tr>
            <td>${idx + 1}</td>
            <td>${memo.wdate || '-'}</td>
            <td>${memo.memokind || '일반'}</td>
            <td>${memo.memo || '-'}</td>
            <td>${memo.userid || '-'}</td>
          </tr>
        `)
        .join('');
      
      settlementMemoTableBody.innerHTML = body;
    } catch (err) {
      console.error('메모 조회 실패:', err);
      settlementMemoTableBody.innerHTML = `<tr><td colspan="5" class="text-center text-danger py-4">오류가 발생했습니다.</td></tr>`;
    }
  };

  // 메모 저장
  const saveSettlementMemo = async () => {
    if (!settlementMemoInput || !currentSettlement.jumin) {
      alert('주민번호 정보가 없습니다.');
      return;
    }
    
    const memo = settlementMemoInput.value.trim();
    if (!memo) {
      alert('메모 내용을 입력해주세요.');
      return;
    }
    
    try {
      const res = await fetch('/api/insurance/kj-company/settlement/memo-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jumin: currentSettlement.jumin,
          memo,
          memokind: '일반',
          userid: (window.SessionManager?.getUserInfo?.().name) || '',
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'API 오류');
      
      settlementMemoInput.value = '';
      await loadSettlementMemo(currentSettlement.jumin);
      alert('메모가 저장되었습니다.');
    } catch (err) {
      console.error('메모 저장 실패:', err);
      alert(`메모 저장 중 오류가 발생했습니다: ${err.message}`);
    }
  };

  const openSettlementModal = async (dNum, companyName) => {
    currentSettlement = { dNum, companyName, jumin: '' };
    await setDefaultSettlementDates();
    if (settlementModalEl) {
      settlementModalEl.querySelector('#settlementModalLabel').textContent = `정산 - ${companyName || ''}`;
    }
    
    // 정산 기간 조회 시 주민번호도 가져오기
    try {
      const res = await fetch(`/api/insurance/kj-company/settlement/endorse-day?dNum=${dNum}`);
      const json = await res.json();
      if (json.success && json.jumin) {
        currentSettlement.jumin = json.jumin;
        await loadSettlementMemo(json.jumin);
      }
    } catch (err) {
      console.error('정산 기간 조회 실패:', err);
    }
    
    await loadSettlementData();
    settlementModal?.show();
  };

  const updateSettlementStatus = async (seqNo, status, customerName) => {
    if (!seqNo) return;
    try {
      const body = {
        seqNo,
        status,
        userName: (window.SessionManager?.getUserInfo?.().name) || '',
      };
      const res = await fetch('/api/insurance/kj-company/settlement/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'API 오류');
      const managerCell = document.getElementById(`settlement-manager-${seqNo}`);
      if (managerCell) managerCell.innerText = body.userName || '';
    } catch (err) {
      console.error('정산 상태 업데이트 실패:', err);
      alert(`${customerName || ''} 정산 상태 업데이트 중 오류가 발생했습니다.`);
      return false;
    }
    return true;
  };

  const downloadSettlementExcel = async () => {
    if (!currentSettlement.dNum) return;
    const start = settleStartInput?.value || '';
    const end = settleEndInput?.value || '';
    try {
      const res = await fetch('/api/insurance/kj-company/settlement/excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dNum: currentSettlement.dNum,
          lastMonthDueDate: start,
          thisMonthDueDate: end,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `정산_${currentSettlement.companyName || 'company'}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('정산 엑셀 다운로드 실패:', err);
      alert('정산 엑셀 다운로드 중 오류가 발생했습니다.');
    }
  };

  // ==================== 이벤트 바인딩 ====================

  // 날짜 필터 변경 시 자동 통신
  dateFilter?.addEventListener('change', () => {
    currentPage = 1;
    fetchList();
  });

  // 담당자 필터 변경 시 자동 통신
  managerFilter?.addEventListener('change', () => {
    currentPage = 1;
    fetchList();
  });

  // 검색 버튼 클릭
  searchBtn?.addEventListener('click', () => {
    currentPage = 1;
    fetchList();
  });

  // 검색 입력 엔터키
  searchInput?.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      currentPage = 1;
      fetchList();
    }
  });

  // 페이지 크기 변경
  pageSizeSelect?.addEventListener('change', () => {
    currentLimit = Number(pageSizeSelect.value);
    currentPage = 1;
    fetchList();
  });

  // 정산 버튼 (테이블/모바일 공용)
  const handleSettlementClick = (target) => {
    const role = target.getAttribute('data-role');
    if (role !== 'open-settlement') return;
    const dNum = target.getAttribute('data-company-num');
    const name = target.getAttribute('data-company-name') || '';
    openSettlementModal(dNum, name);
  };

  tableBody?.addEventListener('click', (e) => {
    const target = e.target.closest('button[data-role="open-settlement"]');
    if (target) {
      e.preventDefault();
      handleSettlementClick(target);
    }
    const link = e.target.closest('a[data-role="open-company-modal"]');
    if (link) {
      e.preventDefault();
      const companyNum = link.getAttribute('data-company-num');
      const companyName = link.getAttribute('data-company-name');
      if (window.KJCompanyModal && window.KJCompanyModal.openCompanyModal) {
        window.KJCompanyModal.openCompanyModal(companyNum, companyName);
      }
    }
  });

  mobileCards?.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-role="open-settlement"]');
    if (btn) {
      e.preventDefault();
      handleSettlementClick(btn);
    }
    const link = e.target.closest('a[data-role="open-company-modal"]');
    if (link) {
      e.preventDefault();
      const companyNum = link.getAttribute('data-company-num');
      const companyName = link.getAttribute('data-company-name');
      if (window.KJCompanyModal && window.KJCompanyModal.openCompanyModal) {
        window.KJCompanyModal.openCompanyModal(companyNum, companyName);
      }
    }
  });

  // 정산 모달 이벤트
  document.getElementById('settleSearchBtn')?.addEventListener('click', () => {
    loadSettlementData();
  });
  document.getElementById('settleExcelBtn')?.addEventListener('click', () => {
    downloadSettlementExcel();
  });
  document.getElementById('settlementMemoSaveBtn')?.addEventListener('click', () => {
    saveSettlementMemo();
  });
  document.getElementById('settleConfirmPremiumBtn')?.addEventListener('click', () => {
    alert('확정보험료 입력 기능은 준비 중입니다.');
  });
  document.getElementById('settleListBtn')?.addEventListener('click', () => {
    alert('정산리스트 기능은 준비 중입니다.');
  });
  
  // 메모 입력 엔터키
  settlementMemoInput?.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      saveSettlementMemo();
    }
  });
  document.getElementById('settlementMemoSaveBtn')?.addEventListener('click', () => {
    saveSettlementMemo();
  });
  document.getElementById('settleConfirmPremiumBtn')?.addEventListener('click', () => {
    alert('확정보험료 입력 기능은 준비 중입니다.');
  });
  document.getElementById('settleListBtn')?.addEventListener('click', () => {
    alert('정산리스트 기능은 준비 중입니다.');
  });
  
  // 메모 입력 엔터키
  settlementMemoInput?.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      saveSettlementMemo();
    }
  });

  // ==================== 모달 관련 ====================
  // 공통 모듈(kj-company-modal.js)을 사용합니다.
  // 모달 열기: window.KJCompanyModal.openCompanyModal(companyNum, companyName, skipShow)

  // 신규 등록 버튼 클릭 이벤트
  const addCompanyBtn = document.getElementById('addCompany');
  if (addCompanyBtn) {
    addCompanyBtn.addEventListener('click', () => {
      // 신규 등록 모달 열기
      if (window.KJCompanyModal && window.KJCompanyModal.openNewCompanyModal) {
        window.KJCompanyModal.openNewCompanyModal();
      } else {
        alert('신규 등록 기능을 준비 중입니다.');
      }
    });
  }

  // ==================== 초기화 실행 ====================

  // 페이지 로드 시 초기화
  (async () => {
    initDateFilter();
    await initManagerFilter();
    
    // 초기 상태: 날짜가 선택되어 있으면 자동 조회
    if (dateFilter.value) {
      fetchList();
    } else {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-4">날짜를 선택해 주세요.</td>
        </tr>`;
      mobileCards.innerHTML = `<div class="text-center py-4">날짜를 선택해 주세요.</div>`;
    }
  })();
});


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
  const statusFilter = document.getElementById('statusFilter');

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
    const currentInwon = statusFilter.value || '1'; // 기본값: 정상

    const params = new URLSearchParams({
      page: currentPage,
      limit: currentLimit,
    });

    if (getDay) params.append('getDay', getDay);
    if (damdanja) params.append('damdanja', damdanja);
    if (s_contents) params.append('s_contents', s_contents);
    if (currentInwon) params.append('currentInwon', currentInwon);

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
        const payment10Premium = item.payment10_premium || 0; // 1/10 보험료 (연간 보험료 / 10)
        const endorseMonthlyPremium = item.eTotalMonthPremium || 0;
        const endorseCompanyPremium = item.eTotalCompanyPremium || 0;
        const conversionPremium = item.Conversion_AdjustedInsuranceCompanyPremium || 0;
        const divi = item.divi || '';
        const nab = item.nab || 1;
        
        // 배서보험료 계산: 납부방식에 따라 다르게 계산
        // 월납(divi=2): 배서 월보험료만 사용
        // 10회분납(divi=1): 배서 회사보험료만 사용
        let endorsePremium = 0;
        if (divi === '2') {
          // 월납인 경우: preminum만 사용
          endorsePremium = endorseMonthlyPremium;
        } else {
          // 10회분납인 경우: c_preminum만 사용
          endorsePremium = endorseCompanyPremium;
        }
        
        // 계 계산: 납부방식에 따라 다르게 계산
        let total = 0;
        if (divi === '2') {
          // 월납인 경우: 계 = 월보험료 + 배서보험료
          total = monthlyPremium + endorsePremium;
        } else {
          // 정상납(divi=1)인 경우: nab 값에 따라 계산
          if (nab === 1) {
            // nab=1: 계 = 1/10 보험료*2 + 배서보험료
            total = payment10Premium * 2 + endorsePremium;
          } else if (nab >= 2 && nab <= 8) {
            // nab=2~8: 계 = 1/10 보험료 + 배서보험료
            total = payment10Premium + endorsePremium;
          } else if (nab >= 9 && nab <= 10) {
            // nab=9~10: 계 = 1/10 보험료*0.5 + 배서보험료
            total = payment10Premium * 0.5 + endorsePremium;
          } else {
            // 기본값: 계 = 1/10 보험료 + 배서보험료
            total = payment10Premium + endorsePremium;
          }
        }
        totalPremium += total;

        // 10회 분납(divi=1)인 경우 환산보험료 표시하지 않음
        const conversionPremiumDisplay = divi === '1' ? '-' : conversionPremium.toLocaleString();
        
        return `
          <tr>
            <td>${item.policyNum || '-'}</td>
            <td>${diviText}</td>
            <td class="text-end">${item.drivers_count || 0}</td>
            <td class="text-end" style="width: 12%;">${monthlyPremium.toLocaleString()}</td>
            <td class="text-end" style="width: 12%;">${payment10Premium.toLocaleString()}</td>
            <td class="text-end" style="width: 12%;">${endorsePremium.toLocaleString()}</td>
            <td class="text-end" style="width: 12%;">${total.toLocaleString()}</td>
            <td class="text-end" style="width: 12%;">${conversionPremiumDisplay}</td>
          </tr>
        `;
      })
      .join('');

    // 합계 계산
    const totalDrivers = data.reduce((sum, item) => sum + (item.drivers_count || 0), 0);
    const totalMonthlyPremium = data.reduce((sum, item) => sum + (item.total_AdjustedInsuranceMothlyPremium || 0), 0);
    const totalPayment10Premium = data.reduce((sum, item) => sum + (item.payment10_premium || 0), 0);
    // 배서보험료 합계 계산: 납부방식에 따라 다르게 계산
    const totalEndorsePremium = data.reduce((sum, item) => {
      const divi = item.divi || '';
      if (divi === '2') {
        // 월납: 배서 월보험료만 합산
        return sum + (item.eTotalMonthPremium || 0);
      } else {
        // 10회분납: 배서 회사보험료만 합산
        return sum + (item.eTotalCompanyPremium || 0);
      }
    }, 0);
    const totalConversionPremium = data.reduce((sum, item) => {
      // 10회 분납인 경우 제외
      if (item.divi === '1') return sum;
      return sum + (item.Conversion_AdjustedInsuranceCompanyPremium || 0);
    }, 0);
    
    const summaryRow = `
      <tr class="table-light fw-bold">
        <td colspan="2" class="text-center">합계</td>
        <td class="text-end">${totalDrivers.toLocaleString()}</td>
        <td class="text-end" style="width: 12%;">${totalMonthlyPremium.toLocaleString()}</td>
        <td class="text-end" style="width: 12%;">${totalPayment10Premium.toLocaleString()}</td>
        <td class="text-end" style="width: 12%;">${totalEndorsePremium.toLocaleString()}</td>
        <td class="text-end" style="width: 12%;">${totalPremium.toLocaleString()}</td>
        <td class="text-end" style="width: 12%;">${totalConversionPremium > 0 ? totalConversionPremium.toLocaleString() : '-'}</td>
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
    
    // 초기에는 증권번호별 집계 테이블만 표시
    const settlementAdjustmentSection = document.getElementById('settlementAdjustmentSection');
    if (settlementAdjustmentSection) settlementAdjustmentSection.style.display = 'block';
    
    await loadSettlementData();
    
    // 정산 모달 위치 조정 (우측에 배치)
    if (settlementModalEl) {
      const modalDialog = settlementModalEl.querySelector('.modal-dialog');
      if (modalDialog) {
        modalDialog.style.position = 'fixed';
        modalDialog.style.right = '1%';
        modalDialog.style.top = '50%';
        modalDialog.style.transform = 'translateY(-50%)';
        modalDialog.style.margin = '0';
        modalDialog.style.maxWidth = '48%';
        modalDialog.style.zIndex = '1055';
      }
    }
    
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

  // 상태 필터 변경 시 자동 통신
  statusFilter?.addEventListener('change', () => {
    currentPage = 1;
    fetchList();
  });

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

  // 배서리스트 조회 함수 (새 모달에 표시)
  const loadSettlementList = async () => {
    if (!currentSettlement.dNum) return;
    const start = settleStartInput?.value || '';
    const end = settleEndInput?.value || '';
    
    const settlementListModalTableBody = document.getElementById('settlementListModalTableBody');
    const settlementListModal = document.getElementById('settlementListModal');
    
    if (!settlementListModalTableBody || !settlementListModal) return;
    
    settlementListModalTableBody.innerHTML = `<tr><td colspan="10" class="text-center py-4">데이터를 불러오는 중...</td></tr>`;
    
    // 배서리스트 모달 열기 (기존 정산 모달과 함께 표시)
    const listModal = new bootstrap.Modal(settlementListModal, {
      backdrop: false,
      keyboard: true
    });
    listModal.show();
    
    // 모달 위치 조정 (좌측에 배치)
    const modalDialog = settlementListModal.querySelector('.modal-dialog');
    if (modalDialog) {
      modalDialog.style.position = 'fixed';
      modalDialog.style.left = '1%';
      modalDialog.style.top = '50%';
      modalDialog.style.transform = 'translateY(-50%)';
      modalDialog.style.margin = '0';
      modalDialog.style.maxWidth = '48%';
      modalDialog.style.zIndex = '1056';
    }
    
    try {
      const params = new URLSearchParams({
        dNum: currentSettlement.dNum,
        lastMonthDueDate: start,
        thisMonthDueDate: end,
      });
      const res = await fetch(`/api/insurance/kj-company/settlement/monthly?${params.toString()}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message || json.error || 'API 오류');
      
      const smsData = json.smsData || [];
      if (smsData.length === 0) {
        settlementListModalTableBody.innerHTML = `<tr><td colspan="10" class="text-center py-4">데이터가 없습니다.</td></tr>`;
        return;
      }
      
      let totalMonthlyPremium = 0;
      let totalCPremium = 0;
      
      const body = smsData
        .map((item, idx) => {
          // push 값이 숫자 또는 문자열로 올 수 있으므로 숫자로 변환
          const push = parseInt(item.push) || 0;
          const divi = String(item.divi || '');
          const monthlyPremium = parseFloat(item.preminum || 0);
          const cPremium = parseFloat(item.c_preminum || 0);
          
          // 주민번호 마스킹
          const jumin = item.Jumin || '';
          const maskedJumin = jumin.length >= 7 ? jumin.substring(0, 7) + '-******' : jumin;
          
          // 처리 상태
          const getStatus = item.get || '';
          
          // 배서종류 표시
          let endorseTypeText = '-';
          if (push === 2) {
            endorseTypeText = '해지';
          } else if (push === 4 || push === 1) {
            endorseTypeText = '청약';
          }
          
          // 보험료 표시: 납부방식에 따라 다르게 표시
          // 월납(divi=2): 월보험료만 표시
          // 10회분납(divi=1): 1/10 보험료만 표시
          // 부호: push=2(해지)는 음수(-), push=4(청약)는 양수(+)
          let monthlyPremiumDisplay = '-';
          let cPremiumDisplay = '-';
          let premiumValue = 0;
          
          if (divi === '2') {
            // 월납인 경우: 월보험료만 표시
            if (monthlyPremium > 0) {
              premiumValue = push === 2 ? -monthlyPremium : monthlyPremium;
              monthlyPremiumDisplay = (push === 2 ? '-' : '+') + monthlyPremium.toLocaleString();
              totalMonthlyPremium += premiumValue;
            }
          } else {
            // 10회분납인 경우: 1/10 보험료만 표시
            if (cPremium > 0) {
              premiumValue = push === 2 ? -cPremium : cPremium;
              cPremiumDisplay = (push === 2 ? '-' : '+') + cPremium.toLocaleString();
              totalCPremium += premiumValue;
            }
          }
          
          return `
            <tr>
              <td class="text-center">${idx + 1}</td>
              <td>${item.Name || '-'}</td>
              <td>${maskedJumin}</td>
              <td>${item.dongbuCerti || '-'}</td>
              <td>${item.endorse_day || '-'}</td>
              <td class="text-end">${monthlyPremiumDisplay}</td>
              <td class="text-end">${cPremiumDisplay}</td>
              <td>${endorseTypeText}</td>
              <td>
                <select class="form-select form-select-sm" data-seq-no="${item.SeqNo}" onchange="updateSettlementStatusFromList(this)">
                  <option value="2" ${getStatus === '2' ? 'selected' : ''}>미정산</option>
                  <option value="1" ${getStatus === '1' ? 'selected' : ''}>정산완료</option>
                </select>
              </td>
              <td>${item.manager || '-'}</td>
            </tr>
          `;
        })
        .join('');
      
      // 합계 행 계산
      const totalPremium = totalMonthlyPremium + totalCPremium;
      const totalRow = `
        <tr class="table-light fw-bold">
          <td colspan="5" class="text-center">합계</td>
          <td class="text-end">${totalMonthlyPremium !== 0 ? (totalMonthlyPremium > 0 ? '+' : '') + totalMonthlyPremium.toLocaleString() : '-'}</td>
          <td class="text-end">${totalCPremium !== 0 ? (totalCPremium > 0 ? '+' : '') + totalCPremium.toLocaleString() : '-'}</td>
          <td colspan="2" class="text-center">계</td>
          <td class="text-end">${totalPremium !== 0 ? (totalPremium > 0 ? '+' : '') + totalPremium.toLocaleString() : '-'}</td>
        </tr>
      `;
      
      settlementListModalTableBody.innerHTML = body + totalRow;
    } catch (err) {
      console.error('배서리스트 조회 실패:', err);
      settlementListModalTableBody.innerHTML = `<tr><td colspan="10" class="text-center text-danger py-4">오류가 발생했습니다: ${err.message}</td></tr>`;
    }
  };
  
  // 배서리스트에서 정산 상태 업데이트
  window.updateSettlementStatusFromList = async function(selectElement) {
    const seqNo = selectElement.getAttribute('data-seq-no');
    const status = selectElement.value;
    const row = selectElement.closest('tr');
    const name = row.querySelector('td:nth-child(2)')?.textContent || '';
    
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
      
      // 처리자 업데이트
      const managerCell = row.querySelector('td:last-child');
      if (managerCell) managerCell.textContent = body.userName || '-';
    } catch (err) {
      console.error('정산 상태 업데이트 실패:', err);
      alert(`${name || ''} 정산 상태 업데이트 중 오류가 발생했습니다.`);
      // 원래 값으로 복원
      selectElement.value = status === '1' ? '2' : '1';
    }
  };

  // 정산 모달 이벤트
  document.getElementById('settleSearchBtn')?.addEventListener('click', () => {
    loadSettlementList();
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


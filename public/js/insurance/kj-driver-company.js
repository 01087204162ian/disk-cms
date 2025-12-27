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
    
    // SheetJS 로드 확인
    if (typeof XLSX === 'undefined') {
      alert('엑셀 라이브러리가 로드되지 않았습니다.\n페이지를 새로고침 해주세요.');
      return;
    }
    
    const start = settleStartInput?.value || '';
    const end = settleEndInput?.value || '';
    
    if (!start || !end) {
      alert('시작일과 종료일을 선택해주세요.');
      return;
    }
    
    try {
      // 로딩 표시
      const btn = document.getElementById('settleExcelBtn');
      const originalHTML = btn ? btn.innerHTML : '';
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>생성 중...';
      }
      
      // API 호출 (JSON 데이터)
      const res = await fetch('/api/insurance/kj-company/settlement/excel-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dNum: currentSettlement.dNum,
          lastMonthDueDate: start,
          thisMonthDueDate: end,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const result = await res.json();
      
      if (!result.success) {
        throw new Error(result.error || '데이터 조회 실패');
      }
      
      // 엑셀 생성 및 다운로드
      generateSettlementExcel(result.data);
      
      // 성공 메시지
      setTimeout(() => {
        alert(`엑셀 파일이 다운로드되었습니다.\n\n회원: ${result.data.members.length}건\n배서: ${result.data.endorsements.length}건`);
      }, 500);
      
    } catch (err) {
      console.error('정산 엑셀 다운로드 실패:', err);
      alert(`정산 엑셀 다운로드 중 오류가 발생했습니다.\n\n${err.message}`);
    } finally {
      // 버튼 복원
      const btn = document.getElementById('settleExcelBtn');
      if (btn) {
        setTimeout(() => {
          btn.disabled = false;
          btn.innerHTML = '<i class="fas fa-file-excel me-1"></i>엑셀 다운로드';
        }, 1000);
      }
    }
  };
  
  // 정산 엑셀 파일 생성 (SheetJS)
  const generateSettlementExcel = (data) => {
    const wb = XLSX.utils.book_new();
    
    // ===== 단일 시트에 회원리스트와 배서리스트 모두 포함 =====
    const wsData = [];
    
    // 제목 영역
    wsData.push([`${data.companyName || ''} 회원리스트`]);
    wsData.push([`다운로드 일시: ${new Date().toLocaleString('ko-KR')}`]);
    wsData.push([]);
    
    // 회원리스트 헤더
    wsData.push([
      '구분', '성명', '주민번호', '나이', '보험회사', '증권번호', '탁/일', '기타',
      '보험료', '보험회사에 내는 월보험료', '담당자', '정상납 보험료', '단체구분', '사고유무', '사고유무'
    ]);
    
    const headerRowIndex = wsData.length - 1; // 헤더 행 인덱스 (0-based)
    
    // 회원 데이터 행
    let j = 1;
    data.members.forEach((row) => {
      const InsuranceCompany = window.KJConstants?.getInsurerName(row.InsuranceCompany) || '';
      const etag = window.KJConstants?.getEtagName(row.etag) || '';
      
      const monthlyPremium = (row.divi == 2) ? row.AdjustedInsuranceMothlyPremium : 0;
      const companyPremium = (row.divi == 2) ? row.ConversionPremium : 0;
      const adjustedPremium = (row.divi != 2) ? row.AdjustedInsuranceCompanyPremium : 0;
      
      wsData.push([
        j++,
        row.Name || '',
        row.Jumin || '',
        row.nai || '',
        InsuranceCompany,
        row.dongbuCerti || '',
        etag,
        row.gita || '',
        monthlyPremium || '-',
        companyPremium || '-',
        '', // 담당자
        adjustedPremium || '-',
        row.dongbuCerti || '',
        row.discountRate || '',
        row.discountRateName || ''
      ]);
    });
    
    const memberDataEndRow = wsData.length - 1; // 회원 데이터 마지막 행
    
    // 회원리스트 합계 행 (빈 행 제거)
    const memberSummaryRowIndex = wsData.length;
    wsData.push([
      '합계', '', '', '', '', '', '', '',
      data.summary.sum_monthlyPremium || 0,
      data.summary.sum_companyPremium || 0,
      '',
      data.summary.sum_adjustedPremium || 0,
      '', '', ''
    ]);
    
    // ===== 배서리스트 (하단에 추가) =====
    let endorseHeaderRowIndex = null;
    let endorseDataEndRow = null;
    let endorseSummaryRowIndex = null;
    let finalSummaryRowIndex = null;
    
    if (data.endorsements && data.endorsements.length > 0) {
      wsData.push([]);
      wsData.push([`배서리스트`]);
      wsData.push([]);
      
      // 배서리스트 헤더
      endorseHeaderRowIndex = wsData.length;
      wsData.push([
        '구분', '배서일', '성명', '나이', '보험회사', '증권번호', '일/탁', '배서종류',
        '배서보험료', '증권성격', '', '정상납보험료', '입금할 보험료'
      ]);
      
      // 배서 데이터 행
      let j_ = 1;
      data.endorsements.forEach((erow) => {
        const inName = window.KJConstants?.getInsurerName(erow.InsuranceCompany) || '';
        const metat = window.KJConstants?.getEtagName(erow.etag) || '';
        
        const monthlyPremium = (erow.divi == 2) ? erow.preminum : 0;
        const adjustedPremium = (erow.divi != 2) ? erow.c_preminum : 0;
        
        wsData.push([
          j_++,
          erow.endorse_day || '',
          erow.Name || '',
          erow.nai || '',
          inName,
          erow.dongbuCerti || '',
          metat,
          erow.pushName || '',
          monthlyPremium || 0,
          erow.gita || '',
          '',
          adjustedPremium || 0,
          ''
        ]);
      });
      
      endorseDataEndRow = wsData.length - 1;
      
      // 배서 합계 행 (빈 행 제거)
      endorseSummaryRowIndex = wsData.length;
      wsData.push([
        '배서 보험료 소계', '', '', '', '', '', '', '',
        data.summary.sum_En_monthlyPremium || 0,
        '', '',
        data.summary.sum_En_adjustedPremium || 0,
        ''
      ]);
      
      // 최종 합계 행
      finalSummaryRowIndex = wsData.length;
      wsData.push([
        '입금 하실 보험료=월 보험료 소계+배서 보험료 소계', '', '', '', '', '', '', '',
        (data.summary.sum_monthlyPremium || 0) + (data.summary.sum_En_monthlyPremium || 0),
        '', '',
        (data.summary.sum_adjustedPremium || 0) + (data.summary.sum_En_adjustedPremium || 0),
        ''
      ]);
    }
    
    // 시트 생성
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // ===== 컬럼 너비 설정 =====
    ws['!cols'] = [
      { wch: 6 },   // 구분
      { wch: 10 },  // 성명
      { wch: 15 },  // 주민번호
      { wch: 6 },   // 나이
      { wch: 10 },  // 보험회사
      { wch: 15 },  // 증권번호
      { wch: 8 },   // 탁/일
      { wch: 10 },  // 기타
      { wch: 12 },  // 보험료
      { wch: 20 },  // 보험회사에 내는 월보험료
      { wch: 10 },  // 담당자
      { wch: 15 },  // 정상납 보험료
      { wch: 15 },  // 단체구분
      { wch: 10 },  // 사고유무
      { wch: 20 }   // 사고유무명
    ];
    
    // ===== 셀 병합 =====
    const merges = [];
    
    // 제목 병합 (A1:O1) - 15개 컬럼
    merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 14 } });
    
    // 다운로드 일시 병합 (A2:O2)
    merges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: 14 } });
    
    // 회원리스트 합계 행 병합 (A행: H행까지 병합)
    merges.push({ s: { r: memberSummaryRowIndex, c: 0 }, e: { r: memberSummaryRowIndex, c: 7 } });
    
    // 배서리스트 제목 병합 (있는 경우)
    if (endorseHeaderRowIndex !== null) {
      const endorseTitleRow = endorseHeaderRowIndex - 2; // 배서리스트 제목 행
      merges.push({ s: { r: endorseTitleRow, c: 0 }, e: { r: endorseTitleRow, c: 14 } });
    }
    
    // 배서 합계 행 병합 (있는 경우)
    if (endorseSummaryRowIndex !== null) {
      merges.push({ s: { r: endorseSummaryRowIndex, c: 0 }, e: { r: endorseSummaryRowIndex, c: 7 } });
    }
    
    // 최종 합계 행 병합 (있는 경우)
    if (finalSummaryRowIndex !== null) {
      merges.push({ s: { r: finalSummaryRowIndex, c: 0 }, e: { r: finalSummaryRowIndex, c: 7 } });
    }
    
    ws['!merges'] = merges;
    
    // ===== 셀 스타일 적용 =====
    // 제목 셀 (A1)
    if (ws['A1']) {
      ws['A1'].s = {
        font: { bold: true, sz: 14 },
        alignment: { horizontal: 'center', vertical: 'center' }
      };
    }
    
    // 다운로드 일시 (A2)
    if (ws['A2']) {
      ws['A2'].s = {
        alignment: { horizontal: 'center' }
      };
    }
    
    // 회원리스트 헤더 행 스타일 (4번째 행, 0-based index 3)
    const memberHeaderCols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'];
    memberHeaderCols.forEach(col => {
      const cellRef = `${col}${headerRowIndex + 1}`;
      if (ws[cellRef]) {
        ws[cellRef].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: 'E6E6E6' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: { style: 'medium', color: { rgb: '000000' } },
            bottom: { style: 'medium', color: { rgb: '000000' } },
            left: { style: 'medium', color: { rgb: '000000' } },
            right: { style: 'medium', color: { rgb: '000000' } }
          }
        };
      }
    });
    
    // 회원 데이터 행에 테두리 실선 및 정렬 적용
    for (let i = headerRowIndex + 1; i <= memberDataEndRow; i++) {
      memberHeaderCols.forEach(col => {
        const cellRef = `${col}${i + 1}`;
        if (ws[cellRef]) {
          if (!ws[cellRef].s) {
            ws[cellRef].s = {};
          }
          // 숫자 컬럼은 오른쪽 정렬, 나머지는 가운데 정렬
          const isNumberCol = ['A', 'D', 'I', 'J', 'L', 'N'].includes(col); // 구분, 나이, 보험료 컬럼들
          ws[cellRef].s.border = {
            top: { style: 'medium', color: { rgb: '000000' } },
            bottom: { style: 'medium', color: { rgb: '000000' } },
            left: { style: 'medium', color: { rgb: '000000' } },
            right: { style: 'medium', color: { rgb: '000000' } }
          };
          ws[cellRef].s.alignment = {
            horizontal: isNumberCol ? 'right' : 'center',
            vertical: 'center'
          };
        }
      });
    }
    
    // 회원리스트 합계 행 전체 스타일 (모든 셀에 테두리 실선, 가운데 정렬)
    const memberSummaryCols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'];
    memberSummaryCols.forEach(col => {
      const cellRef = `${col}${memberSummaryRowIndex + 1}`;
      if (ws[cellRef]) {
        const isNumberCell = ['I', 'J', 'L'].includes(col);
        ws[cellRef].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: 'D9E1F2' } },
          alignment: { horizontal: 'center', vertical: 'center' }, // 모든 셀 가운데 정렬
          border: {
            top: { style: 'medium', color: { rgb: '000000' } },
            bottom: { style: 'medium', color: { rgb: '000000' } },
            left: { style: 'medium', color: { rgb: '000000' } },
            right: { style: 'medium', color: { rgb: '000000' } }
          },
          numFmt: isNumberCell ? '#,##0' : undefined
        };
      }
    });
    
    // 배서리스트 헤더 행 스타일 (있는 경우)
    if (endorseHeaderRowIndex !== null) {
      const endorseHeaderCols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'];
      endorseHeaderCols.forEach(col => {
        const cellRef = `${col}${endorseHeaderRowIndex + 1}`;
        if (ws[cellRef]) {
          ws[cellRef].s = {
            font: { bold: true },
            fill: { fgColor: { rgb: 'E6E6E6' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: {
              top: { style: 'medium', color: { rgb: '000000' } },
              bottom: { style: 'medium', color: { rgb: '000000' } },
              left: { style: 'medium', color: { rgb: '000000' } },
              right: { style: 'medium', color: { rgb: '000000' } }
            }
          };
        }
      });
      
      // 배서 데이터 행에 테두리 실선 및 정렬 적용
      for (let i = endorseHeaderRowIndex; i <= endorseDataEndRow; i++) {
        endorseHeaderCols.forEach(col => {
          const cellRef = `${col}${i + 1}`;
          if (ws[cellRef]) {
            if (!ws[cellRef].s) {
              ws[cellRef].s = {};
            }
            // 숫자 컬럼은 오른쪽 정렬, 나머지는 가운데 정렬
            const isNumberCol = ['A', 'D', 'I', 'L'].includes(col); // 구분, 나이, 보험료 컬럼들
            ws[cellRef].s.border = {
              top: { style: 'medium', color: { rgb: '000000' } },
              bottom: { style: 'medium', color: { rgb: '000000' } },
              left: { style: 'medium', color: { rgb: '000000' } },
              right: { style: 'medium', color: { rgb: '000000' } }
            };
            ws[cellRef].s.alignment = {
              horizontal: isNumberCol ? 'right' : 'center',
              vertical: 'center'
            };
          }
        });
      }
    }
    
    // 배서 합계 행 전체 스타일 (있는 경우, 모든 셀에 테두리 실선, 가운데 정렬)
    if (endorseSummaryRowIndex !== null) {
      const endorseSummaryCols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'];
      endorseSummaryCols.forEach(col => {
        const cellRef = `${col}${endorseSummaryRowIndex + 1}`;
        if (ws[cellRef]) {
          const isNumberCell = ['I', 'L'].includes(col);
          ws[cellRef].s = {
            font: { bold: true },
            fill: { fgColor: { rgb: 'D9E1F2' } },
            alignment: { horizontal: 'center', vertical: 'center' }, // 모든 셀 가운데 정렬
            border: {
              top: { style: 'medium', color: { rgb: '000000' } },
              bottom: { style: 'medium', color: { rgb: '000000' } },
              left: { style: 'medium', color: { rgb: '000000' } },
              right: { style: 'medium', color: { rgb: '000000' } }
            },
            numFmt: isNumberCell ? '#,##0' : undefined
          };
        }
      });
    }
    
    // 최종 합계 행 전체 스타일 (있는 경우, 모든 셀에 테두리 실선, 가운데 정렬)
    if (finalSummaryRowIndex !== null) {
      const finalSummaryCols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'];
      finalSummaryCols.forEach(col => {
        const cellRef = `${col}${finalSummaryRowIndex + 1}`;
        if (ws[cellRef]) {
          const isNumberCell = ['I', 'L'].includes(col);
          ws[cellRef].s = {
            font: { bold: true, sz: 11 },
            fill: { fgColor: { rgb: 'FFC000' } },
            alignment: { horizontal: 'center', vertical: 'center' }, // 모든 셀 가운데 정렬
            border: {
              top: { style: 'medium', color: { rgb: '000000' } },
              bottom: { style: 'medium', color: { rgb: '000000' } },
              left: { style: 'medium', color: { rgb: '000000' } },
              right: { style: 'medium', color: { rgb: '000000' } }
            },
            numFmt: isNumberCell ? '#,##0' : undefined
          };
        }
      });
    }
    
    // ===== 숫자 포맷 적용 (콤마) =====
    // 회원 데이터의 보험료 컬럼 (I, J, L)
    for (let i = headerRowIndex + 1; i <= memberDataEndRow; i++) {
      ['I', 'J', 'L'].forEach(col => {
        const cellRef = `${col}${i + 1}`;
        if (ws[cellRef] && ws[cellRef].v !== '-' && ws[cellRef].v !== '') {
          ws[cellRef].z = '#,##0';
        }
      });
    }
    
    // 배서 데이터의 보험료 컬럼 (있는 경우)
    if (endorseHeaderRowIndex !== null && endorseDataEndRow !== null) {
      for (let i = endorseHeaderRowIndex; i <= endorseDataEndRow; i++) {
        ['I', 'L'].forEach(col => {
          const cellRef = `${col}${i + 1}`;
          if (ws[cellRef] && ws[cellRef].v !== 0 && ws[cellRef].v !== '') {
            ws[cellRef].z = '#,##0';
          }
        });
      }
    }
    
    XLSX.utils.book_append_sheet(wb, ws, '회원리스트');
    
    // 파일명 생성
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const safeCompanyName = (data.companyName || 'company').replace(/[\/\\?%*:|"<>]/g, '_');
    const fileName = `${safeCompanyName}_회원리스트_${today}.xlsx`;
    
    // 다운로드
    XLSX.writeFile(wb, fileName);
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
  // 정산리스트 버튼 클릭 이벤트
  document.getElementById('settleListBtn')?.addEventListener('click', () => {
    openSettlementList('1'); // 기본값: 전체
  });

  // 확정보험료 입력 버튼 클릭 이벤트
  document.getElementById('settleConfirmPremiumBtn')?.addEventListener('click', () => {
    openConfirmPremiumModal();
  });
  
  // 메모 저장 버튼 클릭 이벤트 (한 번만 등록)
  document.getElementById('settlementMemoSaveBtn')?.addEventListener('click', () => {
    saveSettlementMemo();
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

  // ==================== 정산리스트 관련 함수 ====================

  // 정산리스트 모달 열기
  window.openSettlementList = function(attempted = '1') {
    const modalElement = document.getElementById('settlementListModal2');
    if (!modalElement) {
      console.error('정산리스트 모달을 찾을 수 없습니다.');
      return;
    }

    const contentDiv = document.getElementById('settlementListContent');
    if (!contentDiv) {
      console.error('정산리스트 컨텐츠 영역을 찾을 수 없습니다.');
      return;
    }

    // 모달 내용 생성
    const today = new Date();
    const lastMonth = new Date(today);
    lastMonth.setMonth(today.getMonth() - 1);

    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const fieldContents = `
      <div class="kje-list-container">
        <!-- 검색 영역 -->
        <div class="kje-list-header mb-3">
          <div class="d-flex flex-wrap gap-2 align-items-end justify-content-between">
            <div class="d-flex flex-wrap gap-2 align-items-end">
              <div>
                <input type='date' id='lastDate' class='form-control form-control-sm' value='${formatDate(lastMonth)}'>
              </div>
              <div>
                <input type='date' id='thisDate' class='form-control form-control-sm' value='${formatDate(today)}'>
              </div>
              <div>
                <select id="damdanga3" class="form-select form-select-sm">
                  <option value="">전체</option>
                </select>
              </div>
              <div>
                <select id="attempted" class="form-select form-select-sm">
                  <option value='1' ${attempted === '1' ? 'selected' : ''}>전체</option>
                  <option value='2' ${attempted === '2' ? 'selected' : ''}>미수</option>
                </select>
              </div>
              <div>
                <button class="btn btn-sm btn-primary" id="settlementListSearchBtn">검색</button>
              </div>
            </div>
            
            <!-- 통계 영역 (오른쪽) - 1행 9열 -->
            <div id="settlementStatistics" class="d-flex gap-2 align-items-end" style="display: none !important;">
              <div class="text-center">
                <div class="fw-bold text-primary small">전체건</div>
                <div id="statTotalCount" class="fw-bold">0</div>
              </div>
              <div class="text-center">
                <div class="fw-bold text-primary small">전체금액</div>
                <div id="statTotalAmount" class="fw-bold text-primary">0</div>
              </div>
              <div class="text-center">
                <div class="fw-bold text-success small">받은건</div>
                <div id="statReceivedCount" class="fw-bold">0</div>
              </div>
              <div class="text-center">
                <div class="fw-bold text-success small">받은금액</div>
                <div id="statReceivedAmount" class="fw-bold text-success">0</div>
              </div>
              <div class="text-center">
                <div class="fw-bold text-danger small">미수건</div>
                <div id="statUnpaidCount" class="fw-bold">0</div>
              </div>
              <div class="text-center">
                <div class="fw-bold text-danger small">미수금액</div>
                <div id="statUnpaidAmount" class="fw-bold text-danger">0</div>
              </div>
            </div>
          </div>
        </div>
    
        <!-- 리스트 영역 -->
        <div class="kje-list-content">
          <table class="table table-bordered table-sm align-middle">
            <thead class="table-light">
              <tr>
                <th width='3%'>No</th>
                <th width='7%'>정산일</th>
                <th width='10%'>대리운전회사</th>
                <th width='7%'>담당자</th>
                <th width='6%'>보험료</th>
                <th width='4%'>인원</th>
                <th width='6%'>받을보험료</th>
                <th width='10%'>받은날</th>
                <th width='7%'>받은입력자</th>
                <th width='5%'>차액</th>
                <th width='37%'>메모</th>
              </tr>
            </thead>
            <tbody id="settleList">
              <tr>
                <td colspan="11" class="text-center py-4">데이터를 불러오는 중...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>`;

    contentDiv.innerHTML = fieldContents;

    // 모달 표시
    const modal = new bootstrap.Modal(modalElement);
    modal.show();

    // 담당자 목록 로드
    loadManagerListForSettlement();

    // 이벤트 리스너는 모달이 완전히 렌더링된 후에 연결
    setTimeout(() => {
      // 검색 버튼 이벤트
      const searchBtn = document.getElementById('settlementListSearchBtn');
      if (searchBtn) {
        // 기존 이벤트 리스너 제거 후 새로 추가
        searchBtn.replaceWith(searchBtn.cloneNode(true));
        document.getElementById('settlementListSearchBtn')?.addEventListener('click', () => {
          console.log('검색 버튼 클릭됨');
          settleSearch();
        });
      }

      // 담당자 선택 변경 시 자동 검색
      const damdangaSelect = document.getElementById('damdanga3');
      if (damdangaSelect) {
        damdangaSelect.addEventListener('change', () => {
          console.log('담당자 선택 변경:', damdangaSelect.value);
          settleSearch();
        });
      }

      // 구분 선택 변경 시 자동 검색
      const attemptedSelect = document.getElementById('attempted');
      if (attemptedSelect) {
        attemptedSelect.addEventListener('change', () => {
          console.log('구분 선택 변경:', attemptedSelect.value);
          settleSearch();
        });
      }

      // 초기 검색 실행
      settleSearch();
    }, 200);
  };

  // 담당자 목록 로드 (정산리스트용) - kj-driver-company.html과 동일한 데이터 사용
  async function loadManagerListForSettlement() {
    try {
      const res = await fetch('/api/insurance/kj-company/managers');
      const json = await res.json();
      
      const select = document.getElementById('damdanga3');
      if (!select) return;

      select.innerHTML = '<option value="">전체</option>';
      
      if (json.success && json.data) {
        json.data.forEach(manager => {
          const option = document.createElement('option');
          // createUser와 매칭하기 위해 name 사용
          option.value = manager.name || '';
          option.textContent = manager.name || `담당자 ${manager.num}`;
          select.appendChild(option);
        });
      }
    } catch (err) {
      console.error('담당자 목록 로드 실패:', err);
    }
  }

  // 정산리스트 조회
  async function settleSearch() {
    console.log('settleSearch() 함수 호출됨');
    
    const lastDate = document.getElementById('lastDate')?.value;
    const thisDate = document.getElementById('thisDate')?.value;
    const damdanga = document.getElementById('damdanga3')?.value || '';
    const attempted = document.getElementById('attempted')?.value || '1';

    console.log('필터 값:', { lastDate, thisDate, damdanga, attempted });

    if (!lastDate || !thisDate) {
      alert('시작일과 종료일을 선택해주세요.');
      return;
    }

    const settleList = document.getElementById('settleList');
    if (!settleList) {
      console.error('settleList 요소를 찾을 수 없습니다.');
      return;
    }

    settleList.innerHTML = '<tr><td colspan="11" class="text-center py-4">조회 중...</td></tr>';

    try {
      const requestData = {
        lastDate: lastDate,
        thisDate: thisDate,
        attempted: attempted
      };
      if (damdanga && damdanga.trim() !== '') {
        requestData.damdanga = damdanga.trim();
      }

      console.log('정산리스트 조회 요청:', requestData);
      console.log('담당자 필터 값:', damdanga, '| 선택된 값:', document.getElementById('damdanga3')?.value);
      console.log('API 요청 시작: /api/insurance/kj-company/settlement/list');

      const response = await fetch('/api/insurance/kj-company/settlement/list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      console.log('API 응답 상태:', response.status, response.statusText);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API 응답 데이터:', data);

      if (data.success) {
        displaySettlementData(data);
        displaySettlementStatistics(data.statistics);
      } else {
        alert('오류가 발생했습니다: ' + (data.message || '알 수 없는 오류'));
        settleList.innerHTML = '<tr><td colspan="11" class="text-center py-4 text-danger">조회 실패</td></tr>';
      }
    } catch (error) {
      console.error('Error details:', error);
      alert('정산리스트 조회중 에러발생.');
      settleList.innerHTML = '<tr><td colspan="11" class="text-center py-4 text-danger">조회 중 오류가 발생했습니다.</td></tr>';
    }
  }

  // 정산 통계 정보 표시 함수
  function displaySettlementStatistics(statistics) {
    if (!statistics) return;
    
    const statsDiv = document.getElementById('settlementStatistics');
    if (!statsDiv) return;
    
    const formatAmount = (amount) => {
      if (!amount && amount !== 0) return '0';
      const numAmount = parseFloat(String(amount).replace(/,/g, ''));
      return isNaN(numAmount) ? '0' : numAmount.toLocaleString('ko-KR');
    };
    
    // 전체 건수 및 금액
    document.getElementById('statTotalCount').textContent = statistics.totalCount || 0;
    document.getElementById('statTotalAmount').textContent = formatAmount(statistics.totalAdjustmentAmount || 0);
    
    // 받은 건수 및 금액
    document.getElementById('statReceivedCount').textContent = statistics.receivedCount || 0;
    document.getElementById('statReceivedAmount').textContent = formatAmount(statistics.totalReceivedAmount || 0);
    
    // 미수 건수 및 금액
    document.getElementById('statUnpaidCount').textContent = statistics.unpaidCount || 0;
    document.getElementById('statUnpaidAmount').textContent = formatAmount(statistics.totalUnpaidAmount || 0);
    
    // 통계 영역 표시 (flex로 변경)
    statsDiv.style.display = 'flex';
  }

  // 정산 데이터를 테이블에 표시하는 함수
  function displaySettlementData(data) {
    const settleList = document.getElementById('settleList');
    if (!settleList) return;

    settleList.innerHTML = '';

    if (data.count === 0 || !data.data || data.data.length === 0) {
      const emptyRow = document.createElement('tr');
      emptyRow.innerHTML = '<td colspan="11" class="text-center py-4">조회된 정산 데이터가 없습니다.</td>';
      settleList.appendChild(emptyRow);
      return;
    }

    let tableContent = '';

    data.data.forEach((item, index) => {
      // 금액 포맷팅 함수
      const formatAmount = (amount) => {
        if (!amount && amount !== 0) return '0';
        const numAmount = parseFloat(String(amount).replace(/,/g, ''));
        return isNaN(numAmount) ? '0' : numAmount.toLocaleString('ko-KR');
      };

      // 차이 금액 계산 (receivedAmount가 있을 경우에만)
      let differenceAmount = '';
      const adjustmentAmount = parseFloat(String(item.adjustmentAmount || 0).replace(/,/g, ''));
      const receivedAmount = parseFloat(String(item.receivedAmount || 0).replace(/,/g, ''));
      
      if (item.receivedAmount !== null && item.receivedAmount !== undefined && item.receivedAmount !== '') {
        const difference = adjustmentAmount - receivedAmount;
        differenceAmount = formatAmount(difference);
      }

      // 날짜 포맷팅 함수
      const formatDateTime = (dateTimeStr) => {
        if (!dateTimeStr || dateTimeStr === '0000-00-00 00:00:00' || dateTimeStr === '0000-00-00') return '';
        try {
          const date = new Date(dateTimeStr);
          if (isNaN(date.getTime())) return dateTimeStr;
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          return `${year}-${month}-${day} ${hours}:${minutes}`;
        } catch (e) {
          return dateTimeStr;
        }
      };

      // HTML 행 구성
      tableContent += `
        <tr>
          <td>${index + 1}</td>
          <td>${item.thisMonthDueDate || ''}</td>
          <td>${item.company || ''}</td>
          <td>${item.managerName || ''}</td>
          <td class="text-end">${formatAmount(item.adjustmentAmount)}</td>
          <td class="text-end">${item.totalDrivers || 0}</td>
          <td style="padding: 0 !important;">
            <input type='text' 
              id='getPrinum_${item.id}' 
              class="form-control form-control-sm text-end"
              placeholder='받을 보험료' 
              value='${formatAmount(item.receivedAmount)}'
              onkeypress="if(event.key === 'Enter') { window.getPremium(this, ${item.id}); return false; }" 
              autocomplete="off"
              style="border: none; background-color: white; padding: 0.25rem; width: 100%;"
            >
          </td>
          <td>${formatDateTime(item.receiveDate)}</td>
          <td>${item.receiveUser || ''}</td>
          <td class="text-end">
            <span id='chai-${item.id}'>${differenceAmount}</span> 
          </td>
          <td style="padding: 0 !important;">
            <input type='text' 
              id='memo_${item.id}' 
              class="form-control form-control-sm"
              placeholder='메모 입력' 
              value='${(item.memo || '').replace(/'/g, "&apos;")}'
              onkeypress="if(event.key === 'Enter') { window.getPremiumMemo(this, ${item.id}); return false; }" 
              autocomplete="off"
              style="border: none; background-color: white; padding: 0.25rem; width: 100%;"
            >
          </td>
        </tr>
      `;
    });

    settleList.innerHTML = tableContent;
  }

  // 받을 보험료 저장
  window.getPremium = async function(inputElement, id) {
    const receivedAmount = inputElement.value.replace(/,/g, '');
    const receiveUser = (window.SessionManager?.getUserInfo?.().name) || '';

    try {
      const requestData = {
        id: id,
        receivedAmount: receivedAmount,
        receiveUser: receiveUser
      };

      const response = await fetch('/api/insurance/kj-company/settlement/list-save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();

      if (data.success) {
        // 차액 계산 및 업데이트 (보험료는 5번째 열)
        const adjustmentAmount = parseFloat(document.querySelector(`#getPrinum_${id}`).closest('tr').querySelector('td:nth-child(5)').textContent.replace(/,/g, ''));
        const newReceivedAmount = parseFloat(receivedAmount) || 0;
        const difference = adjustmentAmount - newReceivedAmount;
        const chaiElement = document.getElementById(`chai-${id}`);
        if (chaiElement) {
          chaiElement.textContent = difference.toLocaleString('ko-KR');
          chaiElement.className = difference < 0 ? 'text-danger' : '';
        }
      } else {
        alert('저장 실패: ' + (data.message || '알 수 없는 오류'));
      }
    } catch (error) {
      console.error('Error:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  // 메모 저장
  window.getPremiumMemo = async function(inputElement, id) {
    const memo = inputElement.value;
    const receiveUser = (window.SessionManager?.getUserInfo?.().name) || '';

    try {
      const requestData = {
        id: id,
        memo: memo,
        receiveUser: receiveUser
      };

      const response = await fetch('/api/insurance/kj-company/settlement/list-save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();

      if (data.success) {
        // 성공 메시지 (선택사항)
        // console.log('메모가 저장되었습니다.');
      } else {
        alert('저장 실패: ' + (data.message || '알 수 없는 오류'));
      }
    } catch (error) {
      console.error('Error:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  // ==================== 확정보험료 입력 관련 함수 ====================

  // 확정보험료 입력 모달 열기
  window.openConfirmPremiumModal = function() {
    if (!currentSettlement || !currentSettlement.dNum) {
      alert('정산 정보가 없습니다. 먼저 정산 모달을 열어주세요.');
      return;
    }

    const modalElement = document.getElementById('confirmPremiumModal');
    if (!modalElement) {
      console.error('확정보험료 입력 모달을 찾을 수 없습니다.');
      return;
    }

    const modal = new bootstrap.Modal(modalElement);
    
    // 날짜 필드 초기화 (종료일을 기본값으로 사용)
    const endDateInput = document.getElementById('settleEndDate');
    const confirmPremiumDateInput = document.getElementById('confirmPremiumDate');
    if (confirmPremiumDateInput && endDateInput && endDateInput.value) {
      confirmPremiumDateInput.value = endDateInput.value;
    } else {
      // 종료일이 없으면 오늘 날짜 사용
      const today = new Date().toISOString().split('T')[0];
      if (confirmPremiumDateInput) {
        confirmPremiumDateInput.value = today;
      }
    }

    // 금액 필드 초기화
    const confirmPremiumAmountInput = document.getElementById('confirmPremiumAmount');
    if (confirmPremiumAmountInput) {
      confirmPremiumAmountInput.value = '';
    }

    modal.show();
  };

  // 확정보험료 저장
  window.saveConfirmPremium = async function() {
    if (!currentSettlement || !currentSettlement.dNum) {
      alert('정산 정보가 없습니다.');
      return;
    }

    const dateInput = document.getElementById('confirmPremiumDate');
    const amountInput = document.getElementById('confirmPremiumAmount');

    if (!dateInput || !amountInput) {
      alert('입력 필드를 찾을 수 없습니다.');
      return;
    }

    const thisMonthDueDate = dateInput.value;
    let adjustmentAmount = amountInput.value.replace(/,/g, '');

    if (!thisMonthDueDate) {
      alert('정산일을 선택해주세요.');
      return;
    }

    if (!adjustmentAmount || isNaN(adjustmentAmount)) {
      alert('유효한 보험료 금액을 입력해주세요.');
      return;
    }

    // 로그인 사용자 이름 가져오기 (여러 소스 확인)
    let userName = '';
    if (window.sjTemplateLoader && window.sjTemplateLoader.user && window.sjTemplateLoader.user.name) {
      userName = window.sjTemplateLoader.user.name;
    } else if (window.SessionManager?.getUserInfo?.().name) {
      userName = window.SessionManager.getUserInfo().name;
    } else {
      const sessionName = sessionStorage.getItem('userName');
      if (sessionName) {
        userName = sessionName;
      } else {
        const localName = localStorage.getItem('userName');
        if (localName) {
          userName = localName;
        }
      }
    }

    // 정산 모달의 합계 인원 계산
    let totalDrivers = 0;
    try {
      const settleStartInput = document.getElementById('settleStartDate');
      const settleEndInput = document.getElementById('settleEndDate');
      const start = settleStartInput?.value || '';
      const end = settleEndInput?.value || '';

      if (start && end) {
        const params = new URLSearchParams({
          dNum: currentSettlement.dNum,
          lastMonthDueDate: start,
          thisMonthDueDate: end,
        });
        const res = await fetch(`/api/insurance/kj-company/settlement/adjustment?${params.toString()}`);
        const json = await res.json();
        if (json.success && json.data) {
          totalDrivers = json.data.reduce((sum, item) => sum + (item.drivers_count || 0), 0);
        }
      }
    } catch (err) {
      console.error('정산 인원 조회 실패:', err);
      // 오류가 발생해도 계속 진행
    }

    try {
      const requestData = {
        dNum: currentSettlement.dNum,
        thisMonthDueDate: thisMonthDueDate,
        adjustmentAmount: adjustmentAmount,
        userName: userName,
        totalDrivers: totalDrivers
      };

      const response = await fetch('/api/insurance/kj-company/settlement/premium-save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        alert('확정보험료가 성공적으로 저장되었습니다.');
        
        // 모달 닫기
        const modalElement = document.getElementById('confirmPremiumModal');
        if (modalElement) {
          const modal = bootstrap.Modal.getInstance(modalElement);
          if (modal) {
            modal.hide();
          }
        }

        // 입력 필드 초기화
        if (amountInput) {
          amountInput.value = '';
        }
      } else {
        alert('저장 실패: ' + (data.message || '알 수 없는 오류'));
      }
    } catch (error) {
      console.error('Error:', error);
      alert('확정보험료 저장 중 오류가 발생했습니다.');
    }
  };

  // 확정보험료 금액 입력 필드 포맷팅 및 이벤트 설정
  (function initConfirmPremiumModal() {
    const confirmPremiumAmountInput = document.getElementById('confirmPremiumAmount');
    if (confirmPremiumAmountInput) {
      confirmPremiumAmountInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/,/g, '');
        if (value && !isNaN(value)) {
          e.target.value = parseFloat(value).toLocaleString('ko-KR');
        }
      });

      // 엔터키로 저장
      confirmPremiumAmountInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          window.saveConfirmPremium();
        }
      });
    }

    // 저장 버튼 이벤트
    const confirmPremiumSaveBtn = document.getElementById('confirmPremiumSaveBtn');
    if (confirmPremiumSaveBtn) {
      confirmPremiumSaveBtn.addEventListener('click', () => {
        window.saveConfirmPremium();
      });
    }
  })();

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


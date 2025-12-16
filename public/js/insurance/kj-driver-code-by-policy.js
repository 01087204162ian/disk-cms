/**
 * KJ 대리운전 - 증권별 코드 리스트
 * 기존 kj_policy.js 기능을 CMS용으로 이식
 * API 경로: pcikorea.com/api/insurance (Node 프록시 경유)
 */
(function () {
  const API_BASE = '/api/insurance';
  const PAGE_SIZE_DEFAULT = 15;

  const state = {
    isFetching: false,
    fetchCount: 0,
    currentPage: 1,
    itemsPerPage: PAGE_SIZE_DEFAULT,
    policyData: null,
  };

  const formatDateInput = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const showLoading = (id) => {
    const el = document.getElementById(id || 'kjPoLoadingIndicator');
    if (el) el.style.display = 'flex';
  };
  const hideLoading = (id) => {
    const el = document.getElementById(id || 'kjPoLoadingIndicator');
    if (el) el.style.display = 'none';
  };

  const addComma = (val) => {
    const num = Number(String(val).replace(/,/g, ''));
    return Number.isFinite(num) ? num.toLocaleString('ko-KR') : '';
  };

  const addCommaListener = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => {
      const caret = el.selectionStart;
      el.value = addComma(el.value);
      // caret 보정은 생략 (간단 처리)
      el.setSelectionRange(caret, caret);
    });
  };

  const getInsurerLabel = (code) => {
    if (typeof window.getInsurerName === 'function') {
      return window.getInsurerName(code);
    }
    const fallback = {
      '1': '흥국',
      '2': 'DB',
      '3': 'KB',
      '4': '현대',
      '5': '롯데',
      '6': '롯데',
      '7': '한화',
      '8': '삼성',
    };
    return fallback[String(code)] || code || '';
  };

  const renderTable = (responseData) => {
    const tableBody = document.getElementById('kje-policyList');
    if (!tableBody) return;

    tableBody.innerHTML = '';
    if (!responseData || !responseData.success || !Array.isArray(responseData.data) || responseData.data.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="16" style="text-align:center;">데이터가 없습니다.</td></tr>';
      return;
    }

    const { currentPage, itemsPerPage } = state;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, responseData.data.length);
    const current = responseData.data.slice(startIndex, endIndex);

    let totalInwon = 0;

    current.forEach((item, idx) => {
      const insurer = getInsurerLabel(item.insurance);
      const inwon = parseInt(item.inwon || 0, 10);
      if (!Number.isNaN(inwon)) totalInwon += inwon;

      const row = document.createElement('tr');
      row.innerHTML = `
        <td><a href="#" class="kje-btn-link_1" onClick="kjPolicyPage.openPolicyDetail('${item.certi || ''}');return false;">${idx + 1}</a></td>
        <td>${item.certi || ''}</td>
        <td>${item.company || ''}</td>
        <td>${item.name || ''}</td>
        <td>${item.owner || ''}</td>
        <td>${item.jumin || ''}</td>
        <td>${insurer || ''}</td>
        <td>${item.sigi || ''}</td>
        <td>${item.nab || ''}</td>
        <td class="kje-preiminum">${item.inwon || ''}</td>
        <td class="kje-preiminum">${item.maxInwon || ''}</td>
        <td>${item.cord || ''}</td>
        <td>${item.cordPass || ''}</td>
        <td>${item.cordCerti || ''}</td>
        <td>${item.yearRate || '0'}%</td>
        <td>${item.harinRate || '0'}%</td>
      `;
      tableBody.appendChild(row);
    });

    const totalRow = document.createElement('tr');
    totalRow.className = 'kje-total-row';
    totalRow.innerHTML = `
      <td colspan="9" style="text-align:right;font-weight:bold;">인원 합계:</td>
      <td class="kje-preiminum" style="font-weight:bold;">${totalInwon}</td>
      <td colspan="6"></td>
    `;
    tableBody.appendChild(totalRow);

    const info = document.getElementById('currentSituation');
    if (info) {
      info.textContent = `총 ${responseData.data.length}개의 증권이 검색되었습니다. (${startIndex + 1}-${endIndex}/${responseData.data.length})`;
    }
  };

  const renderPagination = (responseData) => {
    const container = document.querySelector('.policy-pagination');
    if (!container) return;
    container.innerHTML = '';

    if (!responseData || !responseData.success || !Array.isArray(responseData.data) || responseData.data.length === 0) {
      return;
    }
    const { currentPage, itemsPerPage } = state;
    const totalPages = Math.ceil(responseData.data.length / itemsPerPage);
    if (totalPages <= 1) return;

    const createBtn = (label, page, disabled, active) => {
      const a = document.createElement('a');
      a.href = 'javascript:void(0);';
      a.className = 'pagination-btn' + (disabled ? ' disabled' : '') + (active ? ' active' : '');
      a.textContent = label;
      if (!disabled && !active) {
        a.onclick = () => kjPolicyPage.goPage(page);
      }
      return a;
    };

    container.appendChild(createBtn('«', currentPage - 1, currentPage === 1, false));

    const maxPageButtons = 5;
    let start = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
    let end = Math.min(totalPages, start + maxPageButtons - 1);
    if (end - start + 1 < maxPageButtons) start = Math.max(1, end - maxPageButtons + 1);

    if (start > 1) {
      container.appendChild(createBtn('1', 1, false, false));
      if (start > 2) {
        const span = document.createElement('span');
        span.className = 'pagination-ellipsis';
        span.textContent = '...';
        container.appendChild(span);
      }
    }

    for (let i = start; i <= end; i += 1) {
      container.appendChild(createBtn(String(i), i, false, i === currentPage));
    }

    if (end < totalPages) {
      if (end < totalPages - 1) {
        const span = document.createElement('span');
        span.className = 'pagination-ellipsis';
        span.textContent = '...';
        container.appendChild(span);
      }
      container.appendChild(createBtn(String(totalPages), totalPages, false, false));
    }

    container.appendChild(createBtn('»', currentPage + 1, currentPage === totalPages, false));
  };

  const buildPageLayout = () => {
    const container = document.getElementById('page-content');
    if (!container) return;
    container.innerHTML = `
      <div class="search-filter-row mb-3">
        <div class="row align-items-end">
          <div class="col-md-3 col-sm-6 mb-2 mb-md-0">
            <input type="date" id="fromDate" class="form-control" />
          </div>
          <div class="col-md-3 col-sm-6 mb-2 mb-md-0">
            <input type="date" id="toDate" class="form-control" />
          </div>
          <div class="col-md-2 col-sm-6 mb-2 mb-md-0">
            <button class="btn btn-primary w-100" type="button" id="search_btn">
              <i class="fas fa-search"></i> <span class="d-none d-sm-inline">검색</span>
            </button>
          </div>
          <div class="col-md-4 col-sm-12 mt-2 mt-md-0 text-md-end text-sm-start">
            <span id="currentSituation" class="small text-muted"></span>
          </div>
        </div>
      </div>

      <div id="kjPoLoadingIndicator" class="kj-loading-indicator" style="display:none;">
        <div class="loading-spinner"></div>
        <div class="loading-text">데이터를 불러오는 중...</div>
      </div>

      <div class="kje-data-table-container table-responsive">
        <table class="table table-bordered table-hover table-sm align-middle">
          <thead class="thead-light">
            <tr>
              <th class="col-number">#</th>
              <th class="col-policy-number">증권번호</th>
              <th class="col-company">회사명</th>
              <th class="col-name">계약자</th>
              <th class="col-owner">소유자</th>
              <th class="col-jumin">주민번호</th>
              <th class="col-insurance-company">보험사</th>
              <th class="col-start-date">계약일</th>
              <th class="col-nab">회차</th>
              <th class="col-inwon text-end">인원</th>
              <th class="col-max text-end">max</th>
              <th class="col-code">코드</th>
              <th class="col-pass">비밀번호</th>
              <th class="col-cert">인증번호</th>
              <th class="col-rate">단체율</th>
              <th class="col-harin">할인율</th>
            </tr>
          </thead>
          <tbody id="kje-policyList">
            <tr><td colspan="16" class="text-center py-4">데이터를 불러오는 중...</td></tr>
          </tbody>
        </table>
      </div>

      <div class="policy-pagination d-flex justify-content-center mt-3"></div>
    `;
  };

  const fetchList = async () => {
    if (state.isFetching) return;
    state.isFetching = true;
    state.fetchCount += 1;
    const sj = 'policy_';

    showLoading();
    try {
      const fromDate = document.getElementById('fromDate')?.value || '';
      const toDate = document.getElementById('toDate')?.value || '';
      const url = new URL(`${API_BASE}/kj-code/policy-search`, window.location.origin);
      url.searchParams.set('sj', sj);
      url.searchParams.set('fromDate', fromDate);
      url.searchParams.set('toDate', toDate);
      const res = await fetch(url.toString(), { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      state.policyData = data;
      state.currentPage = 1;
      renderTable(data);
      renderPagination(data);
    } catch (e) {
      console.error('policy search error', e);
      alert('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      hideLoading();
      state.isFetching = false;
    }
  };

  const goPage = (page) => {
    if (!state.policyData || !state.policyData.data) return;
    const totalPages = Math.ceil(state.policyData.data.length / state.itemsPerPage);
    if (page < 1 || page > totalPages) return;
    state.currentPage = page;
    renderTable(state.policyData);
    renderPagination(state.policyData);
    const table = document.querySelector('.kje-data-table-container');
    if (table) table.scrollIntoView({ behavior: 'smooth' });
  };

  const buildModalsIfNeeded = () => {
    if (document.getElementById('policyNum-modal')) return;
    const html = `
      <!-- 증권 상세 모달 (Bootstrap) -->
      <div class="modal fade" id="policyNum-modal" tabindex="-1" aria-labelledby="policyNumModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-xl modal-dialog-scrollable">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="policyNumModalLabel">증권 상세 정보</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="닫기"></button>
            </div>
            <div class="modal-body" style="max-height: 85vh; overflow-y: auto;">
              <div id="policyNum_daeriCompany"></div>
              <div id="m_policyNum"></div>
              <div id="Insurance_premium_statistics"></div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">닫기</button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 보험료 입력 모달 (Bootstrap) -->
      <div class="modal fade" id="po-premium-modal" tabindex="-1" aria-labelledby="premiumModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-scrollable">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="premiumModalLabel">
                <span id="po_ceti_daeriCompany">보험료 입력</span>
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="닫기"></button>
            </div>
            <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
              <div class="table-responsive">
                <table class="table table-bordered table-sm">
                  <thead class="thead-light">
                    <tr>
                      <th>#</th>
                      <th>시작월</th>
                      <th>종료월</th>
                      <th>보험료1</th>
                      <th>보험료2</th>
                      <th>10회납</th>
                    </tr>
                  </thead>
                  <tbody id="policyPremiumList"></tbody>
                </table>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">닫기</button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
  };

  const openPolicyDetail = async (certi) => {
    buildModalsIfNeeded();
    const modalElement = document.getElementById('policyNum-modal');
    if (!modalElement) return;
    
    const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);

    // 검색 섹션 제거
    document.getElementById('policyNum_daeriCompany').innerHTML = '';

    showLoading();
    try {
      const params = new URLSearchParams();
      params.append('num', certi);
      const res = await fetch(`${API_BASE}/kj-code/policy-num-detail`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      if (!result.success || !result.data || !result.data[0]) throw new Error(result.error || '데이터 없음');
      const d = result.data[0];
      const html = `
        <div class="table-responsive mb-3">
          <table class="table table-bordered table-sm">
            <thead class="thead-light">
              <tr>
                <th style="width: 15%;">증권번호</th>
                <th style="width: 15%;">회사명</th>
                <th style="width: 15%;">계약자</th>
                <th style="width: 15%;">주민번호</th>
                <th style="width: 10%;">계약일</th>
                <th style="width: 5%;">회차</th>
                <th style="width: 5%;">인원</th>
                <th style="width: 10%;">단체</th>
                <th style="width: 10%;">할인율</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><input type='text' id='p-certi' class='form-control form-control-sm' value="${d.certi || ''}" autocomplete="off"></td>
                <td><input type='text' id='p-company' class='form-control form-control-sm' value="${d.company || ''}" autocomplete="off"></td>
                <td><input type='text' id='p-name' class='form-control form-control-sm' value="${d.name || ''}" autocomplete="off"></td>
                <td><input type='text' id='p-jumin' class='form-control form-control-sm' value="${d.jumin || ''}" autocomplete="off"></td>
                <td><input type='date' id='p-sigi' class='form-control form-control-sm' value="${d.sigi || ''}" autocomplete="off"></td>
                <td><input type='text' id='p-nab' class='form-control form-control-sm' value="${d.nab || ''}" autocomplete="off"></td>
                <td class='text-center'>${d.inwon || ''}</td>
                <td><input type='text' id='p-yearRate' class='form-control form-control-sm' value="${d.yearRate || ''}" autocomplete="off"></td>
                <td><input type='text' id='p-harinRate' class='form-control form-control-sm' value="${d.harinRate || ''}" autocomplete="off"></td>
              </tr>
              <tr>
                <td colspan='9' class='text-end'>
                  <button id="updatePolicyBtn" class="btn btn-primary btn-sm">
                    <i class="fas fa-save"></i> 수정
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
      document.getElementById('m_policyNum').innerHTML = html;
      
      // 수정 버튼 이벤트 리스너 추가
      const updateBtn = document.getElementById('updatePolicyBtn');
      if (updateBtn) {
        updateBtn.addEventListener('click', () => {
          // TODO: 수정 로직 구현
          alert('수정 기능은 구현 예정입니다.');
        });
      }
      
      // 모달 footer에 보험료 입력 버튼 추가
      const modalFooter = modalElement.querySelector('.modal-footer');
      if (modalFooter) {
        modalFooter.innerHTML = `
          <button type="button" class="btn btn-primary" onclick="kjPolicyPage.openPremiumModal('${d.certi || ''}')">
            <i class="fas fa-edit"></i> 보험료 입력
          </button>
          
        `;
      }
      
      if (d.p_preminum === 1) {
        alert(`${d.certi} 연령별 보험료 입력하세요`);
        kjPolicyPage.openPremiumModal(d.certi);
      }
      await loadInsurancePremiumStats(d.certi);
      modal.show();
    } catch (e) {
      console.error('policy detail error', e);
      alert('데이터 조회 중 오류가 발생했습니다.');
    } finally {
      hideLoading();
    }
  };

  const closePolicyModal = () => {
    const modalElement = document.getElementById('policyNum-modal');
    if (modalElement) {
      const modal = bootstrap.Modal.getInstance(modalElement);
      if (modal) modal.hide();
    }
  };
  const closePremiumModal = () => {
    const modalElement = document.getElementById('po-premium-modal');
    if (modalElement) {
      const modal = bootstrap.Modal.getInstance(modalElement);
      if (modal) modal.hide();
    }
  };

  const loadInsurancePremiumStats = async (certi) => {
    try {
      const res = await fetch(`${API_BASE}/kj-code/policy-num-stats?certi=${encodeURIComponent(certi)}`);
      const data = await res.json();
      if (!data.success) {
        alert(data.error || '통계 조회 실패');
        return;
      }
      renderAgePremiumStats(data);
    } catch (e) {
      console.error('stats error', e);
    }
  };

  const renderAgePremiumStats = (data) => {
    const el = document.getElementById('Insurance_premium_statistics');
    if (!el) return;
    const ageRanges = data.age_range_premiums || {};
    const sortedKeys = Object.keys(ageRanges).sort((a, b) => {
      const aStart = parseInt(a.split('-')[0], 10);
      const bStart = parseInt(b.split('-')[0], 10);
      return aStart - bStart;
    });
    let html = `
      <div class="table-responsive mt-3">
        <table class="table table-bordered table-sm">
          <thead class="thead-light">
            <tr>
              <th style="width: 15%;" class="text-center">연령</th>
              <th style="width: 15%;" class="text-center">인원</th>
              <th style="width: 17.5%;" class="text-end">1/10 보험료</th>
              <th style="width: 17.5%;" class="text-end">회사보험료</th>
              <th style="width: 17.5%;" class="text-end">환산</th>
              <th style="width: 17.5%;" class="text-end">월보험료</th>
            </tr>
          </thead>
          <tbody>
    `;
    sortedKeys.forEach((range) => {
      const r = ageRanges[range];
      html += `
        <tr>
          <td class='text-center'>${r.start_month}~${r.end_month}세</td>
          <td class='text-center'>${r.driver_count}명</td>
          <td class='text-end'>${addComma(r.premium_total)}원</td>
          <td class='text-end'>${addComma(r.total_adjusted_premium)}원</td>
          <td class='text-end'>${addComma(r.total_adjusted_premium_monthly)}원</td>
          <td class='text-end'>${addComma(r.total_month_adjusted_premium)}원</td>
        </tr>
      `;
    });
    html += `
          </tbody>
          <tfoot class="table-light">
            <tr>
              <th class='text-center'>합계</th>
              <th class='text-center'>${data.summary?.total_drivers || 0}명</th>
              <th class='text-end'>${addComma(data.summary?.total_premium)}원</th>
              <th class='text-end'>${addComma(data.summary?.total_adjusted_premium)}원</th>
              <th class='text-end'>${addComma(data.summary?.total_adjusted_premium_monthly)}원</th>
              <th class='text-end'>${addComma(data.summary?.total_month_adjusted_premium)}원</th>
            </tr>
          </tfoot>
        </table>
      </div>
    `;
    el.innerHTML = html;
  };

  const openPremiumModal = async (certi) => {
    buildModalsIfNeeded();
    const modalElement = document.getElementById('po-premium-modal');
    if (!modalElement) return;
    
    const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
    showLoading();
    try {
      const res = await fetch(`${API_BASE}/kj-code/premium-data?certi=${encodeURIComponent(certi)}`);
      const data = await res.json();
      if (!data.success) {
        alert(data.error || '데이터 조회 실패');
        return;
      }
      document.getElementById('po_ceti_daeriCompany').textContent = `증권번호 ${certi}`;
      const tbody = document.getElementById('policyPremiumList');
      tbody.innerHTML = '';
      for (let i = 1; i <= 7; i += 1) {
        const rowData = data.data?.[i - 1] || {};
        const row = document.createElement('tr');
        row.innerHTML = `
          <td class="text-center">${i}</td>
          <td><input type='text' class='form-control form-control-sm' id='po_${i}_1' data-row='${i}' data-col='1' value='${rowData.start_month || ''}' autocomplete="off"></td>
          <td><input type='text' class='form-control form-control-sm' id='po_${i}_2' data-row='${i}' data-col='2' value='${rowData.end_month || ''}' autocomplete="off"></td>
          <td><input type='text' class='form-control form-control-sm text-end' id='po_${i}_6' data-row='${i}' data-col='6' value='${rowData.payment10_premium1 || ''}' autocomplete="off"></td>
          <td><input type='text' class='form-control form-control-sm text-end' id='po_${i}_7' data-row='${i}' data-col='7' value='${rowData.payment10_premium2 || ''}' autocomplete="off"></td>
          <td><input type='text' class='form-control form-control-sm text-end' id='po_${i}_8' data-row='${i}' data-col='8' value='${rowData.payment10_premium_total || ''}' readonly></td>
        `;
        tbody.appendChild(row);
      }
      const saveRow = document.createElement('tr');
      saveRow.innerHTML = `
        <td colspan="6" class="text-center" style="padding:15px;">
          <button id="saveIPremiumButton" class="btn btn-primary">
            <i class="fas fa-save"></i> 저장
          </button>
        </td>
      `;
      tbody.appendChild(saveRow);

      setTimeout(() => {
        for (let i = 1; i <= 7; i += 1) {
          const endEl = document.getElementById(`po_${i}_2`);
          if (endEl) endEl.addEventListener('input', () => autoFillNextRow(i));
          const a6 = document.getElementById(`po_${i}_6`);
          const a7 = document.getElementById(`po_${i}_7`);
          if (a6) a6.addEventListener('input', () => autoSum(i, 6, 7, 8));
          if (a7) a7.addEventListener('input', () => autoSum(i, 6, 7, 8));
          ['1', '2', '6', '7', '8'].forEach((col) => addCommaListener(`po_${i}_${col}`));
        }
        const btn = document.getElementById('saveIPremiumButton');
        if (btn) btn.addEventListener('click', () => savePremiumData(certi));
      }, 50);

      modal.show();
    } catch (e) {
      console.error('premium data error', e);
      alert('데이터 로드 실패.');
    } finally {
      hideLoading();
    }
  };

  const autoSum = (row, c1, c2, target) => {
    const v1 = parseInt(document.getElementById(`po_${row}_${c1}`)?.value.replace(/,/g, ''), 10) || 0;
    const v2 = parseInt(document.getElementById(`po_${row}_${c2}`)?.value.replace(/,/g, ''), 10) || 0;
    const el = document.getElementById(`po_${row}_${target}`);
    if (el) el.value = addComma(v1 + v2);
  };

  const autoFillNextRow = (row) => {
    if (row >= 7) return;
    const endEl = document.getElementById(`po_${row}_2`);
    const nextStart = document.getElementById(`po_${row + 1}_1`);
    if (!endEl || !nextStart) return;
    const endVal = parseInt(endEl.value.replace(/,/g, ''), 10) || 0;
    if (endVal > 0) nextStart.value = addComma(endVal + 1);
  };

  const savePremiumData = (certi) => {
    const premiumData = [];
    for (let i = 1; i <= 7; i += 1) {
      const s = document.getElementById(`po_${i}_1`)?.value.replace(/,/g, '') || '';
      const e = document.getElementById(`po_${i}_2`)?.value.replace(/,/g, '') || '';
      if (!s && !e) continue;
      premiumData.push({
        certi,
        rowNum: i,
        start_month: s,
        end_month: e,
        payment10_premium1: document.getElementById(`po_${i}_6`)?.value.replace(/,/g, '') || '',
        payment10_premium2: document.getElementById(`po_${i}_7`)?.value.replace(/,/g, '') || '',
        payment10_premium_total: document.getElementById(`po_${i}_8`)?.value.replace(/,/g, '') || '',
      });
    }
    if (!premiumData.length) {
      alert('저장할 데이터가 없습니다.');
      return;
    }
    const form = new URLSearchParams();
    premiumData.forEach((item, idx) => {
      Object.keys(item).forEach((k) => form.append(`data[${idx}][${k}]`, item[k]));
    });
    fetch(`${API_BASE}/kj-code/premium-save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    })
      .then((r) => r.text())
      .then((t) => {
        try {
          const result = JSON.parse(t);
          if (result.success) {
            alert('데이터가 성공적으로 저장되었습니다.');
          } else {
            alert(result.error || '저장 실패');
          }
        } catch (e) {
          if (t.includes('성공')) {
            alert('데이터가 저장되었습니다.');
          } else {
            alert('저장 실패: 서버 응답을 처리할 수 없습니다.');
          }
        }
      })
      .catch((e) => {
        console.error('save premium error', e);
        alert('데이터 저장 중 오류가 발생했습니다.');
      });
  };

  const initPage = () => {
    buildPageLayout();
    // 기본 날짜 세팅: 끝 = 오늘, 시작 = 끝 - 1년
    const today = new Date();
    const todayStr = formatDateInput(today);
    const start = new Date();
    start.setFullYear(today.getFullYear() - 1);
    const startStr = formatDateInput(start);
    const fromEl = document.getElementById('fromDate');
    const toEl = document.getElementById('toDate');
    if (fromEl) fromEl.value = startStr;
    if (toEl) toEl.value = todayStr;

    // 검색 버튼 클릭 이벤트
    const searchBtn = document.getElementById('search_btn');
    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        state.currentPage = 1;
        fetchList();
      });
    }

    fetchList();
  };

  window.kjPolicyPage = {
    init: initPage,
    requestSearch: () => {
      state.currentPage = 1;
      fetchList();
    },
    goPage,
    openPolicyDetail,
    closePolicyModal,
    openPremiumModal,
    closePremiumModal,
  };
})();


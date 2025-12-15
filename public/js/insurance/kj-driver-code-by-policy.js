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

    let totalInwon = 0; //

    current.forEach((item, idx) => {
      const insurer = getInsurerName(item.insurance);
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
      const res = await fetch(url.toString());
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
      <div id="policyNum-modal" class="kje-modal" style="display:none;">
        <div class="kje-modal-content">
          <div id="policyNum_daeriCompany"></div>
          <div id="m_policyNum"></div>
          <div id="Insurance_premium_statistics"></div>
          <button class="kje-modal-close" onclick="kjPolicyPage.closePolicyModal()">닫기</button>
        </div>
      </div>
      <div id="po-premium-modal" class="kje-modal" style="display:none;">
        <div class="kje-modal-content">
          <div id="po_ceti_daeriCompany"></div>
          <table class='pjTable'>
            <thead>
              <tr>
                <th>#</th><th>시작월</th><th>종료월</th><th>보험료1</th><th>보험료2</th><th>10회납</th>
              </tr>
            </thead>
            <tbody id="policyPremiumList"></tbody>
          </table>
          <button class="kje-modal-close" onclick="kjPolicyPage.closePremiumModal()">닫기</button>
        </div>
      </div>
      <style>
        .kje-modal { position:fixed; inset:0; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:9999;}
        .kje-modal-content { background:#fff; padding:20px; border-radius:8px; max-height:90vh; overflow:auto; min-width:320px; width:90%; max-width:900px;}
        .kje-modal-close { margin-top:12px; float:right; }
      </style>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
  };

  const openPolicyDetail = async (certi) => {
    buildModalsIfNeeded();
    const modal = document.getElementById('policyNum-modal');
    if (!modal) return;

    // 날짜 기본값
    const today = new Date();
    const todayStr = formatDateInput(today);
    const oneYearAgoStr = formatDateInput(new Date(today.setFullYear(today.getFullYear() - 1)));

    const searchField = `
      <div class="kje-list-header">
        <div class="kje-left-area">
          <div class="kje-search-area">
            <input type='date' id='fromDate' class='date-range-field' value='${oneYearAgoStr}'>
            <input type='date' id='toDate' class='date-range-field' value='${todayStr}'>
            <button class="sms-stats-button" onclick="kjPolicyPage.requestSearch()">검색</button>
            <div id='daily_currentSituation'></div>
          </div>
        </div>
      </div>
    `;
    document.getElementById('policyNum_daeriCompany').innerHTML = searchField;

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
        <table class='pjTable'>
          <thead>
            <tr>
              <th width='15%'>증권번호</th>
              <th width='15%'>회사명</th>
              <th width='15%'>계약자</th>
              <th width='15%'>주민번호</th>
              <th width='10%'>계약일</th>
              <th width='5%'>회차</th>
              <th width='5%'>인원</th>
              <th width='10%'>단체</th>
              <th width='10%'>할인율</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><input type='text' id='p-certi' class='geInput2' value="${d.certi || ''}" autocomplete="off"></td>
              <td><input type='text' id='p-company' class='geInput2' value="${d.company || ''}" autocomplete="off"></td>
              <td><input type='text' id='p-name' class='geInput2' value="${d.name || ''}" autocomplete="off"></td>
              <td><input type='text' id='p-jumin' class='geInput2' value="${d.jumin || ''}" autocomplete="off"></td>
              <td><input type='date' id='p-sigi' class='geInput2' value="${d.sigi || ''}" autocomplete="off"></td>
              <td><input type='text' id='p-nab' class='geInput2' value="${d.nab || ''}" autocomplete="off"></td>
              <td class='center-align'>${d.inwon || ''}</td>
              <td><input type='text' id='p-yearRate' class='geInput2' value="${d.yearRate || ''}" autocomplete="off"></td>
              <td><input type='text' id='p-harinRate' class='geInput2' value="${d.harinRate || ''}" autocomplete="off"></td>
            </tr>
            <tr>
              <td colspan='9' class='right-align'>
                <button onclick="kjPolicyPage.openPremiumModal('${d.certi || ''}')" class="save-button" style="padding:4px 10px;">보험료 입력</button>
              </td>
            </tr>
          </tbody>
        </table>
      `;
      document.getElementById('m_policyNum').innerHTML = html;
      if (d.p_preminum === 1) {
        alert(`${d.certi} 연령별 보험료 입력하세요`);
        kjPolicyPage.openPremiumModal(d.certi);
      }
      await loadInsurancePremiumStats(d.certi);
      modal.style.display = 'flex';
    } catch (e) {
      console.error('policy detail error', e);
      alert('데이터 조회 중 오류가 발생했습니다.');
    } finally {
      hideLoading();
    }
  };

  const closePolicyModal = () => {
    const modal = document.getElementById('policyNum-modal');
    if (modal) modal.style.display = 'none';
  };
  const closePremiumModal = () => {
    const modal = document.getElementById('po-premium-modal');
    if (modal) modal.style.display = 'none';
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
      <table class='pjTable'>
        <thead>
          <tr>
            <th width='15%' class='center-align'>연령</th>
            <th width='15%' class='center-align'>인원</th>
            <th width='17.5%' class='center-align'>1/10 보험료</th>
            <th width='17.5%' class='center-align'>회사보험료</th>
            <th width='17.5%' class='center-align'>환산</th>
            <th width='17.5%' class='center-align'>월보험료</th>
          </tr>
        </thead>
        <tbody>
    `;
    sortedKeys.forEach((range) => {
      const r = ageRanges[range];
      html += `
        <tr>
          <td class='center-align'>${r.start_month}~${r.end_month}세</td>
          <td class='center-align'>${r.driver_count}명</td>
          <td class='right-align'>${addComma(r.premium_total)}원</td>
          <td class='right-align'>${addComma(r.total_adjusted_premium)}원</td>
          <td class='right-align'>${addComma(r.total_adjusted_premium_monthly)}원</td>
          <td class='right-align'>${addComma(r.total_month_adjusted_premium)}원</td>
        </tr>
      `;
    });
    html += `
        </tbody>
        <tfoot>
          <tr>
            <th class='center-align'>합계</th>
            <th class='center-align'>${data.summary?.total_drivers || 0}명</th>
            <th class='right-align'>${addComma(data.summary?.total_premium)}원</th>
            <th class='right-align'>${addComma(data.summary?.total_adjusted_premium)}원</th>
            <th class='right-align'>${addComma(data.summary?.total_adjusted_premium_monthly)}원</th>
            <th class='right-align'>${addComma(data.summary?.total_month_adjusted_premium)}원</th>
          </tr>
        </tfoot>
      </table>
    `;
    el.innerHTML = html;
  };

  const openPremiumModal = async (certi) => {
    buildModalsIfNeeded();
    const modal = document.getElementById('po-premium-modal');
    if (!modal) return;
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
          <td>${i}</td>
          <td><input type='text' class='geInput_p' id='po_${i}_1' data-row='${i}' data-col='1' value='${rowData.start_month || ''}' autocomplete="off"></td>
          <td><input type='text' class='geInput_p' id='po_${i}_2' data-row='${i}' data-col='2' value='${rowData.end_month || ''}' autocomplete="off"></td>
          <td><input type='text' class='geInput_p' id='po_${i}_6' data-row='${i}' data-col='6' value='${rowData.payment10_premium1 || ''}' autocomplete="off"></td>
          <td><input type='text' class='geInput_p' id='po_${i}_7' data-row='${i}' data-col='7' value='${rowData.payment10_premium2 || ''}' autocomplete="off"></td>
          <td><input type='text' class='geInput_p' id='po_${i}_8' data-row='${i}' data-col='8' value='${rowData.payment10_premium_total || ''}' readonly></td>
        `;
        tbody.appendChild(row);
      }
      const saveRow = document.createElement('tr');
      saveRow.innerHTML = `
        <td colspan="9" style="text-align:center;padding:15px;">
          <button id="saveIPremiumButton" class="save-button" style="padding:8px 20px;">저장</button>
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

      modal.style.display = 'flex';
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


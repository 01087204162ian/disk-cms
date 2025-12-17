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
    if (val === null || val === undefined || val === '') return '';
    const cleaned = String(val).replace(/,/g, '').trim();
    if (cleaned === '') return '';
    const num = Number(cleaned);
    if (!Number.isFinite(num) || num === 0) return '';
    return num.toLocaleString('ko-KR');
  };

  const addCommaListener = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', (e) => {
      const caret = el.selectionStart;
      const currentValue = el.value;
      // 빈 문자열이면 그대로 유지
      if (currentValue === '' || currentValue.trim() === '') {
        el.value = '';
        return;
      }
      const formatted = addComma(currentValue);
      el.value = formatted;
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
                  <thead class="thead-light" style="background-color: #6f42c1; color: white;">
                    <tr>
                      <th class="text-center">순번</th>
                      <th class="text-center" colspan="2">나이</th>
                      <th class="text-center" colspan="3">10회분납</th>
                    </tr>
                    <tr style="background-color: #6f42c1; color: white;">
                      <th></th>
                      <th class="text-center">시작</th>
                      <th class="text-center">끝</th>
                      <th class="text-center">년기본</th>
                      <th class="text-center">년특약</th>
                      <th class="text-center">년계</th>
                    </tr>
                  </thead>
                  <tbody id="policyPremiumList"></tbody>
                </table>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-primary" id="saveInsurancePremiumButton">
                <i class="fas fa-save"></i> 저장
              </button>
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
      // 담당자별 데이터 포함하여 조회
      const res = await fetch(`${API_BASE}/kj-code/policy-num-stats?certi=${encodeURIComponent(certi)}&by_manager=1`);
      
      // HTTP 상태 코드 확인
      if (!res.ok) {
        alert(`통계 조회 실패: HTTP ${res.status} 오류가 발생했습니다.`);
        return;
      }
      
      const data = await res.json();
      if (!data.success) {
        alert(data.error || data.message || '통계 조회 실패');
        return;
      }
      renderAgePremiumStats(data);
    } catch (e) {
      console.error('stats error', e);
      alert('통계 조회 중 오류가 발생했습니다: ' + (e.message || '알 수 없는 오류'));
    }
  };

  const renderAgePremiumStats = (data) => {
    const el = document.getElementById('Insurance_premium_statistics');
    if (!el) return;

    // 대리기사 정보가 없거나 데이터가 없는 경우 빈 화면 표시
    if ((!data.managers || data.managers.length === 0) && (!data.age_ranges || data.age_ranges.length === 0)) {
      el.innerHTML = '';
      return;
    }

    let html = '';

    // 담당자별 데이터가 있는 경우//
    if (data.managers && data.managers.length > 0) {
      // 각 담당자별 테이블 생성
      data.managers.forEach((manager) => {
        html += `
          <div class="card mb-3">
            <div class="card-header bg-light">
              <h6 class="mb-0"><strong>담당자: ${manager.manager_name}</strong></h6>
            </div>
            <div class="card-body p-0">
              <div class="table-responsive">
                <table class="table table-bordered table-sm mb-0">
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
        
        manager.age_ranges.forEach((range) => {
          html += `
            <tr>
              <td class='text-center' style='white-space: nowrap; overflow: visible;'>${range.age_range}</td>
              <td class='text-center'>${range.driver_count}명</td>
              <td class='text-end'>${addComma(range.payment10_premium1)}원</td>
              <td class='text-end'>${addComma(range.company_premium)}원</td>
              <td class='text-end'>${addComma(range.converted_premium)}원</td>
              <td class='text-end'>${addComma(range.monthly_premium)}원</td>
            </tr>
          `;
        });

        html += `
                  </tbody>
                  <tfoot class="table-light">
                    <tr>
                      <th class='text-center'>소계</th>
                      <th class='text-center'>${manager.subtotal.total_drivers}명</th>
                      <th class='text-end'>-</th>
                      <th class='text-end'>${addComma(manager.subtotal.total_company_premium)}원</th>
                      <th class='text-end'>${addComma(manager.subtotal.total_converted_premium)}원</th>
                      <th class='text-end'>${addComma(manager.subtotal.total_monthly_premium)}원</th>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        `;
      });

      // 전체 합계 테이블
      if (data.grand_total) {
        html += `
          <div class="card mb-3 border-primary">
            <div class="card-header bg-primary text-white">
              <h6 class="mb-0"><strong>전체 합계</strong></h6>
            </div>
            <div class="card-body p-0">
              <div class="table-responsive">
                <table class="table table-bordered table-sm mb-0">
                  <thead class="thead-light">
                    <tr>
                      <th style="width: 15%;" class="text-center">항목</th>
                      <th style="width: 15%;" class="text-center">인원</th>
                      <th style="width: 17.5%;" class="text-end">1/10 보험료</th>
                      <th style="width: 17.5%;" class="text-end">회사보험료</th>
                      <th style="width: 17.5%;" class="text-end">환산</th>
                      <th style="width: 17.5%;" class="text-end">월보험료</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td class='text-center'><strong>합계</strong></td>
                      <td class='text-center'><strong>${data.grand_total.total_drivers}명</strong></td>
                      <td class='text-end'><strong>-</strong></td>
                      <td class='text-end'><strong>${addComma(data.grand_total.total_company_premium)}원</strong></td>
                      <td class='text-end'><strong>${addComma(data.grand_total.total_converted_premium)}원</strong></td>
                      <td class='text-end'><strong>${addComma(data.grand_total.total_monthly_premium)}원</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        `;
      }
    } else {
      // 담당자별 데이터가 없는 경우 기존 방식 (전체 통계만)
      const ageRanges = data.age_ranges || [];
      html = `
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
      ageRanges.forEach((range) => {
        html += `
          <tr>
            <td class='text-center' style='white-space: nowrap; overflow: visible;'>${range.age_range}</td>
            <td class='text-center'>${range.driver_count}명</td>
            <td class='text-end'>${addComma(range.payment10_premium1)}원</td>
            <td class='text-end'>${addComma(range.company_premium)}원</td>
            <td class='text-end'>${addComma(range.converted_premium)}원</td>
            <td class='text-end'>${addComma(range.monthly_premium)}원</td>
          </tr>
        `;
      });
      html += `
            </tbody>
            <tfoot class="table-light">
              <tr>
                <th class='text-center'>합계</th>
                <th class='text-center'>${data.summary?.total_drivers || 0}명</th>
                <th class='text-end'>${addComma(data.summary?.total_payment10_premium1)}원</th>
                <th class='text-end'>${addComma(data.summary?.total_company_premium)}원</th>
                <th class='text-end'>${addComma(data.summary?.total_converted_premium)}원</th>
                <th class='text-end'>${addComma(data.summary?.total_monthly_premium)}원</th>
              </tr>
            </tfoot>
          </table>
        </div>
      `;
    }

    el.innerHTML = html;
  };

  const openPremiumModal = async (certi) => {
    buildModalsIfNeeded();
    const modalElement = document.getElementById('po-premium-modal');
    if (!modalElement) return;
    
    const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
    showLoading();
    try {
      // 증권 정보 조회 (보험회사 코드 가져오기)
      let insurerName = '';
      try {
        const certiParams = new URLSearchParams();
        certiParams.append('num', certi);
        const certiRes = await fetch(`${API_BASE}/kj-code/policy-num-detail`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: certiParams.toString(),
        });
        if (certiRes.ok) {
          const certiData = await certiRes.json();
          if (certiData.success && certiData.data && certiData.data[0]) {
            const insuranceCode = certiData.data[0].insurance;
            insurerName = getInsurerLabel(insuranceCode);
          }
        }
      } catch (e) {
        console.error('증권 정보 조회 오류:', e);
      }
      
      // kj_insurance_premium_data 조회
      const res = await fetch(`${API_BASE}/kj-insurance-premium-data?policyNum=${encodeURIComponent(certi)}`);
      const data = await res.json();
      if (!data.success) {
        alert(data.error || '데이터 조회 실패');
        return;
      }
      
      // 모달 제목에 보험회사와 증권번호 표시
      const titleText = insurerName ? `${insurerName} ${certi}` : certi;
      document.getElementById('po_ceti_daeriCompany').textContent = titleText;
      const tbody = document.getElementById('policyPremiumList');
      tbody.innerHTML = '';
      
      // 기존 데이터가 있으면 표시, 없으면 빈 행 7개 생성
      const existingData = data.data || [];
      const hasExistingData = existingData.length > 0;
      const dataMap = {};
      existingData.forEach(item => {
        dataMap[item.rowNum] = item;
      });
      
      // 버튼 텍스트 설정 (기존 데이터가 있으면 "수정", 없으면 "저장")
      const saveBtn = document.getElementById('saveInsurancePremiumButton');
      if (saveBtn) {
        saveBtn.innerHTML = hasExistingData 
          ? '<i class="fas fa-save"></i> 수정'
          : '<i class="fas fa-save"></i> 저장';
      }
      
      for (let i = 1; i <= 7; i += 1) {
        const rowData = dataMap[i] || {};
        const row = document.createElement('tr');
        // 0이나 null, undefined인 경우 빈 문자열 표시
        const formatValue = (val) => {
          if (val === null || val === undefined || val === '' || val === 0 || val === '0') return '';
          return addComma(val);
        };
        const formatMonth = (val) => {
          if (val === null || val === undefined || val === '' || val === 0 || val === '0') return '';
          return val;
        };
        row.innerHTML = `
          <td class="text-center">${i}</td>
          <td><input type='text' class='form-control form-control-sm' id='po_${i}_1' data-row='${i}' data-col='1' value='${formatMonth(rowData.start_month)}' autocomplete="off"></td>
          <td><input type='text' class='form-control form-control-sm' id='po_${i}_2' data-row='${i}' data-col='2' value='${formatMonth(rowData.end_month)}' autocomplete="off"></td>
          <td><input type='text' class='form-control form-control-sm text-end' id='po_${i}_3' data-row='${i}' data-col='3' value='${formatValue(rowData.payment10_premium1)}' autocomplete="off"></td>
          <td><input type='text' class='form-control form-control-sm text-end' id='po_${i}_4' data-row='${i}' data-col='4' value='${formatValue(rowData.payment10_premium2)}' autocomplete="off"></td>
          <td><input type='text' class='form-control form-control-sm text-end' id='po_${i}_5' data-row='${i}' data-col='5' value='${formatValue(rowData.payment10_premium_total)}' readonly></td>
        `;
        tbody.appendChild(row);
      }

      setTimeout(() => {
        for (let i = 1; i <= 7; i += 1) {
          const endEl = document.getElementById(`po_${i}_2`);
          if (endEl) endEl.addEventListener('input', () => autoFillNextRow(i));
          const a3 = document.getElementById(`po_${i}_3`);
          const a4 = document.getElementById(`po_${i}_4`);
          if (a3) a3.addEventListener('input', () => autoSum(i, 3, 4, 5));
          if (a4) a4.addEventListener('input', () => autoSum(i, 3, 4, 5));
          ['1', '2', '3', '4', '5'].forEach((col) => addCommaListener(`po_${i}_${col}`));
        }
        const btn = document.getElementById('saveInsurancePremiumButton');
        if (btn) {
          btn.onclick = () => saveInsurancePremiumData(certi);
        }
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
    const v1Str = document.getElementById(`po_${row}_${c1}`)?.value.replace(/,/g, '').trim() || '';
    const v2Str = document.getElementById(`po_${row}_${c2}`)?.value.replace(/,/g, '').trim() || '';
    const v1 = v1Str ? parseInt(v1Str, 10) : 0;
    const v2 = v2Str ? parseInt(v2Str, 10) : 0;
    const sum = v1 + v2;
    const el = document.getElementById(`po_${row}_${target}`);
    if (el) {
      // 둘 다 비어있으면 빈 문자열, 합이 0이면 빈 문자열
      if ((!v1Str && !v2Str) || sum === 0) {
        el.value = '';
      } else {
        el.value = addComma(sum);
      }
    }
  };

  const saveInsurancePremiumData = async (certi) => {
    const premiumData = [];
    
    // 검증: 시작 나이가 없는데 보험료가 있는 경우 체크
    for (let i = 1; i <= 7; i += 1) {
      const startMonth = document.getElementById(`po_${i}_1`)?.value.replace(/,/g, '').trim() || '';
      const endMonth = document.getElementById(`po_${i}_2`)?.value.replace(/,/g, '').trim() || '';
      const payment10Premium1 = document.getElementById(`po_${i}_3`)?.value.replace(/,/g, '').trim() || '';
      const payment10Premium2 = document.getElementById(`po_${i}_4`)?.value.replace(/,/g, '').trim() || '';
      
      // 시작 나이가 없는데 보험료가 있는 경우 검증
      if (!startMonth && (payment10Premium1 || payment10Premium2)) {
        alert(`${i}번째 행: 시작 나이를 입력하세요.`);
        // 해당 행의 시작 나이 입력 필드로 포커스 이동
        const startMonthInput = document.getElementById(`po_${i}_1`);
        if (startMonthInput) {
          startMonthInput.focus();
        }
        return;
      }
      
      // 하나라도 입력되어 있으면 저장 대상에 포함
      if (startMonth || endMonth || payment10Premium1 || payment10Premium2) {
        premiumData.push({
          rowNum: i,
          start_month: startMonth || null,
          end_month: endMonth || null,
          payment10_premium1: payment10Premium1 || null,
          payment10_premium2: payment10Premium2 || null,
          payment10_premium_total: null, // 서버에서 자동 계산
        });
      }
    }
    
    if (!premiumData.length) {
      alert('저장할 데이터가 없습니다.');
      return;
    }
    
    try {
      const res = await fetch(`${API_BASE}/kj-insurance-premium-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          policyNum: certi,
          data: premiumData
        }),
      });
      
      const result = await res.json();
      if (result.success) {
        const actionText = result.deleted > 0 ? '수정' : '저장';
        alert(`보험료 데이터가 ${actionText}되었습니다.`);
        // 버튼 텍스트를 "수정"으로 변경 (이제 데이터가 있으므로)
        const saveBtn = document.getElementById('saveInsurancePremiumButton');
        if (saveBtn) {
          saveBtn.innerHTML = '<i class="fas fa-save"></i> 수정';
        }
        // 모달의 데이터 새로고침 (서버에서 최신 데이터 다시 조회)
        const refreshRes = await fetch(`${API_BASE}/kj-insurance-premium-data?policyNum=${encodeURIComponent(certi)}`);
        const refreshData = await refreshRes.json();
        if (refreshData.success) {
          const tbody = document.getElementById('policyPremiumList');
          tbody.innerHTML = '';
          const existingData = refreshData.data || [];
          const dataMap = {};
          existingData.forEach(item => {
            dataMap[item.rowNum] = item;
          });
          
          for (let i = 1; i <= 7; i += 1) {
            const rowData = dataMap[i] || {};
            const row = document.createElement('tr');
            // 0이나 null, undefined인 경우 빈 문자열 표시
            const formatValue = (val) => {
              if (val === null || val === undefined || val === '' || val === 0 || val === '0') return '';
              return addComma(val);
            };
            const formatMonth = (val) => {
              if (val === null || val === undefined || val === '' || val === 0 || val === '0') return '';
              return val;
            };
            row.innerHTML = `
              <td class="text-center">${i}</td>
              <td><input type='text' class='form-control form-control-sm' id='po_${i}_1' data-row='${i}' data-col='1' value='${formatMonth(rowData.start_month)}' autocomplete="off"></td>
              <td><input type='text' class='form-control form-control-sm' id='po_${i}_2' data-row='${i}' data-col='2' value='${formatMonth(rowData.end_month)}' autocomplete="off"></td>
              <td><input type='text' class='form-control form-control-sm text-end' id='po_${i}_3' data-row='${i}' data-col='3' value='${formatValue(rowData.payment10_premium1)}' autocomplete="off"></td>
              <td><input type='text' class='form-control form-control-sm text-end' id='po_${i}_4' data-row='${i}' data-col='4' value='${formatValue(rowData.payment10_premium2)}' autocomplete="off"></td>
              <td><input type='text' class='form-control form-control-sm text-end' id='po_${i}_5' data-row='${i}' data-col='5' value='${formatValue(rowData.payment10_premium_total)}' readonly></td>
            `;
            tbody.appendChild(row);
          }
          
          // 이벤트 리스너 다시 설정
          setTimeout(() => {
            for (let i = 1; i <= 7; i += 1) {
              const endEl = document.getElementById(`po_${i}_2`);
              if (endEl) endEl.addEventListener('input', () => autoFillNextRow(i));
              const a3 = document.getElementById(`po_${i}_3`);
              const a4 = document.getElementById(`po_${i}_4`);
              if (a3) a3.addEventListener('input', () => autoSum(i, 3, 4, 5));
              if (a4) a4.addEventListener('input', () => autoSum(i, 3, 4, 5));
              ['1', '2', '3', '4', '5'].forEach((col) => addCommaListener(`po_${i}_${col}`));
            }
          }, 50);
        }
        // 통계 새로고침 (모달은 닫지 않음)
        await loadInsurancePremiumStats(certi);
      } else {
        alert(result.error || '저장 실패');
      }
    } catch (e) {
      console.error('save insurance premium error', e);
      alert('데이터 저장 중 오류가 발생했습니다.');
    }
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


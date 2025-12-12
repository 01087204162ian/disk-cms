// KJ 대리운전 업체 목록 - 프론트 스크립트
// API: GET /api/insurance/kj-company/list?page=&limit=&getDay=&damdanja=&s_contents=

(function () {
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
          <td colspan="6" class="text-center py-4">데이터가 없습니다.</td>
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
        <td colspan="6" class="text-center py-4">데이터를 불러오는 중...</td>
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
          <td colspan="6" class="text-center text-danger py-4">오류가 발생했습니다.</td>
        </tr>`;
      mobileCards.innerHTML = `<div class="text-center text-danger py-4">오류가 발생했습니다.</div>`;
      paginationInfo.textContent = '';
      paginationControls.innerHTML = '';
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

  // ==================== 모달 관련 ====================

  // 대리운전회사 모달 열기 (kj-driver-search.js와 동일한 함수)
  const openCompanyModal = (companyNum, companyName) => {
    const modal = new bootstrap.Modal(document.getElementById('companyInfoModal'));
    const modalBody = document.getElementById('companyInfoModalBody');
    
    modalBody.innerHTML = `
      <div class="text-center py-4">
        <div class="spinner-border" role="status">
          <span class="visually-hidden">로딩 중...</span>
        </div>
        <p class="mt-2">회사 정보를 불러오는 중...</p>
      </div>
    `;
    
    modal.show();
    
    // API 호출
    fetch(`/api/insurance/kj-company/${companyNum}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          renderCompanyModal(data, companyName);
        } else {
          throw new Error(data.error || '회사 정보를 불러올 수 없습니다.');
        }
      })
      .catch(err => {
        console.error('회사 정보 로드 오류:', err);
        modalBody.innerHTML = `
          <div class="alert alert-danger">
            <i class="fas fa-exclamation-circle"></i>
            회사 정보를 불러올 수 없습니다: ${err.message}
          </div>
        `;
      });
  };

  // 보험사/성격 옵션
  const INSURER_OPTIONS = [
    { value: 0, label: '=선택=' },
    { value: 1, label: '흥국' },
    { value: 2, label: 'DB' },
    { value: 3, label: 'KB' },
    { value: 4, label: '현대' },
    { value: 5, label: '롯데' },
    { value: 6, label: '더 케이' },
    { value: 7, label: 'MG' },
    { value: 8, label: '삼성' },
    { value: 9, label: '메리츠' },
  ];

  const GITA_OPTIONS = [
    { value: 1, label: '일반' },
    { value: 2, label: '탁송' },
    { value: 3, label: '일반/렌트' },
    { value: 4, label: '탁송/렌트' },
    { value: 5, label: '전차량' },
  ];

  // 회사 정보 모달 렌더링 (구 버전과 동일한 구조)
  const renderCompanyModal = (data, companyName) => {
    const modalBody = document.getElementById('companyInfoModalBody');
    
    const company = data;
    const certiData = data.data || [];
    const memoData = data.memoData || [];
    const smsData = data.smsData || [];
    const contentData = data.content || [];
    const inWonTotal = data.inWonTotal || 0;
    
    // 보험사 코드 매핑
    const mapInsuranceCompany = (code) => {
      const map = { 1: '흥국', 2: 'DB', 3: 'KB', 4: '현대', 5: '한화', 6: '더케이', 7: 'MG', 8: '삼성' };
      return map[code] || '=선택=';
    };
    
    // 결제 방식 매핑
    const mapDivi = (divi) => {
      return divi == 1 ? '정상' : (divi == 2 ? '1/12씩' : '정상');
    };
    
    // 납입 상태 색상
    const getNaStateColor = (naColor) => {
      if (naColor == 1) return '#666666';
      if (naColor == 2) return 'red';
      return '#666666';
    };
    
    // 테이블 행 렌더링
    const renderCertiRow = (certi = {}, idx = 0, isNew = false) => {
      const bgClass = idx % 2 === 0 ? 'table-light' : '';
      const naStateColor = certi.naColor ? getNaStateColor(certi.naColor) : '#666666';
      const naStateText = certi.naState || '';
      const giganText = certi.gigan ? `(${Math.floor(certi.gigan)}일)` : '';

      const insurerOptions = INSURER_OPTIONS.map(opt =>
        `<option value="${opt.value}" ${Number(certi.InsuraneCompany) === opt.value ? 'selected' : ''}>${opt.label}</option>`
      ).join('');

      const gitaOptions = GITA_OPTIONS.map(opt =>
        `<option value="${opt.value}" ${Number(certi.gita) === opt.value || Number(certi.gitaName) === opt.value ? 'selected' : ''}>${opt.label}</option>`
      ).join('');

      const requiredFilled = Boolean(
        Number(certi.InsuraneCompany) &&
        certi.startyDay &&
        certi.policyNum &&
        certi.nabang
      );

      return `
        <tr class="${bgClass}" data-row-index="${idx}">
          <td>${idx + 1}</td>
          <td>
            <select class="form-select form-select-sm certi-field insurer-select" data-field="InsuraneCompany">
              ${insurerOptions}
            </select>
          </td>
          <td>
            <input type="date" class="form-control form-control-sm certi-field" data-field="startyDay" value="${certi.startyDay || ''}">
          </td>
          <td>
            <input type="text" class="form-control form-control-sm certi-field" data-field="policyNum" value="${certi.policyNum || ''}">
          </td>
          <td>
            <input type="text" class="form-control form-control-sm certi-field" data-field="nabang" value="${certi.nabang || ''}">
          </td>
          <td>
            <button class="btn btn-sm btn-outline-primary certi-save-btn" ${requiredFilled ? '' : 'disabled'}>
              ${certi.num ? '수정' : '저장'}
            </button>
          </td>
          <td>
            <select class="form-select form-select-sm certi-field" data-field="nabang_1" ${certi.num ? '' : 'disabled'}>
              ${Array.from({ length: 10 }, (_, i) => i + 1).map(v => `<option value="${v}" ${Number(certi.nabang_1) === v ? 'selected' : ''}>${v}회차</option>`).join('')}
            </select>
          </td>
          <td style="color: ${naStateColor};">
            ${naStateText}${giganText}
          </td>
          <td>
            <button class="btn btn-sm btn-outline-secondary certi-member-btn" ${certi.num ? '' : 'disabled'}>인원</button>
          </td>
          <td>
            <button class="btn btn-sm btn-outline-success certi-new-member-btn" ${certi.num ? '' : 'disabled'}>신규</button>
          </td>
          <td>
            <button class="btn btn-sm btn-outline-warning certi-endorse-btn" ${certi.num ? '' : 'disabled'}>배서</button>
          </td>
          <td>
            <button class="btn btn-sm btn-outline-dark certi-divi-btn" data-divi="${certi.divi || 1}">
              ${mapDivi(certi.divi || 1)}
            </button>
          </td>
          <td>
            <button class="btn btn-sm btn-outline-info certi-premium-btn" ${certi.num ? '' : 'disabled'}>
              ${certi.divi == 2 ? '보험료' : '입력'}
            </button>
          </td>
          <td>
            <select class="form-select form-select-sm certi-field" data-field="gita">
              ${gitaOptions}
            </select>
          </td>
        </tr>
      `;
    };

    let html = `
      <div class="mb-3">
        <h6>기본 정보</h6>
        <div class="row">
          <div class="col-12">
            <table class="table table-sm table-bordered mb-0">
              <tr>
                <th class="bg-light">주민번호</th>
                <td>${company.jumin || ''}</td>
                <th class="bg-light">대리운전회사</th>
                <td>${company.company || companyName || ''}</td>
                <th class="bg-light">성명</th>
                <td>${company.Pname || ''}</td>
                <th class="bg-light">핸드폰번호</th>
                <td>${company.hphone || ''}</td>
              </tr>
              <tr>
                <th class="bg-light">전화번호</th>
                <td>${company.cphone || ''}</td>
                <th class="bg-light">담당자</th>
                <td>${company.name || company.damdanga || ''}</td>
                <th class="bg-light">팩스</th>
                <td>${company.fax || ''}</td>
                <th class="bg-light">사업자번호</th>
                <td>${company.cNumber || ''}</td>
              </tr>
              <tr>
                <th class="bg-light">법인번호</th>
                <td>${company.lNumber || ''}</td>
                <th class="bg-light">보험료 받는날</th>
                <td>${company.FirstStart || ''}</td>
                <th class="bg-light">읽기 전용 ID</th>
                <td colspan="3">${company.mem_id || ''}${company.permit == 1 ? '허용' : (company.permit == 2 ? '차단' : '')}</td>
              </tr>
              <tr>
                <th class="bg-light">주소</th>
                <td colspan="7">${company.postNum || ''} ${company.address1 || ''} ${company.address2 || ''}</td>
              </tr>
            </table>
          </div>
        </div>
      </div>
      
      <hr>
      
      <div class="mb-3">
        <h6>증권 정보</h6>
        <div class="table-responsive">
          <table class="table table-sm table-bordered" style="font-size: 0.85rem;">
            <thead class="thead-light">
              <tr>
                <th style="width: 4%;">순번</th>
                <th style="width: 8%;">보험사</th>
                <th style="width: 8%;">시작일</th>
                <th style="width: 11%;">증권번호</th>
                <th style="width: 5%;">분납</th>
                <th style="width: 8%;">저장</th>
                <th style="width: 7%;">회차</th>
                <th style="width: 6%;">상태</th>
                <th style="width: 6%;">인원</th>
                <th style="width: 6%;">신규<br>입력</th>
                <th style="width: 6%;">운전자<Br>추가</th>
                <th style="width: 7%;">결제<Br>방식</th>
                <th style="width: 7%;">월보험료</th>
                <th style="width: 10%;">성격</th>
              </tr>
            </thead>
            <tbody>
    `;
    
    // 증권 데이터 렌더링 (기존 개수 + 1 신규 입력행, 최대 10행)
    const certiRowCount = Math.min((certiData.length || 0) + 1, 10);
    for (let i = 0; i < certiRowCount; i++) {
      const certi = certiData[i] || {};
      html += renderCertiRow(certi, i, !certi.num);
    }
    
    html += `
            </tbody>
            <tfoot>
              <tr>
                <td colspan="8" class="text-end"><strong>계</strong></td>
                <td><strong>${inWonTotal.toLocaleString()}</strong></td>
                <td colspan="5"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    `;
    
    // 메모 목록
    if (memoData.length > 0 || contentData.length > 0) {
      html += `
        <hr>
        <div class="mb-3">
          <h6>메모</h6>
          <div class="table-responsive">
            <table class="table table-sm table-bordered" style="font-size: 0.85rem;">
              <thead class="thead-light">
                <tr>
                  <th style="width: 5%;">순번</th>
                  <th style="width: 10%;">날자</th>
                  <th style="width: 5%;">종류</th>
                  <th style="width: 40%;">내용</th>
                </tr>
              </thead>
              <tbody>
      `;
      
      memoData.slice(0, 10).forEach((memo, idx) => {
        const bgClass = idx % 2 === 0 ? 'table-light' : '';
        html += `
          <tr class="${bgClass}">
            <td>${idx + 1}</td>
            <td>${memo.wdate || ''}</td>
            <td>${memo.memokindName || '일반'}</td>
            <td>${memo.memo || ''}</td>
          </tr>
        `;
      });
      
      // 증권별 메모 내용
      if (contentData.length > 0) {
        html += `
          <tr>
            <td colspan="4">
              <textarea class="form-control" rows="3" readonly>${contentData.join('\n')}</textarea>
            </td>
          </tr>
        `;
      }
      
      html += `
              </tbody>
            </table>
          </div>
        </div>
      `;
    }
    
    // SMS 목록
    if (smsData.length > 0) {
      html += `
        <hr>
        <div class="mb-3">
          <h6>SMS 목록</h6>
          <div class="table-responsive">
            <table class="table table-sm table-bordered" style="font-size: 0.85rem;">
              <thead class="thead-light">
                <tr>
                  <th style="width: 5%;">번호</th>
                  <th style="width: 20%;">발송일</th>
                  <th>메세지</th>
                  <th style="width: 10%;">회사</th>
                  <th style="width: 10%;">결과</th>
                </tr>
              </thead>
              <tbody>
      `;
      
      smsData.slice(0, 10).forEach((sms, idx) => {
        const bgClass = idx % 2 === 0 ? 'table-light' : '';
        const textColor = sms.get == 2 ? '#0A8FC1' : '';
        html += `
          <tr class="${bgClass}">
            <td>${idx + 1}</td>
            <td style="color: ${textColor};">${sms.dates || ''}</td>
            <td style="color: ${textColor};">${sms.Msg || ''}</td>
            <td style="color: ${textColor};">${sms.comName || ''}</td>
            <td>${sms.get == 2 ? '수신' : ''}</td>
          </tr>
        `;
      });
      
      html += `
              </tbody>
            </table>
          </div>
        </div>
      `;
    }
    
    modalBody.innerHTML = html;
  };

  // 모달 트리거 이벤트 위임 (kj-driver-search.js와 동일)
  document.addEventListener('click', (e) => {
    if (e.target.matches('[data-role="open-company-modal"]') || 
        e.target.closest('[data-role="open-company-modal"]')) {
      e.preventDefault();
      const link = e.target.closest('[data-role="open-company-modal"]') || e.target;
      const companyNum = link.dataset.companyNum;
      const companyName = link.dataset.companyName;
      if (companyNum) {
        openCompanyModal(companyNum, companyName);
      }
    }
  });

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
          <td colspan="6" class="text-center py-4">날짜를 선택해 주세요.</td>
        </tr>`;
      mobileCards.innerHTML = `<div class="text-center py-4">날짜를 선택해 주세요.</div>`;
    }
  })();
})();


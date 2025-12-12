// KJ 대리운전 기사 찾기 - 프론트 스크립트
// API: GET /api/insurance/kj-driver/list?page=&limit=&name=&jumin=&status=

(function () {
  const tableBody = document.getElementById('driver_search_table_body');
  const mobileCards = document.getElementById('driver_search_mobile_cards');
  const paginationInfo = document.getElementById('pagination_info');
  const paginationControls = document.getElementById('pagination_controls');

  const searchTypeFilter = document.getElementById('searchTypeFilter');
  const statusFilter = document.getElementById('statusFilter');
  const pageSizeSelect = document.getElementById('pageSize');
  const searchInput = document.getElementById('search_word');
  const searchBtn = document.getElementById('search_btn');

  let currentPage = 1;
  let currentLimit = 20;
  let currentPagination = { page: 1, limit: 20, total: 0, totalPages: 1 };

  // ==================== 매핑 함수 ====================

  // push 상태 라벨 매핑
  const mapPushLabel = (push) => {
    const p = String(push);
    switch (p) {
      case '1': return '청약중';
      case '2': return '해지';
      case '4': return '정상';
      case '5': return '거절';
      case '6': return '취소';
      case '7': return '실효';
      default: return '기타';
    }
  };

  // etag 증권성격 매핑
  const mapEtagLabel = (etag) => {
    const e = String(etag || '1');
    switch (e) {
      case '1': return '일반';
      case '2': return '탁송';
      case '3': return '일반/렌트';
      case '4': return '탁송/렌트';
      case '5': return '전차량';
      default: return '일반';
    }
  };

  // sago 사고 매핑
  const mapSagoLabel = (sago) => {
    const s = String(sago || '1');
    return s === '2' ? '사고있음' : '사고없음';
  };

  // ==================== 렌더링 헬퍼 ====================

  // 상태 컬럼 렌더링 (push=4면 select, 그 외 텍스트)
  const renderStatusCell = (row) => {
    const push = String(row.push || '');
    if (push === '4') {
      // 정상인 경우 select로 표시 (변경 가능)
      return `
        <select class="form-select form-select-sm" data-num="${row.num}" data-role="status-select">
          <option value="4" selected>정상</option>
          <option value="2">해지</option>
        </select>
      `;
    } else {
      // 그 외는 텍스트만
      return `<span>${mapPushLabel(push)}</span>`;
    }
  };

  // 증권성격 select 렌더링
  const renderEtagSelect = (row) => {
    const currentEtag = String(row.etag || '1');
    const options = [
      { value: '1', label: '일반' },
      { value: '2', label: '탁송' },
      { value: '3', label: '일반/렌트' },
      { value: '4', label: '탁송/렌트' },
      { value: '5', label: '전차량' }
    ];
    const optionsHtml = options.map(opt => 
      `<option value="${opt.value}" ${opt.value === currentEtag ? 'selected' : ''}>${opt.label}</option>`
    ).join('');
    return `
      <select class="form-select form-select-sm" data-num="${row.num}" data-role="etag-select">
        ${optionsHtml}
      </select>
    `;
  };

  // ==================== 테이블 렌더링 ====================

  const renderTable = (rows, pagination) => {
    if (!rows || rows.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="12" class="text-center py-4">데이터가 없습니다.</td>
        </tr>`;
      return;
    }

    const startNum = (pagination.page - 1) * pagination.limit + 1;

    tableBody.innerHTML = rows
      .map((row, idx) => {
        const rowNum = startNum + idx;
        const juminWithAge = `${row.Jumin || ''}${row.age ? `(${row.age}세)` : ''}`;
        const companyDisplay = row.companyName 
          ? `${row.companyName} (${row.companyNum || ''})`
          : (row.companyNum || '');
        const insuranceDisplay = row.insuranceCompanyName || row.InsuranceCompany || '';
        const rateDisplay = row.personRateFactor != null 
          ? `${row.personRateFactor}${row.personRateName ? ` (${row.personRateName})` : ''}`
          : '';
        const outputDay = row.OutPutDay || '-';
        const sagoLabel = mapSagoLabel(row.sago);
        const sagoClickable = String(row.sago || '1') === '2';

        return `
          <tr>
            <td>${rowNum}</td>
            <td>${row.Name || ''}</td>
            <td class="d-none d-lg-table-cell">${juminWithAge}</td>
            <td>${renderStatusCell(row)}</td>
            <td class="d-none d-lg-table-cell">${renderEtagSelect(row)}</td>
            <td>
              <a href="#" class="text-primary" 
                 data-role="open-company-modal" 
                 data-company-num="${row.companyNum || ''}" 
                 data-company-name="${row.companyName || ''}">
                ${companyDisplay}
              </a>
            </td>
            <td>${insuranceDisplay}</td>
            <td>${row.policyNum || ''}</td>
            <td>${rateDisplay}</td>
            <td>${row.InputDay || ''}</td>
            <td>${outputDay}</td>
            <td>
              ${sagoClickable 
                ? `<a href="#" class="text-danger" data-role="open-accident-modal" data-num="${row.num}" data-jumin="${row.Jumin || ''}" data-policy="${row.policyNum || ''}">${sagoLabel}</a>`
                : sagoLabel
              }
            </td>
          </tr>
        `;
      })
      .join('');

    // 이벤트 위임: 상태 select 변경
    tableBody.querySelectorAll('[data-role="status-select"]').forEach(select => {
      select.addEventListener('change', (e) => {
        const num = e.target.dataset.num;
        const newPush = e.target.value;
        console.log(`상태 변경: num=${num}, push=${newPush}`);
        // TODO: API 호출로 상태 업데이트
      });
    });

    // 이벤트 위임: 증권성격 select 변경
    tableBody.querySelectorAll('[data-role="etag-select"]').forEach(select => {
      select.addEventListener('change', (e) => {
        const num = e.target.dataset.num;
        const newEtag = e.target.value;
        console.log(`증권성격 변경: num=${num}, etag=${newEtag}`);
        // TODO: API 호출로 증권성격 업데이트
      });
    });
  };

  // ==================== 모바일 카드 렌더링 ====================

  const renderMobile = (rows) => {
    if (!rows || rows.length === 0) {
      mobileCards.innerHTML = `<div class="text-center py-4">데이터가 없습니다.</div>`;
      return;
    }

    mobileCards.innerHTML = rows
      .map((row) => {
        const juminWithAge = `${row.Jumin || ''}${row.age ? `(${row.age}세)` : ''}`;
        const companyDisplay = row.companyName 
          ? `${row.companyName}(${row.companyNum || ''})`
          : (row.companyNum || '');
        const insuranceDisplay = row.insuranceCompanyName || row.InsuranceCompany || '';
        const rateDisplay = row.personRateFactor != null 
          ? `${row.personRateFactor} (${row.personRateName || ''})`
          : '';
        const outputDay = row.OutPutDay || '-';
        const sagoLabel = mapSagoLabel(row.sago);
        const sagoClickable = String(row.sago || '1') === '2';

        return `
          <div class="card mb-2">
            <div class="card-body">
              <div class="d-flex justify-content-between mb-2">
                <div><strong>${row.Name || ''}</strong></div>
                <div class="text-muted">${mapPushLabel(row.push)}</div>
              </div>
              <div class="small text-muted mb-1">주민번호: ${juminWithAge}</div>
              <div class="small mb-1">증권번호: ${row.policyNum || ''}</div>
              <div class="text-muted small mb-1">
                회사: <a href="#" class="text-primary" data-role="open-company-modal" data-company-num="${row.companyNum || ''}" data-company-name="${row.companyName || ''}">${companyDisplay}</a> / 
                보험사: ${insuranceDisplay}
              </div>
              <div class="text-muted small mb-1">할인할증: ${rateDisplay}</div>
              <div class="text-muted small mb-1">등록일: ${row.InputDay || ''} / 해지일: ${outputDay}</div>
              <div class="text-muted small">
                사고: ${sagoClickable 
                  ? `<a href="#" class="text-danger" data-role="open-accident-modal" data-num="${row.num}" data-jumin="${row.Jumin || ''}" data-policy="${row.policyNum || ''}">${sagoLabel}</a>`
                  : sagoLabel
                }
              </div>
            </div>
          </div>
        `;
      })
      .join('');
  };

  // ==================== 페이징 렌더링 ====================

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

  // ==================== 모달 관련 ====================

  // 대리운전회사 모달 열기
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
    
    // TODO: API 호출
    // fetch(`/api/insurance/kj-company/${companyNum}`)
    //   .then(res => res.json())
    //   .then(data => {
    //     modalBody.innerHTML = `회사 정보 표시 (추후 API 스펙에 맞춰 구현)`;
    //   })
    //   .catch(err => {
    //     modalBody.innerHTML = `<div class="alert alert-danger">오류가 발생했습니다.</div>`;
    //   });
    
    // 임시로 회사명만 표시
    setTimeout(() => {
      modalBody.innerHTML = `
        <h6>회사명: ${companyName || 'N/A'}</h6>
        <p class="text-muted">회사 번호: ${companyNum || 'N/A'}</p>
        <p class="text-muted small">추후 API 스펙에 맞춰 상세 정보를 표시합니다.</p>
      `;
    }, 500);
  };

  // 사고 이력 모달 열기
  const openAccidentModal = (num, jumin, policyNum) => {
    const modal = new bootstrap.Modal(document.getElementById('accidentListModal'));
    const modalBody = document.getElementById('accidentListModalBody');
    
    modalBody.innerHTML = `
      <div class="text-center py-4">
        <div class="spinner-border" role="status">
          <span class="visually-hidden">로딩 중...</span>
        </div>
        <p class="mt-2">사고 이력을 불러오는 중...</p>
      </div>
    `;
    
    modal.show();
    
    // TODO: API 호출
    // fetch(`/api/insurance/kj-driver/accidents?num=${num}`)
    //   .then(res => res.json())
    //   .then(data => {
    //     modalBody.innerHTML = `사고 이력 표시 (추후 API 스펙에 맞춰 구현)`;
    //   })
    //   .catch(err => {
    //     modalBody.innerHTML = `<div class="alert alert-danger">오류가 발생했습니다.</div>`;
    //   });
    
    // 임시로 기본 정보만 표시
    setTimeout(() => {
      modalBody.innerHTML = `
        <h6>기사 번호: ${num || 'N/A'}</h6>
        <p class="text-muted">주민번호: ${jumin || 'N/A'}</p>
        <p class="text-muted">증권번호: ${policyNum || 'N/A'}</p>
        <p class="text-muted small">추후 API 스펙에 맞춰 사고 이력을 표시합니다.</p>
      `;
    }, 500);
  };

  // 이벤트 위임: 모달 트리거
  document.addEventListener('click', (e) => {
    if (e.target.matches('[data-role="open-company-modal"]')) {
      e.preventDefault();
      const companyNum = e.target.dataset.companyNum;
      const companyName = e.target.dataset.companyName;
      openCompanyModal(companyNum, companyName);
    } else if (e.target.matches('[data-role="open-accident-modal"]')) {
      e.preventDefault();
      const num = e.target.dataset.num;
      const jumin = e.target.dataset.jumin;
      const policy = e.target.dataset.policy;
      openAccidentModal(num, jumin, policy);
    }
  });

  // ==================== API 호출 ====================

  const fetchList = async () => {
    const keyword = searchInput.value.trim();
    const searchType = searchTypeFilter.value;
    const status = statusFilter.value;
    const limit = Number(pageSizeSelect.value) || 20;
    currentLimit = limit;

    const params = new URLSearchParams();
    params.set('page', currentPage);
    params.set('limit', limit);

    if (searchType === '이름' && keyword) params.set('name', keyword);
    if (searchType === '주민번호' && keyword) params.set('jumin', keyword);
    if (status) params.set('status', status);

    tableBody.innerHTML = `
      <tr>
        <td colspan="12" class="text-center py-4">데이터를 불러오는 중...</td>
      </tr>`;
    mobileCards.innerHTML = `<div class="text-center py-4">데이터를 불러오는 중...</div>`;

    try {
      const res = await fetch(`/api/insurance/kj-driver/list?${params.toString()}`);
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
          <td colspan="12" class="text-center text-danger py-4">오류가 발생했습니다.</td>
        </tr>`;
      mobileCards.innerHTML = `<div class="text-center text-danger py-4">오류가 발생했습니다.</div>`;
      paginationInfo.textContent = '';
      paginationControls.innerHTML = '';
    }
  };

  // ==================== 이벤트 바인딩 ====================

  searchBtn?.addEventListener('click', () => {
    currentPage = 1;
    fetchList();
  });

  searchInput?.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      currentPage = 1;
      fetchList();
    }
  });

  pageSizeSelect?.addEventListener('change', () => {
    currentPage = 1;
    fetchList();
  });

  statusFilter?.addEventListener('change', () => {
    currentPage = 1;
    fetchList();
  });

  // 초기 로드에서는 자동 호출하지 않음
  tableBody.innerHTML = `
    <tr>
      <td colspan="12" class="text-center py-4">검색어를 입력해 주세요.</td>
    </tr>`;
  mobileCards.innerHTML = `<div class="text-center py-4">검색어를 입력해 주세요.</div>`;
  paginationInfo.textContent = '';
  paginationControls.innerHTML = '';
})();

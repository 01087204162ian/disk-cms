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

  // ==================== 공통 매핑 함수 ====================

  // 상태(push) → 라벨
  const mapPushLabel = (push) => {
    const v = Number(push);
    switch (v) {
      case 1: return '청약중';
      case 2: return '해지';
      case 4: return '정상';
      case 5: return '거절';
      case 6: return '취소';
      case 7: return '실효';
      default: return '기타';
    }
  };

  // etag → 텍스트
  const mapEtagLabel = (etag) => {
    const v = Number(etag);
    switch (v) {
      case 1: return '일반';
      case 2: return '탁송';
      case 3: return '일반/렌트';
      case 4: return '탁송/렌트';
      case 5: return '전차량';
      default: return '';
    }
  };

  // sago → 텍스트
  const mapSagoLabel = (sago) => {
    const v = Number(sago);
    switch (v) {
      case 1: return '사고없음';
      case 2: return '사고있음';
      default: return '';
    }
  };

  // ==================== 렌더링 헬퍼 ====================

  // 상태 컬럼 렌더링 (push=4면 select, 그 외 텍스트)
  const renderStatusCell = (row) => {
    const push = Number(row.push);
    const cancel = row.cancel;
    
    // push=4이고 cancel=42이면 "해지중" 표시
    if (push === 4 && cancel === '42') {
      return `<span>해지중</span>`;
    }
    
    // 정상일 때만 select 제공
    if (push === 4) {
      return `
        <select class="form-select form-select-sm driver-status-select"
                data-num="${row.num}"
                data-current="${push}">
          <option value="4" ${push === 4 ? 'selected' : ''}>정상</option>
          <option value="2">해지</option>
        </select>
      `;
    }
    
    // 그 외는 읽기 전용 텍스트
    return `<span>${mapPushLabel(push)}</span>`;
  };

  // 증권성격 select 렌더링
  const renderEtagSelect = (row) => {
    const etag = Number(row.etag || row.Etag || 0);
    const options = [
      { value: 1, label: '일반' },
      { value: 2, label: '탁송' },
      { value: 3, label: '일반/렌트' },
      { value: 4, label: '탁송/렌트' },
      { value: 5, label: '전차량' },
    ];
    
    const optsHtml = options
      .map(opt => `<option value="${opt.value}" ${opt.value === etag ? 'selected' : ''}>${opt.label}</option>`)
      .join('');
    
    return `
      <select class="form-select form-select-sm driver-etag-select"
              data-num="${row.num}">
        ${optsHtml}
      </select>
    `;
  };

  // 핸드폰 컬럼 렌더링
  const renderPhoneCell = (row) => {
    const phone = row.Hphone || '';
    return `
      <input type="text"
             class="form-control form-control-sm driver-phone-input"
             data-num="${row.num}"
             data-original="${phone}"
             value="${phone}">
    `;
  };

  // 핸드폰 번호 하이픈 제거 함수
  const removePhoneHyphen = (phone) => {
    return phone.replace(/-/g, '');
  };

  // 핸드폰 번호 하이픈 추가 함수 (010-1234-5678 형식)
  const addPhoneHyphen = (phone) => {
    const cleaned = removePhoneHyphen(phone);
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
    } else if (cleaned.length === 10) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
    }
    return cleaned;
  };

  // 사고 select 렌더링
  const renderSagoSelect = (row) => {
    const sago = Number(row.sago || 0);
    return `
      <select class="form-select form-select-sm driver-sago-select"
              data-num="${row.num}">
        <option value="1" ${sago === 1 ? 'selected' : ''}>사고없음</option>
        <option value="2" ${sago === 2 ? 'selected' : ''}>사고있음</option>
      </select>
    `;
  };

  // ==================== 테이블 렌더링 ====================

  const renderTable = (rows, pagination) => {
    if (!rows || rows.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="13" class="text-center py-4">데이터가 없습니다.</td>
        </tr>`;
      return;
    }

    const page = pagination?.page || 1;
    const limit = pagination?.limit || Number(pageSizeSelect.value) || 20;
    const startIndex = (page - 1) * limit;

    tableBody.innerHTML = rows.map((row, idx) => {
      const displayIndex = startIndex + idx + 1;
      const juminText = (row.Jumin || '') + (row.age ? `(${row.age}세)` : '');
      const companyText = (row.companyName || '') + (row.companyNum ? ` (${row.companyNum})` : '');
      const insurerText = row.insuranceCompanyName || row.InsuranceCompany || '';
      const discountText = (row.personRateFactor != null ? row.personRateFactor : '') +
        (row.personRateName ? ` (${row.personRateName})` : '');
      const inputDay = row.InputDay || '';
      const outputDay = row.OutPutDay || '-';

      return `
        <tr data-num="${row.num}"
            data-certi-table-num="${row.CertiTableNum || ''}"
            data-company-num="${row.companyNum || ''}"
            data-insurance-company="${row.InsuranceCompany || ''}"
            data-policy-num="${row.policyNum || ''}">
          <td class="col-kj-ser-number text-center">${displayIndex}</td>
          <td class="col-kj-name">${row.Name ?? ''}</td>
          <td class="col-kj-jumin d-none d-lg-table-cell">${juminText}</td>
          <td class="col-kj-status">${renderStatusCell(row)}</td>
          <td class="col-kj-etag d-none d-lg-table-cell">${renderEtagSelect(row)}</td>
          <td class="col-kj-company">
            <a href="#" class="driver-company-link"
               data-role="open-company-modal"
               data-company-num="${row.companyNum}"
               data-company-name="${row.companyName || ''}">
               ${companyText}
            </a>
          </td>
          <td class="col-kj-insurer">${insurerText}</td>
          <td class="col-kj-policy">${row.policyNum ?? ''}</td>
          <td class="col-kj-discount">${discountText}</td>
          <td class="col-kj-phone d-none d-lg-table-cell">${renderPhoneCell(row)}</td>
          <td class="col-kj-date d-none d-lg-table-cell">${inputDay}</td>
          <td class="col-kj-date d-none d-lg-table-cell">${outputDay}</td>
          <td class="col-kj-accident">${renderSagoSelect(row)}</td>
        </tr>
      `;
    }).join('');
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
        const pushLabel = mapPushLabel(row.push);

        return `
          <div class="card mb-2">
            <div class="card-body">
              <div class="d-flex justify-content-between mb-2">
                <div><strong>${row.Name || ''}</strong></div>
                <div class="text-muted">${pushLabel}</div>
              </div>
              <div class="small text-muted mb-1">주민번호: ${juminWithAge}</div>
              <div class="small mb-1">증권번호: ${row.policyNum || ''}</div>
              <div class="text-muted small mb-1">
                회사: <a href="#" class="text-primary" data-role="open-company-modal" data-company-num="${row.companyNum || ''}" data-company-name="${row.companyName || ''}">${companyDisplay}</a> / 
                보험사: ${insuranceDisplay}
              </div>
              <div class="text-muted small mb-1">할인할증: ${rateDisplay}</div>
              <div class="text-muted small mb-1">핸드폰: ${row.Hphone || ''}</div>
              <div class="text-muted small mb-1">등록일: ${row.InputDay || ''} / 해지일: ${outputDay}</div>
              <div class="text-muted small">사고: ${mapSagoLabel(row.sago)}</div>
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
  // 공통 모듈(kj-company-modal.js)을 사용합니다.
  // 모달 열기: window.KJCompanyModal.openCompanyModal(companyNum, companyName, skipShow)

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

  // ==================== 이벤트 핸들러 ====================

  // 상태 select 변경 이벤트
  tableBody.addEventListener('change', async (e) => {
    const target = e.target;
    
    // 상태 select
    if (target.classList.contains('driver-status-select')) {
      const num = target.dataset.num;
      const before = Number(target.dataset.current);
      const after = Number(target.value);
      
      // 정상 → 해지일 때만 서버 전송
      if (before === 4 && after === 2) {
        if (!confirm('해당 기사의 상태를 "해지"로 변경하시겠습니까?')) {
          target.value = String(before);
          return;
        }
        
        try {
          // 현재 행의 데이터 수집
          const row = target.closest('tr');
          if (!row) {
            throw new Error('행 데이터를 찾을 수 없습니다.');
          }
          
          // 데이터 속성에서 필요한 정보 수집
          const cNum = row.dataset.certiTableNum;
          const dNum = row.dataset.companyNum;
          const insuranceCompany = row.dataset.insuranceCompany;
          const policyNum = row.dataset.policyNum;
          
          // 오늘 날짜 (YYYY-MM-DD)
          const today = new Date();
          const endorseDay = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
          
          // 로그인 사용자 이름 가져오기
          const userName = (window.sjTemplateLoader && window.sjTemplateLoader.user && window.sjTemplateLoader.user.name) 
            || sessionStorage.getItem('userName') 
            || localStorage.getItem('userName') 
            || 'system';
          
          // 필수 데이터 검증
          if (!cNum || !dNum || !insuranceCompany || !policyNum) {
            console.error('필수 데이터 누락:', { num, cNum, dNum, insuranceCompany, policyNum });
            throw new Error('필수 데이터가 누락되었습니다. 페이지를 새로고침 후 다시 시도해주세요.');
          }
          
          // 배서신청 API 호출
          const res = await fetch('/api/insurance/kj-endorse/termination', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              DariMemberNum: num,
              cNum: cNum,
              dNum: dNum,
              InsuranceCompany: insuranceCompany,
              endorseDay: endorseDay,
              policyNum: policyNum,
              userName: userName
            })
          });
          
          const json = await res.json();
          if (!json.success) throw new Error(json.error || json.message || '배서신청 실패');
          
          target.dataset.current = String(after);
          
          // 성공 메시지
          if (window.sjTemplateLoader && window.sjTemplateLoader.showToast) {
            window.sjTemplateLoader.showToast('해지 신청이 완료되었습니다.', 'success');
          } else {
            alert('해지 신청이 완료되었습니다.');
          }
          
          // 데이터 새로고침
          fetchList();
        } catch (err) {
          console.error('배서신청 오류:', err);
          const errorMsg = err.message || '배서신청 중 오류가 발생했습니다.';
          if (window.sjTemplateLoader && window.sjTemplateLoader.showToast) {
            window.sjTemplateLoader.showToast(errorMsg, 'error');
          } else {
            alert(errorMsg);
          }
          target.value = String(before); // 롤백
        }
      } else {
        // 그 외 변경은 아직 허용하지 않으므로 UI 롤백
        alert('현재는 "정상 → 해지" 변경만 지원합니다.');
        target.value = String(before);
      }
    }
    
    // 사고 select 변경
    else if (target.classList.contains('driver-sago-select')) {
      const num = target.dataset.num;
      const sago = Number(target.value);
      
      try {
        const res = await fetch('/api/insurance/kj-driver/sago', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ num, sago })
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error || '사고 상태 저장 실패');
      } catch (err) {
        console.error(err);
        alert('사고 상태 저장 중 오류가 발생했습니다.');
      }
    }
  });

  // 핸드폰 입력 포커스 이벤트 (클릭 시 하이픈 제거)
  tableBody.addEventListener('focus', (e) => {
    const target = e.target;
    if (target.classList.contains('driver-phone-input')) {
      const original = target.dataset.original || '';
      const withoutHyphen = removePhoneHyphen(original);
      target.value = withoutHyphen;
    }
  }, true);

  // 핸드폰 입력 이벤트 (입력 시 하이픈 자동 추가)
  tableBody.addEventListener('input', (e) => {
    const target = e.target;
    if (target.classList.contains('driver-phone-input')) {
      const cursorPos = target.selectionStart;
      const value = target.value;
      const cleaned = removePhoneHyphen(value);
      const formatted = addPhoneHyphen(cleaned);
      
      if (formatted !== value) {
        target.value = formatted;
        // 커서 위치 조정
        const diff = formatted.length - value.length;
        target.setSelectionRange(cursorPos + diff, cursorPos + diff);
      }
    }
  }, true);

  // 핸드폰 입력 blur 이벤트 (서버 전송)
  tableBody.addEventListener('blur', async (e) => {
    const target = e.target;
    if (target.classList.contains('driver-phone-input')) {
      const num = target.dataset.num;
      const value = removePhoneHyphen(target.value.trim()); // 서버에는 하이픈 없이 전송
      
      // 원본과 동일하면 전송하지 않음
      const original = removePhoneHyphen(target.dataset.original || '');
      if (value === original) {
        // 원본으로 복원 (하이픈 포함)
        target.value = target.dataset.original || '';
        return;
      }
      
      try {
        const res = await fetch('/api/insurance/kj-driver/phone', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ num, phone: value })
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error || '핸드폰 수정 실패');
        
        // 성공 시 원본 값 업데이트 및 하이픈 추가하여 표시
        target.dataset.original = value;
        target.value = addPhoneHyphen(value);
      } catch (err) {
        console.error(err);
        alert('핸드폰 번호 저장 중 오류가 발생했습니다.');
        // 실패 시 원본으로 복원
        target.value = target.dataset.original || '';
      }
    }
  }, true);

  // 핸드폰 입력 Enter 키 처리 (서버 전송)
  tableBody.addEventListener('keyup', (e) => {
    const target = e.target;
    if (target.classList.contains('driver-phone-input') && e.key === 'Enter') {
      e.preventDefault();
      target.blur(); // blur 이벤트로 서버 전송
    }
  });

  // 모달 트리거 이벤트 위임 (성능 최적화)
  // 사고 이력 모달 트리거 (회사 모달은 공통 모듈에서 처리)
  document.addEventListener('click', (e) => {
    const accidentTrigger = e.target.closest('[data-role="open-accident-modal"]');
    if (accidentTrigger) {
      e.preventDefault();
      e.stopPropagation();
      const num = accidentTrigger.dataset.num;
      const jumin = accidentTrigger.dataset.jumin;
      const policy = accidentTrigger.dataset.policy;
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
        <td colspan="13" class="text-center py-4">데이터를 불러오는 중...</td>
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
          <td colspan="13" class="text-center text-danger py-4">오류가 발생했습니다.</td>
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
      <td colspan="13" class="text-center py-4">검색어를 입력해 주세요.</td>
    </tr>`;
  mobileCards.innerHTML = `<div class="text-center py-4">검색어를 입력해 주세요.</div>`;
  paginationInfo.textContent = '';
  paginationControls.innerHTML = '';
})();

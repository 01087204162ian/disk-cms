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
        <tr>
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

  // 대리운전회사 모달 열기 (kj-driver-company.js와 동일한 함수)
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
        <tr class="${bgClass}" data-row-index="${idx}" data-certi-num="${certi.num || ''}">
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
            <button class="btn btn-sm btn-outline-primary certi-save-btn ${isNew && !Number(certi.InsuraneCompany) ? 'd-none' : ''}"
                    data-is-new="${isNew ? 'true' : 'false'}"
                    ${requiredFilled ? '' : 'disabled'}>
              ${certi.num ? '수정' : '저장'}
            </button>
          </td>
          <td>
            ${isNew ? '' : `
              <select class="form-select form-select-sm certi-field" data-field="nabang_1" ${certi.num ? '' : 'disabled'}>
                ${Array.from({ length: 10 }, (_, i) => i + 1).map(v => `<option value="${v}" ${Number(certi.nabang_1) === v ? 'selected' : ''}>${v}회차</option>`).join('')}
              </select>
            `}
          </td>
          <td style="color: ${isNew ? '' : naStateColor};">
            ${isNew ? '' : `${naStateText}${giganText}`}
          </td>
          <td>
            ${isNew ? '' : `<button class="btn btn-sm btn-outline-secondary certi-member-btn" ${certi.num ? '' : 'disabled'}>인원</button>`}
          </td>
          <td>
            ${isNew ? '' : `<button class="btn btn-sm btn-outline-success certi-new-member-btn" ${certi.num ? '' : 'disabled'}>신규</button>`}
          </td>
          <td>
            ${isNew ? '' : `<button class="btn btn-sm btn-outline-warning certi-endorse-btn" ${certi.num ? '' : 'disabled'}>배서</button>`}
          </td>
          <td>
            ${isNew ? '' : `<button class="btn btn-sm btn-outline-dark certi-divi-btn" data-divi="${certi.divi || 1}">${mapDivi(certi.divi || 1)}</button>`}
          </td>
          <td>
            ${isNew ? '' : `<button class="btn btn-sm btn-outline-info certi-premium-btn" ${certi.num ? '' : 'disabled'}>${certi.divi == 2 ? '보험료' : '입력'}</button>`}
          </td>
          <td>
            ${isNew ? '' : `<select class="form-select form-select-sm certi-field" data-field="gita">${gitaOptions}</select>`}
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

    const companyNum = company.num || company.dNum || data.num || '';

    const toggleSaveState = (rowEl) => {
      if (!rowEl) return;
      const insurer = rowEl.querySelector('[data-field="InsuraneCompany"]');
      const starty = rowEl.querySelector('[data-field="startyDay"]');
      const policy = rowEl.querySelector('[data-field="policyNum"]');
      const nabang = rowEl.querySelector('[data-field="nabang"]');
      const saveBtn = rowEl.querySelector('.certi-save-btn');
      if (!saveBtn) return;
      const isNew = saveBtn.dataset.isNew === 'true';

      const hasInsurer = insurer && Number(insurer.value);
      const requiredFilled = Boolean(hasInsurer && starty?.value && policy?.value && nabang?.value);

      if (isNew && !hasInsurer) {
        saveBtn.classList.add('d-none');
        saveBtn.disabled = true;
        return;
      }

      saveBtn.classList.remove('d-none');
      saveBtn.disabled = !requiredFilled;
    };

    // 이벤트 위임: 입력/선택 변경 시 저장 버튼 표시/활성 제어
    modalBody.addEventListener('input', (e) => {
      const row = e.target.closest('tr[data-row-index]');
      if (!row) return;
      if (e.target.classList.contains('certi-field') || e.target.classList.contains('insurer-select')) {
        toggleSaveState(row);
      }
    });
    modalBody.addEventListener('change', (e) => {
      const row = e.target.closest('tr[data-row-index]');
      if (!row) return;
      if (e.target.classList.contains('certi-field') || e.target.classList.contains('insurer-select')) {
        toggleSaveState(row);
      }
    });

    // 저장/수정 클릭 시 API 호출
    modalBody.addEventListener('click', async (e) => {
      const btn = e.target.closest('.certi-save-btn');
      if (!btn) return;
      if (btn.disabled) return;
      if (!companyNum) return;
      
      const row = btn.closest('tr[data-row-index]');
      if (!row) return;
      
      const insurer = row.querySelector('[data-field="InsuraneCompany"]');
      const starty = row.querySelector('[data-field="startyDay"]');
      const policy = row.querySelector('[data-field="policyNum"]');
      const nabang = row.querySelector('[data-field="nabang"]');
      
      if (!insurer || !starty || !policy || !nabang) return;
      
      const certiNum = row.dataset.certiNum || '';
      const isNew = btn.dataset.isNew === 'true';
      
      // 저장 전 확인
      if (!confirm(isNew ? '증권 정보를 저장하시겠습니까?' : '증권 정보를 수정하시겠습니까?')) {
        return;
      }
      
      // 버튼 비활성화
      btn.disabled = true;
      const originalText = btn.textContent;
      btn.textContent = '저장 중...';
      
      try {
        const response = await fetch('/api/insurance/kj-certi/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            certiNum: certiNum || undefined,
            companyNum: companyNum,
            InsuraneCompany: insurer.value,
            startyDay: starty.value,
            policyNum: policy.value,
            nabang: nabang.value
          })
        });
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || '저장 실패');
        }
        
        alert(result.message || (isNew ? '저장되었습니다.' : '수정되었습니다.'));
        
        // 모달 재조회
        openCompanyModal(companyNum, companyName);
        
      } catch (err) {
        console.error('증권 정보 저장 오류:', err);
        alert('저장 중 오류가 발생했습니다: ' + (err.message || '알 수 없는 오류'));
        btn.disabled = false;
        btn.textContent = originalText;
      }
    });
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
          const res = await fetch('/api/insurance/kj-driver/status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ num, status: after })
          });
          const json = await res.json();
          if (!json.success) throw new Error(json.error || '상태 변경 실패');
          
          target.dataset.current = String(after);
          alert('상태가 해지로 변경되었습니다.');
        } catch (err) {
          console.error(err);
          alert('상태 변경 중 오류가 발생했습니다.');
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

  // 모달 트리거 이벤트 위임
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

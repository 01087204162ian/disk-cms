/**
 * KJ 대리운전 회사 정보 모달 공통 모듈
 * kj-driver-search.js와 kj-driver-company.js에서 공통으로 사용
 */

(function() {
  'use strict';

  // ==================== 상수 정의 ====================
  // 공통 상수는 kj-constants.js에서 가져옴
  // kj-constants.js가 먼저 로드되어야 함
  
  // 보험사 옵션 (공통 모듈 사용)
  const INSURER_OPTIONS = window.KJConstants ? window.KJConstants.INSURER_OPTIONS : [
    { value: 0, label: '=선택=' },
    { value: 1, label: '흥국' },
    { value: 2, label: 'DB' },
    { value: 3, label: 'KB' },
    { value: 4, label: '현대' },
    { value: 5, label: '롯데' },
    { value: 6, label: '하나' },
    { value: 7, label: '한화' },
    { value: 8, label: '삼성' },
    { value: 9, label: '메리츠' },
  ];

  // 성격 옵션 (공통 모듈 사용)
  const GITA_OPTIONS = window.KJConstants ? window.KJConstants.GITA_OPTIONS : [
    { value: 1, label: '일반' },
    { value: 2, label: '탁송' },
    { value: 3, label: '일반/렌트' },
    { value: 4, label: '탁송/렌트' },
    { value: 5, label: '확대탁송' },
  ];

  // ==================== 유틸리티 함수 ====================

  // 보험사 코드 매핑 (공통 모듈 사용)
  const mapInsuranceCompany = (code) => {
    if (window.KJConstants) {
      return window.KJConstants.getInsurerName(code);
    }
    // Fallback (공통 모듈이 없을 경우)
    const map = { 1: '흥국', 2: 'DB', 3: 'KB', 4: '현대', 5: '롯데', 6: '하나', 7: '한화', 8: '삼성', 9: '메리츠' };
    return map[code] || '=선택=';
  };

  // 결제 방식 매핑
  const mapDivi = (divi) => {
    return divi == 1 ? '정상' : (divi == 2 ? '월납' : '정상');
  };

  // 납입 상태 색상
  const getNaStateColor = (naColor) => {
    if (naColor == 1) return '#666666';
    if (naColor == 2) return 'red';
    return '#666666';
  };

  // ==================== 증권 행 렌더링 ====================

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
            <select class="form-select form-select-sm certi-field" data-field="nabang_1" data-original-value="${certi.nabang_1 || ''}" ${certi.num ? '' : 'disabled'}>
              ${Array.from({ length: 10 }, (_, i) => i + 1).map(v => `<option value="${v}" ${Number(certi.nabang_1) === v ? 'selected' : ''}>${v}회차</option>`).join('')}
            </select>
          `}
        </td>
        <td style="color: ${isNew ? '' : naStateColor};">
          ${isNew ? '' : `${naStateText}${giganText}`}
        </td>
        <td>
          ${isNew ? '' : `<button class="btn btn-sm btn-outline-secondary certi-member-btn" ${certi.num ? '' : 'disabled'} data-certi-num="${certi.num || ''}" data-inwon="${certi.inwon || 0}">${certi.inwon || 0}명</button>`}
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

  // ==================== 저장 버튼 상태 토글 ====================

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

  // ==================== 성공 메시지 표시 ====================

  const showSuccessMessage = (message) => {
    const tempMsg = document.createElement('div');
    tempMsg.className = 'alert alert-success alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3';
    tempMsg.style.zIndex = '9999';
    tempMsg.innerHTML = `
      <i class="fas fa-check-circle"></i> ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    document.body.appendChild(tempMsg);
    setTimeout(() => {
      tempMsg.remove();
    }, 2000);
  };

  // ==================== 회사 정보 모달 렌더링 ====================

  const renderCompanyModal = (data, companyName, companyNum) => {
    const modalBody = document.getElementById('companyInfoModalBody');
    
    const company = data;
    const certiData = data.data || [];
    const memoData = data.memoData || [];
    const smsData = data.smsData || [];
    const contentData = data.content || [];
    const inWonTotal = data.inWonTotal || 0;

    // 기본 정보 테이블 HTML
    let html = `
      <div class="mb-3">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <h6 class="mb-0">기본 정보</h6>
          <button type="button" class="btn btn-sm btn-primary" id="editCompanyInfoBtn">
            <i class="fas fa-edit"></i> 수정
          </button>
        </div>
        <div class="row">
          <div class="col-12">
            <table class="table table-sm table-bordered mb-0" id="companyInfoTable">
              <tr>
                <th class="bg-light">주민번호</th>
                <td id="td_jumin">${company.jumin || ''}</td>
                <th class="bg-light">대리운전회사</th>
                <td id="td_company">${company.company || companyName || ''}</td>
                <th class="bg-light">성명</th>
                <td id="td_Pname">${company.Pname || ''}</td>
                <th class="bg-light">핸드폰번호</th>
                <td id="td_hphone">${company.hphone || ''}</td>
              </tr>
              <tr>
                <th class="bg-light">전화번호</th>
                <td id="td_cphone">${company.cphone || ''}</td>
                <th class="bg-light">담당자</th>
                <td>${company.name || company.damdanga || ''}</td>
                <th class="bg-light">팩스</th>
                <td>${company.fax || ''}</td>
                <th class="bg-light">사업자번호</th>
                <td id="td_cNumber">${company.cNumber || ''}</td>
              </tr>
              <tr>
                <th class="bg-light">법인번호</th>
                <td id="td_lNumber">${company.lNumber || ''}</td>
                <th class="bg-light">보험료 받는날</th>
                <td><input type="date" class="form-control form-control-sm" id="companyFirstStart" value="${company.FirstStart || ''}" style="width: 100%;"></td>
                <th class="bg-light">업체 I.D</th>
                <td colspan="3">
                  <a href="#" class="text-primary company-id-link" data-role="open-company-id-modal" data-company-num="${companyNum}" style="text-decoration: underline; cursor: pointer;">
                    ${company.mem_id || '클릭하여 관리'}
                  </a>
                  ${company.permit == 1 ? ' (허용)' : (company.permit == 2 ? ' (차단)' : '')}
                </td>
              </tr>
              <tr>
                <th class="bg-light">주소</th>
                <td colspan="7" id="td_address">${company.postNum || ''} ${company.address1 || ''} ${company.address2 || ''}</td>
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
                <th style="width: 6%;">시작일</th>
                <th style="width: 10%;">증권번호</th>
                <th style="width: 5%;">분납</th>
                <th style="width: 7%;">저장</th>
                <th style="width: 9%;">회차</th>
                <th style="width: 6%;">상태</th>
                <th style="width: 6%;">인원</th>
                <th style="width: 6%;">신규<br>입력</th>
                <th style="width: 6%;">운전자<Br>추가</th>
                <th style="width: 7%;">결제<Br>방식</th>
                <th style="width: 7%;">월보험료</th>
                <th style="width: 11%;">성격</th>
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

    // 이벤트 핸들러 설정
    setupModalEventHandlers(companyNum, companyName);
    
    // 회사 정보 수정 버튼 이벤트 설정
    setupCompanyInfoEditButton(companyNum, company);
  };

  // ==================== 회사 정보 수정 기능 ====================

  // 회사 정보 수정 버튼 이벤트 설정
  const setupCompanyInfoEditButton = (companyNum, companyData) => {
    const editBtn = document.getElementById('editCompanyInfoBtn');
    if (!editBtn) return;

    editBtn.addEventListener('click', () => {
      enterEditMode(companyNum, companyData);
    });
  };

  // 수정 모드로 전환
  const enterEditMode = (companyNum, companyData) => {
    const company = companyData;
    
    // 읽기 전용 셀을 입력 필드로 변경
    const tdJumin = document.getElementById('td_jumin');
    const tdCompany = document.getElementById('td_company');
    const tdPname = document.getElementById('td_Pname');
    const tdHphone = document.getElementById('td_hphone');
    const tdCphone = document.getElementById('td_cphone');
    const tdCNumber = document.getElementById('td_cNumber');
    const tdLNumber = document.getElementById('td_lNumber');

    if (tdJumin) {
      tdJumin.innerHTML = `<input type="text" class="form-control form-control-sm" id="edit_jumin" value="${company.jumin || ''}" placeholder="660327-1069017" maxlength="14" autocomplete="off">`;
    }
    if (tdCompany) {
      tdCompany.innerHTML = `<input type="text" class="form-control form-control-sm" id="edit_company" value="${company.company || ''}" placeholder="회사명" autocomplete="off">`;
    }
    if (tdPname) {
      tdPname.innerHTML = `<input type="text" class="form-control form-control-sm" id="edit_Pname" value="${company.Pname || ''}" placeholder="대표자명" autocomplete="off">`;
    }
    if (tdHphone) {
      tdHphone.innerHTML = `<input type="text" class="form-control form-control-sm" id="edit_hphone" value="${company.hphone || ''}" placeholder="010-1234-5678" autocomplete="off">`;
    }
    if (tdCphone) {
      tdCphone.innerHTML = `<input type="text" class="form-control form-control-sm" id="edit_cphone" value="${company.cphone || ''}" placeholder="02-1234-5678" autocomplete="off">`;
    }
    if (tdCNumber) {
      tdCNumber.innerHTML = `<input type="text" class="form-control form-control-sm" id="edit_cNumber" value="${company.cNumber || ''}" placeholder="사업자번호" autocomplete="off">`;
    }
    if (tdLNumber) {
      tdLNumber.innerHTML = `<input type="text" class="form-control form-control-sm" id="edit_lNumber" value="${company.lNumber || ''}" placeholder="법인번호" autocomplete="off">`;
    }

    // 주소 필드 추가
    const tdAddress = document.getElementById('td_address');
    if (tdAddress) {
      tdAddress.innerHTML = `
        <div class="row g-2">
          <div class="col-2">
            <input type="text" class="form-control form-control-sm" id="edit_postNum" value="${company.postNum || ''}" placeholder="우편번호" autocomplete="off">
          </div>
          <div class="col-10">
            <input type="text" class="form-control form-control-sm mb-1" id="edit_address1" value="${company.address1 || ''}" placeholder="기본주소" autocomplete="off">
            <input type="text" class="form-control form-control-sm" id="edit_address2" value="${company.address2 || ''}" placeholder="상세주소" autocomplete="off">
          </div>
        </div>
      `;
    }

    // 수정 버튼을 저장/취소 버튼으로 변경
    const editBtn = document.getElementById('editCompanyInfoBtn');
    if (editBtn) {
      editBtn.innerHTML = '<i class="fas fa-save"></i> 저장';
      editBtn.className = 'btn btn-sm btn-success';
      editBtn.id = 'saveCompanyInfoBtn';
      editBtn.onclick = () => saveCompanyInfo(companyNum);
    }

    // 취소 버튼 추가
    const buttonContainer = editBtn?.parentElement;
    if (buttonContainer && !document.getElementById('cancelEditBtn')) {
      const cancelBtn = document.createElement('button');
      cancelBtn.id = 'cancelEditBtn';
      cancelBtn.type = 'button';
      cancelBtn.className = 'btn btn-sm btn-secondary ms-2';
      cancelBtn.innerHTML = '<i class="fas fa-times"></i> 취소';
      cancelBtn.onclick = () => {
        // 모달 재로드
        window.KJCompanyModal.openCompanyModal(companyNum, company.company || '', true);
      };
      buttonContainer.appendChild(cancelBtn);
    }

    // 입력 필드 포맷팅 설정
    setupEditModeFormatting();
  };

  // 수정 모드 입력 필드 포맷팅 설정
  const setupEditModeFormatting = () => {
    // 주민번호 하이픈 자동 추가
    const juminInput = document.getElementById('edit_jumin');
    if (juminInput) {
      juminInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/[^0-9]/g, '');
        if (value.length > 6) {
          value = value.substring(0, 6) + '-' + value.substring(6, 13);
        }
        e.target.value = value;
      });
    }

    // 핸드폰번호 하이픈 자동 추가
    const hphoneInput = document.getElementById('edit_hphone');
    if (hphoneInput) {
      hphoneInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/[^0-9]/g, '');
        if (value.length > 10) {
          value = value.substring(0, 3) + '-' + value.substring(3, 7) + '-' + value.substring(7, 11);
        } else if (value.length > 7) {
          value = value.substring(0, 3) + '-' + value.substring(3, 7) + '-' + value.substring(7);
        } else if (value.length > 3) {
          value = value.substring(0, 3) + '-' + value.substring(3);
        }
        e.target.value = value;
      });
    }

    // 일반전화 하이픈 자동 추가
    const cphoneInput = document.getElementById('edit_cphone');
    if (cphoneInput) {
      cphoneInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/[^0-9]/g, '');
        if (value.length > 9) {
          value = value.substring(0, 2) + '-' + value.substring(2, 6) + '-' + value.substring(6, 10);
        } else if (value.length > 6) {
          value = value.substring(0, 2) + '-' + value.substring(2, 6) + '-' + value.substring(6);
        } else if (value.length > 2) {
          value = value.substring(0, 2) + '-' + value.substring(2);
        }
        e.target.value = value;
      });
    }

    // 사업자번호 하이픈 자동 추가
    const cNumberInput = document.getElementById('edit_cNumber');
    if (cNumberInput) {
      cNumberInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/[^0-9]/g, '');
        if (value.length > 10) {
          value = value.substring(0, 10);
        }
        if (value.length > 5) {
          value = value.substring(0, 3) + '-' + value.substring(3, 5) + '-' + value.substring(5);
        } else if (value.length > 3) {
          value = value.substring(0, 3) + '-' + value.substring(3);
        }
        e.target.value = value;
      });
    }

    // 법인번호 하이픈 자동 추가
    const lNumberInput = document.getElementById('edit_lNumber');
    if (lNumberInput) {
      lNumberInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/[^0-9]/g, '');
        if (value.length > 13) {
          value = value.substring(0, 13);
        }
        if (value.length > 6) {
          value = value.substring(0, 6) + '-' + value.substring(6);
        }
        e.target.value = value;
      });
    }
  };

  // 회사 정보 저장 함수
  const saveCompanyInfo = async (companyNum) => {
    try {
      // 입력값 가져오기
      const jumin = document.getElementById('edit_jumin')?.value.trim() || '';
      const company = document.getElementById('edit_company')?.value.trim() || '';
      const Pname = document.getElementById('edit_Pname')?.value.trim() || '';
      const hphone = document.getElementById('edit_hphone')?.value.trim() || '';
      const cphone = document.getElementById('edit_cphone')?.value.trim() || '';
      const cNumber = document.getElementById('edit_cNumber')?.value.trim() || '';
      const lNumber = document.getElementById('edit_lNumber')?.value.trim() || '';
      const postNum = document.getElementById('edit_postNum')?.value.trim() || '';
      const address1 = document.getElementById('edit_address1')?.value.trim() || '';
      const address2 = document.getElementById('edit_address2')?.value.trim() || '';

      // 필수 입력 검증
      if (!jumin) {
        alert('주민번호는 필수 입력 항목입니다.');
        document.getElementById('edit_jumin')?.focus();
        return;
      }

      // 주민번호 13자리 확인
      const juminDigits = jumin.replace(/[^0-9]/g, '');
      if (juminDigits.length !== 13) {
        alert('주민번호는 13자리 숫자여야 합니다.');
        document.getElementById('edit_jumin')?.focus();
        return;
      }

      if (!company) {
        alert('대리운전회사명은 필수 입력 항목입니다.');
        document.getElementById('edit_company')?.focus();
        return;
      }

      if (!Pname) {
        alert('대표자는 필수 입력 항목입니다.');
        document.getElementById('edit_Pname')?.focus();
        return;
      }

      // 저장 확인
      if (!confirm('대리운전회사 정보를 수정하시겠습니까?')) {
        return;
      }

      // 저장 버튼 비활성화
      const saveBtn = document.getElementById('saveCompanyInfoBtn');
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 저장 중...';
      }

      // API 호출
      const response = await fetch('/api/insurance/kj-company/store', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dNum: companyNum,
          jumin: jumin,
          company: company,
          Pname: Pname,
          hphone: hphone,
          cphone: cphone,
          cNumber: cNumber,
          lNumber: lNumber,
          postNum: postNum,
          address1: address1,
          address2: address2
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '저장 실패');
      }

      // 성공 메시지 표시
      showSuccessMessage(result.message || '대리운전회사 정보가 수정되었습니다.');

      // 모달 재로드 (수정된 정보 반영)
      setTimeout(() => {
        window.KJCompanyModal.openCompanyModal(companyNum, company, true);
      }, 300);

      // 목록 새로고침 (페이지에 fetchList 함수가 있는 경우)
      if (typeof fetchList === 'function') {
        setTimeout(() => {
          fetchList();
        }, 500);
      }

    } catch (error) {
      console.error('회사 정보 수정 오류:', error);
      alert('수정 중 오류가 발생했습니다: ' + (error.message || '알 수 없는 오류'));
      
      const saveBtn = document.getElementById('saveCompanyInfoBtn');
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fas fa-save"></i> 저장';
      }
    }
  };

  // ==================== 모달 이벤트 핸들러 설정 ====================

  const setupModalEventHandlers = (companyNum, companyName) => {
    const modalBody = document.getElementById('companyInfoModalBody');

    // 입력 이벤트: 저장 버튼 상태 토글
    modalBody.addEventListener('input', (e) => {
      const row = e.target.closest('tr[data-row-index]');
      if (!row) return;
      if (e.target.classList.contains('certi-field') || e.target.classList.contains('insurer-select')) {
        toggleSaveState(row);
      }
    });

    // 변경 이벤트: 회차 변경 및 저장 버튼 상태 토글
    modalBody.addEventListener('change', async (e) => {
      const row = e.target.closest('tr[data-row-index]');
      if (!row) return;
      
      // 회차 변경 처리
      if (e.target.classList.contains('certi-field') && e.target.dataset.field === 'nabang_1') {
        const certiNum = row.dataset.certiNum;
        const nabsunso = e.target.value;
        const sunso = row.dataset.rowIndex;
        
        if (!certiNum || !nabsunso) return;
        
        // 회차 변경 확인
        if (!confirm(`${nabsunso}회차로 변경하시겠습니까?`)) {
          const originalValue = e.target.dataset.originalValue || '';
          e.target.value = originalValue;
          return;
        }
        
        // 원래 값 저장
        if (!e.target.dataset.originalValue) {
          e.target.dataset.originalValue = e.target.value;
        }
        
        // 버튼 비활성화
        e.target.disabled = true;
        
        try {
          const response = await fetch(`/api/insurance/kj-certi/update-nabang?nabsunso=${nabsunso}&certiTableNum=${certiNum}&sunso=${sunso}`);
          const result = await response.json();
          
          if (!result.success) {
            throw new Error(result.error || '회차 변경 실패');
          }
          
          // 성공 시 해당 행의 상태 업데이트
          const naColor = result.naColor || '1';
          const naState = result.naState || '';
          const stateCell = row.querySelector('td:nth-child(8)'); // 상태 셀
          
          if (stateCell) {
            const naStateColor = naColor == 1 ? '#666666' : (naColor == 2 ? 'red' : '#666666');
            stateCell.style.color = naStateColor;
            stateCell.textContent = naState;
          }
          
          // 성공 메시지 표시
          showSuccessMessage(result.message || `${nabsunso}회차로 변경되었습니다.`);
          
          // 원래 값 업데이트
          e.target.dataset.originalValue = nabsunso;
          
        } catch (err) {
          console.error('회차 변경 오류:', err);
          alert('회차 변경 중 오류가 발생했습니다: ' + (err.message || '알 수 없는 오류'));
          e.target.value = e.target.dataset.originalValue || '';
        } finally {
          e.target.disabled = false;
        }
        
        return;
      }
      
      // 증권성격 변경 처리
      if (e.target.classList.contains('certi-field') && e.target.dataset.field === 'gita') {
        const certiNum = row.dataset.certiNum;
        const gita = e.target.value;
        
        if (!certiNum || !gita) return;
        
        // 증권성격 변경 확인 (공통 모듈 사용)
        const gitaLabel = window.KJConstants ? window.KJConstants.getGitaName(gita) : 
          ({ 1: '일반', 2: '탁송', 3: '일반/렌트', 4: '탁송/렌트', 5: '확대탁송' }[gita] || gita);
        
        if (!confirm(`증권성격을 "${gitaLabel}"로 변경하시겠습니까?`)) {
          const originalValue = e.target.dataset.originalValue || '';
          e.target.value = originalValue;
          return;
        }
        
        // 원래 값 저장
        if (!e.target.dataset.originalValue) {
          e.target.dataset.originalValue = e.target.value;
        }
        
        // 버튼 비활성화
        e.target.disabled = true;
        
        try {
          const response = await fetch(`/api/insurance/kj-certi/update-gita?cNum=${certiNum}&gita=${gita}`);
          const result = await response.json();
          
          if (!result.success) {
            throw new Error(result.error || '증권성격 변경 실패');
          }
          
          // 성공 메시지 표시
          showSuccessMessage(result.message || '증권성격이 변경되었습니다.');
          
          // 원래 값 업데이트
          e.target.dataset.originalValue = gita;
          
        } catch (err) {
          console.error('증권성격 변경 오류:', err);
          alert('증권성격 변경 중 오류가 발생했습니다: ' + (err.message || '알 수 없는 오류'));
          e.target.value = e.target.dataset.originalValue || '';
        } finally {
          e.target.disabled = false;
        }
        
        return;
      }
      
      // 저장 버튼 상태 토글
      if (e.target.classList.contains('certi-field') || e.target.classList.contains('insurer-select')) {
        toggleSaveState(row);
      }
    });

    // 클릭 이벤트: 인원 버튼
    modalBody.addEventListener('click', async (e) => {
      const memberBtn = e.target.closest('.certi-member-btn');
      if (memberBtn && !memberBtn.disabled) {
        const certiNum = memberBtn.dataset.certiNum;
        if (certiNum) {
          openMemberListModal(certiNum);
        }
        return;
      }
      
      // 배서 버튼 클릭
      const endorseBtn = e.target.closest('.certi-endorse-btn');
      if (endorseBtn && !endorseBtn.disabled) {
        const row = endorseBtn.closest('tr[data-row-index]');
        if (!row) return;
        
        const certiNum = row.dataset.certiNum;
        if (!certiNum) return;
        
        // 증권 정보 가져오기
        const insurerSelect = row.querySelector('[data-field="InsuraneCompany"]');
        const policyInput = row.querySelector('[data-field="policyNum"]');
        const gitaSelect = row.querySelector('[data-field="gita"]');
        
        const insurerCode = insurerSelect ? Number(insurerSelect.value) : 0;
        const policyNum = policyInput ? policyInput.value : '';
        const gita = gitaSelect ? Number(gitaSelect.value) : 1;
        
        // 회사번호 가져오기 (회사 정보 모달에서)
        const companyInfoModal = document.getElementById('companyInfoModal');
        const companyNum = companyInfoModal ? (companyInfoModal.dataset.currentCompanyNum || companyInfoModal.dataset.companyNum) : null;
        
        openEndorseModal(certiNum, insurerCode, policyNum, gita, companyNum);
        return;
      }
      
      // 월보험료 버튼 클릭
      const premiumBtn = e.target.closest('.certi-premium-btn');
      if (premiumBtn && !premiumBtn.disabled) {
        const row = premiumBtn.closest('tr[data-row-index]');
        if (!row) return;
        
        const certiNum = row.dataset.certiNum;
        if (!certiNum) return;
        
        openPremiumModal(certiNum);
        return;
      }
      
      // 결제방식 버튼 클릭 (토글)
      const diviBtn = e.target.closest('.certi-divi-btn');
      if (diviBtn && !diviBtn.disabled) {
        const row = diviBtn.closest('tr[data-row-index]');
        if (!row) return;
        
        const certiNum = row.dataset.certiNum;
        if (!certiNum) return;
        
        const currentDivi = parseInt(diviBtn.dataset.divi) || 1;
        const newDivi = currentDivi == 1 ? 2 : 1;
        const diviName = newDivi == 1 ? '정상납' : '월납';
        
        // 변경 확인
        if (!confirm(`결제방식을 "${diviName}"로 변경하시겠습니까?`)) {
          return;
        }
        
        // 버튼 비활성화
        diviBtn.disabled = true;
        const originalText = diviBtn.textContent;
        diviBtn.textContent = '변경 중...';
        
        try {
          const response = await fetch(`/api/insurance/kj-certi/update-divi?cNum=${certiNum}&divi=${currentDivi}`);
          const result = await response.json();
          
          if (!result.success) {
            throw new Error(result.error || '결제방식 변경 실패');
          }
          
          // 버튼 업데이트
          diviBtn.dataset.divi = result.divi;
          diviBtn.textContent = result.diviName || mapDivi(result.divi);
          
          // 월보험료 버튼 텍스트 업데이트
          const premiumBtn = row.querySelector('.certi-premium-btn');
          if (premiumBtn) {
            premiumBtn.textContent = result.divi == 2 ? '보험료' : '입력';
          }
          
          // 성공 메시지 표시
          showSuccessMessage(result.message || `결제방식이 "${result.diviName}"로 변경되었습니다.`);
          
        } catch (err) {
          console.error('결제방식 변경 오류:', err);
          alert('결제방식 변경 중 오류가 발생했습니다: ' + (err.message || '알 수 없는 오류'));
          diviBtn.textContent = originalText;
        } finally {
          diviBtn.disabled = false;
        }
        
        return;
      }
    });

    // 클릭 이벤트: 저장/수정 버튼
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
        
        // 성공 메시지 표시
        const successMsg = result.message || (isNew ? '저장되었습니다.' : '수정되었습니다.');
        showSuccessMessage(successMsg);
        
        // 모달 재조회 (이미 열려있는 모달이므로 skipShow=true)
        setTimeout(() => {
          window.KJCompanyModal.openCompanyModal(companyNum, companyName, true);
        }, 300);
        
      } catch (err) {
        console.error('증권 정보 저장 오류:', err);
        alert('저장 중 오류가 발생했습니다: ' + (err.message || '알 수 없는 오류'));
        btn.disabled = false;
        btn.textContent = originalText;
      }
    });
  };

  // ==================== 신규 등록 모달 ====================

  // 신규 등록 모달 열기
  const openNewCompanyModal = () => {
    const modalElement = document.getElementById('companyInfoModal');
    const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
    const modalBody = document.getElementById('companyInfoModalBody');
    
    // 모달 제목 변경
    const modalTitle = document.getElementById('companyInfoModalLabel');
    if (modalTitle) {
      modalTitle.textContent = '대리운전회사 신규 등록';
    }
    
    // 신규 등록 모드 표시
    modalElement.dataset.isNewCompany = 'true';
    modalElement.dataset.currentCompanyNum = '';
    
    // 신규 등록 폼 렌더링
    modalBody.innerHTML = `
      <div class="mb-3">
        <h6>기본 정보</h6>
        <div class="row">
          <div class="col-12">
            <table class="table table-sm table-bordered mb-0">
              <tr>
                <th class="bg-light" style="width: 15%;">주민번호 <span class="text-danger">*</span></th>
                <td style="width: 20%;">
                  <input type="text" class="form-control form-control-sm" id="d_Jumin" 
                         placeholder="660327-1069017" 
                         maxlength="14"
                         autocomplete="off">
                  <small class="text-muted">주민번호 입력 후 엔터키를 눌러주세요.</small>
                </td>
                <th class="bg-light" style="width: 15%;">대리운전회사 <span class="text-danger">*</span></th>
                <td style="width: 20%;">
                  <input type="text" class="form-control form-control-sm" id="d_company" 
                         placeholder="회사명" autocomplete="off">
                </td>
                <th class="bg-light" style="width: 15%;">성명 <span class="text-danger">*</span></th>
                <td style="width: 15%;">
                  <input type="text" class="form-control form-control-sm" id="d_Pname" 
                         placeholder="대표자명" autocomplete="off">
                </td>
              </tr>
              <tr>
                <th class="bg-light">핸드폰번호</th>
                <td>
                  <input type="text" class="form-control form-control-sm" id="daeri_hphone" 
                         placeholder="010-1234-5678" autocomplete="off">
                </td>
                <th class="bg-light">전화번호</th>
                <td>
                  <input type="text" class="form-control form-control-sm" id="d_cphone" 
                         placeholder="02-1234-5678" autocomplete="off">
                </td>
                <th class="bg-light">사업자번호</th>
                <td>
                  <input type="text" class="form-control form-control-sm" id="d_cNumber" 
                         placeholder="사업자번호" autocomplete="off">
                </td>
              </tr>
              <tr>
                <th class="bg-light">법인번호</th>
                <td colspan="5">
                  <input type="text" class="form-control form-control-sm" id="d_lNumber" 
                         placeholder="법인번호" autocomplete="off">
                </td>
              </tr>
            </table>
          </div>
        </div>
      </div>
      <div class="alert alert-info" id="juminCheckResult" style="display: none;">
        <i class="fas fa-info-circle"></i> <span id="juminCheckMessage"></span>
      </div>
      <div class="alert alert-secondary mt-3">
        <i class="fas fa-info-circle"></i> 저장 후 증권 정보를 입력할 수 있습니다.
      </div>
    `;
    
    modal.show();
    
    // 주민번호 입력 필드에 이벤트 리스너 추가
    setupNewCompanyModalEvents();
  };

  // 신규 등록 모달 이벤트 설정
  const setupNewCompanyModalEvents = () => {
    const juminInput = document.getElementById('d_Jumin');
    const companyInput = document.getElementById('d_company');
    const pnameInput = document.getElementById('d_Pname');
    const hphoneInput = document.getElementById('daeri_hphone');
    const cphoneInput = document.getElementById('d_cphone');
    const cNumberInput = document.getElementById('d_cNumber');
    const lNumberInput = document.getElementById('d_lNumber');
    
    // 주민번호 검증 결과 저장
    const juminCheckResult = {
      checked: false,
      exists: false,
      dNum: null,
      isValid: false
    };

    // 주민번호 입력 필드 포맷팅 및 검증
    if (juminInput) {
      // 주민번호 하이픈 자동 추가
      juminInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/[^0-9]/g, '');
        if (value.length > 6) {
          value = value.substring(0, 6) + '-' + value.substring(6, 13);
        }
        e.target.value = value;
        
        // 형식 검증
        const juminRegex = /^\d{6}-\d{7}$/;
        juminCheckResult.isValid = juminRegex.test(value);
        
        // 검증 결과 초기화
        if (juminCheckResult.checked) {
          juminCheckResult.checked = false;
          juminCheckResult.exists = false;
          juminCheckResult.dNum = null;
          const resultDiv = document.getElementById('juminCheckResult');
          if (resultDiv) resultDiv.style.display = 'none';
        }
      });

      // 엔터키로 주민번호 검증
      juminInput.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          
          const juminValue = juminInput.value.trim();
          
          // 숫자만 추출하여 13자리인지 확인
          const juminDigits = juminValue.replace(/[^0-9]/g, '');
          
          if (juminDigits.length !== 13) {
            alert('주민번호는 13자리 숫자여야 합니다. 예: 660327-1069017');
            juminInput.focus();
            return;
          }

          // 서버에서 주민번호로 기존 회사 조회
          try {
            const resultDiv = document.getElementById('juminCheckResult');
            const resultMessage = document.getElementById('juminCheckMessage');
            
            if (resultDiv && resultMessage) {
              resultDiv.style.display = 'block';
              resultDiv.className = 'alert alert-info';
              resultMessage.textContent = '주민번호 확인 중...';
            }

            const response = await fetch(`/api/insurance/kj-company/check-jumin?jumin=${encodeURIComponent(juminValue)}`);
            const data = await response.json();

            juminCheckResult.checked = true;
            juminCheckResult.exists = data.exists || false;
            juminCheckResult.dNum = data.dNum || null;

            if (data.exists && data.dNum) {
              // 기존 회사 존재 - 해당 회사 정보 불러오기
              if (resultDiv && resultMessage) {
                resultDiv.className = 'alert alert-warning';
                resultMessage.textContent = '이미 등록된 주민번호입니다. 기존 회사 정보를 불러옵니다.';
              }
              
              alert('이미 등록된 주민번호입니다. 기존 회사 정보를 불러옵니다.');
              
              // 기존 회사 정보 불러오기
              setTimeout(() => {
                window.KJCompanyModal.openCompanyModal(data.dNum, '', false);
              }, 300);
            } else {
              // 신규 등록 가능
              if (resultDiv && resultMessage) {
                resultDiv.className = 'alert alert-success';
                resultMessage.textContent = '신규 등록 가능한 주민번호입니다.';
              }
              
              alert('신규 등록 가능한 주민번호입니다.');
              
              // 회사명 입력 필드로 포커스 이동
              if (companyInput) {
                companyInput.focus();
              }
            }
          } catch (error) {
            console.error('주민번호 확인 중 오류 발생:', error);
            alert('주민번호 확인 중 오류가 발생했습니다.');
            
            const resultDiv = document.getElementById('juminCheckResult');
            const resultMessage = document.getElementById('juminCheckMessage');
            if (resultDiv && resultMessage) {
              resultDiv.className = 'alert alert-danger';
              resultMessage.textContent = '주민번호 확인 중 오류가 발생했습니다.';
            }
            
            juminCheckResult.checked = false;
          }
        }
      });
    }

    // 핸드폰번호 하이픈 자동 추가
    if (hphoneInput) {
      hphoneInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/[^0-9]/g, '');
        if (value.length > 10) {
          value = value.substring(0, 3) + '-' + value.substring(3, 7) + '-' + value.substring(7, 11);
        } else if (value.length > 7) {
          value = value.substring(0, 3) + '-' + value.substring(3, 7) + '-' + value.substring(7);
        } else if (value.length > 3) {
          value = value.substring(0, 3) + '-' + value.substring(3);
        }
        e.target.value = value;
      });
    }

    // 일반전화 하이픈 자동 추가 (02-1234-5678 형식)
    if (cphoneInput) {
      cphoneInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/[^0-9]/g, '');
        if (value.length > 9) {
          // 02-1234-5678 형식 (2자리-4자리-4자리)
          value = value.substring(0, 2) + '-' + value.substring(2, 6) + '-' + value.substring(6, 10);
        } else if (value.length > 6) {
          value = value.substring(0, 2) + '-' + value.substring(2, 6) + '-' + value.substring(6);
        } else if (value.length > 2) {
          value = value.substring(0, 2) + '-' + value.substring(2);
        }
        e.target.value = value;
      });
    }

    // 사업자번호 하이픈 자동 추가 (123-45-67890 형식)
    if (cNumberInput) {
      cNumberInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/[^0-9]/g, '');
        if (value.length > 10) {
          value = value.substring(0, 10); // 10자리까지만
        }
        if (value.length > 5) {
          // 123-45-67890 형식 (3자리-2자리-5자리)
          value = value.substring(0, 3) + '-' + value.substring(3, 5) + '-' + value.substring(5);
        } else if (value.length > 3) {
          value = value.substring(0, 3) + '-' + value.substring(3);
        }
        e.target.value = value;
      });
    }

    // 법인번호 하이픈 자동 추가 (123456-1234567 형식)
    if (lNumberInput) {
      lNumberInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/[^0-9]/g, '');
        if (value.length > 13) {
          value = value.substring(0, 13); // 13자리까지만
        }
        if (value.length > 6) {
          // 123456-1234567 형식 (6자리-7자리)
          value = value.substring(0, 6) + '-' + value.substring(6);
        }
        e.target.value = value;
      });
    }

    // 저장 버튼 추가 (모달 푸터에)
    const modalFooter = document.querySelector('#companyInfoModal .modal-footer');
    if (modalFooter) {
      // 기존 저장 버튼 제거
      const existingSaveBtn = modalFooter.querySelector('#saveNewCompanyBtn');
      if (existingSaveBtn) existingSaveBtn.remove();
      
      // 닫기 버튼 제거 (신규 등록 모달에서는 닫기 버튼 숨김)
      const closeBtn = modalFooter.querySelector('.btn-secondary');
      if (closeBtn) {
        closeBtn.style.display = 'none';
      }
      
      // 새 저장 버튼 추가
      const saveBtn = document.createElement('button');
      saveBtn.id = 'saveNewCompanyBtn';
      saveBtn.type = 'button';
      saveBtn.className = 'btn btn-primary';
      saveBtn.textContent = '저장';
      saveBtn.addEventListener('click', async () => {
        await saveNewCompany(juminCheckResult);
      });
      
      modalFooter.appendChild(saveBtn);
    }
  };

  // 신규 회사 저장 함수
  const saveNewCompany = async (juminCheckResult) => {
    try {
      // 주민번호 검증 확인
      if (!juminCheckResult.checked) {
        alert('주민번호를 먼저 확인해주세요. (주민번호 입력 후 엔터키)');
        const juminInput = document.getElementById('d_Jumin');
        if (juminInput) juminInput.focus();
        return;
      }

      if (juminCheckResult.exists) {
        alert('이미 등록된 주민번호입니다. 기존 회사 정보를 확인해주세요.');
        return;
      }

      // 필수 입력 필드 검증
      const jumin = document.getElementById('d_Jumin')?.value.trim() || '';
      const company = document.getElementById('d_company')?.value.trim() || '';
      const Pname = document.getElementById('d_Pname')?.value.trim() || '';
      const hphone = document.getElementById('daeri_hphone')?.value.trim() || '';
      const cphone = document.getElementById('d_cphone')?.value.trim() || '';
      const cNumber = document.getElementById('d_cNumber')?.value.trim() || '';
      const lNumber = document.getElementById('d_lNumber')?.value.trim() || '';

      if (!jumin) {
        alert('주민번호는 필수 입력 항목입니다.');
        document.getElementById('d_Jumin')?.focus();
        return;
      }

      // 주민번호 13자리 확인
      const juminDigits = jumin.replace(/[^0-9]/g, '');
      if (juminDigits.length !== 13) {
        alert('주민번호는 13자리 숫자여야 합니다.');
        document.getElementById('d_Jumin')?.focus();
        return;
      }

      if (!company) {
        alert('대리운전회사명은 필수 입력 항목입니다.');
        document.getElementById('d_company')?.focus();
        return;
      }

      if (!Pname) {
        alert('대표자는 필수 입력 항목입니다.');
        document.getElementById('d_Pname')?.focus();
        return;
      }

      // 저장 확인
      if (!confirm('대리운전회사를 신규로 등록하시겠습니까?')) {
        return;
      }

      // 저장 버튼 비활성화
      const saveBtn = document.getElementById('saveNewCompanyBtn');
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = '저장 중...';
      }

      // API 호출
      const response = await fetch('/api/insurance/kj-company/store', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jumin: jumin,
          company: company,
          Pname: Pname,
          hphone: hphone,
          cphone: cphone,
          cNumber: cNumber,
          lNumber: lNumber
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '저장 실패');
      }

      // 성공 메시지 표시
      showSuccessMessage(result.message || '대리운전회사가 신규로 저장되었습니다.');

      // 모달 닫기
      const modalElement = document.getElementById('companyInfoModal');
      const modal = bootstrap.Modal.getInstance(modalElement);
      if (modal) {
        modal.hide();
      }

      // 저장된 회사 정보로 모달 다시 열기
      if (result.dNum) {
        setTimeout(() => {
          window.KJCompanyModal.openCompanyModal(result.dNum, company, false);
        }, 300);
      }

      // 목록 새로고침 (페이지에 fetchList 함수가 있는 경우)
      if (typeof fetchList === 'function') {
        setTimeout(() => {
          fetchList();
        }, 500);
      }

    } catch (error) {
      console.error('신규 회사 저장 오류:', error);
      alert('저장 중 오류가 발생했습니다: ' + (error.message || '알 수 없는 오류'));
      
      const saveBtn = document.getElementById('saveNewCompanyBtn');
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = '저장';
      }
    }
  };

  // ==================== 모달 열기 함수 ====================

  const openCompanyModal = (companyNum, companyName, skipShow = false) => {
    const modalElement = document.getElementById('companyInfoModal');
    const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
    const modalBody = document.getElementById('companyInfoModalBody');
    
    // 모달 제목 복원
    const modalTitle = document.getElementById('companyInfoModalLabel');
    if (modalTitle) {
      modalTitle.textContent = '대리운전회사 정보';
    }
    
    // 신규 등록 모드 해제
    delete modalElement.dataset.isNewCompany;
    
    // 모달이 이미 열려있고 같은 회사 정보를 로드하는 경우 스킵
    if (!skipShow && modalElement.classList.contains('show')) {
      const currentCompanyNum = modalElement.dataset.currentCompanyNum;
      if (currentCompanyNum === String(companyNum)) {
        return; // 이미 같은 회사 정보가 로드되어 있음
      }
    }
    
    modalElement.dataset.currentCompanyNum = String(companyNum);
    
    // 신규 등록 저장 버튼 제거
    const saveBtn = document.getElementById('saveNewCompanyBtn');
    if (saveBtn) saveBtn.remove();
    
    // 닫기 버튼 다시 표시 (일반 모달에서는 닫기 버튼 필요)
    const modalFooter = document.querySelector('#companyInfoModal .modal-footer');
    if (modalFooter) {
      const closeBtn = modalFooter.querySelector('.btn-secondary');
      if (closeBtn) {
        closeBtn.style.display = '';
      }
    }
    
    modalBody.innerHTML = `
      <div class="text-center py-4">
        <div class="spinner-border" role="status">
          <span class="visually-hidden">로딩 중...</span>
        </div>
        <p class="mt-2">회사 정보를 불러오는 중...</p>
      </div>
    `;
    
    if (!skipShow) {
      modal.show();
    }
    
    // API 호출
    fetch(`/api/insurance/kj-company/${companyNum}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          renderCompanyModal(data, companyName, companyNum);
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

  // ==================== 대리기사 리스트 모달 ====================

  // 대리기사 리스트 모달 열기
  const openMemberListModal = (certiTableNum, page = 1, limit = 20) => {
    const modalElement = document.getElementById('memberListModal');
    const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
    const modalBody = document.getElementById('memberListModalBody');
    
    // 현재 증권 번호와 페이지 정보 저장
    modalElement.dataset.certiTableNum = certiTableNum;
    modalElement.dataset.currentPage = page;
    modalElement.dataset.currentLimit = limit;
    
    modalBody.innerHTML = `
      <div class="text-center py-4">
        <div class="spinner-border" role="status">
          <span class="visually-hidden">로딩 중...</span>
        </div>
        <p class="mt-2">대리기사 정보를 불러오는 중...</p>
      </div>
    `;
    
    modal.show();
    
    // API 호출
    fetch(`/api/insurance/kj-certi/member-list?certiTableNum=${certiTableNum}&page=${page}&limit=${limit}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          renderMemberListModal(data, certiTableNum);
        } else {
          throw new Error(data.error || '대리기사 정보를 불러올 수 없습니다.');
        }
      })
      .catch(err => {
        console.error('대리기사 정보 로드 오류:', err);
        modalBody.innerHTML = `
          <div class="alert alert-danger">
            <i class="fas fa-exclamation-circle"></i>
            대리기사 정보를 불러올 수 없습니다: ${err.message}
          </div>
        `;
      });
  };

  // 대리기사 리스트 모달 렌더링
  const renderMemberListModal = (data, certiTableNum) => {
    const modalBody = document.getElementById('memberListModalBody');
    const modalElement = document.getElementById('memberListModal');
    const members = data.data || [];
    const pagination = data.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 };
    const { page, limit, total, totalPages } = pagination;
    
    if (members.length === 0) {
      modalBody.innerHTML = `
        <div class="alert alert-info">
          <i class="fas fa-info-circle"></i>
          등록된 대리기사가 없습니다.
        </div>
      `;
      return;
    }
    
    // 상태 매핑 함수
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
    
    // 보험사 코드 매핑 (공통 모듈 사용)
    const mapInsuranceCompany = (code) => {
      if (window.KJConstants) {
        return window.KJConstants.getInsurerName(code);
      }
      // Fallback (공통 모듈이 없을 경우)
      const v = Number(code);
      switch (v) {
        case 1: return '흥국';
        case 2: return 'DB';
        case 3: return 'KB';
        case 4: return '현대';
        case 5: return '롯데';
        case 6: return '하나';
        case 7: return '한화';
        case 8: return '삼성';
        case 9: return '메리츠';
        default: return '';
      }
    };
    
    // 증권성격 매핑 (기사 조회 결과와 동일, 공통 모듈 사용)
    const mapEtagLabel = (etag) => {
      if (window.KJConstants) {
        return window.KJConstants.getGitaName(etag);
      }
      // Fallback (공통 모듈이 없을 경우)
      const v = Number(etag);
      switch (v) {
        case 1: return '일반';
        case 2: return '탁송';
        case 3: return '일반/렌트';
        case 4: return '탁송/렌트';
        case 5: return '확대탁송';  // 전차량 → 확대탁송으로 통일
        default: return '';
      }
    };
    
    // 페이지네이션 렌더링
    const renderPagination = () => {
      if (totalPages <= 1) return '';
      
      let paginationHtml = `
        <div class="row mt-3">
          <div class="col-md-6 col-12 mb-2">
            <div class="dataTables_info">총 ${total}명 / ${page}/${totalPages} 페이지</div>
          </div>
          <div class="col-md-6 col-12">
            <nav aria-label="Page navigation">
              <ul class="pagination pagination-sm justify-content-center justify-content-md-end mb-0" id="memberListPagination">
      `;
      
      // 이전 버튼
      paginationHtml += `
        <li class="page-item ${page === 1 ? 'disabled' : ''}">
          <a class="page-link" href="#" data-page="${page - 1}" ${page === 1 ? 'tabindex="-1" aria-disabled="true"' : ''}>‹</a>
        </li>
      `;
      
      // 페이지 번호 버튼
      const startPage = Math.max(1, page - 2);
      const endPage = Math.min(totalPages, page + 2);
      
      if (startPage > 1) {
        paginationHtml += `
          <li class="page-item"><a class="page-link" href="#" data-page="1">1</a></li>
        `;
        if (startPage > 2) {
          paginationHtml += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
      }
      
      for (let p = startPage; p <= endPage; p++) {
        paginationHtml += `
          <li class="page-item ${p === page ? 'active' : ''}">
            <a class="page-link" href="#" data-page="${p}">${p}</a>
          </li>
        `;
      }
      
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          paginationHtml += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
        paginationHtml += `
          <li class="page-item"><a class="page-link" href="#" data-page="${totalPages}">${totalPages}</a></li>
        `;
      }
      
      // 다음 버튼
      paginationHtml += `
        <li class="page-item ${page === totalPages ? 'disabled' : ''}">
          <a class="page-link" href="#" data-page="${page + 1}" ${page === totalPages ? 'tabindex="-1" aria-disabled="true"' : ''}>›</a>
        </li>
      `;
      
      paginationHtml += `
              </ul>
            </nav>
          </div>
        </div>
      `;
      
      return paginationHtml;
    };
    
    const startIndex = (page - 1) * limit;
    
    let html = `
      <div class="mb-3">
        <h6>총 ${total}명</h6>
      </div>
      <div class="table-responsive">
        <table class="table table-sm table-bordered table-hover" style="font-size: 0.9rem;">
          <thead class="thead-light">
            <tr>
              <th style="width: 5%;">번호</th>
              <th style="width: 15%;">이름</th>
              <th style="width: 10%;">나이</th>
              <th style="width: 20%;">주민번호</th>
              <th style="width: 15%;">연락처</th>
              <th style="width: 10%;">상태</th>
              <th style="width: 10%;">보험사</th>
              <th style="width: 15%;">기타</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    members.forEach((member, idx) => {
      const bgClass = idx % 2 === 0 ? 'table-light' : '';
      const name = member.Name || '';
      const nai = member.nai || '';
      const jumin = member.Jumin || '';
      const hphone = member.Hphone || '';
      const push = Number(member.push || 0);
      const insuranceCompany = Number(member.InsuranceCompany || 0);
      const etag = Number(member.etag || 0);
      
      // 주민번호 마스킹 제거 (내부 직원용)
      const juminDisplay = jumin || '';
      
      // 표시 번호 (전체 순번)
      const displayIndex = startIndex + idx + 1;
      
      html += `
        <tr class="${bgClass}">
          <td class="text-center">${displayIndex}</td>
          <td>${name}</td>
          <td class="text-center">${nai || ''}</td>
          <td>${juminDisplay}</td>
          <td>${hphone || ''}</td>
          <td class="text-center">${mapPushLabel(push)}</td>
          <td class="text-center">${mapInsuranceCompany(insuranceCompany)}</td>
          <td class="text-center">${mapEtagLabel(etag)}</td>
        </tr>
      `;
    });
    
    html += `
          </tbody>
        </table>
      </div>
      ${renderPagination()}
    `;
    
    modalBody.innerHTML = html;
    
    // 페이지네이션 이벤트 핸들러
    const paginationEl = document.getElementById('memberListPagination');
    if (paginationEl) {
      paginationEl.addEventListener('click', (e) => {
        e.preventDefault();
        const pageLink = e.target.closest('.page-link');
        if (!pageLink || pageLink.closest('.disabled')) return;
        
        const newPage = parseInt(pageLink.dataset.page);
        if (newPage && newPage !== page) {
          const currentCertiTableNum = modalElement.dataset.certiTableNum;
          const currentLimit = parseInt(modalElement.dataset.currentLimit || 20);
          openMemberListModal(currentCertiTableNum, newPage, currentLimit);
        }
      });
    }
  };

  // ==================== 배서 모달 ====================

  // 배서 모달 열기
  // 배서 모달 동적 생성
  const createEndorseModal = () => {
    // 이미 존재하면 반환
    let modalElement = document.getElementById('endorseModal');
    if (modalElement) {
      return modalElement;
    }
    
    // 모달 HTML 동적 생성
    const modalHTML = `
      <div class="modal fade" id="endorseModal" tabindex="-1" aria-labelledby="endorseModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-scrollable" style="max-width: 40%;">
          <div class="modal-content">
            <div class="modal-header" style="background-color: #e8f5e9;">
              <div class="d-flex justify-content-between align-items-center w-100">
                <div>
                  <button type="button" class="btn btn-sm btn-primary me-2" id="endorseExcelUpBtn">ExcelUp</button>
                  <span id="endorseModalTitle" class="ms-2 fw-bold"></span>
                </div>
                <div class="d-flex align-items-center">
                  <label for="endorseDate" class="me-2 mb-0 fw-bold">배서기준일</label>
                  <input type="date" id="endorseDate" class="form-control form-control-sm" style="width: 150px;">
                </div>
              </div>
            </div>
            <div class="modal-body" id="endorseModalBody" style="max-height: 70vh; overflow-y: auto;">
              <!-- 배서 입력 테이블이 여기에 렌더링됩니다 -->
            </div>
            <div class="modal-footer" style="background-color: #e8f5e9;">
              <button type="button" class="btn btn-primary" id="endorseSaveBtn">저장</button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // body에 모달 추가
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    modalElement = document.getElementById('endorseModal');
    
    // 이벤트 리스너 설정
    setupEndorseModalEvents(modalElement);
    
    return modalElement;
  };

  // 배서 모달 이벤트 설정 (이벤트 위임 방식으로 처리하므로 여기서는 모달만 생성)
  const setupEndorseModalEvents = (modalElement) => {
    // 이벤트는 파일 하단의 이벤트 위임으로 처리됨
    // 모달 생성만 수행
  };

  const openEndorseModal = (certiTableNum, insurerCode, policyNum, gita, companyNum) => {
    // 모달이 없으면 생성
    let modalElement = document.getElementById('endorseModal');
    if (!modalElement) {
      modalElement = createEndorseModal();
    }
    
    const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
    const modalBody = document.getElementById('endorseModalBody');
    const modalTitle = document.getElementById('endorseModalTitle');
    const endorseDateInput = document.getElementById('endorseDate');
    
    // 증권 정보 저장
    modalElement.dataset.certiTableNum = certiTableNum;
    modalElement.dataset.insurerCode = insurerCode;
    modalElement.dataset.policyNum = policyNum;
    modalElement.dataset.gita = gita;
    modalElement.dataset.companyNum = companyNum || '';
    
    // 보험사 이름 가져오기
    const insurerName = mapInsuranceCompany(insurerCode);
    
    // 모달 제목 설정
    modalTitle.textContent = `[${insurerName}][${policyNum}]`;
    
    // 배서기준일 기본값: 오늘 날짜
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    endorseDateInput.value = todayStr;
    
    // 배서 입력 테이블 렌더링
    renderEndorseModal(modalBody, gita);
    
    modal.show();
  };

  // 배서 모달 렌더링
  const renderEndorseModal = (modalBody, gita) => {
    // 증권성격 매핑 (공통 모듈 사용)
    const mapGitaLabel = (gita) => {
      if (window.KJConstants) {
        return window.KJConstants.getGitaName(gita);
      }
      // Fallback (공통 모듈이 없을 경우)
      const v = Number(gita);
      switch (v) {
        case 1: return '일반';
        case 2: return '탁송';
        case 3: return '일반/렌트';
        case 4: return '탁송/렌트';
        case 5: return '확대탁송';  // 전차량 → 확대탁송으로 통일
        default: return '일반';
      }
    };
    
    const gitaLabel = mapGitaLabel(gita);
    
    let html = `
      <div class="table-responsive">
        <table class="table table-bordered table-sm" style="font-size: 0.9rem;">
          <thead class="thead-light">
            <tr>
              <th style="width: 5%;">순번</th>
              <th style="width: 20%;">성명</th>
              <th style="width: 25%;">주민번호</th>
              <th style="width: 20%;">핸드폰번호</th>
              <th style="width: 30%;">증권성격</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    // 10개 행 생성 (배경색 하얀색으로 통일)
    for (let i = 0; i < 10; i++) {
      html += `
        <tr style="background-color: #ffffff;" data-endorse-row="${i}">
          <td class="text-center" style="padding: 0;">${i + 1}</td>
          <td style="padding: 0;">
            <input type="text" class="form-control form-control-sm endorse-name-input" data-row="${i}" placeholder="성명" style="background-color: #ffffff; border: none; outline: none; box-shadow: none; width: 100%;">
          </td>
          <td style="padding: 0;">
            <input type="text" class="form-control form-control-sm endorse-jumin-input" data-row="${i}" placeholder="주민번호" style="background-color: #ffffff; border: none; outline: none; box-shadow: none; width: 100%;">
          </td>
          <td style="padding: 0;">
            <input type="text" class="form-control form-control-sm endorse-phone-input" data-row="${i}" placeholder="핸드폰번호" style="background-color: #ffffff; border: none; outline: none; box-shadow: none; width: 100%;">
          </td>
          <td style="padding: 0;">
            <span class="form-control-plaintext">${gitaLabel}</span>
          </td>
        </tr>
      `;
    }
    
    html += `
          </tbody>
        </table>
      </div>
    `;
    
    modalBody.innerHTML = html;
    
    // 주민번호 및 전화번호 하이픈 자동 입력 및 유효성 검사
    setupEndorseInputFormatting(modalBody);
  };
  
  // 주민번호 유효성 검사 함수는 별도 파일에서 로드
  // /js/utils/jumin-validator.js 파일의 validateJumin 함수 사용
  // validateJumin 함수가 없으면 에러 처리
  console.log('[kj-company-modal] 초기화 - validateJumin 함수 확인');
  console.log('[kj-company-modal] typeof validateJumin:', typeof validateJumin);
  console.log('[kj-company-modal] window.validateJumin:', typeof window !== 'undefined' ? typeof window.validateJumin : 'window 없음');
  
  // window 객체에서도 확인
  if (typeof window !== 'undefined' && typeof window.validateJumin === 'function') {
    console.log('[kj-company-modal] window.validateJumin 함수 발견, 전역 변수로 설정');
    if (typeof validateJumin === 'undefined') {
      // 전역 변수로 설정
      var validateJumin = window.validateJumin;
    }
  }
  
  if (typeof validateJumin === 'undefined') {
    console.error('[kj-company-modal] validateJumin 함수를 찾을 수 없습니다. /js/utils/jumin-validator.js 파일을 로드해주세요.');
  } else {
    console.log('[kj-company-modal] validateJumin 함수 확인됨');
  }
  
  // 배서 모달 입력 필드 포맷팅 설정
  const setupEndorseInputFormatting = (modalBody) => {
    // 주민번호 입력 필드 이벤트
    const juminInputs = modalBody.querySelectorAll('.endorse-jumin-input');
    juminInputs.forEach(input => {
      input.addEventListener('input', (e) => {
        let value = e.target.value.replace(/[^0-9]/g, ''); // 숫자만 추출
        
        // 13자리까지만 입력
        if (value.length > 13) {
          value = value.substring(0, 13);
        }
        
        // 하이픈 자동 추가: 6자리 이상이면 하이픈 추가
        if (value.length > 6) {
          value = value.substring(0, 6) + '-' + value.substring(6);
        }
        
        e.target.value = value;
        
        // 13자리 입력 완료 시 즉시 체크섬 검증 및 다음 필드로 이동
        const digits = value.replace(/[^0-9]/g, '');
        console.log('[주민번호 입력] 현재 값:', value, '숫자만:', digits, '길이:', digits.length);
        
        if (digits.length === 13) {
          console.log('[주민번호 입력] 13자리 입력 완료, 유효성 검사 시작');
          
          // 주민번호 유효성 검사 (체크섬 포함)
          // window 객체에서도 확인
          const validateFunc = typeof validateJumin === 'function' ? validateJumin : 
                              (typeof window !== 'undefined' && typeof window.validateJumin === 'function' ? window.validateJumin : null);
          
          if (validateFunc) {
            console.log('[주민번호 입력] validateJumin 함수 존재 확인됨');
            const validation = validateFunc(value);
            console.log('[주민번호 입력] 유효성 검사 결과:', validation);
            
            if (validation.valid) {
              console.log('[주민번호 입력] 유효한 주민번호 - 초록색 표시 및 다음 필드로 이동');
              // 스타일 강제 적용
              e.target.style.setProperty('border-color', '#28a745', 'important');
              e.target.style.setProperty('border-width', '2px', 'important');
              e.target.style.setProperty('border-style', 'solid', 'important');
              e.target.title = '';
              e.target.classList.add('is-valid');
              e.target.classList.remove('is-invalid');
              
              // 다음 입력 필드(전화번호)로 포커스 이동
              const row = e.target.closest('tr[data-endorse-row]');
              console.log('[주민번호 입력] 현재 행 찾기:', row);
              console.log('[주민번호 입력] 현재 행의 data-endorse-row:', row ? row.getAttribute('data-endorse-row') : '없음');
              
              if (row) {
                const phoneInput = row.querySelector('.endorse-phone-input');
                console.log('[주민번호 입력] 전화번호 입력 필드 찾기:', phoneInput);
                console.log('[주민번호 입력] 전화번호 입력 필드 클래스:', phoneInput ? phoneInput.className : '없음');
                
                if (phoneInput) {
                  console.log('[주민번호 입력] 전화번호 입력 필드로 포커스 이동 예정 (150ms 후)');
                  // input 이벤트가 완전히 처리된 후 포커스 이동
                  setTimeout(() => {
                    try {
                      phoneInput.focus();
                      console.log('[주민번호 입력] ✅ 전화번호 입력 필드로 포커스 이동 완료');
                      console.log('[주민번호 입력] 현재 포커스된 요소:', document.activeElement);
                    } catch (err) {
                      console.error('[주민번호 입력] 포커스 이동 실패:', err);
                    }
                  }, 150);
                } else {
                  console.warn('[주민번호 입력] ⚠️ 전화번호 입력 필드를 찾을 수 없습니다.');
                  console.warn('[주민번호 입력] 행 내부 요소들:', row.querySelectorAll('input'));
                }
              } else {
                console.warn('[주민번호 입력] ⚠️ 현재 행을 찾을 수 없습니다.');
                console.warn('[주민번호 입력] e.target:', e.target);
                console.warn('[주민번호 입력] e.target.parentElement:', e.target.parentElement);
              }
            } else {
              console.log('[주민번호 입력] 무효한 주민번호 - 빨간색 표시:', validation.message);
              // 스타일 강제 적용
              e.target.style.setProperty('border-color', '#dc3545', 'important');
              e.target.style.setProperty('border-width', '2px', 'important');
              e.target.style.setProperty('border-style', 'solid', 'important');
              e.target.title = validation.message;
              e.target.classList.add('is-invalid');
              e.target.classList.remove('is-valid');
              console.log('[주민번호 입력] 스타일 적용 확인 - borderColor:', e.target.style.borderColor);
              console.log('[주민번호 입력] 스타일 적용 확인 - computedStyle:', window.getComputedStyle(e.target).borderColor);
            }
          } else {
            console.error('[주민번호 입력] validateJumin 함수를 찾을 수 없습니다.');
            console.error('[주민번호 입력] typeof validateJumin:', typeof validateJumin);
            console.error('[주민번호 입력] window.validateJumin:', typeof window !== 'undefined' ? typeof window.validateJumin : 'window 없음');
            e.target.style.borderColor = '#ffc107'; // 경고 색상
            e.target.title = '주민번호 검증 함수를 로드할 수 없습니다.';
          }
        } else if (value.length === 14 && value.includes('-')) {
          // 형식은 맞지만 13자리가 아닌 경우
          const juminParts = value.split('-');
          if (juminParts[0].length === 6 && juminParts[1].length === 7) {
            // 형식은 맞지만 아직 입력 중
            e.target.style.removeProperty('border-color');
            e.target.style.removeProperty('border-width');
            e.target.style.removeProperty('border-style');
            e.target.title = '';
            e.target.classList.remove('is-valid', 'is-invalid');
          } else {
            // 잘못된 형식
            e.target.style.setProperty('border-color', '#dc3545', 'important');
            e.target.style.setProperty('border-width', '2px', 'important');
            e.target.style.setProperty('border-style', 'solid', 'important');
            e.target.title = '주민번호 형식이 올바르지 않습니다.';
            e.target.classList.add('is-invalid');
          }
        } else if (value.length > 0 && value.length < 14) {
          // 입력 중
          e.target.style.removeProperty('border-color');
          e.target.style.removeProperty('border-width');
          e.target.style.removeProperty('border-style');
          e.target.title = '';
          e.target.classList.remove('is-valid', 'is-invalid');
        } else if (value.length === 0) {
          // 빈 값
          e.target.style.removeProperty('border-color');
          e.target.style.removeProperty('border-width');
          e.target.style.removeProperty('border-style');
          e.target.title = '';
          e.target.classList.remove('is-valid', 'is-invalid');
        }
      });
      
      // 포커스 아웃 시 최종 검증
      input.addEventListener('blur', (e) => {
        let value = e.target.value.trim();
        
        // 빈 값이면 검증하지 않음
        if (!value) {
          e.target.style.removeProperty('border-color');
          e.target.style.removeProperty('border-width');
          e.target.style.removeProperty('border-style');
          e.target.title = '';
          e.target.classList.remove('is-valid', 'is-invalid');
          return;
        }
        
        // 숫자만 추출
        const digits = value.replace(/[^0-9]/g, '');
        
        // 13자리가 아니면 오류
        if (digits.length !== 13) {
          console.log('[주민번호 blur] 13자리가 아님:', digits.length);
          e.target.style.setProperty('border-color', '#dc3545', 'important');
          e.target.style.setProperty('border-width', '2px', 'important');
          e.target.style.setProperty('border-style', 'solid', 'important');
          e.target.title = '주민번호는 13자리여야 합니다.';
          e.target.classList.add('is-invalid');
          return;
        }
        
        // 주민번호 유효성 검사
        console.log('[주민번호 blur] 유효성 검사 시작, 값:', value);
        
        // window 객체에서도 확인
        const validateFunc = typeof validateJumin === 'function' ? validateJumin : 
                            (typeof window !== 'undefined' && typeof window.validateJumin === 'function' ? window.validateJumin : null);
        
        if (validateFunc) {
          console.log('[주민번호 blur] validateJumin 함수 존재 확인됨');
          const validation = validateFunc(value);
          console.log('[주민번호 blur] 유효성 검사 결과:', validation);
          
          if (validation.valid) {
            console.log('[주민번호 blur] 유효한 주민번호 - 초록색 표시');
            // 스타일 강제 적용
            e.target.style.setProperty('border-color', '#28a745', 'important');
            e.target.style.setProperty('border-width', '2px', 'important');
            e.target.style.setProperty('border-style', 'solid', 'important');
            e.target.title = '';
            e.target.classList.add('is-valid');
            e.target.classList.remove('is-invalid');
          } else {
            console.log('[주민번호 blur] 무효한 주민번호 - 빨간색 표시:', validation.message);
            // 스타일 강제 적용
            e.target.style.setProperty('border-color', '#dc3545', 'important');
            e.target.style.setProperty('border-width', '2px', 'important');
            e.target.style.setProperty('border-style', 'solid', 'important');
            e.target.title = validation.message;
            e.target.classList.add('is-invalid');
            e.target.classList.remove('is-valid');
            console.log('[주민번호 blur] 스타일 적용 확인 - borderColor:', e.target.style.borderColor);
            console.log('[주민번호 blur] 스타일 적용 확인 - computedStyle:', window.getComputedStyle(e.target).borderColor);
          }
        } else {
          console.error('[주민번호 blur] validateJumin 함수를 찾을 수 없습니다.');
          console.error('[주민번호 blur] typeof validateJumin:', typeof validateJumin);
          console.error('[주민번호 blur] window.validateJumin:', typeof window !== 'undefined' ? typeof window.validateJumin : 'window 없음');
          e.target.style.borderColor = '#ffc107'; // 경고 색상
          e.target.title = '주민번호 검증 함수를 로드할 수 없습니다.';
        }
      });
      
      // 포커스 인 시에는 검증 결과를 유지 (초기화하지 않음)
      // 사용자가 입력을 계속할 수 있도록 함
      input.addEventListener('focus', (e) => {
        // 포커스 인 시에도 검증 결과 유지
      });
    });
    
    // 전화번호 입력 필드 이벤트
    const phoneInputs = modalBody.querySelectorAll('.endorse-phone-input');
    phoneInputs.forEach(input => {
      input.addEventListener('input', (e) => {
        let value = e.target.value.replace(/[^0-9]/g, ''); // 숫자만 추출
        
        // 11자리까지만 입력
        if (value.length > 11) {
          value = value.substring(0, 11);
        }
        
        // 하이픈 자동 추가
        if (value.length > 10) {
          // 010-XXXX-XXXX 형식
          value = value.substring(0, 3) + '-' + value.substring(3, 7) + '-' + value.substring(7);
        } else if (value.length > 7) {
          // 010-XXXX-XXX 형식
          value = value.substring(0, 3) + '-' + value.substring(3, 7) + '-' + value.substring(7);
        } else if (value.length > 3) {
          // 010-XXXX 형식
          value = value.substring(0, 3) + '-' + value.substring(3);
        }
        
        e.target.value = value;
        
        // 유효성 검사 (11자리 숫자 확인)
        const digitsOnly = value.replace(/[^0-9]/g, '');
        if (digitsOnly.length === 11) {
          // 유효한 형식
          e.target.style.borderColor = '';
        } else if (digitsOnly.length > 0 && digitsOnly.length < 11) {
          // 입력 중
          e.target.style.borderColor = '';
        } else if (digitsOnly.length === 0) {
          // 빈 값
          e.target.style.borderColor = '';
        }
      });
      
      // 포커스 아웃 시 최종 검증
      input.addEventListener('blur', (e) => {
        const digitsOnly = e.target.value.replace(/[^0-9]/g, '');
        if (digitsOnly.length > 0 && digitsOnly.length !== 11) {
          e.target.style.borderColor = '#dc3545';
        } else if (digitsOnly.length === 11) {
          e.target.style.borderColor = '';
        }
      });
    });
  };

  // ==================== 월보험료 모달 ====================

  // 월보험료 모달 동적 생성
  const createPremiumModal = () => {
    // 이미 존재하면 반환
    let modalElement = document.getElementById('premiumModal');
    if (modalElement) {
      return modalElement;
    }
    
    // 모달 HTML 동적 생성
    const modalHTML = `
      <div class="modal fade" id="premiumModal" tabindex="-1" aria-labelledby="premiumModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-scrollable" style="max-width: 80%;">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="premiumModalTitle">월보험료 입력</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body" id="premiumModalBody" style="max-height: 70vh; overflow-y: auto;">
              <div class="text-center py-4">
                <div class="spinner-border" role="status">
                  <span class="visually-hidden">로딩 중...</span>
                </div>
                <p class="mt-2">보험료 정보를 불러오는 중...</p>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-success" id="premiumSaveBtn">저장</button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // body에 모달 추가
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    modalElement = document.getElementById('premiumModal');
    
    return modalElement;
  };

  // 월보험료 모달 열기
  const openPremiumModal = (certiNum) => {
    // 모달이 없으면 생성
    let modalElement = document.getElementById('premiumModal');
    if (!modalElement) {
      modalElement = createPremiumModal();
    }
    
    const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
    const modalBody = document.getElementById('premiumModalBody');
    const modalTitle = document.getElementById('premiumModalTitle');
    
    // 증권 번호 저장
    modalElement.dataset.certiNum = certiNum;
    
    // 저장 버튼 활성화
    const saveBtn = document.getElementById('premiumSaveBtn');
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = '저장';
    }
    
    // 로딩 표시
    modalBody.innerHTML = `
      <div class="text-center py-4">
        <div class="spinner-border" role="status">
          <span class="visually-hidden">로딩 중...</span>
        </div>
        <p class="mt-2">보험료 정보를 불러오는 중...</p>
      </div>
    `;
    
    modal.show();
    
    // API 호출
    fetch(`/api/insurance/kj-premium?cNum=${certiNum}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          // 모달 제목 설정
          const companyName = data.company || '';
          const policyNum = data.policyNum || '';
          modalTitle.textContent = `${companyName} 증권번호 ${policyNum}`;
          
          // 데이터 유무 확인 (저장 버튼 레이블용)
          const hasData = data.data && data.data.some(row => 
            row.ageStart || row.ageEnd || row.monthlyBasic || row.monthlySpecial || 
            row.yearlyBasic || row.yearlySpecial
          );
          
          // 테이블 렌더링
          renderPremiumModal(modalBody, data.data || [], hasData);
        } else {
          throw new Error(data.error || '보험료 정보를 불러올 수 없습니다.');
        }
      })
      .catch(err => {
        console.error('보험료 정보 로드 오류:', err);
        modalBody.innerHTML = `
          <div class="alert alert-danger">
            <i class="fas fa-exclamation-circle"></i>
            보험료 정보를 불러올 수 없습니다: ${err.message}
          </div>
        `;
      });
  };

  // 월보험료 모달 렌더링
  const renderPremiumModal = (modalBody, premiumData, hasData = false) => {
    // 저장 버튼 레이블 변경 및 활성화
    const saveBtn = document.getElementById('premiumSaveBtn');
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = hasData ? '수정' : '저장';
    }
    let html = `
      <div class="table-responsive">
        <table class="table table-bordered table-sm" style="font-size: 0.9rem;">
          <thead class="thead-light" style="background-color: #6f42c1; color: white;">
            <tr>
              <th rowspan="2" style="width: 5%; vertical-align: middle;">순번</th>
              <th colspan="2" style="text-align: center;">나이</th>
              <th colspan="3" style="text-align: center;">월보험료</th>
              <th colspan="3" style="text-align: center;">10회분납</th>
            </tr>
            <tr>
              <th style="width: 8%;">시작</th>
              <th style="width: 8%;">끝</th>
              <th style="width: 10%;">월기본</th>
              <th style="width: 10%;">월특약</th>
              <th style="width: 10%;">합계</th>
              <th style="width: 10%;">년기본</th>
              <th style="width: 10%;">년특약</th>
              <th style="width: 10%;">년계</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    // 숫자 포맷팅 함수 (천단위 컴마)
    const formatNumber = (value) => {
      if (!value && value !== 0) return '';
      const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
      return isNaN(num) ? '' : num.toLocaleString();
    };
    
    // 숫자 값 추출 함수 (컴마 제거)
    const getNumberValue = (value) => {
      if (!value && value !== 0) return '';
      const num = typeof value === 'string' ? value.replace(/,/g, '') : value;
      return num;
    };
    
    // 7개 행 생성 (6개 데이터 + 1개 빈 행)
    for (let i = 0; i < 7; i++) {
      const rowData = premiumData[i] || {};
      const ageStart = rowData.ageStart || '';
      // 999는 표시하지 않음
      const ageEnd = (rowData.ageEnd && rowData.ageEnd != 999) ? rowData.ageEnd : '';
      const monthlyBasic = formatNumber(rowData.monthlyBasic);
      const monthlySpecial = formatNumber(rowData.monthlySpecial);
      const monthlyTotal = formatNumber(rowData.monthlyTotal);
      const yearlyBasic = formatNumber(rowData.yearlyBasic);
      const yearlySpecial = formatNumber(rowData.yearlySpecial);
      const yearlyTotal = formatNumber(rowData.yearlyTotal);
      
      html += `
        <tr data-premium-row="${i}" style="background-color: #ffffff;">
          <td class="text-center" style="vertical-align: middle; padding: 0;">${i + 1}</td>
          <td style="padding: 0;">
            <input type="number" class="form-control form-control-sm premium-age-start" data-row="${i}" value="${ageStart}" placeholder="시작" style="background-color: #ffffff; border: none; width: 100%;">
          </td>
          <td style="padding: 0;">
            <input type="number" class="form-control form-control-sm premium-age-end" data-row="${i}" value="${ageEnd}" placeholder="끝" style="background-color: #ffffff; border: none; width: 100%;">
          </td>
          <td style="padding: 0;">
            <input type="text" class="form-control form-control-sm premium-monthly-basic" data-row="${i}" value="${monthlyBasic}" placeholder="월기본" style="background-color: #ffffff; border: none; width: 100%; text-align: right;">
          </td>
          <td style="padding: 0;">
            <input type="text" class="form-control form-control-sm premium-monthly-special" data-row="${i}" value="${monthlySpecial}" placeholder="월특약" style="background-color: #ffffff; border: none; width: 100%; text-align: right;">
          </td>
          <td style="padding: 0;">
            <input type="text" class="form-control form-control-sm premium-monthly-total" data-row="${i}" value="${monthlyTotal}" placeholder="합계" readonly style="background-color: #ffffff; border: none; width: 100%; text-align: right;">
          </td>
          <td style="padding: 0;">
            <input type="text" class="form-control form-control-sm premium-yearly-basic" data-row="${i}" value="${yearlyBasic}" placeholder="년기본" style="background-color: #ffffff; border: none; width: 100%; text-align: right;">
          </td>
          <td style="padding: 0;">
            <input type="text" class="form-control form-control-sm premium-yearly-special" data-row="${i}" value="${yearlySpecial}" placeholder="년특약" style="background-color: #ffffff; border: none; width: 100%; text-align: right;">
          </td>
          <td style="padding: 0;">
            <input type="text" class="form-control form-control-sm premium-yearly-total" data-row="${i}" value="${yearlyTotal}" placeholder="년계" readonly style="background-color: #ffffff; border: none; width: 100%; text-align: right;">
          </td>
        </tr>
      `;
    }
    
    html += `
          </tbody>
        </table>
      </div>
    `;
    
    modalBody.innerHTML = html;
    
    // 합계 자동 계산 및 나이 연속 입력 이벤트 리스너 추가
    setupPremiumCalculation(modalBody);
  };

  // 월보험료 합계 자동 계산 설정
  const setupPremiumCalculation = (modalBody) => {
    // 숫자 포맷팅 함수 (천단위 컴마)
    const formatNumber = (value) => {
      if (!value && value !== 0) return '';
      const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
      return isNaN(num) ? '' : num.toLocaleString();
    };
    
    // 숫자 값 추출 함수 (컴마 제거)
    const getNumberValue = (value) => {
      if (!value && value !== 0) return '';
      const num = typeof value === 'string' ? value.replace(/,/g, '') : value;
      return num;
    };
    
    modalBody.addEventListener('input', (e) => {
      const row = e.target.closest('tr[data-premium-row]');
      if (!row) return;
      
      const rowIndex = parseInt(e.target.dataset.row);
      
      // 나이 끝 입력 시 다음 행의 시작 자동 설정
      if (e.target.classList.contains('premium-age-end')) {
        const ageEnd = parseInt(e.target.value);
        if (ageEnd && !isNaN(ageEnd) && rowIndex < 6) {
          const nextRow = modalBody.querySelector(`tr[data-premium-row="${rowIndex + 1}"]`);
          if (nextRow) {
            const nextAgeStart = nextRow.querySelector(`.premium-age-start[data-row="${rowIndex + 1}"]`);
            if (nextAgeStart) {
              // 다음 행의 시작이 비어있거나 현재 행의 끝+1과 다르면 자동 설정
              const nextStartValue = parseInt(nextAgeStart.value);
              const expectedNextStart = ageEnd + 1;
              if (!nextAgeStart.value || nextStartValue !== expectedNextStart) {
                nextAgeStart.value = expectedNextStart;
              }
            }
          }
        } else if (!ageEnd || isNaN(ageEnd)) {
          // 나이 끝이 비어있거나 유효하지 않으면 다음 행의 시작도 비우기
          if (rowIndex < 6) {
            const nextRow = modalBody.querySelector(`tr[data-premium-row="${rowIndex + 1}"]`);
            if (nextRow) {
              const nextAgeStart = nextRow.querySelector(`.premium-age-start[data-row="${rowIndex + 1}"]`);
              if (nextAgeStart) {
                // 다음 행의 시작이 현재 행의 끝+1과 같으면 비우기
                const currentStart = parseInt(row.querySelector('.premium-age-start')?.value);
                if (currentStart && nextAgeStart.value == currentStart + 1) {
                  nextAgeStart.value = '';
                }
              }
            }
          }
        }
      }
      
      // 보험료 입력 시 천단위 컴마 포맷팅
      if (e.target.classList.contains('premium-monthly-basic') || 
          e.target.classList.contains('premium-monthly-special') ||
          e.target.classList.contains('premium-yearly-basic') ||
          e.target.classList.contains('premium-yearly-special')) {
        const value = e.target.value.replace(/,/g, '');
        if (value) {
          const num = parseFloat(value);
          if (!isNaN(num)) {
            e.target.value = num.toLocaleString();
          }
        }
      }
      
      // 월보험료 합계 계산
      const monthlyBasic = row.querySelector(`.premium-monthly-basic[data-row="${rowIndex}"]`);
      const monthlySpecial = row.querySelector(`.premium-monthly-special[data-row="${rowIndex}"]`);
      const monthlyTotal = row.querySelector(`.premium-monthly-total[data-row="${rowIndex}"]`);
      
      if (monthlyBasic && monthlySpecial && monthlyTotal) {
        const basic = parseFloat(getNumberValue(monthlyBasic.value)) || 0;
        const special = parseFloat(getNumberValue(monthlySpecial.value)) || 0;
        monthlyTotal.value = formatNumber(basic + special);
      }
      
      // 년보험료 합계 계산
      const yearlyBasic = row.querySelector(`.premium-yearly-basic[data-row="${rowIndex}"]`);
      const yearlySpecial = row.querySelector(`.premium-yearly-special[data-row="${rowIndex}"]`);
      const yearlyTotal = row.querySelector(`.premium-yearly-total[data-row="${rowIndex}"]`);
      
      if (yearlyBasic && yearlySpecial && yearlyTotal) {
        const basic = parseFloat(getNumberValue(yearlyBasic.value)) || 0;
        const special = parseFloat(getNumberValue(yearlySpecial.value)) || 0;
        yearlyTotal.value = formatNumber(basic + special);
      }
    });
  };

  // ==================== 업체 I.D 모달 ====================

  // 업체 I.D 모달 열기
  const handleIdClick = async (dNum) => {
    try {
      const modalElement = document.getElementById('kj-id-modal');
      const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
      const modalBody = document.getElementById('id_list');
      const companyNameEl = document.getElementById('id_daeriCompany');
      
      if (!modalElement || !modalBody || !companyNameEl) {
        console.error('업체 I.D 모달 요소를 찾을 수 없습니다.');
        return;
      }
      
      // 모달 표시
      modal.show();
      
      // 로딩 표시
      companyNameEl.textContent = '';
      modalBody.innerHTML = '<tr><td colspan="6" class="text-center py-4">데이터를 불러오는 중...</td></tr>';
      
      // API 호출
      const response = await fetch('/api/insurance/kj-company/id-list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ dNum: dNum })
      });
      
      const result = await response.json();
      
      // 회사명 표시
      companyNameEl.textContent = '';
      
      // 테이블에 데이터 표시할 변수 초기화
      let id_list = '';
      
      if (result.success && result.data && result.data.length > 0) {
        console.log('대리점 데이터:', result);
        
        // 회사명 표시
        companyNameEl.textContent = result.data[0].company || '';
        
        // 데이터가 배열 형태로 반환되므로 반복문으로 처리
        result.data.forEach(item => {
          if (item.readIs == null || item.readIs === '') {
            item.readIs = '2';
          }
          id_list += `<tr>
            <input type='hidden' id='idNum-${item.num}' value='${item.num}'>
            <td><input type='text' id='newDamdang-${item.num}' value="${item.user || ''}" class='form-control form-control-sm'   
              onkeypress="if(event.key === 'Enter') { validateAndUpdateUser(this, ${item.num}); return false; }" autocomplete="off"></td>
            <td><input type='text' id='newId-${item.num}' value="${item.mem_id || ''}" class='form-control form-control-sm' readonly></td>
            <td><input type='text' id='phone-${item.num}' value="${item.hphone || ''}" class='form-control form-control-sm' oninput="formatPhoneNumber(this)" autocomplete="off"
              onkeypress="if(event.key === 'Enter') { validateAndUpdatePhone(this, ${item.num}); return false; }"  ></td>
            <td><select id='readIs-${item.num}' class='form-select form-select-sm' onChange="updateReadStatus(this, ${item.num})">
                <option value="-1" >선택</option>
                <option value="1" ${item.readIs === '1' ? 'selected' : ''}>읽기전용</option>
                <option value="2" ${item.readIs === '2' ? 'selected' : ''}>모든권한</option>
              </select></td>
            <td><input type='text' id='newPassword-${item.num}' placeholder="비밀번호 입력" class='form-control form-control-sm'
                  onkeypress="if(event.key === 'Enter') { validateAndUpdatePassword(this, ${item.num}); return false; }"
                  oninput="validatePasswordLength(this)"></td>
            <td>
              <select id='newPermit-${item.num}' class='form-select form-select-sm' onChange="updatePermitStatus(this, ${item.num})">
                <option value="-1" >선택</option>
                <option value="1" ${item.permit === '1' ? 'selected' : ''}>허용</option>
                <option value="2" ${item.permit === '2' ? 'selected' : ''}>차단</option>
              </select>
            </td>
          </tr>`;
        });
      } else {
        console.log("데이터가 없거나 API 응답 실패:", result);
      }
      
      // 새 항목 추가를 위한 행은 항상 추가 (데이터가 없는 경우에도)
      const companyValue = (result.success && result.data && result.data.length > 0) ? result.data[0].company : '';
      const hphoneValue = (result.success && result.data && result.data.length > 0) ? result.data[0].hphone : '';
      
      id_list += `<tr>
        <td><input type='text' id='newDamdang' class='form-control form-control-sm' placeholder="담당자성명" autocomplete="off"></td>
        <td><input type='text' id='newId' class='form-control form-control-sm' placeholder="아이디"
               onkeypress="if(event.key === 'Enter') { validateAndCheckId(this); return false; }"
               oninput="validateIdLength(this)" autocomplete="off"></td>
        <td><input type='text' id='phone-new' class='form-control form-control-sm' oninput="formatPhoneNumber(this)" autocomplete="off"></td>
        <td></td>
        <td><input type='text' id='newPassword' placeholder="비밀번호 입력" class='form-control form-control-sm' 
                oninput="validatePasswordLength(this)" autocomplete="off"></td>
        <td><button class="btn btn-primary btn-sm" onclick="id_store('${dNum}','${hphoneValue}','${companyValue}')" >신규아이디 생성</button></td>
      </tr>`;
      
      // 테이블 본문 업데이트
      modalBody.innerHTML = id_list;
      
    } catch (error) {
      console.error("데이터 불러오기 실패:", error);
      alert("데이터를 불러오는 중 오류가 발생했습니다.");
      const modalBody = document.getElementById('id_list');
      if (modalBody) {
        modalBody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-danger">데이터를 불러오는 중 오류가 발생했습니다.</td></tr>';
      }
    }
  };
  
  // 업체 I.D 전역 노출
  window.handleIdClick = handleIdClick;

  // ==================== 전역 노출 ====================

  // window 객체에 모듈 노출
  window.KJCompanyModal = {
    openCompanyModal: openCompanyModal,
    openNewCompanyModal: openNewCompanyModal,
    renderCompanyModal: renderCompanyModal,
    openMemberListModal: openMemberListModal,
    openEndorseModal: openEndorseModal,
    openPremiumModal: openPremiumModal,
    handleIdClick: handleIdClick
  };

  // ==================== 모달 닫기 시 포커스 관리 ====================

  const modalElement = document.getElementById('companyInfoModal');
  if (modalElement) {
    modalElement.addEventListener('hidden.bs.modal', function () {
      // 모달이 완전히 닫힌 후 포커스 정리
      const activeElement = document.activeElement;
      if (activeElement && activeElement.classList.contains('btn-close')) {
        // 포커스를 모달을 열었던 트리거로 이동
        const trigger = document.querySelector('[data-role="open-company-modal"]:focus, [data-role="open-company-modal"]');
        if (trigger) {
          setTimeout(() => {
            trigger.focus();
          }, 100);
        }
      }
      // 모달 데이터 정리
      delete modalElement.dataset.currentCompanyNum;
    });
  }

  // ==================== 모달 트리거 이벤트 위임 ====================

  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-role="open-company-modal"]');
    if (trigger) {
      e.preventDefault();
      e.stopPropagation();
      const companyNum = trigger.dataset.companyNum;
      const companyName = trigger.dataset.companyName;
      if (companyNum) {
        openCompanyModal(companyNum, companyName);
      }
      return;
    }
    
    // 업체 I.D 모달 열기
    const idTrigger = e.target.closest('[data-role="open-company-id-modal"]');
    if (idTrigger) {
      e.preventDefault();
      e.stopPropagation();
      const companyNum = idTrigger.dataset.companyNum;
      if (companyNum) {
        handleIdClick(companyNum);
      }
    }
  });

  // ==================== 배서 모달 이벤트 핸들러 ====================

  // ExcelUp 버튼 클릭 (추후 구현)
  document.addEventListener('click', (e) => {
    if (e.target.id === 'endorseExcelUpBtn') {
      e.preventDefault();
      // TODO: Excel 파일 업로드 기능 구현
      alert('ExcelUp 기능은 추후 구현 예정입니다.');
    }
  });

  // 배서 저장 버튼 클릭
  document.addEventListener('click', async (e) => {
    if (e.target.id === 'endorseSaveBtn') {
      e.preventDefault();
      const modalElement = document.getElementById('endorseModal');
      const modalBody = document.getElementById('endorseModalBody');
      const endorseDateInput = document.getElementById('endorseDate');
      const saveBtn = e.target;
      
      if (!modalElement) {
        alert('배서 모달을 찾을 수 없습니다.');
        return;
      }
      
      const certiTableNum = modalElement.dataset.certiTableNum;
      const insurerCode = modalElement.dataset.insurerCode;
      const policyNum = modalElement.dataset.policyNum;
      const gita = modalElement.dataset.gita;
      const companyNum = modalElement.dataset.companyNum;
      const endorseDate = endorseDateInput.value;
      
      // 필수 정보 확인
      if (!certiTableNum || !companyNum || !endorseDate) {
        alert('필수 정보가 누락되었습니다.');
        return;
      }
      
      // 입력 데이터 수집
      const rows = modalBody.querySelectorAll('tr[data-endorse-row]');
      const members = [];
      
      for (const row of rows) {
        const nameInput = row.querySelector('.endorse-name-input');
        const juminInput = row.querySelector('.endorse-jumin-input');
        const phoneInput = row.querySelector('.endorse-phone-input');
        
        const name = nameInput ? nameInput.value.trim() : '';
        // 주민번호와 전화번호는 하이픈 포함하여 저장
        const jumin = juminInput ? juminInput.value.trim() : '';
        const phone = phoneInput ? phoneInput.value.trim() : '';
        
        // 이름이 있는 경우만 수집 (이름은 필수)
        if (name) {
          // 이름이 있으면 주민번호와 전화번호 둘 다 있어야 함
          if (!jumin || !phone) {
            if (!jumin && !phone) {
              alert(`"${name}"님의 주민번호와 전화번호를 모두 입력해주세요.`);
              // 주민번호 입력 필드로 포커스 이동
              if (juminInput) {
                juminInput.focus();
              }
            } else if (!jumin) {
              alert(`"${name}"님의 주민번호를 입력해주세요.`);
              if (juminInput) {
                juminInput.focus();
              }
            } else if (!phone) {
              alert(`"${name}"님의 전화번호를 입력해주세요.`);
              if (phoneInput) {
                phoneInput.focus();
              }
            }
            return; // 저장 중단
          }
          
          // 주민번호 유효성 검사 (하이픈 포함 값으로 검증)
          // 숫자만 추출하여 길이 확인
          const juminDigits = jumin.replace(/[^0-9]/g, '');
          if (juminDigits.length === 13) {
            const validateFunc = typeof validateJumin === 'function' ? validateJumin : 
                                (typeof window !== 'undefined' && typeof window.validateJumin === 'function' ? window.validateJumin : null);
            
            if (validateFunc) {
              // 하이픈이 포함된 원본 값으로 검증
              const validation = validateFunc(jumin);
              
              if (!validation.valid) {
                alert(`"${name}"님의 주민번호가 유효하지 않습니다.\n${validation.message}\n\n저장할 수 없습니다.`);
                if (juminInput) {
                  juminInput.focus();
                  juminInput.select();
                }
                return; // 저장 중단
              }
            } else {
              console.warn('[배서 저장] validateJumin 함수를 찾을 수 없습니다. 주민번호 유효성 검사를 건너뜁니다.');
            }
          } else {
            alert(`"${name}"님의 주민번호가 13자리가 아닙니다.\n\n저장할 수 없습니다.`);
            if (juminInput) {
              juminInput.focus();
              juminInput.select();
            }
            return; // 저장 중단
          }
          
          // 하이픈 포함하여 저장
          members.push({
            name: name,
            juminNo: jumin,  // 하이픈 포함
            phoneNo: phone   // 하이픈 포함
          });
        }
      }
      
      if (members.length === 0) {
        alert('입력된 대리기사 정보가 없습니다. 최소 1명의 이름을 입력해주세요.');
        return;
      }
      
      // 저장 확인
      if (!confirm(`총 ${members.length}명의 배서 정보를 저장하시겠습니까?`)) {
        return;
      }
      
      // 버튼 비활성화
      saveBtn.disabled = true;
      const originalText = saveBtn.textContent;
      saveBtn.textContent = '저장 중...';
      
      try {
        // 로그인 사용자 이름 가져오기
        const userName = (window.sjTemplateLoader && window.sjTemplateLoader.user && window.sjTemplateLoader.user.name) 
          || sessionStorage.getItem('userName') 
          || localStorage.getItem('userName') 
          || 'system';
        
        console.log('[배서 저장] 로그인 사용자 이름:', userName);
        
        // API 호출 데이터 준비
        const requestData = {
          data: members,
          cNum: certiTableNum,
          dNum: companyNum,
          InsuraneCompany: insurerCode,
          endorseDay: endorseDate,
          policyNum: policyNum,
          gita: gita,
          userName: userName // 로그인 사용자 이름
        };
        
        const response = await fetch('/api/insurance/kj-endorse/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestData)
        });
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || '배서 저장 실패');
        }
        
        // 성공 메시지 표시
        showSuccessMessage(result.message || `배서 정보가 성공적으로 저장되었습니다. (총 ${result.data?.count || members.length}명)`);
        
        // 모달 닫기
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) {
          modal.hide();
        }
        
        // 입력 필드 초기화 (선택사항)
        rows.forEach((row) => {
          const nameInput = row.querySelector('.endorse-name-input');
          const juminInput = row.querySelector('.endorse-jumin-input');
          const phoneInput = row.querySelector('.endorse-phone-input');
          
          if (nameInput) nameInput.value = '';
          if (juminInput) juminInput.value = '';
          if (phoneInput) phoneInput.value = '';
        });
        
      } catch (err) {
        console.error('배서 저장 오류:', err);
        alert('배서 저장 중 오류가 발생했습니다: ' + (err.message || '알 수 없는 오류'));
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = originalText;
      }
    }
  });

  // ==================== 월보험료 모달 이벤트 핸들러 ====================

  // 저장 버튼 클릭 (추후 구현)
  document.addEventListener('click', (e) => {
    if (e.target.id === 'premiumSaveBtn') {
      e.preventDefault();
      const modalElement = document.getElementById('premiumModal');
      const modalBody = document.getElementById('premiumModalBody');
      
      const certiNum = modalElement.dataset.certiNum;
      
      if (!certiNum) {
        alert('증권 번호가 없습니다.');
        return;
      }
      
      // 저장 확인
      const saveBtn = e.target;
      const isUpdate = saveBtn.textContent === '수정';
      if (!confirm(isUpdate ? '보험료 정보를 수정하시겠습니까?' : '보험료 정보를 저장하시겠습니까?')) {
        return;
      }
      
      // 버튼 비활성화
      saveBtn.disabled = true;
      const originalText = saveBtn.textContent;
      saveBtn.textContent = '저장 중...';
      
      // 입력 데이터 수집
      const rows = modalBody.querySelectorAll('tr[data-premium-row]');
      const premiumData = [];
      
      // 컴마 제거 함수
      const removeComma = (value) => {
        if (!value) return '';
        return String(value).replace(/,/g, '');
      };
      
      rows.forEach((row, idx) => {
        const ageStart = row.querySelector('.premium-age-start');
        const ageEnd = row.querySelector('.premium-age-end');
        const monthlyBasic = row.querySelector('.premium-monthly-basic');
        const monthlySpecial = row.querySelector('.premium-monthly-special');
        const monthlyTotal = row.querySelector('.premium-monthly-total');
        const yearlyBasic = row.querySelector('.premium-yearly-basic');
        const yearlySpecial = row.querySelector('.premium-yearly-special');
        const yearlyTotal = row.querySelector('.premium-yearly-total');
        
        // 입력된 행만 수집 (컴마 제거, 필드명 매핑)
        if (ageStart?.value || ageEnd?.value || monthlyBasic?.value || monthlySpecial?.value || 
            yearlyBasic?.value || yearlySpecial?.value) {
          premiumData.push({
            cNum: certiNum,
            rowNum: idx + 1,
            start_month: ageStart?.value || null,
            end_month: ageEnd?.value || null,
            monthly_premium1: removeComma(monthlyBasic?.value) || null,
            monthly_premium2: removeComma(monthlySpecial?.value) || null,
            monthly_premium_total: removeComma(monthlyTotal?.value) || null,
            payment10_premium1: removeComma(yearlyBasic?.value) || null,
            payment10_premium2: removeComma(yearlySpecial?.value) || null,
            payment10_premium_total: removeComma(yearlyTotal?.value) || null
          });
        }
      });
      
      if (premiumData.length === 0) {
        alert('입력된 보험료 정보가 없습니다.');
        saveBtn.disabled = false;
        saveBtn.textContent = originalText;
        return;
      }
      
      // API 호출
      fetch('/api/insurance/kj-premium/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: premiumData
        })
      })
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          showSuccessMessage(result.message || `${premiumData.length}개 행이 저장되었습니다.`);
          
          // 모달 재조회 (데이터 새로고침)
          setTimeout(() => {
            openPremiumModal(certiNum);
          }, 500);
        } else {
          throw new Error(result.error || '저장 실패');
        }
      })
      .catch(err => {
        console.error('월보험료 저장 오류:', err);
        alert('저장 중 오류가 발생했습니다: ' + (err.message || '알 수 없는 오류'));
        saveBtn.disabled = false;
        saveBtn.textContent = originalText;
      });
    }
  });

  // ==================== 업체 I.D 관련 유틸리티 함수 ====================

  // 전화번호 포맷팅 (하이픈 자동 추가)
  window.formatPhoneNumber = function(input) {
    let value = input.value.replace(/[^0-9]/g, '');
    if (value.length > 11) value = value.substring(0, 11);
    
    if (value.length > 10) {
      value = value.substring(0, 3) + '-' + value.substring(3, 7) + '-' + value.substring(7);
    } else if (value.length > 7) {
      value = value.substring(0, 3) + '-' + value.substring(3, 7) + '-' + value.substring(7);
    } else if (value.length > 3) {
      value = value.substring(0, 3) + '-' + value.substring(3);
    }
    input.value = value;
  };

  // ID 길이 검증
  window.validateIdLength = function(input) {
    if (input.value.length > 20) {
      input.value = input.value.substring(0, 20);
    }
  };

  // 비밀번호 길이 검증
  window.validatePasswordLength = function(input) {
    const value = input.value;
    const explainEl = document.getElementById('idExplain2');
    if (explainEl) {
      if (value.length >= 8 && /^(?=.*[a-zA-Z])(?=.*[0-9])/.test(value)) {
        explainEl.textContent = '유효한 비밀번호 형식입니다.';
        explainEl.style.color = 'green';
      } else if (value.length > 0) {
        explainEl.textContent = '비밀번호는 8자 이상이며 영문과 숫자를 포함해야 합니다.';
        explainEl.style.color = 'red';
      } else {
        explainEl.textContent = '';
      }
    }
  };

  // ID 중복 검사
  window.validateAndCheckId = async function(input) {
    const newId = input.value.trim();
    const explainEl = document.getElementById('idExplain');
    
    if (!newId) {
      if (explainEl) explainEl.textContent = '';
      return;
    }
    
    if (explainEl) {
      explainEl.textContent = '확인 중...';
      explainEl.style.color = 'blue';
    }
    
    try {
      const formData = new FormData();
      formData.append('mem_id', newId);
      
      const response = await fetch('/api/insurance/kj-company/check-id', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (explainEl) {
        if (result.available) {
          explainEl.textContent = '사용할 수 있는 ID 입니다';
          explainEl.style.color = 'green';
        } else {
          explainEl.textContent = '이미 사용 중인 ID 입니다';
          explainEl.style.color = 'red';
        }
      }
    } catch (error) {
      console.error('ID 중복 검사 오류:', error);
      if (explainEl) {
        explainEl.textContent = 'ID 중복 검사 중 오류가 발생했습니다.';
        explainEl.style.color = 'red';
      }
    }
  };

  // 담당자 업데이트
  window.validateAndUpdateUser = async function(input, num) {
    const user = input.value.trim();
    if (!user) {
      alert('담당자명을 입력해주세요.');
      input.focus();
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append('num', num);
      formData.append('user', user);
      
      const response = await fetch('/api/insurance/kj-company/id-update-user', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('담당자명이 업데이트되었습니다.');
      } else {
        alert('업데이트 실패: ' + (result.error || '알 수 없는 오류'));
      }
    } catch (error) {
      console.error('담당자 업데이트 오류:', error);
      alert('업데이트 중 오류가 발생했습니다.');
    }
  };

  // 전화번호 업데이트
  window.validateAndUpdatePhone = async function(input, num) {
    const phone = input.value.trim();
    if (!phone) {
      alert('전화번호를 입력해주세요.');
      input.focus();
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append('num', num);
      formData.append('hphone', phone);
      
      const response = await fetch('/api/insurance/kj-company/id-update-phone', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('전화번호가 업데이트되었습니다.');
      } else {
        alert('업데이트 실패: ' + (result.error || '알 수 없는 오류'));
      }
    } catch (error) {
      console.error('전화번호 업데이트 오류:', error);
      alert('업데이트 중 오류가 발생했습니다.');
    }
  };

  // 비밀번호 업데이트
  window.validateAndUpdatePassword = async function(input, num) {
    const password = input.value.trim();
    if (!password) {
      alert('비밀번호를 입력해주세요.');
      input.focus();
      return;
    }
    
    if (password.length < 8) {
      alert('비밀번호는 최소 8자 이상이어야 합니다.');
      input.focus();
      return;
    }
    
    const explainEl = document.getElementById('idExplain2');
    if (explainEl && explainEl.textContent !== '유효한 비밀번호 형식입니다.') {
      alert('비밀번호 형식을 확인하세요.');
      input.focus();
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append('num', num);
      formData.append('password', password);
      
      const response = await fetch('/api/insurance/kj-company/id-update-password', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('비밀번호가 업데이트되었습니다.');
        input.value = '';
      } else {
        alert('업데이트 실패: ' + (result.error || '알 수 없는 오류'));
      }
    } catch (error) {
      console.error('비밀번호 업데이트 오류:', error);
      alert('업데이트 중 오류가 발생했습니다.');
    }
  };

  // 읽기 권한 업데이트
  window.updateReadStatus = async function(select, num) {
    const readIs = select.value;
    if (readIs === '-1') {
      select.value = '';
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append('num', num);
      formData.append('readIs', readIs);
      
      const response = await fetch('/api/insurance/kj-company/id-update-readis', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        // 성공 메시지는 선택적으로 표시
      } else {
        alert('업데이트 실패: ' + (result.error || '알 수 없는 오류'));
        // 원래 값으로 복원
        const originalValue = select.dataset.originalValue || '';
        select.value = originalValue;
      }
    } catch (error) {
      console.error('권한 업데이트 오류:', error);
      alert('업데이트 중 오류가 발생했습니다.');
      const originalValue = select.dataset.originalValue || '';
      select.value = originalValue;
    }
  };

  // 허용/차단 업데이트
  window.updatePermitStatus = async function(select, num) {
    const permit = select.value;
    if (permit === '-1') {
      select.value = '';
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append('num', num);
      formData.append('permit', permit);
      
      const response = await fetch('/api/insurance/kj-company/id-update-permit', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        // 성공 메시지는 선택적으로 표시
      } else {
        alert('업데이트 실패: ' + (result.error || '알 수 없는 오류'));
        // 원래 값으로 복원
        const originalValue = select.dataset.originalValue || '';
        select.value = originalValue;
      }
    } catch (error) {
      console.error('허용/차단 업데이트 오류:', error);
      alert('업데이트 중 오류가 발생했습니다.');
      const originalValue = select.dataset.originalValue || '';
      select.value = originalValue;
    }
  };

  // 신규 아이디 생성
  window.id_store = async function(dNum, phone, company) {
    try {
      // 입력값 가져오기
      const newId = document.getElementById('newId')?.value.trim();
      const newPassword = document.getElementById('newPassword')?.value.trim();
      const user = document.getElementById('newDamdang')?.value.trim();
      const phoneInput = document.getElementById('phone-new')?.value.trim();
      
      // 입력 유효성 검사
      if (!user) {
        alert('사용자를 입력해주세요.');
        document.getElementById('newDamdang')?.focus();
        return;
      }
      if (!phoneInput) {
        alert('사용자 핸드폰번호를 입력해주세요.');
        document.getElementById('phone-new')?.focus();
        return;
      }
      if (!newId) {
        alert('ID를 입력해주세요.');
        document.getElementById('newId')?.focus();
        return;
      }
      
      const idExplainEl = document.getElementById('idExplain');
      if (idExplainEl && idExplainEl.textContent !== '사용할 수 있는 ID 입니다') {
        alert('ID 중복검사하세요!!');
        document.getElementById('newId')?.focus();
        return;
      }
      
      if (!newPassword) {
        alert('비밀번호를 입력해주세요.');
        document.getElementById('newPassword')?.focus();
        return;
      }
      
      if (newPassword.length < 8) {
        alert('비밀번호는 최소 8자 이상이어야 합니다.');
        document.getElementById('newPassword')?.focus();
        return;
      }
      
      const idExplain2El = document.getElementById('idExplain2');
      if (idExplain2El && idExplain2El.textContent !== '유효한 비밀번호 형식입니다.') {
        alert('비밀번호 확인하세요!!');
        document.getElementById('newPassword')?.focus();
        return;
      }
      
      // 저장 전 사용자 확인
      if (!confirm('새로운 ID 정보를 저장하시겠습니까?')) {
        return;
      }
      
      // FormData 객체 생성 및 데이터 추가
      const formData = new FormData();
      formData.append('dNum', dNum);
      formData.append('mem_id', newId);
      formData.append('password', newPassword);
      formData.append('phone', phoneInput);
      formData.append('company', company);
      formData.append('user', user);
      
      // API 호출
      const response = await fetch('/api/insurance/kj-company/id-save', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('ID 정보가 성공적으로 저장되었습니다.');
        if (idExplainEl) idExplainEl.textContent = '';
        if (idExplain2El) idExplain2El.textContent = '';
        // 저장 후 목록 새로고침
        handleIdClick(dNum);
        
        // 입력 필드 초기화
        const newIdInput = document.getElementById('newId');
        const newPasswordInput = document.getElementById('newPassword');
        const newDamdangInput = document.getElementById('newDamdang');
        const phoneNewInput = document.getElementById('phone-new');
        if (newIdInput) newIdInput.value = '';
        if (newPasswordInput) newPasswordInput.value = '';
        if (newDamdangInput) newDamdangInput.value = '';
        if (phoneNewInput) phoneNewInput.value = '';
      } else {
        alert('저장 실패: ' + (result.message || '알 수 없는 오류가 발생했습니다.'));
      }
    } catch (error) {
      console.error('ID 저장 중 오류 발생:', error);
      alert('ID 정보 저장 중 오류가 발생했습니다.');
    }
  };

})();


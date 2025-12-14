/**
 * KJ 대리운전 회사 정보 모달 공통 모듈
 * kj-driver-search.js와 kj-driver-company.js에서 공통으로 사용
 */

(function() {
  'use strict';

  // ==================== 상수 정의 ====================

  // 보험사 옵션
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

  // 성격 옵션
  const GITA_OPTIONS = [
    { value: 1, label: '일반' },
    { value: 2, label: '탁송' },
    { value: 3, label: '일반/렌트' },
    { value: 4, label: '탁송/렌트' },
    { value: 5, label: '전차량' },
  ];

  // ==================== 유틸리티 함수 ====================

  // 보험사 코드 매핑
  const mapInsuranceCompany = (code) => {
    const map = { 1: '흥국', 2: 'DB', 3: 'KB', 4: '현대', 5: '한화', 6: '더케이', 7: 'MG', 8: '삼성' };
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
        
        // 증권성격 변경 확인
        const gitaLabels = { 1: '일반', 2: '탁송', 3: '일반/렌트', 4: '탁송/렌트', 5: '전차량' };
        const gitaLabel = gitaLabels[gita] || gita;
        
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

  // ==================== 모달 열기 함수 ====================

  const openCompanyModal = (companyNum, companyName, skipShow = false) => {
    const modalElement = document.getElementById('companyInfoModal');
    const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
    const modalBody = document.getElementById('companyInfoModalBody');
    
    // 모달이 이미 열려있고 같은 회사 정보를 로드하는 경우 스킵
    if (!skipShow && modalElement.classList.contains('show')) {
      const currentCompanyNum = modalElement.dataset.currentCompanyNum;
      if (currentCompanyNum === String(companyNum)) {
        return; // 이미 같은 회사 정보가 로드되어 있음
      }
    }
    
    modalElement.dataset.currentCompanyNum = String(companyNum);
    
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
    
    // 보험사 코드 매핑
    const mapInsuranceCompany = (code) => {
      const v = Number(code);
      switch (v) {
        case 1: return '흥국';
        case 2: return 'DB';
        case 3: return 'KB';
        case 4: return '현대';
        case 5: return '한화';
        case 6: return '더케이';
        case 7: return 'MG';
        case 8: return '삼성';
        case 9: return '메리츠';
        default: return '';
      }
    };
    
    // 증권성격 매핑 (기사 조회 결과와 동일)
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
    // 증권성격 매핑
    const mapGitaLabel = (gita) => {
      const v = Number(gita);
      switch (v) {
        case 1: return '일반';
        case 2: return '탁송';
        case 3: return '일반/렌트';
        case 4: return '탁송/렌트';
        case 5: return '전차량';
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
  if (typeof validateJumin === 'undefined') {
    console.error('validateJumin 함수를 찾을 수 없습니다. /js/utils/jumin-validator.js 파일을 로드해주세요.');
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
        if (digits.length === 13) {
          // 주민번호 유효성 검사 (체크섬 포함)
          if (typeof validateJumin === 'function') {
            const validation = validateJumin(value);
            
            if (validation.valid) {
              e.target.style.borderColor = '#28a745'; // 초록색으로 표시
              e.target.title = '';
              
              // 다음 입력 필드(전화번호)로 포커스 이동
              const row = e.target.closest('tr[data-endorse-row]');
              if (row) {
                const phoneInput = row.querySelector('.endorse-phone-input');
                if (phoneInput) {
                  setTimeout(() => {
                    phoneInput.focus();
                  }, 100);
                }
              }
            } else {
              e.target.style.borderColor = '#dc3545'; // 빨간색으로 표시
              e.target.title = validation.message;
            }
          } else {
            console.error('validateJumin 함수를 찾을 수 없습니다.');
            e.target.style.borderColor = '#ffc107'; // 경고 색상
            e.target.title = '주민번호 검증 함수를 로드할 수 없습니다.';
          }
        } else if (value.length === 14 && value.includes('-')) {
          // 형식은 맞지만 13자리가 아닌 경우
          const juminParts = value.split('-');
          if (juminParts[0].length === 6 && juminParts[1].length === 7) {
            // 형식은 맞지만 아직 입력 중
            e.target.style.borderColor = '';
            e.target.title = '';
          } else {
            // 잘못된 형식
            e.target.style.borderColor = '#dc3545';
            e.target.title = '주민번호 형식이 올바르지 않습니다.';
          }
        } else if (value.length > 0 && value.length < 14) {
          // 입력 중
          e.target.style.borderColor = '';
          e.target.title = '';
        } else if (value.length === 0) {
          // 빈 값
          e.target.style.borderColor = '';
          e.target.title = '';
        }
      });
      
      // 포커스 아웃 시 최종 검증
      input.addEventListener('blur', (e) => {
        let value = e.target.value.trim();
        
        // 빈 값이면 검증하지 않음
        if (!value) {
          e.target.style.borderColor = '';
          e.target.title = '';
          return;
        }
        
        // 숫자만 추출
        const digits = value.replace(/[^0-9]/g, '');
        
        // 13자리가 아니면 오류
        if (digits.length !== 13) {
          e.target.style.borderColor = '#dc3545';
          e.target.title = '주민번호는 13자리여야 합니다.';
          return;
        }
        
        // 주민번호 유효성 검사
        if (typeof validateJumin === 'function') {
          const validation = validateJumin(value);
          
          if (validation.valid) {
            e.target.style.borderColor = '#28a745'; // 초록색으로 표시
            e.target.title = '';
          } else {
            e.target.style.borderColor = '#dc3545'; // 빨간색으로 표시
            e.target.title = validation.message;
          }
        } else {
          console.error('validateJumin 함수를 찾을 수 없습니다.');
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

  // ==================== 전역 노출 ====================

  // window 객체에 모듈 노출
  window.KJCompanyModal = {
    openCompanyModal: openCompanyModal,
    renderCompanyModal: renderCompanyModal,
    openMemberListModal: openMemberListModal,
    openEndorseModal: openEndorseModal,
    openPremiumModal: openPremiumModal
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
        // 주민번호에서 하이픈 제거
        const jumin = juminInput ? juminInput.value.trim().replace(/-/g, '') : '';
        // 전화번호에서 하이픈 제거
        const phone = phoneInput ? phoneInput.value.trim().replace(/-/g, '') : '';
        
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
          
          members.push({
            name: name,
            juminNo: jumin,
            phoneNo: phone
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
        // API 호출 데이터 준비
        const requestData = {
          data: members,
          cNum: certiTableNum,
          dNum: companyNum,
          InsuraneCompany: insurerCode,
          endorseDay: endorseDate,
          policyNum: policyNum,
          gita: gita,
          userName: 'system' // TODO: 실제 사용자명으로 변경 필요
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

})();


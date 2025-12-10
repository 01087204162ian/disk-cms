/**
 * field-practice-modal.js - 현장실습보험 상세보기 모달
 * 상세정보 조회, 수정 기능
 */

// 상세보기 모달 열기
// 상세보기 모달 열기
async function openFieldPracticeDetail(applicationId) {
  window.currentFieldPracticeId = applicationId;
  
  const modalElement = document.getElementById('fieldPracticeDetailModal');
  
  // Bootstrap이 로드되었는지 확인
  if (!modalElement) {
    console.error('모달 요소를 찾을 수 없습니다');
    return;
  }
  
  // 기존 모달 인스턴스가 있으면 재사용
  let modal = bootstrap.Modal.getInstance(modalElement);
  if (!modal) {
    modal = new bootstrap.Modal(modalElement);
  }
  
  // 로딩 UI 먼저 보여주기
  document.getElementById('fieldPracticeModalBody').innerHTML = `
    <div class="text-center py-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">로딩 중...</span>
      </div>
      <div class="mt-2">데이터를 불러오는 중...</div>
    </div>
  `;

  modal.show();

  try {
    const response = await fetch(`/api/field-practice/detail/${applicationId}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success) {
      displayFieldPracticeDetail(applicationId, result);
    } else {
      throw new Error(result.error || '데이터를 불러오는데 실패했습니다.');
    }

  } catch (err) {
    console.error('모달 데이터 로드 오류:', err);
    document.getElementById('fieldPracticeModalBody').innerHTML = `
      <div class="alert alert-danger">
        <i class="fas fa-exclamation-circle"></i>
        데이터를 불러올 수 없습니다: ${err.message}
      </div>
    `;
  }
}

// 상세정보 표시
// 상세정보 표시
async function displayFieldPracticeDetail(applicationId, apiResponse) {
	// ===== 디버깅: API 응답 전체 구조 확인 =====
  console.log('=== API Response 전체 ===');
  console.log(apiResponse);
  console.log('apiResponse.cNum:', apiResponse.cNum);
  console.log('apiResponse.data:', apiResponse.data);
  console.log('apiResponse.data.cNum:', apiResponse.data?.cNum);
  console.log('========================');
  const d = apiResponse.data || {};
  const val = (v, fb = '') => (v === null || v === undefined) ? fb : String(v);

   window.currentFieldPracticeCNum = d.cNum;       // 2014Costmer.num
  // 주차별 학생 수 표시 생성
  const weekStudents = [];
  for (let i = 4; i <= 26; i++) {
    const count = parseInt(d[`week${i}`]) || 0;
    if (count > 0) {
      weekStudents.push(`${i}주 ${count}명`);
    }
  }
  const weekStudentsHtml = weekStudents.length > 0 ? weekStudents.join(', ') : '학생 배정 없음';

  // 시기 텍스트
  const periodText = getPeriodText(d.school6);

  // 대인/대물 한도 설정
  const limits = getLimitsByType(d.directory, d.school9);

  // 학교명만 업데이트
	const schoolNameEl = document.getElementById('modal-school-name');
	if (schoolNameEl) {
	  schoolNameEl.textContent = val(d.school1, '학교명');
	}

  // HTML 구조
  const html = `
    <!-- 데스크톱 버전 (768px 이상) -->
    <div class="desktop-modal d-none d-md-block">
      
      <table class="table table-bordered modal-info-table">
        <tbody>
          <tr>
            <th>사업자번호</th>
            <td>${formatBusinessNumber(d.school2)}</td>
            <th>계약자</th>
            <td>${val(d.school1)}</td>
          </tr>
          
          <tr>
            <th>주소</th>
            <td colspan="3">${val(d.school3)}</td>
          </tr>
          
          <tr>
            <th>연락처</th>
            <td>${val(d.school4)}</td>
            <th>이메일</th>
            <td>${val(d.school5)}</td>
          </tr>
          
          <tr>
            <th>시기</th>
            <td>${periodText}</td>
            <th>실습기간</th>
            <td>${formatDate(d.school7)} ~ ${formatDate(d.school8)}</td>
          </tr>
          
          <tr>
            <th>가입유형</th>
            <td colspan="3">${getInsuranceDetailText(d.school9, limits)}</td>
          </tr>
          
          <tr>
            <td colspan="4" class="student-info-row text-center">
              ${weekStudentsHtml}, 총학생 : ${val(d.week_total, 0)}명
            </td>
          </tr>
          
          <tr>
            <td colspan="4" class="premium-info-row text-center">
              <span class="premium-label">대인보험료: ${formatCurrency(apiResponse.daeinP)}</span>
              <span class="premium-label">대물보험료: ${formatCurrency(apiResponse.daemoolP)}</span>
              <span class="premium-total">합계보험료: ${formatCurrency(apiResponse.preiminum)}</span>
            </td>
          </tr>
          
          <tr>
            <th>청약번호</th>
            <td><input type="text" class="form-control form-control-sm" id="gabunho_field" value="${val(d.gabunho)}" placeholder="청약번호를 입력하세요" onkeypress="if(event.key === 'Enter') gabunhoInput()"></td>
            <th>증권번호</th>
            <td><input type="text" class="form-control form-control-sm" id="certi_field" value="${val(d.certi)}" placeholder="증권번호를 입력하세요" onkeypress="if(event.key === 'Enter') saveCerti()"></td>
          </tr>
          
          <tr>
            <th>카드번호</th>
            <td><input type="text" class="form-control form-control-sm" id="cardnum_field" value="${val(apiResponse.cardnum)}" placeholder="카드번호를 입력하세요" onkeypress="if(event.key === 'Enter') saveCardNumber()"></td>
            <th>유효기간</th>
            <td><input type="text" class="form-control form-control-sm" id="yymm_field" value="${val(apiResponse.yymm)}" placeholder="MMYY" maxlength="4" onkeypress="if(event.key === 'Enter') saveCardExpiry()"></td>
          </tr>
          
          <tr>
            <th>은행</th>
            <td><input type="text" class="form-control form-control-sm" id="bankname_field" value="${val(apiResponse.bankname)}" placeholder="은행명을 입력하세요" onkeypress="if(event.key === 'Enter') saveBankName()"></td>
            <th>은행계좌</th>
            <td><input type="text" class="form-control form-control-sm" id="bank_field" value="${val(apiResponse.bank)}" placeholder="계좌번호를 입력하세요" onkeypress="if(event.key === 'Enter') saveBankAccount()"></td>
          </tr>
          
          <tr>
            <th>담당자</th>
            <td><input type="text" class="form-control form-control-sm" id="damdanga_field" value="${val(apiResponse.damdanga)}" placeholder="담당자 이름을 입력하세요" onkeypress="if(event.key === 'Enter') saveDamdanga()"></td>
            <th>연락처</th>
            <td><input type="text" class="form-control form-control-sm" id="damdangat_field" value="${val(apiResponse.damdangat)}" placeholder="담당자 연락처를 입력하세요" onkeypress="if(event.key === 'Enter') saveDamdangat()"></td>
          </tr>
          
          
        </tbody>
      </table>
    </div>

    <!-- 모바일 버전 (768px 미만) -->
    <div class="mobile-modal d-block d-md-none">
      <div class="mobile-form-container">
        
        <!-- 학교정보 -->
		
        <div class="mb-3 p-2 bg-light rounded">
          <span class="fw-bold">학교 기본정보</span>
        </div>
		
		<div class="mobile-field-group">
          <label class="mobile-field-label">사업자번호</label>
          <input type="text" class="form-control mobile-input" value="${formatBusinessNumber(d.school2)}" readonly>
        </div>

        <div class="mobile-field-group">
          <label class="mobile-field-label">계약자</label>
          <input type="text" class="form-control mobile-input" value="${val(d.school1)}" readonly>
        </div>
        <!-- 📍 학교 기본정보 섹션에 추가 -->
		<div class="mobile-field-group">
		  <label class="mobile-field-label">주소</label>
		  <input type="text" class="form-control mobile-input" value="${val(d.school3)}" readonly>
		</div>
		
		
        

        <div class="mobile-field-group">
          <label class="mobile-field-label">연락처</label>
          <input type="tel" class="form-control mobile-input" value="${val(d.school4)}" readonly>
        </div>

        <div class="mobile-field-group">
          <label class="mobile-field-label">이메일</label>
          <input type="email" class="form-control mobile-input" value="${val(d.school5)}" readonly>
        </div>
		
		
		

        <!-- 실습정보 -->
        <div class="mb-3 mt-4 p-2 bg-light rounded">
          <span class="fw-bold">실습정보</span>
        </div>
		
		<div class="mobile-field-group">
		  <label class="mobile-field-label">시기</label>
		  <input type="text" class="form-control mobile-input" value="${periodText}" readonly>
		</div>

		<div class="mobile-field-group">
		  <label class="mobile-field-label">가입유형</label>
		  <input type="text" class="form-control mobile-input" 
				 value="${getInsuranceDetailText(d.school9, limits)}" readonly>
		</div>

		<div class="mobile-field-group">
		  <label class="mobile-field-label">주차별 학생 배정</label>
		  <textarea class="form-control mobile-input" rows="2" readonly>${weekStudentsHtml}</textarea>
		</div>

        <div class="mobile-field-group">
          <label class="mobile-field-label">실습기간</label>
          <input type="text" class="form-control mobile-input" 
                 value="${formatDate(d.school7)} ~ ${formatDate(d.school8)}" readonly>
        </div>

        <div class="mobile-field-group">
          <label class="mobile-field-label">총 학생 수</label>
          <input type="text" class="form-control mobile-input" value="${val(d.week_total, 0)}명" readonly>
        </div>

        <!-- 보험정보 -->
        <div class="mb-3 mt-4 p-2 bg-light rounded">
          <span class="fw-bold">보험 및 결제정보</span>
        </div>

        <div class="mobile-field-group">
          <label class="mobile-field-label">총 보험료</label>
          <input type="text" class="form-control mobile-input fw-bold" 
                 value="${formatCurrency(apiResponse.preiminum)}" readonly>
        </div>

        <div class="mobile-field-group">
          <label class="mobile-field-label">증권번호</label>
          <input type="text" class="form-control mobile-input" id="certi_mobile" 
                 value="${val(d.certi)}" placeholder="증권번호" onkeypress="if(event.key === 'Enter') saveCerti()">
        </div>
	

		<div class="mobile-field-group">
		  <label class="mobile-field-label">청약번호</label>
		  <input type="text" class="form-control mobile-input" id="gabunho_mobile" 
				 value="${val(d.gabunho)}" placeholder="청약번호" onkeypress="if(event.key === 'Enter') gabunhoInput()">
		</div>

		

		<div class="mobile-field-group">
		  <label class="mobile-field-label">카드번호</label>
		  <input type="text" class="form-control mobile-input" id="cardnum_mobile" 
				 value="${val(apiResponse.cardnum)}" placeholder="카드번호" onkeypress="if(event.key === 'Enter') saveCardNumber()">
		</div>

		<div class="mobile-field-group">
		  <label class="mobile-field-label">유효기간</label>
		  <input type="text" class="form-control mobile-input" id="yymm_mobile" 
				 value="${val(apiResponse.yymm)}" placeholder="MMYY" maxlength="4" onkeypress="if(event.key === 'Enter') saveCardExpiry()">
		</div>

		<div class="mobile-field-group">
		  <label class="mobile-field-label">은행</label>
		  <input type="text" class="form-control mobile-input" id="bankname_mobile" 
				 value="${val(apiResponse.bankname)}" placeholder="은행명" onkeypress="if(event.key === 'Enter') saveBankName()">
		</div>

		<div class="mobile-field-group">
		  <label class="mobile-field-label">은행계좌</label>
		  <input type="text" class="form-control mobile-input" id="bank_mobile" 
				 value="${val(apiResponse.bank)}" placeholder="계좌번호" onkeypress="if(event.key === 'Enter') saveBankAccount()">
		</div>

		<div class="mobile-field-group">
          <label class="mobile-field-label">담당자</label>
          <input type="text" class="form-control mobile-input" id="damdanga_mobile" 
                 value="${val(apiResponse.damdanga)}" placeholder="담당자명" onkeypress="if(event.key === 'Enter') saveDamdanga()">
        </div>
		
		<div class="mobile-field-group">
		  <label class="mobile-field-label">담당자 연락처</label>
		  <input type="text" class="form-control mobile-input" id="damdangat_mobile" 
				 value="${val(apiResponse.damdangat)}" placeholder="담당자 연락처" onkeypress="if(event.key === 'Enter') saveDamdangat()">
		</div>

		
        

      </div>
    </div>
  `;

  document.getElementById('fieldPracticeModalBody').innerHTML = html;

  // 푸터 버튼 설정
  document.getElementById('fieldPracticeModalFooter').innerHTML = `
  <input type="hidden" id="questionwareNum_" value="${applicationId}">
  <input type="hidden" id="school_5_" value="${val(d.school5)}">
  <div class="d-flex justify-content-end align-items-center w-100 gap-2">
    <button type="button" id="print-questionnaire" class="btn btn-warning btn-sm">
      질문서 프린트
    </button>
    <button type="button" id="print-application" class="btn btn-primary btn-sm">
      청약서
    </button>
    <button type="button" id="send-id-email" class="btn btn-info btn-sm">
      ID/PW 초기화
    </button>
    <button type="button" id="no-accident-check" class="btn btn-success btn-sm">
      무사고 확인서
    </button>
    <button type="button" id="send-guide" class="btn btn-secondary btn-sm">
      가입안내문
    </button>
    <select id="noticeSelect" class="form-select form-select-sm w-auto" style="max-width: 200px;">
      <option value="-1">공지사항</option>
      <option value="1">보험금 청구 필요서류</option>
      <option value="2">이용안내문</option>
      <option value="3">무사고 확인서 메일</option>
    </select>
  </div>
`;

  // 1️⃣ 이전 설계번호 표시
  const beforeText = apiResponse.beforeGabunho 
    ? `전 설계번호: ${apiResponse.beforeGabunho}` 
    : "신규";
  const beforeElement = document.getElementById("beforegabunho");
  if (beforeElement) {
    beforeElement.textContent = beforeText;
  }

  // 2️⃣ 관리자 목록 불러오기
fetch('/api/field-practice/managers')
  .then(response => response.json())
  .then(managers => {
    if (managers.success) {
      const select = document.getElementById("mem-id-select");
      
      if (!select) {
        console.error('Select 요소를 찾을 수 없습니다!');
        return;
      }
      
      select.innerHTML = "";
      
      // 기본 옵션
      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.textContent = "담당자 선택...";
      select.appendChild(defaultOption);
      
      // 관리자 목록을 num 기준으로 정렬
      const sortedManagers = managers.data.sort((a, b) => {
        return parseInt(a.num) - parseInt(b.num);
      });
      
      // 정렬된 목록으로 옵션 추가
      sortedManagers.forEach(manager => {
        const option = document.createElement("option");
        option.value = manager.num;
        option.textContent = manager.mem_id.trim();
        select.appendChild(option);
      });
      
      // 신규ID 옵션
      const newOption = document.createElement("option");
      newOption.value = "new";
      newOption.textContent = "신규ID";
      select.appendChild(newOption);
      //console.log('설정하려는 cNum:', apiResponse.cNum);
      // 현재 담당자 선택 - 문자열로 변환하여 매칭
      // 현재 담당자 선택
		if (d.cNum) {
		  const cNumStr = String(d.cNum);
		  select.value = cNumStr;
		  
		  console.log('설정하려는 cNum:', cNumStr);
		  console.log('실제 선택된 value:', select.value);
		  console.log('선택된 텍스트:', select.options[select.selectedIndex]?.text);
		}
    }
  })
  .catch(error => console.error('관리자 목록 로드 실패:', error));

  setTimeout(() => {
    const modalBody = document.getElementById('fieldPracticeModalBody');
    if (modalBody.scrollHeight === 0) {
      modalBody.style.minHeight = '400px';
    }
  }, 200);
}
// 각종 저장함수 

// ========== 청약번호 저장 함수 ==========
// ========== 청약번호 저장 함수 ==========
async function gabunhoInput() {
  const applicationId = window.currentFieldPracticeId;
  
  if (!applicationId) {
    alert('신청 ID를 찾을 수 없습니다.');
    return;
  }

  // 데스크톱과 모바일 필드 모두 확인
  const desktopField = document.getElementById('gabunho_field');
  const mobileField = document.getElementById('gabunho_mobile');
  
  // 현재 화면에 표시된 필드에서 값 가져오기
  const gabunhoValue = desktopField?.value || mobileField?.value || '';
  
  if (!gabunhoValue.trim()) {
    alert('청약번호를 입력해주세요.');
    return;
  }

  // 로그인 사용자 이름 가져오기
  const userName = window.sjTemplateLoader?.user?.name || 'Unknown';

  try {
    const response = await fetch(`/api/field-practice/update-gabunho/${applicationId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        gabunho: gabunhoValue.trim(),
        userName: userName  // 로그인 사용자 이름 포함
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success) {
      // 토스트 알림 사용 (더 나은 UX)
      if (window.sjTemplateLoader) {
        window.sjTemplateLoader.showToast('청약번호가 저장되었습니다.', 'success');
      } else {
        alert('청약번호가 저장되었습니다.');
      }
      
      // 두 필드 모두 업데이트
      if (desktopField) desktopField.value = gabunhoValue.trim();
      if (mobileField) mobileField.value = gabunhoValue.trim();
      
    } else {
      throw new Error(result.error || '저장에 실패했습니다.');
    }

  } catch (err) {
    console.error('청약번호 저장 오류:', err);
    
    // 에러도 토스트로 표시
    if (window.sjTemplateLoader) {
      window.sjTemplateLoader.showToast(`저장 실패: ${err.message}`, 'error');
    } else {
      alert(`저장 실패: ${err.message}`);
    }
  }
}

// ========== 증권번호 저장 함수 ==========
async function saveCerti() {
  const applicationId = window.currentFieldPracticeId;
  
  if (!applicationId) {
    alert('신청 ID를 찾을 수 없습니다.');
    return;
  }

  const desktopField = document.getElementById('certi_field');
  const mobileField = document.getElementById('certi_mobile');
  const certiValue = desktopField?.value || mobileField?.value || '';
  
  if (!certiValue.trim()) {
    alert('증권번호를 입력해주세요.');
    return;
  }

  const userName = window.sjTemplateLoader?.user?.name || 'Unknown';

  try {
    const response = await fetch(`/api/field-practice/update-certi/${applicationId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        certi: certiValue.trim(),
        userName: userName
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success) {
      if (window.sjTemplateLoader) {
        window.sjTemplateLoader.showToast('증권번호가 저장되었습니다.', 'success');
      } else {
        alert('증권번호가 저장되었습니다.');
      }
      
      if (desktopField) desktopField.value = certiValue.trim();
      if (mobileField) mobileField.value = certiValue.trim();
      
    } else {
      throw new Error(result.error || '저장에 실패했습니다.');
    }

  } catch (err) {
    console.error('증권번호 저장 오류:', err);
    if (window.sjTemplateLoader) {
      window.sjTemplateLoader.showToast(`저장 실패: ${err.message}`, 'error');
    } else {
      alert(`저장 실패: ${err.message}`);
    }
  }
}

// ========== 카드번호 저장 함수 ==========
async function saveCardNumber() {
  const cNum = window.currentFieldPracticeCNum;
	if (!cNum) {
	  alert('고객 번호를 찾을 수 없습니다.');
	  return;
	}

  const desktopField = document.getElementById('cardnum_field');
  const mobileField = document.getElementById('cardnum_mobile');
  const cardnumValue = desktopField?.value || mobileField?.value || '';
  
  if (!cardnumValue.trim()) {
    alert('카드번호를 입력해주세요.');
    return;
  }

  const userName = window.sjTemplateLoader?.user?.name || 'Unknown';

  try {
    const response = await fetch(`/api/field-practice/update-cardnum/${cNum}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        cardnum: cardnumValue.trim(),
        userName: userName
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success) {
      if (window.sjTemplateLoader) {
        window.sjTemplateLoader.showToast('카드번호가 저장되었습니다.', 'success');
      } else {
        alert('카드번호가 저장되었습니다.');
      }
      
      if (desktopField) desktopField.value = cardnumValue.trim();
      if (mobileField) mobileField.value = cardnumValue.trim();
      
    } else {
      throw new Error(result.error || '저장에 실패했습니다.');
    }

  } catch (err) {
    console.error('카드번호 저장 오류:', err);
    if (window.sjTemplateLoader) {
      window.sjTemplateLoader.showToast(`저장 실패: ${err.message}`, 'error');
    } else {
      alert(`저장 실패: ${err.message}`);
    }
  }
}

// ========== 유효기간 저장 함수 ==========
async function saveCardExpiry() {
  const cNum = window.currentFieldPracticeCNum;
	if (!cNum) {
	  alert('고객 번호를 찾을 수 없습니다.');
	  return;
	}

  const desktopField = document.getElementById('yymm_field');
  const mobileField = document.getElementById('yymm_mobile');
  const yymmValue = desktopField?.value || mobileField?.value || '';
  
  if (!yymmValue.trim()) {
    alert('유효기간을 입력해주세요.');
    return;
  }

  // MMYY 형식 검증 (4자리 숫자)
  if (!/^\d{4}$/.test(yymmValue.trim())) {
    alert('유효기간은 MMYY 형식(4자리 숫자)으로 입력해주세요.');
    return;
  }

  const userName = window.sjTemplateLoader?.user?.name || 'Unknown';

  try {
    const response = await fetch(`/api/field-practice/update-yymm/${cNum}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        yymm: yymmValue.trim(),
        userName: userName
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success) {
      if (window.sjTemplateLoader) {
        window.sjTemplateLoader.showToast('유효기간이 저장되었습니다.', 'success');
      } else {
        alert('유효기간이 저장되었습니다.');
      }
      
      if (desktopField) desktopField.value = yymmValue.trim();
      if (mobileField) mobileField.value = yymmValue.trim();
      
    } else {
      throw new Error(result.error || '저장에 실패했습니다.');
    }

  } catch (err) {
    console.error('유효기간 저장 오류:', err);
    if (window.sjTemplateLoader) {
      window.sjTemplateLoader.showToast(`저장 실패: ${err.message}`, 'error');
    } else {
      alert(`저장 실패: ${err.message}`);
    }
  }
}

// ========== 은행명 저장 함수 ==========
async function saveBankName() {
  const cNum = window.currentFieldPracticeCNum;
	if (!cNum) {
	  alert('고객 번호를 찾을 수 없습니다.');
	  return;
	}

  const desktopField = document.getElementById('bankname_field');
  const mobileField = document.getElementById('bankname_mobile');
  const banknameValue = desktopField?.value || mobileField?.value || '';
  
  if (!banknameValue.trim()) {
    alert('은행명을 입력해주세요.');
    return;
  }

  const userName = window.sjTemplateLoader?.user?.name || 'Unknown';

  try {
    const response = await fetch(`/api/field-practice/update-bankname/${cNum}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        bankname: banknameValue.trim(),
        userName: userName
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success) {
      if (window.sjTemplateLoader) {
        window.sjTemplateLoader.showToast('은행명이 저장되었습니다.', 'success');
      } else {
        alert('은행명이 저장되었습니다.');
      }
      
      if (desktopField) desktopField.value = banknameValue.trim();
      if (mobileField) mobileField.value = banknameValue.trim();
      
    } else {
      throw new Error(result.error || '저장에 실패했습니다.');
    }

  } catch (err) {
    console.error('은행명 저장 오류:', err);
    if (window.sjTemplateLoader) {
      window.sjTemplateLoader.showToast(`저장 실패: ${err.message}`, 'error');
    } else {
      alert(`저장 실패: ${err.message}`);
    }
  }
}

// ========== 은행계좌 저장 함수 ==========
async function saveBankAccount() {
  const cNum = window.currentFieldPracticeCNum;
	if (!cNum) {
	  alert('고객 번호를 찾을 수 없습니다.');
	  return;
	}

  const desktopField = document.getElementById('bank_field');
  const mobileField = document.getElementById('bank_mobile');
  const bankValue = desktopField?.value || mobileField?.value || '';
  
  if (!bankValue.trim()) {
    alert('계좌번호를 입력해주세요.');
    return;
  }

  const userName = window.sjTemplateLoader?.user?.name || 'Unknown';

  try {
    const response = await fetch(`/api/field-practice/update-bank/${cNum}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        bank: bankValue.trim(),
        userName: userName
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success) {
      if (window.sjTemplateLoader) {
        window.sjTemplateLoader.showToast('계좌번호가 저장되었습니다.', 'success');
      } else {
        alert('계좌번호가 저장되었습니다.');
      }
      
      if (desktopField) desktopField.value = bankValue.trim();
      if (mobileField) mobileField.value = bankValue.trim();
      
    } else {
      throw new Error(result.error || '저장에 실패했습니다.');
    }

  } catch (err) {
    console.error('계좌번호 저장 오류:', err);
    if (window.sjTemplateLoader) {
      window.sjTemplateLoader.showToast(`저장 실패: ${err.message}`, 'error');
    } else {
      alert(`저장 실패: ${err.message}`);
    }
  }
}

// ========== 담당자 저장 함수 ==========
async function saveDamdanga() {
  const cNum = window.currentFieldPracticeCNum;
	if (!cNum) {
	  alert('고객 번호를 찾을 수 없습니다.');
	  return;
	}

  const desktopField = document.getElementById('damdanga_field');
  const mobileField = document.getElementById('damdanga_mobile');
  const damdangaValue = desktopField?.value || mobileField?.value || '';
  
  if (!damdangaValue.trim()) {
    alert('담당자 이름을 입력해주세요.');
    return;
  }

  const userName = window.sjTemplateLoader?.user?.name || 'Unknown';

  try {
    const response = await fetch(`/api/field-practice/update-damdanga/${cNum}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        damdanga: damdangaValue.trim(),
        userName: userName
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success) {
      if (window.sjTemplateLoader) {
        window.sjTemplateLoader.showToast('담당자가 저장되었습니다.', 'success');
      } else {
        alert('담당자가 저장되었습니다.');
      }
      
      if (desktopField) desktopField.value = damdangaValue.trim();
      if (mobileField) mobileField.value = damdangaValue.trim();
      
    } else {
      throw new Error(result.error || '저장에 실패했습니다.');
    }

  } catch (err) {
    console.error('담당자 저장 오류:', err);
    if (window.sjTemplateLoader) {
      window.sjTemplateLoader.showToast(`저장 실패: ${err.message}`, 'error');
    } else {
      alert(`저장 실패: ${err.message}`);
    }
  }
}

// ========== 담당자 연락처 저장 함수 ==========
async function saveDamdangat() {
  const cNum = window.currentFieldPracticeCNum;
  if (!cNum) {
    alert('고객 번호를 찾을 수 없습니다.');
    return;
  }

  const desktopField = document.getElementById('damdangat_field');
  const mobileField = document.getElementById('damdangat_mobile');
  let damdangatValue = desktopField?.value || mobileField?.value || '';
  
  if (!damdangatValue.trim()) {
    alert('담당자 연락처를 입력해주세요.');
    return;
  }

  // ⭐ 여기에 추가: 전화번호 포맷팅
  const cleanNumber = damdangatValue.replace(/[^0-9]/g, '');
  if (cleanNumber.length === 11) {
    damdangatValue = cleanNumber.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
  } else if (cleanNumber.length === 10) {
    damdangatValue = cleanNumber.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
  }

  const userName = window.sjTemplateLoader?.user?.name || 'Unknown';

  try {
    const response = await fetch(`/api/field-practice/update-damdangat/${cNum}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        damdangat: damdangatValue.trim(),  // 포맷팅된 값 사용
        userName: userName
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success) {
      if (window.sjTemplateLoader) {
        window.sjTemplateLoader.showToast('담당자 연락처가 저장되었습니다.', 'success');
      } else {
        alert('담당자 연락처가 저장되었습니다.');
      }
      
      // ⭐ 포맷팅된 값으로 필드 업데이트
      if (desktopField) desktopField.value = damdangatValue.trim();
      if (mobileField) mobileField.value = damdangatValue.trim();
      
    } else {
      throw new Error(result.error || '저장에 실패했습니다.');
    }

  } catch (err) {
    console.error('담당자 연락처 저장 오류:', err);
    if (window.sjTemplateLoader) {
      window.sjTemplateLoader.showToast(`저장 실패: ${err.message}`, 'error');
    } else {
      alert(`저장 실패: ${err.message}`);
    }
  }
}



// ========== 유틸리티 함수들 ==========

// 시기 텍스트 반환
function getPeriodText(periodCode) {
  const periods = {
    "1": "1학기",
    "2": "하계",
    "3": "2학기",
    "4": "동계"
  };
  return periods[periodCode] || periodCode || '미지정';
}

// 가입유형 텍스트 반환
function getInsuranceTypeText(typeCode) {
  return typeCode == 1 ? "가입유형 A" : "가입유형 B";
}

// 가입유형 상세 텍스트 반환
function getInsuranceDetailText(school9, limits) {
  const typeText = getInsuranceTypeText(school9);
  const limit = limits.daein;
  
  let coverageText = "";
  if (school9 == 1) {
    coverageText = `대인대물 한도 ${limit}`;
  } else {
    coverageText = `산재초과 대인대물 ${limit}`;
  }
  
  return `${typeText} | ${coverageText}`;
}

// 대인/대물 한도 반환
function getLimitsByType(directory, school9) {
  const limits = directory == 2 ? { A: "2억", B: "3억" } : { A: "2억", B: "3억" };
  const type = school9 == 1 ? "A" : "B";
  
  return {
    daein: limits[type],
    daemool: limits[type]
  };
}

function formatBusinessNumber(businessNumber) {
  if (!businessNumber) return '';
  const cleaned = businessNumber.replace(/[^0-9]/g, '');
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{3})(\d{2})(\d{5})/, '$1-$2-$3');
  }
  return businessNumber;
}

function formatDate(dateString) {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\./g, '-').replace(/ /g, '').slice(0, -1);
  } catch (error) {
    return dateString;
  }
}

function formatDateTime(dateString) {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return dateString;
  }
}

function formatCurrency(amount) {
  if (!amount) return '';
  try {
    const num = parseInt(amount.toString().replace(/[^0-9]/g, ''));
    if (isNaN(num)) return amount;
    return num.toLocaleString('ko-KR');
  } catch (error) {
    return amount;
  }
}

function getInsuranceCompanyText(code) {
  const companyMap = {
    '1': '한화',
    '2': 'Mertiz',
    '3': '현대해상',
    '4': 'KB손해보험'
  };
  return companyMap[code] || '기타';
}

function getStatusText(status) {
  const statusMap = {
    '1': '접수',
    '2': '승인대기',
    '3': '승인',
    '4': '거절',
    '5': '취소'
  };
  return statusMap[status] || '기타';
}

document.addEventListener("click", function (event) {
    const target = event.target;
    const questionwareNum = document.getElementById("questionwareNum_")?.value;

    // 질문서 프린트
    if (target.id === "print-questionnaire") {
        if (!questionwareNum) {
            alert("질문서 번호가 없습니다.");
            return;
        }
        window.open(`https://silbo.kr/2014/_pages/php/downExcel/claim2.php?claimNum=${encodeURIComponent(questionwareNum)}`, "_blank");
    }

    // 청약서 프린트
    if (target.id === "print-application") {
        if (!questionwareNum) {
            alert("질문서 번호가 없습니다.");
            return;
        }
        window.open(`https://silbo.kr/2014/_pages/php/downExcel/claim3.php?claimNum=${encodeURIComponent(questionwareNum)}`, "_blank");
    }

    // 무사고 확인서
    if (target.id === "no-accident-check") {
        if (!questionwareNum) {
            alert("질문서 번호가 없습니다.");
            return;
        }
        window.open(`https://silbo.kr/2014/_pages/php/downExcel/claim7.php?claimNum=${encodeURIComponent(questionwareNum)}`, "_blank");
    }

    // 가입 안내문
    if (target.id === "send-guide") {
        if (!questionwareNum) {
            alert("질문서 번호가 없습니다.");
            return;
        }
        window.open(`https://silbo.kr/2014/_pages/php/downExcel/claim9.php?claimNum=${encodeURIComponent(questionwareNum)}`, "_blank");
    }

    // 아이디, 비번 초기화 메일 전송
    if (target.id === "send-id-email") {
        if (!questionwareNum) {
            alert("질문서 번호가 없습니다.");
            return;
        }

        fetch("https://silbo.kr/2025/api/email_send.php", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: `num=${encodeURIComponent(questionwareNum)}`,
        })
        .then(response => response.json())
        .then(data => {
            alert(data.success ? "성공적 발송 완료!" : "메일 발송 중 오류가 발생했습니다.");
        })
        .catch(() => alert("메일 전송 요청 실패."));
    }

   
});

// 무사고 확인서 URL 생성 함수
function question7_mail() {
    const claimNum = document.getElementById("questionwareNum_")?.value;
    return `http://silbo.kr/2014/_pages/php/downExcel/claim7.php?claimNum=${encodeURIComponent(claimNum)}`;
}

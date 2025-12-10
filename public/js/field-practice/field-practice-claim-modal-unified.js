/**
 * 현장실습보험 클레임 모달 통합 모듈
 * 
 * 두 가지 시나리오 지원:
 * 1. openClaimModalByQuestionnaire(questionnaireId) - 질문서로 조회 → 신규 생성
 * 2. openClaimModalByClaimId(claimId) - 클레임으로 조회 → 수정
 */

// ========== 시나리오 1: 질문서 기반 (신규 생성/수정) ==========
async function openClaimModalByQuestionnaire(fieldPracticeId) {
  try {
    showLoading(true);
    
    const response = await fetch(`/api/field-practice/detail/${fieldPracticeId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error('데이터를 불러오는데 실패했습니다.');
    }

    const data = result.data;
    
    const modalHtml = createClaimModalHtml(data, result, 'create');
    
    removeExistingModal('claimModal');
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // 모달 표시
    const modalElement = document.getElementById('claimModal');
    const modal = new bootstrap.Modal(modalElement);
    
    // ⭐ 모달 닫힐 때 이벤트 리스너 추가
    modalElement.addEventListener('hidden.bs.modal', function() {
      // 목록 새로고침 (있는 경우)
      if (typeof loadClaimList === 'function') {
        loadClaimList(currentPage || 1);
      }
      // 모달 DOM 제거
      modalElement.remove();
    }, { once: true });
    
    modal.show();
    
    initializeClaimModalEvents(fieldPracticeId, data, 'create');
    
  } catch (error) {
    console.error('클레임 모달 열기 오류:', error);
    alert('클레임 정보를 불러오는데 실패했습니다: ' + error.message);
  } finally {
    showLoading(false);
  }
}

// ========== 시나리오 2: 클레임 번호 기반 (수정만) ==========
// field-practice-claim-modal-unified.js

// ========== 시나리오 2: 클레임 번호 기반 (수정만) ==========
async function openClaimModalByClaimId(claimNum) {
  try {
    showLoading(true);
    
    const response = await fetch(`/api/field-practice/claims/${claimNum}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || '데이터를 불러오는데 실패했습니다.');
    }

    const modalHtml = createClaimModalHtml(result, result, 'edit');
    
    removeExistingModal('claimModal');
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    populateClaimData(result, claimNum, 'edit');
    
    // 모달 표시
    const modalElement = document.getElementById('claimModal');
    const modal = new bootstrap.Modal(modalElement);
    
    // ⭐ 모달 닫힐 때 이벤트 리스너 추가
    modalElement.addEventListener('hidden.bs.modal', function() {
      // 목록 새로고침
      if (typeof loadClaimList === 'function') {
        loadClaimList(currentPage || 1);
      }
      // 모달 DOM 제거
      modalElement.remove();
    }, { once: true });  // 한 번만 실행
    
    modal.show();
    
    initializeClaimModalEvents(null, result, 'edit');
    
  } catch (error) {
    console.error('클레임 상세 모달 열기 오류:', error);
    alert('클레임 정보를 불러오는데 실패했습니다: ' + error.message);
  } finally {
    showLoading(false);
  }
}



// ========== 공통 함수들 ==========

// 모달 HTML 생성
function createClaimModalHtml(data, apiResult, mode) {
  const isEditMode = mode === 'edit';
  
  // ⭐ 수정: edit 모드일 때 최상위 필드 사용
  // data는 전체 응답 객체를 의미
  const questionnaireData = isEditMode ? data : data;  // 최상위 school1~9
  const claimData = isEditMode ? data.data : null;     // data 안의 클레임 정보
  
  // 가입유형 텍스트 변환
  const getSchool9Text = (code) => {
    const typeMap = {
      '1': '기본유형 A 대인대물',
      '2': '기본유형 A 대인대물 + 한도 및 산재초과',
      '3': '기본유형 B 대인대물'
    };
    return typeMap[code] || (code == 1 ? '가입유형 A' : '가입유형 B');
  };

  // 시기 텍스트 변환
  const getPeriodText = (code) => {
    const periodMap = {
      '1': '1학기',
      '2': '하계',
      '3': '2학기',
      '4': '동계'
    };
    return periodMap[code] || code;
  };

  // 대인대물 한도
  const limits = (data.directory == 2) 
    ? { A: "2억", B: "3억" } 
    : { A: "2억", B: "3억" };
  const school9 = questionnaireData.school9;
  const limitText = limits[school9 == 1 ? "A" : "B"];

  // ⭐ 증권번호: edit 모드면 claimData에서, 아니면 questionnaireData에서
  const certi = isEditMode ? (claimData?.certi || '-') : (questionnaireData.certi || '-');
  
  // ⭐ 기본 정보 (질문서 데이터 - 최상위 필드)
  const school1 = questionnaireData.school1;
  const school2 = questionnaireData.school2;
  const school3 = questionnaireData.school3;
  const school4 = questionnaireData.school4;
  const school5 = questionnaireData.school5;
  const school6 = questionnaireData.school6;
  const school7 = questionnaireData.school7 ? formatDate(questionnaireData.school7) : '-';
  const school8 = questionnaireData.school8 ? formatDate(questionnaireData.school8) : '-';

  const modalTitle = isEditMode ? '클레임 상세 및 수정' : '클레임 등록';
  const buttonText = isEditMode ? '클레임 수정' : '클레임 저장';
  const buttonIcon = isEditMode ? 'fa-edit' : 'fa-save';

  return `
    <div class="modal fade" id="claimModal" tabindex="-1" aria-labelledby="claimModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title" id="claimModalLabel">
              <i class="fas fa-file-medical"></i>
              증권번호: <span id="modal_certi">${certi}</span> ${modalTitle}
            </h5>
            <div class="d-flex align-items-center gap-2 ms-auto me-2">
              <select id="claim_notice_select" class="form-select form-select-sm" style="width: auto; max-width: 300px;">
                <option value="-1">공지사항</option>
                <option value="1">[보험금 청구] 보험금 청구시 필요서류 안내</option>
                <option value="2">[이용안내문] 한화 현장실습 보험 이용 안내문</option>
                <option value="3">[무사고 확인서 메일]</option>
              </select>
            </div>
           
          </div>
          <div class="modal-body">
            <input type="hidden" id="claim_field_practice_id" value="${questionnaireData.num || ''}">
            <input type="hidden" id="claim_num" value="${isEditMode ? (claimData?.num || '') : ''}">
            <input type="hidden" id="claim_cNum" value="${isEditMode ? (claimData?.cNum || '') : (questionnaireData.cNum || '')}">
            <input type="hidden" id="claim_qNum" value="${isEditMode ? (claimData?.qNum || '') : (questionnaireData.num || '')}">
            <input type="hidden" id="claim_mode" value="${mode}">

            <!-- 기본 정보 테이블 -->
            <div class="mb-4">
              <h6 class="border-bottom pb-2 mb-3">
                <i class="fas fa-info-circle"></i> 기본 정보
              </h6>
              <table class="table table-bordered table-sm">
                <tbody>
                  <tr>
                    <th style="width: 15%;">사업자번호</th>
                    <td style="width: 35%;">${school2 || '-'}</td>
                    <th style="width: 15%;">계약자</th>
                    <td style="width: 35%;">${school1 || '-'}</td>
                  </tr>
                  <tr>
                    <th>주소</th>
                    <td colspan="3">${school3 || '-'}</td>
                  </tr>
                  <tr>
                    <th>시기</th>
                    <td>${getPeriodText(school6)}</td>
                    <th>실습기간</th>
                    <td>${school7} ~ ${school8}</td>
                  </tr>
                  <tr>
                    <th>연락처</th>
                    <td>${school4 || '-'}</td>
                    <th>이메일</th>
                    <td id="claim_email">${school5 || '-'}</td>
                  </tr>
                  <tr>
                    <th>가입유형</th>
                    <td colspan="3">
                      ${getSchool9Text(school9)} 
                      대인대물 한도 ${data.daeinP || limitText} 
                      산재초과 대인대물 ${data.daemoolP || limitText}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- 클레임 입력 폼 -->
            <div>
              <h6 class="border-bottom pb-2 mb-3">
                <i class="fas fa-file-alt"></i> 클레임 정보
              </h6>
              <table class="table table-bordered table-sm">
                <tbody>
                  <tr>
                    <th style="width: 15%;">피해학생</th>
                    <td colspan="3">
                      <input type="text" id="claim_student" class="form-control form-control-sm" placeholder="학생명을 입력하세요">
                    </td>
                  </tr>
                  <tr>
                    <th>사고일자</th>
                    <td style="width: 35%;">
                      <input type="date" id="claim_accident_date" class="form-control form-control-sm">
                    </td>
                    <th style="width: 15%;">사고접수번호</th>
                    <td style="width: 35%;">
                      <input type="text" id="claim_number" class="form-control form-control-sm" placeholder="사고 접수번호">
                    </td>
                  </tr>
                  <tr>
                    <th>보험금지급일</th>
                    <td>
                      <input type="date" id="claim_payment_date" class="form-control form-control-sm">
                    </td>
                    <th>보험금</th>
                    <td>
                      <input type="text" id="claim_amount" class="form-control form-control-sm text-end" placeholder="보험금">
                    </td>
                  </tr>
                  <tr>
                    <th>사고경위</th>
                    <td colspan="3">
                      <textarea id="claim_description" class="form-control form-control-sm" rows="4" maxlength="500" placeholder="사고경위를 입력하세요 (최대 500자)"></textarea>
                      <small class="text-muted float-end mt-1">
                        <span id="charCount">0</span> / 500자
                      </small>
                    </td>
                  </tr>
                  <tr>
                    <th>담당자</th>
                    <td>
                      <input type="text" id="claim_manager" class="form-control form-control-sm" placeholder="담당자 이름" value="${data.damdanga || ''}">
                    </td>
                    <th>연락처</th>
                    <td>
                      <input type="text" id="claim_manager_phone" class="form-control form-control-sm" placeholder="연락처" value="${data.damdangat || ''}">
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
              <i class="fas fa-times"></i> 닫기
            </button>
            <button type="button" id="claim_save_btn" class="btn btn-primary">
              <i class="fas ${buttonIcon}"></i> ${buttonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// 클레임 데이터 입력 (수정 모드일 때)
function populateClaimData(result, claimNum, mode) {
  if (mode !== 'edit' || !result.data) return;

  const data = result.data;
  
  // 클레임 정보
  document.getElementById('claim_student').value = data.student || '';
  document.getElementById('claim_accident_date').value = data.wdate_3 || '';
  document.getElementById('claim_number').value = data.claimNumber || '';
  document.getElementById('claim_payment_date').value = data.wdate_2 || '';
  
  // 보험금 포맷팅
  const formattedAmount = data.claimAmout && !isNaN(parseFloat(data.claimAmout))
    ? parseFloat(data.claimAmout).toLocaleString("ko-KR")
    : "";
  document.getElementById('claim_amount').value = formattedAmount;
  
  document.getElementById('claim_description').value = data.accidentDescription || '';
  
  // 담당자 정보 (NULL 처리)
  document.getElementById('claim_manager').value = data.damdanga === "NULL" ? "" : (data.damdanga || '');
  document.getElementById('claim_manager_phone').value = data.damdangat === "NULL" ? "" : (data.damdangat || '');
  
  // 글자수 업데이트
  updateCharCount();
}

// 모달 이벤트 리스너 초기화
function initializeClaimModalEvents(fieldPracticeId, data, mode) {
  // 저장 버튼
  const saveBtn = document.getElementById('claim_save_btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => saveClaimData(mode));
  }

  // 보험금 포맷팅
  const amountInput = document.getElementById('claim_amount');
  if (amountInput) {
    amountInput.addEventListener('input', function(e) {
      let value = e.target.value.replace(/[^0-9]/g, '');
      if (value) {
        e.target.value = parseInt(value).toLocaleString('ko-KR');
      }
    });
  }

  // 연락처 포맷팅
  const phoneInput = document.getElementById('claim_manager_phone');
  if (phoneInput) {
    phoneInput.addEventListener('input', function(e) {
      e.target.value = e.target.value.replace(/[^0-9-]/g, '');
    });
  }

  // 글자수 카운트
  const descInput = document.getElementById('claim_description');
  if (descInput) {
    descInput.addEventListener('input', updateCharCount);
    updateCharCount(); // 초기 카운트
  }
}

// 클레임 데이터 저장
// 클레임 데이터 저장
async function saveClaimData(mode) {
  try {
    const accidentDescription = document.getElementById('claim_description').value.trim();
    const certi = document.getElementById('modal_certi').textContent.trim();
    
    if (!certi || certi === '-') {
      alert('증권번호가 없습니다. 저장할 수 없습니다.');
      return;
    }

    if (!accidentDescription) {
      alert('사고경위는 필수 입력입니다.');
      document.getElementById('claim_description').focus();
      return;
    }

    const claimNumValue = document.getElementById('claim_num').value;
    const isUpdate = mode === 'edit' || (claimNumValue && parseInt(claimNumValue) > 0);
    
    const confirmMsg = isUpdate 
      ? '클레임 정보를 수정하시겠습니까?' 
      : '클레임 정보를 저장하시겠습니까?';
    
    if (!confirm(confirmMsg)) {
      return;
    }

    showLoading(true);

    // FormData 생성
    const formData = new URLSearchParams();
    
    // ⭐ 핵심: num이 아니라 claimNum__로 전송
    if (isUpdate && claimNumValue) {
      formData.append('claimNum__', claimNumValue);
    }
    
    formData.append('qNum', document.getElementById('claim_qNum').value);
    formData.append('cNum', document.getElementById('claim_cNum').value);
    formData.append('certi', certi);
    formData.append('school1', document.querySelector('#claimModal tbody tr:nth-child(1) td:nth-child(4)').textContent.trim());
    formData.append('claimNumber', document.getElementById('claim_number').value.trim());
    formData.append('wdate_2', document.getElementById('claim_payment_date').value);
    formData.append('wdate_3', document.getElementById('claim_accident_date').value);
    formData.append('claimAmout', document.getElementById('claim_amount').value.replace(/[^0-9]/g, ''));
    formData.append('student', document.getElementById('claim_student').value.trim());
    formData.append('accidentDescription', accidentDescription);
    formData.append('manager', window.sjTemplateLoader?.user?.name || 'Unknown');
    formData.append('damdanga', document.getElementById('claim_manager').value.trim());
    formData.append('damdangat', document.getElementById('claim_manager_phone').value.trim());

    console.log('전송 데이터:', Object.fromEntries(formData));

    // API 호출 - URL은 그대로 유지
    const response = await fetch('/api/field-practice/claim/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      // 클레임 ID 업데이트 (신규 생성 시)
      if (result.num && !isUpdate) {
        document.getElementById('claim_num').value = result.num;
        document.getElementById('claim_mode').value = 'edit';
        
        // 버튼 텍스트 변경
        document.getElementById('claim_save_btn').innerHTML = 
          '<i class="fas fa-edit"></i> 클레임 수정';
      }
      
      // 성공 메시지
      const successMessage = isUpdate 
        ? '클레임이 성공적으로 수정되었습니다.' 
        : '클레임이 성공적으로 저장되었습니다.';
      
      if (window.sjTemplateLoader && window.sjTemplateLoader.showToast) {
        window.sjTemplateLoader.showToast(successMessage, 'success');
      } else {
        alert(successMessage);
      }
      
      // 목록 새로고침
      if (typeof loadClaimList === 'function') {
        setTimeout(() => {
          loadClaimList(currentPage || 1);
        }, 500);
      }

    } else {
      throw new Error(result.error || '클레임 저장에 실패했습니다.');
    }

  } catch (error) {
    console.error('클레임 저장 오류:', error);
    
    if (window.sjTemplateLoader && window.sjTemplateLoader.showToast) {
      window.sjTemplateLoader.showToast(
        '클레임 저장 중 오류가 발생했습니다: ' + error.message,
        'error'
      );
    } else {
      alert('클레임 저장 중 오류가 발생했습니다: ' + error.message);
    }
  } finally {
    showLoading(false);
  }
}

// ========== 유틸리티 함수들 ==========

// 기존 모달 제거
function removeExistingModal(modalId) {
  const existingModal = document.getElementById(modalId);
  if (existingModal) {
    const bsModal = bootstrap.Modal.getInstance(existingModal);
    if (bsModal) bsModal.dispose();
    existingModal.remove();
  }
}

// 글자수 업데이트
function updateCharCount() {
  const descInput = document.getElementById('claim_description');
  const charCount = document.getElementById('charCount');
  if (descInput && charCount) {
    charCount.textContent = descInput.value.length;
  }
}

// 날짜 포맷 함수
function formatDate(dateStr) {
  if (!dateStr) return '-';
  // YYYY-MM-DD 형식이면 그대로 반환
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  return dateStr;
}


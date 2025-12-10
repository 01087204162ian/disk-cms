// 클레임 모달 열기
async function openClaimModal(fieldPracticeId) {
  try {
    showLoading(true);
    
    // 기본 정보 로드
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
    
    // 모달 HTML 생성
    const modalHtml = createClaimModalHtml(data, result);
    
    // 기존 모달이 있으면 제거
    const existingModal = document.getElementById('claimModal');
    if (existingModal) {
      existingModal.remove();
    }
    
    // 모달을 body에 추가
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // 모달 표시
    const modal = new bootstrap.Modal(document.getElementById('claimModal'));
    modal.show();
    
    // 이벤트 리스너 등록
    initializeClaimModalEvents(fieldPracticeId, data);
    
  } catch (error) {
    console.error('클레임 모달 열기 오류:', error);
    alert('클레임 정보를 불러오는데 실패했습니다: ' + error.message);
  } finally {
    showLoading(false);
  }
}

// 클레임 모달 HTML 생성
function createClaimModalHtml(data, apiResult) {
  // 가입유형 텍스트 변환
  const getSchool9Text = (code) => {
    const typeMap = {
      '1': '기본유형 A 대인대물',
      '2': '기본유형 A 대인대물 + 한도 및 산재초과',
      '3': '기본유형 B 대인대물'
    };
    return typeMap[code] || code;
  };

  // 시기 텍스트 변환
  const getPeriodText = (code) => {
    const periodMap = {
      '1': '1학기',
      '2': '2학기',
      '3': '방학'
    };
    return periodMap[code] || code;
  };

  return `
    <div class="modal fade" id="claimModal" tabindex="-1" aria-labelledby="claimModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header bg-primary text-white">
			  <h5 class="modal-title" id="claimModalLabel">
				증권번호: <span id="certi">${data.certi || '-'}</span> 클레임 등록
			  </h5>
			  <div class="d-flex align-items-center gap-2">
				<select id="claim_notice_select" class="form-select form-select-sm" style="width: auto; max-width: 300px;">
				  <option value="-1">공지사항</option>
				  <option value="1">[보험금 청구] 보험금 청구시 필요서류 안내</option>
				  <option value="2">[이용안내문] 한화 현장실습 보험 이용 안내문</option>
				  <option value="3">[무사고 확인서 메일]</option>
				</select>
				
			  </div>
			</div>
          <div class="modal-body">
            <input type="hidden" id="claim_field_practice_id" value="${data.num}"><!--claim_field_practice_id는 현장실습보험 신청서의 ID (questionnaire 테이블의 num-->
            <input type="hidden" id="claim_num" value="">  <!-- ✅ claimList  num -->
            <input type="hidden" id="school5" value="${data.school5 || ''}">  <!-- ✅ 추가 -->

            <!-- 기본 정보 테이블 -->
            <table class="table table-bordered">
              <tbody>
                <tr>
                  <th  style="width: 20%;">사업자번호</th>
                  <td style="width: 30%;">${data.school2 || '-'}</td>
                  <th  style="width: 20%;">계약자</th>
                  <td style="width: 30%;">${data.school1 || '-'}</td>
                </tr>
                <tr>
                  <th >주소</th>
                  <td colspan="3">${data.school3 || '-'}</td>
                </tr>
                <tr>
                  <th >시기</th>
                  <td>${getPeriodText(data.school6)}</td>
                  <th >실습기간</th>
                  <td>${formatDate(data.school7)} ~ ${formatDate(data.school8)}</td>
                </tr>
                <tr>
                  <th >연락처</th>
                  <td>${data.school4 || '-'}</td>
                  <th >이메일</th>
                  <td>${data.school5 || '-'}</td>
                </tr>
                <tr>
                  <th >가입유형</th>
                  <td colspan="3">
                    ${getSchool9Text(data.school9)} 
                    대인대물 한도 ${apiResult.daeinP || '-'} 
                    산재초과 대인대물 ${apiResult.daemoolP || '-'}
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- 클레임 입력 폼 -->
            <table class="table table-bordered mt-3">
              <tbody>
                <tr>
                  <th  style="width: 20%;">학생</th>
                  <td colspan="3">
                    <input type="text" id="claim_student" class="etc-input" placeholder="학생명을 입력하세요">
                  </td>
                </tr>
                <tr>
                  <th >사고일자</th>
                  <td style="width: 30%;">
                    <input type="date" id="claim_accident_date" class="etc-input">
                  </td>
                  <th  style="width: 20%;">사고접수번호</th>
                  <td style="width: 30%;">
                    <input type="text" id="claim_number" class="etc-input" placeholder="사고 접수번호를 입력하세요">
                  </td>
                </tr>
                <tr>
                  <th >보험금지급일</th>
                  <td>
                    <input type="date" id="claim_payment_date" class="etc-input">
                  </td>
                  <th >보험금</th>
                  <td>
                    <input type="text" id="claim_amount" class="etc-input text-end" placeholder="보험금">
                  </td>
                </tr>
                <tr>
                  <th >사고경위</th>
                  <td colspan="3">
                    <textarea id="claim_description" class="etc-input" rows="4" maxlength="500" placeholder="사고경위를 입력하세요"></textarea>
                  </td>
                </tr>
                <tr>
                  <th >담당자</th>
                  <td>
                    <input type="text" id="claim_manager" class="etc-input" placeholder="담당자 이름을 입력하세요" value="${apiResult.damdanga || ''}">
                  </td>
                  <th >연락처</th>
                  <td>
                    <input type="text" id="claim_manager_phone" class="etc-input" placeholder="숫자만 입력하세요" value="${apiResult.damdangat || ''}">
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="modal-footer">
            
            <button type="button" id="claim_save_btn" class="btn btn-primary">
              <i class="fas fa-save"></i> 클레임 저장
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// 클레임 모달 이벤트 리스너 초기화
function initializeClaimModalEvents(fieldPracticeId, data) {
  // 저장 버튼 클릭
  const saveBtn = document.getElementById('claim_save_btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => saveClaimData(fieldPracticeId, data));
  }

  // 보험금 입력 포맷팅 (숫자만 입력, 천단위 콤마)
  const amountInput = document.getElementById('claim_amount');
  if (amountInput) {
    amountInput.addEventListener('input', function(e) {
      let value = e.target.value.replace(/[^0-9]/g, '');
      if (value) {
        e.target.value = parseInt(value).toLocaleString('ko-KR');
      }
    });
  }

  // 연락처 입력 포맷팅 (숫자만)
  const phoneInput = document.getElementById('claim_manager_phone');
  if (phoneInput) {
    phoneInput.addEventListener('input', function(e) {
      e.target.value = e.target.value.replace(/[^0-9-]/g, '');
    });
  }

  
}

// 클레임 데이터 저장
async function saveClaimData(fieldPracticeId, basicData) {
  try {
    const certi = basicData.certi || '';
    
    // 증권번호 확인
    if (!certi || certi === '-') {
      alert('증권번호가 없습니다. 저장할 수 없습니다.');
      return;
    }

    const accidentDescription = document.getElementById('claim_description').value.trim();
    
    // 필수 항목 검증 - 사고경위
    if (!accidentDescription) {
      alert('사고경위는 필수 입력입니다.');
      document.getElementById('claim_description').focus();
      return;
    }

    // 확인 메시지
    if (!confirm('클레임 정보를 저장하시겠습니까?')) {
      return;
    }

    showLoading(true);

    // ✅ URLSearchParams 사용 (FormData 대신)
    const formData = new URLSearchParams();
    formData.append('school1', basicData.school1 || '');
    formData.append('qNum', basicData.num || '');
    formData.append('cNum', basicData.cNum || '');
    formData.append('certi', certi);
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

    // API 호출
    const response = await fetch('/api/field-practice/claim/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()  // ✅ URLSearchParams는 toString() 가능
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
		  // 저장/수정 구분
		  const isUpdate = !!document.getElementById('claim_num').value;
		  
		  // ✅ 클레임 ID 업데이트
		  document.getElementById('claim_num').value = result.num;
		  
		  // ✅ 버튼 텍스트 변경
		  document.getElementById('claim_save_btn').innerHTML = 
			'<i class="fas fa-save"></i> 클레임 수정';
		  
		  // ✅ 구분된 성공 메시지
		  const successMessage = isUpdate 
			? '클레임이 성공적으로 수정되었습니다.' 
			: '클레임이 성공적으로 저장되었습니다.';
		  
		  if (window.sjTemplateLoader && window.sjTemplateLoader.showToast) {
			window.sjTemplateLoader.showToast(successMessage, 'success');
		  } else {
			alert(successMessage);
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


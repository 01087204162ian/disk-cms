// 전역 변수로 현재 데이터 저장
let currentSecondModalData = null;
// 현장실습보험 상세보기 모달 열기 함수
async function openFieldPracticeSecondDetail(applicationId) {
  try {
    // 로딩 표시
    showLoading(true);
    
    // 모달이 없으면 생성
    createSecondDetailModalIfNotExists();
    
    // API 호출
    const response = await fetch(`/api/field-practice/detail/${applicationId}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`HTTP 오류! 상태: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || '데이터를 불러오는데 실패했습니다.');
    }

    // 모달 생성 및 표시
    displaySecondDetailModal(result);
    
  } catch (error) {
    console.error('상세정보 로드 오류:', error);
    alert('상세정보를 불러오는데 실패했습니다: ' + error.message);
  } finally {
    showLoading(false);
  }
}

// 두 번째 모달 생성 (존재하지 않을 경우)
function createSecondDetailModalIfNotExists() {
  if (document.getElementById('fieldPracticeSecondModal')) {
    return;
  }
  
  const modalHTML = `
    <div class="modal fade" id="fieldPracticeSecondModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-scrollable" style="max-width: 55%; max-height: 95vh; margin-top: 20px;">
        <div class="modal-content">
          <div class="modal-header" style="padding: 16px 16px;">
            <div class="d-flex align-items-center gap-2 flex-grow-1">
              <h5 class="modal-title mb-0" style="font-size: 16px;">
                <i class="fas fa-info-circle"></i> 
                <span id="second-modal-school-name">상세정보</span>
              </h5>
              <span id="second-beforegabunho" class="badge"></span>
            </div>
            <div class="d-flex gap-2">
				<button type="button" class="btn btn-sm btn-primary" id="btnEditModal" onclick="openEditFromSecondModal()">
				  <i class="fas fa-edit"></i> 수정
				</button>
				
			  </div>
          </div>
          <div class="modal-body" id="secondModalBody" style="max-height: calc(95vh - 60px); overflow-y: auto; padding: 12px;">
            <!-- 동적 콘텐츠 영역 -->
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// 상세정보 모달 표시 함수
function displaySecondDetailModal(result) {
  const data = result.data;
  // 현재 데이터 저장 (이 줄 추가)
  currentSecondModalData = result;
  // 모달 제목 설정
  document.getElementById('second-modal-school-name').textContent = data.school1 || '상세정보';
  
  // 증권번호 배지 설정
  const gabunhoBadge = document.getElementById('second-beforegabunho');
  if (data.gabunho) {
    gabunhoBadge.textContent = `증권번호: ${data.gabunho}`;
    gabunhoBadge.className = 'badge bg-primary';
  } else {
    gabunhoBadge.textContent = '증권번호 미발급';
    gabunhoBadge.className = 'badge bg-secondary';
  }

  // 모달 본문 내용 생성
  const modalBody = document.getElementById('secondModalBody');
  modalBody.innerHTML = createSecondDetailModalContent(result);
  
  // 모달 표시
  const modal = new bootstrap.Modal(document.getElementById('fieldPracticeSecondModal'));
  modal.show();
  
  // 데이터 입력 (모달이 표시된 후)
  setTimeout(() => {
    fillSecondModalData(result);
  }, 100);
}

// 모달 본문 HTML 생성
function createSecondDetailModalContent(result) {
  const data = result.data;
  const statusText = getStatusText(data.ch);
  const statusClass = getStatusClass(data.ch);
  
  return `
    <!-- 1. 계약자 정보 -->
    <h5 style="font-size: 14px; margin: 8px 0 5px 0;">1. 계약자 정보</h5>
    <table class="info-table" style="line-height: 1.2;">
      <tr>
        <th width='20%' style="padding: 4px;">사업자번호</th>
        <td width='30%' style="padding: 2px;"><input class='etc-input' type="text" id="school2" ></td>
        <th width='20%' style="padding: 4px;">계약자</th>
        <td width='30%' style="padding: 2px;"><input class='etc-input' type="text" id="school1" ></td>
      </tr>
      <tr>
        <th style="padding: 4px;">주소</th>
        <td colspan="3" style="padding: 2px;"><textarea class='etc-input' id="school3" rows="2" ></textarea></td>
      </tr>
      <tr>
        <th style="padding: 4px;">연락처</th>
        <td style="padding: 2px;"><input class='etc-input' type="text" id="school4" ></td>
        <th style="padding: 4px;">이메일</th>
        <td style="padding: 2px;"><input class='etc-input' type="text" id="school5" ></td>
      </tr>
    </table>

    <!-- 2. 현장실습 관련 사항 -->
    <h5 style="font-size: 14px; margin: 8px 0 5px 0;">2. 현장실습 관련 사항</h5>
    <table class="info-table">
      <tr>
        <th width='20%'>현장실습시기</th>
        <td width='80%' >
          <div class="radio-group second-modal-radio">
            <label class="radio-label"><input type="radio" name="school6" value="1" disabled> 1학기</label>
            <label class="radio-label"><input type="radio" name="school6" value="2" disabled> 하계계절</label>
            <label class="radio-label"><input type="radio" name="school6" value="3" disabled> 2학기</label>
            <label class="radio-label"><input type="radio" name="school6" value="4" disabled> 동계계절</label>
          </div>
        </td>
      </tr>
      <tr>
        <th>실습기간(보험기간)</th>
        <td>
          <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
            <input type="date" id="school7" class="date-input etc-input" style="width: 120px;" >
            <span>~</span>
            <input type="date" id="school8" class="date-input etc-input" style="width: 120px;" >
          </div>
        </td>
      </tr>
    </table>

    <!-- 3. 가입유형 -->
    <h5 style="font-size: 14px; margin: 8px 0 5px 0;">3. 가입유형</h5>
    <table class="info-table">
      <tr>
        <th width='20%' rowspan='2'>보장내용</th>
        <th width='80%' colspan='2'>가입유형선택</th>
      </tr>
      <tr>
        <th><div class="radio-group  second-modal-radio"><label class="radio-label"><input type="radio" class='plan' name='plan' value="1" disabled> PLAN A</label></div></th>
        <th><div class="radio-group  second-modal-radio"><label class="radio-label"><input type="radio" class='plan' name='plan' value="2" disabled> PLAN B</label></div></th>
      </tr>
      <tr>
        <th>대인 및 대물 보상</th>
        <td style="text-align: center;">1사고당 <span id='daein1'></span>억원</td>
        <td style="text-align: center;">1사고당 <span id='daein2'></span>억원</td>
      </tr>
      <tr>
        <th>산재보험 초과<br>사용자배상</th>
        <td style="text-align: center;">1사고당 <span id='daein3'></span>억원</td>
        <td style="text-align: center;">1사고당 <span id='daein4'></span>억원</td>
      </tr>
      <tr>
        <th>배상책임 자기부담금</th>
        <td style="text-align: center;">1십만원</td>
        <td style="text-align: center;">1십만원</td>
      </tr>
      <tr>
        <th>실습 중 치료비</th>
        <td style="text-align: center;">1인당 및 1사고당 : 1천만원</td>
        <td style="text-align: center;">1인당 및 1사고당 : 1천만원</td>
      </tr>
    </table>

    <!-- 4. 실습기간 별 참여인원 -->
    <h5 style="font-size: 14px; margin: 8px 0 5px 0;">4. 실습기간 별 참여인원</h5>
    <table class="info-table">
      <tr>
        <th width='20%'>실습기간</th>
        <th width='30%'>참여인원</th>
        <th width='20%'>실습기간</th>
        <th width='30%'>참여인원</th>
      </tr>
      <tr>
        <th>4주</th>
        <td><input type="text" class="week-input" id="week4" onchange="calculateTotal()"></td>
        <th>16주</th>
        <td><input class="week-input" type="text" id="week16" onchange="calculateTotal()"></td>
      </tr>
      <tr>
        <th>5주</th>
        <td><input type="text" class="week-input" id="week5" onchange="calculateTotal()"></td>
        <th>17주</th>
        <td><input class="week-input" type="text" id="week17" onchange="calculateTotal()"></td>
      </tr>
      <tr>
        <th>6주</th>
        <td><input type="text" class="week-input" id="week6" onchange="calculateTotal()"></td>
        <th>18주</th>
        <td><input class="week-input" type="text" id="week18" onchange="calculateTotal()"></td>
      </tr>
      <tr>
        <th>7주</th>
        <td><input type="text" class="week-input" id="week7" onchange="calculateTotal()"></td>
        <th>19주</th>
        <td><input class="week-input" type="text" id="week19" onchange="calculateTotal()"></td>
      </tr>
      <tr>
        <th>8주</th>
        <td><input type="text" class="week-input" id="week8" onchange="calculateTotal()"></td>
        <th>20주</th>
        <td><input class="week-input" type="text" id="week20" onchange="calculateTotal()"></td>
      </tr>
      <tr>
        <th>9주</th>
        <td><input type="text" class="week-input" id="week9" onchange="calculateTotal()"></td>
        <th>21주</th>
        <td><input class="week-input" type="text" id="week21" onchange="calculateTotal()"></td>
      </tr>
      <tr>
        <th>10주</th>
        <td><input type="text" class="week-input" id="week10" onchange="calculateTotal()"></td>
        <th>22주</th>
        <td><input class="week-input" type="text" id="week22" onchange="calculateTotal()"></td>
      </tr>
      <tr>
        <th>11주</th>
        <td><input type="text" class="week-input" id="week11" onchange="calculateTotal()"></td>
        <th>23주</th>
        <td><input class="week-input" type="text" id="week23" onchange="calculateTotal()"></td>
      </tr>
      <tr>
        <th>12주</th>
        <td><input type="text" class="week-input" id="week12" onchange="calculateTotal()"></td>
        <th>24주</th>
        <td><input class="week-input" type="text" id="week24" onchange="calculateTotal()"></td>
      </tr>
      <tr>
        <th>13주</th>
        <td><input type="text" class="week-input" id="week13" onchange="calculateTotal()"></td>
        <th>25주</th>
        <td><input class="week-input" type="text" id="week25" onchange="calculateTotal()"></td>
      </tr>
      <tr>
        <th>14주</th>
        <td><input type="text" class="week-input" id="week14" onchange="calculateTotal()"></td>
        <th>26주</th>
        <td><input class="week-input" type="text" id="week26" onchange="calculateTotal()"></td>
      </tr>
      <tr>
        <th>15주</th>
        <td><input type="text" class="week-input" id="week15" onchange="calculateTotal()"></td>
        <th></th>
        <th></th>
      </tr>
      <tr>
        <th>인원 계 <span id='week_total'></span> 명</th>
        <td style="text-align: right;">대인보험료 <span id='daein'></span></td>
        <td style="text-align: right;">대물보험료 <span id='daemool'></span></td>
        <td style="text-align: right;">합계보험료 <span id='totalP'></span></td>
      </tr>
    </table>
  `;
}

// 주차별 입력 행 생성 (제거)
// generateWeekRows 함수는 더 이상 필요 없음

// 모달 푸터 HTML 생성 (제거됨)
// 푸터가 필요없으므로 이 함수는 사용되지 않음

// 모달 데이터 채우기
function fillSecondModalData(result) {
  const data = result.data;
  
  // 계약자 정보
  setValue('school1', data.school1);
  setValue('school2', data.school2);
  setValue('school3', data.school3);
  setValue('school4', data.school4);
  setValue('school5', data.school5);
  
  // 현장실습 시기
  if (data.school6) {
    const radio = document.querySelector(`input[name="school6"][value="${data.school6}"]`);
    if (radio) radio.checked = true;
  }
  
  // 실습기간
  setValue('school7', data.school7);
  setValue('school8', data.school8);
  
  // 가입유형
  if (data.school9) {
    const planRadio = document.querySelector(`input[name="plan"][value="${data.school9}"]`);
    if (planRadio) planRadio.checked = true;
    
    // PLAN에 따른 보장내용 표시
    if (data.school9 === '1') {
      document.getElementById('daein1').textContent = '2';
      document.getElementById('daein2').textContent = '3';
      document.getElementById('daein3').textContent = '2';
      document.getElementById('daein4').textContent = '3';
    } else {
      document.getElementById('daein1').textContent = '3';
      document.getElementById('daein2').textContent = '5';
      document.getElementById('daein3').textContent = '3';
      document.getElementById('daein4').textContent = '5';
    }
  }
  
  // 주차별 참여인원
  let total = 0;
  for (let i = 4; i <= 26; i++) {
    const weekValue = data[`week${i}`];
    setValue(`week${i}`, weekValue || '');
    if (weekValue) {
      total += parseInt(weekValue) || 0;
    }
  }
  
  // 총 인원 및 보험료
  setValue('week_total', total);
  setValue('daein', result.daeinP || '0');
  setValue('daemool', result.daemoolP || '0');
  setValue('totalP', result.preiminum || '0');
}

// input 값 설정 헬퍼 함수
function setValue(id, value) {
  const element = document.getElementById(id);
  if (element) {
    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
      element.value = value || '';
    } else {
      element.textContent = value || '';
    }
  }
}

// calculateTotal 함수도 추가
function calculateTotal() {
	 document.getElementById("daein").textContent = '';
	document.getElementById("daemool").textContent = '';
	document.getElementById("week_total").textContent ='';
	document.getElementById("totalP").textContent = '';
    let total = 0;
    // 4주차부터 26주차까지의 입력값을 합산
    for (let i = 4; i <= 26; i++) {
        const input = document.getElementById(`week${i}`);
        if (input) {
            // 입력값이 숫자가 아닌 경우 0으로 처리
            const value = parseInt(input.value) || 0;
            total += value;
        }
    }
    
    // 결과를 week_total span에 표시
    const totalSpan = document.getElementById('week_total');
    if (totalSpan) {
        totalSpan.textContent = total;
    }
}

// 수정 모달 열기
async function openEditFromSecondModal() {
  if (!currentSecondModalData) {
    alert('데이터를 불러올 수 없습니다.');
    return;
  }
  
  try {
    showLoading(true);
    
    // 폼 데이터 수집
    const formData = {
      num: currentSecondModalData.data.num,
      school1: document.getElementById('school1').value,
      school2: document.getElementById('school2').value,
      school3: document.getElementById('school3').value,
      school4: document.getElementById('school4').value,
      school5: document.getElementById('school5').value,
      school6: document.querySelector('input[name="school6"]:checked')?.value || '',
      school7: document.getElementById('school7').value,
      school8: document.getElementById('school8').value,
      plan: document.querySelector('input[name="plan"]:checked')?.value || '',
      totalP: document.getElementById('totalP')?.textContent.replace(/[^0-9]/g, '') || '0',
      inscompany: currentSecondModalData.data.inscompany || '0'
    };
    
    // 주차별 인원 데이터 추가
    for (let i = 4; i <= 26; i++) {
      const weekInput = document.getElementById(`week${i}`);
      formData[`week${i}`] = weekInput ? (weekInput.value || 0) : 0;
    }
    
    // API 호출
    const response = await fetch('/api/field-practice/update-detail', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(formData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.success) {
      // 보험료 업데이트
      if (result.data) {
        // 대인보험료 업데이트
        if (result.data.daeinP) {
          setValue('daein', result.data.daeinP);
        }
        
        // 대물보험료 업데이트
        if (result.data.daemoolP) {
          setValue('daemool', result.data.daemoolP);
        }
        
        // 합계보험료 업데이트
        if (result.data.Preminum) {
          setValue('totalP', result.data.Preminum);
        }
        
        // 총 인원 업데이트
        if (result.data.week_total) {
          setValue('week_total', result.data.week_total);
        }
      }
      
      // 성공 메시지
      const message = result.data?.premium_changed 
        ? '수정사항이 저장되었습니다. 보험료가 재계산되었습니다.' 
        : '수정사항이 저장되었습니다.';
        
      if (window.sjTemplateLoader && window.sjTemplateLoader.showToast) {
        window.sjTemplateLoader.showToast(message, 'success');
      } else {
        alert(message);
      }
      
      // currentSecondModalData 업데이트 (다음 수정을 위해)
      currentSecondModalData.data = {
        ...currentSecondModalData.data,
        ...formData,
        preiminum: result.data?.Preminum?.replace(/,/g, '') || currentSecondModalData.data.preiminum
      };
      
      // 목록 새로고침
      if (typeof loadFieldPracticeData === 'function') {
        loadFieldPracticeData();
      }
      
    } else {
      throw new Error(result.error || '저장에 실패했습니다.');
    }
    
  } catch (error) {
    console.error('저장 오류:', error);
    if (window.sjTemplateLoader && window.sjTemplateLoader.showToast) {
      window.sjTemplateLoader.showToast('저장 중 오류가 발생했습니다: ' + error.message, 'error');
    } else {
      alert('저장 중 오류가 발생했습니다: ' + error.message);
    }
  } finally {
    showLoading(false);
  }
}
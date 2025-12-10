/**
 * 해지 처리 모달 관련 함수들
 * haejiList 모달의 로직을 참고하여 dynamicModal로 구현
 */

/**
 * 해지 처리 모달 열기 (메인 함수)
 * @param {string|number} pharmacyId 약국 ID
 */
async function openCancellationModal(pharmacyId) {
  // 모달 제목 설정
  const titleEl = document.getElementById('modalTitle');
  if (titleEl) {
    titleEl.innerHTML = `
      <i class="fas fa-exclamation-triangle text-warning me-2"></i>
      해지 처리
    `;
  }

  // 로딩 UI 먼저 표시
  const modalBody = document.getElementById('modalBody');
  if (modalBody) {
    modalBody.innerHTML = `
      <div class="text-center py-4">
        <div class="spinner-border text-warning" role="status">
          <span class="visually-hidden">해지보험료 계산 중...</span>
        </div>
        <div class="mt-2">해지보험료를 계산하고 있습니다...</div>
      </div>
    `;
  }

  // 모달 열기
  const modal = new bootstrap.Modal(document.getElementById('dynamicModal'));
  modal.show();

  try {
    // 해지보험료 계산 API 호출
    const cancellationData = await calculateCancellationAmount(pharmacyId);
    
    if (cancellationData && cancellationData.success) {
      // 해지 모달 UI 표시
      displayCancellationModal(pharmacyId, cancellationData.data);
    } else {
      throw new Error(cancellationData?.message || '해지보험료 계산에 실패했습니다.');
    }

  } catch (error) {
    console.error('해지 모달 로드 오류:', error);
    
    // 에러 UI 표시
    if (modalBody) {
      modalBody.innerHTML = `
        <div class="alert alert-danger">
          <i class="fas fa-exclamation-circle me-2"></i>
          해지 처리 중 오류가 발생했습니다: ${error.message}
        </div>
        <div class="text-center">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
            닫기
          </button>
        </div>
      `;
    }
  }
}

/**
 * 해지보험료 계산 API 호출 (haejiPSerch 로직 참고)
 * @param {string|number} pharmacyId 약국 ID
 * @returns {Promise<Object>} 해지보험료 계산 결과
 */
async function calculateCancellationAmount(pharmacyId, cancellationDate = null) {
  try {
    console.log(`[calculateCancellationAmount] 해지보험료 계산 시작 - 약국ID: ${pharmacyId}`);

    const requestBody = {
      haeji_num: pharmacyId
    };
    
    // 날짜가 제공된 경우 추가
    if (cancellationDate) {
      requestBody.haejigijun = cancellationDate;
    }

    const response = await fetch('/api/pharmacy2/calculate-cancellation', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();
    console.log(`[calculateCancellationAmount] API 응답:`, result);

    return result;

  } catch (error) {
    console.error(`[calculateCancellationAmount] 오류:`, error);
    throw error;
  }
}

/**
 * 해지 모달 UI 표시 (haejiList 모달 구조 참고)
 * @param {string|number} pharmacyId 약국 ID
 * @param {Object} data 해지보험료 계산 데이터
 */
function displayCancellationModal(pharmacyId, data) {
  // 데이터 안전 처리
  const val = (v, fb = '') => (v === null || v === undefined) ? fb : String(v);
  
  // 현재 날짜를 해지기준일 기본값으로 설정
  const today = new Date().toISOString().split('T')[0];
  const defaultCancellationDate = val(data.haejiDay, today);
  
  // 반응형 모달 HTML 구성
  const modalBody = document.getElementById('modalBody');
  if (modalBody) {
    modalBody.innerHTML = `
      <!-- 데스크톱 버전 (768px 이상) -->
      <div class="desktop-cancellation-modal d-none d-md-block">
        <div class="alert alert-warning">
          <i class="fas fa-info-circle me-2"></i>
          해지기준일 현재 해지보험료입니다.<br>
          해지보험료를 임의로 입력하면 입력한 보험료로 처리됩니다.
        </div>
        
        <div class="mb-3">
          <label for="cancellation_date" class="form-label fw-bold">해지기준일</label>
          <input type="date" class="form-control" id="cancellation_date" 
                 value="${defaultCancellationDate}" placeholder="해지기준일">
          <div class="form-text">해지 처리할 기준 날짜를 선택해주세요.</div>
        </div>

        <div class="table-responsive">
          <table class="table table-bordered table-hover">
            <thead class="table-light">
              <tr>
                <th class="text-center">시기</th>
                <th class="text-center">종기</th>
                <th class="text-center">보험료</th>
                <th class="text-center">미경과기간</th>
                <th class="text-center">해지보험료</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="text-center">${val(data.sigi)}</td>
                <td class="text-center">${val(data.jeonggi)}</td>
                <td class="text-end">${formatCurrency(data.approvalPreminum)}</td>
                <td class="text-center">${val(data.afterDay)}일</td>
                <td class="text-center">
                  <input type="text" id="cancellation_amount" class="form-control text-end" 
                         value="${val(data.haeilP)}" placeholder="해지보험료">
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 모바일 버전 (768px 미만) -->
      <div class="mobile-cancellation-modal d-block d-md-none">
        <div class="alert alert-warning">
          <i class="fas fa-info-circle me-2"></i>
          해지기준일 현재 해지보험료입니다.<br>
          해지보험료를 수정할 수 있습니다.
        </div>
        
        <div class="mobile-cancellation-container">
          <div class="mobile-field-group">
            <label class="mobile-field-label">해지기준일</label>
            <input type="date" class="form-control mobile-input" id="cancellation_date_mobile" 
                   value="${defaultCancellationDate}">
          </div>
          
          <div class="mobile-field-group">
            <label class="mobile-field-label">보험 시기</label>
            <div class="mobile-field-value">${val(data.sigi)}</div>
          </div>
          
          <div class="mobile-field-group">
            <label class="mobile-field-label">보험 종기</label>
            <div class="mobile-field-value">${val(data.jeonggi)}</div>
          </div>
          
          <div class="mobile-field-group">
            <label class="mobile-field-label">원 보험료</label>
            <div class="mobile-field-value fw-bold">${formatCurrency(data.approvalPreminum)}원</div>
          </div>
          
          <div class="mobile-field-group">
            <label class="mobile-field-label">미경과기간</label>
            <div class="mobile-field-value">${val(data.afterDay)}일</div>
          </div>
          
          <div class="mobile-field-group">
            <label class="mobile-field-label">해지보험료</label>
            <input type="text" class="form-control mobile-input text-end" id="cancellation_amount_mobile" 
                   value="${val(data.haeilP)}" placeholder="해지보험료">
          </div>
        </div>
      </div>
    `;
  }

  // 푸터 설정
  const modalFoot = document.getElementById('modalFoot');
  if (modalFoot) {
    modalFoot.innerHTML = `
      <div class="d-flex justify-content-between align-items-center w-100">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
          <i class="fas fa-times me-1"></i>
          취소
        </button>
        <button type="button" class="btn btn-warning" onclick="confirmCancellation(${pharmacyId})">
          <i class="fas fa-check me-1"></i>
          해지확인
        </button>
      </div>
    `;
  }

  // 해지기준일 변경 시 해지보험료 재계산 이벤트 리스너
  setTimeout(() => {
    const dateInput = document.getElementById('cancellation_date');
    const dateInputMobile = document.getElementById('cancellation_date_mobile');
    
    if (dateInput) {
      dateInput.addEventListener('change', () => recalculateCancellationAmount(pharmacyId));
    }
    if (dateInputMobile) {
      dateInputMobile.addEventListener('change', () => recalculateCancellationAmount(pharmacyId));
    }
  }, 100);
}

/**
 * 해지기준일 변경 시 해지보험료 재계산
 * @param {string|number} pharmacyId 약국 ID
 */
async function recalculateCancellationAmount(pharmacyId) {
  try {
    const isMobile = window.innerWidth < 768;
    const dateField = isMobile ? 'cancellation_date_mobile' : 'cancellation_date';
    const amountField = isMobile ? 'cancellation_amount_mobile' : 'cancellation_amount';
    
    const newDate = document.getElementById(dateField)?.value;
    if (!newDate) return;

    // 로딩 상태 표시
    const amountInput = document.getElementById(amountField);
    if (amountInput) {
      amountInput.value = '계산중...';
      amountInput.disabled = true;
    }

    console.log(`해지기준일 변경으로 재계산: ${newDate}`);
    
    // 새로운 날짜로 해지보험료 재계산 API 호출
    const response = await fetch('/api/pharmacy2/calculate-cancellation', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        haeji_num: pharmacyId,
        haejigijun: newDate  // 새로운 해지기준일 포함
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();
    console.log(`[recalculateCancellationAmount] API 응답:`, result);

    if (result && result.success) {
      // 1. 계산된 해지보험료를 입력필드에 반영
      if (amountInput) {
        amountInput.value = result.data.haeilP || '';
        amountInput.disabled = false;
      }

      // 2. 미경과기간 업데이트
      updateAfterDayDisplay(result.data.afterDay, isMobile);

      // 3. 기타 필드들도 업데이트 (필요시)
    /*  if (result.data.sigi) {
        updateSigiDisplay(result.data.sigi, isMobile);
      }
      if (result.data.jeonggi) {
        updateJeonggiDisplay(result.data.jeonggi, isMobile);
      }*/

    } else {
      throw new Error(result?.message || '해지보험료 재계산에 실패했습니다.');
    }
    
  } catch (error) {
    console.error('해지보험료 재계산 오류:', error);
    
    // 에러 시 입력필드 복원
    const amountInput = document.getElementById(amountField);
    if (amountInput) {
      amountInput.disabled = false;
      // 에러 표시
      if (window.sjTemplateLoader && window.sjTemplateLoader.showToast) {
        window.sjTemplateLoader.showToast(
          '해지보험료 재계산 중 오류가 발생했습니다: ' + error.message,
          'error'
        );
      } else {
        alert('해지보험료 재계산 중 오류가 발생했습니다: ' + error.message);
      }
    }
  }
}
/**
 * 미경과기간 표시 업데이트
 * @param {string|number} afterDay 새로운 미경과기간
 * @param {boolean} isMobile 모바일 여부
 */
function updateAfterDayDisplay(afterDay, isMobile) {
  const afterDayText = `${afterDay || 0}일`;
  
  if (isMobile) {
    // 모바일에서 미경과기간 필드 찾기 및 업데이트
    const mobileFields = document.querySelectorAll('.mobile-field-group');
    mobileFields.forEach(fieldGroup => {
      const label = fieldGroup.querySelector('.mobile-field-label');
      if (label && label.textContent.includes('미경과기간')) {
        const valueEl = fieldGroup.querySelector('.mobile-field-value');
        if (valueEl) {
          valueEl.textContent = afterDayText;
          // 변경 효과 표시 (선택적)
          valueEl.style.backgroundColor = '#fff3cd';
          setTimeout(() => {
            valueEl.style.backgroundColor = '';
          }, 1000);
        }
      }
    });
  } else {
    // 데스크톱에서 테이블의 미경과기간 셀 업데이트
    const table = document.querySelector('.desktop-cancellation-modal table');
    if (table) {
      const afterDayCell = table.querySelector('tbody tr td:nth-child(4)'); // 4번째 열이 미경과기간
      if (afterDayCell) {
        afterDayCell.textContent = afterDayText;
        // 변경 효과 표시 (선택적)
        afterDayCell.style.backgroundColor = '#fff3cd';
        setTimeout(() => {
          afterDayCell.style.backgroundColor = '';
        }, 1000);
      }
    }
  }
  
  console.log(`미경과기간 업데이트 완료: ${afterDayText}`);
}
/**
 * 해지 확인 처리 (haejiConfirm 로직 참고)
 * @param {string|number} pharmacyId 약국 ID
 */
async function confirmCancellation(pharmacyId) {
  try {
    // 현재 화면 크기에 따라 입력값 가져오기
    const isMobile = window.innerWidth < 768;
    const dateField = isMobile ? 'cancellation_date_mobile' : 'cancellation_date';
    const amountField = isMobile ? 'cancellation_amount_mobile' : 'cancellation_amount';
    
    const cancellationDate = document.getElementById(dateField)?.value;
    const cancellationAmount = document.getElementById(amountField)?.value;

    // 유효성 검사
    if (!cancellationDate) {
      alert('해지기준일을 선택해주세요.');
      return;
    }

    if (!cancellationAmount || isNaN(parseInt(cancellationAmount.replace(/[^0-9]/g, '')))) {
      alert('올바른 해지보험료를 입력해주세요.');
      return;
    }

    // 최종 확인
    const cleanAmount = parseInt(cancellationAmount.replace(/[^0-9]/g, ''));
    const confirmMsg = `해지기준일: ${cancellationDate}\n해지보험료: ${cleanAmount.toLocaleString()}원\n\n해지를 확정하시겠습니까?`;
    
    if (!confirm(confirmMsg)) {
      return;
    }

    // 버튼 비활성화
    const confirmBtn = document.querySelector('button[onclick*="confirmCancellation"]');
    if (confirmBtn) {
      confirmBtn.disabled = true;
      confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>처리중...';
    }

    console.log(`[confirmCancellation] 해지 확인 처리 시작 - 약국ID: ${pharmacyId}`);

    // 해지 확인 API 호출
    const response = await fetch('/api/pharmacy2/confirm-cancellation', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        haeji_num: pharmacyId,
        haejigijun: cancellationDate,
        haegiP: cleanAmount
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();
    console.log(`[confirmCancellation] API 응답:`, result);

    if (result.success) {
      // 성공 메시지
      if (window.sjTemplateLoader && window.sjTemplateLoader.showToast) {
        window.sjTemplateLoader.showToast(
          result.message || '해지가 완료되었습니다.',
          'success'
        );
      } else {
        alert(result.message || '해지가 완료되었습니다.');
      }

      // 모달 닫기
      const modal = bootstrap.Modal.getInstance(document.getElementById('dynamicModal'));
      if (modal) {
        modal.hide();
      }

      // 테이블 새로고침
      loadPharmacyData();

    } else {
      throw new Error(result.message || '해지 처리에 실패했습니다.');
    }

  } catch (error) {
    console.error('해지 확인 처리 오류:', error);
    
    if (window.sjTemplateLoader && window.sjTemplateLoader.showToast) {
      window.sjTemplateLoader.showToast(
        '해지 처리 중 오류가 발생했습니다: ' + error.message,
        'error'
      );
    } else {
      alert('해지 처리 중 오류가 발생했습니다: ' + error.message);
    }
    
  } finally {
    // 버튼 활성화
    const confirmBtn = document.querySelector('button[onclick*="confirmCancellation"]');
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.innerHTML = '<i class="fas fa-check me-1"></i>해지확인';
    }
  }
}
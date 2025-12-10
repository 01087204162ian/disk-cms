// 1. 상담신청용 약관동의 관리 클래스 (수정된 버전)
class ConsultationAgreementManager {
  constructor(consultationId) {
    this.consultationId = consultationId;
  }

  bindEventListeners() {
    // 데스크톱 버전 이벤트 리스너
    const agreeCollectEdit = document.getElementById('agree_collect_edit');
    const agreeThirdEdit = document.getElementById('agree_third_edit');
    const agreeMktEdit = document.getElementById('agree_mkt_edit');

    if (agreeCollectEdit) {
      agreeCollectEdit.addEventListener('change', () => {
        this.updateAgreementStatus('agree_collect', agreeCollectEdit.checked ? 'Y' : 'N');
      });
    }

    if (agreeThirdEdit) {
      agreeThirdEdit.addEventListener('change', () => {
        this.updateAgreementStatus('agree_third', agreeThirdEdit.checked ? 'Y' : 'N');
      });
    }

    if (agreeMktEdit) {
      agreeMktEdit.addEventListener('change', () => {
        this.updateAgreementStatus('agree_mkt', agreeMktEdit.checked ? 'Y' : 'N');
      });
    }

    // 모바일 버전은 현재 readonly 상태이므로 생략
  }

  async updateAgreementStatus(agreementType, value) {
    try {
      const response = await fetch(`/api/workers-comp/consultations/${this.consultationId}/agreement`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          agreement_type: agreementType,
          agreement_value: value
        })
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const result = await response.json();

      if (result.success) {
        // 배지 업데이트
        this.updateAgreementBadge(agreementType, value);
        
        // 동일한 체크박스 상태 동기화 (모바일이 있다면)
        this.syncCheckboxStates(agreementType, value);

        if (window.sjTemplateLoader?.showToast) {
          const agreementText = this.getAgreementText(agreementType);
          const statusText = value === 'Y' ? '동의' : '비동의';
          window.sjTemplateLoader.showToast(`${agreementText}가 ${statusText}로 변경되었습니다.`, 'success');
        }
      } else {
        throw new Error(result.error || '약관동의 상태 변경에 실패했습니다.');
      }

    } catch (error) {
      console.error('약관동의 상태 변경 오류:', error);
      
      // 실패 시 체크박스 상태 되돌리기
      this.revertCheckboxState(agreementType);
      
      if (window.sjTemplateLoader?.showToast) {
        window.sjTemplateLoader.showToast('약관동의 상태 변경 중 오류가 발생했습니다.', 'error');
      }
    }
  }

  updateAgreementBadge(agreementType, value) {
    const badgeEl = document.querySelector(`#${agreementType}_edit`).closest('.card-body').querySelector('.badge');
    if (badgeEl) {
      badgeEl.className = `badge mt-2 ${value === 'Y' ? 'bg-success' : (agreementType === 'agree_mkt' ? 'bg-secondary' : 'bg-danger')}`;
      badgeEl.textContent = value === 'Y' ? '동의' : '미동의';
    }
  }

  syncCheckboxStates(agreementType, value) {
    // 데스크톱과 모바일 버전 동기화 (필요시)
    const desktopCheckbox = document.getElementById(`${agreementType}_edit`);
    const mobileCheckbox = document.getElementById(`${agreementType}_mobile`);

    if (desktopCheckbox) desktopCheckbox.checked = (value === 'Y');
    if (mobileCheckbox) mobileCheckbox.checked = (value === 'Y');
  }

  revertCheckboxState(agreementType) {
    const checkbox = document.getElementById(`${agreementType}_edit`);
    if (checkbox) {
      checkbox.checked = !checkbox.checked;
    }
  }

  getAgreementText(agreementType) {
    const textMap = {
      'agree_collect': '개인정보 수집·이용 동의',
      'agree_third': '개인정보 제3자 제공 동의',
      'agree_mkt': '마케팅 활용 동의'
    };
    return textMap[agreementType] || '약관동의';
  }
}

// 2. 상담신청 약관동의 변경이력 보기 함수 (구현된 버전)
async function showConsultationAgreementHistory(consultationId) {
  try {
    const response = await fetch(`/api/workers-comp/consultations/${consultationId}/agreement-history`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      credentials: 'include'
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();

    if (data.success) {
      showConsultationAgreementHistoryModal(data.data);
    } else {
      throw new Error(data.error || '약관동의 이력 조회에 실패했습니다.');
    }

  } catch (error) {
    console.error('약관동의 이력 조회 오류:', error);
    if (window.sjTemplateLoader?.showToast) {
      window.sjTemplateLoader.showToast('약관동의 이력 조회 중 오류가 발생했습니다.', 'error');
    } else {
      alert('약관동의 이력 조회 중 오류가 발생했습니다.');
    }
  }
}

// 3. 상담신청 약관동의 이력 모달 표시 함수
function showConsultationAgreementHistoryModal(historyData) {
  const { consultation_info, current_agreements, history } = historyData;

  const modalHTML = `
    <div class="modal fade" id="consultationAgreementHistoryModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="fas fa-history"></i> 약관동의 변경이력 - ${consultation_info.company_name}
            </h5>
            <button type="button" class="btn-close-custom" data-bs-dismiss="modal">×</button>
          </div>
          <div class="modal-body">
            
            <!-- 현재 상태 -->
            <div class="mb-4">
              <h6 class="section-title">현재 약관동의 상태</h6>
              <div class="row">
                ${Object.entries(current_agreements).map(([key, agreement]) => `
                  <div class="col-md-4">
                    <div class="card">
                      <div class="card-body text-center p-2">
                        <div class="small fw-bold">${agreement.label}</div>
                        <span class="badge ${agreement.value === 'Y' ? 'bg-success' : (key === 'agree_mkt' ? 'bg-secondary' : 'bg-danger')} mt-1">
                          ${agreement.text}
                        </span>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- 변경 이력 -->
            <div>
              <h6 class="section-title">변경 이력 (${history.length}건)</h6>
              ${history.length > 0 ? `
                <div class="table-responsive">
                  <table class="table table-sm table-hover">
                    <thead class="table-light">
                      <tr>
                        <th>약관 유형</th>
                        <th>변경 전</th>
                        <th>변경 후</th>
                        <th>변경자</th>
                        <th>변경일시</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${history.map(record => `
                        <tr>
                          <td>${record.agreement_text}</td>
                          <td>
                            <span class="badge ${record.previous_value === 'Y' ? 'bg-success' : 'bg-danger'}">
                              ${record.previous_text}
                            </span>
                          </td>
                          <td>
                            <span class="badge ${record.new_value === 'Y' ? 'bg-success' : 'bg-danger'}">
                              ${record.new_text}
                            </span>
                          </td>
                          <td>${record.changed_by}</td>
                          <td>
                            <small>${record.changed_at_formatted}</small>
                          </td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              ` : `
                <div class="text-center py-4 text-muted">
                  <i class="fas fa-info-circle fa-2x mb-2"></i>
                  <p>약관동의 변경이력이 없습니다.</p>
                </div>
              `}
            </div>

          </div>
          
        </div>
      </div>
    </div>
  `;

  // 기존 모달 제거
  const existingModal = document.getElementById('consultationAgreementHistoryModal');
  if (existingModal) {
    existingModal.remove();
  }

  // 새 모달 추가
  document.body.insertAdjacentHTML('beforeend', modalHTML);

  // 모달 열기
  const modal = new bootstrap.Modal(document.getElementById('consultationAgreementHistoryModal'));
  modal.show();

  // 모달 닫힐 때 DOM에서 제거
  modal._element.addEventListener('hidden.bs.modal', () => {
    modal._element.remove();
  });
}

// 4. setupConsultationModalEventListeners 함수에 추가할 코드
// 기존 setupConsultationModalEventListeners 함수를 찾아서 이 부분을 추가하세요:

function setupConsultationModalEventListeners(consultationId) {
  // 기존 코드들...
  
  // 상담일 변경 이벤트
  document.querySelectorAll('input[type="date"][id*="consultation_date"]').forEach(input => {
    input.addEventListener('change', function() {
      console.log('상담일 변경:', this.value);
    });
  });

  // 상태 변경 이벤트
  document.querySelectorAll('select[id*="status"]').forEach(select => {
    select.addEventListener('change', function() {
      console.log('상태 변경:', this.value);
    });
  });

  // 직원수 변경 이벤트
  document.querySelectorAll('select[id*="employees"]').forEach(select => {
    select.addEventListener('change', function() {
      console.log('직원수 변경:', this.value);
    });
  });

  // 희망상담시간 변경 이벤트
  document.querySelectorAll('input[id*="preferred_time"]').forEach(input => {
    input.addEventListener('change', function() {
      console.log('희망상담시간 변경:', this.value);
    });
  });

  // 연락처 포맷팅
  document.querySelectorAll('input[type="tel"]').forEach(input => {
    input.addEventListener('input', function() {
      if (window.sjTemplateLoader && window.sjTemplateLoader.formatPhoneNumber) {
        window.sjTemplateLoader.formatPhoneNumber(this);
      }
    });
  });

  // *** 약관동의 관리자 추가 (이 부분이 핵심!) ***
  const consultationAgreementManager = new ConsultationAgreementManager(consultationId);
  consultationAgreementManager.bindEventListeners();
}
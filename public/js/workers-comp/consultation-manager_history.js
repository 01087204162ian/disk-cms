// 2. 상담이력 모달 표시 함수
async function showConsultationHistory(consultationId) {
  try {
    const response = await fetch(`/api/workers-comp/consultations/${consultationId}/history`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      credentials: 'include'
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    if (data.success) {
      displayConsultationHistoryModal(consultationId, data.data);
    } else {
      throw new Error(data.error || '상담이력 조회에 실패했습니다.');
    }

  } catch (error) {
    console.error('상담이력 조회 오류:', error);
    if (window.sjTemplateLoader?.showToast) {
      window.sjTemplateLoader.showToast('상담이력 조회 중 오류가 발생했습니다.', 'error');
    }
  }
}

// 3. 상담이력 모달 UI
function displayConsultationHistoryModal(consultationId, historyData) {
  const { consultation_info, history_list } = historyData;

  const modalHTML = `
   <div class="modal fade" id="consultationHistoryModal" tabindex="-1" data-consultation-id="${consultationId}">
      <div class="modal-dialog modal-xl">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="fas fa-phone"></i> 상담이력 관리 - ${consultation_info.company_name}
            </h5>
            <button type="button" class="btn-close-custom" data-bs-dismiss="modal">×</button>
          </div>
          <div class="modal-body">
            
            <!-- 새 상담이력 추가 폼 -->
            <div class="card mb-4">
              <div class="card-header d-flex justify-content-between align-items-center">
                <h6 class="mb-0">새 상담이력 추가</h6>
                <button type="button" class="btn btn-sm btn-primary" onclick="addConsultationHistory(${consultationId})">
                  <i class="fas fa-plus"></i> 추가
                </button>
              </div>
              <div class="card-body" id="newHistoryForm">
                <div class="row">
                  <div class="col-md-3">
                    <label class="form-label">상담일자 *</label>
                    <input type="date" class="form-control" id="new_history_date" value="${new Date().toISOString().split('T')[0]}">
                  </div>
                  <div class="col-md-2">
                    <label class="form-label">상담시간</label>
                    <input type="time" class="form-control" id="new_history_time" value="${new Date().toTimeString().slice(0,5)}">
                  </div>
                  <div class="col-md-2">
                    <label class="form-label">연락방법</label>
                    <select class="form-control" id="new_contact_method">
                      <option value="phone">전화</option>
                      <option value="email">이메일</option>
                      <option value="visit">방문</option>
                      <option value="video">화상</option>
                      <option value="other">기타</option>
                    </select>
                  </div>
                  <div class="col-md-2">
				  <label class="form-label">담당자</label>
				  <input type="text" class="form-control" id="new_contact_person" 
						 value="${window.sjTemplateLoader?.user?.name || 'admin'}" readonly>
				</div>
                  <div class="col-md-3">
                    <label class="form-label">상담결과</label>
                    <select class="form-control" id="new_result">
                      <option value="completed">상담완료</option>
                      <option value="follow_up">추가상담필요</option>
                      <option value="no_answer">부재중</option>
                      <option value="appointment">예약설정</option>
                      <option value="rejected">거절</option>
                    </select>
                  </div>
                </div>
                <div class="row mt-3">
                  <div class="col-md-12">
                    <label class="form-label">상담내용 *</label>
                    <textarea class="form-control" id="new_content" rows="3" placeholder="상담 내용을 입력하세요"></textarea>
                  </div>
                </div>
                <div class="row mt-3">
                  <div class="col-md-6">
                    <label class="form-label">다음 액션</label>
                    <input type="text" class="form-control" id="new_next_action" placeholder="예: 견적서 발송, 재연락 등">
                  </div>
                  <div class="col-md-3">
                    <label class="form-label">다음 연락 예정일</label>
                    <input type="date" class="form-control" id="new_next_date">
                  </div>
                  <div class="col-md-3">
                    <label class="form-label">메모</label>
                    <input type="text" class="form-control" id="new_memo" placeholder="추가 메모">
                  </div>
                </div>
              </div>
            </div>

            <!-- 기존 상담이력 목록 -->
            <div class="card">
              <div class="card-header">
                <h6 class="mb-0">상담이력 목록 (${history_list.length}건)</h6>
              </div>
              <div class="card-body">
                ${history_list.length > 0 ? `
                  <div class="table-responsive">
                    <table class="table table-sm table-hover">
                      <thead class="table-light">
                        <tr>
                          <th>일자/시간</th>
                          <th>방법</th>
                          <th>담당자</th>
                          <th>내용</th>
                          <th>결과</th>
                          <th>다음액션</th>
                          <th>작성자</th>
                          <th>관리</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${history_list.map(record => `
                          <tr>
                            <td>
                              <strong>${record.history_date_formatted}</strong><br>
                              <small class="text-muted">${record.history_time || '-'}</small>
                            </td>
                            <td>
                              <span class="badge ${getContactMethodBadgeClass(record.contact_method)}">
                                ${getContactMethodText(record.contact_method)}
                              </span>
                            </td>
                            <td>${record.contact_person || '-'}</td>
                            <td>
                              <div class="text-truncate" style="max-width: 200px;" title="${record.content}">
                                ${record.content}
                              </div>
                            </td>
                            <td>
                              <span class="badge ${getResultBadgeClass(record.result)}">
                                ${getResultText(record.result)}
                              </span>
                            </td>
                            <td>
                              ${record.next_action ? `
                                <div>${record.next_action}</div>
                                ${record.next_date ? `<small class="text-muted">예정: ${record.next_date}</small>` : ''}
                              ` : '-'}
                            </td>
                            <td>
                              ${record.created_by}<br>
                              <small class="text-muted">${record.created_at_formatted}</small>
                            </td>
                            <td>
                              <button class="btn btn-sm btn-outline-primary me-1" onclick="editConsultationHistory(${record.id})">
                                <i class="fas fa-edit"></i>
                              </button>
                              <button class="btn btn-sm btn-outline-danger" onclick="deleteConsultationHistory(${record.id}, ${consultationId})">
                                <i class="fas fa-trash"></i>
                              </button>
                            </td>
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>
                  </div>
                ` : `
                  <div class="text-center py-4 text-muted">
                    <i class="fas fa-comment-slash fa-3x mb-3"></i>
                    <p>등록된 상담이력이 없습니다.</p>
                  </div>
                `}
              </div>
            </div>

          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">닫기</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // 기존 모달 제거 후 새 모달 추가
  const existingModal = document.getElementById('consultationHistoryModal');
  if (existingModal) existingModal.remove();

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  // 모달 열기
  const modal = new bootstrap.Modal(document.getElementById('consultationHistoryModal'));
  modal.show();

  // 모달 닫힐 때 DOM에서 제거
  modal._element.addEventListener('hidden.bs.modal', () => {
    modal._element.remove();
  });
}

// 4. 유틸리티 함수들
function getContactMethodBadgeClass(method) {
  const classes = {
    'phone': 'bg-primary',
    'email': 'bg-info', 
    'visit': 'bg-success',
    'video': 'bg-warning',
    'other': 'bg-secondary'
  };
  return classes[method] || 'bg-secondary';
}

function getContactMethodText(method) {
  const texts = {
    'phone': '전화',
    'email': '이메일',
    'visit': '방문', 
    'video': '화상',
    'other': '기타'
  };
  return texts[method] || method;
}

function getResultBadgeClass(result) {
  const classes = {
    'completed': 'bg-success',
    'follow_up': 'bg-warning',
    'no_answer': 'bg-secondary',
    'appointment': 'bg-info',
    'rejected': 'bg-danger'
  };
  return classes[result] || 'bg-secondary';
}

function getResultText(result) {
  const texts = {
    'completed': '상담완료',
    'follow_up': '추가상담필요',
    'no_answer': '부재중',
    'appointment': '예약설정', 
    'rejected': '거절'
  };
  return texts[result] || result;
}

// 5. 상담이력 추가/수정/삭제 함수들
async function addConsultationHistory(consultationId) {
  const formData = {
    consultation_id: consultationId,
    history_date: document.getElementById('new_history_date').value,
    history_time: document.getElementById('new_history_time').value || null,
    contact_method: document.getElementById('new_contact_method').value,
	contact_person: window.sjTemplateLoader?.user?.name || 'admin', // 로그인 사용자로 고정
    content: document.getElementById('new_content').value.trim(),
    result: document.getElementById('new_result').value,
    next_action: document.getElementById('new_next_action').value.trim() || null,
    next_date: document.getElementById('new_next_date').value || null,
    memo: document.getElementById('new_memo').value.trim() || null
  };

  // 필수 필드 검증
  if (!formData.history_date) {
    alert('상담일자를 입력해주세요.');
    return;
  }
  if (!formData.content) {
    alert('상담내용을 입력해주세요.');
    return;
  }

  try {
    const response = await fetch(`/api/workers-comp/consultations/${consultationId}/history`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(formData)
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();

    if (result.success) {
      if (window.sjTemplateLoader?.showToast) {
        window.sjTemplateLoader.showToast('상담이력이 추가되었습니다.', 'success');
      }
      
      // 모달 새로고침
      showConsultationHistory(consultationId);
    } else {
      throw new Error(result.error || '상담이력 추가에 실패했습니다.');
    }

  } catch (error) {
    console.error('상담이력 추가 오류:', error);
    if (window.sjTemplateLoader?.showToast) {
      window.sjTemplateLoader.showToast('상담이력 추가 중 오류가 발생했습니다.', 'error');
    }
  }
}

async function deleteConsultationHistory(historyId, consultationId) {
  if (!confirm('이 상담이력을 삭제하시겠습니까?')) return;

  try {
    const response = await fetch(`/api/workers-comp/consultations/history/${historyId}`, {
      method: 'DELETE',
      headers: { 'Accept': 'application/json' },
      credentials: 'include'
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();

    if (result.success) {
      if (window.sjTemplateLoader?.showToast) {
        window.sjTemplateLoader.showToast('상담이력이 삭제되었습니다.', 'success');
      }
      
      // 모달 새로고침
      showConsultationHistory(consultationId);
    } else {
      throw new Error(result.error || '삭제에 실패했습니다.');
    }

  } catch (error) {
    console.error('상담이력 삭제 오류:', error);
    if (window.sjTemplateLoader?.showToast) {
      window.sjTemplateLoader.showToast('삭제 중 오류가 발생했습니다.', 'error');
    }
  }
}

// 1. editConsultationHistory 함수 수정 (인라인 수정 방식)
async function editConsultationHistory(historyId) {
  try {
    // 기존 데이터 조회
    const response = await fetch(`/api/workers-comp/consultations/history/${historyId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      credentials: 'include'
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();

    if (result.success) {
      // 기존 모달의 폼을 수정 모드로 전환
      switchToEditMode(historyId, result.data);
    } else {
      throw new Error(result.error || '상담이력 조회에 실패했습니다.');
    }

  } catch (error) {
    console.error('상담이력 조회 오류:', error);
    if (window.sjTemplateLoader?.showToast) {
      window.sjTemplateLoader.showToast('상담이력 조회 중 오류가 발생했습니다.', 'error');
    }
  }
}

// 2. 수정 모드로 전환하는 함수
function switchToEditMode(historyId, historyData) {
  // 카드 헤더 변경
  const cardHeader = document.querySelector('#consultationHistoryModal .card-header h6');
  const addButton = document.querySelector('#consultationHistoryModal .card-header button');
  
  if (cardHeader) {
    cardHeader.innerHTML = `<i class="fas fa-edit text-warning"></i> 상담이력 수정 (ID: ${historyId})`;
  }
  
  if (addButton) {
    addButton.innerHTML = `
      <i class="fas fa-times"></i> 취소
    `;
    addButton.className = 'btn btn-sm btn-secondary';
    addButton.onclick = function() { cancelEditMode(); };
  }

  // 폼 필드에 기존 데이터 채우기
  document.getElementById('new_history_date').value = historyData.history_date || '';
  document.getElementById('new_history_time').value = historyData.history_time || '';
  document.getElementById('new_contact_method').value = historyData.contact_method || 'phone';
  document.getElementById('new_contact_person').value = historyData.contact_person || window.sjTemplateLoader?.user?.name || 'admin';
  document.getElementById('new_result').value = historyData.result || 'completed';
  document.getElementById('new_content').value = historyData.content || '';
  document.getElementById('new_next_action').value = historyData.next_action || '';
  document.getElementById('new_next_date').value = historyData.next_date || '';
  document.getElementById('new_memo').value = historyData.memo || '';

  // 저장 버튼 변경 (addConsultationHistory를 updateConsultationHistory로 변경)
  const consultationId = document.getElementById('consultationHistoryModal').getAttribute('data-consultation-id');
  addButton.nextElementSibling = null; // 기존 추가 버튼 제거를 위한 준비
  
  // 새로운 업데이트 버튼 추가
  const updateButton = document.createElement('button');
  updateButton.type = 'button';
  updateButton.className = 'btn btn-sm btn-success ms-2';
  updateButton.innerHTML = '<i class="fas fa-save"></i> 수정 저장';
  updateButton.onclick = function() { updateConsultationHistory(historyId, consultationId); };
  
  addButton.parentNode.appendChild(updateButton);

  // 수정 모드임을 표시하는 전역 변수 설정
  window.isEditMode = true;
  window.editingHistoryId = historyId;
  
  // 폼 상단에 수정 안내 메시지 추가
/*  const formBody = document.getElementById('newHistoryForm');
  const alertDiv = document.createElement('div');
  alertDiv.id = 'editModeAlert';
  alertDiv.className = 'alert alert-warning mb-3';
  alertDiv.innerHTML = `
    <i class="fas fa-edit"></i> 
    <strong>수정 모드:</strong> 상담이력을 수정하고 있습니다. 
    변경사항을 저장하거나 취소할 수 있습니다.
  `;
  
  formBody.insertBefore(alertDiv, formBody.firstChild);*/
}

// 3. 수정 모드 취소 함수
function cancelEditMode() {
  // 카드 헤더 원래대로 복원
  const cardHeader = document.querySelector('#consultationHistoryModal .card-header h6');
  const cancelButton = document.querySelector('#consultationHistoryModal .card-header button');
  
  if (cardHeader) {
    cardHeader.innerHTML = '새 상담이력 추가';
  }
  
  if (cancelButton) {
    cancelButton.innerHTML = '<i class="fas fa-plus"></i> 추가';
    cancelButton.className = 'btn btn-sm btn-primary';
    const consultationId = document.getElementById('consultationHistoryModal').getAttribute('data-consultation-id');
    cancelButton.onclick = function() { addConsultationHistory(parseInt(consultationId)); };
  }

  // 업데이트 버튼 제거
  const updateButton = document.querySelector('#consultationHistoryModal .btn-success');
  if (updateButton) {
    updateButton.remove();
  }

  // 폼 초기화
  clearHistoryForm();
  
  // 수정 모드 안내 메시지 제거
  const alertDiv = document.getElementById('editModeAlert');
  if (alertDiv) {
    alertDiv.remove();
  }
  
  // 전역 변수 초기화
  window.isEditMode = false;
  window.editingHistoryId = null;
}

// 4. 폼 초기화 함수
function clearHistoryForm() {
  document.getElementById('new_history_date').value = new Date().toISOString().split('T')[0];
  document.getElementById('new_history_time').value = new Date().toTimeString().slice(0,5);
  document.getElementById('new_contact_method').value = 'phone';
  document.getElementById('new_contact_person').value = window.sjTemplateLoader?.user?.name || 'admin';
  document.getElementById('new_result').value = 'completed';
  document.getElementById('new_content').value = '';
  document.getElementById('new_next_action').value = '';
  document.getElementById('new_next_date').value = '';
  document.getElementById('new_memo').value = '';
}

// 5. 수정 저장 함수
async function updateConsultationHistory(historyId, consultationId) {
  const formData = {
    history_id: historyId,
    history_date: document.getElementById('new_history_date').value,
    history_time: document.getElementById('new_history_time').value || null,
    contact_method: document.getElementById('new_contact_method').value,
    contact_person: window.sjTemplateLoader?.user?.name || 'admin',
    content: document.getElementById('new_content').value.trim(),
    result: document.getElementById('new_result').value,
    next_action: document.getElementById('new_next_action').value.trim() || null,
    next_date: document.getElementById('new_next_date').value || null,
    memo: document.getElementById('new_memo').value.trim() || null
  };

  // 필수 필드 검증
  if (!formData.history_date) {
    alert('상담일자를 입력해주세요.');
    return;
  }
  if (!formData.content) {
    alert('상담내용을 입력해주세요.');
    return;
  }

  try {
    const response = await fetch(`/api/workers-comp/consultations/history/${historyId}`, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(formData)
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();

    if (result.success) {
      if (window.sjTemplateLoader?.showToast) {
        window.sjTemplateLoader.showToast('상담이력이 수정되었습니다.', 'success');
      }
      
      // 수정 모드 취소
      cancelEditMode();
      
      // 상담이력 모달 새로고침
      showConsultationHistory(parseInt(consultationId));
      
    } else {
      throw new Error(result.error || '상담이력 수정에 실패했습니다.');
    }

  } catch (error) {
    console.error('상담이력 수정 오류:', error);
    if (window.sjTemplateLoader?.showToast) {
      window.sjTemplateLoader.showToast('상담이력 수정 중 오류가 발생했습니다.', 'error');
    }
  }
}


// 상세보기 모달 열기
async function openDetailModal(consultationId) {
  try {
    showLoading(true);
    
    const response = await fetch(`/api/workers-comp/consultations/${consultationId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success) {
      displayConsultationDetail(consultationId, data.data);  // 함수명 변경
    } else {
      throw new Error(data.error || '상세 정보를 불러오는데 실패했습니다.');
    }
    
  } catch (error) {
    console.error('상세보기 모달 오류:', error);
    showErrorMessage('상세 정보를 불러오는데 실패했습니다: ' + error.message);
  } finally {
    showLoading(false);
  }
}

function displayConsultationDetail(consultationId, data) {
  const d = data || {};
  const val = (v, fb = '') => (v === null || v === undefined) ? fb : String(v);

  console.log('displayConsultationDetail 받은 데이터:', d);

  // 모달 타이틀 업데이트
  const titleEl = document.getElementById('consultationDetailModalLabel');
  if (titleEl) {
    titleEl.innerHTML = `
      <i class="fas fa-handshake"></i> ${val(d.company_name)} - 상담신청
      
    `;
  }

  // 반응형 HTML 구조
  const html = `
    <!-- 데스크톱 버전 (768px 이상) -->
    <div class="desktop-modal d-none d-md-block">
      <div class="row">
        
        <!-- 기본정보 섹션 -->
        <div class="col-12 mb-4">
          <h6 class="section-title"><i class="fas fa-info-circle"></i> 기본정보</h6>
          <div class="form-grid">
            <label class="col-form-label">회사명</label>
            <input type="text" class="form-control" id="company_name" value="${val(d.company_name)}" readonly>
            
            <label class="col-form-label">업종</label>
            <div class="form-control-plaintext">
              <span class="badge ${getIndustryBadgeClass(d.industry)}">${val(d.industry)}</span>
            </div>
            
            <label class="col-form-label">직원수</label>
            <select class="form-control" id="employees">
              <option value="5명 미만" ${d.employees === '5명 미만' ? 'selected' : ''}>5명 미만</option>
              <option value="5-10명" ${d.employees === '5-10명' ? 'selected' : ''}>5-10명</option>
              <option value="11-30명" ${d.employees === '11-30명' ? 'selected' : ''}>11-30명</option>
              <option value="31-50명" ${d.employees === '31-50명' ? 'selected' : ''}>31-50명</option>
              <option value="50명 이상" ${d.employees === '50명 이상' ? 'selected' : ''}>50명 이상</option>
            </select>
            
            <label class="col-form-label">담당자명</label>
            <input type="text" class="form-control" id="contact_name" value="${val(d.contact_name)}">
            
            <label class="col-form-label">연락처</label>
            <input type="tel" class="form-control" id="phone" value="${val(d.phone)}">
            
            <label class="col-form-label">이메일</label>
            <input type="email" class="form-control" id="email" value="${val(d.email)}">
          </div>
        </div>

        <!-- 상담정보 섹션 -->
        <div class="col-12 mb-4">
          <h6 class="section-title"><i class="fas fa-calendar-alt"></i> 상담정보</h6>
          <div class="form-grid">
            <label class="col-form-label">상담일</label>
            <input type="date" class="form-control" id="consultation_date" 
                   value="${val(d.consultation_date)}" data-id="${d.id}">
            
            <label class="col-form-label">희망상담시간</label>
            <input type="text" class="form-control" id="preferred_time" value="${val(d.preferred_time)}">
            
            <label class="col-form-label">처리상태</label>
            <select class="form-control" id="status_select" data-id="${d.id}" data-original-status="${d.status}">
              ${getStatusOptions(d.status)}
            </select>
            
            <label class="col-form-label">우선순위</label>
            <div class="form-control-plaintext">
              <span class="badge ${getPriorityBadgeClass(d.priority)}">${getPriorityText(d.priority)}</span>
            </div>
          </div>
        </div>

        <!-- 동의현황 섹션 - 수정된 버전 -->
<div class="col-12 mb-4">
  <h6 class="section-title">
    <i class="fas fa-check-circle"></i> 개인정보 동의현황
    <button type="button" class="btn btn-sm btn-outline-info ms-2" onclick="showConsultationAgreementHistory(${consultationId})">
      <i class="fas fa-history"></i> 변경이력
    </button>
	<button type="button" class="btn btn-sm btn-outline-success ms-2" onclick="showConsultationHistory(${consultationId})">
    <i class="fas fa-phone"></i> 상담이력
  </button>
  </h6>
  <div class="row">
    <div class="col-md-4">
      <div class="card">
        <div class="card-body text-center">
          <div class="form-check d-flex justify-content-center align-items-center">
            <input class="form-check-input me-2" type="checkbox" id="agree_collect_edit" 
                   ${d.agree_collect === 'Y' ? 'checked' : ''}>
            <label class="form-check-label" for="agree_collect_edit">개인정보 수집·이용</label>
          </div>
          <span class="badge ${d.agree_collect === 'Y' ? 'bg-success' : 'bg-danger'} mt-2">
            ${d.agree_collect === 'Y' ? '동의' : '미동의'}
          </span>
        </div>
      </div>
    </div>
    <div class="col-md-4">
      <div class="card">
        <div class="card-body text-center">
          <div class="form-check d-flex justify-content-center align-items-center">
            <input class="form-check-input me-2" type="checkbox" id="agree_third_edit" 
                   ${d.agree_third === 'Y' ? 'checked' : ''}>
            <label class="form-check-label" for="agree_third_edit">제3자 제공</label>
          </div>
          <span class="badge ${d.agree_third === 'Y' ? 'bg-success' : 'bg-danger'} mt-2">
            ${d.agree_third === 'Y' ? '동의' : '미동의'}
          </span>
        </div>
      </div>
    </div>
    <div class="col-md-4">
      <div class="card">
        <div class="card-body text-center">
          <div class="form-check d-flex justify-content-center align-items-center">
            <input class="form-check-input me-2" type="checkbox" id="agree_mkt_edit" 
                   ${d.agree_mkt === 'Y' ? 'checked' : ''}>
            <label class="form-check-label" for="agree_mkt_edit">마케팅 수신 (선택)</label>
          </div>
          <span class="badge ${d.agree_mkt === 'Y' ? 'bg-success' : 'bg-secondary'} mt-2">
            ${d.agree_mkt === 'Y' ? '동의' : '미동의'}
          </span>
        </div>
      </div>
    </div>
  </div>
</div>

        <!-- 상담 참고정보 섹션 -->
        ${d.industry_note || d.estimated_premium_range ? `
        <div class="col-12 mb-4">
          <h6 class="section-title"><i class="fas fa-lightbulb"></i> 상담 참고정보</h6>
          <div class="row">
            ${d.industry_note ? `
            <div class="col-md-6">
              <div class="alert alert-info">
                <strong>업종별 참고사항:</strong><br>
                ${d.industry_note}
              </div>
            </div>
            ` : ''}
            ${d.estimated_premium_range ? `
            <div class="col-md-6">
              <div class="alert alert-success">
                <strong>예상 보험료 범위:</strong><br>
                ${d.estimated_premium_range}
              </div>
            </div>
            ` : ''}
          </div>
        </div>
        ` : ''}

      </div>
    </div>

    <!-- 모바일 버전 (768px 미만) -->
    <div class="mobile-modal d-block d-md-none">
      <div class="mobile-form-container">
        
        <div class="mobile-field-group">
          <label class="mobile-field-label">회사명</label>
          <input type="text" class="form-control mobile-input" id="company_name_mobile" value="${val(d.company_name)}" readonly>
        </div>
        
        <div class="mobile-field-group">
          <label class="mobile-field-label">업종</label>
          <span class="badge ${getIndustryBadgeClass(d.industry)} mobile-input">${val(d.industry)}</span>
        </div>
        
        <div class="mobile-field-group">
          <label class="mobile-field-label">직원수</label>
          <select class="form-control mobile-input" id="employees_mobile">
            <option value="5명 미만" ${d.employees === '5명 미만' ? 'selected' : ''}>5명 미만</option>
            <option value="5-10명" ${d.employees === '5-10명' ? 'selected' : ''}>5-10명</option>
            <option value="11-30명" ${d.employees === '11-30명' ? 'selected' : ''}>11-30명</option>
            <option value="31-50명" ${d.employees === '31-50명' ? 'selected' : ''}>31-50명</option>
            <option value="50명 이상" ${d.employees === '50명 이상' ? 'selected' : ''}>50명 이상</option>
          </select>
        </div>
        
        <div class="mobile-field-group">
          <label class="mobile-field-label">담당자</label>
          <input type="text" class="form-control mobile-input" id="contact_name_mobile" value="${val(d.contact_name)}">
        </div>

        <div class="mobile-field-group">
          <label class="mobile-field-label">연락처</label>
          <input type="tel" class="form-control mobile-input" id="phone_mobile" value="${val(d.phone)}">
        </div>

        <div class="mobile-field-group">
          <label class="mobile-field-label">이메일</label>
          <input type="email" class="form-control mobile-input" id="email_mobile" value="${val(d.email)}">
        </div>
        
        <div class="mobile-field-group">
          <label class="mobile-field-label">상담일</label>
          <input type="date" class="form-control mobile-input" id="consultation_date_mobile" 
                 value="${val(d.consultation_date)}" data-id="${d.id}">
        </div>
        
        <div class="mobile-field-group">
          <label class="mobile-field-label">희망상담시간</label>
          <input type="text" class="form-control mobile-input" id="preferred_time_mobile" value="${val(d.preferred_time)}">
        </div>
        
        <div class="mobile-field-group">
          <label class="mobile-field-label">처리상태</label>
          <select id="status_mobile" class="form-control mobile-input" data-id="${d.id}" data-original-status="${d.status}">
            ${getStatusOptions(d.status)}
          </select>
        </div>
        
        <div class="mobile-field-group">
          <label class="mobile-field-label">우선순위</label>
          <span class="badge ${getPriorityBadgeClass(d.priority)} mobile-input">${getPriorityText(d.priority)}</span>
        </div>
        
        <div class="mobile-field-group">
          <label class="mobile-field-label">개인정보동의</label>
          <div class="mobile-input">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <small>수집·이용</small>
              <span class="badge ${d.agree_collect === 'Y' ? 'bg-success' : 'bg-danger'}">
                ${d.agree_collect === 'Y' ? '동의' : '미동의'}
              </span>
            </div>
            <div class="d-flex justify-content-between align-items-center mb-1">
              <small>제3자제공</small>
              <span class="badge ${d.agree_third === 'Y' ? 'bg-success' : 'bg-danger'}">
                ${d.agree_third === 'Y' ? '동의' : '미동의'}
              </span>
            </div>
            <div class="d-flex justify-content-between align-items-center">
              <small>마케팅수신</small>
              <span class="badge ${d.agree_mkt === 'Y' ? 'bg-success' : 'bg-secondary'}">
                ${d.agree_mkt === 'Y' ? '동의' : '미동의'}
              </span>
            </div>
          </div>
        </div>

        ${d.industry_note ? `
        <div class="mobile-field-group">
          <label class="mobile-field-label">참고사항</label>
          <div class="alert alert-info mobile-input">
            ${d.industry_note}
          </div>
        </div>
        ` : ''}

        ${d.estimated_premium_range ? `
        <div class="mobile-field-group">
          <label class="mobile-field-label">예상보험료</label>
          <div class="alert alert-success mobile-input">
            ${d.estimated_premium_range}
          </div>
        </div>
        ` : ''}

      </div>
    </div>
  `;

  document.getElementById('modalBody2').innerHTML = html;
  
  // 이벤트 리스너 설정
  setTimeout(() => {
    setupConsultationModalEventListeners(consultationId);
  }, 100);
  
  // 푸터 버튼 설정
  document.getElementById('modalFooter').innerHTML = `
    <div class="d-flex justify-content-between align-items-center w-100">
      <span class="text-muted small">
        <i class="fas fa-clock"></i> 접수일: ${formatDateTime(d.created_at)}
      </span>
      <div>
        <button type="button" class="btn btn-primary" onclick="saveConsultationChanges('${consultationId}')">
          <i class="fas fa-save"></i> 저장
        </button>
      </div>
    </div>
  `;

  // 모달 표시
  const modal = new bootstrap.Modal(document.getElementById('consultationDetailModal'));
  modal.show();
}

// 우선순위 배지 클래스 반환
function getPriorityBadgeClass(priority) {
  switch(priority) {
    case 'high':
      return 'bg-danger';
    case 'medium':
      return 'bg-warning';
    case 'normal':
    default:
      return 'bg-success';
  }
}

// 우선순위 텍스트 반환
function getPriorityText(priority) {
  const priorityMap = {
    'high': '긴급',
    'medium': '주의',
    'normal': '일반'
  };
  
  return priorityMap[priority] || '일반';
}

// 상담신청 모달 이벤트 리스너 설정
function setupConsultationModalEventListeners(consultationId) {
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
  
   const consultationAgreementManager = new ConsultationAgreementManager(consultationId);
  consultationAgreementManager.bindEventListeners();
}

// 상담신청 변경사항 저장
async function saveConsultationChanges(consultationId) {
  try {
    // 데스크톱/모바일에서 값 가져오기
    const getFieldValue = (desktopId, mobileId) => {
      const desktopEl = document.getElementById(desktopId);
      const mobileEl = document.getElementById(mobileId);
      return (desktopEl && desktopEl.value) || (mobileEl && mobileEl.value) || '';
    };

    const updateData = {
      contact_name: getFieldValue('contact_name', 'contact_name_mobile'),
      phone: getFieldValue('phone', 'phone_mobile'),
      email: getFieldValue('email', 'email_mobile'),
      employees: getFieldValue('employees', 'employees_mobile'),
      preferred_time: getFieldValue('preferred_time', 'preferred_time_mobile'),
      consultation_date: getFieldValue('consultation_date', 'consultation_date_mobile'),
      status: getFieldValue('status_select', 'status_mobile')
    };

    console.log('저장할 데이터:', updateData);

    const response = await fetch(`/api/workers-comp/consultations/${consultationId}`, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      // 성공 메시지
      if (window.sjTemplateLoader && window.sjTemplateLoader.showToast) {
        window.sjTemplateLoader.showToast('변경사항이 저장되었습니다.', 'success');
      }
      
      // 모달 닫기
      const modal = bootstrap.Modal.getInstance(document.getElementById('consultationDetailModal'));
      modal.hide();
      
      // 데이터 새로고침
      loadConsultationsData();
      
    } else {
      throw new Error(result.message || '저장에 실패했습니다.');
    }

  } catch (error) {
    console.error('저장 오류:', error);
    if (window.sjTemplateLoader && window.sjTemplateLoader.showToast) {
      window.sjTemplateLoader.showToast('저장 중 오류가 발생했습니다: ' + error.message, 'error');
    } else {
      alert('저장 중 오류가 발생했습니다: ' + error.message);
    }
  }
}
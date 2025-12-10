/**
 * workers-comp-modal.js - 근재보험 가입신청 상세보기 모달
 * 상세정보 조회, 수정, 파일 관리 기능
 */

// 상세보기 모달 열기
async function openDetailModal(applicationId) {
	
	window.currentApplicationId = applicationId;
  // 모달 초기화
  const modal = new bootstrap.Modal(document.getElementById('applicationDetailModal'));
  
  // 로딩 UI 먼저 보여주기
  document.getElementById('modalBody2').innerHTML = `
    <div class="text-center py-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">로딩 중...</span>
      </div>
      <div class="mt-2">데이터를 불러오는 중...</div>
    </div>
  `;

  // 모달 열기
  modal.show();

  try {
    // 서버에서 데이터 가져오기
    const response = await fetch(`/api/workers-comp/applications/${applicationId}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log('모달 API 응답:', data); // 디버깅용
    
    if (data.success) {
      const applicationData = data.data;
      console.log('전달할 데이터:', applicationData); // 디버깅용
      displayApplicationDetail(applicationId, applicationData);
    } else {
      throw new Error(data.error || '데이터를 불러오는데 실패했습니다.');
    }

  } catch (err) {
    console.error('모달 데이터 로드 오류:', err);
    document.getElementById('modalBody2').innerHTML = `
      <div class="alert alert-danger">
        <i class="fas fa-exclamation-circle"></i>
        데이터를 불러올 수 없습니다: ${err.message}
      </div>
    `;
  }
}
/* 
3. 추가해야 할 새로운 함수들:
*/

// 계약유형 변경 시 필드 표시/숨김 (데스크톱) - 원래 코드 방식에 맞게 수정
async function toggleContractFields() {
  const contractType = document.getElementById('contract_type').value;
  const applicationId = window.currentApplicationId;
  
  if (!applicationId) return;
  
  try {
    // 기존 PUT 엔드포인트 사용하여 계약유형만 업데이트
    const response = await fetch(`/api/workers-comp/applications/${applicationId}`, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        contract_type: contractType
      })
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const result = await response.json();
    
    if (result.success) {
		  // 서버에서 업데이트된 데이터 다시 받아오기
		  const updatedResponse = await fetch(`/api/workers-comp/applications/${applicationId}`, {
			method: 'GET',
			headers: { 'Accept': 'application/json' },
			credentials: 'include'
		  });
		  
		  const updatedData = await updatedResponse.json();
		  
		  if (updatedData.success) {
			displayApplicationDetail(applicationId, updatedData.data);
			
			if (window.sjTemplateLoader?.showToast) {
			  // 계약유형 변경에 맞는 메시지로 변경
			  const contractTypeText = contractType === 'annual' ? '연간계약' : '구간계약';
			  window.sjTemplateLoader.showToast(`계약유형이 ${contractTypeText}으로 변경되었습니다.`, 'success');
			}
		  }
		}
    
  } catch (error) {
    console.error('계약유형 변경 오류:', error);
    if (window.sjTemplateLoader?.showToast) {
      window.sjTemplateLoader.showToast('계약유형 변경 중 오류가 발생했습니다.', 'error');
    }
  }
}
// 데스크톱 계약 관련 필드만 동적 업데이트
function updateContractFieldsOnly(contractType) {
  // 계약정보 섹션 찾기
  const contractSections = document.querySelectorAll('h6.section-title');
  let contractSection = null;
  
  for (let section of contractSections) {
    if (section.textContent.includes('계약정보')) {
      contractSection = section.closest('.mb-4');
      break;
    }
  }
  
  if (!contractSection) return;
  
  const formGrid = contractSection.querySelector('.form-grid');
  if (!formGrid) return;
  
  // 기존 동적 필드들 제거
  const dynamicFields = formGrid.querySelectorAll('.dynamic-contract-field');
  dynamicFields.forEach(field => field.remove());
  
  if (contractType === 'project') {
    // 구간계약 필드들 추가
    const projectFieldsHTML = `
      <div class="full-width dynamic-contract-field">
        <label class="col-form-label">현장명 *</label>
        <input type="text" class="form-control" id="site_name" placeholder="현장명을 입력하세요">
      </div>
      <label class="col-form-label dynamic-contract-field">공사기간 *</label>
      <input type="number" class="form-control dynamic-contract-field" id="project_duration" placeholder="개월" min="1" max="120">
      <label class="col-form-label dynamic-contract-field">인건비 합계 *</label>
      <input type="text" class="form-control dynamic-contract-field" id="labor_cost" placeholder="인건비를 입력하세요" oninput="formatLaborCostInput(this)">
    `;
    formGrid.insertAdjacentHTML('beforeend', projectFieldsHTML);
  } else {
    // 연간계약 안내문구 추가
    const annualInfoHTML = `
      <div class="full-width dynamic-contract-field">
        <div class="alert alert-info">
          <i class="fas fa-info-circle"></i>
          연간계약으로 설정되었습니다.
        </div>
      </div>
    `;
    formGrid.insertAdjacentHTML('beforeend', annualInfoHTML);
  }
}
async function toggleContractFieldsMobile() {
  const contractType = document.getElementById('contract_type_mobile').value;
  const applicationId = window.currentApplicationId;
  
  if (!applicationId) return;
  
  try {
    // 기존 PUT 엔드포인트 사용하여 계약유형만 업데이트
    const response = await fetch(`/api/workers-comp/applications/${applicationId}`, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        contract_type: contractType
      })
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const result = await response.json();
    
    if (result.success) {
      // 서버에서 업데이트된 데이터 다시 받아오기
      const updatedResponse = await fetch(`/api/workers-comp/applications/${applicationId}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        credentials: 'include'
      });
      
      const updatedData = await updatedResponse.json();
      
      if (updatedData.success) {
        displayApplicationDetail(applicationId, updatedData.data);
        
        if (window.sjTemplateLoader?.showToast) {
          // 계약유형 변경에 맞는 메시지로 변경
          const contractTypeText = contractType === 'annual' ? '연간계약' : '구간계약';
          window.sjTemplateLoader.showToast(`계약유형이 ${contractTypeText}으로 변경되었습니다.`, 'success');
        }
      }
    } else {
      throw new Error(result.error || '저장에 실패했습니다.');
    }
    
  } catch (error) {
    console.error('계약유형 변경 오류:', error);
    if (window.sjTemplateLoader?.showToast) {
      window.sjTemplateLoader.showToast('계약유형 변경 중 오류가 발생했습니다.', 'error');
    }
  }
}

// 모바일 계약 관련 필드만 동적 업데이트
function updateContractFieldsMobileOnly(contractType) {
  const mobileContainer = document.querySelector('.mobile-form-container');
  
  // 기존 동적 필드들 제거
  const dynamicFields = mobileContainer.querySelectorAll('.dynamic-contract-field-mobile');
  dynamicFields.forEach(field => field.remove());
  
  // 계약유형 선택박스 다음에 삽입할 위치 찾기
  const contractTypeField = document.getElementById('contract_type_mobile').closest('.mobile-field-group');
  
  if (contractType === 'project') {
    // 구간계약 필드들 추가
    const projectFieldsHTML = `
      <div class="mobile-field-group dynamic-contract-field-mobile">
        <label class="mobile-field-label">현장명 *</label>
        <input type="text" class="form-control mobile-input" id="site_name_mobile" placeholder="현장명을 입력하세요">
      </div>
      
      <div class="mobile-field-group dynamic-contract-field-mobile">
        <label class="mobile-field-label">공사기간 (개월) *</label>
        <input type="number" class="form-control mobile-input" id="project_duration_mobile" placeholder="개월" min="1" max="120">
      </div>
      
      <div class="mobile-field-group dynamic-contract-field-mobile">
        <label class="mobile-field-label">인건비 합계 (원) *</label>
        <input type="text" class="form-control mobile-input" id="labor_cost_mobile" placeholder="인건비를 입력하세요" oninput="formatLaborCostDisplay(this)">
      </div>
    `;
    contractTypeField.insertAdjacentHTML('afterend', projectFieldsHTML);
  } else {
    // 연간계약 안내문구 추가
    const annualInfoHTML = `
      <div class="mobile-field-group dynamic-contract-field-mobile">
        <div class="alert alert-info">
          <i class="fas fa-info-circle"></i>
          연간계약으로 설정되었습니다.
        </div>
      </div>
    `;
    contractTypeField.insertAdjacentHTML('afterend', annualInfoHTML);
  }
}
function formatLaborCostDisplay(amount) {
  if (!amount) return '';
  
  try {
    const num = parseInt(amount.toString().replace(/[^0-9]/g, ''));
    if (isNaN(num)) return amount;
    
    return num.toLocaleString('ko-KR');
  } catch (error) {
    return amount;
  }
}
// 인건비 입력 포맷팅
function formatLaborCostInput(input) {
  let value = input.value.replace(/[^0-9]/g, '');
  
  if (value) {
    value = parseInt(value).toLocaleString('ko-KR');
  }
  
  input.value = value;
}

// 사업자번호 입력 포맷팅 (실시간)
function formatBusinessNumberInput(input) {
  let value = input.value.replace(/[^0-9]/g, '');
  
  if (value.length >= 3) {
    if (value.length >= 5) {
      value = value.replace(/(\d{3})(\d{2})(\d+)/, '$1-$2-$3');
    } else {
      value = value.replace(/(\d{3})(\d+)/, '$1-$2');
    }
  }
  
  input.value = value;
}
// 상세정보 표시
function displayApplicationDetail(applicationId, data) {
  const d = data || {};
  const val = (v, fb = '') => (v === null || v === undefined) ? fb : String(v);

  console.log('displayApplicationDetail 받은 데이터:', d);

  // 업로드된 파일 정보 처리
  let uploadedFiles = [];
  
  try {
    if (d.uploaded_files && typeof d.uploaded_files === 'string') {
      const parsed = JSON.parse(d.uploaded_files);
      console.log('파싱된 파일 정보:', parsed);
      
      // 객체의 값들을 배열로 변환
      uploadedFiles = Object.values(parsed).map(file => ({
        originalName: file.original_name,
        fileName: file.original_name,
        filePath: file.file_path,
        fileSize: file.file_size,
        size: file.file_size,
        uploadedAt: d.created_at,
        mimeType: getMimeTypeFromFileName(file.original_name)
      }));
    } else if (d.uploaded_files && Array.isArray(d.uploaded_files)) {
      uploadedFiles = d.uploaded_files;
    }
  } catch (e) {
    console.warn('파일 정보 파싱 오류:', e);
    console.log('원본 uploaded_files:', d.uploaded_files);
  }

  // 파일 처리 완료 후에 전역 변수에 저장
  window.currentUploadedFiles = uploadedFiles;
  
  console.log('처리된 파일 목록:', uploadedFiles);
  
  // 모달 타이틀 업데이트
  const titleEl = document.getElementById('applicationDetailModalLabel');
  if (titleEl) {
    titleEl.innerHTML = `
      <i class="fas fa-building"></i> ${val(d.company_name)} - 근재보험 가입신청
      <small class="text-muted d-block d-md-inline ms-2">신청일: ${formatDate(d.created_at)}</small>
    `;
  }

  // 반응형 HTML 구조
  const html = `
    <!-- 데스크톱 버전 (768px 이상) -->
    <div class="desktop-modal d-none d-md-block">
      <div class="row">
        <!-- 탭 네비게이션 -->
        <div class="col-12 mb-3">
          <ul class="nav nav-tabs" id="detailTabs" role="tablist">
            <li class="nav-item" role="presentation">
              <button class="nav-link active" id="application-info-tab" data-bs-toggle="tab" data-bs-target="#application-info" type="button" role="tab">
                <i class="fas fa-info-circle"></i> 신청정보
              </button>
            </li>
            <li class="nav-item" role="presentation">
              <button class="nav-link" id="files-management-tab" data-bs-toggle="tab" data-bs-target="#files-management" type="button" role="tab">
                <i class="fas fa-cogs"></i> 파일 및 관리
              </button>
            </li>
          </ul>
        </div>

        <!-- 탭 콘텐츠 -->
        <div class="col-12">
          <div class="tab-content" id="detailTabContent">
            
            <!-- 신청정보 탭 (기본정보 + 계약정보 + 약관동의) -->
            <div class="tab-pane fade show active" id="application-info" role="tabpanel">
              
              <!-- 기본정보 섹션 -->
              <div class="mb-4">
                <h6 class="section-title"><i class="fas fa-info-circle"></i> 기본정보</h6>
                <form class="form-grid">
                  <label class="col-form-label">업체명</label>
                  <input type="text" class="form-control" id="company_name" value="${val(d.company_name)}" >
                  
                  <label class="col-form-label">사업자번호</label>
                  <input type="text" class="form-control" id="business_number" value="${formatBusinessNumber(d.business_number)}" >

                  <label class="col-form-label">담당자명</label>
                  <input type="text" class="form-control" id="contact_name" value="${val(d.contact_name)}" >
                  
                  <label class="col-form-label">연락처</label>
                  <input type="tel" class="form-control" id="phone" value="${val(d.phone)}" >

                  <div class="full-width">
                    <label class="col-form-label">이메일</label>
                    <input type="email" class="form-control" id="email" value="${val(d.email)}" >
                  </div>

                  <label class="col-form-label">신청일시</label>
                  <input type="text" class="form-control" value="${formatDateTime(d.created_at)}" >
                  
                  <label class="col-form-label">IP 주소</label>
                  <input type="text" class="form-control" value="${val(d.ip_address)}" >
                </form>
              </div>

              <!-- 계약정보 섹션 -->
              <div class="mb-4">
                <h6 class="section-title"><i class="fas fa-file-contract"></i> 계약정보</h6>
                <form class="form-grid">
                  <label class="col-form-label">계약유형 *</label>
                  <select class="form-control" id="contract_type" onchange="toggleContractFields()">
                    <option value="annual" ${d.contract_type === 'annual' ? 'selected' : ''}>연간계약</option>
                    <option value="project" ${d.contract_type === 'project' ? 'selected' : ''}>구간계약</option>
                  </select>
                  
                  

                  ${d.contract_type === 'project' ? `
					  <div class="full-width dynamic-contract-field">
						<label class="col-form-label">현장명 *</label>
						<input type="text" class="form-control" id="site_name" 
							   value="${val(d.site_name)}" 
							   placeholder="현장명을 입력하세요">
					  </div>
					  <label class="col-form-label dynamic-contract-field">공사기간 *</label>
					  <input type="number" class="form-control dynamic-contract-field" id="project_duration" 
							 value="${val(d.project_duration)}" 
							 placeholder="개월" min="1" max="120">
					  <label class="col-form-label dynamic-contract-field">인건비 합계 *</label>
					  <input type="text" class="form-control dynamic-contract-field" id="labor_cost" 
						   value="${d.labor_cost ? formatLaborCostDisplay(d.labor_cost) : ''}" 
						   placeholder="인건비를 입력하세요" 
						   oninput="formatLaborCostInput(this)">
					` : `
					  
					`}
                </form>
              </div>

              <!-- 약관동의 섹션 -->
				<div class="mb-4">
				  <h6 class="section-title">
					  <i class="fas fa-check-circle"></i> 약관동의 현황
					  <button type="button" class="btn btn-sm btn-outline-info ms-2" onclick="showAgreementHistory(${applicationId})">
						<i class="fas fa-history"></i> 변경이력
					  </button>
					</h6>
				  <div class="row">
					<div class="col-12">
					  <div class="card">
						<div class="card-body">
						  
						  <div class="form-check d-flex justify-content-between align-items-center mb-2">
							<div>
							  <input class="form-check-input" type="checkbox" id="agree_collect_edit" ${d.agree_collect === 'Y' ? 'checked' : ''}>
							  <label class="form-check-label" for="agree_collect_edit">
								<strong>개인정보 수집·이용 동의</strong>
							  </label>
							</div>
							<span class="badge ${d.agree_collect === 'Y' ? 'bg-success' : 'bg-danger'}">
							  ${d.agree_collect === 'Y' ? '동의' : '비동의'}
							</span>
						  </div>

						  <div class="form-check d-flex justify-content-between align-items-center mb-2">
							<div>
							  <input class="form-check-input" type="checkbox" id="agree_third_edit" ${d.agree_third === 'Y' ? 'checked' : ''}>
							  <label class="form-check-label" for="agree_third_edit">
								<strong>개인정보 제3자 제공 동의</strong>
							  </label>
							</div>
							<span class="badge ${d.agree_third === 'Y' ? 'bg-success' : 'bg-danger'}">
							  ${d.agree_third === 'Y' ? '동의' : '비동의'}
							</span>
						  </div>

						  <div class="form-check d-flex justify-content-between align-items-center mb-2">
							<div>
							  <input class="form-check-input" type="checkbox" id="agree_mkt_edit" ${d.agree_mkt === 'Y' ? 'checked' : ''}>
							  <label class="form-check-label" for="agree_mkt_edit">
								<strong>마케팅 활용 동의 (선택)</strong>
							  </label>
							</div>
							<span class="badge ${d.agree_mkt === 'Y' ? 'bg-success' : 'bg-secondary'}">
							  ${d.agree_mkt === 'Y' ? '동의' : '비동의'}
							</span>
						  </div>

						</div>
					  </div>
					</div>
				  </div>
				</div>
			</div>
            <!-- 파일 및 관리 탭 (첨부파일 + 관리정보) -->
            <div class="tab-pane fade" id="files-management" role="tabpanel">
              
              <!-- 첨부파일 섹션 -->
              <div class="mb-4">
                
                <div class="row">
                  <div class="col-12">
                    <div class="card">
                      <div class="card-header d-flex justify-content-between align-items-center">
                        <h6 class="mb-0">첨부파일 목록</h6>
                        <button type="button" class="btn btn-sm btn-primary" onclick="uploadFile(${applicationId})">
                          <i class="fas fa-upload"></i> 파일 업로드
                        </button>
                      </div>
                      <div class="card-body">
                        ${uploadedFiles.length > 0 ? `
                          <div class="table-responsive">
                            <table class="table table-sm">
                              
                              <tbody>
                                ${uploadedFiles.map(file => `
                                  <tr>
                                    <td>
                                      <i class="fas fa-file-${getFileIcon(file.mimeType)}"></i>
                                      ${file.originalName || file.fileName}
                                    </td>
                                    <td>${formatFileSize(file.size)}</td>
                                    <td>${formatDateTime(file.uploadedAt)}</td>
                                    <td>
										  <button type="button" class="btn btn-sm btn-outline-info me-1" 
												  onclick="previewFile('${file.filePath}', '${file.originalName}')" 
												  title="미리보기">
											<i class="fas fa-eye"></i>
										  </button>
										  <button type="button" class="btn btn-sm btn-outline-primary me-1" 
												  onclick="downloadFile('${file.filePath}', '${file.originalName}')" 
												  title="다운로드">
											<i class="fas fa-download"></i>
										  </button>
										  <button type="button" class="btn btn-sm btn-outline-danger" 
												  onclick="deleteFile(${applicationId}, '${file.filePath}')" 
												  title="삭제">
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
                            <i class="fas fa-folder-open fa-3x mb-3"></i>
                            <p>업로드된 파일이 없습니다.</p>
                            <button type="button" class="btn btn-primary btn-sm" onclick="uploadFile(${applicationId})">
                              <i class="fas fa-upload"></i> 파일 업로드
                            </button>
                          </div>
                        `}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 관리정보 섹션 -->
              <div class="mb-4">
                
                <form class="form-grid">
                  <label class="col-form-label">현재 상태</label>
                  <select id="status_select" class="form-control" data-id="${applicationId}" data-original-status="${d.status}">
                    ${getStatusOptions(d.status, d.allowed_next_statuses)}
                  </select>
                  
                  <label class="col-form-label">거래처</label>
                  <input type="text" class="form-control" value="${val(d.account_directory, 'workers-comp')}" >

                  <div class="full-width">
                    <label class="col-form-label">관리자 메모</label>
                    <textarea class="form-control" id="admin_memo" rows="3" 
                              placeholder="관리자 메모를 입력하고 Enter 키를 누르면 자동 저장됩니다.">${val(d.memo)}</textarea>
                  </div>
				  <label class="col-form-label">보험사</label>
				  <input type="text" class="form-control" id="insurance_company" 
						 value="${val(d.insurance_company)}" 
						 placeholder="보험사명을 입력하세요">
						 
						 
                  <label class="col-form-label">보험료</label>
                  <input type="text" class="form-control" id="premium_amount" 
                         value="${d.premium_amount ? formatCurrency(d.premium_amount) : ''}" 
                         placeholder="보험료를 입력하세요">
                  
                  <label class="col-form-label">증권번호</label>
                  <input type="text" class="form-control" id="policy_number" 
                         value="${val(d.policy_number)}" 
                         placeholder="증권번호를 입력하세요">

                  <div class="full-width">
                    <label class="col-form-label">보험기간</label>
                    <div class="date-range-container">
                      <input type="date" class="form-control" id="insurance_start_date"
                             value="${val(d.insurance_start_date)}">
                      <span class="date-separator">~</span>
                      <input type="date" class="form-control" id="insurance_end_date"
                             value="${val(d.insurance_end_date)}">
                    </div>
                  </div>

                  <div class="full-width">
                    <label class="col-form-label">수정일시</label>
                    <input type="text" class="form-control" value="${formatDateTime(d.updated_at)}" >
                  </div>
                </form>
              </div>

            </div>

          </div>
        </div>
      </div>
	  </div>
    </div>

    <!-- 모바일 버전 (768px 미만) -->
    <div class="mobile-modal d-block d-md-none">
      <div class="mobile-form-container">
        <!-- 여기에 버튼 추가 -->
		<div class="d-flex justify-content-between align-items-center mb-3 p-2 bg-light rounded">
		  <span class="fw-bold">신청서 정보</span>
		  <a href="javascript:void(0)" onclick="showAgreementHistory(${applicationId})" class="text-info text-decoration-none" style="font-size: 12px;">
			<i class="fas fa-history"></i> 약관이력
		  </a>
		</div>
        <div class="mobile-field-group">
          <label class="mobile-field-label">업체명</label>
          <input type="text" class="form-control mobile-input" id="company_name_mobile" value="${val(d.company_name)}">
        </div>
        
        <div class="mobile-field-group">
		  <label class="mobile-field-label">담당자</label>
		  <input type="text" class="form-control mobile-input" id="contact_name_mobile" value="${val(d.contact_name)}" >
		</div>

		<div class="mobile-field-group">
		  <label class="mobile-field-label">연락처</label>
		  <input type="tel" class="form-control mobile-input" id="phone_mobile" value="${val(d.phone)}" >
		</div>

		<div class="mobile-field-group">
		  <label class="mobile-field-label">이메일</label>
		  <input type="email" class="form-control mobile-input" id="email_mobile" value="${val(d.email)}" >
		</div>
        
         <div class="mobile-field-group">
		  <label class="mobile-field-label">사업자번호</label>
		  <input type="text" class="form-control mobile-input" id="business_number_mobile" 
				 value="${formatBusinessNumber(d.business_number)}" 
				 placeholder="000-00-00000" maxlength="12"
				 oninput="formatBusinessNumberInput(this)">
		</div>
        
        <div class="mobile-field-group">
          <label class="mobile-field-label">계약유형 *</label>
          <select class="form-control mobile-input" id="contract_type_mobile" onchange="toggleContractFieldsMobile()">
            <option value="annual" ${d.contract_type === 'annual' ? 'selected' : ''}>연간계약</option>
            <option value="project" ${d.contract_type === 'project' ? 'selected' : ''}>구간계약</option>
          </select>
        </div>
        
        
        
        ${d.contract_type === 'project' ? `
          <div class="mobile-field-group dynamic-contract-field-mobile">
            <label class="mobile-field-label">현장명 *</label>
            <input type="text" class="form-control mobile-input" id="site_name_mobile" 
                   value="${val(d.site_name)}" 
                   placeholder="현장명을 입력하세요">
          </div>
          
          <div class="mobile-field-group">
            <label class="mobile-field-label">공사기간 (개월) *</label>
            <input type="number" class="form-control mobile-input" id="project_duration_mobile" 
                   value="${val(d.project_duration)}" 
                   placeholder="개월" min="1" max="120">
          </div>
          
          <div class="mobile-field-group">
            <label class="mobile-field-label">인건비 합계 (원) *</label>
            <input type="text" class="form-control mobile-input" id="labor_cost_mobile" 
				   value="${d.labor_cost ? formatLaborCostDisplay(d.labor_cost) : ''}" 
				   placeholder="인건비를 입력하세요"
				   oninput="formatLaborCostInput(this)">
          </div>
        ` : ''}
        
        <div class="mobile-field-group">
          <label class="mobile-field-label">상태</label>
          <select id="status_mobile" class="form-control mobile-input" data-id="${applicationId}" data-original-status="${d.status}">
            ${getStatusOptions(d.status, d.allowed_next_statuses)}
          </select>
        </div>
        
        <div class="mobile-field-group">
          <label class="mobile-field-label">메모</label>
          <textarea class="form-control mobile-input" id="admin_memo_mobile" rows="3" 
                    placeholder="관리자 메모를 입력하세요...">${val(d.memo)}</textarea>
        </div>
			<div class="mobile-field-group">
			  <label class="mobile-field-label">보험료</label>
			  <input type="text" class="form-control mobile-input" id="premium_amount_mobile" 
					 value="${d.premium_amount ? formatCurrency(d.premium_amount) : ''}" 
					 placeholder="보험료를 입력하세요">
			</div>

			<div class="mobile-field-group">
			  <label class="mobile-field-label">증권번호</label>
			  <input type="text" class="form-control mobile-input" id="policy_number_mobile" 
					 value="${val(d.policy_number)}" 
					 placeholder="증권번호를 입력하세요">
			</div>

			<div class="mobile-field-group">
			  <label class="mobile-field-label">보험사</label>
			  <input type="text" class="form-control mobile-input" id="insurance_company_mobile" 
					 value="${val(d.insurance_company)}" 
					 placeholder="보험사명을 입력하세요">
			</div>

			<div class="mobile-field-group">
			  <label class="mobile-field-label">보험시작일</label>
			  <input type="date" class="form-control mobile-input" id="insurance_start_date_mobile"
					 value="${val(d.insurance_start_date)}">
			</div>

			<div class="mobile-field-group">
			  <label class="mobile-field-label">보험종료일</label>
			  <input type="date" class="form-control mobile-input" id="insurance_end_date_mobile"
					 value="${val(d.insurance_end_date)}">
			</div>
						 
			<div class="mobile-field-group">
			  <label class="mobile-field-label">개인정보 수집·이용 동의</label>
			  <div class="d-flex justify-content-between align-items-center">
				<div>
				  <input class="form-check-input" type="checkbox" id="agree_collect_mobile" ${d.agree_collect === 'Y' ? 'checked' : ''}>
				  <label class="form-check-label ms-2" for="agree_collect_mobile">동의</label>
				</div>
				<span class="badge ${d.agree_collect === 'Y' ? 'bg-success' : 'bg-danger'}">
				  ${d.agree_collect === 'Y' ? '동의' : '비동의'}
				</span>
			  </div>
			</div>

			<div class="mobile-field-group">
			  <label class="mobile-field-label">개인정보 제3자 제공 동의</label>
			  <div class="d-flex justify-content-between align-items-center">
				<div>
				  <input class="form-check-input" type="checkbox" id="agree_third_mobile" ${d.agree_third === 'Y' ? 'checked' : ''}>
				  <label class="form-check-label ms-2" for="agree_third_mobile">동의</label>
				</div>
				<span class="badge ${d.agree_third === 'Y' ? 'bg-success' : 'bg-danger'}">
				  ${d.agree_third === 'Y' ? '동의' : '비동의'}
				</span>
			  </div>
			</div>

			<div class="mobile-field-group">
			  <label class="mobile-field-label">마케팅 활용 동의 (선택)</label>
			  <div class="d-flex justify-content-between align-items-center">
				<div>
				  <input class="form-check-input" type="checkbox" id="agree_mkt_mobile" ${d.agree_mkt === 'Y' ? 'checked' : ''}>
				  <label class="form-check-label ms-2" for="agree_mkt_mobile">동의</label>
				</div>
				<span class="badge ${d.agree_mkt === 'Y' ? 'bg-success' : 'bg-secondary'}">
				  ${d.agree_mkt === 'Y' ? '동의' : '비동의'}
				</span>
			  </div>
			</div>		 
        <div class="mobile-field-group">
          <label class="mobile-field-label">첨부파일</label>
          <div class="d-flex justify-content-between align-items-center">
            <span class="mobile-input">${uploadedFiles.length}개 파일</span>
            <button type="button" class="btn btn-sm btn-primary" onclick="showMobileFileList(${applicationId})">
              <i class="fas fa-paperclip"></i> 파일보기
            </button>
          </div>
        </div>

      
    </div>
  `;

  document.getElementById('modalBody2').innerHTML = html;
  
  // 이벤트 리스너 설정
  setTimeout(() => {
    setupModalEventListeners(applicationId);
  }, 100);
  
  // 푸터 버튼 설정
  document.getElementById('modalFooter').innerHTML = `
    <div class="d-flex justify-content-between align-items-center w-100">
      <span class="text-muted small">
        <i class="fas fa-clock"></i> 신청일: ${formatDate(d.created_at)}
      </span>
      <div>
       
        <button type="button" class="btn btn-warning" onclick="updateApplication(${applicationId})">
          <i class="fas fa-save"></i> 수정 저장
        </button>
      </div>
    </div>
  `;
	  
	 setTimeout(() => {
		  const modalBody2 = document.getElementById('modalBody2');
		  if (modalBody2.scrollHeight === 0) {
			modalBody2.style.minHeight = '400px';
		  }
		}, 200);
}

// 모달 이벤트 리스너 설정
function setupModalEventListeners(applicationId) {
  // 상태 변경 이벤트 (데스크톱)
  const statusSelect = document.getElementById('status_select');
  if (statusSelect) {
    statusSelect.addEventListener('change', function() {
      updateApplicationStatus(applicationId, this.value);
    });
  }
  
  // 상태 변경 이벤트 (모바일)
  const statusMobile = document.getElementById('status_mobile');
  if (statusMobile) {
    statusMobile.addEventListener('change', function() {
      updateApplicationStatus(applicationId, this.value);
    });
  }
  
  // 메모 Enter 키 저장 (데스크톱)
  const adminMemo = document.getElementById('admin_memo');
  if (adminMemo) {
    adminMemo.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        saveApplicationMemo(applicationId, adminMemo.value.trim());
      }
    });
  }
  
  // 메모 Enter 키 저장 (모바일)
  const adminMemoMobile = document.getElementById('admin_memo_mobile');
  if (adminMemoMobile) {
    adminMemoMobile.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        saveApplicationMemo(applicationId, adminMemoMobile.value.trim());
      }
    });
  }
  
  // 약관동의 관리자 초기화
	const agreementManager = new AgreementManager(applicationId);
	agreementManager.bindEventListeners();
  
}



// 신청서 정보 수정
async function updateApplication(applicationId) {
  const isMobile = window.innerWidth < 768;
  const suffix = isMobile ? '_mobile' : '';

  const formData = {
  // 기본정보 (데스크톱/모바일 구분)
  company_name: document.getElementById(`company_name${suffix}`)?.value.trim() || null,
  contact_name: document.getElementById(`contact_name${suffix}`)?.value.trim() || null,
  phone: document.getElementById(`phone${suffix}`)?.value.trim() || null,
  email: document.getElementById(`email${suffix}`)?.value.trim() || null,
  business_number: document.getElementById(isMobile ? 'business_number_mobile' : 'business_number')?.value.replace(/[^0-9]/g, '') || null,

  //계약정보
  contract_type: document.getElementById(`contract_type${suffix}`)?.value || null,
  site_name: document.getElementById(`site_name${suffix}`)?.value.trim() || null,
  project_duration: document.getElementById(`project_duration${suffix}`)?.value.trim() || null,
  labor_cost: document.getElementById(`labor_cost${suffix}`)?.value.replace(/[^0-9]/g, '') || null,
  
  // 보험 정보 (데스크톱/모바일 구분)
  premium_amount: document.getElementById(`premium_amount${suffix}`)?.value.replace(/[^0-9]/g, '') || null,
  policy_number: document.getElementById(`policy_number${suffix}`)?.value.trim() || null,
  insurance_company: document.getElementById(`insurance_company${suffix}`)?.value.trim() || null,
  insurance_start_date: document.getElementById(`insurance_start_date${suffix}`)?.value || null,
  insurance_end_date: document.getElementById(`insurance_end_date${suffix}`)?.value || null,
  
  // 메모
  memo: document.getElementById(`admin_memo${suffix}`)?.value.trim() || null
};

  try {
    const response = await fetch(`/api/workers-comp/applications/${applicationId}`, {
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
      if (window.sjTemplateLoader && window.sjTemplateLoader.showToast) {
        window.sjTemplateLoader.showToast(result.message || "수정이 완료되었습니다.", "success");
      }

      // 데이터 새로고침
      if (typeof loadApplicationsData === 'function') {
        loadApplicationsData();
      }

    } else {
      throw new Error(result.message || "수정에 실패했습니다.");
    }

  } catch (err) {
    console.error('신청서 수정 오류:', err);
    if (window.sjTemplateLoader && window.sjTemplateLoader.showToast) {
      window.sjTemplateLoader.showToast("수정 중 오류가 발생했습니다: " + err.message, "error");
    } else {
      alert("수정 중 오류가 발생했습니다: " + err.message);
    }
  }
}

// 상태 변경
async function updateApplicationStatus(applicationId, newStatus) {
  try {
    const response = await fetch(`/api/workers-comp/applications/${applicationId}/status`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        status: newStatus
      })
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const result = await response.json();

    if (result.success) {
      if (window.sjTemplateLoader && window.sjTemplateLoader.showToast) {
        window.sjTemplateLoader.showToast(`상태가 "${getStatusText(newStatus)}"로 변경되었습니다.`, "success");
      }

      // 원래 상태값 업데이트
      document.querySelectorAll(`[data-id="${applicationId}"]`).forEach(el => {
        el.setAttribute('data-original-status', newStatus);
      });

      // 데이터 새로고침
      if (typeof loadApplicationsData === 'function') {
        loadApplicationsData();
      }

    } else {
      throw new Error(result.message || "상태 변경에 실패했습니다.");
    }

  } catch (err) {
    console.error('상태 변경 오류:', err);
    if (window.sjTemplateLoader && window.sjTemplateLoader.showToast) {
      window.sjTemplateLoader.showToast("상태 변경 중 오류가 발생했습니다: " + err.message, "error");
    }
  }
}





// ========== 유틸리티 함수들 ==========

// 사업자번호 포맷팅
function formatBusinessNumber(businessNumber) {
  if (!businessNumber) return '';
  
  const cleaned = businessNumber.replace(/[^0-9]/g, '');
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{3})(\d{2})(\d{5})/, '$1-$2-$3');
  }
  
  return businessNumber;
}

// 날짜 포맷팅
function formatDate(dateString) {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch (error) {
    return dateString;
  }
}

// 날짜시간 포맷팅
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

// 계약유형 배지 클래스 반환
function getContractTypeBadgeClass(contractType) {
  switch(contractType) {
    case 'annual':
      return 'bg-primary';
    case 'project':
      return 'bg-success';
    default:
      return 'bg-secondary';
  }
}

// 계약유형 텍스트 반환
function getContractTypeText(contractType) {
  const contractTypeMap = {
    'annual': '연간계약',
    'project': '구간계약'
  };
  
  return contractTypeMap[contractType] || contractType || '기타';
}

// 상태별 텍스트 반환
function getStatusText(status) {
  const statusMap = {
    'pending': '검토대기',
    'reviewing': '검토중',
    'approved': '승인',
    'rejected': '반려'
  };
  
  return statusMap[status] || status || '기타';
}

// 상태별 옵션 생성 (허용된 상태 고려)
function getStatusOptions(currentStatus, allowedNextStatuses) {
  const statusMap = {
    'pending': '검토대기',
    'reviewing': '검토중',
    'approved': '승인',
    'rejected': '반려'
  };

  let options = '';
  
  // 허용된 상태가 있으면 그것을 사용, 없으면 기본 규칙 적용
  let allowedStatuses = [];
  
  if (allowedNextStatuses && Array.isArray(allowedNextStatuses)) {
    // 현재 상태도 포함
    allowedStatuses = [currentStatus, ...allowedNextStatuses].filter((status, index, arr) => arr.indexOf(status) === index);
  } else {
    // 기본 상태 전환 규칙
    switch(currentStatus) {
      case 'pending':
        allowedStatuses = ['pending', 'reviewing', 'approved', 'rejected'];
        break;
      case 'reviewing':
        allowedStatuses = ['reviewing', 'approved', 'rejected', 'pending'];
        break;
      case 'approved':
        allowedStatuses = ['approved']; // 승인된 것은 변경 불가
        break;
      case 'rejected':
        allowedStatuses = ['rejected', 'reviewing', 'pending'];
        break;
      default:
        allowedStatuses = Object.keys(statusMap);
    }
  }
  
  allowedStatuses.forEach(status => {
    if (statusMap[status]) {
      const selected = status === currentStatus ? 'selected' : '';
      options += `<option value="${status}" ${selected}>${statusMap[status]}</option>`;
    }
  });
  
  return options;
}

// 통화 포맷팅
function formatCurrency(amount) {
  if (!amount) return '';
  
  try {
    const num = parseInt(amount.toString().replace(/[^0-9]/g, ''));
    if (isNaN(num)) return amount;
    
    return num.toLocaleString('ko-KR') + '원';
  } catch (error) {
    return amount;
  }
}

// 파일 크기 포맷팅
function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 파일 아이콘 결정
function getFileIcon(mimeType) {
  if (!mimeType) return 'file';
  
  if (mimeType.includes('pdf')) return 'pdf';
  if (mimeType.includes('image')) return 'image';
  if (mimeType.includes('word')) return 'word';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'excel';
  if (mimeType.includes('zip') || mimeType.includes('rar')) return 'archive';
  
  return 'file';
}

// 파일명에서 MIME 타입 추측
function getMimeTypeFromFileName(fileName) {
  if (!fileName) return 'application/octet-stream';
  
  const ext = fileName.toLowerCase().split('.').pop();
  const mimeTypes = {
    'pdf': 'application/pdf',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'zip': 'application/zip',
    'rar': 'application/x-rar-compressed'
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
}





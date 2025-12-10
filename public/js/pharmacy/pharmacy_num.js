// showDetailModal 함수 구현 - Vanilla JS 버전
async function showDetailModal(num) {
  try {
    // 모달 열기 - Bootstrap 5 방식
    const modalElement = document.getElementById('pharmacyDetailModal');
    if (!modalElement) {
      throw new Error('상세 모달 요소를 찾을 수 없습니다.');
    }
    
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
    
    // 초기 상태 설정
    const detailLoading = document.getElementById('detailLoading');
    const pharmacyDetailForm = document.getElementById('pharmacyDetailForm');
    const detailError = document.getElementById('detailError');
    
    if (detailLoading) detailLoading.style.display = 'block';
    if (pharmacyDetailForm) pharmacyDetailForm.style.display = 'none';
    if (detailError) detailError.style.display = 'none';
    
    console.log('약국 상세 정보 로드:', num);
    
    // API 호출
    const response = await fetch(`/api/pharmacy/id-detail/${num}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    console.log('API 응답 데이터:', result);
    
    if (result.success && result.data && Object.keys(result.data).length > 0) {
      // 성공적으로 데이터를 받아온 경우
      populateDetailForm(result.data);
      if (detailLoading) detailLoading.style.display = 'none';
      if (pharmacyDetailForm) pharmacyDetailForm.style.display = 'block';
    } else {
      // 데이터가 없거나 오류인 경우
      throw new Error(result.error || '해당 약국의 상세 정보를 찾을 수 없습니다.');
    }
    
  } catch (error) {
    console.error('상세 정보 로드 오류:', error);
    
    const detailLoading = document.getElementById('detailLoading');
    const detailError = document.getElementById('detailError');
    const detailErrorMessage = document.getElementById('detailErrorMessage');
    
    if (detailLoading) detailLoading.style.display = 'none';
    if (detailErrorMessage) detailErrorMessage.textContent = error.message;
    if (detailError) detailError.style.display = 'block';
  }
}

// 상세 정보 폼에 데이터 채우기 - Vanilla JS 버전
function populateDetailForm(data) {
  try {
    // 헬퍼 함수: 요소에 값 설정
    const setValue = (id, value) => {
      const element = document.getElementById(id);
      if (element) {
        element.value = value || '';
      }
    };

    // 기본 정보
    setValue('company', data.company);
    setValue('business_number', data.business_number || data.school2);
    setValue('application_date', data.application_date);
    setValue('general_phone', data.general_phone || data.hphone2);
    
    // 신청자 정보
    setValue('applicant_name', data.applicant_name || data.damdangja);
    setValue('resident_number', data.resident_number);
    setValue('email', data.email);
    setValue('mobile_phone', data.mobile_phone || data.hphone);
    
    // 사업장 정보
    setValue('address', data.address);
    setValue('expert_count', data.expert_count || data.chemist || '-1');
    setValue('business_area', data.business_area || data.area);
    setValue('inventory_value', data.jaegojasan || '-1');
    
    // 보험 정보
    const premiumElement = document.getElementById('premium');
    if (premiumElement && data.premium) {
      premiumElement.value = parseInt(data.premium).toLocaleString();
    }
    setValue('certificate_number', data.certificate_number || data.chemist_design_number);
    setValue('message', data.message || data.memo);
    
    // 보험기간 추가
    setValue('insurance_start_date', data.insurance_start_date);
    setValue('insurance_end_date', data.insurance_end_date);
    
    // 현재 약국 번호를 폼에 저장
    const formElement = document.getElementById('pharmacyDetailForm');
    if (formElement) {
      formElement.dataset.currentNum = data.num;
    }
    
    console.log('상세 정보 폼 데이터 설정 완료:', data.num);
    
  } catch (error) {
    console.error('폼 데이터 설정 오류:', error);
    window.templateLoader.showToast('폼 데이터 설정 중 오류가 발생했습니다.', 'error');
  }
}

// 약국 상세 정보 저장 - Vanilla JS 버전
async function savePharmacyDetail() {
  try {
    const formElement = document.getElementById('pharmacyDetailForm');
    if (!formElement) {
      throw new Error('폼 요소를 찾을 수 없습니다.');
    }
    
    const currentNum = formElement.dataset.currentNum;
    if (!currentNum) {
      throw new Error('저장할 약국 정보를 찾을 수 없습니다.');
    }
    
    // 헬퍼 함수: 요소 값 가져오기
    const getValue = (id) => {
      const element = document.getElementById(id);
      return element ? element.value : '';
    };
    
    // 폼 데이터 수집
    const formData = {
		company: getValue('company'),
		business_number: getValue('business_number'),
		application_date: getValue('application_date'),
		general_phone: getValue('general_phone'),
		applicant_name: getValue('applicant_name'),
		resident_number: getValue('resident_number'),
		email: getValue('email'),
		mobile_phone: getValue('mobile_phone'),
		address: getValue('address'),
		expert_count: getValue('expert_count'),
		business_area: getValue('business_area'),
		inventory_value: getValue('inventory_value'),
		premium: getValue('premium'),
		certificate_number: getValue('certificate_number'),
		insurance_start_date: getValue('insurance_start_date'),
		insurance_end_date: getValue('insurance_end_date'),
		message: getValue('message')
	  };
    
    console.log('약국 정보 저장 요청:', currentNum, formData);
    
    // API 호출
    const response = await fetch(`/api/pharmacy/id-update/${currentNum}`, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (result.success) {
      // 성공 메시지
      window.templateLoader.showToast('약국 정보가 성공적으로 수정되었습니다.', 'success');
      
      // 응답 데이터로 폼 업데이트
      if (result.data) {
        updateFormWithResponseData(result.data);
      }
      
    } else {
      throw new Error(result.error || '저장 실패');
    }
    
  } catch (error) {
    console.error('약국 정보 저장 오류:', error);
    window.templateLoader.showToast(`약국 정보 저장 중 오류가 발생했습니다: ${error.message}`, 'error');
  }
}

// 응답 데이터로 폼 업데이트 - Vanilla JS 버전
function updateFormWithResponseData(data) {
  console.log('응답 데이터로 폼 업데이트:', data);
  
  // 보험료 업데이트 (콤마 포맷팅 포함)
  if (data.premium) {
    const formattedPremium = parseInt(data.premium).toLocaleString();
    const premiumElement = document.getElementById('premium');
    if (premiumElement) {
      premiumElement.value = formattedPremium;
    }
    
    console.log('보험료 업데이트:', data.premium);
  }
}

// 전문증권 발행 - Vanilla JS 버전
async function issueCertificate() {
  try {
    const formElement = document.getElementById('pharmacyDetailForm');
    const certificateNumberElement = document.getElementById('certificate_number');
    
    if (!formElement) {
      throw new Error('폼 요소를 찾을 수 없습니다.');
    }
    
    const currentNum = formElement.dataset.currentNum;
    const certificateNumber = certificateNumberElement ? certificateNumberElement.value : '';
    
    if (!currentNum) {
      throw new Error('증권을 발행할 약국 정보를 찾을 수 없습니다.');
    }
    
    if (!certificateNumber.trim()) {
      window.templateLoader.showToast('증권번호를 입력해주세요.', 'warning');
      if (certificateNumberElement) certificateNumberElement.focus();
      return;
    }
    
    // 확인 다이얼로그
    if (!confirm(`증권번호 "${certificateNumber}"로 전문증권을 발행하시겠습니까?`)) {
      return;
    }
    
    console.log('전문증권 발행 요청:', currentNum, certificateNumber);
    
    // API 호출
    const response = await fetch('/api/pharmacy/issue-certificate', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        num: currentNum,
        certificate_number: certificateNumber
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (result.success) {
      window.templateLoader.showToast('전문증권이 성공적으로 발행되었습니다.', 'success');
    } else {
      throw new Error(result.error || '증권 발행 실패');
    }
    
  } catch (error) {
    console.error('전문증권 발행 오류:', error);
    
    if (error.message.includes('404') || error.message.includes('준비 중')) {
      window.templateLoader.showToast('전문증권 발행 기능은 준비 중입니다.', 'info');
    } else {
      window.templateLoader.showToast(`전문증권 발행 중 오류가 발생했습니다: ${error.message}`, 'error');
    }
  }
}

// 파일 업로드 처리 - Vanilla JS 버전
async function uploadFiles() {
  try {
    const uploadModalElement = document.getElementById('pharmacyUploadModal');
    if (!uploadModalElement) {
      throw new Error('업로드 모달 요소를 찾을 수 없습니다.');
    }
    
    const currentNum = uploadModalElement.dataset.currentNum;
    if (!currentNum) {
      throw new Error('파일을 업로드할 약국 정보를 찾을 수 없습니다.');
    }
    
    const certificateFileElement = document.getElementById('certificate_file');
    const receiptFileElement = document.getElementById('receipt_file');
    
    const certificateFiles = certificateFileElement ? certificateFileElement.files : [];
    const receiptFiles = receiptFileElement ? receiptFileElement.files : [];
    
    if (certificateFiles.length === 0 && receiptFiles.length === 0) {
      window.templateLoader.showToast('업로드할 파일을 선택해주세요.', 'warning');
      return;
    }
    
    // 파일 크기 검증 (5MB = 5 * 1024 * 1024 bytes)
    const maxSize = 5 * 1024 * 1024;
    const allFiles = [...certificateFiles, ...receiptFiles];
    
    for (let file of allFiles) {
      if (file.size > maxSize) {
        window.templateLoader.showToast(`파일 "${file.name}"이 5MB를 초과합니다.`, 'error');
        return;
      }
    }
    
    // FormData 생성
    const formData = new FormData();
    formData.append('num', currentNum);
    
    // 증권 파일들 추가
    for (let i = 0; i < certificateFiles.length; i++) {
      formData.append('certificate_files', certificateFiles[i]);
    }
    
    // 영수증 파일들 추가
    for (let i = 0; i < receiptFiles.length; i++) {
      formData.append('receipt_files', receiptFiles[i]);
    }
    
    console.log('파일 업로드 시작:', currentNum, {
      certificate_count: certificateFiles.length,
      receipt_count: receiptFiles.length
    });
    
    // UI 상태 변경
    const uploadButton = document.getElementById('uploadFiles');
    const uploadProgress = document.getElementById('uploadProgress');
    
    if (uploadButton) {
      uploadButton.disabled = true;
      uploadButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 업로드 중...';
    }
    if (uploadProgress) uploadProgress.style.display = 'block';
    
    // 진행바 애니메이션 시작
    let progress = 0;
    const progressBar = document.querySelector('.progress-bar');
    const progressInterval = setInterval(() => {
      progress += 10;
      if (progress <= 90 && progressBar) {
        progressBar.style.width = progress + '%';
        progressBar.setAttribute('aria-valuenow', progress);
      }
    }, 200);
    
    // API 호출
    const response = await fetch('/api/pharmacy/upload-files', {
      method: 'POST',
      body: formData
    });
    
    // 진행바 완료
    clearInterval(progressInterval);
    if (progressBar) {
      progressBar.style.width = '100%';
      progressBar.setAttribute('aria-valuenow', 100);
    }
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (result.success) {
      window.templateLoader.showToast('파일이 성공적으로 업로드되었습니다.', 'success');
      
      // 파일 입력 초기화
      resetFileInputs();
      
      // 기존 파일 목록 새로고침
      loadExistingFiles(currentNum);
      
      // 잠시 후 진행바 숨김
      setTimeout(() => {
        if (uploadProgress) uploadProgress.style.display = 'none';
        if (progressBar) {
          progressBar.style.width = '0%';
          progressBar.setAttribute('aria-valuenow', 0);
        }
      }, 1500);
      
    } else {
      throw new Error(result.error || '파일 업로드 실패');
    }
    
  } catch (error) {
    console.error('파일 업로드 오류:', error);
    
    if (error.message.includes('404') || error.message.includes('준비 중')) {
      window.templateLoader.showToast('파일 업로드 기능은 준비 중입니다.', 'info');
    } else {
      window.templateLoader.showToast(`파일 업로드 중 오류가 발생했습니다: ${error.message}`, 'error');
    }
  } finally {
    // 업로드 버튼 다시 활성화
    const uploadButton = document.getElementById('uploadFiles');
    const uploadProgress = document.getElementById('uploadProgress');
    const progressBar = document.querySelector('.progress-bar');
    
    if (uploadButton) {
      uploadButton.disabled = false;
      uploadButton.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> 업로드 실행';
    }
    if (uploadProgress) uploadProgress.style.display = 'none';
    if (progressBar) {
      progressBar.style.width = '0%';
      progressBar.setAttribute('aria-valuenow', 0);
    }
  }
}

// 파일 선택 시 파일 목록 표시 - Vanilla JS 버전
function displayFileList(inputElement, listContainerSelector) {
  const files = inputElement.files;
  const container = document.querySelector(listContainerSelector);
  
  if (!container) return;
  
  container.innerHTML = '';
  
  if (files.length > 0) {
    let html = '<div class="mt-3"><small class="text-muted font-weight-bold">선택된 파일:</small>';
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileSize = (file.size / 1024 / 1024).toFixed(2); // MB 단위
      const fileIcon = getFileIcon(file.name);
      
      html += `
        <div class="file-item mt-2">
          <div class="file-info">
            <i class="${fileIcon} mr-2"></i>
            <span class="font-weight-medium">${file.name}</span>
            <span class="file-size">(${fileSize}MB)</span>
          </div>
          <div class="file-actions">
            <button type="button" class="btn btn-sm btn-outline-danger" onclick="removeFileFromInput('${inputElement.id}', ${i})">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
      `;
    }
    
    html += '</div>';
    container.innerHTML = html;
  }
}

// 주민번호 형식 자동 설정
function formatResidentNumber(input) {
  let value = input.value.replace(/[^0-9]/g, '');
  if (value.length >= 6) {
    value = value.substring(0, 6) + '-' + value.substring(6, 13);
  }
  input.value = value;
}

// 전화번호 형식 자동 설정
function formatPhoneNumber(input) {
  let value = input.value.replace(/[^0-9]/g, '');
  
  if (value.length <= 3) {
    input.value = value;
  } else if (value.length <= 7) {
    input.value = value.substring(0, 3) + '-' + value.substring(3);
  } else {
    input.value = value.substring(0, 3) + '-' + value.substring(3, 7) + '-' + value.substring(7, 11);
  }
}

// 모달 이벤트 바인딩 - Vanilla JS 버전
function bindDetailModalEvents() {
  // 저장 버튼 클릭
  const saveButton = document.getElementById('savePharmacyDetail');
  if (saveButton && !saveButton.hasEventListener) {
    saveButton.addEventListener('click', savePharmacyDetail);
    saveButton.hasEventListener = true;
  }
  
  // 전문증권 발행 버튼 클릭
  const issueButton = document.getElementById('issueCertificate');
  if (issueButton && !issueButton.hasEventListener) {
    issueButton.addEventListener('click', issueCertificate);
    issueButton.hasEventListener = true;
  }
  
  // 업로드 모달 열기 버튼
  const openUploadButton = document.getElementById('openUploadModal');
  if (openUploadButton && !openUploadButton.hasEventListener) {
    openUploadButton.addEventListener('click', openUploadModal);
    openUploadButton.hasEventListener = true;
  }
  
  // 파일 업로드 버튼 클릭
  const uploadButton = document.getElementById('uploadFiles');
  if (uploadButton && !uploadButton.hasEventListener) {
    uploadButton.addEventListener('click', uploadFiles);
    uploadButton.hasEventListener = true;
  }
  
  // 파일 선택 이벤트
  const certificateFileInput = document.getElementById('certificate_file');
  if (certificateFileInput && !certificateFileInput.hasEventListener) {
    certificateFileInput.addEventListener('change', function() {
      const fileName = this.files.length > 0 ? 
        `${this.files.length}개 파일 선택됨` : '증권 파일 선택';
      const label = this.nextElementSibling;
      if (label && label.classList.contains('custom-file-label')) {
        label.textContent = fileName;
      }
      displayFileList(this, '#certificate_file_list');
    });
    certificateFileInput.hasEventListener = true;
  }
  
  const receiptFileInput = document.getElementById('receipt_file');
  if (receiptFileInput && !receiptFileInput.hasEventListener) {
    receiptFileInput.addEventListener('change', function() {
      const fileName = this.files.length > 0 ? 
        `${this.files.length}개 파일 선택됨` : '영수증 파일 선택';
      const label = this.nextElementSibling;
      if (label && label.classList.contains('custom-file-label')) {
        label.textContent = fileName;
      }
      displayFileList(this, '#receipt_file_list');
    });
    receiptFileInput.hasEventListener = true;
  }
  
  // 주민번호 형식 자동 설정
  const residentNumberInput = document.getElementById('resident_number');
  if (residentNumberInput && !residentNumberInput.hasEventListener) {
    residentNumberInput.addEventListener('input', function() {
      formatResidentNumber(this);
    });
    residentNumberInput.hasEventListener = true;
  }
  
  // 전화번호 형식 자동 설정
  const phoneInputs = ['mobile_phone', 'general_phone'];
  phoneInputs.forEach(inputId => {
    const input = document.getElementById(inputId);
    if (input && !input.hasEventListener) {
      input.addEventListener('input', function() {
        formatPhoneNumber(this);
      });
      input.hasEventListener = true;
    }
  });
  
  // 숫자 입력 필드 천단위 콤마 추가
  const numberInputs = ['premium', 'inventory_value'];
  numberInputs.forEach(inputId => {
    const input = document.getElementById(inputId);
    if (input && !input.hasEventListener) {
      input.addEventListener('input', function() {
        let value = this.value.replace(/[^0-9]/g, '');
        if (value) {
          this.value = parseInt(value).toLocaleString();
        }
      });
      input.hasEventListener = true;
    }
  });
  
  // 상세 모달이 닫힐 때 폼 초기화 - Bootstrap 5 방식
  const pharmacyDetailModal = document.getElementById('pharmacyDetailModal');
  if (pharmacyDetailModal && !pharmacyDetailModal.hasHiddenListener) {
    pharmacyDetailModal.addEventListener('hidden.bs.modal', function() {
      const form = document.getElementById('pharmacyDetailForm');
      if (form) {
        form.reset();
        delete form.dataset.currentNum;
      }
    });
    pharmacyDetailModal.hasHiddenListener = true;
  }
  
  // 업로드 모달이 닫힐 때 파일 입력 초기화 - Bootstrap 5 방식
  const pharmacyUploadModal = document.getElementById('pharmacyUploadModal');
  if (pharmacyUploadModal && !pharmacyUploadModal.hasHiddenListener) {
    pharmacyUploadModal.addEventListener('hidden.bs.modal', function() {
      resetFileInputs();
      delete this.dataset.currentNum;
      
      const uploadProgress = document.getElementById('uploadProgress');
      const existingFiles = document.getElementById('existingFiles');
      const progressBar = document.querySelector('.progress-bar');
      
      if (uploadProgress) uploadProgress.style.display = 'none';
      if (progressBar) {
        progressBar.style.width = '0%';
        progressBar.setAttribute('aria-valuenow', 0);
      }
      if (existingFiles) existingFiles.style.display = 'none';
    });
    pharmacyUploadModal.hasHiddenListener = true;
  }
  
  // 드래그 앤 드롭 초기화
  initializeDragAndDrop();
}

// 업로드 모달 열기 - Vanilla JS 버전
function openUploadModal() {
  const formElement = document.getElementById('pharmacyDetailForm');
  if (!formElement) {
    window.templateLoader.showToast('폼 요소를 찾을 수 없습니다.', 'error');
    return;
  }
  
  const currentNum = formElement.dataset.currentNum;
  if (!currentNum) {
    window.templateLoader.showToast('업로드할 약국 정보를 찾을 수 없습니다.', 'error');
    return;
  }
  
  // 업로드 모달에도 현재 약국 번호 저장
  const uploadModal = document.getElementById('pharmacyUploadModal');
  if (uploadModal) {
    uploadModal.dataset.currentNum = currentNum;
  }
  
  // 기존 파일 목록 로드
  loadExistingFiles(currentNum);
  
  // 업로드 모달 열기 - Bootstrap 5 방식
  const modal = new bootstrap.Modal(uploadModal);
  modal.show();
}

// 기존 파일 목록 로드 - Vanilla JS 버전
async function loadExistingFiles(num) {
  try {
    const response = await fetch(`/api/pharmacy/files/${num}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    const existingFiles = document.getElementById('existingFiles');
    
    if (response.ok) {
      const result = await response.json();
      if (result.success && result.data && result.data.length > 0) {
        displayExistingFiles(result.data);
        if (existingFiles) existingFiles.style.display = 'block';
      } else {
        if (existingFiles) existingFiles.style.display = 'none';
      }
    } else {
      // 404나 다른 에러는 무시 (기존 파일이 없는 경우)
      if (existingFiles) existingFiles.style.display = 'none';
    }
  } catch (error) {
    console.log('기존 파일 목록 로드 실패:', error.message);
    const existingFiles = document.getElementById('existingFiles');
    if (existingFiles) existingFiles.style.display = 'none';
  }
}

// 기존 파일 목록 표시 - Vanilla JS 버전
function displayExistingFiles(files) {
  let html = '';
  
  files.forEach(file => {
    const fileIcon = getFileIcon(file.file_name);
    const fileSize = file.file_size ? `(${(file.file_size / 1024 / 1024).toFixed(2)}MB)` : '';
    
    html += `
      <div class="file-item">
        <div class="file-info">
          <i class="${fileIcon} mr-2"></i>
          <span>${file.file_name}</span>
          <span class="file-size">${fileSize}</span>
        </div>
        <div class="file-actions">
          <button type="button" class="btn btn-sm btn-outline-primary" onclick="downloadFile('${file.id}', '${file.file_name}')">
            <i class="fas fa-download"></i>
          </button>
          <button type="button" class="btn btn-sm btn-outline-danger ml-1" onclick="deleteFile('${file.id}', '${file.file_name}')">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `;
  });
  
  const existingFilesList = document.getElementById('existingFilesList');
  if (existingFilesList) {
    existingFilesList.innerHTML = html;
  }
}

// 파일 아이콘 반환
function getFileIcon(fileName) {
  const extension = fileName.split('.').pop().toLowerCase();
  switch (extension) {
    case 'pdf':
      return 'fas fa-file-pdf text-danger';
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
      return 'fas fa-file-image text-info';
    default:
      return 'fas fa-file text-secondary';
  }
}

// 파일 다운로드
async function downloadFile(fileId, fileName) {
  try {
    const response = await fetch(`/api/pharmacy/download-file/${fileId}`, {
      method: 'GET'
    });
    
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } else {
      throw new Error('파일 다운로드 실패');
    }
  } catch (error) {
    window.templateLoader.showToast('파일 다운로드 중 오류가 발생했습니다: ' + error.message, 'error');
  }
}

// 파일 삭제 - Vanilla JS 버전
async function deleteFile(fileId, fileName) {
  if (!confirm(`"${fileName}" 파일을 삭제하시겠습니까?`)) {
    return;
  }
  
  try {
    const response = await fetch(`/api/pharmacy/delete-file/${fileId}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    if (result.success) {
      window.templateLoader.showToast('파일이 성공적으로 삭제되었습니다.', 'success');
      // 기존 파일 목록 새로고침
      const uploadModal = document.getElementById('pharmacyUploadModal');
      const currentNum = uploadModal ? uploadModal.dataset.currentNum : null;
      if (currentNum) {
        loadExistingFiles(currentNum);
      }
    } else {
      throw new Error(result.error || '파일 삭제 실패');
    }
  } catch (error) {
    window.templateLoader.showToast('파일 삭제 중 오류가 발생했습니다: ' + error.message, 'error');
  }
}

// 파일 입력 초기화 - Vanilla JS 버전
function resetFileInputs() {
  const certificateFile = document.getElementById('certificate_file');
  const receiptFile = document.getElementById('receipt_file');
  
  if (certificateFile) certificateFile.value = '';
  if (receiptFile) receiptFile.value = '';
  
  // 커스텀 파일 라벨 초기화
  const customLabels = document.querySelectorAll('.custom-file-label');
  customLabels.forEach(label => {
    label.textContent = '파일 선택';
  });
  
  // 파일 목록 초기화
  const certificateList = document.getElementById('certificate_file_list');
  const receiptList = document.getElementById('receipt_file_list');
  
  if (certificateList) certificateList.innerHTML = '';
  if (receiptList) receiptList.innerHTML = '';
}

// 입력된 파일에서 특정 파일 제거
function removeFileFromInput(inputId, index) {
  const input = document.getElementById(inputId);
  if (!input) return;
  
  const dt = new DataTransfer();
  
  // 선택된 인덱스를 제외한 나머지 파일들을 새로운 FileList에 추가
  for (let i = 0; i < input.files.length; i++) {
    if (i !== index) {
      dt.items.add(input.files[i]);
    }
  }
  
  // 새로운 FileList로 교체
  input.files = dt.files;
  
  // 라벨 업데이트
  const fileName = input.files.length > 0 ? 
    `${input.files.length}개 파일 선택됨` : 
    (inputId === 'certificate_file' ? '증권 파일 선택' : '영수증 파일 선택');
  
  const label = input.nextElementSibling;
  if (label && label.classList.contains('custom-file-label')) {
    label.textContent = fileName;
  }
  
  // 파일 목록 다시 표시
  const listContainer = inputId === 'certificate_file' ? '#certificate_file_list' : '#receipt_file_list';
  displayFileList(input, listContainer);
}

// 드래그 앤 드롭 기능 추가 - Vanilla JS 버전
function initializeDragAndDrop() {
  const uploadSections = document.querySelectorAll('.upload-section');
  
  uploadSections.forEach(section => {
    if (section.hasDragDropListener) return;
    
    section.addEventListener('dragover', function(e) {
      e.preventDefault();
      e.stopPropagation();
      this.classList.add('dragover');
    });
    
    section.addEventListener('dragleave', function(e) {
      e.preventDefault();
      e.stopPropagation();
      this.classList.remove('dragover');
    });
    
    section.addEventListener('drop', function(e) {
      e.preventDefault();
      e.stopPropagation();
      this.classList.remove('dragover');
      
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const targetInput = this.querySelector('input[type="file"]');
        if (targetInput) {
          targetInput.files = files;
          
          // 라벨 업데이트
          const fileName = files.length > 0 ? `${files.length}개 파일 선택됨` : '파일 선택';
          const label = targetInput.nextElementSibling;
          if (label && label.classList.contains('custom-file-label')) {
            label.textContent = fileName;
          }
          
          // 파일 목록 표시
          const listContainer = targetInput.id === 'certificate_file' ? '#certificate_file_list' : '#receipt_file_list';
          displayFileList(targetInput, listContainer);
        }
      }
    });
    
    section.hasDragDropListener = true;
  });
}
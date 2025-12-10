// 파일 업로드 메인 함수
async function uploadFile(applicationId) {
  try {
    // 파일 선택 input 생성
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    fileInput.accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.zip,.rar';
    
    // 파일 선택 이벤트 리스너
    fileInput.addEventListener('change', async (event) => {
      const files = Array.from(event.target.files);
      
      if (files.length === 0) return;
      
      // 파일 크기 및 개수 검증
      const maxFileSize = 10 * 1024 * 1024; // 10MB
      const maxFileCount = 5;
      
      if (files.length > maxFileCount) {
        showToast(`최대 ${maxFileCount}개의 파일만 업로드할 수 있습니다.`, 'error');
        return;
      }
      
      const oversizedFiles = files.filter(file => file.size > maxFileSize);
      if (oversizedFiles.length > 0) {
        showToast('파일 크기는 10MB 이하만 가능합니다.', 'error');
        return;
      }
      
      // 업로드 진행
      await processFileUpload(applicationId, files);
    });
    
    // 파일 선택 다이얼로그 열기
    fileInput.click();
    
  } catch (error) {
    console.error('파일 업로드 초기화 오류:', error);
    showToast('파일 업로드 준비 중 오류가 발생했습니다.', 'error');
  }
}

// 파일 업로드 처리
async function processFileUpload(applicationId, files) {
  const progressModal = showUploadProgressModal(files.length);
  
  try {
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      updateProgressModal(i + 1, files.length, `업로드 중: ${file.name}`);
      
      try {
        await uploadSingleFile(applicationId, file);
        successCount++;
      } catch (error) {
        console.error(`파일 업로드 실패: ${file.name}`, error);
        failCount++;
      }
    }
    
    // 진행률 모달 닫기
    closeProgressModal();
    
    // 결과 메시지
    if (successCount > 0) {
      showToast(`${successCount}개 파일이 성공적으로 업로드되었습니다.`, 'success');
      
      // 모달 새로고침
      await refreshModalData(applicationId);
    }
    
    if (failCount > 0) {
      showToast(`${failCount}개 파일 업로드에 실패했습니다.`, 'warning');
    }
    
  } catch (error) {
    closeProgressModal();
    console.error('파일 업로드 처리 오류:', error);
    showToast('파일 업로드 중 오류가 발생했습니다.', 'error');
  }
}

// 단일 파일 업로드
async function uploadSingleFile(applicationId, file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('application_id', applicationId);
  
  const response = await fetch('https://geunjae.kr/api/workers-comp/file-upload.php', {
    method: 'POST',
    body: formData
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || '업로드 실패');
  }
  
  return result;
}

// 업로드 진행률 모달 표시
function showUploadProgressModal(totalFiles) {
  // 기존 진행률 모달이 있다면 제거
  const existingModal = document.getElementById('uploadProgressModal');
  if (existingModal) {
    existingModal.remove();
  }
  
  const modalHTML = `
    <div class="modal fade" id="uploadProgressModal" tabindex="-1" data-bs-backdrop="static" data-bs-keyboard="false">
      <div class="modal-dialog modal-sm">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="fas fa-upload"></i> 파일 업로드 중
            </h5>
          </div>
          <div class="modal-body text-center">
            <div class="mb-3">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">업로드 중...</span>
              </div>
            </div>
            <div class="progress mb-3">
              <div class="progress-bar" id="uploadProgress" role="progressbar" 
                   style="width: 0%" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
              </div>
            </div>
            <div id="uploadStatus" class="text-muted">
              준비 중...
            </div>
            <div id="uploadCount" class="small text-muted mt-2">
              0 / ${totalFiles} 파일
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  const modal = new bootstrap.Modal(document.getElementById('uploadProgressModal'));
  modal.show();
  
  return modal;
}

// 진행률 모달 업데이트
function updateProgressModal(current, total, message) {
  const progressBar = document.getElementById('uploadProgress');
  const statusEl = document.getElementById('uploadStatus');
  const countEl = document.getElementById('uploadCount');
  
  if (progressBar) {
    const percentage = Math.round((current / total) * 100);
    progressBar.style.width = `${percentage}%`;
    progressBar.setAttribute('aria-valuenow', percentage);
  }
  
  if (statusEl) {
    statusEl.textContent = message;
  }
  
  if (countEl) {
    countEl.textContent = `${current} / ${total} 파일`;
  }
}

// 진행률 모달 닫기
function closeProgressModal() {
  const modal = document.getElementById('uploadProgressModal');
  if (modal) {
    const bsModal = bootstrap.Modal.getInstance(modal);
    if (bsModal) {
      bsModal.hide();
    }
    setTimeout(() => modal.remove(), 300);
  }
}

// 파일 다운로드
async function downloadFile(filePath, originalName) {
  try {
    const response = await fetch('https://geunjae.kr/api/workers-comp/file-download.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        file_path: filePath,
        original_name: originalName
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    // 파일 다운로드 처리
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = originalName || 'download';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    showToast('파일 다운로드가 시작되었습니다.', 'success');
    
  } catch (error) {
    console.error('파일 다운로드 오류:', error);
    showToast('파일 다운로드 중 오류가 발생했습니다.', 'error');
  }
}

// 파일 미리보기
async function previewFile(filePath, originalName) {
  try {
    const fileExtension = originalName.toLowerCase().split('.').pop();
    
    // 이미지 파일인 경우 모달로 미리보기
    if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension)) {
      showImagePreviewModal(filePath, originalName);
    } 
    // PDF 파일인 경우 새 탭에서 열기
    else if (fileExtension === 'pdf') {
      const previewUrl = `https://geunjae.kr/api/workers-comp/file-preview.php?file=${encodeURIComponent(filePath)}`;
      window.open(previewUrl, '_blank');
    }
    // 기타 파일은 다운로드
    else {
      showToast('해당 파일 형식은 미리보기를 지원하지 않습니다. 다운로드합니다.', 'info');
      await downloadFile(filePath, originalName);
    }
    
  } catch (error) {
    console.error('파일 미리보기 오류:', error);
    showToast('파일 미리보기 중 오류가 발생했습니다.', 'error');
  }
}

// 이미지 미리보기 모달
function showImagePreviewModal(filePath, originalName) {
  const modalHTML = `
    <div class="modal fade" id="imagePreviewModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="fas fa-image"></i> ${originalName}
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body text-center">
            <img src="https://geunjae.kr/api/workers-comp/file-preview.php?file=${encodeURIComponent(filePath)}" 
                 class="img-fluid" alt="${originalName}" 
                 style="max-height: 70vh;">
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-primary" 
                    onclick="downloadFile('${filePath}', '${originalName}')">
              <i class="fas fa-download"></i> 다운로드
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // 기존 미리보기 모달 제거
  const existingModal = document.getElementById('imagePreviewModal');
  if (existingModal) {
    existingModal.remove();
  }
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  const modal = new bootstrap.Modal(document.getElementById('imagePreviewModal'));
  modal.show();
  
  // 모달 닫힐 때 DOM에서 제거
  modal._element.addEventListener('hidden.bs.modal', () => {
    modal._element.remove();
  });
}

// 파일 삭제
async function deleteFile(applicationId, filePath) {
  if (!confirm('이 파일을 삭제하시겠습니까?')) {
    return;
  }
  
  try {
    const response = await fetch('https://geunjae.kr/api/workers-comp/file-delete.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        application_id: applicationId,
        file_path: filePath
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.success) {
      showToast('파일이 삭제되었습니다.', 'success');
      
      // 모달 새로고침
      await refreshModalData(applicationId);
    } else {
      throw new Error(result.error || '파일 삭제에 실패했습니다.');
    }
    
  } catch (error) {
    console.error('파일 삭제 오류:', error);
    showToast('파일 삭제 중 오류가 발생했습니다.', 'error');
  }
}

// 모바일 파일 목록 표시
function showMobileFileList(applicationId) {
  const files = window.currentUploadedFiles || [];
  
  const modalHTML = `
    <div class="modal fade" id="mobileFileListModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="fas fa-paperclip"></i> 첨부파일 (${files.length}개)
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            ${files.length > 0 ? `
              <div class="list-group">
                ${files.map(file => `
                  <div class="list-group-item">
                    <div class="d-flex justify-content-between align-items-start">
                      <div class="flex-grow-1">
                        <h6 class="mb-1">
                          <i class="fas fa-file-${getFileIcon(file.mimeType)}"></i>
                          ${file.originalName || file.fileName}
                        </h6>
                        <small class="text-muted">
                          ${formatFileSize(file.size)} • ${formatDateTime(file.uploadedAt)}
                        </small>
                      </div>
                      <div class="btn-group-vertical btn-group-sm">
                        <button type="button" class="btn btn-outline-info btn-sm" 
                                onclick="previewFile('${file.filePath}', '${file.originalName}')" 
                                title="미리보기">
                          <i class="fas fa-eye"></i>
                        </button>
                        <button type="button" class="btn btn-outline-primary btn-sm" 
                                onclick="downloadFile('${file.filePath}', '${file.originalName}')" 
                                title="다운로드">
                          <i class="fas fa-download"></i>
                        </button>
                        <button type="button" class="btn btn-outline-danger btn-sm" 
                                onclick="deleteFile(${applicationId}, '${file.filePath}')" 
                                title="삭제">
                          <i class="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            ` : `
              <div class="text-center py-4 text-muted">
                <i class="fas fa-folder-open fa-3x mb-3"></i>
                <p>업로드된 파일이 없습니다.</p>
              </div>
            `}
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-primary" onclick="uploadFile(${applicationId})">
              <i class="fas fa-upload"></i> 파일 업로드
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // 기존 모달 제거
  const existingModal = document.getElementById('mobileFileListModal');
  if (existingModal) {
    existingModal.remove();
  }
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  const modal = new bootstrap.Modal(document.getElementById('mobileFileListModal'));
  modal.show();
  
  // 모달 닫힐 때 DOM에서 제거
  modal._element.addEventListener('hidden.bs.modal', () => {
    modal._element.remove();
  });
}

// 모달 데이터 새로고침
async function refreshModalData(applicationId) {
  try {
    const response = await fetch(`/api/workers-comp/applications/${applicationId}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success) {
      displayApplicationDetail(applicationId, data.data);
    }
    
  } catch (error) {
    console.error('모달 데이터 새로고침 오류:', error);
  }
}

// 토스트 메시지 표시 (기존 토스트 시스템 활용)
function showToast(message, type = 'info') {
  if (window.sjTemplateLoader && window.sjTemplateLoader.showToast) {
    window.sjTemplateLoader.showToast(message, type);
  } else {
    // 백업용 alert
    alert(message);
  }
}
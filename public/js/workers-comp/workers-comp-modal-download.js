// 파일 미리보기 - 새 창에서 열기
function previewFile(filePath, fileName) {
  try {
    let webPath = filePath;
    
    if (filePath.startsWith('../../../uploads/')) {
      webPath = 'http://geunjae.kr' + filePath.replace('../../../uploads/', '/uploads/');
    } else if (filePath.startsWith('/uploads/')) {
      webPath = 'http://geunjae.kr' + filePath;
    } else if (filePath.startsWith('../')) {
      webPath = 'http://geunjae.kr' + filePath.replace(/^(\.\.\/)+/, '/');
    }
    
    // 새 창에서 파일 미리보기
    const previewWindow = window.open(webPath, '_blank', 'width=1000,height=800,scrollbars=yes,resizable=yes');
    
    if (!previewWindow) {
      throw new Error('팝업이 차단되었습니다. 팝업 허용 후 다시 시도해주세요.');
    }
    
   /* if (window.sjTemplateLoader && window.sjTemplateLoader.showToast) {
      window.sjTemplateLoader.showToast(`${fileName} 미리보기를 열었습니다.`, 'info');
    }*/
    
  } catch (err) {
    console.error('파일 미리보기 오류:', err);
    
    if (window.sjTemplateLoader && window.sjTemplateLoader.showToast) {
      window.sjTemplateLoader.showToast('파일 미리보기에 실패했습니다: ' + err.message, 'error');
    } else {
      alert('파일 미리보기에 실패했습니다: ' + err.message);
    }
  }
}

// 파일 다운로드 - 간단한 링크 방식
function downloadFile(filePath, fileName) {
  try {
    let webPath = filePath;
    
    if (filePath.startsWith('../../../uploads/')) {
      webPath = 'http://geunjae.kr' + filePath.replace('../../../uploads/', '/uploads/');
    } else if (filePath.startsWith('/uploads/')) {
      webPath = 'http://geunjae.kr' + filePath;
    } else if (filePath.startsWith('../')) {
      webPath = 'http://geunjae.kr' + filePath.replace(/^(\.\.\/)+/, '/');
    }
    
    // 간단한 링크 다운로드
    const link = document.createElement('a');
    link.href = webPath;
    link.download = fileName || 'download';
    link.style.display = 'none';
    // target="_blank" 제거 - 다운로드에 집중
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
   /* if (window.sjTemplateLoader && window.sjTemplateLoader.showToast) {
      window.sjTemplateLoader.showToast(`${fileName} 다운로드를 시작합니다.`, 'success');
    }*/
    
  } catch (err) {
    console.error('파일 다운로드 오류:', err);
    
    if (window.sjTemplateLoader && window.sjTemplateLoader.showToast) {
      window.sjTemplateLoader.showToast('파일 다운로드에 실패했습니다.', 'error');
    } else {
      alert('파일 다운로드에 실패했습니다.');
    }
  }
}


// 모바일 파일 목록 모달 보기
function showMobileFileList(applicationId) {
  // 현재 모달에서 파일 정보 가져오기
  const uploadedFiles = window.currentUploadedFiles || [];
  
  if (uploadedFiles.length === 0) {
    if (window.sjTemplateLoader && window.sjTemplateLoader.showToast) {
      window.sjTemplateLoader.showToast('업로드된 파일이 없습니다.', 'info');
    }
    return;
  }

  // 모바일 파일 목록 모달 HTML 생성
  const fileListHTML = `
    <div class="modal fade" id="mobileFileListModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h6 class="modal-title">첨부파일 목록</h6>
            <button type="button" class="btn-close-custom" data-bs-dismiss="modal">×</button>
          </div>
          <div class="modal-body">
            ${uploadedFiles.map(file => `
              <div class="d-flex justify-content-between align-items-center p-2 border-bottom">
                <div class="flex-grow-1">
                  <div class="fw-bold text-truncate" style="max-width: 200px;">
                    <i class="fas fa-file-${getFileIcon(file.mimeType)} me-2"></i>
                    ${file.originalName || file.fileName}
                  </div>
                  <small class="text-muted">${formatFileSize(file.size)}</small>
                </div>
                <div class="btn-group-vertical" style="gap: 4px;">
                  <button type="button" class="btn btn-sm btn-outline-info" 
                          onclick="previewFile('${file.filePath}', '${file.originalName}')" 
                          title="미리보기">
                    <i class="fas fa-eye"></i>
                  </button>
                  <button type="button" class="btn btn-sm btn-outline-primary" 
                          onclick="downloadFile('${file.filePath}', '${file.originalName}')" 
                          title="다운로드">
                    <i class="fas fa-download"></i>
                  </button>
                  <button type="button" class="btn btn-sm btn-outline-danger" 
                          onclick="deleteFile(${applicationId}, '${file.filePath}')" 
                          title="삭제">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">닫기</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // 기존 모바일 파일 모달이 있다면 제거
  const existingModal = document.getElementById('mobileFileListModal');
  if (existingModal) {
    existingModal.remove();
  }

  // 새 모달 추가
  document.body.insertAdjacentHTML('beforeend', fileListHTML);

  // 모달 열기
  const modal = new bootstrap.Modal(document.getElementById('mobileFileListModal'));
  modal.show();

  // 모달이 닫히면 DOM에서 제거
  document.getElementById('mobileFileListModal').addEventListener('hidden.bs.modal', function() {
    this.remove();
  });
}



// 메모 저장
async function saveApplicationMemo(applicationId, memo) {
  try {
    const response = await fetch(`/api/workers-comp/applications/${applicationId}/memo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ memo: memo })
    });

    const result = await response.json();

    if (result.success) {
      if (window.sjTemplateLoader && window.sjTemplateLoader.showToast) {
        window.sjTemplateLoader.showToast("메모가 저장되었습니다.", "success");
      }
    } else {
      if (window.sjTemplateLoader && window.sjTemplateLoader.showToast) {
        window.sjTemplateLoader.showToast(result.error || "메모 저장 실패", "error");
      }
    }

  } catch (err) {
    console.error("메모 저장 오류:", err);
    if (window.sjTemplateLoader && window.sjTemplateLoader.showToast) {
      window.sjTemplateLoader.showToast("서버 통신 오류", "error");
    }
  }
}

// 파일 업로드
/*function uploadFile(applicationId) {
  if (window.sjTemplateLoader && window.sjTemplateLoader.showToast) {
    window.sjTemplateLoader.showToast('파일 업로드 기능은 준비 중입니다.', 'info');
  } else {
    alert('파일 업로드 기능은 준비 중입니다.');
  }
}*/



// 파일 삭제
async function deleteFile(applicationId, filePath) {
  if (!confirm('정말로 이 파일을 삭제하시겠습니까?')) {
    return;
  }

  try {
    // 실제 구현에서는 서버 API를 호출해야 함
    if (window.sjTemplateLoader && window.sjTemplateLoader.showToast) {
      window.sjTemplateLoader.showToast('파일 삭제 기능은 준비 중입니다.', 'info');
    } else {
      alert('파일 삭제 기능은 준비 중입니다.');
    }
  } catch (err) {
    console.error('파일 삭제 오류:', err);
    if (window.sjTemplateLoader && window.sjTemplateLoader.showToast) {
      window.sjTemplateLoader.showToast('파일 삭제 중 오류가 발생했습니다.', 'error');
    }
  }
}
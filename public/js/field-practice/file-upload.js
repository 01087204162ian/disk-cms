// 파일 업로드 모달 열기 함수
let currentUploadId = null;
let uploadModalInstance = null;

async function openFileUploadModal(id, schoolName) {
  currentUploadId = id;
  document.getElementById("qNum").value = id;
  
  try {
    const response = await fetch(`/api/field-practice/detail/${id}`);
    const data = await response.json();
    
    if (data.success) {
      const modalElement = document.getElementById("uploadModal");
      if (!uploadModalInstance) {
        uploadModalInstance = new bootstrap.Modal(modalElement);
      }
      uploadModalInstance.show();
      
      document.getElementById("cName").textContent = data.data.school1 || schoolName;
    } else {
      alert(data.error || "데이터 로드 실패");
    }
  } catch (error) {
    console.error('모달 열기 오류:', error);
    alert("데이터 로드 실패");
  }
  
  dynamiFileUpload();
  fileSearch(id);
}

function closeUploadModal() {
  if (uploadModalInstance) {
    uploadModalInstance.hide();
  }
}

document.addEventListener("click", function (event) {
  if (event.target.classList.contains("upload-modal")) {
    event.preventDefault();
    const num = event.target.dataset.num;
    document.getElementById("qNum").value = num;
    
    fetch(`https://silbo.kr/2025/api/question/get_questionnaire_details.php?id=${num}`)
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          const modalElement = document.getElementById("uploadModal");
          if (!uploadModalInstance) {
            uploadModalInstance = new bootstrap.Modal(modalElement);
          }
          uploadModalInstance.show();
          
          document.getElementById("cName").textContent = data.data.school1;
        } else {
          alert(data.error);
        }
      })
      .catch(() => {
        alert("데이터 로드 실패.");
      });
    
    const qnum = document.getElementById("qNum").value;
    dynamiFileUpload();
    fileSearch(qnum);
  }
}); 

function fileSearch(qnum) {
    fetch(`/api/field-practice/files/${qnum}`)
        .then(response => response.json())
        .then(fileData => {
            console.log(fileData);
            let row2 = `<tr>
                        <th>순번</th>
                        <th>파일의종류</th>
                        <th>(설계/증권)번호</th>
                        <th>파일명</th>
                        <th>입력일자</th>
                        <th>기타</th>
                    </tr>`;
            document.getElementById("fileThead").innerHTML = row2;
            
            let rows = "";
            let i = 1;
            const kindMapping = {
                1: '카드전표',
                2: '영수증',
                3: '기타',
                4: '청약서',
                5: '과별인원',
                6: '보험사사업자등록증',
                7: '보험증권',
                8: '청약서날인본',
                9: '질문서날인본',
                10: '과별인원날인본'
            };
            
            fileData.forEach((item) => {
                const filePath = item.description2;
                const fileName = filePath.split('/').pop();
                const kind = kindMapping[item.kind] || '알 수 없음';
                const fullUrl = `https://www.silbo.kr${filePath}`;
                
                rows += `
                    <tr>
                        <td>${i}</td>
                        <td>${kind}</td>
                        <td>${item.bunho}</td>
                        <td><a href="${fullUrl}" download target="_blank" class="file-link">${fileName}</a></td>
                        <td>${item.wdate}</td>
                        <td><button class="btn btn-danger btn-sm dButton" data-num="${item.num}">
						  <i class="fas fa-trash"></i> 삭제
						</button></td>
                    </tr>
                `;
                i++;
            });
            
            document.getElementById("file_list").innerHTML = rows;
            
            document.querySelectorAll(".dButton").forEach(button => {
                button.addEventListener("click", function () {
                    const fileNum = this.getAttribute("data-num");
                    deleteFile(fileNum);
                });
            });
        })
        .catch(error => {
            alert('파일 데이터를 가져오는 데 실패했습니다.');
            console.error('Fetch 호출 실패:', error);
        });
}

function deleteFile(fileNum) {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    fetch(`/api/field-practice/files/${fileNum}`, {
      method: 'DELETE'
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            alert("파일이 삭제되었습니다.");
            fileSearch(document.getElementById("qNum").value);
        } else {
            alert("파일 삭제 실패: " + result.error);
        }
    })
    .catch(error => {
        alert("파일 삭제 요청 실패");
        console.error("파일 삭제 오류:", error);
    });
}

function uploadFile() {
    if (window.isUploading) {
        console.log('업로드가 이미 진행 중입니다.');
        return;
    }
    
    const fileInput = document.getElementById('uploadedFile');
    const fileType = document.getElementById('fileType').value;
    const qNum = document.getElementById('qNum').value;
    const dynamicInput = document.getElementById('dynamicInput') ? document.getElementById('dynamicInput').value : '';
    const userName = window.sjTemplateLoader.user?.name || '관리자';
    
    if (fileInput.files.length === 0) {
        showUploadToast('파일을 선택해주세요.', 'warning');
        return;
    }
    
    if ((fileType === '4' || fileType === '7') && dynamicInput.trim() === '') {
        showUploadToast(fileType === '4' ? '설계번호를 입력해주세요.' : '증권번호를 입력해주세요.', 'warning');
        return;
    }
    
    if (!userName || !window.sjTemplateLoader.user) {
		console.warn('사용자 정보를 가져올 수 없습니다.');
		showUploadToast('로그인 정보를 확인할 수 없습니다. 다시 로그인해주세요.', 'error');
		return;
	}
    
    startUploadProgress();
    window.isUploading = true;
    
    const uploadButton = document.getElementById('uploadBtn');
    if (uploadButton) {
        uploadButton.disabled = true;
        uploadButton.innerHTML = '<span class="spinner"></span> 업로드 중...';
    }
    
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('fileType', fileType);
    formData.append('qNum', qNum);
    formData.append('userName', userName);
    
    if (fileType === '4') {
        formData.append('designNumber', dynamicInput.trim());
    } else if (fileType === '7') {
        formData.append('certificateNumber', dynamicInput.trim());
    }
    
    updateUploadProgress('📤 파일 업로드 준비 중...', 10);
    
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', function(e) {
        if (e.lengthComputable) {
            const percentComplete = Math.round((e.loaded / e.total) * 80) + 10;
            updateUploadProgress(`📤 파일 업로드 중... ${percentComplete}%`, percentComplete);
        }
    });
    
    xhr.addEventListener('load', function() {
        updateUploadProgress('⚙️ 서버에서 처리 중...', 95);
        
        if (xhr.status >= 200 && xhr.status < 300) {
            const result = xhr.responseText;
            
            try {
                const jsonResult = JSON.parse(result);
                if (jsonResult.status === 'success') {
                    updateUploadProgress('✅ 업로드 완료!', 100);
                    
                    setTimeout(() => {
                        showUploadToast('업로드 완료: ' + jsonResult.message, 'success');
                        hideUploadProgress();
                        fileSearch(qNum);
                        
                        fileInput.value = '';
                        if (document.getElementById('dynamicInput')) {
                            document.getElementById('dynamicInput').value = '';
                        }
                        
                        if (fileType === '4' || fileType === '7') {
                            const emailType = fileType === '4' ? '청약서' : '증권';
                            showUploadToast(`${emailType} 발급 안내 이메일이 발송됩니다. 📧`, 'info', 5000);
                        }
                    }, 500);
                } else {
                    updateUploadProgress('❌ 업로드 실패', 100);
                    setTimeout(() => {
                        showUploadToast('업로드 실패: ' + jsonResult.message, 'error');
                        hideUploadProgress();
                    }, 500);
                }
            } catch (e) {
                updateUploadProgress('✅ 업로드 완료!', 100);
                setTimeout(() => {
                    showUploadToast('업로드 완료: ' + result, 'success');
                    hideUploadProgress();
                    fileSearch(qNum);
                }, 500);
            }
        } else {
            updateUploadProgress('❌ 서버 오류', 100);
            setTimeout(() => {
                showUploadToast(`서버 오류 (${xhr.status}): 관리자에게 문의하세요.`, 'error');
                hideUploadProgress();
            }, 500);
        }
    });
    
    xhr.addEventListener('error', function() {
        updateUploadProgress('❌ 네트워크 오류', 100);
        setTimeout(() => {
            showUploadToast('네트워크 오류가 발생했습니다.', 'error');
            hideUploadProgress();
        }, 500);
    });
    
    xhr.addEventListener('timeout', function() {
        updateUploadProgress('❌ 업로드 시간 초과', 100);
        setTimeout(() => {
            showUploadToast('업로드 시간이 초과되었습니다.', 'error');
            hideUploadProgress();
        }, 500);
    });
    
    xhr.timeout = 60000;
    xhr.open('POST', '/api/field-practice/upload-file');
    xhr.send(formData);
    
    xhr.addEventListener('loadend', function() {
        window.isUploading = false;
        
        if (uploadButton) {
            uploadButton.disabled = false;
            uploadButton.innerHTML = '<i class="fas fa-upload"></i> 업로드';
        }
    });
}

function startUploadProgress() {
    if (!document.getElementById('uploadProgressModal')) {
        const modal = document.createElement('div');
        modal.id = 'uploadProgressModal';
        modal.innerHTML = `
            <div class="upload-progress-overlay">
                <div class="upload-progress-modal">
                    <div class="upload-progress-header">
                        <h3>📤 파일 업로드</h3>
                    </div>
                    <div class="upload-progress-body">
                        <div class="upload-progress-bar-container">
                            <div class="upload-progress-bar" id="uploadProgressBar"></div>
                        </div>
                        <div class="upload-progress-text" id="uploadProgressText">업로드 준비 중...</div>
                        <div class="upload-progress-percentage" id="uploadProgressPercentage">0%</div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        if (!document.getElementById('uploadProgressStyles')) {
            const styles = document.createElement('style');
            styles.id = 'uploadProgressStyles';
            styles.textContent = `
                .upload-progress-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.5); display: flex; justify-content: center; align-items: center; z-index: 10000; }
                .upload-progress-modal { background: white; border-radius: 12px; padding: 24px; min-width: 400px; max-width: 90vw; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3); }
                .upload-progress-header h3 { margin: 0 0 20px 0; color: #333; text-align: center; font-size: 18px; }
                .upload-progress-bar-container { width: 100%; height: 8px; background: #e9ecef; border-radius: 4px; overflow: hidden; margin-bottom: 16px; }
                .upload-progress-bar { height: 100%; background: linear-gradient(90deg, #009E25, #00B82F); border-radius: 4px; transition: width 0.3s ease; width: 0%; }
                .upload-progress-text { text-align: center; color: #666; margin-bottom: 8px; font-size: 14px; }
                .upload-progress-percentage { text-align: center; font-weight: bold; font-size: 16px; color: #009E25; }
                .spinner { display: inline-block; width: 12px; height: 12px; border: 2px solid #f3f3f3; border-top: 2px solid #009E25; border-radius: 50%; animation: spin 1s linear infinite; margin-right: 8px; }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `;
            document.head.appendChild(styles);
        }
    }
    
    document.getElementById('uploadProgressModal').style.display = 'block';
}

function updateUploadProgress(text, percentage) {
    const progressBar = document.getElementById('uploadProgressBar');
    const progressText = document.getElementById('uploadProgressText');
    const progressPercentage = document.getElementById('uploadProgressPercentage');
    
    if (progressBar) progressBar.style.width = percentage + '%';
    if (progressText) progressText.textContent = text;
    if (progressPercentage) progressPercentage.textContent = percentage + '%';
}

function hideUploadProgress() {
    const modal = document.getElementById('uploadProgressModal');
    if (modal) modal.style.display = 'none';
}

function showUploadToast(message, type = 'info', duration = 3000) {
    const existingToast = document.querySelector('.upload-toast-message');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = `upload-toast-message upload-toast-${type}`;
    
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    
    toast.innerHTML = `
        <span class="upload-toast-icon">${icons[type] || icons.info}</span>
        <span class="upload-toast-text">${message}</span>
    `;
    
    if (!document.getElementById('uploadToastStyles')) {
        const styles = document.createElement('style');
        styles.id = 'uploadToastStyles';
        styles.textContent = `
            .upload-toast-message { position: fixed; top: 20px; right: 20px; background: white; border-radius: 8px; padding: 12px 16px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2); display: flex; align-items: center; gap: 8px; z-index: 10001; min-width: 300px; max-width: 500px; animation: uploadSlideIn 0.3s ease; border-left: 4px solid; }
            .upload-toast-success { border-left-color: #28a745; }
            .upload-toast-error { border-left-color: #dc3545; }
            .upload-toast-warning { border-left-color: #ffc107; }
            .upload-toast-info { border-left-color: #17a2b8; }
            .upload-toast-icon { font-size: 18px; flex-shrink: 0; }
            .upload-toast-text { flex: 1; font-size: 14px; color: #333; }
            @keyframes uploadSlideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
            @keyframes uploadSlideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
        `;
        document.head.appendChild(styles);
    }
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'uploadSlideOut 0.3s ease';
        setTimeout(() => {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 300);
    }, duration);
}

function dynamiFileUpload() {
    const fileTypes = [
        { value: "4", text: "청약서" },
        { value: "1", text: "카드전표" },
        { value: "2", text: "영수증" },
        { value: "7", text: "보험증권" },
        { value: "5", text: "과별인원현황" },
        { value: "6", text: "보험사사업자등록증" },
        { value: "3", text: "기타" }
    ];

    const fileTypeSelect = document.getElementById("fileType");
    if (!fileTypeSelect) return;

    fileTypeSelect.innerHTML = "";
    fileTypes.forEach(optionData => {
        const option = document.createElement("option");
        option.value = optionData.value;
        option.textContent = optionData.text;
        fileTypeSelect.appendChild(option);
    });

    const dynamicFieldWrapper = document.getElementById("dynamicFieldWrapper");
    const dynamicInput = document.getElementById("dynamicInput");

    function toggleInputField() {
        const fileType = fileTypeSelect.value;

        if (fileType === "4") {
            dynamicFieldWrapper.style.display = "block";
            dynamicInput.placeholder = "설계번호를 입력하세요";
        } else if (fileType === "7") {
            dynamicFieldWrapper.style.display = "block";
            dynamicInput.placeholder = "증권번호를 입력하세요";
        } else {
            dynamicFieldWrapper.style.display = "none";
            dynamicInput.value = "";
        }
    }

    fileTypeSelect.addEventListener("change", toggleInputField);
    toggleInputField();
}

document.addEventListener('DOMContentLoaded', function() {
    const uploadBtn = document.getElementById('uploadBtn');
    if (uploadBtn) {
        uploadBtn.addEventListener('click', uploadFile);
    }
});
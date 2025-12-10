/**
 * workers-comp-status.js - 근재보험 가입신청 상태 변경 관리
 * 상태 변경, 일괄 상태 변경, 상태 이력 관리 기능
 */

// 상태 정의
const STATUS_DEFINITIONS = {
  'pending': {
    text: '검토대기',
    class: 'status-pending',
    color: '#6c757d',
    nextStatuses: ['reviewing', 'approved', 'rejected']
  },
  'reviewing': {
    text: '검토중',
    class: 'status-reviewing',
    color: '#ffc107',
    nextStatuses: ['approved', 'rejected', 'pending']
  },
  'approved': {
    text: '승인',
    class: 'status-approved',
    color: '#28a745',
    nextStatuses: [] // 승인된 것은 변경 불가
  },
  'rejected': {
    text: '반려',
    class: 'status-rejected',
    color: '#dc3545',
    nextStatuses: ['reviewing', 'pending']
  }
};

// 상태 변경 가능 여부 확인
function canChangeStatus(currentStatus, newStatus) {
  const statusDef = STATUS_DEFINITIONS[currentStatus];
  if (!statusDef) return true; // 정의되지 않은 상태는 변경 허용
  
  return statusDef.nextStatuses.includes(newStatus);
}

// 상태별 CSS 클래스 반환
function getStatusClass(status) {
  return STATUS_DEFINITIONS[status]?.class || 'status-other';
}

// 상태별 텍스트 반환
function getStatusText(status) {
  return STATUS_DEFINITIONS[status]?.text || status || '기타';
}

// 상태 옵션 HTML 생성
function getStatusOptions(currentStatus) {
  let options = '';
  
  // 현재 상태는 항상 포함
  const currentDef = STATUS_DEFINITIONS[currentStatus];
  if (currentDef) {
    options += `<option value="${currentStatus}" selected>${currentDef.text}</option>`;
  }
  
  // 변경 가능한 상태들 추가
  if (currentDef && currentDef.nextStatuses.length > 0) {
    currentDef.nextStatuses.forEach(status => {
      const statusDef = STATUS_DEFINITIONS[status];
      if (statusDef) {
        options += `<option value="${status}">${statusDef.text}</option>`;
      }
    });
  } else if (!currentDef) {
    // 정의되지 않은 상태인 경우 모든 상태 허용
    Object.entries(STATUS_DEFINITIONS).forEach(([status, def]) => {
      const selected = status === currentStatus ? 'selected' : '';
      options += `<option value="${status}" ${selected}>${def.text}</option>`;
    });
  }
  
  return options;
}

// 계약유형별 CSS 클래스 반환
function getContractTypeBadgeClass(contractType) {
  switch(contractType) {
    case 'annual':
      return 'bg-primary text-white';
    case 'project':
      return 'bg-success text-white';
    default:
      return 'bg-secondary text-white';
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

// 단일 상태 변경 처리
async function handleSingleStatusChange(applicationId, newStatus, oldStatus) {
  // 변경 가능 여부 확인
  if (!canChangeStatus(oldStatus, newStatus)) {
    const currentText = getStatusText(oldStatus);
    const newText = getStatusText(newStatus);
    
    if (window.sjTemplateLoader && window.sjTemplateLoader.showToast) {
      window.sjTemplateLoader.showToast(
        `"${currentText}" 상태에서는 "${newText}" 상태로 변경할 수 없습니다.`,
        'warning'
      );
    } else {
      alert(`"${currentText}" 상태에서는 "${newText}" 상태로 변경할 수 없습니다.`);
    }
    return false;
  }

  // 확인 메시지
  const statusText = getStatusText(newStatus);
  const confirmMessage = `상태를 "${statusText}"로 변경하시겠습니까?`;
  
  if (newStatus === 'rejected') {
    const reason = prompt(confirmMessage + '\n\n반려 사유를 입력해주세요 (선택사항):');
    if (reason === null) return false; // 취소
    
    return await performStatusChange(applicationId, newStatus, reason);
  } else {
    if (!confirm(confirmMessage)) return false;
    
    return await performStatusChange(applicationId, newStatus);
  }
}

// 실제 상태 변경 수행
async function performStatusChange(applicationId, newStatus, reason = '') {
  try {
    const requestData = {
      status: newStatus
    };
    
    if (reason) {
      requestData.reason = reason;
    }

    const response = await fetch(`/api/workers-comp/applications/${applicationId}/status`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      const statusText = getStatusText(newStatus);
      
      // 성공 메시지
      if (window.sjTemplateLoader && window.sjTemplateLoader.showToast) {
        window.sjTemplateLoader.showToast(
          result.message || `상태가 "${statusText}"로 변경되었습니다.`,
          'success'
        );
      }

      // UI 업데이트
      updateStatusInUI(applicationId, newStatus);
      
      return true;

    } else {
      throw new Error(result.message || '상태 변경에 실패했습니다.');
    }

  } catch (error) {
    console.error('상태 변경 오류:', error);
    
    // 오류 메시지
    if (window.sjTemplateLoader && window.sjTemplateLoader.showToast) {
      window.sjTemplateLoader.showToast(
        '상태 변경 중 오류가 발생했습니다: ' + error.message,
        'error'
      );
    } else {
      alert('상태 변경 중 오류가 발생했습니다: ' + error.message);
    }
    
    return false;
  }
}

// UI에서 상태 업데이트
function updateStatusInUI(applicationId, newStatus) {
  // 모든 해당 신청서의 상태 select 요소 찾기
  const selects = document.querySelectorAll(`select[data-id="${applicationId}"]`);
  
  selects.forEach(select => {
    // 값 업데이트
    select.value = newStatus;
    select.setAttribute('data-original-status', newStatus);
    
    // 옵션 재생성
    select.innerHTML = getStatusOptions(newStatus);
    select.value = newStatus;
    
    // 행/카드 스타일 업데이트
    updateRowAppearance(select, newStatus);
  });
  
  // 상태 배지 업데이트 (모바일 카드)
  const statusBadges = document.querySelectorAll(`.mobile-card [data-app-id="${applicationId}"] .status-badge`);
  statusBadges.forEach(badge => {
    // 기존 상태 클래스 제거
    Object.values(STATUS_DEFINITIONS).forEach(def => {
      badge.classList.remove(def.class);
    });
    
    // 새 상태 클래스와 텍스트 추가
    const statusClass = getStatusClass(newStatus);
    const statusText = getStatusText(newStatus);
    
    badge.classList.add(statusClass);
    badge.textContent = statusText;
  });
}

// 일괄 상태 변경 모달 표시
function showBulkStatusChangeModal() {
  // 체크된 항목 확인
  const checkedItems = getCheckedApplications();
  
  if (checkedItems.length === 0) {
    if (window.sjTemplateLoader && window.sjTemplateLoader.showToast) {
      window.sjTemplateLoader.showToast('변경할 항목을 선택해주세요.', 'warning');
    } else {
      alert('변경할 항목을 선택해주세요.');
    }
    return;
  }

  // 선택된 항목 수 업데이트
  document.getElementById('selectedCount').textContent = checkedItems.length;

  // 상태 옵션 생성 (일괄 변경용)
  const statusSelect = document.getElementById('bulkStatusSelect');
  if (statusSelect) {
    statusSelect.innerHTML = '<option value="">상태를 선택하세요</option>';
    
    Object.entries(STATUS_DEFINITIONS).forEach(([status, def]) => {
      statusSelect.innerHTML += `<option value="${status}">${def.text}</option>`;
    });
  }

  // 모달 표시
  const modal = new bootstrap.Modal(document.getElementById('bulkStatusModal'));
  modal.show();
}

// 체크된 신청서 목록 가져오기
function getCheckedApplications() {
  const checkboxes = document.querySelectorAll('input[type="checkbox"][data-app-id]:checked');
  return Array.from(checkboxes).map(cb => ({
    id: cb.getAttribute('data-app-id'),
    checkbox: cb
  }));
}

// 일괄 상태 변경 실행
async function performBulkStatusChange() {
  const selectedStatus = document.getElementById('bulkStatusSelect').value;
  const memo = document.getElementById('bulkStatusMemo').value.trim();
  
  if (!selectedStatus) {
    if (window.sjTemplateLoader && window.sjTemplateLoader.showToast) {
      window.sjTemplateLoader.showToast('변경할 상태를 선택해주세요.', 'warning');
    }
    return;
  }

  const checkedItems = getCheckedApplications();
  if (checkedItems.length === 0) {
    return;
  }

  const applicationIds = checkedItems.map(item => item.id);
  const statusText = getStatusText(selectedStatus);

  // 최종 확인
  const confirmMessage = `선택된 ${applicationIds.length}건의 신청서를 "${statusText}" 상태로 변경하시겠습니까?`;
  if (!confirm(confirmMessage)) {
    return;
  }

  try {
    // 로딩 상태 표시
    const confirmBtn = document.getElementById('confirmBulkStatus');
    if (confirmBtn) {
      confirmBtn.disabled = true;
      confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 처리중...';
    }

    const response = await fetch('/api/workers-comp/applications/bulk-status', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        application_ids: applicationIds,
        status: selectedStatus,
        memo: memo
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      // 성공 처리
      const successCount = result.data?.updated_count || applicationIds.length;
      
      if (window.sjTemplateLoader && window.sjTemplateLoader.showToast) {
        window.sjTemplateLoader.showToast(
          `${successCount}건의 상태가 "${statusText}"로 변경되었습니다.`,
          'success'
        );
      }

      // 모달 닫기
      const modal = bootstrap.Modal.getInstance(document.getElementById('bulkStatusModal'));
      if (modal) {
        modal.hide();
      }

      // 체크박스 해제
      checkedItems.forEach(item => {
        item.checkbox.checked = false;
      });

      // 데이터 새로고침
      loadApplicationsData();

    } else {
      throw new Error(result.message || '일괄 상태변경에 실패했습니다.');
    }

  } catch (error) {
    console.error('일괄 상태변경 오류:', error);
    
    if (window.sjTemplateLoader && window.sjTemplateLoader.showToast) {
      window.sjTemplateLoader.showToast(
        '일괄 상태변경 중 오류가 발생했습니다: ' + error.message,
        'error'
      );
    } else {
      alert('일괄 상태변경 중 오류가 발생했습니다: ' + error.message);
    }

  } finally {
    // 버튼 복원
    const confirmBtn = document.getElementById('confirmBulkStatus');
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.innerHTML = '<i class="fas fa-check"></i> 상태 변경';
    }
  }
}

// 상태 이력 조회
async function getStatusHistory(applicationId) {
  try {
    const response = await fetch(`/api/workers-comp/applications/${applicationId}/status-history`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success) {
      return result.data || [];
    } else {
      throw new Error(result.message || '상태 이력 조회에 실패했습니다.');
    }

  } catch (error) {
    console.error('상태 이력 조회 오류:', error);
    return [];
  }
}

// 상태 이력 HTML 생성
function createStatusHistoryHTML(history) {
  if (!history || history.length === 0) {
    return '<div class="text-muted text-center py-3">상태 변경 이력이 없습니다.</div>';
  }

  let html = '<div class="status-history">';
  
  history.forEach((item, index) => {
    const isLatest = index === 0;
    const statusText = getStatusText(item.status);
    const statusClass = getStatusClass(item.status);
    
    html += `
      <div class="status-history-item ${isLatest ? 'latest' : ''}">
        <div class="status-history-dot ${statusClass}"></div>
        <div class="status-history-content">
          <div class="status-history-header">
            <span class="status-badge ${statusClass}">${statusText}</span>
            <small class="text-muted">${formatDateTime(item.created_at)}</small>
          </div>
          ${item.reason ? `
            <div class="status-history-reason">
              <small><strong>사유:</strong> ${item.reason}</small>
            </div>
          ` : ''}
          ${item.created_by ? `
            <div class="status-history-user">
              <small class="text-muted">변경자: ${item.created_by}</small>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  return html;
}

// 상태별 통계 조회
async function getStatusStatistics(filters = {}) {
  try {
    const params = new URLSearchParams(filters);
    
    const response = await fetch(`/api/workers-comp/statistics/status?${params}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success) {
      return result.data || {};
    } else {
      throw new Error(result.message || '통계 조회에 실패했습니다.');
    }

  } catch (error) {
    console.error('상태별 통계 조회 오류:', error);
    return {};
  }
}

// 상태별 통계 차트 생성 (Chart.js 사용)
function createStatusChart(statistics, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // 기존 차트 제거
  if (container.chart) {
    container.chart.destroy();
  }

  // Canvas 요소 생성
  container.innerHTML = '<canvas id="statusChart"></canvas>';
  const canvas = document.getElementById('statusChart');
  const ctx = canvas.getContext('2d');

  // 데이터 준비
  const labels = [];
  const data = [];
  const backgroundColor = [];

  Object.entries(STATUS_DEFINITIONS).forEach(([status, def]) => {
    if (statistics[status] !== undefined) {
      labels.push(def.text);
      data.push(statistics[status]);
      backgroundColor.push(def.color);
    }
  });

  // Chart.js 차트 생성
  container.chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: backgroundColor,
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            usePointStyle: true,
            font: {
              size: 12
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.parsed || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              return `${label}: ${value}건 (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

// 상태 필터 자동 업데이트
function updateStatusFilterCounts() {
  // 현재 표시된 데이터에서 상태별 개수 계산
  const statusCounts = {};
  
  // 테이블에서 상태 개수 계산
  document.querySelectorAll('#applications_table_body select[data-id]').forEach(select => {
    const status = select.getAttribute('data-original-status');
    if (status) {
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    }
  });

  // 상태 필터 옵션에 개수 표시
  const statusFilter = document.getElementById('statusFilter');
  if (statusFilter) {
    const options = statusFilter.querySelectorAll('option');
    options.forEach(option => {
      const status = option.value;
      if (status && statusCounts[status]) {
        const statusText = getStatusText(status);
        option.textContent = `${statusText} (${statusCounts[status]})`;
      }
    });
  }
}

// 상태 변경 권한 확인
function hasStatusChangePermission(applicationId, currentStatus, newStatus) {
  // TODO: 사용자 권한에 따른 상태 변경 권한 확인
  // 현재는 모든 변경을 허용하지만, 실제 환경에서는 권한 체크 필요
  
  // 예시: 승인된 상태는 관리자만 변경 가능
  if (currentStatus === 'approved' && !isAdmin()) {
    return false;
  }
  
  return canChangeStatus(currentStatus, newStatus);
}

// 관리자 권한 확인 (임시)
function isAdmin() {
  // TODO: 실제 사용자 권한 확인 로직 구현
  return true; // 임시로 모든 사용자를 관리자로 처리
}

// 상태 변경 알림 설정
function setupStatusChangeNotifications() {
  // TODO: 실시간 알림 설정 (WebSocket 또는 Server-Sent Events)
  console.log('상태 변경 알림 시스템 초기화됨');
}

// 상태별 색상 테마 적용
function applyStatusColorTheme() {
  // CSS 변수로 상태별 색상 정의
  const root = document.documentElement;
  
  Object.entries(STATUS_DEFINITIONS).forEach(([status, def]) => {
    root.style.setProperty(`--status-${status}-color`, def.color);
  });
}

// 모듈 초기화
document.addEventListener('DOMContentLoaded', function() {
  // 상태별 색상 테마 적용
  applyStatusColorTheme();
  
  // 상태 변경 알림 설정
  setupStatusChangeNotifications();
  
  // 일괄 상태변경 버튼 이벤트
  const bulkStatusBtn = document.getElementById('bulkStatusUpdate');
  if (bulkStatusBtn) {
    bulkStatusBtn.addEventListener('click', showBulkStatusChangeModal);
  }
  
  // 일괄 상태변경 확인 버튼 이벤트
  const confirmBulkBtn = document.getElementById('confirmBulkStatus');
  if (confirmBulkBtn) {
    confirmBulkBtn.addEventListener('click', performBulkStatusChange);
  }
});

// 유틸리티 함수: 날짜시간 포맷팅
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
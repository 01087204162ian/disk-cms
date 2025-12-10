/**
 * API 관리 모달 관련 함수들
 * pharmacy_key.js 파일에 추가할 함수들
 * 라우트 경로: /api/pharmacy-admin 으로 수정됨
 */

/**
 * API 관리 모달 열기 (메인 함수)
 */
async function openApiManagerModal() {
  // 모달 제목 설정
  const titleEl = document.getElementById('modalTitle');
  if (titleEl) {
    titleEl.innerHTML = `
      <i class="fas fa-key text-primary me-2"></i>
      API 키 관리 시스템
    `;
  }

  // 로딩 UI 먼저 표시
  const modalBody = document.getElementById('modalBody');
  if (modalBody) {
    modalBody.innerHTML = `
      <div class="text-center py-4">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">데이터를 불러오는 중...</span>
        </div>
        <div class="mt-2">API 키 정보를 불러오는 중...</div>
      </div>
    `;
  }

  // 모달 열기
  const modal = new bootstrap.Modal(document.getElementById('dynamicModal'));
  modal.show();

  try {
    // API 키 목록 조회
    const apiData = await fetchApiKeyList();
    
    if (apiData && apiData.success) {
      // API 관리 모달 UI 표시
      displayApiManagerModal(apiData.data);
    } else {
      throw new Error(apiData?.message || 'API 키 데이터를 불러오는데 실패했습니다.');
    }

  } catch (error) {
    console.error('API 관리 모달 로드 오류:', error);
    
    // 에러 UI 표시
    if (modalBody) {
      modalBody.innerHTML = `
        <div class="alert alert-danger">
          <i class="fas fa-exclamation-circle me-2"></i>
          API 키 정보를 불러오는 중 오류가 발생했습니다: ${error.message}
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
 * API 키 목록 조회 API 호출
 * @returns {Promise<Object>} API 키 목록 데이터
 */
async function fetchApiKeyList() {
  try {
    const response = await fetch('/api/pharmacy-admin/api-keys', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();
    console.log('[fetchApiKeyList] API 응답:', result);

    return result;

  } catch (error) {
    console.error('[fetchApiKeyList] 오류:', error);
    throw error;
  }
}

/**
 * API 관리 모달 UI 표시
 * @param {Array} apiKeys API 키 목록 데이터
 */
function displayApiManagerModal(apiKeys = []) {
  const modalBody = document.getElementById('modalBody');
  if (!modalBody) return;

  // 안전한 값 처리 함수
  const val = (v, fb = '') => (v === null || v === undefined) ? fb : String(v);
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('ko-KR');
    } catch {
      return dateStr;
    }
  };

  modalBody.innerHTML = `
    <!-- 상단 통계 정보 -->
    <div class="row mb-4">
      <div class="col-md-3 col-6 mb-2">
        <div class="bg-primary text-white rounded p-3 text-center">
          <div class="h4 mb-1">${apiKeys.length}</div>
          <small>총 거래처</small>
        </div>
      </div>
      <div class="col-md-3 col-6 mb-2">
        <div class="bg-success text-white rounded p-3 text-center">
          <div class="h4 mb-1">${apiKeys.filter(k => k.api_enabled).length}</div>
          <small>API 활성화</small>
        </div>
      </div>
      <div class="col-md-3 col-6 mb-2">
        <div class="bg-warning text-white rounded p-3 text-center">
          <div class="h4 mb-1">${apiKeys.filter(k => !k.api_key).length}</div>
          <small>미발급</small>
        </div>
      </div>
      <div class="col-md-3 col-6 mb-2">
        <div class="bg-info text-white rounded p-3 text-center">
          <div class="h4 mb-1">${apiKeys.filter(k => k.last_api_call).length}</div>
          <small>사용 중</small>
        </div>
      </div>
    </div>

    <!-- 데스크톱 테이블 (768px 이상) -->
    <div class="desktop-api-modal d-none d-md-block">
      <div class="table-responsive">
        <table class="table table-bordered table-hover table-sm">
          <thead class="table-light">
            <tr>
              <th class="text-center" style="width: 50px;">#</th>
              <th>거래처명</th>
              <th style="width: 100px;">상태</th>
              <th style="width: 150px;">API 키</th>
              <th style="width: 120px;">마지막 호출</th>
              <th style="width: 120px;">만료일</th>
              <th class="text-center" style="width: 150px;">관리</th>
            </tr>
          </thead>
          <tbody>
            ${apiKeys.map((key, index) => `
              <tr>
                <td class="text-center">${index + 1}</td>
                <td>
                  <strong>${val(key.name)}</strong>
                  <br><small class="text-muted">${val(key.mem_id)}</small>
                </td>
                <td class="text-center">
                  ${key.api_enabled ? 
                    '<span class="badge bg-success">활성화</span>' : 
                    '<span class="badge bg-secondary">비활성화</span>'
                  }
                </td>
                <td>
                  ${key.api_key ? 
                    `<code class="small">${key.api_key.substring(0, 12)}...</code>` : 
                    '<span class="text-muted">미발급</span>'
                  }
                </td>
                <td class="text-center">
                  <small>${key.last_api_call ? formatDate(key.last_api_call) : '-'}</small>
                </td>
                <td class="text-center">
                  <small>${key.api_expires ? formatDate(key.api_expires) : '-'}</small>
                </td>
                <td class="text-center">
                  <div class="btn-group btn-group-sm" role="group">
                    ${!key.api_key ? 
                      `<button type="button" class="btn btn-primary btn-sm" 
                              onclick="generateApiKey(${key.num})" title="키 생성">
                        <i class="fas fa-plus"></i>
                      </button>` :
                      `<button type="button" class="btn btn-warning btn-sm" 
                              onclick="viewApiKey(${key.num})" title="키 보기">
                        <i class="fas fa-eye"></i>
                      </button>`
                    }
                    ${key.api_key ? 
                      `<button type="button" class="btn btn-danger btn-sm" 
                              onclick="revokeApiKey(${key.num})" title="키 삭제">
                        <i class="fas fa-trash"></i>
                      </button>
                      <button type="button" class="btn btn-secondary btn-sm" 
                              onclick="toggleApiKey(${key.num})" title="활성화/비활성화">
                        <i class="fas fa-power-off"></i>
                      </button>` : ''
                    }
                    <button type="button" class="btn btn-info btn-sm" 
                            onclick="viewApiLogs(${key.num})" title="로그 보기">
                      <i class="fas fa-list"></i>
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- 모바일 카드 (768px 미만) -->
    <div class="mobile-api-modal d-block d-md-none">
      <div class="mobile-api-container">
        ${apiKeys.map((key, index) => `
          <div class="card mb-3">
            <div class="card-header d-flex justify-content-between align-items-center">
              <span class="badge bg-primary">${index + 1}</span>
              <strong>${val(key.name)}</strong>
              ${key.api_enabled ? 
                '<span class="badge bg-success">활성화</span>' : 
                '<span class="badge bg-secondary">비활성화</span>'
              }
            </div>
            <div class="card-body">
              <div class="row mb-2">
                <div class="col-4"><strong>아이디:</strong></div>
                <div class="col-8">${val(key.mem_id)}</div>
              </div>
              <div class="row mb-2">
                <div class="col-4"><strong>API 키:</strong></div>
                <div class="col-8">
                  ${key.api_key ? 
                    `<code class="small">${key.api_key.substring(0, 12)}...</code>` : 
                    '<span class="text-muted">미발급</span>'
                  }
                </div>
              </div>
              <div class="row mb-2">
                <div class="col-4"><strong>마지막 호출:</strong></div>
                <div class="col-8">${key.last_api_call ? formatDate(key.last_api_call) : '-'}</div>
              </div>
              <div class="d-flex gap-2 mt-3">
                ${!key.api_key ? 
                  `<button type="button" class="btn btn-primary btn-sm flex-fill" 
                          onclick="generateApiKey(${key.num})">
                    <i class="fas fa-plus me-1"></i>키 생성
                  </button>` :
                  `<button type="button" class="btn btn-warning btn-sm flex-fill" 
                          onclick="viewApiKey(${key.num})">
                    <i class="fas fa-eye me-1"></i>보기
                  </button>`
                }
                ${key.api_key ? 
                  `<button type="button" class="btn btn-danger btn-sm flex-fill" 
                          onclick="revokeApiKey(${key.num})">
                    <i class="fas fa-trash me-1"></i>삭제
                  </button>
                  <button type="button" class="btn btn-secondary btn-sm flex-fill" 
                          onclick="toggleApiKey(${key.num})">
                    <i class="fas fa-power-off me-1"></i>토글
                  </button>` : ''
                }
                <button type="button" class="btn btn-info btn-sm flex-fill" 
                        onclick="viewApiLogs(${key.num})">
                  <i class="fas fa-list me-1"></i>로그
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  // 푸터 설정
  const modalFoot = document.getElementById('modalFoot');
  if (modalFoot) {
    modalFoot.innerHTML = `
      <div class="d-flex justify-content-between align-items-center w-100">
        <small class="text-muted">
          <i class="fas fa-info-circle me-1"></i>
          API 키는 안전하게 보관하시고, 필요시 재발급하세요.
        </small>
        <div>
          <button type="button" class="btn btn-outline-info btn-sm me-2" 
                  onclick="viewApiStats()">
            <i class="fas fa-chart-bar me-1"></i>통계
          </button>
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
            <i class="fas fa-times me-1"></i>닫기
          </button>
        </div>
      </div>
    `;
  }
}

/**
 * API 키 생성
 * @param {number} userId 사용자 ID
 */
async function generateApiKey(userId) {
  if (!confirm('새로운 API 키를 생성하시겠습니까?')) {
    return;
  }

  try {
    const response = await fetch('/api/pharmacy-admin/api-keys/generate', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ user_id: userId })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      // 성공 시 키 정보 표시
      alert(`API 키가 생성되었습니다!\n\nAPI Key: ${result.data.api_key}\nAPI Secret: ${result.data.api_secret}\n\n※ API Secret은 다시 확인할 수 없으니 안전한 곳에 보관하세요.`);
      
      // 모달 새로고침
      openApiManagerModal();
    } else {
      throw new Error(result.message || 'API 키 생성에 실패했습니다.');
    }

  } catch (error) {
    console.error('API 키 생성 오류:', error);
    alert('API 키 생성 중 오류가 발생했습니다: ' + error.message);
  }
}

/**
 * API 키 조회 (보안상 일부만 표시)
 * @param {number} userId 사용자 ID
 */
async function viewApiKey(userId) {
  try {
    const response = await fetch(`/api/pharmacy-admin/api-keys/${userId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      const data = result.data;
      alert(`API 키 정보\n\nAPI Key: ${data.api_key}\n생성일: ${data.created_date}\n만료일: ${data.expires_date || '없음'}\n상태: ${data.api_enabled ? '활성화' : '비활성화'}\n\n※ API Secret은 보안상 표시되지 않습니다.`);
    } else {
      throw new Error(result.message || 'API 키 조회에 실패했습니다.');
    }

  } catch (error) {
    console.error('API 키 조회 오류:', error);
    alert('API 키 조회 중 오류가 발생했습니다: ' + error.message);
  }
}

/**
 * API 키 폐기
 * @param {number} userId 사용자 ID
 */
async function revokeApiKey(userId) {
  if (!confirm('API 키를 삭제하시겠습니까?\n\n삭제된 키는 복구할 수 없으며, 해당 키를 사용하는 모든 API 호출이 차단됩니다.')) {
    return;
  }

  try {
    const response = await fetch(`/api/pharmacy-admin/api-keys/${userId}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json'
      },
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      alert('API 키가 삭제되었습니다.');
      // 모달 새로고침
      openApiManagerModal();
    } else {
      throw new Error(result.message || 'API 키 삭제에 실패했습니다.');
    }

  } catch (error) {
    console.error('API 키 삭제 오류:', error);
    alert('API 키 삭제 중 오류가 발생했습니다: ' + error.message);
  }
}

/**
 * API 키 활성화/비활성화 토글
 * @param {number} userId 사용자 ID
 */
async function toggleApiKey(userId) {
  if (!confirm('API 키 상태를 변경하시겠습니까?')) {
    return;
  }

  try {
    const response = await fetch(`/api/pharmacy-admin/api-keys/${userId}/toggle`, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      alert(result.message || 'API 키 상태가 변경되었습니다.');
      // 모달 새로고침
      openApiManagerModal();
    } else {
      throw new Error(result.message || 'API 키 상태 변경에 실패했습니다.');
    }

  } catch (error) {
    console.error('API 키 상태 변경 오류:', error);
    alert('API 키 상태 변경 중 오류가 발생했습니다: ' + error.message);
  }
}

/**
 * API 호출 로그 조회
 * @param {number} userId 사용자 ID
 */
async function viewApiLogs(userId) {
  try {
    const response = await fetch(`/api/pharmacy-admin/api-logs/${userId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      const logs = result.data || [];
      if (logs.length === 0) {
        alert('API 호출 기록이 없습니다.');
        return;
      }

      // 최근 10개 로그만 표시
      const recentLogs = logs.slice(0, 10);
      const logText = recentLogs.map(log => 
        `${log.request_time} | ${log.endpoint} | ${log.response_code}`
      ).join('\n');

      alert(`최근 API 호출 기록 (최대 10개)\n\n${logText}\n\n※ 전체 로그는 시스템 관리자에게 문의하세요.`);
    } else {
      throw new Error(result.message || 'API 로그 조회에 실패했습니다.');
    }

  } catch (error) {
    console.error('API 로그 조회 오류:', error);
    alert('API 로그 조회 중 오류가 발생했습니다: ' + error.message);
  }
}

/**
 * API 사용 통계 조회
 */
async function viewApiStats() {
  try {
    const response = await fetch('/api/pharmacy-admin/api-stats', {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      const stats = result.data || {};
      const statsText = `API 사용 통계\n\n총 호출 수: ${stats.total_calls || 0}\n성공 호출: ${stats.success_calls || 0}\n에러 호출: ${stats.error_calls || 0}\n평균 응답시간: ${stats.avg_response_time || 0}ms`;
      
      alert(statsText);
    } else {
      throw new Error(result.message || 'API 통계 조회에 실패했습니다.');
    }

  } catch (error) {
    console.error('API 통계 조회 오류:', error);
    alert('API 통계 조회 중 오류가 발생했습니다: ' + error.message);
  }
}
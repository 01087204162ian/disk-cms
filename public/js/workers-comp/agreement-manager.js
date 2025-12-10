/**
 * agreement-manager.js - 약관동의 관리 전용 모듈
 * 약관동의 상태 변경, 이력 조회, UI 업데이트 등을 담당
 */

// 중복 선언 방지
if (typeof window.AgreementManager === 'undefined') {

  class AgreementManager {
    constructor(applicationId) {
      this.applicationId = applicationId;
      this.agreementMap = {
        'agree_collect_edit': 'collect',
        'agree_collect_mobile': 'collect',
        'agree_third_edit': 'third', 
        'agree_third_mobile': 'third',
        'agree_mkt_edit': 'mkt',
        'agree_mkt_mobile': 'mkt'
      };
    }

    // 약관동의 이벤트 리스너 바인딩
    bindEventListeners() {
      const agreeCheckboxes = ['agree_collect_edit', 'agree_third_edit', 'agree_mkt_edit', 'agree_collect_mobile', 'agree_third_mobile', 'agree_mkt_mobile'];

      agreeCheckboxes.forEach(id => {
        const checkbox = document.getElementById(id);
        if (checkbox) {
          checkbox.addEventListener('change', (e) => {
            this.updateAgreement(id, e.target.checked);
          });
        }
      });
    }

    // 약관동의 상태 변경
    async updateAgreement(agreementType, isChecked) {
      try {
        const response = await fetch(`/api/workers-comp/applications/${this.applicationId}/agreement`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            agreement_type: this.agreementMap[agreementType],
            agreed: isChecked ? 'Y' : 'N',
            changed_at: new Date().toISOString(),
            changed_by: window.sjTemplateLoader?.user?.name || 'admin'
          })
        });

        const result = await response.json();
        
        if (result.success) {
          // 배지 업데이트
          this.updateAgreementBadge(agreementType, isChecked);
          
          // 반대편(데스크톱↔모바일) 체크박스도 동기화
          const otherCheckboxId = agreementType.includes('mobile') ? 
            agreementType.replace('_mobile', '_edit') : 
            agreementType.replace('_edit', '_mobile');
          
          const otherCheckbox = document.getElementById(otherCheckboxId);
          if (otherCheckbox) {
            otherCheckbox.checked = isChecked;
          }
        }
      } catch (err) {
        console.error('약관동의 업데이트 오류:', err);
      }
    }

    // 배지 업데이트 함수
    updateAgreementBadge(checkboxId, isChecked) {
      const agreementType = checkboxId.includes('collect') ? 'collect' : 
                           checkboxId.includes('third') ? 'third' : 'mkt';
      
      const selectors = [
        `#agree_${agreementType}_edit`,
        `#agree_${agreementType}_mobile`
      ];
      
      selectors.forEach(selector => {
        const checkbox = document.querySelector(selector);
        if (checkbox) {
          const badge = checkbox.closest('.form-check, .mobile-field-group').querySelector('.badge');
          if (badge) {
            if (isChecked) {
              badge.className = agreementType === 'mkt' ? 'badge bg-success' : 'badge bg-success';
              badge.textContent = '동의';
            } else {
              badge.className = agreementType === 'mkt' ? 'badge bg-secondary' : 'badge bg-danger';
              badge.textContent = '비동의';
            }
          }
        }
      });
    }

    // 약관동의 변경이력 조회
    async showAgreementHistory() {
      try {
        const response = await fetch(`/api/workers-comp/applications/${this.applicationId}/agreement-history`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
          this.displayAgreementHistoryModal(result.data || []);
        } else {
          throw new Error(result.error || '이력 조회에 실패했습니다.');
        }

      } catch (error) {
        console.error('이력 조회 오류:', error);
        if (window.sjTemplateLoader && window.sjTemplateLoader.showToast) {
          window.sjTemplateLoader.showToast('이력 조회 중 오류가 발생했습니다: ' + error.message, 'error');
        } else {
          alert('이력 조회 중 오류가 발생했습니다: ' + error.message);
        }
      }
    }

    // 약관동의 이력 모달 표시
    displayAgreementHistoryModal(historyData) {
      const modal = new bootstrap.Modal(document.getElementById('agreementHistoryModal'));
      
      let html = '';
      
      if (historyData.length === 0) {
        html = `
          <div class="text-center py-4 text-muted">
            <i class="fas fa-inbox fa-3x mb-3"></i>
            <p>변경 이력이 없습니다.</p>
          </div>
        `;
      } else {
        html = `
          <div class="table-responsive">
            <table class="table table-sm table-hover">
              <thead>
                <tr>
                  <th>변경일시</th>
                  <th>약관종류</th>
                  <th>변경내용</th>
                  <th>변경자</th>
                </tr>
              </thead>
              <tbody>
                ${historyData.map(item => `
                  <tr>
                    <td>${this.formatDateTime(item.changed_at)}</td>
                    <td>${this.getAgreementTypeName(item.agreement_type)}</td>
                    <td>
                      <span class="badge bg-secondary">${item.previous_value === 'Y' ? '동의' : '비동의'}</span>
                      <i class="fas fa-arrow-right mx-1"></i>
                      <span class="badge ${item.new_value === 'Y' ? 'bg-success' : 'bg-danger'}">${item.new_value === 'Y' ? '동의' : '비동의'}</span>
                    </td>
                    <td>${item.changed_by || '시스템'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      }
      
      document.getElementById('agreementHistoryBody').innerHTML = html;
      modal.show();
    }

    // 약관 타입 이름 변환
    getAgreementTypeName(type) {
      const names = {
        'collect': '개인정보 수집·이용',
        'third': '개인정보 제3자 제공',
        'mkt': '마케팅 활용'
      };
      return names[type] || type;
    }

    // 날짜시간 포맷팅
    formatDateTime(dateString) {
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
  }

  // window 객체에 등록
  window.AgreementManager = AgreementManager;
}

// 전역 함수 등록 (중복 방지)
if (typeof window.showAgreementHistory === 'undefined') {
  window.showAgreementHistory = function(applicationId) {
    const agreementManager = new window.AgreementManager(applicationId);
    agreementManager.showAgreementHistory();
  };
}
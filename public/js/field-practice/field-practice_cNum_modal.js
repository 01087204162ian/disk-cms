// ========================================
// cNum 비교 모달 관련 함수
// ========================================

/**
 * 여러 cNum을 비교하는 모달 표시
 * @param {Array} cNums - 비교할 cNum 배열 [2431, 2203, 2160]
 */
async function compareCNums(cNums) {
  console.log('비교할 cNum 목록:', cNums);
  
  try {
    // 로딩 표시
    showLoading(true);
    
    // API 요청: 여러 cNum의 상세 정보 가져오기
    const cNumsParam = cNums.join(',');
    const response = await fetch(`/api/field-practice/cnum-compare?cNums=${cNumsParam}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error?.message || '데이터를 불러오는데 실패했습니다');
    }
    
    console.log('비교 데이터:', result.data);
    
    // 모달 표시
    displayCompareModal(result.data);
    
  } catch (error) {
    console.error('cNum 비교 오류:', error);
    
    // 에러 메시지 표시
    if (window.sjTemplateLoader && window.sjTemplateLoader.showToast) {
      window.sjTemplateLoader.showToast(
        'cNum 비교 데이터를 불러오는데 실패했습니다: ' + error.message,
        'error'
      );
    } else {
      alert('cNum 비교 데이터를 불러오는데 실패했습니다: ' + error.message);
    }
    
  } finally {
    showLoading(false);
  }
}

/**
 * cNum 비교 모달 표시
 * @param {Array} compareData - 비교할 데이터 배열
 */
function displayCompareModal(compareData) {
  // 모달 제목 설정
  const modalTitle = document.getElementById('modalTitle');
  if (!modalTitle) {
    console.error('모달 제목 요소를 찾을 수 없습니다');
    return;
  }
  
  // 첫 번째 학교명 사용 (모두 같은 학교)
  const schoolName = compareData[0]?.school1 || '학교명 없음';
  
  modalTitle.innerHTML = `
    <i class="fas fa-balance-scale"></i> 
    ${schoolName} - 부서별 비교
  `;
  
  // 모달 내용 설정
  const modalBody = document.getElementById('modalBody');
  if (!modalBody) {
    console.error('모달 본문 요소를 찾을 수 없습니다');
    return;
  }
  
  // 비교 테이블 HTML 생성
  modalBody.innerHTML = createCompareTableHTML(compareData);
  
  // 모달 푸터 설정
  const modalFoot = document.getElementById('modalFoot');
  /*if (modalFoot) {
    modalFoot.innerHTML = `
      <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
        <i class="fas fa-times"></i> 닫기
      </button>
    `;
  }*/
  
  // 모달 표시
  const modal = new bootstrap.Modal(document.getElementById('dynamicModal'));
  modal.show();
  
  console.log('비교 모달 표시 완료');
}

/**
 * 비교 테이블 HTML 생성
 * @param {Array} compareData - 비교할 데이터 배열
 * @returns {string} HTML 문자열
 */
function createCompareTableHTML(compareData) {
  // 비교할 부서 개수
  const count = compareData.length;
  
  // 각 열의 폭을 동일하게 (전체 너비에서 아이디 열 제외하고 나누기)
  const colWidth = Math.floor((100 - 20) / count); // 아이디 열 20%, 나머지를 균등 분배
  
  // 테이블 헤더
  let html = `
    <div class="table-responsive">
      <table class="table table-bordered table-hover">
        <thead class="table-light">
          <tr>
            <th style="width: 20%;">아이디</th>
  `;
  
  // 각 cNum별 헤더 (동일한 너비)
  compareData.forEach(data => {
    html += `
      <th class="text-center" style="width: ${colWidth}%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
        <strong>${data.mem_id || '-'}</strong><small style="color: #999;">(cNum: ${data.cNum})</small>
      </th>
    `;
  });
  
  html += `
          </tr>
        </thead>
        <tbody>
  `;
  

  
  // 2. 이메일
  html += '<tr><td><i class="fas fa-envelope"></i> 이메일</td>';
  compareData.forEach(data => {
    html += `<td class="text-center" style="font-size: 13px;">${data.school5 || '-'}</td>`;
  });
  html += '</tr>';
  
  // 3. 연락처
  html += '<tr><td><i class="fas fa-phone"></i> 연락처</td>';
  compareData.forEach(data => {
    html += `<td class="text-center">${data.school4 || '-'}</td>`;
  });
  html += '</tr>';
  
  // 4. 주소
  html += '<tr><td><i class="fas fa-map-marker-alt"></i> 주소</td>';
  compareData.forEach(data => {
    html += `<td style="font-size: 12px;">${data.school3 || '-'}</td>`;
  });
  html += '</tr>';
  
  // 5. 최초 등록일
  html += '<tr><td><i class="fas fa-calendar-plus"></i> 최초 등록일</td>';
  compareData.forEach(data => {
    html += `<td class="text-center">${formatDate(data.first_wdate)}</td>`;
  });
  html += '</tr>';
  
  // 6. 마지막 등록일
  html += '<tr><td><i class="fas fa-calendar-check"></i> 마지막 등록일</td>';
  compareData.forEach(data => {
    html += `<td class="text-center">${formatDate(data.last_wdate)}</td>`;
  });
  html += '</tr>';
  
  // 구분선
  html += '<tr style="height: 10px; background: #f8f9fa;"><td colspan="' + (count + 1) + '"></td></tr>';
  
  // 7. 총 신청 건수
  html += '<tr style="background: #fff9e6;"><td><i class="fas fa-list"></i> <strong>총 신청 건수</strong></td>';
  compareData.forEach(data => {
    html += `<td class="text-center"><strong style="font-size: 18px; color: #667eea;">${data.total_count}건</strong></td>`;
  });
  html += '</tr>';
  
  // 8. 총 학생수
  html += '<tr><td><i class="fas fa-users"></i> 총 학생수</td>';
  compareData.forEach(data => {
    html += `<td class="text-center"><strong style="color: #28a745;">${data.total_students.toLocaleString()}명</strong></td>`;
  });
  html += '</tr>';
  
  // 9. 총 보험료
  html += '<tr><td><i class="fas fa-won-sign"></i> 총 보험료</td>';
  compareData.forEach(data => {
    html += `<td class="text-center"><strong style="color: #dc3545;">${formatCurrency(data.total_premium)}원</strong></td>`;
  });
  html += '</tr>';
  
  html += `
        </tbody>
      </table>
    </div>
  `;
  
  return html;
}
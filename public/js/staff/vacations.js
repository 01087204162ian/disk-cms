 // 반차 신청 모달 열기
    function openHalfDayModal() {
      const modal = new bootstrap.Modal(document.getElementById('halfDayModal'));
      modal.show();
    }
    
    // 반차 신청 처리
    function submitHalfDay() {
      const form = document.getElementById('halfDayForm');
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      
      const data = {
        half_day_date: document.getElementById('halfDayDate').value,
        half_day_type: document.getElementById('halfDayType').value,
        is_emergency: document.getElementById('isEmergency').value === 'true',
        reason: document.getElementById('halfDayReason').value
      };
      
      // API 호출 (추후 구현)
      console.log('반차 신청 데이터:', data);
      
      // 모달 닫기
      bootstrap.Modal.getInstance(document.getElementById('halfDayModal')).hide();
      
      // 성공 알림
      alert('반차 신청이 완료되었습니다.');
    }
    
    // 시프트 안내 표시
    function showScheduleInfo() {
      alert(`
🗓️ 나의 시프트 정보

📅 현재 (1월): 금요일 휴무
📅 다음달 (2월): 월요일 휴무  
📅 3월: 화요일 휴무
📅 4월: 수요일 휴무
📅 5월: 목요일 휴무

⏰ 주 32시간 근무 원칙
🔄 매월 첫 번째 월요일부터 새 패턴 적용
      `);
    }
    
    // 캘린더 네비게이션 (기본 구현)
    document.getElementById('prevMonth').addEventListener('click', () => {
      console.log('이전 달로 이동');
    });
    
    document.getElementById('nextMonth').addEventListener('click', () => {
      console.log('다음 달로 이동');
    });
    
    // 페이지 로드 시 초기화
    document.addEventListener('DOMContentLoaded', function() {
      console.log('4일제 스케줄 페이지가 로드되었습니다.');
      
      // 오늘 날짜를 반차 신청의 기본값으로 설정
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const tomorrowString = tomorrow.toISOString().split('T')[0];
      document.getElementById('halfDayDate').value = tomorrowString;
    });
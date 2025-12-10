 // 현재 년, 월을 저장하는 변수
// 현재 년, 월을 저장하는 변수 (동적으로 설정)
const now = new Date();
let currentYear = now.getFullYear();
let currentMonth = now.getMonth() + 1; // getMonth()는 0부터 시작해서 +1 해줌


// 사용자 4일제 설정 상태 확인 (서버 통신)
async function checkUserScheduleStatus() {
  try {
    const response = await fetch('/api/staff/work-schedules/my-status', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('서버 응답:', data);
    
    if (response.ok && data.success) {
      if (data.data && data.data.initial_choice_completed) {
        // 이미 선택 완료 → 개인 스케줄 표시
        loadPersonalSchedule(data.data);
      } else {
        // 아직 미선택 → 초기 선택 안내
        showInitialChoiceNeeded();
      }
    } else {
      console.error('API 응답 오류:', data.message);
      // API 오류 시 기본 동작
      loadPersonalSchedule();
    }
  } catch (error) {
    console.error('서버 통신 실패:', error);
    // 서버 오류 시 기본 동작
    loadPersonalSchedule();
  }
}

// 초기 선택 필요 안내
// 초기 선택 필요 안내 (수정)
function showInitialChoiceNeeded() {
  const userName = window.sjTemplateLoader.user?.name || '사용자';
  
  // 기존 컨텐츠 숨기기
  hideMainContent();
  
  // 초기 선택 화면 표시
  showInitialChoiceScreen(userName);
}

// 메인 컨텐츠 숨기기
function hideMainContent() {
  const scheduleHeader = document.querySelector('.schedule-header');
  const calendarSection = document.querySelector('.calendar-section');
  const shiftInfo = document.querySelector('.shift-info');
  
  if (scheduleHeader) scheduleHeader.style.display = 'none';
  if (calendarSection) calendarSection.style.display = 'none';
  if (shiftInfo) shiftInfo.style.display = 'none';
}

// 초기 선택 화면 표시
function showInitialChoiceScreen(userName) {
  const mainContent = document.querySelector('.main-content');
  
  const initialChoiceHTML = `
    <div class="initial-choice-container">
      <div class="choice-header">
        <h2>4일제 근무 시작을 위한 초기 설정</h2>
        <p class="choice-subtitle">안녕하세요 <strong>${userName}</strong>님! 원하시는 휴무일을 선택해주세요.</p>
        <div class="choice-info">
          <div class="info-item">
            <i class="fas fa-calendar-check"></i>
            <span>주 4일 근무 (32시간)</span>
          </div>
          <div class="info-item">
            <i class="fas fa-sync-alt"></i>
            <span>매월 시프트 순환</span>
          </div>
        </div>
      </div>
      
      <div class="day-selection">
        <div class="selection-title">희망 휴무일 선택</div>
        <div class="day-buttons">
          <button class="day-btn" data-day="1">
            <div class="day-name">월요일</div>
            <div class="day-desc">MON</div>
          </button>
          <button class="day-btn" data-day="2">
            <div class="day-name">화요일</div>
            <div class="day-desc">TUE</div>
          </button>
          <button class="day-btn" data-day="3">
            <div class="day-name">수요일</div>
            <div class="day-desc">WED</div>
          </button>
          <button class="day-btn" data-day="4">
            <div class="day-name">목요일</div>
            <div class="day-desc">THU</div>
          </button>
          <button class="day-btn" data-day="5">
            <div class="day-name">금요일</div>
            <div class="day-desc">FRI</div>
          </button>
        </div>
      </div>
      
      <div class="choice-actions">
        <button class="btn btn-primary btn-lg" id="confirmChoiceBtn" onclick="confirmInitialChoice()" disabled>
          <i class="fas fa-check"></i> 선택 완료
        </button>
      </div>
    </div>
  `;
  
  mainContent.innerHTML = initialChoiceHTML;
  
  // 선택 이벤트 바인딩
  bindDaySelection();
}

// 요일 선택 이벤트 바인딩
function bindDaySelection() {
  const dayButtons = document.querySelectorAll('.day-btn');
  const confirmBtn = document.getElementById('confirmChoiceBtn');
  
  dayButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      // 기존 선택 해제
      dayButtons.forEach(b => b.classList.remove('selected'));
      
      // 현재 버튼 선택
      this.classList.add('selected');
      
      // 선택한 요일 저장
      window.selectedOffDay = this.dataset.day;
      
      // 확인 버튼 활성화
      confirmBtn.disabled = false;
    });
  });
}

// 초기 선택 확인
function confirmInitialChoice() {
  if (!window.selectedOffDay) {
    window.sjTemplateLoader.showToast('휴무일을 선택해주세요.', 'warning');
    return;
  }
  
  const dayNames = {1: '월요일', 2: '화요일', 3: '수요일', 4: '목요일', 5: '금요일'};
  const selectedDayName = dayNames[window.selectedOffDay];
  
  if (confirm(`${selectedDayName}을 휴무일로 설정하시겠습니까?\n\n설정 후에는 매월 시프트가 순환됩니다.`)) {
    // API 호출로 초기 설정 저장
    saveInitialChoice(window.selectedOffDay);
  }
}

// 초기 설정 저장 (API 호출)
// 초기 설정 저장 (API 호출)
async function saveInitialChoice(offDay) {
  try {
    // 로딩 상태 표시
    const confirmBtn = document.getElementById('confirmChoiceBtn');
    const originalText = confirmBtn.innerHTML;
    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 설정 중...';
    confirmBtn.disabled = true;
    
    // 현재 날짜 기준으로 스케줄 데이터 생성
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    // work_days 객체 생성 (선택한 요일만 off, 나머지는 full)
    const workDays = {
      "1": offDay === "1" ? "off" : "full",
      "2": offDay === "2" ? "off" : "full", 
      "3": offDay === "3" ? "off" : "full",
      "4": offDay === "4" ? "off" : "full",
      "5": offDay === "5" ? "off" : "full"
    };
    
    const requestData = {
      year: currentYear,
      month: currentMonth,
      work_days: workDays,
      initial_setup: true
    };
    
    // 서버에 초기 설정 저장
    const response = await fetch('/api/staff/work-schedules/save-initial-choice', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      window.sjTemplateLoader.showToast('초기 설정이 완료되었습니다!', 'success');
      
      // 메인 화면으로 돌아가기
      location.reload(); // 간단하게 페이지 리로드
      
    } else {
      throw new Error(result.message || '설정 저장에 실패했습니다.');
    }
    
  } catch (error) {
    console.error('초기 설정 저장 실패:', error);
    window.sjTemplateLoader.showToast(`설정 저장 실패: ${error.message}`, 'error');
    
    // 버튼 상태 복원
    const confirmBtn = document.getElementById('confirmChoiceBtn');
    confirmBtn.innerHTML = originalText;
    confirmBtn.disabled = false;
  }
}

// 개인 스케줄 로드
// 임시로 데이터 구조 확인
function loadPersonalSchedule(scheduleData = null) {
  console.log('개인 스케줄 로드:', scheduleData);
  
  if (scheduleData && scheduleData.user_info && scheduleData.user_info.latest_schedule) {
    const schedule = scheduleData.user_info.latest_schedule;
    
    // 전역 변수에 스케줄 데이터 저장
    window.currentScheduleData = schedule;
    
    updateShiftPattern(schedule.work_days);
    updateShiftDescription(schedule.work_days);
    updateScheduleHeader(schedule);
  }
  
  updateMonthDisplay();
}
// 월 표시 업데이트 함수
function updateMonthDisplay() {
  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', 
                     '7월', '8월', '9월', '10월', '11월', '12월'];
  
  const displayText = `${currentYear}년 ${monthNames[currentMonth - 1]}`;
  document.getElementById('currentMonth').textContent = displayText;
  
  // 캘린더도 다시 생성 
  generateCalendar();
}
 
 // 캘린더 생성 함수
// 캘린더 생성 함수 (수정)
// 캘린더 생성 함수 (실제 스케줄 반영)
function generateCalendar() {
  const firstDay = new Date(currentYear, currentMonth - 1, 1);
  const startDayOfWeek = firstDay.getDay();
  const lastDay = new Date(currentYear, currentMonth, 0);
  const daysInMonth = lastDay.getDate();
  
  const calendarGrid = document.querySelector('.calendar-grid');
  const dayHeaders = calendarGrid.querySelectorAll('.calendar-day-header');
  calendarGrid.innerHTML = '';
  
  dayHeaders.forEach(header => {
    calendarGrid.appendChild(header);
  });
  
  // 첫 주 빈칸 채우기
  for (let i = 0; i < startDayOfWeek; i++) {
    const emptyDay = document.createElement('div');
    emptyDay.className = 'calendar-day other-month';
    emptyDay.innerHTML = '<div class="day-number"></div>';
    calendarGrid.appendChild(emptyDay);
  }
  
  // 이번 달 날짜들 채우기 (실제 스케줄 적용)
  const today = new Date();
  const isCurrentMonth = (currentYear === today.getFullYear() && currentMonth === (today.getMonth() + 1));
  const todayDate = today.getDate();
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentYear, currentMonth - 1, day);
    const dayOfWeek = date.getDay(); // 0=일, 1=월, 2=화, 3=수, 4=목, 5=금, 6=토
    
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    
    // 오늘 날짜 하이라이트
    if (isCurrentMonth && day === todayDate) {
      dayElement.className += ' today';
    }
    
    // 스케줄 상태 결정 부분에 반차 체크 로직 추가
	if (dayOfWeek === 0 || dayOfWeek === 6) {
	  // 주말
	  scheduleStatus = 'weekend';
	  scheduleText = '';
	} else if (window.currentScheduleData) {
		  // 해당 날짜에 반차가 있는지 먼저 확인
		  const dateString = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
		  const halfDayData = window.currentScheduleData.half_day_list?.find(item => {
			const itemDate = item.start_date.split('T')[0];
			return itemDate === dateString;
		  });
		  
		  if (halfDayData) {
			// 반차가 있는 경우
			if (halfDayData.leave_type === 'HALF_AM') {
			  scheduleStatus = 'half-morning';
			  scheduleText = '<div class="schedule-indicator half">오전반차</div>';
			} else {
			  scheduleStatus = 'half-afternoon';
			  scheduleText = '<div class="schedule-indicator half">오후반차</div>';
			}
		  } else {
			// 기본 스케줄 적용 (기존 로직)
			const workType = window.currentScheduleData.work_days[dayOfWeek.toString()];
			if (workType === 'off') {
			  scheduleStatus = 'off';
			  scheduleText = '<div class="schedule-indicator off">휴무</div>';
			} else {
			  scheduleStatus = 'work';
			  scheduleText = '<div class="schedule-indicator work">근무</div>';
			}
		  }
		}
    
    dayElement.className += ` ${scheduleStatus}`;
    dayElement.innerHTML = `
      <div class="day-number">${day}</div>
      ${scheduleText}
    `;
    
    calendarGrid.appendChild(dayElement);
  }
  
  console.log(`캘린더 생성 완료: ${daysInMonth}개 날짜, 스케줄 적용됨`);
}
 
 
 // 반차 신청 모달 열기
    function openHalfDayModal() {
      const modal = new bootstrap.Modal(document.getElementById('halfDayModal'));
      modal.show();
    }
    
    // 반차 신청 처리
    // 반차 신청 처리 (API 연동)
		async function submitHalfDay() {
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
			const submitBtn = document.querySelector('#halfDayModal .btn-primary');
			const originalText = submitBtn.textContent;
		  try {
			// 로딩 상태 표시
			
			submitBtn.textContent = '처리 중...';
			submitBtn.disabled = true;
			
			// API 호출
			const response = await fetch('/api/staff/work-schedules/apply-half-day', {
			  method: 'POST',
			  credentials: 'include',
			  headers: {
				'Content-Type': 'application/json'
			  },
			  body: JSON.stringify(data)
			});
			
			const result = await response.json();
			
			if (response.ok && result.success) {
			  // 성공 시
			  bootstrap.Modal.getInstance(document.getElementById('halfDayModal')).hide();
			  window.sjTemplateLoader.showToast('반차 신청이 완료되었습니다.', 'success');
			  
			  // 폼 초기화
			  form.reset();
			  const tomorrow = new Date();
			  tomorrow.setDate(tomorrow.getDate() + 1);
			  document.getElementById('halfDayDate').value = tomorrow.toISOString().split('T')[0];
			  
			  // 페이지 리로드해서 반차 사용 현황 업데이트
			  setTimeout(() => {
				location.reload();
			  }, 2000);
			} else {
			  // 실패 시
			  window.sjTemplateLoader.showToast(`반차 신청 실패: ${result.message}`, 'error');
			}
			
		  } catch (error) {
			console.error('반차 신청 중 오류:', error);
			window.sjTemplateLoader.showToast('네트워크 오류가 발생했습니다.', 'error');
		  } finally {
			// 버튼 상태 복원
			const submitBtn = document.querySelector('#halfDayModal .btn-primary');
			submitBtn.textContent = originalText;
			submitBtn.disabled = false;
		  }
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
   // 이렇게 바꾸기
	document.getElementById('prevMonth').addEventListener('click', () => {
	  currentMonth = currentMonth - 1;
	  if (currentMonth < 1) {
		currentMonth = 12;
		currentYear = currentYear - 1;
	  }
	  updateMonthDisplay();
	});
    
    document.getElementById('nextMonth').addEventListener('click', () => {
		  currentMonth = currentMonth + 1;
		  if (currentMonth > 12) {
			currentMonth = 1;
			currentYear = currentYear + 1;
		  }
		  updateMonthDisplay();
		});
    
    // 페이지 로드 시 초기화
    document.addEventListener('DOMContentLoaded', function() {
      console.log('4일제 스케줄 페이지가 로드되었습니다.');
      
	  checkUserScheduleStatus();
	  
      // 오늘 날짜를 반차 신청의 기본값으로 설정
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const tomorrowString = tomorrow.toISOString().split('T')[0];
      document.getElementById('halfDayDate').value = tomorrowString;
    });
	
	// 시프트 패턴 업데이트 함수 
	function updateShiftPattern(workDays) {
	  const days = ['월요일', '화요일', '수요일', '목요일', '금요일'];
	  
	  days.forEach((dayName, index) => {
		const dayNumber = index + 1;
		const dayPattern = document.querySelector(`.day-pattern:nth-child(${dayNumber})`);
		
		if (workDays[dayNumber] === 'off') {
		  dayPattern.className = 'day-pattern off';
		  dayPattern.querySelector('.day-schedule').textContent = '휴무';
		} else {
		  dayPattern.className = 'day-pattern work';
		  dayPattern.querySelector('.day-schedule').textContent = '9:00-18:00';
		}
	  });
	}
	
	
	// 시프트 설명 텍스트 업데이트 함수 
	function updateShiftDescription(workDays) {
	  // 현재 휴무일 찾기
	  const currentOffDay = Object.keys(workDays).find(day => workDays[day] === 'off');
	  const dayNames = {1: '월요일', 2: '화요일', 3: '수요일', 4: '목요일', 5: '금요일'};
	  
	  if (currentOffDay) {
		const description = `매주 ${dayNames[currentOffDay]}이 휴무입니다. 다음 달부터는 시프트 순환에 따라 휴무일이 변경됩니다.`;
		
		// HTML의 설명 텍스트 업데이트
		const descElement = document.querySelector('.shift-info p');
		if (descElement) {
		  descElement.textContent = description;
		}
	  }
	}
	
	// 스케줄 헤더 업데이트 함수 (새로 추가)
	function updateScheduleHeader(scheduleData) {
		  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', 
							 '7월', '8월', '9월', '10월', '11월', '12월'];
		  
		  // 1. 년월 표시 업데이트
		  const headerTitle = document.querySelector('.schedule-header h2');
		  if (headerTitle) {
			headerTitle.textContent = `${scheduleData.year}년 ${monthNames[scheduleData.month - 1]} 스케줄`;
		  }
		  
		  // 2. 시프트 패턴 설명 업데이트  
		  const shiftDesc = document.querySelector('.schedule-header p');
		  if (shiftDesc) {
			shiftDesc.textContent = `현재 시프트: ${scheduleData.current_off_day_name} 휴무 패턴`;
		  }
		  
		  // 3. 요약 카드들 업데이트
		  const summaryCards = document.querySelectorAll('.summary-card .summary-number');
		  if (summaryCards.length >= 4) {
			summaryCards[0].textContent = scheduleData.calculated_work_days;  // 근무일
			summaryCards[1].textContent = '32';  // 주당 근무시간 (고정)
			summaryCards[2].textContent = scheduleData.half_days_used;  // 반차 사용
			summaryCards[3].textContent = scheduleData.current_off_day_name;  // 휴무일
		  }
		}
# 주4일 근무제 시스템 UI 프로토타입 설계

**작성일**: 2025-01-XX  
**버전**: 1.0  
**대상 파일**: `employee-schedule.html`, `employee-schedule.js`

---

## 📋 목차

1. [현재 UI 분석](#1-현재-ui-분석)
2. [변경 사항 요약](#2-변경-사항-요약)
3. [상세 UI 변경 사항](#3-상세-ui-변경-사항)
4. [모킹 데이터 구조](#4-모킹-데이터-구조)
5. [프로토타입 구현 계획](#5-프로토타입-구현-계획)

---

## 1. 현재 UI 분석

### 1.1 현재 구조

**파일**: `employee-schedule.html`

**주요 섹션**:
1. **스케줄 헤더** (라인 54-83)
   - 월 표시
   - 현재 시프트 패턴 표시 (예: "금요일 휴무 패턴")
   - 승인 상태 배지
   - 요약 카드 (근무일, 근무시간, 반차, 기본 휴무일)

2. **시프트 정보** (라인 86-116)
   - 이번 달 근무 패턴 설명
   - **현재 텍스트**: "매주 금요일이 휴무입니다. 다음 달(2월)부터는 월요일 휴무로 변경됩니다."
   - 요일별 패턴 표시

3. **캘린더** (라인 119-303)
   - 월간 캘린더 그리드
   - 근무일/휴무일/반차 표시

4. **액션 버튼** (라인 306-315)
   - 반차 신청 버튼
   - 시프트 안내 버튼

5. **반차 신청 모달** (라인 319-368)
   - 긴급 여부 선택 (계획된 반차 / 긴급 반차)

---

## 2. 변경 사항 요약

### 2.1 필수 변경 사항

| 항목 | 현재 | 변경 후 |
|------|------|---------|
| 순환 설명 | "5개월 주기", "다음 달부터 변경" | "4주 주기", "4주마다 반대 방향으로 변경" |
| 순환 방향 | 정방향 (금→월→화→수→목) | 반대 방향 (금→목→수→화→월) |
| 반차 설명 | "계획된 반차(당주) / 긴급 반차(차주 보충)" | "같은 주 내에서만 사용, 이월 불가" |
| 일시적 변경 | 없음 | 추가 필요 |
| 수습 기간 안내 | 없음 | 추가 필요 |
| 공휴일 안내 | 없음 | 추가 필요 |

---

## 3. 상세 UI 변경 사항

### 3.1 스케줄 헤더 섹션 변경

**위치**: `employee-schedule.html` 라인 54-83

**변경 내용**:

#### 현재 (라인 58):
```html
<p style="margin: 0.5rem 0 0 0; opacity: 0.9;">현재 시프트: 금요일 휴무 패턴</p>
```

#### 변경 후:
```html
<p style="margin: 0.5rem 0 0 0; opacity: 0.9;">
  현재 시프트: 금요일 휴무 패턴 
  <span class="cycle-info-badge">
    <i class="fas fa-sync-alt"></i> 4주 주기 (1-4주차)
  </span>
</p>
```

**추가 요소**:
- 현재 주기 정보 표시 (1-4주차 중 어느 주기인지)
- 다음 순환 예정일 표시

---

### 3.2 시프트 정보 섹션 변경

**위치**: `employee-schedule.html` 라인 86-116

**변경 내용**:

#### 현재 (라인 90-92):
```html
<p style="color: #718096; font-size: 0.875rem; margin-bottom: 1rem;">
  매주 금요일이 휴무입니다. 다음 달(2월)부터는 월요일 휴무로 변경됩니다.
</p>
```

#### 변경 후:
```html
<div class="shift-info-content">
  <p style="color: #718096; font-size: 0.875rem; margin-bottom: 1rem;">
    <strong>4주 주기 반대 방향 순환 시스템</strong><br>
    • 현재: 1-4주차 (금요일 휴무)<br>
    • 다음: 5-8주차 (목요일 휴무) - 2025-02-03부터<br>
    • 순환 방향: 금 → 목 → 수 → 화 → 월 → 금 (반대 방향)
  </p>
  
  <!-- 수습 기간 안내 (조건부 표시) -->
  <div class="probation-notice" id="probationNotice" style="display: none;">
    <div class="alert alert-info" style="font-size: 0.875rem; margin-bottom: 1rem;">
      <i class="fas fa-info-circle"></i>
      <strong>수습 기간 안내:</strong> 입사 후 3개월 미만으로 주4일 근무제가 적용되지 않습니다.
    </div>
  </div>
  
  <!-- 공휴일 포함 주 안내 (조건부 표시) -->
  <div class="holiday-notice" id="holidayNotice" style="display: none;">
    <div class="alert alert-warning" style="font-size: 0.875rem; margin-bottom: 1rem;">
      <i class="fas fa-calendar-alt"></i>
      <strong>공휴일 포함 주:</strong> 이번 주에는 공휴일이 포함되어 추가 휴무일이 없으며, 반차 분할이 불가합니다.
    </div>
  </div>
</div>
```

---

### 3.3 액션 버튼 섹션 변경

**위치**: `employee-schedule.html` 라인 306-315

**변경 내용**:

#### 현재:
```html
<div class="action-buttons">
  <button class="btn-half-day" onclick="openHalfDayModal()">
    <i class="fas fa-clock"></i>
    반차 신청
  </button>
  <button class="btn-schedule-info" onclick="showScheduleInfo()">
    <i class="fas fa-info-circle"></i>
    시프트 안내
  </button>
</div>
```

#### 변경 후:
```html
<div class="action-buttons">
  <button class="btn-half-day" onclick="openHalfDayModal()">
    <i class="fas fa-clock"></i>
    반차 신청
  </button>
  <!-- 일시적 변경 버튼 추가 -->
  <button class="btn-temporary-change" onclick="openTemporaryChangeModal()" id="temporaryChangeBtn">
    <i class="fas fa-exchange-alt"></i>
    휴무일 일시적 변경
  </button>
  <button class="btn-schedule-info" onclick="showScheduleInfo()">
    <i class="fas fa-info-circle"></i>
    시프트 안내
  </button>
</div>
```

**조건부 표시**:
- 수습 기간 중에는 일시적 변경 버튼 비활성화
- 공휴일 포함 주에는 일시적 변경 버튼 비활성화

---

### 3.4 반차 신청 모달 변경

**위치**: `employee-schedule.html` 라인 319-368

**변경 내용**:

#### 현재 (라인 342-346):
```html
<label class="col-form-label">긴급 여부</label>
<select class="form-control" id="isEmergency">
  <option value="false">계획된 반차 (당주 조정)</option>
  <option value="true">긴급 반차 (차주 보충)</option>
</select>
```

#### 변경 후:
```html
<!-- 긴급 여부 필드 제거 -->
<!-- 대신 같은 주 검증 메시지 추가 -->

<div class="half-day-validation" id="halfDayValidation" style="display: none;">
  <div class="alert alert-warning" style="font-size: 0.875rem;">
    <i class="fas fa-exclamation-triangle"></i>
    <strong>안내:</strong> 반차는 같은 주(월~일) 내에서만 사용 가능합니다.
    선택한 날짜와 휴무일이 같은 주인지 확인해주세요.
  </div>
</div>
```

#### 안내사항 변경 (라인 355-360):

**현재**:
```html
<div class="alert alert-warning mt-3" style="font-size: 0.875rem;">
  <i class="fas fa-info-circle"></i>
  <strong>안내사항:</strong><br>
  • 계획된 반차: 해당 주 휴무일에 4시간 근무하여 32시간 유지<br>
  • 긴급 반차: 이번 주 28시간, 다음 주 휴무일에 4시간 추가 근무
</div>
```

**변경 후**:
```html
<div class="alert alert-info mt-3" style="font-size: 0.875rem;">
  <i class="fas fa-info-circle"></i>
  <strong>안내사항:</strong><br>
  • 반차는 같은 주(월~일) 내에서만 사용 가능합니다<br>
  • 주를 초과하여 반차를 이월 사용하는 것은 불가능합니다<br>
  • 공휴일이 포함된 주에는 반차 분할이 불가합니다
</div>
```

---

### 3.5 일시적 변경 모달 추가 (신규)

**위치**: `employee-schedule.html` (반차 신청 모달 다음에 추가)

**내용**:
```html
<!-- 일시적 휴무일 변경 모달 -->
<div class="modal fade" id="temporaryChangeModal" tabindex="-1">
  <div class="modal-dialog modal-lg">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">
          휴무일 일시적 변경 신청
          <small>특정 주만 다른 요일로 변경할 수 있습니다</small>
        </h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body">
        <form id="temporaryChangeForm" class="form-grid">
          <label class="col-form-label">변경할 주 선택</label>
          <input type="date" class="form-control" id="changeWeekStart" required 
                 placeholder="해당 주의 월요일을 선택하세요">
          
          <label class="col-form-label">원래 휴무일</label>
          <input type="text" class="form-control" id="originalOffDay" readonly>
          
          <label class="col-form-label">변경할 휴무일</label>
          <select class="form-control" id="temporaryOffDay" required>
            <option value="">선택하세요</option>
            <option value="1">월요일</option>
            <option value="2">화요일</option>
            <option value="3">수요일</option>
            <option value="4">목요일</option>
            <option value="5">금요일</option>
          </select>
          
          <label class="col-form-label">업무 대체자 (선택)</label>
          <select class="form-control" id="substituteEmployee">
            <option value="">선택하세요</option>
            <!-- 동적으로 로드 -->
          </select>
          
          <div class="full-width">
            <label class="col-form-label">변경 사유</label>
            <textarea class="form-control" id="changeReason" rows="3" 
                    placeholder="휴무일 변경 사유를 입력해주세요" required></textarea>
          </div>
        </form>
        
        <div class="alert alert-info mt-3" style="font-size: 0.875rem;">
          <i class="fas fa-info-circle"></i>
          <strong>안내사항:</strong><br>
          • 일시적 변경은 해당 주에만 적용됩니다<br>
          • 다음 주부터는 원래 순환 패턴으로 복귀합니다<br>
          • 업무 대체자 또는 팀장의 승인이 필요합니다
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">취소</button>
        <button type="button" class="btn btn-primary" onclick="submitTemporaryChange()">신청하기</button>
      </div>
    </div>
  </div>
</div>
```

---

## 4. 모킹 데이터 구조

### 4.1 스케줄 조회 응답 (모킹)

```javascript
const mockScheduleData = {
  success: true,
  data: {
    year: 2025,
    month: 1,
    user: {
      email: "user@example.com",
      name: "김철수",
      hire_date: "2024-10-01", // 수습 기간 계산용
      work_schedule: "4_DAY",
      work_days: {
        base_off_day: 5, // 금요일
        cycle_start_date: "2025-01-06", // 4주 주기 시작일
        initial_selection_date: "2025-01-06"
      }
    },
    current_cycle: {
      week_range: "1-4주차",
      off_day: 5, // 금요일
      cycle_start_date: "2025-01-06",
      next_cycle_date: "2025-02-03", // 다음 주기 시작일
      next_off_day: 4 // 목요일 (반대 방향)
    },
    schedule: {
      work_days: {
        "1": "full", // 월: 종일
        "2": "full", // 화: 종일
        "3": "full", // 수: 종일
        "4": "full", // 목: 종일
        "5": "off"   // 금: 휴무
      },
      total_hours: 32,
      work_days_count: 4
    },
    temporary_changes: [], // 일시적 변경 목록
    holidays: [
      { date: "2025-01-01", name: "신정" }
    ],
    is_probation: false, // 수습 기간 여부
    has_holiday_in_week: false // 이번 주 공휴일 포함 여부
  }
};
```

### 4.2 일시적 변경 요청 응답 (모킹)

```javascript
const mockTemporaryChangeResponse = {
  success: true,
  data: {
    id: 1,
    user_id: "user@example.com",
    week_start_date: "2025-01-13",
    original_off_day: 5,
    temporary_off_day: 2,
    reason: "개인 사정",
    status: "PENDING",
    requested_at: "2025-01-10T10:00:00Z"
  }
};
```

### 4.3 승인 대기 목록 (모킹)

```javascript
const mockPendingChanges = {
  success: true,
  data: [
    {
      id: 1,
      user_name: "김철수",
      week_start_date: "2025-01-13",
      original_off_day: 5,
      original_off_day_name: "금요일",
      temporary_off_day: 2,
      temporary_off_day_name: "화요일",
      reason: "개인 사정",
      requested_at: "2025-01-10T10:00:00Z"
    }
  ]
};
```

---

## 5. 프로토타입 구현 계획

### 5.1 1단계: HTML 구조 변경

**작업 내용**:
1. ✅ 시프트 정보 섹션 텍스트 변경
2. ✅ 일시적 변경 버튼 추가
3. ✅ 일시적 변경 모달 추가
4. ✅ 반차 신청 모달 수정
5. ✅ 수습 기간/공휴일 안내 추가

**예상 소요 시간**: 2-3시간

---

### 5.2 2단계: JavaScript 로직 수정

**작업 내용**:
1. ✅ 순환 계산 로직 수정 (모킹 데이터로)
2. ✅ 일시적 변경 모달 관리 함수 추가
3. ✅ 반차 검증 로직 수정 (같은 주 체크)
4. ✅ 수습 기간 체크 로직 추가
5. ✅ 공휴일 체크 로직 추가

**예상 소요 시간**: 4-6시간

---

### 5.3 3단계: 모킹 데이터 연동

**작업 내용**:
1. ✅ 모킹 데이터 구조 정의
2. ✅ UI에 모킹 데이터 표시
3. ✅ 사용자 피드백 수집

**예상 소요 시간**: 2-3시간

---

## 6. CSS 스타일 추가 필요

### 6.1 새로운 클래스

```css
/* 일시적 변경 버튼 */
.btn-temporary-change {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-temporary-change:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-temporary-change:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 주기 정보 배지 */
.cycle-info-badge {
  display: inline-block;
  background: #e3f2fd;
  color: #1976d2;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  margin-left: 0.5rem;
}

/* 수습 기간/공휴일 안내 */
.probation-notice,
.holiday-notice {
  margin-top: 1rem;
}
```

---

## 7. 다음 단계

### 즉시 시작 가능한 작업

1. **HTML 구조 변경** (1단계)
   - `employee-schedule.html` 파일 수정
   - 새로운 모달 및 안내 추가

2. **모킹 데이터 정의** (3단계)
   - `employee-schedule.js`에 모킹 데이터 추가
   - UI에 표시

3. **JavaScript 로직 수정** (2단계)
   - 순환 계산 로직 (모킹)
   - 일시적 변경 모달 관리

---

**문서 버전**: 1.0  
**최종 업데이트**: 2025-01-XX


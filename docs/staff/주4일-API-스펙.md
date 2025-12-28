# 주 4일 근무제 API 스펙

**작성일**: 2025-12-28  
**버전**: 1.0  
**기준**: 4주 단위 운영 + 타임존(KST) 기준 명확화

---

## 목차

1. [공통 사항](#공통-사항)
2. [인증 및 권한](#인증-및-권한)
3. [사용자 스케줄 조회 API](#사용자-스케줄-조회-api)
4. [반차 신청 API](#반차-신청-api)
5. [일시적 휴무일 변경 API](#일시적-휴무일-변경-api)
6. [관리자 API](#관리자-api)
7. [에러 처리](#에러-처리)

---

## 공통 사항

### 기본 URL
```
/api/staff/work-schedules
```

### 타임존 규칙
- 모든 날짜는 **KST (Asia/Seoul, UTC+9) 기준**
- 서버에서 모든 날짜 계산 수행
- 클라이언트는 서버에서 계산한 결과만 표시

### 공통 응답 형식
```json
{
  "success": true,
  "data": { ... },
  "message": "성공 메시지"
}
```

### 공통 에러 응답
```json
{
  "success": false,
  "message": "에러 메시지",
  "code": "ERROR_CODE"
}
```

---

## 인증 및 권한

### 인증
- 모든 API는 세션 기반 인증 필요
- `req.session.user` 존재 여부 확인

### 권한 레벨
- **EMPLOYEE**: 본인 스케줄 조회, 반차 신청, 일시적 변경 신청
- **DEPT_MANAGER**: 부서 직원 스케줄 조회, 반차/변경 승인
- **SYSTEM_ADMIN**: 전체 직원 스케줄 조회, 승인
- **SUPER_ADMIN**: 모든 권한

---

## 사용자 스케줄 조회 API

### GET /api/staff/work-schedules/my-status

**목적**: 현재 사용자의 주4일 근무제 설정 상태 확인

**인증**: 필수

**응답**:
```json
{
  "success": true,
  "data": {
    "has_work_days": true,
    "work_days": {
      "base_off_day": 5,
      "cycle_start_date": "2025-01-06",
      "initial_selection_date": "2025-01-06"
    },
    "is_probation": false,
    "hire_date": "2024-01-15"
  }
}
```

**필드 설명**:
- `has_work_days`: work_days 설정 여부
- `work_days.base_off_day`: 기본 휴무일 (1=월, 2=화, 3=수, 4=목, 5=금)
- `work_days.cycle_start_date`: 사이클 시작일 (KST 기준)
- `work_days.initial_selection_date`: 최초 선택일 (KST 기준)
- `is_probation`: 수습 기간 여부 (입사 후 3개월 미만)
- `hire_date`: 입사일

---

### GET /api/staff/work-schedules/my-schedule/:year/:month

**목적**: 특정 월의 상세 스케줄 조회 (서버에서 계산한 daily_schedule 포함)

**인증**: 필수

**URL 파라미터**:
- `year`: 연도 (예: 2025)
- `month`: 월 (1-12)

**응답**:
```json
{
  "success": true,
  "data": {
    "year": 2025,
    "month": 12,
    "user": {
      "email": "user@example.com",
      "name": "홍길동",
      "hire_date": "2024-01-15",
      "work_schedule": "4_DAY",
      "work_days": {
        "base_off_day": 5,
        "cycle_start_date": "2025-01-06",
        "initial_selection_date": "2025-01-06"
      }
    },
    "current_cycle": {
      "cycle_number": 11,
      "off_day": 4,
      "off_day_name": "목요일",
      "week_range": "1-4주차",
      "cycle_start_date": "2025-01-06",
      "next_cycle_date": "2026-01-03",
      "next_off_day": 2,
      "next_off_day_name": "화요일"
    },
    "schedule": {
      "work_days": {
        "1": "off",
        "2": "full",
        "3": "full",
        "4": "off",
        "5": "full"
      },
      "total_hours": 32,
      "work_days_count": 4
    },
    "daily_schedule": [
      {
        "date": "2025-12-01",
        "day_of_week": 1,
        "off_day": 4,
        "is_off_day": false,
        "is_holiday": false,
        "has_half_day": false,
        "half_day_type": null
      },
      {
        "date": "2025-12-04",
        "day_of_week": 4,
        "off_day": 4,
        "is_off_day": true,
        "is_holiday": false,
        "has_half_day": false,
        "half_day_type": null
      },
      {
        "date": "2025-12-25",
        "day_of_week": 4,
        "off_day": 4,
        "is_off_day": false,
        "is_holiday": true,
        "has_half_day": false,
        "half_day_type": null
      }
    ],
    "temporary_changes": [
      {
        "id": 1,
        "week_start_date": "2025-12-15",
        "original_off_day": 4,
        "temporary_off_day": 3,
        "reason": "개인 사정",
        "substitute_employee": "substitute@example.com",
        "status": "APPROVED"
      }
    ],
    "half_day_list": [
      {
        "id": 1,
        "start_date": "2025-12-10",
        "leave_type": "HALF_AM",
        "reason": "병원 방문",
        "status": "APPROVED"
      }
    ],
    "holidays": [
      {
        "date": "2025-12-25",
        "name": "크리스마스"
      }
    ],
    "is_probation": false,
    "has_holiday_in_week": false
  }
}
```

**필드 설명**:
- `daily_schedule`: 서버에서 계산한 월별 각 날짜의 스케줄 정보 (타임존 문제 해결)
  - `date`: 날짜 (YYYY-MM-DD, KST 기준)
  - `day_of_week`: 요일 (1=월, 2=화, 3=수, 4=목, 5=금)
  - `off_day`: 해당 주의 휴무일 (1-5)
  - `is_off_day`: 해당 날짜가 휴무일인지 (공휴일 포함 주는 false)
  - `is_holiday`: 공휴일인지
  - `has_half_day`: 반차가 있는지
  - `half_day_type`: 반차 타입 (HALF_AM, HALF_PM, null)

---

## 반차 신청 API

### POST /api/staff/work-schedules/apply-half-day

**목적**: 반차 신청

**인증**: 필수

**권한**: EMPLOYEE 이상

**요청 Body**:
```json
{
  "date": "2025-12-15",
  "leave_type": "HALF_AM",
  "reason": "병원 방문"
}
```

**필드 설명**:
- `date`: 신청 날짜 (YYYY-MM-DD, KST 기준)
- `leave_type`: 반차 타입 (`HALF_AM` 또는 `HALF_PM`)
- `reason`: 사유 (필수)

**검증 규칙**:
1. 수습 기간 중이면 불가
2. 공휴일이면 불가
3. 휴무일이면 불가
4. 같은 주(월~일) 내에서만 사용 가능
5. 공휴일 포함 주에는 불가

**응답 (성공)**:
```json
{
  "success": true,
  "message": "반차 신청이 완료되었습니다.",
  "data": {
    "id": 1,
    "date": "2025-12-15",
    "leave_type": "HALF_AM",
    "status": "PENDING"
  }
}
```

**응답 (실패)**:
```json
{
  "success": false,
  "message": "반차는 같은 주(월~일) 내에서만 사용 가능합니다.",
  "code": "HALF_DAY_SAME_WEEK_REQUIRED"
}
```

**에러 코드**:
- `PROBATION_PERIOD`: 수습 기간 중
- `HOLIDAY_NOT_ALLOWED`: 공휴일
- `OFF_DAY_NOT_ALLOWED`: 휴무일
- `HALF_DAY_SAME_WEEK_REQUIRED`: 다른 주
- `HOLIDAY_WEEK_NOT_ALLOWED`: 공휴일 포함 주

---

## 일시적 휴무일 변경 API

### POST /api/staff/work-schedules/temporary-change

**목적**: 특정 주의 휴무일을 일시적으로 변경 신청

**인증**: 필수

**권한**: EMPLOYEE 이상

**요청 Body**:
```json
{
  "week_start_date": "2025-12-15",
  "temporary_off_day": 3,
  "reason": "개인 사정으로 인한 일시적 변경",
  "substitute_employee": "substitute@example.com"
}
```

**필드 설명**:
- `week_start_date`: 변경할 주의 시작일 (월요일, YYYY-MM-DD, KST 기준)
- `temporary_off_day`: 임시 휴무일 (1=월, 2=화, 3=수, 4=목, 5=금)
- `reason`: 변경 사유 (필수)
- `substitute_employee`: 업무 대체자 이메일 (선택사항)

**검증 규칙**:
1. 수습 기간 중이면 불가
2. 원래 휴무일과 동일하면 불가
3. 공휴일 포함 주에는 불가
4. 해당 주에 이미 변경 신청이 있으면 불가

**응답 (성공)**:
```json
{
  "success": true,
  "message": "일시적 휴무일 변경 신청이 완료되었습니다.",
  "data": {
    "id": 1,
    "week_start_date": "2025-12-15",
    "original_off_day": 4,
    "temporary_off_day": 3,
    "status": "PENDING"
  }
}
```

**응답 (실패)**:
```json
{
  "success": false,
  "message": "원래 휴무일과 동일한 날짜로 변경할 수 없습니다.",
  "code": "SAME_OFF_DAY"
}
```

**에러 코드**:
- `PROBATION_PERIOD`: 수습 기간 중
- `SAME_OFF_DAY`: 원래 휴무일과 동일
- `HOLIDAY_WEEK_NOT_ALLOWED`: 공휴일 포함 주
- `ALREADY_REQUESTED`: 이미 변경 신청 존재

---

### GET /api/staff/work-schedules/my-change-requests

**목적**: 본인의 일시적 변경 신청 목록 조회

**인증**: 필수

**권한**: EMPLOYEE 이상

**쿼리 파라미터**:
- `status`: 필터링 (PENDING, APPROVED, REJECTED, 선택사항)
- `year`: 연도 필터 (선택사항)
- `month`: 월 필터 (선택사항)

**응답**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "week_start_date": "2025-12-15",
      "original_off_day": 4,
      "temporary_off_day": 3,
      "reason": "개인 사정",
      "substitute_employee": "substitute@example.com",
      "status": "PENDING",
      "requested_at": "2025-12-14T10:30:00Z"
    }
  ]
}
```

---

## 관리자 API

### GET /api/staff/work-schedules/pending-changes

**목적**: 승인 대기 중인 일시적 변경 신청 목록 조회

**인증**: 필수

**권한**: DEPT_MANAGER 이상

**쿼리 파라미터**:
- `department_id`: 부서 필터 (선택사항, 부서장의 경우 자동 필터링)

**응답**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": "user@example.com",
      "user_name": "홍길동",
      "week_start_date": "2025-12-15",
      "original_off_day": 4,
      "original_off_day_name": "목요일",
      "temporary_off_day": 3,
      "temporary_off_day_name": "수요일",
      "reason": "개인 사정",
      "substitute_employee": "substitute@example.com",
      "substitute_employee_name": "대체자",
      "status": "PENDING",
      "requested_at": "2025-12-14T10:30:00Z"
    }
  ]
}
```

---

### POST /api/staff/work-schedules/approve-change/:changeId

**목적**: 일시적 변경 신청 승인/거부

**인증**: 필수

**권한**: DEPT_MANAGER 이상

**URL 파라미터**:
- `changeId`: 변경 신청 ID

**요청 Body**:
```json
{
  "action": "approve",
  "rejection_reason": null
}
```

또는

```json
{
  "action": "reject",
  "rejection_reason": "업무 일정상 불가"
}
```

**필드 설명**:
- `action`: `approve` 또는 `reject`
- `rejection_reason`: 거부 사유 (거부 시 필수)

**응답 (성공)**:
```json
{
  "success": true,
  "message": "변경 신청이 승인되었습니다.",
  "data": {
    "id": 1,
    "status": "APPROVED",
    "approved_at": "2025-12-14T15:30:00Z"
  }
}
```

---

### GET /api/staff/work-schedules/team/:year/:month

**목적**: 팀/부서 전체 스케줄 조회

**인증**: 필수

**권한**: DEPT_MANAGER 이상

**URL 파라미터**:
- `year`: 연도
- `month`: 월

**쿼리 파라미터**:
- `department_id`: 부서 ID (선택사항, 부서장의 경우 자동 필터링)

**응답**:
```json
{
  "success": true,
  "data": {
    "year": 2025,
    "month": 12,
    "employees": [
      {
        "email": "user@example.com",
        "name": "홍길동",
        "current_cycle": {
          "off_day": 4,
          "off_day_name": "목요일"
        },
        "daily_schedule": [ ... ]
      }
    ]
  }
}
```

---

## 에러 처리

### 공통 에러 코드

| 코드 | HTTP 상태 | 설명 |
|------|----------|------|
| `UNAUTHORIZED` | 401 | 인증 필요 |
| `FORBIDDEN` | 403 | 권한 없음 |
| `NOT_FOUND` | 404 | 리소스 없음 |
| `VALIDATION_ERROR` | 400 | 검증 오류 |
| `SERVER_ERROR` | 500 | 서버 오류 |

### 비즈니스 로직 에러 코드

| 코드 | HTTP 상태 | 설명 |
|------|----------|------|
| `PROBATION_PERIOD` | 400 | 수습 기간 중 |
| `HOLIDAY_NOT_ALLOWED` | 400 | 공휴일 |
| `OFF_DAY_NOT_ALLOWED` | 400 | 휴무일 |
| `HALF_DAY_SAME_WEEK_REQUIRED` | 400 | 다른 주 |
| `HOLIDAY_WEEK_NOT_ALLOWED` | 400 | 공휴일 포함 주 |
| `SAME_OFF_DAY` | 400 | 원래 휴무일과 동일 |
| `ALREADY_REQUESTED` | 400 | 이미 변경 신청 존재 |

---

## 타임존 처리 규칙

### 서버 측
1. 모든 날짜 계산은 KST 기준으로 수행
2. `process.env.TZ = 'Asia/Seoul'` 설정 확인
3. 날짜 비교 시 명시적으로 KST 시간대 사용

### 클라이언트 측
1. 서버에서 계산한 `daily_schedule` 사용
2. 클라이언트에서 날짜 계산 금지
3. 서버에서 내려준 날짜 문자열 그대로 표시

---

## 데이터 검증 규칙

### 반차 신청
1. 수습 기간 체크 (입사일 기준 3개월)
2. 공휴일 체크
3. 휴무일 체크
4. 같은 주 체크 (월요일~일요일)
5. 공휴일 포함 주 체크

### 일시적 변경
1. 수습 기간 체크
2. 원래 휴무일과 다른지 체크
3. 공휴일 포함 주 체크
4. 중복 신청 체크

---

**문서 버전**: 1.0  
**최종 업데이트**: 2025-12-28


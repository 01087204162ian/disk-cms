# 주4일 근무제 시스템 API 스펙 문서

**작성일**: 2025-01-XX  
**버전**: 1.0  
**기반**: 하이브리드 개발 계획 Phase 2

---

## 📋 목차

1. [개요](#1-개요)
2. [공통 사항](#2-공통-사항)
3. [API 엔드포인트](#3-api-엔드포인트)
   - [3.1 초기 설정 API](#31-초기-설정-api)
   - [3.2 스케줄 조회 API](#32-스케줄-조회-api)
   - [3.3 반차 신청 API](#33-반차-신청-api)
   - [3.4 일시적 변경 API](#34-일시적-변경-api)
   - [3.5 승인 관리 API](#35-승인-관리-api)
   - [3.6 유틸리티 API](#36-유틸리티-api)

---

## 1. 개요

이 문서는 주4일 근무제 시스템 고도화를 위한 API 스펙을 정의합니다.

### 주요 변경 사항

- **4주 주기 반대 방향 순환**: 기존 5개월 주기 → 4주 주기 반대 방향 순환
- **일시적 휴무일 변경**: 새로운 기능 추가
- **반차 시스템 개선**: 같은 주 검증, 공휴일 처리
- **수습 기간 체크**: 3개월 미만 직원 제한

---

## 2. 공통 사항

### 2.1 인증

모든 API는 세션 기반 인증을 사용합니다.

**요청 헤더**:
```
Cookie: connect.sid=<session_id>
```

### 2.2 응답 형식

#### 성공 응답
```json
{
  "success": true,
  "data": { ... }
}
```

#### 에러 응답
```json
{
  "success": false,
  "message": "에러 메시지",
  "code": "ERROR_CODE"
}
```

### 2.3 에러 코드

| 코드 | 설명 |
|------|------|
| `INVALID_REQUEST` | 잘못된 요청 |
| `UNAUTHORIZED` | 인증 실패 |
| `FORBIDDEN` | 권한 없음 |
| `NOT_FOUND` | 리소스 없음 |
| `VALIDATION_ERROR` | 검증 실패 |
| `PROBATION_PERIOD` | 수습 기간 제한 |
| `HOLIDAY_WEEK` | 공휴일 포함 주 |
| `SAME_WEEK_REQUIRED` | 같은 주 필요 |
| `DUPLICATE_REQUEST` | 중복 요청 |

### 2.4 날짜 형식

모든 날짜는 `YYYY-MM-DD` 형식을 사용합니다.

예: `2025-01-15`

### 2.5 요일 번호

| 번호 | 요일 |
|------|------|
| 1 | 월요일 |
| 2 | 화요일 |
| 3 | 수요일 |
| 4 | 목요일 |
| 5 | 금요일 |

---

## 3. API 엔드포인트

### 3.1 초기 설정 API

#### 3.1.1 4일제 설정 상태 확인

**엔드포인트**: `GET /api/staff/work-schedules/my-status`

**설명**: 현재 사용자의 4일제 설정 상태를 확인합니다.

**권한**: `EMPLOYEE` (본인만)

**응답**:
```json
{
  "success": true,
  "data": {
    "initial_choice_completed": true,
    "user": {
      "email": "user@example.com",
      "name": "김철수",
      "hire_date": "2024-10-01",
      "work_schedule": "4_DAY",
      "work_days": {
        "base_off_day": 5,
        "cycle_start_date": "2025-01-06",
        "initial_selection_date": "2025-01-06"
      }
    },
    "current_cycle": {
      "week_range": "1-4주차",
      "off_day": 5,
      "off_day_name": "금요일",
      "cycle_start_date": "2025-01-06",
      "next_cycle_date": "2025-02-03",
      "next_off_day": 4,
      "next_off_day_name": "목요일"
    }
  }
}
```

**에러 응답**:
```json
{
  "success": false,
  "message": "사용자 정보를 찾을 수 없습니다.",
  "code": "NOT_FOUND"
}
```

---

#### 3.1.2 초기 휴무일 선택 저장

**엔드포인트**: `POST /api/staff/work-schedules/save-initial-choice`

**설명**: 사용자가 처음으로 4일제를 선택할 때 초기 휴무일을 저장합니다.

**권한**: `EMPLOYEE` (본인만)

**요청 Body**:
```json
{
  "off_day": 5,
  "work_days": {
    "1": "full",
    "2": "full",
    "3": "full",
    "4": "full",
    "5": "off"
  }
}
```

**요청 필드**:
- `off_day` (number, required): 초기 휴무일 (1-5)
- `work_days` (object, required): 주간 근무 패턴
  - `1-5`: `"full"` (종일) 또는 `"off"` (휴무)

**응답**:
```json
{
  "success": true,
  "data": {
    "message": "초기 휴무일이 저장되었습니다.",
    "work_days": {
      "base_off_day": 5,
      "cycle_start_date": "2025-01-06",
      "initial_selection_date": "2025-01-06"
    }
  }
}
```

**에러 응답**:
```json
{
  "success": false,
  "message": "이미 초기 선택이 완료되었습니다.",
  "code": "DUPLICATE_REQUEST"
}
```

```json
{
  "success": false,
  "message": "수습 기간 중에는 4일제를 선택할 수 없습니다.",
  "code": "PROBATION_PERIOD"
}
```

---

### 3.2 스케줄 조회 API

#### 3.2.1 내 스케줄 조회

**엔드포인트**: `GET /api/staff/work-schedules/my-schedule/:year/:month`

**설명**: 특정 년월의 개인 스케줄을 조회합니다. 4주 주기 반대 방향 순환을 반영합니다.

**권한**: `EMPLOYEE` (본인만)

**URL 파라미터**:
- `year` (number): 년도 (예: 2025)
- `month` (number): 월 (1-12)

**응답**:
```json
{
  "success": true,
  "data": {
    "year": 2025,
    "month": 1,
    "user": {
      "email": "user@example.com",
      "name": "김철수",
      "hire_date": "2024-10-01",
      "work_schedule": "4_DAY",
      "work_days": {
        "base_off_day": 5,
        "cycle_start_date": "2025-01-06",
        "initial_selection_date": "2025-01-06"
      }
    },
    "current_cycle": {
      "week_range": "1-4주차",
      "off_day": 5,
      "off_day_name": "금요일",
      "cycle_start_date": "2025-01-06",
      "next_cycle_date": "2025-02-03",
      "next_off_day": 4,
      "next_off_day_name": "목요일"
    },
    "schedule": {
      "work_days": {
        "1": "full",
        "2": "full",
        "3": "full",
        "4": "full",
        "5": "off"
      },
      "total_hours": 32,
      "work_days_count": 4
    },
    "temporary_changes": [],
    "half_day_list": [
      {
        "id": 1,
        "start_date": "2025-01-15T00:00:00Z",
        "leave_type": "HALF_AM",
        "reason": "병원 방문"
      }
    ],
    "holidays": [
      {
        "date": "2025-01-01",
        "name": "신정"
      }
    ],
    "is_probation": false,
    "has_holiday_in_week": false
  }
}
```

**에러 응답**:
```json
{
  "success": false,
  "message": "스케줄을 조회할 수 없습니다.",
  "code": "NOT_FOUND"
}
```

---

### 3.3 반차 신청 API

#### 3.3.1 반차 신청

**엔드포인트**: `POST /api/staff/work-schedules/apply-half-day`

**설명**: 반차를 신청합니다. 같은 주(월~일) 내에서만 사용 가능합니다.

**권한**: `EMPLOYEE` (본인만)

**요청 Body**:
```json
{
  "half_day_date": "2025-01-15",
  "half_day_type": "HALF_AM",
  "reason": "병원 방문"
}
```

**요청 필드**:
- `half_day_date` (string, required): 반차 날짜 (YYYY-MM-DD)
- `half_day_type` (string, required): 반차 종류
  - `"HALF_AM"`: 오전 반차
  - `"HALF_PM"`: 오후 반차
- `reason` (string, required): 사유

**응답**:
```json
{
  "success": true,
  "data": {
    "message": "반차 신청이 완료되었습니다.",
    "leave_id": 123
  }
}
```

**에러 응답**:
```json
{
  "success": false,
  "message": "반차는 같은 주(월~일) 내에서만 사용 가능합니다.",
  "code": "SAME_WEEK_REQUIRED"
}
```

```json
{
  "success": false,
  "message": "공휴일 포함 주에는 반차를 분할할 수 없습니다.",
  "code": "HOLIDAY_WEEK"
}
```

```json
{
  "success": false,
  "message": "수습 기간 중에는 반차를 신청할 수 없습니다.",
  "code": "PROBATION_PERIOD"
}
```

```json
{
  "success": false,
  "message": "이미 반차가 신청된 날짜입니다.",
  "code": "DUPLICATE_REQUEST"
}
```

---

### 3.4 일시적 변경 API

#### 3.4.1 일시적 휴무일 변경 요청

**엔드포인트**: `POST /api/staff/work-schedules/temporary-change`

**설명**: 특정 주의 휴무일을 일시적으로 변경 요청합니다.

**권한**: `EMPLOYEE` (본인만)

**요청 Body**:
```json
{
  "week_start_date": "2025-01-13",
  "temporary_off_day": 2,
  "reason": "개인 사정으로 인한 일시적 변경",
  "substitute_employee": "lee@example.com"
}
```

**요청 필드**:
- `week_start_date` (string, required): 변경할 주의 월요일 날짜 (YYYY-MM-DD)
- `temporary_off_day` (number, required): 변경할 휴무일 (1-5)
- `reason` (string, required): 변경 사유
- `substitute_employee` (string, optional): 업무 대체자 이메일

**응답**:
```json
{
  "success": true,
  "data": {
    "message": "일시적 변경 요청이 완료되었습니다.",
    "change_id": 1,
    "status": "PENDING"
  }
}
```

**에러 응답**:
```json
{
  "success": false,
  "message": "수습 기간 중에는 일시적 변경이 불가합니다.",
  "code": "PROBATION_PERIOD"
}
```

```json
{
  "success": false,
  "message": "공휴일 포함 주에는 일시적 변경이 불가합니다.",
  "code": "HOLIDAY_WEEK"
}
```

```json
{
  "success": false,
  "message": "원래 휴무일과 동일합니다.",
  "code": "VALIDATION_ERROR"
}
```

```json
{
  "success": false,
  "message": "이미 해당 주에 변경 요청이 있습니다.",
  "code": "DUPLICATE_REQUEST"
}
```

---

#### 3.4.2 내 변경 요청 목록 조회

**엔드포인트**: `GET /api/staff/work-schedules/my-change-requests`

**설명**: 내가 요청한 일시적 변경 목록을 조회합니다.

**권한**: `EMPLOYEE` (본인만)

**쿼리 파라미터**:
- `status` (string, optional): 상태 필터 (`PENDING`, `APPROVED`, `REJECTED`)
- `year` (number, optional): 년도 필터
- `month` (number, optional): 월 필터

**응답**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "week_start_date": "2025-01-13",
      "original_off_day": 5,
      "original_off_day_name": "금요일",
      "temporary_off_day": 2,
      "temporary_off_day_name": "화요일",
      "reason": "개인 사정",
      "status": "PENDING",
      "requested_at": "2025-01-10T10:00:00Z",
      "approved_at": null,
      "approved_by": null,
      "notes": null
    }
  ]
}
```

---

### 3.5 승인 관리 API

#### 3.5.1 승인 대기 목록 조회

**엔드포인트**: `GET /api/staff/work-schedules/pending-changes`

**설명**: 승인 대기 중인 일시적 변경 요청 목록을 조회합니다. (팀장용)

**권한**: `DEPT_MANAGER` 또는 `SYSTEM_ADMIN`

**쿼리 파라미터**:
- `department_id` (number, optional): 부서 필터
- `year` (number, optional): 년도 필터
- `month` (number, optional): 월 필터

**응답**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_email": "kim@example.com",
      "user_name": "김철수",
      "department_name": "개발팀",
      "week_start_date": "2025-01-13",
      "original_off_day": 5,
      "original_off_day_name": "금요일",
      "temporary_off_day": 2,
      "temporary_off_day_name": "화요일",
      "reason": "개인 사정",
      "substitute_employee": "lee@example.com",
      "substitute_employee_name": "이영희",
      "status": "PENDING",
      "requested_at": "2025-01-10T10:00:00Z"
    }
  ]
}
```

**에러 응답**:
```json
{
  "success": false,
  "message": "권한이 없습니다.",
  "code": "FORBIDDEN"
}
```

---

#### 3.5.2 변경 요청 승인/거부

**엔드포인트**: `POST /api/staff/work-schedules/approve-change/:changeId`

**설명**: 일시적 변경 요청을 승인하거나 거부합니다. (팀장용)

**권한**: `DEPT_MANAGER` 또는 `SYSTEM_ADMIN`

**URL 파라미터**:
- `changeId` (number): 변경 요청 ID

**요청 Body**:
```json
{
  "action": "approve",
  "notes": "승인 완료"
}
```

**요청 필드**:
- `action` (string, required): 동작 (`"approve"` 또는 `"reject"`)
- `notes` (string, optional): 메모

**응답**:
```json
{
  "success": true,
  "data": {
    "message": "변경 요청이 승인되었습니다.",
    "change_id": 1,
    "status": "APPROVED"
  }
}
```

**에러 응답**:
```json
{
  "success": false,
  "message": "변경 요청을 찾을 수 없습니다.",
  "code": "NOT_FOUND"
}
```

```json
{
  "success": false,
  "message": "이미 처리된 요청입니다.",
  "code": "DUPLICATE_REQUEST"
}
```

```json
{
  "success": false,
  "message": "권한이 없습니다.",
  "code": "FORBIDDEN"
}
```

---

### 3.6 유틸리티 API

#### 3.6.1 휴무일 계산

**엔드포인트**: `GET /api/staff/work-schedules/calculate-off-day`

**설명**: 특정 날짜의 휴무일을 계산합니다.

**권한**: `EMPLOYEE` (본인만)

**쿼리 파라미터**:
- `date` (string, required): 계산 대상 날짜 (YYYY-MM-DD)

**응답**:
```json
{
  "success": true,
  "data": {
    "target_date": "2025-01-15",
    "off_day": 2,
    "off_day_name": "화요일",
    "cycle_week": 1,
    "cycle_start_date": "2025-01-06",
    "next_cycle_date": "2025-02-03"
  }
}
```

**응답 필드**:
- `target_date`: 계산 대상 날짜
- `off_day`: 휴무일 번호 (1-5)
- `off_day_name`: 휴무일 이름
- `cycle_week`: 현재 주기가 시작된 지 몇 주째인지 (1-4)
- `cycle_start_date`: 현재 주기 시작일
- `next_cycle_date`: 다음 주기 시작일

**에러 응답**:
```json
{
  "success": false,
  "message": "날짜 형식이 올바르지 않습니다.",
  "code": "VALIDATION_ERROR"
}
```

---

## 4. 데이터 모델

### 4.1 work_days 필드 구조

```json
{
  "base_off_day": 5,
  "cycle_start_date": "2025-01-06",
  "initial_selection_date": "2025-01-06"
}
```

### 4.2 schedule_changes 테이블 구조

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | INT | 변경 요청 ID |
| `user_id` | VARCHAR | 사용자 이메일 |
| `week_start_date` | DATE | 변경할 주의 월요일 |
| `original_off_day` | INT | 원래 휴무일 (1-5) |
| `temporary_off_day` | INT | 변경할 휴무일 (1-5) |
| `reason` | TEXT | 변경 사유 |
| `substitute_employee` | VARCHAR | 대체자 이메일 (NULL 가능) |
| `status` | ENUM | 상태 (`PENDING`, `APPROVED`, `REJECTED`) |
| `requested_at` | DATETIME | 요청 일시 |
| `approved_at` | DATETIME | 승인/거부 일시 (NULL 가능) |
| `approved_by` | VARCHAR | 승인자 이메일 (NULL 가능) |
| `notes` | TEXT | 메모 (NULL 가능) |

---

## 5. 비즈니스 로직

### 5.1 4주 주기 반대 방향 순환

- 4주(28일)마다 한 요일씩 역방향으로 이동
- 순환 방향: 금(5) → 목(4) → 수(3) → 화(2) → 월(1) → 금(5)
- 주 시작일(월요일) 기준으로 계산

### 5.2 반차 제한 사항

- 같은 주(월~일) 내에서만 사용 가능
- 공휴일 포함 주에는 반차 분할 불가
- 수습 기간 중에는 반차 신청 불가

### 5.3 일시적 변경 제한 사항

- 수습 기간 중에는 일시적 변경 불가
- 공휴일 포함 주에는 일시적 변경 불가
- 원래 휴무일과 동일한 요일로 변경 불가
- 같은 주에 중복 요청 불가

### 5.4 수습 기간 체크

- 입사일로부터 3개월 미만인 경우 수습 기간
- 수습 기간 중에는 4일제 선택 불가, 반차 신청 불가, 일시적 변경 불가

---

## 6. 예제 시나리오

### 시나리오 1: 초기 휴무일 선택

1. 사용자가 처음 4일제를 선택
2. `POST /api/staff/work-schedules/save-initial-choice` 호출
3. `work_days` 필드에 초기 선택 정보 저장
4. `cycle_start_date`를 선택일로 설정

### 시나리오 2: 반차 신청

1. 사용자가 반차 신청
2. 같은 주 검증 수행
3. 공휴일 포함 주 체크
4. 수습 기간 체크
5. 중복 체크
6. 반차 저장

### 시나리오 3: 일시적 변경 요청

1. 사용자가 일시적 변경 요청
2. 수습 기간 체크
3. 공휴일 포함 주 체크
4. 원래 휴무일과 다른지 확인
5. 중복 요청 체크
6. `schedule_changes` 테이블에 저장 (상태: `PENDING`)
7. 팀장에게 알림 (선택)

### 시나리오 4: 승인 처리

1. 팀장이 승인 대기 목록 조회
2. 승인/거부 처리
3. 승인 시 `work_schedules` 테이블 업데이트
4. 상태를 `APPROVED` 또는 `REJECTED`로 변경

---

## 7. 마이그레이션 고려사항

### 7.1 기존 데이터 처리

- 기존 `work_schedules` 데이터는 유지
- 새로운 `work_days` 필드 추가
- 기존 데이터는 마이그레이션 스크립트로 변환

### 7.2 하위 호환성

- 기존 API 응답 형식은 최대한 유지
- 새로운 필드는 선택적으로 추가

---

**문서 버전**: 1.0  
**최종 업데이트**: 2025-01-XX


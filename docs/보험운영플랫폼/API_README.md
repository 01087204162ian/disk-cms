# 보험 운영 플랫폼 - 티켓 시스템 API 문서

## 개요

업무티켓 중심 통합형 CMS의 Phase 1 구현입니다. 모든 업무는 티켓으로 관리되며, 모든 액션은 불변 로그로 기록됩니다.

## 기본 정보

- **Base URL**: `/api/tickets`, `/api/approvals`
- **인증**: 세션 기반 (모든 API는 로그인 필요)
- **데이터베이스**: `insurance_cms` (스키마 v1)

## 티켓 API

### 1. 티켓 생성

**POST** `/api/tickets`

티켓을 생성하고 자동으로 티켓 번호를 발급합니다.

**Request Body:**
```json
{
  "ticket_type_code": "SETTLE",
  "title": "정산 처리 요청",
  "description": "2025년 1월 정산 처리",
  "contract_id": 1,
  "owner_id": "user@example.com",
  "priority": "high",
  "due_date": "2026-01-15",
  "amount": 1000000,
  "severity": "P1",
  "sensitivity_level": "NORMAL"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "ticket_number": "SETTLE-20260101-0001",
    "ticket_type_code": "SETTLE",
    "title": "정산 처리 요청",
    "status": "NEW",
    "creator_id": "creator@example.com",
    "created_at": "2026-01-01T00:00:00.000Z"
  }
}
```

**필수 필드:**
- `ticket_type_code`: 티켓 유형 (SETTLE, CLAIM, ACCIDENT 등)
- `title`: 티켓 제목

**자동 생성:**
- `ticket_number`: `{TYPE}-{YYYYMMDD}-{SEQ4}` 형식
- `status`: 기본값 `NEW`
- `creator_id`: 세션에서 자동 설정
- Activity Log: `STATUS_CHANGE` 타입으로 생성 이벤트 기록

---

### 2. 티켓 목록 조회

**GET** `/api/tickets`

필터링 옵션을 지원하는 티켓 목록을 조회합니다.

**Query Parameters:**
- `status`: 상태 필터 (NEW, ASSIGNED, IN_PROGRESS, REVIEW, DONE, ARCHIVED)
- `ticket_type`: 티켓 유형 필터
- `contract_id`: 계약 ID 필터
- `owner_id`: 담당자 이메일 필터
- `start_date`: 시작 날짜 (YYYY-MM-DD)
- `end_date`: 종료 날짜 (YYYY-MM-DD)
- `limit`: 페이지 크기 (기본값: 50)
- `offset`: 오프셋 (기본값: 0)

**Example:**
```
GET /api/tickets?status=NEW&ticket_type=SETTLE&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "ticket_number": "SETTLE-20260101-0001",
      "title": "정산 처리",
      "status": "NEW",
      "creator_name": "홍길동",
      "owner_name": "김철수"
    }
  ],
  "count": 1
}
```

---

### 3. 티켓 상세 조회

**GET** `/api/tickets/:id`

티켓 상세 정보와 관련 데이터를 모두 조회합니다.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "ticket_number": "SETTLE-20260101-0001",
    "title": "정산 처리",
    "status": "NEW",
    "checklists": [
      {
        "id": 1,
        "item_text": "문서 검토",
        "is_checked": false,
        "required": true
      }
    ],
    "collaborators": [
      {
        "id": 1,
        "collaborator_id": "user@example.com",
        "collaborator_name": "사용자",
        "approval_status": "PENDING"
      }
    ],
    "approvals": [
      {
        "id": 1,
        "approver_id": "manager@example.com",
        "approver_name": "팀장",
        "status": "PENDING",
        "approval_level": 1
      }
    ],
    "activity_logs": [
      {
        "id": 1,
        "activity_type": "STATUS_CHANGE",
        "user_name": "홍길동",
        "description": "티켓 생성됨",
        "created_at": "2026-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

---

### 4. 티켓 상태 변경

**PATCH** `/api/tickets/:id/status`

티켓 상태를 변경합니다.

**Request Body:**
```json
{
  "status": "IN_PROGRESS"
}
```

**상태 전환 규칙:**

1. **IN_PROGRESS 상태:**
   - `owner_id`만 티켓 수정 가능
   - 다른 사용자는 수정 불가 (403 에러)

2. **REVIEW → DONE 전환:**
   - 모든 필수 체크리스트 완료 필요
   - `manager_verified_by` 필수
   - 모든 승인 완료 필요 (completion_rule에 따라)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "IN_PROGRESS",
    ...
  }
}
```

**자동 처리:**
- `REVIEW` 상태로 변경 시 승인 인스턴스 자동 생성
- Activity Log 자동 기록

---

## 체크리스트 API

### 1. 체크리스트 초기화

**POST** `/api/tickets/:id/checklists/init`

티켓 유형에 맞는 기본 체크리스트 템플릿을 적용합니다.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "item_text": "문서 검토",
      "item_order": 1,
      "required": true,
      "is_checked": false
    }
  ]
}
```

---

### 2. 체크리스트 항목 체크/해제

**PATCH** `/api/tickets/:id/checklists/:item_id`

체크리스트 항목을 체크하거나 해제합니다.

**Request Body:**
```json
{
  "is_checked": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "is_checked": 1,
    "checked_by": "user@example.com",
    "checked_at": "2026-01-01T00:00:00.000Z"
  }
}
```

**자동 처리:**
- Activity Log: `CHECKLIST_CHECK` 타입으로 기록

---

## 협업자 API

### 1. 협업자 추가

**POST** `/api/tickets/:id/collaborators`

티켓에 협업자를 추가합니다.

**Request Body:**
```json
{
  "collaborator_id": "user@example.com"
}
```

**권한:**
- `owner_id` 또는 관리자만 추가 가능

**자동 처리:**
- `sensitivity_level = SENSITIVE`인 경우 `requires_approval = true`
- Activity Log: `COLLABORATOR_ADD` 타입으로 기록

---

### 2. 협업자 제거

**DELETE** `/api/tickets/:id/collaborators/:email`

티켓에서 협업자를 제거합니다.

**자동 처리:**
- Activity Log: `COLLABORATOR_REMOVE` 타입으로 기록

---

## 승인 API

### 1. 승인/거부 처리

**PATCH** `/api/approvals/:instance_id`

승인 인스턴스를 승인하거나 거부합니다.

**Request Body:**
```json
{
  "action": "APPROVE",
  "comment": "승인합니다"
}
```

**제약사항:**
- 본인의 승인만 처리 가능
- 이미 처리된 승인은 변경 불가
- 한 번 처리되면 변경 불가

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "APPROVED",
    "approved_at": "2026-01-01T00:00:00.000Z"
  }
}
```

**자동 처리:**
- Activity Log: `APPROVAL` 또는 `REJECTION` 타입으로 기록

---

### 2. 대기 중인 승인 목록

**GET** `/api/approvals/pending`

현재 사용자의 대기 중인 승인 목록을 조회합니다.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "ticket_id": 1,
      "ticket_number": "SETTLE-20260101-0001",
      "ticket_title": "정산 처리",
      "status": "PENDING",
      "approval_level": 1
    }
  ]
}
```

---

## 티켓 라이프사이클

```
NEW
  ↓ (담당자 배정)
ASSIGNED
  ↓ (작업 시작)
IN_PROGRESS (락: owner만 수정 가능)
  ↓ (검토 요청)
REVIEW
  ↓ (승인 인스턴스 자동 생성)
  ↓ (모든 승인 완료 + 체크리스트 완료 + 팀장 검증)
DONE
  ↓ (보관)
ARCHIVED
```

---

## 승인 워크플로우

### 승인 규칙 매칭

티켓이 `REVIEW` 상태로 변경되면:

1. `approval_rules` 테이블에서 규칙 매칭:
   - `ticket_type` (또는 `*`)
   - `amount` 범위
   - `sensitivity_level`
   - `severity`
   - `priority` 순서

2. 매칭된 규칙의 `approver_roles` (JSON 배열)에서 역할별 사용자 조회

3. `ticket_approval_instances`에 승인 인스턴스 생성

### 승인 완료 조건

- **PARALLEL + ALL**: 모든 승인자 승인 필요
- **PARALLEL + ANY_ONE**: 한 명만 승인하면 됨
- **SEQUENTIAL + ALL**: 순차적으로 모든 승인 필요

### DONE 전환 조건

1. 모든 필수 체크리스트 완료
2. `manager_verified_by` 설정됨
3. 모든 승인 완료 (규칙에 따라)

---

## Activity Log

모든 사용자 액션은 `ticket_activity_logs`에 자동 기록됩니다.

**Activity Types:**
- `STATUS_CHANGE`: 상태 변경
- `COMMENT`: 댓글
- `CHECKLIST_CHECK`: 체크리스트 체크
- `APPROVAL`: 승인
- `REJECTION`: 거부
- `COLLABORATOR_ADD`: 협업자 추가
- `COLLABORATOR_REMOVE`: 협업자 제거
- 기타...

**특징:**
- Append-only (UPDATE/DELETE 불가)
- DB 트리거로 보호
- `user_name` 스냅샷 저장 (감사 목적)

---

## 에러 처리

모든 API는 다음 형식의 에러 응답을 반환합니다:

```json
{
  "success": false,
  "message": "에러 메시지"
}
```

**HTTP 상태 코드:**
- `200`: 성공
- `201`: 생성 성공
- `400`: 잘못된 요청
- `401`: 인증 필요
- `403`: 권한 없음
- `404`: 리소스 없음
- `500`: 서버 오류

---

## 주의사항

1. **스키마 수정 금지**: DB 스키마는 절대 수정하지 마세요.
2. **물리 삭제 금지**: partners/customers/users는 삭제하지 않고 `is_active=0`으로 비활성화
3. **Activity Log 불변**: 로그는 수정/삭제 불가
4. **승인 인스턴스 불변**: 생성된 승인 인스턴스는 규칙 변경과 무관하게 유지

---

## 테스트

### 티켓 생성 테스트

```bash
curl -X POST http://localhost:3000/api/tickets \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=..." \
  -d '{
    "ticket_type_code": "SETTLE",
    "title": "테스트 티켓",
    "description": "테스트 설명"
  }'
```

### 티켓 목록 조회

```bash
curl http://localhost:3000/api/tickets?status=NEW
```

---

**문서 버전**: 1.0  
**최종 업데이트**: 2026-01-01


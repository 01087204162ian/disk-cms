# 보험 운영 플랫폼 - 단계별 테스트 가이드

이 문서는 IMPLEMENTATION_LOG.md의 테스트 체크리스트를 하나씩 단계별로 진행할 수 있도록 도와주는 가이드입니다.

---

## 📋 테스트 전 준비사항

### 1. 서버 실행 확인
```bash
cd disk-cms
npm run dev
```

서버가 `https://disk-cms.simg.kr`에서 실행 중인지 확인하세요.

### 2. 데이터베이스 준비 확인

다음 SQL을 실행하여 필요한 데이터가 있는지 확인:

```sql
-- 1. 체크리스트 템플릿 확인
SELECT * FROM checklist_templates WHERE is_default = 1;

-- 2. 승인 규칙 확인
SELECT * FROM approval_rules WHERE is_active = 1;

-- 3. DEPT_MANAGER 역할 사용자 확인 (승인 테스트에 필요)
SELECT email, name, role FROM users 
WHERE role = 'DEPT_MANAGER' AND is_active = 1;

-- 4. ticket_counters 확인
SELECT * FROM ticket_counters ORDER BY date_key DESC, current_seq DESC;
```

**체크리스트 템플릿이 없으면:**
- `docs/보험운영플랫폼/setup_checklist_templates.sql` 파일 실행

**승인 규칙이 없으면:**
- `docs/보험운영플랫폼/setup_approval_rules.sql` 파일 실행 (선택사항)
- 또는 `docs/보험운영플랫폼/schema_v1.sql`에 기본 규칙 포함

### 3. 세션 쿠키 확보

**방법 1: 브라우저에서 로그인**
1. `https://disk-cms.simg.kr/login.html` 접속
2. 로그인
3. F12 → Application → Cookies → `connect.sid` 값 복사

**방법 2: curl로 로그인**
```bash
curl -X POST https://disk-cms.simg.kr/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "your_email@example.com",
    "password": "your_password"
  }'
```

**세션 쿠키 변수 설정 (편의를 위해):**
```bash
# Windows PowerShell
$SESSION_ID = "YOUR_SESSION_ID_HERE"

# Linux/Mac
export SESSION_ID="YOUR_SESSION_ID_HERE"
```

---

## 🧪 단계별 테스트 진행

### ✅ 테스트 1: 티켓 생성

**목표:** 새로운 티켓을 생성하고 티켓 번호가 자동 생성되는지 확인

**테스트 명령어:**
```bash
curl -X POST https://disk-cms.simg.kr/api/tickets \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=$SESSION_ID" \
  -d '{
    "ticket_type_code": "SETTLE",
    "title": "테스트 티켓 - 2026년 1월 정산",
    "description": "단계별 테스트를 위한 테스트 티켓입니다.",
    "priority": "high",
    "amount": 5000000,
    "severity": "P1",
    "sensitivity_level": "NORMAL"
  }' | jq
```

**확인 사항:**
- [ ] `success: true` 응답
- [ ] `ticket_number`가 `SETTLE-YYYYMMDD-XXXX` 형식으로 생성됨
- [ ] `status`가 `NEW`로 설정됨
- [ ] `creator_id`가 현재 로그인한 사용자 이메일과 일치

**티켓 ID 저장 (다음 테스트에 사용):**
```bash
# 응답에서 id 추출 (jq 사용)
TICKET_ID=$(curl -s -X POST https://disk-cms.simg.kr/api/tickets \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=$SESSION_ID" \
  -d '{
    "ticket_type_code": "SETTLE",
    "title": "테스트 티켓",
    "description": "테스트"
  }' | jq -r '.data.id')

echo "생성된 티켓 ID: $TICKET_ID"
```

**예상 응답:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "ticket_number": "SETTLE-20260101-0001",
    "ticket_type_code": "SETTLE",
    "title": "테스트 티켓 - 2026년 1월 정산",
    "status": "NEW",
    "creator_id": "your_email@example.com",
    "created_at": "2026-01-01T00:00:00.000Z"
  }
}
```

---

### ✅ 테스트 2: 티켓 목록 조회

**목표:** 티켓 목록을 조회하고 필터링/페이징이 작동하는지 확인

**테스트 2-1: 전체 목록 조회**
```bash
curl "https://disk-cms.simg.kr/api/tickets" \
  -H "Cookie: connect.sid=$SESSION_ID" | jq
```

**확인 사항:**
- [ ] `success: true` 응답
- [ ] `data` 배열에 티켓 목록이 포함됨
- [ ] `count` 필드에 총 개수가 표시됨

**테스트 2-2: 상태 필터링 (NEW만)**
```bash
curl "https://disk-cms.simg.kr/api/tickets?status=NEW" \
  -H "Cookie: connect.sid=$SESSION_ID" | jq
```

**확인 사항:**
- [ ] 반환된 티켓의 `status`가 모두 `NEW`인지 확인

**테스트 2-3: 티켓 유형 필터링**
```bash
curl "https://disk-cms.simg.kr/api/tickets?ticket_type=SETTLE&limit=10" \
  -H "Cookie: connect.sid=$SESSION_ID" | jq
```

**확인 사항:**
- [ ] 반환된 티켓의 `ticket_type_code`가 모두 `SETTLE`인지 확인
- [ ] `limit` 파라미터가 작동하는지 확인

**예상 응답:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "ticket_number": "SETTLE-20260101-0001",
      "title": "테스트 티켓",
      "status": "NEW",
      "creator_name": "홍길동"
    }
  ],
  "count": 1
}
```

---

### ✅ 테스트 3: 티켓 상세 조회

**목표:** 티켓 상세 정보와 관련 데이터(체크리스트, 협업자, 승인, Activity Log)가 모두 포함되는지 확인

**테스트 명령어:**
```bash
# TICKET_ID 변수에 위에서 생성한 티켓 ID를 설정
curl "https://disk-cms.simg.kr/api/tickets/$TICKET_ID" \
  -H "Cookie: connect.sid=$SESSION_ID" | jq
```

**확인 사항:**
- [ ] `success: true` 응답
- [ ] `checklists` 배열이 포함됨 (비어있을 수 있음)
- [ ] `collaborators` 배열이 포함됨 (비어있을 수 있음)
- [ ] `approvals` 배열이 포함됨 (비어있을 수 있음)
- [ ] `activity_logs` 배열이 포함되고, 티켓 생성 기록이 있음

**예상 응답:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "ticket_number": "SETTLE-20260101-0001",
    "title": "테스트 티켓",
    "status": "NEW",
    "checklists": [],
    "collaborators": [],
    "approvals": [],
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

### ✅ 테스트 4: 상태 변경 (NEW → IN_PROGRESS)

**목표:** 티켓 상태를 IN_PROGRESS로 변경하고, owner만 수정 가능한 락이 작동하는지 확인

**테스트 4-1: 상태 변경**
```bash
curl -X PATCH "https://disk-cms.simg.kr/api/tickets/$TICKET_ID/status" \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=$SESSION_ID" \
  -d '{
    "status": "IN_PROGRESS"
  }' | jq
```

**확인 사항:**
- [ ] `success: true` 응답
- [ ] `status`가 `IN_PROGRESS`로 변경됨
- [ ] Activity Log에 상태 변경 기록이 추가됨

**테스트 4-2: 상세 조회로 상태 확인**
```bash
curl "https://disk-cms.simg.kr/api/tickets/$TICKET_ID" \
  -H "Cookie: connect.sid=$SESSION_ID" | jq '.data.status'
```

**확인 사항:**
- [ ] 출력이 `"IN_PROGRESS"`인지 확인

**예상 응답:**
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

---

### ✅ 테스트 5: 체크리스트 초기화

**목표:** 티켓 유형에 맞는 기본 체크리스트 템플릿을 적용

**테스트 명령어:**
```bash
curl -X POST "https://disk-cms.simg.kr/api/tickets/$TICKET_ID/checklists/init" \
  -H "Cookie: connect.sid=$SESSION_ID" | jq
```

**확인 사항:**
- [ ] `success: true` 응답
- [ ] `data` 배열에 체크리스트 항목들이 포함됨
- [ ] 체크리스트 항목의 `is_checked`가 `false`인지 확인

**주의사항:**
- 체크리스트 템플릿이 없으면 실패합니다
- `checklist_templates` 테이블에 해당 `ticket_type_code`의 `is_default=1` 레코드가 있어야 합니다

**템플릿이 없는 경우:**
```sql
INSERT INTO checklist_templates (ticket_type_code, template_name, items, is_default, created_by)
VALUES (
  'SETTLE',
  '정산 기본 체크리스트',
  '["문서 검토", "승인 확인", "처리 완료"]',
  1,
  'your_email@example.com'
);
```

**예상 응답:**
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
    },
    {
      "id": 2,
      "item_text": "승인 확인",
      "item_order": 2,
      "required": true,
      "is_checked": false
    }
  ]
}
```

---

### ✅ 테스트 6: 체크리스트 체크/해제

**목표:** 체크리스트 항목을 체크하고 Activity Log에 기록되는지 확인

**테스트 6-1: 체크리스트 항목 체크**
```bash
# 위에서 초기화한 체크리스트의 첫 번째 항목 ID를 사용
CHECKLIST_ITEM_ID=1  # 실제 ID로 변경 필요

curl -X PATCH "https://disk-cms.simg.kr/api/tickets/$TICKET_ID/checklists/$CHECKLIST_ITEM_ID" \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=$SESSION_ID" \
  -d '{
    "is_checked": true
  }' | jq
```

**확인 사항:**
- [ ] `success: true` 응답
- [ ] `is_checked`가 `1` 또는 `true`로 변경됨
- [ ] `checked_by`가 현재 사용자 이메일로 설정됨
- [ ] `checked_at`이 현재 시간으로 설정됨
- [ ] Activity Log에 `CHECKLIST_CHECK` 타입 기록이 추가됨

**테스트 6-2: 체크리스트 항목 해제**
```bash
curl -X PATCH "https://disk-cms.simg.kr/api/tickets/$TICKET_ID/checklists/$CHECKLIST_ITEM_ID" \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=$SESSION_ID" \
  -d '{
    "is_checked": false
  }' | jq
```

**확인 사항:**
- [ ] `is_checked`가 `0` 또는 `false`로 변경됨

**예상 응답:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "is_checked": 1,
    "checked_by": "your_email@example.com",
    "checked_at": "2026-01-01T00:00:00.000Z"
  }
}
```

---

### ✅ 테스트 7: 협업자 추가/제거

**목표:** 티켓에 협업자를 추가하고, SENSITIVE 티켓인 경우 승인이 필요한지 확인

**테스트 7-1: 협업자 추가**
```bash
curl -X POST "https://disk-cms.simg.kr/api/tickets/$TICKET_ID/collaborators" \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=$SESSION_ID" \
  -d '{
    "collaborator_id": "other_user@example.com"
  }' | jq
```

**확인 사항:**
- [ ] `success: true` 응답
- [ ] 협업자가 추가됨
- [ ] Activity Log에 `COLLABORATOR_ADD` 타입 기록이 추가됨
- [ ] 티켓의 `sensitivity_level`이 `SENSITIVE`인 경우 `requires_approval`이 `true`로 설정됨

**테스트 7-2: 협업자 목록 확인**
```bash
curl "https://disk-cms.simg.kr/api/tickets/$TICKET_ID" \
  -H "Cookie: connect.sid=$SESSION_ID" | jq '.data.collaborators'
```

**확인 사항:**
- [ ] 추가한 협업자가 목록에 포함됨

**테스트 7-3: 협업자 제거**
```bash
curl -X DELETE "https://disk-cms.simg.kr/api/tickets/$TICKET_ID/collaborators/other_user@example.com" \
  -H "Cookie: connect.sid=$SESSION_ID" | jq
```

**확인 사항:**
- [ ] `success: true` 응답
- [ ] Activity Log에 `COLLABORATOR_REMOVE` 타입 기록이 추가됨

**예상 응답:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "collaborator_id": "other_user@example.com",
    "collaborator_name": "다른 사용자",
    "approval_status": "PENDING"
  }
}
```

---

### ⚠️ 테스트 8: 상태 변경 (IN_PROGRESS → REVIEW)

**목표:** 티켓을 REVIEW 상태로 변경하고, 승인 인스턴스가 자동 생성되는지 확인

**테스트 명령어:**
```bash
curl -X PATCH "https://disk-cms.simg.kr/api/tickets/$TICKET_ID/status" \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=$SESSION_ID" \
  -d '{
    "status": "REVIEW"
  }' | jq
```

**확인 사항:**
- [ ] `success: true` 응답
- [ ] `status`가 `REVIEW`로 변경됨
- [ ] 승인 인스턴스가 자동 생성됨 (아래 확인)

**승인 인스턴스 확인:**
```bash
curl "https://disk-cms.simg.kr/api/tickets/$TICKET_ID" \
  -H "Cookie: connect.sid=$SESSION_ID" | jq '.data.approvals'
```

**확인 사항:**
- [ ] `approvals` 배열에 승인 인스턴스가 포함됨
- [ ] 각 승인 인스턴스의 `status`가 `PENDING`인지 확인
- [ ] `approver_id`가 설정되어 있는지 확인

**주의사항:**
- 승인 인스턴스가 생성되지 않으면:
  1. `approval_rules` 테이블에 매칭되는 규칙이 있는지 확인
  2. 해당 역할(`DEPT_MANAGER` 등)의 사용자가 있는지 확인

**예상 응답:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "REVIEW",
    "approvals": [
      {
        "id": 1,
        "approver_id": "manager@example.com",
        "approver_name": "팀장",
        "status": "PENDING",
        "approval_level": 1
      }
    ]
  }
}
```

---

### ⚠️ 테스트 9: 승인 처리 (APPROVE/REJECT)

**목표:** 승인 인스턴스를 승인하거나 거부하고, Activity Log에 기록되는지 확인

**테스트 9-1: 대기 중인 승인 목록 확인**
```bash
curl "https://disk-cms.simg.kr/api/approvals/pending" \
  -H "Cookie: connect.sid=$SESSION_ID" | jq
```

**확인 사항:**
- [ ] 현재 사용자의 대기 중인 승인 목록이 반환됨
- [ ] 승인 인스턴스 ID 확인

**승인 인스턴스 ID 저장:**
```bash
APPROVAL_ID=$(curl -s "https://disk-cms.simg.kr/api/approvals/pending" \
  -H "Cookie: connect.sid=$SESSION_ID" | jq -r '.data[0].id')

echo "승인 인스턴스 ID: $APPROVAL_ID"
```

**테스트 9-2: 승인 처리**
```bash
# 승인할 사용자로 로그인 필요 (approver_id와 일치하는 사용자)
curl -X PATCH "https://disk-cms.simg.kr/api/approvals/$APPROVAL_ID" \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=$SESSION_ID" \
  -d '{
    "action": "APPROVE",
    "comment": "승인합니다"
  }' | jq
```

**확인 사항:**
- [ ] `success: true` 응답
- [ ] `status`가 `APPROVED`로 변경됨
- [ ] `approved_at`이 설정됨
- [ ] Activity Log에 `APPROVAL` 타입 기록이 추가됨

**테스트 9-3: 거부 처리 (새로운 승인 인스턴스 필요)**
```bash
curl -X PATCH "https://disk-cms.simg.kr/api/approvals/$APPROVAL_ID" \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=$SESSION_ID" \
  -d '{
    "action": "REJECT",
    "comment": "거부합니다"
  }' | jq
```

**확인 사항:**
- [ ] `status`가 `REJECTED`로 변경됨
- [ ] Activity Log에 `REJECTION` 타입 기록이 추가됨

**예상 응답:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "APPROVED",
    "approved_at": "2026-01-01T00:00:00.000Z",
    "comment": "승인합니다"
  }
}
```

---

### ⚠️ 테스트 10: 상태 변경 (REVIEW → DONE)

**목표:** 모든 조건을 충족한 후 DONE 상태로 변경

**전제 조건 확인:**
1. 모든 필수 체크리스트 완료
2. `manager_verified_by` 설정 (팀장 검증)
3. 모든 승인 완료

**테스트 10-1: 전제 조건 확인**
```bash
curl "https://disk-cms.simg.kr/api/tickets/$TICKET_ID" \
  -H "Cookie: connect.sid=$SESSION_ID" | jq '{
    checklists: .data.checklists,
    manager_verified_by: .data.manager_verified_by,
    approvals: .data.approvals
  }'
```

**확인 사항:**
- [ ] 모든 필수 체크리스트의 `is_checked`가 `true`인지 확인
- [ ] `manager_verified_by`가 설정되어 있는지 확인
- [ ] 모든 승인의 `status`가 `APPROVED`인지 확인

**팀장 검증 설정 (DB에서 직접 설정 또는 별도 API 필요):**
```sql
UPDATE tickets 
SET manager_verified_by = 'manager@example.com',
    manager_verified_at = NOW()
WHERE id = $TICKET_ID;
```

**테스트 10-2: DONE 상태로 변경**
```bash
curl -X PATCH "https://disk-cms.simg.kr/api/tickets/$TICKET_ID/status" \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=$SESSION_ID" \
  -d '{
    "status": "DONE"
  }' | jq
```

**확인 사항:**
- [ ] `success: true` 응답
- [ ] `status`가 `DONE`으로 변경됨
- [ ] Activity Log에 상태 변경 기록이 추가됨

**검증 실패 시:**
- 체크리스트 미완료: "모든 필수 체크리스트를 완료해야 합니다."
- 팀장 검증 없음: "팀장 검증이 필요합니다."
- 승인 미완료: "모든 승인이 완료되어야 합니다."

**예상 응답:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "DONE",
    ...
  }
}
```

---

### ✅ 테스트 11: Activity Log 확인

**목표:** 모든 액션이 Activity Log에 기록되는지 확인

**테스트 명령어:**
```bash
curl "https://disk-cms.simg.kr/api/tickets/$TICKET_ID" \
  -H "Cookie: connect.sid=$SESSION_ID" | jq '.data.activity_logs'
```

**확인 사항:**
- [ ] 티켓 생성 기록 (`STATUS_CHANGE`)
- [ ] 상태 변경 기록들 (`STATUS_CHANGE`)
- [ ] 체크리스트 체크 기록 (`CHECKLIST_CHECK`)
- [ ] 협업자 추가/제거 기록 (`COLLABORATOR_ADD`, `COLLABORATOR_REMOVE`)
- [ ] 승인/거부 기록 (`APPROVAL`, `REJECTION`)

**예상 응답:**
```json
{
  "activity_logs": [
    {
      "id": 1,
      "activity_type": "STATUS_CHANGE",
      "user_name": "홍길동",
      "description": "티켓 생성됨",
      "created_at": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 2,
      "activity_type": "STATUS_CHANGE",
      "user_name": "홍길동",
      "description": "상태가 NEW에서 IN_PROGRESS로 변경됨",
      "created_at": "2026-01-01T01:00:00.000Z"
    }
  ]
}
```

---

## 🔍 에러 처리 테스트

### 테스트 12: 401 Unauthorized (로그인 필요)

**목표:** 세션 쿠키 없이 API 호출 시 401 에러 반환 확인

```bash
curl -X POST "https://disk-cms.simg.kr/api/tickets" \
  -H "Content-Type: application/json" \
  -d '{
    "ticket_type_code": "SETTLE",
    "title": "테스트"
  }' | jq
```

**확인 사항:**
- [ ] `success: false` 응답
- [ ] HTTP 상태 코드가 `401`인지 확인
- [ ] 에러 메시지가 적절한지 확인

---

### 테스트 13: 403 Forbidden (권한 없음)

**목표:** 다른 사용자의 티켓을 수정하려고 할 때 403 에러 반환 확인

**테스트 시나리오:**
1. 사용자 A로 티켓 생성
2. 티켓의 `owner_id`를 사용자 A로 설정
3. 사용자 B로 로그인
4. IN_PROGRESS 상태의 티켓을 수정 시도

```bash
# 사용자 B의 세션으로
curl -X PATCH "https://disk-cms.simg.kr/api/tickets/$TICKET_ID" \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=USER_B_SESSION_ID" \
  -d '{
    "title": "수정 시도"
  }' | jq
```

**확인 사항:**
- [ ] `success: false` 응답
- [ ] HTTP 상태 코드가 `403`인지 확인
- [ ] 에러 메시지가 권한 없음을 나타내는지 확인

---

### 테스트 14: 404 Not Found (리소스 없음)

**목표:** 존재하지 않는 티켓 ID로 요청 시 404 에러 반환 확인

```bash
curl "https://disk-cms.simg.kr/api/tickets/99999" \
  -H "Cookie: connect.sid=$SESSION_ID" | jq
```

**확인 사항:**
- [ ] `success: false` 응답
- [ ] HTTP 상태 코드가 `404`인지 확인
- [ ] 에러 메시지가 적절한지 확인

---

### 테스트 15: 400 Bad Request (잘못된 요청)

**목표:** 필수 필드가 누락되거나 잘못된 데이터로 요청 시 400 에러 반환 확인

```bash
# 필수 필드 누락
curl -X POST "https://disk-cms.simg.kr/api/tickets" \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=$SESSION_ID" \
  -d '{
    "title": "제목만 있음"
  }' | jq
```

**확인 사항:**
- [ ] `success: false` 응답
- [ ] HTTP 상태 코드가 `400`인지 확인
- [ ] 에러 메시지가 필수 필드 누락을 나타내는지 확인

---

## 📊 테스트 결과 기록

각 테스트를 완료한 후 아래 체크리스트를 업데이트하세요:

### 기본 기능
- [ ] 테스트 1: 티켓 생성
- [ ] 테스트 2: 티켓 목록 조회
- [ ] 테스트 3: 티켓 상세 조회
- [ ] 테스트 4: 상태 변경 (NEW → IN_PROGRESS)
- [ ] 테스트 5: 체크리스트 초기화
- [ ] 테스트 6: 체크리스트 체크/해제
- [ ] 테스트 7: 협업자 추가/제거
- [ ] 테스트 8: 상태 변경 (IN_PROGRESS → REVIEW)
- [ ] 테스트 9: 승인 처리 (APPROVE/REJECT)
- [ ] 테스트 10: 상태 변경 (REVIEW → DONE)
- [ ] 테스트 11: Activity Log 확인

### 에러 처리
- [ ] 테스트 12: 401 Unauthorized
- [ ] 테스트 13: 403 Forbidden
- [ ] 테스트 14: 404 Not Found
- [ ] 테스트 15: 400 Bad Request

---

## 🐛 문제 해결

### 승인 인스턴스가 생성되지 않음

**원인 확인:**
```sql
-- 승인 규칙 확인
SELECT * FROM approval_rules WHERE is_active = 1;

-- 역할별 사용자 확인
SELECT email, name, role FROM users 
WHERE role IN ('DEPT_MANAGER', 'CFO', 'CEO') 
  AND is_active = 1;
```

**해결 방법:**
1. `approval_rules` 테이블에 매칭되는 규칙이 있는지 확인
2. 해당 역할의 사용자가 있는지 확인
3. 규칙의 조건(`amount`, `sensitivity_level` 등)이 티켓과 일치하는지 확인

---

### 체크리스트 초기화 실패

**원인 확인:**
```sql
SELECT * FROM checklist_templates 
WHERE ticket_type_code = 'SETTLE' AND is_default = 1;
```

**해결 방법:**
- 템플릿이 없으면 `setup_checklist_templates.sql` 실행

---

### DONE 상태로 변경 불가

**원인 확인:**
```sql
-- 티켓 상태 확인
SELECT id, status, manager_verified_by FROM tickets WHERE id = $TICKET_ID;

-- 체크리스트 확인
SELECT * FROM ticket_checklists WHERE ticket_id = $TICKET_ID AND required = 1;

-- 승인 확인
SELECT * FROM ticket_approval_instances WHERE ticket_id = $TICKET_ID;
```

**해결 방법:**
1. 모든 필수 체크리스트 완료
2. `manager_verified_by` 설정
3. 모든 승인 완료

---

## 📝 참고 자료

- **API 문서**: `docs/보험운영플랫폼/API_README.md`
- **테스트 가이드**: `docs/보험운영플랫폼/TEST_GUIDE.md`
- **구현 로그**: `docs/보험운영플랫폼/IMPLEMENTATION_LOG.md`

---

**작성일**: 2026-01-01  
**업데이트**: 테스트 진행 시마다 업데이트


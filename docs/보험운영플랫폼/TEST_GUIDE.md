# 티켓 시스템 API 테스트 가이드

## 1. 서버 실행

### 개발 모드로 실행
```bash
cd disk-cms
npm run dev
```

서버가 `https://disk-cms.simg.kr`에서 실행됩니다.

### 환경 변수 확인
`.env` 파일에 데이터베이스 설정이 있는지 확인:
```
DB_HOST=localhost
DB_USER=cms_user
DB_PASSWORD=your_password
DB_NAME=insurance_cms
DB_PORT=3306
```

---

## 2. 로그인 및 세션 확보

모든 API는 인증이 필요하므로 먼저 로그인해야 합니다.

### 방법 1: 브라우저에서 로그인

1. 브라우저에서 `https://disk-cms.simg.kr/login.html` 접속
2. 로그인 후 브라우저 개발자 도구 (F12) → Application → Cookies에서 `connect.sid` 확인

### 방법 2: API로 로그인

```bash
# 로그인
curl -X POST https://disk-cms.simg.kr/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "your_email@example.com",
    "password": "your_password"
  }'

# 로그인 성공 시 cookies.txt에 세션 쿠키가 저장됨
```

---

## 3. API 테스트 (curl 사용)

### 준비: 세션 쿠키 확인

브라우저에서 로그인 후:
- Chrome: F12 → Application → Cookies → `connect.sid` 값 복사
- 또는 `cookies.txt` 파일 사용

### 3.1 티켓 생성

```bash
curl -X POST https://disk-cms.simg.kr/api/tickets \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION_ID" \
  -d '{
    "ticket_type_code": "SETTLE",
    "title": "2026년 1월 정산 처리",
    "description": "월말 정산 처리 요청",
    "priority": "high",
    "amount": 5000000,
    "severity": "P1",
    "sensitivity_level": "NORMAL"
  }'
```

**예상 응답:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "ticket_number": "SETTLE-20260101-0001",
    "ticket_type_code": "SETTLE",
    "title": "2026년 1월 정산 처리",
    "status": "NEW",
    "creator_id": "your_email@example.com"
  }
}
```

**성공 확인:**
- `ticket_number`가 자동 생성되었는지 확인
- `status`가 `NEW`인지 확인
- Activity Log에 생성 기록이 있는지 확인

---

### 3.2 티켓 목록 조회

```bash
# 전체 목록
curl https://disk-cms.simg.kr/api/tickets \
  -H "Cookie: connect.sid=YOUR_SESSION_ID"

# 필터링 (NEW 상태만)
curl "https://disk-cms.simg.kr/api/tickets?status=NEW" \
  -H "Cookie: connect.sid=YOUR_SESSION_ID"

# 티켓 유형 필터
curl "https://disk-cms.simg.kr/api/tickets?ticket_type=SETTLE&limit=10" \
  -H "Cookie: connect.sid=YOUR_SESSION_ID"
```

---

### 3.3 티켓 상세 조회

```bash
curl https://disk-cms.simg.kr/api/tickets/1 \
  -H "Cookie: connect.sid=YOUR_SESSION_ID"
```

**확인 사항:**
- `checklists`, `collaborators`, `approvals`, `activity_logs` 포함 여부

---

### 3.4 티켓 상태 변경 (NEW → IN_PROGRESS)

```bash
curl -X PATCH https://disk-cms.simg.kr/api/tickets/1/status \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION_ID" \
  -d '{
    "status": "IN_PROGRESS"
  }'
```

**확인 사항:**
- 상태가 `IN_PROGRESS`로 변경되었는지
- Activity Log에 상태 변경 기록이 있는지

---

### 3.5 체크리스트 초기화

```bash
curl -X POST https://disk-cms.simg.kr/api/tickets/1/checklists/init \
  -H "Cookie: connect.sid=YOUR_SESSION_ID"
```

**주의:** 
- 티켓 유형에 맞는 기본 템플릿이 있어야 함
- `checklist_templates` 테이블에 해당 `ticket_type_code`의 `is_default=1` 레코드 필요

**템플릿이 없는 경우:**
```sql
-- 예시: SETTLE 유형의 기본 템플릿 생성
INSERT INTO checklist_templates (ticket_type_code, template_name, items, is_default, created_by)
VALUES (
  'SETTLE',
  '정산 기본 체크리스트',
  '["문서 검토", "승인 확인", "처리 완료"]',
  1,
  'your_email@example.com'
);
```

---

### 3.6 체크리스트 체크

```bash
curl -X PATCH https://disk-cms.simg.kr/api/tickets/1/checklists/1 \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION_ID" \
  -d '{
    "is_checked": true
  }'
```

**확인 사항:**
- `is_checked`가 `1`로 변경되었는지
- `checked_by`, `checked_at`이 설정되었는지
- Activity Log에 기록이 있는지

---

### 3.7 협업자 추가

```bash
curl -X POST https://disk-cms.simg.kr/api/tickets/1/collaborators \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION_ID" \
  -d '{
    "collaborator_id": "other_user@example.com"
  }'
```

**권한 확인:**
- 티켓의 `owner_id`이거나 관리자여야 함
- `SENSITIVE` 티켓인 경우 `requires_approval`이 자동으로 `true`로 설정

---

### 3.8 상태 변경 (IN_PROGRESS → REVIEW)

```bash
curl -X PATCH https://disk-cms.simg.kr/api/tickets/1/status \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION_ID" \
  -d '{
    "status": "REVIEW"
  }'
```

**자동 처리 확인:**
- 승인 인스턴스가 자동 생성되었는지 확인:
```bash
curl https://disk-cms.simg.kr/api/tickets/1 \
  -H "Cookie: connect.sid=YOUR_SESSION_ID" | jq '.data.approvals'
```

---

### 3.9 승인 처리

먼저 대기 중인 승인 목록 확인:
```bash
curl https://disk-cms.simg.kr/api/approvals/pending \
  -H "Cookie: connect.sid=YOUR_SESSION_ID"
```

승인 인스턴스 ID 확인 후:
```bash
curl -X PATCH https://disk-cms.simg.kr/api/approvals/1 \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION_ID" \
  -d '{
    "action": "APPROVE",
    "comment": "승인합니다"
  }'
```

---

### 3.10 상태 변경 (REVIEW → DONE)

**전제 조건:**
1. 모든 필수 체크리스트 완료
2. `manager_verified_by` 설정 (팀장 검증)
3. 모든 승인 완료

**팀장 검증 설정:**
```sql
-- 직접 DB에서 설정 (또는 별도 API 필요)
UPDATE tickets 
SET manager_verified_by = 'manager@example.com',
    manager_verified_at = NOW()
WHERE id = 1;
```

**상태 변경:**
```bash
curl -X PATCH https://disk-cms.simg.kr/api/tickets/1/status \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION_ID" \
  -d '{
    "status": "DONE"
  }'
```

**검증 실패 시:**
- 체크리스트 미완료: "모든 필수 체크리스트를 완료해야 합니다."
- 팀장 검증 없음: "팀장 검증이 필요합니다."
- 승인 미완료: "모든 승인이 완료되어야 합니다."

---

## 4. 통합 테스트 시나리오

### 시나리오 1: 기본 티켓 라이프사이클

```bash
# 1. 티켓 생성
TICKET_ID=$(curl -s -X POST https://disk-cms.simg.kr/api/tickets \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION_ID" \
  -d '{
    "ticket_type_code": "SETTLE",
    "title": "통합 테스트 티켓",
    "description": "전체 플로우 테스트"
  }' | jq -r '.data.id')

echo "생성된 티켓 ID: $TICKET_ID"

# 2. 체크리스트 초기화
curl -X POST https://disk-cms.simg.kr/api/tickets/$TICKET_ID/checklists/init \
  -H "Cookie: connect.sid=YOUR_SESSION_ID"

# 3. 체크리스트 체크
curl -X PATCH https://disk-cms.simg.kr/api/tickets/$TICKET_ID/checklists/1 \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION_ID" \
  -d '{"is_checked": true}'

# 4. 상태 변경: NEW → IN_PROGRESS
curl -X PATCH https://disk-cms.simg.kr/api/tickets/$TICKET_ID/status \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION_ID" \
  -d '{"status": "IN_PROGRESS"}'

# 5. 상태 변경: IN_PROGRESS → REVIEW
curl -X PATCH https://disk-cms.simg.kr/api/tickets/$TICKET_ID/status \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION_ID" \
  -d '{"status": "REVIEW"}'

# 6. 승인 인스턴스 확인
curl https://disk-cms.simg.kr/api/tickets/$TICKET_ID \
  -H "Cookie: connect.sid=YOUR_SESSION_ID" | jq '.data.approvals'

# 7. Activity Log 확인
curl https://disk-cms.simg.kr/api/tickets/$TICKET_ID \
  -H "Cookie: connect.sid=YOUR_SESSION_ID" | jq '.data.activity_logs'
```

---

## 5. Postman 사용 (GUI 도구)

### 5.1 환경 설정

1. Postman 실행
2. 환경 변수 설정:
   - `base_url`: `https://disk-cms.simg.kr`
   - `session_id`: (로그인 후 설정)

### 5.2 요청 예시

**티켓 생성:**
- Method: `POST`
- URL: `{{base_url}}/api/tickets`
- Headers:
  - `Content-Type: application/json`
  - `Cookie: connect.sid={{session_id}}`
- Body (raw JSON):
```json
{
  "ticket_type_code": "SETTLE",
  "title": "테스트 티켓",
  "description": "Postman 테스트"
}
```

**티켓 목록:**
- Method: `GET`
- URL: `{{base_url}}/api/tickets?status=NEW`
- Headers:
  - `Cookie: connect.sid={{session_id}}`

---

## 6. 데이터베이스 직접 확인

### Activity Log 확인
```sql
SELECT * FROM ticket_activity_logs 
WHERE ticket_id = 1 
ORDER BY created_at ASC;
```

### 승인 인스턴스 확인
```sql
SELECT 
  tai.*,
  t.ticket_number,
  t.title,
  u.name as approver_name
FROM ticket_approval_instances tai
JOIN tickets t ON tai.ticket_id = t.id
LEFT JOIN users u ON tai.approver_id = u.email
WHERE tai.ticket_id = 1;
```

### 티켓 번호 카운터 확인
```sql
SELECT * FROM ticket_counters 
WHERE ticket_type_code = 'SETTLE' 
ORDER BY date_key DESC;
```

---

## 7. 일반적인 문제 해결

### 문제 1: 401 Unauthorized
**원인:** 세션 쿠키가 없거나 만료됨  
**해결:** 다시 로그인하여 새 세션 확보

### 문제 2: 404 Not Found (티켓)
**원인:** 티켓 ID가 존재하지 않음  
**해결:** 티켓 목록 조회로 올바른 ID 확인

### 문제 3: 체크리스트 초기화 실패
**원인:** 해당 티켓 유형의 기본 템플릿이 없음  
**해결:** `checklist_templates` 테이블에 기본 템플릿 생성

### 문제 4: 승인 인스턴스가 생성되지 않음
**원인:** 
- `approval_rules` 테이블에 매칭되는 규칙이 없음
- 규칙의 `approver_roles`에 해당하는 사용자가 없음

**해결:**
```sql
-- 승인 규칙 확인
SELECT * FROM approval_rules WHERE is_active = 1;

-- 역할별 사용자 확인
SELECT email, name, role FROM users 
WHERE role IN ('DEPT_MANAGER', 'CFO', 'CEO') 
  AND is_active = 1;
```

### 문제 5: DONE 상태로 변경 불가
**원인:** 전제 조건 미충족
- 필수 체크리스트 미완료
- `manager_verified_by` NULL
- 승인 미완료

**해결:** 각 조건 확인 후 충족

---

## 8. 테스트 체크리스트

- [ ] 티켓 생성 성공
- [ ] 티켓 번호 자동 생성 확인
- [ ] 티켓 목록 조회 (필터링 포함)
- [ ] 티켓 상세 조회 (관련 데이터 포함)
- [ ] 상태 변경 (NEW → IN_PROGRESS → REVIEW)
- [ ] IN_PROGRESS 상태에서 owner만 수정 가능 확인
- [ ] 체크리스트 초기화 및 체크
- [ ] 협업자 추가/제거
- [ ] REVIEW 상태로 변경 시 승인 인스턴스 자동 생성
- [ ] 승인 처리 (APPROVE/REJECT)
- [ ] REVIEW → DONE 전환 조건 검증
- [ ] Activity Log 자동 기록 확인
- [ ] 에러 처리 확인 (401, 403, 404 등)

---

## 9. 디버깅 팁

### 서버 로그 확인
서버 콘솔에서 에러 메시지 확인:
```bash
npm run dev
# 에러가 발생하면 콘솔에 출력됨
```

### 데이터베이스 직접 확인
Workbench나 mysql 클라이언트로 직접 확인:
```sql
-- 최근 티켓 확인
SELECT * FROM tickets ORDER BY id DESC LIMIT 5;

-- 최근 Activity Log 확인
SELECT * FROM ticket_activity_logs 
ORDER BY id DESC LIMIT 10;
```

---

**테스트 환경 준비가 완료되었습니다!** 위의 순서대로 테스트해보세요.


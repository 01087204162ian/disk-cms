# ER 다이어그램 v1 - 보험 운영 플랫폼

## 핵심 관계

```
Partners (보험사/제휴사)
  ↓ (1:N)
Contracts (계약)
  ↓ (1:N)
Tickets (업무 티켓)
  ↓ (1:N)
  ├─ Activity Logs (활동 로그)
  ├─ Approvals (승인)
  ├─ Checklists (체크리스트)
  └─ Collaborators (협업자)
```

---

## 상세 관계 설명

### 1. Partners → Contracts

**관계**: 1:N (한 보험사는 여러 계약을 가짐)

**카디널리티**: 
- Partners: 1
- Contracts: N

**FK**: `contracts.partner_id` → `partners.id`

**비즈니스 규칙**:
- 계약은 반드시 보험사에 귀속
- 보험사 삭제 시 계약은 SET NULL (계약 이력 보존)

---

### 2. Customers → Contracts

**관계**: 1:N (한 고객은 여러 계약을 가짐)

**카디널리티**:
- Customers: 1
- Contracts: N

**FK**: `contracts.customer_id` → `customers.id`

**비즈니스 규칙**:
- 계약은 반드시 고객에 귀속
- 고객 삭제 시 계약은 유지 (계약 이력 보존)

---

### 3. Contracts → Tickets

**관계**: 1:N (한 계약은 여러 티켓을 가짐)

**카디널리티**:
- Contracts: 1
- Tickets: N

**FK**: `tickets.contract_id` → `contracts.id` (NULL 허용)

**비즈니스 규칙**:
- 티켓은 계약에 귀속 (보험 운영 플랫폼)
- 계약 없는 독립 티켓도 가능 (NULL 허용)
- 계약 삭제 시 티켓은 유지 (SET NULL)

---

### 4. Tickets → Activity Logs

**관계**: 1:N (한 티켓은 여러 활동 로그를 가짐)

**카디널리티**:
- Tickets: 1
- Activity Logs: N

**FK**: `ticket_activity_logs.ticket_id` → `tickets.id` (CASCADE)

**비즈니스 규칙**:
- **append-only**: UPDATE/DELETE 불가 (DB 트리거로 차단)
- 티켓 삭제 시 로그도 삭제 (CASCADE)

---

### 5. Tickets → Approvals

**관계**: 1:N (한 티켓은 여러 승인을 가짐)

**카디널리티**:
- Tickets: 1
- Approvals: N

**FK**: `ticket_approvals.ticket_id` → `tickets.id` (CASCADE)

**비즈니스 규칙**:
- 티켓 삭제 시 승인도 삭제 (CASCADE)

---

### 6. Tickets → Checklists

**관계**: 1:N (한 티켓은 여러 체크리스트 항목을 가짐)

**카디널리티**:
- Tickets: 1
- Checklists: N

**FK**: `ticket_checklists.ticket_id` → `tickets.id` (CASCADE)

**비즈니스 규칙**:
- 티켓 삭제 시 체크리스트도 삭제 (CASCADE)

---

### 7. Tickets → Collaborators

**관계**: M:N (한 티켓은 여러 협업자를 가짐, 한 협업자는 여러 티켓에 참여)

**카디널리티**:
- Tickets: 1
- Collaborators: N

**FK**: `ticket_collaborators.ticket_id` → `tickets.id` (CASCADE)
**FK**: `ticket_collaborators.collaborator_id` → `users.email`

**비즈니스 규칙**:
- 티켓 삭제 시 협업자 관계도 삭제 (CASCADE)
- UNIQUE 제약: (ticket_id, collaborator_id)

---

### 8. Ticket Types → Tickets

**관계**: 1:N (한 유형은 여러 티켓을 가짐)

**카디널리티**:
- Ticket Types: 1
- Tickets: N

**FK**: `tickets.ticket_type_code` → `ticket_types.code`

**비즈니스 규칙**:
- 티켓은 반드시 유형을 가짐
- 유형 삭제 불가 (활성 티켓 존재 시)

---

### 9. Approval Workflow → Approvals

**관계**: 1:N (한 워크플로우는 여러 승인을 가짐)

**카디널리티**:
- Approval Workflow: 1
- Approvals: N

**FK**: `ticket_approvals.workflow_id` → `ticket_approval_workflow.id`

**비즈니스 규칙**:
- 승인은 워크플로우 정의에 따라 생성

---

## 엔티티 요약

| 엔티티 | 주요 속성 | 관계 |
|--------|----------|------|
| **Partners** | code, name, partner_type | 1 → N Contracts |
| **Customers** | customer_number, name, phone | 1 → N Contracts |
| **Contracts** | contract_number, partner_id, customer_id, policy_number | 1 → N Tickets |
| **Tickets** | ticket_number, ticket_type_code, contract_id, status, owner_id | 1 → N (Logs/Approvals/Checklists/Collaborators) |
| **Activity Logs** | ticket_id, activity_type, user_id, description | N → 1 Tickets |
| **Approvals** | ticket_id, workflow_id, approver_id, status | N → 1 Tickets, N → 1 Workflow |
| **Checklists** | ticket_id, item_text, is_checked | N → 1 Tickets |
| **Collaborators** | ticket_id, collaborator_id | N → 1 Tickets, N → 1 Users |

---

## Phase2 제외 항목

- **knowledge_items**: 별도 문서만 작성, 테이블은 보류 가능
- **meetings**: Phase2
- **performance**: Phase2

---

**이 ER 다이어그램은 보험 운영 플랫폼의 핵심 관계를 나타냅니다.**


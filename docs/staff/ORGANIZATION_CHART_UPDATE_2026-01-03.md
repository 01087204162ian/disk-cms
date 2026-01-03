# 조직도 기능 구현 및 개선 (2026-01-03)

## 📋 작업 개요

조직도를 동적으로 표시하는 페이지를 생성하고, CEO/CFO를 포함한 계층 구조를 시각화하도록 개선했습니다.

---

## 🎯 주요 작업 내용

### 1. 조직도 페이지 생성

#### 파일 생성
- **HTML**: `disk-cms/public/pages/staff/organization-chart.html`
- **JavaScript**: `disk-cms/public/js/staff/organization-chart.js`
- **CSS**: `disk-cms/public/css/organization-chart.css`

#### 기능
- **계층 구조 표시**: CEO/CFO → 부서 → 부서장 → 팀원
- **필터링**: 부서별 필터, 이름/이메일 검색
- **실시간 통계**: 부서 수, 직원 수 표시
- **직원 상세 정보**: 카드 클릭 시 모달로 상세 정보 표시

---

### 2. API 권한 수정 (모든 사용자 접근 가능)

#### 변경 사항

**부서 목록 API 추가**
- **파일**: `disk-cms/routes/staff/departments.js`
- **엔드포인트**: `GET /api/staff/departments`
- **권한**: 모든 로그인 사용자 (`requireAuth`)
- **설명**: 조직도 표시용 활성 부서 목록 조회

```javascript
router.get('/', requireAuth, async (req, res) => {
    // 활성 부서만 조회
    const query = `
        SELECT d.id, d.name, d.code, d.description, d.manager_id, d.is_active, u.name as manager_name
        FROM departments d
        LEFT JOIN users u ON d.manager_id = u.email
        WHERE d.is_active = 1
        ORDER BY d.name ASC
    `;
    // ...
});
```

**조직도 전용 직원 목록 API 추가**
- **파일**: `disk-cms/routes/staff/employees.js`
- **엔드포인트**: `GET /api/staff/employees/org-chart`
- **권한**: 모든 로그인 사용자 (`requireAuth`)
- **설명**: 조직도 표시용 활성 직원만 조회 (권한순 정렬)

```javascript
router.get('/employees/org-chart', requireAuth, async (req, res) => {
    // 활성 직원만 조회, 권한 순으로 정렬
    // SUPER_ADMIN > SYSTEM_ADMIN > DEPT_MANAGER > EMPLOYEE
});
```

**기존 API와의 차이점**
- 기존 `/api/staff/employees`는 관리자만 접근 가능 (`requireAdmin`)
- 새로운 `/api/staff/employees/org-chart`는 모든 로그인 사용자 접근 가능

---

### 3. 사이드바 메뉴 추가

**파일**: `disk-cms/public/components/sj-sidebar.html`

```html
<a href="/pages/staff/organization-chart.html" class="submenu-item" data-menu="staff-organization-chart">조직도</a>
```

---

### 4. 조직도 UI 고도화

#### CEO/CFO 최상단 표시

**변경 전**
- `SUPER_ADMIN` 역할 중 첫 번째 사람만 표시

**변경 후**
- `SUPER_ADMIN` 역할 중 `position`이 `CEO` 또는 `CFO`인 모든 사람 표시
- CEO가 먼저, 그 다음 CFO 순서로 표시
- 각각 다른 색상으로 구분 (CEO: 보라색, CFO: 녹색)

**JavaScript 변경**
```javascript
// 경영진 분리 및 정렬
this.executives = this.employees.filter(emp => 
    emp.role === 'SUPER_ADMIN' && 
    (emp.position === 'CEO' || emp.position === 'CFO')
).sort((a, b) => {
    if (a.position === 'CEO') return -1;
    if (b.position === 'CEO') return 1;
    if (a.position === 'CFO') return -1;
    if (b.position === 'CFO') return 1;
    return 0;
});
```

#### 시각적 개선
- **CEO 카드**: 보라색 그라데이션 (`#667eea` → `#764ba2`)
- **CFO 카드**: 녹색 그라데이션 (`#11998e` → `#38ef7d`)
- 경영진 섹션과 부서 섹션 사이 연결선 추가

---

### 5. 부서 카드 폭 조정

#### 변경 사항
- 부서 그리드 최소 너비: `320px` → `250px`
- 부서장 카드 패딩: `20px` → `15px`
- 팀원 카드 최소 너비: `140px` → `120px`
- 전체적으로 패딩, 마진, 폰트 크기 감소

**목적**: 화면에 더 많은 부서를 한 번에 표시

---

### 6. CEO/CFO 직책 설정

#### SQL 파일 생성
- **파일**: `disk-cms/database/update-ceo-cfo-positions.sql`

```sql
-- 오성준 → CEO로 업데이트 (현재 "대표자"에서 "CEO"로 변경)
UPDATE users 
SET position = 'CEO',
    updated_at = NOW()
WHERE email = 'sj@simg.kr' AND position = '대표자';
```

**참고**: 박찬호는 이미 `CFO`로 설정되어 있음

---

## 📁 생성/수정된 파일 목록

### 새로 생성된 파일
1. `disk-cms/public/pages/staff/organization-chart.html`
2. `disk-cms/public/js/staff/organization-chart.js`
3. `disk-cms/public/css/organization-chart.css`
4. `disk-cms/database/update-ceo-cfo-positions.sql`
5. `disk-cms/docs/staff/ORGANIZATION_CHART_UPDATE_2026-01-03.md` (이 문서)

### 수정된 파일
1. `disk-cms/routes/staff/departments.js` - 부서 목록 API 추가
2. `disk-cms/routes/staff/employees.js` - 조직도용 직원 목록 API 추가
3. `disk-cms/public/components/sj-sidebar.html` - 조직도 메뉴 추가

---

## 🔍 주요 기술 사항

### 계층 구조 렌더링
1. **경영진 (CEO/CFO)**: 최상단에 개별 카드로 표시
2. **부서**: 그리드 레이아웃으로 나란히 표시
3. **부서장**: 부서 내 첫 번째로 강조 표시
4. **팀원**: 부서장 아래 그리드로 표시

### 필터링 로직
- 경영진(CEO/CFO)은 필터에서 제외되어 항상 표시
- 부서 필터: 선택한 부서의 직원만 표시
- 검색 필터: 이름 또는 이메일로 검색

### 반응형 디자인
- 데스크탑: 다열 그리드 레이아웃
- 태블릿 (1200px 이하): 중간 크기 그리드
- 모바일 (768px 이하): 단일 열 레이아웃

---

## ✅ 테스트 체크리스트

- [x] 조직도 페이지 접근 (모든 로그인 사용자)
- [x] CEO/CFO 최상단 표시
- [x] 부서별 필터링
- [x] 이름/이메일 검색
- [x] 직원 카드 클릭 시 상세 정보 모달 표시
- [x] 반응형 디자인 확인

---

## 🎨 UI/UX 특징

### 시각적 계층
1. **최상단**: CEO, CFO (그라데이션 배경, 큰 아바타)
2. **부서 헤더**: 부서 아이콘, 이름, 코드, 인원수
3. **부서장**: 황금색 테두리, 별 아이콘
4. **팀원**: 깔끔한 카드 레이아웃

### 인터랙션
- 카드 호버 효과 (그림자, 약간 상승)
- 클릭 가능한 카드 (직원 상세 정보 표시)
- 부드러운 애니메이션 (페이드인)

---

## 📝 향후 개선 가능 사항

1. **확대/축소 기능**: 조직도 확대/축소 및 드래그
2. **인쇄 기능**: 조직도 인쇄용 스타일
3. **부서별 정렬**: 부서 이름순, 인원순 정렬
4. **직원 프로필 이미지**: 아바타 대신 실제 프로필 이미지 표시
5. **조직도 다이어그램**: 트리 구조를 더 명확하게 시각화

---

## 🔗 관련 문서

- [직원 관리 시스템 학습 가이드](./STAFF_LEARNING_GUIDE.md)
- [직원 승인 가이드](./EMPLOYEE_APPROVAL_GUIDE.md)

---

**작성일**: 2026-01-03  
**작성자**: AI Assistant  
**버전**: 1.0


# CMS 템플릿 시스템 구현 가이드

## 프로젝트 개요
보험대리점 직원 관리 CMS에서 반복 작업을 방지하고 효율적인 메뉴 관리를 위한 템플릿 시스템 구현

### 목표
- 헤더, 사이드메뉴, 푸터 컴포넌트 재사용
- 로그인 인증 자동화
- 메뉴 상태 관리 (활성화 및 펼침/접힘)
- 기존 dashboard.html 코드 최대한 재활용

## 구현 단계

### 1단계: template-loader.js 구현
**파일 위치**: `js/template-loader.js`

#### 주요 기능
- **인증 체크**: `/api/auth/me` API 호출
- **컴포넌트 로딩**: header, sidebar, footer 병렬 로드
- **메뉴 활성화**: `data-menu` 속성 기반 ID 방식
- **권한 관리**: 관리자 전용 UI 표시/숨김
- **토스트 알림**: dashboard.js와 호환되는 알림 시스템
- **실시간 시계**: 헤더 시간 자동 업데이트

#### 핵심 메서드
```javascript
// 메인 초기화 함수
await window.templateLoader.initializePage('dashboard');

// 토스트 알림 (기존 dashboard.js에서 호출)
window.templateLoader.showToast(message, 'success');

// 관리자 권한 확인
window.templateLoader.isAdmin();
```

### 2단계: Components 구조 생성
**폴더 위치**: `components/`

#### header.html
- 상단 네비게이션 바
- 실시간 시간 표시 (`data-current-time`)
- 알림 드롭다운
- 사용자 정보 표시 (`data-user-name`, `data-user-role`, `data-user-email`)
- 로그아웃 기능

#### sidebar.html
- 계층형 메뉴 구조
- 관리자 전용 메뉴 (`.admin-only` 클래스)
- 메뉴 식별자 (`data-menu` 속성)
- 사용자 프로필 표시

**메뉴 구조 예시**:
```html
<!-- 1단계 메뉴 -->
<li class="nav-item has-treeview">
  <a href="#" class="nav-link" data-menu="attendance">
    <i class="nav-icon fas fa-clock"></i>
    <p>출퇴근 관리<i class="right fas fa-angle-left"></i></p>
  </a>
  <!-- 2단계 메뉴 -->
  <ul class="nav nav-treeview">
    <li class="nav-item">
      <a href="/attendance-status.html" class="nav-link" data-menu="attendance-status">
        <i class="far fa-circle nav-icon"></i>
        <p>출근 현황</p>
      </a>
    </li>
  </ul>
</li>
```

#### footer.html
- 기본 푸터 정보
- 우측 설정 패널 (다크모드, 알림 등)
- 시스템 상태 표시

### 3단계: dashboard.html 수정
**최소한의 수정**으로 템플릿 시스템 적용

#### 추가된 스크립트
```html
<script src="./js/template-loader.js"></script>
```

#### 수정된 초기화 코드
```javascript
// 기존
await initializePage('dashboard');

// 변경 후
await window.templateLoader.initializePage('dashboard');
```

## 메뉴 상태 관리

### 메뉴 활성화 로직
```javascript
setActiveMenu(pageId) {
  // 모든 메뉴에서 active만 제거 (menu-open은 유지)
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
  });

  // 지정된 메뉴 활성화
  const activeLink = document.querySelector(`[data-menu="${pageId}"]`);
  if (activeLink) {
    activeLink.classList.add('active');
    
    // 부모 메뉴 열기 (서브메뉴인 경우)
    const parentTreeview = activeLink.closest('.has-treeview');
    if (parentTreeview) {
      parentTreeview.classList.add('menu-open');
      parentTreeview.querySelector('.nav-treeview').style.display = 'block';
    }
  }
}
```

### 메뉴 동작 흐름
1. **출퇴근 관리** 클릭 → 2단계 메뉴 펼쳐짐
2. **출근 현황** 클릭 → 페이지 이동
3. 페이지 로드 시 → 출퇴근 관리 메뉴가 열린 상태로 유지
4. 출근 현황 메뉴만 파란색으로 활성화

## 파일 구조

```
disk-cms/
├── components/              # 새로 생성
│   ├── header.html
│   ├── sidebar.html
│   └── footer.html
├── js/
│   ├── template-loader.js   # 새로 생성
│   └── dashboard.js         # 기존 유지
├── css/
│   └── dashboard.css        # 기존 유지
└── dashboard.html           # 최소 수정
```

## 호환성 유지

### 기존 dashboard.js와의 호환성
- `window.templateLoader.showToast()` 메서드 제공
- `window.templateLoader.isAdmin()` 권한 체크 제공
- 기존 출퇴근 함수 (`checkIn()`, `checkOut()`) 그대로 사용

### API 엔드포인트 호환성
- 인증: `/api/auth/me` (login.html과 동일)
- 로그아웃: `/api/auth/logout`
- 대시보드: `/api/dashboard` (기존 유지)

## 새 페이지 생성 방법

### 템플릿 적용 패턴
```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <!-- CSS 링크들 -->
</head>
<body class="hold-transition sidebar-mini layout-fixed">
  <div class="wrapper">
    <!-- 템플릿 컨테이너들 -->
    <div id="header-container"></div>
    <div id="sidebar-container"></div>
    
    <!-- 페이지 고유 콘텐츠 -->
    <div class="content-wrapper">
      <!-- 페이지 내용 -->
    </div>
    
    <div id="footer-container"></div>
  </div>

  <!-- JavaScript -->
  <script src="./js/template-loader.js"></script>
  <script>
    $(document).ready(async function() {
      await window.templateLoader.initializePage('페이지ID');
      // 페이지 특화 기능 초기화
    });
  </script>
</body>
</html>
```

### 메뉴 추가 방법
1. `components/sidebar.html`에 메뉴 항목 추가
2. `data-menu="고유ID"` 속성 설정
3. 새 페이지에서 `initializePage('고유ID')` 호출

## 구현 완료 상태

- ✅ template-loader.js 구현
- ✅ 3개 컴포넌트 (header, sidebar, footer) 생성
- ✅ dashboard.html 템플릿 적용
- ✅ 메뉴 펼침/접힘 기능
- ✅ 페이지 이동 후 메뉴 상태 유지
- ✅ 인증 시스템 통합
- ✅ 관리자 권한별 UI 제어

## 다음 단계 (예정)

### 4단계: 새 페이지 생성 템플릿
- attendance-status.html
- user-list.html 
- 기타 페이지들

### 5단계: 테스트 및 검증
- 메뉴 동작 테스트
- 인증 플로우 테스트
- 권한별 UI 테스트

## 주의사항

### 개발 시 고려사항
1. **컴포넌트 순서**: header → sidebar → footer 순으로 로드
2. **jQuery 의존성**: AdminLTE와 template-loader 모두 jQuery 필요
3. **CSS 클래스**: `.admin-only`, `data-menu` 속성 일관성 유지
4. **API 응답 형식**: `{ success: boolean, data: object }` 형식 준수

### 트러블슈팅
1. **메뉴가 작동하지 않을 때**: 브라우저 콘솔에서 jQuery 로드 확인
2. **인증 실패 시**: `/api/auth/me` 엔드포인트 응답 확인
3. **컴포넌트 로드 실패**: `components/` 폴더 경로 확인

---

*마지막 업데이트: 2025년 8월 16일*  
*구현 상태: 3단계 완료, 메뉴 상태 관리 개선 완료*


새 페이지 생성 템플릿의 역할
새 페이지 생성 템플릿은 개발자가 새로운 페이지를 빠르게 만들 수 있도록 도와주는 표준화된 HTML 골격입니다.
주요 역할
1. 반복 작업 제거
html<!-- 매번 작성해야 하는 보일러플레이트 코드 -->
<div id="header-container"></div>
<div id="sidebar-container"></div>
<div class="content-wrapper">
  <!-- 페이지 내용 -->
</div>
<div id="footer-container"></div>

<!-- 초기화 스크립트 -->
<script src="./js/template-loader.js"></script>
<script>
  $(document).ready(async function() {
    await window.templateLoader.initializePage('페이지ID');
  });
</script>
2. 일관된 페이지 구조 강제

모든 페이지가 동일한 HTML 구조를 가짐
CSS 클래스명과 ID 일관성 유지
JavaScript 초기화 패턴 표준화

3. 신규 개발자 온보딩 지원
javascript// 복잡한 템플릿 로직을 몰라도 됨
await window.templateLoader.initializePage('user-list');
// 이 한 줄로 인증, 헤더, 사이드바, 푸터 모두 처리
4. 유지보수성 향상

템플릿 구조 변경 시 모든 페이지에 자동 반영
버그 수정이나 기능 추가가 한 곳에서 가능

구체적 활용 예시
attendance-status.html 생성 시:

템플릿 복사
initializePage('attendance-status') 설정
sidebar.html에 메뉴 추가
페이지 고유 콘텐츠만 작성

결과:

인증 자동 처리
헤더/사이드바/푸터 자동 로드
메뉴 활성화 자동 처리
관리자 권한 UI 자동 제어

템플릿의 핵심은 개발자가 비즈니스 로직에만 집중할 수 있게 하는 것입니다.

사용 방법
1. 새 페이지 만들 때:
bash# page-template.html을 복사해서 새 이름으로 저장
page-template.html → attendance-status.html
page-template.html → user-list.html
page-template.html → leave-request.html
2. 복사 후 수정 사항:

파일명: attendance-status.html
제목: "출근 현황"으로 변경
PAGE_ID: 'attendance-status'로 변경

또는 templates 폴더 생성
더 정리된 구조를 원한다면:
disk-cms/
├── templates/
│   └── page-template.html  ← 여기에 저장
├── components/
├── pages/  ← 실제 페이지들
│   ├── attendance-status.html
│   ├── user-list.html
│   └── leave-request.html
├── js/
├── css/
└── dashboard.html
**첫 번째 방법(루트에 저장)**을 권장합니다. 초보자에게 더 간단하고 직관적입니다.
실제로 attendance-status.html을 만들어보시겠습니까?재시도Claude는 실수를 할 수 있습니다. 응답을 반드시 다시 확인해 주세요.연구 Sonnet 4



직원목록 페이지 구성 방법

public/
├── pages/
│   └── user-list.html          # 직원목록 HTML 페이지
├── js/
│   └── pages/
│       └── user-list.js        # 직원목록 전용 JavaScript
└── css/
    └── pages/
        └── user-list.css       # 직원목록 전용 CSS (선택사항)
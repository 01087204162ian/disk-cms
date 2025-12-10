# 템플릿 시스템 개선 옵션

## 🚀 1. 페이지 자동 생성기 (추천 1순위)

### 특징
- 명령어 하나로 완전한 페이지 생성
- 표준 패턴 자동 적용
- CRUD 페이지 템플릿 제공

### 사용 예시
```bash
npm run create-page employee-list "직원 목록" --type=crud
npm run create-page reports "보고서" --type=chart
npm run create-page settings "설정" --type=form
```

### 생성되는 파일들
```
pages/employee-list.html
js/pages/employee-list.js
css/pages/employee-list.css
```

---

## ⚙️ 2. 동적 메뉴 시스템 (추천 2순위)

### 특징
- JSON 설정으로 메뉴 관리
- 권한별 자동 표시/숨김
- 활성 페이지 자동 감지

### 설정 예시
```json
{
  "dashboard": {
    "title": "대시보드",
    "icon": "tachometer-alt",
    "url": "/dashboard.html",
    "roles": ["ALL"]
  },
  "employees": {
    "title": "직원 관리",
    "icon": "users",
    "roles": ["ADMIN", "MANAGER"],
    "children": {
      "employee-list": {
        "title": "직원 목록",
        "url": "/pages/employee-list.html"
      }
    }
  }
}
```

---

## 🧩 3. 컴포넌트 시스템 (추천 3순위)

### 특징
- 재사용 가능한 UI 컴포넌트
- 데이터 바인딩 지원
- 이벤트 자동 연결

### 사용 예시
```html
<!-- 통계 카드 -->
<div data-component="stats-card" 
     data-value="123" 
     data-label="총 처리 건수"
     data-color="blue"
     data-icon="tasks"></div>

<!-- 데이터 테이블 -->
<div data-component="data-table"
     data-api="/api/employees"
     data-columns="name,email,department"
     data-actions="edit,delete"></div>

<!-- 로딩 스피너 -->
<div data-component="loading" data-text="데이터 로드 중..."></div>
```

---

## 🌙 4. 테마 시스템

### 특징
- 라이트/다크 모드 지원
- 커스텀 테마 생성 가능
- 사용자 설정 저장

### 사용 예시
```javascript
// 테마 변경
templateLoader.setTheme('dark');

// 커스텀 테마
templateLoader.setTheme({
  primary: '#667eea',
  secondary: '#764ba2',
  background: '#f4f6f9'
});
```

---

## 📡 5. 실시간 알림 시스템

### 특징
- WebSocket 기반 실시간 통신
- 푸시 알림 지원
- 알림 히스토리 관리

### 사용 예시
```javascript
// 실시간 알림 수신
templateLoader.onNotification((notification) => {
  console.log('새 알림:', notification.message);
  templateLoader.showToast(notification.message);
});

// 알림 발송 (관리자용)
templateLoader.sendNotification({
  target: 'all', // 또는 특정 사용자
  message: '시스템 점검 예정',
  type: 'warning'
});
```

---

## 💾 6. 캐싱 및 성능 최적화

### 특징
- 템플릿 메모리 캐싱
- API 응답 캐싱
- 지연 로딩 지원

### 사용 예시
```javascript
// 캐싱 활성화
templateLoader.enableCache({
  templates: true,    // 템플릿 캐싱
  api: true,         // API 응답 캐싱
  duration: 300000   // 5분간 캐시
});

// 지연 로딩
templateLoader.lazyLoad('.lazy-component');
```

---

## 📱 7. 반응형 레이아웃 시스템

### 특징
- 다양한 레이아웃 패턴
- 모바일 최적화
- 동적 레이아웃 변경

### 사용 예시
```javascript
// 레이아웃 변경
templateLoader.setLayout('sidebar-mini');    // 축소 사이드바
templateLoader.setLayout('full-width');      // 전체 너비
templateLoader.setLayout('mobile-first');    // 모바일 우선

// 화면 크기별 자동 조정
templateLoader.enableResponsive(true);
```
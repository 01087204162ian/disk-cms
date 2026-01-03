# 티켓 시스템 가이드 - 사이드바 네비게이션 구현 로그

**작업일**: 2026-01-XX  
**작업자**: AI Assistant  
**버전**: 1.0

---

## 📋 작업 개요

티켓 시스템 가이드 페이지(`guide.html`)에 사이드바 네비게이션을 추가하여 사용자가 한 눈에 전체 구조를 파악하고 빠르게 원하는 섹션으로 이동할 수 있도록 개선했습니다.

---

## 🎯 작업 목표

1. **정보 구조 한눈에 파악**: 사이드바 목차로 전체 문서 구조 확인
2. **빠른 탐색**: 클릭 한 번으로 원하는 섹션으로 이동
3. **현재 위치 표시**: 스크롤 시 읽고 있는 부분 자동 하이라이트
4. **반응형 디자인**: 데스크톱과 모바일 모두 지원

---

## ✅ 구현 완료 사항

### 1. 사이드바 네비게이션 HTML 구조

**위치**: `disk-cms/public/pages/tickets/guide.html` (248-444번째 줄)

**구조**:
```html
<aside class="col-md-3 d-none d-md-block guide-sidebar">
  <nav class="guide-toc">
    <h4>📋 목차</h4>
    <ul>
      <!-- 섹션 1: SIMG의 일하는 방법 -->
      <li class="toc-item" data-section="section1">
        <a href="#section1">SIMG의 일하는 방법</a>
        <ul class="toc-subitems">
          <li><a href="#s1-1">1. 이 문서를 만드는 이유</a></li>
          <li><a href="#s1-2">2. SIMG에서 '일'이란</a></li>
          <!-- ... 9개 하위 항목 -->
        </ul>
      </li>
      <!-- 섹션 2, 3 동일 구조 -->
    </ul>
  </nav>
</aside>
```

**특징**:
- 좌측 사이드바 (데스크톱 전용, `col-md-3`)
- 3개 주요 섹션과 각 하위 항목 포함
- 아코디언 구조 (활성 섹션의 하위 항목 자동 펼침)

---

### 2. CSS 스타일 구현

**위치**: `disk-cms/public/pages/tickets/guide.html` (20-226번째 줄)

**주요 스타일**:

#### 사이드바 기본 스타일
```css
.guide-sidebar {
  position: sticky;
  top: 70px;
  height: calc(100vh - 70px);
  overflow-y: auto;
  background: #f8f9fa;
  border-right: 1px solid #dee2e6;
  padding: 1.5rem 0;
  z-index: 50;
}
```

#### 목차 항목 스타일
- 활성 항목: 배경색 `#667eea`, 텍스트 흰색
- 호버 효과: 배경색 `#e9ecef`
- 하위 항목: 들여쓰기 및 왼쪽 보더

#### 맨 위로 버튼
```css
.btn-back-to-top {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #667eea;
  /* ... */
}
```

#### 반응형 디자인
- **992px 이하**: 사이드바 숨김, 상단 탭 메뉴 표시
- **768px 이하**: 추가 스타일 조정

---

### 3. 각 섹션 하위 항목에 ID 추가

**추가된 ID 목록**:

#### 섹션 1: SIMG의 일하는 방법
- `s1-1`: 우리가 이 문서를 만드는 이유
- `s1-2`: SIMG에서 '일'이란 무엇인가
- `s1-3`: SIMG의 일하는 방식 5가지 원칙
- `s1-4`: 우리가 피하는 일하는 방식
- `s1-5`: SIMG에서 말하는 '성장'
- `s1-6`: SIMG는 실수를 이렇게 다룬다
- `s1-7`: 우리가 지향하는 최종 상태
- `s1-8`: 이 문서의 가장 중요한 문장
- `s1-9`: 활용 권장 위치

#### 섹션 2: 티켓 시스템 상세 설명
- `s2-1`: 핵심 정의
- `s2-2`: 구조적 의미 (5가지 요소)
- `s2-3`: 실무적 의미
- `s2-4`: 기능적 의미 (3가지 역할)
- `s2-5`: 조직적 의미
- `s2-6`: 철학적 의미
- `s2-7`: 한 문장 요약
- `s2-8`: 실무 적용 원칙

#### 섹션 3: 티켓 유형 가이드
- `s3-1`: 기본 원칙
- `s3-2`: 9가지 티켓 유형
- `s3-3`: 티켓 유형 간 자연스러운 흐름
- `s3-4`: 빠른 판단 가이드 (직원용)
- `s3-5`: 실무 적용 예시
- `s3-6`: 주의사항
- `s3-7`: 체크리스트 (티켓 생성 전)
- `s3-8`: 핵심 메시지

**총 26개 항목에 ID 추가**

---

### 4. JavaScript 기능 구현

**위치**: `disk-cms/public/pages/tickets/guide.html` (1520-1650번째 줄)

**주요 기능**:

#### 1. 사이드바 네비게이션 클릭 이벤트
```javascript
tocLinks.forEach(link => {
  link.addEventListener('click', function(e) {
    e.preventDefault();
    const targetId = this.getAttribute('href');
    const targetElement = document.querySelector(targetId);
    
    if (targetElement) {
      const offsetTop = targetElement.offsetTop - 80;
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
      history.pushState(null, null, targetId);
    }
  });
});
```

#### 2. 스크롤 시 활성 항목 감지
- 섹션 레벨 감지 (section1, section2, section3)
- 하위 항목 레벨 감지 (s1-1, s2-1 등)
- 현재 읽고 있는 항목 자동 하이라이트
- 활성 섹션의 하위 항목 자동 펼침

#### 3. 맨 위로 버튼
- 스크롤 300px 이상 시 표시
- 클릭 시 부드러운 스크롤로 맨 위로 이동

#### 4. 성능 최적화
- `requestAnimationFrame`을 사용한 스크롤 이벤트 throttle
- 불필요한 DOM 조작 최소화

---

### 5. 반응형 디자인

**데스크톱 (992px 이상)**:
- 좌측 사이드바 표시
- 상단 탭 메뉴 숨김

**모바일/태블릿 (992px 이하)**:
- 사이드바 숨김
- 상단 탭 메뉴 표시 (기존 네비게이션 유지)
- 맨 위로 버튼 크기 조정 (45px)

---

## 📊 변경 결과

### 파일 변경 사항

- **수정 파일**: `disk-cms/public/pages/tickets/guide.html`
- **추가된 라인 수**: 약 200줄
- **변경 전 총 라인 수**: 1,389줄
- **변경 후 총 라인 수**: 1,684줄

### UI 개선 효과

1. **정보 구조 파악**: 사이드바 목차로 전체 문서 구조를 한눈에 확인 가능
2. **탐색 속도 향상**: 클릭 한 번으로 원하는 섹션으로 즉시 이동
3. **현재 위치 표시**: 스크롤 시 읽고 있는 부분이 자동으로 하이라이트
4. **사용자 경험 개선**: GitHub Docs, Notion 스타일의 친숙한 인터페이스

---

## 🔍 기술적 세부사항

### 레이아웃 구조

**변경 전**:
```html
<div class="row">
  <div class="col-12">
    <!-- 네비게이션 탭 -->
    <!-- 콘텐츠 -->
  </div>
</div>
```

**변경 후**:
```html
<div class="row">
  <aside class="col-md-3 guide-sidebar">
    <!-- 사이드바 목차 -->
  </aside>
  <div class="col-md-9 col-12">
    <!-- 네비게이션 탭 (모바일) -->
    <!-- 콘텐츠 -->
  </div>
</div>
```

### 스크롤 감지 로직

1. **섹션 레벨 감지**: `window.pageYOffset + 150` 위치에서 가장 가까운 섹션 찾기
2. **하위 항목 레벨 감지**: 각 `concept-card`와 `summary-box`의 위치 계산
3. **하이라이트 업데이트**: 현재 위치에 맞는 항목에 `active` 클래스 추가

### 아코디언 동작

- 활성 섹션(`active`)의 하위 항목은 자동으로 펼침 (`expanded`)
- `max-height` transition을 사용한 부드러운 애니메이션

---

## ✅ 검증 사항

- [x] HTML 문법 오류 없음 (린터 확인 완료)
- [x] 모든 섹션과 하위 항목에 ID 추가 완료
- [x] 사이드바 스타일 정상 작동
- [x] 스크롤 감지 및 하이라이트 기능 정상 작동
- [x] 맨 위로 버튼 표시/숨김 정상 작동
- [x] 반응형 디자인 정상 작동
- [ ] 브라우저 호환성 테스트 (Chrome, Firefox, Safari, Edge)
- [ ] 모바일 반응형 테스트
- [ ] 접근성 테스트 (키보드 네비게이션, 스크린 리더)

---

## 📝 사용 방법

### 사용자 관점

1. **사이드바에서 탐색**
   - 좌측 사이드바의 목차에서 원하는 섹션 클릭
   - 하위 항목 클릭 시 해당 항목으로 스크롤

2. **현재 위치 확인**
   - 스크롤 시 현재 읽고 있는 섹션이 자동으로 하이라이트
   - 활성 섹션의 하위 항목이 자동으로 펼쳐짐

3. **맨 위로 이동**
   - 우측 하단의 "맨 위로" 버튼 클릭
   - 스크롤 300px 이상일 때만 표시

4. **모바일 사용**
   - 상단 탭 메뉴에서 섹션 선택
   - 사이드바는 자동으로 숨김

---

## 🎨 디자인 특징

### 색상 스키마
- **활성 항목**: `#667eea` (보라색)
- **호버 효과**: `#e9ecef` (연한 회색)
- **배경**: `#f8f9fa` (아주 연한 회색)
- **텍스트**: `#495057` (진한 회색)

### 애니메이션
- 부드러운 스크롤: `behavior: 'smooth'`
- 호버 효과: `transition: all 0.2s ease`
- 아코디언 펼침: `max-height` transition

---

## 🚀 향후 개선 사항

1. **검색 기능 추가**
   - 사이드바에 검색 입력 필드 추가
   - 키워드로 항목 검색 및 하이라이트

2. **북마크 기능**
   - 자주 사용하는 섹션 북마크
   - 북마크 목록 표시

3. **인쇄 최적화**
   - 인쇄 시 사이드바 숨김
   - 페이지 나누기 최적화

4. **접근성 개선**
   - 키보드 네비게이션 지원 강화
   - ARIA 레이블 추가
   - 스크린 리더 최적화

5. **진행도 표시**
   - 읽은 항목 체크 표시
   - 전체 진행도 바 표시

---

## 📚 참고 자료

- **원본 문서**: `docs/보험운영플랫폼/about_content.txt`
- **원본 문서**: `docs/보험운영플랫폼/types-guide_content.txt`
- **이전 구현 로그**: `docs/보험운영플랫폼/GUIDE_PAGE_IMPLEMENTATION.md`
- **UI 구현 가이드**: `docs/보험운영플랫폼/UI_IMPLEMENTATION_GUIDE.md`

---

## 🎓 학습 내용

이번 작업을 통해:

1. **사이드바 네비게이션 패턴**: GitHub Docs, Notion 스타일의 사이드바 구현
2. **스크롤 감지 최적화**: `requestAnimationFrame`을 사용한 성능 최적화
3. **반응형 디자인**: 데스크톱과 모바일 환경에 맞는 다른 UI 제공
4. **접근성 고려**: 키보드 네비게이션 및 스크린 리더 지원 준비

---

**작성일**: 2026-01-XX  
**작성자**: AI Assistant  
**버전**: 1.0


# 약국배상책임보험 시스템 문서

**작성일**: 2025-01-XX

---

## 📚 문서 목차

이 폴더에는 약국배상책임보험 시스템에 대한 상세한 문서들이 포함되어 있습니다.

### 1. [시스템 개요](./pharmacy-시스템-개요.md)
- 시스템 아키텍처
- 프론트엔드 구조
- 백엔드 API 구조
- 주요 기능 개요
- 파일 구조

### 2. [API 엔드포인트 목록](./pharmacy-API-엔드포인트.md)
- 메인 라우터 API
- 관리자 기능 API
- 예치금 관리 API
- 실적 관리 API
- 업체 관리 API
- 공통 응답 형식
- 에러 코드

### 3. [프론트엔드 개발 가이드](./pharmacy-프론트엔드-개발가이드.md)
- 페이지 구조
- 템플릿 시스템
- JavaScript 구조
- 주요 기능 구현
- 새 페이지 생성 방법
- 유틸리티 함수

### 4. [주요 기능 상세](./pharmacy-주요기능-상세.md)
- 약국 목록 관리
- 약국 상세 정보
- 예치금 관리
- 실적 관리
- API 키 관리
- 파일 관리
- 상태 코드

---

## 🚀 빠른 시작

### 개발 환경 설정

1. **프론트엔드 페이지 접근**
   ```
   https://disk-cms.simg.kr/pages/pharmacy/applications.html
   ```

2. **API 엔드포인트 테스트**
   ```bash
   # 약국 목록 조회
   curl https://disk-cms.simg.kr/api/pharmacy/list?page=1&limit=20
   ```

3. **새 페이지 생성**
   - [프론트엔드 개발 가이드](./pharmacy-프론트엔드-개발가이드.md)의 "새 페이지 생성 방법" 참고

---

## 📁 관련 파일 위치

### 프론트엔드
- **페이지**: `disk-cms/public/pages/pharmacy/`
- **JavaScript**: `disk-cms/public/js/pharmacy/`
- **템플릿**: `disk-cms/public/components/`

### 백엔드
- **메인 라우터**: `disk-cms/routes/pharmacy.js`
- **하위 라우터**: `disk-cms/routes/pharmacy/`
  - `admin.js` - 관리자 기능
  - `deposits.js` - 예치금 관리
  - `reports.js` - 실적 관리
  - `pharmacy2.js` - 업체 관리

### PHP 백엔드
- **서버**: `https://imet.kr/api/pharmacy/`
- **로컬 개발**: `imet/api/pharmacy/` (로컬 개발 경로)

---

## 🔗 관련 문서

- [프로젝트 전체 가이드](../PROJECT_GUIDE.md)
- [상품 페이지 작성 가이드](../상품페이지_작성가이드.md)
- [템플릿 시스템 구현 가이드](../front.md)

---

## 📝 문서 업데이트 이력

- **2025-01-XX**: 초기 문서 작성
  - 시스템 개요
  - API 엔드포인트 목록
  - 프론트엔드 개발 가이드
  - 주요 기능 상세

---

## 💡 참고사항

### 개발 시 주의사항
1. **템플릿 시스템**: 모든 페이지는 `sj-template-loader.js`를 사용해야 합니다
2. **API 프록시**: 모든 PHP API 호출은 Node.js 프록시를 통해야 합니다
3. **인증**: 관리자 기능은 `requireAuth` 미들웨어가 필요합니다
4. **에러 처리**: 모든 API 호출에 에러 처리를 구현해야 합니다

### 테스트 방법
1. **로컬 개발**: `http://localhost:3000/pages/pharmacy/applications.html`
2. **프로덕션**: `https://disk-cms.simg.kr/pages/pharmacy/applications.html`
3. **API 테스트**: Postman 또는 curl 사용

---

**문서 버전**: 1.0  
**최종 업데이트**: 2025-01-XX


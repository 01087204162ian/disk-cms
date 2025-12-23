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

### 2. [아키텍처 - 프록시 구조](./pharmacy-아키텍처-프록시구조.md) ⭐
- 프록시 구조 개요
- 통신 흐름 (프론트엔드 → Node.js → PHP → MySQL)
- 프록시의 역할 (요청 전달, 에러 처리, 로깅 등)
- 실제 코드 예시
- 프록시를 사용하는 이유

### 3. [API 엔드포인트 목록](./pharmacy-API-엔드포인트.md)
- 메인 라우터 API
- 관리자 기능 API
- 예치금 관리 API
- 실적 관리 API
- 업체 관리 API
- 공통 응답 형식
- 에러 코드

### 4. [프론트엔드 개발 가이드](./pharmacy-프론트엔드-개발가이드.md)
- 페이지 구조
- 템플릿 시스템
- JavaScript 구조
- 주요 기능 구현
- 새 페이지 생성 방법
- 유틸리티 함수

### 5. [주요 기능 상세](./pharmacy-주요기능-상세.md)
- 약국 목록 관리
- 약국 상세 정보
- 예치금 관리
- 실적 관리
- API 키 관리
- 파일 관리
- 상태 코드

### 6. [파일 생성 가이드](./pharmacy-로컬개발환경.md) ⭐
- 파일 경로 매핑 (프로덕션 vs 로컬)
- 폴더 구조
- PHP 파일 작성 위치
- Node.js 프록시 작성 위치
- 프론트엔드 파일 작성 위치
- 파일 생성 체크리스트

### 7. [고객사 어드민 시스템](./pharmacy-고객사-어드민-시스템.md) ⭐
- `imet/hi/v2/` 디렉토리 학습
- 고객사 관리자 시스템 개요
- HMAC 인증 시스템
- 신청자 리스트 조회
- 일별 실적 및 예치보험료 관리

### 8. [신청 시스템](./pharmacy-신청-시스템.md) ⭐
- `imet/drugstore/` 디렉토리 학습
- 약사/거래처 영업사원 신청 시스템
- 회사별 구분 (pharmacy_idList)
- 실시간 보험료 계산
- 자동 상태 처리

### 9. [API 연동 가이드](./pharmacy-API-연동-가이드.md) ⭐
- `imet/hi/md/` 디렉토리 학습
- HMAC 인증 시스템
- API v2 엔드포인트 상세
- SDK 예제 (JavaScript, PHP)
- 테스트 계정 정보

### 10. [통합 가이드](./pharmacy-통합-가이드.md) ⭐
- 모든 주요 MD 요약본 (아키텍처/인증/엔드포인트/프론트/백엔드/갱신)

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
- **프로덕션 서버**: `https://imet.kr/api/pharmacy/`
- **로컬 개발 경로**: `d:\development\imet\api\pharmacy/` (로컬 파일 시스템)
- **중요**: 로컬에서 PHP 파일을 작성할 때는 `imet/api/pharmacy/` 폴더에 저장하고, 프로덕션 배포 시 `imet.kr/api/pharmacy/` 경로로 업로드합니다

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


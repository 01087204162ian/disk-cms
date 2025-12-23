# 약국배상책임보험 시스템 문서

**작성일**: 2025-01-XX  
**최종 업데이트**: 2025-01-XX

---

## 📚 통합 문서

모든 문서가 하나의 통합 문서로 정리되었습니다:

### [약국배상책임보험 시스템 통합 문서](./pharmacy-통합-문서.md) ⭐

**포함 내용**:
1. 시스템 개요
2. 아키텍처 (프록시 구조 포함)
3. 파일 구조 및 생성 가이드
4. 프론트엔드 개발 가이드
5. 백엔드 API (PHP)
6. Node.js 프록시 API
7. 주요 기능 상세
8. API 연동 가이드 (HMAC 인증)
9. 고객사 어드민 시스템
10. 신청 시스템
11. 갱신 프로세스
12. PHP 파일 작성 규칙
13. 보험료 검증
14. 메모 기능
15. 부록 (기술 스택, 보안, 상태 코드, 체크리스트, 문제 해결)

---

## 복원 문서

- [갱신 프로세스 기획서](./pharmacy-갱신-프로세스-기획.md)

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
   - [통합 문서](./pharmacy-통합-문서.md)의 "4. 프론트엔드 개발 가이드" 참고

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

## 💡 참고사항

### 개발 시 주의사항
1. **템플릿 시스템**: 모든 페이지는 `sj-template-loader.js`를 사용해야 합니다
2. **API 프록시**: 모든 PHP API 호출은 Node.js 프록시를 통해야 합니다
3. **인증**: 관리자 기능은 `requireAuth` 미들웨어가 필요합니다
4. **에러 처리**: 모든 API 호출에 에러 처리를 구현해야 합니다
5. **PHP 파일 헤더**: 모든 PHP 파일 상단에 파일 경로와 파일명을 주석으로 표시해야 합니다

### 테스트 방법
1. **로컬 개발**: `http://localhost:3000/pages/pharmacy/applications.html`
2. **프로덕션**: `https://disk-cms.simg.kr/pages/pharmacy/applications.html`
3. **API 테스트**: Postman 또는 curl 사용

---

**문서 버전**: 2.0  
**최종 업데이트**: 2025-01-XX

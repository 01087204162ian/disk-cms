# 직원 관리 시스템 문서

**작성일**: 2025-01-XX  
**최종 업데이트**: 2025-01-XX

---

## 📚 통합 문서

### [직원 관리 시스템 분석](./staff-시스템-분석.md) ⭐

**포함 내용**:
1. 시스템 개요
2. 폴더 구조
3. 주요 페이지
4. API 엔드포인트
5. JavaScript 모듈
6. 4일 근무제 시스템
7. 권한 체계
8. 데이터베이스 구조
9. 주요 기능 상세

---

## 🚀 빠른 시작

### 개발 환경 설정

1. **프론트엔드 페이지 접근**
   ```
   https://disk-cms.simg.kr/pages/staff/employees.html
   ```

2. **API 엔드포인트 테스트**
   ```bash
   # 직원 목록 조회
   curl https://disk-cms.simg.kr/api/staff/employees?page=1&limit=20
   ```

---

## 📁 관련 파일 위치

### 프론트엔드
- **페이지**: `disk-cms/public/pages/staff/`
- **JavaScript**: `disk-cms/public/js/staff/`

### 백엔드
- **API 라우터**: `disk-cms/routes/staff/`
- **서버 설정**: `disk-cms/server.js`

---

## 📖 주요 페이지

1. **직원 관리** (`employees.html`)
   - 직원 목록 조회 및 관리
   - 필터링, 검색, 페이징
   - 부서 관리
   - 근무 일정 관리

2. **직원 스케줄** (`employee-schedule.html`)
   - 개인 월별 스케줄 조회
   - 반차 신청
   - 근무 통계

---

## 🔑 주요 기능

1. **직원 관리**
   - 직원 목록 조회 (필터링, 검색)
   - 직원 상세 정보 조회 및 수정
   - 계정 활성화/비활성화
   - 권한 관리

2. **부서 관리**
   - 부서 목록 조회
   - 부서 생성, 수정, 삭제
   - 부서장 지정

3. **근무 스케줄 관리**
   - 4일 근무제 시스템
   - 개인별 월별 스케줄 조회
   - 반차 신청 및 승인
   - 휴가 관리

---

## 🔐 권한 체계

- **SUPER_ADMIN**: 최고관리자 (모든 권한)
- **SYSTEM_ADMIN**: 시스템관리자 (전체 관리)
- **DEPT_MANAGER**: 부서장 (부서별 관리)
- **EMPLOYEE**: 직원 (본인 정보만)

---

## 📝 API 엔드포인트

### 직원 관리
- `GET /api/staff/employees` - 직원 목록 조회
- `GET /api/staff/employees/:email` - 직원 상세 조회
- `PATCH /api/staff/employees/:email` - 직원 정보 수정
- `PATCH /api/staff/employees/:email/activate` - 계정 활성화
- `PATCH /api/staff/employees/:email/deactivate` - 계정 비활성화

### 부서 관리
- `GET /api/staff/departments` - 부서 목록 조회
- `POST /api/staff/departments` - 부서 생성
- `PUT /api/staff/departments/:id` - 부서 수정
- `DELETE /api/staff/departments/:id` - 부서 삭제

### 근무 스케줄
- `GET /api/staff/work-schedules/my-schedule/:year/:month` - 내 스케줄 조회
- `POST /api/staff/work-schedules/half-day` - 반차 신청
- `GET /api/staff/work-schedules/team/:year/:month` - 팀 스케줄 조회

---

---

## 🔄 고도화 작업

### 📋 작업 정리
- [주4일 작업 정리](./주4일-작업-정리.md) ⭐ - 전체 작업 내용 요약 및 정리

### 기획 및 분석
- [주4일 고도화 판단 분석](./주4일-고도화-판단분석.md) - 기존 시스템 삭제 vs 업데이트 판단
- [주4일 운영 원칙 상세](./주4일-운영원칙-상세.md) - 새로운 운영 원칙 상세 정리
- [주4일 DB 스키마 분석](./주4일-DB-스키마-분석.md) - 실제 DB 스키마와 설계 비교 분석

### 개발 계획
- [주4일 개발 계획](./주4일-개발-계획.md) - 단계별 개발 계획 및 일정

### 마이그레이션
- 마이그레이션 스크립트: `database/migration/`
- 마이그레이션 가이드: `database/migration/README.md`
- 실행 가이드: `database/migration/EXECUTION-GUIDE.md`
- 실행 체크리스트: `database/migration/checklist.md`

---

**문서 버전**: 1.0


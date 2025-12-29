# 직원 관리 시스템 문서

**작성일**: 2025-01-XX  
**최종 업데이트**: 2025-01-XX

---

## 📚 통합 문서

### [주 4일 근무제 통합 가이드](./주4일-근무제-통합-가이드.md) ⭐

**주 4일 근무제 시스템의 모든 내용을 통합한 문서**

**포함 내용**:
1. 시스템 개요 및 기본 규칙
2. 사이클 계산 로직 (공휴일 주 제외)
3. 휴무일 계산 로직 (시프트 순환)
4. 공휴일 처리 (주말 공휴일 제외)
5. 데이터베이스 스키마
6. API 스펙
7. 운영 가이드
8. 문제 해결

### [공휴일 관리 시스템](./공휴일-관리-시스템.md) 🆕

**공휴일 관리 시스템 구현 문서 (2025-12-28)**

**포함 내용**:
1. 시스템 개요
2. 주요 기능 (CRUD, 대체 공휴일 생성, 데이터 검증)
3. 파일 구조
4. 권한 관리
5. 데이터베이스 스키마
6. 사용 방법
7. 기술 스택 및 구현 사항

### [공휴일 학습 가이드](./공휴일-학습-가이드.md) 📚

**공휴일 시스템 학습 및 이해를 위한 상세 가이드**

**포함 내용**:
1. 공휴일 시스템 개요 및 역할
2. 공휴일의 종류 (고정, 음력, 대체)
3. 공휴일 처리 로직 (주말 무시, 사이클 제외)
4. 주 4일 근무제와 공휴일의 관계
5. 핵심 함수 코드 분석 (`hasHolidayInWeek`, `getCycleNumber`)
6. 실전 예제 및 문제 해결
7. 체크리스트 및 참고 자료

### [직원 관리 시스템 분석](./staff-시스템-분석.md)

**포함 내용**:
1. 시스템 개요
2. 폴더 구조
3. 주요 페이지
4. API 엔드포인트
5. JavaScript 모듈
6. 권한 체계
7. 데이터베이스 구조
8. 주요 기능 상세

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


---

---

**문서 버전**: 1.0


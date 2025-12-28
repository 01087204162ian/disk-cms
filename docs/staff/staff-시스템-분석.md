# 직원 관리 시스템 (Staff Management System) 분석

**작성일**: 2025-01-XX  
**위치**: `disk-cms/public/pages/staff/` 및 `disk-cms/routes/staff/`

---

## 📋 목차

1. [시스템 개요](#1-시스템-개요)
2. [폴더 구조](#2-폴더-구조)
3. [주요 페이지](#3-주요-페이지)
4. [API 엔드포인트](#4-api-엔드포인트)
5. [JavaScript 모듈](#5-javascript-모듈)
6. [4일 근무제 시스템](#6-4일-근무제-시스템)
7. [권한 체계](#7-권한-체계)
8. [데이터베이스 구조](#8-데이터베이스-구조)

---

## 1. 시스템 개요

### 1.1 정의

직원 관리 시스템은 CMS 내부 직원들의 정보 관리, 부서 관리, 근무 스케줄 관리를 통합적으로 제공하는 시스템입니다.

### 1.2 주요 기능

1. **직원 관리**
   - 직원 목록 조회 (필터링, 검색, 페이징)
   - 직원 상세 정보 조회 및 수정
   - 직원 계정 활성화/비활성화
   - 직원 권한 관리
   - 엑셀 다운로드

2. **부서 관리**
   - 부서 목록 조회 및 관리
   - 부서 생성, 수정, 삭제
   - 부서장 지정

3. **근무 스케줄 관리**
   - 4일 근무제 시스템 지원
   - 개인별 월별 스케줄 조회
   - 반차 신청 및 승인
   - 휴가 관리

### 1.3 기술 스택

- **프론트엔드**: HTML5, CSS3, Vanilla JavaScript (ES6+), Bootstrap 5
- **백엔드**: Node.js/Express
- **데이터베이스**: MySQL/MariaDB (Pool 연결)
- **인증**: 세션 기반 인증
- **아이콘**: Font Awesome 6.4.0

---

## 2. 폴더 구조

```
disk-cms/
├── public/
│   ├── pages/staff/
│   │   ├── employees.html              # 직원 관리 페이지
│   └── js/staff/
│       ├── employee-list.js            # 직원 목록 관리
│       ├── employee-modal.js           # 직원 상세보기 모달
│       ├── department-manager.js       # 부서 관리
│       └── vacations.js                # 휴가 관리
└── routes/staff/
    ├── employees.js                    # 직원 관리 API
    └── departments.js                 # 부서 관리 API
```

---

## 3. 주요 페이지

### 3.1 직원 관리 페이지 (`employees.html`)

**URL**: `/pages/staff/employees.html`

**주요 기능**:
- 직원 목록 조회 (테이블/카드 형식)
- 필터링 (부서, 상태, 권한)
- 검색 (이름, 이메일, 사번)
- 페이징
- 통계 정보 표시 (전체, 승인대기, 활성, 비활성)
- 엑셀 다운로드
- 부서 관리 모달
- 근무 일정 관리 모달

**상태 필터**:
- 승인대기 (0)
- 활성 (1)
- 비활성 (2)

**권한 필터**:
- SUPER_ADMIN: 최고관리자
- DEPT_MANAGER: 부서장
- SYSTEM_ADMIN: 시스템관리자
- EMPLOYEE: 직원

**표시 정보**:
- 이름
- 이메일
- 연락처
- 사번
- 부서
- 직급
- 권한
- 가입일
- 마지막 로그인
- 상태

---

## 4. API 엔드포인트

### 4.1 직원 관리 API (`/api/staff/employees`)

#### 직원 목록 조회
```
GET /api/staff/employees
Query Parameters:
  - page: 페이지 번호 (기본값: 1)
  - limit: 페이지 크기 (기본값: 20)
  - status: 상태 필터 (0: 승인대기, 1: 활성, 2: 비활성)
  - department: 부서 필터
  - role: 권한 필터
  - search: 검색어 (이름, 이메일, 사번)
  - sortBy: 정렬 기준 (기본값: created_at)
  - sortOrder: 정렬 순서 (기본값: desc)

Response:
{
  "success": true,
  "data": [...],
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_items": 100,
    "items_per_page": 20
  },
  "stats": {
    "total": 100,
    "active": 80,
    "pending": 10,
    "inactive": 10
  }
}
```

#### 직원 상세 조회
```
GET /api/staff/employees/:email
Response:
{
  "success": true,
  "data": {
    "email": "user@example.com",
    "name": "홍길동",
    "department": {
      "id": 1,
      "name": "개발팀",
      "code": "DEV"
    },
    ...
  }
}
```

#### 직원 정보 수정
```
PATCH /api/staff/employees/:email
Body: {
  "name": "홍길동",
  "department_id": 1,
  "phone": "010-1234-5678",
  ...
}
```

#### 직원 계정 활성화/비활성화
```
PATCH /api/staff/employees/:email/activate
PATCH /api/staff/employees/:email/deactivate
```

### 4.2 부서 관리 API (`/api/staff/departments`)

#### 부서 목록 조회
```
GET /api/staff/departments
GET /api/staff/departments/manage  # 관리자용 (상세 정보 포함)
```

#### 부서 생성
```
POST /api/staff/departments
Body: {
  "code": "DEV",
  "name": "개발팀",
  "description": "개발 부서",
  "manager_id": "manager@example.com",
  "is_active": 1
}
```

#### 부서 수정
```
PUT /api/staff/departments/:id
Body: {
  "name": "개발팀",
  "description": "개발 부서",
  ...
}
```

#### 부서 삭제
```
DELETE /api/staff/departments/:id
```

---

## 5. JavaScript 모듈

### 5.1 EmployeeManager 클래스 (`employee-list.js`)

**역할**: 직원 목록 관리 메인 클래스

**주요 메서드**:
- `init()`: 초기화
- `loadEmployees()`: 직원 목록 조회
- `loadDepartments()`: 부서 목록 조회
- `handleSearch()`: 검색 처리
- `handleFilterChange()`: 필터 변경 처리
- `handleExportExcel()`: 엑셀 다운로드
- `renderEmployeesTable()`: 테이블 렌더링
- `renderEmployeesMobileCards()`: 모바일 카드 렌더링

**의존성**:
- `EmployeeModal`: 직원 상세보기 모달
- `DepartmentManager`: 부서 관리

### 5.2 EmployeeModal 클래스 (`employee-modal.js`)

**역할**: 직원 상세 정보 모달 관리

**주요 메서드**:
- `showModal(email)`: 모달 표시
- `loadEmployeeData(email)`: 직원 데이터 조회
- `loadDepartments()`: 부서 목록 조회
- `updateEmployee(email, data)`: 직원 정보 수정
- `activateEmployee(email)`: 계정 활성화
- `deactivateEmployee(email)`: 계정 비활성화

### 5.3 DepartmentManager 클래스 (`department-manager.js`)

**역할**: 부서 관리 모달 및 기능

**주요 기능**:
- 부서 목록 조회
- 부서 생성
- 부서 수정
- 부서 삭제
- 부서장 지정

---

---

## 7. 권한 체계

### 7.1 역할 (Role)

1. **SUPER_ADMIN** (최고관리자)
   - 모든 권한
   - 초기 설정 가능
   - 전체 직원 관리

2. **SYSTEM_ADMIN** (시스템관리자)
   - 전체 스케줄 관리
   - 시스템 설정
   - 직원 관리

3. **DEPT_MANAGER** (부서장)
   - 본인 부서 직원 관리
   - 부서 스케줄 관리
   - 반차 승인

4. **EMPLOYEE** (직원)
   - 본인 스케줄 조회
   - 반차 신청

### 7.2 권한 체크 미들웨어

**인증 확인**:
```javascript
const requireAuth = (req, res, next) => {
    if (!req.session?.user) {
        return res.status(401).json({
            success: false,
            message: '로그인이 필요합니다.'
        });
    }
    next();
};
```

**관리자 권한 확인**:
```javascript
const requireAdmin = (req, res, next) => {
    if (!req.session?.user || 
        !['SUPER_ADMIN', 'DEPT_MANAGER', 'SYSTEM_ADMIN'].includes(req.session.user.role)) {
        return res.status(403).json({
            success: false,
            message: '관리자 권한이 필요합니다.'
        });
    }
    next();
};
```

---

## 8. 데이터베이스 구조

### 8.1 users 테이블

**주요 필드**:
- `email`: 이메일 (PK)
- `name`: 이름
- `password`: 비밀번호 (해시)
- `department_id`: 부서 ID (FK)
- `role`: 권한 (SUPER_ADMIN, DEPT_MANAGER, SYSTEM_ADMIN, EMPLOYEE)
- `employee_number`: 사번
- `phone`: 연락처
- `is_active`: 활성 상태 (0: 승인대기, 1: 활성, 2: 비활성)
- `work_schedule`: 근무 스케줄 타입 (4_DAY, 5_DAY 등)
- `work_days`: JSON - 개인 시프트 정보
- `created_at`: 가입일
- `last_login_at`: 마지막 로그인 시간

### 8.2 departments 테이블

**주요 필드**:
- `id`: 부서 ID (PK)
- `code`: 부서 코드 (UNIQUE)
- `name`: 부서명
- `description`: 부서 설명
- `manager_id`: 부서장 이메일 (FK)
- `is_active`: 활성 상태
- `created_at`: 생성일
- `updated_at`: 수정일

### 8.3 leaves 테이블

**주요 필드**:
- `id`: 휴가 ID (PK)
- `user_id`: 사용자 이메일 (FK)
- `leave_type`: 휴가 타입 (ANNUAL, SICK, HALF_AM, HALF_PM 등)
- `start_date`: 시작일
- `end_date`: 종료일
- `days_count`: 일수
- `reason`: 사유
- `status`: 상태 (PENDING, APPROVED, REJECTED)
- `approved_by`: 승인자
- `created_at`: 신청일

---

## 9. 주요 기능 상세

### 9.1 직원 목록 관리

**필터링**:
- 부서별 필터
- 상태별 필터 (승인대기, 활성, 비활성)
- 권한별 필터
- 검색어 필터 (이름, 이메일, 사번)

**정렬**:
- 가입일 기준 (기본값: 최신순)
- 정렬 기준 변경 가능

**페이징**:
- 페이지 크기: 20, 50, 100개 선택 가능
- 페이지 번호 네비게이션

### 9.2 직원 상세 정보

**표시 정보**:
- 기본 정보: 이름, 이메일, 연락처, 사번
- 부서 정보: 부서명, 부서 코드
- 권한 정보: 역할
- 상태 정보: 활성/비활성, 가입일, 마지막 로그인

**수정 가능 항목**:
- 이름
- 부서
- 연락처
- 직급
- 권한 (관리자만)

### 9.3 부서 관리

**부서 생성**:
- 부서 코드 (UNIQUE, 20자 이내)
- 부서명 (50자 이내)
- 부서 설명
- 부서장 지정 (선택사항)
- 활성 상태

**부서 수정**:
- 부서명, 설명 수정
- 부서장 변경
- 활성 상태 변경

**부서 삭제**:
- 직원이 없는 부서만 삭제 가능
- 소프트 삭제 (is_active = 0) 권장

---

---

**문서 버전**: 1.0  
**최종 업데이트**: 2025-01-XX


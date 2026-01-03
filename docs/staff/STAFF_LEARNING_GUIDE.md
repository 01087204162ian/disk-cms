# Staff 시스템 학습 가이드

**작성일**: 2026-01-XX  
**대상**: Staff 시스템 (`/pages/staff/`) 학습  
**목적**: Staff 시스템의 전체 구조와 기능 이해

---

## 📋 목차

1. [시스템 개요](#1-시스템-개요)
2. [메뉴 구조](#2-메뉴-구조)
3. [주요 페이지](#3-주요-페이지)
4. [학습 순서 추천](#4-학습-순서-추천)
5. [핵심 개념](#5-핵심-개념)
6. [관련 문서](#6-관련-문서)
7. [빠른 시작](#7-빠른-시작)

---

## 1. 시스템 개요

### 1.1 Staff 시스템이란?

Staff 시스템은 CMS 내부 직원들의 정보 관리, 근무 일정 관리, 공휴일 관리 등을 통합적으로 제공하는 시스템입니다.

### 1.2 주요 기능 영역

1. **직원 관리** (`employees.html`)
   - 직원 목록 조회 및 관리
   - 부서 관리
   - 권한 관리

2. **근무 일정 관리** (`employee-schedule.html`)
   - 주 4일 근무제 시스템
   - 개인별 월별 스케줄 조회
   - 휴무일 설정 및 조회

3. **공휴일 관리** (`holidays.html`)
   - 공휴일 등록 및 관리
   - 대체 공휴일 생성
   - 공휴일 데이터 검증

4. **반차 승인** (`half-day-approval.html`)
   - 반차 신청 및 승인
   - 권한: SUPER_ADMIN, SYSTEM_ADMIN, DEPT_MANAGER

---

## 2. 메뉴 구조

### 2.1 사이드바 메뉴 구조

```
직원전용 (Staff)
├── 직원리스트 (employees.html)
├── 근무일정 (employee-schedule.html)
├── 공휴일 관리 (holidays.html)
├── 반차 승인 (half-day-approval.html) [권한 필요]
├── 공지사항 (notices.html)
├── 휴가일정 (vacations.html)
└── 고지사항 (reports.html)
```

### 2.2 접근 URL

- **베이스 URL**: `https://disk-cms.simg.kr/pages/staff/`
- **직원 리스트**: `/pages/staff/employees.html`
- **근무일정**: `/pages/staff/employee-schedule.html`
- **공휴일 관리**: `/pages/staff/holidays.html`
- **반차 승인**: `/pages/staff/half-day-approval.html`

---

## 3. 주요 페이지

### 3.1 직원 리스트 (`employees.html`)

**기능**:
- 직원 목록 조회 (테이블/카드 형식)
- 필터링 (부서, 상태, 권한)
- 검색 (이름, 이메일, 사번)
- 페이징
- 통계 정보 표시
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

**관련 파일**:
- 프론트엔드: `public/pages/staff/employees.html`
- JavaScript: `public/js/staff/employee-list.js`, `employee-modal.js`
- API: `routes/staff/employees.js`

---

### 3.2 근무일정 (`employee-schedule.html`)

**기능**:
- 주 4일 근무제 시스템
- 개인별 월별 스케줄 조회
- 기본 휴무일 설정
- 사이클 시작일 설정
- 시프트 순환 로직

**핵심 개념**:
- **사이클**: 4주 단위로 휴무일이 순환 (시프트)
- **공휴일 주 제외**: 공휴일이 있는 주는 사이클에서 제외
- **타임존**: 모든 날짜 계산은 KST (Asia/Seoul, UTC+9) 기준

**관련 파일**:
- 프론트엔드: `public/pages/staff/employee-schedule.html`
- API: `routes/staff/work-schedules.js`
- 헬퍼: `routes/staff/work-schedule-helpers.js`

**관련 문서**:
- `주4일-근무제-통합-가이드.md` ⭐ (핵심 문서)

---

### 3.3 공휴일 관리 (`holidays.html`)

**기능**:
- 공휴일 등록 (고정, 음력, 대체)
- 공휴일 수정 및 삭제
- 대체 공휴일 자동 생성
- 데이터 검증

**공휴일 종류**:
- **고정 공휴일**: 매년 같은 날짜 (예: 신정, 크리스마스)
- **음력 공휴일**: 음력 기준 날짜 (예: 설날, 추석)
- **대체 공휴일**: 주말 공휴일의 대체 휴일

**핵심 규칙**:
- 주말(토요일, 일요일) 공휴일은 무시
- 평일 공휴일만 고려
- 공휴일이 있는 주는 사이클에서 제외

**관련 파일**:
- 프론트엔드: `public/pages/staff/holidays.html`
- API: `routes/staff/holidays.js`

**관련 문서**:
- `공휴일-관리-시스템.md`
- `공휴일-학습-가이드.md` 📚 (학습 추천)

---

### 3.4 반차 승인 (`half-day-approval.html`)

**기능**:
- 반차 신청 목록 조회
- 반차 승인/거부 처리
- 반차 현황 조회

**권한**:
- SUPER_ADMIN
- SYSTEM_ADMIN
- DEPT_MANAGER

**관련 파일**:
- 프론트엔드: `public/pages/staff/half-day-approval.html`
- API: 관련 API는 근무일정 API와 연동

---

## 4. 학습 순서 추천

### 📚 초급 (기본 개념 이해)

1. **README.md** - 시스템 전체 개요 파악
2. **staff-시스템-분석.md** - 시스템 구조 및 주요 페이지 이해
3. **공휴일-학습-가이드.md** - 공휴일 시스템 이해 (주 4일 근무제 전제 조건)

### 📖 중급 (핵심 기능 이해)

4. **주4일-근무제-통합-가이드.md** ⭐ - 주 4일 근무제 핵심 로직
   - 사이클 계산 로직
   - 휴무일 계산 로직
   - 공휴일 처리
   - 데이터베이스 스키마

5. **공휴일-관리-시스템.md** - 공휴일 관리 시스템 구현 내용

### 🔧 고급 (구현 세부사항)

6. **공휴일-포함-주-반차-사용-영향.md** - 공휴일과 반차의 관계
7. **주4일-근무제-다음-개발-계획.md** - 향후 개발 계획
8. 실제 코드 파일 분석
   - `routes/staff/work-schedules.js`
   - `routes/staff/work-schedule-helpers.js`
   - `routes/staff/holidays.js`
   - `routes/staff/employees.js`

---

## 5. 핵심 개념

### 5.1 주 4일 근무제

**기본 규칙**:
- 주 5일 중 4일 근무, 1일 휴무
- 4주 단위로 휴무일이 순환 (시프트)
- 공휴일이 있는 주도 주 4일 근무 유지

**사이클 구조**:
- **사이클 0 (1-4주차)**: 기본 휴무일 고정
- **사이클 1 (5-8주차)**: 시프트 시작 (금→목→수→화→월)
- **사이클 2 (9-12주차)**: 계속 시프트
- 4주 단위로 순환 (공휴일 주 제외)

**핵심 함수**:
- `getCycleNumber()`: 사이클 번호 계산
- `hasHolidayInWeek()`: 주에 공휴일이 있는지 확인
- `getOffDay()`: 특정 날짜의 휴무일 계산

### 5.2 공휴일 처리

**규칙**:
- 주말(토요일, 일요일) 공휴일은 무시
- 평일 공휴일만 고려
- 공휴일이 있는 주는 사이클에서 제외

**종류**:
- 고정 공휴일 (매년 같은 날짜)
- 음력 공휴일 (음력 기준)
- 대체 공휴일 (주말 공휴일의 대체)

### 5.3 권한 체계

- **SUPER_ADMIN**: 최고관리자 (모든 권한)
- **SYSTEM_ADMIN**: 시스템관리자 (전체 관리)
- **DEPT_MANAGER**: 부서장 (부서별 관리)
- **EMPLOYEE**: 직원 (본인 정보만)

---

## 6. 관련 문서

### 필수 문서 (⭐)

1. **README.md** - 시스템 전체 개요
2. **주4일-근무제-통합-가이드.md** ⭐ - 주 4일 근무제 핵심 문서
3. **staff-시스템-분석.md** - 시스템 구조 분석

### 학습 문서 (📚)

4. **공휴일-학습-가이드.md** 📚 - 공휴일 시스템 상세 가이드
5. **공휴일-관리-시스템.md** - 공휴일 관리 시스템 구현 문서

### 참고 문서

6. **공휴일-포함-주-반차-사용-영향.md** - 공휴일과 반차 관계
7. **공휴일-포함-주-반차-사용-정리.md** - 정리 문서
8. **주4일-근무제-다음-개발-계획.md** - 향후 개발 계획
9. **2025-12-31-작업-정리.md** - 작업 내역

---

## 7. 빠른 시작

### 7.1 페이지 접근

1. **로그인**: `https://disk-cms.simg.kr/login.html`
2. **직원 리스트**: `https://disk-cms.simg.kr/pages/staff/employees.html`
3. **근무일정**: `https://disk-cms.simg.kr/pages/staff/employee-schedule.html`
4. **공휴일 관리**: `https://disk-cms.simg.kr/pages/staff/holidays.html`

### 7.2 API 테스트

```bash
# 직원 목록 조회
curl https://disk-cms.simg.kr/api/staff/employees?page=1&limit=20

# 공휴일 목록 조회
curl https://disk-cms.simg.kr/api/staff/holidays?year=2026

# 근무 스케줄 조회
curl https://disk-cms.simg.kr/api/staff/work-schedules?email=user@example.com&year=2026&month=1
```

### 7.3 파일 위치

**프론트엔드**:
- 페이지: `disk-cms/public/pages/staff/`
- JavaScript: `disk-cms/public/js/staff/`

**백엔드**:
- API 라우터: `disk-cms/routes/staff/`
- 서버 설정: `disk-cms/server.js`

---

## 8. 다음 단계

학습을 마친 후:

1. ✅ **시스템 구조 이해 완료**
2. ✅ **주 4일 근무제 로직 이해 완료**
3. ✅ **공휴일 처리 로직 이해 완료**
4. 🔄 **실제 코드 파일 분석**
5. 🔄 **테스트 및 실습**
6. 🔄 **개발 작업 진행**

---

**작성일**: 2026-01-XX  
**작성자**: AI Assistant  
**버전**: 1.0


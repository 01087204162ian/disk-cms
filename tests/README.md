# 주 4일 근무제 자동 테스트 가이드

**작성일**: 2025-12-28  
**목적**: 주 4일 근무제 시스템의 자동 테스트 실행

---

## 테스트 구조

```
tests/
├── unit/                      # 단위 테스트
│   └── work-schedule-helpers.test.js
├── integration/               # 통합 테스트
│   └── work-schedules.test.js
└── README.md                  # 이 파일
```

---

## 테스트 프레임워크 설치

### 1. Jest 설치
```bash
npm install --save-dev jest supertest
```

### 2. package.json에 테스트 스크립트 추가
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

---

## 테스트 실행 방법

### 전체 테스트 실행
```bash
npm test
```

### 특정 테스트 파일 실행
```bash
npm test work-schedule-helpers.test.js
```

### Watch 모드 (파일 변경 시 자동 실행)
```bash
npm run test:watch
```

### 커버리지 리포트 생성
```bash
npm run test:coverage
```

---

## 테스트 항목

### 단위 테스트 (work-schedule-helpers.test.js)

#### 타임존 헬퍼 함수
- ✅ `formatDate()` - 날짜 포맷팅
- ✅ `getWeekStartDate()` - 주 시작일 계산

#### 4주 사이클 계산
- ✅ `getCycleNumber()` - 사이클 번호 계산
- ✅ `getCycleWeek()` - 사이클 내 주차 계산
- ✅ `calculateOffDayByWeekCycle()` - 휴무일 계산
  - 사이클 0: 금요일 휴무
  - 사이클 1: 목요일 휴무
  - 사이클 2: 수요일 휴무
  - 사이클 3: 화요일 휴무
  - 사이클 4: 월요일 휴무
  - 사이클 5: 금요일 휴무 (순환 복귀)

#### 공휴일 처리
- ✅ `hasHolidayInWeek()` - 주에 공휴일 포함 여부
- ✅ `isHoliday()` - 특정 날짜가 공휴일인지

#### 날짜 비교
- ✅ `isSameWeek()` - 같은 주인지 확인
- ✅ `isProbationPeriod()` - 수습 기간 여부

#### 검증 함수
- ✅ `validateHalfDay()` - 반차 검증
- ✅ `validateTemporaryChange()` - 일시적 변경 검증

---

## 테스트 데이터

### 테스트용 사용자 데이터
```json
{
  "base_off_day": 5,
  "cycle_start_date": "2025-01-06",
  "initial_selection_date": "2025-01-06"
}
```

### 테스트용 공휴일 데이터
```json
[
  { "date": "2025-12-25", "name": "크리스마스" }
]
```

---

## 테스트 실행 결과 예시

```
PASS  tests/unit/work-schedule-helpers.test.js
  주 4일 근무제 헬퍼 함수 테스트
    formatDate
      ✓ Date 객체를 YYYY-MM-DD 형식으로 변환
      ✓ 날짜 문자열을 YYYY-MM-DD 형식으로 변환
    getWeekStartDate
      ✓ 월요일이 주 시작일인지 확인
      ✓ 일요일에서 월요일로 변환
    calculateOffDayByWeekCycle
      ✓ 사이클 0 (1-4주): 금요일 휴무
      ✓ 사이클 1 (5-8주): 목요일 휴무
      ...

Test Suites: 1 passed, 1 total
Tests:       25 passed, 25 total
Snapshots:   0 total
Time:        2.345 s
```

---

## CI/CD 통합

### GitHub Actions 예시
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: npm install
      - run: npm test
```

---

## 주의사항

### 통합 테스트
- 실제 데이터베이스 연결이 필요합니다
- 테스트 전에 테스트용 데이터베이스 설정 필요
- 테스트 후 데이터 정리 필요

### 타임존 설정
- 테스트 실행 시 `process.env.TZ = 'Asia/Seoul'` 설정 확인
- 모든 날짜 계산은 KST 기준으로 수행

---

**문서 버전**: 1.0  
**최종 업데이트**: 2025-12-28


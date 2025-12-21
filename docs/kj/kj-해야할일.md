# KJ 대리운전 시스템 - 해야 할 일 (TODO List)

**작성일**: 2025-12-20  
**시스템**: CMS 기반 대리운전 보험 관리 시스템

---

## 📋 목차

1. [즉시 해결 필요 항목](#즉시-해결-필요-항목)
2. [기능 구현 필요 항목](#기능-구현-필요-항목)
3. [개선 사항](#개선-사항)
4. [버그 수정](#버그-수정)
5. [문서화](#문서화)

---

## 🔴 즉시 해결 필요 항목

### 1. 배서 상태 업데이트 기능 구현

**위치**: `disk-cms/public/js/insurance/kj-driver-endorse-list.js:507`

**현재 상태**:
- 배서 상태 select 박스는 UI만 구현되어 있음
- 실제 API 호출 로직이 주석 처리되어 있음

**해야 할 일**:
```javascript
// 현재 (507줄 근처)
// TODO: API 호출하여 상태 업데이트 (현재는 표시용)
// updateEndorseStatus(num, value, push, sangtae, cancel);

// 구현 필요:
// 1. 배서 상태 업데이트 API 엔드포인트 확인/생성
// 2. updateEndorseStatus 함수 구현
// 3. 청약/해지/취소/거절 상태 변경 로직 구현
```

**참고**:
- 백엔드 API: `/api/insurance/kj-endorse/update-status` (이미 존재할 수 있음)
- 관련 로직: `kj-endorse-update-status.php` 확인 필요

---

## 🟡 기능 구현 필요 항목

### 2. 일일배서리스트 보험료 업데이트 기능

**위치**: `disk-cms/public/js/insurance/kj-driver-endorse-list.js:2107-2117`

**현재 상태**:
- `mothlyPremiumUpdate()`, `mothlyC_PremiumUpdate()` 함수가 임시 구현 상태
- alert만 표시하고 실제 API 호출 없음

**해야 할 일**:
1. **백엔드 API 생성 필요**:
   - PHP API: `kj-daily-endorse-update-premium.php` 또는 유사 파일
   - 엔드포인트: `POST /api/insurance/kj-daily-endorse/update-premium`
   - 파라미터: `SeqNo`, `preminum` 또는 `c_preminum`

2. **Node.js 프록시 라우트 추가**:
   - `routes/insurance/kj-driver-company.js`에 프록시 라우트 추가

3. **프론트엔드 함수 구현**:
```javascript
async function mothlyPremiumUpdate(inputElement, smsDataNum) {
  const newPremium = inputElement.value.replace(/,/g, '');
  // API 호출 로직 구현
  // 성공/실패 처리
  // 테이블 새로고침 또는 해당 행만 업데이트
}
```

**데이터베이스 테이블**:
- `SMSData` 테이블의 `preminum`, `c_preminum` 필드 업데이트

---

### 3. 문자리스트 기능 구현

**위치**: `disk-cms/public/pages/insurance/kj-driver-endorse-list.html` (모달)

**현재 상태**:
- HTML 모달 구조만 존재
- JavaScript 기능 미구현

**해야 할 일**:
1. **데이터 조회 API**:
   - 문자 발송 내역 조회 API 필요
   - 백엔드: `kj-sms-list.php` 또는 유사 파일
   - 엔드포인트: `GET /api/insurance/kj-sms/list`

2. **프론트엔드 구현**:
   - 문자리스트 모달 열기 함수
   - 데이터 테이블 렌더링
   - 필터링 기능 (날짜, 대리운전회사 등)
   - 페이지네이션

3. **기능**:
   - 문자 발송 내역 조회
   - 문자 재발송 기능 (선택)
   - 발송 상태 표시

---

## 🟢 개선 사항

### 4. 에러 처리 개선

**위치**: 전체 시스템

**현재 상태**:
- 기본적인 에러 처리만 구현
- 사용자에게 표시되는 에러 메시지가 부족

**해야 할 일**:
1. **프론트엔드**:
   - 상세한 에러 메시지 표시
   - 사용자 친화적인 에러 안내
   - 에러 발생 시 로그 기록

2. **백엔드**:
   - 일관된 에러 응답 형식
   - 에러 코드 체계 구축
   - 로깅 강화

---

### 5. 로딩 상태 개선

**위치**: 전체 시스템

**현재 상태**:
- 기본 로딩 스피너만 사용
- 대용량 데이터 조회 시 사용자 경험 개선 필요

**해야 할 일**:
1. **로딩 인디케이터 개선**:
   - 진행률 표시 (가능한 경우)
   - 취소 버튼 제공
   - 부분 로딩 (점진적 렌더링)

2. **성능 최적화**:
   - 가상 스크롤링 (대용량 리스트)
   - 데이터 캐싱
   - 페이지네이션 최적화

---

### 6. 필터 기능 개선

**위치**: `kj-driver-endorse-list.js`

**현재 상태**:
- 필터가 독립적으로 작동하도록 수정됨
- 사용자 피드백에 따라 필터 선택 시 다른 필터 초기화 기능 추가됨

**검토 필요**:
- 현재 구현이 사용자 요구사항에 맞는지 확인
- 필요시 추가 개선

---

## 🔵 버그 수정

### 7. 진행단계 필터

**위치**: `kj-driver-endorse-list.js`

**현재 상태**:
- `progressFilter` 변수가 선언되어 있지만 HTML에 해당 필터가 있는지 확인 필요

**확인 필요**:
1. HTML에 `progressFilter` 요소 존재 여부 확인
2. 없으면 추가하거나 코드에서 제거
3. 필터 기능이 정상 작동하는지 테스트

---

## 📝 문서화

### 8. API 문서 업데이트

**해야 할 일**:
1. 새로운 API 엔드포인트 문서화
   - 일일배서리스트 관련 API
   - 배서현황 관련 API
2. 기존 API 문서 보완
3. 에러 코드 문서화

### 9. 개발 가이드 업데이트

**해야 할 일**:
1. 새로운 기능 사용법 문서화
2. 개발 환경 설정 가이드
3. 테스트 가이드

---

## 🎯 우선순위

### 높음 (P0)
1. ✅ 배서 상태 업데이트 기능 구현 (이미 구현된 것으로 보임, 확인 필요)
2. ✅ 일일배서리스트 보험료 업데이트 기능
3. ✅ 문자리스트 기능 구현

### 중간 (P1)
4. 에러 처리 개선
5. 로딩 상태 개선
6. 진행단계 필터 확인 및 수정

### 낮음 (P2)
7. API 문서 업데이트
8. 개발 가이드 업데이트

---

## 📌 참고사항

### 주요 파일 위치

**프론트엔드**:
- `disk-cms/public/pages/insurance/kj-driver-endorse-list.html`
- `disk-cms/public/js/insurance/kj-driver-endorse-list.js`
- `disk-cms/public/js/insurance/kj-constants.js`

**백엔드**:
- `pci0327/api/insurance/kj-endorse-*.php`
- `pci0327/api/insurance/kj-daily-endorse-*.php`

**프록시 라우트**:
- `disk-cms/routes/insurance/kj-driver-company.js`

### API 엔드포인트 구조

```
프론트엔드 → Node.js 프록시 → PHP 백엔드 → MySQL
```

예시:
```
GET /api/insurance/kj-endorse/list
  → routes/insurance/kj-driver-company.js
  → https://pcikorea.com/api/insurance/kj-endorse-list.php
  → MySQL Query
```

---

**마지막 업데이트**: 2025-12-20


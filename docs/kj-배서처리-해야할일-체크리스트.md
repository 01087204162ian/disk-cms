# KJ 배서처리 상태 업데이트 API 개발 체크리스트

## 현재 상태

### ✅ 완료된 작업
1. **문서 작성**
   - `kj-배서처리-상태-업데이트-API-기획서.md` ✅
   - `kj-배서-상태-처리-로직-정리.md` ✅
   - `kj-배서처리-이전버전-소스-분석.md` ✅

2. **유틸리티 파일 생성**
   - `kj-sms-aligo.php` ✅ (Aligo SMS API)
   - `kj-sms-utils.php` ✅ (SMS 발송 로직)
   - `kj-hyundai-api.php` ✅ (현대해상 API)
   - `kj-endorse-utils.php` ✅ (보험료 계산 함수 포함)

3. **기본 API 파일 존재**
   - `kj-endorse-update-status.php` ✅ (기본 구조만 존재, 로직 미구현)

---

## 1차 개발 (기본 기능) - 우선 작업

### 1. API 파일 수정 (`kj-endorse-update-status.php`)

#### 1.1 입력 파라미터 추가 및 검증
- [ ] `endorseProcess` 파라미터 추가 (선택, 기본값: "청약")
- [ ] `manager` 파라미터 추가 (필수)
- [ ] `reasion` 파라미터 추가 (선택)
- [ ] 입력 값 검증 로직 추가

#### 1.2 기존 데이터 조회
- [ ] `2012DaeriMember` 테이블에서 현재 데이터 조회
  - `push`, `sangtae`, `CertiTableNum` 등 필수 필드 조회
- [ ] 이미 처리된 건 검증 (sangtae=2면 에러)
- [ ] `2012CertiTable` 테이블에서 `divi` 값 조회 (SMS 발송 조건 확인용)

#### 1.3 push/cancel 값 계산 로직 구현
- [ ] 현재 `push` 값 확인 (1 또는 4)
- [ ] `endorseProcess` 값에 따른 `push`, `cancel` 값 계산
  - push=1 (청약 상태)일 때:
    - "청약" → push=4, cancel=null
    - "취소" → push=1, cancel=12
    - "거절" → push=1, cancel=13
  - push=4 (해지 상태)일 때:
    - "해지" → push=2, cancel=42
    - "취소" → push=4, cancel=45

#### 1.4 데이터베이스 업데이트
- [ ] `sangtae`, `push`, `cancel`, `manager`, `reasion` 필드 업데이트
- [ ] 트랜잭션 처리 (필요 시)

#### 1.5 응답 형식 개선
- [ ] 성공 응답에 업데이트된 데이터 포함 (push, cancel, manager 등)
- [ ] 에러 응답 개선

### 2. Node.js 프록시 라우터 확인/수정 (`kj-driver-company.js`)

- [ ] `/kj-endorse/update-status` 라우트 존재 확인
- [ ] POST 요청 처리 확인
- [ ] PHP API로 요청 전달 확인

### 3. 프론트엔드 확인 (`kj-driver-endorse-list.js`)

- [ ] `updateEndorseStatus` 함수 확인
- [ ] API 호출 시 필요한 파라미터 전달 확인:
  - `num` ✅
  - `sangtae` ✅
  - `endorseProcess` (선택한 값)
  - `manager` (로그인 사용자 이름)
  - `reasion` (선택 사항)
- [ ] 응답 처리 및 UI 업데이트 확인

### 4. 테스트

- [ ] 정상 케이스 테스트:
  - 청약 → 가입완료 (push=1 → 4)
  - 청약 → 취소 (push=1 → 1, cancel=12)
  - 청약 → 거절 (push=1 → 1, cancel=13)
  - 해지 → 해지완료 (push=4 → 2, cancel=42)
  - 해지 → 취소 (push=4 → 4, cancel=45)
- [ ] 에러 케이스 테스트:
  - 이미 처리된 건 (sangtae=2)
  - 필수 필드 누락
  - 존재하지 않는 num
  - 잘못된 endorseProcess 값

---

## 2차 개발 (고급 기능) - 이후 작업

### 1. 보험료 계산

- [ ] `calculateProRatedFee` 함수 호출 준비
- [ ] 필요한 데이터 조회:
  - `kj_premium_data` 테이블 (월보험료)
  - `kj_insurance_premium_data` 테이블 (10회 분납 보험료)
  - 나이 계산 (`calculateAge` 함수)
  - 할인할증률 조회 (`2019rate` 테이블)
- [ ] 보험료 계산 실행 (청약/해지 처리 시)
- [ ] 계산 결과 저장 (필요 시)

### 2. SMS 발송

- [ ] SMS 발송 조건 확인 (`sendSms` 플래그)
- [ ] `kj-sms-utils.php`의 `sendEndorseSms` 함수 호출
- [ ] SMS 메시지 생성 로직:
  - divi=1 (정상분납): 년보험료 또는 회사보험료 포함
  - divi=2 (월납입): 월보험료 포함
  - 보험회사별 메시지 템플릿 적용
- [ ] SMS 발송 대상 확인:
  - 관리자 2명 이상: 각각 발송 (dagun=1 또는 2)
  - 관리자 1명: `2012DaeriCompany.hphone`으로 발송

### 3. 현대해상 API 호출

- [ ] 청약 처리 시 현대해상(insuranceCompany=4)인지 확인
- [ ] `kj-hyundai-api.php`의 `sendHyundaiDriverInfo` 함수 호출
- [ ] 암호화 처리 (`encryptForHyundai` 함수)

### 4. 기타 업데이트

- [ ] `2012EndorseList` 테이블 업데이트 (배서건수 정리)
- [ ] DB 손보(insuranceCompany=2)인 경우 추가 필드 업데이트:
  - `dongbuSelNumber`
  - `dongbusigi`
  - `dongbujeongi`
  - `nabang_1`

---

## 우선순위

### 높음 (1차 개발)
1. API 파일 수정 - push/cancel 값 계산 로직
2. API 파일 수정 - manager, reasion 필드 업데이트
3. 프론트엔드 확인 - 파라미터 전달
4. Node.js 프록시 확인

### 중간 (2차 개발 - 보험료 계산)
1. 보험료 계산 함수 연동
2. 보험료 데이터 조회

### 낮음 (2차 개발 - SMS 발송)
1. SMS 발송 로직 구현
2. 현대해상 API 연동
3. 기타 업데이트 (2012EndorseList 등)

---

## 참고

- 기획서: `kj-배서처리-상태-업데이트-API-기획서.md`
- 로직 정리: `kj-배서-상태-처리-로직-정리.md`
- 이전 버전 분석: `kj-배서처리-이전버전-소스-분석.md`
- 유틸리티 파일: `pci0327/api/utils/` 폴더


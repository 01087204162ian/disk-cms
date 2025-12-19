# KJ 배서처리 이전 버전 소스 분석

## 1. 개요

이 문서는 배서처리 상태 업데이트 기능을 구현하기 위해 이전 버전 소스 코드를 분석한 결과입니다.

## 2. 주요 파일 구조

### 2.1 메인 파일
- **파일명**: 이전 버전 PHP 파일 (제공된 소스)
- **기능**: 배서처리 상태 업데이트, 보험료 계산, SMS 발송

### 2.2 포함 파일들
- `./php/monthlyFee.php` - calculateEndorsePremium 함수
- `./php/calculatePersonalRate.php` - 할인할증률 계산
- `./php/encryption.php` - 암호화/복호화
- `./php/coSms.php` - SMS 발송 로직
- `../smsApi/smsAligo.php` - Aligo SMS API 호출
- `./php/hcurl.php` - 현대해상 API 호출

## 3. 처리 흐름

### 3.1 입력 파라미터
```php
$num = $_POST['num'] ?? '';           // 2012DaeriMember.num
$status = $_POST['status'] ?? '';     // 상태 값 (사용되지 않음?)
$push = $_POST['push'] ?? '';         // push 값 (1,3,4,5,6)
$manager = $_POST['userName'] ?? '';  // 처리자 이름
$reasion = $_POST['reasion'] ?? '';   // 처리 사유
$smsContents = $_POST['smsContents'] ?? ''; // SMS 내용 (취소/거절 시)
```

### 3.2 처리 순서

1. **데이터 조회**
   - `2012DaeriMember` 테이블에서 `num`으로 조회
   - 이미 처리된 건(`sangtae=2`) 검증

2. **데이터 복호화**
   - `Hphone` (전화번호) 복호화
   - `Jumin` (주민번호) 복호화

3. **push 값에 따른 상태 처리** (switch)
   - case 1: 청약 → 가입완료 (push=4, sms=1)
   - case 6: 청약 취소 (push=1, cancel=12, sms=2)
   - case 3: 청약 거절 (push=1, cancel=13, sms=2)
   - case 4: 해지 처리 (push=2, cancel=42, sms=1)
   - case 5: 해지 취소 (push=4, cancel=45, sms=2)

4. **DB 업데이트**
   - DB 손보인 경우: 추가 필드 업데이트
   - 기타 보험사: 기본 필드만 업데이트

5. **보험료 계산** (2차 개발 시 필요)
   - 할인할증률 조회 (`2019rate` 테이블)
   - divi 값 조회 (`2012CertiTable`)
   - 나이 계산
   - 월보험료 계산 (`calculateProRatedFee`)
   - C보험료 계산 (`calculateEndorsePremium`)

6. **SMS 발송** (조건부)
   - `sms=1`: 가입완료/해지완료 자동 메시지
   - `sms=2`: 취소/거절 사용자 입력 메시지

## 4. push 값별 상세 처리 로직

### 4.1 case 1: 청약 → 가입완료
```php
case 1: // 청약을 정상으로
    $push_2 = 4;
    $push = 4;      // 최종 push 값
    $sms = 1;       // SMS 발송 (가입완료)
    $message = "가입완료";
    break;
```

**변경사항**:
- push: 1 → 4
- cancel: null
- SMS 발송 조건: `divi=2` (월납입)인 경우만 발송

### 4.2 case 6: 청약 취소
```php
case 6: // 청약을 취소
    $push_2 = 6;
    $push = 1;      // 최종 push 값 (청약 상태 유지)
    $cancel = 12;   // 취소 코드
    $sms = 2;       // SMS 발송 (취소 메시지)
    $message = "청약취소";
    break;
```

**변경사항**:
- push: 1 → 1 (유지)
- cancel: 12
- SMS: 발송하지 않음 (새 요구사항)

### 4.3 case 3: 청약 거절
```php
case 3: // 청약을 거절
    $push_2 = 3;
    $push = 1;      // 최종 push 값 (청약 상태 유지)
    $cancel = 13;   // 거절 코드
    $sms = 2;       // SMS 발송 (거절 메시지)
    $message = "청약거절";
    break;
```

**변경사항**:
- push: 1 → 1 (유지)
- cancel: 13
- SMS: 발송하지 않음 (새 요구사항)

### 4.4 case 4: 해지 처리
```php
case 4: // 정상을 해지로
    $push_2 = 2;
    $push = 2;      // 최종 push 값 (해지 완료)
    $cancel = 42;   // 해지 코드
    $sms = 1;       // SMS 발송 (해지완료)
    $message = "해지완료";
    break;
```

**변경사항**:
- push: 4 → 2
- cancel: 42
- SMS 발송 조건: `divi=2` (월납입)인 경우만 발송

### 4.5 case 5: 해지 취소
```php
case 5: // 해지 신청한 것을 취소
    $push_2 = 5;
    $push = 4;      // 최종 push 값 (정상 처리로 복귀)
    $cancel = 45;   // 해지 취소 코드
    $sms = 2;       // SMS 발송 (취소 메시지)
    $message = "해지취소";
    break;
```

**변경사항**:
- push: 4 → 4 (유지)
- cancel: 45
- SMS: 발송하지 않음 (새 요구사항)

## 5. SMS 발송 로직 (coSms.php)

### 5.1 SMS 발송 조건

**이전 버전**:
- `sms=1`: 가입완료/해지완료 자동 메시지 생성 및 발송
- `sms=2`: 취소/거절 사용자 입력 메시지 발송

**새 요구사항**:
- 청약 처리 (가입완료): `divi=2` (월납입)인 경우만 SMS 발송
- 해지 처리 (해지완료): `divi=2` (월납입)인 경우만 SMS 발송
- 청약 취소/거절, 해지 취소: SMS 발송하지 않음

### 5.2 SMS 메시지 구성

#### divi=1 (정상분납)인 경우
```php
// 해지 (push=2)
$msg = $insCom . $etagName . $row['Name'] . "님 해지기준일[" . $endorse_day . "][" . $po . "]" . "배" . number_format($row2['Endorsement_insurance_company_premium']);

// 청약 (push=4)
$msg = $insCom . $etagName . $row['Name'] . "님 기준일[" . $endorse_day . "][" . $po . "] 년" . number_format($PreminumYear) . "배" . number_format($row2['Endorsement_insurance_company_premium']);
```

#### divi=2 (월납입)인 경우
```php
// 해지 (push=2)
$msg = $insCom . $etagName . $row['Name'] . "님 해지기준일[" . $endorse_day . "][" . $po . "]" . number_format($row2['Endorsement_insurance_premium']);

// 청약 (push=4)
$msg = $insCom . $etagName . $row['Name'] . "님 기준일[" . $endorse_day . "][" . $po . "]월" . number_format($PreminumMonth) . "배" . number_format($row2['Endorsement_insurance_premium']);
```

### 5.3 SMS 발송 대상

1. **관리자가 2명 이상인 경우** (`2012Costomer` 테이블):
   - 각 관리자에게 개별 발송
   - 첫 번째 관리자만 `dagun=1`, 나머지는 `dagun=2`

2. **관리자가 1명인 경우**:
   - `2012DaeriCompany.hphone`으로 발송
   - `dagun=1`

### 5.4 SMSData 테이블 저장

저장되는 주요 필드:
- `SendId`: 'csdrive'
- `RecvName`: 'CS'
- `Msg`: SMS 메시지 내용
- `preminum`: 배서보험료 (`divi=1`이면 빈 문자열)
- `c_preminum`: 회사보험료
- `2012DaeriMemberNum`: 배서 멤버 번호
- `2012DaeriCompanyNum`: 대리운전 회사 번호
- `policyNum`: 증권번호
- `endorse_day`: 배서일
- `push`: push 값 (`push_2` 사용)
- `dagun`: 중복 발송 방지 플래그

### 5.5 Aligo SMS API 호출

```php
$receiver = $hphone1.$hphone2.$hphone3;
$sendData = [
    "receiver" => $receiver,
    "msg" => $msg,
    "testmode_yn" => "N"
];
$result = sendAligoSms($sendData);
```

## 6. 현대해상 API 호출 (hcurl.php)

### 6.1 호출 조건
- `InsuraneCompany == 4` (현대화재)
- `push == 4` (청약/가입완료)

### 6.2 전송 데이터
- `siteGubun`: "KJ"
- `driverCompony`: 대리운전 회사명
- `driverName`: 운전자 이름
- `driverCell`: 핸드폰 번호 (AES 암호화)
- `driverJumin`: 주민번호 (AES 암호화)
- `policyNumber`: 증권번호
- `validStartDay`: 보험시작일 (YYYYMMDD)
- `validEndDay`: 보험종료일 (YYYYMMDD)

### 6.3 암호화 방식
- 알고리즘: AES-256-CBC
- Key: `CB1C198B747B87D03DFF8FA2CE776F1D`
- IV: `f95ef629cdc8e11a`

## 7. 보험료 계산

### 7.1 월보험료 계산 (calculateProRatedFee)
- **입력**: 월 기본보험료, 월 특약보험료, 월 합계보험료, 보험회사, 정기결제일, 배서일 등
- **출력**: 일할 계산된 배서보험료

### 7.2 C보험료 계산 (calculateEndorsePremium)
- **입력**: 보험시작일, 배서일, 분납횟수, 분납회차, 1/10 보험료, 보험회사, 할인할증률 등
- **출력**: C보험료 (미경과 기간 보험료 - 다음 회차 보험료)

## 8. DB 업데이트 필드

### 8.1 모든 보험사 공통
```sql
UPDATE 2012DaeriMember SET 
    push = :push,
    sangtae = '2',
    cancel = :cancel,
    ch = '1',
    reasion = :reasion,
    manager = :manager
WHERE num = :num
```

### 8.2 DB 손보 (insuranceCompany=2) 추가 필드
```sql
UPDATE 2012DaeriMember SET 
    ... (공통 필드)
    dongbuSelNumber = :selNum,
    dongbusigi = :sigi,
    dongbujeongi = :jeonggi,
    nabang_1 = :cheriii
WHERE num = :num
```

## 9. 새 API 설계 시 변경사항

### 9.1 프론트엔드 연동 방식 변경
- **이전**: `push` 값(1,3,4,5,6)을 직접 전달
- **새 방식**: `endorseProcess` 문자열("청약", "취소", "거절", "해지") 전달

### 9.2 SMS 발송 조건 변경
- **이전**: `sms=1` 또는 `sms=2`로 발송 여부 결정
- **새 방식**: 
  - 청약/해지 처리 시: `divi=2`인 경우만 발송
  - 취소/거절: 발송하지 않음

### 9.3 파일 구조 변경
- **이전**: `kj/api/kjDaeri/php/` 하위 파일들 직접 include
- **새 방식**: `pci0327/api/utils/` 폴더에 유틸리티 함수로 정리

## 10. util 폴더에 필요한 파일

1. **kj-sms-utils.php**: SMS 발송 로직 (coSms.php 기반)
2. **kj-sms-aligo.php**: Aligo SMS API 함수 (smsAligo.php 기반)
3. **kj-hyundai-api.php**: 현대해상 API 함수 (hcurl.php 기반)
4. **kj-endorse-utils.php**: 이미 존재 (보험료 계산 함수 포함)

## 11. 참고사항

- 이전 버전은 `DaeriMember` 테이블을 사용했지만, 실제 테이블명은 `2012DaeriMember`입니다.
- 이전 버전 코드에는 일부 미사용 변수나 주석 처리된 코드가 있습니다.
- 보험료 계산은 2차 개발 단계에서 구현 예정입니다.


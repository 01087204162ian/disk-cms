# KJ 대리운전 배서 상태 처리 로직 정리

## 1. 개요

이전 버전 소스 코드를 기반으로 배서 상태(청약/해지) 및 처리 상태(취소/거절)에 따른 처리 로직을 정리합니다.

## 2. 상태 값 정의

### 2.1 push 값 (배서 상태)
- **1**: 청약 (신청 상태)
- **2**: 해지 완료 (정상 → 해지)
- **4**: 정상 처리 (청약 → 가입완료)
- **6**: 청약 취소 (임시 값, 최종 push=1)
- **3**: 청약 거절 (임시 값, 최종 push=1)
- **5**: 해지 취소 (임시 값, 최종 push=4)

### 2.2 sangtae 값 (배서처리 상태)
- **1**: 미처리
- **2**: 처리 완료

### 2.3 cancel 값 (취소/거절 상태)
- **12**: 청약 취소
- **13**: 청약 거절
- **42**: 해지 완료
- **45**: 해지 취소

### 2.4 프론트엔드 상태 선택 옵션
- **청약 상태 (push=1)**: "청약", "취소", "거절"
- **해지 상태 (push=4)**: "해지", "취소"

## 3. 상태 처리 로직 (이전 버전 분석)

### 3.1 이전 버전 코드의 switch ($push) 로직

```php
switch ($push) {
    case 1: // 청약을 정상으로 (가입완료)
        $push_2 = 4;
        $push = 4;      // 최종 push 값
        $sms = 1;       // SMS 발송 (가입완료)
        $message = "가입완료";
        break;
        
    case 6: // 청약을 취소
        $push_2 = 6;
        $push = 1;      // 최종 push 값 (청약 상태 유지)
        $cancel = 12;   // 취소 코드
        $sms = 2;       // SMS 발송 (취소 메시지)
        $message = "청약취소";
        break;
        
    case 3: // 청약을 거절
        $push_2 = 3;
        $push = 1;      // 최종 push 값 (청약 상태 유지)
        $cancel = 13;   // 거절 코드
        $sms = 2;       // SMS 발송 (거절 메시지)
        $message = "청약거절";
        break;
        
    case 4: // 정상을 해지로 (해지 완료)
        $push_2 = 2;
        $push = 2;      // 최종 push 값 (해지 완료)
        $cancel = 42;   // 해지 코드
        $sms = 1;       // SMS 발송 (해지완료)
        $message = "해지완료";
        break;
        
    case 5: // 해지 신청한 것을 취소
        $push_2 = 5;
        $push = 4;      // 최종 push 값 (정상 처리로 복귀)
        $cancel = 45;   // 해지 취소 코드
        $sms = 2;       // SMS 발송 (취소 메시지)
        $message = "해지취소";
        break;
}
```

### 3.2 문제점 분석

**주의**: 이전 버전 코드에서는 `$push` 값을 switch의 case로 사용하고 있지만, 실제로는 **선택된 상태 값**을 의미합니다.

예를 들어:
- "청약"을 "취소"로 변경 → case 6이지만, 이는 선택한 액션이 "취소"라는 의미
- "청약"을 "거절"로 변경 → case 3이지만, 이는 선택한 액션이 "거절"이라는 의미

## 4. 새로운 API 설계 (프론트엔드 기반)

### 4.1 프론트엔드에서 전달되는 값

현재 프론트엔드 코드를 보면:
- **청약 상태 (push=1)**: "청약", "취소", "거절" 옵션
- **해지 상태 (push=4)**: "해지", "취소" 옵션

따라서 API에서는:
1. 현재 `push` 값 확인
2. 선택된 `endorseProcess` 값 확인 ("청약", "취소", "거절", "해지")
3. sangtae 값 확인 (1=미처리, 2=처리)

### 4.2 상태 변경 로직 정리

#### 케이스 1: 청약 → 가입완료 (정상 처리)
- **현재 상태**: push=1, sangtae=1 (청약, 미처리)
- **선택 액션**: "청약" 유지 + sangtae=2 (처리)
- **변경 결과**:
  - push: 1 → 4 (정상 처리)
  - sangtae: 1 → 2 (처리 완료)
  - cancel: null
  - **SMS 발송**: divi 값과 관계없이 발송
    - `divi = 1` (정상분납): 년보험료, 배서보험료 문자 메시지 발송
    - `divi = 2` (월납입): 월보험료, 배서보험료 문자 메시지 발송

#### 케이스 2: 청약 → 취소
- **현재 상태**: push=1, sangtae=1 (청약, 미처리)
- **선택 액션**: "취소" 선택 + sangtae=2 (처리)
- **변경 결과**:
  - push: 1 → 1 (청약 상태 유지)
  - sangtae: 1 → 2 (처리 완료)
  - cancel: 12 (청약 취소)
  - **SMS**: 발송하지 않음

#### 케이스 3: 청약 → 거절
- **현재 상태**: push=1, sangtae=1 (청약, 미처리)
- **선택 액션**: "거절" 선택 + sangtae=2 (처리)
- **변경 결과**:
  - push: 1 → 1 (청약 상태 유지)
  - sangtae: 1 → 2 (처리 완료)
  - cancel: 13 (청약 거절)
  - **SMS**: 발송하지 않음

#### 케이스 4: 해지 → 해지 완료
- **현재 상태**: push=4, sangtae=1 (해지 신청, 미처리)
- **선택 액션**: "해지" 유지 + sangtae=2 (처리)
- **변경 결과**:
  - push: 4 → 2 (해지 완료)
  - sangtae: 1 → 2 (처리 완료)
  - cancel: 42 (해지 완료)
  - **SMS 발송**: divi 값과 관계없이 발송
    - `divi = 1` (정상분납): 배서보험료(회사보험료) 문자 메시지 발송
    - `divi = 2` (월납입): 배서보험료(월보험료) 문자 메시지 발송

#### 케이스 5: 해지 → 취소
- **현재 상태**: push=4, sangtae=1 (해지 신청, 미처리)
- **선택 액션**: "취소" 선택 + sangtae=2 (처리)
- **변경 결과**:
  - push: 4 → 4 (정상 처리 상태 유지)
  - sangtae: 1 → 2 (처리 완료)
  - cancel: 45 (해지 취소)
  - **SMS**: 발송하지 않음

**문제**: 케이스 5에서 해지 취소 시 push 값을 어떻게 처리해야 할까?

이전 버전 코드를 보면:
- case 5: push=4 → push=4로 변경

하지만 논리적으로는:
- 해지 신청을 취소했으므로 → 정상 처리(push=4) 상태로 복귀해야 함

**결론**: 해지 취소 시 push=4 유지가 맞습니다. (이미 정상 처리된 상태이므로)

## 5. API 요청/응답 설계

### 5.1 요청 파라미터

```json
{
  "num": 12345,                    // 필수: 2012DaeriMember 테이블의 num
  "sangtae": 2,                    // 필수: 배서처리 상태 (1=미처리, 2=처리)
  "endorseProcess": "청약",        // 선택: 배서 처리 상태 ("청약", "취소", "거절", "해지")
  "manager": "홍길동",             // 필수: 처리자 이름
  "reasion": "처리 사유"           // 선택: 처리 사유
}
```

### 5.2 처리 로직 의사코드

```php
// 1. 기존 데이터 조회
$currentData = SELECT * FROM 2012DaeriMember WHERE num = :num;
$currentPush = $currentData['push'];
$currentSangtae = $currentData['sangtae'];

// 2. 이미 처리된 건 검증
if ($currentSangtae == 2 && $newSangtae == 2) {
    // 이미 처리된 건인 경우
    // 단, 취소/거절로 변경하는 경우는 허용?
}

// 3. push 값과 endorseProcess에 따른 처리
// 4. divi 값 조회 (SMS 발송 조건 확인용)
$certiTableSql = "SELECT divi FROM 2012CertiTable WHERE num = :cNum";
$certiTableStmt = $pdo->prepare($certiTableSql);
$certiTableStmt->bindParam(':cNum', $currentData['CertiTableNum'], PDO::PARAM_INT);
$certiTableStmt->execute();
$certiTableRow = $certiTableStmt->fetch(PDO::FETCH_ASSOC);
$divi = $certiTableRow['divi'] ?? null; // 1=정상분납, 2=월납입

// 5. push 값과 endorseProcess에 따른 처리
$sendSms = false; // SMS 발송 여부
if ($currentPush == 1) {
    // 청약 상태
    switch ($endorseProcess) {
        case '청약': // 정상 처리
            $newPush = 4;
            $newCancel = null;
            // divi 값과 관계없이 SMS 발송
            $sendSms = true;
            break;
        case '취소':
            $newPush = 1;
            $newCancel = 12;
            // SMS 발송하지 않음
            break;
        case '거절':
            $newPush = 1;
            $newCancel = 13;
            // SMS 발송하지 않음
            break;
    }
} else if ($currentPush == 4) {
    // 해지 상태
    switch ($endorseProcess) {
        case '해지': // 해지 완료
            $newPush = 2;
            $newCancel = 42;
            // divi 값과 관계없이 SMS 발송
            $sendSms = true;
            break;
        case '취소':
            $newPush = 4; // 정상 상태 유지
            $newCancel = 45;
            // SMS 발송하지 않음
            break;
    }
}

// 4. 업데이트 실행
UPDATE 2012DaeriMember 
SET 
    sangtae = :sangtae,
    push = :push,
    cancel = :cancel,
    manager = :manager,
    reasion = :reasion
WHERE num = :num;
```

## 6. 주의사항

### 6.1 해지 취소 처리
- 해지 신청을 취소했을 때 push 값을 어떻게 처리할지 명확히 해야 함
- 이전 버전: push=4 유지
- 논리적: 정상 처리 상태로 복귀해야 하나?

### 6.2 상태 전이 규칙
- 이미 처리된 건(sangtae=2)을 다시 처리할 수 있는지?
- 취소/거절 상태에서 다시 정상 처리로 변경할 수 있는지?

### 6.3 SMS 발송 조건

#### SMS 발송이 필요한 경우
- **청약 처리 (가입완료)**: `divi = 2` (월납입, 12회분납)인 경우에만 발송
  - 월보험료, 배서보험료 문자 메시지를 대리운전 담당자에게 발송
- **해지 처리 (해지완료)**: `divi = 2` (월납입, 12회분납)인 경우에만 발송
  - 월보험료, 배서보험료 문자 메시지를 대리운전 담당자에게 발송

#### SMS 발송하지 않는 경우
- 청약 취소 (cancel=12): SMS 발송하지 않음
- 청약 거절 (cancel=13): SMS 발송하지 않음
- 해지 취소 (cancel=45): SMS 발송하지 않음
- 정상분납 (divi=1)인 경우: 청약/해지 처리 시에도 SMS 발송하지 않음

#### divi 값 정의
- **divi = 1**: 정상분납 (정상납)
- **divi = 2**: 월납입 (12회분납, 월납)

## 7. 다음 단계

1. **프론트엔드 수정**: 상태 select에서 선택한 값을 API로 전달하도록 수정
2. **API 구현**: 위 로직을 기반으로 API 구현
3. **테스트**: 각 케이스별 테스트
4. **문서화**: 최종 결정된 로직 문서화

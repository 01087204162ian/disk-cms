# pharmacy-status-update.php 오류 해결 가이드

**문제**: `recalculatePremiumForRefund()` 함수가 정의되지 않음  
**파일**: `pharmacy-status-update.php` (330번째 줄)  
**에러**: `Fatal error: Call to undefined function recalculatePremiumForRefund()`

---

## 문제 분석

### 발생 상황
- 승인(13) → 메일보냄(10) 변경 시
- 승인(13) → 보류(7) 변경 시

### 원인
330번째 줄에서 `recalculatePremiumForRefund()` 함수를 호출하지만, 해당 함수가 정의되어 있지 않음.

---

## 해결 방법

### 방법 1: 함수 호출 제거 (권장)

보류(7)나 메일보냄(10)으로 상태 변경 시 보험료를 재계산할 필요가 없다면, 함수 호출을 제거합니다.

**수정 위치**: `pharmacy-status-update.php` 330번째 줄 근처

```php
// 수정 전
recalculatePremiumForRefund($pharmacy_id);

// 수정 후
// recalculatePremiumForRefund($pharmacy_id); // 제거 또는 주석 처리
```

**이유**:
- 보류(7): 예치금 환급만 필요 (보험료 재계산 불필요)
- 메일보냄(10): 상태 변경만 필요 (보험료 재계산 불필요)
- 보험료 재계산은 보통 "메일보냄(10) → 승인(13)" 변경 시에만 필요

---

### 방법 2: 함수 구현 (필요한 경우)

만약 보류나 메일보냄 변경 시 실제로 보험료 재계산이 필요하다면, 함수를 구현합니다.

#### 2.1 함수 정의 위치

`pharmacy-status-update.php` 파일 상단에 함수 정의 추가:

```php
/**
 * 환급을 위한 보험료 재계산
 * 보류(7)나 메일보냄(10)으로 변경 시 사용
 * 
 * @param int $pharmacy_id 약국 ID
 * @return bool 성공 여부
 */
function recalculatePremiumForRefund($pharmacy_id) {
    global $connection; // 또는 DB 연결 변수
    
    try {
        // 1. 약국 정보 조회
        $stmt = $connection->prepare("SELECT * FROM pharmacyApply WHERE num = ?");
        $stmt->execute([$pharmacy_id]);
        $pharmacy = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$pharmacy) {
            return false;
        }
        
        // 2. 보험료 계산 API 호출 (기존 계산 로직 재사용)
        // account 값에 따라 다른 API 사용
        $account = $pharmacy['account'];
        
        if ($account == 1 || $account == 7) {
            // 일반 보험료 계산
            // pharmacy-premium-calculate.php 로직 재사용
        } else if ($account == 6 || $account == 8) {
            // 유비케어 보험료 계산
            // pharmacy-premium-calculate-ubcare.php 로직 재사용
        }
        
        // 3. 보험료 업데이트
        // pharmacyApply 테이블의 premium 필드 업데이트
        
        return true;
        
    } catch (Exception $e) {
        error_log("recalculatePremiumForRefund 오류: " . $e->getMessage());
        return false;
    }
}
```

#### 2.2 기존 계산 로직 재사용

`pharmacy-premium-calculate.php` 또는 `pharmacy-premium-calculate-ubcare.php`의 계산 로직을 함수로 분리하여 재사용:

```php
// premium-functions.php 파일에 공통 함수 정의
function calculatePremium($pharmacy_id, $account) {
    // 기존 보험료 계산 로직
}

// pharmacy-status-update.php에서 사용
require_once 'premium-functions.php';

function recalculatePremiumForRefund($pharmacy_id) {
    global $connection;
    
    $stmt = $connection->prepare("SELECT account FROM pharmacyApply WHERE num = ?");
    $stmt->execute([$pharmacy_id]);
    $pharmacy = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($pharmacy) {
        return calculatePremium($pharmacy_id, $pharmacy['account']);
    }
    
    return false;
}
```

---

### 방법 3: 조건부 호출 (안전한 방법)

함수가 없어도 오류가 발생하지 않도록 조건부 호출:

```php
// 수정 전
recalculatePremiumForRefund($pharmacy_id);

// 수정 후
if (function_exists('recalculatePremiumForRefund')) {
    recalculatePremiumForRefund($pharmacy_id);
} else {
    // 함수가 없으면 보험료 재계산을 건너뛰고 상태만 변경
    // 또는 로그만 기록
    error_log("recalculatePremiumForRefund 함수가 정의되지 않음. 약국ID: " . $pharmacy_id);
}
```

---

## 권장 해결 방법

**방법 1 (함수 호출 제거)**를 권장합니다.

**이유**:
1. 보류(7)로 변경: 예치금 환급만 필요, 보험료 재계산 불필요
2. 메일보냄(10)으로 변경: 상태 변경만 필요, 보험료 재계산 불필요
3. 보험료 재계산은 "메일보냄(10) → 승인(13)" 변경 시에만 필요 (이미 다른 로직으로 처리됨)

---

## 확인 사항

수정 전에 다음을 확인하세요:

1. **330번째 줄 근처 코드 컨텍스트 확인**
   - 어떤 상태 변경 시 호출되는지
   - 함수 호출 전후 로직 확인

2. **다른 파일에서 같은 함수 호출 여부 확인**
   ```bash
   grep -r "recalculatePremiumForRefund" /path/to/pharmacy/api/
   ```

3. **기존 보험료 계산 로직 확인**
   - `pharmacy-premium-calculate.php` 확인
   - `pharmacy-premium-calculate-ubcare.php` 확인

---

## 테스트

수정 후 다음 시나리오를 테스트하세요:

1. ✅ 승인(13) → 보류(7) 변경
2. ✅ 승인(13) → 메일보냄(10) 변경
3. ✅ 메일보냄(10) → 승인(13) 변경 (기존 로직 확인)
4. ✅ 예치금 환급이 정상적으로 처리되는지 확인
5. ✅ 정산 기록이 정상적으로 변경되는지 확인

---

**작성일**: 2026-01  
**문제 발견일**: 2026-01  
**해결 방법**: 방법 1 권장 (함수 호출 제거)


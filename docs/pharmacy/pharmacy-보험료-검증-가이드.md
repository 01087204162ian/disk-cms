# 약국배상책임보험 보험료 검증 가이드

**작성일**: 2025-01-XX

---

## 📋 문제 상황

리스트 화면에 표시되는 보험료와 약국 상세 화면에서 확인되는 보험료가 서로 상이함

---

## 🔍 원인 분석

### 1. 리스트 화면 보험료

**데이터 소스**: `pharmacy-list.php`
- `pharmacyApply` 테이블의 `preminum` 필드를 직접 조회
- DB에 저장된 값을 그대로 표시

**코드 위치**:
```php
// pharmacy-list.php
pa.preminum,
```

---

### 2. 상세 화면 보험료

**데이터 소스**: `pharmacyApply-num-detail.php`
- `getDetailWithPremiumCalculation()` 함수 사용
- 특정 상태(승인, 계약완료 등)가 아니면 보험료를 **재계산**
- 재계산된 값이 DB에 업데이트됨

**코드 위치**:
```php
// pharmacyApply-num-detail.php
$data = $service->getDetailWithPremiumCalculation($num);
```

**보험료 계산 제외 상태**:
- `6`: 계약완료
- `13`: 승인
- `14`: 증권발급
- `15`: 해지요청
- `16`: 해지완료

---

## 🛠️ 검증 방법

### 방법 1: UI에서 검증 버튼 사용

#### 리스트 화면
1. 약국 목록 테이블의 **보험료 컬럼** 옆에 있는 **검증 아이콘** 클릭
2. 검증 결과 확인

#### 상세 화면
1. 약국 상세 모달에서 **보험료(기본)** 라벨 옆의 **검증 아이콘** 클릭
2. 검증 결과 확인
3. 불일치 시 상세 정보 표시

---

### 방법 2: API 직접 호출

#### 특정 약국 검증
```bash
GET /api/pharmacy/premium-verify?pharmacy_id=123
```

**응답 예시**:
```json
{
  "success": true,
  "pharmacy_id": 123,
  "company": "테스트약국",
  "status": "13",
  "db_premium": 150000,
  "calculated_premium": 150000,
  "difference": 0,
  "is_match": true,
  "expert_count": 2,
  "area": 100,
  "inventory_value": "3"
}
```

#### 전체 약국 검증
```bash
GET /api/pharmacy/premium-verify?all=1
```

**응답 예시**:
```json
{
  "success": true,
  "total_checked": 100,
  "mismatches": 5,
  "matches": 95,
  "results": [...],
  "mismatch_list": [...]
}
```

---

### 방법 3: 브라우저 개발자 도구

#### Console에서 직접 호출
```javascript
// 특정 약국 검증
fetch('/api/pharmacy/premium-verify?pharmacy_id=123')
  .then(res => res.json())
  .then(data => console.log('검증 결과:', data));

// 전체 검증
fetch('/api/pharmacy/premium-verify?all=1')
  .then(res => res.json())
  .then(data => {
    console.log('전체 검증 결과:', data);
    console.log('불일치 항목:', data.mismatch_list);
  });
```

---

## 📊 검증 결과 해석

### 일치하는 경우 (`is_match: true`)
- DB에 저장된 보험료와 계산된 보험료가 일치
- 정상 상태

### 불일치하는 경우 (`is_match: false`)
- DB에 저장된 보험료와 계산된 보험료가 다름
- 가능한 원인:
  1. 보험료 계산 로직 변경 후 DB 업데이트 안 됨
  2. 면적 수정 후 보험료 재계산 안 됨
  3. 상태 변경 시 보험료 재계산 로직 문제
  4. 80㎡ 미만 처리 문제

---

## 🔧 불일치 해결 방법

### 방법 1: 상세 화면에서 재계산
1. 약국 상세 모달 열기
2. 보험료가 자동으로 재계산됨 (상태가 제외 상태가 아닌 경우)
3. 리스트 화면 새로고침 후 확인

### 방법 2: 보험료 계산 API 직접 호출
```javascript
// 약국 상세 모달에서 보험료 계산 버튼 클릭
// 또는 담보 정보 수정 후 자동 계산
```

### 방법 3: DB 직접 업데이트 (관리자용)
```sql
-- 보험료 재계산 후 업데이트
UPDATE pharmacyApply 
SET preminum = [계산된 보험료]
WHERE num = [약국번호];
```

---

## 📝 검증 API 상세

### 엔드포인트
```
GET /api/pharmacy/premium-verify
```

### 파라미터
- `pharmacy_id` (선택): 특정 약국 ID
- `all` (선택): `1`이면 전체 검증 (최대 100건)

### 응답 필드
- `db_premium`: DB에 저장된 보험료
- `calculated_premium`: 계산된 보험료
- `difference`: 차이 금액
- `is_match`: 일치 여부 (true/false)
- `expert_premium`: 전문인 보험료
- `fire_premium`: 화재 보험료

---

## 🎯 검증 시나리오

### 시나리오 1: 리스트와 상세 화면 비교
1. 리스트 화면에서 보험료 확인
2. 약국 상세 모달 열기
3. 상세 화면에서 보험료 확인
4. 검증 버튼 클릭하여 비교

### 시나리오 2: 면적 수정 후 검증
1. 약국 상세 모달에서 면적 수정
2. 보험료 자동 계산 확인
3. 검증 버튼 클릭하여 DB 값과 비교

### 시나리오 3: 상태 변경 후 검증
1. 상태를 '메일보냄'으로 변경
2. 약국 정보 수정
3. 상태를 '승인'으로 변경
4. 검증 버튼 클릭하여 보험료 확인

---

## 📌 주의사항

1. **승인 상태(13)**: 보험료 계산이 제외되므로 DB 값 그대로 표시
2. **계산 제외 상태**: 계약완료(6), 증권발급(14), 해지요청(15), 해지완료(16)
3. **80㎡ 미만 처리**: 계산 시 80㎡로 처리되지만 DB에는 원래 값 저장 가능
4. **전체 검증**: 최대 100건까지만 검증 (성능 고려)

---

## 🔄 자동 검증 (향후 개선)

### 제안 사항
1. 리스트 화면 로드 시 자동 검증
2. 불일치 항목에 시각적 표시 (빨간색 배지)
3. 일괄 보험료 재계산 기능
4. 검증 리포트 생성

---

**문서 버전**: 1.0  
**최종 업데이트**: 2025-01-XX


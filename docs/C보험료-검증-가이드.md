# C보험료 계산 검증 가이드

## 1. API 호출하여 데이터 확인

### 브라우저 개발자 도구 사용

1. 배서 리스트 페이지 열기: `https://disk-cms.simg.kr/pages/insurance/kj-driver-endorse-list.html`
2. 개발자 도구 열기 (F12)
3. Network 탭에서 API 호출 확인:
   - 필터: `kj-endorse/list`
   - 실제 호출 URL 예시: `/api/insurance/kj-endorse/list?page=1&limit=20&push=1`
4. 응답 데이터 확인:
   ```json
   {
     "success": true,
     "data": [
       {
         "num": 196287,
         "premium": 51610,
         "cPremium": 2301850,
         ...
       }
     ]
   }
   ```

### 직접 API 호출 (브라우저 콘솔)

```javascript
// 특정 데이터 조회
fetch('/api/insurance/kj-endorse/list?page=1&limit=1&push=1')
  .then(res => res.json())
  .then(data => {
    console.log('API 응답:', data);
    if (data.data && data.data.length > 0) {
      const item = data.data[0];
      console.log('검증 대상 데이터:', {
        num: item.num,
        premium: item.premium,
        cPremium: item.cPremium,
        policyNum: item.policyNum,
        standardDate: item.standardDate,
        age: item.age
      });
    }
  });
```

## 2. 로그 파일 확인

### 로그 파일 위치
```
pci0327/api/insurance/kj-endorse-list-YYYY-MM-DD.log
```

### 로그에서 확인할 내용

#### 계산 전 파라미터 로그
```
[2025-12-17 10:30:45] C보험료 계산 파라미터: num=196287, startDay=2025-10-01, endorse_day=2025-12-17, nabang=10, nabang_1=2, payment10_premium1=65906, payment10_premium2=0, payment10_premium_total=65906, InsuraneCompany=4, rate=1, etag=1
```

#### 계산 후 결과 로그
```
[2025-12-17 10:30:45] C보험료 계산 결과: num=196287, cPremium=2301850, yearPremium=659060, unexpired_period_premium=XXX, daum_premium=XXX, unexpired_period=XXX
```

### 로그 파일 확인 방법

#### 서버에서 직접 확인
```bash
# 최신 로그 파일 확인
tail -f pci0327/api/insurance/kj-endorse-list-$(date +%Y-%m-%d).log

# 특정 num 값으로 필터링
grep "num=196287" pci0327/api/insurance/kj-endorse-list-*.log
```

#### Windows에서 확인
```powershell
# 최신 로그 파일 열기
Get-Content "pci0327\api\insurance\kj-endorse-list-$(Get-Date -Format 'yyyy-MM-dd').log" -Tail 50

# 특정 num 값 검색
Select-String -Path "pci0327\api\insurance\kj-endorse-list-*.log" -Pattern "num=196287"
```

## 3. 계산 과정 단계별 검증

### C보험료 계산 공식

**중요**: `payment10_premium_total`은 이미 10회 분납 합계(연간 보험료)입니다.

```
1. 연간 보험료 (yearPremium)
   = payment10_premium_total × 할인할증률
   (또는 payment10_premium_total이 없으면 payment10_premium1 × 10 × 할인할증률)

2. 일일 보험료 (oneDayPremium)
   = yearPremium / 365

3. 미경과 기간 보험료 (unexpired_period_premium)
   = unexpired_period × oneDayPremium

4. 다음 회차 보험료 (daum_premium)
   = yearPremium × 회차별 비율
   (회차 1: 80%, 2: 70%, 3: 60%, ... 10: 0%)

5. C보험료 (i_endorese_premium)
   = round((unexpired_period_premium - daum_premium), -1)
```

### 예시 검증 (실제 로그 데이터 기준)

**로그 데이터 (2025-12-17 23:54:39):**
- `num`: 196287
- `startDay`: 2025-10-01 (보험 시작일)
- `endorse_day`: 2025-12-17 (배서일)
- `nabang`: 10 (분납 횟수)
- `nabang_1`: 2 (분납 회차)
- `payment10_premium1`: 258,516 (1/10 기본보험료)
- `payment10_premium2`: 0 (1/10 특약보험료)
- `payment10_premium_total`: 2,585,160 (이미 10회 분납 합계)
- `InsuraneCompany`: 4 (현대)
- `rate`: 1 (할인할증률)
- `etag`: 1 (대리)

**계산 결과:**
- `yearPremium`: 2,585,160 (수정 전: 25,851,600 - 잘못됨)
- `unexpired_period`: 288일
- `oneDayPremium`: 2,585,160 / 365 = 7,082.63
- `unexpired_period_premium`: 288 × 7,082.63 = 2,039,797.44
- `daum_premium`: 2,585,160 × 0.7 = 1,809,612 (회차 2: 70%)
- `cPremium`: round(2,039,797.44 - 1,809,612, -1) = 230,190 (수정 전: 2,301,850 - 잘못됨)

**검증 단계:**

1. **연간 보험료 계산 확인**
   ```
   yearPremium = payment10_premium_total × rate
   yearPremium = 2,585,160 × 1 = 2,585,160
   ```

2. **미경과 기간 계산 확인**
   ```
   보험 종료일 = 2025-10-01 + 1년 - 1일 = 2026-09-30
   unexpired_period = (2026-09-30 - 2025-12-17) + 1일 = 288일
   ```

3. **다음 회차 보험료 확인**
   ```
   daum_premium = yearPremium × 0.7 (회차 2: 70%)
   daum_premium = 2,585,160 × 0.7 = 1,809,612
   ```

4. **최종 C보험료 확인**
   ```
   cPremium = round((unexpired_period_premium - daum_premium), -1)
   cPremium = round(2,039,797.44 - 1,809,612, -1) = 230,190
   ```

## 4. 수동 계산 검증 스크립트

### 브라우저 콘솔에서 실행

```javascript
// C보험료 계산 검증 함수
function validateCPremium(num) {
  return fetch(`/api/insurance/kj-endorse/list?page=1&limit=100&push=1`)
    .then(res => res.json())
    .then(data => {
      const item = data.data.find(d => d.num == num);
      if (!item) {
        console.error('데이터를 찾을 수 없습니다:', num);
        return;
      }
      
      console.log('=== C보험료 검증 ===');
      console.log('데이터:', {
        num: item.num,
        name: item.name,
        policyNum: item.policyNum,
        standardDate: item.standardDate,
        premium: item.premium,
        cPremium: item.cPremium,
        age: item.age
      });
      
      console.log('\n로그 파일에서 다음 정보를 확인하세요:');
      console.log('- startDay (보험 시작일)');
      console.log('- endorse_day (배서일)');
      console.log('- nabang (분납 횟수)');
      console.log('- nabang_1 (분납 회차)');
      console.log('- payment10_premium1');
      console.log('- payment10_premium_total');
      console.log('- rate (할인할증률)');
      console.log('- yearPremium');
      console.log('- unexpired_period');
      console.log('- unexpired_period_premium');
      console.log('- daum_premium');
      console.log('- 최종 cPremium');
      
      return item;
    });
}

// 사용 예시
validateCPremium(196287);
```

## 5. 문제 발생 시 확인 사항

### C보험료가 0인 경우
1. `startDay`가 비어있는지 확인
2. `calculateEndorsePremium` 함수가 호출되는지 확인
3. 로그에서 "C보험료 계산 스킵" 메시지 확인

### C보험료가 비정상적으로 큰 경우
1. `yearPremium` 값 확인
2. `unexpired_period` 값 확인 (365일을 초과하지 않는지)
3. `daum_premium` 계산 확인

### C보험료가 음수인 경우
1. `unexpired_period_premium` < `daum_premium` 확인
2. 보험 시작일과 배서일 관계 확인
3. 분납 회차 확인

## 6. 데이터베이스 직접 확인

### 필요한 테이블 조회

```sql
-- 대리기사 정보
SELECT num, Name, Jumin, dongbuCerti, push, sangtae, endorse_day, manager
FROM 2012DaeriMember
WHERE num = 196287;

-- 증권 정보 (보험 시작일, 분납 회차)
SELECT certi, sigi, nab
FROM 2012Certi
WHERE certi = '2025-L389547';

-- 증권 테이블 정보
SELECT num, gita, InsuraneCompany, policyNum, divi
FROM 2012CertiTable
WHERE policyNum = '2025-L389547';

-- 보험료 데이터 (1/10 보험료)
SELECT policyNum, start_month, end_month, payment10_premium1, payment10_premium2, payment10_premium_total
FROM kj_insurance_premium_data
WHERE policyNum = '2025-L389547' AND start_month <= 59 AND end_month >= 59;

-- 요율 정보
SELECT policy, jumin, rate
FROM 2019rate
WHERE policy = '2025-L389547' AND jumin = '660327-1069017';
```

## 7. 검증 체크리스트

- [ ] API 응답에서 `premium`과 `cPremium` 값 확인
- [ ] 로그 파일에서 계산 파라미터 확인
- [ ] 로그 파일에서 계산 결과 확인
- [ ] `yearPremium` 계산 확인
- [ ] `unexpired_period` 계산 확인
- [ ] `daum_premium` 계산 확인
- [ ] 최종 `cPremium` 계산 확인
- [ ] 데이터베이스 값과 일치하는지 확인


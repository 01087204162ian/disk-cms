# 약국배상책임보험 API 연동 가이드

**작성일**: 2025-01-XX  
**버전**: 2.0

---

## 📋 목차

1. [API 개요](#api-개요)
2. [인증 시스템](#인증-시스템)
3. [API 엔드포인트](#api-엔드포인트)
4. [요청/응답 형식](#요청응답-형식)
5. [에러 처리](#에러-처리)
6. [SDK 예제](#sdk-예제)
7. [테스트 계정](#테스트-계정)

---

## API 개요

### 목적
약국배상책임보험 시스템의 API v2는 HMAC 인증 기반의 RESTful API로, 거래처(고객사)가 자신의 약국 신청 데이터를 안전하게 조회하고 관리할 수 있는 기능을 제공합니다.

### 주요 특징
- **HMAC-SHA256 인증**: API 키와 서명 기반 보안 인증
- **JSON 입출력**: 표준 JSON 형식의 요청/응답
- **트랜잭션 지원**: 데이터 무결성 보장
- **세션 분리**: 기존 웹 시스템과 완전 독립
- **기존 시스템 무중단**: `_v2` 파일로 분리하여 기존 시스템 영향 없음

### API 버전
- **v1**: 기존 웹 시스템 (세션 기반, 수정 금지)
- **v2**: 신규 API 시스템 (HMAC 인증, 거래처용)

---

## 인증 시스템

### HMAC 인증 방식

모든 API 요청은 다음 헤더가 필요합니다:

```http
Authorization: Bearer {api_key}
X-Timestamp: {unix_timestamp}
X-Signature: {hmac_signature}
Content-Type: application/json
```

### 서명 생성 방법

#### JavaScript/Node.js
```javascript
const crypto = require('crypto');

// 1. 요청 본문을 JSON 문자열로 변환
const requestBody = JSON.stringify(payload);

// 2. 서명용 문자열 생성
const stringToSign = `${method}\n${path}\n${timestamp}\n${requestBody}`;

// 3. HMAC-SHA256 서명 생성
const signature = crypto
  .createHmac('sha256', secretKey)
  .update(stringToSign, 'utf8')
  .digest('hex');
```

#### PHP
```php
// 1. 요청 본문을 JSON 문자열로 변환
$requestBody = json_encode($payload);

// 2. 서명용 문자열 생성
$stringToSign = $method . "\n" . $path . "\n" . $timestamp . "\n" . $requestBody;

// 3. HMAC-SHA256 서명 생성
$signature = hash_hmac('sha256', $stringToSign, $secretKey);
```

### 서명 생성 규칙

1. **HTTP 메서드**: 대문자 (예: `POST`)
2. **요청 경로**: `/hi/api/list_v2.php` (도메인 제외)
3. **타임스탬프**: Unix timestamp (초 단위)
4. **요청 본문**: JSON 문자열 (공백 포함)
5. **서명**: HMAC-SHA256으로 생성된 16진수 문자열

### 타임스탬프 검증

- 타임스탬프는 현재 시간 기준 ±5분 이내여야 함
- 시간 차이가 5분을 초과하면 요청 거부

---

## API 엔드포인트

### 기본 URL
```
https://imet.kr
```

### 1. 약국 리스트 조회

**엔드포인트**: `POST /hi/api/list_v2.php`

**요청 본문**:
```json
{
  "section": "user_num",
  "chchange": "13",
  "filter_type": "name",
  "filter_query": "서울약국",
  "page": 1,
  "pageSize": 20
}
```

**매개변수**:

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| section | string | 필수 | "user_num" 고정값 |
| chchange | string | 선택 | 상태 필터 (빈값=전체) |
| filter_type | string | 선택 | 검색 유형 (name/bizno/period) |
| filter_query | string | 선택 | 검색어 |
| date_from | string | 선택 | 기간 검색 시작일 (YYYY-MM-DD) |
| date_to | string | 선택 | 기간 검색 종료일 (YYYY-MM-DD) |
| page | integer | 선택 | 페이지 번호 (기본값: 1) |
| pageSize | integer | 선택 | 페이지 크기 (기본값: 20, 최대: 100) |

**상태 코드**:

| 코드 | 설명 |
|------|------|
| 10 | 메일보냄 |
| 13 | 승인 |
| 17 | 설계중 |
| 6 | 계약완료 |
| 14 | 증권발송 |
| 15 | 해지요청중 |
| 16 | 해지완료됨 |
| 7 | 보류 |
| "ALL" 또는 "" | 전체상태 |

**응답 예시**:
```json
{
  "success": true,
  "message": "리스트 조회 성공",
  "data": {
    "items": [
      {
        "num": 12345,
        "company": "서울약국",
        "biz_no": "123-45-67890",
        "sigi": "2025-01-01",
        "jeonggi": "2025-12-31",
        "preminum": "174800",
        "wdate": "2025-09-01 10:30:00",
        "ch": "13",
        "damdangja": "홍길동",
        "hphone": "010-1234-5678",
        "hphone2": "02-1234-5678",
        "email": "test@example.com",
        "memo": "특이사항"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 100,
      "totalPage": 5
    }
  }
}
```

### 2. 약국 상세 조회

**엔드포인트**: `POST /hi/api/detail_v2.php`

**요청 본문**:
```json
{
  "section": "detail",
  "item_num": 12345
}
```

**매개변수**:

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| section | string | 필수 | "detail" 고정값 |
| item_num | integer | 필수 | 조회할 약국 번호 |

**응답 예시**:
```json
{
  "success": true,
  "message": "상세 조회 성공",
  "data": {
    "item": {
      "num": 12345,
      "company": "서울약국",
      "biz_no": "123-45-67890",
      "damdangja": "홍길동",
      "hphone": "010-1234-5678",
      "hphone2": "02-1234-5678",
      "email": "test@example.com",
      "jumin": "801201******",
      "juso": "서울시 강남구 테헤란로 123",
      "sigi": "2025-01-01",
      "jeonggi": "2025-12-31",
      "wdate": "2025-09-01 10:30:00",
      "preminum": "174800",
      "proPreminum": "81000",
      "areaPreminum": "93800",
      "ch": "13",
      "memo": "특이사항",
      "chemist": "3",
      "chemistDesignNumer": "12345678",
      "area": "100.5",
      "jaegojasan": 2
    }
  }
}
```

### 3. 상태 변경

**엔드포인트**: `POST /hi/api/pharmacy-status-update_v2.php`

**요청 본문**:
```json
{
  "item_num": 12345,
  "new_status": "13"
}
```

**매개변수**:

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| item_num | integer | 필수 | 대상 약국 번호 |
| new_status | string | 필수 | 변경할 상태 코드 |

**특별 처리 로직**:

#### 승인(13) 처리
- 예치금에서 보험료 차감
- 정산 기록 생성
- 승인 이메일 자동 발송
- 잔고 부족 시 오류 반환

#### 보류(7) 처리
- 승인(13), 계약완료(6), 증권발급(14) → 보류(7)
- 예치금 환급
- 정산 기록 sort=7로 변경

#### 해지완료(16) 처리
- 해지요청(15) → 해지완료(16)
- 일할 계산으로 미경과 기간 환급
- 공식: (종기-해지일)/(종기-시기) × 총보험료

**응답 예시**:
```json
{
  "success": true,
  "message": "상태 변경이 완료되었습니다.",
  "data": {
    "item": {
      "num": 12345,
      "company": "서울약국",
      "old_status": "10",
      "old_status_label": "메일보냄",
      "new_status": "13",
      "new_status_label": "승인",
      "preminum": 174800,
      "updated_at": "2025-09-15T10:30:00+09:00"
    },
    "deposit": {
      "previous_balance": 1000000,
      "current_balance": 825200,
      "deducted_amount": 174800
    },
    "email": {
      "sent": true,
      "recipients": "sj@simg.kr",
      "error": ""
    }
  }
}
```

### 4. 기본정보 수정

**엔드포인트**: `POST /hi/api/pharmacyApply-num-update_v2.php`

**요청 본문**:
```json
{
  "item_num": 12345,
  "company": "새서울약국",
  "email": "new@example.com",
  "mobile_phone": "010-9876-5432",
  "memo": "수정된 메모"
}
```

**매개변수**:

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| item_num | integer | 필수 | 수정할 약국 번호 |
| company | string | 선택 | 회사명 |
| email | string | 선택 | 이메일 |
| mobile_phone | string | 선택 | 휴대전화 |
| memo | string | 선택 | 메모 |

**수정 제한 정책**:
1. **승인 상태(13)**: email, mobile_phone, memo만 수정 가능
2. **주민번호**: 외부 API에서는 수정 불가 (보안상 이유)
3. **계약완료/증권발송/해지 상태**: 수정 불가

### 5. 보험료 계산

**엔드포인트**: `POST /hi/api/pharmacy-premium-calculate_v2.php`

**요청 본문**:
```json
{
  "item_num": 12345,
  "expert_count": 3,
  "inventory_value": "2",
  "business_area": "100.5"
}
```

**매개변수**:

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| item_num | integer | 필수 | 대상 약국 번호 |
| expert_count | integer | 필수 | 전문인수 (0-9명) |
| inventory_value | string | 필수 | 재고자산 구분 |
| business_area | string | 선택 | 사업장 면적 (㎡) |

**재고자산 구분**:

| 값 | 설명 |
|----|------|
| -1 | 화재보험 가입안함 |
| 1 | 5천만원 이하 |
| 2 | 1억원 이하 |
| 3 | 2억원 이하 |
| 4 | 3억원 이하 |
| 5 | 5억원 이하 |

**응답 예시**:
```json
{
  "success": true,
  "message": "보험료가 성공적으로 계산되었습니다.",
  "data": {
    "calculation": {
      "item_num": 12345,
      "expert_count": 3,
      "inventory_value": 2,
      "business_area": "100.5",
      "premium": 174800,
      "premium_formatted": "174,800원",
      "expert_premium": 81000,
      "expert_premium_formatted": "81,000원",
      "fire_premium": 93800,
      "fire_premium_formatted": "93,800원"
    }
  }
}
```

### 6. 잔고 조회

**엔드포인트**: `POST /hi/api/balance_v2.php`

**요청 본문**:
```json
{
  "section": "balance",
  "period": "all"
}
```

**응답 예시**:
```json
{
  "success": true,
  "message": "잔고 조회 성공",
  "data": {
    "balance": {
      "current_balance": 1754938,
      "formatted_balance": "1,754,938원"
    }
  }
}
```

### 7. 예치금 내역 조회

**엔드포인트**: `POST /hi/api/deposit_balance_v2.php`

**요청 본문**:
```json
{
  "section": "deposit_balance",
  "page": 1,
  "pageSize": 20
}
```

**응답 예시**:
```json
{
  "success": true,
  "message": "예치금 조회 성공",
  "data": {
    "deposit_list": [
      {
        "num": 789,
        "money": 1000000,
        "formatted_money": "1,000,000원",
        "wdate": "2025-09-01 14:30:00",
        "days_ago": 14
      }
    ],
    "deposit_total": 1500000,
    "current_balance": 1254938,
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 25,
      "totalPages": 2
    }
  }
}
```

### 8. 일별 실적 조회

**엔드포인트**: `POST /hi/api/daily_stats_v2.php`

**요청 본문**:
```json
{
  "section": "daily_stats",
  "sigi": "2025-09"
}
```

**매개변수**:

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| section | string | 선택 | "daily_stats" (기본값) |
| sigi | string | 선택 | 조회 기간 (YYYY-MM 형태, 빈값=최근30일) |

**조회 모드**:
- **월별 조회**: sigi='2025-09' (해당 월 전체)
- **최근 30일**: sigi='' 또는 미제공

**응답 예시**:
```json
{
  "success": true,
  "message": "일별실적 조회 성공 - 월별 조회 (2025-09)",
  "data": {
    "statistics": [
      {
        "key0": "301,600",
        "key1": "2025-09-15",
        "key2": "일",
        "key3": "75,400",
        "key4": "1",
        "key5": 0,
        "key6": 4,
        "key7": "0",
        "key8": "0",
        "key9": "268,450",
        "key10": 6
      }
    ],
    "summary": {
      "period": "월별 조회 (2025-09)",
      "final_totals": {
        "approval_premium": 301600,
        "approval_count": 4,
        "cancellation_premium": 268450,
        "cancellation_count": 6
      }
    }
  }
}
```

**데이터 필드 설명**:

| 필드 | 설명 |
|------|------|
| key0 | 누적 승인 보험료 합계 |
| key1 | 날짜 (YYYY-MM-DD) |
| key2 | 요일 (한글) |
| key3 | 일별 승인 보험료 |
| key4 | 일별 승인 건수 |
| key5 | 요일 번호 (0:일~6:토) |
| key6 | 누적 승인 건수 |
| key7 | 일별 해지 보험료 |
| key8 | 일별 해지 건수 |
| key9 | 누적 해지 보험료 합계 |
| key10 | 누적 해지 건수 |

### 9. 월별 실적 조회

**엔드포인트**: `POST /hi/api/monthly_stats_v2.php`

**요청 본문**:
```json
{
  "section": "monthly_stats",
  "sigi": "2025-09"
}
```

**매개변수**:

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| section | string | 선택 | "monthly_stats" (기본값) |
| sigi | string | 선택 | 기준월 (YYYY-MM 형태, 기본값: 현재월) |

**조회 범위**:
- 기준월부터 역순으로 3개년 데이터
- 예: 2025-09 기준 → 2023-01까지

**응답 예시**:
```json
{
  "success": true,
  "message": "월별실적 조회 성공 - 3개년 월별 조회 (기준: 2025-09)",
  "data": {
    "statistics": [
      {
        "key0": "2025-09",
        "key1": "1,223,600",
        "key2": 7,
        "key3": "268,450",
        "key4": 6,
        "key5": "2025년 9월"
      }
    ],
    "summary": {
      "period": "3개년 월별 조회 (기준: 2025-09)",
      "totals": {
        "approval_premium": 15678900,
        "approval_count": 89,
        "cancellation_premium": 2456780,
        "cancellation_count": 23
      }
    }
  }
}
```

**데이터 필드 설명**:

| 필드 | 설명 |
|------|------|
| key0 | YYYY-MM 형태 |
| key1 | 월별 승인 보험료 |
| key2 | 월별 승인 건수 |
| key3 | 월별 해지 보험료 |
| key4 | 월별 해지 건수 |
| key5 | 표시용 한글명 (YYYY년 M월) |

---

## 요청/응답 형식

### 공통 요청 형식

```http
POST /hi/api/{endpoint}_v2.php HTTP/1.1
Host: imet.kr
Authorization: Bearer {api_key}
X-Timestamp: {unix_timestamp}
X-Signature: {hmac_signature}
Content-Type: application/json

{
  "section": "...",
  ...
}
```

### 공통 응답 형식

**성공 응답**:
```json
{
  "success": true,
  "message": "처리 성공 메시지",
  "data": {
    ...
  }
}
```

**에러 응답**:
```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "에러 메시지",
  "details": {
    ...
  },
  "timestamp": "2025-09-15T10:30:00+09:00"
}
```

---

## 에러 처리

### HTTP 상태 코드

| 코드 | 설명 |
|------|------|
| 200 | 성공 |
| 400 | 잘못된 요청 (매개변수 오류) |
| 401 | 인증 실패 |
| 403 | 권한 없음 |
| 404 | 리소스 없음 |
| 405 | 허용되지 않은 메서드 |
| 500 | 서버 내부 오류 |

### 에러 응답 예시

**인증 실패**:
```json
{
  "success": false,
  "error": "AUTHENTICATION_FAILED",
  "message": "HMAC 서명이 올바르지 않습니다.",
  "timestamp": "2025-09-15T10:30:00+09:00"
}
```

**검증 오류**:
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "필수 필드가 누락되었습니다.",
  "details": {
    "missing_fields": ["item_num"],
    "received_data": {...}
  }
}
```

**잔고 부족**:
```json
{
  "success": false,
  "error": "INSUFFICIENT_BALANCE",
  "message": "예치금 잔고가 부족합니다.",
  "details": {
    "required_amount": 174800,
    "current_balance": 100000
  }
}
```

---

## SDK 예제

### JavaScript/Node.js

```javascript
class PharmacyAPI {
  constructor(apiKey, secretKey, baseUrl = 'https://imet.kr') {
    this.apiKey = apiKey;
    this.secretKey = secretKey;
    this.baseUrl = baseUrl;
  }

  async makeRequest(endpoint, data) {
    const crypto = require('crypto');
    const timestamp = Math.floor(Date.now() / 1000);
    const method = 'POST';
    const body = JSON.stringify(data);
    
    const bodyHash = crypto.createHash('sha256').update(body, 'utf8').digest('hex');
    const stringToSign = `${method}\n${endpoint}\n${timestamp}\n${bodyHash}`;
    const signature = crypto
      .createHmac('sha256', this.secretKey)
      .update(stringToSign, 'utf8')
      .digest('hex');
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'X-Timestamp': timestamp.toString(),
        'X-Signature': signature,
        'Content-Type': 'application/json'
      },
      body: body
    });
    
    return await response.json();
  }

  // API 메서드들
  async getList(filters = {}) {
    return await this.makeRequest('/hi/api/list_v2.php', {
      section: 'user_num',
      ...filters
    });
  }

  async getDetail(itemNum) {
    return await this.makeRequest('/hi/api/detail_v2.php', {
      section: 'detail',
      item_num: itemNum
    });
  }

  async updateStatus(itemNum, newStatus) {
    return await this.makeRequest('/hi/api/pharmacy-status-update_v2.php', {
      item_num: itemNum,
      new_status: newStatus
    });
  }

  async calculatePremium(itemNum, expertCount, inventoryValue, businessArea) {
    return await this.makeRequest('/hi/api/pharmacy-premium-calculate_v2.php', {
      item_num: itemNum,
      expert_count: expertCount,
      inventory_value: inventoryValue,
      business_area: businessArea
    });
  }

  async getBalance() {
    return await this.makeRequest('/hi/api/balance_v2.php', {
      section: 'balance'
    });
  }

  async getDepositHistory(page = 1, pageSize = 20) {
    return await this.makeRequest('/hi/api/deposit_balance_v2.php', {
      section: 'deposit_balance',
      page: page,
      pageSize: pageSize
    });
  }

  async getDailyStats(period = '') {
    return await this.makeRequest('/hi/api/daily_stats_v2.php', {
      section: 'daily_stats',
      sigi: period
    });
  }

  async getMonthlyStats(period = '') {
    return await this.makeRequest('/hi/api/monthly_stats_v2.php', {
      section: 'monthly_stats',
      sigi: period
    });
  }
}

// 사용 예제
const api = new PharmacyAPI('your-api-key', 'your-secret-key');

// 리스트 조회
api.getList({ chchange: '13', page: 1, pageSize: 10 }).then(result => {
  console.log('신청자 목록:', result.data.items);
});

// 상태 변경 (승인)
api.updateStatus(12345, '13').then(result => {
  console.log('승인 처리:', result.data.item);
});
```

### PHP

```php
class PharmacyAPI {
    private $apiKey;
    private $secretKey;
    private $baseUrl;

    public function __construct($apiKey, $secretKey, $baseUrl = 'https://imet.kr') {
        $this->apiKey = $apiKey;
        $this->secretKey = $secretKey;
        $this->baseUrl = $baseUrl;
    }

    public function makeRequest($endpoint, $data) {
        $timestamp = time();
        $method = 'POST';
        $body = json_encode($data);
        
        $bodyHash = hash('sha256', $body);
        $stringToSign = $method . "\n" . $endpoint . "\n" . $timestamp . "\n" . $bodyHash;
        $signature = hash_hmac('sha256', $stringToSign, $this->secretKey);
        
        $headers = array(
            'Authorization: Bearer ' . $this->apiKey,
            'X-Timestamp: ' . $timestamp,
            'X-Signature: ' . $signature,
            'Content-Type: application/json'
        );

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $this->baseUrl . $endpoint);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        
        $response = curl_exec($ch);
        curl_close($ch);
        
        return json_decode($response, true);
    }

    // API 메서드들
    public function getList($filters = array()) {
        $data = array_merge(array('section' => 'user_num'), $filters);
        return $this->makeRequest('/hi/api/list_v2.php', $data);
    }

    public function getDetail($itemNum) {
        return $this->makeRequest('/hi/api/detail_v2.php', array(
            'section' => 'detail',
            'item_num' => $itemNum
        ));
    }

    public function updateStatus($itemNum, $newStatus) {
        return $this->makeRequest('/hi/api/pharmacy-status-update_v2.php', array(
            'item_num' => $itemNum,
            'new_status' => $newStatus
        ));
    }
}

// 사용 예제
$api = new PharmacyAPI('your-api-key', 'your-secret-key');
$result = $api->getList(array('chchange' => '13', 'page' => 1));
print_r($result['data']['items']);
```

---

## 테스트 계정

### 크레소티 (cresoty)
- **아이디**: `cresoty`
- **비밀번호**: `87204162`
- **API Key**: `pk_Dtz9liCassLq5qdOA8PViphUiA90OB7s`
- **API Secret**: `ad8cd26a58bb8bf4a71e0173b4366904c77e01791571a27be7f0b0a2b3576485`

### 테스트 7 (kibs0327)
- **아이디**: `kibs0327`
- **비밀번호**: `87204162`
- **API Key**: `pk_F4vdmFbPHUO9pmw3hNkWE2lFmyAzTfvy`
- **API Secret**: `b4855450c58cdf82c59f1ae7bbb28408ba078d7b1861b76b38d3e3715a6657a3`
- **샘플 약국 번호**: 226, 1658~1666

### 유비케어 (ubcare)
- **아이디**: `ubcare`
- **비밀번호**: `010-4496-1358`
- **API Key**: `pk_ZxpHsHHT8vnXEmJsepCk0vyLuAIeLVJL`
- **API Secret**: `cfe7da50a87fec6d8eebfdbe87db978757749e871ad7d7ced62106c40d5a561a`

### 테스트 8 (ubcare0327)
- **아이디**: `ubcare0327`
- **비밀번호**: `87204162`
- **API Key**: `pk_BxEEtz3TCCYVm7xhJGiW8swIBd7w5vWH`
- **API Secret**: `098b4f6b8f1385cc3312844f9f66e483c7a3f5e66710624f068bd4a29d539805`
- **샘플 약국 번호**: 1667~1675

---

## 제한사항

### Rate Limiting
- 사용자당 시간당 1000회 요청 제한
- 동시 연결 최대 10개
- 대용량 데이터 조회 시 적절한 페이지네이션 사용 권장

### 데이터 제한
- 페이지 크기 최대 100개
- 검색어 최대 100자
- 요청 본문 최대 1MB
- 타임스탬프 유효시간 300초 (5분)

### 보안 정책
- HTTPS 연결 필수
- API 키는 안전한 환경에서만 사용
- 서명 검증 실패 시 즉시 차단
- 의심스러운 활동 시 일시적 접근 제한

---

## 업무 흐름별 가이드

### 신규 약국 등록 프로세스
1. **리스트 조회**: 기존 약국 확인
2. **보험료 계산**: 조건에 따른 보험료 산출
3. **상태 변경**: 메일보냄(10) → 승인(13)
4. **잔고 확인**: 예치금 차감 확인

### 약국 정보 수정 프로세스
1. **상세 조회**: 현재 정보 확인
2. **기본정보 수정**: 필요한 필드만 수정
3. **보험료 재계산**: 조건 변경 시 보험료 재산출
4. **상태 확인**: 수정 후 상태 검증

### 해지 처리 프로세스
1. **상태 변경**: 해지요청중(15)으로 변경
2. **해지 승인**: 해지완료(16)으로 변경
3. **환급 확인**: 일할 계산된 환급액 확인
4. **잔고 확인**: 환급 후 잔고 확인

### 실적 분석 프로세스
1. **월별 실적**: 장기 트렌드 분석
2. **일별 실적**: 단기 변동 분석
3. **예치금 내역**: 자금 흐름 분석
4. **잔고 현황**: 현재 재무 상태 확인

---

## 자주 묻는 질문 (FAQ)

### Q1: API 키는 어떻게 발급받나요?
A: 시스템 관리자에게 문의하여 사용자 계정과 연결된 API 키를 발급받으실 수 있습니다.

### Q2: 타임스탬프 오류가 발생합니다.
A: 서버와 클라이언트의 시간 차이가 5분을 초과하면 요청이 거부됩니다. 시스템 시간을 동기화해주세요.

### Q3: 주민번호 수정이 안됩니다.
A: 보안상 외부 API에서는 주민번호 수정이 제한됩니다.

### Q4: 승인 처리 시 잔고 부족 오류가 발생합니다.
A: 예치금 잔고가 보험료보다 적을 때 발생합니다. 예치금을 충전한 후 다시 시도해주세요.

### Q5: 일별/월별 실적 데이터가 다릅니다.
A: 일별 실적은 pharmacy_settlementList 테이블 기준이며, 승인(sort=13)과 해지(sort!=13,!=7)를 분리하여 집계합니다.

---

## 지원

### 기술 지원
- **이메일**: ih@simg.kr
- **전화**: 070-7813-1674 (평일 09:00-18:00)

### API 키 관리
- **발급 문의**: ih@simg.kr
- **권한 변경**: ih@simg.kr
- **보안 신고**: ih@simg.kr

---

## 관련 문서

- [고객사 어드민 시스템](pharmacy-고객사-어드민-시스템.md) - `imet/hi/v2/` 시스템 상세
- [API 엔드포인트](pharmacy-API-엔드포인트.md) - disk-cms 프록시 API 문서
- [시스템 개요](pharmacy-시스템-개요.md) - 전체 시스템 아키텍처


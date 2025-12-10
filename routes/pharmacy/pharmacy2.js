/**
 * routes/pharmacy/pharmacy2.js - 약국 업체 관리 프록시 라우터
 * 경로: routes/pharmacy/pharmacy2.js
 GET /api/pharmacy2/customers - 업체 리스트 조회 → pharmacy-id-list.php
 POST /api/pharmacy2/customers - 새 업체 추가 → pharmacy-id-detail.php
 PUT /api/pharmacy2/customers/:num - 업체 정보 수정 → pharmacy-id-detail.php
 GET /api/pharmacy2/customers/:num - 특정 업체 조회 → pharmacy-id-detail.php
 GET /api/pharmacy2/check-id - 아이디 중복확인 → pharmacy-id-check.php
 
 */
const express = require('express');
const axios = require('axios');
const router = express.Router();

// 기본 설정
const PHP_API_BASE_URL = 'https://imet.kr/api/pharmacy';
const DEFAULT_TIMEOUT = 30000;

// 공통 헤더 설정
const getDefaultHeaders = () => ({
  'Accept': 'application/json',
  'Content-Type': 'application/json'
});

// 에러 핸들링 함수
const handleApiError = (error, res, defaultMessage) => {
  console.error('API 오류:', error);
  
  if (error.response) {
    // PHP API에서 에러 응답이 온 경우
    res.status(error.response.status).json(error.response.data);
  } else if (error.code === 'ECONNABORTED') {
    // 타임아웃 에러
    res.status(408).json({
      success: false,
      error: '요청 시간이 초과되었습니다.'
    });
  } else {
    // 네트워크 오류 등
    res.status(500).json({
      success: false,
      error: defaultMessage
    });
  }
};

/**
 * GET /api/pharmacy2/customers
 * 업체 리스트 조회 (페이징, 검색 지원)
 */
router.get('/customers', async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    
    // 파라미터 검증
    const validatedPage = Math.max(1, parseInt(page) || 1);
    const validatedLimit = Math.min(100, Math.max(1, parseInt(limit) || 20));
    
    const params = new URLSearchParams({
      page: validatedPage,
      limit: validatedLimit,
      search: search.toString().trim()
    });

    console.log(`[GET /customers] 요청 - page: ${validatedPage}, limit: ${validatedLimit}, search: "${search}"`);

    const response = await axios.get(`${PHP_API_BASE_URL}/pharmacy-id-list.php?${params}`, {
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders()
    });

    console.log(`[GET /customers] 성공 - 총 ${response.data?.pagination?.total_count || 0}개 데이터`);
    res.json(response.data);
    
  } catch (error) {
    handleApiError(error, res, '업체 리스트 조회 중 오류가 발생했습니다.');
  }
});

/**
 * POST /api/pharmacy2/customers
 * 새 업체 추가
 */
router.post('/customers', async (req, res) => {
  try {
    const { mem_id, passwd, name, hphone1, directory = 'pharmacyApplydirectory' } = req.body;
    
    // 필수 필드 검증
    if (!mem_id || !passwd || !name || !hphone1) {
      return res.status(400).json({
        success: false,
        error: '필수 정보가 누락되었습니다. (아이디, 비밀번호, 이름, 연락처)'
      });
    }

    // 아이디 형식 검증 (영문, 숫자, 특수문자 일부만 허용)
    if (!/^[a-zA-Z0-9_.-]{3,50}$/.test(mem_id)) {
      return res.status(400).json({
        success: false,
        error: '아이디는 3-50자의 영문, 숫자, _, -, . 만 사용 가능합니다.'
      });
    }

    // 연락처 형식 검증
    if (!/^01[0-9]-\d{3,4}-\d{4}$/.test(hphone1)) {
      return res.status(400).json({
        success: false,
        error: '연락처는 010-0000-0000 형식으로 입력해주세요.'
      });
    }

    const requestData = {
      mem_id: mem_id.trim(),
      passwd: passwd.trim(),
      name: name.trim(),
      hphone1: hphone1.trim(),
      directory: directory.trim()
    };

    console.log(`[POST /customers] 새 업체 추가 요청 - 아이디: ${requestData.mem_id}, 이름: ${requestData.name}`);

    const response = await axios.post(`${PHP_API_BASE_URL}/pharmacy-id-detail.php`, requestData, {
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders()
    });

    console.log(`[POST /customers] 성공 - 업체 추가 완료`);
    res.json(response.data);
    
  } catch (error) {
    handleApiError(error, res, '업체 추가 중 오류가 발생했습니다.');
  }
});

/**
 * PUT /api/pharmacy2/customers/:num
 * 업체 정보 수정
 */
router.put('/customers/:num', async (req, res) => {
  try {
    const { num } = req.params;
    const { mem_id, passwd, name, hphone1, directory } = req.body;
    
    // num 파라미터 검증
    const customerNum = parseInt(num);
    if (!customerNum || customerNum <= 0) {
      return res.status(400).json({
        success: false,
        error: '올바른 업체 번호를 입력해주세요.'
      });
    }

    // 수정할 데이터 구성 (빈 값은 제외)
    const updateData = { num: customerNum };
    
    if (mem_id !== undefined && mem_id.trim()) {
      if (!/^[a-zA-Z0-9_.-]{3,50}$/.test(mem_id.trim())) {
        return res.status(400).json({
          success: false,
          error: '아이디는 3-50자의 영문, 숫자, _, -, . 만 사용 가능합니다.'
        });
      }
      updateData.mem_id = mem_id.trim();
    }
    
    if (passwd !== undefined && passwd.trim()) {
      updateData.passwd = passwd.trim();
    }
    
    if (name !== undefined && name.trim()) {
      updateData.name = name.trim();
    }
    
    if (hphone1 !== undefined && hphone1.trim()) {
      if (!/^01[0-9]-\d{3,4}-\d{4}$/.test(hphone1.trim())) {
        return res.status(400).json({
          success: false,
          error: '연락처는 010-0000-0000 형식으로 입력해주세요.'
        });
      }
      updateData.hphone1 = hphone1.trim();
    }
    
    if (directory !== undefined && directory.trim()) {
      updateData.directory = directory.trim();
    }

    console.log(`[PUT /customers/${num}] 업체 정보 수정 요청 - 업체번호: ${customerNum}`);

    const response = await axios.put(`${PHP_API_BASE_URL}/pharmacy-id-detail.php`, updateData, {
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders()
    });

    console.log(`[PUT /customers/${num}] 성공 - 업체 정보 수정 완료`);
    res.json(response.data);
    
  } catch (error) {
    handleApiError(error, res, '업체 정보 수정 중 오류가 발생했습니다.');
  }
});

/**
 * GET /api/pharmacy2/customers/:num
 * 특정 업체 정보 조회
 */
router.get('/customers/:num', async (req, res) => {
  try {
    const { num } = req.params;
    
    // num 파라미터 검증
    const customerNum = parseInt(num);
    if (!customerNum || customerNum <= 0) {
      return res.status(400).json({
        success: false,
        error: '올바른 업체 번호를 입력해주세요.'
      });
    }

    console.log(`[GET /customers/${num}] 특정 업체 조회 - 업체번호: ${customerNum}`);

    const response = await axios.get(`${PHP_API_BASE_URL}/pharmacy-id-detail.php?num=${customerNum}`, {
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders()
    });

    console.log(`[GET /customers/${num}] 성공 - 업체 정보 조회 완료`);
    res.json(response.data);
    
  } catch (error) {
    handleApiError(error, res, '업체 정보 조회 중 오류가 발생했습니다.');
  }
});


/**
 * POST /api/pharmacy2/check-id
 * 아이디 중복확인 (POST 방식으로 변경)
 */
router.post('/check-id', async (req, res) => {
  try {
    const { mem_id } = req.body;  // req.query → req.body 변경
    
    if (!mem_id || !mem_id.trim()) {
      return res.status(400).json({
        success: false,
        error: '아이디를 입력해주세요.'
      });
    }

    // 아이디 형식 검증
    if (!/^[a-zA-Z0-9_.-]{3,50}$/.test(mem_id.trim())) {
      return res.status(400).json({
        success: false,
        error: '아이디는 3-50자의 영문, 숫자, _, -, . 만 사용 가능합니다.'
      });
    }

    console.log(`[POST /check-id] 아이디 중복확인 - 아이디: ${mem_id}`);

    // PHP API는 GET 방식이므로 쿼리 파라미터로 전달
    const response = await axios.get(`${PHP_API_BASE_URL}/pharmacy-id-check.php?mem_id=${encodeURIComponent(mem_id.trim())}`, {
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders()
    });

    console.log(`[POST /check-id] 성공 - 중복확인 완료`);
    res.json(response.data);
    
  } catch (error) {
    handleApiError(error, res, '아이디 중복확인 중 오류가 발생했습니다.');
  }
});


/**
 * POST /api/pharmacy2/certificate-number
 * 증권번호 저장/업데이트 (전문인/화재 구분)
 */
router.post('/certificate-number', async (req, res) => {
  try {
    const { pharmacyId, certificateNumber, certificateType = 'expert' } = req.body;
    
    // 필수 필드 검증
    if (!pharmacyId) {
      return res.status(400).json({
        success: false,
        error: '약국 ID가 필요합니다.'
      });
    }

    if (!certificateNumber || !certificateNumber.trim()) {
      return res.status(400).json({
        success: false,
        error: '증권번호를 입력해주세요.'
      });
    }

    // certificateType 검증
    if (!['expert', 'fire'].includes(certificateType)) {
      return res.status(400).json({
        success: false,
        error: '올바른 증권 유형을 선택해주세요. (expert, fire)'
      });
    }

    // pharmacyId 검증
    const validPharmacyId = parseInt(pharmacyId);
    if (!validPharmacyId || validPharmacyId <= 0) {
      return res.status(400).json({
        success: false,
        error: '올바른 약국 ID를 입력해주세요.'
      });
    }

    // 증권번호 형식 검증
    const cleanCertificateNumber = certificateNumber.trim();
    if (cleanCertificateNumber.length > 50) {
      return res.status(400).json({
        success: false,
        error: '증권번호는 50자 이내로 입력해주세요.'
      });
    }

    const requestData = {
      pharmacy_id: validPharmacyId,
      certificate_number: cleanCertificateNumber,
      certificate_type: certificateType,  // 'expert' 또는 'fire'
      action: 'update_certificate'
    };


	
    const typeText = certificateType === 'expert' ? '전문인' : '화재';
    console.log(`[POST /certificate-number] ${typeText} 증권번호 저장 요청 - 약국ID: ${validPharmacyId}, 증권번호: ${cleanCertificateNumber}`);
	
	console.log(`[DEBUG] PHP API URL: ${PHP_API_BASE_URL}/pharmacy-certificate-update.php`);
    console.log(`[DEBUG] Request Data:`, JSON.stringify(requestData, null, 2));

    // PHP API 호출 (실제 PHP 파일명은 프로젝트에 맞게 수정)
    const response = await axios.post(`${PHP_API_BASE_URL}/pharmacy-certificate-update.php`, requestData, {
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders()
    });

    console.log(`[POST /certificate-number] 성공 - ${typeText} 증권번호 저장 완료`);
    res.json(response.data);
    
  } catch (error) {
    handleApiError(error, res, '증권번호 저장 중 오류가 발생했습니다.');
  }
});

/**
 * GET /api/pharmacy2/certificate-number/:pharmacyId
 * 특정 약국의 증권번호 조회
 */
router.get('/certificate-number/:pharmacyId', async (req, res) => {
  try {
    const { pharmacyId } = req.params;
    
    // pharmacyId 검증
    const validPharmacyId = parseInt(pharmacyId);
    if (!validPharmacyId || validPharmacyId <= 0) {
      return res.status(400).json({
        success: false,
        error: '올바른 약국 ID를 입력해주세요.'
      });
    }

    console.log(`[GET /certificate-number/${pharmacyId}] 증권번호 조회 - 약국ID: ${validPharmacyId}`);

    const response = await axios.get(`${PHP_API_BASE_URL}/pharmacy-certificate-detail.php?pharmacy_id=${validPharmacyId}`, {
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders()
    });

    console.log(`[GET /certificate-number/${pharmacyId}] 성공 - 증권번호 조회 완료`);
    res.json(response.data);
    
  } catch (error) {
    handleApiError(error, res, '증권번호 조회 중 오류가 발생했습니다.');
  }
});


/**
 * POST /api/pharmacy2/calculate-premium
 * 보험료 계산 (account에 따라 PHP API 자동 선택)
 * - account 1, 7: pharmacy-premium-calculate.php (표준형, 1억 고정)
 * - account 6, 8 등: pharmacy-premium-calculate-ubcare.php (유비케어, 1억/2억 선택)
 */
router.post('/calculate-premium', async (req, res) => {
  try {
    const { pharmacy_id, expert_count, expert_limit, inventory_value, business_area, account } = req.body;
    
    // 필수 필드 검증
    if (!pharmacy_id) {
      return res.status(400).json({
        success: false,
        error: '약국 ID가 필요합니다.'
      });
    }

    // pharmacy_id 검증
    const validPharmacyId = parseInt(pharmacy_id);
    if (!validPharmacyId || validPharmacyId <= 0) {
      return res.status(400).json({
        success: false,
        error: '올바른 약국 ID를 입력해주세요.'
      });
    }

    // expert_count 검증 (0 허용)
    const validExpertCount = parseInt(expert_count);
    if (isNaN(validExpertCount) || validExpertCount < 0 || validExpertCount > 9) {
      return res.status(400).json({
        success: false,
        error: '전문인수는 0명 이상 9명 이하로 입력해주세요.'
      });
    }

    // inventory_value 검증
    const validInventoryValues = ['-1', '1', '2', '3', '4', '5'];
    if (!validInventoryValues.includes(String(inventory_value))) {
      return res.status(400).json({
        success: false,
        error: '올바른 재고자산 값을 선택해주세요.'
      });
    }

    // business_area 검증 (선택적 필드)
    let validBusinessArea = null;
    if (business_area !== undefined && business_area !== null && business_area !== '') {
      validBusinessArea = parseFloat(business_area);
      if (isNaN(validBusinessArea) || validBusinessArea < 0 || validBusinessArea > 10000) {
        return res.status(400).json({
          success: false,
          error: '사업장면적은 0 이상 10,000 이하의 숫자로 입력해주세요.'
        });
      }
    }

    // ✅ account 값에 따라 PHP API 엔드포인트 선택
    const accountNum = String(account || '1');
    let phpEndpoint;
    let apiType;

    if (['1', '7'].includes(accountNum)) {
      // 표준형: 보상한도 1억 고정
      phpEndpoint = `${PHP_API_BASE_URL}/pharmacy-premium-calculate.php`;
      apiType = '표준형';
    } else {
      // 유비케어: 보상한도 1억/2억 선택 가능
      phpEndpoint = `${PHP_API_BASE_URL}/pharmacy-premium-calculate-ubcare.php`;
      apiType = '유비케어';
      
      // expert_limit 검증 (유비케어 전용)
      const validExpertLimits = ['1', '2'];
      if (!validExpertLimits.includes(String(expert_limit))) {
        return res.status(400).json({
          success: false,
          error: '올바른 보상한도를 선택해주세요. (1: 1억, 2: 2억)'
        });
      }
    }

    // 공통 요청 데이터 구성
    const requestData = {
      pharmacy_id: validPharmacyId,
      expert_count: validExpertCount,
      inventory_value: inventory_value.toString(),
      business_area: validBusinessArea,
      action: 'calculate_premium'
    };

    // ✅ 유비케어 API일 경우에만 expert_limit 추가
    if (apiType === '유비케어') {
      requestData.expert_limit = expert_limit.toString();
    }

    console.log(`[POST /calculate-premium] ${apiType} API 호출 - account: ${accountNum}, 약국ID: ${validPharmacyId}, 전문인수: ${validExpertCount}${apiType === '유비케어' ? `, 보상한도: ${expert_limit}억` : ''}, 재고자산: ${inventory_value}, 사업장면적: ${validBusinessArea}`);

    // ✅ 선택된 PHP API 호출
    const response = await axios.post(phpEndpoint, requestData, {
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders()
    });

    console.log(`[POST /calculate-premium] 성공 - ${apiType} 보험료 계산 완료`);
    
    // 응답 데이터에 API 타입 정보 추가
    const responseData = {
      ...response.data,
      api_type: apiType,
      account: accountNum,
      message: response.data.message || '보험료가 성공적으로 계산되었습니다.'
    };
    
    res.json(responseData);
    
  } catch (error) {
    console.error('[POST /calculate-premium] 오류:', error.message);
    handleApiError(error, res, '보험료 계산 중 오류가 발생했습니다.');
  }
});

/**
 * POST /api/pharmacy2/update-status
 * 약국 업체 상태 변경 (단순 업데이트)
 */
router.post('/update-status', async (req, res) => {
  try {
    const { pharmacy_id, status } = req.body;
    
    // 필수 필드 검증
    if (!pharmacy_id) {
      return res.status(400).json({
        success: false,
        error: '약국 ID가 필요합니다.'
      });
    }

    if (!status || !status.trim()) {
      return res.status(400).json({
        success: false,
        error: '변경할 상태를 입력해주세요.'
      });
    }

    // pharmacy_id 검증
    const validPharmacyId = parseInt(pharmacy_id);
    if (!validPharmacyId || validPharmacyId <= 0) {
      return res.status(400).json({
        success: false,
        error: '올바른 약국 ID를 입력해주세요.'
      });
    }

    const trimmedStatus = status.trim();

    const requestData = {
      pharmacy_id: validPharmacyId,
      status: trimmedStatus
    };

    console.log(`[POST /update-status] 상태 변경 요청 - 약국ID: ${validPharmacyId}, 상태: "${trimmedStatus}"`);

    // PHP API 호출
    const response = await axios.post(`${PHP_API_BASE_URL}/pharmacy-status-update.php`, requestData, {
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders()
    });

    console.log(`[POST /update-status] 성공 - 상태 변경 완료`);
    
    res.json(response.data);
    
  } catch (error) {
    handleApiError(error, res, '상태 변경 중 오류가 발생했습니다.');
  }
});


/**
 * POST /api/pharmacy2/design-number
 * 설계번호 저장/업데이트 (전문인/화재 구분)
 */
router.post('/design-number', async (req, res) => {
  try {
    const { pharmacyId, designNumber, designType = 'expert' } = req.body;
    
    // 기본적인 존재 여부만 체크
    if (!pharmacyId || !designNumber?.trim()) {
      return res.status(400).json({
        success: false,
        error: '필수 데이터가 누락되었습니다.'
      });
    }
    
    if (!['expert', 'fire'].includes(designType)) {
      return res.status(400).json({
        success: false,
        error: '올바른 설계 유형을 선택해주세요.'
      });
    }
    
    const requestData = {
      pharmacy_id: pharmacyId,           // 그냥 바로 사용
      design_number: designNumber.trim(),
      design_type: designType,
      action: 'update_design'
    };
    
    const typeText = designType === 'expert' ? '전문인' : '화재';
    console.log(`[POST /design-number] ${typeText} 설계번호 저장 요청 - 약국ID: ${pharmacyId}, 설계번호: ${designNumber.trim()}`);
    
    // PHP API 호출
    const response = await axios.post(`${PHP_API_BASE_URL}/pharmacy-design-update.php`, requestData, {
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders()
    });
    
    console.log(`[POST /design-number] 성공 - ${typeText} 설계번호 저장 완료`);
    res.json(response.data);
    
  } catch (error) {
    console.error(`[POST /design-number] 에러:`, error.message);
    handleApiError(error, res, '설계번호 저장 중 오류가 발생했습니다.');
  }
});

/**
 * GET /api/pharmacy2/design-number/:pharmacyId
 * 특정 약국의 설계번호 조회
 */
router.get('/design-number/:pharmacyId', async (req, res) => {
  try {
    const { pharmacyId } = req.params;
    
    // pharmacyId 검증
    const validPharmacyId = parseInt(pharmacyId);
    if (!validPharmacyId || validPharmacyId <= 0) {
      return res.status(400).json({
        success: false,
        error: '올바른 약국 ID를 입력해주세요.'
      });
    }

    console.log(`[GET /design-number/${pharmacyId}] 설계번호 조회 - 약국ID: ${validPharmacyId}`);

    const response = await axios.get(`${PHP_API_BASE_URL}/pharmacy-design-detail.php?pharmacy_id=${validPharmacyId}`, {
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders()
    });

    console.log(`[GET /design-number/${pharmacyId}] 성공 - 설계번호 조회 완료`);
    res.json(response.data);
    
  } catch (error) {
    handleApiError(error, res, '설계번호 조회 중 오류가 발생했습니다.');
  }
});


/**
 * POST /api/pharmacy2/:pharmacyId/memo
 * 메모 저장/업데이트 (메모만 부분 업데이트)
 * 프록시 대상: pharmacy-memo-update.php
 */
router.post('/:pharmacyId/memo', async (req, res) => {
  try {
    const { pharmacyId } = req.params;
    let { memo } = req.body;

    // pharmacyId 검증
    const validPharmacyId = parseInt(pharmacyId, 10);
    if (!validPharmacyId || validPharmacyId <= 0) {
      return res.status(400).json({
        success: false,
        error: '올바른 약국 ID를 입력해주세요.'
      });
    }

    // memo 검증 (비우기 허용: '', null → '')
    memo = (typeof memo === 'string') ? memo : '';
    // 안전 처리: 제어문자 제거(개행은 유지), 최대 길이 제한
    memo = memo.replace(/[^\S\r\n]*$/g, '');         // 말미 공백 정리
    memo = memo.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ''); // 제어문자 제거
    if (memo.length > 5000) {
      return res.status(400).json({
        success: false,
        error: '메모는 5,000자 이내로 입력해주세요.'
      });
    }

    const requestData = {
      pharmacy_id: validPharmacyId,
      memo,
      action: 'update_memo'
    };

    console.log(`[POST /:pharmacyId/memo] 메모 저장 요청 - 약국ID: ${validPharmacyId}, 길이: ${memo.length}`);

    // PHP API 호출 (프로젝트에 맞게 파일명 유지/변경)
    const response = await axios.post(
      `${PHP_API_BASE_URL}/pharmacy-memo-update.php`,
      requestData,
      { timeout: DEFAULT_TIMEOUT, headers: getDefaultHeaders() }
    );

    console.log(`[POST /:pharmacyId/memo] 성공 - 메모 저장 완료`);
    res.json(response.data);

  } catch (error) {
    handleApiError(error, res, '메모 저장 중 오류가 발생했습니다.');
  }
});
/**
 * pharmacy2.js 라우터에 추가할 해지 처리 관련 엔드포인트
 * 기존 라우터 파일의 맨 아래 module.exports = router; 위에 추가
 */

/**
 * POST /api/pharmacy2/calculate-cancellation
 * 해지보험료 계산 (해지기준일 지원 추가)
 * 프록시 대상: pharmacy-cancellation-calculate.php
 */
router.post('/calculate-cancellation', async (req, res) => {
  try {
    const { haeji_num, haejigijun } = req.body;  // haejigijun 추가
    
    // 필수 필드 검증
    if (!haeji_num) {
      return res.status(400).json({
        success: false,
        error: '약국 ID(haeji_num)가 필요합니다.'
      });
    }

    // haeji_num 검증
    const validHaejiNum = parseInt(haeji_num);
    if (!validHaejiNum || validHaejiNum <= 0) {
      return res.status(400).json({
        success: false,
        error: '올바른 약국 ID를 입력해주세요.'
      });
    }

    // 기본 요청 데이터
    const requestData = {
      haeji_num: validHaejiNum,
      action: 'calculate_cancellation'
    };

    // haejigijun이 제공된 경우 추가 (재계산용)
    if (haejigijun && haejigijun.trim()) {
      // 날짜 형식 검증
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(haejigijun.trim())) {
        return res.status(400).json({
          success: false,
          error: '해지기준일은 YYYY-MM-DD 형식으로 입력해주세요.'
        });
      }
      
      requestData.haejigijun = haejigijun.trim();
      console.log(`[POST /calculate-cancellation] 해지기준일 포함 재계산 요청 - 약국ID: ${validHaejiNum}, 해지기준일: ${haejigijun.trim()}`);
    } else {
      console.log(`[POST /calculate-cancellation] 초기 해지보험료 계산 요청 - 약국ID: ${validHaejiNum}`);
    }

    // PHP API 호출 (haejiPSerch 함수 호출)
    const response = await axios.post(`${PHP_API_BASE_URL}/pharmacy-cancellation-calculate.php`, requestData, {
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders()
    });

    console.log(`[POST /calculate-cancellation] 성공 - 해지보험료 계산 완료`);
    
    // 응답 데이터 구조 확인 및 정리
    const responseData = {
      success: true,
      data: response.data.data || response.data,
      message: response.data.message || '해지보험료 계산이 완료되었습니다.'
    };
    
    res.json(responseData);
    
  } catch (error) {
    console.error(`[POST /calculate-cancellation] 오류:`, error.message);
    handleApiError(error, res, '해지보험료 계산 중 오류가 발생했습니다.');
  }
});

/**
 * POST /api/pharmacy2/confirm-cancellation
 * 해지 확인 및 예치금 정산 처리 (haejiConfirm 함수 연동)
 * 프록시 대상: pharmacy-cancellation-confirm.php
 */
router.post('/confirm-cancellation', async (req, res) => {
  try {
    const { haeji_num, haejigijun, haegiP } = req.body;
    
    // 필수 필드 검증
    if (!haeji_num) {
      return res.status(400).json({
        success: false,
        error: '약국 ID(haeji_num)가 필요합니다.'
      });
    }

    if (!haejigijun || !haejigijun.trim()) {
      return res.status(400).json({
        success: false,
        error: '해지기준일(haejigijun)이 필요합니다.'
      });
    }

    if (!haegiP || isNaN(parseInt(haegiP))) {
      return res.status(400).json({
        success: false,
        error: '해지보험료(haegiP)가 필요합니다.'
      });
    }

    // haeji_num 검증
    const validHaejiNum = parseInt(haeji_num);
    if (!validHaejiNum || validHaejiNum <= 0) {
      return res.status(400).json({
        success: false,
        error: '올바른 약국 ID를 입력해주세요.'
      });
    }

    // haejigijun 날짜 형식 검증
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(haejigijun.trim())) {
      return res.status(400).json({
        success: false,
        error: '해지기준일은 YYYY-MM-DD 형식으로 입력해주세요.'
      });
    }

    // haegiP 숫자 검증
    const validHaegiP = parseInt(haegiP);
    if (isNaN(validHaegiP) || validHaegiP < 0) {
      return res.status(400).json({
        success: false,
        error: '해지보험료는 0 이상의 숫자로 입력해주세요.'
      });
    }

    const requestData = {
      haeji_num: validHaejiNum,
      haejigijun: haejigijun.trim(),
      haegiP: validHaegiP,
      action: 'confirm_cancellation'
    };

    console.log(`[POST /confirm-cancellation] 해지 확인 처리 요청 - 약국ID: ${validHaejiNum}, 해지기준일: ${haejigijun.trim()}, 해지보험료: ${validHaegiP.toLocaleString()}원`);

    // PHP API 호출 (haejiConfirm 함수 호출)
    const response = await axios.post(`${PHP_API_BASE_URL}/pharmacy-cancellation-confirm.php`, requestData, {
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders()
    });

    console.log(`[POST /confirm-cancellation] 성공 - 해지 확인 처리 완료`);
    
    // 응답 데이터 구조 확인 및 정리
    let responseData;
    
    // PHP에서 단순 문자열 메시지가 올 수 있음 (haejiConfirm 함수 참고)
    if (typeof response.data === 'string') {
      responseData = {
        success: true,
        message: response.data,
        data: null
      };
    } else {
      responseData = {
        success: response.data.success !== false,
        message: response.data.message || response.data || '해지가 완료되었습니다.',
        data: response.data.data || null
      };
    }
    
    res.json(responseData);
    
  } catch (error) {
    console.error(`[POST /confirm-cancellation] 오류:`, error.message);
    
    // 특별한 에러 처리 (haejiConfirm에서 이미 해지된 경우 등)
    if (error.response && error.response.data) {
      const errorData = error.response.data;
      if (typeof errorData === 'string' && errorData.includes('이미 해지')) {
        return res.status(400).json({
          success: false,
          error: errorData
        });
      }
    }
    
    handleApiError(error, res, '해지 확인 처리 중 오류가 발생했습니다.');
  }
});

/**
 * GET /api/pharmacy2/cancellation-status/:pharmacyId
 * 해지 상태 조회 (선택적 구현)
 * 특정 약국의 해지 가능 여부 및 현재 상태 확인
 */
router.get('/cancellation-status/:pharmacyId', async (req, res) => {
  try {
    const { pharmacyId } = req.params;
    
    // pharmacyId 검증
    const validPharmacyId = parseInt(pharmacyId);
    if (!validPharmacyId || validPharmacyId <= 0) {
      return res.status(400).json({
        success: false,
        error: '올바른 약국 ID를 입력해주세요.'
      });
    }

    console.log(`[GET /cancellation-status/${pharmacyId}] 해지 상태 조회 - 약국ID: ${validPharmacyId}`);

    // PHP API 호출 (해지 상태 조회)
    const response = await axios.get(`${PHP_API_BASE_URL}/pharmacy-cancellation-status.php?pharmacy_id=${validPharmacyId}`, {
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders()
    });

    console.log(`[GET /cancellation-status/${pharmacyId}] 성공 - 해지 상태 조회 완료`);
    res.json(response.data);
    
  } catch (error) {
    console.error(`[GET /cancellation-status/${pharmacyId}] 오류:`, error.message);
    handleApiError(error, res, '해지 상태 조회 중 오류가 발생했습니다.');
  }
});


/**
 * POST /api/pharmacy2/design-list-excel
 * 설계리스트 엑셀 다운로드용 데이터 조회
 * - ch = 17 (설계중)
 * - printCount != 2 (출력되지 않은 건)
 * - 설계번호가 하나라도 있는 건만 조회
 * - 다운로드 후 printCount 초기화
 */
router.post('/design-list-excel', async (req, res) => {
  try {
    const { trigger } = req.body;
    
    // 1. 보안 체크
    if (trigger !== 'value1') {
      return res.status(400).json({
        success: false,
        error: '잘못된 요청입니다.'
      });
    }

    console.log(`[POST /design-list-excel] 설계리스트 조회 요청`);

    // 2. PHP API 호출
    const response = await axios.post(`${PHP_API_BASE_URL}/pharmacy-design-list-excel.php`, 
      { trigger }, 
      {
        timeout: DEFAULT_TIMEOUT,
        headers: getDefaultHeaders()
      }
    );

    console.log(`[POST /design-list-excel] 성공 - 총 ${response.data?.data?.length || 0}건 조회`);
    
    res.json(response.data);
    
  } catch (error) {
    console.error(`[POST /design-list-excel] 오류:`, error.message);
    handleApiError(error, res, '설계리스트 조회 중 오류가 발생했습니다.');
  }
});

// 기존 module.exports = router; 바로 위에 추가
module.exports = router;
// 기존 module.exports = router; 위에 추가
module.exports = router;
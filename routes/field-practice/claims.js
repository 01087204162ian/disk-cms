/**
 * routes/field-practice/claims.js - 현장실습보험 클레임 관리 라우터
 */
const express = require('express');
const axios = require('axios');
const router = express.Router();

// PHP API 기본 URL
const PHP_API_BASE_URL = 'https://silbo.kr/2025/api/claim';
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
    res.status(error.response.status).json(error.response.data);
  } else if (error.code === 'ECONNABORTED') {
    res.status(408).json({
      success: false,
      error: '요청 시간이 초과되었습니다.'
    });
  } else {
    res.status(500).json({
      success: false,
      error: defaultMessage
    });
  }
};

// 로그인 확인 미들웨어
const requireAuth = (req, res, next) => {
  if (!req.session?.user) {
    return res.status(401).json({
      success: false,
      error: '로그인이 필요합니다.'
    });
  }
  next();
};

// 모든 라우트에 인증 체크 적용
router.use(requireAuth);

/**
 * GET /api/field-practice/claims
 * 클레임 목록 조회
 */
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 15, 
      search_school = '', 
      search_mode = 1,
      status = ''
    } = req.query;
    
    const validatedPage = Math.max(1, parseInt(page) || 1);
    const validatedLimit = Math.min(100, Math.max(1, parseInt(limit) || 15));
    const validatedSearchMode = Math.max(1, Math.min(4, parseInt(search_mode) || 1));
    
    const params = new URLSearchParams({
      page: validatedPage,
      limit: validatedLimit,
      search_school: search_school.toString().trim(),
      search_mode: validatedSearchMode
    });
    
	
	if (status) {
      const validatedStatus = parseInt(status);
      if (validatedStatus >= 1 && validatedStatus <= 5) {
        params.append('status', validatedStatus);
      }
    }
    console.log(`[GET /api/field-practice/claims] 클레임 목록 조회 - page: ${validatedPage}, limit: ${validatedLimit}`);
    
    const response = await axios.get(`${PHP_API_BASE_URL}/fetch_claim.php?${params}`, {
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders()
    });
    
    console.log(`[GET /api/field-practice/claims] 성공 - 총 ${response.data.total || 0}건`);
    
    res.json({
      success: true,
      data: response.data.data || [],
      total: parseInt(response.data.total) || 0
    });
    
  } catch (error) {
    handleApiError(error, res, '클레임 목록 조회 중 오류가 발생했습니다.');
  }
});

/**
 * GET /api/field-practice/claims/:id
 * 클레임 상세 조회
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const claimId = parseInt(id);
    
    if (!claimId || claimId <= 0) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 ID입니다.'
      });
    }

    console.log(`[GET /api/field-practice/claims/${claimId}] 상세 정보 조회`);

    const response = await axios.get(
      `${PHP_API_BASE_URL}/get_claim_details.php?id=${claimId}`,
      {
        timeout: DEFAULT_TIMEOUT,
        headers: getDefaultHeaders()
      }
    );

    console.log(`[GET /api/field-practice/claims/${claimId}] 성공`);
    res.json(response.data);
    
  } catch (error) {
    handleApiError(error, res, '상세 정보 조회 중 오류가 발생했습니다.');
  }
});

/**
 * POST /api/field-practice/claims/:id/status
 * 클레임 상태 변경
 */
router.post('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const claimId = parseInt(id);
    
    if (!claimId || claimId <= 0) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 ID입니다.'
      });
    }

    const { status } = req.body;
    const newStatus = parseInt(status);
    
    if (!newStatus || isNaN(newStatus)) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 상태 값입니다.'
      });
    }

    // 허용된 상태 값 검증 (1: 접수, 2: 미결, 3: 종결, 4: 면책, 5: 취소)
    const validStatuses = [1, 2, 3, 4, 5];
    if (!validStatuses.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        error: '허용되지 않은 상태 값입니다.'
      });
    }

    console.log(`[POST /api/field-practice/claims/${claimId}/status] 상태 변경: ${newStatus}`);

    const formData = new URLSearchParams();
    formData.append('id', claimId);
    formData.append('ch', newStatus);

    const response = await axios.post(
      `${PHP_API_BASE_URL}/claim_update_status.php`,
      formData.toString(),
      {
        timeout: DEFAULT_TIMEOUT,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        }
      }
    );

    console.log(`[POST /api/field-practice/claims/${claimId}/status] 완료`);
    res.json(response.data);
    
  } catch (error) {
    handleApiError(error, res, '상태 변경 중 오류가 발생했습니다.');
  }
});

/**
 * POST /api/field-practice/claims/:id/memo
 * 메모 업데이트
 */
router.post('/:id/memo', async (req, res) => {
  try {
    const { id } = req.params;
    const claimId = parseInt(id);
    
    if (!claimId || claimId <= 0) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 ID입니다.'
      });
    }

    const { memo } = req.body;
    
    // 메모가 비어있어도 허용 (빈 문자열로 저장)
    if (memo === undefined || memo === null) {
      return res.status(400).json({
        success: false,
        error: '메모 내용이 필요합니다.'
      });
    }

    console.log(`[POST /api/field-practice/claims/${claimId}/memo] 메모 업데이트`);

    const formData = new URLSearchParams();
    formData.append('num', claimId);
    formData.append('memo', memo);

    const response = await axios.post(
      `${PHP_API_BASE_URL}/update_memo.php`,
      formData.toString(),
      {
        timeout: DEFAULT_TIMEOUT,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        }
      }
    );

    console.log(`[POST /api/field-practice/claims/${claimId}/memo] 완료`);
    res.json(response.data);
    
  } catch (error) {
    handleApiError(error, res, '메모 업데이트 중 오류가 발생했습니다.');
  }
});
/**
 * POST /api/field-practice/claim/save
 * 클레임 저장/수정
 */
router.post('/save', async (req, res) => {
  try {
    console.log('[POST /api/field-practice/claim/save] 클레임 저장/수정 요청');
    
    // 요청 본문 검증
    const requiredFields = ['qNum', 'cNum', 'certi', 'accidentDescription'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `필수 항목이 누락되었습니다: ${missingFields.join(', ')}`
      });
    }

    // FormData를 URLSearchParams로 변환
    const formData = new URLSearchParams();
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined && req.body[key] !== null) {
        formData.append(key, req.body[key]);
      }
    });

    const response = await axios.post(
      `${PHP_API_BASE_URL}/save_claim.php`, // PHP API 엔드포인트 (실제 경로 확인 필요)
      formData.toString(),
      {
        timeout: DEFAULT_TIMEOUT,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        }
      }
    );

    console.log('[POST /api/field-practice/claim/save] 완료');
    res.json(response.data);
    
  } catch (error) {
    handleApiError(error, res, '클레임 저장 중 오류가 발생했습니다.');
  }
});

/**
 * ============================================
 * 통계 API 엔드포인트
 * ============================================
 */

/**
 * GET /api/field-practice/statistics/monthly
 * 월별 통계 조회
 */
router.get('/statistics/monthly', async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    const validatedYear = parseInt(year) || new Date().getFullYear();
    
    console.log(`[GET /api/field-practice/statistics/monthly] 월별 통계 조회 - year: ${validatedYear}`);
    
    const response = await axios.get(
      `${PHP_API_BASE_URL}/get_claim_summary.php?year=${validatedYear}`,
      {
        timeout: DEFAULT_TIMEOUT,
        headers: getDefaultHeaders()
      }
    );
    
    console.log('[GET /api/field-practice/statistics/monthly] 성공');
    res.json({
      success: true,
      data: response.data
    });
    
  } catch (error) {
    handleApiError(error, res, '월별 통계 조회 중 오류가 발생했습니다.');
  }
});

/**
 * GET /api/field-practice/statistics/yearly
 * 연도별 통계 조회
 */
router.get('/statistics/yearly', async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    const validatedYear = parseInt(year) || new Date().getFullYear();
    
    console.log(`[GET /api/field-practice/statistics/yearly] 연도별 통계 조회 - year: ${validatedYear}`);
    
    const response = await axios.get(
      `${PHP_API_BASE_URL}/get_yearly_summary.php?year=${validatedYear}`,
      {
        timeout: DEFAULT_TIMEOUT,
        headers: getDefaultHeaders()
      }
    );
    
    console.log('[GET /api/field-practice/statistics/yearly] 성공');
    res.json({
      success: true,
      data: response.data
    });
    
  } catch (error) {
    handleApiError(error, res, '연도별 통계 조회 중 오류가 발생했습니다.');
  }
});

/**
 * GET /api/field-practice/statistics/contractor
 * 계약자별 통계 조회
 */
router.get('/statistics/contractor', async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    const validatedYear = parseInt(year) || new Date().getFullYear();
    
    console.log(`[GET /api/field-practice/statistics/contractor] 계약자별 통계 조회 - year: ${validatedYear}`);
    
    const response = await axios.get(
      `${PHP_API_BASE_URL}/get_contractor_summary.php?year=${validatedYear}`,
      {
        timeout: DEFAULT_TIMEOUT,
        headers: getDefaultHeaders()
      }
    );
    
    console.log('[GET /api/field-practice/statistics/contractor] 성공');
    res.json({
      success: true,
      data: response.data
    });
    
  } catch (error) {
    handleApiError(error, res, '계약자별 통계 조회 중 오류가 발생했습니다.');
  }
});
module.exports = router;
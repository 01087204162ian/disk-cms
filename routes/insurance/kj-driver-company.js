// routes/insurance/kj-driver-company.js
// KJ 대리운전 업체 목록 프록시
// 프론트엔드 → /api/insurance/kj-company/list → PHP(API) → DB

const express = require('express');
const axios = require('axios');

const router = express.Router();

// 기본 PHP API 엔드포인트 (배포 대상)
const PHP_API_BASE_URL = 'https://pcikorea.com/api/insurance';
const DEFAULT_TIMEOUT = 30000;

const getDefaultHeaders = () => ({
  Accept: 'application/json',
  'Content-Type': 'application/json',
});

// 업체 목록 조회 (날짜/담당자/검색어 필터 + 페이징)
router.get('/kj-company/list', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      getDay = '',
      damdanja = '',
      s_contents = '',
    } = req.query;

    const apiUrl = `${PHP_API_BASE_URL}/kj-company-list.php`;

    const response = await axios.get(apiUrl, {
      params: { page, limit, getDay, damdanja, s_contents },
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders(),
    });

    res.json(response.data);
  } catch (error) {
    console.error('Insurance KJ-company list proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: 'KJ-company list API 호출 중 오류가 발생했습니다.',
      details: error.response?.data || error.message,
    });
  }
});

// -------------------------
// 증권별 코드 (policy) 관련 프록시
// -------------------------
const policyHeaders = () => ({
  Accept: 'application/json',
});

// 증권 리스트 조회
router.get('/kj-code/policy-search', async (req, res) => {
  try {
    const { sj, fromDate = '', toDate = '' } = req.query;
    const apiUrl = `${PHP_API_BASE_URL}/kj-policy-search.php`;
    const response = await axios.get(apiUrl, {
      params: { sj, fromDate, toDate },
      timeout: DEFAULT_TIMEOUT,
      headers: policyHeaders(),
    });
    res.json(response.data);
  } catch (error) {
    console.error('KJ policy search proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: '증권 리스트 API 호출 오류',
      details: error.response?.data || error.message,
    });
  }
});

// 증권 상세
router.post('/kj-code/policy-num-detail', async (req, res) => {
  try {
    const apiUrl = `${PHP_API_BASE_URL}/kj-certi-detail.php`;
    const response = await axios.post(apiUrl, req.body, {
      timeout: DEFAULT_TIMEOUT,
      headers: { ...policyHeaders(), 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    res.json(response.data);
  } catch (error) {
    console.error('KJ policy detail proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: '증권 상세 API 호출 오류',
      details: error.response?.data || error.message,
    });
  }
});

// 증권별 보험료 통계
router.get('/kj-code/policy-num-stats', async (req, res) => {
  try {
    const { certi } = req.query;
    const apiUrl = `${PHP_API_BASE_URL}/kj-policy-stats.php`;
    const response = await axios.get(apiUrl, {
      params: { certi },
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders(),
    });
    res.json(response.data);
  } catch (error) {
    console.error('KJ policy stats proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: '보험료 통계 API 호출 오류',
      details: error.response?.data || error.message,
    });
  }
});

// 증권별 보험료 데이터 조회
router.get('/kj-code/premium-data', async (req, res) => {
  try {
    const { certi } = req.query;
    const apiUrl = `${PHP_API_BASE_URL}/kjDaeri/get_kj_insurance_premium_data.php`;
    const response = await axios.get(apiUrl, {
      params: { certi },
      timeout: DEFAULT_TIMEOUT,
      headers: policyHeaders(),
    });
    res.json(response.data);
  } catch (error) {
    console.error('KJ premium data proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: '보험료 데이터 API 호출 오류',
      details: error.response?.data || error.message,
    });
  }
});

// 증권별 보험료 저장
router.post('/kj-code/premium-save', async (req, res) => {
  try {
    const apiUrl = `${PHP_API_BASE_URL}/kjDaeri/save_Ipremium_data.php`;
    const response = await axios.post(apiUrl, req.body, {
      timeout: DEFAULT_TIMEOUT,
      headers: { ...policyHeaders(), 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    res.json(response.data);
  } catch (error) {
    console.error('KJ premium save proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: '보험료 저장 API 호출 오류',
      details: error.response?.data || error.message,
    });
  }
});

// 담당자 목록 조회
router.get('/kj-company/managers', async (req, res) => {
  try {
    const apiUrl = `${PHP_API_BASE_URL}/kj-company-managers.php`;

    const response = await axios.get(apiUrl, {
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders(),
    });

    res.json(response.data);
  } catch (error) {
    console.error('Insurance KJ-company managers proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: '담당자 목록 API 호출 중 오류가 발생했습니다.',
      details: error.response?.data || error.message,
    });
  }
});

// 업체 상세 정보 조회 (모달용)
router.get('/kj-company/:companyNum', async (req, res) => {
  try {
    const { companyNum } = req.params;
    const apiUrl = `${PHP_API_BASE_URL}/kj-company-detail.php`;

    const response = await axios.get(apiUrl, {
      params: { dNum: companyNum },
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders(),
    });

    res.json(response.data);
  } catch (error) {
    console.error('Insurance KJ-company detail proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: '업체 상세 정보 API 호출 중 오류가 발생했습니다.',
      details: error.response?.data || error.message,
    });
  }
});

// 증권 정보 저장/수정
router.post('/kj-certi/save', async (req, res) => {
  try {
    const apiUrl = `${PHP_API_BASE_URL}/kj-certi-save.php`;

    const response = await axios.post(apiUrl, req.body, {
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders(),
    });

    res.json(response.data);
  } catch (error) {
    console.error('Insurance KJ-certi save proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: '증권 정보 저장 중 오류가 발생했습니다.',
      details: error.response?.data || error.message,
    });
  }
});

// 회차 변경 (납입 회차 업데이트)
router.get('/kj-certi/update-nabang', async (req, res) => {
  try {
    const { nabsunso, certiTableNum, sunso } = req.query;
    
    if (!nabsunso || !certiTableNum) {
      return res.status(400).json({
        success: false,
        error: '필수 파라미터가 누락되었습니다. (nabsunso, certiTableNum)',
      });
    }

    const apiUrl = `${PHP_API_BASE_URL}/kj-certi-update-nabang.php`;

    const response = await axios.get(apiUrl, {
      params: { nabsunso, certiTableNum, sunso },
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders(),
    });

    // JSON 응답 그대로 전달
    res.json(response.data);
  } catch (error) {
    console.error('Insurance KJ-certi update-nabang proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: '회차 변경 중 오류가 발생했습니다.',
      details: error.response?.data || error.message,
    });
  }
});

// 증권별 대리기사 리스트 조회
router.get('/kj-certi/member-list', async (req, res) => {
  try {
    const { certiTableNum, page = 1, limit = 20 } = req.query;
    
    if (!certiTableNum) {
      return res.status(400).json({
        success: false,
        error: '증권 번호가 필요합니다.',
      });
    }

    const apiUrl = `${PHP_API_BASE_URL}/kj-certi-member-list.php`;

    const response = await axios.get(apiUrl, {
      params: { certiTableNum, page, limit },
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders(),
    });

    res.json(response.data);
  } catch (error) {
    console.error('Insurance KJ-certi member-list proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: '대리기사 리스트 조회 중 오류가 발생했습니다.',
      details: error.response?.data || error.message,
    });
  }
});

// 월보험료 조회
router.get('/kj-premium', async (req, res) => {
  try {
    const { cNum } = req.query;
    
    if (!cNum) {
      return res.status(400).json({
        success: false,
        error: '증권 번호(cNum)가 필요합니다.',
      });
    }

    const apiUrl = `${PHP_API_BASE_URL}/kj-premium-data.php`;

    const response = await axios.get(apiUrl, {
      params: { cNum },
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders(),
    });

    res.json(response.data);
  } catch (error) {
    console.error('Insurance KJ-premium proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: '월보험료 조회 중 오류가 발생했습니다.',
      details: error.response?.data || error.message,
    });
  }
});

// 월보험료 저장/수정
router.post('/kj-premium/save', async (req, res) => {
  try {
    const { data } = req.body;
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({
        success: false,
        error: '저장할 데이터가 없습니다.',
      });
    }

    const apiUrl = `${PHP_API_BASE_URL}/kj-premium-save.php`;

    const response = await axios.post(apiUrl, req.body, {
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders(),
    });

    res.json(response.data);
  } catch (error) {
    console.error('Insurance KJ-premium save proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: '월보험료 저장 중 오류가 발생했습니다.',
      details: error.response?.data || error.message,
    });
  }
});

// 증권성격 변경
router.get('/kj-certi/update-gita', async (req, res) => {
  try {
    const { cNum, gita } = req.query;
    
    if (!cNum) {
      return res.status(400).json({
        success: false,
        error: '증권 번호(cNum)가 필요합니다.',
      });
    }

    if (!gita) {
      return res.status(400).json({
        success: false,
        error: '증권성격(gita)이 필요합니다.',
      });
    }

    const apiUrl = `${PHP_API_BASE_URL}/kj-certi-update-gita.php`;

    const response = await axios.get(apiUrl, {
      params: { cNum, gita },
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders(),
    });

    res.json(response.data);
  } catch (error) {
    console.error('Insurance KJ-certi update-gita proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: '증권성격 변경 중 오류가 발생했습니다.',
      details: error.response?.data || error.message,
    });
  }
});

// 결제방식 변경 (토글)
router.get('/kj-certi/update-divi', async (req, res) => {
  try {
    const { cNum, divi } = req.query;
    
    if (!cNum) {
      return res.status(400).json({
        success: false,
        error: '증권 번호(cNum)가 필요합니다.',
      });
    }

    if (!divi) {
      return res.status(400).json({
        success: false,
        error: '결제방식(divi)이 필요합니다.',
      });
    }

    const apiUrl = `${PHP_API_BASE_URL}/kj-certi-update-divi.php`;

    const response = await axios.get(apiUrl, {
      params: { cNum, divi },
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders(),
    });

    res.json(response.data);
  } catch (error) {
    console.error('Insurance KJ-certi update-divi proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: '결제방식 변경 중 오류가 발생했습니다.',
      details: error.response?.data || error.message,
    });
  }
});

// 배서 저장 API
router.post('/kj-endorse/save', async (req, res) => {
  try {
    const apiUrl = `${PHP_API_BASE_URL}/kj-endorse-save.php`;

    const response = await axios.post(apiUrl, req.body, {
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders(),
    });

    res.json(response.data);
  } catch (error) {
    console.error('Insurance KJ-endorse save proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: '배서 저장 중 오류가 발생했습니다.',
      details: error.response?.data || error.message,
    });
  }
});

// 배서 해지 신청 API
router.post('/kj-endorse/termination', async (req, res) => {
  try {
    const apiUrl = `${PHP_API_BASE_URL}/kj-endorse-termination.php`;

    const response = await axios.post(apiUrl, req.body, {
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders(),
    });

    res.json(response.data);
  } catch (error) {
    console.error('Insurance KJ-endorse cancel proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: '해지 신청 중 오류가 발생했습니다.',
      details: error.response?.data || error.message,
    });
  }
});

// 배서 증권번호 목록 조회
router.get('/kj-endorse/policy-list', async (req, res) => {
  try {
    const apiUrl = `${PHP_API_BASE_URL}/kj-endorse-policy-list.php`;

    const response = await axios.get(apiUrl, {
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders(),
    });

    res.json(response.data);
  } catch (error) {
    console.error('Insurance KJ-endorse policy-list proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: '증권번호 목록 조회 중 오류가 발생했습니다.',
      details: error.response?.data || error.message,
    });
  }
});

// 배서 대리운전회사 목록 조회
router.get('/kj-endorse/company-list', async (req, res) => {
  try {
    const { policyNum } = req.query;
    
    const apiUrl = `${PHP_API_BASE_URL}/kj-endorse-company-list.php`;

    const response = await axios.get(apiUrl, {
      params: { policyNum },
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders(),
    });

    res.json(response.data);
  } catch (error) {
    console.error('Insurance KJ-endorse company-list proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: '대리운전회사 목록 조회 중 오류가 발생했습니다.',
      details: error.response?.data || error.message,
    });
  }
});

// 배서 리스트 조회
router.get('/kj-endorse/list', async (req, res) => {
  try {
    const { page, limit, push, policyNum, companyNum } = req.query;
    
    const apiUrl = `${PHP_API_BASE_URL}/kj-endorse-list.php`;

    const response = await axios.get(apiUrl, {
      params: { page, limit, push, policyNum, companyNum },
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders(),
    });

    res.json(response.data);
  } catch (error) {
    console.error('Insurance KJ-endorse list proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: '배서 리스트 조회 중 오류가 발생했습니다.',
      details: error.response?.data || error.message,
    });
  }
});

// 배서 상태 업데이트 API
router.post('/kj-endorse/update-status', async (req, res) => {
  try {
    const apiUrl = `${PHP_API_BASE_URL}/kj-endorse-update-status.php`;

    const response = await axios.post(apiUrl, req.body, {
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders(),
    });

    res.json(response.data);
  } catch (error) {
    console.error('Insurance KJ-endorse update-status proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: '배서 상태 업데이트 중 오류가 발생했습니다.',
      details: error.response?.data || error.message,
    });
  }
});

// 배서 요율 업데이트 API
router.post('/kj-endorse/rate-update', async (req, res) => {
  try {
    const apiUrl = `${PHP_API_BASE_URL}/kj-rate-update.php`;

    const response = await axios.post(apiUrl, req.body, {
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders(),
    });

    res.json(response.data);
  } catch (error) {
    console.error('Insurance KJ-endorse rate-update proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: '요율 변경 중 오류가 발생했습니다.',
      details: error.response?.data || error.message,
    });
  }
});

// 보험료 데이터 마이그레이션 API (2012Certi → kj_insurance_premium_data)
router.get('/kj-migrate-premium-data', async (req, res) => {
  try {
    const { clear } = req.query;
    const apiUrl = `${PHP_API_BASE_URL}/kj-migrate-premium-data.php`;

    const response = await axios.get(apiUrl, {
      params: clear ? { clear: '1' } : {},
      timeout: 300000, // 마이그레이션은 시간이 걸릴 수 있으므로 타임아웃 증가
      headers: getDefaultHeaders(),
    });

    res.json(response.data);
  } catch (error) {
    console.error('Insurance KJ-migrate-premium-data proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: '보험료 데이터 마이그레이션 중 오류가 발생했습니다.',
      details: error.response?.data || error.message,
    });
  }
});

// 담당자별 보험료 통계 조회
router.get('/kj-premium/by-manager', async (req, res) => {
  try {
    const { certi } = req.query;

    if (!certi) {
      return res.status(400).json({
        success: false,
        message: '증권번호가 필요합니다.',
      });
    }

    const apiUrl = `${PHP_API_BASE_URL}/kj-premium-by-manager.php`;

    const response = await axios.get(apiUrl, {
      params: { certi },
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders(),
    });

    res.json(response.data);
  } catch (error) {
    console.error('Insurance KJ-premium by-manager proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: '담당자별 보험료 통계 API 호출 중 오류가 발생했습니다.',
      details: error.response?.data || error.message,
    });
  }
});

module.exports = router;


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
      currentInwon = '1',
    } = req.query;

    const apiUrl = `${PHP_API_BASE_URL}/kj-company-list.php`;

    const response = await axios.get(apiUrl, {
      params: { page, limit, getDay, damdanja, s_contents, currentInwon },
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
    const { certi, by_manager } = req.query;
    const apiUrl = `${PHP_API_BASE_URL}/kj-policy-stats.php`;
    const response = await axios.get(apiUrl, {
      params: { certi, by_manager },
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
// kj_insurance_premium_data 조회/저장
router.get('/kj-insurance-premium-data', async (req, res) => {
  try {
    const { policyNum } = req.query;
    const apiUrl = `${PHP_API_BASE_URL}/kj-insurance-premium-data.php`;
    const response = await axios.get(apiUrl, {
      params: { policyNum },
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders(),
    });
    res.json(response.data);
  } catch (error) {
    console.error('KJ insurance premium data proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: '보험료 데이터 API 호출 오류',
      details: error.response?.data || error.message,
    });
  }
});

router.post('/kj-insurance-premium-data', async (req, res) => {
  try {
    const apiUrl = `${PHP_API_BASE_URL}/kj-insurance-premium-data.php`;
    const response = await axios.post(apiUrl, req.body, {
      timeout: DEFAULT_TIMEOUT,
      headers: { ...getDefaultHeaders(), 'Content-Type': 'application/json' },
    });
    res.json(response.data);
  } catch (error) {
    console.error('KJ insurance premium data save proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: '보험료 데이터 저장 오류',
      details: error.response?.data || error.message,
    });
  }
});

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

// 증권 상세 정보 수정
router.post('/kj-certi/update', async (req, res) => {
  try {
    const apiUrl = `${PHP_API_BASE_URL}/kj-certi-update.php`;

    const response = await axios.post(apiUrl, req.body, {
      timeout: DEFAULT_TIMEOUT,
      headers: { ...getDefaultHeaders(), 'Content-Type': 'application/json' },
    });

    res.json(response.data);
  } catch (error) {
    console.error('Insurance KJ-certi update proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: '증권 정보 수정 중 오류가 발생했습니다.',
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

// 배서처리 상태 업데이트 API
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
      error: '배서처리 상태 업데이트 중 오류가 발생했습니다.',
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
    const { page, limit, push, progress, insuranceCom, policyNum, companyNum, endorseDay } = req.query;
    
    const apiUrl = `${PHP_API_BASE_URL}/kj-endorse-list.php`;

    const response = await axios.get(apiUrl, {
      params: { page, limit, push, progress, insuranceCom, policyNum, companyNum, endorseDay },
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

// 배서 회원 정보 업데이트 API (이름, 핸드폰, 진행단계)
router.post('/kj-endorse/update-member', async (req, res) => {
  try {
    const apiUrl = `${PHP_API_BASE_URL}/kj-endorse-update-member.php`;

    const response = await axios.post(apiUrl, req.body, {
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders(),
    });

    res.json(response.data);
  } catch (error) {
    console.error('Insurance KJ-endorse update-member proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: '회원 정보 업데이트 중 오류가 발생했습니다.',
      details: error.response?.data || error.message,
    });
  }
});

// 배서기준일 업데이트 API
router.post('/kj-endorse/update-endorse-day', async (req, res) => {
  try {
    const apiUrl = `${PHP_API_BASE_URL}/kj-endorse-update-endorse-day.php`;

    const response = await axios.post(apiUrl, req.body, {
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders(),
    });

    res.json(response.data);
  } catch (error) {
    console.error('Insurance KJ-endorse update-endorse-day proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: '배서기준일 업데이트 중 오류가 발생했습니다.',
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

// 2012Cpreminum → kj_premium_data 마이그레이션 API
router.get('/kj-migrate-cpreminum-to-premium-data', async (req, res) => {
  try {
    const { clear } = req.query;
    const apiUrl = `${PHP_API_BASE_URL}/kj-migrate-cpreminum-to-premium-data.php`;

    const response = await axios.get(apiUrl, {
      params: clear ? { clear: '1' } : {},
      timeout: 300000, // 마이그레이션은 시간이 걸릴 수 있으므로 타임아웃 증가
      headers: getDefaultHeaders(),
    });

    res.json(response.data);
  } catch (error) {
    console.error('Insurance KJ-migrate-cpreminum-to-premium-data proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: '2012Cpreminum 마이그레이션 중 오류가 발생했습니다.',
      details: error.response?.data || error.message,
    });
  }
});

// 일일배서리스트 조회 API
router.post('/kj-daily-endorse/search', async (req, res) => {
  try {
    const apiUrl = `${PHP_API_BASE_URL}/kj-daily-endorse-search.php`;
    
    // FormData 형식으로 데이터 준비 (URLSearchParams 사용)
    const params = new URLSearchParams();
    if (req.body.todayStr) params.append('todayStr', req.body.todayStr);
    if (req.body.page) params.append('page', req.body.page);
    if (req.body.sort) params.append('sort', req.body.sort);
    if (req.body.dNum) params.append('dNum', req.body.dNum);
    if (req.body.policyNum) params.append('policyNum', req.body.policyNum);

    const response = await axios.post(apiUrl, params.toString(), {
      timeout: DEFAULT_TIMEOUT,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('KJ daily endorse search proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: '일일배서리스트 조회 중 오류가 발생했습니다.',
      details: error.response?.data || error.message,
    });
  }
});

// 일일배서 대리운전회사 목록 조회
router.get('/kj-daily-endorse/company-list', async (req, res) => {
  try {
    const { endorseDay } = req.query;
    const apiUrl = `${PHP_API_BASE_URL}/kj-daily-endorse-company-list.php`;
    
    const response = await axios.get(apiUrl, {
      params: { endorseDay },
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders(),
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('KJ daily endorse company-list proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: '대리운전회사 목록 조회 중 오류가 발생했습니다.',
      details: error.response?.data || error.message,
    });
  }
});

// 일일배서 증권번호 목록 조회
router.get('/kj-daily-endorse/certi-list', async (req, res) => {
  try {
    const { endorseDay, dNum, policyNum, sort } = req.query;
    const apiUrl = `${PHP_API_BASE_URL}/kj-daily-endorse-certi-list.php`;
    
    const response = await axios.get(apiUrl, {
      params: { endorseDay, dNum, policyNum, sort },
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders(),
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('KJ daily endorse certi-list proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: '증권번호 목록 조회 중 오류가 발생했습니다.',
      details: error.response?.data || error.message,
    });
  }
});

// 배서현황 조회 API
router.post('/kj-daily-endorse/status', async (req, res) => {
  try {
    const apiUrl = `${PHP_API_BASE_URL}/kj-daily-endorse-status.php`;
    
    // FormData 형식으로 데이터 준비 (URLSearchParams 사용)
    const params = new URLSearchParams();
    if (req.body.todayStr) params.append('todayStr', req.body.todayStr);
    if (req.body.dNum) params.append('dNum', req.body.dNum);

    const response = await axios.post(apiUrl, params.toString(), {
      timeout: DEFAULT_TIMEOUT,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('KJ daily endorse status proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: '배서현황 조회 중 오류가 발생했습니다.',
      details: error.response?.data || error.message,
    });
  }
});

// 일일배서현황 조회 API
router.post('/kj-daily-endorse/current-situation', async (req, res) => {
  try {
    const apiUrl = `${PHP_API_BASE_URL}/kj-daily-endorse-current-situation.php`;
    
    // FormData 형식으로 데이터 준비 (URLSearchParams 사용)
    const params = new URLSearchParams();
    if (req.body.fromDate) params.append('fromDate', req.body.fromDate);
    if (req.body.toDate) params.append('toDate', req.body.toDate);

    const response = await axios.post(apiUrl, params.toString(), {
      timeout: DEFAULT_TIMEOUT,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('KJ daily endorse current situation proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: '일일배서현황 조회 중 오류가 발생했습니다.',
      details: error.response?.data || error.message,
    });
  }
});

// 문자리스트 조회 API
router.post('/kj-sms/list', async (req, res) => {
  try {
    const apiUrl = `${PHP_API_BASE_URL}/kj-sms-list.php`;
    
    // FormData 형식으로 데이터 준비 (URLSearchParams 사용)
    const params = new URLSearchParams();
    if (req.body.sort) params.append('sort', req.body.sort);
    if (req.body.phone) params.append('phone', req.body.phone);
    if (req.body.startDate) params.append('startDate', req.body.startDate);
    if (req.body.endDate) params.append('endDate', req.body.endDate);
    if (req.body.company) params.append('company', req.body.company);
    if (req.body.dnum) params.append('dnum', req.body.dnum);
    if (req.body.page) params.append('page', req.body.page);

    const response = await axios.post(apiUrl, params.toString(), {
      timeout: DEFAULT_TIMEOUT,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('KJ SMS list proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: '문자리스트 조회 중 오류가 발생했습니다.',
      details: error.response?.data || error.message,
    });
  }
});

// ==================== 업체 I.D 관련 API ====================

// 업체 I.D 목록 조회
router.post('/kj-company/id-list', async (req, res) => {
  try {
    const apiUrl = `${PHP_API_BASE_URL}/kj-company-id-list.php`;
    // PHP API는 POST의 FormData 형식을 기대하므로 URLSearchParams 사용
    const formData = new URLSearchParams();
    const dNum = req.body.dNum || '';
    if (dNum) formData.append('dNum', dNum);
    
    const response = await axios.post(apiUrl, formData.toString(), {
      timeout: DEFAULT_TIMEOUT,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('KJ company id-list proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: '업체 I.D 목록 조회 중 오류가 발생했습니다.',
      details: error.response?.data || error.message,
    });
  }
});

// ID 중복 검사
router.post('/kj-company/check-id', async (req, res) => {
  try {
    const apiUrl = `${PHP_API_BASE_URL}/kj-company-check-id.php`;
    const formData = new URLSearchParams();
    if (req.body.mem_id) formData.append('mem_id', req.body.mem_id);
    
    const response = await axios.post(apiUrl, formData.toString(), {
      timeout: DEFAULT_TIMEOUT,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('KJ company check-id proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      available: false,
      error: 'ID 중복 검사 중 오류가 발생했습니다.',
      details: error.response?.data || error.message,
    });
  }
});

// 주민번호로 회사 조회
router.get('/kj-company/check-jumin', async (req, res) => {
  try {
    const { jumin } = req.query;
    if (!jumin) {
      return res.status(400).json({
        exists: false,
        error: '주민번호가 필요합니다.'
      });
    }

    const apiUrl = `${PHP_API_BASE_URL}/kj-company-check-jumin.php`;
    const response = await axios.get(apiUrl, {
      params: { jumin },
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders(),
    });

    res.json(response.data);
  } catch (error) {
    console.error('KJ company check-jumin proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      exists: false,
      error: '주민번호 확인 중 오류가 발생했습니다.',
      details: error.response?.data || error.message,
    });
  }
});

// 신규 회사 저장/수정
router.post('/kj-company/store', async (req, res) => {
  try {
    const apiUrl = `${PHP_API_BASE_URL}/kj-company-store.php`;
    
    // FormData 형식으로 전송
    const formData = new URLSearchParams();
    if (req.body.jumin) formData.append('jumin', req.body.jumin);
    if (req.body.company) formData.append('company', req.body.company);
    if (req.body.Pname) formData.append('Pname', req.body.Pname);
    if (req.body.hphone) formData.append('hphone', req.body.hphone);
    if (req.body.cphone) formData.append('cphone', req.body.cphone);
    if (req.body.cNumber) formData.append('cNumber', req.body.cNumber);
    if (req.body.lNumber) formData.append('lNumber', req.body.lNumber);
    if (req.body.postNum) formData.append('postNum', req.body.postNum);
    if (req.body.address1) formData.append('address1', req.body.address1);
    if (req.body.address2) formData.append('address2', req.body.address2);
    if (req.body.dNum) formData.append('dNum', req.body.dNum);

    const response = await axios.post(apiUrl, formData.toString(), {
      timeout: DEFAULT_TIMEOUT,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error('KJ company store proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: '회사 저장 중 오류가 발생했습니다.',
      details: error.response?.data || error.message,
    });
  }
});

// ==================== 정산/보험료 관련 ====================

// 월별 배서/정산 데이터 조회
router.get('/kj-company/settlement/monthly', async (req, res) => {
  try {
    const { dNum, lastMonthDueDate, thisMonthDueDate } = req.query;
    if (!dNum || !lastMonthDueDate || !thisMonthDueDate) {
      return res.status(400).json({
        success: false,
        message: 'dNum, lastMonthDueDate, thisMonthDueDate가 필요합니다.',
      });
    }

    const apiUrl = `${PHP_API_BASE_URL}/kj-settlement-monthly-endorse-search.php`;
    const response = await axios.get(apiUrl, {
      params: { dNum, lastMonthDueDate, thisMonthDueDate },
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders(),
    });

    res.json(response.data);
  } catch (error) {
    console.error('KJ settlement monthly proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: '정산 데이터 조회 중 오류가 발생했습니다.',
      details: error.response?.data || error.message,
    });
  }
});

// 정산 상태 업데이트
router.post('/kj-company/settlement/update', async (req, res) => {
  try {
    const apiUrl = `${PHP_API_BASE_URL}/kj-settlement-update.php`;
    const formData = new URLSearchParams();
    if (req.body.seqNo) formData.append('seqNo', req.body.seqNo);
    if (req.body.status) formData.append('status', req.body.status);
    if (req.body.userName) formData.append('userName', req.body.userName);

    const response = await axios.post(apiUrl, formData.toString(), {
      timeout: DEFAULT_TIMEOUT,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    res.json(response.data);
  } catch (error) {
    console.error('KJ settlement update proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: '정산 상태 업데이트 중 오류가 발생했습니다.',
      details: error.response?.data || error.message,
    });
  }
});

// 정산 엑셀 다운로드
// 정산 엑셀 데이터 조회 (JSON 응답 - SheetJS용)
router.post('/kj-company/settlement/excel-data', async (req, res) => {
  try {
    const { dNum, lastMonthDueDate, thisMonthDueDate } = req.body;
    const apiUrl = `${PHP_API_BASE_URL}/kj-settlement-excel-data.php`;
    
    // URLSearchParams로 변환
    const params = new URLSearchParams();
    if (dNum) params.append('dNum', dNum);
    if (lastMonthDueDate) params.append('lastMonthDueDate', lastMonthDueDate);
    if (thisMonthDueDate) params.append('thisMonthDueDate', thisMonthDueDate);
    
    const response = await axios.post(apiUrl, params.toString(), {
      timeout: DEFAULT_TIMEOUT,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('KJ settlement excel-data proxy error:', error.message);
    console.error('Error details:', error.response?.data);
    console.error('Request params:', req.body);
    
    // PHP 에러 응답이 JSON인 경우 파싱
    let errorDetails = error.message;
    if (error.response?.data) {
      try {
        const errorData = typeof error.response.data === 'string' 
          ? JSON.parse(error.response.data) 
          : error.response.data;
        errorDetails = errorData.error || errorData.message || error.message;
      } catch (e) {
        errorDetails = error.response.data.toString();
      }
    }
    
    res.status(error.response?.status || 500).json({
      success: false,
      error: '정산 엑셀 데이터 조회 중 오류가 발생했습니다.',
      details: errorDetails,
      file: error.response?.data?.file,
      line: error.response?.data?.line,
    });
  }
});

router.post('/kj-company/settlement/excel', async (req, res) => {
  try {
    const apiUrl = `${PHP_API_BASE_URL}/kj-settlement-excel.php`;
    const formData = new URLSearchParams();
    if (req.body.dNum) formData.append('dNum', req.body.dNum);
    if (req.body.lastMonthDueDate) formData.append('lastMonthDueDate', req.body.lastMonthDueDate);
    if (req.body.thisMonthDueDate) formData.append('thisMonthDueDate', req.body.thisMonthDueDate);

    const response = await axios.post(apiUrl, formData.toString(), {
      responseType: 'arraybuffer',
      timeout: DEFAULT_TIMEOUT,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    // PHP에서 내려준 파일 이름/컨텐츠 타입 전달
    const contentType = response.headers['content-type'] || 'application/octet-stream';
    const disposition = response.headers['content-disposition'] || 'attachment; filename="settlement.xlsx"';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', disposition);
    res.send(response.data);
  } catch (error) {
    console.error('KJ settlement excel proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: '정산 엑셀 생성 중 오류가 발생했습니다.',
      details: error.response?.data || error.message,
    });
  }
});

// 신규 아이디 저장
router.post('/kj-company/id-save', async (req, res) => {
  try {
    const apiUrl = `${PHP_API_BASE_URL}/kj-company-id-save.php`;
    const formData = new URLSearchParams();
    if (req.body.dNum) formData.append('dNum', req.body.dNum);
    if (req.body.mem_id) formData.append('mem_id', req.body.mem_id);
    if (req.body.password) formData.append('password', req.body.password);
    if (req.body.phone) formData.append('phone', req.body.phone);
    if (req.body.company) formData.append('company', req.body.company);
    if (req.body.user) formData.append('user', req.body.user);
    
    const response = await axios.post(apiUrl, formData.toString(), {
      timeout: DEFAULT_TIMEOUT,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('KJ company id-save proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: 'ID 저장 중 오류가 발생했습니다.',
      details: error.response?.data || error.message,
    });
  }
});

// 담당자명 업데이트
router.post('/kj-company/id-update-user', async (req, res) => {
  try {
    const apiUrl = `${PHP_API_BASE_URL}/kj-company-id-update-user.php`;
    const formData = new URLSearchParams();
    if (req.body.num) formData.append('num', req.body.num);
    if (req.body.user) formData.append('user', req.body.user);
    
    const response = await axios.post(apiUrl, formData.toString(), {
      timeout: DEFAULT_TIMEOUT,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('KJ company id-update-user proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: '담당자명 업데이트 중 오류가 발생했습니다.',
      details: error.response?.data || error.message,
    });
  }
});

// 전화번호 업데이트
router.post('/kj-company/id-update-phone', async (req, res) => {
  try {
    const apiUrl = `${PHP_API_BASE_URL}/kj-company-id-update-phone.php`;
    const formData = new URLSearchParams();
    if (req.body.num) formData.append('num', req.body.num);
    if (req.body.hphone) formData.append('hphone', req.body.hphone);
    
    const response = await axios.post(apiUrl, formData.toString(), {
      timeout: DEFAULT_TIMEOUT,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('KJ company id-update-phone proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: '전화번호 업데이트 중 오류가 발생했습니다.',
      details: error.response?.data || error.message,
    });
  }
});

// 비밀번호 업데이트
router.post('/kj-company/id-update-password', async (req, res) => {
  try {
    const apiUrl = `${PHP_API_BASE_URL}/kj-company-id-update-password.php`;
    const formData = new URLSearchParams();
    if (req.body.num) formData.append('num', req.body.num);
    if (req.body.password) formData.append('password', req.body.password);
    
    const response = await axios.post(apiUrl, formData.toString(), {
      timeout: DEFAULT_TIMEOUT,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('KJ company id-update-password proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: '비밀번호 업데이트 중 오류가 발생했습니다.',
      details: error.response?.data || error.message,
    });
  }
});

// 읽기 권한 업데이트
router.post('/kj-company/id-update-readis', async (req, res) => {
  try {
    const apiUrl = `${PHP_API_BASE_URL}/kj-company-id-update-readis.php`;
    const formData = new URLSearchParams();
    if (req.body.num) formData.append('num', req.body.num);
    if (req.body.readIs) formData.append('readIs', req.body.readIs);
    
    const response = await axios.post(apiUrl, formData.toString(), {
      timeout: DEFAULT_TIMEOUT,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('KJ company id-update-readis proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: '권한 업데이트 중 오류가 발생했습니다.',
      details: error.response?.data || error.message,
    });
  }
});

// 허용/차단 업데이트
router.post('/kj-company/id-update-permit', async (req, res) => {
  try {
    const apiUrl = `${PHP_API_BASE_URL}/kj-company-id-update-permit.php`;
    const formData = new URLSearchParams();
    if (req.body.num) formData.append('num', req.body.num);
    if (req.body.permit) formData.append('permit', req.body.permit);
    
    const response = await axios.post(apiUrl, formData.toString(), {
      timeout: DEFAULT_TIMEOUT,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('KJ company id-update-permit proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: '허용/차단 업데이트 중 오류가 발생했습니다.',
      details: error.response?.data || error.message,
    });
  }
});

// ==================== 정산 관련 API (추가) ====================

// 증권번호별 정산 데이터 조회 (집계)
router.get('/kj-company/settlement/endorse-day', async (req, res) => {
  try {
    const { dNum } = req.query;
    const apiUrl = `${PHP_API_BASE_URL}/kj-settlement-endorse-day.php?dNum=${dNum}`;
    
    const response = await axios.get(apiUrl);
    res.json(response.data);
  } catch (error) {
    console.error('KJ settlement endorse-day proxy error:', error.message);
    res.status(500).json({ success: false, error: '프록시 오류가 발생했습니다.' });
  }
});

router.get('/kj-company/settlement/adjustment', async (req, res) => {
  try {
    const apiUrl = `${PHP_API_BASE_URL}/kj-settlement-adjustment.php`;
    const response = await axios.get(apiUrl, {
      params: req.query,
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders(),
    });
    res.json(response.data);
  } catch (error) {
    console.error('KJ settlement adjustment proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: '증권번호별 정산 데이터 조회 중 오류가 발생했습니다.',
      details: error.response?.data || error.message,
    });
  }
});

// 정산 메모 조회
router.post('/kj-company/settlement/memo-search', async (req, res) => {
  try {
    const apiUrl = `${PHP_API_BASE_URL}/kj-settlement-memo-search.php`;
    const formData = new URLSearchParams();
    if (req.body.jumin) formData.append('jumin', req.body.jumin);

    const response = await axios.post(apiUrl, formData.toString(), {
      timeout: DEFAULT_TIMEOUT,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    res.json(response.data);
  } catch (error) {
    console.error('KJ settlement memo search proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: '메모 조회 중 오류가 발생했습니다.',
      details: error.response?.data || error.message,
    });
  }
});

// 정산 메모 저장
router.post('/kj-company/settlement/memo-save', async (req, res) => {
  try {
    const apiUrl = `${PHP_API_BASE_URL}/kj-settlement-memo-save.php`;
    const formData = new URLSearchParams();
    if (req.body.jumin) formData.append('jumin', req.body.jumin);
    if (req.body.memo) formData.append('memo', req.body.memo);
    if (req.body.memokind) formData.append('memokind', req.body.memokind);
    if (req.body.userid) formData.append('userid', req.body.userid);

    const response = await axios.post(apiUrl, formData.toString(), {
      timeout: DEFAULT_TIMEOUT,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    res.json(response.data);
  } catch (error) {
    console.error('KJ settlement memo save proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: '메모 저장 중 오류가 발생했습니다.',
      details: error.response?.data || error.message,
    });
  }
});

module.exports = router;


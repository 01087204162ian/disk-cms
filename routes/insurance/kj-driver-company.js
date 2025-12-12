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

module.exports = router;


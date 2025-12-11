// routes/insurance/kj-driver-search.js
// KJ 대리운전 기사 검색 프록시
// 프론트엔드 → /api/insurance/kj-driver/list → PHP(API) → DB

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

// 목록 조회 (이름/주민번호/상태 필터 + 페이징)
router.get('/kj-driver/list', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      name = '',
      jumin = '',
      status = '',
    } = req.query;

    const apiUrl = `${PHP_API_BASE_URL}/kj-driver-list.php`;

    const response = await axios.get(apiUrl, {
      params: { page, limit, name, jumin, status },
      timeout: DEFAULT_TIMEOUT,
      headers: getDefaultHeaders(),
    });

    res.json(response.data);
  } catch (error) {
    console.error('Insurance KJ-driver list proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: 'KJ-driver list API 호출 중 오류가 발생했습니다.',
      details: error.response?.data || error.message,
    });
  }
});

module.exports = router;


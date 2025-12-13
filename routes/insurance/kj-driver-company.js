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
    const { certiTableNum } = req.query;
    
    if (!certiTableNum) {
      return res.status(400).json({
        success: false,
        error: '증권 번호가 필요합니다.',
      });
    }

    const apiUrl = `${PHP_API_BASE_URL}/kj-certi-member-list.php`;

    const response = await axios.get(apiUrl, {
      params: { certiTableNum },
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

module.exports = router;


/**
 * KJ 대리운전 공통 상수 모듈
 * 모든 kj 관련 파일에서 공통으로 사용하는 상수 정의
 * 
 * 수정사항 (2025-12-14):
 * - 4: 현대, 5: 롯데 (확인)
 * - 5 (증권성격): 전차량 → 확대탁송으로 통일
 * - 6 (보험회사): 더케이 → 하나로 변경
 * - 7 (보험회사): MG → 한화로 변경
 * 
 * 수정사항 (2025-12-18):
 * - 할인할증 요율(RATE_OPTIONS) 추가
 */

(function() {
  'use strict';

  // ==================== 보험회사 옵션 ====================
  const INSURER_OPTIONS = [
    { value: 0, label: '=선택=' },
    { value: 1, label: '흥국' },
    { value: 2, label: 'DB' },
    { value: 3, label: 'KB' },
    { value: 4, label: '현대' },
    { value: 5, label: '롯데' },
    { value: 6, label: '하나' },  // 더케이 → 하나로 변경
    { value: 7, label: '한화' },  // MG → 한화로 변경
    { value: 8, label: '삼성' },
    { value: 9, label: '메리츠' },
  ];

  // ==================== 증권성격 옵션 ====================
  const GITA_OPTIONS = [
    { value: 1, label: '일반' },
    { value: 2, label: '탁송' },
    { value: 3, label: '일반/렌트' },
    { value: 4, label: '탁송/렌트' },
    { value: 5, label: '확대탁송' },  // 전차량 → 확대탁송으로 통일
  ];

  // ==================== 결제방식 옵션 ====================
  const DIVI_OPTIONS = [
    { value: 1, label: '정상납' },
    { value: 2, label: '월납' },
  ];

  // ==================== 할인할증 요율 옵션 ====================
  const RATE_OPTIONS = [
    { value: '-1', label: '선택' },
    { value: '1', label: '1', rate: 1.000, name: '기본' },
    { value: '2', label: '0.9', rate: 0.900, name: '할인' },
    { value: '3', label: '0.925', rate: 0.925, name: '3년간 사고건수 0건 1년간 사고건수 0건 무사고 1년 이상' },
    { value: '4', label: '0.898', rate: 0.898, name: '3년간 사고건수 0건 1년간 사고건수 0건 무사고 2년 이상' },
    { value: '5', label: '0.889', rate: 0.889, name: '3년간 사고건수 0건 1년간 사고건수 0건 무사고 3년 이상' },
    { value: '6', label: '1.074', rate: 1.074, name: '3년간 사고건수 1건 1년간 사고건수 0건' },
    { value: '7', label: '1.085', rate: 1.085, name: '3년간 사고건수 1건 1년간 사고건수 1' },
    { value: '8', label: '1.242', rate: 1.242, name: '3년간 사고건수 2건 1년간 사고건수 0' },
    { value: '9', label: '1.253', rate: 1.253, name: '3년간 사고건수 2건 1년간 사고건수 1' },
    { value: '10', label: '1.314', rate: 1.314, name: '3년간 사고건수 2건 1년간 사고건수 2' },
    { value: '11', label: '1.428', rate: 1.428, name: '3년간 사고건수 3건이상 1년간 사고건수 0' },
    { value: '12', label: '1.435', rate: 1.435, name: '3년간 사고건수 3건이상 1년간 사고건수 1' },
    { value: '13', label: '1.447', rate: 1.447, name: '3년간 사고건수 3건이상 1년간 사고건수 2' },
    { value: '14', label: '1.459', rate: 1.459, name: '3년간 사고건수 3건이상 1년간 사고건수 3건이상' },
  ];

  // ==================== 매핑 객체 ====================
  
  // 보험회사 코드 → 이름 매핑
  const INSURER_MAP = {
    1: '흥국',
    2: 'DB',
    3: 'KB',
    4: '현대',
    5: '롯데',
    6: '하나',  // 더케이 → 하나로 변경
    7: '한화',  // MG → 한화로 변경
    8: '삼성',
    9: '메리츠',
  };

  // 증권성격 코드 → 이름 매핑
  const GITA_MAP = {
    1: '일반',
    2: '탁송',
    3: '일반/렌트',
    4: '탁송/렌트',
    5: '확대탁송',  // 전차량 → 확대탁송으로 통일
  };

  // 결제방식 코드 → 이름 매핑
  const DIVI_MAP = {
    1: '정상납',
    2: '월납',
  };

  // 할인할증 요율 코드 → rate 값 매핑
  const RATE_MAP = {
    1: 1.000,
    2: 0.900,
    3: 0.925,
    4: 0.898,
    5: 0.889,
    6: 1.074,
    7: 1.085,
    8: 1.242,
    9: 1.253,
    10: 1.314,
    11: 1.428,
    12: 1.435,
    13: 1.447,
    14: 1.459,
  };

  // 할인할증 요율 코드 → 이름 매핑
  const RATE_NAME_MAP = {
    1: '기본',
    2: '할인',
    3: '3년간 사고건수 0건 1년간 사고건수 0건 무사고 1년 이상',
    4: '3년간 사고건수 0건 1년간 사고건수 0건 무사고 2년 이상',
    5: '3년간 사고건수 0건 1년간 사고건수 0건 무사고 3년 이상',
    6: '3년간 사고건수 1건 1년간 사고건수 0건',
    7: '3년간 사고건수 1건 1년간 사고건수 1',
    8: '3년간 사고건수 2건 1년간 사고건수 0',
    9: '3년간 사고건수 2건 1년간 사고건수 1',
    10: '3년간 사고건수 2건 1년간 사고건수 2',
    11: '3년간 사고건수 3건이상 1년간 사고건수 0',
    12: '3년간 사고건수 3건이상 1년간 사고건수 1',
    13: '3년간 사고건수 3건이상 1년간 사고건수 2',
    14: '3년간 사고건수 3건이상 1년간 사고건수 3건이상',
  };

  // ==================== 유틸리티 함수 ====================
  
  /**
   * 보험회사 코드로 이름 가져오기
   * @param {number|string} code - 보험회사 코드
   * @returns {string} 보험회사 이름
   */
  const getInsurerName = (code) => {
    return INSURER_MAP[Number(code)] || '=선택=';
  };

  /**
   * 증권성격 코드로 이름 가져오기
   * @param {number|string} code - 증권성격 코드
   * @returns {string} 증권성격 이름
   */
  const getGitaName = (code) => {
    return GITA_MAP[Number(code)] || '알 수 없음';
  };

  /**
   * 결제방식 코드로 이름 가져오기
   * @param {number|string} code - 결제방식 코드
   * @returns {string} 결제방식 이름
   */
  const getDiviName = (code) => {
    return DIVI_MAP[Number(code)] || '알 수 없음';
  };

  /**
   * 할인할증 요율 코드로 rate 값 가져오기
   * @param {number|string} code - 할인할증 요율 코드
   * @returns {number} 할인할증 rate 값
   */
  const getRateValue = (code) => {
    return RATE_MAP[Number(code)] || 1.000;
  };

  /**
   * 할인할증 요율 코드로 이름 가져오기
   * @param {number|string} code - 할인할증 요율 코드
   * @returns {string} 할인할증 요율 이름
   */
  const getRateName = (code) => {
    return RATE_NAME_MAP[Number(code)] || '기본';
  };

  /**
   * 보험회사 Select 옵션 HTML 생성
   * @param {number|string} selectedValue - 선택된 값
   * @param {number} defaultValue - 기본 선택값 (기본값: 0)
   * @returns {string} HTML 옵션 문자열
   */
  const generateInsurerOptions = (selectedValue = null, defaultValue = 0) => {
    const selected = selectedValue !== null ? Number(selectedValue) : defaultValue;
    return INSURER_OPTIONS.map(opt =>
      `<option value="${opt.value}" ${selected === opt.value ? 'selected' : ''}>${opt.label}</option>`
    ).join('');
  };

  /**
   * 증권성격 Select 옵션 HTML 생성
   * @param {number|string} selectedValue - 선택된 값
   * @param {number} defaultValue - 기본 선택값 (기본값: 1)
   * @returns {string} HTML 옵션 문자열
   */
  const generateGitaOptions = (selectedValue = null, defaultValue = 1) => {
    const selected = selectedValue !== null ? Number(selectedValue) : defaultValue;
    return GITA_OPTIONS.map(opt =>
      `<option value="${opt.value}" ${selected === opt.value ? 'selected' : ''}>${opt.label}</option>`
    ).join('');
  };

  /**
   * 결제방식 Select 옵션 HTML 생성
   * @param {number|string} selectedValue - 선택된 값
   * @param {number} defaultValue - 기본 선택값 (기본값: 1)
   * @returns {string} HTML 옵션 문자열
   */
  const generateDiviOptions = (selectedValue = null, defaultValue = 1) => {
    const selected = selectedValue !== null ? Number(selectedValue) : defaultValue;
    return DIVI_OPTIONS.map(opt =>
      `<option value="${opt.value}" ${selected === opt.value ? 'selected' : ''}>${opt.label}</option>`
    ).join('');
  };

  /**
   * 할인할증 요율 Select 옵션 HTML 생성
   * @param {number|string} selectedValue - 선택된 값
   * @param {string} defaultValue - 기본 선택값 (기본값: '-1')
   * @returns {string} HTML 옵션 문자열
   */
  const generateRateOptions = (selectedValue = null, defaultValue = '-1') => {
    const selected = selectedValue !== null ? String(selectedValue) : defaultValue;
    return RATE_OPTIONS.map(opt =>
      `<option value="${opt.value}" ${selected === opt.value ? 'selected' : ''}>${opt.label}</option>`
    ).join('');
  };

  // ==================== 전역 객체에 노출 ====================
  
  window.KJConstants = {
    // 상수 배열
    INSURER_OPTIONS,
    GITA_OPTIONS,
    DIVI_OPTIONS,
    RATE_OPTIONS,
    
    // 매핑 객체
    INSURER_MAP,
    GITA_MAP,
    DIVI_MAP,
    RATE_MAP,
    RATE_NAME_MAP,
    
    // 유틸리티 함수
    getInsurerName,
    getGitaName,
    getDiviName,
    getRateValue,
    getRateName,
    generateInsurerOptions,
    generateGitaOptions,
    generateDiviOptions,
    generateRateOptions,
  };

  // 콘솔 로그 (개발 환경에서만)
  if (typeof console !== 'undefined' && console.log) {
    console.log('KJConstants 모듈이 로드되었습니다.');
  }
})();


/**
 * 한국 주민등록번호 유효성 검사 유틸리티
 * 
 * 사용법:
 *   import { validateJumin } from './utils/jumin-validator.js';
 *   const result = validateJumin('660327-1069017');
 *   if (result.valid) { ... }
 * 
 * 또는:
 *   <script src="/js/utils/jumin-validator.js"></script>
 *   const result = validateJumin('660327-1069017');
 */

/**
 * 주민번호 유효성 검사 함수
 * 
 * @param {string} jumin - 주민번호 (하이픈 포함/미포함 모두 가능)
 * @returns {Object} { valid: boolean, message: string }
 * 
 * @example
 * validateJumin('660327-1069017') // { valid: true, message: '' }
 * validateJumin('660327-1069018') // { valid: false, message: '주민번호 체크섬이 올바르지 않습니다.' }
 */
function validateJumin(jumin) {
  // 숫자만 추출
  const digits = jumin.replace(/[^0-9]/g, '');
  
  // 13자리가 아니면 false
  if (digits.length !== 13) {
    return { valid: false, message: '주민번호는 13자리여야 합니다.' };
  }
  
  // 앞 6자리: 생년월일 검증
  const year = parseInt(digits.substring(0, 2));
  const month = parseInt(digits.substring(2, 4));
  const day = parseInt(digits.substring(4, 6));
  
  // 월 검증 (1-12)
  if (month < 1 || month > 12) {
    return { valid: false, message: '월이 올바르지 않습니다.' };
  }
  
  // 일 검증 (1-31, 간단한 검증)
  if (day < 1 || day > 31) {
    return { valid: false, message: '일이 올바르지 않습니다.' };
  }
  
  // 체크섬 검증 (한국 주민번호 표준 알고리즘)
  // 가중치: [2, 3, 4, 5, 6, 7, 8, 9, 2, 3, 4, 5]
  // 계산식: (11 - (합계 % 11)) % 10
  const checkDigit = parseInt(digits.charAt(12));
  const multipliers = [2, 3, 4, 5, 6, 7, 8, 9, 2, 3, 4, 5];
  let sum = 0;
  
  for (let i = 0; i < 12; i++) {
    sum += parseInt(digits.charAt(i)) * multipliers[i];
  }
  
  // 표준 알고리즘: (11 - (sum % 11)) % 10
  const calculatedCheckDigit = (11 - (sum % 11)) % 10;
  
  if (calculatedCheckDigit !== checkDigit) {
    return { valid: false, message: '주민번호 체크섬이 올바르지 않습니다.' };
  }
  
  return { valid: true, message: '' };
}

// ES6 모듈로 export (import 사용 시)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { validateJumin };
}

// 전역 함수로도 사용 가능 (script 태그로 로드 시)
if (typeof window !== 'undefined') {
  window.validateJumin = validateJumin;
}


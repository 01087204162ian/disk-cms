/**
 * Jest 테스트 설정 파일
 * 모든 테스트 전에 실행됨
 */

// 타임존 설정
process.env.TZ = 'Asia/Seoul';

// 전역 테스트 설정
beforeAll(() => {
  // 테스트 전 공통 설정
  console.log('테스트 환경 설정: KST (Asia/Seoul)');
});

afterAll(() => {
  // 테스트 후 정리
  console.log('테스트 완료');
});


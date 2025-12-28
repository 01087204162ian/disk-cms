/**
 * Jest 글로벌 설정
 * 타임존 설정
 */

module.exports = async () => {
  // 타임존 설정
  process.env.TZ = 'Asia/Seoul';
  console.log('글로벌 타임존 설정: Asia/Seoul');
};


const nodemailer = require('nodemailer');

// Gmail SMTP 설정 (임시)
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// 비밀번호 재설정 이메일 발송
async function sendPasswordResetEmail(toEmail, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password.html?token=${resetToken}`;
    
    const mailOptions = {
        from: `"보험 CMS (주)에스아이엠지" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: '[보험 CMS] 비밀번호 재설정 요청',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0;">보험 CMS</h1>
                    <p style="color: white; margin: 10px 0 0 0;">(주)에스아이엠지</p>
                </div>
                <div style="padding: 30px; background: #f8f9fa;">
                    <h2 style="color: #333;">비밀번호 재설정</h2>
                    <p style="color: #666; line-height: 1.6;">
                        안녕하세요,<br><br>
                        비밀번호 재설정을 요청하셨습니다.<br>
                        아래 버튼을 클릭하여 새로운 비밀번호를 설정해주세요.
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" 
                           style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                  color: white; 
                                  padding: 15px 40px; 
                                  text-decoration: none; 
                                  border-radius: 10px; 
                                  display: inline-block;
                                  font-weight: 600;">
                            비밀번호 재설정하기
                        </a>
                    </div>
                    <p style="color: #999; font-size: 14px;">
                        이 링크는 1시간 동안만 유효합니다.<br>
                        비밀번호 재설정을 요청하지 않으셨다면 이 이메일을 무시하세요.
                    </p>
                </div>
                <div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">
                    © 2024 (주)에스아이엠지. 모든 권리 보유.
                </div>
            </div>
        `
    };
    
    return await transporter.sendMail(mailOptions);
}

module.exports = { sendPasswordResetEmail };
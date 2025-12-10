// ==============================
// utils/helpers.js - 유틸리티 함수들
// ==============================
const crypto = require('crypto');

class Helpers {
    // 날짜 포맷팅
    static formatDate(date, format = 'YYYY-MM-DD') {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');

        switch (format) {
            case 'YYYY-MM-DD':
                return `${year}-${month}-${day}`;
            case 'YYYY-MM-DD HH:mm:ss':
                return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
            case 'HH:mm:ss':
                return `${hours}:${minutes}:${seconds}`;
            default:
                return d.toISOString();
        }
    }

    // 근무시간 계산
    static calculateWorkHours(checkIn, checkOut) {
        if (!checkIn || !checkOut) return 0;
        
        const checkInTime = new Date(checkIn);
        const checkOutTime = new Date(checkOut);
        const diffMs = checkOutTime - checkInTime;
        const diffHours = diffMs / (1000 * 60 * 60);
        
        return Math.max(0, Number(diffHours.toFixed(2)));
    }

    // 페이지네이션 계산
    static calculatePagination(page, limit, total) {
        const currentPage = Math.max(1, parseInt(page));
        const itemsPerPage = Math.max(1, parseInt(limit));
        const totalItems = parseInt(total);
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        const offset = (currentPage - 1) * itemsPerPage;

        return {
            currentPage,
            itemsPerPage,
            totalItems,
            totalPages,
            offset,
            hasNextPage: currentPage < totalPages,
            hasPrevPage: currentPage > 1
        };
    }

    // 랜덤 문자열 생성
    static generateRandomString(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }

    // 이메일 마스킹
    static maskEmail(email) {
        if (!email) return '';
        const [username, domain] = email.split('@');
        const maskedUsername = username.length > 2 
            ? username[0] + '*'.repeat(username.length - 2) + username[username.length - 1]
            : username[0] + '*';
        return `${maskedUsername}@${domain}`;
    }

    // 전화번호 마스킹
    static maskPhone(phone) {
        if (!phone) return '';
        return phone.replace(/(\d{3})-?(\d{4})-?(\d{4})/, '$1-****-$3');
    }

    // API 응답 표준화
    static successResponse(data = null, message = '성공') {
        return {
            success: true,
            message,
            data
        };
    }

    static errorResponse(message = '오류가 발생했습니다.', errors = null) {
        const response = {
            success: false,
            message
        };
        
        if (errors) {
            response.errors = errors;
        }
        
        return response;
    }

    // 파일 크기 포맷팅
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // 한국어 날짜 포맷
    static formatKoreanDate(date) {
        const d = new Date(date);
        const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
        const year = d.getFullYear();
        const month = d.getMonth() + 1;
        const day = d.getDate();
        const weekday = weekdays[d.getDay()];
        
        return `${year}년 ${month}월 ${day}일 (${weekday})`;
    }
}

module.exports = Helpers;
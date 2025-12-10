// ==============================
// services/dashboardService.js - 대시보드 서비스
// ==============================
const { pool } = require('../config/database');

class DashboardService {
    // 메인 대시보드 데이터 조회
    static async getDashboardData(userId, userRole, userInfo) {
        try {
            const dashboardData = {
                user: userInfo,
                currentDate: new Date().toISOString().split('T')[0]
            };

            // 개인 통계 조회
            dashboardData.personalStats = await this.getPersonalStats(userId);
            
            // 오늘 출퇴근 정보 조회
            dashboardData.todayAttendance = await this.getTodayAttendance(userId);
            
            // 최근 활동 조회
            dashboardData.recentActivities = await this.getRecentActivities(userId);
            
            // 공지사항 조회 (간단한 더미 데이터로 일단 처리)
            dashboardData.announcements = await this.getAnnouncements();

            // 관리자 권한 확인 후 관리자 통계 추가
            if (['SUPER_ADMIN', 'SYSTEM_ADMIN', 'DEPT_MANAGER'].includes(userRole)) {
                dashboardData.adminStats = await this.getAdminStats(userRole, userInfo.department_id);
            }

            return dashboardData;

        } catch (error) {
            console.error('getDashboardData 오류:', error);
            throw error;
        }
    }

    // 개인 통계 조회
    static async getPersonalStats(userId) {
        try {
            // 이번 달 처리 건수
            const [monthlyStatsResult] = await pool.execute(`
                SELECT COUNT(*) as count
                FROM kpi_records 
                WHERE user_id = ? 
                AND MONTH(work_date) = MONTH(CURRENT_DATE())
                AND YEAR(work_date) = YEAR(CURRENT_DATE())
            `, [userId]);

            // 평균 처리시간 (분)
            const [avgTimeResult] = await pool.execute(`
                SELECT AVG(processing_time) as avg_time
                FROM kpi_records 
                WHERE user_id = ? 
                AND processing_time IS NOT NULL
                AND MONTH(work_date) = MONTH(CURRENT_DATE())
                AND YEAR(work_date) = YEAR(CURRENT_DATE())
            `, [userId]);

            // 이번 주 근무시간
            const [weeklyHoursResult] = await pool.execute(`
                SELECT SUM(work_hours) as total_hours
                FROM attendance 
                WHERE user_id = ? 
                AND YEARWEEK(work_date, 1) = YEARWEEK(CURRENT_DATE(), 1)
                AND work_hours IS NOT NULL
            `, [userId]);

            const result = {
                monthlyStats: monthlyStatsResult[0]?.count || 0,
                avgProcessingTime: Math.round(avgTimeResult[0]?.avg_time || 0),
                weeklyHours: parseFloat(weeklyHoursResult[0]?.total_hours || 0),
                achievementRate: 0 // 나중에 구현
            };
            
            return result;

        } catch (error) {
            console.error('getPersonalStats 오류:', error);
            throw error;
        }
    }

    // 오늘 출퇴근 기록 조회
    static async getTodayAttendance(userId) {
        try {
            const [result] = await pool.execute(`
                SELECT 
                    check_in_time,
                    check_out_time,
                    work_hours,
                    DATE_FORMAT(check_in_time, '%H:%i') as formatted_check_in,
                    DATE_FORMAT(check_out_time, '%H:%i') as formatted_check_out
                FROM attendance 
                WHERE user_id = ? AND work_date = CURRENT_DATE()
            `, [userId]);

            return result[0] || null;

        } catch (error) {
            console.error('getTodayAttendance 오류:', error);
            throw error;
        }
    }

    // 최근 활동 조회
    static async getRecentActivities(userId, limit = 5) {
        try {
            // limit을 정수로 변환하고 안전성 체크
            const limitNum = Math.max(1, Math.min(parseInt(limit, 10) || 5, 50)); // 1~50 사이로 제한

            // LIMIT 값을 직접 쿼리에 삽입 (MySQL 8.0 호환성)
            const [result] = await pool.execute(`
                SELECT 
                    kr.task_type,
                    kr.processed_count,
                    kr.processing_time,
                    kr.work_date,
                    kr.quality_grade,
                    p.name as product_name,
                    p.category as product_category
                FROM kpi_records kr
                LEFT JOIN products p ON kr.product_id = p.id
                WHERE kr.user_id = ?
                ORDER BY kr.work_date DESC, kr.created_at DESC
                LIMIT ${limitNum}
            `, [userId]);

            if (result.length === 0) {
                return [];
            }

            return result.map(activity => ({
                title: this.getTaskTypeTitle(activity.task_type),
                description: `${activity.product_name || '일반업무'} - ${activity.processed_count}건 처리`,
                type: activity.task_type.toLowerCase(),
                status: activity.quality_grade ? this.mapQualityToStatus(activity.quality_grade) : 'COMPLETED',
                date: activity.work_date,
                processing_time: activity.processing_time
            }));

        } catch (error) {
            console.error('getRecentActivities 오류:', error);
            return [];
        }
    }

    // 공지사항 조회 (일단 더미 데이터)
    static async getAnnouncements(limit = 3) {
        try {
            // 나중에 announcements 테이블을 만들 때까지 더미 데이터
            return [
                {
                    title: '새로운 상품 출시',
                    content: '홀인원보험 신상품이 출시되었습니다.',
                    type: 'product',
                    priority: 'NORMAL',
                    date_label: '오늘',
                    time_ago: '2시간 전'
                },
                {
                    title: '시스템 업데이트',
                    content: 'CMS 시스템이 업데이트되었습니다.',
                    type: 'system',
                    priority: 'NORMAL',
                    date_label: '오늘',
                    time_ago: '5시간 전'
                }
            ];

        } catch (error) {
            console.error('getAnnouncements 오류:', error);
            return [];
        }
    }

    // 관리자 통계 조회
    static async getAdminStats(userRole, departmentId) {
        try {
            let whereClause = 'WHERE u.is_active = 1';
            let params = [];

            // 부서 관리자는 자신의 부서만
            if (userRole === 'DEPT_MANAGER' && departmentId) {
                whereClause = 'WHERE u.department_id = ? AND u.is_active = 1';
                params = [departmentId];
            }

            // 전체 직원 수
            const [totalEmployeesResult] = await pool.execute(`
                SELECT COUNT(*) as count 
                FROM users u 
                ${whereClause}
            `, params);

            // 오늘 출근자 수
            let attendanceQuery = `
                SELECT COUNT(DISTINCT a.user_id) as count 
                FROM attendance a 
                JOIN users u ON a.user_id = u.email 
                WHERE a.work_date = CURRENT_DATE() 
                AND a.check_in_time IS NOT NULL 
                AND u.is_active = 1
            `;
            
            let attendanceParams = [];
            if (userRole === 'DEPT_MANAGER' && departmentId) {
                attendanceQuery += ' AND u.department_id = ?';
                attendanceParams = [departmentId];
            }
            
            const [todayAttendanceResult] = await pool.execute(attendanceQuery, attendanceParams);

            // 승인 대기 건수 (휴가 신청)
            let pendingQuery = `
                SELECT COUNT(*) as count 
                FROM leaves l
                JOIN users u ON l.user_id = u.email
                WHERE l.status = 'PENDING' AND u.is_active = 1
            `;
            
            let pendingParams = [];
            if (userRole === 'DEPT_MANAGER' && departmentId) {
                pendingQuery += ' AND u.department_id = ?';
                pendingParams = [departmentId];
            }
            
            const [pendingResult] = await pool.execute(pendingQuery, pendingParams);

            return {
                totalEmployees: totalEmployeesResult[0]?.count || 0,
                todayAttendance: todayAttendanceResult[0]?.count || 0,
                pendingApprovals: pendingResult[0]?.count || 0
            };

        } catch (error) {
            console.error('getAdminStats 오류:', error);
            throw error;
        }
    }

    // 알림 개수 조회
    static async getNotificationCount(userId) {
        try {
            // 알림 테이블이 없으므로 일단 승인 대기 건수로 대체
            const [result] = await pool.execute(`
                SELECT COUNT(*) as count 
                FROM leaves 
                WHERE user_id = ? AND status = 'PENDING'
            `, [userId]);

            return result[0]?.count || 0;

        } catch (error) {
            console.error('getNotificationCount 오류:', error);
            return 0;
        }
    }

    // 최근 알림 목록 조회
    static async getRecentNotifications(userId, limit = 5) {
        try {
            // 알림 테이블이 없으므로 일단 더미 데이터
            return [
                {
                    message: '휴가 신청이 승인되었습니다.',
                    type: 'approval',
                    time_ago: '30분 전'
                }
            ];

        } catch (error) {
            console.error('getRecentNotifications 오류:', error);
            return [];
        }
    }

    // 헬퍼 메서드들
    static getTaskTypeTitle(taskType) {
        const titles = {
            'ENDORSEMENT': '배서 처리',
            'NEW_CONTRACT': '신규 계약',
            'CLAIM': '클레임 처리',
            'CONSULTATION': '상담'
        };
        return titles[taskType] || taskType;
    }

    static mapQualityToStatus(qualityGrade) {
        const statusMap = {
            'EXCELLENT': 'COMPLETED',
            'GOOD': 'COMPLETED',
            'AVERAGE': 'COMPLETED',
            'POOR': 'PENDING'
        };
        return statusMap[qualityGrade] || 'COMPLETED';
    }
}

module.exports = DashboardService;
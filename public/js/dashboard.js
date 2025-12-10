/*dashboard.js - 템플릿 시스템 적용 버전*/

class Dashboard {
  constructor() {
    this.attendanceData = null;
    // user 정보는 templateLoader에서 관리하므로 제거
  }

  // 🎯 템플릿 로더와 분리된 대시보드 특화 기능만 초기화
  async initializeDashboardFeatures() {
    console.log('📊 대시보드 특화 기능 초기화 중...');
    
    try {
      // 대시보드 데이터 로드
      await this.loadDashboardData();
      
      // 알림 로드
      await this.loadNotifications();
      
      console.log('✅ 대시보드 기능 초기화 완료!');
      
    } catch (error) {
      console.error('❌ 대시보드 기능 초기화 실패:', error);
      this.setLoadingError();
    }
  }

  // templateLoader에서 처리하므로 제거된 메서드들:
  // - checkAuth() ❌
  // - updateUserInfo() ❌ 
  // - updateCurrentTime() ❌

  async loadDashboardData() {
    try {
      const response = await fetch('/api/dashboard', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`API 요청 실패: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        this.updateAttendanceStatus(result.data.todayAttendance);
        this.updatePersonalStats(result.data.personalStats);
        
        // 🎯 templateLoader의 isAdmin() 사용
        if (result.data.adminStats && window.templateLoader.isAdmin()) {
          this.updateAdminStats(result.data.adminStats);
        }
        
        this.updateRecentActivities(result.data.recentActivities);
        this.updateAnnouncements(result.data.announcements);
      } else {
        // 🎯 templateLoader의 showToast 사용
        window.templateLoader.showToast(result.message || '대시보드 데이터를 불러오는데 실패했습니다.', 'error');
        this.setLoadingError();
      }

    } catch (error) {
      console.error('대시보드 데이터 로드 오류:', error);
      window.templateLoader.showToast('대시보드 데이터를 불러오는 중 오류가 발생했습니다.', 'error');
      this.setLoadingError();
    }
  }

  async loadNotifications() {
    try {
      const response = await fetch('/api/dashboard/notifications/count', {
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          $('#notificationCount').text(result.data.count || 0);
          
          // 알림 목록도 함께 로드
          await this.loadNotificationList();
        }
      }

    } catch (error) {
      console.error('알림 개수 로드 오류:', error);
      $('#notificationCount').text('0');
    }
  }

  async loadNotificationList() {
    try {
      const response = await fetch('/api/dashboard/notifications/recent', {
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data.length > 0) {
          this.updateNotificationList(result.data);
        } else {
          $('#notificationList').html(`
            <div class="dropdown-item text-center text-muted">
              새로운 알림이 없습니다.
            </div>
          `);
        }
      }

    } catch (error) {
      console.error('알림 목록 로드 오류:', error);
      $('#notificationList').html(`
        <div class="dropdown-item text-center text-muted">
          알림을 불러오는데 실패했습니다.
        </div>
      `);
    }
  }

  updateNotificationList(notifications) {
    const notificationHtml = notifications.map(notification => `
      <a href="#" class="dropdown-item">
        <i class="fas fa-${this.getNotificationIcon(notification.type)} mr-2"></i>
        ${notification.message}
        <span class="float-right text-muted text-sm">${notification.time_ago}</span>
      </a>
      <div class="dropdown-divider"></div>
    `).join('');

    $('#notificationList').html(notificationHtml);
  }

  getNotificationIcon(type) {
    const icons = {
      'approval': 'user-plus',
      'task': 'tasks',
      'system': 'cog',
      'announcement': 'bullhorn'
    };
    return icons[type] || 'bell';
  }

  updateAttendanceStatus(attendance) {
    this.attendanceData = attendance;

    const checkinBtn = $('#checkinBtn');
    const checkoutBtn = $('#checkoutBtn');
    const checkinTime = $('#checkinTime');
    const checkoutTime = $('#checkoutTime');
    const workHours = $('#workHours');

    if (attendance) {
      if (attendance.formatted_check_in) {
        checkinTime.text(attendance.formatted_check_in);
        checkinBtn.prop('disabled', true).html('<i class="fas fa-check mr-2"></i>출근완료');
        checkoutBtn.prop('disabled', false);
      }

      if (attendance.formatted_check_out) {
        checkoutTime.text(attendance.formatted_check_out);
        checkoutBtn.prop('disabled', true).html('<i class="fas fa-check mr-2"></i>퇴근완료');
      }

      if (attendance.work_hours) {
        workHours.text(attendance.work_hours + 'h');
      }
    } else {
      // 오늘 출근 기록이 없는 경우
      checkinBtn.prop('disabled', false);
      checkoutBtn.prop('disabled', true);
      checkinTime.text('--:--');
      checkoutTime.text('--:--');
      workHours.text('0.0h');
    }
  }

  updatePersonalStats(stats) {
    $('#monthlyStats').text(stats.monthlyStats || '0');
    $('#avgProcessingTime').text(stats.avgProcessingTime || '0');
    $('#weeklyHours').text(stats.weeklyHours || '0');
    $('#achievementRate').text(stats.achievementRate || '0');
  }

  updateAdminStats(stats) {
    $('#totalEmployees').text(stats.totalEmployees || '0');
    $('#todayAttendance').text(stats.todayAttendance || '0');
    $('#pendingApprovals').text(stats.pendingApprovals || '0');
  }

  updateRecentActivities(activities) {
    if (!activities || activities.length === 0) {
      $('#recentActivities').html(`
        <li class="item text-center p-3 text-muted">
          최근 업무 활동이 없습니다.
        </li>
      `);
      return;
    }

    const activitiesHtml = activities.map(activity => `
      <li class="item">
        <div class="product-img">
          <i class="fas fa-${this.getActivityIcon(activity.type)} bg-${this.getActivityColor(activity.status)}"></i>
        </div>
        <div class="product-info">
          <a href="#" class="product-title">
            ${activity.title}
            <span class="badge badge-${this.getStatusBadgeColor(activity.status)} float-right">
              ${this.getStatusText(activity.status)}
            </span>
          </a>
          <span class="product-description">
            ${activity.description}
          </span>
        </div>
      </li>
    `).join('');

    $('#recentActivities').html(activitiesHtml);
  }

  updateAnnouncements(announcements) {
    if (!announcements || announcements.length === 0) {
      $('#announcements').html(`
        <div class="text-center p-3 text-muted">
          새로운 공지사항이 없습니다.
        </div>
      `);
      return;
    }

    const announcementsHtml = announcements.map(announcement => `
      <div class="time-label">
        <span class="bg-${announcement.priority === 'HIGH' ? 'danger' : 'primary'}">
          ${announcement.date_label}
        </span>
      </div>
      <div>
        <i class="fas fa-${this.getAnnouncementIcon(announcement.type)} bg-${announcement.priority === 'HIGH' ? 'danger' : 'primary'}"></i>
        <div class="timeline-item">
          <span class="time">
            <i class="far fa-clock"></i> ${announcement.time_ago}
          </span>
          <h3 class="timeline-header">${announcement.title}</h3>
          <div class="timeline-body">
            ${announcement.content}
          </div>
        </div>
      </div>
    `).join('');

    $('#announcements').html(announcementsHtml + '<div><i class="fas fa-clock bg-gray"></i></div>');
  }

  // 유틸리티 메서드들 (변경 없음)
  getActivityIcon(type) {
    const icons = {
      'endorsement': 'file-alt',
      'new_policy': 'plus',
      'claim': 'exclamation-triangle',
      'renewal': 'redo'
    };
    return icons[type] || 'tasks';
  }

  getActivityColor(status) {
    const colors = {
      'COMPLETED': 'success',
      'IN_PROGRESS': 'info',
      'PENDING': 'warning',
      'CANCELLED': 'danger'
    };
    return colors[status] || 'secondary';
  }

  getStatusBadgeColor(status) {
    const colors = {
      'COMPLETED': 'success',
      'IN_PROGRESS': 'info',
      'PENDING': 'warning',
      'CANCELLED': 'danger'
    };
    return colors[status] || 'secondary';
  }

  getStatusText(status) {
    const texts = {
      'COMPLETED': '완료',
      'IN_PROGRESS': '진행중',
      'PENDING': '대기',
      'CANCELLED': '취소'
    };
    return texts[status] || status;
  }

  getAnnouncementIcon(type) {
    const icons = {
      'product': 'bullhorn',
      'system': 'cog',
      'policy': 'file-contract',
      'general': 'info'
    };
    return icons[type] || 'bullhorn';
  }

  setLoadingError() {
    // 개인 통계 카드 오류 표시
    $('#monthlyStats').html('<span class="text-danger">!</span>');
    $('#avgProcessingTime').html('<span class="text-danger">!</span>');
    $('#weeklyHours').html('<span class="text-danger">!</span>');
    $('#achievementRate').html('<span class="text-danger">!</span>');

    // 관리자 통계 오류 표시
    if (window.templateLoader.isAdmin()) {
      $('#totalEmployees').html('<span class="text-danger">!</span>');
      $('#todayAttendance').html('<span class="text-danger">!</span>');
      $('#pendingApprovals').html('<span class="text-danger">!</span>');
    }

    // 최근 활동 오류 표시
    $('#recentActivities').html(`
      <li class="item text-center p-3 text-danger">
        <i class="fas fa-exclamation-triangle mr-2"></i>
        데이터를 불러오는데 실패했습니다.
      </li>
    `);

    // 공지사항 오류 표시
    $('#announcements').html(`
      <div class="text-center p-3 text-danger">
        <i class="fas fa-exclamation-triangle mr-2"></i>
        공지사항을 불러오는데 실패했습니다.
      </div>
    `);
  }
}

// 🎯 전역 함수들 (출퇴근 기능)
async function checkIn() {
  const btn = $('#checkinBtn');
  const originalHtml = btn.html();
  
  btn.html('<span class="spinner-border spinner-border-sm mr-2" role="status"></span>처리중...').prop('disabled', true);

  try {
    const response = await fetch('/api/attendance/checkin', {
      method: 'POST',
      credentials: 'include'
    });

    const result = await response.json();

    if (result.success) {
      window.templateLoader.showToast(result.message, 'success');
      
      // UI 업데이트
      $('#checkinTime').text(result.data.checkInTime);
      btn.html('<i class="fas fa-check mr-2"></i>출근완료');
      $('#checkoutBtn').prop('disabled', false);
    } else {
      window.templateLoader.showToast(result.message, 'error');
      btn.html(originalHtml).prop('disabled', false);
    }

  } catch (error) {
    console.error('출근 처리 오류:', error);
    window.templateLoader.showToast('출근 처리 중 오류가 발생했습니다.', 'error');
    btn.html(originalHtml).prop('disabled', false);
  }
}

async function checkOut() {
  const btn = $('#checkoutBtn');
  const originalHtml = btn.html();
  
  btn.html('<span class="spinner-border spinner-border-sm mr-2" role="status"></span>처리중...').prop('disabled', true);

  try {
    const response = await fetch('/api/attendance/checkout', {
      method: 'POST',
      credentials: 'include'
    });

    const result = await response.json();

    if (result.success) {
      window.templateLoader.showToast(result.message, 'success');
      
      // UI 업데이트
      $('#checkoutTime').text(result.data.checkOutTime);
      $('#workHours').text(result.data.workHours + 'h');
      btn.html('<i class="fas fa-check mr-2"></i>퇴근완료');
    } else {
      window.templateLoader.showToast(result.message, 'error');
      btn.html(originalHtml).prop('disabled', false);
    }

  } catch (error) {
    console.error('퇴근 처리 오류:', error);
    window.templateLoader.showToast('퇴근 처리 중 오류가 발생했습니다.', 'error');
    btn.html(originalHtml).prop('disabled', false);
  }
}

// 대시보드 인스턴스 생성
window.dashboard = new Dashboard();
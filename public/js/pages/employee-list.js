/*
 * employee-list.js - 직원 목록 관리 페이지
 * 템플릿 시스템과 연동된 직원 관리 기능
 */

class EmployeeList {
  constructor() {
    this.dataTable = null;
    this.departments = [];
    this.currentEmployeeData = null;
    this.filters = {
      department: '',
      role: '',
      workType: '',
      status: ''
    };
  }

  // 🚀 페이지 초기화
  async initialize() {
    console.log('👥 직원 목록 페이지 초기화 중...');
    
    try {
      // 권한 확인
      if (!window.templateLoader.isAdmin()) {
        window.templateLoader.showToast('직원 목록에 접근할 권한이 없습니다.', 'error');
        window.location.href = '/dashboard.html';
        return;
      }

      // 데이터 로드
      await this.loadInitialData();
      
      // UI 초기화
      this.initializeDataTable();
      this.setupEventListeners();
      
      console.log('✅ 직원 목록 페이지 초기화 완료!');
      
    } catch (error) {
      console.error('❌ 직원 목록 페이지 초기화 실패:', error);
      this.showErrorState();
    }
  }

  // 📊 초기 데이터 로드
  async loadInitialData() {
    try {
      // 병렬로 데이터 로드
      const [statsResponse, departmentsResponse] = await Promise.all([
        fetch('/api/dashboard/admin-stats', { credentials: 'include' }),
        fetch('/api/departments', { credentials: 'include' })
      ]);

      // 통계 데이터 업데이트
      if (statsResponse.ok) {
        const statsResult = await statsResponse.json();
        if (statsResult.success) {
          this.updateStatsCards(statsResult.data);
        }
      }

      // 부서 목록 업데이트
      if (departmentsResponse.ok) {
        const deptResult = await departmentsResponse.json();
        if (deptResult.success) {
          this.departments = deptResult.data;
          this.populateDepartmentFilter();
        }
      }

    } catch (error) {
      console.error('초기 데이터 로드 오류:', error);
      // 통계 카드에 오류 표시
      $('#totalEmployeesCount, #activeEmployeesCount, #pendingEmployeesCount, #departmentsCount')
        .html('<span class="text-danger">!</span>');
    }
  }

  // 📈 통계 카드 업데이트
  updateStatsCards(stats) {
    $('#totalEmployeesCount').text(stats.totalEmployees || '0');
    $('#activeEmployeesCount').text(stats.activeEmployees || '0');
    $('#pendingEmployeesCount').text(stats.pendingEmployees || '0');
    $('#departmentsCount').text(stats.departmentsCount || '0');
  }

  // 🏢 부서 필터 옵션 생성
  populateDepartmentFilter() {
    const departmentSelect = $('#departmentFilter');
    departmentSelect.find('option:not(:first)').remove();
    
    this.departments.forEach(dept => {
      departmentSelect.append(`
        <option value="${dept.id}">${dept.name}</option>
      `);
    });
  }

  // 📋 DataTable 초기화
  initializeDataTable() {
    this.dataTable = $('#employeesTable').DataTable({
      processing: true,
      serverSide: true,
      ajax: {
        url: '/api/users',
        type: 'GET',
        data: (d) => {
          // 필터 파라미터 추가
          d.department = this.filters.department;
          d.role = this.filters.role;
          d.workType = this.filters.workType;
          d.status = this.filters.status;
        },
        dataSrc: (json) => {
          if (!json.success) {
            window.templateLoader.showToast(json.message || '데이터 로드 실패', 'error');
            return [];
          }
          return json.data.employees || [];
        },
        error: (xhr, error, code) => {
          console.error('DataTable 로드 오류:', error);
          window.templateLoader.showToast('직원 목록을 불러오는데 실패했습니다.', 'error');
        }
      },
      columns: [
        { 
          data: 'employee_id',
          title: '사번',
          width: '100px'
        },
        { 
          data: 'name',
          title: '이름',
          render: (data, type, row) => {
            return `<strong>${data}</strong>`;
          }
        },
        { 
          data: 'email',
          title: '이메일',
          render: (data, type, row) => {
            return `<a href="mailto:${data}">${data}</a>`;
          }
        },
        { 
          data: 'department_name',
          title: '부서',
          defaultContent: '미지정'
        },
        { 
          data: 'role',
          title: '역할',
          render: (data, type, row) => {
            return this.getRoleBadge(data);
          }
        },
        { 
          data: 'work_type',
          title: '근무형태',
          render: (data, type, row) => {
            return this.getWorkTypeBadge(data);
          }
        },
        { 
          data: 'work_schedule',
          title: '근무스케줄',
          render: (data, type, row) => {
            return this.getWorkScheduleBadge(data);
          }
        },
        { 
          data: 'status',
          title: '상태',
          render: (data, type, row) => {
            return this.getStatusBadge(data);
          }
        },
        { 
          data: 'created_at',
          title: '가입일',
          render: (data, type, row) => {
            return new Date(data).toLocaleDateString('ko-KR');
          }
        },
        {
          data: null,
          title: '작업',
          orderable: false,
          width: '120px',
          render: (data, type, row) => {
            return `
              <div class="btn-group" role="group">
                <button class="btn btn-sm btn-info" onclick="employeeList.viewEmployee('${row.email}')" title="상세보기">
                  <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-warning" onclick="employeeList.editEmployee('${row.email}')" title="수정">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="employeeList.deleteEmployee('${row.email}')" title="삭제">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            `;
          }
        }
      ],
      order: [[8, 'desc']], // 가입일 기준 내림차순
      pageLength: 25,
      lengthMenu: [[10, 25, 50, 100], [10, 25, 50, 100]],
      language: {
        processing: "처리 중...",
        search: "검색:",
        lengthMenu: "_MENU_ 개씩 보기",
        info: "_START_에서 _END_까지 / 전체 _TOTAL_개",
        infoEmpty: "0개",
        infoFiltered: "(전체 _MAX_개에서 필터링)",
        loadingRecords: "로딩 중...",
        zeroRecords: "일치하는 데이터가 없습니다.",
        paginate: {
          first: "처음",
          last: "마지막",
          next: "다음",
          previous: "이전"
        }
      },
      responsive: true,
      dom: '<"row"<"col-sm-6"l><"col-sm-6"f>>rtip'
    });
  }

  // 🎭 뱃지 렌더링 함수들
  getRoleBadge(role) {
    const badges = {
      'SUPER_ADMIN': '<span class="badge badge-danger">최고관리자</span>',
      'SYSTEM_ADMIN': '<span class="badge badge-warning">시스템관리자</span>',
      'DEPARTMENT_MANAGER': '<span class="badge badge-info">부서관리자</span>',
      'EMPLOYEE': '<span class="badge badge-success">일반직원</span>'
    };
    return badges[role] || `<span class="badge badge-secondary">${role}</span>`;
  }

  getWorkTypeBadge(workType) {
    const badges = {
      'FULL_TIME': '<span class="badge badge-primary">정규직</span>',
      'PART_TIME': '<span class="badge badge-warning">파트타임</span>',
      'CONTRACT': '<span class="badge badge-info">계약직</span>'
    };
    return badges[workType] || `<span class="badge badge-secondary">${workType}</span>`;
  }

  getWorkScheduleBadge(schedule) {
    const badges = {
      '4_DAY': '<span class="badge badge-success">4일 근무</span>',
      'FLEXIBLE': '<span class="badge badge-info">유연근무</span>',
      'STANDARD': '<span class="badge badge-primary">표준근무</span>'
    };
    return badges[schedule] || `<span class="badge badge-secondary">${schedule}</span>`;
  }

  getStatusBadge(status) {
    const badges = {
      'ACTIVE': '<span class="badge badge-success">활성</span>',
      'PENDING': '<span class="badge badge-warning">승인대기</span>',
      'INACTIVE': '<span class="badge badge-secondary">비활성</span>'
    };
    return badges[status] || `<span class="badge badge-secondary">${status}</span>`;
  }

  // 🎛️ 이벤트 리스너 설정
  setupEventListeners() {
    // 필터 적용 버튼
    $('#applyFiltersBtn').on('click', () => {
      this.applyFilters();
    });

    // 필터 초기화 버튼
    $('#resetFiltersBtn').on('click', () => {
      this.resetFilters();
    });

    // Excel 내보내기
    $('#exportExcelBtn').on('click', () => {
      this.exportToExcel();
    });

    // 직원 추가 버튼
    $('#addEmployeeBtn').on('click', () => {
      window.location.href = '/register.html';
    });

    // 모달 내 버튼들
    $('#editEmployeeBtn').on('click', () => {
      if (this.currentEmployeeData) {
        this.editEmployee(this.currentEmployeeData.email);
      }
    });

    $('#deleteEmployeeBtn').on('click', () => {
      if (this.currentEmployeeData) {
        this.confirmDeleteEmployee(this.currentEmployeeData.email);
      }
    });

    // Enter 키로 필터 적용
    $('.form-control').on('keypress', (e) => {
      if (e.which === 13) {
        this.applyFilters();
      }
    });
  }

  // 🔍 필터 적용
  applyFilters() {
    this.filters = {
      department: $('#departmentFilter').val(),
      role: $('#roleFilter').val(),
      workType: $('#workTypeFilter').val(),
      status: $('#statusFilter').val()
    };

    // DataTable 새로고침
    this.dataTable.ajax.reload();
    
    window.templateLoader.showToast('필터가 적용되었습니다.', 'success');
  }

  // 🔄 필터 초기화
  resetFilters() {
    $('#departmentFilter, #roleFilter, #workTypeFilter, #statusFilter').val('');
    this.filters = {
      department: '',
      role: '',
      workType: '',
      status: ''
    };

    // DataTable 새로고침
    this.dataTable.ajax.reload();
    
    window.templateLoader.showToast('필터가 초기화되었습니다.', 'info');
  }

  // 👁️ 직원 상세보기
  async viewEmployee(email) {
    try {
      const response = await fetch(`/api/users/${email}`, {
        credentials: 'include'
      });

      const result = await response.json();

      if (result.success) {
        this.currentEmployeeData = result.data;
        this.populateEmployeeModal(result.data);
        $('#employeeDetailModal').modal('show');
      } else {
        window.templateLoader.showToast(result.message || '직원 정보를 불러올 수 없습니다.', 'error');
      }

    } catch (error) {
      console.error('직원 상세 조회 오류:', error);
      window.templateLoader.showToast('직원 정보를 불러오는 중 오류가 발생했습니다.', 'error');
    }
  }

  // 📝 모달 데이터 채우기
  populateEmployeeModal(employee) {
    $('#modal-employee-id').text(employee.employee_id || '미설정');
    $('#modal-name').text(employee.name);
    $('#modal-email').text(employee.email);
    $('#modal-department').text(employee.department_name || '미지정');
    
    // 역할을 한국어로 변환
    const roleNames = {
      'SUPER_ADMIN': '최고관리자',
      'SYSTEM_ADMIN': '시스템관리자',
      'DEPARTMENT_MANAGER': '부서관리자',
      'EMPLOYEE': '일반직원'
    };
    $('#modal-role').text(roleNames[employee.role] || employee.role);

    // 근무형태를 한국어로 변환
    const workTypeNames = {
      'FULL_TIME': '정규직',
      'PART_TIME': '파트타임',
      'CONTRACT': '계약직'
    };
    $('#modal-work-type').text(workTypeNames[employee.work_type] || employee.work_type);

    // 근무스케줄을 한국어로 변환
    const scheduleNames = {
      '4_DAY': '4일 근무',
      'FLEXIBLE': '유연근무',
      'STANDARD': '표준근무'
    };
    $('#modal-work-schedule').text(scheduleNames[employee.work_schedule] || employee.work_schedule);

    // 상태를 한국어로 변환
    const statusNames = {
      'ACTIVE': '활성',
      'PENDING': '승인대기',
      'INACTIVE': '비활성'
    };
    $('#modal-status').text(statusNames[employee.status] || employee.status);

    $('#modal-created-at').text(new Date(employee.created_at).toLocaleDateString('ko-KR'));
    $('#modal-last-login').text(
      employee.last_login 
        ? new Date(employee.last_login).toLocaleDateString('ko-KR')
        : '로그인 기록 없음'
    );
  }

  // ✏️ 직원 수정
  editEmployee(email) {
    // 수정 페이지로 이동 (추후 구현)
    window.templateLoader.showToast('직원 수정 기능은 준비 중입니다.', 'info');
    // window.location.href = `/edit-employee.html?email=${email}`;
  }

  // 🗑️ 직원 삭제 확인
  confirmDeleteEmployee(email) {
    if (confirm(`정말로 이 직원(${email})을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) {
      this.deleteEmployee(email);
    }
  }

  // 🗑️ 직원 삭제 실행
  async deleteEmployee(email) {
    try {
      const response = await fetch(`/api/users/${email}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const result = await response.json();

      if (result.success) {
        window.templateLoader.showToast('직원이 삭제되었습니다.', 'success');
        $('#employeeDetailModal').modal('hide');
        this.dataTable.ajax.reload();
        
        // 통계 업데이트
        this.loadInitialData();
      } else {
        window.templateLoader.showToast(result.message || '직원 삭제에 실패했습니다.', 'error');
      }

    } catch (error) {
      console.error('직원 삭제 오류:', error);
      window.templateLoader.showToast('직원 삭제 중 오류가 발생했습니다.', 'error');
    }
  }

  // 📊 Excel 내보내기
  async exportToExcel() {
    try {
      window.templateLoader.showToast('Excel 파일을 생성하고 있습니다...', 'info');

      const params = new URLSearchParams({
        export: 'excel',
        department: this.filters.department,
        role: this.filters.role,
        workType: this.filters.workType,
        status: this.filters.status
      });

      const response = await fetch(`/api/users/export?${params}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `직원목록_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        window.templateLoader.showToast('Excel 파일이 다운로드되었습니다.', 'success');
      } else {
        const result = await response.json();
        window.templateLoader.showToast(result.message || 'Excel 내보내기에 실패했습니다.', 'error');
      }

    } catch (error) {
      console.error('Excel 내보내기 오류:', error);
      window.templateLoader.showToast('Excel 내보내기 중 오류가 발생했습니다.', 'error');
    }
  }

  // ❌ 오류 상태 표시
  showErrorState() {
    // 통계 카드에 오류 표시
    $('#totalEmployeesCount, #activeEmployeesCount, #pendingEmployeesCount, #departmentsCount')
      .html('<span class="text-danger"><i class="fas fa-exclamation-triangle"></i></span>');

    // DataTable 영역에 오류 메시지
    $('#employeesTable tbody').html(`
      <tr>
        <td colspan="10" class="text-center text-danger">
          <i class="fas fa-exclamation-triangle mr-2"></i>
          데이터를 불러오는데 실패했습니다.
          <br>
          <button class="btn btn-sm btn-primary mt-2" onclick="location.reload()">
            <i class="fas fa-redo mr-1"></i>새로고침
          </button>
        </td>
      </tr>
    `);
  }

  // 🔄 페이지 새로고침
  refresh() {
    this.dataTable?.ajax.reload();
    this.loadInitialData();
  }
}

// 전역 인스턴스 생성
window.employeeList = new EmployeeList();
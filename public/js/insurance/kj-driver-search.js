// KJ 대리운전 기사 찾기 - 프론트 스크립트
// API: GET /api/insurance/kj-driver/list?page=&limit=&name=&jumin=&status=

(function () {
  const tableBody = document.getElementById('driver_search_table_body');
  const mobileCards = document.getElementById('driver_search_mobile_cards');
  const paginationInfo = document.getElementById('pagination_info');
  const paginationControls = document.getElementById('pagination_controls');

  const searchTypeFilter = document.getElementById('searchTypeFilter');
  const statusFilter = document.getElementById('statusFilter');
  const pageSizeSelect = document.getElementById('pageSize');
  const searchInput = document.getElementById('search_word');
  const searchBtn = document.getElementById('search_btn');

  let currentPage = 1;

  const statusLabel = (ch) => {
    if (ch === '1' || ch === 1) return '정상';
    if (ch === '2' || ch === 2) return '중지';
    return '기타';
  };

  const renderTable = (rows) => {
    if (!rows || rows.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-4">데이터가 없습니다.</td>
        </tr>`;
      return;
    }

    tableBody.innerHTML = rows
      .map(
        (row, idx) => `
          <tr>
            <td>${row.num ?? ''}</td>
            <td>${row.Name ?? ''}</td>
            <td class="d-none d-lg-table-cell">${row.companyNum ?? ''}</td>
            <td>${row.Hphone ?? ''}</td>
            <td class="d-none d-lg-table-cell">${row.policyNum ?? ''}</td>
            <td>${statusLabel(row.status)}</td>
          </tr>
        `
      )
      .join('');
  };

  const renderMobile = (rows) => {
    if (!rows || rows.length === 0) {
      mobileCards.innerHTML = `<div class="text-center py-4">데이터가 없습니다.</div>`;
      return;
    }

    mobileCards.innerHTML = rows
      .map(
        (row) => `
        <div class="card mb-2">
          <div class="card-body">
            <div class="d-flex justify-content-between">
              <div><strong>${row.Name ?? ''}</strong></div>
              <div class="text-muted">${statusLabel(row.status)}</div>
            </div>
            <div class="small text-muted">${row.policyNum ?? ''}</div>
            <div class="mt-1">${row.Hphone ?? ''}</div>
            <div class="text-muted small">소속: ${row.companyNum ?? ''}</div>
          </div>
        </div>`
      )
      .join('');
  };

  const renderPagination = (page, totalPages, total) => {
    paginationInfo.textContent = `총 ${total}건 / ${page}/${totalPages} 페이지`;
    paginationControls.innerHTML = '';

    const createPageItem = (p, label = p, disabled = false, active = false) => {
      const li = document.createElement('li');
      li.className = `page-item ${disabled ? 'disabled' : ''} ${active ? 'active' : ''}`;
      const a = document.createElement('a');
      a.className = 'page-link';
      a.href = '#';
      a.textContent = label;
      a.addEventListener('click', (e) => {
        e.preventDefault();
        if (!disabled && !active) {
          currentPage = p;
          fetchList();
        }
      });
      li.appendChild(a);
      return li;
    };

    paginationControls.appendChild(createPageItem(Math.max(1, page - 1), '‹', page === 1));

    for (let p = 1; p <= totalPages; p++) {
      paginationControls.appendChild(createPageItem(p, p, false, p === page));
    }

    paginationControls.appendChild(
      createPageItem(Math.min(totalPages, page + 1), '›', page === totalPages || totalPages === 0)
    );
  };

  const fetchList = async () => {
    const keyword = searchInput.value.trim();
    const searchType = searchTypeFilter.value;
    const status = statusFilter.value; // '' or '정상'
    const limit = Number(pageSizeSelect.value) || 20;

    const params = new URLSearchParams();
    params.set('page', currentPage);
    params.set('limit', limit);

    if (searchType === '이름' && keyword) params.set('name', keyword);
    if (searchType === '주민번호' && keyword) params.set('jumin', keyword);
    if (status) params.set('status', status);

    tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-4">데이터를 불러오는 중...</td>
      </tr>`;
    mobileCards.innerHTML = `<div class="text-center py-4">데이터를 불러오는 중...</div>`;

    try {
      const res = await fetch(`/api/insurance/kj-driver/list?${params.toString()}`);
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || 'API 오류');
      }

      const rows = json.data || [];
      renderTable(rows);
      renderMobile(rows);

      const pagination = json.pagination || {};
      renderPagination(
        pagination.page || 1,
        pagination.totalPages || 1,
        pagination.total || rows.length
      );
    } catch (err) {
      console.error(err);
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center text-danger py-4">오류가 발생했습니다.</td>
        </tr>`;
      mobileCards.innerHTML = `<div class="text-center text-danger py-4">오류가 발생했습니다.</div>`;
      paginationInfo.textContent = '';
      paginationControls.innerHTML = '';
    }
  };

  // 이벤트 바인딩
  searchBtn?.addEventListener('click', () => {
    currentPage = 1;
    fetchList();
  });

  searchInput?.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      currentPage = 1;
      fetchList();
    }
  });

  pageSizeSelect?.addEventListener('change', () => {
    currentPage = 1;
    fetchList();
  });

  statusFilter?.addEventListener('change', () => {
    currentPage = 1;
    fetchList();
  });

  // 초기 로드에서는 자동 호출하지 않음 (사용자 입력 후 검색)
  tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-4">검색어를 입력해 주세요.</td>
      </tr>`;
  mobileCards.innerHTML = `<div class="text-center py-4">검색어를 입력해 주세요.</div>`;
  paginationInfo.textContent = '';
  paginationControls.innerHTML = '';
})();


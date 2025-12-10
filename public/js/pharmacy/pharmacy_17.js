/**
 * 설계리스트 엑셀 다운로드
 */
async function downloadDesignListExcel() {
  try {
    // SheetJS 로드 확인
    if (typeof XLSX === 'undefined') {
      alert('엑셀 라이브러리가 로드되지 않았습니다.\n페이지를 새로고침 해주세요.');
      return;
    }

    // 확인 메시지
    if (!confirm('승인건 중 설계리스트를 엑셀로 다운로드하시겠습니까?\n\n※ 다운로드 후 해당 건들의 출력 상태가 초기화됩니다.')) {
      return;
    }

    // 로딩 표시
    showLoading(true);

    // API 호출 (pharmacy2 경로로 변경)
    const response = await fetch('/api/pharmacy2/design-list-excel', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        trigger: 'value1' // 보안 파라미터
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || '데이터 조회 실패');
    }

    // 데이터가 없는 경우
    if (!result.data || result.data.length === 0) {
      alert('다운로드할 설계 데이터가 없습니다.\n\n조건: 설계중 상태이며 출력되지 않은 건');
      return;
    }

    // 엑셀 생성 및 다운로드
    generateDesignListExcel(result.data);

    // 성공 메시지
    setTimeout(() => {
      alert(`설계리스트 엑셀이 다운로드되었습니다.\n\n총 ${result.data.length}건\n출력 상태가 초기화되었습니다.`);
      
      // 목록 새로고침
      loadPharmacyData();
    }, 500);

  } catch (error) {
    console.error('설계리스트 엑셀 다운로드 오류:', error);
    alert(`엑셀 다운로드 중 오류가 발생했습니다.\n\n${error.message}`);
  } finally {
    showLoading(false);
  }
}

/**
 * 설계리스트 Excel 파일 생성 (SheetJS)
 * @param {Array} data 설계 데이터
 */
function generateDesignListExcel(data) {
  // 워크북 생성
  const wb = XLSX.utils.book_new();
  
  // 데이터 배열 생성
  const wsData = [];
  
  // ===== 제목 영역 =====
  wsData.push(['약국배상책임보험 설계리스트']);
  wsData.push([`다운로드 일시: ${new Date().toLocaleString('ko-KR')}`]);
  wsData.push([`총 건수: ${data.length}건`]);
  wsData.push([]); // 빈 행
  
  // ===== 데이터 영역 =====
  // 헤더 (거래처명 추가)
  wsData.push(['구분', '승인일', '약국명', '전문인설계번호', '화재설계번호', '거래처']);
  
  // 데이터 행 (설계번호가 하나라도 있는 건만 출력)
  let rowIndex = 0;
  data.forEach((item) => {
    const expertDesign = item.expert_design_number || '';
    const fireDesign = item.fire_design_number || '';
    
    // 전문인 또는 화재 설계번호가 하나라도 있는 경우만 추가
    if (expertDesign || fireDesign) {
      rowIndex++;
      wsData.push([
        rowIndex,
        item.approval_date ? item.approval_date.substring(0, 10) : '', // YYYY-MM-DD
        item.company || '',
        expertDesign,
        fireDesign,
        item.account_directory || '미지정' // 거래처명 추가
      ]);
    }
  });
  
  // 워크시트 생성
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  // ===== 컬럼 너비 설정 (거래처 컬럼 추가) =====
  ws['!cols'] = [
    { wch: 8 },   // 구분
    { wch: 12 },  // 승인일
    { wch: 25 },  // 약국명
    { wch: 20 },  // 전문인설계번호
    { wch: 20 },  // 화재설계번호
    { wch: 20 }   // 거래처 (신규)
  ];
  
  // ===== 셀 병합 (F 컬럼까지 확장) =====
  const merges = [];
  
  // 제목 병합 (A1:F1)
  merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } });
  
  // 다운로드일시 병합 (A2:F2)
  merges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: 5 } });
  
  // 총 건수 병합 (A3:F3)
  merges.push({ s: { r: 2, c: 0 }, e: { r: 2, c: 5 } });
  
  ws['!merges'] = merges;
  
  // ===== 셀 스타일 적용 =====
  // 제목 셀 (A1)
  if (ws['A1']) {
    ws['A1'].s = {
      font: { bold: true, sz: 14 },
      alignment: { horizontal: 'center', vertical: 'center' }
    };
  }
  
  // 다운로드일시 (A2)
  if (ws['A2']) {
    ws['A2'].s = {
      alignment: { horizontal: 'center' }
    };
  }
  
  // 총 건수 (A3)
  if (ws['A3']) {
    ws['A3'].s = {
      font: { bold: true },
      alignment: { horizontal: 'center' }
    };
  }
  
  // 헤더 행 스타일 (5번째 행, F 컬럼까지)
  const headerRow = 4; // 0-based index
  ['A', 'B', 'C', 'D', 'E', 'F'].forEach(col => {
    const cellRef = `${col}${headerRow + 1}`;
    if (ws[cellRef]) {
      ws[cellRef].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: 'F0F0F0' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } }
        }
      };
    }
  });
  
  // 데이터 영역 텍스트 포맷 설정 (@: 텍스트 형식)
  const startDataRow = 5; // 0-based
  const endDataRow = startDataRow + rowIndex - 1;
  
  for (let i = startDataRow; i <= endDataRow; i++) {
    // 구분 (숫자)
    const cellA = `A${i + 1}`;
    if (ws[cellA]) {
      ws[cellA].t = 'n'; // 숫자 타입
    }
    
    // 승인일, 약국명, 설계번호들, 거래처는 텍스트로
    ['B', 'C', 'D', 'E', 'F'].forEach(col => {
      const cellRef = `${col}${i + 1}`;
      if (ws[cellRef]) {
        ws[cellRef].z = '@'; // 텍스트 포맷
      }
    });
  }
  
  // 워크북에 시트 추가
  XLSX.utils.book_append_sheet(wb, ws, '설계리스트');
  
  // ===== 파일명 생성 =====
  const today = new Date().toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
  const fileName = `설계리스트_${today}.xlsx`;
  
  // ===== 다운로드 =====
  XLSX.writeFile(wb, fileName);
}
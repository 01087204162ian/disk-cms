/**
 * common-notice.js - 공통 공지사항 처리 함수
 * field-practice-modal.js와 filed-practice-claim.js에서 공통 사용
 */

// 무사고 확인서 URL 생성 함수
function question7_mail() {
  const claimNum = document.getElementById("questionwareNum_")?.value;
  return `http://silbo.kr/2014/_pages/php/downExcel/claim7.php?claimNum=${encodeURIComponent(claimNum)}`;
}

// 공지사항 템플릿 정의
function getNoticeTemplate(noticeType) {
  const templates = {
    "1": {
      title: "[한화 현장실습보험] 보험금 청구시 필요서류 안내",
      content: `<div>안녕하십니까.<br><br>
               현장실습보험 문의에 깊이 감사드립니다.<br><br>
              1. 보험금 청구서(+필수 동의서) 및 문답서<br>
              * 보험금 청구 기간은 최대 1년까지 가능합니다.<br>
              * <div style="text-align: center; margin: 20px 0;">
                  <a href='https://silbo.kr/static/lib/attachfile/보험금 청구서,동의서,문답서_2023.pdf' 
                     target='_blank'
                     style='display: inline-block; background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); 
                            color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; 
                            font-weight: bold; box-shadow: 0 2px 10px rgba(255,107,53,0.3);'>
                      💰 보험금 청구서류 다운로드
                  </a>
                </div><br>
              2. 신분증 및 통장사본<br><br>
              3. 진단서 또는 초진차트<br><br>
              4. 병원치료비 영수증(계산서)_치료비세부내역서, 약제비 영수증<br><br>
              5. 실습기관의 현장실습 출석부 사본 또는 실습일지<br><br>
              6. 학생 학적을 확인할 수 있는 학교 전산 캡처본<br><br>
              7. 보험금 청구서 밑의 법정대리인의 서명, 가족관계증명서, 보호자 신분증 및 통장사본<br>
              (고등학생 현장 실습 사고 접수 경우만 해당)<br><br>
              위 서류들을 구비하셔서 메일 답장으로 부탁드립니다.<br><br>
              자세한 사항은 현장실습 홈페이지(<a href='http://silbo.kr/'>http://silbo.kr/</a>)의 보상안내, 공지사항에서도 확인하실 수 있습니다.
              <br><br>감사합니다.<br><br><hr>
              <p style='font-size: 8px; color: #00A000;'>이투엘보험대리점</p>
              <p style='font-size: 8px; color: #00A000;'>현장실습보험지원팀</p>
              <p style='font-size: 8px; color: #00A000;'>1533-5013</p><br>
              현장실습보험은 <span style='color: #FB2C10;'>한화손해보험</span>에서 제공합니다.</div>`,
      attachfile: ".",
    },
    "2": {
      title: "[이용안내문] 한화 현장실습 보험 이용 안내문",
      content: `<div>안녕하십니까.<br><br>
              현장실습보험 문의에 깊이 감사드립니다.<br><br>
              현장실습 이용방법이 담긴 안내문 첨부파일로 전달드립니다.<br><br>
              <a href="http://silbo.kr/">현장실습 홈페이지 바로가기</a><br><br>
              감사합니다.<br><br><hr>
              <p style='font-size: 8px; color: #00A000;'>이투엘보험대리점</p>
              <p style='font-size: 8px; color: #00A000;'>현장실습보험지원팀</p>
              <p style='font-size: 8px; color: #00A000;'>1533-5013</p><br>
              현장실습보험은 <span style='color: #FB2C10;'>한화손해보험</span>에서 제공합니다.</div>`,
      attachfile: "/static/lib/attachfile/한화 현장실습 보험 안내 팜플렛.pdf",
    },
    "3": {
      title: "[한화 현장실습보험] 무사고 확인서 요청",
      content: (() => {
        const musagourl = question7_mail();
        return `<div>
                안녕하십니까.<br><br>
                보험 시작일이 설계일보다 앞서 무사고 확인서를 전달드립니다.<br><br>
                첨부된 파일의 입금일에 입금 또는 카드결제하실 날짜 기입 후<br><br>
                하단에 명판직인 날인하여 회신 주시면 청약서 발급 후 전달드리겠습니다.<br><br>
                하기 링크 확인 부탁드립니다.<br><br>
                <a href='https://www.silbo.kr/${musagourl}'>무사고 확인서 링크</a><br><br>
                감사합니다.<br><br><hr>
                <p style='font-size: 8px; color: #00A000;'>이투엘보험대리점</p>
                <p style='font-size: 8px; color: #00A000;'>현장실습보험지원팀</p>
                <p style='font-size: 8px; color: #00A000;'>1533-5013</p><br>
                현장실습보험은 <span style='color: #FB2C10;'>한화손해보험</span>에서 제공합니다.
            </div>`;
      })(),
      attachfile: ".",
    }
  };

  return templates[noticeType] || null;
}

// 공지사항 이메일 발송
async function sendNoticeEmail(noticeType, email, selectElement, originalText) {
  const selectedTemplate = getNoticeTemplate(noticeType);

  if (!selectedTemplate) {
    alert("유효하지 않은 공지사항입니다.");
    return;
  }

  // 로딩 상태 표시
  if (selectElement) {
    selectElement.disabled = true;
    const originalOptionText = selectElement.options[selectElement.selectedIndex].text;
    selectElement.options[selectElement.selectedIndex].text = "발송 중...";
  }

  const formData = new FormData();
  formData.append("email", email);
  formData.append("title", selectedTemplate.title);
  formData.append("content", selectedTemplate.content);
  formData.append("attachfile", selectedTemplate.attachfile);

  const url = noticeType === "3"
    ? "https://silbo.kr/2025/api/musagoNotice.php"
    : "https://silbo.kr/2025/api/notice.php";

  try {
    const response = await fetch(url, {
      method: "POST",
      body: formData,
    });

    const data = await response.text();
    console.log("서버 응답:", data);

    // 성공 메시지
    if (window.sjTemplateLoader && window.sjTemplateLoader.showToast) {
      window.sjTemplateLoader.showToast(
        `${email}로 공지사항이 발송되었습니다.`,
        'success'
      );
    } else {
      alert("메일이 성공적으로 발송되었습니다.");
    }

  } catch (error) {
    console.error("메일 전송 오류:", error);
    
    if (window.sjTemplateLoader && window.sjTemplateLoader.showToast) {
      window.sjTemplateLoader.showToast(
        '메일 전송 중 오류가 발생했습니다.',
        'error'
      );
    } else {
      alert("메일 전송 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
  } finally {
    // 로딩 상태 해제
    if (selectElement) {
      selectElement.disabled = false;
      selectElement.options[selectElement.selectedIndex].text = originalText;
      selectElement.value = "-1"; // 선택 초기화
    }
  }
}

// 공지사항 선택 처리 (통합 함수)
function handleNoticeSelection(selectElement) {
  const noticeType = selectElement.value;

  if (noticeType === "-1") {
    return;
  }

  // 이메일 가져오기 (여러 소스에서 시도)
  let email = "";
  const emailSources = [
    document.getElementById("school_5_"),  // 모달용
    document.getElementById("school5"),     // 클레임용
  ];

  for (const source of emailSources) {
    if (source) {
      email = (source.value || source.innerText || source.textContent || "").trim();
      if (email) break;
    }
  }

  console.log("선택된 공지사항:", noticeType);
  console.log("이메일:", email);

  if (!email) {
    alert("이메일 주소를 찾을 수 없습니다.");
    selectElement.value = "-1";
    return;
  }

  if (!confirm(`[${email}]으로 해당 이메일을 발송하시겠습니까?`)) {
    selectElement.value = "-1";
    return;
  }

  const originalText = selectElement.options[selectElement.selectedIndex].text;
  sendNoticeEmail(noticeType, email, selectElement, originalText);
}

// 이벤트 리스너 자동 등록
document.addEventListener("change", function (event) {
  if (event.target.id === "noticeSelect" || 
      event.target.id === "noticeSelect2" || 
      event.target.id === "claim_notice_select") {
    handleNoticeSelection(event.target);
  }
});
// 간단한 스크립트 로더
class ScriptLoader {
  static async loadScripts() {
    console.log('🔄 스크립트 로딩 시작...');
    
    const scripts = [
      './js/menu-loader.js',
      './js/modal-system.js', 
      './js/page-modals.js',
      './js/template-loader.js'
    ];

    for (const script of scripts) {
      await this.loadScript(script);
    }
    
    console.log('✅ 모든 스크립트 로드 완료');
    
    // 모든 스크립트 로드 완료 후 초기화
    setTimeout(() => {
      this.initializeApp();
    }, 100);
  }

  static loadScript(src) {
    return new Promise((resolve, reject) => {
      // 이미 로드된 스크립트인지 확인
      if (document.querySelector(`script[src="${src}"]`)) {
        console.log(`⏩ ${src} 이미 로드됨`);
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = src;
      script.onload = () => {
        console.log(`✅ ${src} 로드 완료`);
        resolve();
      };
      script.onerror = () => {
        console.error(`❌ ${src} 로드 실패`);
        reject(new Error(`Failed to load ${src}`));
      };
      document.head.appendChild(script);
    });
  }

  static initializeApp() {
    console.log('🚀 앱 초기화 시작');
    
    // 필요한 클래스들이 정의되어 있는지 확인
    const classes = {
      MenuLoader: typeof MenuLoader !== 'undefined',
      ModalSystem: typeof ModalSystem !== 'undefined', 
      PageModals: typeof PageModals !== 'undefined',
      TemplateLoader: typeof TemplateLoader !== 'undefined'
    };
    
    console.log('클래스 로드 상태:', classes);
    
    const missingClasses = Object.entries(classes)
      .filter(([name, loaded]) => !loaded)
      .map(([name]) => name);
    
    if (missingClasses.length > 0) {
      console.error('❌ 누락된 클래스들:', missingClasses);
      document.getElementById('content-container').innerHTML = `
        <div class="loading">
          <i class="fas fa-exclamation-triangle" style="color: #e53e3e;"></i>
          <div style="color: #e53e3e;">시스템 로딩 실패<br>누락된 클래스: ${missingClasses.join(', ')}</div>
        </div>
      `;
      return;
    }
    
    console.log('✅ 모든 클래스 로드 완료');
    
    // 템플릿 로더 시작
    try {
      window.templateLoader = new TemplateLoader();
      console.log('✅ 템플릿 로더 생성 완료');
    } catch (error) {
      console.error('❌ 템플릿 로더 생성 실패:', error);
    }
  }
}

// 페이지 로드시 스크립트 순차 로딩
document.addEventListener('DOMContentLoaded', () => {
  console.log('🎯 DOM 로드 완료, 스크립트 로딩 시작');
  ScriptLoader.loadScripts().catch(error => {
    console.error('스크립트 로딩 실패:', error);
    document.getElementById('content-container').innerHTML = `
      <div class="loading">
        <i class="fas fa-exclamation-triangle" style="color: #e53e3e;"></i>
        <div style="color: #e53e3e;">스크립트 로딩 실패: ${error.message}</div>
      </div>
    `;
  });
});
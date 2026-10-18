import React, { useState, useEffect } from 'react';
import { useShift } from '../context/ShiftContext';

export const PwaInstallModal: React.FC = () => {
  const { isPwaModalOpen, closePwaModal, triggerPwaInstall, isInstallable, isInstalled, showToast } = useShift();
  const [activeGuideTab, setActiveGuideTab] = useState<'galaxy' | 'iphone' | 'pc'>('galaxy');
  const [liveUrl, setLiveUrl] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('shiftmate_custom_url');
      if (saved) return saved;
      return window.location.href;
    }
    return '';
  });
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [customInputUrl, setCustomInputUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('shiftmate_custom_url');
      if (saved) {
        setLiveUrl(saved);
        setCustomInputUrl(saved);
      } else {
        const current = window.location.href;
        setLiveUrl(current);
        setCustomInputUrl(current);
      }
    }
  }, [isPwaModalOpen]);

  if (!isPwaModalOpen) return null;

  // 1. Direct Web Browser Launch (Iframe Escape)
  const handleOpenDirect = () => {
    const target = liveUrl || (typeof window !== 'undefined' ? window.location.href : '');
    if (!target) {
      showToast('⚠️ 주소를 가져오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    try {
      const newWin = window.open(target, '_blank', 'noopener,noreferrer');
      if (!newWin || newWin.closed || typeof newWin.closed === 'undefined') {
        showToast('💡 팝업이 차단된 경우 AI Studio 상단의 [새 탭에서 열기 ↗] 버튼을 이용해주세요!');
      } else {
        showToast('🚀 새 브라우저 창에서 ShiftMate 사이트로 바로 접속합니다.');
      }
    } catch {
      showToast('💡 AI Studio 상단의 [새 탭에서 열기 ↗] 버튼을 누르시면 전체화면으로 접속됩니다.');
    }
  };

  // 2. Copy Site URL
  const handleCopyUrl = async () => {
    const target = liveUrl || (typeof window !== 'undefined' ? window.location.href : '');
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(target);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = target;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      showToast('📋 ShiftMate 접속 주소가 복사되었습니다! 갤럭시 브라우저 주소창에 붙여넣으세요.');
    } catch {
      showToast('주소 복사에 실패했습니다. 아래 주소를 직접 드래그하여 복사해주세요.');
    }
  };

  // 3. Download Direct Launch Shortcut HTML File (with Real Dynamic URL & Offline Smart Launcher)
  const handleDownloadHtmlShortcut = () => {
    const targetUrl = liveUrl || (typeof window !== 'undefined' ? window.location.href : '');

    const htmlContent = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>ShiftMate - 바로 접속 런처</title>
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <meta name="theme-color" content="#004ac6">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans KR", sans-serif;
      background: #faf8ff;
      color: #131b2e;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
      text-align: center;
    }
    .card {
      background: #ffffff;
      border-radius: 28px;
      padding: 32px 24px;
      box-shadow: 0 16px 40px rgba(0, 74, 198, 0.12);
      max-width: 420px;
      width: 100%;
      border: 1px solid rgba(195, 198, 215, 0.35);
    }
    .icon-box {
      width: 68px;
      height: 68px;
      border-radius: 20px;
      background: #004ac6;
      color: white;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      margin-bottom: 16px;
      box-shadow: 0 8px 24px rgba(0, 74, 198, 0.25);
    }
    h1 {
      font-size: 20px;
      font-weight: 800;
      margin-bottom: 6px;
      color: #131b2e;
    }
    p {
      font-size: 13px;
      color: #434655;
      margin-bottom: 20px;
      line-height: 1.5;
    }
    .btn {
      display: block;
      width: 100%;
      padding: 15px 20px;
      background: #004ac6;
      color: #ffffff;
      text-decoration: none;
      font-size: 15px;
      font-weight: 700;
      border-radius: 16px;
      box-shadow: 0 6px 18px rgba(0, 74, 198, 0.25);
      border: none;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .btn:hover { background: #003ea8; }
    .btn:active { transform: scale(0.98); }
    .url-box {
      margin-top: 18px;
      padding: 12px;
      background: #f2f3ff;
      border-radius: 14px;
      text-align: left;
      font-size: 11px;
    }
    .url-box label {
      display: block;
      font-weight: 700;
      color: #004ac6;
      margin-bottom: 4px;
    }
    .url-input {
      width: 100%;
      padding: 8px 10px;
      border: 1px solid #c3c6d7;
      border-radius: 8px;
      background: #fff;
      font-size: 11px;
      color: #131b2e;
      font-family: monospace;
      outline: none;
    }
    .guide {
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px dashed #c3c6d7;
      font-size: 11px;
      color: #737686;
      line-height: 1.5;
      text-align: left;
    }
    .guide strong { color: #006c49; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon-box">⏱️</div>
    <h1>ShiftMate (시프트메이트)</h1>
    <p>스마트 근무 관리 및 2026 최저임금·주휴수당 정산 앱으로 즉시 연결합니다.</p>
    
    <a href="${targetUrl}" class="btn" id="launchBtn" target="_blank" rel="noopener noreferrer">
      🚀 ShiftMate 앱 지금 바로 열기
    </a>

    <div class="url-box">
      <label>연결 사이트 주소 (실시간)</label>
      <input type="text" id="urlInput" class="url-input" value="${targetUrl}" />
    </div>

    <div class="guide">
      💡 <strong>갤럭시 폴드 홈 화면 추가 팁:</strong><br>
      위 버튼을 눌러 사이트가 열리면, <strong>삼성 인터넷 하단 [≡] 메뉴 ➔ [현재 페이지 추가] ➔ [홈 화면]</strong>을 누르시면 홈 화면에 실제 앱으로 추가됩니다!
    </div>
  </div>

  <script>
    const input = document.getElementById('urlInput');
    const btn = document.getElementById('launchBtn');
    
    // Remember saved URL if user edits
    const saved = localStorage.getItem('shiftmate_url');
    if (saved) {
      input.value = saved;
      btn.href = saved;
    }

    input.addEventListener('input', function() {
      const val = input.value.trim();
      if (val) {
        btn.href = val;
        localStorage.setItem('shiftmate_url', val);
      }
    });

    // Auto-launch if valid URL present and not on file protocol error
    if (btn.href && btn.href.startsWith('http') && !btn.href.includes('localhost:3000')) {
      setTimeout(function() {
        window.location.href = btn.href;
      }, 500);
    }
  </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ShiftMate_홈화면_바로가기.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('📥 [ShiftMate_홈화면_바로가기.html] 다운로드 완료!');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#131b2e]/60 backdrop-blur-xs animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) closePwaModal();
      }}
    >
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-[#c3c6d7]/30 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-[#eaedff] flex items-center justify-between bg-[#f2f3ff]">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#004ac6] text-white flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[20px]">install_mobile</span>
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#131b2e]">ShiftMate 바로 접속 & PWA 설치</h2>
              <span className="text-[11px] text-[#434655]">
                모바일 홈 화면 추가 · 오프라인 PWA 지원
              </span>
            </div>
          </div>
          <button
            onClick={closePwaModal}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#737686] hover:bg-[#eaedff] cursor-pointer"
            aria-label="닫기"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-[#131b2e]">
          {/* Key Callout for Mobile & GitHub users */}
          <div className="p-3.5 rounded-2xl bg-[#eff1ff] border border-[#004ac6]/30 flex flex-col gap-3">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-[#004ac6] text-[20px] shrink-0 mt-0.5">
                phonelink_ring
              </span>
              <div className="min-w-0 text-[11.5px] leading-relaxed text-[#131b2e]">
                <strong className="text-[#004ac6] font-bold block mb-0.5">
                  📱 스마트폰 크롬에서 바로 앱 설치하는 방법:
                </strong>
                스마트폰 카메라로 아래 <strong>QR 코드를 스캔</strong>하거나 주소를 복사하여 접속하시면 흰 화면이나 오류 없이 즉시 열립니다! 크롬 브라우저 메뉴의 <strong>[앱 설치]</strong> 또는 <strong>[홈 화면에 추가]</strong>를 누르면 실제 앱으로 즉시 설치됩니다.
              </div>
            </div>

            {/* QR Code and Live URL Bar */}
            <div className="p-3 rounded-xl bg-white border border-[#004ac6]/20 flex flex-col sm:flex-row items-center gap-3">
              {liveUrl && (
                <div className="flex flex-col items-center shrink-0">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(liveUrl)}`}
                    alt="접속용 QR 코드"
                    className="w-24 h-24 rounded-lg border border-[#c3c6d7]/40 bg-white p-1 shadow-2xs"
                  />
                  <span className="text-[10px] text-[#737686] mt-1 font-semibold">스마트폰 카메라로 스캔</span>
                </div>
              )}

              <div className="flex-1 w-full flex flex-col gap-1.5 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#004ac6]">현재 접속 주소:</span>
                  <button
                    type="button"
                    onClick={() => setIsEditingUrl(!isEditingUrl)}
                    className="text-[10.5px] text-[#737686] hover:text-[#004ac6] underline cursor-pointer"
                  >
                    {isEditingUrl ? '닫기' : 'GitHub Pages 주소 직접 입력'}
                  </button>
                </div>

                {isEditingUrl ? (
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={customInputUrl}
                      onChange={(e) => setCustomInputUrl(e.target.value)}
                      placeholder="https://아이디.github.io/저장소명/"
                      className="flex-1 px-2.5 py-1 text-[11px] font-mono border border-[#004ac6]/40 rounded-lg outline-none bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        let formatted = customInputUrl.trim();
                        if (formatted && !formatted.endsWith('/')) formatted += '/';
                        setLiveUrl(formatted);
                        localStorage.setItem('shiftmate_custom_url', formatted);
                        setIsEditingUrl(false);
                        showToast('✅ 접속 주소가 설정되었습니다!');
                      }}
                      className="px-2.5 py-1 bg-[#004ac6] text-white rounded-lg text-[11px] font-bold shrink-0 cursor-pointer"
                    >
                      저장
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2 p-1.5 bg-[#f2f3ff] rounded-lg">
                    <span className="text-[11px] font-mono font-bold text-[#004ac6] truncate select-all">
                      {liveUrl || '주소 확인 중...'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const target = liveUrl || (typeof window !== 'undefined' ? window.location.href : '');
                        if (navigator.clipboard && navigator.clipboard.writeText) {
                          navigator.clipboard.writeText(target);
                        }
                        showToast('📋 스마트폰 접속 주소가 복사되었습니다!');
                      }}
                      className="px-2.5 py-1 bg-[#004ac6] text-white rounded-lg text-[11px] font-bold shrink-0 shadow-xs active:scale-95 transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[13px]">content_copy</span>
                      <span>복사</span>
                    </button>
                  </div>
                )}

                <div className="text-[10.5px] text-[#434655] leading-relaxed">
                  💡 <strong>URL not found 오류 해결:</strong> 이전 세션의 만료된 임시 주소 대신 위 주소 또는 본인의 <strong>GitHub Pages 주소(끝에 / 포함)</strong>로 접속하시면 문제없이 열립니다.
                </div>
              </div>
            </div>

            <div className="text-[10.5px] text-[#434655] pt-1 border-t border-[#004ac6]/15 flex items-center gap-1">
              <span className="material-symbols-outlined text-[#006c49] text-[15px] shrink-0">check_circle</span>
              <span><strong>GitHub Pages 흰 화면 방지 적용:</strong> 상대 경로(./) 및 자동 슬래시 리다이렉트가 반영되어 있습니다.</span>
            </div>
          </div>

          {/* App Card */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#dbe1ff]/60 to-[#eaedff] border border-[#004ac6]/20 flex items-center gap-3 shadow-2xs">
            <img
              alt="ShiftMate"
              className="w-13 h-13 rounded-2xl shadow-sm border border-white shrink-0"
              src="./pwa-192x192.png"
            />
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm font-extrabold text-[#131b2e]">ShiftMate (시프트메이트)</span>
                <span className="px-1.5 py-0.2 rounded-full bg-[#004ac6] text-white text-[9px] font-bold">
                  PWA Ready
                </span>
              </div>
              <span className="text-[#434655] text-[11px] leading-tight mt-0.5">
                모든 근무 기록과 2026 최저시급·주휴수당이 기기에 100% 안전하게 저장되며, 앱으로 설치하여 단독 실행할 수 있습니다.
              </span>
            </div>
          </div>

          {/* Section 1: HTML & Direct Site Access */}
          <div className="p-3.5 rounded-2xl bg-[#faf8ff] border border-[#c3c6d7]/35 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-[#004ac6] flex items-center gap-1 text-xs">
                <span className="material-symbols-outlined text-[16px]">open_in_browser</span>
                <span>실제 사이트 접속 및 바로가기 파일</span>
              </span>
              <span className="text-[10px] text-[#006c49] font-bold bg-[#6cf8bb]/40 px-2 py-0.5 rounded-full">
                ✓ 실시간 연동됨
              </span>
            </div>

            <p className="text-[11px] text-[#434655] leading-relaxed">
              아래 버튼을 눌러 새 브라우저 창으로 바로 열거나, 스마트폰 바탕화면용 <strong>바로가기 HTML 파일</strong>을 다운로드받으세요.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {/* Direct Open Link/Button */}
              <a
                href={liveUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleOpenDirect}
                className="py-2.5 px-3 rounded-xl bg-[#004ac6] text-white text-xs font-bold shadow-xs hover:bg-[#003ea8] active:scale-95 flex items-center justify-center gap-1.5 transition-all cursor-pointer text-center no-underline"
              >
                <span className="material-symbols-outlined text-[16px]">launch</span>
                <span>새 창에서 앱 바로 열기</span>
              </a>

              {/* Download HTML Shortcut File Button */}
              <button
                type="button"
                onClick={handleDownloadHtmlShortcut}
                className="py-2.5 px-3 rounded-xl bg-white hover:bg-[#f2f3ff] text-[#004ac6] text-xs font-bold border border-[#004ac6]/40 shadow-xs active:scale-95 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">download_for_offline</span>
                <span>바로가기 HTML 다운로드</span>
              </button>
            </div>

            {/* URL Display & Copy */}
            <div className="mt-2 p-2 rounded-xl bg-white border border-[#c3c6d7]/30 flex items-center justify-between gap-2">
              <span className="text-[11px] text-[#434655] truncate font-mono select-all">
                {liveUrl || '주소 로딩 중...'}
              </span>
              <button
                type="button"
                onClick={handleCopyUrl}
                className="px-2.5 py-1 rounded-lg bg-[#f2f3ff] hover:bg-[#eaedff] text-[#004ac6] text-[11px] font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">content_copy</span>
                <span>URL 복사</span>
              </button>
            </div>
          </div>

          {/* Section 2: One-Click PWA Install Status & Actions */}
          {isInstalled && (
            <div className="p-3 bg-[#6cf8bb]/30 rounded-2xl border border-[#006c49]/30 flex items-center gap-2.5 text-[#006c49]">
              <span className="material-symbols-outlined text-[24px]">verified</span>
              <div>
                <div className="text-xs font-bold">ShiftMate가 홈 화면에 이미 설치되어 있습니다!</div>
                <div className="text-[11px] text-[#005236]">기기 바탕화면 아이콘을 통해 전체화면 단독 앱으로 언제든 실행됩니다.</div>
              </div>
            </div>
          )}

          {isInstallable && (
            <button
              onClick={triggerPwaInstall}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#004ac6] to-[#006c49] text-white text-xs font-extrabold shadow-md hover:opacity-95 active:scale-98 flex items-center justify-center gap-2 transition-all cursor-pointer animate-pulse"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">download</span>
              <span>📱 지금 기기에 1초 만에 앱 설치하기</span>
            </button>
          )}

          {!isInstallable && !isInstalled && (
            <div className="p-3 bg-[#eaedff] rounded-2xl border border-[#c3c6d7]/40 flex items-start gap-2.5 text-[#131b2e]">
              <span className="material-symbols-outlined text-[20px] text-[#004ac6] shrink-0 mt-0.5">info</span>
              <div className="text-[11.5px] leading-relaxed">
                <span className="font-bold text-[#004ac6] block mb-0.5">💡 앱 설치 방법 안내</span>
                현재 AI Studio 미리보기 내부에서는 보안 규정으로 인해 브라우저의 <strong>[앱 설치]</strong> 팝업이 차단됩니다.
                위의 <strong>[새 창에서 앱 바로 열기]</strong>를 누르시거나 URL을 복사하여 모바일 브라우저(크롬/삼성인터넷)에서 접속하시면 <strong>즉시 앱 설치가 활성화</strong>됩니다!
              </div>
            </div>
          )}

          {/* Section 3: Device-Specific Add to Home Screen Guide (홈 화면에 추가 가이드) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-[#131b2e] flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-[#004ac6]">bookmark_add</span>
                <span>갤럭시 폴드 & 스마트폰 홈 화면 추가 가이드</span>
              </span>
            </div>

            {/* Device Tabs */}
            <div className="flex rounded-xl bg-[#f2f3ff] p-1 gap-1">
              <button
                type="button"
                onClick={() => setActiveGuideTab('galaxy')}
                className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  activeGuideTab === 'galaxy'
                    ? 'bg-white text-[#006c49] shadow-xs'
                    : 'text-[#434655] hover:text-[#131b2e]'
                }`}
              >
                <span>🤖 갤럭시 폴드 / 안드로이드</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveGuideTab('iphone')}
                className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  activeGuideTab === 'iphone'
                    ? 'bg-white text-[#004ac6] shadow-xs'
                    : 'text-[#434655] hover:text-[#131b2e]'
                }`}
              >
                <span>🍎 아이폰(iOS)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveGuideTab('pc')}
                className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  activeGuideTab === 'pc'
                    ? 'bg-white text-[#585e71] shadow-xs'
                    : 'text-[#434655] hover:text-[#131b2e]'
                }`}
              >
                <span>💻 PC(크롬/엣지)</span>
              </button>
            </div>

            {/* Guide Content: Galaxy Fold / Android */}
            {activeGuideTab === 'galaxy' && (
              <div className="p-3 bg-[#f2f3ff] rounded-2xl space-y-2 text-[11px] text-[#434655] border border-[#eaedff]">
                <div className="font-bold text-[#006c49] flex items-center gap-1">
                  <span>갤럭시 폴드 / 삼성 스마트폰 (삼성인터넷 또는 Chrome)</span>
                </div>
                <div className="space-y-1.5 pl-1">
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-[#006c49] text-white flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">
                      1
                    </span>
                    <span>
                      위의 <strong>[URL 복사]</strong>를 누른 후 스마트폰의 <strong>삼성 인터넷</strong>이나 <strong>Chrome</strong> 주소창에 붙여넣어 접속합니다.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-[#006c49] text-white flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">
                      2
                    </span>
                    <span>
                      <strong>삼성인터넷 사용 시</strong>: 화면 하단 메뉴 <strong>[≡]</strong> ➔ <strong>&lsquo;현재 페이지 추가&rsquo;</strong> ➔ <strong>&lsquo;홈 화면&rsquo;</strong> 선택<br />
                      <strong>Chrome 사용 시</strong>: 우측 상단 더보기 <strong>[⋮]</strong> ➔ <strong>&lsquo;홈 화면에 추가&rsquo;</strong> 또는 <strong>&lsquo;앱 설치&rsquo;</strong> 선택
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-[#006c49] text-white flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">
                      3
                    </span>
                    <span>
                      이제 갤럭시 폴드 홈 화면에 ShiftMate 아이콘이 생성되어, <strong>주소창 없는 실제 전용 앱</strong>처럼 시원하게 이용하실 수 있습니다!
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Guide Content: iPhone (iOS Safari) */}
            {activeGuideTab === 'iphone' && (
              <div className="p-3 bg-[#f2f3ff] rounded-2xl space-y-2 text-[11px] text-[#434655] border border-[#eaedff]">
                <div className="font-bold text-[#004ac6] flex items-center gap-1">
                  <span>아이폰 (Safari 브라우저)</span>
                </div>
                <div className="space-y-1.5 pl-1">
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-[#004ac6] text-white flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">
                      1
                    </span>
                    <span>
                      사파리(Safari) 브라우저 하단의 <strong>공유 버튼 [↑]</strong>을 누릅니다.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-[#004ac6] text-white flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">
                      2
                    </span>
                    <span>
                      아래 메뉴 중 <strong>&lsquo;홈 화면에 추가&rsquo;</strong>를 선택합니다.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-[#004ac6] text-white flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">
                      3
                    </span>
                    <span>
                      우측 상단 <strong>&lsquo;추가&rsquo;</strong>를 누르면 홈 화면에 전용 앱으로 즉시 설치됩니다.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Guide Content: PC (Chrome / Edge) */}
            {activeGuideTab === 'pc' && (
              <div className="p-3 bg-[#f2f3ff] rounded-2xl space-y-2 text-[11px] text-[#434655] border border-[#eaedff]">
                <div className="font-bold text-[#131b2e] flex items-center gap-1">
                  <span>PC 환경 (Chrome, Edge, Whale)</span>
                </div>
                <div className="space-y-1.5 pl-1">
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-[#131b2e] text-white flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">
                      1
                    </span>
                    <span>
                      브라우저 주소창 우측의 <strong>[앱 설치 ⊕]</strong> 아이콘을 클릭합니다.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-[#131b2e] text-white flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">
                      2
                    </span>
                    <span>
                      <strong>&lsquo;설치&rsquo;</strong> 버튼을 누르면 윈도우/맥 작업표시줄에 독립 실행 프로그램으로 등록됩니다.
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-[#f2f3ff] border-t border-[#eaedff] flex items-center justify-between">
          <span className="text-[10px] text-[#737686]">PWA Standalone & Offline Ready</span>
          <button
            type="button"
            onClick={closePwaModal}
            className="px-5 py-2 rounded-xl bg-[#004ac6] text-white text-xs font-bold shadow-xs hover:bg-[#003ea8] active:scale-95 cursor-pointer"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
};

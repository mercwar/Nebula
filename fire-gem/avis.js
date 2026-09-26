/* ================================================================= *
 * RRU & AVIS - Unified Monitor, Toast Log & Bridge System          *
 * Operator: CVBGOD                                                 *
 * ================================================================= */

(function(){
  let logWindow, logContent, minimizedIcon;

  // Cookie Helper Functions
  function setCookie(name, value, days = 7) {
    const d = new Date();
    d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + d.toUTCString();
    document.cookie = `${name}=${encodeURIComponent(JSON.stringify(value))};${expires};path=/;SameSite=Strict`;
  }

  function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i].trim();
      if (c.indexOf(nameEQ) === 0) {
        try {
          return JSON.parse(decodeURIComponent(c.substring(nameEQ.length, c.length)));
        } catch (e) {
          return null;
        }
      }
    }
    return null;
  }

  // Compile active web page settings, DOM element map, and UI state into a full map object
  function compileSettings() {
    // Gather structural map of key elements on the page
    const elementsMap = [];
    document.querySelectorAll('div, button, input, form, canvas, section, header, footer').forEach((el, index) => {
      if (el.id || el.className) {
        elementsMap.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          className: typeof el.className === 'string' ? el.className : '',
          rect: {
            top: Math.round(el.getBoundingClientRect().top),
            left: Math.round(el.getBoundingClientRect().left),
            width: Math.round(el.getBoundingClientRect().width),
            height: Math.round(el.getBoundingClientRect().height)
          }
        });
      }
    });

    return {
      windowState: {
        top: logWindow ? logWindow.style.top : '407px',
        left: logWindow ? logWindow.style.left : '1327px',
        minimized: logWindow ? logWindow.style.display === 'none' : false
      },
      timestamp: new Date().toISOString(),
      url: window.location.href,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      documentMap: elementsMap
    };
  }

  function applySettings(settings) {
    if (!settings) return false;
    if (settings.windowState && logWindow) {
      logWindow.style.top = settings.windowState.top || '407px';
      logWindow.style.left = settings.windowState.left || '1327px';
      if (settings.windowState.minimized && logWindow.style.display !== 'none') {
        minimizeWindow();
      } else if (!settings.windowState.minimized && logWindow.style.display === 'none') {
        if (minimizedIcon) {
          minimizedIcon.click();
        } else {
          logWindow.style.display = 'flex';
        }
      }
    }
    return true;
  }

  function saveWindowState() {
    if (!logWindow) return;
    const settings = compileSettings();
    setCookie('toast_log_state', settings);
  }

  // Initialize the log window & floating launcher icon
  window.initLogWindow = function() {
    if (logWindow) return; // Prevent duplicate instantiation
    const savedState = getCookie('toast_log_state');
    const hasCookieState = savedState !== null;
    const activeState = savedState?.windowState || { top: '407px', left: '1327px', minimized: false };

    // Inject Modern Animations & Dynamic Elements
    if (!document.getElementById('mercwar-modern-styles')) {
      const styleSheet = document.createElement('style');
      styleSheet.id = 'mercwar-modern-styles';
      styleSheet.textContent = `
        @keyframes window-glow {
          0% { filter: drop-shadow(0 4px 10px rgba(168, 85, 247, 0.3)); }
          50% { filter: drop-shadow(0 4px 20px rgba(234, 179, 8, 0.4)); }
          100% { filter: drop-shadow(0 4px 10px rgba(168, 85, 247, 0.3)); }
        }
        .modern-scroll::-webkit-scrollbar { width: 5px; }
        .modern-scroll::-webkit-scrollbar-track { background: transparent; }
        .modern-scroll::-webkit-scrollbar-thumb { background: rgba(234, 179, 8, 0.3); border-radius: 10px; }
        .modern-scroll::-webkit-scrollbar-thumb:hover { background: rgba(168, 85, 247, 0.8); }
      `;
      document.head.appendChild(styleSheet);
    }

    // Main Window Layout
    logWindow = document.createElement('div');
    logWindow.id = 'toast-log-window';
    logWindow.style.cssText = `
      position: fixed; top: ${activeState.top}; left: ${activeState.left};
      width: 480px; height: 360px;
      background: linear-gradient(135deg, rgba(0, 0, 0, 0.85) 0%, rgba(88, 28, 135, 0.5) 50%, rgba(234, 179, 8, 0.2) 100%);
      border: 1px solid rgba(255, 255, 255, 0.15);
      clip-path: polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px));
      animation: window-glow 6s infinite ease-in-out;
      color: #f1f5f9; font-family: 'Segoe UI', system-ui, sans-serif; font-size: 13px;
      display: ${activeState.minimized ? 'none' : 'flex'};
      flex-direction: column;
      z-index: 9999;
      box-sizing: border-box;
    `;

    // Header Area
    const header = document.createElement('div');
    header.style.cssText = `
      padding: 12px 16px; cursor: move;
      display: flex; justify-content: space-between; align-items: center;
      background: rgba(0, 0, 0, 0.3);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      font-weight: 600; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: #eab308;
    `;
    header.innerHTML = `<span>🛰️ Avis Monitor</span>`;
    
    // Header Right Controls Group (Compile & Save, Load from Cookie, Download Cookie, Minimize)
    const headerRight = document.createElement('div');
    headerRight.style.cssText = 'display: flex; align-items: center; gap: 5px;';

    // 1. Compile & Save Settings Button
    const saveCookieBtn = document.createElement('button');
    saveCookieBtn.innerHTML = '⚙️🍪';
    saveCookieBtn.title = 'Compile Full Map & Save to Cookie';
    saveCookieBtn.style.cssText = createHeaderButtonStyle();
    saveCookieBtn.onclick = (e) => {
      e.stopPropagation();
      const compiled = compileSettings();
      setCookie('toast_log_state', compiled);
      window.AVISLog('SUCCESS', 'Full page map compiled and stored to cookie buffer.', 'AVIS');
    };

    // 2. Load from Cookie Button
    const loadCookieBtn = document.createElement('button');
    loadCookieBtn.innerHTML = '📥🍪';
    loadCookieBtn.title = 'Load Settings from Cookie';
    loadCookieBtn.style.cssText = createHeaderButtonStyle();
    loadCookieBtn.onclick = (e) => {
      e.stopPropagation();
      const stored = getCookie('toast_log_state');
      if (stored) {
        applySettings(stored);
        window.AVISLog('SUCCESS', 'Web page settings loaded from cookie successfully.', 'AVIS');
      } else {
        window.AVISLog('WARN', 'No saved cookie configuration found.', 'AVIS');
      }
    };

    // 3. Download Cookie File Button
    const downloadCookieBtn = document.createElement('button');
    downloadCookieBtn.innerHTML = '💾🍪';
    downloadCookieBtn.title = 'Download Full Map Cookie File (.json)';
    downloadCookieBtn.style.cssText = createHeaderButtonStyle();
    downloadCookieBtn.onclick = (e) => {
      e.stopPropagation();
      const currentData = getCookie('toast_log_state') || compileSettings();
      const blob = new Blob([JSON.stringify(currentData, null, 2)], {type:'application/json'});
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'avis_monitor_full_map.json';
      a.click();
      window.AVISLog('SUCCESS', 'Full map cookie state file downloaded to disk.', 'AVIS');
    };

    // Minimize Button
    const minimizeBtn = document.createElement('button');
    minimizeBtn.innerHTML = '&#x2014;';
    minimizeBtn.title = 'Minimize Monitor';
    minimizeBtn.style.cssText = `
      background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); 
      color: #a855f7; cursor: pointer; border-radius: 4px;
      width: 22px; height: 22px; display: flex; align-items: center; justify-content: center;
      font-size: 10px; transition: all 0.2s ease;
    `;
    minimizeBtn.onmouseover = () => { minimizeBtn.style.background = 'rgba(168, 85, 247, 0.2)'; minimizeBtn.style.color = '#fff'; };
    minimizeBtn.onmouseout = () => { minimizeBtn.style.background = 'rgba(255, 255, 255, 0.05)'; minimizeBtn.style.color = '#a855f7'; };
    minimizeBtn.onclick = (e) => { e.stopPropagation(); minimizeWindow(); };

    headerRight.appendChild(saveCookieBtn);
    headerRight.appendChild(loadCookieBtn);
    headerRight.appendChild(downloadCookieBtn);
    headerRight.appendChild(minimizeBtn);
    header.appendChild(headerRight);
    logWindow.appendChild(header);

    // Log Viewport
    logContent = document.createElement('div');
    logContent.className = 'modern-scroll';
    logContent.style.cssText = `
      flex: 1; overflow-y: auto; padding: 14px 18px;
      font-family: 'Fira Code', 'Courier New', monospace; font-size: 11px; line-height: 1.6;
    `;
    logWindow.appendChild(logContent);

    // Control Panel Footer
    const footer = document.createElement('div');
    footer.style.cssText = `
      padding: 10px 16px; display: flex; gap: 8px; justify-content: flex-end; 
      background: rgba(0, 0, 0, 0.4); border-top: 1px solid rgba(255, 255, 255, 0.08);
    `;
    footer.innerHTML = `
      <button class="log-btn">Copy</button>
      <button class="log-btn">Clear</button>
      <button class="log-btn">Download</button>
    `;
    logWindow.appendChild(footer);

    document.body.appendChild(logWindow);

    if (activeState.minimized) {
      createMinimizedIcon();
    }

    if (hasCookieState) {
      window.AVISLog('INFO', 'Saved cookie map configuration detected. Click "Load from Cookie" to apply.', 'AVIS');
    }

    const [copyBtn, clearBtn, downloadBtn] = footer.querySelectorAll('.log-btn');
    styleButtons([copyBtn, clearBtn, downloadBtn]);

    copyBtn.onclick = () => {
      navigator.clipboard.writeText(logContent.innerText);
      window.toastLog('<span style="color: #00f2ff;">[SYSTEM]</span> Buffer synchronized to host clipboard.');
    };
    clearBtn.onclick = () => { 
      logContent.innerHTML = ''; 
      window.toastLog('<span style="color: #00f2ff;">[SYSTEM]</span> Data stack cleared.');
    };
    downloadBtn.onclick = () => {
      const blob = new Blob([logContent.innerText], {type:'text/plain'});
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'nexus-stream.log';
      a.click();
    };

    // Drag Mechanics
    let offsetX, offsetY;
    header.onmousedown = (e) => {
      if (e.target.closest('button')) return;
      offsetX = e.clientX - logWindow.offsetLeft;
      offsetY = e.clientY - logWindow.offsetTop;
      document.onmousemove = (ev) => {
        logWindow.style.left = (ev.clientX - offsetX) + 'px';
        logWindow.style.top = (ev.clientY - offsetY) + 'px';
      };
      document.onmouseup = () => { 
        document.onmousemove = null; 
        saveWindowState();
      };
    };
  };

  function createHeaderButtonStyle() {
    return `
      background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); 
      color: #f1f5f9; cursor: pointer; border-radius: 4px;
      height: 22px; padding: 0 4px; display: flex; align-items: center; justify-content: center;
      font-size: 10px; transition: all 0.2s ease;
    `;
  }

  function createMinimizedIcon() {
    if (minimizedIcon) return;
    minimizedIcon = document.createElement('div');
    minimizedIcon.textContent = '🌌️';
    minimizedIcon.style.cssText = `
      position: fixed; bottom: 20px; right: 20px;
      width: 42px; height: 42px; 
      background: linear-gradient(135deg, rgba(88, 28, 135, 0.8) 0%, rgba(234, 179, 8, 0.8) 100%);
      border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 12px; 
      box-shadow: 0 4px 12px rgba(168, 85, 247, 0.4);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; font-size: 18px; z-index: 9999;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    `;
    minimizedIcon.onmouseover = () => { minimizedIcon.style.transform = 'scale(1.1) translateY(-2px)'; };
    minimizedIcon.onmouseout = () => { minimizedIcon.style.transform = 'scale(1)'; };
    minimizedIcon.onclick = () => {
      logWindow.style.display = 'flex';
      minimizedIcon.remove();
      minimizedIcon = null;
      saveWindowState();
    };
    document.body.appendChild(minimizedIcon);
  }

  function minimizeWindow() {
    logWindow.style.display = 'none';
    createMinimizedIcon();
    saveWindowState();
  }

  function styleButtons(btns) {
    btns.forEach(btn => {
      btn.style.cssText = `
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 20px;
        color: #f1f5f9;
        font-family: inherit; font-size: 11px; font-weight: 500;
        padding: 4px 12px; cursor: pointer;
        transition: all 0.2s ease;
      `;
      btn.onmouseover = () => { 
        btn.style.background = 'rgba(234, 179, 8, 0.15)'; 
        btn.style.borderColor = 'rgba(234, 179, 8, 0.4)';
        btn.style.color = '#eab308';
      };
      btn.onmouseout = () => { 
        btn.style.background = 'rgba(255, 255, 255, 0.04)'; 
        btn.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        btn.style.color = '#f1f5f9';
      };
    });
  }

  // === HTML-Enabled Toast Log Function ===
  window.toastLog = function(msg) {
    if (!logContent) {
      window.initLogWindow();
    }
    if (!logContent) return;

    const line = document.createElement('div');
    line.style.cssText = `
      padding: 6px 0; margin-bottom: 4px;
      color: rgba(241, 245, 249, 0.9);
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    `;
    
    const timeSpan = document.createElement('span');
    timeSpan.style.cssText = `color: #a855f7; margin-right: 8px; font-weight: 500; display: inline-block; vertical-align: top;`;
    timeSpan.textContent = `[${new Date().toLocaleTimeString()}]`;
    
    const contentSpan = document.createElement('div');
    contentSpan.style.cssText = `display: inline-block; vertical-align: top; width: calc(100% - 95px);`;
    contentSpan.innerHTML = msg;

    line.appendChild(timeSpan);
    line.appendChild(contentSpan);
    logContent.appendChild(line);
    logContent.scrollTop = logContent.scrollHeight;
  };

  // === AVISLog Bridge System ===
  window.AVISLog = function(level, message, subsystem = 'SYSTEM') {
    const upperLevel = (level || 'INFO').toUpperCase();
    const subTag = (subsystem || 'SYSTEM').toUpperCase();
    
    let color = '#00f2ff'; // Default cyan
    if (upperLevel === 'WARN' || upperLevel === 'WARNING') color = '#eab308'; // Gold
    if (upperLevel === 'ERROR' || upperLevel === 'FAIL') color = '#ef4444'; // Red
    if (upperLevel === 'SUCCESS' || upperLevel === 'OK') color = '#22c55e'; // Green

    const formattedHtml = `
        <span style="color: ${color}; font-weight: bold; margin-right: 4px;">[${upperLevel}]</span>
        <span style="color: #a855f7; margin-right: 4px;">{${subTag}}</span>
        <span style="color: #f1f5f9;">${message}</span>
    `;

    window.toastLog(formattedHtml);
  };

  // Auto-hook into existing console logging for unhandled errors
  const originalConsoleError = console.error;
  console.error = function(...args) {
      originalConsoleError.apply(console, args);
      window.AVISLog('ERROR', args.join(' '), 'CONSOLE');
  };

  // Automatically initialize on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.initLogWindow();
      window.AVISLog('SUCCESS', 'AVIS monitoring subsystem fully bridged to toast log renderer.', 'AVIS');
    });
  } else {
    window.initLogWindow();
    window.AVISLog('SUCCESS', 'AVIS monitoring subsystem fully bridged to toast log renderer.', 'AVIS');
  }
})();
/* ================================================================= *
 * RRU & AVIS - Instantiable Monitor, Toast Log & Bridge System      *
 * Operator: CVBGOD                                                  *
 * ================================================================= *
 */

class AvisMonitorWindow {
    constructor(instanceId = 'avis_default', initialPosition = { top: '407px', left: '1327px' }) {
        this.instanceId = instanceId;
        this.cookieName = `avis_monitor_state_${this.instanceId}`;
        this.logWindow = null;
        this.logContent = null;
        this.minimizedIcon = null;
        this.initialPosition = initialPosition;

        this.initStyles();
        this.initWindow();

        // Expose globally for cross-script telemetry access
        if (typeof window !== 'undefined') {
            if (!window.avisMonitors) window.avisMonitors = {};
            window.avisMonitors[this.instanceId] = this;
            if (instanceId === 'avis_default' || !window.avisMonitor) {
                window.avisMonitor = this;
            }
        }
    }

    // Cookie Helper Functions (Scoped per instance)
    setCookie(value, days = 7) {
        const d = new Date();
        d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = "expires=" + d.toUTCString();
        document.cookie = `${this.cookieName}=${encodeURIComponent(JSON.stringify(value))};${expires};path=/;SameSite=Strict`;
    }

    getCookie() {
        const nameEQ = this.cookieName + "=";
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

    compileSettings() {
        const elementsMap = [];
        document.querySelectorAll('div, button, input, form, canvas, section, header, footer').forEach((el) => {
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
                top: this.logWindow ? this.logWindow.style.top : this.initialPosition.top,
                left: this.logWindow ? this.logWindow.style.left : this.initialPosition.left,
                minimized: this.logWindow ? this.logWindow.style.display === 'none' : false
            },
            timestamp: new Date().toISOString(),
            url: window.location.href,
            viewport: { width: window.innerWidth, height: window.innerHeight },
            documentMap: elementsMap
        };
    }

    applySettings(settings) {
        if (!settings || !this.logWindow) return false;
        if (settings.windowState) {
            this.logWindow.style.top = settings.windowState.top || this.initialPosition.top;
            this.logWindow.style.left = settings.windowState.left || this.initialPosition.left;
            if (settings.windowState.minimized && this.logWindow.style.display !== 'none') {
                this.minimizeWindow();
            } else if (!settings.windowState.minimized && this.logWindow.style.display === 'none') {
                if (this.minimizedIcon) {
                    this.minimizedIcon.click();
                } else {
                    this.logWindow.style.display = 'flex';
                }
            }
        }
        return true;
    }

    saveWindowState() {
        if (!this.logWindow) return;
        const settings = this.compileSettings();
        this.setCookie(settings);
    }

    initStyles() {
        if (!document.getElementById('avis-monitor-global-styles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'avis-monitor-global-styles';
            styleSheet.textContent = `
                @keyframes avis-window-glow {
                    0% { filter: drop-shadow(0 4px 10px rgba(0, 242, 255, 0.25)); }
                    50% { filter: drop-shadow(0 4px 20px rgba(234, 179, 8, 0.35)); }
                    100% { filter: drop-shadow(0 4px 10px rgba(0, 242, 255, 0.25)); }
                }
                .avis-modern-scroll::-webkit-scrollbar { width: 5px; }
                .avis-modern-scroll::-webkit-scrollbar-track { background: transparent; }
                .avis-modern-scroll::-webkit-scrollbar-thumb { background: rgba(234, 179, 8, 0.3); border-radius: 10px; }
                .avis-modern-scroll::-webkit-scrollbar-thumb:hover { background: rgba(0, 242, 255, 0.8); }
            `;
            document.head.appendChild(styleSheet);
        }
    }

    initWindow() {
        if (this.logWindow) return;
        const savedState = this.getCookie();
        const activeState = savedState?.windowState || { top: this.initialPosition.top, left: this.initialPosition.left, minimized: false };

        // Main Window Layout
        this.logWindow = document.createElement('div');
        this.logWindow.id = `avis-monitor-${this.instanceId}`;
        this.logWindow.style.cssText = `
            position: fixed; top: ${activeState.top}; left: ${activeState.left};
            width: 480px; height: 360px;
            background: linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(10, 25, 47, 0.7) 50%, rgba(234, 179, 8, 0.15) 100%);
            border: 1px solid rgba(0, 242, 255, 0.2);
            clip-path: polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px));
            animation: avis-window-glow 6s infinite ease-in-out;
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
            background: rgba(0, 0, 0, 0.4);
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            font-weight: 600; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: #00f2ff;
        `;
        header.innerHTML = `<span>🛰️ AVIS Monitor [${this.instanceId}]</span>`;

        const headerRight = document.createElement('div');
        headerRight.style.cssText = 'display: flex; align-items: center; gap: 5px;';

        const saveCookieBtn = document.createElement('button');
        saveCookieBtn.innerHTML = '⚙️🍪';
        saveCookieBtn.title = 'Compile Map & Save to Cookie';
        saveCookieBtn.style.cssText = this.getHeaderButtonStyle();
        saveCookieBtn.onclick = (e) => {
            e.stopPropagation();
            const compiled = this.compileSettings();
            this.setCookie(compiled);
            this.log('SUCCESS', 'Full page map compiled and stored to instance cookie buffer.', 'AVIS');
        };

        const loadCookieBtn = document.createElement('button');
        loadCookieBtn.innerHTML = '📥🍪';
        loadCookieBtn.title = 'Load Settings from Cookie';
        loadCookieBtn.style.cssText = this.getHeaderButtonStyle();
        loadCookieBtn.onclick = (e) => {
            e.stopPropagation();
            const stored = this.getCookie();
            if (stored) {
                this.applySettings(stored);
                this.log('SUCCESS', 'Settings loaded from cookie successfully.', 'AVIS');
            } else {
                this.log('WARN', 'No saved cookie configuration found for this instance.', 'AVIS');
            }
        };

        const downloadCookieBtn = document.createElement('button');
        downloadCookieBtn.innerHTML = '💾🍪';
        downloadCookieBtn.title = 'Download Full Map Cookie File (.json)';
        downloadCookieBtn.style.cssText = this.getHeaderButtonStyle();
        downloadCookieBtn.onclick = (e) => {
            e.stopPropagation();
            const currentData = this.getCookie() || this.compileSettings();
            const blob = new Blob([JSON.stringify(currentData, null, 2)], { type: 'application/json' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `avis_monitor_${this.instanceId}_map.json`;
            a.click();
            this.log('SUCCESS', 'Full map state file downloaded to disk.', 'AVIS');
        };

        const minimizeBtn = document.createElement('button');
        minimizeBtn.innerHTML = '&#x2014;';
        minimizeBtn.title = 'Minimize Monitor';
        minimizeBtn.style.cssText = `
            background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); 
            color: #00f2ff; cursor: pointer; border-radius: 4px;
            width: 22px; height: 22px; display: flex; align-items: center; justify-content: center;
            font-size: 10px; transition: all 0.2s ease;
        `;
        minimizeBtn.onclick = (e) => { e.stopPropagation(); this.minimizeWindow(); };

        headerRight.appendChild(saveCookieBtn);
        headerRight.appendChild(loadCookieBtn);
        headerRight.appendChild(downloadCookieBtn);
        headerRight.appendChild(minimizeBtn);
        header.appendChild(headerRight);
        this.logWindow.appendChild(header);

        // Log Viewport
        this.logContent = document.createElement('div');
        this.logContent.className = 'avis-modern-scroll';
        this.logContent.style.cssText = `
            flex: 1; overflow-y: auto; padding: 14px 18px;
            font-family: 'Fira Code', 'Courier New', monospace; font-size: 11px; line-height: 1.6;
        `;
        this.logWindow.appendChild(this.logContent);

        // Control Panel Footer with explicitly scoped button references
        const footer = document.createElement('div');
        footer.style.cssText = `
            padding: 10px 16px; display: flex; gap: 8px; justify-content: flex-end; 
            background: rgba(0, 0, 0, 0.4); border-top: 1px solid rgba(255, 255, 255, 0.08);
        `;

        const copyBtn = document.createElement('button');
        copyBtn.textContent = 'Copy';
        const clearBtn = document.createElement('button');
        clearBtn.textContent = 'Clear';
        const downloadBtn = document.createElement('button');
        downloadBtn.textContent = 'Download';

        footer.appendChild(copyBtn);
        footer.appendChild(clearBtn);
        footer.appendChild(downloadBtn);
        this.logWindow.appendChild(footer);

        document.body.appendChild(this.logWindow);

        if (activeState.minimized) {
            this.createMinimizedIcon();
        }

        this.styleButtons([copyBtn, clearBtn, downloadBtn]);

        copyBtn.onclick = () => {
            navigator.clipboard.writeText(this.logContent.innerText);
            this.toastLog('<span style="color: #00f2ff;">[SYSTEM]</span> Buffer synchronized to host clipboard.');
        };
        clearBtn.onclick = () => { 
            this.logContent.innerHTML = ''; 
            this.toastLog('<span style="color: #00f2ff;">[SYSTEM]</span> Data stack cleared.');
        };
        downloadBtn.onclick = () => {
            const blob = new Blob([this.logContent.innerText], { type: 'text/plain' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `nexus-stream-${this.instanceId}.log`;
            a.click();
        };

        // Drag Mechanics
        let offsetX, offsetY;
        header.onmousedown = (e) => {
            if (e.target.closest('button')) return;
            offsetX = e.clientX - this.logWindow.offsetLeft;
            offsetY = e.clientY - this.logWindow.offsetTop;
            document.onmousemove = (ev) => {
                this.logWindow.style.left = (ev.clientX - offsetX) + 'px';
                this.logWindow.style.top = (ev.clientY - offsetY) + 'px';
            };
            document.onmouseup = () => { 
                document.onmousemove = null; 
                this.saveWindowState();
            };
        };

        this.log('SUCCESS', `AVIS Monitor instance [${this.instanceId}] successfully initialized.`, 'AVIS');
    }

    getHeaderButtonStyle() {
        return `
            background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); 
            color: #f1f5f9; cursor: pointer; border-radius: 4px;
            height: 22px; padding: 0 4px; display: flex; align-items: center; justify-content: center;
            font-size: 10px; transition: all 0.2s ease;
        `;
    }

    createMinimizedIcon() {
        if (this.minimizedIcon) return;
        this.minimizedIcon = document.createElement('div');
        this.minimizedIcon.textContent = '🌌️';
        this.minimizedIcon.style.cssText = `
            position: fixed; bottom: 20px; right: ${20 + (Math.random() * 50)}px;
            width: 42px; height: 42px; 
            background: linear-gradient(135deg, rgba(0, 242, 255, 0.8) 0%, rgba(234, 179, 8, 0.8) 100%);
            border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 12px; 
            box-shadow: 0 4px 12px rgba(0, 242, 255, 0.4);
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; font-size: 18px; z-index: 9999;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        `;
        this.minimizedIcon.onmouseover = () => { this.minimizedIcon.style.transform = 'scale(1.1) translateY(-2px)'; };
        this.minimizedIcon.onmouseout = () => { this.minimizedIcon.style.transform = 'scale(1)'; };
        this.minimizedIcon.onclick = () => {
            this.logWindow.style.display = 'flex';
            this.minimizedIcon.remove();
            this.minimizedIcon = null;
            this.saveWindowState();
        };
        document.body.appendChild(this.minimizedIcon);
    }

    minimizeWindow() {
        this.logWindow.style.display = 'none';
        this.createMinimizedIcon();
        this.saveWindowState();
    }

    styleButtons(btns) {
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
                btn.style.background = 'rgba(0, 242, 255, 0.15)'; 
                btn.style.borderColor = 'rgba(0, 242, 255, 0.4)';
                btn.style.color = '#00f2ff';
            };
            btn.onmouseout = () => { 
                btn.style.background = 'rgba(255, 255, 255, 0.04)'; 
                btn.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                btn.style.color = '#f1f5f9';
            };
        });
    }

    toastLog(msg) {
        if (!this.logContent) return;

        const line = document.createElement('div');
        line.style.cssText = `
            padding: 6px 0; margin-bottom: 4px;
            color: rgba(241, 245, 249, 0.9);
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        `;
        
        const timeSpan = document.createElement('span');
        timeSpan.style.cssText = `color: #00f2ff; margin-right: 8px; font-weight: 500; display: inline-block; vertical-align: top;`;
        timeSpan.textContent = `[${new Date().toLocaleTimeString()}]`;
        
        const contentSpan = document.createElement('div');
        contentSpan.style.cssText = `display: inline-block; vertical-align: top; width: calc(100% - 95px);`;
        contentSpan.innerHTML = msg;

        line.appendChild(timeSpan);
        line.appendChild(contentSpan);
        this.logContent.appendChild(line);
        this.logContent.scrollTop = this.logContent.scrollHeight;
    }

    log(level, message, subsystem = 'SYSTEM') {
        const upperLevel = (level || 'INFO').toUpperCase();
        const subTag = (subsystem || 'SYSTEM').toUpperCase();
        
        let color = '#00f2ff'; // Cyan
        if (upperLevel === 'WARN' || upperLevel === 'WARNING') color = '#eab308'; // Gold
        if (upperLevel === 'ERROR' || upperLevel === 'FAIL') color = '#ef4444'; // Red
        if (upperLevel === 'SUCCESS' || upperLevel === 'OK') color = '#22c55e'; // Green

        const formattedHtml = `
            <span style="color: ${color}; font-weight: bold; margin-right: 4px;">[${upperLevel}]</span>
            <span style="color: #eab308; margin-right: 4px;">{${subTag}}</span>
            <span style="color: #f1f5f9;">${message}</span>
        `;

        this.toastLog(formattedHtml);
    }
}
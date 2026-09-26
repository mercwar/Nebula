/* ================================================================= *
 * RRU & AVIS - Window Instantiator Controller (`avis.js`)          *
 * Operator: CVBGOD                                                  *
 * ================================================================= *
 */

class AvisMonitorWindow {
    constructor(shellId = 'avis-monitor-shell') {
        this.shellId = shellId;
        this.cookieName = `avis_monitor_state_shell`;
        
        this.logWindow = document.getElementById(this.shellId);
        this.header = document.getElementById('avis-shell-header');
        this.logContent = document.getElementById('avis-shell-content');
        this.minimizedIcon = null;

        if (!this.logWindow) {
            console.warn(`AvisMonitorWindow: Shell element #${this.shellId} not found in DOM.`);
            return;
        }

        this.initBindings();
        this.loadSavedState();

        if (typeof window !== 'undefined') {
            window.avisMonitorInstance = this;
        }
    }

    // Opens the empty window shell
    openWindow() {
        if (this.logWindow) {
            this.logWindow.style.display = 'flex';
            if (this.minimizedIcon) {
                this.minimizedIcon.remove();
                this.minimizedIcon = null;
            }
            this.saveWindowState();
        }
    }

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
        return {
            windowState: {
                top: this.logWindow.style.top,
                left: this.logWindow.style.left,
                minimized: this.logWindow.style.display === 'none'
            },
            timestamp: new Date().toISOString()
        };
    }

    applySettings(settings) {
        if (!settings || !this.logWindow) return false;
        if (settings.windowState) {
            this.logWindow.style.top = settings.windowState.top || '407px';
            this.logWindow.style.left = settings.windowState.left || '1327px';
            if (settings.windowState.minimized) {
                this.minimizeWindow();
            } else {
                this.openWindow();
            }
        }
        return true;
    }

    saveWindowState() {
        if (!this.logWindow) return;
        this.setCookie(this.compileSettings());
    }

    loadSavedState() {
        const stored = this.getCookie();
        if (stored) {
            this.applySettings(stored);
        }
    }

    initBindings() {
        const saveCookieBtn = this.logWindow.querySelector('.avis-save-btn');
        const loadCookieBtn = this.logWindow.querySelector('.avis-load-btn');
        const downloadCookieBtn = this.logWindow.querySelector('.avis-download-map-btn');
        const minimizeBtn = this.logWindow.querySelector('.avis-minimize-btn');
        
        const copyBtn = this.logWindow.querySelector('.avis-copy-btn');
        const clearBtn = this.logWindow.querySelector('.avis-clear-btn');
        const downloadBtn = this.logWindow.querySelector('.avis-download-btn');

        if (saveCookieBtn) {
            saveCookieBtn.onclick = (e) => { e.stopPropagation(); this.setCookie(this.compileSettings()); };
        }
        if (loadCookieBtn) {
            loadCookieBtn.onclick = (e) => { e.stopPropagation(); const stored = this.getCookie(); if (stored) this.applySettings(stored); };
        }
        if (downloadCookieBtn) {
            downloadCookieBtn.onclick = (e) => {
                e.stopPropagation();
                const blob = new Blob([JSON.stringify(this.getCookie() || this.compileSettings(), null, 2)], { type: 'application/json' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = 'avis_monitor_map.json';
                a.click();
            };
        }
        if (minimizeBtn) {
            minimizeBtn.onclick = (e) => { e.stopPropagation(); this.minimizeWindow(); };
        }
        if (copyBtn) {
            copyBtn.onclick = () => navigator.clipboard.writeText(this.logContent.innerText);
        }
        if (clearBtn) {
            clearBtn.onclick = () => { this.logContent.innerHTML = ''; };
        }
        if (downloadBtn) {
            downloadBtn.onclick = () => {
                const blob = new Blob([this.logContent.innerText], { type: 'text/plain' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = 'nexus-stream.log';
                a.click();
            };
        }

        // Drag Mechanics
        if (this.header) {
            let offsetX, offsetY;
            this.header.onmousedown = (e) => {
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
        }
    }

    createMinimizedIcon() {
        if (this.minimizedIcon) return;
        this.minimizedIcon = document.createElement('div');
        this.minimizedIcon.className = 'avis-minimized-icon';
        this.minimizedIcon.textContent = '🌌️';
        this.minimizedIcon.style.right = '40px';
        this.minimizedIcon.onclick = () => this.openWindow();
        document.body.appendChild(this.minimizedIcon);
    }

    minimizeWindow() {
        if (this.logWindow) {
            this.logWindow.style.display = 'none';
            this.createMinimizedIcon();
            this.saveWindowState();
        }
    }
}

// Automatically instantiate controller on load
document.addEventListener('DOMContentLoaded', () => {
    window.avisWindowController = new AvisMonitorWindow();
});
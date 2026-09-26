/* ================================================================= *
 * RRU - NEB Storage, Auto-Compile & Environment Controller         *
 * ================================================================= */

(function () {
    'use strict';

    const COOKIE_NAME = 'rru_active_neb';

    // Stub for loading a .neb file directly from a URL parameter/path
    function loadNebFromFile(nebPath) {
        console.log(`[RRUNebStore] Loading .neb from file source: ${nebPath}`);
        // TODO: Implement your fetch/XHR logic to load the physical .neb file here
        return null;
    }

    // Unified NEB Storage & Environment Controller
    window.RRUNebStore = {
        currentNebData: null,
        mode: 'development', // 'development' or 'publication'

        init() {
            const urlParams = new URLSearchParams(window.location.search);
            const nebQuery = urlParams.get('neb');

            // 1. If &neb= is set in the GET query, ignore cookie and load the .neb file
            if (nebQuery) {
                this.mode = 'publication';
                console.log('[RRUNebStore] &neb= parameter detected. Ignoring cookie.');
                this.currentNebData = loadNebFromFile(nebQuery);
            } else {
                // 2. Otherwise, load development copy from cookie
                this.mode = 'development';
                if (typeof getCookie === 'function') {
                    const savedCookieData = getCookie(COOKIE_NAME);
                    if (savedCookieData) {
                        this.currentNebData = savedCookieData;
                        console.log('[RRUNebStore] Development copy loaded from cookie.');
                    }
                }
            }

            // Dispatch event if data was successfully loaded on startup
            if (this.currentNebData) {
                window.dispatchEvent(new CustomEvent('neb-loaded', { 
                    detail: { data: this.currentNebData, mode: this.mode } 
                }));
            }
        },

        // Compile current workspace state into a .neb object and persist to cookie
        compileAndSave() {
            if (this.mode === 'publication') return; // Don't overwrite cookies when viewing a static publication link

            const nebObject = {
                version: "2026.05",
                timestamp: new Date().toISOString(),
                elevation: window.RRUMap ? window.RRUMap.gridElevation : 0,
                nodes: window.atoms ? window.atoms.map((node, index) => ({
                    id: node.id || index,
                    type: node.cardType || node.type || 'stargate',
                    position: node.position ? { x: node.position.x, y: node.position.y, z: node.position.z } : null,
                    rotation: node.rotation ? { x: node.rotation.x, y: node.rotation.y, z: node.rotation.z } : null,
                    hue: node.hue !== undefined ? node.hue : 185,
                    innerHue: node.innerHue !== undefined ? node.innerHue : 230,
                    scale: node.scaleMultiplier !== undefined ? node.scaleMultiplier : 1.0,
                    cardData: node.cardData || {}
                })) : []
            };

            this.currentNebData = nebObject;
            if (typeof setCookie === 'function') {
                setCookie(COOKIE_NAME, nebObject, 30);
                console.log('[RRUNebStore] Design action detected — .neb re-compiled and cookie updated.');
            }
        }
    };

    // Automatically initialize on DOM load
    window.addEventListener('DOMContentLoaded', () => {
        window.RRUNebStore.init();

        // --- Auto-Compile Hook on Design Actions ---
        // Listens to standard events or you can call window.RRUNebStore.compileAndSave() directly after mutations
        const triggerEvents = ['input', 'change', 'click'];
        document.addEventListener('input', (e) => {
            // Check if action took place inside tracker panel, node designer, or map controls
            if (e.target.closest('#rru-tracker-panel') || e.target.closest('.node-designer') || e.target.closest('.map-controls')) {
                window.RRUNebStore.compileAndSave();
            }
        });
    });

    // Global listener for explicit structural mutations (add/delete node)
    window.addEventListener('rru-node-modified', () => {
        window.RRUNebStore.compileAndSave();
    });
})();
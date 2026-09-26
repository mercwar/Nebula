/* ================================================================= *
 * RRU & AVIS - Developer Form Component (dev_form.js) - Null Safe   *
 * Operator: Robo Rook                                               *
 * ================================================================= */

class AvisDevFormModule {
    constructor(instanceId = 'primary_inspector', initialPosition = { top: '100px', left: 'calc(100vw - 420px)' }) {
        this.instanceId = instanceId;
        this.cookieName = `avis_dev_form_state_${this.instanceId}`;
        this.windowEl = null;
        this.initialPosition = initialPosition;
        this.callbacks = {};
        this.selectedObject = null; // Target runtime object reference

        this.initStyles();
        this.initWindow();
        this.bindEvents();
    }

    initStyles() {
        if (!document.getElementById('avis-dev-form-global-styles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'avis-dev-form-global-styles';
            styleSheet.textContent = `
                @keyframes avis-dev-glow {
                    0% { filter: drop-shadow(0 4px 10px rgba(0, 242, 255, 0.25)); }
                    50% { filter: drop-shadow(0 4px 20px rgba(234, 179, 8, 0.35)); }
                    100% { filter: drop-shadow(0 4px 10px rgba(0, 242, 255, 0.25)); }
                }
                .avis-dev-scroll::-webkit-scrollbar { width: 5px; }
                .avis-dev-scroll::-webkit-scrollbar-track { background: transparent; }
                .avis-dev-scroll::-webkit-scrollbar-thumb { background: rgba(234, 179, 8, 0.3); border-radius: 10px; }
                .avis-dev-scroll::-webkit-scrollbar-thumb:hover { background: rgba(0, 242, 255, 0.8); }

                .rru-dev-panel {
                    position: fixed;
                    width: 380px;
                    max-height: 90vh;
                    background: linear-gradient(135deg, rgba(0, 0, 0, 0.92) 0%, rgba(10, 25, 47, 0.8) 50%, rgba(168, 85, 247, 0.2) 100%);
                    border: 1px solid rgba(0, 242, 255, 0.25);
                    clip-path: polygon(0 0, calc(100% - 15px) 0, 100% 15px, 100% 100%, 15px 100%, 0 calc(100% - 15px));
                    animation: avis-dev-glow 6s infinite ease-in-out;
                    color: #f1f5f9;
                    font-family: 'Segoe UI', system-ui, sans-serif;
                    font-size: 12px;
                    display: flex;
                    flex-direction: column;
                    z-index: 9999;
                    box-sizing: border-box;
                }
                .rru-panel-header {
                    padding: 12px 16px;
                    cursor: move;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: rgba(0, 0, 0, 0.4);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                }
                .rru-panel-header h3 {
                    margin: 0;
                    font-size: 11px;
                    letter-spacing: 1.5px;
                    text-transform: uppercase;
                    color: #00f2ff;
                }
                .rru-btn-close {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: #00f2ff;
                    width: 22px;
                    height: 22px;
                    border-radius: 4px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                }
                .rru-btn-close:hover {
                    background: rgba(239, 68, 68, 0.3);
                    border-color: #ef4444;
                    color: #fff;
                }
                .rru-panel-body {
                    flex: 1;
                    overflow-y: auto;
                    padding: 14px 18px;
                }
                .rru-field-group {
                    margin-bottom: 12px;
                }
                .rru-field-group label {
                    display: block;
                    font-size: 11px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    color: #00f2ff;
                    margin-bottom: 4px;
                }
                .rru-field-group input[type="text"],
                .rru-field-group textarea {
                    width: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    color: #f1f5f9;
                    padding: 6px 10px;
                    border-radius: 4px;
                    font-family: inherit;
                    font-size: 12px;
                    box-sizing: border-box;
                }
                .rru-field-group input[type="text"]:focus,
                .rru-field-group textarea:focus {
                    outline: none;
                    border-color: #00f2ff;
                    box-shadow: 0 0 8px rgba(0, 242, 255, 0.3);
                }
                .rru-field-group input[type="range"] {
                    width: 100%;
                    accent-color: #eab308;
                    cursor: pointer;
                }
                .rru-btn-row {
                    display: flex;
                    gap: 8px;
                    margin-top: 15px;
                }
                .rru-btn {
                    flex: 1;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    color: #f1f5f9;
                    padding: 6px 10px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 11px;
                    font-weight: 600;
                    text-transform: uppercase;
                    transition: all 0.2s ease;
                }
                .rru-btn:hover {
                    background: rgba(0, 242, 255, 0.2);
                    border-color: #00f2ff;
                    color: #00f2ff;
                }
                .rru-btn.primary {
                    background: rgba(234, 179, 8, 0.2);
                    border-color: rgba(234, 179, 8, 0.5);
                    color: #eab308;
                }
                .rru-btn.primary:hover {
                    background: rgba(234, 179, 8, 0.4);
                    color: #fff;
                }
                .rru-btn.danger {
                    background: rgba(239, 68, 68, 0.2);
                    border-color: rgba(239, 68, 68, 0.5);
                    color: #ef4444;
                }
                .rru-btn.danger:hover {
                    background: rgba(239, 68, 68, 0.4);
                    color: #fff;
                }
                .rru-toolbar-section,
                .rru-cookie-section {
                    margin-top: 15px;
                    padding-top: 12px;
                    border-top: 1px solid rgba(255, 255, 255, 0.08);
                }
                .rru-toolbar-section h4,
                .rru-cookie-section h4 {
                    font-size: 11px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    color: #eab308;
                    margin-bottom: 8px;
                }
                .rru-spawn-buttons {
                    display: flex;
                    gap: 6px;
                }
                .spawn-btn {
                    flex: 1;
                    background: rgba(0, 242, 255, 0.1);
                    border: 1px dashed rgba(0, 242, 255, 0.4);
                    color: #00f2ff;
                    padding: 6px;
                    border-radius: 4px;
                    cursor: grab;
                    font-size: 10px;
                    text-align: center;
                    transition: all 0.2s ease;
                }
                .spawn-btn:hover {
                    background: rgba(0, 242, 255, 0.25);
                    border-color: #00f2ff;
                }
                .spawn-btn:active {
                    cursor: grabbing;
                }
            `;
            document.head.appendChild(styleSheet);
        }
    }

    initWindow() {
        if (this.windowEl) return;

        this.windowEl = document.createElement('div');
        this.windowEl.id = `dev-form-panel-${this.instanceId}`;
        this.windowEl.className = 'rru-dev-panel';
        this.windowEl.style.top = this.initialPosition.top;
        this.windowEl.style.left = this.initialPosition.left;

        this.windowEl.innerHTML = `
            <div class="rru-panel-header">
                <h3>RRU Node Inspector & Editor [${this.instanceId}]</h3>
                <button id="dev-close-btn-${this.instanceId}" class="rru-btn-close">&times;</button>
            </div>
            <div class="rru-panel-body avis-dev-scroll">
                <form id="node-config-form-${this.instanceId}">
                    <input type="hidden" id="edit-node-id-${this.instanceId}">
                    
                    <div class="rru-field-group">
                        <label>Item Title</label>
                        <input type="text" id="node-title-${this.instanceId}" placeholder="Enter item title...">
                    </div>

                    <div class="rru-field-group">
                        <label>Item Description / Info</label>
                        <textarea id="node-desc-${this.instanceId}" rows="3" placeholder="Enter telemetry & item metadata..."></textarea>
                    </div>

                    <div class="rru-field-group">
                        <label>Outer Hue (<span id="val-hue-${this.instanceId}">185</span>°)</label>
                        <input type="range" id="node-hue-${this.instanceId}" min="0" max="360" value="185">
                    </div>

                    <div class="rru-field-group">
                        <label>Inner Hue (<span id="val-inner-hue-${this.instanceId}">230</span>°)</label>
                        <input type="range" id="node-inner-hue-${this.instanceId}" min="0" max="360" value="230">
                    </div>

                    <div class="rru-field-group">
                        <label>Object Scale (<span id="val-scale-${this.instanceId}">1.0</span>x)</label>
                        <input type="range" id="node-scale-${this.instanceId}" min="0.2" max="3.0" step="0.1" value="1.0">
                    </div>

                    <div class="rru-field-group">
                        <label>Rotation Z (<span id="val-rotation-${this.instanceId}">0</span>°)</label>
                        <input type="range" id="node-rotation-${this.instanceId}" min="0" max="360" value="0">
                    </div>

                    <div class="rru-btn-row">
                        <button type="button" id="btn-save-item-${this.instanceId}" class="rru-btn primary">Save Item Info</button>
                        <button type="button" id="btn-delete-node-${this.instanceId}" class="rru-btn danger">Delete Node</button>
                    </div>
                </form>

                <div class="rru-toolbar-section">
                    <h4>Deploy Toolbar</h4>
                    <div class="rru-spawn-buttons">
                        <button class="spawn-btn" draggable="true" data-type="sign" data-spawn="sign">Drop Sign</button>
                        <button class="spawn-btn" draggable="true" data-type="fire-gem" data-spawn="fire-gem">Drop Fire Gem</button>
                        <button class="spawn-btn" draggable="true" data-type="atom" data-spawn="atom">Drop Atom</button>
                    </div>
                </div>

                <div class="rru-cookie-section">
                    <h4>Cookie & Storage Manager</h4>
                    <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                        <button type="button" id="btn-compile-cookies-${this.instanceId}" class="rru-btn">Compile</button>
                        <button type="button" id="btn-load-cookies-${this.instanceId}" class="rru-btn">Load</button>
                        <button type="button" id="btn-clear-cookies-${this.instanceId}" class="rru-btn danger" style="flex: 1 0 100%;">Clear Cookies</button>
                        <button type="button" id="btn-copy-clipboard-${this.instanceId}" class="rru-btn" style="flex: 1;">Copy State</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(this.windowEl);
    }

    bindEvents() {
        const id = this.instanceId;
        const header = this.windowEl.querySelector('.rru-panel-header');
        
        let offsetX, offsetY;
        header.onmousedown = (e) => {
            if (e.target.closest('button')) return;
            offsetX = e.clientX - this.windowEl.offsetLeft;
            offsetY = e.clientY - this.windowEl.offsetTop;
            
            document.onmousemove = (ev) => {
                this.windowEl.style.left = (ev.clientX - offsetX) + 'px';
                this.windowEl.style.top = (ev.clientY - offsetY) + 'px';
            };
            document.onmouseup = () => {
                document.onmousemove = null;
                document.onmouseup = null;
            };
        };

        document.getElementById(`dev-close-btn-${id}`).onclick = () => {
            this.windowEl.style.display = 'none';
            if (this.callbacks['close']) this.callbacks['close']();
        };

        const sliderMappings = [
            { type: 'hue', sliderId: `node-hue-${id}`, spanId: `val-hue-${id}` },
            { type: 'innerHue', sliderId: `node-inner-hue-${id}`, spanId: `val-inner-hue-${id}` },
            { type: 'scale', sliderId: `node-scale-${id}`, spanId: `val-scale-${id}` },
            { type: 'rotation', sliderId: `node-rotation-${id}`, spanId: `val-rotation-${id}` }
        ];

        sliderMappings.forEach(m => {
            const slider = document.getElementById(m.sliderId);
            const span = document.getElementById(m.spanId);
            if (slider && span) {
                slider.oninput = () => {
                    span.textContent = slider.value;
                    const val = parseFloat(slider.value);
                    
                    if (this.selectedObject) {
                        if (m.type === 'hue' && typeof this.selectedObject.updateHue === 'function') {
                            this.selectedObject.updateHue(val);
                        } else if (m.type === 'innerHue' && typeof this.selectedObject.setInnerHue === 'function') {
                            this.selectedObject.setInnerHue(val);
                        } else if (m.type === 'scale' && typeof this.selectedObject.setScale === 'function') {
                            this.selectedObject.setScale(val);
                        } else if (m.type === 'rotation' && this.selectedObject.group) {
                            this.selectedObject.group.rotation.z = THREE.MathUtils.degToRad(val);
                        }
                    }

                    if (this.callbacks['change']) {
                        this.callbacks['change']({ type: m.type, value: slider.value, data: this.getFormData(), target: this.selectedObject });
                    }
                };
            }
        });

        this.windowEl.querySelectorAll('.spawn-btn').forEach(btn => {
            btn.ondragstart = (e) => {
                e.dataTransfer.setData('text/plain', btn.getAttribute('data-spawn'));
                if (this.callbacks['dragstart']) this.callbacks['dragstart'](e, btn.getAttribute('data-spawn'));
            };
        });

        document.getElementById(`btn-save-item-${id}`).onclick = () => {
            if (this.selectedObject) {
                const formData = this.getFormData();
                this.selectedObject.title = formData.title;
                this.selectedObject.description = formData.description;
                if (!this.selectedObject.cardData) this.selectedObject.cardData = {};
                this.selectedObject.cardData.title = formData.title;
                this.selectedObject.cardData.description = formData.description;
            }
            if (this.callbacks['save']) this.callbacks['save'](this.getFormData(), this.selectedObject);
        };

        document.getElementById(`btn-delete-node-${id}`).onclick = () => {
            const nodeId = document.getElementById(`edit-node-id-${id}`).value;
            if (this.callbacks['delete']) this.callbacks['delete'](nodeId, this.selectedObject);
        };

        document.getElementById(`btn-compile-cookies-${id}`).onclick = () => {
            if (typeof compileNetworkState === 'function') {
                compileNetworkState();
            } else {
                this.saveToCookie();
            }
            if (this.callbacks['compile']) this.callbacks['compile'](this.getFormData());
        };

        document.getElementById(`btn-load-cookies-${id}`).onclick = () => {
            let data = null;
            if (typeof loadNodesFromCookies === 'function') {
                data = loadNodesFromCookies();
            } else {
                data = this.loadFromCookie();
            }
            if (data) {
                this.setFormData(data);
            }
            if (this.callbacks['load']) this.callbacks['load'](data);
        };

        document.getElementById(`btn-clear-cookies-${id}`).onclick = () => {
            this.clearCookie();
            if (typeof clearNodesFromCookies === 'function') {
                clearNodesFromCookies();
            }
            if (this.callbacks['clearCookies']) this.callbacks['clearCookies']();
        };

        document.getElementById(`btn-copy-clipboard-${id}`).onclick = () => {
            if (typeof copyNetworkStateToClipboard === 'function') {
                copyNetworkStateToClipboard();
            } else {
                const jsonStr = JSON.stringify(this.getFormData(), null, 2);
                navigator.clipboard.writeText(jsonStr).then(() => {
                    if (this.callbacks['copy']) this.callbacks['copy'](jsonStr);
                });
            }
        };
    }

    attachToObject(objectInstance) {
        this.selectedObject = objectInstance;
        if (!objectInstance) return;

        const formData = {
            nodeId: objectInstance.id || objectInstance.nodeId || '',
            title: objectInstance.title || (objectInstance.cardType ? `${objectInstance.cardType.toUpperCase()} #${objectInstance.id}` : `Node #${objectInstance.id}`),
            description: objectInstance.description || objectInstance.cardData?.description || 'Active Stargate / Atom Node',
            hue: objectInstance.hue !== undefined ? objectInstance.hue : 185,
            innerHue: objectInstance.innerHue !== undefined ? objectInstance.innerHue : 230,
            scale: objectInstance.scaleMultiplier !== undefined ? objectInstance.scaleMultiplier : 1.0,
            rotation: objectInstance.group ? Math.round(THREE.MathUtils.radToDeg(objectInstance.group.rotation.z) % 360) : 0
        };
        this.setFormData(formData);
    }

    getFormData() {
        const id = this.instanceId;
        return {
            nodeId: document.getElementById(`edit-node-id-${id}`).value,
            title: document.getElementById(`node-title-${id}`).value,
            description: document.getElementById(`node-desc-${id}`).value,
            hue: document.getElementById(`node-hue-${id}`).value,
            innerHue: document.getElementById(`node-inner-hue-${id}`).value,
            scale: document.getElementById(`node-scale-${id}`).value,
            rotation: document.getElementById(`node-rotation-${id}`).value
        };
    }

    setFormData(data) {
        if (!data) return;
        const id = this.instanceId;
        
        const nodeField = document.getElementById(`edit-node-id-${id}`);
        if (nodeField && data.nodeId !== undefined && data.nodeId !== null) nodeField.value = data.nodeId;

        const titleField = document.getElementById(`node-title-${id}`);
        if (titleField && data.title !== undefined && data.title !== null) titleField.value = data.title;

        const descField = document.getElementById(`node-desc-${id}`);
        if (descField && data.description !== undefined && data.description !== null) descField.value = data.description;
        
        if (data.hue !== undefined && data.hue !== null) {
            const hueInput = document.getElementById(`node-hue-${id}`);
            const hueValSpan = document.getElementById(`val-hue-${id}`);
            if (hueInput) hueInput.value = data.hue;
            if (hueValSpan) hueValSpan.textContent = data.hue;
        }

        if (data.innerHue !== undefined && data.innerHue !== null) {
            const innerHueInput = document.getElementById(`node-inner-hue-${id}`);
            const innerHueValSpan = document.getElementById(`val-inner-hue-${id}`);
            if (innerHueInput) innerHueInput.value = data.innerHue;
            if (innerHueValSpan) innerHueValSpan.textContent = data.innerHue;
        }

        if (data.scale !== undefined && data.scale !== null) {
            const scaleInput = document.getElementById(`node-scale-${id}`);
            const scaleValSpan = document.getElementById(`val-scale-${id}`);
            if (scaleInput) scaleInput.value = data.scale;
            if (scaleValSpan) scaleValSpan.textContent = data.scale;
        }

        if (data.rotation !== undefined && data.rotation !== null) {
            const rotInput = document.getElementById(`node-rotation-${id}`);
            const rotValSpan = document.getElementById(`val-rotation-${id}`);
            if (rotInput) rotInput.value = data.rotation;
            if (rotValSpan) rotValSpan.textContent = data.rotation;
        }
    }

    on(event, callback) {
        this.callbacks[event] = callback;
    }

    saveToCookie(days = 7) {
        const d = new Date();
        d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = "expires=" + d.toUTCString();
        document.cookie = `${this.cookieName}=${encodeURIComponent(JSON.stringify(this.getFormData()))};${expires};path=/;SameSite=Strict`;
    }

    loadFromCookie() {
        const nameEQ = this.cookieName + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i].trim();
            if (c.indexOf(nameEQ) === 0) {
                try {
                    const rawValue = c.substring(nameEQ.length, c.length);
                    if (!rawValue || rawValue === 'null' || rawValue === 'undefined') {
                        return null;
                    }
                    const data = JSON.parse(decodeURIComponent(rawValue));
                    if (data && typeof data === 'object') {
                        this.setFormData(data);
                        return data;
                    }
                } catch (e) {
                    console.warn("[AVIS DEV FORM] Failed to parse cookie state safely:", e);
                    return null;
                }
            }
        }
        return null;
    }

    clearCookie() {
        document.cookie = `rru_network_state=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        document.cookie = `${this.cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        localStorage.removeItem('rru_network_state_backup');
        localStorage.removeItem('rru_saved_nodes');
    }

    show() {
        if (this.windowEl) this.windowEl.style.display = 'flex';
    }

    hide() {
        if (this.windowEl) this.windowEl.style.display = 'none';
    }
}

window.AvisDevFormModule = AvisDevFormModule;
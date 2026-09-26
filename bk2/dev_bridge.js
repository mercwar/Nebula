/* ================================================================= *
 * RRU - Dev Form Bridge / Inspector Module (dev_bridge.js)          *
 * Operator: CVBGOD                                                  *
 * ================================================================= *
 */

if (typeof window.AvisDevFormModule === 'undefined') {
    class AvisDevFormModule {
        constructor(instanceId = 'primary_inspector') {
            this.instanceId = instanceId;
            this.formEl = null;
            this.listeners = { change: [], save: [], delete: [] };
            this.currentData = {
                nodeId: '',
                title: '',
                description: '',
                hue: 185,
                innerHue: 220,
                scale: 1.0,
                rotation: 0
            };

            this.initStyles();
            this.initForm();
            this.bindEvents();
        }

        initStyles() {
            if (!document.getElementById('avis-dev-bridge-styles')) {
                const styleSheet = document.createElement('style');
                styleSheet.id = 'avis-dev-bridge-styles';
                styleSheet.textContent = `
                    .rru-dev-form-panel {
                        position: fixed;
                        top: 80px;
                        left: 20px;
                        width: 320px;
                        background: linear-gradient(135deg, rgba(2, 6, 23, 0.95) 0%, rgba(10, 25, 47, 0.90) 100%);
                        border: 1px solid rgba(0, 242, 255, 0.3);
                        clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px));
                        color: #f1f5f9;
                        font-family: 'Consolas', 'Courier New', monospace;
                        font-size: 11px;
                        z-index: 9999;
                        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8);
                        display: none;
                        flex-direction: column;
                    }
                    .rru-dev-header {
                        padding: 10px 14px;
                        background: rgba(0, 242, 255, 0.08);
                        border-bottom: 1px solid rgba(0, 242, 255, 0.2);
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        cursor: move;
                    }
                    .rru-dev-header h3 {
                        margin: 0;
                        font-size: 11px;
                        letter-spacing: 1.2px;
                        text-transform: uppercase;
                        color: #00f2ff;
                    }
                    .rru-dev-close {
                        background: transparent;
                        border: none;
                        color: #00f2ff;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: bold;
                    }
                    .rru-dev-body {
                        padding: 14px;
                        display: flex;
                        flex-direction: column;
                        gap: 10px;
                        max-height: 450px;
                        overflow-y: auto;
                    }
                    .rru-field-group {
                        display: flex;
                        flex-direction: column;
                        gap: 4px;
                    }
                    .rru-field-group label {
                        color: #94a3b8;
                        font-size: 10px;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                    .rru-field-group input, .rru-field-group textarea {
                        background: rgba(0, 0, 0, 0.4);
                        border: 1px solid rgba(255, 255, 255, 0.15);
                        color: #fff;
                        padding: 6px 8px;
                        border-radius: 3px;
                        font-family: inherit;
                        font-size: 11px;
                    }
                    .rru-field-group input:focus, .rru-field-group textarea:focus {
                        border-color: #00f2ff;
                        outline: none;
                    }
                    .rru-dev-actions {
                        display: flex;
                        gap: 8px;
                        margin-top: 6px;
                    }
                    .rru-btn {
                        flex: 1;
                        padding: 8px;
                        border: 1px solid rgba(0, 242, 255, 0.4);
                        background: rgba(0, 242, 255, 0.1);
                        color: #00f2ff;
                        border-radius: 3px;
                        cursor: pointer;
                        text-transform: uppercase;
                        font-weight: bold;
                        font-size: 10px;
                        transition: all 0.2s ease;
                    }
                    .rru-btn:hover {
                        background: rgba(0, 242, 255, 0.3);
                        border-color: #00f2ff;
                    }
                    .rru-btn.danger {
                        border-color: rgba(239, 68, 68, 0.4);
                        background: rgba(239, 68, 68, 0.1);
                        color: #f87171;
                    }
                    .rru-btn.danger:hover {
                        background: rgba(239, 68, 68, 0.3);
                        border-color: #ef4444;
                    }
                `;
                document.head.appendChild(styleSheet);
            }
        }

        initForm() {
            if (this.formEl) return;

            this.formEl = document.createElement('div');
            this.formEl.id = `avis-dev-form-${this.instanceId}`;
            this.formEl.className = 'rru-dev-form-panel';

            this.formEl.innerHTML = `
                <div class="rru-dev-header" id="dev-form-header-${this.instanceId}">
                    <h3>Node Inspector</h3>
                    <button class="rru-dev-close" id="dev-close-${this.instanceId}">×</button>
                </div>
                <div class="rru-dev-body">
                    <div class="rru-field-group">
                        <label>Node ID</label>
                        <input type="text" id="dev-nodeId-${this.instanceId}" readonly />
                    </div>
                    <div class="rru-field-group">
                        <label>Title / Name</label>
                        <input type="text" id="dev-title-${this.instanceId}" />
                    </div>
                    <div class="rru-field-group">
                        <label>Description</label>
                        <textarea id="dev-desc-${this.instanceId}" rows="2"></textarea>
                    </div>
                    <div class="rru-field-group">
                        <label>Primary Hue (0 - 360)</label>
                        <input type="number" id="dev-hue-${this.instanceId}" min="0" max="360" />
                    </div>
                    <div class="rru-field-group">
                        <label>Inner Hue (0 - 360)</label>
                        <input type="number" id="dev-innerHue-${this.instanceId}" min="0" max="360" />
                    </div>
                    <div class="rru-field-group">
                        <label>Scale Multiplier</label>
                        <input type="number" id="dev-scale-${this.instanceId}" step="0.05" min="0.2" max="5.0" />
                    </div>
                    <div class="rru-field-group">
                        <label>Rotation Y (Degrees)</label>
                        <input type="number" id="dev-rotation-${this.instanceId}" min="0" max="360" />
                    </div>
                    <div class="rru-dev-actions">
                        <button class="rru-btn" id="dev-save-${this.instanceId}">Save Metadata</button>
                        <button class="rru-btn danger" id="dev-delete-${this.instanceId}">Delete Node</button>
                    </div>
                </div>
            `;

            document.body.appendChild(this.formEl);
        }

        bindEvents() {
            const id = this.instanceId;
            const header = document.getElementById(`dev-form-header-${id}`);
            
            let ox, oy;
            header.onmousedown = (e) => {
                if (e.target.tagName === 'BUTTON') return;
                ox = e.clientX - this.formEl.offsetLeft;
                oy = e.clientY - this.formEl.offsetTop;
                document.onmousemove = (ev) => {
                    this.formEl.style.left = (ev.clientX - ox) + 'px';
                    this.formEl.style.top = (ev.clientY - oy) + 'px';
                };
                document.onmouseup = () => {
                    document.onmousemove = null;
                    document.onmouseup = null;
                };
            };

            document.getElementById(`dev-close-${id}`).onclick = () => this.hide();

            const inputs = ['title', 'desc', 'hue', 'innerHue', 'scale', 'rotation'];
            inputs.forEach(field => {
                const el = document.getElementById(`dev-${field === 'desc' ? 'desc' : field}-${id}`);
                if (el) {
                    el.oninput = () => {
                        const val = el.value;
                        if (field === 'title') this.currentData.title = val;
                        if (field === 'desc') this.currentData.description = val;
                        if (field === 'hue') {
                            this.currentData.hue = Number(val);
                            this.emit('change', { type: 'hue', value: Number(val) });
                        }
                        if (field === 'innerHue') {
                            this.currentData.innerHue = Number(val);
                            this.emit('change', { type: 'innerHue', value: Number(val) });
                        }
                        if (field === 'scale') {
                            this.currentData.scale = Number(val);
                            this.emit('change', { type: 'scale', value: Number(val) });
                        }
                        if (field === 'rotation') {
                            this.currentData.rotation = Number(val);
                            this.emit('change', { type: 'rotation', value: Number(val) });
                        }
                    };
                }
            });

            document.getElementById(`dev-save-${id}`).onclick = () => {
                this.emit('save', this.currentData);
            };

            document.getElementById(`dev-delete-${id}`).onclick = () => {
                if (confirm(`Delete telemetry node [${this.currentData.nodeId}]?`)) {
                    this.emit('delete', this.currentData.nodeId);
                    this.hide();
                }
            };
        }

        setFormData(data) {
            this.currentData = { ...this.currentData, ...data };
            const id = this.instanceId;
            
            const setVal = (field, val) => {
                const el = document.getElementById(`dev-${field}-${id}`);
                if (el) el.value = val !== undefined ? val : '';
            };

            setVal('nodeId', this.currentData.nodeId);
            setVal('title', this.currentData.title);
            setVal('desc', this.currentData.description);
            setVal('hue', this.currentData.hue);
            setVal('innerHue', this.currentData.innerHue);
            setVal('scale', this.currentData.scale);
            setVal('rotation', this.currentData.rotation);
        }

        on(event, callback) {
            if (this.listeners[event]) {
                this.listeners[event].push(callback);
            }
        }

        emit(event, data) {
            if (this.listeners[event]) {
                this.listeners[event].forEach(cb => cb(data));
            }
        }

        show() {
            if (this.formEl) this.formEl.style.display = 'flex';
        }

        hide() {
            if (this.formEl) this.formEl.style.display = 'none';
        }
    }

    window.AvisDevFormModule = AvisDevFormModule;
    window.AvisDevBridge = AvisDevFormModule;
}
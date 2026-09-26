/* ================================================================= *
 * RRU - Object Tracker & 3D Card Red X Delete Integration (AVIS)    *
 * Operator: CVBGOD                                                  *
 * ================================================================= */

document.addEventListener('DOMContentLoaded', () => {
    const trackerPanel = document.getElementById('rru-tracker-panel');
    const toggleTrackerBtn = document.getElementById('toggle-tracker-btn');
    const trackerCloseBtn = document.getElementById('tracker-close-btn');
    const trackerNodeList = document.getElementById('tracker-node-list');

    if (!trackerPanel) {
        if (window.AVISLog) window.AVISLog('WARN', 'Tracker panel element [#rru-tracker-panel] not found in DOM.', 'TRACKER');
        return;
    }

// Inject AVIS Monitor Futuristic Purple/Gold Styling & Animations (Transparent Cards & Window, No Blur)
    if (!document.getElementById('avis-tracker-styles')) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'avis-tracker-styles';
        styleSheet.textContent = `
            @keyframes avis-window-glow {
                0% { filter: drop-shadow(0 4px 10px rgba(168, 85, 247, 0.2)); }
                50% { filter: drop-shadow(0 4px 20px rgba(234, 179, 8, 0.3)); }
                100% { filter: drop-shadow(0 4px 10px rgba(168, 85, 247, 0.2)); }
            }
            #rru-tracker-panel {
                background: rgba(0, 0, 0, 0.45) !important;
                backdrop-filter: none !important;
                -webkit-backdrop-filter: none !important;
                border: 1px solid rgba(255, 255, 255, 0.15) !important;
                clip-path: polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px));
                animation: avis-window-glow 6s infinite ease-in-out;
                color: #f1f5f9;
                font-family: 'Fira Code', 'Courier New', monospace;
                box-sizing: border-box;
            }
            #rru-tracker-panel .designer-header {
                background: rgba(0, 0, 0, 0.3) !important;
                border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
                color: #eab308 !important;
                letter-spacing: 1.5px;
            }
            #rru-tracker-panel .modern-scroll::-webkit-scrollbar { width: 5px; }
            #rru-tracker-panel .modern-scroll::-webkit-scrollbar-track { background: transparent; }
            #rru-tracker-panel .modern-scroll::-webkit-scrollbar-thumb { background: rgba(234, 179, 8, 0.3); border-radius: 10px; }
            #rru-tracker-panel .modern-scroll::-webkit-scrollbar-thumb:hover { background: rgba(168, 85, 247, 0.8); }
            
            .avis-card-row, .rru-tracker-card, .tracker-card-item {
                background: rgba(0, 0, 0, 0.25) !important;
                backdrop-filter: none !important;
                -webkit-backdrop-filter: none !important;
                border: 1px solid rgba(168, 85, 247, 0.25) !important;
                border-radius: 4px;
                padding: 10px;
                display: flex;
                flex-direction: column;
                gap: 6px;
                font-family: 'Fira Code', 'Courier New', monospace;
                font-size: 10px;
                margin-bottom: 6px;
                transition: border-color 0.2s ease;
            }
            .avis-card-row:hover, .rru-tracker-card:hover, .tracker-card-item:hover {
                border-color: rgba(234, 179, 8, 0.4) !important;
                background: rgba(0, 0, 0, 0.35) !important;
            }
            .avis-input, .avis-select {
                background: rgba(0, 0, 0, 0.4) !important;
                backdrop-filter: none !important;
                -webkit-backdrop-filter: none !important;
                border: 1px solid rgba(255, 255, 255, 0.1) !important;
                color: #f1f5f9 !important;
                border-radius: 3px;
                padding: 3px 6px;
                font-family: inherit;
                font-size: 10px;
            }
            .avis-input:focus, .avis-select:focus {
                outline: none;
                border-color: rgba(234, 179, 8, 0.5) !important;
                background: rgba(0, 0, 0, 0.65) !important;
            }
            .avis-btn {
                background: rgba(0, 0, 0, 0.3);
                backdrop-filter: none !important;
                -webkit-backdrop-filter: none !important;
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 20px;
                color: #f1f5f9;
                font-family: inherit;
                font-size: 10px;
                font-weight: 500;
                padding: 4px 10px;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            .avis-btn:hover {
                background: rgba(234, 179, 8, 0.15);
                border-color: rgba(234, 179, 8, 0.4);
                color: #eab308;
            }
            .avis-btn-danger:hover {
                background: rgba(239, 68, 68, 0.15) !important;
                border-color: rgba(239, 68, 68, 0.4) !important;
                color: #ef4444 !important;
            }
        `;
        document.head.appendChild(styleSheet);
    }
    if (trackerNodeList) {
        trackerNodeList.classList.add('modern-scroll');
    }

    // Toggle Tracker Window visibility
    if (toggleTrackerBtn) {
        toggleTrackerBtn.addEventListener('click', () => {
            const isVisible = trackerPanel.style.display === 'flex';
            trackerPanel.style.display = isVisible ? 'none' : 'flex';
            if (window.AVISLog) window.AVISLog('INFO', `Tracker panel display toggled: ${!isVisible ? 'VISIBLE' : 'HIDDEN'}`, 'TRACKER');
            if (!isVisible && typeof window.updateTrackerUI === 'function') {
                window.updateTrackerUI();
            }
        });
    }

    if (trackerCloseBtn) {
        trackerCloseBtn.addEventListener('click', () => {
            trackerPanel.style.display = 'none';
            if (window.AVISLog) window.AVISLog('INFO', 'Tracker panel closed via close button.', 'TRACKER');
        });
    }

    // Refresh the live list of tracked nodes and update 3D card Red X overlays
    window.updateTrackerUI = function() {
        if (!window.atoms) window.atoms = [];

        window.atoms.forEach((node, index) => {
            if (typeof window.attachRedXToNodeCard === 'function') {
                window.attachRedXToNodeCard(node, index);
            }
        });

        if (!trackerNodeList || trackerPanel.style.display !== 'flex') return;
        
        trackerNodeList.innerHTML = '';

        if (window.atoms.length === 0) {
            trackerNodeList.innerHTML = `<div style="text-align: center; color: #a855f7; font-size: 10px; padding: 16px; text-shadow: 0 0 5px rgba(168,85,247,0.3);">NO ACTIVE NODES IN NETWORK</div>`;
            return;
        }

        window.atoms.forEach((node, index) => {
            if (!node.cardData) {
                node.cardData = {
                    title: `NODE_${node.id || index}`,
                    description: '',
                    keycode: 'KC-01',
                    modified: new Date().toISOString().split('T')[0],
                    user: 'CVBGOD'
                };
            }

            const cardData = node.cardData;
            const title = cardData.title || `NODE_${node.id || index}`;
            const keycode = cardData.keycode || 'KC-000';
            const nodeType = (node.cardType || node.type || 'stargate').toLowerCase();
            const hue = node.hue !== undefined ? node.hue : 185;
            const innerHue = node.innerHue !== undefined ? node.innerHue : ((node.hue + 45) % 360);
            const scale = node.scaleMultiplier !== undefined ? node.scaleMultiplier : (node.scale?.x || 1.0);
            
            const currentRotationY = node.rotation ? Math.round(THREE.MathUtils.radToDeg(node.rotation.y)) : 0;

            const cardRow = document.createElement('div');
            cardRow.className = 'avis-card-row';

            let specificLinkFields = '';
            if (nodeType === 'stargate' || nodeType === 'atom') {
                specificLinkFields = `
                    <label style="display: flex; flex-direction: column; gap: 2px; color: #a855f7;">
                        Nebula Link (.neb, .sg, .quasar, .html): 
                        <input type="text" class="avis-input card-target-url" data-index="${index}" value="${cardData.targetUrl || ''}" placeholder="e.g. index.neb, space.sg, or file.html">
                    </label>
                `;
            } else if (nodeType === 'sign') {
                specificLinkFields = `
                    <div style="display: flex; gap: 6px;">
                        <label style="flex: 1; display: flex; flex-direction: column; gap: 2px; color: #a855f7;">
                            Image Link: <input type="text" class="avis-input card-image-url" data-index="${index}" value="${cardData.imageUrl || ''}" placeholder="asset.png">
                        </label>
                        <label style="flex: 1; display: flex; flex-direction: column; gap: 2px; color: #a855f7;">
                            HREF Link: <input type="text" class="avis-input card-href-url" data-index="${index}" value="${cardData.hrefUrl || ''}" placeholder="https://...">
                        </label>
                    </div>
                `;
            } else if (nodeType === 'firegem' || nodeType === 'fire-gem') {
                specificLinkFields = `
                    <div style="display: flex; gap: 6px;">
                        <label style="flex: 1; display: flex; flex-direction: column; gap: 2px; color: #eab308;">
                            Target System:
                            <select class="avis-select card-roborook-target" data-index="${index}">
                                <option value="roborook" ${cardData.roborookTarget === 'roborook' ? 'selected' : ''}>Robo Rook</option>
                            </select>
                        </label>
                        <label style="flex: 1; display: flex; flex-direction: column; gap: 2px; color: #eab308;">
                            Raw HTML Payload: <input type="text" class="avis-input card-raw-html" data-index="${index}" value="${cardData.rawHtmlPayload || ''}" placeholder="<div>...</div>">
                        </label>
                    </div>
                `;
            }

            cardRow.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(168,85,247,0.2); padding-bottom: 4px;">
                    <span style="color: #eab308; font-weight: bold; text-shadow: 0 0 6px rgba(234,179,8,0.4);">[${nodeType.toUpperCase()}] ID: ${node.id || index}</span>
                </div>

                <div style="display: flex; gap: 6px;">
                    <label style="flex: 2; display: flex; flex-direction: column; gap: 2px; color: #cbd5e1;">
                        Title: <input type="text" class="avis-input card-title" data-index="${index}" value="${title}">
                    </label>
                    <label style="flex: 1; display: flex; flex-direction: column; gap: 2px; color: #cbd5e1;">
                        Keycode: <input type="text" class="avis-input card-keycode" data-index="${index}" value="${keycode}">
                    </label>
                </div>

                <label style="display: flex; flex-direction: column; gap: 2px; color: #cbd5e1;">
                    Description: <input type="text" class="avis-input card-description" data-index="${index}" value="${cardData.description || ''}">
                </label>

                <div style="display: flex; gap: 6px;">
                    <label style="flex: 1; display: flex; flex-direction: column; gap: 2px; color: #cbd5e1;">
                        User: <input type="text" class="avis-input card-user" data-index="${index}" value="${cardData.user || 'CVBGOD'}">
                    </label>
                    <label style="flex: 1; display: flex; flex-direction: column; gap: 2px; color: #cbd5e1;">
                        Modified: <input type="text" class="avis-input card-modified" data-index="${index}" value="${cardData.modified || new Date().toISOString().split('T')[0]}">
                    </label>
                </div>

                ${specificLinkFields}

                <div style="display: flex; gap: 6px; align-items: center; border-top: 1px solid rgba(168,85,247,0.15); padding-top: 6px; margin-top: 2px;">
                    <label style="flex: 1; display: flex; flex-direction: column; gap: 2px; color: #a855f7;">
                        Outer Hue: <input type="range" class="tracker-hue" min="0" max="360" value="${hue}" data-index="${index}" style="width: 100%; accent-color: #a855f7;">
                    </label>
                    <label style="flex: 1; display: flex; flex-direction: column; gap: 2px; color: #a855f7;">
                        Inner Hue: <input type="range" class="tracker-inner-hue" min="0" max="360" value="${innerHue}" data-index="${index}" style="width: 100%; accent-color: #a855f7;">
                    </label>
                    <label style="flex: 1; display: flex; flex-direction: column; gap: 2px; color: #a855f7;">
                        Scale: <input type="range" class="tracker-scale" min="0.5" max="2.0" step="0.1" value="${scale}" data-index="${index}" style="width: 100%; accent-color: #a855f7;">
                    </label>
                </div>

                <div style="display: flex; gap: 6px; align-items: center; padding-top: 2px;">
                    <label style="flex: 1; display: flex; flex-direction: column; gap: 2px; color: #a855f7;">
                        Rotate (Y-Axis): <input type="range" class="tracker-rotate-y" min="0" max="360" value="${currentRotationY}" data-index="${index}" style="width: 100%; accent-color: #eab308;">
                    </label>
                </div>

                <div style="display: flex; gap: 4px; margin-top: 4px;">
                    <button class="avis-btn tracker-inspect-btn" data-index="${index}" style="flex: 2;">View Orbit</button>
                    <button class="avis-btn avis-btn-danger tracker-delete-btn" data-index="${index}" style="flex: 1;">Delete</button>
                </div>
            `;

            trackerNodeList.appendChild(cardRow);
        });

        // Event bindings
        trackerNodeList.querySelectorAll('.card-title').forEach(input => {
            input.addEventListener('input', (e) => {
                const idx = parseInt(e.target.getAttribute('data-index'), 10);
                if (window.atoms[idx]?.cardData) window.atoms[idx].cardData.title = e.target.value;
            });
        });

        trackerNodeList.querySelectorAll('.card-keycode').forEach(input => {
            input.addEventListener('input', (e) => {
                const idx = parseInt(e.target.getAttribute('data-index'), 10);
                if (window.atoms[idx]?.cardData) window.atoms[idx].cardData.keycode = e.target.value;
            });
        });

        trackerNodeList.querySelectorAll('.card-description').forEach(input => {
            input.addEventListener('input', (e) => {
                const idx = parseInt(e.target.getAttribute('data-index'), 10);
                if (window.atoms[idx]?.cardData) window.atoms[idx].cardData.description = e.target.value;
            });
        });

        trackerNodeList.querySelectorAll('.card-user').forEach(input => {
            input.addEventListener('input', (e) => {
                const idx = parseInt(e.target.getAttribute('data-index'), 10);
                if (window.atoms[idx]?.cardData) window.atoms[idx].cardData.user = e.target.value;
            });
        });

        trackerNodeList.querySelectorAll('.card-modified').forEach(input => {
            input.addEventListener('input', (e) => {
                const idx = parseInt(e.target.getAttribute('data-index'), 10);
                if (window.atoms[idx]?.cardData) window.atoms[idx].cardData.modified = e.target.value;
            });
        });

        trackerNodeList.querySelectorAll('.card-target-url').forEach(input => {
            input.addEventListener('input', (e) => {
                const idx = parseInt(e.target.getAttribute('data-index'), 10);
                if (window.atoms[idx]?.cardData) window.atoms[idx].cardData.targetUrl = e.target.value;
            });
        });

        trackerNodeList.querySelectorAll('.card-image-url').forEach(input => {
            input.addEventListener('input', (e) => {
                const idx = parseInt(e.target.getAttribute('data-index'), 10);
                if (window.atoms[idx]?.cardData) window.atoms[idx].cardData.imageUrl = e.target.value;
            });
        });

        trackerNodeList.querySelectorAll('.card-href-url').forEach(input => {
            input.addEventListener('input', (e) => {
                const idx = parseInt(e.target.getAttribute('data-index'), 10);
                if (window.atoms[idx]?.cardData) window.atoms[idx].cardData.hrefUrl = e.target.value;
            });
        });

        trackerNodeList.querySelectorAll('.card-roborook-target').forEach(select => {
            select.addEventListener('change', (e) => {
                const idx = parseInt(e.target.getAttribute('data-index'), 10);
                if (window.atoms[idx]?.cardData) window.atoms[idx].cardData.roborookTarget = e.target.value;
            });
        });

        trackerNodeList.querySelectorAll('.card-raw-html').forEach(input => {
            input.addEventListener('input', (e) => {
                const idx = parseInt(e.target.getAttribute('data-index'), 10);
                if (window.atoms[idx]?.cardData) {
                    window.atoms[idx].cardData.rawHtmlPayload = e.target.value;
                }
            });
        });

        trackerNodeList.querySelectorAll('.tracker-hue').forEach(input => {
            input.addEventListener('input', (e) => {
                const idx = parseInt(e.target.getAttribute('data-index'), 10);
                const val = parseInt(e.target.value, 10);
                if (window.atoms[idx]) {
                    window.atoms[idx].hue = val;
                    if (typeof window.atoms[idx].setHue === 'function') {
                        window.atoms[idx].setHue(val);
                    } else if (typeof window.atoms[idx].updateHue === 'function') {
                        window.atoms[idx].updateHue(val);
                    }
                }
            });
        });

        trackerNodeList.querySelectorAll('.tracker-inner-hue').forEach(input => {
            input.addEventListener('input', (e) => {
                const idx = parseInt(e.target.getAttribute('data-index'), 10);
                const val = parseInt(e.target.value, 10);
                if (window.atoms[idx]) {
                    window.atoms[idx].innerHue = val;
                    if (typeof window.atoms[idx].setInnerHue === 'function') {
                        window.atoms[idx].setInnerHue(val);
                    } else if (typeof window.atoms[idx].updateInnerHue === 'function') {
                        window.atoms[idx].updateInnerHue(val);
                    }
                }
            });
        });

        trackerNodeList.querySelectorAll('.tracker-scale').forEach(input => {
            input.addEventListener('input', (e) => {
                const idx = parseInt(e.target.getAttribute('data-index'), 10);
                const val = parseFloat(e.target.value);
                if (window.atoms[idx]) {
                    window.atoms[idx].scaleMultiplier = val;
                    if (typeof window.atoms[idx].setScale === 'function') {
                        window.atoms[idx].setScale(val);
                    } else if (window.atoms[idx].scale) {
                        window.atoms[idx].scale.set(val, val, val);
                    }
                }
            });
        });

        trackerNodeList.querySelectorAll('.tracker-rotate-y').forEach(input => {
            input.addEventListener('input', (e) => {
                const idx = parseInt(e.target.getAttribute('data-index'), 10);
                const degVal = parseFloat(e.target.value);
                const radVal = THREE.MathUtils.degToRad(degVal);
                
                if (window.atoms[idx]) {
                    const node = window.atoms[idx];
                    if (typeof node.setRotationY === 'function') {
                        node.setRotationY(radVal);
                    } else if (node.rotation) {
                        node.rotation.y = radVal;
                    } else if (node.group && node.group.rotation) {
                        node.group.rotation.y = radVal;
                    }
                }
            });
        });

        trackerNodeList.querySelectorAll('.tracker-inspect-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.getAttribute('data-index'), 10);
                const node = window.atoms[idx];
                if (!node) return;

                if (window.RRUMap && typeof window.RRUMap.focusOn === 'function') {
                    window.RRUMap.focusOn(node);
                }

                if (typeof window.RRURouter?.inspectNode === 'function') {
                    window.RRURouter.inspectNode(node);
                    return;
                }
                if (typeof window.focusCameraOnNode === 'function') {
                    window.focusCameraOnNode(node);
                    return;
                }

                const targetPos = node.position ? node.position.clone() : (node.getWorldPosition ? node.getWorldPosition(new THREE.Vector3()) : null);
                
                if (targetPos) {
                    if (window.controls) {
                        window.controls.target.copy(targetPos);
                        window.controls.update();
                    }

                    if (window.camera) {
                        const offset = new THREE.Vector3(0, 2, 5);
                        window.camera.position.copy(targetPos).add(offset);
                        if (window.controls) {
                            window.controls.target.copy(targetPos);
                            window.controls.update();
                        }
                    }
                }

                if (typeof window.openNodeDesigner === 'function') {
                    window.openNodeDesigner(node);
                }
            });
        });

        trackerNodeList.querySelectorAll('.tracker-delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.getAttribute('data-index'), 10);
                if (typeof window.deleteNodeAtIndex === 'function') {
                    window.deleteNodeAtIndex(idx);
                }
            });
        });
    };

    let lastKnownAtomCount = window.atoms ? window.atoms.length : 0;

    function checkAtomChanges() {
        if (!window.atoms) window.atoms = [];
        if (window.atoms.length !== lastKnownAtomCount) {
            lastKnownAtomCount = window.atoms.length;
            if (typeof window.updateTrackerUI === 'function') {
                window.updateTrackerUI();
            }
        } else {
            window.atoms.forEach((node, index) => {
                if (typeof window.attachRedXToNodeCard === 'function') {
                    window.attachRedXToNodeCard(node, index);
                }
            });
        }
    }

    setInterval(checkAtomChanges, 300);

    if (window.AVISLog) {
        window.AVISLog('SUCCESS', 'Object tracker integrated with AVIS monitoring and logging subsystems.', 'TRACKER');
    }
});
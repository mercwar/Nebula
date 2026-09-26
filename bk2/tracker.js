/* ================================================================= *
 * RRU - Object Tracker & 3D Card Red X Delete Integration (Fixed)     *
 * ================================================================= */

document.addEventListener('DOMContentLoaded', () => {
    const trackerPanel = document.getElementById('rru-tracker-panel');
    const toggleTrackerBtn = document.getElementById('toggle-tracker-btn');
    const trackerCloseBtn = document.getElementById('tracker-close-btn');
    const trackerNodeList = document.getElementById('tracker-node-list');

    if (!trackerPanel) return;

    // Toggle Tracker Window visibility
    if (toggleTrackerBtn) {
        toggleTrackerBtn.addEventListener('click', () => {
            const isVisible = trackerPanel.style.display === 'flex';
            trackerPanel.style.display = isVisible ? 'none' : 'flex';
            if (!isVisible && typeof window.updateTrackerUI === 'function') {
                window.updateTrackerUI();
            }
        });
    }

    if (trackerCloseBtn) {
        trackerCloseBtn.addEventListener('click', () => {
            trackerPanel.style.display = 'none';
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
            trackerNodeList.innerHTML = `<div style="text-align: center; color: #64748b; font-size: 10px; padding: 16px;">NO ACTIVE NODES IN NETWORK</div>`;
            return;
        }

        window.atoms.forEach((node, index) => {
            if (!node.cardData) {
                node.cardData = {
                    title: `NODE_${node.id || index}`,
                    description: 'Network node.',
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
            
            // Extract current rotation Y in degrees (default to 0 if not present)
            const currentRotationY = node.rotation ? Math.round(THREE.MathUtils.radToDeg(node.rotation.y)) : 0;

            const cardRow = document.createElement('div');
            cardRow.className = 'glass-panel';
            cardRow.style.cssText = 'padding: 8px; border-radius: 6px; border: 1px solid rgba(0,242,255,0.2); display: flex; flex-direction: column; gap: 6px; font-family: monospace; font-size: 10px; background: rgba(0,10,20,0.85); margin-bottom: 6px;';

            let specificLinkFields = '';
            if (nodeType === 'stargate' || nodeType === 'atom') {
                specificLinkFields = `
                    <label style="display: flex; flex-direction: column; gap: 2px; color: #00f2ff;">
                        Nebula Link (.neb, .sg, .quasar, .html): 
                        <input type="text" class="card-target-url" data-index="${index}" value="${cardData.targetUrl || ''}" placeholder="e.g. index.neb, space.sg, or file.html" style="background: rgba(0,0,0,0.6); border: 1px solid rgba(0,242,255,0.3); color: #00f2ff; padding: 3px; border-radius: 3px; font-size: 10px;">
                    </label>
                `;
            } else if (nodeType === 'sign') {
                specificLinkFields = `
                    <div style="display: flex; gap: 6px;">
                        <label style="flex: 1; display: flex; flex-direction: column; gap: 2px; color: #00f2ff;">
                            Image Link: <input type="text" class="card-image-url" data-index="${index}" value="${cardData.imageUrl || ''}" placeholder="asset.png" style="background: rgba(0,0,0,0.6); border: 1px solid rgba(0,242,255,0.3); color: #00f2ff; padding: 3px; border-radius: 3px; font-size: 10px;">
                        </label>
                        <label style="flex: 1; display: flex; flex-direction: column; gap: 2px; color: #00f2ff;">
                            HREF Link: <input type="text" class="card-href-url" data-index="${index}" value="${cardData.hrefUrl || ''}" placeholder="https://..." style="background: rgba(0,0,0,0.6); border: 1px solid rgba(0,242,255,0.3); color: #00f2ff; padding: 3px; border-radius: 3px; font-size: 10px;">
                        </label>
                    </div>
                `;
            } else if (nodeType === 'firegem' || nodeType === 'fire-gem') {
                specificLinkFields = `
                    <div style="display: flex; gap: 6px;">
                        <label style="flex: 1; display: flex; flex-direction: column; gap: 2px; color: #ff5500;">
                            Target System:
                            <select class="card-roborook-target" data-index="${index}" style="background: rgba(0,0,0,0.6); border: 1px solid rgba(255,85,0,0.4); color: #ff9955; padding: 3px; border-radius: 3px; font-size: 10px;">
                                <option value="roborook" ${cardData.roborookTarget === 'roborook' ? 'selected' : ''}>Robo-Rook</option>
                                <option value="roboknight" ${cardData.roborookTarget === 'roboknight' ? 'selected' : ''}>Robo-Knight</option>
                            </select>
                        </label>
                        <label style="flex: 1; display: flex; flex-direction: column; gap: 2px; color: #ff5500;">
                            Raw HTML Payload: <input type="text" class="card-raw-html" data-index="${index}" value="${cardData.rawHtmlPayload || ''}" placeholder="<div>...</div> or URL" style="background: rgba(0,0,0,0.6); border: 1px solid rgba(255,85,0,0.4); color: #ff9955; padding: 3px; border-radius: 3px; font-size: 10px;">
                        </label>
                    </div>
                `;
            }

            cardRow.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px;">
                    <span style="color: #00f2ff; font-weight: bold;">[${nodeType.toUpperCase()}] ID: ${node.id || index}</span>
                </div>

                <!-- Editable Metadata Fields -->
                <div style="display: flex; gap: 6px;">
                    <label style="flex: 2; display: flex; flex-direction: column; gap: 2px; color: #cbd5e1;">
                        Title: <input type="text" class="card-title" data-index="${index}" value="${title}" style="background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.2); color: #fff; padding: 3px; border-radius: 3px; font-size: 10px;">
                    </label>
                    <label style="flex: 1; display: flex; flex-direction: column; gap: 2px; color: #cbd5e1;">
                        Keycode: <input type="text" class="card-keycode" data-index="${index}" value="${keycode}" style="background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.2); color: #fff; padding: 3px; border-radius: 3px; font-size: 10px;">
                    </label>
                </div>

                <label style="display: flex; flex-direction: column; gap: 2px; color: #cbd5e1;">
                    Description: <input type="text" class="card-description" data-index="${index}" value="${cardData.description || ''}" style="background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.2); color: #fff; padding: 3px; border-radius: 3px; font-size: 10px;">
                </label>

                <div style="display: flex; gap: 6px;">
                    <label style="flex: 1; display: flex; flex-direction: column; gap: 2px; color: #cbd5e1;">
                        User: <input type="text" class="card-user" data-index="${index}" value="${cardData.user || 'CVBGOD'}" style="background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.2); color: #fff; padding: 3px; border-radius: 3px; font-size: 10px;">
                    </label>
                    <label style="flex: 1; display: flex; flex-direction: column; gap: 2px; color: #cbd5e1;">
                        Modified: <input type="text" class="card-modified" data-index="${index}" value="${cardData.modified || new Date().toISOString().split('T')[0]}" style="background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.2); color: #fff; padding: 3px; border-radius: 3px; font-size: 10px;">
                    </label>
                </div>

                <!-- Node-Specific Link Configuration -->
                ${specificLinkFields}

                <!-- Color, Scale & Rotation Controls -->
                <div style="display: flex; gap: 6px; align-items: center; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 6px; margin-top: 2px;">
                    <label style="flex: 1; display: flex; flex-direction: column; gap: 2px; color: #94a3b8;">
                        Outer Hue: <input type="range" class="tracker-hue" min="0" max="360" value="${hue}" data-index="${index}" style="width: 100%;">
                    </label>
                    <label style="flex: 1; display: flex; flex-direction: column; gap: 2px; color: #94a3b8;">
                        Inner Hue: <input type="range" class="tracker-inner-hue" min="0" max="360" value="${innerHue}" data-index="${index}" style="width: 100%;">
                    </label>
                    <label style="flex: 1; display: flex; flex-direction: column; gap: 2px; color: #94a3b8;">
                        Scale: <input type="range" class="tracker-scale" min="0.5" max="2.0" step="0.1" value="${scale}" data-index="${index}" style="width: 100%;">
                    </label>
                </div>

                <div style="display: flex; gap: 6px; align-items: center; padding-top: 2px;">
                    <label style="flex: 1; display: flex; flex-direction: column; gap: 2px; color: #00f2ff;">
                        Rotate (Y-Axis): <input type="range" class="tracker-rotate-y" min="0" max="360" value="${currentRotationY}" data-index="${index}" style="width: 100%;">
                    </label>
                </div>

                <div style="display: flex; gap: 4px; margin-top: 4px;">
                    <button class="tracker-inspect-btn" data-index="${index}" style="flex: 2; background: rgba(0,242,255,0.1); border: 1px solid rgba(0,242,255,0.3); color: #00f2ff; padding: 3px; cursor: pointer; border-radius: 4px;">View Orbit</button>
                    <button class="tracker-delete-btn" data-index="${index}" style="flex: 1; background: rgba(255,68,68,0.15); border: 1px solid rgba(255,68,68,0.4); color: #ff4444; padding: 3px; cursor: pointer; border-radius: 4px; font-weight: bold;">Delete</button>
                </div>
            `;

            trackerNodeList.appendChild(cardRow);
        });

        // --- Event bindings for live metadata form fields ---
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

        // Bind interactive events for tracker window controls
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

        // Rotation Y Slider Event Listener
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

        // View Orbit button click handler - focuses camera and controls target onto the card
        trackerNodeList.querySelectorAll('.tracker-inspect-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.getAttribute('data-index'), 10);
                const node = window.atoms[idx];
                if (!node) return;

                // 1. Focus map viewport camera target onto the connected object/card
                if (window.RRUMap && typeof window.RRUMap.focusOn === 'function') {
                    window.RRUMap.focusOn(node);
                }

                // 2. If a dedicated router or global orbit function exists, use it
                if (typeof window.RRURouter?.inspectNode === 'function') {
                    window.RRURouter.inspectNode(node);
                    return;
                }
                if (typeof window.focusCameraOnNode === 'function') {
                    window.focusCameraOnNode(node);
                    return;
                }

                // 3. Default Three.js orbit focus logic
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

    // --- State Polling & Synchronization ---
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
});
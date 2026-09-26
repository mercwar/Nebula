/* ================================================================= *
 * RRU - State Router, Deployment Dispatcher & NEB Store (router.js) *
 * ================================================================= */

(function () {
    'use strict';

    // --- Global Network Registry ---
    window.atoms = window.atoms || [];
    let selectedNodeForInspection = null;

    // --- Helper to read live UI slider/input values ---
    function getUIHue() {
        const el = document.getElementById('node-hue') || 
                   document.getElementById('hue-slider') || 
                   document.getElementById('node-hue-slider');
        return el ? Number(el.value) || 185 : 185;
    }

    function getUIInnerHue() {
        const el = document.getElementById('node-inner-hue') || 
                   document.getElementById('inner-hue-slider');
        return el ? Number(el.value) || 230 : 230;
    }

    function getUIScale() {
        const el = document.getElementById('node-scale') || 
                   document.getElementById('scale-slider') || 
                   document.getElementById('node-scale-slider');
        return el ? Number(el.value) || 1.0 : 1.0;
    }

    // --- Universal Node Factory & Property Enforcer ---
    window.createRRUNode = function(type, position, id, hue, scale, cardData = {}, innerHue) {
        let newNode;
        const safeHue = (hue !== undefined && hue !== null) ? Number(hue) : getUIHue();
        const safeInnerHue = (innerHue !== undefined && innerHue !== null) ? Number(innerHue) : ((safeHue + 45) % 360);
        const safeScale = (scale !== undefined && scale !== null) ? Number(scale) : getUIScale();
        const safeId = id || ++window.RRURouter.nextNodeId;

        // 1. Instantiate based on requested type
        if (type === 'sign' && typeof SignNode === 'function') {
            newNode = new SignNode(position, safeId, safeHue, safeScale, cardData);
        } else if (type === 'firegem' && typeof FireGemNode === 'function') {
            newNode = new FireGemNode(position, safeId, safeScale, cardData);
        } else if (type === 'stargate' || type === 'atom' || typeof Atom === 'function') {
            newNode = new Atom(position, safeId, safeHue, safeScale, type, cardData);
        } else {
            newNode = new Atom(position, safeId, safeHue, safeScale, 'stargate', cardData);
        }

        if (newNode) {
            // 2. Normalize properties on the instance
            newNode.cardType = type;
            newNode.hue = safeHue;
            newNode.innerHue = safeInnerHue;
            newNode.scaleMultiplier = safeScale;
            newNode.cardData = cardData;

            // 3. Force-apply scale
            if (typeof newNode.setScale === 'function') {
                newNode.setScale(safeScale);
            } else {
                const targetObject = newNode.group || newNode.mesh || newNode;
                if (targetObject && targetObject.scale && typeof targetObject.scale.set === 'function') {
                    targetObject.scale.set(safeScale, safeScale, safeScale);
                }
            }

            // 4. Force-apply hue/color
            if (typeof newNode.setHue === 'function') {
                newNode.setHue(safeHue);
            } else if (typeof newNode.updateHue === 'function') {
                newNode.updateHue(safeHue);
            } else if (typeof newNode.updateColor === 'function') {
                newNode.updateColor(safeHue);
            }

            if (typeof newNode.setInnerHue === 'function') {
                newNode.setInnerHue(safeInnerHue);
            } else if (typeof newNode.updateInnerHue === 'function') {
                newNode.updateInnerHue(safeInnerHue);
            }
        }

        return newNode;
    };

    // --- Storage & Cookie Helpers ---
    window.setCookie = function(name, value, days = 30) {
        const d = new Date();
        d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = "expires=" + d.toUTCString();
        document.cookie = name + "=" + encodeURIComponent(JSON.stringify(value)) + ";" + expires + ";path=/;SameSite=Strict";
    };

    window.getCookie = function(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for(let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) {
                try {
                    return JSON.parse(decodeURIComponent(c.substring(nameEQ.length, c.length)));
                } catch (e) {
                    console.error("Failed to parse cookie data:", e);
                    return null;
                }
            }
        }
        return null;
    };

    window.deleteCookie = function(name) {
        document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    };

    // --- NEB Environment & Storage Controller (`RRUNebStore`) ---
    window.RRUNebStore = {
        currentNebData: null,
        mode: 'development', // 'development' or 'publication'

        // Stub for loading a physical .neb file when ?neb= is passed in GET query
        loadNebFromFile(nebPath) {
            console.log(`[RRUNebStore] Loading publication .neb file from source: ${nebPath}`);
            // TODO: Implement fetch/XHR loader for physical .neb file here if needed
            return null;
        },

        init() {
            const urlParams = new URLSearchParams(window.location.search);
            const nebQuery = urlParams.get('neb');

            if (nebQuery) {
                // Publication copy: ignore cookie, load from file path
                this.mode = 'publication';
                console.log('[RRUNebStore] &neb= parameter detected. Running in PUBLICATION mode (ignoring cookies).');
                this.currentNebData = this.loadNebFromFile(nebQuery);
            } else {
                // Development copy: load from cookie
                this.mode = 'development';
                const savedCookieData = window.getCookie('rru_active_neb');
                if (savedCookieData) {
                    this.currentNebData = savedCookieData;
                    console.log('[RRUNebStore] Running in DEVELOPMENT mode. Loaded network state from cookie.');
                    
                    // Automatically populate atoms array from cookie if present
                    if (Array.isArray(savedCookieData)) {
                        savedCookieData.forEach(item => {
                            const pos = new THREE.Vector3(
                                item.position?.x || 0, 
                                item.position?.y || 0, 
                                item.position?.z || 0
                            );
                            const hue = item.hue !== undefined ? item.hue : 185;
                            const innerHue = item.innerHue !== undefined ? item.innerHue : ((hue + 45) % 360);
                            const scale = item.scale !== undefined ? item.scale : 1.0;
                            const cardType = item.cardType || item.type || 'stargate';
                            const cardData = item.cardData || {};
                            const id = item.id || ++window.RRURouter.nextNodeId;

                            const newNode = window.createRRUNode(cardType, pos, id, hue, scale, cardData, innerHue);
                            if (newNode) {
                                window.atoms.push(newNode);
                                if (window.RRUMap && typeof window.RRUMap.addEntity === 'function') {
                                    window.RRUMap.addEntity(newNode);
                                }
                            }
                        });
                        if (typeof window.updateTrackerUI === 'function') window.updateTrackerUI();
                    }
                }
            }
        },

        // Compile network state and save to cookie on every design action
        compileAndSave() {
            if (this.mode === 'publication') return; // Never overwrite cookies in publication mode

            const networkData = window.atoms.map(a => ({
                id: a.id,
                hue: a.hue || 185,
                innerHue: a.innerHue !== undefined ? a.innerHue : ((a.hue || 185) + 45) % 360,
                scale: a.scaleMultiplier || a.scale?.x || 1.0,
                cardType: a.cardType || a.type || 'stargate',
                position: { x: Math.round(a.position.x), y: Math.round(a.position.y), z: Math.round(a.position.z) },
                cardData: a.cardData || {}
            }));

            this.currentNebData = networkData;
            window.setCookie('rru_active_neb', networkData, 30);
            console.log('[RRUNebStore] Design action executed — .neb re-compiled and cookie saved.');
        }
    };

    // --- Clipboard & Export/Import Controls ---
    window.exportNetworkToClipboard = function() {
        if (!window.atoms || window.atoms.length === 0) {
            alert("No nodes in network to export.");
            return;
        }
        window.RRUNebStore.compileAndSave();
        const jsonString = JSON.stringify(window.RRUNebStore.currentNebData, null, 2);

        navigator.clipboard.writeText(jsonString).then(() => {
            window.showClipboardNotification("Constellation copied to clipboard & saved to cookie!");
        }).catch(err => {
            console.error("Failed to copy network data: ", err);
            prompt("Copy constellation JSON manually:", jsonString);
        });
    };

    window.importNetworkFromClipboard = function() {
        navigator.clipboard.readText().then(text => {
            try {
                const importedData = JSON.parse(text);
                if (!Array.isArray(importedData)) throw new Error("Invalid format");

                window.clearAllNodes(true); // Clear without triggering immediate cookie wipe

                importedData.forEach(item => {
                    const pos = new THREE.Vector3(
                        item.position?.x || 0, 
                        item.position?.y || 0, 
                        item.position?.z || 0
                    );
                    const hue = item.hue !== undefined ? item.hue : 185;
                    const innerHue = item.innerHue !== undefined ? item.innerHue : ((hue + 45) % 360);
                    const scale = item.scale !== undefined ? item.scale : 1.0;
                    const cardType = item.cardType || item.type || 'stargate';
                    const cardData = item.cardData || {};
                    const id = item.id || ++window.RRURouter.nextNodeId;

                    const newNode = window.createRRUNode(cardType, pos, id, hue, scale, cardData, innerHue);

                    if (newNode) {
                        window.atoms.push(newNode);
                        if (window.RRUMap && typeof window.RRUMap.addEntity === 'function') {
                            window.RRUMap.addEntity(newNode);
                        }
                    }
                });

                window.RRUNebStore.compileAndSave();
                if (typeof window.updateTrackerUI === 'function') window.updateTrackerUI();
                window.showClipboardNotification(`Successfully imported ${importedData.length} nodes!`);
            } catch (e) {
                alert("Clipboard data is not a valid Stargate constellation JSON.");
            }
        }).catch(err => {
            console.error("Failed to read clipboard: ", err);
        });
    };

    window.showClipboardNotification = function(message) {
        let notify = document.getElementById('clipNotification');
        if (!notify) {
            notify = document.createElement('div');
            notify.id = 'clipNotification';
            notify.className = 'fixed top-20 right-6 z-50 glass-panel px-4 py-2.5 rounded-xl border border-cyan-400 text-cyan-300 text-xs font-mono shadow-[0_0_20px_rgba(0,242,255,0.4)] transition-all opacity-0 translate-y-[-10px]';
            document.body.appendChild(notify);
        }
        notify.textContent = message;
        notify.style.opacity = '1';
        notify.style.transform = 'translateY(0)';

        setTimeout(() => {
            notify.style.opacity = '0';
            notify.style.transform = 'translateY(-10px)';
        }, 2500);
    };

    // --- Main Router Object ---
    const RRURouter = {
        selectedType: 'stargate',
        dropperActive: false,
        nextNodeId: 1,

        init() {
            // Initialize storage store check on boot
            window.RRUNebStore.init();

            const selectEl = document.getElementById('node-type-select');
            const toggleBtn = document.getElementById('toggle-deploy-btn');
            const clearBtn = document.getElementById('clear-all-btn');
            const statusBar = document.getElementById('status-bar');
            const container = document.getElementById('webgl-container');

            if (selectEl) {
                selectEl.addEventListener('change', (e) => {
                    this.selectedType = e.target.value;
                    if (this.dropperActive && statusBar) {
                        statusBar.textContent = `STATUS: DEPLOYING [${this.selectedType.toUpperCase()}]`;
                    }
                });
            }

            if (toggleBtn) {
                toggleBtn.addEventListener('click', () => {
                    this.dropperActive = !this.dropperActive;
                    if (this.dropperActive) {
                        toggleBtn.style.background = 'rgba(0, 242, 255, 0.3)';
                        toggleBtn.style.boxShadow = '0 0 15px rgba(0, 242, 255, 0.5)';
                        toggleBtn.textContent = 'Dropper ACTIVE (Click Map)';
                        if (statusBar) statusBar.textContent = `STATUS: DEPLOYING [${this.selectedType.toUpperCase()}]`;
                    } else {
                        toggleBtn.style.background = 'rgba(0, 242, 255, 0.05)';
                        toggleBtn.style.boxShadow = 'none';
                        toggleBtn.textContent = 'Enable Dropper Mode';
                        if (statusBar) statusBar.textContent = 'STATUS: ONLINE // MAP READY';
                    }
                });
            }

            if (clearBtn) {
                clearBtn.addEventListener('click', () => {
                    window.clearAllNodes();
                });
            }

            if (container) {
                container.addEventListener('click', (e) => {
                    if (!this.dropperActive) return;
                    if (!window.RRUMap) return;

                    const worldPos = window.RRUMap.get3DPosition(e.clientX, e.clientY);
                    this.deployNode(this.selectedType, worldPos);
                });
            }

            // Live Slider Binding for Selected / Active Inspection Nodes
            const hueSlider = document.getElementById('node-hue') || document.getElementById('hue-slider');
            const innerHueSlider = document.getElementById('node-inner-hue') || document.getElementById('inner-hue-slider');
            const scaleSlider = document.getElementById('node-scale') || document.getElementById('scale-slider');

            if (hueSlider) {
                hueSlider.addEventListener('input', (e) => {
                    const val = Number(e.target.value);
                    if (selectedNodeForInspection) {
                        selectedNodeForInspection.hue = val;
                        if (typeof selectedNodeForInspection.setHue === 'function') selectedNodeForInspection.setHue(val);
                        else if (typeof selectedNodeForInspection.updateHue === 'function') selectedNodeForInspection.updateHue(val);
                        window.RRUNebStore.compileAndSave();
                    }
                });
            }

            if (innerHueSlider) {
                innerHueSlider.addEventListener('input', (e) => {
                    const val = Number(e.target.value);
                    if (selectedNodeForInspection) {
                        selectedNodeForInspection.innerHue = val;
                        if (typeof selectedNodeForInspection.setInnerHue === 'function') selectedNodeForInspection.setInnerHue(val);
                        else if (typeof selectedNodeForInspection.updateInnerHue === 'function') selectedNodeForInspection.updateInnerHue(val);
                        window.RRUNebStore.compileAndSave();
                    }
                });
            }

            if (scaleSlider) {
                scaleSlider.addEventListener('input', (e) => {
                    const val = Number(e.target.value);
                    if (selectedNodeForInspection) {
                        selectedNodeForInspection.scaleMultiplier = val;
                        if (typeof selectedNodeForInspection.setScale === 'function') selectedNodeForInspection.setScale(val);
                        window.RRUNebStore.compileAndSave();
                    }
                });
            }

            const designerPanel = document.getElementById('rru-designer-panel');
            const closeBtn = document.getElementById('designer-close-btn');
            const saveCookieBtn = document.getElementById('designer-save-cookie-btn');
            const copyJsonBtn = document.getElementById('designer-copy-btn');

            if (closeBtn && designerPanel) {
                closeBtn.addEventListener('click', () => {
                    designerPanel.style.display = 'none';
                    selectedNodeForInspection = null;
                });
            }
            if (saveCookieBtn) {
                saveCookieBtn.addEventListener('click', () => {
                    window.RRUNebStore.compileAndSave();
                    window.showClipboardNotification("Network state saved to cookies!");
                });
            }
            if (copyJsonBtn) copyJsonBtn.addEventListener('click', window.exportNetworkToClipboard);
        },

        deployNode(type, position) {
            const id = this.nextNodeId++;
            const hue = getUIHue();
            const innerHue = getUIInnerHue();
            const scale = getUIScale();
            const cardData = { title: `NODE_${id}`, keycode: `KC-${id}` };

            const newNode = window.createRRUNode(type, position, id, hue, scale, cardData, innerHue);

            if (newNode) {
                window.atoms.push(newNode);

                if (window.RRUMap && typeof window.RRUMap.addEntity === 'function') {
                    window.RRUMap.addEntity(newNode);
                }

                // Compile and update cookie storage on node deployment
                window.RRUNebStore.compileAndSave();

                setTimeout(() => {
                    if (typeof window.updateTrackerUI === 'function') {
                        window.updateTrackerUI();
                    }
                    window.attachRedXToNodeCard(newNode, window.atoms.length - 1);
                }, 50);
            }
        },

        inspectNode(node) {
            selectedNodeForInspection = node;
            const hueSlider = document.getElementById('node-hue') || document.getElementById('hue-slider');
            const innerHueSlider = document.getElementById('node-inner-hue') || document.getElementById('inner-hue-slider');
            const scaleSlider = document.getElementById('node-scale') || document.getElementById('scale-slider');
            
            if (hueSlider && node.hue !== undefined) hueSlider.value = node.hue;
            if (innerHueSlider && node.innerHue !== undefined) innerHueSlider.value = node.innerHue;
            if (scaleSlider && node.scaleMultiplier !== undefined) scaleSlider.value = node.scaleMultiplier;
        }
    };

    RRURouter.init();
    window.RRURouter = RRURouter;
})();

// --- 3D Card Red X Integration & Node Deletion ---
window.attachRedXToNodeCard = function(node, index) {
    let cardElement = node.cardElement || document.getElementById(`node-card-${node.id}`) || node.element;
    
    if (cardElement && !cardElement.querySelector('.card-red-x-btn')) {
        const redXBtn = document.createElement('button');
        redXBtn.className = 'card-red-x-btn';
        redXBtn.innerHTML = '&times;';
        redXBtn.title = 'Delete Node from Map';
        redXBtn.style.cssText = `
            position: absolute;
            top: 6px;
            right: 6px;
            width: 22px;
            height: 22px;
            background: rgba(255, 68, 68, 0.2);
            border: 1px solid rgba(255, 68, 68, 0.6);
            color: #ff4444;
            font-weight: bold;
            font-size: 14px;
            line-height: 18px;
            text-align: center;
            border-radius: 4px;
            cursor: pointer;
            z-index: 1000;
            transition: all 0.2s ease;
        `;

        redXBtn.addEventListener('mouseover', () => {
            redXBtn.style.background = 'rgba(255, 68, 68, 0.5)';
            redXBtn.style.color = '#ffffff';
        });
        redXBtn.addEventListener('mouseout', () => {
            redXBtn.style.background = 'rgba(255, 68, 68, 0.2)';
            redXBtn.style.color = '#ff4444';
        });

        redXBtn.addEventListener('click', (ev) => {
            ev.stopPropagation();
            window.deleteNodeAtIndex(index);
        });

        if (window.getComputedStyle(cardElement).position === 'static') {
            cardElement.style.position = 'relative';
        }
        cardElement.appendChild(redXBtn);
    }
};

window.deleteNodeAtIndex = function(index, skipUIUpdate = false) {
    if (window.atoms && window.atoms[index]) {
        const node = window.atoms[index];
        
        if (typeof node.dispose === 'function') {
            try { node.dispose(); } catch(e) { console.warn("Dispose error:", e); }
        }
        
        const targetMesh = node.group || node.mesh || (node.isObject3D ? node : null);
        
        if (targetMesh && typeof targetMesh.traverse === 'function') {
            targetMesh.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => {
                            if (mat.map) mat.map.dispose();
                            mat.dispose();
                        });
                    } else {
                        if (child.material.map) child.material.map.dispose();
                        child.material.dispose();
                    }
                }
            });
            if (targetMesh.parent) {
                targetMesh.parent.remove(targetMesh);
            }
        }

        const cardElement = node.cardElement || document.getElementById(`node-card-${node.id}`);
        if (cardElement) cardElement.remove();

        if (window.RRUMap && typeof window.RRUMap.removeEntity === 'function') {
            window.RRUMap.removeEntity(node);
        }

        window.atoms.splice(index, 1);

        // Compile and update cookie storage on node deletion
        if (window.RRUNebStore && typeof window.RRUNebStore.compileAndSave === 'function') {
            window.RRUNebStore.compileAndSave();
        }

        if (!skipUIUpdate) {
            if (typeof window.rebuildConnections === 'function') window.rebuildConnections();
            if (typeof window.updateTrackerUI === 'function') window.updateTrackerUI();
        }
    }
};

window.clearAllNodes = function(skipCookieSave = false) {
    if (window.atoms && window.atoms.length > 0) {
        while (window.atoms.length > 0) {
            window.deleteNodeAtIndex(window.atoms.length - 1, true);
        }
    }

    if (window.RRUMap && typeof window.RRUMap.clearAllEntities === 'function') {
        window.RRUMap.clearAllEntities();
    }

    if (!skipCookieSave && window.RRUNebStore && typeof window.RRUNebStore.compileAndSave === 'function') {
        window.RRUNebStore.compileAndSave();
    }

    if (typeof window.rebuildConnections === 'function') {
        window.rebuildConnections();
    }
    if (typeof window.updateTrackerUI === 'function') {
        window.updateTrackerUI();
    }
    window.showClipboardNotification("All nodes cleared from network and scene.");
};
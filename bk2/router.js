/* ================================================================= *
 * RRU Event & Action Router (router.js)                             *
 * Operator: CVBGOD                                                  *
 * ================================================================= */

class RRURouter {
    constructor(mapSystem) {
        this.mapSystem = mapSystem;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this._isDropping = false;
        this._lastDropTime = 0;
        this._lastClickTime = 0;

        // Ensure we hook listeners even if mapSystem is initially delayed
        this.initViewportListeners();
        this.initUIListeners();
        this.initDevFormListeners();
    }

    reportToAvis(errorType, message, payload = {}) {
        const errorReport = {
            protocol: "AVIS-DIAGNOSTIC",
            operator: "CVBGOD",
            timestamp: Date.now(),
            errorType: errorType,
            message: message,
            userAgent: navigator.userAgent,
            cookieState: document.cookie || "EMPTY_OR_BLOCKED",
            metadata: payload
        };

        console.error(`[AVIS TELEMETRY] ${errorType}: ${message}`, errorReport);

        const avisEndpoint = window.AVIS_CONFIG?.endpoint || 'avis_telemetry.php';
        
        if (navigator.sendBeacon) {
            try {
                navigator.sendBeacon(avisEndpoint, JSON.stringify(errorReport));
            } catch (e) {
                console.warn("AVIS Beacon failed, trying fetch fallback.", e);
            }
        } else {
            fetch(avisEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(errorReport)
            }).catch(err => console.warn("AVIS relay unreachable:", err));
        }
    }

    initViewportListeners() {
        // Fallback check: if mapSystem is missing, attempt to grab from window.rruMap dynamically
        const getMap = () => this.mapSystem || window.rruMap;

        window.addEventListener('resize', () => {
            const map = getMap();
            if (!map || !map.camera || !map.renderer) return;
            map.camera.aspect = window.innerWidth / window.innerHeight;
            map.camera.updateProjectionMatrix();
            map.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // Wait for DOM to attach renderer element if not yet available
        const attachDomListeners = () => {
            const map = getMap();
            if (!map || !map.renderer || !map.renderer.domElement) {
                setTimeout(attachDomListeners, 100);
                return;
            }

            const domEl = map.renderer.domElement;

            // Raycasting Click Handler (debounced against double-click interference on 3D elements/signs)
            domEl.addEventListener('click', (event) => {
                const now = Date.now();
                if (now - this._lastClickTime < 300) {
                    return; // Ignore rapid double-clicks so sign text or atom interactions aren't toggled/broken twice
                }
                this._lastClickTime = now;

                const activeMap = getMap();
                if (!activeMap || !activeMap.camera || !activeMap.atoms) return;

                this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
                this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

                this.raycaster.setFromCamera(this.mouse, activeMap.camera);
                
                const intersectObjects = [];
                activeMap.atoms.forEach(atom => {
                    if (atom.group) {
                        atom.group.traverse(child => {
                            if (child.isMesh) {
                                if (!child.userData) child.userData = {};
                                child.userData.atomId = atom.id;
                                intersectObjects.push(child);
                            }
                        });
                    }
                });

                const intersects = this.raycaster.intersectObjects(intersectObjects, true);

                if (intersects.length > 0) {
                    let hitObject = intersects[0].object;
                    let targetAtomId = null;
                    let currentObj = hitObject;

                    while (currentObj && currentObj !== activeMap.scene) {
                        if (currentObj.userData && currentObj.userData.atomId !== undefined) {
                            targetAtomId = currentObj.userData.atomId;
                            break;
                        }
                        currentObj = currentObj.parent;
                    }

                    const foundAtom = targetAtomId !== null 
                        ? activeMap.atoms.find(a => a.id === targetAtomId || (a.group && a.group.uuid === targetAtomId))
                        : null;

                    if (foundAtom) {
                        activeMap.selectedAtom = foundAtom;

                        // Check if node data is serialized in cookie/storage or fallback to object properties
                        let cookieCardData = foundAtom.cardData || {};
                        
                        if (typeof activeMap.getNodeDataFromCookie === 'function') {
                            const retrieved = activeMap.getNodeDataFromCookie(foundAtom.id);
                            if (retrieved) cookieCardData = retrieved;
                        } else if (window.RRU_COOKIE_CACHE && window.RRU_COOKIE_CACHE[foundAtom.id]) {
                            cookieCardData = window.RRU_COOKIE_CACHE[foundAtom.id];
                        }

                        if (typeof window.devForm !== 'undefined') {
                            window.devForm.show();
                            window.devForm.setFormData({
                                nodeId: foundAtom.id || foundAtom.group.uuid,
                                title: cookieCardData.title || foundAtom.title || 'Stargate Node',
                                description: cookieCardData.description || foundAtom.description || '',
                                hue: cookieCardData.hue !== undefined ? cookieCardData.hue : (foundAtom.hue || 185),
                                innerHue: cookieCardData.innerHue !== undefined ? cookieCardData.innerHue : (foundAtom.innerHue || 230),
                                scale: cookieCardData.scale !== undefined ? cookieCardData.scale : (foundAtom.scaleMultiplier || 1.0),
                                // Respect current actual object rotation without enforcing or overwriting with uninitialized defaults
                                rotation: foundAtom.group ? Math.round(THREE.MathUtils.radToDeg(foundAtom.group.rotation.z || 0)) : (foundAtom.rotation || 0)
                            });
                        }

                        if (activeMap.monitor) {
                            activeMap.monitor.log('INFO', `Selected core node from state: ${foundAtom.id}`, 'INSPECTOR');
                        }
                    }
                }
            });

            // Drag and Drop Spawning
            domEl.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.stopPropagation();
            });

            domEl.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (typeof e.stopImmediatePropagation === 'function') {
                    e.stopImmediatePropagation();
                }

                if (this._isDropping) return;
                const now = Date.now();
                if (this._lastDropTime && (now - this._lastDropTime < 600)) return;

                this._isDropping = true;
                this._lastDropTime = now;

                try {
                    const activeMap = getMap();
                    if (!activeMap || !activeMap.camera) {
                        this.reportToAvis("SPAWN_ERROR", "Map system uninitialized during drop event.");
                        return;
                    }

                    let spawnType = 'atom';
                    try {
                        const jsonStr = e.dataTransfer.getData('application/json');
                        if (jsonStr) {
                            const parsed = JSON.parse(jsonStr);
                            if (parsed.type) spawnType = parsed.type;
                        } else {
                            const plainText = e.dataTransfer.getData('text/plain');
                            if (plainText) spawnType = plainText;
                        }
                    } catch (err) {
                        spawnType = e.dataTransfer.getData('text/plain') || 'atom';
                    }

                    const rect = domEl.getBoundingClientRect();
                    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
                    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

                    const vector = new THREE.Vector3(x, y, 0.5).unproject(activeMap.camera);
                    const dir = vector.sub(activeMap.camera.position).normalize();
                    const spawnPos = activeMap.camera.position.clone().add(dir.multiplyScalar(400));
                    spawnPos.y = Math.max(0, spawnPos.y);

                    const newId = `${spawnType}_${Date.now().toString().slice(-4)}`;
                    let newNode = null;

                    if (spawnType === 'fire-gem' && typeof FireGemNode !== 'undefined') {
                        newNode = new FireGemNode(spawnPos, newId, 15, 1.0, {}, 45);
                        newNode.title = `Fire Gem ${newId}`;
                        newNode.description = 'Deployed telemetry unit';
                        newNode.cardType = 'firegem';
                    } else if (spawnType === 'sign' && typeof SignNode !== 'undefined') {
                        newNode = new SignNode(spawnPos, newId, 210, 1.0, { text: 'NEW SIGN' });
                        newNode.title = `Sign ${newId}`;
                        newNode.description = 'Deployed holographic marker';
                        newNode.cardType = 'sign';
                    } else if (typeof Atom !== 'undefined') {
                        newNode = new Atom(spawnPos, newId, 185, 1.0, spawnType, null, 220);
                        newNode.title = `${spawnType} Node ${newId}`;
                        newNode.description = 'Deployed stargate/atom unit';
                        newNode.cardType = spawnType;
                    }

                    if (newNode) {
                        if (newNode.group) {
                            newNode.group.position.copy(spawnPos);
                            newNode.group.userData = { atomId: newNode.id };
                            newNode.group.traverse(child => {
                                if (child.isMesh) {
                                    if (!child.userData) child.userData = {};
                                    child.userData.atomId = newNode.id;
                                }
                            });
                        }
                        newNode.position = spawnPos.clone();

                        activeMap.atoms.push(newNode);
                        activeMap.selectedAtom = newNode;

                        if (typeof window.devForm !== 'undefined') {
                            window.devForm.show();
                            window.devForm.setFormData({
                                nodeId: newNode.id,
                                title: newNode.title,
                                description: newNode.description,
                                hue: newNode.hue || 185,
                                innerHue: newNode.innerHue || 230,
                                scale: newNode.scaleMultiplier || 1.0,
                                rotation: newNode.group ? Math.round(THREE.MathUtils.radToDeg(newNode.group.rotation.z || 0)) : 0
                            });
                        }
                    }

                    if (typeof activeMap.saveNodesToCookies === 'function') {
                        activeMap.saveNodesToCookies();
                    } else if (typeof compileNetworkState === 'function') {
                        compileNetworkState();
                    }
                } catch (err) {
                    this.reportToAvis("DROP_EXECUTION_FAILURE", err.message);
                } finally {
                    setTimeout(() => { this._isDropping = false; }, 150);
                }
            });
        };

        attachDomListeners();
    }

    initDevFormListeners() {
        const rotationInput = document.getElementById('node-rotation') || document.querySelector('[name="rotation"]');
        if (rotationInput) {
            rotationInput.addEventListener('input', (e) => {
                const map = this.mapSystem || window.rruMap;
                if (!map || !map.selectedAtom) return;
                const atom = map.selectedAtom;
                const deg = parseFloat(e.target.value) || 0;
                const rad = THREE.MathUtils.degToRad(deg);

                if (atom.group) {
                    atom.group.rotation.z = rad;
                }
                atom.rotation = deg;

                if (typeof map.saveNodesToCookies === 'function') {
                    map.saveNodesToCookies();
                } else if (typeof compileNetworkState === 'function') {
                    compileNetworkState();
                }
            });
        }
    }

    initUIListeners() {
        const btnCompile = document.getElementById('btn-compile-cookies');
        if (btnCompile) {
            btnCompile.addEventListener('click', () => {
                if (typeof compileNetworkState === 'function') {
                    compileNetworkState();
                } else {
                    this.reportToAvis("COMPILER_MISSING", "compileNetworkState function is undefined.");
                }
            });
        }

        const btnLoad = document.getElementById('btn-load-cookies');
        if (btnLoad) {
            btnLoad.addEventListener('click', () => {
                const map = this.mapSystem || window.rruMap;
                if (map && typeof map.loadSavedCookies === 'function') {
                    map.loadSavedCookies();
                    alert('Network state loaded from cookies successfully.');
                } else if (typeof loadNodesFromCookies === 'function') {
                    loadNodesFromCookies();
                    alert('Network state loaded from cookies successfully.');
                } else {
                    this.reportToAvis("LOADER_MISSING", "loadNodesFromCookies function is undefined.");
                }
            });
        }

        const btnCopy = document.getElementById('btn-copy-clipboard');
        if (btnCopy) {
            btnCopy.addEventListener('click', () => {
                if (typeof copyNetworkStateToClipboard === 'function') {
                    copyNetworkStateToClipboard();
                } else {
                    this.reportToAvis("CLIPBOARD_MISSING", "copyNetworkStateToClipboard function is undefined.");
                }
            });
        }
    }
}

// Resilient Auto-boot
document.addEventListener('DOMContentLoaded', () => {
    const bootRouter = () => {
        window.rruRouter = new RRURouter(window.rruMap || null);
    };
    setTimeout(bootRouter, 100);
});
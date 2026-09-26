/* ================================================================= *
 * RRU Network State & Cookie Diagnostic Compiler (Fixed Rotation)   *
 * Operator: Robo Rook                                               *
 * ================================================================= */

function reportCookieErrorToAvis(errorType, message, payload = {}) {
    const errorReport = {
        protocol: "AVIS-DIAGNOSTIC",
        operator: "Robo Rook",
        timestamp: Date.now(),
        errorType: errorType,
        message: message,
        userAgent: navigator.userAgent,
        cookieState: document.cookie || "EMPTY_OR_BLOCKED",
        backupStorage: localStorage.getItem('rru_network_state_backup') ? "EXISTS" : "MISSING",
        metadata: payload
    };

    console.error(`[AVIS TELEMETRY] ${errorType}: ${message}`, errorReport);

    const avisEndpoint = window.AVIS_CONFIG?.endpoint || '/avis_telemetry.php';
    if (navigator.sendBeacon) {
        try {
            navigator.sendBeacon(avisEndpoint, JSON.stringify(errorReport));
        } catch (e) {
            console.warn("Beacon transmission failed, falling back to fetch.", e);
        }
    } else {
        fetch(avisEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(errorReport)
        }).catch(err => console.warn("AVIS telemetry relay unreachable:", err));
    }
}

function compileNetworkState() {
    if (!window.rruMap) {
        const errWarn = "RRU Map system not initialized for compilation.";
        console.warn(errWarn);
        reportCookieErrorToAvis("MAP_UNINITIALIZED", errWarn);
        return null;
    }

    const state = {
        version: "2.2",
        operator: "Robo Rook",
        timestamp: Date.now(),
        camera: {
            position: window.rruMap.camera ? {
                x: window.rruMap.camera.position.x,
                y: window.rruMap.camera.position.y,
                z: window.rruMap.camera.position.z
            } : { x: 0, y: 300, z: 500 },
            zoom: window.rruMap.camera?.zoom || 1
        },
        nodes: []
    };

    if (window.rruMap.atoms && Array.isArray(window.rruMap.atoms)) {
        window.rruMap.atoms.forEach(atom => {
            if (!atom) return;
            
            // Robust extraction of rotation in degrees (0 - 360) on the Z-axis
            let rotationZ = 0;
            if (atom.rotationZ !== undefined) {
                rotationZ = Number(atom.rotationZ) || 0;
            } else if (atom.group && atom.group.rotation) {
                rotationZ = Math.round(THREE.MathUtils.radToDeg(atom.group.rotation.z || 0) % 360);
            } else if (atom.mesh && atom.mesh.rotation) {
                rotationZ = Math.round(THREE.MathUtils.radToDeg(atom.mesh.rotation.z || 0) % 360);
            } else if (atom.rotation !== undefined) {
                rotationZ = typeof atom.rotation === 'number' ? atom.rotation : Math.round(THREE.MathUtils.radToDeg(atom.rotation.z || 0) % 360);
            }
            if (rotationZ < 0) rotationZ += 360;

            state.nodes.push({
                id: atom.id || atom.nodeId || `node_${Date.now()}`,
                type: atom.cardType || atom.type || 'atom',
                title: atom.title || '',
                description: atom.description || '',
                position: atom.group ? {
                    x: atom.group.position.x,
                    y: atom.group.position.y,
                    z: atom.group.position.z
                } : (atom.position ? { x: atom.position.x, y: atom.position.y, z: atom.position.z } : { x: 0, y: 0, z: 0 }),
                hue: atom.hue !== undefined ? atom.hue : 185,
                innerHue: atom.innerHue !== undefined ? atom.innerHue : 230,
                scale: atom.scaleMultiplier !== undefined ? atom.scaleMultiplier : 1.0,
                rotation: rotationZ
            });
        });
    }

    try {
        const jsonStr = JSON.stringify(state);
        document.cookie = `rru_network_state=${encodeURIComponent(jsonStr)}; max-age=604800; path=/; SameSite=Strict`;
        localStorage.setItem('rru_network_state_backup', jsonStr);

        console.log(`[COMPILE SUCCESS] Serialized ${state.nodes.length} node(s) with rotation vectors into network state.`);
        return state;
    } catch (err) {
        reportCookieErrorToAvis("SERIALIZATION_FAILURE", err.message, { nodeCount: state.nodes.length });
        return null;
    }
}

function loadNodesFromCookies() {
    let jsonStr = null;
    const nameEQ = "rru_network_state=";
    const ca = document.cookie.split(';');
    
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i].trim();
        if (c.indexOf(nameEQ) === 0) {
            jsonStr = decodeURIComponent(c.substring(nameEQ.length, c.length));
            break;
        }
    }

    if (!jsonStr) {
        jsonStr = localStorage.getItem('rru_network_state_backup');
        if (jsonStr) {
            console.warn("[AVIS WARNING] Cookie state missing; recovered payload from LocalStorage backup.");
        }
    }

    if (!jsonStr) {
        const warnMsg = "No saved network state found in cookies or storage.";
        console.warn(warnMsg);
        reportCookieErrorToAvis("STATE_NOT_FOUND", warnMsg);
        return null;
    }

    try {
        const state = JSON.parse(jsonStr);

        if (window.rruMap) {
            if (typeof window.rruMap.clearNodes === 'function') {
                window.rruMap.clearNodes();
            } else if (window.rruMap.atoms && window.rruMap.scene) {
                window.rruMap.atoms.forEach(a => {
                    if (a.group) window.rruMap.scene.remove(a.group);
                });
                window.rruMap.atoms = [];
            }

            if (state.nodes && Array.isArray(state.nodes)) {
                state.nodes.forEach(nodeData => {
                    const pos = new THREE.Vector3(
                        nodeData.position.x, 
                        nodeData.position.y, 
                        nodeData.position.z
                    );
                    
                    let newNode = null;
                    const cardData = {
                        title: nodeData.title,
                        description: nodeData.description,
                        rotation: nodeData.rotation || 0
                    };

                    const targetRotationDeg = nodeData.rotation || 0;
                    const targetRad = THREE.MathUtils.degToRad(targetRotationDeg);

                    if ((nodeData.type === 'firegem' || nodeData.type === 'fire-gem') && typeof FireGemNode !== 'undefined') {
                        newNode = new FireGemNode(pos, nodeData.id, nodeData.hue || 15, nodeData.scale || 1.0, cardData, nodeData.innerHue || 45);
                    } else if (nodeData.type === 'sign' && typeof SignNode !== 'undefined') {
                        newNode = new SignNode(pos, nodeData.id, nodeData.hue || 185, nodeData.scale || 1.0, cardData, nodeData.innerHue || 230);
                    } else if (typeof Atom !== 'undefined') {
                        newNode = new Atom(pos, nodeData.id, nodeData.hue || 185, nodeData.scale || 1.0, nodeData.type, null, nodeData.innerHue || 230);
                    }

                    if (newNode) {
                        newNode.title = nodeData.title || `Node ${nodeData.id}`;
                        newNode.description = nodeData.description || '';
                        newNode.rotationZ = targetRotationDeg;
                        
                        // Enforce rotation restoration across all possible interfaces
                        if (typeof newNode.setRotation === 'function') {
                            newNode.setRotation(targetRotationDeg);
                        } else if (typeof newNode.setRotationZ === 'function') {
                            newNode.setRotationZ(targetRotationDeg);
                        }

                        if (newNode.group) {
                            newNode.group.position.copy(pos);
                            newNode.group.rotation.z = targetRad;
                            newNode.group.userData = { atomId: newNode.id };
                            
                            newNode.group.traverse(child => {
                                if (child.isMesh) {
                                    if (!child.userData) child.userData = {};
                                    child.userData.atomId = newNode.id;
                                }
                            });
                        }

                        window.rruMap.atoms.push(newNode);
                        if (window.rruMap.scene && newNode.group) {
                            window.rruMap.scene.add(newNode.group);
                        }
                    }
                });
            }
        }

        console.log(`[LOAD SUCCESS] Restored network state v${state.version} with ${state.nodes?.length || 0} nodes and rotation vectors.`);
        return state;
    } catch (e) {
        const parseErr = `Failed to parse and load network state: ${e.message}`;
        console.error(parseErr, e);
        reportCookieErrorToAvis("PARSE_FAILURE", parseErr, { rawDataSnippet: jsonStr.substring(0, 200) });
        return null;
    }
}

function clearNodesFromCookies() {
    document.cookie = "rru_network_state=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    localStorage.removeItem('rru_network_state_backup');
    if (window.rruMap) {
        if (typeof window.rruMap.clearNodes === 'function') {
            window.rruMap.clearNodes();
        } else if (window.rruMap.atoms && window.rruMap.scene) {
            window.rruMap.atoms.forEach(a => {
                if (a.group) window.rruMap.scene.remove(a.group);
            });
            window.rruMap.atoms = [];
        }
    }
}

function copyNetworkStateToClipboard() {
    const state = compileNetworkState();
    if (!state) return;
    const jsonStr = JSON.stringify(state, null, 2);
    navigator.clipboard.writeText(jsonStr).then(() => {
        alert('Network state JSON compiled with rotations and copied to clipboard successfully!');
    }).catch(err => {
        const clipErr = `Failed to copy state to clipboard: ${err.message}`;
        console.error(clipErr, err);
        reportCookieErrorToAvis("CLIPBOARD_FAILURE", clipErr);
    });
}

// Global Double-Click Interceptor to block accidental rotation/property triggers
window.addEventListener('dblclick', (e) => {
    e.stopImmediatePropagation();
    e.stopPropagation();
}, true);
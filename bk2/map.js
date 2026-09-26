/* ================================================================= *
 * RRU - Unified Map & Simulation Engine (rru_map_system.js)         *
 * Operator: CVBGOD                                                  *
 * ================================================================= */

class RRUMapSystem {
    constructor(containerId = 'stargate-container') {
        this.containerId = containerId;
        this.container = document.getElementById(this.containerId) || document.body;
        
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.atoms = [];
        this.monitor = null;
        this.selectedAtom = null;
        
        this.clock = new THREE.Clock();

        // Camera control state for click-to-halt orbit drift
        this.isOrbitLocked = false;
        this.orbitAngleOffset = 0;
        this.lastAutoCamAngle = 0;

        this.initEngine();
        this.initEnvironment();
        this.initDiagnostics();
        this.loadSavedCookies();
        this.initDevFormBridge();
        this.initDragDrop();
        this.initSelectionRaycaster();
        this.animate();
    }

    initEngine() {
        // 1. Scene Setup
        window.scene = new THREE.Scene();
        this.scene = window.scene;
        this.scene.fog = new THREE.FogExp2(0x020617, 0.0015);

        // 2. Camera Setup
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 5000);
        this.camera.position.set(0, 300, 600);
        this.camera.lookAt(0, 0, 0);

        // 3. Renderer Setup
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        
        if (this.container === document.body) {
            this.renderer.domElement.style.position = 'fixed';
            this.renderer.domElement.style.top = '0';
            this.renderer.domElement.style.left = '0';
            this.renderer.domElement.style.zIndex = '1';
        }
        this.container.appendChild(this.renderer.domElement);
    }

    initEnvironment() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const sunLight = new THREE.DirectionalLight(0x00f2ff, 1.5);
        sunLight.position.set(300, 800, 500);
        this.scene.add(sunLight);

        const backLight = new THREE.DirectionalLight(0xeab308, 0.8);
        backLight.position.set(-300, -400, -500);
        this.scene.add(backLight);

        // Background Starfield Particles
        const starCount = 800;
        const starGeo = new THREE.BufferGeometry();
        const starPositions = new Float32Array(starCount * 3);

        for (let i = 0; i < starCount * 3; i += 3) {
            starPositions[i] = (Math.random() - 0.5) * 3000;
            starPositions[i + 1] = (Math.random() - 0.5) * 3000;
            starPositions[i + 2] = (Math.random() - 0.5) * 3000;
        }

        starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
        const starMat = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 2.5,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending
        });

        const starField = new THREE.Points(starGeo, starMat);
        this.scene.add(starField);
    }

    initDiagnostics() {
        if (typeof AvisMonitorWindow !== 'undefined') {
            this.monitor = new AvisMonitorWindow('rru_main_grid', { top: '80px', left: 'calc(100vw - 500px)' });
            this.monitor.log('SUCCESS', 'RRU 3D Spatial Map Engine successfully bound.', 'ENGINE');
        }
    }

    loadSavedCookies() {
        try {
            const savedData = localStorage.getItem('rru_saved_nodes');
            if (savedData) {
                const parsedNodes = JSON.parse(savedData);
                if (Array.isArray(parsedNodes) && parsedNodes.length > 0) {
                    parsedNodes.forEach((cfg) => {
                        const pos = new THREE.Vector3(cfg.posX || 0, cfg.posY || 0, cfg.posZ || 0);
                        let nodeInstance = null;

                        if (cfg.type === 'fire-gem' && typeof FireGemNode !== 'undefined') {
                            nodeInstance = new FireGemNode(pos, cfg.id, cfg.hue, cfg.scale, cfg.cardData || {}, cfg.innerHue);
                        } else if (cfg.type === 'sign' && typeof SignNode !== 'undefined') {
                            nodeInstance = new SignNode(pos, cfg.id, cfg.hue, cfg.scale, cfg.cardData || {}, cfg.innerHue);
                        } else if (typeof Atom !== 'undefined') {
                            nodeInstance = new Atom(pos, cfg.id, cfg.hue, cfg.scale, cfg.cardType || 'stargate', cfg.cardData || null, cfg.innerHue);
                        }

                        if (nodeInstance) {
                            nodeInstance.title = cfg.title || cfg.id;
                            nodeInstance.description = cfg.description || '';
                            
                            if (nodeInstance.group) {
                                nodeInstance.group.position.copy(pos);
                                if (cfg.rotation !== undefined) {
                                    if (cfg.type === 'fire-gem' && typeof nodeInstance.setZRotation === 'function') {
                                        nodeInstance.setZRotation(THREE.MathUtils.degToRad(Number(cfg.rotation)));
                                    } else {
                                        nodeInstance.group.rotation.z = THREE.MathUtils.degToRad(Number(cfg.rotation));
                                    }
                                }
                                nodeInstance.group.userData = { atomId: nodeInstance.id };
                                nodeInstance.group.traverse(child => {
                                    if (child.isMesh) {
                                        child.userData = { atomId: nodeInstance.id };
                                    }
                                });
                            }
                            this.atoms.push(nodeInstance);
                        }
                    });
                    if (this.monitor) {
                        this.monitor.log('SUCCESS', `Loaded ${parsedNodes.length} nodes from local storage cookies.`, 'COOKIE');
                    }
                }
            }
        } catch (e) {
            console.error('Failed to load saved state from cookies/localStorage:', e);
        }
    }

    saveNodesToCookies() {
        try {
            const dataToSave = this.atoms.map(atom => ({
                id: atom.id,
                type: atom.cardType === 'firegem' ? 'fire-gem' : (atom.cardType === 'sign' ? 'sign' : 'stargate'),
                cardType: atom.cardType,
                title: atom.title || atom.id,
                description: atom.description || '',
                posX: atom.position ? atom.position.x : (atom.group ? atom.group.position.x : 0),
                posY: atom.position ? atom.position.y : (atom.group ? atom.group.position.y : 0),
                posZ: atom.position ? atom.position.z : (atom.group ? atom.group.position.z : 0),
                hue: atom.hue,
                innerHue: atom.innerHue,
                scale: atom.scaleMultiplier,
                rotation: atom.group ? Math.round(THREE.MathUtils.radToDeg(atom.cardType === 'firegem' ? (atom.outerGroup ? atom.outerGroup.rotation.z : atom.group.rotation.z) : atom.group.rotation.y || 0)) : 0,
                cardData: atom.cardData || {}
            }));
            localStorage.setItem('rru_saved_nodes', JSON.stringify(dataToSave));
            if (this.monitor) {
                this.monitor.log('SUCCESS', 'Persisted current simulation state to cookies.', 'COOKIE');
            }
        } catch (e) {
            console.error('Failed to save state to cookies/localStorage:', e);
        }
    }

    initSelectionRaycaster() {
        const dom = this.renderer.domElement;
        let lastClickTime = 0;

        dom.addEventListener('click', (event) => {
            const now = Date.now();
            if (now - lastClickTime < 300) return; // Prevent double-click interference
            lastClickTime = now;

            const mouse = new THREE.Vector2();
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouse, this.camera);

            const intersectObjects = [];
            this.atoms.forEach(atom => {
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

            const intersects = raycaster.intersectObjects(intersectObjects, true);

            if (intersects.length > 0) {
                let hitObject = intersects[0].object;
                let targetAtomId = null;
                let currentObj = hitObject;

                while (currentObj && currentObj !== this.scene) {
                    if (currentObj.userData && currentObj.userData.atomId !== undefined) {
                        targetAtomId = currentObj.userData.atomId;
                        break;
                    }
                    currentObj = currentObj.parent;
                }

                const foundAtom = targetAtomId !== null 
                    ? this.atoms.find(a => a.id === targetAtomId || (a.group && a.group.uuid === targetAtomId))
                    : null;

                if (foundAtom) {
                    this.selectedAtom = foundAtom;

                    // HALT CAMERA ORBIT DRIFT ON OBJECT CLICK
                    this.isOrbitLocked = true;
                    // Capture current angular offset so camera freezes precisely where it was clicked
                    this.orbitAngleOffset = this.lastAutoCamAngle - (this.clock.getElapsedTime() * 0.03);

                    if (typeof window.devForm !== 'undefined') {
                        window.devForm.show();
                        window.devForm.setFormData({
                            nodeId: foundAtom.id || foundAtom.group.uuid,
                            title: foundAtom.title || 'Stargate Node',
                            description: foundAtom.description || '',
                            hue: foundAtom.hue || 185,
                            innerHue: foundAtom.innerHue || 230,
                            scale: foundAtom.scaleMultiplier || 1.0,
                            rotation: foundAtom.group ? Math.round(THREE.MathUtils.radToDeg(foundAtom.group.rotation.z || foundAtom.group.rotation.y || 0)) : 0
                        });
                    }

                    if (this.monitor) {
                        this.monitor.log('INFO', `Selected node [${foundAtom.id}] - Camera rotation locked.`, 'INSPECTOR');
                    }
                }
            } else {
                // Clicking empty space releases the camera lock, resuming subtle orbit drift
                this.isOrbitLocked = false;
                if (this.monitor) {
                    this.monitor.log('INFO', 'Deselected / Background clicked - Camera orbit resumed.', 'ENGINE');
                }
            }
        });
    }

    initDevFormBridge() {
        if (typeof window.devForm === 'undefined') {
            window.devForm = new AvisDevFormModule('primary_inspector');
        }

        window.devForm.on('change', (event) => {
            if (!this.selectedAtom) return;

            if (event.type === 'hue' && typeof this.selectedAtom.updateHue === 'function') {
                this.selectedAtom.updateHue(Number(event.value));
            } else if (event.type === 'innerHue' && typeof this.selectedAtom.setInnerHue === 'function') {
                this.selectedAtom.setInnerHue(Number(event.value));
            } else if (event.type === 'scale' && typeof this.selectedAtom.setScale === 'function') {
                this.selectedAtom.setScale(Number(event.value));
            } else if (event.type === 'rotation' && this.selectedAtom.group) {
                const radVal = THREE.MathUtils.degToRad(Number(event.value));
                if (this.selectedAtom.cardType === 'firegem') {
                    if (typeof this.selectedAtom.setZRotation === 'function') {
                        this.selectedAtom.setZRotation(radVal);
                    } else if (this.selectedAtom.outerGroup) {
                        this.selectedAtom.outerGroup.rotation.z = radVal;
                    } else {
                        this.selectedAtom.group.rotation.z = radVal;
                    }
                } else {
                    this.selectedAtom.group.rotation.y = radVal;
                }
            }
        });

        window.devForm.on('save', (data) => {
            if (!this.selectedAtom) return;
            this.selectedAtom.title = data.title;
            this.selectedAtom.description = data.description;
            if (data.rotation !== undefined && this.selectedAtom.group) {
                const radVal = THREE.MathUtils.degToRad(Number(data.rotation));
                if (this.selectedAtom.cardType === 'firegem') {
                    if (typeof this.selectedAtom.setZRotation === 'function') {
                        this.selectedAtom.setZRotation(radVal);
                    } else if (this.selectedAtom.outerGroup) {
                        this.selectedAtom.outerGroup.rotation.z = radVal;
                    } else {
                        this.selectedAtom.group.rotation.z = radVal;
                    }
                } else {
                    this.selectedAtom.group.rotation.y = radVal;
                }
            }
            this.saveNodesToCookies();
        });

        window.devForm.on('delete', (nodeId) => {
            const index = this.atoms.findIndex(a => a.id === nodeId || (a.group && a.group.uuid === nodeId));
            if (index !== -1) {
                const atom = this.atoms[index];
                if (typeof atom.dispose === 'function') {
                    atom.dispose();
                } else if (atom.group) {
                    this.scene.remove(atom.group);
                }
                this.atoms.splice(index, 1);
                this.selectedAtom = null;
                this.isOrbitLocked = false; // Resume orbit on deletion
                window.devForm.setFormData({ nodeId: '', title: '', description: '', hue: 185, innerHue: 230, scale: 1.0, rotation: 0 });
                this.saveNodesToCookies();
            }
        });
    }

    initDragDrop() {
        const dom = this.renderer.domElement;

        dom.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = 'copy';
        });

        dom.addEventListener('drop', (e) => {
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

                const mouse = new THREE.Vector2();
                mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
                mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

                const raycaster = new THREE.Raycaster();
                raycaster.setFromCamera(mouse, this.camera);

                const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
                const targetPos = new THREE.Vector3();
                raycaster.ray.intersectPlane(plane, targetPos);

                const uniqueId = `node_${Date.now().toString(36)}`;
                let newNode = null;

                if (spawnType === 'fire-gem' && typeof FireGemNode !== 'undefined') {
                    newNode = new FireGemNode(targetPos, uniqueId, 15, 1.0, {}, 45);
                    newNode.cardType = 'firegem';
                } else if (spawnType === 'sign' && typeof SignNode !== 'undefined') {
                    newNode = new SignNode(targetPos, uniqueId, 185, 1.0, {}, 230);
                    newNode.cardType = 'sign';
                } else if (typeof Atom !== 'undefined') {
                    newNode = new Atom(targetPos, uniqueId, 185, 1.0, 'stargate', null, 230);
                    newNode.cardType = 'stargate';
                }

                if (newNode) {
                    newNode.title = `${spawnType.toUpperCase()} Node`;
                    newNode.description = `Deployed via drag-and-drop toolkit.`;
                    
                    if (newNode.group) {
                        newNode.group.position.copy(targetPos);
                        newNode.group.rotation.y = 0;
                        newNode.group.userData = { atomId: newNode.id };
                        newNode.group.traverse(child => {
                            if (child.isMesh) {
                                child.userData = { atomId: newNode.id };
                            }
                        });
                    }
                    newNode.position = targetPos.clone();

                    this.atoms.push(newNode);
                    this.selectedAtom = newNode;
                    this.isOrbitLocked = true; // Lock camera upon spawning a new node

                    if (typeof window.devForm !== 'undefined') {
                        window.devForm.setFormData({
                            nodeId: uniqueId,
                            title: newNode.title,
                            description: newNode.description,
                            hue: newNode.hue || 185,
                            innerHue: newNode.innerHue || 230,
                            scale: newNode.scaleMultiplier || 1.0,
                            rotation: 0
                        });
                    }

                    this.saveNodesToCookies();
                }
            } finally {
                setTimeout(() => { this._isDropping = false; }, 150);
            }
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const elapsedTime = this.clock.getElapsedTime();

        this.atoms.forEach(atom => {
            if (typeof atom.update === 'function') {
                atom.update(elapsedTime);
            }
        });

        // Camera Orbit Control: Freeze position when selected/locked, otherwise continue drift
        if (!this.isOrbitLocked) {
            this.lastAutoCamAngle = elapsedTime * 0.03 + this.orbitAngleOffset;
        }

        this.camera.position.x = Math.cos(this.lastAutoCamAngle) * 700;
        this.camera.position.z = Math.sin(this.lastAutoCamAngle) * 700;
        this.camera.lookAt(0, 0, 0);

        this.renderer.render(this.scene, this.camera);
    }
}

// Auto-boot map engine once DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.rruMap = new RRUMapSystem();
    });
} else {
    window.rruMap = new RRUMapSystem();
}
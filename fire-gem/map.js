/* ================================================================= *
 * RRU - Map Viewport, Grid Elevation & Navigation Controller (map.js) *
 * ================================================================= *
 * Unified Cookie Persistence & AVIS Error-Handling Integration      *
 * ================================================================= */

(function () {
    'use strict';

    let scene, camera, renderer, clock;
    let groundPlane, gridHelper;
    let gridElevation = 0;
    let currentBackgroundType = 'cyber';
    const entities = [];

    // Camera & Pan/Zoom Control State (Defaults)
    const cameraTarget = new THREE.Vector3(0, 0, 0);
    let cameraDistance = 450;
    let cameraAngleX = 0;
    let cameraAngleY = Math.PI / 4; // Isometric elevation
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const textureLoader = new THREE.TextureLoader();

    const COOKIE_NAME = 'rru_session_cookie';

    // --- Unified Cookie Store Manager ---
    window.RRUNebStore = window.RRUNebStore || {
        currentNebData: null,

        saveCookie(data) {
            try {
                const jsonStr = JSON.stringify(data);
                // Set cookie to expire in 30 days, path=/
                const d = new Date();
                d.setTime(d.getTime() + (30 * 24 * 60 * 60 * 1000));
                document.cookie = `${COOKIE_NAME}=${encodeURIComponent(jsonStr)};expires=${d.toUTCString()};path=/;SameSite=Strict`;
            } catch (err) {
                console.error('[RRUNebStore] Failed to save session cookie:', err);
            }
        },

        loadCookie() {
            try {
                const nameEQ = COOKIE_NAME + "=";
                const ca = document.cookie.split(';');
                for (let i = 0; i < ca.length; i++) {
                    let c = ca[i];
                    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
                    if (c.indexOf(nameEQ) === 0) {
                        return JSON.parse(decodeURIComponent(c.substring(nameEQ.length, c.length)));
                    }
                }
            } catch (err) {
                console.error('[RRUNebStore] Failed to parse session cookie:', err);
            }
            return null;
        },

        compileAndSave() {
            const cameraData = {
                cameraDistance: cameraDistance,
                cameraAngleX: cameraAngleX,
                cameraAngleY: cameraAngleY,
                cameraTarget: {
                    x: cameraTarget.x,
                    y: cameraTarget.y,
                    z: cameraTarget.z
                }
            };

            const nodes = (window.atoms || []).map((node, index) => ({
                id: node.id || index,
                type: node.cardType || node.type || 'stargate',
                position: node.position ? { x: node.position.x, y: node.position.y, z: node.position.z } : null,
                rotation: node.rotation ? { x: node.rotation.x, y: node.rotation.y, z: node.rotation.z } : null,
                hue: node.hue !== undefined ? node.hue : 185,
                innerHue: node.innerHue !== undefined ? node.innerHue : 230,
                scale: node.scaleMultiplier !== undefined ? node.scaleMultiplier : 1.0,
                cardData: node.cardData || {}
            }));

            this.currentNebData = {
                version: "2026.05",
                timestamp: new Date().toISOString(),
                elevation: gridElevation,
                backgroundEnv: currentBackgroundType,
                camera: cameraData,
                nodes: nodes
            };

            this.saveCookie(this.currentNebData);
        }
    };

    function initMap() {
        const container = document.getElementById('webgl-container');
        if (!container) return;

        // --- Load State from Unified Cookie ---
        try {
            const savedData = window.RRUNebStore.loadCookie();
            if (savedData) {
                window.RRUNebStore.currentNebData = savedData;
                if (savedData.camera) {
                    if (savedData.camera.cameraDistance !== undefined) cameraDistance = savedData.camera.cameraDistance;
                    if (savedData.camera.cameraAngleX !== undefined) cameraAngleX = savedData.camera.cameraAngleX;
                    if (savedData.camera.cameraAngleY !== undefined) cameraAngleY = savedData.camera.cameraAngleY;
                    if (savedData.camera.cameraTarget) {
                        cameraTarget.set(
                            savedData.camera.cameraTarget.x || 0,
                            savedData.camera.cameraTarget.y || 0,
                            savedData.camera.cameraTarget.z || 0
                        );
                    }
                }
                if (savedData.elevation !== undefined) {
                    gridElevation = savedData.elevation;
                }
                if (savedData.backgroundEnv) {
                    currentBackgroundType = savedData.backgroundEnv;
                }
            }
        } catch (err) {
            if (typeof window.toastLog === 'function') {
                window.toastLog(`<span style="color:#ff4444;">[AVIS-ERR] Cookie parser exception caught:</span> ${err.message}`);
            } else {
                console.error('AVIS State Parser Error:', err);
            }
        }

        scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x020813, 0.0015);

        camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 5000);

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(renderer.domElement);

        clock = new THREE.Clock();

        // Visible Cyber Grid on XZ plane
        gridHelper = new THREE.GridHelper(2000, 40, 0x00f2ff, 0x003366);
        gridHelper.position.y = gridElevation;
        scene.add(gridHelper);

        // Invisible ground plane for raycast coordinate intersection matching grid elevation
        const planeGeo = new THREE.PlaneGeometry(5000, 5000);
        planeGeo.rotateX(-Math.PI / 2);
        const planeMat = new THREE.MeshBasicMaterial({ visible: false });
        groundPlane = new THREE.Mesh(planeGeo, planeMat);
        groundPlane.position.y = gridElevation;
        scene.add(groundPlane);

        // Load Restored or Default Background
        setupBackground(currentBackgroundType);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0x00f2ff, 0.7);
        scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0xffd700, 2, 800);
        pointLight.position.set(0, 300, 200);
        scene.add(pointLight);

        // --- Wire Up Grid Elevation Buttons & Background Select ---
        const raiseBtn = document.getElementById('grid-raise-btn');
        const lowerBtn = document.getElementById('grid-lower-btn');
        const elevValSpan = document.getElementById('grid-elevation-val');
        const bgSelect = document.getElementById('bg-texture-select');

        if (elevValSpan) elevValSpan.textContent = gridElevation;

        if (raiseBtn) {
            raiseBtn.addEventListener('click', () => {
                gridElevation += 20;
                updateGridElevation(elevValSpan);
                window.RRUNebStore.compileAndSave();
            });
        }

        if (lowerBtn) {
            lowerBtn.addEventListener('click', () => {
                gridElevation -= 20;
                updateGridElevation(elevValSpan);
                window.RRUNebStore.compileAndSave();
            });
        }

        if (bgSelect) {
            bgSelect.classList.add('win-select', 'glass-panel');
            bgSelect.value = currentBackgroundType;
            bgSelect.innerHTML = `
                <option value="image">Background Image Only</option>
                <option value="cyber">Cyber (Background Image + Grid)</option>
                <option value="grid">Standard Grid Only</option>
                <option value="infrared">Infrared Ice Theme</option>
            `;

            bgSelect.addEventListener('change', (e) => {
                currentBackgroundType = e.target.value;
                setupBackground(currentBackgroundType);
                window.RRUNebStore.compileAndSave();
            });
        }

        // Event Listeners for Pan/Zoom & Context Menu
        window.addEventListener('resize', onWindowResize);

        container.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                isDragging = true;
                previousMousePosition = { x: e.clientX, y: e.clientY };
            }
        });

        container.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            window.dispatchEvent(new CustomEvent('map-contextmenu', {
                detail: { clientX: e.clientX, clientY: e.clientY }
            }));
        });

        container.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            const deltaX = e.clientX - previousMousePosition.x;
            const deltaY = e.clientY - previousMousePosition.y;

            if (window.RRURouter && window.RRURouter.dropperActive) {
                const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraAngleX);
                const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraAngleX);
                cameraTarget.addScaledVector(right, -deltaX * 0.8);
                cameraTarget.addScaledVector(forward, deltaY * 0.8);
            } else {
                cameraAngleX -= deltaX * 0.005;
                cameraAngleY = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, cameraAngleY + deltaY * 0.005));
            }

            previousMousePosition = { x: e.clientX, y: e.clientY };
            
            try {
                window.RRUNebStore.compileAndSave();
            } catch (saveErr) {
                if (typeof window.toastLog === 'function') {
                    window.toastLog(`<span style="color:#ffd700;">[AVIS-WARN] State sync warning:</span> ${saveErr.message}`);
                }
            }
        });

        window.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                window.RRUNebStore.compileAndSave();
            }
        });

        container.addEventListener('wheel', (e) => {
            e.preventDefault();
            cameraDistance = Math.max(100, Math.min(1500, cameraDistance + e.deltaY * 0.5));
            window.RRUNebStore.compileAndSave();
        }, { passive: false });

        animateMap();
    }

    function updateGridElevation(spanEl) {
        if (gridHelper) gridHelper.position.y = gridElevation;
        if (groundPlane) groundPlane.position.y = gridElevation;
        if (spanEl) spanEl.textContent = gridElevation;
    }

    function setupBackground(type) {
        currentBackgroundType = type;
        if (gridHelper) {
            gridHelper.visible = (type !== 'image');
        }

        if (type === 'cyber') {
            textureLoader.load('nbg.png', (texture) => {
                texture.colorSpace = THREE.SRGBColorSpace;
                scene.background = texture;
            }, undefined, () => {
                scene.background = new THREE.Color(0x010409);
            });
            scene.fog = new THREE.FogExp2(0x00f2ff, 0x0008);
        } else if (type === 'grid') {
            scene.background = new THREE.Color(0x02050a);
            scene.fog = new THREE.FogExp2(0x050b14, 0.0012);
        } else if (type === 'infrared') {
            scene.background = new THREE.Color(0x080214);
            scene.fog = new THREE.FogExp2(0xff0055, 0.001);
        } else if (type === 'image') {
            textureLoader.load('nbg.png', (texture) => {
                texture.colorSpace = THREE.SRGBColorSpace;
                scene.background = texture;
            }, undefined, () => {
                scene.background = new THREE.Color(0x010409);
            });
            scene.fog = new THREE.FogExp2(0x010409, 0.0012);
        }
    }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animateMap() {
        requestAnimationFrame(animateMap);
        const elapsedTime = clock.getElapsedTime();

        camera.position.x = cameraTarget.x + cameraDistance * Math.sin(cameraAngleY) * Math.sin(cameraAngleX);
        camera.position.y = cameraTarget.y + cameraDistance * Math.cos(cameraAngleY);
        camera.position.z = cameraTarget.z + cameraDistance * Math.sin(cameraAngleY) * Math.cos(cameraAngleX);
        camera.lookAt(cameraTarget);

        entities.forEach(entity => {
            if (typeof entity.update === 'function') {
                try {
                    entity.update(elapsedTime);
                } catch (entityErr) {
                    // Suppress or log specific entity faults to AVIS monitor
                }
            }
        });

        renderer.render(scene, camera);
    }

    // Global Map Export Interface
    window.RRUMap = {
        scene,
        get camera() { return camera; },
        get cameraTarget() { return cameraTarget; },
        get cameraDistance() { return cameraDistance; },
        get cameraAngleX() { return cameraAngleX; },
        get cameraAngleY() { return cameraAngleY; },
        get gridElevation() { return gridElevation; },
        get backgroundEnv() { return currentBackgroundType; },
        get entities() { return entities; },
        
        focusOn(target, customDistance) {
            if (!target) return;
            if (target.isVector3) {
                cameraTarget.copy(target);
            } else if (target.position && target.position.isVector3) {
                cameraTarget.position ? cameraTarget.copy(target.position) : null;
            } else if (target.group && target.group.position) {
                cameraTarget.copy(target.group.position);
            }
            if (customDistance !== undefined) {
                cameraDistance = customDistance;
            }
            window.RRUNebStore.compileAndSave();
        },

        get3DPosition(clientX, clientY) {
            mouse.x = (clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(clientY / window.innerHeight) * 2 + 1;
            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObject(groundPlane);
            if (intersects.length > 0) {
                return intersects[0].point;
            }
            return new THREE.Vector3(0, gridElevation, 0);
        },
        addEntity(entity) {
            entities.push(entity);
            if (entity.group && scene) {
                scene.add(entity.group);
            }
            window.RRUNebStore.compileAndSave();
        },
        removeEntity(entity) {
            const index = entities.indexOf(entity);
            if (index !== -1) {
                entities.splice(index, 1);
            }
            if (entity.group && scene) {
                scene.remove(entity.group);
            }
            window.RRUNebStore.compileAndSave();
        },
        clearAllEntities() {
            while (entities.length > 0) {
                const entity = entities.pop();
                if (typeof entity.dispose === 'function') {
                    try { entity.dispose(); } catch(e) {}
                }
                if (entity.group && scene) {
                    scene.remove(entity.group);
                }
            }
            window.RRUNebStore.compileAndSave();
        }
    };

    window.addEventListener('DOMContentLoaded', initMap);
})();
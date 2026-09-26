/* ================================================================= *
 * RRU - Map Viewport, Grid Elevation & Navigation Controller (map.js) *
 * ================================================================= */

(function () {
    'use strict';

    let scene, camera, renderer, clock;
    let groundPlane, gridHelper;
    let gridElevation = 0;
    const entities = [];

    // Camera & Pan/Zoom Control State
    const cameraTarget = new THREE.Vector3(0, 0, 0);
    let cameraDistance = 450;
    let cameraAngleX = 0;
    let cameraAngleY = Math.PI / 4; // Isometric elevation
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const textureLoader = new THREE.TextureLoader();

    function initMap() {
        const container = document.getElementById('webgl-container');
        if (!container) return;

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

        // Default to Cyber background (Image + Grid)
        setupBackground('cyber');

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

        if (raiseBtn) {
            raiseBtn.addEventListener('click', () => {
                gridElevation += 20;
                updateGridElevation(elevValSpan);
            });
        }

        if (lowerBtn) {
            lowerBtn.addEventListener('click', () => {
                gridElevation -= 20;
                updateGridElevation(elevValSpan);
            });
        }

        if (bgSelect) {
            // Apply win CSS styling classes to the select element if not already present
            bgSelect.classList.add('win-select', 'glass-panel');

            bgSelect.innerHTML = `
			<option value="image">Background Image Only</option>
                <option value="cyber">Cyber (Background Image + Grid)</option>
                <option value="grid">Standard Grid Only</option>
                <option value="infrared">Infrared Ice Theme</option>
                
            `;

            bgSelect.addEventListener('change', (e) => {
                setupBackground(e.target.value);
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
                const panSpeed = 0.8;
                const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraAngleX);
                const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraAngleX);
                cameraTarget.addScaledVector(right, -deltaX * panSpeed);
                cameraTarget.addScaledVector(forward, deltaY * panSpeed);
            } else {
                cameraAngleX -= deltaX * 0.005;
                cameraAngleY = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, cameraAngleY + deltaY * 0.005));
            }

            previousMousePosition = { x: e.clientX, y: e.clientY };
        });

        window.addEventListener('mouseup', () => {
            isDragging = false;
        });

        container.addEventListener('wheel', (e) => {
            e.preventDefault();
            cameraDistance = Math.max(100, Math.min(1500, cameraDistance + e.deltaY * 0.5));
        }, { passive: false });

        animateMap();
    }

    function updateGridElevation(spanEl) {
        if (gridHelper) gridHelper.position.y = gridElevation;
        if (groundPlane) groundPlane.position.y = gridElevation;
        if (spanEl) spanEl.textContent = gridElevation;
    }

    function setupBackground(type) {
        // Grid visibility rules: Shown on cyber, grid, and infrared modes; hidden on image-only mode
        if (gridHelper) {
            gridHelper.visible = (type !== 'image');
        }

        if (type === 'cyber') {
            // Cyber: Background Image + Grid Enabled
            textureLoader.load('nbg.png', (texture) => {
                texture.colorSpace = THREE.SRGBColorSpace;
                scene.background = texture;
            }, undefined, () => {
                scene.background = new THREE.Color(0x010409);
            });
            scene.fog = new THREE.FogExp2(0x00f2ff, 0.0008);
        } else if (type === 'grid') {
            // Standard Grid Only
            scene.background = new THREE.Color(0x02050a);
            scene.fog = new THREE.FogExp2(0x050b14, 0.0012);
        } else if (type === 'infrared') {
            // Infrared Ice Thermal Style
            scene.background = new THREE.Color(0x080214);
            scene.fog = new THREE.FogExp2(0xff0055, 0.001);
        } else if (type === 'image') {
            // Background Image Only (No Grid)
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

        // Update Camera Spherical Position
        camera.position.x = cameraTarget.x + cameraDistance * Math.sin(cameraAngleY) * Math.sin(cameraAngleX);
        camera.position.y = cameraTarget.y + cameraDistance * Math.cos(cameraAngleY);
        camera.position.z = cameraTarget.z + cameraDistance * Math.sin(cameraAngleY) * Math.cos(cameraAngleX);
        camera.lookAt(cameraTarget);

        // Update all active nodes/entities
        entities.forEach(entity => {
            if (typeof entity.update === 'function') {
                entity.update(elapsedTime);
            }
        });

        renderer.render(scene, camera);
    }

    // Global Map Export Interface
    window.RRUMap = {
        scene,
        get camera() { return camera; },
        get cameraTarget() { return cameraTarget; },
        get gridElevation() { return gridElevation; },
        get entities() { return entities; },
        
        focusOn(target, customDistance) {
            if (!target) return;
            if (target.isVector3) {
                cameraTarget.copy(target);
            } else if (target.position && target.position.isVector3) {
                cameraTarget.copy(target.position);
            } else if (target.group && target.group.position) {
                cameraTarget.copy(target.group.position);
            }
            if (customDistance !== undefined) {
                cameraDistance = customDistance;
            }
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
        },
        removeEntity(entity) {
            const index = entities.indexOf(entity);
            if (index !== -1) {
                entities.splice(index, 1);
            }
            if (entity.group && scene) {
                scene.remove(entity.group);
            }
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
        }
    };

    window.addEventListener('DOMContentLoaded', initMap);
})();


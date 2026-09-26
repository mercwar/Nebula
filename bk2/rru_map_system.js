/* ================================================================= *
 * RRU - Unified Map & Simulation Engine (rru_map_system.js)        *
 * Operator: CVBGOD                                                 *
 * ================================================================= *
 */

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
        
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.clock = new THREE.Clock();

        this.initEngine();
        this.initEnvironment();
        this.initDiagnostics();
        this.initListeners();
        this.initDevFormBridge();
        
        this.animate();
    }

    initEngine() {
        window.scene = new THREE.Scene();
        this.scene = window.scene;
        this.scene.fog = new THREE.FogExp2(0x020617, 0.0015);

        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 5000);
        this.camera.position.set(0, 300, 600);
        this.camera.lookAt(0, 0, 0);

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

    initDevFormBridge() {
        if (typeof window.devForm === 'undefined') {
            window.devForm = new AvisDevFormModule('primary_inspector');
        }

        window.devForm.on('change', (event) => {
            if (!this.selectedAtom) return;

            if (event.type === 'hue' && typeof this.selectedAtom.setHue === 'function') {
                this.selectedAtom.setHue(Number(event.value));
            } else if (event.type === 'innerHue' && typeof this.selectedAtom.setInnerHue === 'function') {
                this.selectedAtom.setInnerHue(Number(event.value));
            } else if (event.type === 'scale' && typeof this.selectedAtom.setScale === 'function') {
                this.selectedAtom.setScale(Number(event.value));
            } else if (event.type === 'rotation' && this.selectedAtom.group) {
                this.selectedAtom.group.rotation.y = THREE.MathUtils.degToRad(Number(event.value));
            }
        });

        window.devForm.on('save', (data) => {
            if (!this.selectedAtom) return;
            this.selectedAtom.title = data.title;
            this.selectedAtom.description = data.description;
            if (this.monitor) {
                this.monitor.log('SUCCESS', `Updated node data for [${data.nodeId}]`, 'DB');
            }
        });

        window.devForm.on('delete', (nodeId) => {
            const index = this.atoms.findIndex(a => a.id === nodeId || (a.group && a.group.uuid === nodeId));
            if (index !== -1) {
                const atom = this.atoms[index];
                if (typeof atom.dispose === 'function') atom.dispose();
                this.atoms.splice(index, 1);
                this.selectedAtom = null;
                window.devForm.setFormData({ nodeId: '', title: '', description: '', hue: 185, innerHue: 230, scale: 1.0, rotation: 0 });
                if (this.monitor) this.monitor.log('WARN', `Deleted node [${nodeId}] from simulation`, 'MAP');
            }
        });

        window.devForm.on('clearAll', () => {
            this.atoms.forEach(atom => {
                if (typeof atom.dispose === 'function') atom.dispose();
            });
            this.atoms = [];
            this.selectedAtom = null;
            window.devForm.hide();
            if (this.monitor) this.monitor.log('WARN', 'Cleared all active simulation nodes.', 'MAP');
        });
    }

    initListeners() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        this.renderer.domElement.addEventListener('click', (event) => {
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            this.raycaster.setFromCamera(this.mouse, this.camera);
            
            const intersectObjects = [];
            this.atoms.forEach(atom => {
                if (atom.group) {
                    atom.group.traverse(child => {
                        if (child.isMesh) intersectObjects.push(child);
                    });
                }
            });

            const intersects = this.raycaster.intersectObjects(intersectObjects, true);

            if (intersects.length > 0) {
                let hitGroup = intersects[0].object;
                while (hitGroup.parent && hitGroup.parent !== this.scene) {
                    hitGroup = hitGroup.parent;
                }

                const foundAtom = this.atoms.find(a => a.group === hitGroup || (a.mesh && a.mesh === intersects[0].object));
                if (foundAtom) {
                    this.selectedAtom = foundAtom;
                    window.devForm.show();
                    window.devForm.setFormData({
                        nodeId: foundAtom.id || foundAtom.group.uuid,
                        title: foundAtom.title || 'Stargate Node',
                        description: foundAtom.description || '',
                        hue: foundAtom.hue || 185,
                        innerHue: foundAtom.innerHue || 230,
                        scale: foundAtom.scaleMultiplier || 1.0,
                        rotation: Math.round(THREE.MathUtils.radToDeg(foundAtom.group.rotation.y || 0))
                    });

                    if (this.monitor) {
                        this.monitor.log('INFO', `Selected node: ${foundAtom.id}`, 'INSPECTOR');
                    }
                }
            }
        });

        const domEl = this.renderer.domElement;
        domEl.addEventListener('dragover', (e) => e.preventDefault());
        domEl.addEventListener('drop', (e) => {
            e.preventDefault();
            const spawnType = e.dataTransfer.getData('text/plain');
            if (!spawnType) return;

            const rect = domEl.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

            // Intersect drop ray against ground plane (y = 0) for precise world positioning
            const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
            this.raycaster.setFromCamera(new THREE.Vector2(x, y), this.camera);
            const spawnPos = new THREE.Vector3();
            this.raycaster.ray.intersectPlane(plane, spawnPos);

            const newId = `${spawnType}_${Date.now().toString().slice(-4)}`;
            
            if (spawnType === 'fire-gem' && typeof FireGemNode !== 'undefined') {
                const gem = new FireGemNode(spawnPos, newId, 15, 1.0, {}, 45);
                this.atoms.push(gem);
                if (this.monitor) this.monitor.log('SUCCESS', `Deployed Fire Gem [${newId}]`, 'SPAWN');
            } else if (spawnType === 'sign' && typeof Sign !== 'undefined') {
                const signNode = new Sign(spawnPos, newId, 185, 1.0, {}, 220);
                this.atoms.push(signNode);
                if (this.monitor) this.monitor.log('SUCCESS', `Deployed Sign [${newId}]`, 'SPAWN');
            } else if (typeof Atom !== 'undefined') {
                const atom = new Atom(spawnPos, newId, 200, 1.0, spawnType, null, 120);
                this.atoms.push(atom);
                if (this.monitor) this.monitor.log('SUCCESS', `Deployed Atom [${newId}]`, 'SPAWN');
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

        const camAngle = elapsedTime * 0.03;
        this.camera.position.x = Math.cos(camAngle) * 700;
        this.camera.position.z = Math.sin(camAngle) * 700;
        this.camera.lookAt(0, 0, 0);

        this.renderer.render(this.scene, this.camera);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.rruMap = new RRUMapSystem();
    });
} else {
    window.rruMap = new RRUMapSystem();
}
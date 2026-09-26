/* ================================================================= *
 * RRU Canvas & Renderer Engine (canvas.js)                          *
 * Operator: CVBGOD                                                  *
 * ================================================================= */

class RRURendererApp {
    constructor(initialJSON = null) {
        this.container = document.getElementById('canvas-container');

        // --- 1. Initialize Frame Engine (JSON State Management) ---
        this.frame = new RRUFrame(initialJSON);
        window.rruFrame = this.frame; // Global hook for UI forms and JS mods

        // --- 2. Three.js Scene, Camera, & WebGL Renderer ---
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x050508);
        window.scene = this.scene; // Global reference for node classes

        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 5000);
        this.camera.position.set(0, 180, 450);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);

        // --- 3. Build Scene Environment from JSON Frame Schema ---
        this.buildSceneFromFrame();

        // --- 4. Animation Loop & Event Listeners ---
        this.clock = new THREE.Clock();
        this.animate = this.animate.bind(this);
        this.initListeners();
        this.animate();
    }

    buildSceneFromFrame() {
        const schema = this.frame.frameSchema;

        // A. Build Constellation Map from JSON map config
        if (typeof RRUMap !== 'undefined') {
            this.constellationMap = new RRUMap(this.scene, schema.map);
        }

        // B. Build Identity Nodes dynamically from JSON nodes array
        this.nodeInstances = [];
        schema.nodes.forEach(nodeData => {
            let instance = null;
            const pos = new THREE.Vector3(nodeData.position.x, nodeData.position.y, nodeData.position.z);

            if (nodeData.cardType === 'firegem' && typeof FireGemNode !== 'undefined') {
                instance = new FireGemNode(pos, nodeData.id, nodeData.hue, nodeData.scale, nodeData, nodeData.innerHue);
            } else if (nodeData.cardType === 'stargate' && typeof Atom !== 'undefined') {
                instance = new Atom(pos, nodeData.id, nodeData.hue, nodeData.scale, nodeData.cardType, nodeData, nodeData.innerHue);
            } else if (nodeData.cardType === 'sign' && typeof SignNode !== 'undefined') {
                instance = new SignNode(pos, nodeData.id, nodeData.hue, nodeData.scale, nodeData, nodeData.innerHue);
            }

            if (instance) {
                this.frame.registerInstance(nodeData.id, instance);
                this.nodeInstances.push(instance);
            }
        });

        // C. Build Event Manager from JSON events config
        if (typeof RRUEvents !== 'undefined') {
            this.eventManager = new RRUEvents(this.camera, this.scene, this.container, schema.events);
        }
    }

    animate() {
        requestAnimationFrame(this.animate);
        const elapsedTime = this.clock.getElapsedTime();

        // Update all active animated rendered node instances
        this.nodeInstances.forEach(instance => {
            if (instance && typeof instance.update === 'function') {
                instance.update(elapsedTime);
            }
        });

        this.renderer.render(this.scene, this.camera);
    }

    initListeners() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        window.addEventListener('rru:nodeselect', (e) => {
            if (e.detail && e.detail.id) {
                console.log("Selected Identity Node ID:", e.detail.id);
            }
        });
    }
}

window.RRURendererApp = RRURendererApp;
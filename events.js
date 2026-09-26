/* ================================================================= *
 * RRU Event Manager Engine (events.js)                              *
 * Operator: CVBGOD                                                  *
 * ================================================================= */

class RRUEvents {
    constructor(camera, scene, container, frameInstance) {
        this.camera = camera;
        this.scene = scene;
        this.container = container;
        this.frame = frameInstance;

        this.isMouseDown = false;
        this.isRightClick = false;
        this.previousMousePosition = { x: 0, y: 0 };

        // Pull initial camera & zoom state from JSON memory
        const mapState = this.frame.getState().map;
        this.cameraAngle = {
            theta: mapState.rotationTheta || 0,
            phi: mapState.rotationPhi || Math.PI / 4,
            radius: mapState.radius || 450
        };

        this.panTarget = new THREE.Vector3(
            mapState.offsetX || 0,
            mapState.offsetY || 0,
            mapState.offsetZ || 0
        );

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this.initEvents();
        this.updateCameraPosition();
    }

    initEvents() {
        this.container.addEventListener('mousedown', (e) => {
            this.isMouseDown = true;
            this.isRightClick = (e.button === 2);
            this.previousMousePosition = { x: e.clientX, y: e.clientY };

            // Sync latest from JSON schema before starting drag
            const mapState = this.frame.getState().map;
            this.cameraAngle.theta = mapState.rotationTheta;
            this.cameraAngle.phi = mapState.rotationPhi;
            this.cameraAngle.radius = mapState.radius || 450;
            this.panTarget.set(
                mapState.offsetX || 0,
                mapState.offsetY || 0,
                mapState.offsetZ || 0
            );

            if (!this.isRightClick) {
                this.handleRaycastSelection(e);
            }
        });

        window.addEventListener('mousemove', (e) => {
            if (!this.isMouseDown) return;

            const deltaX = e.clientX - this.previousMousePosition.x;
            const deltaY = e.clientY - this.previousMousePosition.y;

            if (this.isRightClick) {
                // Rotate view orbit
                this.cameraAngle.theta -= deltaX * 0.005;
                this.cameraAngle.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, this.cameraAngle.phi - deltaY * 0.005));
            } else {
                // Pan view using camera-relative coordinate vectors
                const panSpeed = this.cameraAngle.radius * 0.001;
                
                const right = new THREE.Vector3();
                const up = new THREE.Vector3();

                right.setFromMatrixColumn(this.camera.matrix, 0); // Camera right vector
                up.setFromMatrixColumn(this.camera.matrix, 1);    // Camera up vector

                this.panTarget.addScaledVector(right, -deltaX * panSpeed);
                this.panTarget.addScaledVector(up, deltaY * panSpeed);
            }

            this.previousMousePosition = { x: e.clientX, y: e.clientY };

            this.updateCameraPosition();
            this.commitMapState();
        });

        window.addEventListener('mouseup', () => {
            this.isMouseDown = false;
        });

        // Mouse Wheel Zoom Listener
        this.container.addEventListener('wheel', (e) => {
            e.preventDefault();

            // Sync latest zoom radius from JSON schema
            const mapState = this.frame.getState().map;
            this.cameraAngle.radius = mapState.radius || 450;

            // Adjust zoom radius based on scroll direction (forward = zoom in)
            const zoomSpeed = Math.max(20, this.cameraAngle.radius * 0.1);
            if (e.deltaY < 0) {
                this.cameraAngle.radius = Math.max(50, this.cameraAngle.radius - zoomSpeed);
            } else {
                this.cameraAngle.radius = Math.min(3000, this.cameraAngle.radius + zoomSpeed);
            }

            this.updateCameraPosition();
            this.commitMapState();
        }, { passive: false });

        this.container.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    updateCameraPosition() {
        const x = this.cameraAngle.radius * Math.sin(this.cameraAngle.phi) * Math.sin(this.cameraAngle.theta) + this.panTarget.x;
        const y = (this.cameraAngle.radius * Math.cos(this.cameraAngle.phi)) + this.panTarget.y;
        const z = (this.cameraAngle.radius * Math.sin(this.cameraAngle.phi) * Math.cos(this.cameraAngle.theta)) + this.panTarget.z;

        this.camera.position.set(x, y, z);
        this.camera.lookAt(this.panTarget);
    }

    commitMapState() {
        this.frame.updateMapTransform({
            offsetX: this.panTarget.x,
            offsetY: this.panTarget.y,
            offsetZ: this.panTarget.z,
            rotationTheta: this.cameraAngle.theta,
            rotationPhi: this.cameraAngle.phi,
            radius: this.cameraAngle.radius
        });
    }

    handleRaycastSelection(e) {
        const rect = this.container.getBoundingClientRect();
        this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);

        if (intersects.length > 0) {
            let target = intersects[0].object;
            while (target.parent && target.parent !== this.scene && !target.userData?.atomId) {
                target = target.parent;
            }

            const nodeId = target.userData?.atomId || target.parent?.userData?.atomId;
            if (nodeId) {
                this.frame.commit(schema => {
                    schema.events.selectedNodeId = nodeId;
                });

                window.dispatchEvent(new CustomEvent('rru:nodeselect', { detail: { id: nodeId } }));
            }
        }
    }
}

window.RRUEvents = RRUEvents;
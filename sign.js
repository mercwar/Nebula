/* ================================================================= *
 * RRU - Holographic Sign Panel Module (sign.js)                     *
 * Operator: CVBGOD                                                  *
 * ================================================================= */

class SignNode {
    constructor(position, id, hue = 185, scale = 1.0, cardData = {}, innerHue = 230) {
        this.id = id;
        this.cardType = 'sign';
        this.title = cardData.title || `SIGN Node`;
        this.description = cardData.description || `Deployed via drag-and-drop toolkit.`;
        this.hue = Number(hue) || 185;
        this.innerHue = Number(innerHue) || 230;
        this.scaleMultiplier = Number(scale) || 1.0;
        this.cardData = cardData;
        
        // Ensure rotation is correctly read from cardData/options
        this.rotation = Number(cardData.rotation) || 0;

        this.position = position.clone();
        this.group = new THREE.Group();
        this.group.position.copy(this.position);
        this.group.position.y += 25; // Center vertically above grid

        // Apply initial Z-axis rotation
        this.group.rotation.z = THREE.MathUtils.degToRad(this.rotation);

        // 1. Holographic Translucent Screen with Scanline Texture
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        this.texture = new THREE.CanvasTexture(canvas);

        const panelGeo = new THREE.PlaneGeometry(100, 60);
        const panelMat = new THREE.MeshBasicMaterial({
            map: this.texture,
            transparent: true,
            opacity: 0.85,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        this.mesh = new THREE.Mesh(panelGeo, panelMat);
        this.mesh.userData = { atomId: this.id };
        this.group.add(this.mesh);

        // 2. 3D Glowing Wireframe Perimeter Border
        const borderGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(102, 62, 2));
        const borderMat = new THREE.LineBasicMaterial({
            color: 0x00f2ff,
            transparent: true,
            opacity: 0.75
        });
        this.borderMesh = new THREE.LineSegments(borderGeo, borderMat);
        this.borderMesh.userData = { atomId: this.id };
        this.group.add(this.borderMesh);

        // 3. Cinematic Border-Tracing Energy Loops
        this.buildElectricityLines();

        // Apply initial hues and scale transformations
        this.setHue(this.hue);
        this.setInnerHue(this.innerHue);
        this.setScale(this.scaleMultiplier);

        if (typeof scene !== 'undefined') {
            scene.add(this.group);
        }
    }

    buildElectricityLines() {
        this.electricityLines = [];
        this.elecGroup = new THREE.Group();
        this.group.add(this.elecGroup);

        for (let i = 0; i < 2; i++) {
            const curvePoints = [];
            for (let j = 0; j <= 32; j++) {
                curvePoints.push(new THREE.Vector3(0, 0, 0));
            }
            const elecGeo = new THREE.BufferGeometry().setFromPoints(curvePoints);
            const elecMat = new THREE.LineBasicMaterial({
                color: 0x00f2ff,
                transparent: true,
                opacity: 0.65,
                blending: THREE.AdditiveBlending
            });
            const elecLine = new THREE.Line(elecGeo, elecMat);
            this.elecGroup.add(elecLine);
            this.electricityLines.push({ line: elecLine, index: i });
        }
    }

    setHue(hue) {
        this.hue = Number(hue) || 185;
        const color = new THREE.Color().setHSL(this.hue / 360, 1.0, 0.5);

        if (this.borderMesh && this.borderMesh.material) {
            this.borderMesh.material.color.copy(color);
        }

        if (this.electricityLines) {
            this.electricityLines.forEach(elec => {
                if (elec.line && elec.line.material) {
                    elec.line.material.color.copy(color);
                }
            });
        }
    }

    updateHue(hue) {
        this.setHue(hue);
    }

    setInnerHue(innerHue) {
        this.innerHue = Number(innerHue) || 230;

        if (this.mesh && this.mesh.material && this.mesh.material.map) {
            const canvas = this.mesh.material.map.image;
            if (canvas) {
                const ctx = canvas.getContext('2d');
                
                ctx.fillStyle = `hsla(${this.innerHue}, 80%, 15%, 0.65)`;
                ctx.fillRect(0, 0, 256, 128);

                ctx.fillStyle = `hsla(${this.innerHue}, 100%, 50%, 0.18)`;
                for (let y = 0; y < 128; y += 4) {
                    ctx.fillRect(0, y, 256, 1);
                }

                ctx.strokeStyle = `hsla(${this.innerHue}, 100%, 50%, 0.8)`;
                ctx.lineWidth = 4;
                ctx.strokeRect(2, 2, 252, 124);

                this.mesh.material.map.needsUpdate = true;
            }
        }
    }

    updateInnerHue(innerHue) {
        this.setInnerHue(innerHue);
    }

    setScale(scale) {
        this.scaleMultiplier = Number(scale) || 1.0;
        if (this.group && typeof this.group.scale.set === 'function') {
            this.group.scale.set(this.scaleMultiplier, this.scaleMultiplier, this.scaleMultiplier);
        }
    }

    updateScale(scale) {
        this.setScale(scale);
    }

    setRotation(rotation) {
        this.rotation = Number(rotation) || 0;
        if (this.group) {
            this.group.rotation.z = THREE.MathUtils.degToRad(this.rotation);
        }
    }

    updateRotation(rotation) {
        this.setRotation(rotation);
    }

    // Handles incoming updates from Dev Form / Inspector panel
    updateProperties(props) {
        if (props.title !== undefined) this.title = props.title;
        if (props.description !== undefined) this.description = props.description;
        if (props.hue !== undefined) this.setHue(props.hue);
        if (props.innerHue !== undefined) this.setInnerHue(props.innerHue);
        if (props.scale !== undefined) this.setScale(props.scale);
        if (props.rotation !== undefined) this.setRotation(props.rotation);
    }

    update(elapsedTime) {
        // Preserve base user rotation and add subtle floating sway
        const baseRad = THREE.MathUtils.degToRad(this.rotation);
        const sway = Math.sin(elapsedTime * 0.8) * 0.015;
        this.group.rotation.z = baseRad + sway;

        this.group.position.y = this.position.y + 25 + Math.sin(elapsedTime * 1.5) * 1.5;

        if (this.borderMesh && this.borderMesh.material) {
            this.borderMesh.material.opacity = 0.55 + Math.sin(elapsedTime * 3.0) * 0.2;
        }

        const halfW = 53;
        const halfH = 33;
        const perimeter = (halfW + halfH) * 4;

        if (this.electricityLines) {
            this.electricityLines.forEach((elec, idx) => {
                const points = [];
                const segments = 32;
                const speedOffset = elapsedTime * (1.2 + idx * 0.4) + (idx * (perimeter / 2));

                for (let j = 0; j <= segments; j++) {
                    const t = j / segments;
                    const dist = (t * perimeter + speedOffset) % perimeter;

                    let px = 0, py = 0, pz = 0;

                    if (dist < halfW * 2) {
                        px = -halfW + dist;
                        py = halfH;
                    } else if (dist < (halfW * 2) + (halfH * 2)) {
                        px = halfW;
                        py = halfH - (dist - halfW * 2);
                    } else if (dist < (halfW * 4) + (halfH * 2)) {
                        px = halfW - (dist - (halfW * 2 + halfH * 2));
                        py = -halfH;
                    } else {
                        px = -halfW;
                        py = -halfH + (dist - (halfW * 4 + halfH * 2));
                    }

                    pz += Math.sin(t * Math.PI * 4 + elapsedTime * 4 + idx) * 1.2;

                    points.push(new THREE.Vector3(px, py, pz));
                }
                elec.line.geometry.setFromPoints(points);
            });
        }
    }

    serialize() {
        return {
            id: this.id,
            type: 'sign',
            title: this.title,
            description: this.description,
            position: {
                x: this.position.x,
                y: this.position.y,
                z: this.position.z
            },
            hue: this.hue,
            innerHue: this.innerHue,
            scale: this.scaleMultiplier,
            rotation: this.rotation
        };
    }

    dispose() {
        if (typeof scene !== 'undefined') {
            scene.remove(this.group);
        }
        this.group.traverse((child) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
                else child.material.dispose();
            }
        });
    }
}

window.SignNode = SignNode;
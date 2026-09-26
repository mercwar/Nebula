/* ================================================================= *
 * RRU Fire Gem Node Component (fire-gem-node.js)                    *
 * Operator: CVBGOD                                                  *
 * ================================================================= */

class FireGemNode {
    constructor(position, id, hue = 15, scale = 1.0, cardData = {}, innerHue = 45) {
        this.id = id;
        this.cardType = 'firegem';
        this.hue = Number(hue) || 15;
        this.innerHue = Number(innerHue) || 45;
        this.scaleMultiplier = Number(scale) || 1.0;
        this.cardData = cardData;
        
        // Read initial rotation from cardData or default to 0
        this.rotation = Number(cardData.rotation) || 0;

        this.position = position.clone();
        this.group = new THREE.Group();
        this.group.position.copy(this.position);
        this.group.rotation.z = THREE.MathUtils.degToRad(this.rotation);

        // Core Crystalline Octahedron
        const gemGeo = new THREE.OctahedronGeometry(22, 0);
        const gemMat = new THREE.MeshPhysicalMaterial({
            color: 0xff3300,
            emissive: 0xff1100,
            emissiveIntensity: 1.5,
            roughness: 0.1,
            metalness: 0.5,
            transmission: 0.6,
            transparent: true,
            opacity: 0.95
        });
        this.mesh = new THREE.Mesh(gemGeo, gemMat);
        this.mesh.userData = { atomId: this.id };
        this.group.add(this.mesh);

        // Inner Pulsing Fire Light
        this.fireLight = new THREE.PointLight(0xff4500, 4, 300);
        this.group.add(this.fireLight);

        // Volumetric Flame Particle System
        this.particleCount = 140;
        const particleGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(this.particleCount * 3);
        this.particleData = [];

        for (let i = 0; i < this.particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 14;
            const y = (Math.random() - 0.5) * 20;

            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = Math.sin(angle) * radius;

            this.particleData.push({
                angle: angle,
                radius: radius,
                speed: Math.random() * 35 + 25,
                yOffset: y,
                maxHeight: 50 + Math.random() * 25,
                wobbleSpeed: Math.random() * 6 + 3,
                wobbleDist: Math.random() * 5 + 2
            });
        }

        particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        // Advanced Full-Gradient Flame Particle Texture
        this.particleCanvas = document.createElement('canvas');
        this.particleCanvas.width = 64;
        this.particleCanvas.height = 64;
        
        this.particleTexture = new THREE.CanvasTexture(this.particleCanvas);
        
        const particleMat = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 16,
            map: this.particleTexture,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.particleSystem = new THREE.Points(particleGeo, particleMat);
        this.group.add(this.particleSystem);

        // Apply transformations
        this.setScale(this.scaleMultiplier);
        this.setHue(this.hue);
        this.setInnerHue(this.innerHue);
        this.setRotation(this.rotation);

        if (typeof scene !== 'undefined') {
            scene.add(this.group);
        }
    }

    setScale(scale) {
        this.scaleMultiplier = Number(scale) || 1.0;
        if (isNaN(this.scaleMultiplier)) this.scaleMultiplier = 1.0;
        
        this.group.scale.set(this.scaleMultiplier, this.scaleMultiplier, this.scaleMultiplier);

        if (this.particleSystem && this.particleSystem.material) {
            this.particleSystem.material.size = 16 * this.scaleMultiplier;
            this.particleSystem.material.needsUpdate = true;
        }

        if (this.fireLight) {
            this.fireLight.distance = 300 * this.scaleMultiplier;
        }
    }

    updateScale(scale) {
        this.setScale(scale);
    }

    setHue(hue) {
        this.hue = Number(hue) || 15;
        const color = new THREE.Color().setHSL(this.hue / 360, 1.0, 0.5);

        if (this.mesh && this.mesh.material) {
            this.mesh.material.color.copy(color);
            this.mesh.material.emissive.copy(color);
        }

        if (this.fireLight) {
            this.fireLight.color.copy(color);
        }
    }

    updateHue(hue) {
        this.setHue(hue);
    }

    setInnerHue(innerHue) {
        this.innerHue = Number(innerHue) || 45;
        
        const ctx = this.particleCanvas.getContext('2d');
        ctx.clearRect(0, 0, 64, 64);
        
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0.0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.2, `hsla(${this.innerHue}, 100%, 65%, 0.95)`);
        gradient.addColorStop(0.5, `hsla(${this.innerHue}, 100%, 50%, 0.85)`);
        gradient.addColorStop(0.8, `hsla(${Math.max(0, this.innerHue - 25)}, 90%, 35%, 0.4)`);
        gradient.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);

        if (this.particleTexture) {
            this.particleTexture.needsUpdate = true;
        }
    }

    updateInnerHue(innerHue) {
        this.setInnerHue(innerHue);
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

    updateProperties(props) {
        if (props.hue !== undefined) this.setHue(props.hue);
        if (props.innerHue !== undefined) this.setInnerHue(props.innerHue);
        if (props.scale !== undefined) this.setScale(props.scale);
        if (props.rotation !== undefined) this.setRotation(props.rotation);
    }

    update(elapsedTime) {
        if (isNaN(elapsedTime)) return;

        // Respect base Z rotation set by user slider, add subtle oscillation
        const baseRad = THREE.MathUtils.degToRad(this.rotation);
        const sway = Math.sin(elapsedTime * 1.8) * 0.15;
        this.group.rotation.z = baseRad + sway;
        this.group.rotation.x = Math.sin(elapsedTime * 1.5) * 0.25;

        // Fierce light flickering
        this.fireLight.intensity = 3.5 + Math.sin(elapsedTime * 22) * 1.2 + Math.cos(elapsedTime * 13) * 0.8;

        // Animate flame particles
        const positions = this.particleSystem.geometry.attributes.position.array;

        for (let i = 0; i < this.particleCount; i++) {
            const data = this.particleData[i];
            const idx = i * 3;

            let currentY = positions[idx + 1] + (data.speed * 0.016);
            if (isNaN(currentY) || currentY > data.maxHeight) {
                currentY = -20;
                data.angle = Math.random() * Math.PI * 2;
                data.radius = Math.random() * 12;
            }

            const heightRatio = Math.max(0, Math.min(1, (currentY + 20) / (data.maxHeight + 20)));
            const currentRadius = data.radius * (1.0 - heightRatio * 0.6);

            data.angle += 0.05;
            const wobble = Math.sin(elapsedTime * data.wobbleSpeed + i) * data.wobbleDist * (1.0 - heightRatio);

            positions[idx] = Math.cos(data.angle) * currentRadius + wobble;
            positions[idx + 1] = currentY;
            positions[idx + 2] = Math.sin(data.angle) * currentRadius + wobble;
        }

        this.particleSystem.geometry.attributes.position.needsUpdate = true;
    }

    serialize() {
        return {
            id: this.id,
            type: 'firegem',
            title: this.title || 'Fire Gem Node',
            description: this.description || '',
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

window.FireGemNode = FireGemNode;
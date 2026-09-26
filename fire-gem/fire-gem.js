/* ================================================================= *
 * RRU - Fire-Gem Core Hub Module (fire-gem.js)                     *
 * ================================================================= */

class FireGemNode {
    constructor(position, id, hue = 15, scale = 1.0, cardData = {}, innerHue = 45) {
        this.id = id;
        this.cardType = 'firegem';
        this.hue = Number(hue) || 15;
        this.innerHue = Number(innerHue) || 45;
        this.scaleMultiplier = Number(scale) || 1.0;
        this.cardData = cardData;

        this.position = position.clone();
        this.group = new THREE.Group();
        this.group.position.copy(this.position);

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

        // Advanced Full-Gradient Flame Particle Texture (Dynamic Canvas Generation)
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

        // Apply scale directly to all sub-meshes and geometries to bypass parent matrix sync bugs
        this.setScale(this.scaleMultiplier);
        this.setHue(this.hue);
        this.setInnerHue(this.innerHue);

        if (typeof scene !== 'undefined') {
            scene.add(this.group);
        }
    }

    setScale(scale) {
        this.scaleMultiplier = Number(scale) || 1.0;
        
        // Directly scale the root group transform
        this.group.scale.set(this.scaleMultiplier, this.scaleMultiplier, this.scaleMultiplier);
        
        // Force update the matrix immediately so child bounding boxes and point sizes adjust correctly
        this.group.updateMatrix();
        this.group.updateMatrixWorld(true);

        // Directly scale particle point size and light distance ranges if needed
        if (this.particleSystem && this.particleSystem.material) {
            this.particleSystem.material.size = 16 * this.scaleMultiplier;
            this.particleSystem.material.needsUpdate = true;
        }

        if (this.fireLight) {
            this.fireLight.distance = 300 * this.scaleMultiplier;
        }
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

    setInnerHue(innerHue) {
        this.innerHue = Number(innerHue) || 45;
        
        // Generate dynamic flame particle gradient based on innerHue
        const ctx = this.particleCanvas.getContext('2d');
        ctx.clearRect(0, 0, 64, 64);
        
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0.0, 'rgba(255, 255, 255, 1)');                                     // White-hot core
        gradient.addColorStop(0.2, `hsla(${this.innerHue}, 100%, 65%, 0.95)`);                    // Bright inner flame tint
        gradient.addColorStop(0.5, `hsla(${this.innerHue}, 100%, 50%, 0.85)`);                    // Primary flame hue
        gradient.addColorStop(0.8, `hsla(${Math.max(0, this.innerHue - 25)}, 90%, 35%, 0.4)`);   // Deeper secondary shade
        gradient.addColorStop(1.0, 'rgba(0, 0, 0, 0)');                                           // Transparent edge

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);

        if (this.particleTexture) {
            this.particleTexture.needsUpdate = true;
        }
    }

    updateInnerHue(innerHue) {
        this.setInnerHue(innerHue);
    }

    update(elapsedTime) {
        // Rotate core gem
        this.group.rotation.y = elapsedTime * 1.8;
        this.group.rotation.x = Math.sin(elapsedTime * 1.5) * 0.25;

        // Fierce light flickering
        this.fireLight.intensity = 3.5 + Math.sin(elapsedTime * 22) * 1.2 + Math.cos(elapsedTime * 13) * 0.8;

        // Animate flame tongues & particles rising and narrowing
        const positions = this.particleSystem.geometry.attributes.position.array;

        for (let i = 0; i < this.particleCount; i++) {
            const data = this.particleData[i];

            let currentY = positions[i * 3 + 1] + (data.speed * 0.016);
            if (currentY > data.maxHeight) {
                currentY = -20;
                data.angle = Math.random() * Math.PI * 2;
                data.radius = Math.random() * 12;
            }

            // Chimney/Flame narrowing effect as particles rise
            const heightRatio = (currentY + 20) / (data.maxHeight + 20);
            const currentRadius = data.radius * (1.0 - heightRatio * 0.6);

            data.angle += 0.05;
            const wobble = Math.sin(elapsedTime * data.wobbleSpeed + i) * data.wobbleDist * (1.0 - heightRatio);

            const x = Math.cos(data.angle) * currentRadius + wobble;
            const z = Math.sin(data.angle) * currentRadius + wobble;

            positions[i * 3] = x;
            positions[i * 3 + 1] = currentY;
            positions[i * 3 + 2] = z;
        }

        this.particleSystem.geometry.attributes.position.needsUpdate = true;
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
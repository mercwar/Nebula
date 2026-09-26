/* ================================================================= *
 * RRU - Stargate Node / Atom Class (atom.js)                        *
 * ================================================================= */

class Atom {
    constructor(position, id, initialHue = 185, scale = 1.0, cardType = 'stargate', cardData = null, innerHue = 220) {
        this.id = id;
        this.hue = Number(initialHue) || 185;
        this.innerHue = innerHue !== undefined && innerHue !== null ? Number(innerHue) : (this.hue + 45) % 360;
        this.scaleMultiplier = Number(scale) || 1.0;
        this.position = position.clone();
        
        // Initialize Card Type and Form Data
        this.cardType = cardType;
        this.cardData = cardData || {};
        if (typeof initializeCardData === 'function') {
            initializeCardData(this, this.cardType);
        }

        this.group = new THREE.Group();
        this.group.position.copy(this.position);
        this.group.userData = { atomId: this.id };
        
        if (typeof scene !== 'undefined') {
            scene.add(this.group);
        }

        this.buildCore();
        this.buildSaturnRing();
        this.buildElectricityLines();
        this.buildElectronOrbits();
        this.setScale(this.scaleMultiplier);
        this.updateHue(this.hue);
        this.setInnerHue(this.innerHue);
    }

    setPosition(newPos) {
        this.position.copy(newPos);
        this.group.position.copy(this.position);
    }

    setScale(scale) {
        this.scaleMultiplier = Number(scale) || 1.0;
        this.group.scale.set(this.scaleMultiplier, this.scaleMultiplier, this.scaleMultiplier);
        this.group.updateMatrix();
        this.group.updateMatrixWorld(true);
    }

    buildCore() {
        const coreGeo = new THREE.SphereGeometry(36, 32, 32);
        const coreMat = new THREE.MeshPhysicalMaterial({
            color: 0x00f2ff,
            emissive: 0x0088ff,
            emissiveIntensity: 0.9,
            roughness: 0.1,
            metalness: 0.3,
            transmission: 0.65,
            thickness: 20,
            transparent: true,
            opacity: 0.95
        });
        this.coreMesh = new THREE.Mesh(coreGeo, coreMat);
        this.coreMesh.userData = { atomId: this.id, part: 'core' };
        this.group.add(this.coreMesh);

        const glowGeo = new THREE.SphereGeometry(44, 32, 32);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0x00f2ff,
            transparent: true,
            opacity: 0.22,
            blending: THREE.AdditiveBlending
        });
        this.glowMesh = new THREE.Mesh(glowGeo, glowMat);
        this.group.add(this.glowMesh);
    }

    buildSaturnRing() {
        this.ringCanvas = document.createElement('canvas');
        this.ringCanvas.width = 512;
        this.ringCanvas.height = 512;
        this.updateRingTexture(this.innerHue);

        this.ringTexture = new THREE.CanvasTexture(this.ringCanvas);
        const ringGeo = new THREE.RingGeometry(48, 98, 64);
        const ringMat = new THREE.MeshBasicMaterial({
            map: this.ringTexture,
            color: 0xffffff,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        this.saturnRing = new THREE.Mesh(ringGeo, ringMat);
        this.saturnRing.rotation.x = Math.PI / 2.8;
        this.saturnRing.rotation.y = Math.PI / 6;
        this.group.add(this.saturnRing);
    }

    updateRingTexture(hue) {
        if (!this.ringCanvas) return;
        const rCtx = this.ringCanvas.getContext('2d');
        rCtx.clearRect(0, 0, 512, 512);

        const primaryCol = `hsl(${hue}, 100%, 50%)`;
        const accentCol = `hsl(${(hue + 45) % 360}, 100%, 60%)`;

        const ringGrad = rCtx.createRadialGradient(256, 256, 110, 256, 256, 256);
        ringGrad.addColorStop(0.0, `hsla(${hue}, 100%, 50%, 0.0)`);
        ringGrad.addColorStop(0.35, primaryCol.replace(')', ', 0.85)').replace('hsl', 'hsla'));
        ringGrad.addColorStop(0.65, accentCol.replace(')', ', 0.55)').replace('hsl', 'hsla'));
        ringGrad.addColorStop(1.0, `hsla(${hue}, 100%, 50%, 0.0)`);

        rCtx.fillStyle = ringGrad;
        rCtx.fillRect(0, 0, 512, 512);
        if (this.ringTexture) this.ringTexture.needsUpdate = true;
    }

    setInnerHue(innerHue) {
        this.innerHue = Number(innerHue) || 185;
        this.updateRingTexture(this.innerHue);
    }

    updateInnerHue(innerHue) {
        this.setInnerHue(innerHue);
    }

    buildElectricityLines() {
        this.electricityLines = [];
        this.elecGroup = new THREE.Group();
        this.group.add(this.elecGroup);

        for (let i = 0; i < 3; i++) {
            const curvePoints = [];
            for (let j = 0; j <= 20; j++) {
                curvePoints.push(new THREE.Vector3(0, 0, 0));
            }
            const elecGeo = new THREE.BufferGeometry().setFromPoints(curvePoints);
            const elecMat = new THREE.LineBasicMaterial({
                color: 0x00f2ff,
                linewidth: 2,
                transparent: true,
                opacity: 0.85,
                blending: THREE.AdditiveBlending
            });
            const elecLine = new THREE.Line(elecGeo, elecMat);
            this.elecGroup.add(elecLine);
            this.electricityLines.push({ line: elecLine, index: i });
        }
    }

    buildElectronOrbits() {
        const atomicGroup = new THREE.Group();
        this.group.add(atomicGroup);

        const trackConfigs = [
            { radiusX: 170, radiusY: 120, rotX: 0.3, rotY: 0.5, speed: 0.024, hueOffset: 0 },
            { radiusX: 210, radiusY: 150, rotX: -0.6, rotY: 0.8, speed: 0.017, hueOffset: 45 },
            { radiusX: 240, radiusY: 180, rotX: 0.9, rotY: -0.4, speed: 0.030, hueOffset: -45 },
            { radiusX: 150, radiusY: 100, rotX: -0.4, rotY: -0.7, speed: 0.020, hueOffset: 90 }
        ];

        this.electronOrbits = [];

        trackConfigs.forEach((cfg) => {
            const ringGroup = new THREE.Group();
            ringGroup.rotation.x = cfg.rotX;
            ringGroup.rotation.y = cfg.rotY;

            const curvePoints = [];
            const segs = 100;
            for (let j = 0; j <= segs; j++) {
                const theta = (j / segs) * Math.PI * 2;
                curvePoints.push(new THREE.Vector3(
                    Math.cos(theta) * cfg.radiusX,
                    Math.sin(theta) * cfg.radiusY,
                    0
                ));
            }
            const ringGeo = new THREE.BufferGeometry().setFromPoints(curvePoints);
            const ringMat = new THREE.LineBasicMaterial({
                color: 0x00f2ff,
                transparent: true,
                opacity: 0.3,
                blending: THREE.AdditiveBlending
            });
            const ringMesh = new THREE.Line(ringGeo, ringMat);
            ringGroup.add(ringMesh);

            const electronGeo = new THREE.SphereGeometry(6, 16, 16);
            electronGeo.scale(1.4, 0.9, 0.9);

            const electronMat = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                emissive: 0x00f2ff,
                emissiveIntensity: 4.0,
                roughness: 0.05,
                metalness: 0.8,
                transparent: true,
                opacity: 0.9,
                blending: THREE.AdditiveBlending
            });
            const electronMesh = new THREE.Mesh(electronGeo, electronMat);
            ringGroup.add(electronMesh);

            atomicGroup.add(ringGroup);

            this.electronOrbits.push({
                group: ringGroup,
                electron: electronMesh,
                ringMesh: ringMesh,
                radiusX: cfg.radiusX,
                radiusY: cfg.radiusY,
                speed: cfg.speed,
                hueOffset: cfg.hueOffset,
                angle: Math.random() * Math.PI * 2
            });
        });
    }

    updateHue(newHue, isHighlighted = false) {
        this.hue = newHue;
        const baseColor = new THREE.Color();
        const emissiveColor = new THREE.Color();

        const lightness = isHighlighted ? 0.6 : 0.5;
        const emissiveLightness = isHighlighted ? 0.55 : 0.45;

        baseColor.setHSL(this.hue / 360, 1.0, lightness);
        emissiveColor.setHSL(this.hue / 360, 1.0, emissiveLightness);

        if (this.coreMesh) {
            this.coreMesh.material.color.copy(baseColor);
            this.coreMesh.material.emissive.copy(emissiveColor);
        }
        if (this.glowMesh) {
            this.glowMesh.material.color.copy(baseColor);
        }

        if (this.electricityLines) {
            this.electricityLines.forEach((elec, idx) => {
                const lineHue = (this.hue + (idx * 30)) % 360;
                elec.line.material.color.setHSL(lineHue / 360, 1.0, 0.5);
            });
        }

        if (this.electronOrbits) {
            this.electronOrbits.forEach((item) => {
                const orbHue = (this.hue + item.hueOffset + 360) % 360;
                item.electron.material.emissive.setHSL(orbHue / 360, 1.0, 0.5);
                item.ringMesh.material.color.setHSL(orbHue / 360, 1.0, 0.5);
            });
        }
    }

    update(elapsedTime) {
        const pulseScale = 1.0 + Math.sin(elapsedTime * 3.0 + this.id) * 0.08;
        if (this.coreMesh) this.coreMesh.scale.set(pulseScale, pulseScale, pulseScale);
        if (this.glowMesh) this.glowMesh.scale.set(pulseScale * 1.15, pulseScale * 1.15, pulseScale * 1.15);

        if (this.saturnRing) this.saturnRing.rotation.z = elapsedTime * 0.12;

        if (this.electricityLines) {
            this.electricityLines.forEach((elec, idx) => {
                const speed = 1.8 + (idx * 0.5);
                const angle = elapsedTime * speed + (idx * ((Math.PI * 2) / 3)) + this.id;

                const points = [];
                const segments = 16;
                const span = 32;

                for (let j = 0; j <= segments; j++) {
                    const t = j / segments;
                    const localX = (t - 0.5) * span;
                    const localY = Math.sin(t * Math.PI * 3 + elapsedTime * 8) * (5 + Math.sin(elapsedTime * 5) * 3);
                    const localZ = Math.cos(t * Math.PI * 2 + elapsedTime * 6) * 7;

                    const cosA = Math.cos(angle);
                    const sinA = Math.sin(angle);
                    const px = localX * cosA - localZ * sinA + Math.cos(angle) * (50 + Math.sin(elapsedTime * 4.0 + idx) * 12);
                    const py = localY + Math.sin(elapsedTime * 3 + idx) * 8;
                    const pz = localX * sinA + localZ * cosA + Math.sin(angle) * (50 + Math.sin(elapsedTime * 4.0 + idx) * 12);

                    points.push(new THREE.Vector3(px, py, pz));
                }
                elec.line.geometry.setFromPoints(points);
            });
        }

        if (this.electronOrbits) {
            this.electronOrbits.forEach((item) => {
                item.angle += item.speed;
                item.electron.position.x = Math.cos(item.angle) * item.radiusX;
                item.electron.position.y = Math.sin(item.angle) * item.radiusY;
                item.electron.rotation.z = item.angle;
            });
        }
    }

    dispose() {
        if (typeof scene !== 'undefined') {
            scene.remove(this.group);
        }
        if (this.ringTexture) {
            this.ringTexture.dispose();
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

window.Atom = Atom;
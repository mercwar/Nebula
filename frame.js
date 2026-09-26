/* ================================================================= *
 * RRU Frame State Engine (frame.js)                                 *
 * Operator: CVBGOD                                                  *
 * ================================================================= */

class RRUFrame {
    constructor(initialData = null) {
        this.frameSchema = initialData || {
            meta: {
                version: "4.1.0",
                operator: "CVBGOD",
                lastCompiled: Date.now()
            },
            map: {
                gridSize: 3000,
                divisions: 120,
                colorCenterLine: 0x00F2FF,
                colorGrid: 0x111122,
                ambientIntensity: 1.2,
                offsetX: 0,
                offsetY: 0,
                rotationTheta: 0,
                rotationPhi: Math.PI / 4,
                radius: 450
            },
            events: {
                raycastPrecision: 0.1,
                enableDrag: true,
                singleSelectOnly: true,
                selectedNodeId: null
            },
            nodes: [
                {
                    id: "NODE-FIRE-01",
                    cardType: "firegem",
                    title: "Fire Gem Hub",
                    description: "Volumetric core telemetry node.",
                    position: { x: -180, y: 0, z: 0 },
                    scale: 1.2,
                    rotation: 0,
                    hue: 15,
                    innerHue: 45
                },
                {
                    id: "NODE-ATOM-01",
                    cardType: "stargate",
                    title: "Stargate Atom Matrix",
                    description: "Multi-orbital atomic energy matrix.",
                    position: { x: 0, y: 0, z: 0 },
                    scale: 1.2,
                    rotation: 0,
                    hue: 185,
                    innerHue: 220
                },
                {
                    id: "NODE-SIGN-01",
                    cardType: "sign",
                    title: "RRU TELEMETRY",
                    description: "Active Sector Feed Panel.",
                    position: { x: 180, y: 0, z: 0 },
                    scale: 1.2,
                    rotation: 0,
                    hue: 200,
                    innerHue: 230
                }
            ]
        };

        this.listeners = [];
    }

    getState() {
        return this.frameSchema;
    }

    commit(updaterFn) {
        if (typeof updaterFn === 'function') {
            updaterFn(this.frameSchema);
        }
        this.frameSchema.meta.lastCompiled = Date.now();
        this.notifyListeners();
    }

    updateMapTransform(transformProps) {
        this.commit(schema => {
            Object.assign(schema.map, transformProps);
        });
    }

    updateNode(nodeId, newProps) {
        this.commit(schema => {
            const node = schema.nodes.find(n => n.id === nodeId);
            if (node) {
                Object.assign(node, newProps);
            }
        });
    }

    subscribe(callback) {
        if (typeof callback === 'function') {
            this.listeners.push(callback);
        }
    }

    notifyListeners() {
        this.listeners.forEach(cb => cb(this.frameSchema));
    }
}

window.RRUFrame = RRUFrame;
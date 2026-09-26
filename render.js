/* ================================================================= *
 * RRU Frame State Renderer (render.js)                              *
 * Operator: CVBGOD                                                  *
 * ================================================================= */

class RRUFrameRenderer {
    constructor(frameInstance, windowController) {
        this.frame = frameInstance;
        this.monitorWindow = windowController;

        // Subscribe to state updates from RRUFrame
        if (this.frame && typeof this.frame.subscribe === 'function') {
            this.frame.subscribe((schema) => this.render(schema));
        }

        // Initial render if DOM & frame are ready
        if (this.frame && typeof this.frame.getState === 'function') {
            this.render(this.frame.getState());
        }
    }

    render(schema) {
        if (!schema || !schema.nodes) return;

        // Locate content container inside the PHP-rendered shell
        const contentPane = document.getElementById('avis-shell-content') || document.getElementById('avis-content-avis_default');
        if (!contentPane) return;

        // Build HTML table from RRUFrame nodes schema
        let html = `
            <table class="avis-data-table">
                <thead>
                    <tr>
                        <th>Node ID</th>
                        <th>Card Type</th>
                        <th>Title</th>
                        <th>Position (X,Y,Z)</th>
                        <th>Hue / Status</th>
                    </tr>
                </thead>
                <tbody>
        `;

        schema.nodes.forEach(node => {
            const isSelected = schema.events && schema.events.selectedNodeId === node.id;
            const rowStyle = isSelected ? 'background: rgba(0, 242, 255, 0.15); border-left: 2px solid #00f2ff;' : '';
            
            html += `
                <tr style="${rowStyle}" data-node-id="${node.id}">
                    <td><strong>${node.id}</strong></td>
                    <td><span class="avis-status-badge active">${node.cardType}</span></td>
                    <td>${node.title}</td>
                    <td>(${node.position.x}, ${node.position.y}, ${node.position.z})</td>
                    <td>H: ${node.hue} / IH: ${node.innerHue}</td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
            <div style="margin-top: 8px; font-size: 10px; color: rgba(255,255,255,0.5); text-align: right;">
                Schema Version: ${schema.meta.version} | Last Compiled: ${new Date(schema.meta.lastCompiled).toLocaleTimeString()}
            </div>
        `;

        contentPane.innerHTML = html;

        // Attach click listeners to rows to allow node selection/inspection
        const rows = contentPane.querySelectorAll('tr[data-node-id]');
        rows.forEach(row => {
            row.style.cursor = 'pointer';
            row.onclick = () => {
                const nodeId = row.getAttribute('data-node-id');
                this.frame.commit(s => {
                    s.events.selectedNodeId = nodeId;
                });
                if (this.monitorWindow && typeof this.monitorWindow.openWindow === 'function') {
                    this.monitorWindow.openWindow();
                }
            };
        });
    }
}

// Bind automatically when both RRUFrame and AvisMonitorWindow are present
document.addEventListener('DOMContentLoaded', () => {
    const checkReady = setInterval(() => {
        if (window.rruFrameInstance && window.avisWindowController) {
            clearInterval(checkReady);
            window.rruRenderer = new RRUFrameRenderer(window.rruFrameInstance, window.avisWindowController);
        }
    }, 50);
});

    animate() {
        requestAnimationFrame(this.animate);
        const elapsedTime = this.clock.getElapsedTime();

        // Render update loop driven by JSON state parameters
        this.nodeInstances.forEach(instance => {
            if (instance && typeof instance.update === 'function') {
                instance.update(elapsedTime);
            }
        });

        this.renderer.render(this.scene, this.camera);
    }

    initResizeListener() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }
}

window.RRURendererApp = RRURendererApp;
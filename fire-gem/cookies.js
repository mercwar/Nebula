/* ================================================================= *
 * RRU - Workspace Integration & Cookie Initialization Pipeline      *
 * ================================================================= */

(function () {
    'use strict';

    // Ensure global workspace application handlers are available
    if (typeof window.applyNebDataToWorkspace !== 'function') {
        window.applyNebDataToWorkspace = function (nebJson) {
            if (!nebJson) return;

            console.log('[RRUWorkspace] Applying .neb data to active workspace...', nebJson);

            // Set grid elevation if RRUMap exists
            if (window.RRUMap && typeof nebJson.elevation === 'number') {
                window.RRUMap.gridElevation = nebJson.elevation;
                if (typeof window.RRUMap.updateElevationUI === 'function') {
                    window.RRUMap.updateElevationUI();
                }
            }

            // Clear and load nodes into workspace atoms array
            if (Array.isArray(nebJson.nodes)) {
                if (typeof window.clearAllNodes === 'function') {
                    window.clearAllNodes();
                } else {
                    window.atoms = [];
                }

                nebJson.nodes.forEach(nodeData => {
                    if (typeof window.spawnNodeFromData === 'function') {
                        window.spawnNodeFromData(nodeData);
                    } else if (window.atoms) {
                        // Fallback node reconstruction
                        window.atoms.push({
                            id: nodeData.id,
                            type: nodeData.type,
                            cardType: nodeData.type,
                            position: nodeData.position ? new THREE.Vector3(nodeData.position.x, nodeData.position.y, nodeData.position.z) : new THREE.Vector3(),
                            rotation: nodeData.rotation ? new THREE.Euler(nodeData.rotation.x, nodeData.rotation.y, nodeData.rotation.z) : new THREE.Euler(),
                            hue: nodeData.hue,
                            innerHue: nodeData.innerHue,
                            scaleMultiplier: nodeData.scale,
                            cardData: nodeData.cardData || {}
                        });
                    }
                });

                // Refresh tracker panel and UI overlays
                if (typeof window.updateTrackerUI === 'function') {
                    window.updateTrackerUI();
                }
                
                console.log(`[RRUWorkspace] Successfully loaded ${nebJson.nodes.length} nodes from .neb payload.`);
            }
        };
    }

    if (typeof window.loadAtomsFromNeb !== 'function') {
        window.loadAtomsFromNeb = function (nodesArray) {
            window.applyNebDataToWorkspace({ nodes: nodesArray, elevation: 0 });
        };
    }

    // --- Automatic Cookie / Storage Initialization Handler ---
    window.addEventListener('DOMContentLoaded', () => {
        // If RRUNebStore initialized with cookie data on startup, apply it to the workspace
        if (window.RRUNebStore && window.RRUNebStore.currentNebData && window.RRUNebStore.mode === 'development') {
            const initialData = window.RRUNebStore.currentNebData;
            // Only apply if it's a valid parsed object (not a deferred fetch promise)
            if (typeof initialData === 'object' && !initialData.loaded && initialData.nodes) {
                console.log('[RRUWorkspace] Initializing workspace from saved cookie state...');
                window.applyNebDataToWorkspace(initialData);
            }
        }
    });

    console.log('[RRUWorkspace] Cookie integration and workspace loaders ready.');
})();
/* ================================================================= *
 * RRU Constellation Map Engine (map.js)                             *
 * Operator: CVBGOD                                                  *
 * ================================================================= */

class RRUMap {
    constructor(scene, mapConfig = {}) {
        this.scene = scene;
        this.config = mapConfig;
        this.initMap();
    }

    initMap() {
        const grid = new THREE.GridHelper(
            this.config.gridSize || 3000, 
            this.config.divisions || 120, 
            Number(this.config.colorCenterLine || 0x00F2FF), 
            Number(this.config.colorGrid || 0x111122)
        );
        grid.position.y = -100;
        this.scene.add(grid);

        const ambientLight = new THREE.AmbientLight(0xffffff, this.config.ambientIntensity || 1.2);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
        dirLight.position.set(200, 400, 300);
        this.scene.add(dirLight);
    }
}

window.RRUMap = RRUMap;
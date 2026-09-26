<?php
$assetVersion = date('Y-m-d-H-i-s');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RRU // Stargate Node & Core Network</title>
    
    <!-- Modular CSS Stylesheets -->
    <link rel="stylesheet" href="atom.css?v=<?php echo $assetVersion; ?>" />
    <link rel="stylesheet" href="sign.css?v=<?php echo $assetVersion; ?>" />
    <link rel="stylesheet" href="fire-gem.css?v=<?php echo $assetVersion; ?>" />
    <link rel="stylesheet" href="win.css?v=<?php echo $assetVersion; ?>" />
    <link rel="stylesheet" href="context-menu.css?v=<?php echo $assetVersion; ?>" />

    <!-- Three.js CDN -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
</head>
<body>

    <div id="webgl-container"></div>

    <div id="hud-overlay">
        <header class="interactive">
            <h1>RRU // STARGATE NETWORK OS</h1>
            <div id="status-bar">STATUS: ONLINE // MAP READY</div>
        </header>

        <div class="control-panel interactive">
            <div class="control-group">
                <label for="node-type-select">SPAWN NODE ARCHITECTURE</label>
                <select id="node-type-select">
                    <option value="stargate">Atom / Stargate Node</option>
                    <option value="sign">Holographic Sign Panel</option>
                    <option value="firegem">Fire-Gem Core Hub</option>
                </select>
            </div>
            
            <div class="control-group">
                <button id="toggle-deploy-btn">Enable Dropper Mode</button>
            </div>

            <div class="control-group" style="display: flex; gap: 6px;">
                <button id="toggle-tracker-btn" style="flex: 1; border-color: #00f2ff; color: #00f2ff;">Object Tracker</button>
                <button id="clear-all-btn" style="flex: 1; border-color: rgba(255,68,68,0.5); color: #ff4444; background: rgba(255,68,68,0.05);">Clear All</button>
            </div>

            <!-- Grid Elevation Controls -->
            <div class="control-group">
                <label>GRID ELEVATION: <span id="grid-elevation-val">0</span></label>
                <div style="display: flex; gap: 8px;">
                    <button id="grid-lower-btn" style="flex: 1;">Lower Grid (-)</button>
                    <button id="grid-raise-btn" style="flex: 1;">Raise Grid (+)</button>
                </div>
            </div>

            <!-- Background Environment Selector -->
            <div class="control-group">
                <label for="bg-texture-select">BACKGROUND ENVIRONMENT</label>
                <select id="bg-texture-select">
                    <option value="grid">Cyber Grid Only</option>
                    <option value="starfield">Starfield Deep Space</option>
                    <option value="nebula">Fire & Ice Nebula</option>
                </select>
            </div>

            <div class="instructions">
                • <b>Pan Map:</b> Click & Drag background<br>
                • <b>Zoom:</b> Scroll Mouse Wheel<br>
                • <b>Deploy:</b> Toggle Dropper & Click Map<br>
                • <b>Inspect:</b> Right-Click any Node
            </div>
        </div>
    </div>

    <!-- RRU Sophisticated Node Designer & Inspector Panel -->
    <div id="rru-designer-panel" class="glass-panel interactive" style="display: none;">
        <div class="designer-header">
            <span id="designer-title-label">RRU NODE DESIGNER</span>
            <button id="designer-close-btn">_</button>
        </div>
        <div class="designer-body">
            <label>Node Type: 
                <select id="cfg-card-type">
                    <option value="stargate">Atom / Stargate Node</option>
                    <option value="sign">Sign Panel</option>
                    <option value="firegem">Fire-Gem Shell</option>
                </select>
            </label>
            <label>Hue: <input type="range" id="cfg-hue" min="0" max="360" value="185"></label>
            <label>Inner Hue: <input type="range" id="cfg-inner-hue" min="0" max="360" value="230"></label>
            <label>Scale: <input type="range" id="cfg-scale" min="0.5" max="2.0" step="0.1" value="1.0"></label>
            
            <!-- Commons Fields -->
            <label>Title: <input type="text" id="cfg-title" value="NODE_UNIT"></label>
            <label>Keycode: <input type="text" id="cfg-keycode" value="KC-ALPHA"></label>
            <label>Archived: <input type="checkbox" id="cfg-archived"></label>
            
            <!-- Dynamic Type-Specific Fields -->
            <label id="lbl-dynamic-1">Param 1: <input type="text" id="cfg-extra-1" placeholder="URL / Path / HTML"></label>
            <label id="lbl-dynamic-2">Param 2: <input type="text" id="cfg-extra-2" placeholder="Description"></label>

            <div style="display: flex; gap: 6px; margin-top: 8px;">
                <button id="designer-copy-btn" style="flex: 1;">Copy JSON</button>
                <button id="designer-save-cookie-btn" style="flex: 1;">Save State</button>
            </div>
        </div>
    </div>

    <!-- RRU Live Object Tracker & Manager Window -->
    <div id="rru-tracker-panel" class="glass-panel interactive" style="display: none; position: fixed; top: 20px; right: 20px; width: 340px; max-height: 80vh; z-index: 1500; display: flex; flex-direction: column;">
        <div class="designer-header" style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 8px; border-bottom: 1px solid rgba(0,242,255,0.2);">
            <span style="font-weight: bold; color: #00f2ff; font-family: monospace; font-size: 11px;">RRU OBJECT TRACKER // CARDS</span>
            <button id="tracker-close-btn" style="background: none; border: 1px solid rgba(0,242,255,0.3); color: #00f2ff; padding: 2px 6px; cursor: pointer;">_</button>
        </div>
        <div id="tracker-node-list" style="overflow-y: auto; flex: 1; padding: 8px 0; display: flex; flex-direction: column; gap: 8px;">
            <!-- Dynamically populated rows for each tracked node card -->
        </div>
    </div>

    <!-- Modular Script Pipeline -->
    <script src="map.js?v=<?php echo $assetVersion; ?>"></script>
    <script src="atom.js?v=<?php echo $assetVersion; ?>"></script>
    <script src="sign.js?v=<?php echo $assetVersion; ?>"></script>
    <script src="fire-gem.js?v=<?php echo $assetVersion; ?>"></script>
    <script src="router.js?v=<?php echo $assetVersion; ?>"></script>
    <script src="tracker.js?v=<?php echo $assetVersion; ?>"></script>
    <script src="menu.js?v=<?php echo $assetVersion; ?>"></script>
	<script src="neb_store.js?v=<?php echo $assetVersion; ?>"></script>
</body>
</html>
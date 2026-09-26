<?php
/* ================================================================= *
 * RRU Platform Console (index.php)                                  *
 * Operator: CVBGOD                                                  *
 * ================================================================= */
$assetVersion = time();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RRU // Constellation & Fire-Gem Interface</title>

    <link rel="stylesheet" href="atom.css?v=<?php echo $assetVersion; ?>">
    <link rel="stylesheet" href="sign.css?v=<?php echo $assetVersion; ?>">
    <link rel="stylesheet" href="fire-gem.css?v=<?php echo $assetVersion; ?>">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body, html { width: 100%; height: 100%; overflow: hidden; background-color: #050508; font-family: 'Courier New', Courier, monospace; color: #00F2FF; }
        #canvas-container { width: 100vw; height: 100vh; display: block; }
        #hud-overlay {
            position: absolute; top: 20px; left: 20px; pointer-events: none;
            background: rgba(5, 5, 8, 0.85); border: 1px solid #00F2FF; padding: 15px;
            box-shadow: 0 0 15px rgba(0, 242, 255, 0.2); z-index: 10;
        }
        #hud-overlay h1 { font-size: 14px; letter-spacing: 2px; margin-bottom: 5px; color: #FFD700; }
        #hud-overlay p { font-size: 11px; color: #00F2FF; opacity: 0.8; }
    </style>
</head>
<body>

    <div id="hud-overlay">
        <h1>RRU // CONSTELLATION GATE</h1>
        <p>OPERATOR: CVBGOD</p>
        <p>CONTROLS: RIGHT-CLICK DRAG = ROTATE | LEFT-CLICK DRAG = PAN | CLICK = SELECT</p>
    </div>

    <div id="canvas-container"></div>

    <!-- Include Three.js via CDN -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>

    <!-- Include Component & System Modules -->
	<script src="avis_mon.js?v=<?php echo $assetVersion; ?>"></script>
    <script src="frame.js?v=<?php echo $assetVersion; ?>"></script>
    <script src="atom.js?v=<?php echo $assetVersion; ?>"></script>
    <script src="sign.js?v=<?php echo $assetVersion; ?>"></script>
    <script src="fire-gem.js?v=<?php echo $assetVersion; ?>"></script>
    <script src="events.js?v=<?php echo $assetVersion; ?>"></script>
    <script src="map.js?v=<?php echo $assetVersion; ?>"></script>
    <script src="render.js?v=<?php echo $assetVersion; ?>"></script>

    <!-- Application Initialization Script -->
    <script>
        window.addEventListener('DOMContentLoaded', () => {
            window.rruApp = new RRURendererApp();
        });
    </script>
</body>
</html>
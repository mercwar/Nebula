<?php
// Set resource limits at runtime
ini_set('memory_limit', '256M');
ini_set('max_input_vars', '10000');
ini_set('max_execution_time', '300');

$assetVersion = date('YmdHis');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RRU Stargate Node & Core Network</title>

    <!-- ThreeJS -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>

    <!-- Core UI & Base Styles -->
    <link rel="stylesheet" href="atom.css?v=<?php echo $assetVersion; ?>">
    <link rel="stylesheet" href="sign.css?v=<?php echo $assetVersion; ?>">
    <link rel="stylesheet" href="fire-gem.css?v=<?php echo $assetVersion; ?>">
	<link rel="stylesheet" href="win.css?v=<?php echo $assetVersion; ?>">
</head>
<body>
    <div id="stargate-container"></div>

    <!-- Node Classes -->
    <script src="atom.js?v=<?php echo $assetVersion; ?>"></script>
    <script src="sign.js?v=<?php echo $assetVersion; ?>"></script>
    <script src="fire-gem.js?v=<?php echo $assetVersion; ?>"></script>
 <script src="cookies.js?v=<?php echo $assetVersion; ?>"></script>
    <!-- Cookies & Compiler -->
   
    <script src="avis_mon.js?v=<?php echo $assetVersion; ?>"></script>

    <!-- Editor, Bridge & Router -->
    <script src="dev_form.js?v=<?php echo $assetVersion; ?>"></script>
 
    <script src="router.js?v=<?php echo $assetVersion; ?>"></script>

    <!-- Main Engine & 3D Panable Grid -->
    <script src="map.js?v=<?php echo $assetVersion; ?>"></script>

    <!-- Initialize AVIS Inspector & Bridge System -->
    <script>
        document.addEventListener('DOMContentLoaded', () => {

            // Initialize Active Node Map & Bridge Controller
            window.rruNodeMap = new Map();
            window.devBridge = new AvisDevBridge(window.devForm, window.rruNodeMap);

            console.info('[RRU Core] AVIS Developer Bridge & Inspector initialized online.');
        });
    </script>
</body>
</html>
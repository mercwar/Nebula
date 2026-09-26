/* ================================================================= *
 * RRU & AVIS - External Window Populator (`populator.js`)            *
 * Operator: CVBGOD                                                  *
 * ================================================================= *
 * Stub to fetch/inject a PHP-rendered div container from index.php  *
 * ================================================================= */

document.addEventListener('DOMContentLoaded', () => {
    // Poll or hook into the instantiated window controller
    const checkInterval = setInterval(() => {
        if (window.avisWindowController) {
            clearInterval(checkInterval);
            
            // 1. Open the empty window shell
            window.avisWindowController.openWindow();

            // 2. Target shell content pane and pull the PHP-rendered server div
            const contentPane = document.getElementById('avis-shell-content');
            const serverDiv = document.getElementById('avis-server-container');

            if (contentPane && serverDiv) {
                // Inject the server-side container content directly into the shell
                contentPane.innerHTML = serverDiv.innerHTML;
            } else if (contentPane) {
                // Fallback stub if the index.php div isn't detected
                contentPane.innerHTML = `
                    <div class="avis-stub-error">
                        <p>⚠️ AVIS Server Container [avis-server-container] not detected in index.php.</p>
                    </div>
                `;
            }
        }
    }, 50);
});
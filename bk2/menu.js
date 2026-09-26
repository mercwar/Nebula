/* ================================================================= *
 * RRU - Right-Click Popup Context Menu Module                       *
 * ================================================================= */

let activeContextMenu = null;

function removeContextMenu() {
    if (activeContextMenu) {
        activeContextMenu.remove();
        activeContextMenu = null;
    }
}

// Clean up context menu on global clicks, wheel scrolling, or window resizes
window.addEventListener('click', () => removeContextMenu());
window.addEventListener('wheel', () => removeContextMenu(), { passive: true });
window.addEventListener('resize', () => removeContextMenu());

// Listen for right-clicks globally or specifically on the WebGL container / map viewport
document.addEventListener('contextmenu', (e) => {
    // Optional: Allow default right-click if clicking inside form inputs or interactive HUD panels
    if (e.target.closest('.interactive') || e.target.closest('#rru-tracker-panel') || e.target.closest('#rru-designer-panel')) {
        return; 
    }

    e.preventDefault();
    removeContextMenu();

    const clientX = e.clientX;
    const clientY = e.clientY;

    const menu = document.createElement('div');
    menu.className = 'fixed z-50 glass-panel w-52 p-2 rounded-xl border border-cyan-500/40 shadow-[0_0_25px_rgba(0,242,255,0.25)] flex flex-col gap-1 text-xs text-cyan-300';
    menu.style.left = `${clientX}px`;
    menu.style.top = `${clientY}px`;

    menu.innerHTML = `
        <div class="px-3 py-1.5 border-b border-cyan-500/20 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Matrix Commands</div>
        <button id="menuDeployBtn" class="w-full text-left px-3 py-2 rounded-lg hover:bg-cyan-500/20 hover:text-white transition-all flex items-center justify-between">
            <span>Toggle Placement</span>
            <span class="text-[10px] text-cyan-400">⚡</span>
        </button>
        <button id="menuExportBtn" class="w-full text-left px-3 py-2 rounded-lg hover:bg-cyan-500/20 hover:text-white transition-all flex items-center justify-between">
            <span>Export Constellation</span>
            <span class="text-[10px] text-cyan-400">📋</span>
        </button>
        <button id="menuImportBtn" class="w-full text-left px-3 py-2 rounded-lg hover:bg-cyan-500/20 hover:text-white transition-all flex items-center justify-between">
            <span>Import Constellation</span>
            <span class="text-[10px] text-cyan-400">📥</span>
        </button>
        <div class="border-t border-cyan-500/20 my-1"></div>
        <button id="menuResetBtn" class="w-full text-left px-3 py-2 rounded-lg hover:bg-cyan-500/20 hover:text-cyan-200 transition-all flex items-center justify-between">
            <span>Recenter View</span>
            <span class="text-[10px]">🎯</span>
        </button>
    `;

    document.body.appendChild(menu);
    activeContextMenu = menu;

    // Menu Item Click Handlers
    document.getElementById('menuDeployBtn').addEventListener('click', (ev) => {
        ev.stopPropagation();
        const toggleBtn = document.getElementById('toggle-deploy-btn');
        if (toggleBtn) toggleBtn.click();
        removeContextMenu();
    });

    document.getElementById('menuExportBtn').addEventListener('click', (ev) => {
        ev.stopPropagation();
        if (typeof exportNetworkToClipboard === 'function') exportNetworkToClipboard();
        removeContextMenu();
    });

    document.getElementById('menuImportBtn').addEventListener('click', (ev) => {
        ev.stopPropagation();
        if (typeof importNetworkFromClipboard === 'function') importNetworkFromClipboard();
        removeContextMenu();
    });

    document.getElementById('menuResetBtn').addEventListener('click', (ev) => {
        ev.stopPropagation();
        const resetViewBtn = document.getElementById('resetViewBtn');
        if (resetViewBtn) {
            resetViewBtn.click();
        } else if (typeof resetCameraView === 'function') {
            resetCameraView();
        }
        removeContextMenu();
    });
});
// --- Clipboard & Export/Import Controls ---

function exportNetworkToClipboard() {
    if (typeof atoms === 'undefined' || atoms.length === 0) {
        alert("No nodes in network to export.");
        return;
    }

    const networkData = atoms.map(a => ({
        id: a.id,
        hue: a.hue,
        position: { x: Math.round(a.position.x), y: Math.round(a.position.y), z: Math.round(a.position.z) }
    }));

    const jsonString = JSON.stringify(networkData, null, 2);

    navigator.clipboard.writeText(jsonString).then(() => {
        showClipboardNotification("Constellation copied to clipboard!");
    }).catch(err => {
        console.error("Failed to copy network data: ", err);
        prompt("Copy constellation JSON manually:", jsonString);
    });
}

function importNetworkFromClipboard() {
    navigator.clipboard.readText().then(text => {
        try {
            const importedData = JSON.parse(text);
            if (!Array.isArray(importedData)) throw new Error("Invalid format");

            // Clear current network first
            if (typeof resetNetwork === 'function') {
                resetNetwork();
            }

            importedData.forEach(item => {
                const pos = new THREE.Vector3(item.position.x, item.position.y, item.position.z);
                if (typeof createNewAtomSilently === 'function') {
                    createNewAtomSilently(pos, item.id, item.hue);
                }
            });

            if (typeof rebuildConnections === 'function') {
                rebuildConnections();
            }
            if (typeof updateUI === 'function') {
                updateUI();
            }
            if (typeof saveNetworkState === 'function') {
                saveNetworkState();
            }

            showClipboardNotification(`Successfully imported ${importedData.length} nodes!`);
        } catch (e) {
            alert("Clipboard data is not a valid Stargate constellation JSON.");
        }
    }).catch(err => {
        console.error("Failed to read clipboard: ", err);
        const manualInput = prompt("Paste constellation JSON string here:");
        if (manualInput) {
            // Process manual string input similarly if needed
        }
    });
}

function showClipboardNotification(message) {
    let notify = document.getElementById('clipNotification');
    if (!notify) {
        notify = document.createElement('div');
        notify.id = 'clipNotification';
        notify.className = 'fixed top-20 right-6 z-50 glass-panel px-4 py-2.5 rounded-xl border border-cyan-400 text-cyan-300 text-xs font-mono shadow-[0_0_20px_rgba(0,242,255,0.4)] transition-all opacity-0 translate-y-[-10px]';
        document.body.appendChild(notify);
    }
    notify.textContent = message;
    notify.style.opacity = '1';
    notify.style.transform = 'translateY(0)';

    setTimeout(() => {
        notify.style.opacity = '0';
        notify.style.transform = 'translateY(-10px)';
    }, 2500);
}
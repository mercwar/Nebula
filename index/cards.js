/* ================================================================= *
 * RRU - Node Card Configuration & Interface UI Renderer             *
 * ================================================================= */

const CARD_TYPES = {
    atom: {
        label: "Quantum Atom Node",
        color: "#00f2ff",
        fields: [
            { key: "coreIdentity", label: "Core Designation", type: "text", default: "RRU-NODE-CORE" },
            { key: "oscillationMode", label: "Oscillation Frequency", type: "select", options: ["Stable", "Harmonic", "Pulse-Locked"], default: "Stable" },
            { key: "fieldIntensity", label: "Field Density (%)", type: "number", default: 95 }
        ]
    },
    sign: {
        label: "Holographic Sign Node",
        color: "#00f2ff",
        fields: [
            { key: "signText", label: "Display Text / Hologram Banner", type: "text", default: "CVBGOD // SYSTEM ONLINE" },
            { key: "projectionScale", label: "Projection Scale Factor", type: "select", options: ["Compact", "Standard", "Immersive IMAX"], default: "Standard" },
            { key: "flickerEffect", label: "Signal Glitch Filter", type: "select", options: ["None", "Low Glitch", "High Voltage Pulse"], default: "Low Glitch" }
        ]
    },
    "fire-gem": {
        label: "Fire-Gem GGUF Core",
        color: "#ff3300",
        fields: [
            { key: "modelPath", label: "GGUF Model Architecture", type: "select", options: ["Qwen2.5-Coder-7B.gguf", "SmolLM2-1.7B.gguf", "DeepSeek-R1-Distill.gguf"], default: "Qwen2.5-Coder-7B.gguf" },
            { key: "contextWindow", label: "Context Window (Tokens)", type: "select", options: ["4096", "8192", "16384", "32768"], default: "8192" },
            { key: "temperature", label: "Inference Temperature", type: "number", default: 0.7 }
        ]
    }
};

// Initialize card data defaults for any node instance
function initializeCardData(node, requestedType = 'atom') {
    node.cardType = CARD_TYPES[requestedType] ? requestedType : 'atom';
    node.cardData = node.cardData || {};
    
    const template = CARD_TYPES[node.cardType];
    template.fields.forEach(field => {
        if (node.cardData[field.key] === undefined) {
            node.cardData[field.key] = field.default;
        }
    });
}

// Render the complete card list & dynamic form interface into the side panel
function renderAtomCardUI(nodesList, selectedId, containerElement) {
    if (!containerElement) return;
    
    let html = '';
    
    if (!nodesList || nodesList.length === 0) {
        html = `<div class="text-slate-500 text-[10px] text-center py-4 italic">No nodes deployed. Enable placement mode to begin.</div>`;
        containerElement.innerHTML = html;
        return;
    }

    nodesList.forEach((node) => {
        const isSelected = node.id === selectedId;
        const currentTemplate = CARD_TYPES[node.cardType] || CARD_TYPES.atom;

        let formFieldsHtml = '';
        if (isSelected) {
            let typeOptionsHtml = '';
            for (const [key, tObj] of Object.entries(CARD_TYPES)) {
                const selectedAttr = node.cardType === key ? 'selected' : '';
                typeOptionsHtml += `<option value="${key}" ${selectedAttr}>${tObj.label}</option>`;
            }

            let fieldsListHtml = '';
            currentTemplate.fields.forEach(field => {
                const currentVal = node.cardData[field.key] !== undefined ? node.cardData[field.key] : field.default;
                
                if (field.type === 'select') {
                    let optsHtml = '';
                    field.options.forEach(opt => {
                        const optSel = currentVal === opt ? 'selected' : '';
                        optsHtml += `<option value="${opt}" ${optSel}>${opt}</option>`;
                    });
                    fieldsListHtml += `
                        <div class="flex flex-col gap-1" onclick="event.stopPropagation()">
                            <label class="text-[9px] text-cyan-300 font-mono">${field.label}</label>
                            <select onclick="event.stopPropagation()" onchange="event.stopPropagation(); window.updateCardField(${node.id}, '${field.key}', this.value)" class="bg-slate-900 border border-cyan-500/30 rounded px-1.5 py-1 text-slate-200 text-[10px] focus:outline-none focus:border-cyan-400">
                                ${optsHtml}
                            </select>
                        </div>
                    `;
                } else {
                    fieldsListHtml += `
                        <div class="flex flex-col gap-1" onclick="event.stopPropagation()">
                            <label class="text-[9px] text-cyan-300 font-mono">${field.label}</label>
                            <input type="${field.type}" value="${currentVal}" onclick="event.stopPropagation()" onchange="event.stopPropagation(); window.updateCardField(${node.id}, '${field.key}', this.value)" class="bg-slate-900 border border-cyan-500/30 rounded px-1.5 py-1 text-slate-200 text-[10px] focus:outline-none focus:border-cyan-400">
                        </div>
                    `;
                }
            });

            formFieldsHtml = `
                <div class="mt-2.5 pt-2.5 border-t border-cyan-500/20 flex flex-col gap-2" onclick="event.stopPropagation()">
                    <div class="flex flex-col gap-1">
                        <label class="text-[9px] text-pink-400 font-bold uppercase tracking-wider">Card Template Index</label>
                        <select onclick="event.stopPropagation()" onchange="event.stopPropagation(); window.updateCardType(${node.id}, this.value)" class="bg-slate-900 border border-pink-500/40 rounded px-1.5 py-1 text-pink-300 text-[10px] font-bold focus:outline-none focus:border-pink-400">
                            ${typeOptionsHtml}
                        </select>
                    </div>
                    ${fieldsListHtml}
                </div>
            `;
        }

        html += `
            <div class="glass-panel p-2.5 rounded-xl border ${isSelected ? 'border-pink-500 shadow-[0_0_12px_rgba(255,51,102,0.35)] bg-slate-950/80' : 'border-cyan-500/25'} flex flex-col cursor-pointer hover:border-cyan-400 transition-all" onclick="window.focusNode(${node.id})">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <span class="${isSelected ? 'text-pink-400 font-bold' : 'text-cyan-300 font-bold'}">Node #${node.id}</span>
                        <span class="w-2 h-2 rounded-full" style="background-color: hsl(${node.hue}, 100%, 50%);"></span>
                        <span class="text-[9px] text-slate-400 font-mono">[${currentTemplate.label}]</span>
                    </div>
                    <button onclick="event.stopPropagation(); window.removeAtom(${node.id})" class="text-rose-400 hover:text-rose-300 text-xs px-2 py-0.5 bg-rose-500/10 rounded-lg transition-all font-bold">✕</button>
                </div>
                <span class="text-[9px] text-slate-400 mt-1">Hue: ${node.hue}° | X:${Math.round(node.position.x)} Y:${Math.round(node.position.y)}</span>
                ${formFieldsHtml}
            </div>
        `;
    });

    containerElement.innerHTML = html;
}

window.CARD_TYPES = CARD_TYPES;
window.initializeCardData = initializeCardData;
window.renderAtomCardUI = renderAtomCardUI;
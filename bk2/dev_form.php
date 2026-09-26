<!-- ================================================================= -->
<!-- RRU & AVIS - Developer Form Template (dev_form.php)               -->
<!-- Operator: CVBGOD                                                  -->
<!-- ================================================================= -->
<div id="dev-form-panel-primary_inspector" class="rru-dev-panel" style="display: none; position: fixed; top: 100px; left: calc(100vw - 420px); width: 380px; max-height: 90vh; z-index: 9999;">
    <div class="rru-panel-header">
        <h3 id="dev-form-header-title">RRU Node Inspector & Editor</h3>
        <button id="dev-close-btn-primary_inspector" class="rru-btn-close">&times;</button>
    </div>
    <div class="rru-panel-body avis-dev-scroll">
        <form id="node-config-form-primary_inspector">
            <input type="hidden" id="edit-node-id-primary_inspector" name="nodeId">
            
            <div class="rru-field-group">
                <label>Item Title</label>
                <input type="text" id="node-title-primary_inspector" name="title" placeholder="Enter item title...">
            </div>

            <div class="rru-field-group">
                <label>Item Description / Info</label>
                <textarea id="node-desc-primary_inspector" name="description" rows="3" placeholder="Enter telemetry & item metadata..."></textarea>
            </div>

            <div class="rru-field-group">
                <label>Outer Hue (<span id="val-hue-primary_inspector">185</span>°)</label>
                <input type="range" id="node-hue-primary_inspector" name="hue" min="0" max="360" value="185">
            </div>

            <div class="rru-field-group">
                <label>Inner Hue (<span id="val-inner-hue-primary_inspector">230</span>°)</label>
                <input type="range" id="node-inner-hue-primary_inspector" name="innerHue" min="0" max="360" value="230">
            </div>

            <div class="rru-field-group">
                <label>Object Scale (<span id="val-scale-primary_inspector">1.0</span>x)</label>
                <input type="range" id="node-scale-primary_inspector" name="scale" min="0.2" max="3.0" step="0.1" value="1.0">
            </div>

            <div class="rru-field-group">
                <label>Rotation Z (<span id="val-rotation-primary_inspector">0</span>°)</label>
                <input type="range" id="node-rotation-primary_inspector" name="rotation" min="0" max="360" value="0">
            </div>

            <div class="rru-btn-row">
                <button type="button" id="btn-save-item-primary_inspector" class="rru-btn primary">Save Item Info</button>
                <button type="button" id="btn-delete-node-primary_inspector" class="rru-btn danger">Delete Node</button>
            </div>
        </form>

        <div class="rru-toolbar-section">
            <h4>Deploy Toolbar</h4>
            <div class="rru-spawn-buttons" style="display: flex; gap: 6px; margin-bottom: 8px;">
                <button type="button" class="spawn-btn" draggable="true" data-spawn="sign">Drop Sign</button>
                <button type="button" class="spawn-btn" draggable="true" data-spawn="fire-gem">Drop Fire Gem</button>
                <button type="button" class="spawn-btn" draggable="true" data-spawn="atom">Drop Atom</button>
            </div>
            <div>
                <button type="button" id="btn-clear-all-primary_inspector" class="rru-btn danger" style="width: 100%;">Clear All Nodes</button>
            </div>
        </div>

        <div class="rru-cookie-section">
            <h4>Cookie & Storage Manager</h4>
            <div style="display: flex; gap: 6px;">
                <button type="button" id="btn-compile-cookies-primary_inspector" class="rru-btn">Compile Cookie</button>
                <button type="button" id="btn-load-cookies-primary_inspector" class="rru-btn">Load Cookie</button>
                <button type="button" id="btn-copy-clipboard-primary_inspector" class="rru-btn">Copy</button>
            </div>
        </div>
    </div>
</div>
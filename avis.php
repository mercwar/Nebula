<?php
/**
 * ================================================================= *
 * RRU & AVIS - PHP Table Data Renderer                              *
 * Operator: CVBGOD                                                  *
 * ================================================================= *
 */

function renderAvisTable($dataRows = []) {
    // Default mock telemetry feed if none provided
    if (empty($dataRows)) {
        $dataRows = [
            ['ID' => 'NODE-01', 'Subsystem' => 'AVIS-DL', 'Status' => 'ONLINE', 'Sync' => '100%'],
            ['ID' => 'NODE-02', 'Subsystem' => 'MATRIX', 'Status' => 'ACTIVE', 'Sync' => '98.4%'],
            ['ID' => 'NODE-03', 'Subsystem' => 'FIRE-GEM', 'Status' => 'STABLE', 'Sync' => '99.9%'],
            ['ID' => 'NODE-04', 'Subsystem' => 'SENTINEL', 'Status' => 'ARMED', 'Sync' => '100%']
        ];
    }
    ?>
    <table class="avis-data-table">
        <thead>
            <tr>
                <th>Telemetry Node</th>
                <th>Subsystem</th>
                <th>Status</th>
                <th>Buffer Sync</th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($dataRows as $row): ?>
            <tr>
                <td><?php echo htmlspecialchars($row['ID']); ?></td>
                <td><?php echo htmlspecialchars($row['Subsystem']); ?></td>
                <td>
                    <span class="avis-status-badge <?php echo strtolower($row['Status']); ?>">
                        <?php echo htmlspecialchars($row['Status']); ?>
                    </span>
                </td>
                <td><?php echo htmlspecialchars($row['Sync']); ?></td>
            </tr>
            <?php endforeach; ?>
        </tbody>
    </table>
    <?php
}

function renderAvisMonitor($instanceId = 'avis_default', $top = '407px', $left = '1327px', $tableData = []) {
    ?>
    <div id="avis-monitor-<?php echo htmlspecialchars($instanceId); ?>" class="avis-monitor-window" style="top: <?php echo htmlspecialchars($top); ?>; left: <?php echo htmlspecialchars($left); ?>;">
        <!-- Header -->
        <div class="avis-monitor-header" id="avis-header-<?php echo htmlspecialchars($instanceId); ?>">
            <span>🛰️ AVIS Monitor [<?php echo htmlspecialchars($instanceId); ?>]</span>
            <div class="avis-header-right">
                <button class="avis-header-btn avis-save-btn" title="Compile Map & Save Cookie">⚙️🍪</button>
                <button class="avis-header-btn avis-load-btn" title="Load Settings from Cookie">📥🍪</button>
                <button class="avis-header-btn avis-download-map-btn" title="Download Map File (.json)">💾🍪</button>
                <button class="avis-header-btn avis-minimize-btn" title="Minimize Monitor">&#x2014;</button>
            </div>
        </div>

        <!-- Content Area: Rendered exclusively as a table via PHP -->
        <div class="avis-monitor-content avis-modern-scroll" id="avis-content-<?php echo htmlspecialchars($instanceId); ?>">
            <?php renderAvisTable($tableData); ?>
        </div>

        <!-- Footer -->
        <div class="avis-monitor-footer">
            <button class="avis-action-btn avis-copy-btn">Copy</button>
            <button class="avis-action-btn avis-clear-btn">Clear</button>
            <button class="avis-action-btn avis-download-btn">Download</button>
        </div>
    </div>
    <?php
}
?>
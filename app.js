let ws = null;
let serverUrl = 'http://127.0.0.1:8080';
let isConnected = false;
let reconnectTimer = null;
let commandBuffer = [];
let sendTimer = null;

function init() {
    const savedIp = localStorage.getItem('server-ip');
    const savedPort = localStorage.getItem('server-port');
    if (savedIp) document.getElementById('server-ip').value = savedIp;
    if (savedPort) document.getElementById('server-port').value = savedPort;
    serverUrl = `http://${savedIp || '127.0.0.1'}:${savedPort || '8080'}`;
    connectWS();
    loadState();
}

function connectWS() {
    if (ws) { ws.close(); ws = null; }
    const wsUrl = serverUrl.replace('http', 'ws');
    try {
        ws = new WebSocket(wsUrl);
        ws.onopen = () => {
            isConnected = true;
            updateStatus(true);
            showToast('Conectado al servidor', 'success');
            ws.send(JSON.stringify({ type: 'get_state' }));
        };
        ws.onmessage = (e) => {
            try {
                const msg = JSON.parse(e.data);
                if (msg.type === 'state') {
                    applyState(msg.data);
                } else if (msg.type === 'feature_update') {
                    applyFeatureUpdate(msg.feature, msg.value);
                }
            } catch (err) {}
        };
        ws.onclose = () => {
            isConnected = false;
            updateStatus(false);
            scheduleReconnect();
        };
        ws.onerror = () => {
            isConnected = false;
            updateStatus(false);
        };
    } catch (e) {
        isConnected = false;
        updateStatus(false);
        scheduleReconnect();
    }
}

function scheduleReconnect() {
    if (reconnectTimer) return;
    reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        connectWS();
    }, 3000);
}

function updateStatus(connected) {
    const badge = document.getElementById('connection-status');
    const text = document.getElementById('status-text');
    if (connected) {
        badge.className = 'status-badge connected';
        text.textContent = 'Conectado';
    } else {
        badge.className = 'status-badge disconnected';
        text.textContent = 'Desconectado';
    }
}

function sendCommand(cmd) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(cmd));
    } else {
        fetch(`${serverUrl}/api/command`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cmd)
        }).catch(() => {});
    }
}

function toggleFeature(el) {
    const feature = el.dataset.feature;
    const value = el.checked;
    sendCommand({ type: 'toggle', feature: feature, value: value });
    saveState();
    showToast(`${feature}: ${value ? 'ON' : 'OFF'}`, value ? 'success' : 'info');
}

function updateSlider(el, displayId) {
    const feature = el.dataset.feature;
    const value = parseFloat(el.value);
    document.getElementById(displayId).textContent = value;
    sendCommand({ type: 'slider', feature: feature, value: value });
    saveState();
}

function selectOption(el) {
    const feature = el.dataset.feature;
    const value = parseInt(el.value);
    sendCommand({ type: 'select', feature: feature, value: value });
    saveState();
}

function selectChams(btn) {
    document.querySelectorAll('.chams-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const mode = parseInt(btn.dataset.chams);
    sendCommand({ type: 'chams', mode: mode });
    saveState();
    showToast(`Chams: ${btn.textContent}`, 'success');
}

function toggleMaster(type) {
    const checkbox = document.getElementById(`${type}-master`);
    const tabContent = document.getElementById(`tab-${type}`);
    const toggles = tabContent.querySelectorAll('input[type="checkbox"]');
    toggles.forEach(t => {
        if (t !== checkbox) {
            t.checked = checkbox.checked;
            toggleFeature(t);
        }
    });
    showToast(`${type.toUpperCase()} master: ${checkbox.checked ? 'ON' : 'OFF'}`, checkbox.checked ? 'success' : 'info');
}

function emergencyClose() {
    if (confirm('⚠ EMERGENCY: Esto cerrará TODAS las funciones. ¿Continuar?')) {
        sendCommand({ type: 'emergency' });
        document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
        document.querySelectorAll('.chams-btn').forEach(b => b.classList.remove('active'));
        saveState();
        showToast('EMERGENCY: Todo desactivado', 'error');
    }
}

function resetAll() {
    if (confirm('¿Resetear todas las funciones?')) {
        sendCommand({ type: 'reset_all' });
        document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
        document.querySelectorAll('.chams-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('input[type="range"]').forEach(slider => {
            slider.value = slider.defaultValue;
            const display = slider.nextElementSibling;
        });
        saveState();
        showToast('Todas las funciones reseteadas', 'info');
    }
}

function switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`tab-${tabName}`).classList.add('active');
}

function toggleSettings() {
    const panel = document.getElementById('settings-panel');
    panel.classList.toggle('hidden');
}

function saveSettings() {
    const ip = document.getElementById('server-ip').value;
    const port = document.getElementById('server-port').value;
    localStorage.setItem('server-ip', ip);
    localStorage.setItem('server-port', port);
    serverUrl = `http://${ip}:${port}`;
    showToast('Configuración guardada', 'success');
    connectWS();
}

function testConnection() {
    fetch(`${serverUrl}/api/ping`)
        .then(r => r.json())
        .then(() => showToast('Conexión exitosa!', 'success'))
        .catch(() => showToast('No se pudo conectar al servidor', 'error'));
}

function saveState() {
    const state = {};
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        if (cb.id) state[cb.id] = cb.checked;
    });
    document.querySelectorAll('input[type="range"]').forEach(slider => {
        if (slider.id) state[slider.id] = slider.value;
    });
    document.querySelectorAll('select').forEach(sel => {
        if (sel.id) state[sel.id] = sel.value;
    });
    const activeChams = document.querySelector('.chams-btn.active');
    if (activeChams) state._activeChams = activeChams.dataset.chams;
    localStorage.setItem('spectral-state', JSON.stringify(state));
}

function loadState() {
    const saved = localStorage.getItem('spectral-state');
    if (!saved) return;
    try {
        const state = JSON.parse(saved);
        Object.keys(state).forEach(key => {
            if (key === '_activeChams') {
                const btn = document.querySelector(`[data-chams="${state[key]}"]`);
                if (btn) btn.classList.add('active');
                return;
            }
            const el = document.getElementById(key);
            if (!el) return;
            if (el.type === 'checkbox') el.checked = state[key];
            else if (el.type === 'range') {
                el.value = state[key];
                const display = el.parentElement.querySelector('span');
                if (display) display.textContent = state[key];
            }
            else if (el.tagName === 'SELECT') el.value = state[key];
        });
    } catch (e) {}
}

function applyState(data) {
    if (!data) return;
    Object.keys(data).forEach(feature => {
        applyFeatureUpdate(feature, data[feature]);
    });
}

function applyFeatureUpdate(feature, value) {
    const checkbox = document.querySelector(`[data-feature="${feature}"]`);
    if (checkbox && checkbox.type === 'checkbox') {
        checkbox.checked = !!value;
    }
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'toastOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

document.addEventListener('DOMContentLoaded', init);

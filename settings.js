// settings.js - AI API key management and configuration

class SettingsManager {
    constructor() {
        this.aiConfig = {
            keys: [],
            activeKeyId: null,
            defaults: {
                tone: 'friendly',
                language: 'auto',
                maxReplyLength: 220,
                safety: {
                    noUrls: true,
                    profanityFilter: true
                },
                limits: {
                    minDelayMs: 9000,
                    maxDelayMs: 17000,
                    dailyCap: 120
                },
                relevance: 'medium',
                replyOncePerUser: true
            }
        };
        
        this.init();
    }
    
    async init() {
        await this.loadConfig();
        this.setupEventListeners();
        this.renderKeysTable();
        this.loadDefaults();
        await this.applyThemeFromConfig();
    }
    
    async loadConfig() {
        try {
            const result = await chrome.storage.sync.get(['aiConfig']);
            if (result.aiConfig) {
                this.aiConfig = { ...this.aiConfig, ...result.aiConfig };
            }
        } catch (error) {
            console.error('Error loading config:', error);
            this.showStatus('Error loading configuration', 'error');
        }
    }
    
    async saveConfig() {
        try {
            await chrome.storage.sync.set({ aiConfig: this.aiConfig });
            this.showStatus('Configuration saved successfully', 'success');
            return true;
        } catch (error) {
            console.error('Error saving config:', error);
            this.showStatus('Error saving configuration', 'error');
            return false;
        }
    }
    
    setupEventListeners() {
        // Add key button
        document.getElementById('addKeyBtn').addEventListener('click', () => {
            this.showAddKeyModal();
        });
        
        // Save all button
        document.getElementById('saveAllBtn').addEventListener('click', () => {
            this.saveAllChanges();
        });
        
        // Add key form
        document.getElementById('addKeyForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addNewKey();
        });
        
        // Cancel add key
        document.getElementById('cancelAddKey').addEventListener('click', () => {
            this.hideAddKeyModal();
        });
        
        // Provider change - update models
        document.getElementById('keyProvider').addEventListener('change', () => {
            this.updateModelOptions();
        });
        
        // Test connection
        document.getElementById('testConnectionBtn').addEventListener('click', () => {
            this.testActiveConnection();
        });
        
        // Export/Import
        document.getElementById('exportConfigBtn').addEventListener('click', () => {
            this.exportConfig();
        });
        
        document.getElementById('importConfigBtn').addEventListener('click', () => {
            document.getElementById('importFile').click();
        });
        
        document.getElementById('importFile').addEventListener('change', (e) => {
            this.importConfig(e.target.files[0]);
        });

        // Theme toggle
        const darkToggle = document.getElementById('darkMode');
        if (darkToggle) {
            darkToggle.addEventListener('change', async () => {
                const isDark = darkToggle.checked;
                document.body.dataset.theme = isDark ? 'dark' : '';
                // Persist theme in sync storage (uiTheme)
                try {
                    await chrome.storage.sync.set({ uiTheme: isDark ? 'dark' : 'light' });
                    this.showStatus(`Theme set to ${isDark ? 'Dark' : 'Light'}`, 'success');
                } catch (e) {}
            });
        }
    }
    
    showAddKeyModal() {
        const modal = document.getElementById('addKeyModal');
        modal.classList.remove('hidden');
        this.updateModelOptions();
        document.getElementById('keyLabel').focus();
    }
    
    hideAddKeyModal() {
        const modal = document.getElementById('addKeyModal');
        modal.classList.add('hidden');
        document.getElementById('addKeyForm').reset();
    }
    
    updateModelOptions() {
        const provider = document.getElementById('keyProvider').value;
        const modelSelect = document.getElementById('keyModel');
        
        modelSelect.innerHTML = '';
        
        if (provider === 'gemini') {
            const models = [
                { value: 'gemini-2.5-flash', text: 'Gemini 2.5 Flash' },
                { value: 'gemini-1.5-pro', text: 'Gemini 1.5 Pro' },
                { value: 'gemini-1.5-flash', text: 'Gemini 1.5 Flash' }
            ];
            models.forEach(model => {
                const option = document.createElement('option');
                option.value = model.value;
                option.textContent = model.text;
                modelSelect.appendChild(option);
            });
        } else if (provider === 'mistral') {
            const models = [
                { value: 'mistral-large', text: 'Mistral Large' },
                { value: 'mistral-nemo', text: 'Mistral Nemo' },
                { value: 'mistral-small', text: 'Mistral Small' }
            ];
            models.forEach(model => {
                const option = document.createElement('option');
                option.value = model.value;
                option.textContent = model.text;
                modelSelect.appendChild(option);
            });
        }
    }
    
    addNewKey() {
        const label = document.getElementById('keyLabel').value.trim();
        const provider = document.getElementById('keyProvider').value;
        const model = document.getElementById('keyModel').value;
        const apiKey = document.getElementById('keyApiKey').value.trim();
        const vision = document.getElementById('keyVision').checked;
        const active = document.getElementById('keyActive').checked;
        
        if (!label || !apiKey) {
            this.showStatus('Please fill in all required fields', 'error');
            return;
        }
        
        const newKey = {
            id: `key_${Date.now()}`,
            label,
            provider,
            model,
            apiKey,
            vision
        };
        
        this.aiConfig.keys.push(newKey);
        
        if (active || this.aiConfig.keys.length === 1) {
            this.aiConfig.activeKeyId = newKey.id;
        }
        
        this.renderKeysTable();
        this.hideAddKeyModal();
        this.showStatus(`Added key: ${label}`, 'success');
    }
    
    renderKeysTable() {
        const tbody = document.getElementById('keysTableBody');
        tbody.innerHTML = '';
        
        if (this.aiConfig.keys.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: #65676b; padding: 24px;">
                        No API keys configured. Click "Add New Key" to get started.
                    </td>
                </tr>
            `;
            return;
        }
        
        this.aiConfig.keys.forEach(key => {
            const row = document.createElement('tr');
            const isActive = key.id === this.aiConfig.activeKeyId;
            
            row.innerHTML = `
                <td>
                    <strong>${key.label}</strong>
                    ${isActive ? '<span style="color: #42b883; font-size: 12px; margin-left: 8px;">● ACTIVE</span>' : ''}
                </td>
                <td>
                    <span class="provider-badge provider-${key.provider}">${key.provider}</span>
                </td>
                <td>${key.model}</td>
                <td>
                    <span style="color: ${key.vision ? '#42b883' : '#65676b'};">
                        ${key.vision ? '✓ Vision' : '✗ Text only'}
                    </span>
                </td>
                <td>
                    <input type="radio" name="activeKey" value="${key.id}" 
                           ${isActive ? 'checked' : ''} 
                           onchange="settingsManager.setActiveKey('${key.id}')">
                </td>
                <td>
                    <button class="btn btn-danger btn-small" onclick="settingsManager.deleteKey('${key.id}')">
                        🗑️ Delete
                    </button>
                </td>
            `;
            
            tbody.appendChild(row);
        });
    }
    
    setActiveKey(keyId) {
        this.aiConfig.activeKeyId = keyId;
        this.renderKeysTable();
        this.showStatus('Active key updated', 'success');
    }
    
    async deleteKey(keyId) {
        if (!confirm('Are you sure you want to delete this API key?')) {
            return;
        }
        
        const keyIndex = this.aiConfig.keys.findIndex(k => k.id === keyId);
        if (keyIndex === -1) return;
        
        const deletedKey = this.aiConfig.keys[keyIndex];
        this.aiConfig.keys.splice(keyIndex, 1);
        
        // If deleted key was active, set another as active
        if (this.aiConfig.activeKeyId === keyId) {
            this.aiConfig.activeKeyId = this.aiConfig.keys.length > 0 ? this.aiConfig.keys[0].id : null;
        }
        
        this.renderKeysTable();
        this.showStatus(`Deleted key: ${deletedKey.label}`, 'success');
    }
    
    loadDefaults() {
        const defaults = this.aiConfig.defaults;
        
        document.getElementById('defaultTone').value = defaults.tone;
        document.getElementById('defaultLanguage').value = defaults.language;
        document.getElementById('maxReplyLength').value = defaults.maxReplyLength;
        document.getElementById('minDelay').value = Math.floor(defaults.limits.minDelayMs / 1000);
        document.getElementById('maxDelay').value = Math.floor(defaults.limits.maxDelayMs / 1000);
        document.getElementById('dailyCap').value = defaults.limits.dailyCap;
        document.getElementById('relevance').value = defaults.relevance;
        document.getElementById('noUrls').checked = defaults.safety.noUrls;
        document.getElementById('profanityFilter').checked = defaults.safety.profanityFilter;
        document.getElementById('replyOncePerUser').checked = defaults.replyOncePerUser;

        // Load theme toggle initial state from storage (default dark)
        chrome.storage.sync.get(['uiTheme'], (res) => {
            const isDark = (res && res.uiTheme ? res.uiTheme : 'dark') === 'dark';
            const toggle = document.getElementById('darkMode');
            if (toggle) toggle.checked = isDark;
        });
    }
    
    async saveAllChanges() {
        // Update defaults from form
        this.aiConfig.defaults = {
            tone: document.getElementById('defaultTone').value,
            language: document.getElementById('defaultLanguage').value,
            maxReplyLength: parseInt(document.getElementById('maxReplyLength').value),
            safety: {
                noUrls: document.getElementById('noUrls').checked,
                profanityFilter: document.getElementById('profanityFilter').checked
            },
            limits: {
                minDelayMs: parseInt(document.getElementById('minDelay').value) * 1000,
                maxDelayMs: parseInt(document.getElementById('maxDelay').value) * 1000,
                dailyCap: parseInt(document.getElementById('dailyCap').value)
            },
            relevance: document.getElementById('relevance').value,
            replyOncePerUser: document.getElementById('replyOncePerUser').checked
        };
        
        await this.saveConfig();
    }

    async applyThemeFromConfig() {
        try {
            const res = await chrome.storage.sync.get(['uiTheme']);
            const isDark = (res && res.uiTheme ? res.uiTheme : 'dark') === 'dark';
            document.body.dataset.theme = isDark ? 'dark' : '';
        } catch (_) {
            document.body.dataset.theme = 'dark';
        }
    }
    
    async testActiveConnection() {
        const activeKey = this.aiConfig.keys.find(k => k.id === this.aiConfig.activeKeyId);
        
        if (!activeKey) {
            this.showStatus('No active key configured', 'error');
            return;
        }
        
        this.showStatus('Testing connection...', 'info');
        
        try {
            const response = await chrome.runtime.sendMessage({
                type: 'AI_TEST_CONNECTION',
                provider: activeKey.provider,
                model: activeKey.model,
                apiKey: activeKey.apiKey
            });
            
            if (response.success) {
                this.showStatus(`✅ Connection successful: ${activeKey.label}`, 'success');
            } else {
                this.showStatus(`❌ Connection failed: ${response.error}`, 'error');
            }
        } catch (error) {
            console.error('Connection test error:', error);
            this.showStatus('❌ Connection test failed', 'error');
        }
    }
    
    exportConfig() {
        const configToExport = {
            ...this.aiConfig,
            keys: this.aiConfig.keys.map(key => ({
                ...key,
                apiKey: key.apiKey.substring(0, 8) + '...' // Mask API keys for export
            }))
        };
        
        const blob = new Blob([JSON.stringify(configToExport, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'fb-ai-config.json';
        a.click();
        
        URL.revokeObjectURL(url);
        this.showStatus('Configuration exported', 'success');
    }
    
    importConfig(file) {
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedConfig = JSON.parse(e.target.result);
                
                if (confirm('This will replace your current configuration. Continue?')) {
                    this.aiConfig = { ...this.aiConfig, ...importedConfig };
                    this.renderKeysTable();
                    this.loadDefaults();
                    this.showStatus('Configuration imported successfully', 'success');
                }
            } catch (error) {
                console.error('Import error:', error);
                this.showStatus('Invalid configuration file', 'error');
            }
        };
        
        reader.readAsText(file);
    }
    
    showStatus(message, type = 'info') {
        const statusEl = document.getElementById('status');
        statusEl.textContent = message;
        statusEl.className = `status ${type}`;
        statusEl.classList.remove('hidden');
        
        // Auto-hide success/info messages
        if (type === 'success' || type === 'info') {
            setTimeout(() => {
                statusEl.classList.add('hidden');
            }, 3000);
        }
    }
}

// Initialize settings manager when DOM is loaded
let settingsManager;
document.addEventListener('DOMContentLoaded', () => {
    settingsManager = new SettingsManager();
});

// Make settingsManager globally available for inline event handlers
window.settingsManager = settingsManager;

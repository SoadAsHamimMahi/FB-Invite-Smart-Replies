// reply.js - Smart Reply Comments controller

class ReplyController {
    constructor() {
        this.isRunning = false;
        this.isPaused = false;
        this.currentMode = 'preview';
        this.aiConfig = null;
        this.postContext = null;
        this.comments = [];
        this.processedComments = new Set();
        this.repliedUsers = new Set();
        this.stats = {
            total: 0,
            processed: 0,
            replied: 0,
            skipped: 0
        };
        this.dailyUsage = 0;
        
        this.init();
    }
    
    async init() {
        await this.loadConfig();
        this.setupEventListeners();
        this.updateActiveKeyDisplay();
        this.loadDefaults();
        await this.applyThemeFromSettings();
    }
    
    async loadConfig() {
        try {
            const result = await chrome.storage.sync.get(['aiConfig']);
            if (result.aiConfig) {
                this.aiConfig = result.aiConfig;
            } else {
                this.showStatus('No AI configuration found. Please configure API keys in Settings.', 'error');
            }
        } catch (error) {
            console.error('Error loading config:', error);
            this.showStatus('Error loading configuration', 'error');
        }
    }
    
    loadDefaults() {
        if (!this.aiConfig || !this.aiConfig.defaults) return;
        
        const defaults = this.aiConfig.defaults;
        document.getElementById('tone').value = defaults.tone || 'friendly';
        document.getElementById('language').value = defaults.language || 'auto';
        document.getElementById('maxReplyLength').value = defaults.maxReplyLength || 220;
        document.getElementById('relevance').value = defaults.relevance || 'medium';
        document.getElementById('noUrls').checked = defaults.safety?.noUrls !== false;
        document.getElementById('profanityFilter').checked = defaults.safety?.profanityFilter !== false;
        document.getElementById('replyOncePerUser').checked = defaults.replyOncePerUser !== false;
    }
    
    setupEventListeners() {
        // Mode selector
        document.querySelectorAll('.mode-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.mode-option').forEach(o => o.classList.remove('active'));
                option.classList.add('active');
                this.currentMode = option.dataset.mode;
                this.log(`Switched to ${this.currentMode} mode`, 'info');
            });
        });
        
        // Control buttons
        document.getElementById('startBtn').addEventListener('click', () => {
            this.start();
        });
        
        document.getElementById('pauseBtn').addEventListener('click', () => {
            this.pause();
        });
        
        document.getElementById('stopBtn').addEventListener('click', () => {
            this.stop();
        });
        
        // Preview modal
        document.getElementById('approveBtn').addEventListener('click', () => {
            this.approveReply();
        });
        
        // Copy from preview
        const copyBtn = document.getElementById('copyPreviewReplyBtn');
        if (copyBtn) {
            copyBtn.addEventListener('click', async () => {
                try {
                    const text = document.getElementById('previewText').textContent || '';
                    if (!text.trim()) return;
                    await navigator.clipboard.writeText(text);
                    this.showStatus('Reply copied to clipboard!', 'success');
                } catch (err) {
                    const ta = document.createElement('textarea');
                    ta.value = document.getElementById('previewText').textContent || '';
                    document.body.appendChild(ta);
                    ta.select();
                    document.execCommand('copy');
                    document.body.removeChild(ta);
                    this.showStatus('Reply copied to clipboard!', 'success');
                }
            });
        }
        
        document.getElementById('skipBtn').addEventListener('click', () => {
            this.skipReply();
        });
        
        document.getElementById('cancelPreviewBtn').addEventListener('click', () => {
            this.closePreviewModal();
        });
    }

    async applyThemeFromSettings() {
        try {
            const res = await chrome.storage.sync.get(['uiTheme']);
            const isDark = (res && res.uiTheme ? res.uiTheme : 'dark') === 'dark';
            document.body.dataset.theme = isDark ? 'dark' : '';
        } catch (_) {
            document.body.dataset.theme = 'dark';
        }
    }
    
    updateActiveKeyDisplay() {
        if (!this.aiConfig || !this.aiConfig.activeKeyId) {
            document.getElementById('activeKeyDisplay').textContent = 'No active key';
            return;
        }
        
        const activeKey = this.aiConfig.keys.find(k => k.id === this.aiConfig.activeKeyId);
        if (activeKey) {
            document.getElementById('activeKeyDisplay').textContent = 
                `${activeKey.label} (${activeKey.provider})`;
        } else {
            document.getElementById('activeKeyDisplay').textContent = 'Invalid active key';
        }
    }
    
    async start() {
        if (this.isRunning) return;
        
        // Check if we have an active key
        if (!this.aiConfig || !this.aiConfig.activeKeyId) {
            this.showStatus('No active AI key configured. Please set one in Settings.', 'error');
            return;
        }
        
        // Check daily limit
        await this.checkDailyLimit();
        if (this.dailyUsage >= (this.aiConfig.defaults?.limits?.dailyCap || 120)) {
            this.showStatus('Daily reply limit reached. Try again tomorrow.', 'error');
            return;
        }
        
        this.isRunning = true;
        this.isPaused = false;
        this.updateButtons();
        
        try {
            // Inject content script if not already present
            await this.ensureContentScript();
            
            // Get post context
            this.log('Getting post context...', 'info');
            this.postContext = await this.getPostContext();
            
            if (!this.postContext || !this.postContext.comments || this.postContext.comments.length === 0) {
                this.showStatus('No comments found on this post', 'error');
                this.stop();
                return;
            }
            
            this.comments = this.postContext.comments;
            this.stats.total = this.comments.length;
            this.updateStats();
            
            this.log(`Found ${this.stats.total} comments to process`, 'success');
            this.showStatus(`Processing ${this.stats.total} comments...`, 'info');
            
            // Process comments
            await this.processComments();
            
        } catch (error) {
            console.error('Start error:', error);
            this.log(`Error: ${error.message}`, 'error');
            this.stop();
        }
    }
    
    async ensureContentScript() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // Try to execute the content script
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['reply_content.js']
            });
            
            this.log('Content script injected successfully', 'success');
        } catch (error) {
            // Script might already be injected
            this.log('Content script ready', 'info');
        }
    }
    
    async getPostContext() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            const response = await chrome.tabs.sendMessage(tab.id, {
                type: 'MSG_GET_CONTEXT'
            });
            
            if (response && response.success) {
                return response.data;
            } else {
                throw new Error(response?.error || 'Failed to get post context');
            }
        } catch (error) {
            console.error('Get context error:', error);
            throw new Error('Failed to extract post context. Make sure you\'re on a Facebook post page.');
        }
    }
    
    async processComments() {
        for (let i = 0; i < this.comments.length && this.isRunning; i++) {
            if (this.isPaused) {
                await this.waitForResume();
            }
            
            const comment = this.comments[i];
            const commentId = `${comment.user}_${comment.text.substring(0, 50)}`;
            
            // Skip if already processed
            if (this.processedComments.has(commentId)) {
                continue;
            }
            
            // Check if we've already replied to this user (if enabled)
            if (document.getElementById('replyOncePerUser').checked && 
                this.repliedUsers.has(comment.user)) {
                this.stats.skipped++;
                this.log(`Skipped ${comment.user} (already replied)`, 'warning');
                this.updateStats();
                continue;
            }
            
            // Check relevance
            const relevance = document.getElementById('relevance').value;
            if (!this.looksRelevant(this.postContext.caption, comment.text, relevance)) {
                this.stats.skipped++;
                this.log(`Skipped ${comment.user} (low relevance)`, 'warning');
                this.updateStats();
                continue;
            }
            
            try {
                await this.processComment(comment);
                this.processedComments.add(commentId);
                this.stats.processed++;
                this.updateStats();
                
                // Wait between replies
                if (i < this.comments.length - 1) {
                    const delay = this.getRandomDelay();
                    this.log(`Waiting ${delay/1000}s before next reply...`, 'info');
                    await this.sleep(delay);
                }
                
            } catch (error) {
                console.error('Process comment error:', error);
                this.log(`Error processing ${comment.user}: ${error.message}`, 'error');
            }
        }
        
        if (this.isRunning) {
            this.log('Finished processing all comments', 'success');
            this.stop();
        }
    }
    
    async processComment(comment) {
        this.log(`Processing comment from ${comment.user}...`, 'info');
        
        // Generate reply
        const replyText = await this.generateReply(comment);
        
        if (!replyText) {
            this.log(`No reply generated for ${comment.user}`, 'warning');
            return;
        }
        
        // Sanitize reply
        const sanitizedReply = this.sanitizeReply(replyText);
        
        if (this.currentMode === 'preview') {
            await this.showPreview(comment, sanitizedReply);
        } else {
            await this.sendReply(comment, sanitizedReply);
        }
    }
    
    async generateReply(comment) {
        try {
            const activeKey = this.aiConfig.keys.find(k => k.id === this.aiConfig.activeKeyId);
            if (!activeKey) {
                throw new Error('No active key found');
            }
            
            const prompt = this.buildPrompt(comment);
            
            const response = await chrome.runtime.sendMessage({
                type: 'AI_GENERATE_REPLY',
                provider: activeKey.provider,
                model: activeKey.model,
                apiKey: activeKey.apiKey,
                prompt: prompt,
                images: activeKey.vision ? this.postContext.images : null
            });
            
            if (response && response.success) {
                return response.reply;
            } else {
                throw new Error(response?.error || 'Failed to generate reply');
            }
        } catch (error) {
            console.error('Generate reply error:', error);
            throw error;
        }
    }
    
    buildPrompt(comment) {
        const tone = document.getElementById('tone').value;
        const language = document.getElementById('language').value;
        const maxLength = parseInt(document.getElementById('maxReplyLength').value);
        const safety = {
            noUrls: document.getElementById('noUrls').checked,
            profanityFilter: document.getElementById('profanityFilter').checked
        };
        
        return [
            `You are a helpful page admin assistant.`,
            `Write ONE short ${tone} reply. Be relevant to the POST and the COMMENT.`,
            safety.noUrls ? `Do NOT include URLs, phone numbers, or emails.` : ``,
            safety.profanityFilter ? `Never use profanity or offensive language.` : ``,
            language && language !== 'auto' ? `Write in ${language}.` : `Use the commenter's language if clear; else English.`,
            `Hard limit: <= ${maxLength} characters.`,
            `POST: """${this.truncate(this.postContext.caption, 600)}"""`,
            `COMMENT: """${this.truncate(comment.text, 400)}"""`,
            `Return only the reply sentence.`
        ].filter(Boolean).join("\n");
    }
    
    sanitizeReply(text) {
        if (!text) return text;
        
        const noUrls = document.getElementById('noUrls').checked;
        if (noUrls) {
            text = text.replace(/https?:\/\/\S+/g, '');
            text = text.replace(/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, '');
        }
        
        return text.trim();
    }
    
    async showPreview(comment, replyText) {
        return new Promise((resolve) => {
            this.currentPreviewResolve = resolve;
            this.currentPreviewComment = comment;
            this.currentPreviewReply = replyText;
            
            document.getElementById('previewText').textContent = replyText;
            document.getElementById('previewModal').style.display = 'flex';
        });
    }
    
    async approveReply() {
        await this.sendReply(this.currentPreviewComment, this.currentPreviewReply);
        this.closePreviewModal();
    }
    
    async skipReply() {
        this.log(`Skipped reply for ${this.currentPreviewComment.user}`, 'warning');
        this.closePreviewModal();
    }
    
    closePreviewModal() {
        document.getElementById('previewModal').style.display = 'none';
        if (this.currentPreviewResolve) {
            this.currentPreviewResolve();
            this.currentPreviewResolve = null;
        }
    }
    
    async sendReply(comment, replyText) {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            const response = await chrome.tabs.sendMessage(tab.id, {
                type: 'MSG_POST_REPLY',
                commentRef: comment.refId,
                text: replyText
            });
            
            if (response && response.success) {
                this.stats.replied++;
                this.repliedUsers.add(comment.user);
                this.dailyUsage++;
                this.log(`Replied to ${comment.user}: "${replyText}"`, 'success');
                this.updateStats();
            } else {
                throw new Error(response?.error || 'Failed to post reply');
            }
        } catch (error) {
            console.error('Send reply error:', error);
            throw error;
        }
    }
    
    looksRelevant(caption, comment, level = 'medium') {
        if (!caption || !comment) return false;
        
        const c1 = new Set((caption || "").toLowerCase().split(/\W+/));
        const c2 = new Set((comment || "").toLowerCase().split(/\W+/));
        const inter = [...c2].filter(x => c1.has(x)).length;
        const thresholds = { low: 1, medium: 2, high: 3 };
        
        return inter >= (thresholds[level] || 2);
    }
    
    getRandomDelay() {
        const defaults = this.aiConfig.defaults;
        const min = defaults?.limits?.minDelayMs || 9000;
        const max = defaults?.limits?.maxDelayMs || 17000;
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    async checkDailyLimit() {
        try {
            const result = await chrome.storage.local.get(['dailyUsage', 'lastUsageDate']);
            const today = new Date().toDateString();
            
            if (result.lastUsageDate === today) {
                this.dailyUsage = result.dailyUsage || 0;
            } else {
                this.dailyUsage = 0;
                await chrome.storage.local.set({ dailyUsage: 0, lastUsageDate: today });
            }
        } catch (error) {
            console.error('Error checking daily limit:', error);
            this.dailyUsage = 0;
        }
    }
    
    async saveDailyUsage() {
        try {
            await chrome.storage.local.set({ 
                dailyUsage: this.dailyUsage, 
                lastUsageDate: new Date().toDateString() 
            });
        } catch (error) {
            console.error('Error saving daily usage:', error);
        }
    }
    
    pause() {
        this.isPaused = true;
        this.updateButtons();
        this.log('Paused', 'warning');
    }
    
    async resume() {
        this.isPaused = false;
        this.updateButtons();
        this.log('Resumed', 'info');
    }
    
    async waitForResume() {
        while (this.isPaused && this.isRunning) {
            await this.sleep(1000);
        }
    }
    
    stop() {
        this.isRunning = false;
        this.isPaused = false;
        this.updateButtons();
        this.log('Stopped', 'info');
        this.saveDailyUsage();
    }
    
    updateButtons() {
        const startBtn = document.getElementById('startBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        const stopBtn = document.getElementById('stopBtn');
        
        if (this.isRunning) {
            startBtn.disabled = true;
            pauseBtn.disabled = false;
            stopBtn.disabled = false;
            
            if (this.isPaused) {
                pauseBtn.textContent = '▶️ Resume';
                pauseBtn.onclick = () => this.resume();
            } else {
                pauseBtn.textContent = '⏸️ Pause';
                pauseBtn.onclick = () => this.pause();
            }
        } else {
            startBtn.disabled = false;
            pauseBtn.disabled = true;
            stopBtn.disabled = true;
            pauseBtn.textContent = '⏸️ Pause';
            pauseBtn.onclick = () => this.pause();
        }
    }
    
    updateStats() {
        document.getElementById('totalComments').textContent = this.stats.total;
        document.getElementById('processedComments').textContent = this.stats.processed;
        document.getElementById('repliedComments').textContent = this.stats.replied;
        document.getElementById('skippedComments').textContent = this.stats.skipped;
        
        const progress = this.stats.total > 0 ? (this.stats.processed / this.stats.total) * 100 : 0;
        document.getElementById('progressFill').style.width = `${progress}%`;
        document.getElementById('progressText').textContent = 
            `${this.stats.processed}/${this.stats.total} processed`;
    }
    
    log(message, type = 'info') {
        const logArea = document.getElementById('logArea');
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        logEntry.textContent = `[${timestamp}] ${message}`;
        
        logArea.appendChild(logEntry);
        logArea.scrollTop = logArea.scrollHeight;
        
        // Keep only last 100 entries
        const entries = logArea.querySelectorAll('.log-entry');
        if (entries.length > 100) {
            entries[0].remove();
        }
    }
    
    showStatus(message, type = 'info') {
        const statusEl = document.getElementById('status');
        statusEl.textContent = message;
        statusEl.className = `status ${type}`;
        statusEl.classList.remove('hidden');
        
        if (type === 'success' || type === 'info') {
            setTimeout(() => {
                statusEl.classList.add('hidden');
            }, 3000);
        }
    }
    
    truncate(str, maxLength) {
        if (!str) return '';
        return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize reply controller when DOM is loaded
let replyController;
document.addEventListener('DOMContentLoaded', () => {
    replyController = new ReplyController();
});

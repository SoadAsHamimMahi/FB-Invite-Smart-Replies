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
        
        // Batch tracking properties
        this.currentBatch = 0;
        this.batchSize = 50; // Default batch size (50 for first scan)
        this.totalBatches = 0; // Estimated
        this.allComments = []; // Accumulated across batches
        this.hasMoreBatches = false; // Whether more batches are available
        this.isScanningBatch = false; // Whether currently scanning a batch
        this.scanProgressListener = null; // Listener for scan progress updates
        
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
        
        document.getElementById('scanNextBatchBtn').addEventListener('click', () => {
            this.scanNextBatch();
        });
        
        document.getElementById('continueScanningBtn').addEventListener('click', () => {
            this.continueScanning();
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
        this.currentBatch = 0;
        this.allComments = [];
        this.hasMoreBatches = false;
        this.isScanningBatch = false;
        this.updateButtons();
        
        try {
            // Inject content script if not already present
            await this.ensureContentScript();
            
            // Get initial post context (caption and images)
            this.log('Getting post context...', 'info');
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const initialResponse = await chrome.tabs.sendMessage(tab.id, {
                type: 'MSG_GET_CONTEXT'
            });
            
            if (initialResponse && initialResponse.success) {
                this.postContext = {
                    caption: initialResponse.data.caption,
                    images: initialResponse.data.images,
                    comments: []
                };
            } else {
                throw new Error('Failed to get post context');
            }
            
            // Scan first batch
            await this.scanNextBatch();
            
        } catch (error) {
            console.error('Start error:', error);
            this.log(`Error: ${error.message}`, 'error');
            this.stop();
        }
    }
    
    async scanNextBatch() {
        if (this.isScanningBatch) {
            this.log('Already scanning a batch, please wait...', 'warning');
            return;
        }
        
        this.isScanningBatch = true;
        this.currentBatch++;
        this.log(`Scanning batch ${this.currentBatch}...`, 'info');
        this.updateButtons();
        this.showScanProgress();
        
        // Clear any existing continue scanning flags
        try {
            chrome.storage.local.set({ 
                continueScanning: false,
                showContinueScanning: false
            });
        } catch(_) {}
        
        // Set up progress listener
        this.scanProgressListener = (message) => {
            if (message && message.type === 'SCAN_PROGRESS') {
                this.updateScanProgress(message.current || 0, message.target || this.batchSize);
            }
        };
        
        // Set up continue scanning button listener (check storage immediately and on changes)
        this.checkContinueScanningFlag();
        
        chrome.runtime.onMessage.addListener(this.scanProgressListener);
        
        // Listen for storage changes with better error handling
        this.storageListener = (changes, areaName) => {
            if (areaName === 'local' && changes.showContinueScanning) {
                if (changes.showContinueScanning.newValue === true) {
                    this.log('Storage change detected: showing Continue Scanning button', 'info');
                    this.showContinueScanningButton();
                } else if (changes.showContinueScanning.newValue === false) {
                    this.hideContinueScanningButton();
                }
            }
        };
        chrome.storage.onChanged.addListener(this.storageListener);
        
        // Also poll storage periodically as backup (in case change event doesn't fire)
        this.storagePollInterval = setInterval(() => {
            this.checkContinueScanningFlag();
        }, 1000);
        
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const response = await chrome.tabs.sendMessage(tab.id, {
                type: 'SCAN_COMMENTS',
                maxComments: 'all',
                autoLoad: true,
                batchSize: this.batchSize,
                batchNumber: this.currentBatch
            });
            
            if (response && response.success && response.data) {
                const batchComments = response.data.comments || [];
                const batchNumber = response.data.batchNumber || this.currentBatch;
                this.hasMoreBatches = response.data.hasMore === true;
                
                // Deduplicate against already collected comments
                const seen = new Set(this.allComments.map(c => `${c.user}_${(c.text||'').substring(0,50)}`));
                let added = 0;
                for (const comment of batchComments) {
                    const k = `${comment.user}_${(comment.text||'').substring(0,50)}`;
                    if (!seen.has(k)) {
                        seen.add(k);
                        this.allComments.push(comment);
                        added++;
                    }
                }
                
                this.log(`Batch ${batchNumber}: Found ${batchComments.length} comments (${added} new)`, 'success');
                
                // Update total
                this.comments = this.allComments;
                this.stats.total = this.allComments.length;
                
                // Estimate total batches
                if (this.hasMoreBatches) {
                    this.totalBatches = Math.ceil((response.data.totalScanned || this.allComments.length) / this.batchSize) + 1;
                } else {
                    this.totalBatches = this.currentBatch;
                }
                
                this.updateStats();
                this.updateButtons();
                
                // Process new comments from this batch
                if (this.isRunning) {
                    await this.processComments();
                }
                
                if (!this.hasMoreBatches) {
                    this.log(`All batches scanned. Total: ${this.allComments.length} comments`, 'success');
                } else {
                    this.log(`Batch ${batchNumber} complete. Click "Scan Next Batch" to continue.`, 'info');
                }
            } else {
                this.log(`Failed to scan batch ${this.currentBatch}: ${response?.error || 'Unknown error'}`, 'error');
                this.hasMoreBatches = false;
                this.updateButtons();
            }
        } catch (error) {
            console.error('Batch scanning error:', error);
            this.log(`Error scanning batch ${this.currentBatch}: ${error.message}`, 'error');
            this.hasMoreBatches = false;
            this.updateButtons();
        } finally {
            // Remove progress listener
            if (this.scanProgressListener) {
                chrome.runtime.onMessage.removeListener(this.scanProgressListener);
                this.scanProgressListener = null;
            }
            // Remove storage listener
            if (this.storageListener) {
                chrome.storage.onChanged.removeListener(this.storageListener);
                this.storageListener = null;
            }
            // Clear storage polling interval
            if (this.storagePollInterval) {
                clearInterval(this.storagePollInterval);
                this.storagePollInterval = null;
            }
            this.hideContinueScanningButton();
            this.hideScanProgress();
            this.isScanningBatch = false;
        }
    }
    
    showContinueScanningButton() {
        const btn = document.getElementById('continueScanningBtn');
        if (btn) {
            btn.style.display = 'inline-flex';
            btn.disabled = false;
            this.log('Click "Continue Scanning" to proceed after loading comments...', 'info');
        }
    }
    
    hideContinueScanningButton() {
        const btn = document.getElementById('continueScanningBtn');
        if (btn) {
            btn.style.display = 'none';
            btn.disabled = true;
        }
    }
    
    async checkContinueScanningFlag() {
        try {
            const result = await chrome.storage.local.get(['showContinueScanning', 'continueScanningBatch']);
            if (result.showContinueScanning === true) {
                const batchNum = result.continueScanningBatch || this.currentBatch;
                if (batchNum === this.currentBatch) {
                    this.showContinueScanningButton();
                }
            }
        } catch(e) {
            console.warn('Error checking continue scanning flag:', e);
        }
    }
    
    continueScanning() {
        // Set flag in storage to signal content script to continue
        chrome.storage.local.set({ 
            continueScanning: true,
            showContinueScanning: false 
        }).then(() => {
            this.hideContinueScanningButton();
            this.log('Continuing scan...', 'info');
        }).catch((e) => {
            this.log(`Error setting continue flag: ${e.message}`, 'error');
        });
    }
    
    showScanProgress() {
        const container = document.getElementById('scanProgressContainer');
        if (container) {
            container.style.display = 'block';
            this.updateScanProgress(0, this.batchSize);
        }
    }
    
    hideScanProgress() {
        const container = document.getElementById('scanProgressContainer');
        if (container) {
            container.style.display = 'none';
        }
    }
    
    updateScanProgress(current, target) {
        const progressFill = document.getElementById('scanProgressFill');
        const progressText = document.getElementById('scanProgressText');
        const progressCount = document.getElementById('scanProgressCount');
        
        if (progressFill && progressText && progressCount) {
            const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
            progressFill.style.width = `${percentage}%`;
            progressText.textContent = `Scanning batch ${this.currentBatch}...`;
            progressCount.textContent = `${current} found`;
        }
    }
    
    async processComments() {
        // Process all unprocessed comments
        const commentsToProcess = this.allComments.slice(this.stats.processed);
        
        for (const comment of commentsToProcess) {
            if (!this.isRunning) break;
            if (this.isPaused) {
                await this.waitForResume();
            }
            
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
                this.processedComments.add(commentId);
                continue;
            }
            
            // Check relevance
            const relevance = document.getElementById('relevance').value;
            if (!this.looksRelevant(this.postContext.caption, comment.text, relevance)) {
                this.stats.skipped++;
                this.log(`Skipped ${comment.user} (low relevance)`, 'warning');
                this.updateStats();
                this.processedComments.add(commentId);
                continue;
            }
            
            try {
                await this.processComment(comment);
                this.processedComments.add(commentId);
                this.stats.processed++;
                this.updateStats();
                
                // Wait between replies
                if (this.isRunning) {
                    const delay = this.getRandomDelay();
                    this.log(`Waiting ${delay/1000}s before next reply...`, 'info');
                    await this.sleep(delay);
                }
                
            } catch (error) {
                console.error('Process comment error:', error);
                this.log(`Error processing ${comment.user}: ${error.message}`, 'error');
            }
        }
        
        if (this.isRunning && this.stats.processed >= this.stats.total) {
            this.log('Finished processing all scanned comments', 'success');
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
            
            // Use batch scanning for better performance
            const response = await chrome.tabs.sendMessage(tab.id, {
                type: 'SCAN_COMMENTS',
                maxComments: 'all',
                autoLoad: true,
                batchSize: this.batchSize,
                batchNumber: this.currentBatch + 1
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
        this.hasMoreBatches = false;
        this.isScanningBatch = false;
        this.updateButtons();
        this.log('Stopped', 'info');
        this.saveDailyUsage();
    }
    
    updateButtons() {
        const startBtn = document.getElementById('startBtn');
        const scanNextBatchBtn = document.getElementById('scanNextBatchBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        const stopBtn = document.getElementById('stopBtn');
        
        if (this.isRunning) {
            startBtn.disabled = true;
            pauseBtn.disabled = false;
            stopBtn.disabled = false;
            
            // Show/hide scan next batch button
            if (this.hasMoreBatches && !this.isScanningBatch) {
                scanNextBatchBtn.style.display = 'inline-flex';
                scanNextBatchBtn.disabled = false;
            } else {
                scanNextBatchBtn.style.display = 'none';
                scanNextBatchBtn.disabled = true;
            }
            
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
            scanNextBatchBtn.style.display = 'none';
            scanNextBatchBtn.disabled = true;
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
        
        // Update progress text with batch information
        if (this.currentBatch > 0) {
            const batchInfo = this.totalBatches > 0 
                ? `Batch ${this.currentBatch}/${this.totalBatches} - ` 
                : `Batch ${this.currentBatch} - `;
            document.getElementById('progressText').textContent = 
                `${batchInfo}${this.stats.processed}/${this.stats.total} processed`;
        } else {
            document.getElementById('progressText').textContent = 
                `${this.stats.processed}/${this.stats.total} processed`;
        }
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

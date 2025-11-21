// popup.js - Manual Reply Generator Controller

class ManualReplyController {
    constructor() {
        this.currentTab = 'invite';
        this.aiConfig = null;
        this.postData = null; // Store the post caption and image
        this.currentReply = null; // Store the current generated reply
        this.inviteSettings = null; // Store invite settings
        
        // Batch generation properties
        this.comments = []; // Store detected comments
        this.generatedReplies = new Map(); // Store generated replies by comment index
        this.isBatchGenerating = false;
        this.batchCancelRequested = false;
        
        // Scan cancellation
        this.isScanning = false;
        this.scanCancelRequested = false;
        
        // Session fallback state (not persisted across browser restarts)
        this.sessionFallbackActive = false;  // Track if fallback is active for session
        this.fallbackReason = null;          // Store reason for fallback
        
        this.init();
    }
    
    async init() {
        await this.loadConfig();
        await this.loadPostData();
        await this.loadInviteSettings();
        this.setupEventListeners();
        await this.applyThemeFromSettings();
        // Open Reply tab by default if URL hash asks for it
        const wantsReply = (location.hash || '').toLowerCase().includes('reply');
        this.switchTab(wantsReply ? 'reply' : 'invite');
        this.updateActiveKeyDisplay();
        this.updateGenerateButton();
        this.updateScanButtons();
        this.updateInviteSettings();
        await this.initCollapsibleSections();
    }
    
    async loadConfig() {
        try {
            const result = await chrome.storage.sync.get(['aiConfig']);
            if (result.aiConfig) {
                this.aiConfig = result.aiConfig;
                
                // Migrate from old activeKeyId structure to new dual model structure
                if (this.aiConfig.activeKeyId && !this.aiConfig.primaryModelId) {
                    this.aiConfig.primaryModelId = this.aiConfig.activeKeyId;
                    this.aiConfig.secondaryModelId = null;
                    delete this.aiConfig.activeKeyId;
                    // Save the migrated config
                    await this.saveConfig();
                }
            } else {
                this.aiConfig = {
                    keys: [],
                    primaryModelId: null,
                    secondaryModelId: null,
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
            }
        } catch (error) {
            console.error('Error loading config:', error);
            this.showStatus('Error loading configuration', 'error');
        }
    }
    
    async saveConfig() {
        try {
            await chrome.storage.sync.set({ aiConfig: this.aiConfig });
            return true;
        } catch (error) {
            console.error('Error saving config:', error);
            this.showStatus('Error saving configuration', 'error');
            return false;
        }
    }
    
    async loadInviteSettings() {
        try {
            const result = await chrome.storage.sync.get([
                'p1_1', 'p1_2', 'fb_limit', 'stopWhen', 'fast_scan', 'fast_scan_loads',
                'ignoreScannedPosts', 'deleteInvitersLocal', 'skip_Invite', 'share_put_likes',
                'likeSharedComments', 'share_put_comments', 'inviteDuringShareCheck', 'inviteDuringShareCheck2'
            ]);
            
            this.inviteSettings = {
                pauseMin: result.p1_1 || 3,
                pauseMax: result.p1_2 || 5,
                inviteLimit: result.fb_limit || 490,
                stopWhen: result.stopWhen || 'run',
                fastScan: result.fast_scan || false,
                fastScanLoads: result.fast_scan_loads || 4,
                saveElaboratedPosts: result.ignoreScannedPosts || false,
                saveRam: result.deleteInvitersLocal || false,
                mainInviteOption: !result.skip_Invite,
                likeSharedPosts: result.share_put_likes || false,
                likeCommentsOnShared: result.likeSharedComments || false,
                inviteSharedLikers: result.share_put_comments || false,
                inviteCommentLikers: result.inviteDuringShareCheck || false
            };
        } catch (error) {
            console.error('Error loading invite settings:', error);
            // Set defaults if loading fails
            this.inviteSettings = {
                pauseMin: 3,
                pauseMax: 5,
                inviteLimit: 490,
                stopWhen: 'run',
                fastScan: false,
                fastScanLoads: 4,
                saveElaboratedPosts: false,
                saveRam: false,
                mainInviteOption: true,
                likeSharedPosts: false,
                likeCommentsOnShared: false,
                inviteSharedLikers: false,
                inviteCommentLikers: false
            };
        }
    }
    
    async saveInviteSettings() {
        if (!this.inviteSettings) return;
        
        try {
            const settings = {
                p1_1: this.inviteSettings.pauseMin,
                p1_2: this.inviteSettings.pauseMax,
                fb_limit: this.inviteSettings.inviteLimit,
                stopWhen: this.inviteSettings.stopWhen,
                fast_scan: this.inviteSettings.fastScan,
                fast_scan_loads: this.inviteSettings.fastScanLoads,
                ignoreScannedPosts: this.inviteSettings.saveElaboratedPosts,
                deleteInvitersLocal: this.inviteSettings.saveRam,
                skip_Invite: !this.inviteSettings.mainInviteOption,
                share_put_likes: this.inviteSettings.likeSharedPosts,
                likeSharedComments: this.inviteSettings.likeCommentsOnShared,
                share_put_comments: this.inviteSettings.inviteSharedLikers,
                inviteDuringShareCheck: this.inviteSettings.inviteCommentLikers
            };
            
            await chrome.storage.sync.set(settings);
            return true;
        } catch (error) {
            console.error('Error saving invite settings:', error);
            this.showStatus('Error saving invite settings', 'error');
            return false;
        }
    }
    
    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchTab(tab.dataset.tab);
            });
        });
        
        // Invite functionality
        document.getElementById('startInvite').addEventListener('click', () => {
            this.startInviteProcess();
        });
        
        // Invite settings event listeners
        document.getElementById('pauseMin').addEventListener('change', () => {
            this.inviteSettings.pauseMin = parseInt(document.getElementById('pauseMin').value);
            this.saveInviteSettings();
        });
        
        document.getElementById('pauseMax').addEventListener('change', () => {
            this.inviteSettings.pauseMax = parseInt(document.getElementById('pauseMax').value);
            this.saveInviteSettings();
        });
        
        document.getElementById('inviteLimit').addEventListener('change', () => {
            this.inviteSettings.inviteLimit = parseInt(document.getElementById('inviteLimit').value);
            this.saveInviteSettings();
        });
        
        document.getElementById('stopWhen').addEventListener('change', () => {
            this.inviteSettings.stopWhen = document.getElementById('stopWhen').value;
            this.saveInviteSettings();
        });
        
        document.getElementById('fastScan').addEventListener('change', () => {
            this.inviteSettings.fastScan = document.getElementById('fastScan').checked;
            this.saveInviteSettings();
        });
        
        document.getElementById('fastScanLoads').addEventListener('change', () => {
            this.inviteSettings.fastScanLoads = parseInt(document.getElementById('fastScanLoads').value);
            this.saveInviteSettings();
        });
        
        document.getElementById('saveElaboratedPosts').addEventListener('change', () => {
            this.inviteSettings.saveElaboratedPosts = document.getElementById('saveElaboratedPosts').checked;
            this.saveInviteSettings();
        });
        
        document.getElementById('saveRam').addEventListener('change', () => {
            this.inviteSettings.saveRam = document.getElementById('saveRam').checked;
            this.saveInviteSettings();
        });
        
        document.getElementById('mainInviteOption').addEventListener('change', () => {
            this.inviteSettings.mainInviteOption = document.getElementById('mainInviteOption').checked;
            this.saveInviteSettings();
        });
        
        document.getElementById('likeSharedPosts').addEventListener('change', () => {
            this.inviteSettings.likeSharedPosts = document.getElementById('likeSharedPosts').checked;
            this.saveInviteSettings();
        });
        
        document.getElementById('likeCommentsOnShared').addEventListener('change', () => {
            this.inviteSettings.likeCommentsOnShared = document.getElementById('likeCommentsOnShared').checked;
            this.saveInviteSettings();
        });
        
        document.getElementById('inviteSharedLikers').addEventListener('change', () => {
            this.inviteSettings.inviteSharedLikers = document.getElementById('inviteSharedLikers').checked;
            this.saveInviteSettings();
        });
        
        document.getElementById('inviteCommentLikers').addEventListener('change', () => {
            this.inviteSettings.inviteCommentLikers = document.getElementById('inviteCommentLikers').checked;
            this.saveInviteSettings();
        });
        
        document.getElementById('resetSavedPosts').addEventListener('click', (e) => {
            e.preventDefault();
            this.resetSavedPosts();
        });
        
        // Manual Reply functionality
        document.getElementById('savePostData').addEventListener('click', () => {
            this.savePostData();
        });
        
        document.getElementById('selectedComment').addEventListener('input', () => {
            this.updateGenerateButton();
        });
        
        document.getElementById('generateReply').addEventListener('click', () => {
            this.generateReply();
        });
        
        document.getElementById('clearComment').addEventListener('click', () => {
            this.clearComment();
        });
        
        // Smart Comment Detection
        document.getElementById('scanComments').addEventListener('click', () => {
            this.scanComments();
        });
        
        document.getElementById('refreshComments').addEventListener('click', () => {
            this.refreshComments();
        });
        
        // Stop scan button
        const stopScanBtn = document.getElementById('stopScanBtn');
        if (stopScanBtn) {
            stopScanBtn.addEventListener('click', () => {
                this.stopScan();
            });
        }

        // Batch Generation
        document.getElementById('generateAllBtn').addEventListener('click', () => {
            this.generateAllReplies();
        });

        document.getElementById('cancelBatchBtn').addEventListener('click', () => {
            this.cancelBatchGeneration();
        });

        // Bulk Actions
        document.getElementById('copyAllBtn').addEventListener('click', () => {
            this.copyAllReplies();
        });

        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportReplies();
        });

        document.getElementById('regenAllBtn').addEventListener('click', () => {
            this.regenerateAllReplies();
        });

        document.getElementById('clearAllBtn').addEventListener('click', () => {
            this.clearAllReplies();
        });

        // Listen for theme changes sent from settings (optional cross-page sync)
        chrome.storage.onChanged && chrome.storage.onChanged.addListener((changes, area) => {
            if (area === 'sync' && changes.uiTheme) {
                const isDark = changes.uiTheme.newValue === 'dark';
                document.body.dataset.theme = isDark ? 'dark' : '';
            }
        });

        // Collapsible sections
        document.addEventListener('click', (e) => {
            const header = e.target.closest('.section-header');
            if (header && header.dataset.toggle) {
                this.toggleSection(header.dataset.toggle);
            }
        });

        // Delegate clicks for Generate/Copy buttons in comments list
        const commentsList = document.getElementById('commentsList');
        if (commentsList) {
            commentsList.addEventListener('click', (e) => {
                const target = e.target.closest('button[data-action]');
                if (!target) return;
                const action = target.getAttribute('data-action');
                const idxStr = target.getAttribute('data-index');
                const idx = idxStr ? parseInt(idxStr, 10) : NaN;
                if (Number.isNaN(idx)) return;
                if (action === 'generate') {
                    this.generateReplyForComment(idx);
                } else if (action === 'copy') {
                    this.copyComment(idx);
                } else if (action === 'copy-reply') {
                    this.copyReplyForComment(idx);
                } else if (action === 'regenerate') {
                    this.regenerateReplyForComment(idx);
                } else if (action === 'edit') {
                    this.editReplyForComment(idx);
                }
            });
        }
        
        // Modal functionality
        document.getElementById('closeModal').addEventListener('click', () => {
            this.closeModal();
        });
        
        document.getElementById('regenerateReply').addEventListener('click', () => {
            this.regenerateReply();
        });
        
        document.getElementById('copyReply').addEventListener('click', () => {
            this.copyReply();
        });
        
        document.getElementById('cancelReply').addEventListener('click', () => {
            this.closeModal();
        });
        
        // Settings functionality (old addKeyBtn removed - now using inline onclick handlers)
        
        document.getElementById('saveKeyBtn').addEventListener('click', () => {
            this.saveNewKey();
        });
        
        document.getElementById('cancelKeyBtn').addEventListener('click', () => {
            this.hideAddKeyForm();
        });
        
        document.getElementById('keyProvider').addEventListener('change', () => {
            this.updateModelOptions();
        });
        
        document.getElementById('saveSettingsBtn').addEventListener('click', () => {
            this.saveDefaultSettings();
        });
        
        // Close modal when clicking outside
        document.getElementById('replyModal').addEventListener('click', (e) => {
            if (e.target.id === 'replyModal') {
                this.closeModal();
            }
        });
        
        // Model management event listeners
        document.getElementById('saveKeyBtn').addEventListener('click', () => {
            this.saveNewKey();
        });
        
        document.getElementById('cancelKeyBtn').addEventListener('click', () => {
            this.hideAddKeyForm();
        });
        
        // Event delegation for dynamically generated model card buttons
        document.addEventListener('click', (e) => {
            const target = e.target.closest('button, .switch-button');
            if (!target) return;
            
            const action = target.getAttribute('data-action');
            const slot = target.getAttribute('data-slot');
            
            if (action === 'add-model' && slot) {
                e.preventDefault();
                this.addModel(slot);
            } else if (action === 'edit-model' && slot) {
                e.preventDefault();
                this.editModel(slot);
            } else if (action === 'test-model' && slot) {
                e.preventDefault();
                this.testModel(slot);
            } else if (action === 'remove-model' && slot) {
                e.preventDefault();
                this.removeModel(slot);
            } else if (action === 'switch-models') {
                e.preventDefault();
                this.switchModels();
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
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
    
    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');
        
        this.currentTab = tabName;
        
        // Load tab-specific data
        if (tabName === 'reply') {
            this.updateActiveKeyDisplay();
            this.updateGenerateButton();
            this.updateScanButtons();
        } else if (tabName === 'settings') {
            this.renderModelCards();
        }
    }
    
    updateActiveKeyDisplay() {
        const statusEl = document.getElementById('replyStatus');
        
        if (!this.aiConfig || !this.aiConfig.primaryModelId) {
            statusEl.textContent = 'No active AI key configured';
            statusEl.className = 'status error';
            this.hideFallbackIndicator();
            return;
        }
        
        // Determine which model is currently active
        let activeKey;
        let isUsingFallback = false;
        
        if (this.sessionFallbackActive) {
            activeKey = this.aiConfig.keys.find(k => k.id === this.aiConfig.secondaryModelId);
            isUsingFallback = true;
        } else {
            activeKey = this.aiConfig.keys.find(k => k.id === this.aiConfig.primaryModelId);
        }
        
        if (activeKey) {
            const fallbackBadge = isUsingFallback ? ' (Using Backup)' : '';
            statusEl.textContent = `Active: ${activeKey.label} (${activeKey.provider})${fallbackBadge}`;
            statusEl.className = isUsingFallback ? 'status warning' : 'status success';
            
            // Show/hide fallback indicator
            if (isUsingFallback) {
                this.updateFallbackIndicator();
            } else {
                this.hideFallbackIndicator();
            }
        } else {
            statusEl.textContent = 'Invalid active key';
            statusEl.className = 'status error';
            this.hideFallbackIndicator();
        }
    }
    
    // Load saved post data on initialization
    async loadPostData() {
        try {
            const result = await chrome.storage.local.get(['postData']);
            if (result.postData) {
                this.postData = result.postData;
                // Restore the form values
                document.getElementById('postCaption').value = this.postData.caption || '';
                document.getElementById('postImage').value = this.postData.imageUrl || '';
            }
        } catch (error) {
            console.error('Error loading post data:', error);
        }
    }
    
    // Manual Reply Workflow Methods
    
    savePostData() {
        const caption = document.getElementById('postCaption').value.trim();
        const imageUrl = document.getElementById('postImage').value.trim();
        
        if (!caption) {
            this.showStatus('Please enter a post caption', 'error');
            return;
        }
        
        this.postData = {
            caption: caption,
            imageUrl: imageUrl,
            timestamp: Date.now()
        };
        
        // Reset fallback state for new post data
        this.sessionFallbackActive = false;
        this.fallbackReason = null;
        this.hideFallbackIndicator();
        this.updateActiveKeyDisplay();
        
        // Save to storage for persistence
        chrome.storage.local.set({ postData: this.postData });
        
        this.showStatus('Post data saved successfully!', 'success');
        this.updateGenerateButton();
        this.updateScanButtons();
    }
    
    updateGenerateButton() {
        const generateBtn = document.getElementById('generateReply');
        const commentText = document.getElementById('selectedComment').value.trim();
        const hasPostData = this.postData && this.postData.caption;
        const hasComment = commentText.length > 0;
        const hasActiveKey = this.aiConfig && this.aiConfig.primaryModelId;
        
        generateBtn.disabled = !(hasPostData && hasComment && hasActiveKey);
        
        if (!hasPostData) {
            generateBtn.title = 'Save post data first';
        } else if (!hasComment) {
            generateBtn.title = 'Enter comment text';
        } else if (!hasActiveKey) {
            generateBtn.title = 'Configure AI key in Settings';
        } else {
            generateBtn.title = 'Generate reply';
        }
    }
    
    async generateReply() {
        if (!this.postData || !this.postData.caption) {
            this.showStatus('Please save post data first', 'error');
            return;
        }
        
        const commentText = document.getElementById('selectedComment').value.trim();
        if (!commentText) {
            this.showStatus('Please enter comment text', 'error');
            return;
        }
        
        if (!this.aiConfig || !this.aiConfig.primaryModelId) {
            this.showStatus('No active AI key configured', 'error');
            return;
        }
        
        const activeKey = this.aiConfig.keys.find(k => k.id === this.aiConfig.primaryModelId);
        if (!activeKey) {
            this.showStatus('Invalid active key', 'error');
            return;
        }
        
        // Show modal with loading state
        this.showModal();
        document.getElementById('generatedReplyText').textContent = 'Generating reply...';
        
        try {
            // Use fallback system
            this.currentReply = await this.generateReplyWithFallback(commentText, activeKey);
            document.getElementById('generatedReplyText').textContent = this.currentReply;
            this.showStatus('Reply generated successfully!', 'success');
            
            // Auto-copy to clipboard for convenience
            try {
                await navigator.clipboard.writeText(this.currentReply);
                this.showStatus('Reply generated and copied to clipboard!', 'success');
            } catch (error) {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = this.currentReply;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                this.showStatus('Reply generated and copied to clipboard!', 'success');
            }
            
        } catch (error) {
            console.error('Generate reply error:', error);
            document.getElementById('generatedReplyText').textContent = `Error: ${error.message}`;
            this.showStatus('Failed to generate reply', 'error');
        }
    }
    
    async generateReplyWithFallback(commentText, activeKey) {
        // Check if we should use fallback model
        if (this.sessionFallbackActive) {
            const fallbackKey = this.aiConfig.keys.find(k => k.id === this.aiConfig.secondaryModelId);
            if (fallbackKey) {
                return await this.callAIWithModel(fallbackKey, commentText);
            }
        }
        
        try {
            // Try primary model first
            return await this.callAIWithModel(activeKey, commentText);
        } catch (error) {
            // Check if this error should trigger fallback
            if (this.shouldTriggerFallback(error)) {
                const fallbackKey = this.aiConfig.keys.find(k => k.id === this.aiConfig.secondaryModelId);
                
                if (fallbackKey) {
                    // Activate fallback for session
                    this.sessionFallbackActive = true;
                    this.fallbackReason = error.message;
                    
                    // Show fallback notification
                    this.showStatus('Primary model failed, switching to backup model...', 'warning');
                    
                    // Try secondary model
                    try {
                        const result = await this.callAIWithModel(fallbackKey, commentText);
                        this.showStatus(`Now using ${fallbackKey.label} for this session`, 'success');
                        this.updateFallbackIndicator();
                        this.updateActiveKeyDisplay(); // Update status display to show fallback state
                        return result;
                    } catch (fallbackError) {
                        // Both models failed - reset fallback state to prevent infinite retry
                        this.sessionFallbackActive = false;
                        this.fallbackReason = null;
                        this.hideFallbackIndicator();
                        this.updateActiveKeyDisplay();
                        this.showStatus('Both primary and backup models failed', 'error');
                        throw fallbackError;
                    }
                } else {
                    // No secondary model available
                    this.showStatus('Primary model failed and no backup model configured', 'error');
                    throw error;
                }
            } else {
                // Error doesn't warrant fallback, just throw it
                throw error;
            }
        }
    }
    
    async callAIWithModel(model, commentText) {
        // Validate postData is available
        if (!this.postData || !this.postData.caption) {
            throw new Error('Post data not available');
        }
        
        // Validate model parameter
        if (!model || !model.provider || !model.model || !model.apiKey) {
            throw new Error('Invalid model configuration');
        }
        
        // Build prompt
        const prompt = this.buildPrompt(this.postData.caption, commentText);
        
        // Prepare images array if image URL is provided
        let images = null;
        if (this.postData.imageUrl && model.vision) {
            try {
                // Convert image URL to base64
                const base64Image = await this.convertImageToBase64(this.postData.imageUrl);
                images = [base64Image];
            } catch (error) {
                console.warn('Failed to convert image to base64:', error);
                // Continue without image
            }
        }
        
        // Generate reply
        const response = await chrome.runtime.sendMessage({
            type: 'AI_GENERATE_REPLY',
            provider: model.provider,
            model: model.model,
            apiKey: model.apiKey,
            prompt: prompt,
            images: images
        });
        
        if (response && response.success) {
            return this.sanitizeReply(response.reply);
        } else {
            throw new Error(response?.error || 'Failed to generate reply');
        }
    }
    
    shouldTriggerFallback(error) {
        const errorMessage = (error?.message || error?.toString() || '').toLowerCase();
        
        // Errors that should trigger fallback
        const fallbackTriggers = [
            'invalid model',
            'model not found',
            'rate limit',
            'quota exceeded',
            'service unavailable',
            'timeout',
            'connection',
            'authentication',
            'unauthorized',
            'forbidden',
            'internal server error',
            'error 1500',
            'error 500',
            'error 400',
            'error 401',
            'error 403',
            'error 429',
            'error 503'
        ];
        
        return fallbackTriggers.some(trigger => errorMessage.includes(trigger));
    }
    
    updateFallbackIndicator() {
        const indicator = document.getElementById('fallbackIndicator');
        if (indicator) {
            indicator.classList.remove('hidden');
        }
    }
    
    hideFallbackIndicator() {
        const indicator = document.getElementById('fallbackIndicator');
        if (indicator) {
            indicator.classList.add('hidden');
        }
    }
    
    async regenerateReply() {
        if (!this.currentReply) {
            this.showStatus('No reply to regenerate', 'error');
            return;
        }
        
        // Clear current reply and regenerate
        this.currentReply = null;
        await this.generateReply();
    }
    
    async copyReply() {
        if (!this.currentReply) {
            this.showStatus('No reply to copy', 'error');
            return;
        }
        
        try {
            await navigator.clipboard.writeText(this.currentReply);
            this.showStatus('Reply copied to clipboard!', 'success');
        } catch (error) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = this.currentReply;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showStatus('Reply copied to clipboard!', 'success');
        }
    }
    
    clearComment() {
        document.getElementById('selectedComment').value = '';
        this.updateGenerateButton();
    }
    
    showModal() {
        document.getElementById('replyModal').classList.remove('hidden');
    }
    
    closeModal() {
        document.getElementById('replyModal').classList.add('hidden');
    }
    
    async convertImageToBase64(imageUrl) {
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            throw new Error('Failed to convert image to base64');
        }
    }
    
    buildPrompt(caption, commentText) {
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
            `POST: """${this.truncate(caption, 600)}"""`,
            `COMMENT: """${this.truncate(commentText, 400)}"""`,
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
    
    truncate(str, maxLength) {
        if (!str) return '';
        return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
    }
    
    // Smart Comment Detection Methods
    
    updateScanButtons() {
        const scanBtn = document.getElementById('scanComments');
        const refreshBtn = document.getElementById('refreshComments');
        const generateAllBtn = document.getElementById('generateAllBtn');
        const hasPostData = this.postData && this.postData.caption;
        const hasActiveKey = this.aiConfig && this.aiConfig.primaryModelId;
        
        const canScan = hasPostData && hasActiveKey;
        const canGenerateAll = canScan && this.comments.length > 0 && !this.isBatchGenerating;
        
        scanBtn.disabled = !canScan;
        refreshBtn.disabled = !canScan;
        generateAllBtn.disabled = !canGenerateAll;
        
        // Update comment count in Generate All button
        const commentCountSpan = document.getElementById('commentCount');
        if (commentCountSpan) {
            commentCountSpan.textContent = this.comments.length;
            console.log('Updated comment count to:', this.comments.length);
        }
        
        if (!hasPostData) {
            scanBtn.title = 'Save post data first';
            generateAllBtn.title = 'Save post data first';
        } else if (!hasActiveKey) {
            scanBtn.title = 'Configure AI key in Settings';
            generateAllBtn.title = 'Configure AI key in Settings';
        } else if (this.comments.length === 0) {
            scanBtn.title = 'Scan Facebook page for comments';
            generateAllBtn.title = 'Scan comments first';
        } else {
            scanBtn.title = 'Scan Facebook page for comments';
            generateAllBtn.title = `Generate replies for all ${this.comments.length} comments`;
        }
    }
    
    updateInviteSettings() {
        if (!this.inviteSettings) return;
        
        // Update form values from loaded settings
        document.getElementById('pauseMin').value = this.inviteSettings.pauseMin;
        document.getElementById('pauseMax').value = this.inviteSettings.pauseMax;
        document.getElementById('inviteLimit').value = this.inviteSettings.inviteLimit;
        document.getElementById('stopWhen').value = this.inviteSettings.stopWhen;
        document.getElementById('fastScan').checked = this.inviteSettings.fastScan;
        document.getElementById('fastScanLoads').value = this.inviteSettings.fastScanLoads;
        document.getElementById('saveElaboratedPosts').checked = this.inviteSettings.saveElaboratedPosts;
        document.getElementById('saveRam').checked = this.inviteSettings.saveRam;
        document.getElementById('mainInviteOption').checked = this.inviteSettings.mainInviteOption;
        document.getElementById('likeSharedPosts').checked = this.inviteSettings.likeSharedPosts;
        document.getElementById('likeCommentsOnShared').checked = this.inviteSettings.likeCommentsOnShared;
        document.getElementById('inviteSharedLikers').checked = this.inviteSettings.inviteSharedLikers;
        document.getElementById('inviteCommentLikers').checked = this.inviteSettings.inviteCommentLikers;
        
        // Update saved posts count
        this.updateSavedPostsCount();
    }
    
    async updateSavedPostsCount() {
        try {
            const result = await chrome.storage.local.get(['creatorStudioPostOpenedForScrollArray']);
            if (result.creatorStudioPostOpenedForScrollArray && result.creatorStudioPostOpenedForScrollArray[0]) {
                document.getElementById('savedPostsCount').textContent = result.creatorStudioPostOpenedForScrollArray[0].length;
            } else {
                document.getElementById('savedPostsCount').textContent = '0';
            }
        } catch (error) {
            console.error('Error updating saved posts count:', error);
            document.getElementById('savedPostsCount').textContent = '0';
        }
    }
    
    async resetSavedPosts() {
        try {
            await chrome.storage.local.remove(['creatorStudioPostOpenedForScrollArray']);
            document.getElementById('savedPostsCount').textContent = '0';
            this.showStatus('Saved posts list reset successfully!', 'success');
        } catch (error) {
            console.error('Error resetting saved posts:', error);
            this.showStatus('Error resetting saved posts', 'error');
        }
    }
    
    async scanComments() {
        if (!this.postData || !this.postData.caption) {
            this.showStatus('Please save post data first', 'error');
            return;
        }
        
        if (!this.aiConfig || !this.aiConfig.primaryModelId) {
            this.showStatus('No active AI key configured', 'error');
            return;
        }
        
        // Reset cancellation flag
        this.scanCancelRequested = false;
        this.isScanning = true;
        
        // Clear cancellation flag in storage
        try {
            await chrome.storage.local.set({ scanCancelled: false });
        } catch(e) {
            console.error('Error clearing cancellation flag:', e);
        }
        
        try {
            // Check if we're on Facebook
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab.url || !tab.url.includes('facebook.com')) {
                this.showStatus('Please navigate to a Facebook post first', 'error');
                this.isScanning = false;
                return;
            }
            
            this.showScanStatus('Initializing scanner...');
            this.showScanProgress && this.showScanProgress();
            
            // Check for cancellation before script injection
            if (this.scanCancelRequested) {
                this.hideScanStatus();
                this.hideScanProgress && this.hideScanProgress();
                this.isScanning = false;
                this.showStatus('Scan cancelled', 'info');
                return;
            }
            
            // Inject content script for comment detection
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['reply_content.js']
            });
            
            // Check for cancellation after script injection
            if (this.scanCancelRequested) {
                this.hideScanStatus();
                this.hideScanProgress && this.hideScanProgress();
                this.isScanning = false;
                this.showStatus('Scan cancelled', 'info');
                return;
            }
            
            // Determine target count from UI, default to 'all'
            const maxSel = document.getElementById('maxComments');
            const maxVal = (maxSel && maxSel.value) ? maxSel.value : 'all';
            const autoEl = document.getElementById('autoLoadMore');
            const autoLoad = autoEl ? (autoEl.checked !== false) : true;
            
            // Track comments found count
            let commentsFoundCount = 0;
            
            // Listen for progress updates during this scan
            const progressHandler = (message) => {
                if (message && message.type === 'SCAN_PROGRESS') {
                    const current = message.current || 0;
                    const target = message.total || 0;
                    
                    // Update comments found count
                    commentsFoundCount = current;
                    this.updateCommentsFoundText(commentsFoundCount, target);
                    
                    // Update progress if method exists
                    if (this.updateScanProgress) {
                        this.updateScanProgress(current, target);
                    }
                }
            };
            chrome.runtime.onMessage.addListener(progressHandler);
            
            // Request progressive scan (can exceed 25 by auto-loading)
            let response;
            try {
                // Check for cancellation before sending message
                if (this.scanCancelRequested) {
                    throw new Error('Scan cancelled by user');
                }
                
                response = await chrome.tabs.sendMessage(tab.id, {
                    type: 'SCAN_COMMENTS',
                    maxComments: maxVal,
                    autoLoad: autoLoad
                });
            } catch (e) {
                // If cancelled, don't fallback
                if (this.scanCancelRequested) {
                    throw new Error('Scan cancelled by user');
                }
                // Fallback to legacy minimal context if progressive not available
                response = await chrome.tabs.sendMessage(tab.id, { type: 'MSG_GET_CONTEXT' });
            } finally {
                // remove listener for this run
                chrome.runtime.onMessage.removeListener(progressHandler);
            }
            
            // Check for cancellation after receiving response
            // BUT first check if we have partial results to display
            const hasPartialResults = response && response.success && response.data && 
                                     response.data.comments && response.data.comments.length > 0;
            
            if (this.scanCancelRequested) {
                this.isScanning = false;
                if (hasPartialResults) {
                    // Display partial results even if cancelled
                    const comments = response.data.comments;
                    this.displayComments(comments);
                    this.updateScanButtons();
                    this.hideScanStatus();
                    this.hideScanProgress && this.hideScanProgress();
                    this.showStatus(`Scan stopped. Found ${comments.length} comments. You can generate replies now.`, 'info');
                } else {
                    this.hideScanStatus();
                    this.hideScanProgress && this.hideScanProgress();
                    this.showStatus('Scan cancelled', 'info');
                    this.displayNoComments();
                    this.updateScanButtons();
                }
                return;
            }
            
            // Check if response indicates cancellation
            if (response && response.error && response.error.includes('cancelled')) {
                this.isScanning = false;
                if (hasPartialResults) {
                    // Display partial results even if error indicates cancellation
                    const comments = response.data.comments;
                    this.displayComments(comments);
                    this.updateScanButtons();
                    this.hideScanStatus();
                    this.hideScanProgress && this.hideScanProgress();
                    this.showStatus(`Scan stopped. Found ${comments.length} comments. You can generate replies now.`, 'info');
                } else {
                    this.hideScanStatus();
                    this.hideScanProgress && this.hideScanProgress();
                    this.showStatus('Scan cancelled', 'info');
                    this.displayNoComments();
                    this.updateScanButtons();
                }
                return;
            }
            
            // Process successful response
            if (response && response.success && response.data && response.data.comments) {
                const comments = response.data.comments;
                const wasCancelled = response.data.cancelled === true;
                
                // ALWAYS display comments if they exist
                if (comments.length > 0) {
                    this.displayComments(comments);
                    this.updateScanButtons(); // Enable Generate button
                    
                    // Show final count before hiding
                    this.updateCommentsFoundText(comments.length, 0);
                    
                    if (wasCancelled) {
                        this.showScanStatus(`Scan stopped. Found ${comments.length} comments.`);
                        this.showStatus(`Scan stopped. Found ${comments.length} comments. You can generate replies now.`, 'info');
                    } else {
                        this.showScanStatus(`Scan complete! Found ${comments.length} comments.`);
                        this.showStatus(`Found ${this.comments.length} comments!`, 'success');
                    }
                    
                    // Hide after a moment
                    setTimeout(() => {
                        this.hideScanStatus();
                    }, 2000);
                } else {
                    // No comments found
                    this.hideScanStatus();
                    this.showStatus(wasCancelled ? 'Scan stopped - no comments found' : 'No comments found on this page', wasCancelled ? 'info' : 'error');
                    this.displayNoComments();
                }
                
                this.hideScanProgress && this.hideScanProgress();
                this.updateScanButtons(); // Always update buttons
            } else {
                // No response or no comments in response
                this.hideScanStatus();
                this.hideScanProgress && this.hideScanProgress();
                this.showStatus('No comments found on this page', 'error');
                this.displayNoComments();
                this.updateScanButtons();
            }
            
        } catch (error) {
            console.error('Scan comments error:', error);
            this.hideScanStatus();
            this.hideScanProgress && this.hideScanProgress();
            
            // Check if error is due to cancellation
            const isCancelled = this.scanCancelRequested || 
                               (error && error.message && error.message.includes('cancelled')) ||
                               (response && response.error && response.error.includes('cancelled'));
            
            // Check if we have partial results in the response
            if (response && response.success && response.data && response.data.comments && response.data.comments.length > 0) {
                const comments = response.data.comments;
                this.displayComments(comments);
                this.updateScanButtons();
                this.showStatus(`Scan stopped. Found ${comments.length} comments. You can generate replies now.`, 'info');
            } else if (isCancelled) {
                this.showStatus('Scan cancelled', 'info');
                this.displayNoComments();
            } else {
                this.showStatus('Error scanning comments: ' + (error?.message || 'Unknown error'), 'error');
                this.displayNoComments();
            }
            this.updateScanButtons();
        } finally {
            this.isScanning = false;
            // Clear cancellation flag
            try {
                await chrome.storage.local.set({ scanCancelled: false });
            } catch(e) {
                // Ignore
            }
        }
    }
    
    async stopScan() {
        if (this.isScanning) {
            this.scanCancelRequested = true;
            
            // Set cancellation flag in storage so content script can check it
            try {
                await chrome.storage.local.set({ 
                    scanCancelled: true 
                });
            } catch(e) {
                console.error('Error setting cancellation flag:', e);
            }
            
            // Also try to send a message to the content script if possible
            try {
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                if (tab && tab.id) {
                    chrome.tabs.sendMessage(tab.id, { 
                        type: 'CANCEL_SCAN' 
                    }).catch(() => {
                        // Content script might not be ready, that's okay
                    });
                }
            } catch(e) {
                // Tab might not be available, that's okay
            }
            
            this.hideScanStatus();
            this.hideScanProgress && this.hideScanProgress();
            this.isScanning = false;
            this.showStatus('Scan cancelled', 'info');
            this.updateScanButtons();
        }
    }
    
    async refreshComments() {
        await this.scanComments();
    }
    
    showScanStatus(message) {
        const statusEl = document.getElementById('scanStatus');
        const statusTextEl = document.getElementById('scanStatusText');
        const stopBtn = document.getElementById('stopScanBtn');
        if (statusEl) {
            statusEl.style.display = 'block';
            if (statusTextEl) {
                statusTextEl.textContent = message || 'Scanning for comments...';
            } else {
                statusEl.textContent = message || 'Scanning for comments...';
            }
            // Show stop button if scanning is in progress
            if (stopBtn) {
                if (this.isScanning) {
                    stopBtn.style.display = 'inline-block';
                } else {
                    stopBtn.style.display = 'none';
                }
            }
        }
        // Reset comments found count
        this.updateCommentsFoundText(0, 0);
    }
    
    hideScanStatus() {
        const statusEl = document.getElementById('scanStatus');
        const stopBtn = document.getElementById('stopScanBtn');
        if (statusEl) {
            statusEl.style.display = 'none';
        }
        if (stopBtn) {
            stopBtn.style.display = 'none';
        }
        // Clear comments found text
        this.updateCommentsFoundText(0, 0);
    }
    
    updateCommentsFoundText(current, target) {
        const commentsFoundEl = document.getElementById('commentsFoundText');
        if (commentsFoundEl) {
            if (current > 0) {
                if (target > 0) {
                    commentsFoundEl.textContent = `📊 ${current} / ${target} comments found`;
                } else {
                    commentsFoundEl.textContent = `📊 ${current} comments found`;
                }
                commentsFoundEl.style.display = 'inline';
            } else {
                commentsFoundEl.textContent = '';
                commentsFoundEl.style.display = 'none';
            }
        }
    }
    
    displayComments(comments) {
        const commentsList = document.getElementById('commentsList');
        
        if (!comments || comments.length === 0) {
            this.displayNoComments();
            return;
        }
        
        // Store comments for later use
        this.comments = comments;
        console.log('Comments stored:', this.comments.length, 'comments');
        
        const html = comments.map((comment, index) => {
            const generatedReply = this.generatedReplies.get(index);
            const hasReply = generatedReply && generatedReply.reply;
            const replyStatus = generatedReply ? generatedReply.status : 'pending';
            
            return `
                <div class="comment-card" data-comment-index="${index}">
                    <div class="card-header">
                        <div class="user-info">
                            <span class="user-icon">👤</span>
                            <span class="user-name">${this.escapeHtml(comment.user)}</span>
                            <span class="status-badge status-${replyStatus}">
                                ${replyStatus === 'completed' ? '✓ Ready' : 
                                  replyStatus === 'generating' ? '⏳ Generating' :
                                  replyStatus === 'error' ? '❌ Error' : '⏱ Pending'}
                            </span>
                        </div>
                        <div class="card-actions">
                            <button class="btn-icon" data-action="copy-reply" data-index="${index}" 
                                    title="Quick Copy Reply" ${!hasReply ? 'disabled' : ''}>
                                📋
                            </button>
                            <button class="btn-icon" data-action="regenerate" data-index="${index}" 
                                    title="Regenerate Reply" ${replyStatus === 'generating' ? 'disabled' : ''}>
                                🔄
                            </button>
                        </div>
                    </div>
                    
                    <div class="comment-section">
                        <div class="section-label">💬 Comment:</div>
                        <div class="comment-text">${this.escapeHtml(comment.text)}</div>
                    </div>
                    
                    <div class="reply-section reply-${replyStatus}">
                        <div class="section-label">
                            ${replyStatus === 'completed' ? '✅ AI Reply:' : 
                              replyStatus === 'generating' ? '⏳ Generating...' :
                              replyStatus === 'error' ? '❌ Failed to generate:' : '⏱ AI Reply:'}
                        </div>
                        <div class="reply-text" ${replyStatus === 'completed' ? 'contenteditable="true"' : ''}>
                            ${hasReply ? this.escapeHtml(generatedReply.reply) : 
                              replyStatus === 'generating' ? 'Generating reply...' :
                              replyStatus === 'error' ? `Error: ${generatedReply?.error || 'Unknown error'}` :
                              'Click Generate to create a reply'}
                        </div>
                        ${hasReply ? `
                            <div class="reply-meta">
                                <span class="char-count">${generatedReply.reply.length} characters</span>
                                <span class="timestamp">Generated ${this.formatTimestamp(generatedReply.timestamp)}</span>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="card-footer">
                        <button class="btn btn-primary btn-copy" data-action="copy-reply" data-index="${index}" 
                                ${!hasReply ? 'disabled' : ''}>
                            📋 Copy Reply
                        </button>
                        <button class="btn btn-secondary btn-edit" data-action="edit" data-index="${index}" 
                                ${!hasReply ? 'disabled' : ''}>
                            ✏️ Edit
                        </button>
                        <button class="btn btn-warning btn-regen" data-action="regenerate" data-index="${index}"
                                ${replyStatus === 'generating' ? 'disabled' : ''}>
                            🔄 Regenerate
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        commentsList.innerHTML = html;
        
        // Show bulk actions if we have comments
        this.updateBulkActions();
    }
    
    displayNoComments() {
        const commentsList = document.getElementById('commentsList');
        commentsList.innerHTML = `
            <div class="no-comments">
                <div class="status info">
                    <strong>No comments detected</strong><br>
                    Make sure you're on a Facebook post with comments, then try scanning again.
                </div>
            </div>
        `;
        this.comments = []; // Reset comments array for batch generation
        this.updateBulkActions(); // Hide bulk actions when no comments
    }
    
    async generateReplyForComment(commentIndex) {
        if (!this.comments || !this.comments[commentIndex]) {
            this.showStatus('Comment not found', 'error');
            return;
        }
        
        const comment = this.comments[commentIndex];
        const commentText = comment.text;
        
        // Set the comment text in the manual input field
        document.getElementById('selectedComment').value = commentText;
        
        // Generate reply
        await this.generateReply();
        
        // Update the comment item to show it was processed
        this.markCommentAsProcessed(commentIndex);
    }
    
    async     copyComment(commentIndex) {
        if (!this.comments || !this.comments[commentIndex]) {
            this.showStatus('Comment not found', 'error');
            return;
        }
        
        const comment = this.comments[commentIndex];
        
        try {
            await navigator.clipboard.writeText(comment.text);
            this.showStatus(`Comment from ${comment.user} copied to clipboard!`, 'success');
        } catch (error) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = comment.text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showStatus(`Comment from ${comment.user} copied to clipboard!`, 'success');
        }
    }
    
    markCommentAsProcessed(commentIndex) {
        const commentItem = document.querySelector(`[data-comment-index="${commentIndex}"]`);
        if (commentItem) {
            commentItem.classList.add('comment-generated');
            
            // Update the button to show it was processed
            const generateBtn = commentItem.querySelector('button');
            if (generateBtn) {
                generateBtn.textContent = '✅ Done';
                generateBtn.disabled = true;
            }
        }
    }
    
    // Keyboard Shortcuts
    handleKeyboardShortcuts(e) {
        // Only handle shortcuts when not typing in input fields
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        // Ctrl/Cmd + Enter: Generate reply (if in reply tab and conditions met)
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            if (this.currentTab === 'reply') {
                const generateBtn = document.getElementById('generateReply');
                if (!generateBtn.disabled) {
                    e.preventDefault();
                    this.generateReply();
                }
            }
        }
        
        // Ctrl/Cmd + S: Save post data
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            if (this.currentTab === 'reply') {
                e.preventDefault();
                this.savePostData();
            }
        }
        
        // Ctrl/Cmd + R: Refresh comments
        if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
            if (this.currentTab === 'reply') {
                e.preventDefault();
                this.refreshComments();
            }
        }
        
        // Escape: Close modal
        if (e.key === 'Escape') {
            const modal = document.getElementById('replyModal');
            if (!modal.classList.contains('hidden')) {
                this.closeModal();
            }
        }
        
        // Number keys 1-9: Generate reply for comment (if comments are visible)
        if (e.key >= '1' && e.key <= '9') {
            if (this.currentTab === 'reply' && this.comments) {
                const commentIndex = parseInt(e.key) - 1;
                if (commentIndex < this.comments.length) {
                    e.preventDefault();
                    this.generateReplyForComment(commentIndex);
                }
            }
        }
    }
    
    // Invite Process (keeping existing functionality)
    async startInviteProcess() {
        try {
            // Save current settings before starting
            await this.saveInviteSettings();
            
            this.showStatus('Starting invite process...', 'info');
            
            // Check if we're on Facebook
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab.url || !tab.url.includes('facebook.com')) {
                this.showStatus('Please navigate to Facebook first', 'error');
                return;
            }
            
            // Ensure script is injected (fallback if not already injected by icon click)
            try {
                await chrome.tabs.sendMessage(tab.id, {
                    type: 'startInviteProcess',
                    settings: this.inviteSettings
                });
            } catch (error) {
                // If message fails, script might not be injected, so inject it now
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['jquery-3.5.1.min.js', 'sendkeys.js', 'contentscript.js']
                });
                
                // Wait a bit for script to initialize, then send message
                setTimeout(async () => {
                    await chrome.tabs.sendMessage(tab.id, {
                        type: 'startInviteProcess',
                        settings: this.inviteSettings
                    });
                }, 100);
            }
            
            this.showStatus('Invite process started successfully', 'success');
            document.getElementById('inviteStatus').textContent = 'Invite process is running...';
            
        } catch (error) {
            console.error('Error starting invite process:', error);
            this.showStatus('Error starting invite process', 'error');
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
    
    // Settings functionality (keeping existing)
    renderModelCards() {
        const primaryModel = this.aiConfig.keys.find(k => k.id === this.aiConfig.primaryModelId);
        const secondaryModel = this.aiConfig.keys.find(k => k.id === this.aiConfig.secondaryModelId);
        
        // Render Primary Model Card
        this.renderModelCard('primary', primaryModel);
        
        // Render Secondary Model Card
        this.renderModelCard('secondary', secondaryModel);
        
        // Show/hide switch control
        const switchControl = document.getElementById('modelSwitchControl');
        if (primaryModel && secondaryModel) {
            switchControl.style.display = 'flex';
        } else {
            switchControl.style.display = 'none';
        }
    }
    
    renderModelCard(slot, model) {
        const cardContent = document.getElementById(`${slot}ModelContent`);
        const cardActions = document.getElementById(`${slot}ModelActions`);
        const statusIndicator = document.getElementById(`${slot}StatusIndicator`);
        const statusText = document.getElementById(`${slot}StatusText`);
        
        if (!model) {
            // Empty state
            cardContent.innerHTML = `
                <div class="empty-model">
                    <div class="empty-icon">${slot === 'primary' ? '🤖' : '🔄'}</div>
                    <div class="empty-text">No ${slot} model</div>
                    <button class="btn btn-primary btn-small" data-action="add-model" data-slot="${slot}">
                        ${slot === 'primary' ? 'Configure Primary Model' : 'Add Secondary Model'}
                    </button>
                </div>
            `;
            cardActions.style.display = 'none';
            statusIndicator.textContent = '●';
            statusIndicator.className = 'status-indicator';
            statusText.textContent = 'Not configured';
        } else {
            // Model configured
            cardContent.innerHTML = `
                <div class="model-info">
                    <div class="model-name">${model.label}</div>
                    <div class="model-provider">${model.provider} - ${model.model}</div>
                    <div class="model-features">
                        ${model.vision ? '<span class="feature-tag vision">Vision</span>' : ''}
                        <span class="feature-tag">${model.provider}</span>
                    </div>
                </div>
            `;
            cardActions.style.display = 'flex';
            statusIndicator.textContent = '●';
            statusIndicator.className = 'status-indicator';
            statusText.textContent = slot === 'primary' ? 'Active' : 'Standby';
            
            // Add provider-specific class to card
            const card = document.getElementById(`${slot}ModelCard`);
            card.className = `model-card ${slot} ${model.provider}`;
        }
    }
    
    // showAddKeyForm() - removed, now using addModel() function instead
    
    hideAddKeyForm() {
        document.getElementById('addKeyForm').classList.add('hidden');
        document.getElementById('addKeyForm').querySelector('form')?.reset();
        this.editingModelId = null;
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
                { value: 'mistral-large-2407', text: 'Mistral Large' },
                { value: 'open-mixtral-8x7b', text: 'Mistral Mixtral 8x7B' },
                { value: 'mistral-small-2409', text: 'Mistral Small' },
                { value: 'mistral-medium', text: 'Mistral Medium' },
                { value: 'mistral-tiny', text: 'Mistral Tiny' }
            ];
            models.forEach(model => {
                const option = document.createElement('option');
                option.value = model.value;
                option.textContent = model.text;
                modelSelect.appendChild(option);
            });
        }
    }
    
    async saveNewKey() {
        const label = document.getElementById('keyLabel').value.trim();
        const provider = document.getElementById('keyProvider').value;
        const model = document.getElementById('keyModel').value;
        const apiKey = document.getElementById('keyApiKey').value.trim();
        const vision = document.getElementById('keyVision').checked;
        const slot = document.getElementById('keySlot').value;
        
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
        
        if (!this.aiConfig.keys) {
            this.aiConfig.keys = [];
        }
        
        // Check if we're editing an existing key
        const isEditing = this.editingModelId;
        if (isEditing) {
            // Update existing key
            const keyIndex = this.aiConfig.keys.findIndex(k => k.id === this.editingModelId);
            if (keyIndex !== -1) {
                this.aiConfig.keys[keyIndex] = newKey;
                newKey.id = this.editingModelId; // Keep the same ID
            }
            this.editingModelId = null;
        } else {
            // Add new key
            this.aiConfig.keys.push(newKey);
        }
        
        // Assign to the specified slot
        if (slot === 'primary') {
            this.aiConfig.primaryModelId = newKey.id;
        } else if (slot === 'secondary') {
            this.aiConfig.secondaryModelId = newKey.id;
        }
        
        await this.saveConfig();
        this.renderModelCards();
        this.hideAddKeyForm();
        this.updateActiveKeyDisplay();
        this.showStatus(`${isEditing ? 'Updated' : 'Added'} key: ${label}`, 'success');
    }
    
    async deleteKey(keyId) {
        if (!confirm('Are you sure you want to delete this API key?')) {
            return;
        }
        
        const keyIndex = this.aiConfig.keys.findIndex(k => k.id === keyId);
        if (keyIndex === -1) return;
        
        const deletedKey = this.aiConfig.keys[keyIndex];
        this.aiConfig.keys.splice(keyIndex, 1);
        
        // If deleted key was primary, set another as primary
        if (this.aiConfig.primaryModelId === keyId) {
            this.aiConfig.primaryModelId = this.aiConfig.keys.length > 0 ? this.aiConfig.keys[0].id : null;
        }
        // If deleted key was secondary, clear secondary
        if (this.aiConfig.secondaryModelId === keyId) {
            this.aiConfig.secondaryModelId = null;
        }
        
        await this.saveConfig();
        this.renderKeysList();
        this.updateActiveKeyDisplay();
        this.showStatus(`Deleted key: ${deletedKey.label}`, 'success');
    }
    
    async saveDefaultSettings() {
        // Update defaults from form
        this.aiConfig.defaults = {
            tone: document.getElementById('defaultTone').value,
            language: 'auto',
            maxReplyLength: 220,
            safety: {
                noUrls: true,
                profanityFilter: true
            },
            limits: {
                minDelayMs: parseInt(document.getElementById('minDelay').value) * 1000,
                maxDelayMs: parseInt(document.getElementById('maxDelay').value) * 1000,
                dailyCap: parseInt(document.getElementById('dailyCap').value)
            },
            relevance: 'medium',
            replyOncePerUser: true
        };
        
        await this.saveConfig();
        this.showStatus('Settings saved successfully', 'success');
    }
    
    // Batch Generation Methods
    
    async generateAllReplies() {
        if (this.isBatchGenerating) {
            this.showStatus('Batch generation already in progress', 'warning');
            return;
        }
        
        if (!this.comments || this.comments.length === 0) {
            this.showStatus('No comments to process', 'error');
            return;
        }
        
        if (!this.postData || !this.postData.caption) {
            this.showStatus('Save post data first', 'error');
            return;
        }
        
        if (!this.aiConfig || !this.aiConfig.primaryModelId) {
            this.showStatus('Configure AI key in Settings', 'error');
            return;
        }
        
        this.isBatchGenerating = true;
        this.batchCancelRequested = false;
        
        // Show progress indicator
        this.showBatchProgress();
        this.updateScanButtons();
        
        // Determine which model to use (primary or fallback)
        let activeKey;
        if (this.sessionFallbackActive) {
            activeKey = this.aiConfig.keys.find(k => k.id === this.aiConfig.secondaryModelId);
            if (!activeKey) {
                this.showStatus('Fallback active but no secondary model configured', 'error');
                this.hideBatchProgress();
                this.isBatchGenerating = false;
                this.updateScanButtons();
                return;
            }
        } else {
            activeKey = this.aiConfig.keys.find(k => k.id === this.aiConfig.primaryModelId);
            if (!activeKey) {
                this.showStatus('Invalid active key', 'error');
                this.hideBatchProgress();
                this.isBatchGenerating = false;
                this.updateScanButtons();
                return;
            }
        }
        
        const totalComments = this.comments.length;
        let completed = 0;
        let errors = 0;
        
        // Process comments in parallel batches of 3 to respect rate limits
        const batchSize = 3;
        const batches = [];
        for (let i = 0; i < totalComments; i += batchSize) {
            batches.push(this.comments.slice(i, i + batchSize).map((comment, batchIndex) => ({
                comment,
                index: i + batchIndex
            })));
        }
        
        try {
            for (const batch of batches) {
                if (this.batchCancelRequested) break;
                
                // Process batch in parallel
                const batchPromises = batch.map(({ comment, index }) => 
                    this.generateReplyForCommentIndex(index, comment, activeKey)
                );
                
                const batchResults = await Promise.allSettled(batchPromises);
                
                // Update progress
                batchResults.forEach((result, batchIndex) => {
                    const commentIndex = batch[batchIndex].index;
                    if (result.status === 'fulfilled') {
                        completed++;
                        this.generatedReplies.set(commentIndex, {
                            reply: result.value,
                            status: 'completed',
                            timestamp: Date.now()
                        });
                    } else {
                        errors++;
                        this.generatedReplies.set(commentIndex, {
                            reply: null,
                            status: 'error',
                            error: result.reason?.message || 'Unknown error',
                            timestamp: Date.now()
                        });
                    }
                    
                    // Update progress
                    const progress = Math.round(((completed + errors) / totalComments) * 100);
                    this.updateBatchProgress(progress, completed + errors, totalComments);
                    
                    // Update individual comment card
                    this.updateCommentCard(commentIndex);
                });
                
                // Small delay between batches to respect rate limits
                if (!this.batchCancelRequested && batches.indexOf(batch) < batches.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            
            if (this.batchCancelRequested) {
                this.showStatus('Batch generation cancelled', 'warning');
            } else {
                this.showStatus(`Batch generation completed: ${completed} successful, ${errors} errors`, 
                    errors === 0 ? 'success' : 'warning');
            }
            
        } catch (error) {
            console.error('Batch generation error:', error);
            this.showStatus('Batch generation failed: ' + error.message, 'error');
        } finally {
            this.hideBatchProgress();
            this.isBatchGenerating = false;
            this.updateScanButtons();
            this.updateBulkActions();
        }
    }
    
    async generateReplyForCommentIndex(index, comment, activeKey) {
        // Mark as generating
        this.generatedReplies.set(index, {
            reply: null,
            status: 'generating',
            timestamp: Date.now()
        });
        this.updateCommentCard(index);
        
        try {
            // Use fallback system for batch generation
            return await this.generateReplyWithFallback(comment.text, activeKey);
        } catch (error) {
            console.error('Generate reply error:', error);
            throw error;
        }
    }
    
    cancelBatchGeneration() {
        this.batchCancelRequested = true;
        this.showStatus('Cancelling batch generation...', 'warning');
    }
    
    showBatchProgress() {
        const progressEl = document.getElementById('batchProgress');
        progressEl.classList.remove('hidden');
        this.updateBatchProgress(0, 0, this.comments.length);
    }
    
    hideBatchProgress() {
        const progressEl = document.getElementById('batchProgress');
        progressEl.classList.add('hidden');
    }
    
    updateBatchProgress(percent, completed, total) {
        const progressFill = document.getElementById('progressFill');
        const progressStatus = document.getElementById('progressStatus');
        const progressETA = document.getElementById('progressETA');
        
        if (progressFill) {
            progressFill.style.width = `${percent}%`;
        }
        
        if (progressStatus) {
            progressStatus.textContent = `Generating ${completed} of ${total} replies...`;
        }
        
        if (progressETA && completed > 0) {
            const remaining = total - completed;
            const avgTimePerReply = 3000; // 3 seconds average
            const etaSeconds = Math.round((remaining * avgTimePerReply) / 1000);
            progressETA.textContent = `Est. ${etaSeconds}s remaining`;
        }
    }
    
    updateCommentCard(index) {
        const card = document.querySelector(`[data-comment-index="${index}"]`);
        if (!card) return;
        
        const generatedReply = this.generatedReplies.get(index);
        const hasReply = generatedReply && generatedReply.reply;
        const replyStatus = generatedReply ? generatedReply.status : 'pending';
        
        // Update status badge
        const statusBadge = card.querySelector('.status-badge');
        if (statusBadge) {
            statusBadge.className = `status-badge status-${replyStatus}`;
            statusBadge.textContent = replyStatus === 'completed' ? '✓ Ready' : 
                                      replyStatus === 'generating' ? '⏳ Generating' :
                                      replyStatus === 'error' ? '❌ Error' : '⏱ Pending';
        }
        
        // Update reply section
        const replySection = card.querySelector('.reply-section');
        const replyText = card.querySelector('.reply-text');
        
        if (replySection && replyText) {
            replySection.className = `reply-section reply-${replyStatus}`;
            
            const sectionLabel = card.querySelector('.reply-section .section-label');
            if (sectionLabel) {
                sectionLabel.textContent = replyStatus === 'completed' ? '✅ AI Reply:' : 
                                          replyStatus === 'generating' ? '⏳ Generating...' :
                                          replyStatus === 'error' ? '❌ Failed to generate:' : '⏱ AI Reply:';
            }
            
            if (hasReply) {
                replyText.textContent = generatedReply.reply;
                replyText.setAttribute('contenteditable', 'true');
                
                // Update meta info
                const replyMeta = card.querySelector('.reply-meta');
                if (replyMeta) {
                    replyMeta.innerHTML = `
                        <span class="char-count">${generatedReply.reply.length} characters</span>
                        <span class="timestamp">Generated ${this.formatTimestamp(generatedReply.timestamp)}</span>
                    `;
                }
            } else if (replyStatus === 'generating') {
                replyText.textContent = 'Generating reply...';
                replyText.removeAttribute('contenteditable');
            } else if (replyStatus === 'error') {
                replyText.textContent = `Error: ${generatedReply?.error || 'Unknown error'}`;
                replyText.removeAttribute('contenteditable');
            } else {
                replyText.textContent = 'Click Generate to create a reply';
                replyText.removeAttribute('contenteditable');
            }
        }
        
        // Update buttons
        const buttons = card.querySelectorAll('[data-action]');
        buttons.forEach(btn => {
            if (btn.getAttribute('data-action') === 'copy-reply' || 
                btn.getAttribute('data-action') === 'edit') {
                btn.disabled = !hasReply;
            } else if (btn.getAttribute('data-action') === 'regenerate') {
                btn.disabled = replyStatus === 'generating';
            }
        });
    }
    
    updateBulkActions() {
        const bulkActions = document.getElementById('bulkActions');
        const hasReplies = this.generatedReplies.size > 0;
        
        if (hasReplies) {
            bulkActions.classList.remove('hidden');
        } else {
            bulkActions.classList.add('hidden');
        }
    }
    
    async copyAllReplies() {
        const replies = [];
        
        this.comments.forEach((comment, index) => {
            const generatedReply = this.generatedReplies.get(index);
            if (generatedReply && generatedReply.reply) {
                replies.push({
                    user: comment.user,
                    reply: generatedReply.reply
                });
            }
        });
        
        if (replies.length === 0) {
            this.showStatus('No replies to copy', 'warning');
            return;
        }
        
        const text = replies.map(({ user, reply }) => 
            `Reply to ${user}:\n${reply}\n`
        ).join('\n---\n\n');
        
        try {
            await navigator.clipboard.writeText(text);
            this.showStatus(`Copied ${replies.length} replies to clipboard`, 'success');
        } catch (error) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showStatus(`Copied ${replies.length} replies to clipboard`, 'success');
        }
    }
    
    exportReplies() {
        const replies = [];
        
        this.comments.forEach((comment, index) => {
            const generatedReply = this.generatedReplies.get(index);
            if (generatedReply && generatedReply.reply) {
                replies.push({
                    user: comment.user,
                    comment: comment.text,
                    reply: generatedReply.reply,
                    timestamp: new Date(generatedReply.timestamp).toLocaleString()
                });
            }
        });
        
        if (replies.length === 0) {
            this.showStatus('No replies to export', 'warning');
            return;
        }
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `facebook-replies-${timestamp}.txt`;
        
        let content = `Facebook Comment Replies\n`;
        content += `Generated: ${new Date().toLocaleString()}\n`;
        content += `Post: ${this.postData?.caption?.substring(0, 50)}...\n\n`;
        
        replies.forEach(({ user, comment, reply, timestamp }, index) => {
            content += `Comment #${index + 1} by ${user}:\n`;
            content += `${comment}\n\n`;
            content += `AI Reply:\n`;
            content += `${reply}\n\n`;
            content += `---\n\n`;
        });
        
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showStatus(`Exported ${replies.length} replies to ${filename}`, 'success');
    }
    
    async regenerateAllReplies() {
        if (this.isBatchGenerating) {
            this.showStatus('Batch generation already in progress', 'warning');
            return;
        }
        
        // Clear existing replies
        this.generatedReplies.clear();
        
        // Re-render comments
        this.displayComments(this.comments);
        
        // Start batch generation
        await this.generateAllReplies();
    }
    
    clearAllReplies() {
        this.generatedReplies.clear();
        this.displayComments(this.comments);
        this.showStatus('All replies cleared', 'success');
    }
    
    // Individual comment actions
    
    async copyReplyForComment(index) {
        const generatedReply = this.generatedReplies.get(index);
        if (!generatedReply || !generatedReply.reply) {
            this.showStatus('No reply to copy', 'warning');
            return;
        }
        
        try {
            await navigator.clipboard.writeText(generatedReply.reply);
            this.showStatus('Reply copied to clipboard', 'success');
        } catch (error) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = generatedReply.reply;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showStatus('Reply copied to clipboard', 'success');
        }
    }
    
    async regenerateReplyForComment(index) {
        const comment = this.comments[index];
        if (!comment) {
            this.showStatus('Comment not found', 'error');
            return;
        }
        
        const activeKey = this.aiConfig.keys.find(k => k.id === this.aiConfig.primaryModelId);
        if (!activeKey) {
            this.showStatus('Invalid active key', 'error');
            return;
        }
        
        try {
            const reply = await this.generateReplyForCommentIndex(index, comment, activeKey);
            this.generatedReplies.set(index, {
                reply: reply,
                status: 'completed',
                timestamp: Date.now()
            });
            this.updateCommentCard(index);
            this.showStatus('Reply regenerated successfully', 'success');
        } catch (error) {
            console.error('Regenerate reply error:', error);
            this.generatedReplies.set(index, {
                reply: null,
                status: 'error',
                error: error.message,
                timestamp: Date.now()
            });
            this.updateCommentCard(index);
            this.showStatus('Failed to regenerate reply: ' + error.message, 'error');
        }
    }
    
    editReplyForComment(index) {
        const card = document.querySelector(`[data-comment-index="${index}"]`);
        if (!card) return;
        
        const replyText = card.querySelector('.reply-text');
        if (!replyText) return;
        
        // Make editable
        replyText.setAttribute('contenteditable', 'true');
        replyText.focus();
        
        // Select all text
        const range = document.createRange();
        range.selectNodeContents(replyText);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        
        this.showStatus('Click outside to save changes', 'info');
    }
    
    // Utility methods
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    formatTimestamp(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        
        if (seconds < 60) {
            return `${seconds} seconds ago`;
        } else if (minutes < 60) {
            return `${minutes} minutes ago`;
        } else {
            return new Date(timestamp).toLocaleTimeString();
        }
    }
    
    // Collapsible Sections Management
    
    async initCollapsibleSections() {
        // Load saved section states from localStorage
        const savedStates = await this.loadSectionStates();
        
        // Apply saved states
        Object.entries(savedStates).forEach(([sectionId, isCollapsed]) => {
            this.setSectionState(sectionId, isCollapsed);
        });
    }
    
    toggleSection(sectionId) {
        const content = document.getElementById(sectionId);
        const header = document.querySelector(`[data-toggle="${sectionId}"]`);
        
        if (!content || !header) return;
        
        const isCurrentlyCollapsed = content.classList.contains('collapsed');
        const newState = !isCurrentlyCollapsed;
        
        this.setSectionState(sectionId, newState);
        this.saveSectionState(sectionId, newState);
    }
    
    setSectionState(sectionId, isCollapsed) {
        const content = document.getElementById(sectionId);
        const header = document.querySelector(`[data-toggle="${sectionId}"]`);
        const button = header?.querySelector('.collapse-btn');
        
        if (!content || !header || !button) return;
        
        if (isCollapsed) {
            content.classList.add('collapsed');
            header.classList.add('collapsed');
            button.textContent = '▶';
        } else {
            content.classList.remove('collapsed');
            header.classList.remove('collapsed');
            button.textContent = '▼';
        }
    }
    
    async loadSectionStates() {
        try {
            const result = await chrome.storage.local.get(['sectionStates']);
            return result.sectionStates || {};
        } catch (error) {
            console.warn('Failed to load section states:', error);
            return {};
        }
    }
    
    async saveSectionState(sectionId, isCollapsed) {
        try {
            const result = await chrome.storage.local.get(['sectionStates']);
            const sectionStates = result.sectionStates || {};
            sectionStates[sectionId] = isCollapsed;
            await chrome.storage.local.set({ sectionStates });
        } catch (error) {
            console.warn('Failed to save section state:', error);
        }
    }
    
    // Model Management Functions
    
    switchModels() {
        if (!this.aiConfig.primaryModelId || !this.aiConfig.secondaryModelId) {
            this.showStatus('Both primary and secondary models must be configured to switch', 'error');
            return;
        }
        
        // Reset fallback state when user manually switches
        this.sessionFallbackActive = false;
        this.fallbackReason = null;
        
        // Swap the models
        const temp = this.aiConfig.primaryModelId;
        this.aiConfig.primaryModelId = this.aiConfig.secondaryModelId;
        this.aiConfig.secondaryModelId = temp;
        
        // Save and re-render
        this.saveConfig();
        this.renderModelCards();
        this.updateActiveKeyDisplay();
        
        // Get model names for confirmation
        const primaryModel = this.aiConfig.keys.find(k => k.id === this.aiConfig.primaryModelId);
        const modelName = primaryModel ? primaryModel.label : 'Unknown';
        
        this.showStatus(`Switched to ${modelName} as primary model`, 'success');
    }
    
    addModel(slot) {
        document.getElementById('formTitle').textContent = `Configure ${slot === 'primary' ? 'Primary' : 'Secondary'} Model`;
        document.getElementById('keySlot').value = slot;
        document.getElementById('addKeyForm').classList.remove('hidden');
        document.getElementById('keyLabel').focus();
        this.updateModelOptions();
    }
    
    editModel(slot) {
        const modelId = slot === 'primary' ? this.aiConfig.primaryModelId : this.aiConfig.secondaryModelId;
        const model = this.aiConfig.keys.find(k => k.id === modelId);
        
        if (!model) {
            this.showStatus('Model not found', 'error');
            return;
        }
        
        // Pre-fill form with existing data
        document.getElementById('formTitle').textContent = `Edit ${slot === 'primary' ? 'Primary' : 'Secondary'} Model`;
        document.getElementById('keyLabel').value = model.label;
        document.getElementById('keyProvider').value = model.provider;
        document.getElementById('keyApiKey').value = model.apiKey;
        document.getElementById('keyVision').checked = model.vision;
        document.getElementById('keySlot').value = slot;
        
        // Update model options and set the correct model
        this.updateModelOptions();
        document.getElementById('keyModel').value = model.model;
        
        // Store the model ID being edited
        this.editingModelId = modelId;
        
        document.getElementById('addKeyForm').classList.remove('hidden');
        document.getElementById('keyLabel').focus();
    }
    
    async testModel(slot) {
        const modelId = slot === 'primary' ? this.aiConfig.primaryModelId : this.aiConfig.secondaryModelId;
        const model = this.aiConfig.keys.find(k => k.id === modelId);
        
        if (!model) {
            this.showStatus('Model not found', 'error');
            return;
        }
        
        // Update status indicator to show testing
        const statusIndicator = document.getElementById(`${slot}StatusIndicator`);
        const statusText = document.getElementById(`${slot}StatusText`);
        
        statusIndicator.className = 'status-indicator testing';
        statusText.textContent = 'Testing...';
        
        try {
            const response = await chrome.runtime.sendMessage({
                type: 'AI_TEST_CONNECTION',
                provider: model.provider,
                model: model.model,
                apiKey: model.apiKey
            });
            
            if (response.success) {
                statusIndicator.className = 'status-indicator connected';
                statusText.textContent = 'Connected';
                this.showStatus(`✅ ${model.label} connection successful`, 'success');
            } else {
                statusIndicator.className = 'status-indicator error';
                statusText.textContent = 'Error';
                this.showStatus(`❌ ${model.label} connection failed: ${response.error}`, 'error');
            }
        } catch (error) {
            statusIndicator.className = 'status-indicator error';
            statusText.textContent = 'Error';
            this.showStatus(`❌ ${model.label} connection test failed`, 'error');
        }
    }
    
    removeModel(slot) {
        const modelId = slot === 'primary' ? this.aiConfig.primaryModelId : this.aiConfig.secondaryModelId;
        const model = this.aiConfig.keys.find(k => k.id === modelId);
        
        if (!model) {
            this.showStatus('Model not found', 'error');
            return;
        }
        
        if (!confirm(`Are you sure you want to remove ${model.label} from the ${slot} slot?`)) {
            return;
        }
        
        // Clear the slot
        if (slot === 'primary') {
            this.aiConfig.primaryModelId = null;
        } else {
            this.aiConfig.secondaryModelId = null;
        }
        
        // Save and re-render
        this.saveConfig();
        this.renderModelCards();
        this.updateActiveKeyDisplay();
        
        this.showStatus(`Removed ${model.label} from ${slot} slot`, 'success');
    }
}

// Initialize popup controller when DOM is loaded
let popupController;
document.addEventListener('DOMContentLoaded', () => {
    popupController = new ManualReplyController();
    // If embedded via sidebar, remove fixed size restrictions by adding class to body
    if ((location.hash || '').toLowerCase().includes('embed')) {
        try {
            document.body.style.width = '100%';
            document.body.style.height = '100%';
            const container = document.querySelector('.container');
            if (container){
                container.style.height = '100%';
            }
        } catch (_) {}
    }
    // Expose to inline onclick handlers used in dynamically rendered comment list
    window.popupController = popupController;
});
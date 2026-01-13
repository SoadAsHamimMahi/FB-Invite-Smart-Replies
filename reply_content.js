// reply_content.js - Facebook content script for comment replies

class FacebookReplyExtractor {
    constructor() {
        // Updated selectors for current Facebook UI
        this.commentSelectors = [
            '[data-testid="UFI2Comment/root_depth_0"]', // Specific Facebook comment root
            '[data-pagelet="CommentsUnit"] [role="article"]', // Only articles within comments unit
            'div[data-testid*="UFI2Comment"]', // Any UFI2Comment element
            'li[data-testid*="comment"]', // Comments in lists
            'div[data-sigil*="comment"]' // Mobile/legacy structure
            // REMOVED: '[role="article"]' - too broad, matches posts too
            // REMOVED: '[data-testid="comment"]' - too generic
            // REMOVED: 'div[data-testid*="comment"]' - too broad, matches post comments count
            // REMOVED: '.comment' - too generic
            // REMOVED: '[role="article"] [data-testid*="comment"]' - still too broad
        ];
        
        this.replyButtonSelectors = [
            '[data-testid="UFI2Comment/reply_button"]',
            '[aria-label="Reply"]',
            '[data-testid="reply_button"]',
            'a[href*="comment_reply"]',
            'div[role="button"][aria-label*="Reply"]',
            'div[role="button"][aria-label*="reply"]',
            'a[role="button"][aria-label*="Reply"]',
            'span[role="button"][aria-label*="Reply"]'
        ];
        
        this.commentTextSelectors = [
            '[data-testid="UFI2Comment/body"]',
            '[data-testid="comment"] div[dir="auto"]',
            '[role="article"] div[dir="auto"]',
            'div[dir="auto"]',
            'div[data-testid*="comment"] div[dir="auto"]',
            '.comment div[dir="auto"]',
            'div[aria-label*="comment"] div[dir="auto"]'
        ];
        
        this.userNameSelectors = [
            '[data-testid="UFI2Comment/author_name"]',
            '[data-testid="UFI2Comment/root_depth_0"] strong a[role="link"]',
            '[data-testid="comment"] strong a',
            'a[role="link"] strong',
            'h3 a[role="link"]',
            'h4 a[role="link"]',
            'div[data-testid*="comment"] a[role="link"]',
            '.comment a[role="link"]',
            'span[dir="auto"] a[role="link"]',
            'a[href*="/user/"]',
            'a[href*="/people/"]',
            'a[aria-label*="profile"]'
        ];
        
        this.captionSelectors = [
            '[data-testid="post_message"]',
            '[data-testid="post_text"]',
            '[role="article"] div[data-testid*="post"] div[dir="auto"]',
            'div[data-testid*="post"] div[dir="auto"]'
        ];
        
        this.imageSelectors = [
            '[data-testid="post_image"] img',
            '[role="article"] img[src*="scontent"]',
            'img[src*="scontent"]',
            '[data-testid*="photo"] img'
        ];
        
        // Stop mechanism flags
        this.stopRequested = false; // In-memory flag for immediate synchronous checks
        
        this.setupMessageListener();
    }
    
    setupMessageListener() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            switch (message.type) {
                case 'MSG_GET_CONTEXT':
                    this.getPostContext().then(sendResponse);
                    return true; // Keep message channel open for async response
                    
                case 'MSG_POST_REPLY':
                    this.postReply(message.commentRef, message.text).then(sendResponse);
                    return true; // Keep message channel open for async response
                    
                case 'MSG_AUTO_SCROLL_REPLY':
                    this.autoScrollAndReply(message.comments, message.caption, message.images, message.activeKey);
                    sendResponse({ success: true });
                    return true;
                
                // Progressive scanning endpoint: can exceed 25 by auto-loading more
                case 'SCAN_COMMENTS':
                    (async () => {
                        const max = message?.maxComments || 'all';
                        const autoLoad = message?.autoLoad !== false;
                        const batchSize = message?.batchSize || null;
                        const batchNumber = message?.batchNumber || null;
                        try {
                            // Clear cancellation flags at start
                            this.stopRequested = false; // Clear in-memory flag
                            await chrome.storage.local.set({ scanCancelled: false });
                            const result = await this.scanCommentsWithLoading(max, autoLoad, batchSize, batchNumber);
                            sendResponse(result);
                        } catch (e) {
                            sendResponse({ success: false, error: e?.message || 'Scan failed' });
                        }
                    })();
                    return true;
                
                // Handle cancellation request
                case 'CANCEL_SCAN':
                    // Set in-memory flag immediately (synchronous)
                    this.stopRequested = true;
                    // Also set storage flag for async operations
                    (async () => {
                        try {
                            await chrome.storage.local.set({ scanCancelled: true });
                            sendResponse({ success: true });
                        } catch (e) {
                            sendResponse({ success: false, error: e?.message });
                        }
                    })();
                    return true;
                    
                default:
                    sendResponse({ success: false, error: 'Unknown message type' });
            }
        });
    }
    
    // Unified stop check - checks both in-memory flag and limit
    shouldStop(currentCount, limit) {
        // Check in-memory flag first (synchronous, immediate)
        if (this.stopRequested) {
            return true;
        }
        // Check limit
        if (limit !== null && currentCount >= limit) {
            return true;
        }
        return false;
    }
    
    // Check if scan has been cancelled (async, checks storage)
    async checkScanCancelled() {
        // First check in-memory flag (synchronous)
        if (this.stopRequested) {
            return true;
        }
        // Then check storage (async)
        try {
            const result = await chrome.storage.local.get(['scanCancelled']);
            // If storage says cancelled, also set in-memory flag
            if (result.scanCancelled === true) {
                this.stopRequested = true;
                return true;
            }
            return false;
        } catch (e) {
            return false;
        }
    }
    
    buildPrompt(caption, commentText) {
        return [
            `You are a helpful page admin assistant.`,
            `Write ONE short friendly reply. Be relevant to the POST and the COMMENT.`,
            `Do NOT include URLs, phone numbers, or emails.`,
            `Never use profanity or offensive language.`,
            `Use the commenter's language if clear; else English.`,
            `Hard limit: <= 220 characters.`,
            `POST: """${this.truncate(caption, 600)}"""`,
            `COMMENT: """${this.truncate(commentText, 400)}"""`,
            `Return only the reply sentence.`
        ].filter(Boolean).join("\n");
    }
    
    sanitizeReply(text) {
        if (!text) return text;
        
        // Remove URLs
        text = text.replace(/https?:\/\/\S+/g, '');
        text = text.replace(/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, '');
        
        return text.trim();
    }
    
    truncate(str, maxLength) {
        if (!str) return '';
        return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
    }
    
    async getPostContext() {
        try {
            const caption = await this.extractCaption();
            const images = await this.extractImages();
            const comments = await this.extractComments();
            
            return {
                success: true,
                data: {
                    caption,
                    images,
                    comments
                }
            };
        } catch (error) {
            console.error('Get post context error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    async extractCaption() {
        for (const selector of this.captionSelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim()) {
                return element.textContent.trim();
            }
        }
        
        // Fallback: look for any text content in the main post area
        const postArea = document.querySelector('[role="main"] [role="article"]');
        if (postArea) {
            const textElements = postArea.querySelectorAll('div[dir="auto"]');
            for (const elem of textElements) {
                const text = elem.textContent.trim();
                if (text.length > 20) { // Reasonable caption length
                    return text;
                }
            }
        }
        
        return '';
    }
    
    async extractImages() {
        const images = [];
        
        try {
            for (const selector of this.imageSelectors) {
                const imgElements = document.querySelectorAll(selector);
                
                for (let i = 0; i < Math.min(imgElements.length, 2); i++) {
                    const img = imgElements[i];
                    
                    // Skip very small images (likely icons)
                    if (img.naturalWidth < 100 || img.naturalHeight < 100) {
                        continue;
                    }
                    
                    try {
                        const base64 = await this.imageToBase64(img.src);
                        if (base64) {
                            images.push(base64);
                        }
                    } catch (error) {
                        console.warn('Failed to convert image to base64:', error);
                    }
                }
                
                if (images.length >= 2) break; // Limit to 2 images
            }
        } catch (error) {
            console.error('Image extraction error:', error);
        }
        
        return images;
    }
    
    async imageToBase64(imageUrl) {
        return new Promise((resolve) => {
            try {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                
                img.onload = () => {
                    try {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        
                        // Limit image size for performance
                        const maxSize = 800;
                        let { width, height } = img;
                        
                        if (width > height) {
                            height = (height * maxSize) / width;
                            width = maxSize;
                        } else {
                            width = (width * maxSize) / height;
                            height = maxSize;
                        }
                        
                        canvas.width = width;
                        canvas.height = height;
                        
                        ctx.drawImage(img, 0, 0, width, height);
                        const base64 = canvas.toDataURL('image/jpeg', 0.8);
                        resolve(base64);
                    } catch (error) {
                        console.warn('Canvas conversion error:', error);
                        resolve(null);
                    }
                };
                
                img.onerror = () => {
                    console.warn('Image load error for:', imageUrl);
                    resolve(null);
                };
                
                img.src = imageUrl;
            } catch (error) {
                console.warn('Image processing error:', error);
                resolve(null);
            }
        });
    }
    
    async extractComments(limit = null, skipScanned = false) {
        // Backward-compatible single-pass extraction without hard 25 cap
        // limit: stop after extracting N UNIQUE comments
        // skipScanned: skip elements marked with data-scanned="true"
        const comments = [];
        const uniqueKeys = new Set(); // Track unique comments during extraction to enforce limit properly
        
        try {
            await this.sleep(1000);
            
            // Check for stop before starting (async check for storage flag)
            if (await this.checkScanCancelled()) {
                this.log('Scan cancelled before extractComments started');
                return [];
            }
            
            const section = this.findCommentsSection();
            if (!section) {
                // #region agent log
                fetch('http://127.0.0.1:7246/ingest/cef55277-5c4d-4cd5-b8ac-436b6f9adce4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'reply_content.js:337',message:'extractComments: no section found - RETURNING EMPTY',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
                // #endregion
                this.log('No comments section found - not scanning entire page');
                return []; // CRITICAL: Don't fall back to scanning entire document
            }
            
            // #region agent log
            fetch('http://127.0.0.1:7246/ingest/cef55277-5c4d-4cd5-b8ac-436b6f9adce4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'reply_content.js:342',message:'extractComments: using section',data:{sectionTag:section.tagName,sectionText:section.textContent.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
            // #endregion
            
            // Get elements in order (top to bottom)
            const elements = this.findAllCommentElements(section);
            
            // #region agent log
            fetch('http://127.0.0.1:7246/ingest/cef55277-5c4d-4cd5-b8ac-436b6f9adce4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'reply_content.js:348',message:'extractComments: elements found',data:{elementCount:elements.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
            // #endregion
            
            for (const el of elements) {
                // Check shouldStop() BEFORE processing each element (synchronous, immediate)
                if (this.shouldStop(uniqueKeys.size, limit)) {
                    this.log(`Stop detected at ${uniqueKeys.size} comments (limit: ${limit}), returning partial results`);
                    break;
                }
                
                // Skip already scanned comments if requested
                if (skipScanned && el.dataset.scanned === 'true') {
                    continue;
                }
                
                try {
                    const c = await this.extractSingleComment(el);
                    // Skip if extractSingleComment returns null (metadata or invalid comment)
                    if (!c) {
                        continue;
                    }
                    if (c && c.user && c.text && c.text.length > 3) {
                        const k = `${c.user}_${(c.text||'').substring(0,50)}`;
                        
                        // Only add if it's unique
                        if (!uniqueKeys.has(k)) {
                            // Check shouldStop() again BEFORE adding (limit might be reached)
                            if (this.shouldStop(uniqueKeys.size, limit)) {
                                this.log(`Stop detected before adding comment ${uniqueKeys.size + 1}, limit: ${limit}`);
                                break;
                            }
                            
                            uniqueKeys.add(k);
                            comments.push(c);
                            // Mark as scanned
                            if (skipScanned) {
                                el.dataset.scanned = 'true';
                            }
                            
                            // Send progress update for each extracted comment
                            if (limit !== null) {
                                try {
                                    chrome.runtime.sendMessage({ 
                                        type: 'SCAN_PROGRESS', 
                                        current: uniqueKeys.size, 
                                        target: limit 
                                    });
                                } catch(_) {}
                            }
                            
                            // Check shouldStop() AFTER adding (in case stop was requested during extraction)
                            if (this.shouldStop(uniqueKeys.size, limit)) {
                                this.log(`Stop detected after adding comment ${uniqueKeys.size}, limit: ${limit}`);
                                break;
                            }
                        }
                        // If duplicate, skip it (don't mark as scanned to allow retry in next batch)
                    }
                } catch(_) {}
            }
            
            // Final deduplication (shouldn't be needed since we track during extraction, but safety check)
            const seen = new Set();
            const unique = [];
            for (const c of comments) {
                const k = `${c.user}_${(c.text||'').substring(0,50)}`;
                if (!seen.has(k)) { 
                    seen.add(k); 
                    unique.push(c); 
                }
            }
            
            // STRICT CAP: Never return more than limit
            if (limit !== null && unique.length > limit) {
                this.log(`Capping unique comments from ${unique.length} to ${limit}`);
                unique.splice(limit);
            }
            
            // Send final progress update
            if (limit !== null) {
                try {
                    chrome.runtime.sendMessage({ 
                        type: 'SCAN_PROGRESS', 
                        current: unique.length, 
                        target: limit 
                    });
                } catch(_) {}
            }
            
            return unique;
        } catch (e) {
            console.error('Comment extraction error:', e);
            return [];
        }
    }
    
    findCommentsSection() {
        // #region agent log
        fetch('http://127.0.0.1:7246/ingest/cef55277-5c4d-4cd5-b8ac-436b6f9adce4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'reply_content.js:450',message:'findCommentsSection: entry',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
        // #endregion
        
        // STRATEGY 1: Find the main post/article first, then look for comments within it
        // This is more reliable than looking for a specific comments container
        const postArticles = document.querySelectorAll('[role="article"]');
        
        // #region agent log
        fetch('http://127.0.0.1:7246/ingest/cef55277-5c4d-4cd5-b8ac-436b6f9adce4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'reply_content.js:456',message:'findCommentsSection: checking articles',data:{articleCount:postArticles.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
        // #endregion
        
        for (const article of postArticles) {
            // EXCLUDE extension's own UI elements
            const articleText = article.textContent || '';
            if (article.closest('#reply-container, .reply-container, [id*="reply"], [class*="reply-container"], #commentsList, .comments-list') ||
                (article.id && (article.id.includes('reply') || article.id.includes('extension'))) ||
                article.classList.contains('comment-card') ||
                article.classList.contains('comments-list') ||
                articleText.includes('Page Comments') ||
                articleText.includes('Group Comments') ||
                articleText.includes('Scan Comments') ||
                articleText.includes('Generate All Replies')) {
                continue; // Skip extension UI
            }
            
            // Look for comment indicators within this article
            // Comments typically have: reply buttons, user profile links, and text content
            const replyButtons = article.querySelectorAll('[data-testid*="reply"], [aria-label*="Reply"], [aria-label*="reply"], a[href*="comment"], button[aria-label*="Reply"]');
            const userLinks = article.querySelectorAll('a[href*="/user/"], a[href*="/people/"], a[role="link"][href*="/"]');
            const commentTexts = article.querySelectorAll('div[dir="auto"]');
            
            // #region agent log
            fetch('http://127.0.0.1:7246/ingest/cef55277-5c4d-4cd5-b8ac-436b6f9adce4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'reply_content.js:475',message:'findCommentsSection: article analysis',data:{replyButtonCount:replyButtons.length,userLinkCount:userLinks.length,commentTextCount:commentTexts.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
            // #endregion
            
            // If we find multiple reply buttons or user links, this article likely contains comments
            // Comments are usually below the post content, so look for elements after the post text
            if (replyButtons.length >= 1 || (userLinks.length >= 2 && commentTexts.length >= 2)) {
                // Try to find a more specific container within the article
                // Look for divs that contain multiple reply buttons or user links
                const potentialContainers = article.querySelectorAll('div, ul, section');
                
                for (const container of potentialContainers) {
                    const containerReplyButtons = container.querySelectorAll('[data-testid*="reply"], [aria-label*="Reply"], a[href*="comment"]');
                    const containerUserLinks = container.querySelectorAll('a[href*="/user/"], a[href*="/people/"]');
                    
                    // If this container has multiple reply buttons or user links, it's likely the comments section
                    if (containerReplyButtons.length >= 2 || (containerUserLinks.length >= 2 && container.textContent.trim().length > 50)) {
                        // #region agent log
                        fetch('http://127.0.0.1:7246/ingest/cef55277-5c4d-4cd5-b8ac-436b6f9adce4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'reply_content.js:488',message:'findCommentsSection: found container in article',data:{containerTag:container.tagName,replyButtonCount:containerReplyButtons.length,userLinkCount:containerUserLinks.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
                        // #endregion
                        console.log(`Found comments container within article with ${containerReplyButtons.length} reply buttons`);
                        return container;
                    }
                }
                
                // If no specific container found, return the article itself
                // #region agent log
                fetch('http://127.0.0.1:7246/ingest/cef55277-5c4d-4cd5-b8ac-436b6f9adce4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'reply_content.js:497',message:'findCommentsSection: found article',data:{replyButtonCount:replyButtons.length,userLinkCount:userLinks.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
                // #endregion
                console.log(`Found article with comments (${replyButtons.length} reply buttons, ${userLinks.length} user links)`);
                return article;
            }
        }
        
        // STRATEGY 2: Try Facebook-specific selectors (fallback)
        const selectors = [
            '[data-pagelet="CommentsUnit"]',
            '[data-testid="UFI2CommentsList"]',
            '[data-testid="UFI2CommentsListRoot"]',
            'div[data-testid*="UFI2Comment"]',
            '[data-sigil="comments"]'
        ];
        
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                // Check it's not extension UI
                const elementText = element.textContent || '';
                if (!elementText.includes('Page Comments') && 
                    !elementText.includes('Group Comments') &&
                    !element.closest('#reply-container, .reply-container, #commentsList')) {
                    // #region agent log
                    fetch('http://127.0.0.1:7246/ingest/cef55277-5c4d-4cd5-b8ac-436b6f9adce4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'reply_content.js:515',message:'findCommentsSection: found via selector',data:{selector:selector},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
                    // #endregion
                    return element;
                }
            }
        }
        
        // #region agent log
        fetch('http://127.0.0.1:7246/ingest/cef55277-5c4d-4cd5-b8ac-436b6f9adce4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'reply_content.js:523',message:'findCommentsSection: NOT FOUND',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
        // #endregion
        
        return null;
    }
    
    findAllCommentElements(container) {
        // #region agent log
        fetch('http://127.0.0.1:7246/ingest/cef55277-5c4d-4cd5-b8ac-436b6f9adce4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'reply_content.js:549',message:'findAllCommentElements: entry',data:{containerTag:container.tagName},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        
        const commentElements = [];
        
        // Exclude post header and extension UI
        const excludedElements = new Set();
        const postHeaders = container.querySelectorAll('[data-testid="post_message"], [data-testid="post_text"], [data-pagelet="PostHeader"]');
        postHeaders.forEach(header => {
            excludedElements.add(header);
            header.querySelectorAll('*').forEach(child => excludedElements.add(child));
        });
        
        // Exclude extension UI
        const extensionUI = container.querySelectorAll('#reply-container, .reply-container, #commentsList, .comments-list, .comment-card');
        extensionUI.forEach(el => {
            excludedElements.add(el);
            el.querySelectorAll('*').forEach(child => excludedElements.add(child));
        });
        
        // #region agent log
        fetch('http://127.0.0.1:7246/ingest/cef55277-5c4d-4cd5-b8ac-436b6f9adce4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'reply_content.js:567',message:'findAllCommentElements: excluded count',data:{excludedCount:excludedElements.size},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        
        // STRATEGY 1: Look for elements that have both a user link and reply button
        // This is the most reliable indicator of a comment
        const allDivs = container.querySelectorAll('div');
        
        // #region agent log
        fetch('http://127.0.0.1:7246/ingest/cef55277-5c4d-4cd5-b8ac-436b6f9adce4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'reply_content.js:572',message:'findAllCommentElements: scanning divs',data:{divCount:allDivs.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        
        for (const div of allDivs) {
            if (excludedElements.has(div)) continue;
            
            // Check if this div has comment-like structure
            const hasUserLink = div.querySelector('a[href*="/user/"], a[href*="/people/"], a[role="link"][href*="/"]') !== null;
            const hasReplyButton = div.querySelector('[data-testid*="reply"], [aria-label*="Reply"], a[href*="comment"]') !== null;
            const hasText = div.querySelector('div[dir="auto"]') !== null || (div.textContent && div.textContent.trim().length > 10);
            
            // If it has user link + (reply button OR text), it's likely a comment
            if (hasUserLink && (hasReplyButton || hasText)) {
                // Additional validation: make sure it's not just the post author
                const text = div.textContent || '';
                if (!text.includes('Published by') && 
                    !text.includes('Shared with') &&
                    !text.includes('Page Comments') &&
                    !text.includes('Group Comments') &&
                    text.trim().length > 20) {
                    commentElements.push(div);
                }
            }
        }
        
        // #region agent log
        fetch('http://127.0.0.1:7246/ingest/cef55277-5c4d-4cd5-b8ac-436b6f9adce4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'reply_content.js:595',message:'findAllCommentElements: found via structure',data:{count:commentElements.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        
        // STRATEGY 2: Try Facebook-specific selectors
        const fbSelectors = [
            '[data-testid*="UFI2Comment"]',
            '[data-testid*="UFIComment"]',
            'div[data-testid*="comment"]'
        ];
        
        for (const selector of fbSelectors) {
            const elements = container.querySelectorAll(selector);
            elements.forEach(el => {
                if (!excludedElements.has(el) && !el.closest('[data-testid="post_message"]')) {
                    if (!commentElements.includes(el)) {
                        commentElements.push(el);
                    }
                }
            });
        }
        
        // Remove duplicates
        const uniqueElements = [...new Set(commentElements)];
        
        // Filter out elements that are too small or don't contain valid comment text
        const filtered = uniqueElements.filter(el => {
            const text = el.textContent || '';
            return !this.isPostMetadata(text) && text.trim().length > 10 && text.trim().length < 2000;
        });
        
        // #region agent log
        fetch('http://127.0.0.1:7246/ingest/cef55277-5c4d-4cd5-b8ac-436b6f9adce4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'reply_content.js:620',message:'findAllCommentElements: final count',data:{uniqueCount:uniqueElements.length,filteredCount:filtered.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        
        // Sort elements by their position in the DOM (top to bottom) to ensure consistent order
        filtered.sort((a, b) => {
            const rectA = a.getBoundingClientRect();
            const rectB = b.getBoundingClientRect();
            // Sort by top position first, then by left position
            if (Math.abs(rectA.top - rectB.top) > 10) {
                return rectA.top - rectB.top;
            }
            return rectA.left - rectB.left;
        });
        
        return filtered;
    }

    // Progressive scanner that auto-loads more comments until target reached or stalled
    async scanCommentsWithLoading(maxComments, autoLoad, batchSize = null, batchNumber = null) {
        const all = [];
        const start = Date.now();
        const timeoutMs = 120000; // 2 minutes
        const target = (maxComments === 'all') ? Number.MAX_SAFE_INTEGER : parseInt(maxComments, 10) || Number.MAX_SAFE_INTEGER;
        let stagnant = 0;
        const maxStagnant = 3;
        
        // If batch mode, extract only one batch
        if (batchSize !== null && batchNumber !== null) {
            try {
                const batch = await this.extractCommentsBatch(batchSize, batchNumber);
                return {
                    success: true,
                    data: {
                        comments: batch.comments,
                        caption: await this.extractCaption(),
                        images: await this.extractImages(),
                        batchNumber: batch.batchNumber,
                        hasMore: batch.hasMore,
                        totalScanned: batch.totalScanned,
                        cancelled: batch.cancelled || false
                    }
                };
            } catch (e) {
                console.warn('Batch scan error:', e);
                // If cancelled and we have partial results, try to return them
                if (e.message && e.message.includes('cancelled')) {
                    // Check if we can get any comments that were already extracted
                    try {
                        const section = this.findCommentsSection();
                        if (section) {
                            const allElements = this.findAllCommentElements(section);
                            const scannedElements = allElements.filter(el => el.dataset.scanned === 'true');
                            if (scannedElements.length > 0) {
                                // Try to extract from already scanned elements
                                const partialComments = await this.extractComments(null, false);
                                if (partialComments.length > 0) {
                                    return {
                                        success: true,
                                        data: {
                                            comments: partialComments,
                                            caption: await this.extractCaption(),
                                            images: await this.extractImages(),
                                            cancelled: true
                                        }
                                    };
                                }
                            }
                        }
                    } catch(_) {
                        // Ignore errors in recovery attempt
                    }
                }
                return { success: false, error: e?.message || 'Batch scan failed' };
            }
        }
        
        // Legacy mode: scan all comments
        while (all.length < target && (Date.now() - start) < timeoutMs) {
            // Check shouldStop() (synchronous check)
            if (this.shouldStop(all.length, target)) {
                this.log(`Stop detected during legacy scan loop at ${all.length} comments`);
                break;
            }
            
            try {
                const pass = await this.extractComments();
                // merge
                const seen = new Set(all.map(c => `${c.user}_${(c.text||'').substring(0,50)}`));
                let added = 0;
                for (const c of pass) {
                    const k = `${c.user}_${(c.text||'').substring(0,50)}`;
                    if (!seen.has(k)) { seen.add(k); all.push(c); added++; }
                }
                // progress event
                try { chrome.runtime.sendMessage({ type: 'SCAN_PROGRESS', current: all.length, total: target }); } catch(_){ }
                if (all.length >= target) break;
                if (!autoLoad) break;
                stagnant = (added === 0) ? stagnant + 1 : 0;
                if (stagnant > maxStagnant) break;
                // try to click view more buttons
                this.clickLoadMoreButtonsOnce();
                // scroll to force load
                window.scrollBy(0, 600);
                await this.sleep(1500);
            } catch (e) {
                // If it's a cancellation error, break instead of throwing
                if (e.message && e.message.includes('cancelled')) {
                    this.log('Cancellation detected in legacy scan, breaking loop');
                    break;
                }
                console.warn('Progressive scan pass error:', e);
                break;
            }
        }
        return { success: true, data: { comments: all, caption: await this.extractCaption(), images: await this.extractImages() } };
    }
    
    // Extract a single batch of comments
    async extractCommentsBatch(batchSize, batchNumber) {
        const batchSizeNum = parseInt(batchSize, 10) || 100;
        const comments = [];
        let hasMore = false;
        
        try {
            const section = this.findCommentsSection();
            if (!section) {
                return {
                    comments: [],
                    batchNumber: batchNumber || 1,
                    hasMore: false,
                    totalScanned: 0
                };
            }
            
            // Aggressively load more comments before extracting
            // This only loads comments into DOM, doesn't extract or send progress
            // For first batch, click "View more comments" exactly 5 times, then wait for user to continue
            if (batchNumber === 1) {
                this.log('First batch: Clicking "View more comments" exactly 5 times...');
                for (let i = 0; i < 5; i++) {
                    // Check shouldStop() before each click (synchronous check)
                    if (this.shouldStop(comments.length, batchSizeNum)) {
                        this.log('Stop detected during initial loading, extracting available comments...');
                        // Try to extract whatever comments are available
                        try {
                            const availableComments = await this.extractComments(batchSizeNum, true);
                            if (availableComments.length > 0) {
                                this.log(`Found ${availableComments.length} comments before stop`);
                                // Return partial results
                                const seen = new Set();
                                const unique = [];
                                for (const c of availableComments) {
                                    const k = `${c.user}_${(c.text||'').substring(0,50)}`;
                                    if (!seen.has(k)) {
                                        seen.add(k);
                                        unique.push(c);
                                    }
                                }
                                return {
                                    comments: unique,
                                    batchNumber: batchNumber || 1,
                                    hasMore: false,
                                    totalScanned: unique.length,
                                    cancelled: true
                                };
                            }
                        } catch(_) {
                            // If extraction fails, return empty
                        }
                        // Return empty if stop detected and no comments found
                        return {
                            comments: [],
                            batchNumber: batchNumber || 1,
                            hasMore: false,
                            totalScanned: 0,
                            cancelled: true
                        };
                    }
                    
                    this.scrollCommentsSection(section);
                    const clicked = this.clickLoadMoreButtonsOnce(section);
                    window.scrollBy(0, 800);
                    await this.sleep(2000); // Wait for comments to load
                    if (clicked > 0) {
                        this.log(`Click ${i + 1}/5: Clicked ${clicked} "View more comments" button(s)`);
                    }
                }
                this.log('Finished clicking "View more comments" 5 times. Waiting for user to continue...');
                
                // Check shouldStop() before setting up continue wait
                if (this.shouldStop(comments.length, batchSizeNum)) {
                    this.log('Stop detected before continue wait, extracting available comments...');
                    try {
                        const availableComments = await this.extractComments(batchSizeNum, true);
                        if (availableComments.length > 0) {
                            const seen = new Set();
                            const unique = [];
                            for (const c of availableComments) {
                                const k = `${c.user}_${(c.text||'').substring(0,50)}`;
                                if (!seen.has(k)) {
                                    seen.add(k);
                                    unique.push(c);
                                }
                            }
                            return {
                                comments: unique,
                                batchNumber: batchNumber || 1,
                                hasMore: false,
                                totalScanned: unique.length,
                                cancelled: true
                            };
                        }
                    } catch(_) {}
                    return {
                        comments: [],
                        batchNumber: batchNumber || 1,
                        hasMore: false,
                        totalScanned: 0,
                        cancelled: true
                    };
                }
                
                // Clear any existing flags first
                try {
                    await chrome.storage.local.set({ 
                        continueScanning: false,
                        showContinueScanning: false
                    });
                } catch(_) {}
                
                // Set flag in storage to show "Continue scanning" button
                try {
                    await chrome.storage.local.set({ 
                        showContinueScanning: true,
                        continueScanningBatch: batchNumber
                    });
                    this.log('Set showContinueScanning flag in storage');
                } catch(e) {
                    this.log(`Error setting storage flag: ${e.message}`);
                }
                
                // Give storage a moment to propagate
                await this.sleep(300);
                
                // Wait for user to click "Continue scanning" button
                this.log('Waiting for user to click "Continue Scanning" button...');
                await this.waitForContinueScanning();
                
                // Check shouldStop() after waiting
                if (this.shouldStop(comments.length, batchSizeNum)) {
                    this.log('Stop detected after continue wait, extracting available comments...');
                    try {
                        const availableComments = await this.extractComments(batchSizeNum, true);
                        if (availableComments.length > 0) {
                            const seen = new Set();
                            const unique = [];
                            for (const c of availableComments) {
                                const k = `${c.user}_${(c.text||'').substring(0,50)}`;
                                if (!seen.has(k)) {
                                    seen.add(k);
                                    unique.push(c);
                                }
                            }
                            return {
                                comments: unique,
                                batchNumber: batchNumber || 1,
                                hasMore: false,
                                totalScanned: unique.length,
                                cancelled: true
                            };
                        }
                    } catch(_) {}
                    return {
                        comments: [],
                        batchNumber: batchNumber || 1,
                        hasMore: false,
                        totalScanned: 0,
                        cancelled: true
                    };
                }
                
                this.log('User clicked continue. Proceeding to extraction.');
                // Skip loadMoreComments for first batch since we already clicked 5 times
            } else {
                // For subsequent batches, check stop before loading
                if (this.shouldStop(comments.length, batchSizeNum)) {
                    this.log('Stop detected before loadMoreComments, returning partial results');
                    return {
                        comments: [],
                        batchNumber: batchNumber || 1,
                        hasMore: false,
                        totalScanned: 0,
                        cancelled: true
                    };
                }
                await this.loadMoreComments(section, batchSizeNum);
            }
            
            // Extract comments with limit, skipping already scanned ones
            // Progress updates are sent incrementally during extraction
            // extractComments() now tracks unique comments and stops at exact limit
            const batchComments = await this.extractComments(batchSizeNum, true);
            
            // Check shouldStop() after extraction
            if (this.shouldStop(batchComments.length, batchSizeNum)) {
                this.log(`Stop detected after extraction, returning ${batchComments.length} comments`);
                const seen = new Set();
                const unique = [];
                for (const c of batchComments) {
                    const k = `${c.user}_${(c.text||'').substring(0,50)}`;
                    if (!seen.has(k)) {
                        seen.add(k);
                        unique.push(c);
                    }
                }
                return {
                    comments: unique,
                    batchNumber: batchNumber || 1,
                    hasMore: false,
                    totalScanned: unique.length,
                    cancelled: true
                };
            }
            
            // STRICT LIMIT: Cap to exact batch size (shouldn't be needed, but safety)
            if (batchComments.length > batchSizeNum) {
                this.log(`WARNING: Comments exceeded limit (${batchComments.length} > ${batchSizeNum}), capping`);
                batchComments.splice(batchSizeNum);
            }
            
            comments.push(...batchComments);
            this.log(`Extracted ${batchComments.length} comments (target: ${batchSizeNum})`);
            
            // If we got fewer than requested, that's fine - we've extracted all available unique comments
            // Don't try to extract more as extractComments() already enforces the limit on unique comments
            
            // Check if there are more unscanned comments available
            const allElements = this.findAllCommentElements(section);
            const unscannedCount = allElements.filter(el => el.dataset.scanned !== 'true').length;
            hasMore = unscannedCount > 0;
            
            // Deduplicate within batch
            const seen = new Set();
            const unique = [];
            for (const c of comments) {
                const k = `${c.user}_${(c.text||'').substring(0,50)}`;
                if (!seen.has(k)) {
                    seen.add(k);
                    unique.push(c);
                }
            }
            
            // STRICT LIMIT: After deduplication, cap to exact batch size
            if (unique.length > batchSizeNum) {
                this.log(`After deduplication: ${unique.length} comments, capping to ${batchSizeNum}`);
                unique.splice(batchSizeNum);
            }
            
            this.log(`Final batch result: ${unique.length} unique comments (limit: ${batchSizeNum})`);
            
            // Calculate total scanned (approximate) - reuse section variable
            let totalScanned = 0;
            if (section) {
                const allElements = this.findAllCommentElements(section);
                totalScanned = allElements.filter(el => el.dataset.scanned === 'true').length;
            }
            
            return {
                comments: unique,
                batchNumber: batchNumber || 1,
                hasMore: hasMore,
                totalScanned: totalScanned
            };
        } catch (e) {
            console.error('Extract batch error:', e);
            
            // If cancelled, return partial results if we have any
            if (e.message && e.message.includes('cancelled') && comments.length > 0) {
                this.log(`Scan cancelled, returning ${comments.length} partial comments`);
                
                // Deduplicate partial results
                const seen = new Set();
                const unique = [];
                for (const c of comments) {
                    const k = `${c.user}_${(c.text||'').substring(0,50)}`;
                    if (!seen.has(k)) {
                        seen.add(k);
                        unique.push(c);
                    }
                }
                
                return {
                    comments: unique,
                    batchNumber: batchNumber || 1,
                    hasMore: false,
                    totalScanned: unique.length,
                    cancelled: true
                };
            }
            
            return {
                comments: [],
                batchNumber: batchNumber || 1,
                hasMore: false,
                totalScanned: 0
            };
        }
    }

    clickLoadMoreButtonsOnce(section = null) {
        let buttons;
        if (section) {
            // Look for buttons within the comments section first
            buttons = section.querySelectorAll('div[role="button"], a[role="button"], button, span[role="button"], a, div[tabindex]');
        } else {
            buttons = document.querySelectorAll('div[role="button"], a[role="button"], button, span[role="button"], a, div[tabindex]');
        }
        
        let clicked = 0;
        const clickedButtons = new Set();
        
        buttons.forEach(btn => {
            if (clickedButtons.has(btn)) return;
            
            const txt = (btn.textContent||'').toLowerCase().trim();
            const aria = (btn.getAttribute('aria-label')||'').toLowerCase();
            const dataTestId = (btn.getAttribute('data-testid')||'').toLowerCase();
            const href = (btn.getAttribute('href')||'').toLowerCase();
            
            // Facebook uses "View more comments" - prioritize this exact text
            const isViewMoreComments = (
                txt === 'view more comments' ||
                txt.includes('view more comments') ||
                (txt === 'view more' && (aria.includes('comment') || dataTestId.includes('comment'))) ||
                aria === 'view more comments' ||
                aria.includes('view more comments') ||
                dataTestId.includes('view_more_comments') ||
                dataTestId.includes('viewmore') ||
                href.includes('view_more_comments')
            ) && btn.offsetParent !== null;
            
            // Also check for other variations as fallback
            const isOtherMoreButton = (
                txt.includes('view previous') || 
                txt.includes('see more comments') ||
                txt.includes('show more comments') ||
                (aria.includes('more') && aria.includes('comment'))
            ) && btn.offsetParent !== null;
            
            if (isViewMoreComments || isOtherMoreButton) {
                try { 
                    // Scroll button into view first
                    btn.scrollIntoView({ behavior: 'auto', block: 'center' });
                    
                    btn.click(); 
                    clickedButtons.add(btn);
                    clicked++; 
                    
                    this.log(`Clicked "View more comments" button`);
                } catch(e) {
                    console.warn('Error clicking view more button:', e);
                }
            }
        });
        
        return clicked;
    }
    
    // Aggressively load more comments by scrolling and clicking buttons
    // NOTE: This function only loads comments, it does NOT send progress updates
    // Progress should only be sent when comments are actually extracted
    // Stops when targetCount unscanned comments are available
    async loadMoreComments(section, targetCount) {
        const maxAttempts = 15;
        let attempts = 0;
        let lastCount = 0;
        let stagnantCount = 0;
        
        while (attempts < maxAttempts && stagnantCount < 3) {
            // Check shouldStop() (synchronous check)
            if (this.shouldStop(0, null)) {
                this.log('Stop detected during loadMoreComments');
                break;
            }
            
            // Count current unscanned comments (for internal logic only, not for progress)
            const allElements = this.findAllCommentElements(section);
            const unscannedCount = allElements.filter(el => el.dataset.scanned !== 'true').length;
            
            // If we have enough unscanned comments available, stop immediately
            if (unscannedCount >= targetCount) {
                this.log(`Found ${unscannedCount} unscanned comments, stopping load (target: ${targetCount})`);
                break;
            }
            
            // Check if we're making progress
            if (unscannedCount === lastCount) {
                stagnantCount++;
            } else {
                stagnantCount = 0;
            }
            lastCount = unscannedCount;
            
            // Scroll within the comments section
            this.scrollCommentsSection(section);
            
            // Click all "View more" buttons within the comments section
            const clicked = this.clickLoadMoreButtonsOnce(section);
            
            // Also try scrolling the window
            window.scrollBy(0, 800);
            
            // Wait for comments to load
            await this.sleep(2000);
            
            // Re-check count after loading
            const newElements = this.findAllCommentElements(section);
            const newUnscannedCount = newElements.filter(el => el.dataset.scanned !== 'true').length;
            
            // If we've reached the target, stop immediately
            if (newUnscannedCount >= targetCount) {
                this.log(`Reached target of ${targetCount} unscanned comments, stopping`);
                break;
            }
            
            attempts++;
        }
        
        // Final check
        const finalElements = this.findAllCommentElements(section);
        const finalUnscannedCount = finalElements.filter(el => el.dataset.scanned !== 'true').length;
        this.log(`Load complete: ${finalUnscannedCount} unscanned comments available (target: ${targetCount})`);
    }
    
    // Scroll within the comments section to trigger lazy loading
    scrollCommentsSection(section) {
        try {
            // Strategy 1: Try to find scrollable containers with specific Facebook selectors
            const facebookScrollSelectors = [
                '[data-pagelet="CommentsUnit"]',
                '[data-testid="UFI2CommentsList"]',
                '[role="main"] [style*="overflow"]',
                'div[style*="max-height"]',
                'div[style*="overflow-y"]'
            ];
            
            for (const selector of facebookScrollSelectors) {
                const containers = section.querySelectorAll(selector);
                for (const container of containers) {
                    if (container.scrollHeight > container.clientHeight) {
                        // Scroll to bottom
                        container.scrollTop = container.scrollHeight;
                        // Also try smooth scroll
                        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
                    }
                }
            }
            
            // Strategy 2: Try to find any scrollable container within the comments section
            const scrollableContainers = section.querySelectorAll('[style*="overflow"], [style*="scroll"], [style*="max-height"]');
            
            for (const container of scrollableContainers) {
                if (container.scrollHeight > container.clientHeight) {
                    // Scroll to bottom of this container
                    container.scrollTop = container.scrollHeight;
                    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
                }
            }
            
            // Strategy 3: Scroll the section itself if it's scrollable
            if (section.scrollHeight > section.clientHeight) {
                section.scrollTop = section.scrollHeight;
                section.scrollTo({ top: section.scrollHeight, behavior: 'smooth' });
            }
            
            // Strategy 4: Scroll the last comment element into view (triggers lazy loading)
            const allComments = this.findAllCommentElements(section);
            if (allComments.length > 0) {
                const lastComment = allComments[allComments.length - 1];
                // Scroll into view with different options
                lastComment.scrollIntoView({ behavior: 'smooth', block: 'end' });
                // Also try instant scroll
                setTimeout(() => {
                    lastComment.scrollIntoView({ behavior: 'auto', block: 'end' });
                }, 100);
            }
            
            // Strategy 5: Scroll window to bring comments section into view
            const rect = section.getBoundingClientRect();
            if (rect.bottom > window.innerHeight) {
                window.scrollTo({
                    top: window.scrollY + rect.bottom - window.innerHeight + 200,
                    behavior: 'smooth'
                });
            }
        } catch (e) {
            console.warn('Error scrolling comments section:', e);
        }
    }
    
    log(message) {
        console.log(`[FB Reply Extractor] ${message}`);
    }
    
    // Wait for user to click "Continue scanning" button
    async waitForContinueScanning() {
        return new Promise((resolve) => {
            let checkCount = 0;
            const maxChecks = 600; // 5 minutes max wait (600 * 500ms)
            
            // Poll storage for continue flag
            const checkContinue = async () => {
                checkCount++;
                try {
                    // Check for cancellation first
                    const cancelResult = await chrome.storage.local.get(['scanCancelled']);
                    if (cancelResult.scanCancelled === true) {
                        this.log('Scan cancelled during waitForContinueScanning');
                        resolve(); // Resolve to exit, but cancellation will be checked after
                        return;
                    }
                    
                    const result = await chrome.storage.local.get(['continueScanning', 'showContinueScanning']);
                    
                    if (result.continueScanning === true) {
                        this.log('Continue scanning flag detected, proceeding...');
                        // Clear the flags
                        await chrome.storage.local.set({ 
                            continueScanning: false,
                            showContinueScanning: false
                        });
                        resolve();
                    } else if (checkCount >= maxChecks) {
                        this.log('Timeout waiting for continue, proceeding anyway...');
                        resolve();
                    } else {
                        // Check again in 500ms
                        setTimeout(checkContinue, 500);
                    }
                } catch(e) {
                    this.log(`Error checking storage: ${e.message}`);
                    // If storage fails, wait a bit and try again
                    if (checkCount < maxChecks) {
                        setTimeout(checkContinue, 500);
                    } else {
                        resolve();
                    }
                }
            };
            checkContinue();
        });
    }
    
    isPostMetadata(text) {
        // #region agent log
        fetch('http://127.0.0.1:7246/ingest/cef55277-5c4d-4cd5-b8ac-436b6f9adce4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'reply_content.js:1204',message:'isPostMetadata called',data:{text:text?text.substring(0,100):null,textLength:text?text.length:0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        
        if (!text || text.length < 5) {
            // #region agent log
            fetch('http://127.0.0.1:7246/ingest/cef55277-5c4d-4cd5-b8ac-436b6f9adce4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'reply_content.js:1207',message:'isPostMetadata: text too short',data:{text:text,length:text?text.length:0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
            // #endregion
            return true;
        }
        
        const textLower = text.toLowerCase();
        
        // Common Facebook post metadata patterns
        const metadataPatterns = [
            /^published by/i,
            /^shared with/i,
            /^visible to:/i,
            /^public$/i,
            /^friends$/i,
            /^only me$/i,
            /^\d+[hdwm]$/i, // Time patterns like "4d", "2h", "3w"
            /^·\s*\d+[hdwm]/i, // "· 4d"
            /\bverified\s+account\b/i, // "verified account" as a phrase (not just anywhere)
            /shared by/i,
            /^·\s*shared with/i,
            /^·\s*published by/i,
            /^·\s*visible to:/i,
            /^·\s*public$/i,
            /^·\s*friends$/i,
            /^·\s*\d+\s*(minute|hour|day|week|month)\s+ago/i, // "· 2 hours ago"
            /^·\s*·/i, // Multiple dots
            /^shared$/i,
            /^edited$/i,
            /^sponsored$/i,
            /^promoted$/i
        ];
        
        // Check for repetitive/spam text patterns (like "All messagesAll messagesAll messages")
        const repetitivePattern = /^(.{2,20})\1{3,}/i; // Same phrase repeated 4+ times
        if (repetitivePattern.test(text)) {
            // #region agent log
            fetch('http://127.0.0.1:7246/ingest/cef55277-5c4d-4cd5-b8ac-436b6f9adce4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'reply_content.js:1238',message:'isPostMetadata: repetitive pattern',data:{text:text.substring(0,100)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
            // #endregion
            return true;
        }
        
        // Check for UI spam patterns (repeated words like "MessengerMessengerMessenger")
        if (/(\w{3,})\1{2,}/i.test(text)) {
            // #region agent log
            fetch('http://127.0.0.1:7246/ingest/cef55277-5c4d-4cd5-b8ac-436b6f9adce4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'reply_content.js:1244',message:'isPostMetadata: UI spam pattern',data:{text:text.substring(0,100)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
            // #endregion
            return true;
        }
        
        // Check if text matches any metadata pattern
        for (const pattern of metadataPatterns) {
            if (pattern.test(text)) {
                // #region agent log
                fetch('http://127.0.0.1:7246/ingest/cef55277-5c4d-4cd5-b8ac-436b6f9adce4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'reply_content.js:1237',message:'isPostMetadata: pattern match',data:{text:text.substring(0,100),pattern:pattern.toString()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                // #endregion
                return true;
            }
        }
        
        // Check if text is mostly metadata (contains multiple metadata indicators)
        // Only check for specific phrases, not individual words that might appear in comments
        const metadataPhrases = [
            'published by',
            'shared with',
            'visible to',
            'verified account',
            'shared by'
        ];
        
        let metadataPhraseCount = 0;
        for (const phrase of metadataPhrases) {
            if (textLower.includes(phrase)) {
                metadataPhraseCount++;
            }
        }
        
        // If text contains 2+ metadata phrases and is short, it's likely metadata
        if (metadataPhraseCount >= 2 && text.length < 100) {
            // #region agent log
            fetch('http://127.0.0.1:7246/ingest/cef55277-5c4d-4cd5-b8ac-436b6f9adce4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'reply_content.js:1260',message:'isPostMetadata: multiple phrases',data:{text:text.substring(0,100),metadataPhraseCount:metadataPhraseCount,textLength:text.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
            // #endregion
            return true;
        }
        
        // Check if text is just timestamps and separators
        if (/^[\s·\dhdwm]+$/i.test(text.trim())) {
            // #region agent log
            fetch('http://127.0.0.1:7246/ingest/cef55277-5c4d-4cd5-b8ac-436b6f9adce4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'reply_content.js:1261',message:'isPostMetadata: timestamp only',data:{text:text},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
            // #endregion
            return true;
        }
        
        // #region agent log
        fetch('http://127.0.0.1:7246/ingest/cef55277-5c4d-4cd5-b8ac-436b6f9adce4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'reply_content.js:1265',message:'isPostMetadata: NOT metadata',data:{text:text.substring(0,100)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        return false;
    }
    
    looksLikeComment(element) {
        const text = element.textContent || '';
        const hasUser = this.findUserName(element) !== '';
        const hasReplyButton = this.findReplyButton(element) !== null;
        
        // #region agent log
        fetch('http://127.0.0.1:7246/ingest/cef55277-5c4d-4cd5-b8ac-436b6f9adce4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'reply_content.js:1204',message:'looksLikeComment: checking',data:{textLength:text.length,hasUser:hasUser,hasReplyButton:hasReplyButton,isMetadata:this.isPostMetadata(text)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        
        // Check if text is actually a comment (not metadata)
        if (this.isPostMetadata(text)) {
            // #region agent log
            fetch('http://127.0.0.1:7246/ingest/cef55277-5c4d-4cd5-b8ac-436b6f9adce4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'reply_content.js:1210',message:'looksLikeComment: rejected (metadata)',data:{text:text.substring(0,100)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
            // #endregion
            return false;
        }
        
        const hasText = text.trim().length > 10 && text.trim().length < 500;
        
        // Check if element has comment-like structure even without explicit user name
        // Look for common comment indicators: reply button, comment text area, timestamp patterns
        const hasCommentStructure = hasReplyButton || 
                                    element.querySelector('[data-testid*="comment"]') !== null ||
                                    element.querySelector('[data-testid*="UFI"]') !== null ||
                                    /^\d+[hdwm]$/i.test(text.trim()) || // Timestamp like "23m", "1h"
                                    element.querySelector('a[href*="/comment"]') !== null;
        
        // More lenient: if it has comment structure and valid text, accept it even without explicit user name
        // User name might be extracted later during extractSingleComment
        const result = (hasUser || hasCommentStructure) && hasText && (hasReplyButton || element.querySelector('[role="button"]'));
        
        // #region agent log
        fetch('http://127.0.0.1:7246/ingest/cef55277-5c4d-4cd5-b8ac-436b6f9adce4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'reply_content.js:1220',message:'looksLikeComment: result',data:{result:result,hasText:hasText,hasUser:hasUser,hasCommentStructure:hasCommentStructure},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        
        return result;
    }
    
    async extractSingleComment(commentElement) {
        // #region agent log
        fetch('http://127.0.0.1:7246/ingest/cef55277-5c4d-4cd5-b8ac-436b6f9adce4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'reply_content.js:1270',message:'extractSingleComment: entry',data:{elementTag:commentElement.tagName,elementClass:commentElement.className.substring(0,50)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        
        // Extract user name
        const user = this.findUserName(commentElement);
        
        // Extract comment text
        const text = this.findCommentText(commentElement);
        
        // #region agent log
        fetch('http://127.0.0.1:7246/ingest/cef55277-5c4d-4cd5-b8ac-436b6f9adce4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'reply_content.js:1278',message:'extractSingleComment: extracted',data:{user:user,text:text?text.substring(0,100):null,textLength:text?text.length:0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        
        // Validate that we have actual comment content (not metadata)
        if (!text || this.isPostMetadata(text)) {
            // #region agent log
            fetch('http://127.0.0.1:7246/ingest/cef55277-5c4d-4cd5-b8ac-436b6f9adce4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'reply_content.js:1282',message:'extractSingleComment: rejected (no text or metadata)',data:{text:text,isMetadata:text?this.isPostMetadata(text):null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
            // #endregion
            return null; // Return null to skip this element
        }
        
        // Additional validation: ensure text doesn't look like post header
        if (text.includes('Published by') || text.includes('Shared with') || text.includes('Visible to')) {
            // #region agent log
            fetch('http://127.0.0.1:7246/ingest/cef55277-5c4d-4cd5-b8ac-436b6f9adce4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'reply_content.js:1287',message:'extractSingleComment: rejected (post header pattern)',data:{text:text.substring(0,100)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
            // #endregion
            return null;
        }
        
        // Generate a unique reference for this comment
        const refId = `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Store reference to the comment element
        commentElement.dataset.replyRefId = refId;
        
        // #region agent log
        fetch('http://127.0.0.1:7246/ingest/cef55277-5c4d-4cd5-b8ac-436b6f9adce4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'reply_content.js:1297',message:'extractSingleComment: success',data:{user:user,text:text.substring(0,100),refId:refId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        
        return {
            user,
            text,
            refId,
            element: commentElement
        };
    }
    
    findUserName(commentElement) {
        // #region agent log
        fetch('http://127.0.0.1:7246/ingest/cef55277-5c4d-4cd5-b8ac-436b6f9adce4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'reply_content.js:1292',message:'findUserName: entry',data:{elementTag:commentElement.tagName},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
        // #endregion
        
        // Try multiple strategies to find the user name
        for (const selector of this.userNameSelectors) {
            const userEl = commentElement.querySelector(selector);
            if (userEl && userEl.textContent.trim()) {
                const userName = userEl.textContent.trim();
                if (userName.length > 0 && userName.length < 100) {
                    // #region agent log
                    fetch('http://127.0.0.1:7246/ingest/cef55277-5c4d-4cd5-b8ac-436b6f9adce4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'reply_content.js:1300',message:'findUserName: found via selector',data:{selector:selector,userName:userName},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
                    // #endregion
                    return userName;
                }
            }
        }
        
        // Fallback: look for any link or strong element that might be a username
        const potentialUsers = commentElement.querySelectorAll('a[role="link"], strong, h3, h4, span[dir="auto"], a[href*="/user/"], a[href*="/people/"]');
        // #region agent log
        fetch('http://127.0.0.1:7246/ingest/cef55277-5c4d-4cd5-b8ac-436b6f9adce4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'reply_content.js:1308',message:'findUserName: fallback search',data:{potentialUserCount:potentialUsers.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
        // #endregion
        
        for (const el of potentialUsers) {
            const text = el.textContent.trim();
            // Allow names with spaces (like "Alexandra Touris") but limit length
            if (text.length > 0 && text.length < 50 && text.split(' ').length <= 3 && !text.includes('\n')) {
                // Skip if it looks like metadata or UI text
                if (this.isPostMetadata(text)) {
                    continue;
                }
                // #region agent log
                fetch('http://127.0.0.1:7246/ingest/cef55277-5c4d-4cd5-b8ac-436b6f9adce4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'reply_content.js:1316',message:'findUserName: found via fallback',data:{userName:text},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
                // #endregion
                return text;
            }
        }
        
        // Last resort: try to extract name from text content (look for capitalized name patterns)
        const allText = commentElement.textContent || '';
        // Look for patterns like "Alexandra Touris" or "Giuseppe Durso" (capitalized words, 2-3 words)
        const namePattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})\b/;
        const nameMatch = allText.match(namePattern);
        if (nameMatch && nameMatch[1]) {
            const potentialName = nameMatch[1].trim();
            // Validate it's not metadata
            if (!this.isPostMetadata(potentialName) && potentialName.length > 3 && potentialName.length < 50) {
                // #region agent log
                fetch('http://127.0.0.1:7246/ingest/cef55277-5c4d-4cd5-b8ac-436b6f9adce4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'reply_content.js:1328',message:'findUserName: found via pattern',data:{userName:potentialName},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
                // #endregion
                return potentialName;
            }
        }
        
        // #region agent log
        fetch('http://127.0.0.1:7246/ingest/cef55277-5c4d-4cd5-b8ac-436b6f9adce4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'reply_content.js:1335',message:'findUserName: NOT FOUND',data:{elementText:commentElement.textContent.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
        // #endregion
        
        return '';
    }
    
    findCommentText(commentElement) {
        // #region agent log
        fetch('http://127.0.0.1:7246/ingest/cef55277-5c4d-4cd5-b8ac-436b6f9adce4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'reply_content.js:1306',message:'findCommentText: entry',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        
        // Try multiple strategies to find comment text
        for (const selector of this.commentTextSelectors) {
            const textEl = commentElement.querySelector(selector);
            if (textEl && textEl.textContent.trim()) {
                const text = textEl.textContent.trim();
                
                // #region agent log
                fetch('http://127.0.0.1:7246/ingest/cef55277-5c4d-4cd5-b8ac-436b6f9adce4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'reply_content.js:1314',message:'findCommentText: found text',data:{selector:selector,text:text.substring(0,100),textLength:text.length,isMetadata:this.isPostMetadata(text)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
                // #endregion
                
                // Filter out post metadata
                if (this.isPostMetadata(text)) {
                    // #region agent log
                    fetch('http://127.0.0.1:7246/ingest/cef55277-5c4d-4cd5-b8ac-436b6f9adce4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'reply_content.js:1319',message:'findCommentText: skipped (metadata)',data:{text:text.substring(0,100)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
                    // #endregion
                    continue; // Skip this element, try next
                }
                
                if (text.length > 5) {
                    // #region agent log
                    fetch('http://127.0.0.1:7246/ingest/cef55277-5c4d-4cd5-b8ac-436b6f9adce4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'reply_content.js:1324',message:'findCommentText: returning text',data:{text:text.substring(0,100)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
                    // #endregion
                    return text;
                }
            }
        }
        
        // Fallback: look for any div with dir="auto" that contains substantial text
        const textElements = commentElement.querySelectorAll('div[dir="auto"], span[dir="auto"]');
        // #region agent log
        fetch('http://127.0.0.1:7246/ingest/cef55277-5c4d-4cd5-b8ac-436b6f9adce4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'reply_content.js:1329',message:'findCommentText: fallback search',data:{textElementCount:textElements.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        
        for (const el of textElements) {
            const text = el.textContent.trim();
            
            // Filter out post metadata
            if (this.isPostMetadata(text)) {
                continue;
            }
            
            if (text.length > 10 && text.length < 500) {
                return text;
            }
        }
        
        // Last resort: get all text content and clean it up
        const allText = commentElement.textContent || '';
        const lines = allText.split('\n').map(line => line.trim()).filter(line => {
            // Filter out metadata lines
            return line.length > 0 && !this.isPostMetadata(line);
        });
        
        // Find the longest line that's not metadata (usually the comment text)
        let longestLine = '';
        for (const line of lines) {
            if (line.length > longestLine.length && line.length < 500 && !this.isPostMetadata(line)) {
                longestLine = line;
            }
        }
        
        // #region agent log
        fetch('http://127.0.0.1:7246/ingest/cef55277-5c4d-4cd5-b8ac-436b6f9adce4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'reply_content.js:1350',message:'findCommentText: final result',data:{longestLine:longestLine.substring(0,100),longestLineLength:longestLine.length,filteredLinesCount:lines.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        
        return longestLine;
    }
    
    findReplyButton(commentElement) {
        // Try multiple strategies to find the reply button
        for (const selector of this.replyButtonSelectors) {
            const button = commentElement.querySelector(selector);
            if (button && button.offsetParent !== null) { // Check if visible
                return button;
            }
        }
        
        // Fallback: look for any clickable element with "reply" text
        const buttons = commentElement.querySelectorAll('a, button, div[role="button"], span[role="button"]');
        for (const button of buttons) {
            const text = button.textContent.toLowerCase();
            const ariaLabel = button.getAttribute('aria-label')?.toLowerCase() || '';
            if ((text.includes('reply') || ariaLabel.includes('reply')) && button.offsetParent !== null) {
                return button;
            }
        }
        
        return null;
    }
    
    async postReply(commentRef, replyText) {
        try {
            console.log(`Starting to post reply for comment: ${commentRef}`);
            
            // Find the comment element by reference
            const commentElement = document.querySelector(`[data-reply-ref-id="${commentRef}"]`);
            if (!commentElement) {
                throw new Error('Comment element not found');
            }
            
            // Scroll the comment into view
            commentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await this.sleep(1000);
            
            // Find and click reply button
            const replyButton = this.findReplyButton(commentElement);
            if (!replyButton) {
                throw new Error('Reply button not found');
            }
            
            console.log('Clicking reply button...');
            await this.clickElement(replyButton);
            await this.sleep(1500);
            
            // Find the reply input field
            const replyInput = await this.findReplyInput();
            if (!replyInput) {
                throw new Error('Reply input field not found');
            }
            
            console.log('Found reply input, typing text...');
            
            // Focus and type the reply
            replyInput.focus();
            await this.sleep(500);
            
            // Clear any existing text
            replyInput.textContent = '';
            replyInput.innerHTML = '';
            
            // Type the reply text
            await this.typeText(replyInput, replyText);
            await this.sleep(1000);
            
            // Submit the reply
            console.log('Submitting reply...');
            await this.submitReply();
            
            console.log('Reply posted successfully');
            return { success: true };
            
        } catch (error) {
            console.error('Post reply error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    async scrollToNextComment() {
        // Scroll down to load more comments or find the next comment
        const scrollDistance = 300;
        window.scrollBy(0, scrollDistance);
        await this.sleep(1000);
        
        // Check if we can scroll more
        const canScrollMore = (window.innerHeight + window.scrollY) < document.body.offsetHeight;
        return canScrollMore;
    }
    
    async autoScrollAndReply(comments, caption, images, activeKey) {
        console.log('Starting auto scroll and reply process...');
        
        for (let i = 0; i < comments.length; i++) {
            const comment = comments[i];
            
            try {
                console.log(`Processing comment ${i + 1}/${comments.length} from ${comment.user}`);
                
                // Scroll to make sure the comment is visible
                comment.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                await this.sleep(1000);
                
                // Generate reply
                const prompt = this.buildPrompt(caption, comment.text);
                const response = await chrome.runtime.sendMessage({
                    type: 'AI_GENERATE_REPLY',
                    provider: activeKey.provider,
                    model: activeKey.model,
                    apiKey: activeKey.apiKey,
                    prompt: prompt,
                    images: activeKey.vision ? images : null
                });
                
                if (response && response.success) {
                    const replyText = this.sanitizeReply(response.reply);
                    console.log(`Generated reply: "${replyText}"`);
                    
                    // Post the reply
                    const postResult = await this.postReply(comment.refId, replyText);
                    if (postResult.success) {
                        console.log(`Successfully replied to ${comment.user}`);
                    } else {
                        console.error(`Failed to reply to ${comment.user}:`, postResult.error);
                    }
                } else {
                    console.error('Failed to generate reply:', response?.error);
                }
                
                // Wait between replies
                if (i < comments.length - 1) {
                    const delay = Math.floor(Math.random() * 8000) + 9000; // 9-17 seconds
                    console.log(`Waiting ${delay/1000}s before next reply...`);
                    await this.sleep(delay);
                }
                
            } catch (error) {
                console.error(`Error processing comment from ${comment.user}:`, error);
            }
        }
        
        console.log('Finished processing all comments');
    }
    
    async findReplyButton(commentElement) {
        for (const selector of this.replyButtonSelectors) {
            const button = commentElement.querySelector(selector);
            if (button && button.offsetParent !== null) { // Check if visible
                return button;
            }
        }
        
        // Fallback: look for any clickable element with "reply" text
        const buttons = commentElement.querySelectorAll('a, button, div[role="button"]');
        for (const button of buttons) {
            if (button.textContent.toLowerCase().includes('reply') && 
                button.offsetParent !== null) {
                return button;
            }
        }
        
        return null;
    }
    
    async findReplyInput() {
        const inputSelectors = [
            '[contenteditable="true"]',
            '[data-testid*="comment"] [contenteditable="true"]',
            '[role="textbox"]',
            'div[contenteditable="true"]'
        ];
        
        // Wait for reply input to appear
        for (let i = 0; i < 10; i++) {
            for (const selector of inputSelectors) {
                const input = document.querySelector(selector);
                if (input && input.offsetParent !== null) {
                    return input;
                }
            }
            await this.sleep(200);
        }
        
        return null;
    }
    
    async typeText(element, text) {
        // Simulate typing with proper events
        element.focus();
        
        // Clear existing content
        element.innerHTML = '';
        
        // Create and dispatch input events
        const event = new Event('input', { bubbles: true });
        element.textContent = text;
        element.dispatchEvent(event);
        
        // Also trigger change event
        const changeEvent = new Event('change', { bubbles: true });
        element.dispatchEvent(changeEvent);
        
        await this.sleep(500);
    }
    
    async submitReply() {
        // Try to find and click submit button
        const submitSelectors = [
            '[data-testid*="submit"]',
            '[aria-label*="Post"]',
            'button[type="submit"]',
            '[data-testid*="post"]'
        ];
        
        for (const selector of submitSelectors) {
            const button = document.querySelector(selector);
            if (button && button.offsetParent !== null) {
                await this.clickElement(button);
                await this.sleep(1000);
                return;
            }
        }
        
        // Fallback: try pressing Enter
        const activeElement = document.activeElement;
        if (activeElement) {
            const enterEvent = new KeyboardEvent('keydown', {
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                which: 13,
                bubbles: true
            });
            activeElement.dispatchEvent(enterEvent);
            
            const enterUpEvent = new KeyboardEvent('keyup', {
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                which: 13,
                bubbles: true
            });
            activeElement.dispatchEvent(enterUpEvent);
        }
    }
    
    async clickElement(element) {
        // Scroll element into view
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await this.sleep(500);
        
        // Try multiple click methods
        try {
            element.click();
        } catch (error) {
            // Fallback: dispatch mouse events
            const rect = element.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;
            
            const clickEvent = new MouseEvent('click', {
                view: window,
                bubbles: true,
                cancelable: true,
                clientX: x,
                clientY: y
            });
            
            element.dispatchEvent(clickEvent);
        }
        
        await this.sleep(300);
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize the extractor when the script loads
if (typeof window !== 'undefined' && window.location.hostname.includes('facebook.com')) {
    new FacebookReplyExtractor();
}

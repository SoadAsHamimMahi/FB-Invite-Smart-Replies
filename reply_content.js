// reply_content.js - Facebook content script for comment replies

class FacebookReplyExtractor {
    constructor() {
        // Updated selectors for current Facebook UI
        this.commentSelectors = [
            '[data-testid="UFI2Comment/root_depth_0"]',
            '[data-pagelet="CommentsUnit"] [role="article"]',
            '[data-testid="UFI2Comment/root_depth_0"]',
            '[role="article"] [data-testid*="comment"]',
            'div[data-testid*="comment"]',
            '.comment',
            '[role="article"]',
            'div[aria-label*="comment"]',
            'div[data-sigil*="comment"]'
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
            'strong a[role="link"]',
            '[data-testid="comment"] strong a',
            'a[role="link"] strong',
            'h3 a[role="link"]',
            'div[data-testid*="comment"] a[role="link"]',
            '.comment a[role="link"]'
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
                        try {
                            const result = await this.scanCommentsWithLoading(max, autoLoad);
                            sendResponse(result);
                        } catch (e) {
                            sendResponse({ success: false, error: e?.message || 'Scan failed' });
                        }
                    })();
                    return true;
                    
                default:
                    sendResponse({ success: false, error: 'Unknown message type' });
            }
        });
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
    
    async extractComments() {
        // Backward-compatible single-pass extraction without hard 25 cap
        const comments = [];
        try {
            await this.sleep(1000);
            const section = this.findCommentsSection();
            if (!section) return [];
            const elements = this.findAllCommentElements(section);
            for (const el of elements) {
                try {
                    const c = await this.extractSingleComment(el);
                    if (c && c.user && c.text && c.text.length > 3) comments.push(c);
                } catch(_) {}
            }
            // de-dupe
            const seen = new Set();
            const unique = [];
            for (const c of comments) {
                const k = `${c.user}_${(c.text||'').substring(0,50)}`;
                if (!seen.has(k)) { seen.add(k); unique.push(c); }
            }
            return unique;
        } catch (e) {
            console.error('Comment extraction error:', e);
            return [];
        }
    }
    
    findCommentsSection() {
        // Try multiple strategies to find the comments section
        const selectors = [
            '[data-pagelet="CommentsUnit"]',
            '[data-testid="UFI2CommentsList"]',
            '[data-testid="comments"]',
            '.comments',
            '[role="main"] [data-testid*="comment"]',
            '[data-sigil="comments"]'
        ];
        
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                console.log(`Found comments section with selector: ${selector}`);
                return element;
            }
        }
        
        // Fallback: look for any element containing multiple comment-like elements
        const potentialSections = document.querySelectorAll('[role="main"] > div, [data-pagelet], .story');
        for (const section of potentialSections) {
            const commentElements = section.querySelectorAll('[role="article"], [data-testid*="comment"], div[data-sigil*="comment"]');
            if (commentElements.length >= 2) {
                console.log(`Found comments section by fallback with ${commentElements.length} elements`);
                return section;
            }
        }
        
        return null;
    }
    
    findAllCommentElements(container) {
        const commentElements = [];
        
        // Strategy 1: Use our predefined selectors
        for (const selector of this.commentSelectors) {
            const elements = container.querySelectorAll(selector);
            commentElements.push(...elements);
        }
        
        // Strategy 2: Look for elements with comment-like attributes
        const additionalSelectors = [
            'div[data-testid*="comment"]',
            'div[data-sigil*="comment"]',
            'div[aria-label*="comment"]',
            'div[role="article"]',
            'div[data-testid*="UFI"]',
            'div[data-testid*="Comment"]'
        ];
        
        for (const selector of additionalSelectors) {
            const elements = container.querySelectorAll(selector);
            commentElements.push(...elements);
        }
        
        // Strategy 3: Look for elements containing user names and text
        const allDivs = container.querySelectorAll('div');
        for (const div of allDivs) {
            if (this.looksLikeComment(div)) {
                commentElements.push(div);
            }
        }
        
        // Remove duplicates
        const uniqueElements = [...new Set(commentElements)];
        
        // Filter out elements that are too small or don't contain text (loosened)
        return uniqueElements.filter(el => {
            const text = el.textContent || '';
            const hasText = text.trim().length > 3;
            const hasUser = this.findUserName(el) !== '';
            const visible = (el.offsetHeight > 0 && el.offsetWidth > 0);
            return hasText && hasUser && visible;
        });
    }

    // Progressive scanner that auto-loads more comments until target reached or stalled
    async scanCommentsWithLoading(maxComments, autoLoad) {
        const all = [];
        const start = Date.now();
        const timeoutMs = 120000; // 2 minutes
        const target = (maxComments === 'all') ? Number.MAX_SAFE_INTEGER : parseInt(maxComments, 10) || Number.MAX_SAFE_INTEGER;
        let stagnant = 0;
        const maxStagnant = 3;
        
        while (all.length < target && (Date.now() - start) < timeoutMs) {
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
                console.warn('Progressive scan pass error:', e);
                break;
            }
        }
        return { success: true, data: { comments: all, caption: await this.extractCaption(), images: await this.extractImages() } };
    }

    clickLoadMoreButtonsOnce() {
        const buttons = document.querySelectorAll('div[role="button"], a[role="button"], button');
        let clicked = 0;
        buttons.forEach(btn => {
            const txt = (btn.textContent||'').toLowerCase();
            const aria = (btn.getAttribute('aria-label')||'').toLowerCase();
            if ((txt.includes('view more') || txt.includes('view previous') || txt.includes('more comments') || aria.includes('more')) && btn.offsetParent !== null) {
                try { btn.click(); clicked++; } catch(_) {}
            }
        });
        return clicked;
    }
    
    looksLikeComment(element) {
        const text = element.textContent || '';
        const hasUser = this.findUserName(element) !== '';
        const hasReplyButton = this.findReplyButton(element) !== null;
        const hasText = text.trim().length > 10 && text.trim().length < 500;
        
        return hasUser && hasText && (hasReplyButton || element.querySelector('[role="button"]'));
    }
    
    async extractSingleComment(commentElement) {
        // Extract user name
        const user = this.findUserName(commentElement);
        
        // Extract comment text
        const text = this.findCommentText(commentElement);
        
        // Generate a unique reference for this comment
        const refId = `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Store reference to the comment element
        commentElement.dataset.replyRefId = refId;
        
        return {
            user,
            text,
            refId,
            element: commentElement
        };
    }
    
    findUserName(commentElement) {
        // Try multiple strategies to find the user name
        for (const selector of this.userNameSelectors) {
            const userEl = commentElement.querySelector(selector);
            if (userEl && userEl.textContent.trim()) {
                const userName = userEl.textContent.trim();
                if (userName.length > 0 && userName.length < 100) {
                    return userName;
                }
            }
        }
        
        // Fallback: look for any link or strong element that might be a username
        const potentialUsers = commentElement.querySelectorAll('a[role="link"], strong, h3, h4, span[dir="auto"]');
        for (const el of potentialUsers) {
            const text = el.textContent.trim();
            if (text.length > 0 && text.length < 50 && !text.includes(' ') && !text.includes('\n')) {
                return text;
            }
        }
        
        return '';
    }
    
    findCommentText(commentElement) {
        // Try multiple strategies to find comment text
        for (const selector of this.commentTextSelectors) {
            const textEl = commentElement.querySelector(selector);
            if (textEl && textEl.textContent.trim()) {
                const text = textEl.textContent.trim();
                if (text.length > 5) {
                    return text;
                }
            }
        }
        
        // Fallback: look for any div with dir="auto" that contains substantial text
        const textElements = commentElement.querySelectorAll('div[dir="auto"], span[dir="auto"]');
        for (const el of textElements) {
            const text = el.textContent.trim();
            if (text.length > 10 && text.length < 500) {
                return text;
            }
        }
        
        // Last resort: get all text content and clean it up
        const allText = commentElement.textContent || '';
        const lines = allText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        
        // Find the longest line that's not a username (usually the comment text)
        let longestLine = '';
        for (const line of lines) {
            if (line.length > longestLine.length && line.length < 500) {
                longestLine = line;
            }
        }
        
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

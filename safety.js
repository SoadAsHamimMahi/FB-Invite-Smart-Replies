// safety.js - Content safety and filtering utilities

/**
 * Checks if content looks relevant based on shared keywords
 * @param {string} caption - Post caption
 * @param {string} comment - Comment text
 * @param {string} level - Relevance level (low, medium, high)
 * @returns {boolean} Whether content appears relevant
 */
export function looksRelevant(caption, comment, level = "medium") {
    if (!caption || !comment) return false;
    
    const c1 = new Set((caption || "").toLowerCase().split(/\W+/));
    const c2 = new Set((comment || "").toLowerCase().split(/\W+/));
    
    // Remove common stop words
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them']);
    
    // Filter out stop words and short words
    const filtered1 = [...c1].filter(word => word.length > 2 && !stopWords.has(word));
    const filtered2 = [...c2].filter(word => word.length > 2 && !stopWords.has(word));
    
    // Find intersection
    const intersection = filtered2.filter(word => filtered1.has(word));
    
    const thresholds = { low: 1, medium: 2, high: 3 };
    const threshold = thresholds[level] || 2;
    
    return intersection.length >= threshold;
}

/**
 * Sanitizes text by removing unwanted patterns
 * @param {string} text - Text to sanitize
 * @param {Object} options - Sanitization options
 * @param {boolean} options.noUrls - Whether to remove URLs
 * @param {boolean} options.noEmails - Whether to remove email addresses
 * @param {boolean} options.noPhones - Whether to remove phone numbers
 * @param {boolean} options.noMentions - Whether to remove @mentions
 * @returns {string} Sanitized text
 */
export function sanitizeOut(text, options = {}) {
    if (!text) return text;
    
    let sanitized = text;
    
    if (options.noUrls !== false) {
        // Remove URLs
        sanitized = sanitized.replace(/https?:\/\/\S+/g, '');
        sanitized = sanitized.replace(/www\.\S+/g, '');
    }
    
    if (options.noEmails !== false) {
        // Remove email addresses
        sanitized = sanitized.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '');
    }
    
    if (options.noPhones !== false) {
        // Remove phone numbers
        sanitized = sanitized.replace(/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, '');
        sanitized = sanitized.replace(/\b\+\d{1,3}[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}\b/g, '');
    }
    
    if (options.noMentions !== false) {
        // Remove @mentions
        sanitized = sanitized.replace(/@\w+/g, '');
    }
    
    // Clean up extra whitespace
    sanitized = sanitized.replace(/\s+/g, ' ').trim();
    
    return sanitized;
}

/**
 * Checks if text contains profanity or inappropriate content
 * @param {string} text - Text to check
 * @returns {boolean} Whether text contains inappropriate content
 */
export function containsProfanity(text) {
    if (!text) return false;
    
    // Basic profanity filter - can be expanded
    const profanityWords = [
        'damn', 'hell', 'crap', 'shit', 'fuck', 'bitch', 'ass', 'asshole',
        'stupid', 'idiot', 'moron', 'retard', 'gay', 'fag', 'nigger',
        'whore', 'slut', 'porn', 'sex', 'nude', 'naked'
    ];
    
    const lowerText = text.toLowerCase();
    return profanityWords.some(word => lowerText.includes(word));
}

/**
 * Checks if text is spam-like
 * @param {string} text - Text to check
 * @returns {boolean} Whether text appears to be spam
 */
export function isSpam(text) {
    if (!text) return false;
    
    const spamIndicators = [
        // Repeated characters
        /(.)\1{4,}/,
        // Excessive caps
        /[A-Z]{10,}/,
        // Lots of punctuation
        /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{5,}/,
        // Multiple URLs
        /https?:\/\/\S+.*https?:\/\/\S+/,
        // Excessive emojis
        /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]{10,}/u
    ];
    
    return spamIndicators.some(pattern => pattern.test(text));
}

/**
 * Checks if text contains promotional content
 * @param {string} text - Text to check
 * @returns {boolean} Whether text is promotional
 */
export function isPromotional(text) {
    if (!text) return false;
    
    const promotionalWords = [
        'buy', 'sell', 'sale', 'discount', 'offer', 'deal', 'promo',
        'click here', 'link in bio', 'dm me', 'contact me',
        'follow me', 'subscribe', 'like and share', 'sponsored',
        'affiliate', 'commission', 'earn money', 'make money',
        'free trial', 'limited time', 'act now', 'don\'t miss out'
    ];
    
    const lowerText = text.toLowerCase();
    return promotionalWords.some(word => lowerText.includes(word));
}

/**
 * Checks if text contains personal information
 * @param {string} text - Text to check
 * @returns {boolean} Whether text contains PII
 */
export function containsPersonalInfo(text) {
    if (!text) return false;
    
    const piiPatterns = [
        // Social Security Numbers
        /\b\d{3}-\d{2}-\d{4}\b/,
        // Credit Card Numbers
        /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/,
        // Address patterns
        /\b\d+\s+\w+\s+(street|st|avenue|ave|road|rd|drive|dr|lane|ln|way|blvd|boulevard)\b/i,
        // ZIP codes
        /\b\d{5}(-\d{4})?\b/
    ];
    
    return piiPatterns.some(pattern => pattern.test(text));
}

/**
 * Checks if text is too long or too short
 * @param {string} text - Text to check
 * @param {number} minLength - Minimum length
 * @param {number} maxLength - Maximum length
 * @returns {boolean} Whether text length is appropriate
 */
export function hasAppropriateLength(text, minLength = 10, maxLength = 500) {
    if (!text) return false;
    return text.length >= minLength && text.length <= maxLength;
}

/**
 * Checks if text contains multiple languages
 * @param {string} text - Text to check
 * @returns {boolean} Whether text contains multiple languages
 */
export function isMultiLanguage(text) {
    if (!text) return false;
    
    // Simple heuristic: check for mixed scripts
    const hasLatin = /[a-zA-Z]/.test(text);
    const hasCyrillic = /[а-яё]/i.test(text);
    const hasArabic = /[\u0600-\u06FF]/.test(text);
    const hasChinese = /[\u4e00-\u9fff]/.test(text);
    
    const scripts = [hasLatin, hasCyrillic, hasArabic, hasChinese].filter(Boolean).length;
    return scripts > 1;
}

/**
 * Checks if text contains excessive special characters
 * @param {string} text - Text to check
 * @param {number} threshold - Percentage threshold for special characters
 * @returns {boolean} Whether text has too many special characters
 */
export function hasExcessiveSpecialChars(text, threshold = 0.3) {
    if (!text) return false;
    
    const specialCharCount = (text.match(/[^a-zA-Z0-9\s]/g) || []).length;
    const totalChars = text.length;
    
    return (specialCharCount / totalChars) > threshold;
}

/**
 * Comprehensive content safety check
 * @param {string} text - Text to check
 * @param {Object} options - Safety options
 * @returns {Object} Safety check results
 */
export function performSafetyCheck(text, options = {}) {
    const results = {
        safe: true,
        issues: [],
        warnings: []
    };
    
    if (!text) {
        results.safe = false;
        results.issues.push('Empty content');
        return results;
    }
    
    // Check length
    if (!hasAppropriateLength(text, options.minLength || 10, options.maxLength || 500)) {
        results.warnings.push('Inappropriate length');
    }
    
    // Check for profanity
    if (containsProfanity(text)) {
        results.safe = false;
        results.issues.push('Contains profanity');
    }
    
    // Check for spam
    if (isSpam(text)) {
        results.safe = false;
        results.issues.push('Spam-like content');
    }
    
    // Check for promotional content
    if (isPromotional(text)) {
        results.warnings.push('Promotional content');
    }
    
    // Check for personal information
    if (containsPersonalInfo(text)) {
        results.safe = false;
        results.issues.push('Contains personal information');
    }
    
    // Check for multiple languages
    if (isMultiLanguage(text)) {
        results.warnings.push('Multiple languages detected');
    }
    
    // Check for excessive special characters
    if (hasExcessiveSpecialChars(text)) {
        results.warnings.push('Excessive special characters');
    }
    
    return results;
}

/**
 * Generates a safety score for content
 * @param {string} text - Text to score
 * @param {Object} options - Scoring options
 * @returns {number} Safety score (0-100, higher is safer)
 */
export function calculateSafetyScore(text, options = {}) {
    if (!text) return 0;
    
    let score = 100;
    
    // Deduct for profanity
    if (containsProfanity(text)) score -= 30;
    
    // Deduct for spam
    if (isSpam(text)) score -= 25;
    
    // Deduct for promotional content
    if (isPromotional(text)) score -= 15;
    
    // Deduct for personal information
    if (containsPersonalInfo(text)) score -= 40;
    
    // Deduct for inappropriate length
    if (!hasAppropriateLength(text, options.minLength || 10, options.maxLength || 500)) {
        score -= 10;
    }
    
    // Deduct for excessive special characters
    if (hasExcessiveSpecialChars(text)) score -= 10;
    
    // Deduct for multiple languages (minor penalty)
    if (isMultiLanguage(text)) score -= 5;
    
    return Math.max(0, score);
}

/**
 * Filters content based on safety rules
 * @param {string} text - Text to filter
 * @param {Object} rules - Filtering rules
 * @returns {string} Filtered text
 */
export function filterContent(text, rules = {}) {
    if (!text) return text;
    
    let filtered = text;
    
    // Apply sanitization
    if (rules.sanitize) {
        filtered = sanitizeOut(filtered, rules.sanitize);
    }
    
    // Remove profanity
    if (rules.removeProfanity) {
        const profanityWords = [
            'damn', 'hell', 'crap', 'shit', 'fuck', 'bitch', 'ass', 'asshole',
            'stupid', 'idiot', 'moron', 'retard'
        ];
        
        profanityWords.forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            filtered = filtered.replace(regex, '[FILTERED]');
        });
    }
    
    // Truncate if too long
    if (rules.maxLength && filtered.length > rules.maxLength) {
        filtered = filtered.substring(0, rules.maxLength - 3) + '...';
    }
    
    return filtered.trim();
}

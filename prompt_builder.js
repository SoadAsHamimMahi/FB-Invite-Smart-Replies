// prompt_builder.js - AI prompt generation utilities

/**
 * Gets tone-specific instructions for AI prompt
 * @param {string} tone - The tone type
 * @returns {string} Tone-specific instructions
 */
function getToneInstructions(tone) {
    const toneMap = {
        'friendly': 'Be warm, approachable, and conversational. Use positive language and show genuine interest.',
        'funny': 'Be witty and humorous with light jokes, playful language, and fun emojis. Keep it appropriate and make the user smile!',
        'professional': 'Be formal, business-like, and authoritative. Use proper grammar and professional language.',
        'casual': 'Be relaxed and conversational like talking to a friend. Use contractions, slang, and a laid-back tone.',
        'enthusiastic': 'Be energetic and exciting! Use exclamation marks, positive language, and show genuine enthusiasm.',
        'supportive': 'Be encouraging and helpful. Show understanding and offer assistance or encouragement.',
        'empathetic': 'Show understanding and compassion. Acknowledge feelings and provide emotional support with warmth.',
        'promotional': 'Be persuasive and marketing-focused. Highlight benefits and include gentle calls-to-action.',
        'educational': 'Be informative and teaching-focused. Explain concepts clearly and add value through knowledge sharing.',
        'appreciative': 'Express genuine gratitude and appreciation. Thank the commenter and make them feel valued.'
    };
    
    return toneMap[tone] || toneMap['friendly'];
}

/**
 * Builds a context-aware reply prompt for AI generation
 * @param {Object} params - Configuration parameters
 * @param {string} params.caption - The post caption text
 * @param {string} params.commentText - The comment text to reply to
 * @param {string} params.tone - The desired tone (friendly, funny, professional, casual, enthusiastic, supportive, empathetic, promotional, educational, appreciative)
 * @param {string} params.language - Language preference (auto, en, es, fr, etc.)
 * @param {Object} params.safety - Safety settings
 * @param {boolean} params.safety.noUrls - Whether to avoid URLs
 * @param {boolean} params.safety.profanityFilter - Whether to filter profanity
 * @param {number} params.maxLen - Maximum reply length (default: 220)
 * @returns {string} The formatted prompt for AI generation
 */
export function buildReplyPrompt({ caption, commentText, tone, language, safety, maxLen = 220 }) {
    const toneInstructions = getToneInstructions(tone);
    
    const promptParts = [
        `You are a helpful page admin assistant for a Facebook page.`,
        `Write ONE short reply to the comment with a ${tone} tone. Be relevant to both the POST and the COMMENT.`,
        toneInstructions,
        `Your reply should feel natural and engaging.`,
    ];
    
    // Safety instructions
    if (safety?.noUrls) {
        promptParts.push(`Do NOT include URLs, phone numbers, or email addresses.`);
    }
    
    if (safety?.profanityFilter) {
        promptParts.push(`Never use profanity, offensive language, or inappropriate content.`);
    }
    
    // Language instruction
    if (language && language !== 'auto') {
        promptParts.push(`Write in ${language}.`);
    } else {
        promptParts.push(`Use the commenter's language if clear; otherwise use English.`);
    }
    
    // Length constraint
    promptParts.push(`Hard limit: maximum ${maxLen} characters.`);
    promptParts.push(`Be concise but meaningful.`);
    
    // Context
    promptParts.push(``);
    promptParts.push(`POST CONTENT:`);
    promptParts.push(`"""${truncate(caption, 600)}"""`);
    promptParts.push(``);
    promptParts.push(`COMMENT TO REPLY TO:`);
    promptParts.push(`"""${truncate(commentText, 400)}"""`);
    promptParts.push(``);
    promptParts.push(`Return only the reply text, no explanations or formatting.`);
    
    return promptParts.filter(Boolean).join("\n");
}

/**
 * Builds a prompt for analyzing post relevance
 * @param {string} caption - Post caption
 * @param {string} comment - Comment text
 * @param {string} level - Relevance level (low, medium, high)
 * @returns {string} Analysis prompt
 */
export function buildRelevancePrompt({ caption, comment, level = "medium" }) {
    const thresholds = { low: 1, medium: 2, high: 3 };
    const threshold = thresholds[level] || 2;
    
    return `Analyze if this comment is relevant to the post content. 
Consider shared keywords, topics, and context.
Reply with "RELEVANT" if there are at least ${threshold} shared concepts, "NOT_RELEVANT" otherwise.

POST: """${truncate(caption, 400)}"""
COMMENT: """${truncate(comment, 300)}"""`;
}

/**
 * Builds a prompt for tone analysis
 * @param {string} text - Text to analyze
 * @returns {string} Analysis prompt
 */
export function buildToneAnalysisPrompt(text) {
    return `Analyze the tone of this text and classify it as one of: positive, negative, neutral, question, complaint, compliment.
Text: """${truncate(text, 500)}"""
Respond with only the classification.`;
}

/**
 * Builds a prompt for language detection
 * @param {string} text - Text to analyze
 * @returns {string} Detection prompt
 */
export function buildLanguageDetectionPrompt(text) {
    return `Detect the language of this text and respond with the language code (en, es, fr, de, pt, it, ru, etc.).
Text: """${truncate(text, 300)}"""
Respond with only the language code.`;
}

/**
 * Builds a prompt for content moderation
 * @param {string} text - Text to moderate
 * @returns {string} Moderation prompt
 */
export function buildModerationPrompt(text) {
    return `Check if this text contains inappropriate content, spam, or violates community guidelines.
Text: """${truncate(text, 500)}"""
Respond with "SAFE" or "UNSAFE" followed by a brief reason if unsafe.`;
}

/**
 * Builds a prompt for sentiment analysis
 * @param {string} text - Text to analyze
 * @returns {string} Analysis prompt
 */
export function buildSentimentPrompt(text) {
    return `Analyze the sentiment of this text.
Text: """${truncate(text, 400)}"""
Respond with one of: positive, negative, neutral, mixed.`;
}

/**
 * Builds a prompt for extracting key topics
 * @param {string} text - Text to analyze
 * @returns {string} Extraction prompt
 */
export function buildTopicExtractionPrompt(text) {
    return `Extract the main topics and keywords from this text.
Text: """${truncate(text, 500)}"""
Respond with a comma-separated list of key topics.`;
}

/**
 * Builds a prompt for generating hashtags
 * @param {string} text - Text to generate hashtags for
 * @returns {string} Hashtag generation prompt
 */
export function buildHashtagPrompt(text) {
    return `Generate 3-5 relevant hashtags for this content.
Text: """${truncate(text, 400)}"""
Respond with hashtags separated by spaces, starting with #.`;
}

/**
 * Builds a prompt for generating emoji suggestions
 * @param {string} text - Text to suggest emojis for
 * @returns {string} Emoji suggestion prompt
 */
export function buildEmojiPrompt(text) {
    return `Suggest 2-3 relevant emojis for this content.
Text: """${truncate(text, 300)}"""
Respond with emojis only, no text.`;
}

/**
 * Builds a prompt for content summarization
 * @param {string} text - Text to summarize
 * @param {number} maxLength - Maximum summary length
 * @returns {string} Summarization prompt
 */
export function buildSummaryPrompt(text, maxLength = 100) {
    return `Summarize this content in ${maxLength} characters or less.
Text: """${truncate(text, 1000)}"""
Respond with only the summary.`;
}

/**
 * Truncates text to specified length with ellipsis
 * @param {string} str - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export function truncate(str, maxLength) {
    if (!str) return '';
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength - 3) + '...';
}

/**
 * Cleans and normalizes text for AI processing
 * @param {string} text - Text to clean
 * @returns {string} Cleaned text
 */
export function cleanText(text) {
    if (!text) return '';
    
    return text
        .replace(/\s+/g, ' ') // Normalize whitespace
        .replace(/[^\w\s.,!?;:'"()-]/g, '') // Remove special chars but keep punctuation
        .trim();
}

/**
 * Extracts keywords from text
 * @param {string} text - Text to extract keywords from
 * @returns {Array<string>} Array of keywords
 */
export function extractKeywords(text) {
    if (!text) return [];
    
    return text
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2)
        .filter((word, index, arr) => arr.indexOf(word) === index) // Remove duplicates
        .slice(0, 10); // Limit to 10 keywords
}

/**
 * Estimates reading time for text
 * @param {string} text - Text to analyze
 * @returns {number} Estimated reading time in seconds
 */
export function estimateReadingTime(text) {
    if (!text) return 0;
    
    const wordsPerMinute = 200;
    const wordCount = text.split(/\s+/).length;
    return Math.ceil((wordCount / wordsPerMinute) * 60);
}

/**
 * Checks if text contains specific patterns
 * @param {string} text - Text to check
 * @param {Array<string>} patterns - Patterns to look for
 * @returns {boolean} Whether any pattern is found
 */
export function containsPatterns(text, patterns) {
    if (!text || !patterns) return false;
    
    const lowerText = text.toLowerCase();
    return patterns.some(pattern => lowerText.includes(pattern.toLowerCase()));
}

/**
 * Formats prompt with variables
 * @param {string} template - Template string with {variable} placeholders
 * @param {Object} variables - Variables to substitute
 * @returns {string} Formatted string
 */
export function formatPrompt(template, variables) {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
        return variables[key] || match;
    });
}

/**
 * Validates prompt parameters
 * @param {Object} params - Parameters to validate
 * @returns {Object} Validation result
 */
export function validatePromptParams(params) {
    const errors = [];
    
    if (!params.caption && !params.commentText) {
        errors.push('Either caption or commentText is required');
    }
    
    if (params.maxLen && (params.maxLen < 10 || params.maxLen > 500)) {
        errors.push('maxLen must be between 10 and 500');
    }
    
    const validTones = ['friendly', 'funny', 'professional', 'casual', 'enthusiastic', 'supportive', 'empathetic', 'promotional', 'educational', 'appreciative'];
    if (params.tone && !validTones.includes(params.tone)) {
        errors.push('Invalid tone. Must be one of: ' + validTones.join(', '));
    }
    
    return {
        valid: errors.length === 0,
        errors: errors
    };
}

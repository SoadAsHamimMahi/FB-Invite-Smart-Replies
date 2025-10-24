# FB Invite & Smart Replies - AI Extension

A Chrome extension that automates Facebook interactions with smart AI-powered comment replies and liker invitations.

## Features

### 🤖 Smart Reply Comments
- **AI-Powered Replies**: Generate context-aware responses to Facebook comments using Gemini or Mistral AI
- **Vision Support**: Analyze post images with Gemini's vision capabilities
- **Multiple Tones**: Friendly, supportive, promotional, or professional reply styles
- **Safety Filters**: Built-in content moderation and spam detection
- **Preview Mode**: Review AI-generated replies before posting
- **Auto Mode**: Direct posting with safety controls

### ⚙️ Multi-Provider AI Settings
- **Multiple API Keys**: Manage Gemini and Mistral API keys
- **Active Key Selection**: Choose which AI provider to use
- **Vision Toggle**: Enable/disable image analysis per provider
- **Usage Tracking**: Monitor daily API usage and limits
- **Connection Testing**: Verify API key validity

### 🛡️ Safety & Controls
- **Relevance Filtering**: Skip off-topic comments (Low/Medium/High)
- **Content Sanitization**: Remove URLs, phone numbers, and emails
- **Profanity Filter**: Automatic inappropriate content detection
- **Daily Limits**: Set maximum replies per day
- **User Deduplication**: Reply once per user per post
- **Randomized Delays**: Human-like timing between replies

### 📊 Progress Tracking
- **Real-time Stats**: Track processed, replied, and skipped comments
- **Activity Log**: Detailed logging of all actions
- **Progress Bar**: Visual progress indicator
- **ETA Calculation**: Estimated time to completion

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory
5. The extension icon will appear in your Chrome toolbar

## Setup

### 1. Configure AI API Keys
1. Click the extension icon and select "Settings"
2. Click "Add New Key" to add your API keys:
   - **Gemini**: Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - **Mistral**: Get your API key from [Mistral AI](https://console.mistral.ai/)
3. Set one key as "Active"
4. Test the connection to verify your keys work

### 2. Configure Reply Settings
- **Tone**: Choose the reply style (friendly, supportive, promotional, professional)
- **Language**: Auto-detect or specify a language
- **Max Reply Length**: Set character limit (50-500)
- **Relevance Filter**: Set how strict comment filtering should be
- **Safety Options**: Enable/disable URL removal and profanity filtering

## Usage

### Smart Reply Comments
1. Navigate to a Facebook post with comments
2. Click the extension icon and select "Reply Comments"
3. Choose your mode:
   - **Preview Mode**: Review each reply before posting
   - **Auto Mode**: Post replies automatically
4. Click "Start" to begin processing comments
5. Monitor progress in the activity log

### Invite Likers (Existing Feature)
- The original "Invite Likers" functionality remains unchanged
- Access via the popup menu

## API Providers

### Gemini (Google AI)
- **Models**: gemini-2.5-flash, gemini-1.5-pro, gemini-1.5-flash
- **Vision**: ✅ Supports image analysis
- **Best for**: Context-aware replies with image understanding
- **Rate Limits**: Generous free tier, paid plans available

### Mistral AI
- **Models**: mistral-large, mistral-nemo, mistral-small
- **Vision**: ⚠️ Limited vision support (fallback to text-only)
- **Best for**: High-quality text generation
- **Rate Limits**: Pay-per-use pricing

## Safety Features

### Content Moderation
- **Profanity Detection**: Automatic filtering of inappropriate language
- **Spam Detection**: Identifies and skips spam-like content
- **Personal Information**: Detects and blocks PII exposure
- **Promotional Content**: Flags marketing/promotional messages

### Usage Controls
- **Daily Limits**: Prevent overuse with configurable caps
- **Delay Controls**: Random delays between replies (9-17 seconds default)
- **User Deduplication**: Never reply twice to the same user on one post
- **Relevance Scoring**: Skip comments that don't match the post topic

## File Structure

```
├── manifest.json              # Extension manifest (updated)
├── popup.html                 # Main popup interface
├── popup.js                   # Popup navigation logic
├── settings.html              # AI settings page
├── settings.js                # API key management
├── reply.html                 # Reply interface
├── reply.js                   # Reply controller
├── reply_content.js           # Facebook content script
├── background.js              # Service worker + AI adapters
├── prompt_builder.js          # AI prompt utilities
├── safety.js                  # Content safety functions
└── [existing files...]        # Original extension files
```

## Message Types

### Content Script ↔ Background
- `MSG_GET_CONTEXT`: Extract post caption, images, and comments
- `MSG_POST_REPLY`: Post a reply to a specific comment

### UI ↔ Background
- `AI_GENERATE_REPLY`: Generate AI reply for a comment
- `AI_GET_ACTIVE_CONFIG`: Get current AI configuration
- `AI_TEST_CONNECTION`: Test API key connection

## Error Handling

The extension includes comprehensive error handling:
- **Network Errors**: Graceful handling of API failures
- **Rate Limiting**: Automatic backoff and retry logic
- **Invalid Responses**: Validation of AI-generated content
- **DOM Errors**: Resilient Facebook page interaction
- **Storage Errors**: Fallback for configuration issues

## Troubleshooting

### Common Issues

1. **"No active AI key configured"**
   - Go to Settings and add an API key
   - Set one key as "Active"

2. **"Connection test failed"**
   - Verify your API key is correct
   - Check your internet connection
   - Ensure the API provider is accessible

3. **"No comments found on this post"**
   - Make sure you're on a Facebook post page
   - Wait for comments to load
   - Try refreshing the page

4. **"Failed to extract post context"**
   - Ensure you're on a valid Facebook post
   - Check that the page has fully loaded
   - Try scrolling to load more content

### Debug Mode
- Open Chrome DevTools (F12)
- Check the Console tab for detailed error messages
- Look for messages prefixed with the extension name

## Privacy & Security

- **API Keys**: Stored securely in Chrome's sync storage
- **Data Processing**: All content processing happens locally or via official AI APIs
- **No Data Collection**: The extension doesn't collect or store personal data
- **Facebook Compliance**: Follows Facebook's terms of service and rate limits

## Limitations

- **Facebook Changes**: May require updates if Facebook changes their UI
- **API Costs**: AI providers may charge for usage beyond free tiers
- **Rate Limits**: Facebook may temporarily block accounts for excessive automation
- **Language Support**: Limited to languages supported by chosen AI provider

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This extension is for educational and personal use. Users are responsible for complying with Facebook's terms of service and applicable laws.

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the Chrome DevTools console for errors
3. Ensure you're using the latest version of the extension
4. Verify your API keys are valid and have sufficient quota

---

**Disclaimer**: This extension automates Facebook interactions. Use responsibly and in compliance with Facebook's terms of service. The developers are not responsible for any account restrictions or violations that may occur from misuse of this tool.

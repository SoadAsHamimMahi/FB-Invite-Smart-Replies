# FB Invite & Smart Replies

A Chrome extension that automates Facebook interactions with AI-powered comment replies and automated page invitations.

**Status**: Stable | **Manifest Version**: 3

## Features

- **Smart AI Replies**: Generate context-aware comment replies using Gemini or Mistral AI
- **Automated Invitations**: Invite post likers to like your Facebook page
- **Comment Detection**: Automatically scan and detect comments on Facebook posts
- **Multiple Tones**: Friendly, professional, supportive, and more reply styles
- **Preview & Auto Modes**: Review replies before posting or auto-post with safety controls
- **Multi-Language**: Support for English, Spanish, French, German, and more

## Installation

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top-right toggle)
3. Click "Load unpacked" and select this project directory
4. The extension icon will appear in your toolbar

## Quick Start

### Smart Replies
1. Go to **Settings** tab → Add your API key (Gemini or Mistral)
2. Go to **Reply** tab → Enter post caption → Click "Save Post Data"
3. Navigate to a Facebook post → Click "Scan Comments"
4. Click "Generate" next to any comment → Review and post

### Invite Likers
1. Go to **Invite** tab → Configure pause intervals and limits
2. Navigate to a Facebook post with likers
3. Click "Start Inviting Likers"

## Requirements

- Chrome/Edge (version 88+)
- API key from [Gemini](https://makersuite.google.com/app/apikey) or [Mistral](https://console.mistral.ai/) (for smart replies)

## Permissions

- `activeTab`: Access current tab when extension is used
- `scripting`: Inject scripts into Facebook pages
- `storage`: Save your settings and API keys locally
- `https://*.facebook.com/*`: Access Facebook pages
- `https://generativelanguage.googleapis.com/*` & `https://api.mistral.ai/*`: AI API access

## Keyboard Shortcuts

- **Ctrl+S**: Save Post Data
- **Ctrl+R**: Scan Comments
- **Ctrl+Enter**: Generate Reply
- **1-9**: Generate reply for comment 1-9

## Privacy & Security

- All data stored locally in Chrome storage
- API keys never shared or sent to third parties
- Only official AI provider APIs are used
- No data collection or analytics

## Disclaimer

This extension is not affiliated with Meta/Facebook. Use responsibly and in compliance with Facebook's terms of service. Automation may result in account restrictions.

## License

Provided as-is for educational and personal use. Use at your own risk.

---

**Version**: 1.0.0 | **Maintainer**: Community

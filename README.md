# Alimail Reply Assistant

A Tampermonkey userscript + Docker backend for generating professional email replies in Alimail Webmail (https://qiye.aliyun.com/alimail/).

![Version](https://img.shields.io/badge/version-2.3-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## Overview

This tool helps draft professional email replies quickly by:
1. Extracting the original email content from Alimail
2. Taking your bullet points/notes as input
3. Using an LLM to generate a well-structured, professional reply
4. Inserting the reply directly into the email editor or copying to clipboard

## Features

- **AI-Powered Generation**: Uses your local LLM or OpenAI API to generate replies
- **Theme-Aware UI**: Automatically matches Alimail's color theme (8 themes supported)
- **Toolbar Integration**: AI button appears directly in Alimail's compose toolbar
- **2-Column Layout**: View original email and compose reply side by side
- **One-Click Insert**: Insert generated reply directly into the email body
- **Multi-Language**: Support for Traditional Chinese, English, Portuguese, or Mixed
- **Tone Options**: Professional, Friendly, Concise, or Detailed
- **Privacy**: Runs locally - your emails don't leave your machine

## Quick Start

### Prerequisites

- Docker & Docker Compose installed
- An LLM server running locally (e.g., LiteLLM proxy, Ollama, or direct OpenAI API)
- Tampermonkey browser extension

### 1. Start the Backend Server

```bash
# Clone or navigate to this repository
cd alimail-webmail-extension

# Start the server with Docker
docker-compose up -d

# Check if it's running
curl http://localhost:8000/health
```

### 2. Install the Tampermonkey Script

1. Install [Tampermonkey](https://www.tampermonkey.net/) extension in your browser
2. Open Tampermonkey Dashboard → Create New Script
3. Copy the contents of `alimail-reply-assistant.user.js`
4. Save (Ctrl+S)

### 3. Configure LLM Connection

Edit `docker-compose.yml` to point to your LLM server:

```yaml
environment:
  - LLM_URL=http://host.docker.internal:4000  # Your LLM endpoint
  - LLM_API_KEY=your-api-key-here             # Optional
  - LLM_MODEL=gpt-4o                          # Model to use
```

Or set via environment variables:
```bash
export LLM_API_KEY="your-key"
export LLM_MODEL="gpt-4o"
docker-compose up -d
```

## Usage

1. Open Alimail Webmail at `https://qiye.aliyun.com/alimail/`
2. Click **Reply** on any email (you should see the URL change to `/compose`)
3. Click the **AI** button in the toolbar (next to X₂ subscript button)
4. The popup will appear with 2 columns:
   - **Left column**: Original email (auto-extracted) and your key points input
   - **Right column**: Generated reply
5. Enter your bullet points in the text area:
   ```
   - Apologize for the delay
   - Request additional documents
   - Meeting is scheduled for Friday at 3pm
   ```
6. Select your preferred **Tone** (Professional/Friendly/Concise/Detailed)
7. Select **Language** (Traditional Chinese/English/Portuguese/Mixed)
8. Click **Generate Reply**
9. Click **Insert to Email** to add directly to the compose area, or **Copy** to clipboard

## Supported Themes

The UI automatically detects and matches Alimail's theme:
- Black
- Silver
- Blue
- Red
- Gold
- Green
- Lake Blue
- Pink

## Development

### Local Development (without Docker)

```bash
cd server
./start.sh
```

This will:
- Create a Python virtual environment
- Install dependencies
- Start the FastAPI server at `http://localhost:8000` with auto-reload

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API info |
| GET | `/health` | Health check |
| POST | `/generate-reply` | Generate email reply |

### API Example

```bash
curl -X POST http://localhost:8000/generate-reply \
  -H "Content-Type: application/json" \
  -d '{
    "original_email": "Dear Sir, I need information about...",
    "user_input": "Provide the requested information, attach form A",
    "tone": "professional",
    "language": "chinese"
  }'
```

## Troubleshooting

### Server not responding
```bash
# Check if Docker container is running
docker-compose ps

# View logs
docker-compose logs -f

# Restart
docker-compose restart
```

### LLM connection issues
```bash
# Test your LLM endpoint
curl http://localhost:4000/v1/models

# Check the configured URL in docker-compose.yml
docker-compose config
```

### AI button not appearing in toolbar
- Ensure you're on a `/compose` URL
- Check browser console (F12) for errors
- Verify Tampermonkey is enabled for `qiye.aliyun.com`
- Try refreshing the page after navigating to compose

### Insert to Email not working
- Ensure the email editor iframe is loaded
- Try clicking inside the email body first to focus it
- Check browser console for any errors

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Alimail Webmail │────▶│  Tampermonkey   │────▶│  FastAPI Server │
│  (webmail)      │     │  Userscript     │     │  (localhost:8000)│
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                │                         │
                                ▼                         ▼
                        ┌─────────────────┐     ┌─────────────────┐
                        │  Alimail Editor │     │  LLM Server     │
                        │  (iframe)       │     │  (OpenAI/Local) │
                        └─────────────────┘     └─────────────────┘
```

## Project Structure

```
alimail-webmail-extension/
├── alimail-reply-assistant.user.js  # Tampermonkey script
├── docker-compose.yml               # Docker Compose config
├── Dockerfile                       # Docker image definition
├── README.md                        # This file
├── AGENTS.md                        # Agent documentation
└── server/
    ├── main.py                      # FastAPI application
    ├── requirements.txt             # Python dependencies
    └── start.sh                     # Local dev startup script
```

## License

MIT License

# Alimail Reply Assistant - Agent Documentation

## Project Overview

An **AI-Powered Email Reply Generator** for Alimail Webmail.

The system helps government staff draft professional email replies by:
1. Extracting original email content from the Alimail compose page
2. Taking user bullet points/notes as input
3. Using an LLM (OpenAI or local) to generate well-structured replies
4. Providing a copy-to-clipboard feature for easy pasting

### Components
- **Backend Server**: FastAPI application that connects to LLM APIs
- **Browser Userscript**: Tampermonkey script that integrates with Alimail webmail

---

## Project Structure

```
alimail-webmail-extension/
├── AGENTS.md                        # This file - agent reference
├── README.md                        # User-facing documentation
├── Dockerfile                       # Docker image definition
├── docker-compose.yml               # Docker Compose configuration
├── alimail-reply-assistant.user.js  # Tampermonkey userscript
└── server/
    ├── main.py                      # FastAPI application
    ├── requirements.txt             # Python dependencies
    └── start.sh                     # Local development startup script
```

---

## Technology Stack

### Backend
| Component | Technology |
|-----------|------------|
| Language | Python 3.11 |
| Framework | FastAPI |
| Server | Uvicorn (ASGI) |
| HTTP Client | httpx |

### Frontend (Userscript)
| Component | Technology |
|-----------|------------|
| Platform | Tampermonkey/Greasemonkey |
| Language | Vanilla JavaScript (ES6+) |
| API Access | GM_xmlhttpRequest, fetch fallback |

### Infrastructure
| Component | Technology |
|-----------|------------|
| Containerization | Docker + Docker Compose |
| Health Checks | Built-in HTTP health endpoint |

---

## Build and Run Commands

### Docker (Recommended)

```bash
# Build and start the container in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the container
docker-compose down

# Rebuild after code changes
docker-compose up -d --build
```

### Local Development

```bash
cd server
./start.sh
```

The `start.sh` script will:
1. Create a Python virtual environment (`.venv/`) if it doesn't exist
2. Activate the virtual environment
3. Install/update dependencies from `requirements.txt`
4. Start the FastAPI server at `http://localhost:8000` with auto-reload

### Manual Server Start

```bash
cd server
source .venv/bin/activate
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API info and available endpoints |
| GET | `/health` | Health check + configuration |
| POST | `/generate-reply` | Generate professional email reply |

### API Request/Response Examples

**Health Check:**
```bash
curl http://localhost:8000/health
```
```json
{"status": "ok", "llm_url": "http://host.docker.internal:4000", "model": "gpt-4o"}
```

**Generate Reply:**
```bash
curl -X POST http://localhost:8000/generate-reply \
  -H "Content-Type: application/json" \
  -d '{
    "original_email": "Dear Sir, I would like to request information about...",
    "user_input": "Provide the information, mention 5 working days processing time",
    "tone": "professional",
    "language": "english"
  }'
```
```json
{
  "generated_reply": "Dear Sir/Madam,\n\nThank you for your email..."
}
```

### Request Fields (Generate Reply)
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `original_email` | string | Yes | The original email content to reply to |
| `user_input` | string | Yes | User's bullet points/notes for the reply |
| `tone` | string | No | `professional`, `friendly`, `concise`, `detailed` (default: `professional`) |
| `language` | string | No | `english`, `chinese`, `portuguese`, `mixed` (default: `english`) |

---

## Code Organization

### Backend (`server/main.py`)

| Component | Description |
|-----------|-------------|
| `build_system_prompt()` | Constructs the system prompt based on tone and language settings |
| `build_user_prompt()` | Formats the original email and user input for the LLM |
| `generate_reply()` | POST endpoint handler that calls the LLM API and returns the generated text |

**Configuration via Environment Variables:**
- `LLM_URL`: Base URL of the LLM API (default: `http://host.docker.internal:4000`)
- `LLM_API_KEY`: API key for authentication (default: empty)
- `LLM_MODEL`: Model name to use (default: `gpt-4o`)

### Userscript (`alimail-reply-assistant.user.js`)

| Function | Description |
|----------|-------------|
| `createOverlay()` | Creates the main UI panel with input fields and buttons |
| `createFloatingButton()` | Creates the ✨ floating button visible on compose pages |
| `makeDraggable()` | Implements mouse drag functionality for repositioning the overlay |
| `extractOriginalEmail()` | Attempts to extract the original email content from the Alimail page |
| `callGenerateAPI()` | Calls the backend server using GM_xmlhttpRequest with fetch fallback |
| `generateReply()` | Orchestrates the API call and displays loading/error states |
| `showResult()` | Displays the generated reply with copy button |

---

## Code Style Guidelines

### Python
- Follow PEP 8
- Use type hints for function signatures and variables
- Use async/await for I/O operations (HTTP calls to LLM)
- Use Pydantic models for request/response validation
- Use httpx for async HTTP requests

### JavaScript (Userscript)
- ES6+ syntax: arrow functions, async/await, const/let
- Use `GM_xmlhttpRequest` for Tampermonkey compatibility
- Provide fetch API fallback for non-GM environments
- CSS uses backdrop-filter for modern glassmorphism effects (same as Cantonese Romanizer)

---

## Testing Strategy

### Server Testing (Manual)

```bash
# Health check
curl http://localhost:8000/health

# Test reply generation
curl -X POST http://localhost:8000/generate-reply \
  -H "Content-Type: application/json" \
  -d '{
    "original_email": "Test email content",
    "user_input": "Say thank you and confirm receipt",
    "tone": "professional",
    "language": "english"
  }'
```

### Userscript Testing (Manual)

1. Start the server (`docker-compose up -d` or `cd server && ./start.sh`)
2. Verify server health: `curl http://localhost:8000/health`
3. Install the userscript in Tampermonkey:
   - Copy contents of `alimail-reply-assistant.user.js`
   - Create new script and paste
   - Save (Ctrl+S)
4. Open Alimail Webmail at `https://qiye.aliyun.com/alimail/`
5. Click Reply on an email (ensure URL contains `/compose`)
6. Verify:
   - ✨ floating button appears
   - Clicking opens the assistant panel
   - Original email is extracted or shows helpful message
   - Generate button works (requires LLM server)
   - Copy button works
   - Draggable positioning works
   - Close button and Escape key work
7. Check browser console (F12) for errors if not working

### Edge Cases to Test
- Original email extraction failures
- Empty user input
- LLM server not running (should show error)
- Long original emails (truncated preview)
- Rapid open/close of panel
- Navigation between different emails

---

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `LLM_URL` | Base URL of the LLM API | `http://host.docker.internal:4000` |
| `LLM_API_KEY` | API key for LLM authentication | (empty) |
| `LLM_MODEL` | Model name to use | `gpt-4o` |
| `PYTHONUNBUFFERED` | Python output buffering | 1 (in Docker) |

### Userscript Configuration

Edit `SERVER_URL` constant in the userscript to change API endpoint:
```javascript
const SERVER_URL = 'http://localhost:8000';
```

---

## Deployment

### Docker Deployment

The Docker setup:
- Uses `python:3.11-slim` base image
- Exposes port 8000
- Includes health check that queries `/health` endpoint
- Restarts automatically unless stopped
- Uses `host.docker.internal` to connect to host's LLM server

### LLM Server Options

**Option 1: LiteLLM Proxy (Recommended)**
```bash
pip install litellm
litellm --model gpt-4o --port 4000
```

**Option 2: Ollama (Local Models)**
```bash
ollama run llama3.1
# Update LLM_URL to http://host.docker.internal:11434
```

**Option 3: Direct OpenAI**
```yaml
environment:
  - LLM_URL=https://api.openai.com
  - LLM_API_KEY=sk-...
  - LLM_MODEL=gpt-4o
```

### Security Considerations

1. **CORS**: Currently allows all origins (`["*"]`) for userscript compatibility
2. **No Authentication**: API is open - intended for local use only
3. **API Keys**: Store in environment variables, never commit to git
4. **Email Privacy**: Emails are sent to the configured LLM - ensure compliance with data policies

---

## Troubleshooting

### Server Issues

```bash
# Check if port 8000 is in use
lsof -i :8000

# Kill process using port 8000
kill -9 <PID>

# Check server logs
docker-compose logs -f
# or (local)
cd server && ./start.sh
```

### LLM Connection Issues

```bash
# Test LLM endpoint from host
curl http://localhost:4000/v1/models

# Test from inside Docker container
docker-compose exec reply-generator python -c "import httpx; print(httpx.get('http://host.docker.internal:4000/v1/models').json())"
```

### Userscript Issues

- Verify server is running: `curl http://localhost:8000/health`
- Check browser console for CORS errors
- Ensure `@connect localhost` is in userscript metadata
- Verify Tampermonkey has permission to access localhost
- Check for ad blockers interfering with requests
- Ensure on compose page: URL should contain `/compose`

---

## Design System

The UI follows the same design language as the Cantonese Romanizer project:

**Colors:**
- Gradient background: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- White text with opacity variations for hierarchy
- Semi-transparent backgrounds for input areas (`rgba(255,255,255,0.15)`)

**Typography:**
- System font stack: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- Size hierarchy: 14px header, 13px body, 11px labels

**Effects:**
- Backdrop blur: `backdrop-filter: blur(10px)`
- Box shadow: `box-shadow: 0 10px 40px rgba(0,0,0,0.3)`
- Border radius: 12px for container, 6px for inputs

**Animations:**
- Fade in on open: `fadeIn 0.2s ease-out`
- Transform: `translateY(-10px) scale(0.95)` to `translateY(0) scale(1)`

---

*Last updated: 2026-03-23*

# Alimail Reply Assistant - Agent Documentation

## Project Overview

An **AI-Powered Email Reply Generator** for Alimail Webmail (https://qiye.aliyun.com/alimail/).

The system helps users draft professional email replies by:
1. Extracting original email content from the Alimail compose page
2. Taking user bullet points/notes as input
3. Using an LLM (OpenAI, LiteLLM proxy, or local Ollama) to generate well-structured replies
4. Inserting the reply directly into the email editor or copying to clipboard

### Components
- **Backend Server**: FastAPI application that connects to LLM APIs
- **Browser Userscript**: Tampermonkey script that integrates with Alimail webmail's toolbar

---

## Project Structure

```
alimail-webmail-extension/
├── AGENTS.md                        # This file - agent reference
├── README.md                        # User-facing documentation
├── Dockerfile                       # Docker image definition (Python 3.11-slim base)
├── docker-compose.yml               # Docker Compose configuration
├── alimail-reply-assistant.user.js  # Tampermonkey userscript (~1200 lines)
└── server/
    ├── main.py                      # FastAPI application (~172 lines)
    ├── requirements.txt             # Python dependencies (4 packages)
    └── start.sh                     # Local development startup script (bash)
```

---

## Technology Stack

### Backend
| Component | Technology |
|-----------|------------|
| Language | Python 3.11 |
| Framework | FastAPI |
| Server | Uvicorn (ASGI) |
| HTTP Client | httpx (async) |
| Data Validation | Pydantic |

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

### Docker (Recommended for Production)

```bash
# Build and start the container in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the container
docker-compose down

# Rebuild after code changes
docker-compose up -d --build

# Check container status
docker-compose ps
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
4. Start the FastAPI server at `http://localhost:8000` with auto-reload (`--reload` flag)

### Manual Server Start (without start.sh)

```bash
cd server
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
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
    "language": "chinese"
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
| `GenerateReplyRequest` | Pydantic model for request validation |
| `GenerateReplyResponse` | Pydantic model for response |
| `build_system_prompt()` | Constructs the system prompt based on tone and language settings |
| `build_user_prompt()` | Formats the original email and user input for the LLM |
| `root()` | GET `/` - API info endpoint |
| `health()` | GET `/health` - Health check endpoint |
| `generate_reply()` | POST `/generate-reply` - Main endpoint that calls LLM API |

**Configuration via Environment Variables:**
- `LLM_URL`: Base URL of the LLM API (default: `http://host.docker.internal:4000`)
- `LLM_API_KEY`: API key for authentication (default: empty)
- `LLM_MODEL`: Model name to use (default: `gpt-4o`)

### Userscript (`alimail-reply-assistant.user.js`)

| Function | Description |
|----------|-------------|
| `THEMES` | Object defining 8 Alimail theme color schemes |
| `detectTheme()` | Detects current Alimail theme by analyzing page colors |
| `matchColorToTheme()` | Maps RGB colors to closest theme |
| `getCurrentThemeColors()` | Returns color scheme for current theme |
| `applyTheme()` | Applies theme colors to the overlay UI |
| `createOverlay()` | Creates the main 2-column UI panel |
| `createToolbarButton()` | Creates AI button in Alimail's toolbar (next to subscript button) |
| `removeToolbarButton()` | Removes toolbar button and separator |
| `extractOriginalEmail()` | Attempts to extract original email content from the page |
| `updateOriginalEmail()` | Updates the original email display in the overlay |
| `callGenerateAPI()` | Calls backend server using GM_xmlhttpRequest with fetch fallback |
| `generateReply()` | Orchestrates API call and displays loading/error states |
| `insertIntoEmailBody()` | Inserts generated text into Alimail's email editor iframe |
| `insertTextAtCursor()` | Helper to insert text at cursor position in contenteditable |
| `showResult()` | Displays generated reply with Copy and Insert buttons |
| `escapeHtml()` | Escapes HTML special characters |
| `isComposePage()` | Checks if current page is a compose/reply page |
| `init()` | Main initialization function, sets up observers and listeners |

---

## Code Style Guidelines

### Python
- Follow PEP 8
- Use type hints for function signatures and variables (e.g., `def build_system_prompt(tone: str, language: str) -> str:`)
- Use async/await for I/O operations (HTTP calls to LLM)
- Use Pydantic models for request/response validation
- Use httpx for async HTTP requests
- Use double quotes for strings consistently
- Maximum line length: follow PEP 8 (79/88 characters)

### JavaScript (Userscript)
- ES6+ syntax: arrow functions (`(e) => { ... }`), async/await, const/let (no var)
- Use `const` by default, `let` only when reassignment needed
- Use template literals for multi-line strings and interpolation
- Use `GM_xmlhttpRequest` for Tampermonkey compatibility
- Provide fetch API fallback for non-GM environments
- Event listeners: use arrow functions, remember `e.stopPropagation()`
- CSS class naming: use `alimail-` prefix to avoid conflicts

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
    "language": "chinese"
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
   - **AI** button appears in toolbar (next to X₂ subscript button)
   - Clicking opens the assistant panel with 2-column layout
   - Original email is extracted or shows helpful message
   - Generate button works (requires LLM server)
   - Copy button works
   - Insert to Email button works
   - Theme colors match Alimail's current theme
   - Close button and Escape key work
7. Check browser console (F12) for errors if not working

### Edge Cases to Test
- Original email extraction failures (various email formats)
- Empty user input
- LLM server not running (should show error)
- Long original emails (truncated preview)
- Rapid open/close of panel
- Navigation between different emails (SPA behavior)
- Theme changes while panel is open
- Mobile/responsive layout (768px breakpoint)

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
Set in `docker-compose.yml`:
```yaml
environment:
  - LLM_URL=https://api.openai.com/v1
  - LLM_API_KEY=sk-...
  - LLM_MODEL=gpt-4o
```

---

## Deployment

### Docker Deployment

The Docker setup:
- Uses `python:3.11-slim` base image
- Exposes port 8000
- Includes health check that queries `/health` endpoint
- Restarts automatically unless stopped (`restart: unless-stopped`)
- Uses `host.docker.internal` to connect to host's LLM server
- Supports environment variable overrides via `.env` or shell

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
- AI button not appearing: check if toolbar selector `.e_editor_toolbar` exists

---

## Design System

### UI Layout
- **2-Column Layout**: Left column for inputs (original email + key points), right column for generated reply
- **Responsive**: Stacks to single column on mobile (< 768px)
- **Modal Overlay**: Centered on screen, fixed position, z-index 999999

### Theme Support
The UI automatically detects and matches 8 Alimail themes:
- `black` - Dark theme (rgb: 58, 58, 58)
- `silver` - Light/bright theme (brightness > 200)
- `blue` - Blue theme (rgb: 74, 144, 217)
- `red` - Red theme (rgb: 217, 83, 79)
- `gold` - Gold theme (rgb: 196, 163, 90)
- `green` - Green theme (rgb: 61, 139, 90)
- `lakeBlue` - Lake blue theme (rgb: 58, 138, 165)
- `pink` - Pink theme (rgb: 214, 77, 122)
- `default` - Fallback

### Color Application
- Header background: theme primary color
- Buttons: theme primary color with hover state
- Copy button: theme-specific copy button color
- Text: White on colored backgrounds, dark on white backgrounds

### CSS Architecture
- All styles injected via `GM_addStyle` or fallback `<style>` element
- Class naming convention: `alimail-{component}-{modifier}`
- Scrollbar styling for WebKit browsers
- Smooth transitions (0.2s-0.3s) for hover effects
- Loading spinner with CSS animation (`@keyframes spin`)

---

## Key Implementation Details

### Email Editor Detection
The userscript attempts to find Alimail's email editor in this order:
1. `iframe.e_iframe.e_scroll` (primary Alimail compose editor)
2. `.e_editor iframe`
3. Other iframe selectors
4. Contenteditable elements in main document

### Theme Detection Strategy
1. Check `#app-body` background color first (theme control element)
2. Fallback to header selectors (`.header-container`, `.mail-header`, etc.)
3. Check for theme-specific CSS classes
4. Calculate color distance to known theme colors
5. Brightness check for silver theme (> 200)

### Toolbar Button Injection
- Finds subscript button (`sqm_339`, `_id="subscript"`, or `.e_i_subscript`)
- Inserts separator and AI button after it
- Button uses Alimail's native toolbar styling classes
- Click handler toggles overlay visibility

---

*Last updated: 2026-03-24*

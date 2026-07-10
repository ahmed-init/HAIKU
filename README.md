# HAIKU...!

This project is a simple FastAPI-based application that routes user queries to different AI specialists using Claude Haiku through OpenRouter. Instead of sending every request to a single prompt, the application first decides which specialist is best suited for the task and then generates a response using that specialist.

The project was built to demonstrate AI agent routing using tool calling while keeping the backend lightweight and easy to understand.

## Workflow

The request flows through the application in the following order:

1. The user enters a query in the web interface.
2. The frontend sends the request to the FastAPI backend (`POST /api/process`).
3. Claude Haiku analyzes the request and selects the most appropriate specialist.
4. The backend maps the selected tool to its corresponding Python function.
5. The specialist generates the response, which is returned to the frontend.

```text
Browser UI
      │
      ▼
FastAPI Backend
      │
      ▼
Claude Haiku (Tool Selection)
      │
      ▼
Selected Specialist
      │
      ▼
Response returned to the Browser
```

## Available Specialists

* **Coding Agent** – Generates and improves production-ready code.
* **Debugging Agent** – Identifies bugs, explains errors, and suggests fixes.
* **Technical Agent** – Answers questions related to architecture, system design, best practices, and technical concepts.
* **Default Agent** – Handles general computer science questions when no specialist is required.

## Project Structure

```text
app/
├── api/
│   └── routes.py          # API endpoint and agent routing
├── config/
│   └── settings.py        # Environment configuration
├── llm/
│   └── llm_client.py      # OpenRouter client
└── tools/                 # Specialist agent implementations

frontend/                  # Static chat interface
run_dev.py                 # Starts the development server
```

## Getting Started

### 1. Create a `.env` file

Create a `.env` file in the project root and add your OpenRouter API key.

```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

> **Note:** Keep this file private. It is excluded from version control using `.gitignore`.

### 2. Install the required packages

```bash
pip install -r requirements.txt
```

### 3. Run the application

Start the development server with:

```bash
python run_dev.py
```

Once the server is running, open the following URL in your browser:

```text
http://127.0.0.1:8001/static/index.html
```

## API Endpoint

### `POST /api/process`

Request body:

```json
{
  "user_message": "Help me debug this Python error",
  "code_context": "Optional relevant code"
}
```

The API returns:

* The selected specialist
* The reason for selecting that specialist
* The generated response

## Security

The `.env` file is excluded through `.gitignore`, so new API keys will not be committed accidentally.

If the API key has already been pushed to a Git repository, remove the file from Git tracking:

```bash
git rm --cached .env
```

After removing it, generate a new OpenRouter API key and replace the old one, since exposed keys should always be considered compromised.

// Configure marked.js for custom code block rendering
const renderer = new marked.Renderer();
renderer.code = function(codeOrObj, lang) {
    let code = typeof codeOrObj === 'object' ? codeOrObj.text : codeOrObj;
    let language = typeof codeOrObj === 'object' ? codeOrObj.lang : lang;
    language = language || 'text';
    
    // Clean up language names if necessary
    if (language === 'py') language = 'python';
    if (language === 'js') language = 'javascript';
    
    // Escape HTML tags to prevent rendering issues in raw display
    const escapedCode = code
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
        
    return `
    <div class="code-block-wrapper">
        <div class="code-header">
            <span class="code-lang">${language.toUpperCase()}</span>
            <button class="copy-code-btn" onclick="copyCode(this)">
                <i data-lucide="copy" style="width:12px;height:12px;"></i> Copy
            </button>
        </div>
        <pre><code class="language-${language}">${escapedCode}</code></pre>
    </div>`;
};
marked.use({ renderer });

// DOM Elements
const chatMessages = document.getElementById('chat-messages');
const welcomeScreen = document.getElementById('welcome-screen');
const userInput = document.getElementById('user-input');
const codeContextInput = document.getElementById('code-context-input');
const useContextCheckbox = document.getElementById('use-context-checkbox');
const contextChevron = document.getElementById('context-chevron');
const contextBody = document.getElementById('context-body');
const activeContextIndicator = document.getElementById('active-context-indicator');

// Global API Endpoint - fallback if served via file:// protocol
const API_BASE_URL = window.location.origin.startsWith('file') 
    ? 'http://127.0.0.1:8001' 
    : window.location.origin;

// Initialise Lucide Icons
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    checkBackendHealth();
    setupTextareaAutoResize();
    setupContextIndicator();
    
    // Poll API status every 10 seconds
    setInterval(checkBackendHealth, 10000);
});

// Auto-resize search/input textarea
function setupTextareaAutoResize() {
    userInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight - 10) + 'px';
    });
}

// Show/hide context indicators
function setupContextIndicator() {
    const updateIndicator = () => {
        const hasText = codeContextInput.value.trim().length > 0;
        const isChecked = useContextCheckbox.checked;
        if (hasText && isChecked) {
            activeContextIndicator.classList.remove('hidden');
        } else {
            activeContextIndicator.classList.add('hidden');
        }
    };
    codeContextInput.addEventListener('input', updateIndicator);
    useContextCheckbox.addEventListener('change', updateIndicator);
}

// Toggle code context panel collapsible element
function toggleContextPanel() {
    contextBody.classList.toggle('collapsed');
    if (contextBody.classList.contains('collapsed')) {
        contextChevron.style.transform = 'rotate(-90deg)';
    } else {
        contextChevron.style.transform = 'rotate(0deg)';
    }
}

// Starter query card handler
function setPrompt(text) {
    userInput.value = text;
    userInput.style.height = 'auto';
    userInput.style.height = (userInput.scrollHeight - 10) + 'px';
    userInput.focus();
}

// Key press listener (submit on Enter, new line on Shift+Enter)
function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

// Ping API to check if backend is online
async function checkBackendHealth() {
    const statusDot = document.querySelector('.status-indicator');
    const statusTxt = document.querySelector('.status-text');
    try {
        const response = await fetch(`${API_BASE_URL}/`);
        if (response.ok) {
            statusDot.className = 'status-indicator online';
            statusTxt.textContent = 'Connected';
            statusTxt.style.color = '#2ed573';
        } else {
            throw new Error();
        }
    } catch (e) {
        statusDot.className = 'status-indicator offline';
        statusTxt.textContent = 'Offline';
        statusTxt.style.color = '#ff4757';
    }
}

// Send user query to API
async function sendMessage() {
    const messageText = userInput.value.trim();
    if (!messageText) return;
    
    // Retrieve context if toggled and filled
    let contextText = null;
    if (useContextCheckbox.checked && codeContextInput.value.trim().length > 0) {
        contextText = codeContextInput.value.trim();
    }
    
    // Hide welcome panel on first message
    if (welcomeScreen) {
        welcomeScreen.remove();
    }
    
    // 1. Render User Message
    appendMessage(messageText, 'user');
    
    // Reset inputs
    userInput.value = '';
    userInput.style.height = 'auto';
    
    // 2. Render Loading/Typing Indicator
    const loaderId = appendLoader();
    scrollToBottom();
    
    try {
        // Send request payload
        const payload = {
            user_message: messageText,
            code_context: contextText
        };
        
        const response = await fetch(`${API_BASE_URL}/api/process`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            throw new Error(`Server returned error status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Remove loader
        removeLoader(loaderId);
        
        // 3. Render Agent Response
        appendBotResponse(data);
        
    } catch (error) {
        console.error('Error fetching API:', error);
        removeLoader(loaderId);
        appendMessage(`⚠️ **API Connection Error:** Unable to reach the agent workspace. Please make sure the backend server is running (\`python run_dev.py\`).\n\n*Error details: ${error.message}*`, 'bot-error');
    }
    
    scrollToBottom();
}

// Append plain message bubbles (user and errors)
function appendMessage(text, sender) {
    const bubble = document.createElement('div');
    bubble.className = `message-bubble ${sender}`;
    
    const content = document.createElement('div');
    content.className = 'message-content';
    
    if (sender === 'user') {
        content.textContent = text;
    } else {
        // Bot errors
        content.innerHTML = marked.parse(text);
    }
    
    bubble.appendChild(content);
    chatMessages.appendChild(bubble);
    
    // Re-trigger icon and prism rendering
    lucide.createIcons();
    Prism.highlightAllUnder(bubble);
}

// Append specialized multi-agent bot response bubbles
function appendBotResponse(data) {
    const { agent_selected, reasoning, response } = data;
    
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble bot';
    
    // Metadata Header (Agent type + badge)
    const meta = document.createElement('div');
    meta.className = 'message-meta';
    
    let agentDisplayName = 'No Agent';
    let agentClass = 'none';
    let agentIcon = 'help-circle';
    
    if (agent_selected === 'coding_tool') {
        agentDisplayName = 'Coding Agent';
        agentClass = 'coding';
        agentIcon = 'code-2';
    } else if (agent_selected === 'debugging_tool') {
        agentDisplayName = 'Debugging Agent';
        agentClass = 'debugging';
        agentIcon = 'bug-play';
    } else if (agent_selected === 'technical_tool') {
        agentDisplayName = 'Technical Agent';
        agentClass = 'technical';
        agentIcon = 'git-branch';
    }
    
    meta.innerHTML = `
        <div class="bot-info">
            <span class="active-agent-badge ${agentClass}">
                <i data-lucide="${agentIcon}" style="width:12px;height:12px;vertical-align:middle;margin-right:4px;"></i>
                ${agentDisplayName}
            </span>
        </div>
        <div class="response-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
    `;
    bubble.appendChild(meta);
    
    // Expandable Routing Reasoning
    if (reasoning) {
        const accordion = document.createElement('div');
        accordion.className = 'reasoning-accordion';
        
        const trigger = document.createElement('div');
        trigger.className = 'reasoning-trigger';
        trigger.onclick = () => toggleReasoning(accordion);
        trigger.innerHTML = `
            <span><i data-lucide="cpu" style="width:12px;height:12px;margin-right:6px;vertical-align:middle;"></i> Routing Reasoning</span>
            <i data-lucide="chevron-right" class="reasoning-chevron"></i>
        `;
        
        const body = document.createElement('div');
        body.className = 'reasoning-body collapsed';
        body.textContent = reasoning;
        
        accordion.appendChild(trigger);
        accordion.appendChild(body);
        bubble.appendChild(accordion);
    }
    
    // Main Markdown Response Content
    const content = document.createElement('div');
    content.className = 'message-content';
    content.innerHTML = marked.parse(response);
    bubble.appendChild(content);
    
    chatMessages.appendChild(bubble);
    
    // Highlight agents panel based on active tool running
    highlightActiveAgent(agent_selected);
    
    // Re-render icons and Prism styles
    lucide.createIcons();
    Prism.highlightAllUnder(bubble);
}

// Toggle router reasoning accordion
function toggleReasoning(accordionElement) {
    const body = accordionElement.querySelector('.reasoning-body');
    const chevron = accordionElement.querySelector('.reasoning-chevron');
    body.classList.toggle('collapsed');
    if (body.classList.contains('collapsed')) {
        chevron.style.transform = 'rotate(0deg)';
    } else {
        chevron.style.transform = 'rotate(90deg)';
    }
}

// Pulse/glow sidebar element corresponding to active agent
function highlightActiveAgent(agentId) {
    // Reset all
    document.querySelectorAll('.agent-item').forEach(item => {
        item.style.borderColor = 'var(--border-color)';
        item.style.boxShadow = 'none';
    });
    
    let target = null;
    if (agentId === 'coding_tool') target = document.getElementById('agent-coding');
    if (agentId === 'debugging_tool') target = document.getElementById('agent-debugging');
    if (agentId === 'technical_tool') target = document.getElementById('agent-technical');
    
    if (target) {
        target.style.borderColor = 'var(--accent-red)';
        target.style.boxShadow = '0 0 15px var(--accent-red-glow)';
        setTimeout(() => {
            target.style.borderColor = '';
            target.style.boxShadow = '';
        }, 3000);
    }
}

// Loader UI
function appendLoader() {
    const id = 'loader-' + Date.now();
    const loader = document.createElement('div');
    loader.className = 'loader-container';
    loader.id = id;
    loader.innerHTML = `
        <div class="typing-indicator">
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
        </div>
        <span class="loader-text">Routing query to specialist agent...</span>
    `;
    chatMessages.appendChild(loader);
    return id;
}

function removeLoader(id) {
    const loader = document.getElementById(id);
    if (loader) loader.remove();
}

// Scroll chat viewport to bottom
function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Copy raw text inside code block
async function copyCode(button) {
    const codeElement = button.closest('.code-block-wrapper').querySelector('code');
    const textToCopy = codeElement.textContent;
    
    try {
        await navigator.clipboard.writeText(textToCopy);
        button.innerHTML = '<i data-lucide="check" style="width:12px;height:12px;"></i> Copied!';
        button.style.borderColor = '#2ed573';
        button.style.color = '#2ed573';
        lucide.createIcons();
        
        setTimeout(() => {
            button.innerHTML = '<i data-lucide="copy" style="width:12px;height:12px;"></i> Copy';
            button.style.borderColor = '';
            button.style.color = '';
            lucide.createIcons();
        }, 2000);
    } catch (err) {
        console.error('Failed to copy text: ', err);
    }
}

// Reset/clear current chat screen
function clearChat() {
    // Keep sidebar
    chatMessages.innerHTML = '';
    
    // Add welcome container back
    const welcome = document.createElement('div');
    welcome.className = 'welcome-screen';
    welcome.id = 'welcome-screen';
    welcome.innerHTML = `
        <div class="welcome-glow"></div>
        <div class="welcome-icon"><i data-lucide="terminal"></i></div>
        <h1>GenAI Multi-Agent <span class="accent-text">Copilot</span></h1>
        <p class="subtitle">Ask coding, debugging, or system design questions. Claude will automatically route your request to the specialized agent.</p>
        
        <div class="prompt-grid">
            <div class="prompt-card" onclick="setPrompt('Write a clean and optimized implementation of Binary Search in Python with unit tests.')">
                <div class="card-icon coding"><i data-lucide="code-2"></i></div>
                <h3>Coding Task</h3>
                <p>"Write a clean and optimized implementation of Binary Search..."</p>
            </div>
            
            <div class="prompt-card" onclick="setPrompt('Analyze this error: ValueError: query must be an absolute path, but got RelativePath. Suggest a fix.')">
                <div class="card-icon debugging"><i data-lucide="bug-play"></i></div>
                <h3>Debugging Task</h3>
                <p>"Analyze this error: ValueError: query must be an absolute path..."</p>
            </div>
            
            <div class="prompt-card" onclick="setPrompt('How should I design a scalable notifications microservice that can handle 10,000 requests per second?')">
                <div class="card-icon technical"><i data-lucide="git-branch"></i></div>
                <h3>Architecture Task</h3>
                <p>"How should I design a scalable notifications microservice..."</p>
            </div>
        </div>
    `;
    chatMessages.appendChild(welcome);
    lucide.createIcons();
}

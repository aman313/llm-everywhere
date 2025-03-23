// Global widget state
let widgetVisible = false;
let isLoading = false;
let conversationContext = [];
let widgetInitialized = false;
let includePageContext = false;
let activeTab = 'chat'; // Default tab is chat
let extractedPageContent = '';
let isUsingSelection = false;
let modelsByProvider = {
  'openai': ['gpt-4o', 'gpt-4o-mini', 'gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo', 'o1'],
  'anthropic': ['claude-2', 'claude-instant']
};

// Create and inject the widget
function createWidget() {
  console.log('Creating widget');
  
  try {
    // First, check if widget already exists
    const existingWidget = document.querySelector('.llm-widget-container');
    if (existingWidget) {
      console.log('Widget already exists, not creating a new one');
      return existingWidget;
    }
    
    const widget = document.createElement('div');
    widget.className = 'llm-widget-container';
    widget.id = 'llm-widget-container';
    widget.style.display = 'none'; // Initially hidden
    
    widget.innerHTML = `
      <div class="llm-widget-header">
        <h3 class="llm-widget-title">LLM Everywhere</h3>
        <button class="llm-widget-close">&times;</button>
      </div>
      <div class="llm-widget-tabs">
        <button id="llm-tab-chat" class="llm-widget-tab-button active">Chat</button>
        <button id="llm-tab-context" class="llm-widget-tab-button">Page Context</button>
      </div>
      <div class="llm-widget-body">
        <div id="llm-tab-content-chat" class="llm-widget-tab-content active">
          <div class="llm-widget-response-header">
            <button id="llm-widget-clear" class="llm-widget-clear-button">Clear Chat</button>
          </div>
          <div class="llm-widget-response" id="llm-widget-response"></div>
          <div class="llm-widget-spinner" id="llm-widget-spinner"></div>
          <div class="llm-widget-error" id="llm-widget-error"></div>
        </div>
        <div id="llm-tab-content-context" class="llm-widget-tab-content">
          <div class="llm-widget-context-viewer" id="llm-widget-context-viewer">
            <p class="llm-widget-context-note">Toggle "Include page content as context" to see the text that will be sent to the LLM.</p>
          </div>
        </div>
        <div class="llm-widget-input-group">
          <div style="display: flex; gap: 8px; margin-bottom: 8px;">
            <select class="llm-widget-provider-select" id="llm-widget-provider">
              <option value="openai">OpenAI</option>
              <option value="anthropic">Claude (Anthropic)</option>
            </select>
            <select class="llm-widget-model-select" id="llm-widget-model">
              <!-- Models will be populated dynamically -->
            </select>
          </div>
          <div class="llm-widget-context-toggle">
            <input type="checkbox" id="llm-widget-include-context" class="llm-widget-checkbox">
            <label for="llm-widget-include-context">Include page content as context</label>
          </div>
          <div class="llm-widget-input-container">
            <textarea class="llm-widget-input" id="llm-widget-input" placeholder="Type your query..." rows="2"></textarea>
            <button class="llm-widget-submit" id="llm-widget-submit">Send</button>
          </div>
        </div>
      </div>
      <div class="llm-widget-footer">
        Press Esc to close
      </div>
    `;
    
    // Make sure to append to body
    if (document.body) {
      document.body.appendChild(widget);
      console.log('Widget appended to document body');
    } else {
      console.error('Document body not available for widget insertion');
      // Wait for DOM to be ready
      document.addEventListener('DOMContentLoaded', () => {
        document.body.appendChild(widget);
        console.log('Widget appended to document body after DOM loaded');
      });
    }
    
    widgetInitialized = true;
    
    // Add event listeners
    const closeBtn = widget.querySelector('.llm-widget-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', toggleWidget);
      console.log('Close button event listener attached');
    }
    
    const inputField = widget.querySelector('#llm-widget-input');
    if (inputField) {
      inputField.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendQuery();
        }
      });
      console.log('Input field event listener attached');
    }
    
    const submitBtn = widget.querySelector('#llm-widget-submit');
    if (submitBtn) {
      submitBtn.addEventListener('click', sendQuery);
      console.log('Submit button event listener attached');
    }
    
    // Add clear chat button event listener
    const clearBtn = widget.querySelector('#llm-widget-clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', clearConversation);
      console.log('Clear chat button event listener attached');
    }
    
    // Add tab switching functionality
    const tabButtons = widget.querySelectorAll('.llm-widget-tab-button');
    tabButtons.forEach(button => {
      button.addEventListener('click', function() {
        const tabId = this.id.replace('llm-tab-', '');
        switchTab(tabId);
      });
    });
    
    // Add provider change event to update models
    const providerSelect = widget.querySelector('#llm-widget-provider');
    if (providerSelect) {
      providerSelect.addEventListener('change', updateModelOptions);
      // Initialize model options based on default provider
      updateModelOptions();
      console.log('Provider select event listener attached');
    }
    
    // Add event listener for context toggle
    const contextToggle = widget.querySelector('#llm-widget-include-context');
    if (contextToggle) {
      contextToggle.addEventListener('change', function(e) {
        includePageContext = e.target.checked;
        console.log('Page context inclusion toggled:', includePageContext);
        
        if (includePageContext) {
          // Extract page content when toggle is enabled
          extractedPageContent = extractPageContent();
          updateContextViewer(extractedPageContent);
        } else {
          updateContextViewer('');
        }
      });
      console.log('Context toggle event listener attached');
    }
    
    // Close on Escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && widgetVisible) {
        toggleWidget();
      }
    });
    
    console.log('Widget successfully created and event listeners attached');
    return widget;
    
  } catch (error) {
    console.error('Error creating widget:', error);
    return null;
  }
}

// Switch between tabs
function switchTab(tabId) {
  activeTab = tabId;
  
  // Update tab button active states
  document.querySelectorAll('.llm-widget-tab-button').forEach(button => {
    if (button.id === `llm-tab-${tabId}`) {
      button.classList.add('active');
    } else {
      button.classList.remove('active');
    }
  });
  
  // Update tab content visibility
  document.querySelectorAll('.llm-widget-tab-content').forEach(content => {
    if (content.id === `llm-tab-content-${tabId}`) {
      content.classList.add('active');
    } else {
      content.classList.remove('active');
    }
  });
  
  // If switching to context tab and include context is enabled, update the context viewer
  if (tabId === 'context' && includePageContext) {
    if (!extractedPageContent) {
      extractedPageContent = extractPageContent();
    }
    updateContextViewer(extractedPageContent);
  }
}

// Update the context viewer with extracted content
function updateContextViewer(content) {
  const contextViewer = document.getElementById('llm-widget-context-viewer');
  if (contextViewer) {
    if (content) {
      const sourceIndicator = isUsingSelection 
        ? '<div class="llm-widget-context-source">Using selected text as context</div>'
        : '<div class="llm-widget-context-source">Using full page content as context</div>';
      
      contextViewer.innerHTML = `${sourceIndicator}<pre class="llm-widget-context-pre">${escapeHTML(content)}</pre>`;
    } else {
      contextViewer.innerHTML = `<p class="llm-widget-context-note">Toggle "Include page content as context" to see the text that will be sent to the LLM.</p>`;
    }
  }
}

// Escape HTML to prevent XSS when displaying page content
function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Clear the conversation history
function clearConversation() {
  console.log('Clearing conversation history');
  conversationContext = [];
  document.getElementById('llm-widget-response').innerHTML = '';
  document.getElementById('llm-widget-error').style.display = 'none';
}

// Get currently selected text on the page
function getSelectedText() {
  const selection = window.getSelection();
  if (selection && selection.toString().trim().length > 0) {
    return selection.toString().trim();
  }
  return null;
}

// Extract text content from the current page or selection
function extractPageContent() {
  try {
    // First check if there is any text selected on the page
    const selectedText = getSelectedText();
    
    if (selectedText) {
      isUsingSelection = true;
      const pageUrl = window.location.href;
      const pageTitle = document.title;
      
      return `
PAGE TITLE: ${pageTitle}
PAGE URL: ${pageUrl}
SELECTED CONTENT:
${selectedText}`;
    }
    
    // If no selection, fall back to extracting the whole page content
    isUsingSelection = false;
    
    // Clone the body to avoid modifying the actual page
    const bodyClone = document.body.cloneNode(true);
    
    // Remove script, style, svg, and other non-content elements
    const elementsToRemove = bodyClone.querySelectorAll('script, style, svg, noscript, iframe, img, video, audio, canvas, [aria-hidden="true"], .llm-widget-container');
    elementsToRemove.forEach(el => el.remove());
    
    // Improved text extraction that preserves some structure and ensures spaces between nodes
    let textContent = '';
    
    // Helper function to extract text with proper spacing
    function extractTextFromNode(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        // Add the text content with trailing space if not just whitespace
        const text = node.textContent.trim();
        if (text) {
          textContent += text + ' ';
        }
        return;
      }
      
      // Handle block elements by adding newlines
      const style = window.getComputedStyle(node);
      const isBlock = style.display === 'block' || 
                      style.display === 'flex' || 
                      style.display === 'grid' || 
                      node.tagName === 'BR' ||
                      node.tagName === 'P' || 
                      node.tagName === 'DIV' || 
                      node.tagName === 'LI';
      
      // Process children
      for (const child of node.childNodes) {
        if (child.nodeType === Node.ELEMENT_NODE || child.nodeType === Node.TEXT_NODE) {
          extractTextFromNode(child);
        }
      }
      
      // Add newline after block elements
      if (isBlock && !textContent.endsWith('\n')) {
        textContent += '\n';
      }
    }
    
    // Start extraction from body
    const validElements = bodyClone.querySelectorAll('body, article, main, div, section, p, h1, h2, h3, h4, h5, h6, span, a, li, td, th');
    validElements.forEach(node => {
      // Only process top-level elements to avoid duplication
      if (!node.parentNode || node.parentNode.nodeName === 'BODY') {
        extractTextFromNode(node);
      }
    });
    
    // Clean up the text: remove excessive whitespace and limit length
    let cleanText = textContent
      .replace(/\s+/g, ' ')  // Replace multiple spaces with a single space
      .replace(/\n\s+/g, '\n')  // Remove spaces after newlines
      .replace(/\n+/g, '\n')  // Replace multiple newlines with a single newline
      .trim()
      .substring(0, 5000); // Limit to 5000 characters to avoid token limits
    
    // Add the page URL and title
    const pageUrl = window.location.href;
    const pageTitle = document.title;
    
    return `
PAGE TITLE: ${pageTitle}
PAGE URL: ${pageUrl}
PAGE CONTENT:
${cleanText}`;
  } catch (error) {
    console.error('Error extracting page content:', error);
    return 'Error extracting page content.';
  }
}

// Update model dropdown options based on selected provider
function updateModelOptions() {
  const providerSelect = document.getElementById('llm-widget-provider');
  const modelSelect = document.getElementById('llm-widget-model');
  
  if (!providerSelect || !modelSelect) return;
  
  const provider = providerSelect.value;
  const models = modelsByProvider[provider] || [];
  
  // Clear current options
  modelSelect.innerHTML = '';
  
  // Add new options
  models.forEach(model => {
    const option = document.createElement('option');
    option.value = model;
    option.textContent = model;
    modelSelect.appendChild(option);
  });
  
  // Select first model by default
  if (models.length > 0) {
    modelSelect.value = models[0];
  }
}

// Toggle widget visibility
function toggleWidget() {
  console.log('Toggle widget called, current visibility:', widgetVisible);
  
  try {
    // Get the widget or create it if it doesn't exist
    let widget = document.querySelector('.llm-widget-container');
    if (!widget) {
      console.log('Widget not found in DOM, creating it');
      widget = createWidget();
      
      if (!widget) {
        console.error('Failed to create widget');
        return;
      }
    }
    
    // Toggle visibility
    widgetVisible = !widgetVisible;
    
    if (widgetVisible) {
      console.log('Making widget visible');
      
      // Try multiple display methods to ensure visibility
      widget.style.display = 'flex';
      widget.classList.add('visible');
      
      // Force repaint
      void widget.offsetWidth;
      
      // Programmatically check if widget is visible
      const computedStyle = window.getComputedStyle(widget);
      console.log('Widget computed style:', 
                  'display:', computedStyle.display, 
                  'visibility:', computedStyle.visibility,
                  'opacity:', computedStyle.opacity);
      
      // Ensure input gets focus
      setTimeout(() => {
        const inputField = document.getElementById('llm-widget-input');
        if (inputField) {
          inputField.focus();
          console.log('Input field focused');
        } else {
          console.error('Could not find input field to focus');
        }
      }, 100);
      
      // Check if API keys are set
      checkApiKeys();
      
      // Try re-inserting the widget if it's not visible
      setTimeout(() => {
        if (!isWidgetVisibleInDOM()) {
          console.log('Widget not visible after timeout, trying to re-insert');
          document.body.removeChild(widget);
          document.body.appendChild(widget);
          widget.style.display = 'flex';
        }
      }, 500);
      
      // If widget is being shown, check for selected text immediately
      if (includePageContext) {
        extractedPageContent = extractPageContent();
        updateContextViewer(extractedPageContent);
      }
      
    } else {
      console.log('Hiding widget');
      widget.style.display = 'none';
      widget.classList.remove('visible');
    }
  } catch (error) {
    console.error('Error in toggleWidget:', error);
  }
}

// Helper function to check if widget is actually visible
function isWidgetVisibleInDOM() {
  const widget = document.querySelector('.llm-widget-container');
  if (!widget) return false;
  
  const rect = widget.getBoundingClientRect();
  const isVisible = rect.width > 0 && rect.height > 0;
  console.log('Widget visibility check:', isVisible, 'Dimensions:', rect.width, 'x', rect.height);
  return isVisible;
}

// Check if API keys are set
function checkApiKeys() {
  chrome.storage.local.get(['openaiApiKey', 'anthropicApiKey'], function(data) {
    const provider = document.getElementById('llm-widget-provider').value;
    const responseArea = document.getElementById('llm-widget-response');
    
    if ((provider === 'openai' && !data.openaiApiKey) || 
        (provider === 'anthropic' && !data.anthropicApiKey)) {
      responseArea.innerHTML = `
        <div class="llm-widget-no-keys">
          <p>You need to set up your API keys first.</p>
          <p>Go to the extension options by right-clicking the extension icon and selecting "Options".</p>
        </div>
      `;
    }
  });
}

// Send query to selected LLM
async function sendQuery() {
  const provider = document.getElementById('llm-widget-provider').value;
  const model = document.getElementById('llm-widget-model').value;
  const query = document.getElementById('llm-widget-input').value.trim();
  
  if (!query) return;
  
  const responseArea = document.getElementById('llm-widget-response');
  const spinner = document.getElementById('llm-widget-spinner');
  const errorArea = document.getElementById('llm-widget-error');
  
  // Start loading state
  isLoading = true;
  spinner.style.display = 'block';
  errorArea.style.display = 'none';
  document.getElementById('llm-widget-submit').disabled = true;
  
  try {
    // Get API keys and settings from storage
    const data = await chrome.storage.local.get([
      'openaiApiKey', 'openaiTemperature', 'openaiMaxTokens',
      'anthropicApiKey', 'anthropicTemperature', 'anthropicMaxTokens'
    ]);
    
    // Prepare the query with context if enabled
    let queryWithContext = query;
    if (includePageContext) {
      // Check for selected text again at the time of sending the query
      // This allows the user to select text after the widget is open
      extractedPageContent = extractPageContent();
      
      const contextSource = isUsingSelection ? "selected text" : "webpage content";
      queryWithContext = `The following is ${contextSource} from the current webpage. Please use this as context for answering my query, but only if relevant.\n\n${extractedPageContent}\n\nMy query is: ${query}`;
    }
    
    let response;
    
    if (provider === 'openai') {
      if (!data.openaiApiKey) {
        throw new Error('OpenAI API key is not set. Please configure it in the extension options.');
      }
      // Use model selected in the widget
      response = await callOpenAI(queryWithContext, {...data, openaiModel: model});
    } else if (provider === 'anthropic') {
      if (!data.anthropicApiKey) {
        throw new Error('Anthropic API key is not set. Please configure it in the extension options.');
      }
      // Use model selected in the widget
      response = await callAnthropic(queryWithContext, {...data, anthropicModel: model});
    }
    
    // Switch to chat tab after getting a response
    switchTab('chat');
    
    // Display response (store original query without the context for display)
    conversationContext.push({ role: 'user', content: query });
    conversationContext.push({ role: 'assistant', content: response });
    
    // Update the response area with the full conversation
    responseArea.innerHTML = formatConversation();
    
    // Clear input
    document.getElementById('llm-widget-input').value = '';
    
  } catch (error) {
    errorArea.textContent = `Error: ${error.message}`;
    errorArea.style.display = 'block';
  } finally {
    // End loading state
    isLoading = false;
    spinner.style.display = 'none';
    document.getElementById('llm-widget-submit').disabled = false;
  }
}

// Format the conversation history
function formatConversation() {
  let html = '';
  
  conversationContext.forEach((message, index) => {
    if (index % 2 === 0) { // User message
      html += `<div style="font-weight: bold; margin-top: 10px;">You: </div>`;
      html += `<div style="margin-bottom: 10px;">${message.content}</div>`;
    } else { // Assistant message
      html += `<div style="font-weight: bold; margin-top: 10px;">Assistant: </div>`;
      html += `<div style="margin-bottom: 10px;">${message.content}</div>`;
    }
  });
  
  return html;
}

// Call OpenAI API
async function callOpenAI(query, data) {
  const messages = [
    ...conversationContext.map(msg => ({ role: msg.role, content: msg.content })),
    { role: 'user', content: query }
  ];
  
  // Create the request body based on the model
  const requestBody = {
    model: data.openaiModel || 'gpt-3.5-turbo',
    messages: messages,
    temperature: data.openaiTemperature || 0.7
  };
  
  // Add the appropriate tokens parameter based on model
  if (data.openaiModel === 'o1') {
    // o1 model uses max_completion_tokens instead of max_tokens
    requestBody.max_completion_tokens = data.openaiMaxTokens || 1000;
  } else {
    // Other models use max_tokens
    requestBody.max_tokens = data.openaiMaxTokens || 1000;
  }
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${data.openaiApiKey}`
    },
    body: JSON.stringify(requestBody)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to get response from OpenAI');
  }
  
  const result = await response.json();
  return result.choices[0].message.content;
}

// Call Anthropic API
async function callAnthropic(query, data) {
  const prompt = conversationContext.reduce((acc, msg) => {
    if (msg.role === 'user') {
      return acc + '\n\nHuman: ' + msg.content;
    } else {
      return acc + '\n\nAssistant: ' + msg.content;
    }
  }, '') + '\n\nHuman: ' + query + '\n\nAssistant:';
  
  const response = await fetch('https://api.anthropic.com/v1/complete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': data.anthropicApiKey
    },
    body: JSON.stringify({
      prompt: prompt,
      model: data.anthropicModel || 'claude-2',
      max_tokens_to_sample: data.anthropicMaxTokens || 1000,
      temperature: data.anthropicTemperature || 0.7,
      stop_sequences: ["\n\nHuman:"]
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to get response from Anthropic');
  }
  
  const result = await response.json();
  return result.completion;
}

// Listen for command from background.js
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('Content script received message:', request);
  
  if (request.action === 'toggleWidget') {
    console.log('Toggling widget from message');
    toggleWidget();
    
    // Wait a bit to check if widget is visible before responding
    setTimeout(() => {
      const isVisible = isWidgetVisibleInDOM();
      console.log('Widget visible check before response:', isVisible);
      sendResponse({success: true, widgetVisible: widgetVisible, actuallyVisible: isVisible});
    }, 100);
    
    return true; // Keep the messaging channel open for the async response
  }
});

// Create a simple debug widget that's definitely visible
function createDebugWidget() {
  const debugWidget = document.createElement('div');
  debugWidget.style.position = 'fixed';
  debugWidget.style.bottom = '10px';
  debugWidget.style.left = '10px';
  debugWidget.style.backgroundColor = 'red';
  debugWidget.style.color = 'white';
  debugWidget.style.padding = '5px';
  debugWidget.style.zIndex = '2147483647';
  debugWidget.textContent = 'LLM Debug Widget - Click to toggle main widget';
  debugWidget.style.cursor = 'pointer';
  debugWidget.style.borderRadius = '4px';
  
  debugWidget.addEventListener('click', () => {
    toggleWidget();
  });
  
  document.body.appendChild(debugWidget);
  console.log('Debug widget created');
}

// Initialize the extension with debug features
console.log('LLM Everywhere content script loaded');
//createDebugWidget(); // Create a visible debug widget to help troubleshoot

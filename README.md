# LLM Everywhere - Chrome Extension

A minimal Chrome extension that gives you access to different Large Language Models (LLMs) like OpenAI's GPT models and Anthropic's Claude from any web page with just a keyboard shortcut.

## Features

- Access LLMs from any webpage via a small, clean widget
- Support for multiple LLM providers:
  - OpenAI (GPT-3.5, GPT-4)
  - Anthropic (Claude)
- Smart context inclusion:
  - Selected text is used as context if available
  - Falls back to page content when nothing is selected
  - Preview the extracted context before sending
- Local API key storage (never sent to any third-party servers)
- Customizable model settings
- Simple and clean user interface
- Conversation tracking with ability to clear chat history
- User-friendly controls with tabbed interface

## Installation

### Loading the Extension in Developer Mode

1. Clone or download this repository to your local machine

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode" by toggling the switch in the top-right corner

4. Click "Load unpacked" and select the directory containing the extension files

5. The extension should now appear in your Chrome toolbar

6. Make sure to create the `icons` folder and generate the icon using the `generate_icons.html` file

### Setting Up the Keyboard Shortcut

1. Navigate to `chrome://extensions/shortcuts`

2. Find "LLM Everywhere" in the list

3. Set or change the shortcut for "Toggle LLM Widget" (the default is Ctrl+Shift+Space)

## Configuration

### Setting Up API Keys

1. Right-click on the extension icon in the toolbar and select "Options"

2. Enter your API keys:
   - For OpenAI: Enter your OpenAI API key (starts with "sk-")
   - For Anthropic: Enter your Anthropic API key (starts with "sk-ant-")

3. Adjust any advanced settings if needed (temperature, max tokens, etc.)

4. Click "Save Settings"

## Usage

1. Navigate to any webpage

2. Press the keyboard shortcut (default: Ctrl+Shift+Space) to open the LLM widget
   - Alternatively, you can also click on the extension icon in the toolbar

3. Select your preferred LLM provider and model from the dropdowns

4. For context-aware queries:
   - Select text on the page before or after opening the widget
   - Check "Include page content as context" to use the selected text
   - If no text is selected, the entire page content will be used
   - You can preview what will be sent in the "Page Context" tab

5. Type your query in the text input

6. Press Enter or click "Send" to submit your query

7. View the response in the scrollable area under the "Chat" tab

8. To clear the conversation history, click the "Clear Chat" button

9. Close the widget by clicking the X button, pressing Escape, or using the keyboard shortcut again

## Troubleshooting

### Widget Doesn't Open with Keyboard Shortcut

1. Make sure the keyboard shortcut is set correctly at `chrome://extensions/shortcuts`

2. Try clicking on the extension icon in the toolbar instead

3. Check the console for any error messages (Right-click > Inspect > Console)

4. Refresh the page and try again

5. If still not working, try reloading the extension or restarting Chrome

### Other Issues

- If you get an error about missing API keys, check your settings in the Options page
- If responses are not coming through, verify that your API keys are valid and have sufficient quota

## Privacy

This extension:
- Does not collect any user data
- Does not send data to any servers except the respective LLM provider APIs
- Stores API keys locally on your device only
- Does not track your browsing history or activities

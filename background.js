// Listen for keyboard shortcut
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle-llm-widget') {
    console.log('Keyboard shortcut triggered: toggle-llm-widget');
    
    // Get the current active tab
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab) {
        console.error('No active tab found');
        return;
      }
      
      console.log('Sending toggleWidget message to tab:', tab.id);
      
      // Check if we can access the tab
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            return true; // Just checking if we can execute scripts in this tab
          }
        });
        
        // Now send a message to the content script
        chrome.tabs.sendMessage(tab.id, { action: 'toggleWidget' }, (response) => {
          const lastError = chrome.runtime.lastError;
          
          if (lastError) {
            console.error('Could not send message to content script:', lastError.message);
            
            // Content script might not be loaded, so inject it
            chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ['content.js']
            }).then(() => {
              console.log('Content script injected');
              
              // Also inject the CSS
              chrome.scripting.insertCSS({
                target: { tabId: tab.id },
                files: ['widget.css']
              }).then(() => {
                console.log('Widget CSS injected');
                
                // Try sending the message again after injecting
                setTimeout(() => {
                  chrome.tabs.sendMessage(tab.id, { action: 'toggleWidget' });
                }, 200);
              });
            }).catch(err => {
              console.error('Failed to inject content script:', err);
            });
          } else if (response) {
            console.log('Response from content script:', response);
          }
        });
      } catch (error) {
        console.error('Cannot access tab:', error);
        
        // This might be due to a restricted page, show a notification
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'LLM Everywhere',
          message: 'Cannot open widget on this page due to browser restrictions.'
        });
      }
    } catch (error) {
      console.error('Error in command handler:', error);
    }
  }
});

// Add an action click handler as an alternative way to toggle the widget
chrome.action.onClicked.addListener(async (tab) => {
  console.log('Extension icon clicked, toggling widget');
  
  try {
    // First, try to execute a simple script to check if we have access to this page
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        return true;
      }
    });
    
    // Send message to toggle the widget
    chrome.tabs.sendMessage(tab.id, { action: 'toggleWidget' }, (response) => {
      const lastError = chrome.runtime.lastError;
      if (lastError) {
        console.error('Could not send message to content script:', lastError.message);
        
        // Inject content script and CSS
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        }).then(() => {
          chrome.scripting.insertCSS({
            target: { tabId: tab.id },
            files: ['widget.css']
          }).then(() => {
            setTimeout(() => {
              chrome.tabs.sendMessage(tab.id, { action: 'toggleWidget' });
            }, 200);
          });
        });
      }
    });
  } catch (error) {
    console.error('Cannot access this tab:', error);
    
    // Show notification for restricted pages
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'LLM Everywhere',
      message: 'Cannot open widget on this page due to browser restrictions.'
    });
  }
});

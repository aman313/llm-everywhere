document.addEventListener('DOMContentLoaded', function() {
  // Load saved settings
  chrome.storage.local.get([
    'openaiApiKey',
    'openaiModel',
    'openaiTemperature',
    'openaiMaxTokens',
    'anthropicApiKey',
    'anthropicModel',
    'anthropicTemperature',
    'anthropicMaxTokens'
  ], function(data) {
    // OpenAI settings
    if (data.openaiApiKey) document.getElementById('openai-api-key').value = data.openaiApiKey;
    if (data.openaiModel) document.getElementById('openai-model').value = data.openaiModel;
    if (data.openaiTemperature) document.getElementById('openai-temperature').value = data.openaiTemperature;
    if (data.openaiMaxTokens) document.getElementById('openai-max-tokens').value = data.openaiMaxTokens;
    
    // Update the token parameter label based on selected model
    updateTokenLabel();
    
    // Anthropic settings
    if (data.anthropicApiKey) document.getElementById('anthropic-api-key').value = data.anthropicApiKey;
    if (data.anthropicModel) document.getElementById('anthropic-model').value = data.anthropicModel;
    if (data.anthropicTemperature) document.getElementById('anthropic-temperature').value = data.anthropicTemperature;
    if (data.anthropicMaxTokens) document.getElementById('anthropic-max-tokens').value = data.anthropicMaxTokens;
  });
  
  // Add event listener for model change to update token label
  document.getElementById('openai-model').addEventListener('change', updateTokenLabel);
  
  // Function to update token parameter label based on selected model
  function updateTokenLabel() {
    const model = document.getElementById('openai-model').value;
    const tokenLabel = document.getElementById('openai-max-tokens-label');
    
    if (tokenLabel) {
      if (model === 'o1') {
        tokenLabel.textContent = 'Max Completion Tokens';
      } else {
        tokenLabel.textContent = 'Max Tokens';
      }
    }
  }
  
  // Save settings
  document.getElementById('save-btn').addEventListener('click', function() {
    // Validate inputs
    const openaiTemperature = parseFloat(document.getElementById('openai-temperature').value);
    const openaiMaxTokens = parseInt(document.getElementById('openai-max-tokens').value);
    const anthropicTemperature = parseFloat(document.getElementById('anthropic-temperature').value);
    const anthropicMaxTokens = parseInt(document.getElementById('anthropic-max-tokens').value);
    
    if (isNaN(openaiTemperature) || openaiTemperature < 0 || openaiTemperature > 2) {
      alert('OpenAI temperature must be between 0 and 2');
      return;
    }
    
    if (isNaN(anthropicTemperature) || anthropicTemperature < 0 || anthropicTemperature > 1) {
      alert('Anthropic temperature must be between 0 and 1');
      return;
    }
    
    if (isNaN(openaiMaxTokens) || openaiMaxTokens <= 0) {
      alert('OpenAI max tokens must be a positive number');
      return;
    }
    
    if (isNaN(anthropicMaxTokens) || anthropicMaxTokens <= 0) {
      alert('Anthropic max tokens must be a positive number');
      return;
    }
    
    // Save to storage
    chrome.storage.local.set({
      'openaiApiKey': document.getElementById('openai-api-key').value,
      'openaiModel': document.getElementById('openai-model').value,
      'openaiTemperature': openaiTemperature,
      'openaiMaxTokens': openaiMaxTokens,
      'anthropicApiKey': document.getElementById('anthropic-api-key').value,
      'anthropicModel': document.getElementById('anthropic-model').value,
      'anthropicTemperature': anthropicTemperature,
      'anthropicMaxTokens': anthropicMaxTokens
    }, function() {
      // Show saved status
      const saveStatus = document.getElementById('save-status');
      saveStatus.style.display = 'block';
      setTimeout(function() {
        saveStatus.style.display = 'none';
      }, 2000);
    });
  });
});

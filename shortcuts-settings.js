// Cross-browser compatibility
const browserAPI = (() => {
  if (typeof browser !== 'undefined') {
    return browser;
  }
  if (typeof chrome !== 'undefined') {
    return chrome;
  }
  throw new Error('Neither browser nor chrome API is available');
})();

function getMessage(key, substitutions = null) {
  return browserAPI.i18n.getMessage(key, substitutions);
}

// Apply localization to all elements with data-i18n attribute
function applyLocalization() {
  const elements = document.querySelectorAll('[data-i18n]');
  elements.forEach(element => {
    const key = element.getAttribute('data-i18n');
    const message = getMessage(key);
    if (message) {
      // For HTML content that includes <br/> and <strong> tags
      if (element.innerHTML.includes('<br')) {
        element.innerHTML = message;
      } else {
        element.textContent = message;
      }
    }
  });
}

// Color definitions matching background.js
const COLORS = [
  { id: 'yellow', nameKey: 'yellowColor', color: '#FFFF00', commandName: 'highlight_yellow' },
  { id: 'green', nameKey: 'greenColor', color: '#AAFFAA', commandName: 'highlight_green' },
  { id: 'blue', nameKey: 'blueColor', color: '#AAAAFF', commandName: 'highlight_blue' },
  { id: 'pink', nameKey: 'pinkColor', color: '#FFAAFF', commandName: 'highlight_pink' },
  { id: 'orange', nameKey: 'orangeColor', color: '#FFAA55', commandName: 'highlight_orange' }
];

// Detect browser
const isFirefox = typeof browser !== 'undefined' && typeof browser.runtime !== 'undefined';
const isChrome = typeof chrome !== 'undefined' && typeof chrome.runtime !== 'undefined' && !isFirefox;

// Display shortcuts list
async function displayShortcuts() {
  const shortcutsList = document.getElementById('shortcuts-list');
  shortcutsList.innerHTML = '';

  try {
    // Get all commands
    const commands = await browserAPI.commands.getAll();
    
    // Create shortcut items for each color
    COLORS.forEach(color => {
      const command = commands.find(cmd => cmd.name === color.commandName);
      const shortcutItem = document.createElement('div');
      shortcutItem.className = 'shortcut-item';
      
      const label = document.createElement('div');
      label.className = 'shortcut-label';
      label.textContent = getMessage(color.nameKey);
      
      const value = document.createElement('div');
      value.className = 'shortcut-value';
      if (command && command.shortcut) {
        value.textContent = command.shortcut;
      } else {
        value.textContent = getMessage('notSet') || 'Not set';
        value.classList.add('not-set');
      }
      
      shortcutItem.appendChild(label);
      shortcutItem.appendChild(value);
      
      // Note: Chrome 117+ supports chrome.commands.update()
      // For now, we'll just display the shortcuts and provide a link to chrome://extensions/shortcuts
      
      shortcutsList.appendChild(shortcutItem);
    });
  } catch (error) {
    console.error('Error loading shortcuts:', error);
    shortcutsList.innerHTML = '<p>Error loading shortcuts. Please try again.</p>';
  }
}

// Initialize the page
async function init() {
  // Apply localization
  applyLocalization();
  
  // Display appropriate info box based on browser
  if (isChrome) {
    document.getElementById('chrome-info').style.display = 'block';
    document.getElementById('open-shortcuts').style.display = 'inline-block';
    
    // Check if chrome.commands.update is available (Chrome 117+)
    if (!browserAPI.commands.update) {
      document.getElementById('update-notice').style.display = 'block';
    }
  } else if (isFirefox) {
    document.getElementById('firefox-info').style.display = 'block';
  }
  
  // Display shortcuts
  await displayShortcuts();
}

// Open Chrome shortcuts page (only works in Chrome)
document.getElementById('open-shortcuts').addEventListener('click', () => {
  if (isChrome) {
    browserAPI.tabs.create({ url: 'chrome://extensions/shortcuts' });
  }
});

// Back button
document.getElementById('back-button').addEventListener('click', () => {
  window.close();
});

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

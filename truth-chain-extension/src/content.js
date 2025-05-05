// Content script - injectes into Medium and Quora pages
console.log('Content Provenance Extension loaded');

// Check if we're on a content creation page
function isContentCreationPage() {
  // For Medium
  if (window.location.hostname.includes('medium.com')) {
    return window.location.pathname.includes('/new-story') || 
           window.location.pathname.includes('/stories/drafts') ||
           window.location.pathname.includes('/p/');
  }
  // For Quora
  if (window.location.hostname.includes('quora.com')) {
    return document.querySelector('.answer_form') !== null ||
           document.querySelector('.AnswerEditorForm') !== null;
  }
  return false;
}

// Add the registration button to the page
function addRegistrationButton() {
  // Determine which platform we're on and find the appropriate container
  let container;
  
  if (window.location.hostname.includes('medium.com')) {
    // For Medium, look for the editor toolbar
    container = document.querySelector('.metabar-inner') || 
                document.querySelector('.ef ez');  // Try different selectors
    
    if (!container) {
      // If not found, try again later
      setTimeout(addRegistrationButton, 1000);
      return;
    }
  } else if (window.location.hostname.includes('quora.com')) {
    // For Quora, look for the answer form buttons
    container = document.querySelector('.answer_form_buttons') ||
                document.querySelector('.AnswerEditorForm');
    
    if (!container) {
      setTimeout(addRegistrationButton, 1000);
      return;
    }
  }

  if (container && !document.getElementById('provenance-register-btn')) {
    // Create button
    const button = document.createElement('button');
    button.id = 'provenance-register-btn';
    button.innerText = 'Register Provenance';
    button.style.cssText = 'background-color: #5546FF; color: white; border: none; border-radius: 4px; padding: 8px 16px; margin-left: 8px; cursor: pointer;';
    
    // Add click event
    button.addEventListener('click', handleRegistration);
    
    // Add to container
    container.appendChild(button);
    console.log('Provenance register button added');
  }
}

// Handle the registration process
async function handleRegistration() {
  try {
    // Extract the content
    const content = extractContent();
    console.log('Content extracted:', content);
    
    // Send message to background script to handle the blockchain interaction
    chrome.runtime.sendMessage({
      action: 'registerContent',
      content: content
    }, function(response) {
      if (response && response.success) {
        alert('Content registered successfully!\nTransaction ID: ' + response.txId);
      } else {
        alert('Failed to register content: ' + (response ? response.error : 'Unknown error'));
      }
    });
  } catch (error) {
    console.error('Error registering content:', error);
    alert('Error registering content: ' + error.message);
  }
}

// Extract content based on the platform
function extractContent() {
  let title = '';
  let content = '';
  let contentType = 'article';
  
  if (window.location.hostname.includes('medium.com')) {
    // Extract from Medium
    // Medium's editor structure may vary, so try multiple selectors
    const titleElement = document.querySelector('[data-default-value="Title"]') || 
                         document.querySelector('h1[data-testid="storyTitle-editor"]') ||
                         document.querySelector('h1.pw-post-title');
                         
    title = titleElement ? titleElement.textContent.trim() : 'Untitled';
    
    // Try to get content paragraphs
    const contentElements = document.querySelectorAll('article p') || 
                           document.querySelectorAll('.section-content p');
                           
    if (contentElements && contentElements.length > 0) {
      contentElements.forEach(element => {
        content += element.textContent.trim() + '\n\n';
      });
    } else {
      // Fallback: try to get all content from the editor
      const editorContent = document.querySelector('.section-content');
      content = editorContent ? editorContent.textContent.trim() : '';
    }
  } else if (window.location.hostname.includes('quora.com')) {
    // Extract from Quora
    const questionElement = document.querySelector('.question_text') || 
                           document.querySelector('.puppeteer_test_question_title');
    title = questionElement ? questionElement.textContent.trim() : 'Untitled Question';
    
    const editorContent = document.querySelector('.answer_editor') || 
                         document.querySelector('.AnswerEditorForm');
    content = editorContent ? editorContent.textContent.trim() : '';
    contentType = 'answer';
  }
  
  return {
    title,
    content,
    contentType,
    url: window.location.href,
    timestamp: new Date().toISOString(),
    source: window.location.hostname.includes('medium.com') ? 'medium' : 'quora'
  };
}

// Run when the page loads
function initialize() {
  if (isContentCreationPage()) {
    // We need to wait for the editor to fully load
    setTimeout(addRegistrationButton, 1500);
  }
}

// Initialize when the content script loads
initialize();

// Also watch for navigation changes (for single-page apps)
let lastUrl = location.href; 
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    initialize();
  }
}).observe(document, {subtree: true, childList: true});
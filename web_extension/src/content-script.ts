// @ts-nocheck

console.log('TruthChain content script loaded on:', window.location.hostname);

interface ContentData {
  title: string;
  content: string;
  url: string;
  hostname: string;
  timestamp: string;
}

interface MessageResponse {
  success: boolean;
  data?: {
    isRegistered?: boolean;
    hash?: string;
    registration?: any;
  };
  error?: string;
}

function injectVerificationUI(): void {
  if (document.getElementById('truthchain-verification-ui')) {
    return;
  }
  
  const verifyButton = document.createElement('button');
  verifyButton.id = 'truthchain-verify-btn';
  verifyButton.textContent = '🔍 Verify with TruthChain';
  verifyButton.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    background: #667eea;
    color: white;
    border: none;
    padding: 10px 15px;
    border-radius: 5px;
    cursor: pointer;
    font-size: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  `;
  
  verifyButton.addEventListener('click', () => {
    verifyCurrentContent();
  });
  
  document.body.appendChild(verifyButton);
  
  if (isContentCreationPage()) {
    const registerButton = document.createElement('button');
    registerButton.id = 'truthchain-register-btn';
    registerButton.textContent = '📝 Register Content';
    registerButton.style.cssText = `
      position: fixed;
      top: 70px;
      right: 20px;
      z-index: 10000;
      background: #764ba2;
      color: white;
      border: none;
      padding: 10px 15px;
      border-radius: 5px;
      cursor: pointer;
      font-size: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    `;
    
    registerButton.addEventListener('click', () => {
      registerCurrentContent();
    });
    
    document.body.appendChild(registerButton);
  }
}

function isContentCreationPage(): boolean {
  const pathname = window.location.pathname;
  
  return (
    pathname.includes('/write') ||
    pathname.includes('/new') ||
    pathname.includes('/compose') ||
    pathname.includes('/create') ||
    pathname.includes('/edit') ||
    document.querySelector('[contenteditable="true"]') !== null
  );
}

function extractPageContent(): ContentData {
  return {
    title: document.title,
    content: document.body.innerText.slice(0, 2000),
    url: window.location.href,
    hostname: window.location.hostname,
    timestamp: new Date().toISOString()
  };
}

function verifyCurrentContent(): void {
  const content = extractPageContent();
  
  chrome.runtime.sendMessage({
    action: 'verifyContent',
    content: content
  }, (response: MessageResponse) => {
    if (response && response.success) {
      showNotification(
        response.data?.isRegistered 
          ? '✅ Content is verified on blockchain!' 
          : '❌ Content not found on blockchain',
        response.data?.isRegistered ? 'success' : 'warning'
      );
    } else {
      showNotification('❌ Verification failed', 'error');
    }
  });
}

function registerCurrentContent(): void {
  const content = extractPageContent();
  
  chrome.runtime.sendMessage({
    action: 'registerContent',
    content: content
  }, (response: MessageResponse) => {
    if (response && response.success) {
      showNotification('✅ Content registered successfully!', 'success');
    } else {
      showNotification('❌ Registration failed', 'error');
    }
  });
}

type NotificationType = 'info' | 'success' | 'error' | 'warning';

function showNotification(message: string, type: NotificationType = 'info'): void {
  const existing = document.getElementById('truthchain-notification');
  if (existing) {
    existing.remove();
  }
  
  const colors = {
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6'
  };
  
  const notification = document.createElement('div');
  notification.id = 'truthchain-notification';
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 120px;
    right: 20px;
    z-index: 10001;
    background: ${colors[type]};
    color: white;
    padding: 12px 16px;
    border-radius: 5px;
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    max-width: 300px;
    word-wrap: break-word;
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 5000);
}

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectVerificationUI);
} else {
  injectVerificationUI();
}

// Handle dynamic content changes
const observer = new MutationObserver(() => {
  if (!document.getElementById('truthchain-verification-ui')) {
    injectVerificationUI();
  }
});

observer.observe(document.body, { childList: true, subtree: true });

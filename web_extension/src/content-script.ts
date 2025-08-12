// @ts-nocheck

console.log('TruthChain content script loaded on:', window.location.hostname);

// Inject TruthChain verification UI
function injectTruthChainUI(): void {
  if (document.getElementById('truthchain-ui')) {
    return;
  }

  const hostname = window.location.hostname;
  
  // Twitter-specific UI injection
  if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
    injectTwitterUI();
    return;
  }

  // Auto-check for existing verification
  checkContentVerification();

  // Create container for UI elements
  const uiContainer = document.createElement('div');
  uiContainer.id = 'truthchain-ui';
  uiContainer.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    display: flex;
    flex-direction: column;
    gap: 10px;
  `;

  // Create floating action button
  const registerButton = createFloatingButton('🛡️', 'Register Content', 0);
  registerButton.addEventListener('click', async () => {
    const content = await ContentDetector.extractContent();
    chrome.runtime.sendMessage({ 
      action: 'registerContent', 
      contentData: content 
    }, handleRegistrationResponse);
  });

  // Create verify button
  const verifyButton = createFloatingButton('🔍', 'Verify Authenticity', 0);
  verifyButton.addEventListener('click', async () => {
    const content = await ContentDetector.extractContent();
    chrome.runtime.sendMessage({ 
      action: 'verifyContent', 
      contentData: content 
    }, handleVerificationResponse);
  });

  uiContainer.appendChild(registerButton);
  uiContainer.appendChild(verifyButton);
  document.body.appendChild(uiContainer);
}

// Twitter-specific UI integration
function injectTwitterUI() {
  // Auto-check tweets for verification
  checkTwitterVerification();
  
  // Inject verification buttons into tweet composer
  injectTweetComposerButton();
  
  // Add verification badges to verified tweets
  addVerificationBadgesToTweets();
  
  // Monitor for new tweets and threads
  observeTwitterChanges();
}

function injectTweetComposerButton() {
  const checkForComposer = () => {
    const composer = document.querySelector('[data-testid="tweetTextarea_0"]');
    const toolbar = document.querySelector('[data-testid="toolBar"]');
    
    if (composer && toolbar && !document.getElementById('truthchain-composer-btn')) {
      const verifyBtn = document.createElement('div');
      verifyBtn.id = 'truthchain-composer-btn';
      verifyBtn.style.cssText = `
        display: inline-flex;
        align-items: center;
        padding: 8px 12px;
        background: linear-gradient(135deg, #1d4ed8, #3b82f6);
        color: white;
        border-radius: 20px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        margin-left: 8px;
        transition: all 0.2s;
        border: 1px solid rgba(59, 130, 246, 0.3);
      `;
      
      verifyBtn.innerHTML = `
        <span style="margin-right: 6px;">🛡️</span>
        <span>Register Tweet</span>
      `;
      
      verifyBtn.addEventListener('click', async () => {
        const content = await ContentDetector.extractContent();
        if (content.isComposing && content.content.trim()) {
          chrome.runtime.sendMessage({ 
            action: 'registerContent', 
            contentData: content 
          }, (response) => {
            if (response.success) {
              verifyBtn.innerHTML = `<span style="margin-right: 6px;">✅</span><span>Registered!</span>`;
              verifyBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
              setTimeout(() => {
                verifyBtn.innerHTML = `<span style="margin-right: 6px;">🛡️</span><span>Register Tweet</span>`;
                verifyBtn.style.background = 'linear-gradient(135deg, #1d4ed8, #3b82f6)';
              }, 3000);
            }
          });
        } else {
          alert('Please write your tweet first!');
        }
      });
      
      // Add hover effect
      verifyBtn.addEventListener('mouseenter', () => {
        verifyBtn.style.transform = 'scale(1.05)';
        verifyBtn.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
      });
      
      verifyBtn.addEventListener('mouseleave', () => {
        verifyBtn.style.transform = 'scale(1)';
        verifyBtn.style.boxShadow = 'none';
      });
      
      toolbar.appendChild(verifyBtn);
    }
  };
  
  // Check immediately and on navigation
  checkForComposer();
  setInterval(checkForComposer, 1000);
}

function addVerificationBadgesToTweets() {
  const tweets = document.querySelectorAll('[data-testid="tweet"]:not([data-truthchain-checked])');
  
  tweets.forEach(async (tweet) => {
    tweet.setAttribute('data-truthchain-checked', 'true');
    
    try {
      // Extract tweet content
      const tweetText = tweet.querySelector('[data-testid="tweetText"]')?.textContent;
      if (!tweetText) return;
      
      // Quick verification check
      const contentHash = await ContentDetector.generateContentHash({
        title: 'Tweet',
        content: tweetText,
        type: 'tweet'
      });
      
      chrome.runtime.sendMessage({ 
        action: 'verifyContent', 
        contentData: { hash: contentHash },
        silent: true 
      }, (response) => {
        if (response?.success && response.data?.isRegistered) {
          addVerificationBadgeToTweet(tweet, response.data);
        }
      });
    } catch (error) {
      console.log('Tweet verification check failed:', error);
    }
  });
}

function addVerificationBadgeToTweet(tweetElement, verificationData) {
  const actionsBar = tweetElement.querySelector('[role="group"]');
  if (!actionsBar || tweetElement.querySelector('.truthchain-badge')) return;
  
  const badge = document.createElement('div');
  badge.className = 'truthchain-badge';
  badge.style.cssText = `
    display: inline-flex;
    align-items: center;
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
    margin-left: 8px;
    cursor: pointer;
    animation: fadeIn 0.3s ease-out;
  `;
  
  badge.innerHTML = `
    <span style="margin-right: 4px;">🛡️</span>
    <span>Verified</span>
  `;
  
  badge.addEventListener('click', (e) => {
    e.stopPropagation();
    showVerificationDetails(verificationData);
  });
  
  actionsBar.appendChild(badge);
}

function checkTwitterVerification() {
  // Auto-verify current tweet/thread
  setTimeout(async () => {
    try {
      const content = await ContentDetector.extractContent();
      if (content.type === 'tweet' || content.type === 'thread') {
        chrome.runtime.sendMessage({ 
          action: 'verifyContent', 
          contentData: content, 
          silent: true 
        }, (response) => {
          if (response?.success && response.data?.isRegistered) {
            injectVerificationBadge(response.data);
          }
        });
      }
    } catch (error) {
      console.log('Auto-verification failed:', error);
    }
  }, 1000);
}

function observeTwitterChanges() {
  const observer = new MutationObserver((mutations) => {
    let shouldCheck = false;
    
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1 && (
            node.querySelector?.('[data-testid="tweet"]') ||
            node.getAttribute?.('data-testid') === 'tweet'
          )) {
            shouldCheck = true;
          }
        });
      }
    });
    
    if (shouldCheck) {
      setTimeout(() => {
        addVerificationBadgesToTweets();
        injectTweetComposerButton();
      }, 500);
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Auto-verification on page load
async function checkContentVerification() {
  try {
    const content = await ContentDetector.extractContent();
    chrome.runtime.sendMessage({ 
      action: 'verifyContent', 
      contentData: content, 
      silent: true 
    }, (response) => {
      if (response?.success && response.data?.isRegistered) {
        injectVerificationBadge(response.data);
      }
    });
  } catch (error) {
    console.log('Auto-verification failed:', error);
  }
}

// Inject verification badge for proven content
function injectVerificationBadge(verificationData) {
  // Remove existing badge
  const existing = document.getElementById('truthchain-badge');
  if (existing) existing.remove();

  const badge = document.createElement('div');
  badge.id = 'truthchain-badge';
  badge.style.cssText = `
    position: fixed;
    top: 20px;
    left: 20px;
    z-index: 10000;
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    padding: 12px 16px;
    border-radius: 25px;
    font-size: 14px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    animation: slideIn 0.5s ease-out;
  `;

  badge.innerHTML = `
    <div style="width: 20px; height: 20px; background: rgba(255,255,255,0.3); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
      ✓
    </div>
    <div>
      <div style="font-weight: bold; font-size: 12px;">TruthChain Verified</div>
      <div style="font-size: 10px; opacity: 0.9;">Registered ${new Date(verificationData.timestamp).toLocaleDateString()}</div>
    </div>
  `;

  badge.addEventListener('click', () => {
    showVerificationDetails(verificationData);
  });

  document.body.appendChild(badge);
}

function showVerificationDetails(data) {
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    z-index: 10001;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  modal.innerHTML = `
    <div style="background: white; border-radius: 12px; padding: 24px; max-width: 500px; margin: 20px; box-shadow: 0 20px 25px rgba(0,0,0,0.1);">
      <div style="display: flex; align-items: center; margin-bottom: 20px;">
        <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; margin-right: 12px;">✓</div>
        <div>
          <h3 style="margin: 0; color: #1f2937; font-size: 18px;">Content Verified</h3>
          <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 14px;">Blockchain proof of authenticity</p>
        </div>
      </div>
      <div style="space-y: 12px;">
        <div><strong>Owner:</strong> ${data.owner.slice(0,12)}...${data.owner.slice(-8)}</div>
        <div><strong>Registered:</strong> ${new Date(data.timestamp).toLocaleString()}</div>
        ${data.txId ? `<div><strong>Transaction:</strong> <a href="https://explorer.hiro.so/txid/${data.txId}?chain=testnet" target="_blank" style="color: #10b981;">${data.txId.slice(0,12)}...</a></div>` : ''}
        <div><strong>Content Hash:</strong> <span style="font-family: monospace; font-size: 12px;">${data.cid || 'N/A'}</span></div>
      </div>
      <button onclick="this.closest('div[style*=\"position: fixed\"]').remove()" style="margin-top: 20px; background: #10b981; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; width: 100%;">Close</button>
    </div>
  `;

  document.body.appendChild(modal);
  
  // Close on backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

function createFloatingButton(icon: string, title: string, topOffset: number): HTMLElement {
  const button = document.createElement('button');
  button.className = 'blog2block-btn';
  button.innerHTML = `<span style="font-size: 16px;">${icon}</span>`;
  button.title = title;
  button.style.cssText = `
    position: relative;
    top: ${topOffset}px;
    width: 50px;
    height: 50px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  // Hover effects
  button.addEventListener('mouseenter', () => {
    button.style.transform = 'scale(1.1)';
    button.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
  });

  button.addEventListener('mouseleave', () => {
    button.style.transform = 'scale(1)';
    button.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
  });

  return button;
}

function handleRegistrationResponse(response: any): void {
  if (response && response.success) {
    showNotification(
      `✅ Content registered on TruthChain!\nIPFS: ${response.data.cid.slice(0, 20)}...\nTX: ${response.data.txId.slice(0, 10)}...`,
      'success'
    );
  } else {
    showNotification('❌ Registration failed: ' + (response?.error || 'Unknown error'), 'error');
  }
}

function handleVerificationResponse(response: any): void {
  if (response && response.success) {
    const message = response.data.isRegistered 
      ? `✅ Content verified on TruthChain!\nOwner: ${response.data.owner.slice(0, 12)}...\nTimestamp: ${new Date(response.data.timestamp).toLocaleDateString()}`
      : '❌ Content not found on TruthChain';
    showNotification(message, response.data.isRegistered ? 'success' : 'warning');
  } else {
    showNotification('❌ Verification failed: ' + (response?.error || 'Unknown error'), 'error');
  }
}

function showNotification(message: string, type: 'success' | 'error' | 'warning' = 'info'): void {
  // Remove existing notification
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
  notification.style.cssText = `
    position: fixed;
    top: 130px;
    right: 20px;
    z-index: 10001;
    background: ${colors[type]};
    color: white;
    padding: 16px 20px;
    border-radius: 12px;
    font-size: 14px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
    max-width: 320px;
    word-wrap: break-word;
    white-space: pre-line;
    animation: slideIn 0.3s ease-out;
  `;

  // Add slide-in animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);

  notification.textContent = message;
  document.body.appendChild(notification);

  // Auto-remove after 6 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.animation = 'slideIn 0.3s ease-out reverse';
      setTimeout(() => notification.remove(), 300);
    }
  }, 6000);
}

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectTruthChainUI);
} else {
  injectTruthChainUI();
}

// Handle dynamic content changes
const observer = new MutationObserver(() => {
  if (!document.getElementById('truthchain-ui')) {
    setTimeout(injectTruthChainUI, 1000);
  }
});

observer.observe(document.body, { childList: true, subtree: true });

// Enhanced content detection for Truth-Chain workflows
console.log('TruthChain content script loaded');

// Content detection and hashing utilities
class ContentDetector {
  static async extractContent() {
    const hostname = window.location.hostname;
    let content = null;

    // Platform-specific extraction
    if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
      content = this.extractTwitterContent();
    } else if (hostname.includes('medium.com')) {
      content = this.extractMediumContent();
    } else if (hostname.includes('dev.to')) {
      content = this.extractDevToContent();
    } else if (hostname.includes('substack.com')) {
      content = this.extractSubstackContent();
    } else if (hostname.includes('github.com')) {
      content = this.extractGitHubContent();
    } else {
      content = this.extractGenericContent();
    }

    return {
      ...content,
      url: window.location.href,
      hostname,
      timestamp: new Date().toISOString(),
      hash: await this.generateContentHash(content)
    };
  }

  static extractMediumContent() {
    const title = document.querySelector('h1')?.textContent || document.title;
    const article = document.querySelector('article') || document.querySelector('[data-testid="storyContent"]');
    const author = document.querySelector('[data-testid="authorName"]')?.textContent;
    
    return {
      title,
      content: article?.innerText || '',
      author,
      type: 'article'
    };
  }

  static extractDevToContent() {
    const title = document.querySelector('h1.crayons-title')?.textContent || document.title;
    const article = document.querySelector('#article-body') || document.querySelector('.crayons-article__body');
    const author = document.querySelector('.crayons-story__author')?.textContent;
    
    return {
      title,
      content: article?.innerText || '',
      author,
      type: 'article'
    };
  }

  static extractSubstackContent() {
    const title = document.querySelector('h1')?.textContent || document.title;
    const article = document.querySelector('.post-content') || document.querySelector('[class*="post"]');
    const author = document.querySelector('[class*="author"]')?.textContent;
    
    return {
      title,
      content: article?.innerText || '',
      author,
      type: 'newsletter'
    };
  }

  static extractGitHubContent() {
    if (window.location.pathname.includes('/blob/') || window.location.pathname.includes('/README')) {
      const title = document.querySelector('.js-navigation-open')?.textContent || document.title;
      const code = document.querySelector('.blob-wrapper')?.textContent;
      
      return {
        title,
        content: code || '',
        type: 'code',
        repository: window.location.pathname.split('/').slice(1, 3).join('/')
      };
    }
    
    return {
      title: document.title,
      content: document.body.innerText.slice(0, 1000),
      type: 'repository'
    };
  }

  static extractTwitterContent() {
    // Detect tweet composition area
    const tweetComposer = document.querySelector('[data-testid="tweetTextarea_0"]') || 
                         document.querySelector('[contenteditable="true"][data-text="What is happening?!"]');
    
    if (tweetComposer) {
      return {
        title: 'New Tweet',
        content: tweetComposer.textContent || '',
        type: 'tweet-draft',
        isComposing: true,
        author: this.getTwitterUsername(),
        timestamp: new Date().toISOString()
      };
    }
    
    // Extract existing tweet
    const tweetContainer = document.querySelector('[data-testid="tweet"]') || 
                          document.querySelector('article[role="article"]');
    
    if (tweetContainer) {
      const tweetText = tweetContainer.querySelector('[data-testid="tweetText"]')?.textContent ||
                       tweetContainer.querySelector('[lang]')?.textContent || '';
      
      const username = tweetContainer.querySelector('[data-testid="User-Names"] a')?.textContent ||
                      this.getTwitterUsername();
      
      const timestamp = tweetContainer.querySelector('time')?.getAttribute('datetime') ||
                       new Date().toISOString();
      
      const isRetweet = tweetContainer.querySelector('[data-testid="socialContext"]')?.textContent.includes('retweeted');
      const isReply = tweetContainer.querySelector('[data-testid="reply"]') !== null;
      
      return {
        title: `Tweet by ${username}`,
        content: tweetText,
        type: isRetweet ? 'retweet' : isReply ? 'reply' : 'tweet',
        author: username,
        timestamp,
        url: window.location.href,
        engagement: this.getTwitterEngagement(tweetContainer)
      };
    }
    
    // Extract Twitter thread
    const threadTweets = document.querySelectorAll('[data-testid="tweet"]');
    if (threadTweets.length > 1) {
      const threadContent = Array.from(threadTweets)
        .map(tweet => tweet.querySelector('[data-testid="tweetText"]')?.textContent)
        .filter(Boolean)
        .join('\n\n');
      
      return {
        title: `Twitter Thread by ${this.getTwitterUsername()}`,
        content: threadContent,
        type: 'thread',
        author: this.getTwitterUsername(),
        tweetCount: threadTweets.length,
        timestamp: new Date().toISOString()
      };
    }
    
    return this.extractGenericContent();
  }

  static getTwitterUsername() {
    // Try multiple selectors for username
    const selectors = [
      '[data-testid="UserName"] [dir="ltr"]',
      '[data-testid="User-Names"] a[role="link"]',
      'a[href^="/"][role="link"] span',
      '[data-testid="primaryColumn"] h1'
    ];
    
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element?.textContent?.startsWith('@')) {
        return element.textContent;
      }
    }
    
    // Fallback to URL extraction
    const match = window.location.pathname.match(/^\/([^\/]+)/);
    return match ? `@${match[1]}` : '@unknown';
  }

  static getTwitterEngagement(tweetContainer) {
    const metrics = {};
    
    // Extract engagement metrics
    const replyCount = tweetContainer.querySelector('[data-testid="reply"] span')?.textContent;
    const retweetCount = tweetContainer.querySelector('[data-testid="retweet"] span')?.textContent;
    const likeCount = tweetContainer.querySelector('[data-testid="like"] span')?.textContent;
    const viewCount = tweetContainer.querySelector('[href$="/analytics"]')?.textContent;
    
    if (replyCount && replyCount !== '0') metrics.replies = parseInt(replyCount.replace(/[,K]/g, '')) || 0;
    if (retweetCount && retweetCount !== '0') metrics.retweets = parseInt(retweetCount.replace(/[,K]/g, '')) || 0;
    if (likeCount && likeCount !== '0') metrics.likes = parseInt(likeCount.replace(/[,K]/g, '')) || 0;
    if (viewCount) metrics.views = parseInt(viewCount.replace(/[,K]/g, '')) || 0;
    
    return metrics;
  }

  static extractGenericContent() {
    const title = document.title;
    const selectors = ['article', 'main', '[role="main"]', '.content', '.post', '.entry'];
    let content = '';
    
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.innerText.length > 100) {
        content = element.innerText;
        break;
      }
    }
    
    if (!content) {
      content = document.body.innerText.slice(0, 2000);
    }
    
    return { title, content, type: 'webpage' };
  }

  static async generateContentHash(content) {
    const contentString = JSON.stringify({
      title: content.title,
      content: content.content.slice(0, 5000), // Limit for consistency
      type: content.type
    });
    
    const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(contentString));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}

// Wait for wallet providers to inject
let walletCheckInterval: NodeJS.Timeout;
let walletDetected = false;

// Check for wallet providers periodically
const checkForWallets = () => {
  if (walletDetected) return;
  
  const wallets = [];
  
  // Check for Xverse
  if ((window as any).XverseProviders?.StacksProvider) {
    wallets.push('xverse');
    walletDetected = true;
  }
  
  // Check for Leather
  if ((window as any).LeatherProvider) {
    wallets.push('leather');
    walletDetected = true;
  }
  
  // Check for other providers
  if ((window as any).StacksProvider) {
    wallets.push('stacks');
    walletDetected = true;
  }
  
  if (wallets.length > 0) {
    console.log('TruthChain: Detected wallets:', wallets);
    clearInterval(walletCheckInterval);
    
    // Store wallet availability in page context
    (window as any).__truthchain_wallets_available = wallets;
  }
};

// Start checking immediately and periodically
checkForWallets();
walletCheckInterval = setInterval(checkForWallets, 1000);

// Stop checking after 30 seconds
setTimeout(() => {
  if (walletCheckInterval) {
    clearInterval(walletCheckInterval);
  }
}, 30000);

// Listen for messages from extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'detectWallets') {
    sendResponse({
      available: (window as any).__truthchain_wallets_available || [],
      xverse: !!(window as any).XverseProviders?.StacksProvider,
      leather: !!(window as any).LeatherProvider,
      stacks: !!(window as any).StacksProvider
    });
  }
  
  if (request.action === 'connectWallet') {
    connectWalletInPage().then(sendResponse).catch(error => {
      sendResponse({ error: error.message });
    });
    return true; // Keep message channel open for async response
  }
});

async function connectWalletInPage() {
  console.log('TruthChain: Attempting wallet connection in page context');
  
  // Try Xverse first
  if ((window as any).XverseProviders?.StacksProvider) {
    try {
      console.log('TruthChain: Connecting to Xverse...');
      const provider = (window as any).XverseProviders.StacksProvider;
      
      const accounts = await provider.request('stx_requestAccounts');
      console.log('TruthChain: Xverse accounts:', accounts);
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts available in Xverse');
      }
      
      const addressInfo = await provider.request('stx_getAddresses');
      console.log('TruthChain: Xverse address info:', addressInfo);
      
      if (!addressInfo?.addresses?.length) {
        throw new Error('Could not get address information');
      }
      
      return {
        success: true,
        wallet: {
          address: addressInfo.addresses[0].address,
          publicKey: addressInfo.addresses[0].publicKey || 'xverse-key',
          provider: 'xverse',
          walletName: 'Xverse',
          isConnected: true
        }
      };
    } catch (error) {
      console.error('TruthChain: Xverse connection failed:', error);
      if (error.message?.includes('User rejected') || error.message?.includes('denied')) {
        throw new Error('Connection cancelled by user');
      }
      // Try next wallet
    }
  }
  
  // Try Leather
  if ((window as any).LeatherProvider) {
    try {
      console.log('TruthChain: Connecting to Leather...');
      const provider = (window as any).LeatherProvider;
      
      const result = await provider.request('stx_requestAccounts');
      console.log('TruthChain: Leather result:', result);
      
      if (!result) {
        throw new Error('No response from Leather');
      }
      
      let address = result;
      if (result.addresses && Array.isArray(result.addresses)) {
        address = result.addresses[0];
      } else if (result.address) {
        address = result.address;
      }
      
      return {
        success: true,
        wallet: {
          address: address,
          publicKey: result.publicKey || 'leather-key',
          provider: 'leather',
          walletName: 'Leather',
          isConnected: true
        }
      };
    } catch (error) {
      console.error('TruthChain: Leather connection failed:', error);
      // Try next wallet
    }
  }
  
  // Try generic Stacks provider
  if ((window as any).StacksProvider) {
    try {
      console.log('TruthChain: Connecting to generic Stacks provider...');
      const provider = (window as any).StacksProvider;
      
      const accounts = await provider.request('stx_requestAccounts');
      console.log('TruthChain: Generic provider accounts:', accounts);
      
      return {
        success: true,
        wallet: {
          address: Array.isArray(accounts) ? accounts[0] : accounts,
          publicKey: 'stacks-key',
          provider: 'stacks',
          walletName: 'Stacks Wallet',
          isConnected: true
        }
      };
    } catch (error) {
      console.error('TruthChain: Generic provider connection failed:', error);
    }
  }
  
  throw new Error('No wallet providers found or all connections failed');
}

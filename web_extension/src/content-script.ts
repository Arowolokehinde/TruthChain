// @ts-nocheck

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
        <span>TruthChain</span>
      `;
      
      verifyBtn.addEventListener('click', async () => {
        const content = await ContentDetector.extractContent();
        if (content.isComposing && content.content.trim()) {
          // Show use case prompt
          const shouldRegister = confirm(
            `🛡️ TruthChain Content Registration\n\n` +
            `Would you like to upload this tweet on-chain?\n\n` +
            `✅ Your content will be provably yours\n` +
            `✅ Viewers can verify your tweet's origin and integrity\n` +
            `✅ You build lasting trust with your audience\n\n` +
            `Click OK to register on TruthChain blockchain.`
          );
          
          if (shouldRegister) {
            verifyBtn.innerHTML = `<span style="margin-right: 6px;">⏳</span><span>Registering...</span>`;
            verifyBtn.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
            
            chrome.runtime.sendMessage({ 
              action: 'registerContent', 
              contentData: content 
            }, (response) => {
              if (response.success) {
                verifyBtn.innerHTML = `<span style="margin-right: 6px;">✅</span><span>Registered!</span>`;
                verifyBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
                
                // Show success notification
                showSuccessNotification(response.data);
                
                setTimeout(() => {
                  verifyBtn.innerHTML = `<span style="margin-right: 6px;">🛡️</span><span>TruthChain</span>`;
                  verifyBtn.style.background = 'linear-gradient(135deg, #1d4ed8, #3b82f6)';
                }, 5000);
              } else {
                verifyBtn.innerHTML = `<span style="margin-right: 6px;">❌</span><span>Failed</span>`;
                verifyBtn.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
                alert('Registration failed: ' + (response.error || 'Unknown error'));
                
                setTimeout(() => {
                  verifyBtn.innerHTML = `<span style="margin-right: 6px;">🛡️</span><span>TruthChain</span>`;
                  verifyBtn.style.background = 'linear-gradient(135deg, #1d4ed8, #3b82f6)';
                }, 3000);
              }
            });
          }
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
    showVerificationDetailsWithUsername(verificationData);
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
    showVerificationDetailsWithUsername(verificationData);
  });

  document.body.appendChild(badge);
}

function showSuccessNotification(data: any) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10002;
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    padding: 16px 20px;
    border-radius: 12px;
    font-size: 14px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
    max-width: 350px;
    animation: slideInRight 0.3s ease-out;
  `;

  notification.innerHTML = `
    <div style="display: flex; align-items: center; margin-bottom: 8px;">
      <div style="width: 20px; height: 20px; background: rgba(255,255,255,0.3); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 8px;">
        ✓
      </div>
      <strong>Tweet Registered on TruthChain!</strong>
    </div>
    <div style="font-size: 12px; opacity: 0.9; margin-bottom: 8px;">
      🔗 Hashed and saved in TruthChain database<br>
      ⛓️ Registered with your wallet on Stacks blockchain<br>
      🕐 Time-stamped for immutable proof
    </div>
    ${data.cid ? `<div style="font-size: 11px; font-family: monospace; background: rgba(255,255,255,0.1); padding: 4px 8px; border-radius: 6px; margin-top: 8px;">CID: ${data.cid.slice(0, 20)}...</div>` : ''}
  `;

  // Add CSS animation
  if (!document.querySelector('#truthchain-animations')) {
    const style = document.createElement('style');
    style.id = 'truthchain-animations';
    style.textContent = `
      @keyframes slideInRight {
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
  }

  document.body.appendChild(notification);

  // Auto-remove after 8 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.animation = 'slideInRight 0.3s ease-out reverse';
      setTimeout(() => notification.remove(), 300);
    }
  }, 8000);
}

async function showVerificationDetailsWithUsername(data) {
  // Create loading modal first
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
    backdrop-filter: blur(4px);
  `;

  modal.innerHTML = `
    <div style="background: white; border-radius: 16px; padding: 32px; max-width: 520px; margin: 20px; box-shadow: 0 25px 50px rgba(0,0,0,0.15); position: relative;">
      <div style="display: flex; align-items: center; justify-center; margin-bottom: 24px;">
        <div class="loading-spinner" style="width: 40px; height: 40px; border: 3px solid #f3f4f6; border-top: 3px solid #10b981; border-radius: 50%; animation: spin 1s linear infinite;"></div>
      </div>
      <div style="text-align: center; color: #6b7280; font-size: 16px;">
        Verifying content authenticity...
      </div>
    </div>
  `;

  // Add spinner animation
  if (!document.querySelector('#spinner-style')) {
    const style = document.createElement('style');
    style.id = 'spinner-style';
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(modal);

  try {
    // Get username from wallet address
    let username = 'Unknown User';
    if (data.owner) {
      // Send message to background script to get username
      chrome.runtime.sendMessage({ 
        action: 'getUsernameByWallet', 
        walletAddress: data.owner 
      }, (response) => {
        if (response?.success && response.username) {
          username = response.username;
        }
        
        // Update modal with verification details
        showVerificationModal(modal, data, username);
      });
    } else {
      showVerificationModal(modal, data, username);
    }
  } catch (error) {
    console.error('Error loading verification details:', error);
    showVerificationModal(modal, data, 'Unknown User');
  }
}

function showVerificationModal(modal, data, username) {
  modal.innerHTML = `
    <div style="background: white; border-radius: 16px; padding: 0; max-width: 520px; margin: 20px; box-shadow: 0 25px 50px rgba(0,0,0,0.15); overflow: hidden;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 24px; position: relative;">
        <button onclick="this.closest('div[style*=\"position: fixed\"]').remove()" style="position: absolute; top: 16px; right: 16px; background: rgba(255,255,255,0.2); border: none; border-radius: 50%; width: 32px; height: 32px; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 16px;">×</button>
        <div style="display: flex; align-items: center;">
          <div style="width: 48px; height: 48px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; margin-right: 16px; font-size: 20px;">🛡️</div>
          <div>
            <h3 style="margin: 0; color: white; font-size: 22px; font-weight: bold;">Content Verified</h3>
            <p style="margin: 4px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Blockchain proof of authenticity</p>
          </div>
        </div>
      </div>
      
      <!-- Content -->
      <div style="padding: 24px;">
        <!-- User Info -->
        <div style="background: linear-gradient(135deg, #f0fdfa, #ccfbf1); border: 1px solid #a7f3d0; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
          <div style="display: flex; align-items: center; margin-bottom: 12px;">
            <div style="width: 36px; height: 36px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; margin-right: 12px;">@</div>
            <div>
              <h4 style="margin: 0; color: #065f46; font-size: 16px; font-weight: bold;">TruthChain Username</h4>
              <p style="margin: 2px 0 0 0; color: #047857; font-size: 14px;">@${username}</p>
            </div>
          </div>
          <p style="margin: 0; color: #064e3b; font-size: 13px;">
            Click the badge to verify authenticity. Enter the username shown to confirm when and by whom it was registered.
          </p>
        </div>

        <!-- Verification Details -->
        <div style="space-y: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #f3f4f6;">
            <span style="color: #6b7280; font-size: 14px; font-weight: 500;">Wallet Owner</span>
            <span style="color: #1f2937; font-size: 14px; font-family: monospace; background: #f9fafb; padding: 4px 8px; border-radius: 6px;">${data.owner ? data.owner.slice(0,12) + '...' + data.owner.slice(-8) : 'Unknown'}</span>
          </div>
          
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #f3f4f6;">
            <span style="color: #6b7280; font-size: 14px; font-weight: 500;">Registration Date</span>
            <span style="color: #1f2937; font-size: 14px;">${new Date(data.timestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #f3f4f6;">
            <span style="color: #6b7280; font-size: 14px; font-weight: 500;">Registration Time</span>
            <span style="color: #1f2937; font-size: 14px;">${new Date(data.timestamp).toLocaleTimeString()}</span>
          </div>
          
          ${data.txId ? `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #f3f4f6;">
            <span style="color: #6b7280; font-size: 14px; font-weight: 500;">Transaction</span>
            <a href="https://explorer.hiro.so/txid/${data.txId}?chain=testnet" target="_blank" style="color: #10b981; font-size: 14px; text-decoration: none; font-family: monospace; background: #f0fdfa; padding: 4px 8px; border-radius: 6px; border: 1px solid #a7f3d0;">${data.txId.slice(0,8)}...${data.txId.slice(-8)}</a>
          </div>
          ` : ''}
          
          ${data.cid ? `
          <div style="display: flex; justify-content: space-between; align-items: start; padding: 12px 0;">
            <span style="color: #6b7280; font-size: 14px; font-weight: 500; margin-top: 2px;">Content Hash</span>
            <span style="color: #1f2937; font-size: 12px; font-family: monospace; background: #f9fafb; padding: 6px 8px; border-radius: 6px; max-width: 200px; word-break: break-all; line-height: 1.3;">${data.cid}</span>
          </div>
          ` : ''}
        </div>

        <!-- Actions -->
        <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #f3f4f6;">
          <div style="display: flex; gap: 12px;">
            ${data.txId ? `
            <button onclick="window.open('https://explorer.hiro.so/txid/${data.txId}?chain=testnet', '_blank')" style="flex: 1; background: #f3f4f6; color: #374151; border: none; padding: 12px; border-radius: 8px; cursor: pointer; font-weight: 500; font-size: 14px;">
              View on Explorer
            </button>
            ` : ''}
            <button onclick="this.closest('div[style*=\"position: fixed\"]').remove()" style="flex: 1; background: #10b981; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; font-weight: 500; font-size: 14px;">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
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

// Enhanced message handling with page script communication
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'detectWallets':
      detectWalletsViaPageScript()
        .then(result => {
          sendResponse(result);
        })
        .catch(error => {
          console.error('Wallet detection failed:', error);
          sendResponse({ success: false, error: error.message });
        });
      return true; // Keep message channel open for async response
      
    case 'connectWallet':
    case 'connectXverse':
      connectWalletViaPageScript()
        .then(result => {
          console.log('Wallet connection successful:', result);
          sendResponse(result);
        })
        .catch(error => {
          console.error('Wallet connection failed:', error);
          sendResponse({ success: false, error: error.message });
        });
      return true; // Keep message channel open for async response
      
    case 'getWalletStatus':
      const status = getWalletStatus();
      sendResponse(status);
      break;
      
    default:
      console.log('Unknown action:', request.action);
      break;
  }
});

// Page script communication functions
let messageId = 0;
const pendingMessages = new Map();

function sendMessageToPageScript(type: string, data: any = {}): Promise<any> {
  return new Promise((resolve, reject) => {
    const requestId = `req_${++messageId}_${Date.now()}`;
    
    // Store the promise callbacks
    pendingMessages.set(requestId, { resolve, reject });
    
    // Send message to page script
    window.postMessage({
      type,
      requestId,
      ...data
    }, '*');
    
    // Timeout after 10 seconds
    setTimeout(() => {
      if (pendingMessages.has(requestId)) {
        pendingMessages.delete(requestId);
        reject(new Error('Timeout waiting for page script response'));
      }
    }, 10000);
  });
}

// Listen for messages from page script
window.addEventListener('message', (event) => {
  // Only accept messages from same origin
  if (event.origin !== window.location.origin) {
    return;
  }
  
  // Only handle TruthChain responses
  if (!event.data?.type?.startsWith('TRUTHCHAIN_') || !event.data.requestId) {
    return;
  }
  
  console.log('Content script received page script message:', event.data);
  
  const { requestId, success, data, error } = event.data;
  
  if (pendingMessages.has(requestId)) {
    const { resolve, reject } = pendingMessages.get(requestId);
    pendingMessages.delete(requestId);
    
    if (success) {
      resolve(data);
    } else {
      reject(new Error(error || 'Unknown error'));
    }
  }
});

async function detectWalletsViaPageScript() {
  try {
    const detection = await sendMessageToPageScript('TRUTHCHAIN_DETECT_WALLETS');
    
    const result = {
      available: [] as string[],
      xverse: false,
      leather: false,
      stacks: false,
      details: {} as Record<string, any>,
      providers: detection.providers || {}
    };
    
    // Process detection results
    Object.entries(detection.providers || {}).forEach(([key, provider]: [string, any]) => {
      if (provider.isDetected) {
        result.available.push(key);
        result[key as keyof typeof result] = true;
        result.details[key] = {
          name: provider.name,
          isDetected: true,
          hasProvider: !!provider.provider
        };
      }
    });
    
    // Store detection result globally
    (window as any).__truthchain_wallets_detected = result;
    
    console.log(`TruthChain: Page script detection found ${result.available.length} wallet(s):`, result.available);
    
    return result;
  } catch (error) {
    console.error('Page script wallet detection failed:', error);
    
    // Fallback to legacy detection
    return detectWalletsEnhanced();
  }
}

async function connectWalletViaPageScript() {
  try {
    const detection = await detectWalletsViaPageScript();
    
    if (detection.available.length === 0) {
      const errorMessage = detection.error && detection.error.includes('browser internal pages') 
        ? 'Wallet detection is not available on this page. Please navigate to a regular website (like medium.com) and try again.'
        : 'No Stacks wallets found. Please install Xverse or Leather wallet and refresh the page.';
      throw new Error(errorMessage);
    }
    
    // Try connecting ONLY to actually detected and available wallets
    console.log(`TruthChain: [PAGE_SCRIPT_CONNECTION] Available wallets:`, detection.available);
    let lastError: Error | null = null;
    
    // Only attempt wallets that are actually available
    for (const walletType of detection.available) {
      // Skip unsupported wallet types
      if (!['xverse', 'leather'].includes(walletType)) {
        console.log(`TruthChain: [PAGE_SCRIPT_CONNECTION] Skipping ${walletType} - not supported`);
        continue;
      }
      
      try {
        console.log(`TruthChain: Attempting page script connection to ${walletType}`);
          
          const result = await sendMessageToPageScript('TRUTHCHAIN_ADVANCED_CONNECT', {
            provider: walletType
          });
          
          if (result.success) {
            // Store successful connection globally
            (window as any).__truthchain_connected_wallet = result;
            
            return result;
          }
          
      } catch (error) {
        lastError = error as Error;
        console.log(`Page script connection attempt to ${walletType} failed:`, error);
        
        // If user explicitly rejected, don't try other wallets
        if (error.message?.toLowerCase().includes('user rejected') || 
            error.message?.toLowerCase().includes('denied') ||
            error.message?.toLowerCase().includes('cancelled')) {
          throw new Error('Connection cancelled by user');
        }
      }
    }
    
    throw lastError || new Error('All wallet connections failed');
    
  } catch (error) {
    console.error('Page script wallet connection failed:', error);
    
    // Fallback to legacy connection
    return connectWalletEnhanced();
  }
}

// Enhanced wallet detection - use page script communication
async function detectWalletsEnhanced() {
  console.log('TruthChain: Using advanced page script detection...');
  
  try {
    // Try advanced detection first
    const advancedResult = await new Promise<any>((resolve, reject) => {
      const requestId = `enhanced_detect_${Date.now()}`;
      
      const responseHandler = (event: MessageEvent) => {
        if (event.data?.type === 'TRUTHCHAIN_ADVANCED_DETECT_RESULT' && 
            event.data.requestId === requestId) {
          window.removeEventListener('message', responseHandler);
          
          if (event.data.success) {
            resolve(event.data.data);
          } else {
            reject(new Error(event.data.error));
          }
        }
      };
      
      window.addEventListener('message', responseHandler);
      
      window.postMessage({
        type: 'TRUTHCHAIN_ADVANCED_DETECT',
        requestId: requestId
      }, '*');
      
      setTimeout(() => {
        window.removeEventListener('message', responseHandler);
        reject(new Error('Advanced detection timeout'));
      }, 5000);
    });
    
    // Convert advanced format to legacy format
    const detected = {
      available: [] as string[],
      xverse: false,
      leather: false,
      stacks: false,
      details: {} as Record<string, any>
    };
    
    console.log(`TruthChain: [CONVERSION] Converting ${advancedResult.length} advanced results:`, advancedResult);
    
    // Ensure priority order: xverse first, then leather, then stacks
    const priorityOrder = ['xverse', 'leather', 'stacks'];
    const detectedWallets = new Set<string>();
    
    for (const wallet of advancedResult) {
      console.log(`TruthChain: [CONVERSION] Checking wallet: ${wallet.name} (${wallet.provider}) - detected: ${wallet.detected}, available: ${wallet.available}`);
      
      if (wallet.detected && wallet.available) {
        const providerKey = wallet.provider.includes('-') ? wallet.provider.split('-')[0] : wallet.provider;
        detectedWallets.add(providerKey);
        
        console.log(`TruthChain: [CONVERSION] Processing wallet: ${wallet.name} (${providerKey})`);
        
        if (providerKey === 'xverse') {
          detected.xverse = true;
          detected.details.xverse = {
            hasStacksProvider: true,
            version: wallet.version || 'unknown',
            methods: wallet.methods || []
          };
        } else if (providerKey === 'leather') {
          detected.leather = true;
          detected.details.leather = {
            hasProvider: true,
            version: wallet.version || 'unknown',
            methods: wallet.methods || []
          };
        } else if (providerKey === 'stacks') {
          detected.stacks = true;
          detected.details.stacks = {
            hasProvider: true,
            isGeneric: true,
            methods: wallet.methods || []
          };
        }
      } else {
        console.log(`TruthChain: [CONVERSION] Skipping wallet: ${wallet.name} (${wallet.provider}) - not properly detected/available`);
      }
    }
    
    // Build available array in priority order
    for (const walletType of priorityOrder) {
      if (detectedWallets.has(walletType)) {
        detected.available.push(walletType);
        console.log(`TruthChain: [CONVERSION] Added ${walletType} to available array at position ${detected.available.length - 1}`);
      }
    }
    
    console.log(`TruthChain: [CONVERSION] Final available array:`, detected.available);
    
    console.log(`TruthChain: Advanced detection found ${detected.available.length} wallet(s):`, detected.available);
    console.log(`TruthChain: [DEBUG] Full detection result:`, detected);
    return detected;
    
  } catch (error) {
    console.log('TruthChain: Advanced detection failed, falling back to legacy:', error);
    
    // Fallback to legacy detection via page script
    return new Promise((resolve) => {
      const requestId = `legacy_detect_${Date.now()}`;
      
      const responseHandler = (event: MessageEvent) => {
        if (event.data?.type === 'TRUTHCHAIN_WALLET_DETECTION_RESULT' && 
            event.data.requestId === requestId) {
          window.removeEventListener('message', responseHandler);
          
          if (event.data.success) {
            const providers = event.data.data.providers;
            const detected = {
              available: [] as string[],
              xverse: false,
              leather: false,
              stacks: false,
              details: {} as Record<string, any>
            };
            
            Object.entries(providers).forEach(([key, provider]: [string, any]) => {
              if (provider.isDetected) {
                detected.available.push(key);
                detected[key as keyof typeof detected] = true;
                detected.details[key] = { hasProvider: true };
              }
            });
            
            resolve(detected);
          } else {
            resolve({
              available: [],
              xverse: false,
              leather: false,
              stacks: false,
              details: {}
            });
          }
        }
      };
      
      window.addEventListener('message', responseHandler);
      
      window.postMessage({
        type: 'TRUTHCHAIN_DETECT_WALLETS',
        requestId: requestId
      }, '*');
      
      setTimeout(() => {
        window.removeEventListener('message', responseHandler);
        resolve({
          available: [],
          xverse: false,
          leather: false,
          stacks: false,
          details: {}
        });
      }, 3000);
    });
  }
}

// Enhanced wallet connection with better error handling
async function connectWalletEnhanced(): Promise<any> {
  console.log('TruthChain: Starting enhanced wallet connection...');
  
  // Wait a moment for wallet providers to fully initialize
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const detection = await detectWalletsEnhanced();
  
  if (detection.available.length === 0) {
    const errorMessage = detection.error && detection.error.includes('browser internal pages') 
      ? 'Wallet detection is not available on this page. Please navigate to a regular website (like medium.com) and try again.'
      : 'No Stacks wallets found. Please install Xverse or Leather wallet and refresh the page.';
    throw new Error(errorMessage);
  }
  
  // Try connecting ONLY to actually detected and available wallets
  console.log(`TruthChain: [CONNECTION] Available wallets from detection:`, detection.available);
  console.log(`TruthChain: [CONNECTION] Detection details:`, {
    xverse: detection.xverse,
    leather: detection.leather, 
    stacks: detection.stacks,
    details: detection.details
  });
  
  if (detection.available.length === 0) {
    throw new Error('No wallets detected. Please install and unlock Xverse or Leather wallet.');
  }
  
  let lastError: Error | null = null;
  
  // Only attempt connection to wallets that are actually available
  for (const walletType of detection.available) {
    console.log(`TruthChain: [CONNECTION] Attempting connection to detected wallet: ${walletType}`);
    
    // Additional safety check
    if (!['xverse', 'leather'].includes(walletType)) {
      console.log(`TruthChain: [CONNECTION] Skipping ${walletType} - not a supported wallet type`);
      continue;
    }
    
    try {
      console.log(`TruthChain: Attempting advanced connection to ${walletType}`);
      
      const result = await new Promise<any>((resolve, reject) => {
        const requestId = `enhanced_connect_${walletType}_${Date.now()}`;
        
        const responseHandler = (event: MessageEvent) => {
          if (event.data?.type === 'TRUTHCHAIN_ADVANCED_CONNECT_RESULT' && 
              event.data.requestId === requestId) {
            window.removeEventListener('message', responseHandler);
            
            if (event.data.success) {
              resolve(event.data.data);
            } else {
              reject(new Error(event.data.error));
            }
          }
        };
        
        window.addEventListener('message', responseHandler);
        
        window.postMessage({
          type: 'TRUTHCHAIN_ADVANCED_CONNECT',
          requestId: requestId,
          provider: walletType
        }, '*');
        
        setTimeout(() => {
          window.removeEventListener('message', responseHandler);
          reject(new Error('Advanced connection timeout'));
        }, 30000);
      });
      
      // Store successful connection globally for other scripts
      (window as any).__truthchain_connected_wallet = result;
      
      return {
        success: true,
        walletData: {
          address: result.address,
          publicKey: result.publicKey,
          provider: result.provider,
          walletName: result.provider.charAt(0).toUpperCase() + result.provider.slice(1),
          isConnected: true,
          network: result.network || 'testnet'
        },
        provider: result.provider,
        walletName: result.provider.charAt(0).toUpperCase() + result.provider.slice(1)
      };
      
    } catch (error) {
      lastError = error as Error;
      console.log(`Advanced connection to ${walletType} failed:`, (error as Error).message);
      
      // If user explicitly rejected, don't try other wallets
      if ((error as Error).message?.toLowerCase().includes('user rejected') || 
          (error as Error).message?.toLowerCase().includes('denied') ||
          (error as Error).message?.toLowerCase().includes('cancelled') ||
          (error as Error).message?.toLowerCase().includes('timeout')) {
        throw new Error(`Connection cancelled: ${(error as Error).message}`);
      }
    }
  }
  
  throw lastError || new Error('All advanced wallet connections failed');
}

// Enhanced Xverse connection
async function connectXverseEnhanced() {
  if (!(window as any).XverseProviders?.StacksProvider) {
    throw new Error('Xverse provider not available');
  }
  
  const provider = (window as any).XverseProviders.StacksProvider;
  
  try {
    console.log('TruthChain: Connecting to Xverse...');
    
    // Request account access with timeout
    const accounts = await Promise.race([
      provider.request('stx_requestAccounts'),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 30000)
      )
    ]);
    
    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts available in Xverse');
    }
    
    // Get detailed address information
    const addressInfo = await provider.request('stx_getAddresses');
    
    if (!addressInfo?.addresses?.length) {
      throw new Error('Could not retrieve address information from Xverse');
    }
    
    const primaryAddress = addressInfo.addresses[0];
    
    return {
      success: true,
      provider: 'xverse',
      walletName: 'Xverse',
      walletData: {
        address: primaryAddress.address,
        publicKey: primaryAddress.publicKey || `xverse-key-${Date.now()}`,
        provider: 'xverse',
        walletName: 'Xverse',
        isConnected: true,
        network: 'testnet', // TODO: Detect actual network
        accounts: addressInfo.addresses
      }
    };
    
  } catch (error) {
    console.error('Xverse connection error:', error);
    
    if (error.message?.includes('timeout')) {
      throw new Error('Xverse connection timed out. Please try again.');
    }
    
    if (error.message?.includes('User rejected') || error.code === 4001) {
      throw new Error('Connection cancelled by user');
    }
    
    throw new Error(`Xverse connection failed: ${error.message}`);
  }
}

// Enhanced Leather connection
async function connectLeatherEnhanced() {
  if (!(window as any).LeatherProvider) {
    throw new Error('Leather provider not available');
  }
  
  const provider = (window as any).LeatherProvider;
  
  try {
    console.log('TruthChain: Connecting to Leather...');
    
    const result = await Promise.race([
      provider.request('stx_requestAccounts'),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 30000)
      )
    ]);
    
    if (!result) {
      throw new Error('No response from Leather wallet');
    }
    
    // Handle different response formats
    let address: string;
    let publicKey = `leather-key-${Date.now()}`;
    
    if (typeof result === 'string') {
      address = result;
    } else if (result.addresses && Array.isArray(result.addresses)) {
      address = result.addresses[0];
      publicKey = result.publicKey || publicKey;
    } else if (result.address) {
      address = result.address;
      publicKey = result.publicKey || publicKey;
    } else {
      throw new Error('Invalid response format from Leather');
    }
    
    return {
      success: true,
      provider: 'leather',
      walletName: 'Leather',
      walletData: {
        address,
        publicKey,
        provider: 'leather',
        walletName: 'Leather',
        isConnected: true,
        network: 'testnet',
        rawResponse: result
      }
    };
    
  } catch (error) {
    console.error('Leather connection error:', error);
    
    if (error.message?.includes('timeout')) {
      throw new Error('Leather connection timed out. Please try again.');
    }
    
    if (error.message?.includes('User rejected') || error.code === 4001) {
      throw new Error('Connection cancelled by user');
    }
    
    throw new Error(`Leather connection failed: ${error.message}`);
  }
}

// Enhanced generic provider connection
async function connectGenericEnhanced() {
  if (!(window as any).StacksProvider) {
    throw new Error('Generic Stacks provider not available');
  }
  
  const provider = (window as any).StacksProvider;
  
  try {
    console.log('TruthChain: Connecting to generic Stacks provider...');
    
    const accounts = await Promise.race([
      provider.request('stx_requestAccounts'),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 30000)
      )
    ]);
    
    const address = Array.isArray(accounts) ? accounts[0] : accounts;
    
    if (!address) {
      throw new Error('No address returned from provider');
    }
    
    return {
      success: true,
      provider: 'stacks',
      walletName: 'Stacks Wallet',
      walletData: {
        address,
        publicKey: `stacks-key-${Date.now()}`,
        provider: 'stacks',
        walletName: 'Stacks Wallet',
        isConnected: true,
        network: 'testnet',
        accounts
      }
    };
    
  } catch (error) {
    console.error('Generic provider connection error:', error);
    throw new Error(`Generic provider connection failed: ${error.message}`);
  }
}

// Get current wallet status
function getWalletStatus() {
  const connectedWallet = (window as any).__truthchain_connected_wallet;
  const detectedWallets = (window as any).__truthchain_wallets_detected;
  
  return {
    isConnected: !!connectedWallet,
    connectedWallet: connectedWallet || null,
    availableWallets: detectedWallets?.available || [],
    detectionDetails: detectedWallets?.details || {}
  };
}

async function connectWalletInPage() {
  console.log('TruthChain: Attempting wallet connection in page context');
  
  // Use window.postMessage to communicate with injected script
  return new Promise((resolve, reject) => {
    // Listen for response from injected script
    const messageListener = (event: MessageEvent) => {
      if (event.source === window && event.data.type === 'TRUTHCHAIN_WALLET_RESPONSE') {
        window.removeEventListener('message', messageListener);
        if (event.data.success) {
          resolve(event.data);
        } else {
          reject(new Error(event.data.error));
        }
      }
    };
    
    window.addEventListener('message', messageListener);
    
    // Legacy injection removed - now using advanced page script communication
    // Timeout after 10 seconds
    setTimeout(() => {
      window.removeEventListener('message', messageListener);
      reject(new Error('Wallet connection timeout'));
    }, 10000);
  });

  // Legacy fallback code removed - now using advanced page script communication only
  throw new Error('No wallet providers found or all connections failed');
}

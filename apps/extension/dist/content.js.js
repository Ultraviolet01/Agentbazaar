class ScamSniffOrb {
  constructor() {
    this.orb = null;
    this.isScanning = false;
    this.apiEndpoint = 'http://localhost:3006/api/agents/scamsniff/analyze';
    this.init();
  }

  init() {
    // Create floating orb
    this.orb = document.createElement('div');
    this.orb.id = 'scamsniff-orb';
    this.orb.className = 'scamsniff-orb';
    this.orb.innerHTML = `
      <div class="orb-shield">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      </div>
    `;
    
    this.orb.addEventListener('click', () => this.scanCurrentPage());
    document.body.appendChild(this.orb);
  }

  async scanCurrentPage() {
    if (this.isScanning) return;
    
    this.isScanning = true;
    this.orb.classList.add('scanning');

    try {
      // STEP 1: Extract page context
      const pageContext = this.extractPageContext();
      
      console.log('ScamSniff: Extracted page context', pageContext);
      
      // STEP 2: Send to backend for analysis
      const result = await this.analyzeWithBackend(pageContext);
      
      console.log('ScamSniff: Analysis result', result);
      
      // STEP 3: Speak verdict using ElevenLabs
      await this.speakVerdictElevenLabs(result.spokenVerdict);
      
      // STEP 4: Show option to view full report
      this.showReportOption(result.reportId);
      
    } catch (error) {
      console.error('ScamSniff scan error:', error);
      
      // Show detailed error to user
      const errorMessage = error.message || 'Scan failed. Please try again.';
      this.showToast(errorMessage, 'error');
      
      // Also try to speak the error
      this.speakVerdictFallback('Scan failed. Please check your connection.');
    } finally {
      this.isScanning = false;
      this.orb.classList.remove('scanning');
    }
  }

  // LAYER 1: Live Page Context Extraction
  extractPageContext() {
    try {
      const context = {
        // Basic page info
        url: window.location.href,
        domain: window.location.hostname,
        protocol: window.location.protocol,
        path: window.location.pathname,
        title: document.title,
        
        // Visible content
        bodyText: this.extractVisibleText(),
        selectedText: window.getSelection().toString(),
        
        // Links analysis
        links: this.extractLinks(),
        externalLinks: this.extractExternalLinks(),
        
        // Web3 specific
        contractAddresses: this.extractContractAddresses(),
        tokenMentions: this.extractTokenMentions(),
        socialHandles: this.extractSocialHandles(),
        
        // Branding
        brandMentions: this.extractBrandMentions(),
        logoUrls: this.extractLogoUrls(),
        
        // Suspicious patterns
        suspiciousPhrases: this.detectSuspiciousPhrases(),
        urgencyLanguage: this.detectUrgencyLanguage(),
        walletConnectButtons: this.detectWalletButtons(),
        
        // Meta tags
        metaTags: this.extractMetaTags(),
        
        // Document structure
        hasDocumentation: this.checkDocumentation(),
        hasTerms: this.checkTermsOfService(),
        hasPrivacy: this.checkPrivacyPolicy(),
        
        // Timestamp
        scannedAt: new Date().toISOString()
      };

      return context;
    } catch (error) {
      console.error('Page context extraction error:', error);
      throw new Error('Failed to extract page context');
    }
  }

  extractVisibleText() {
    try {
      const clone = document.body.cloneNode(true);
      const scripts = clone.querySelectorAll('script, style, noscript');
      scripts.forEach(el => el.remove());
      
      return clone.innerText
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 5000);
    } catch (error) {
      return '';
    }
  }

  extractLinks() {
    try {
      const links = Array.from(document.querySelectorAll('a[href]'));
      return links.map(a => ({
        text: a.textContent.trim(),
        href: a.href,
        isExternal: !a.href.startsWith(window.location.origin)
      })).slice(0, 100);
    } catch (error) {
      return [];
    }
  }

  extractExternalLinks() {
    return this.extractLinks()
      .filter(link => link.isExternal)
      .map(link => link.href);
  }

  extractContractAddresses() {
    try {
      const addressRegex = /0x[a-fA-F0-9]{40}/g;
      const text = document.body.innerText;
      const matches = text.match(addressRegex) || [];
      return [...new Set(matches)];
    } catch (error) {
      return [];
    }
  }

  extractTokenMentions() {
    try {
      const tokenRegex = /\$[A-Z]{2,10}|[A-Z]{2,10}\/USD/g;
      const text = document.body.innerText;
      const matches = text.match(tokenRegex) || [];
      return [...new Set(matches)];
    } catch (error) {
      return [];
    }
  }

  extractSocialHandles() {
    const handles = {
      twitter: [],
      telegram: [],
      discord: []
    };

    try {
      // Twitter handles
      const twitterRegex = /@[a-zA-Z0-9_]{1,15}/g;
      const twitterMatches = document.body.innerText.match(twitterRegex) || [];
      handles.twitter = [...new Set(twitterMatches)];

      // Twitter profile links
      const twitterLinks = Array.from(document.querySelectorAll('a[href*="twitter.com"], a[href*="x.com"]'));
      twitterLinks.forEach(link => {
        const match = link.href.match(/(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)/);
        if (match) handles.twitter.push('@' + match[1]);
      });

      // Telegram links
      const telegramLinks = Array.from(document.querySelectorAll('a[href*="t.me"]'));
      telegramLinks.forEach(link => {
        const match = link.href.match(/t\.me\/([a-zA-Z0-9_]+)/);
        if (match) handles.telegram.push(match[1]);
      });

      // Discord links
      const discordLinks = Array.from(document.querySelectorAll('a[href*="discord"]'));
      handles.discord = discordLinks.map(link => link.href);
    } catch (error) {
      console.error('Social handles extraction error:', error);
    }

    return handles;
  }

  extractBrandMentions() {
    try {
      const text = document.body.innerText;
      const brandRegex = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g;
      const matches = text.match(brandRegex) || [];
      
      const counts = {};
      matches.forEach(brand => {
        counts[brand] = (counts[brand] || 0) + 1;
      });

      return Object.entries(counts)
        .filter(([_, count]) => count >= 3)
        .map(([brand, count]) => ({ brand, count }))
        .slice(0, 20);
    } catch (error) {
      return [];
    }
  }

  extractLogoUrls() {
    try {
      const logos = [];
      const logoSelectors = [
        'img[alt*="logo" i]',
        'img[class*="logo" i]',
        'img[id*="logo" i]',
        '.logo img',
        '#logo img'
      ];

      logoSelectors.forEach(selector => {
        const imgs = document.querySelectorAll(selector);
        imgs.forEach(img => {
          if (img.src) logos.push(img.src);
        });
      });

      return [...new Set(logos)];
    } catch (error) {
      return [];
    }
  }

  detectSuspiciousPhrases() {
    try {
      const suspicious = [
        'airdrop',
        'free tokens',
        'limited time',
        'act now',
        'connect wallet now',
        'claim your',
        'verify now',
        'urgent',
        'last chance',
        'ending soon',
        'exclusive offer',
        'guaranteed returns',
        '100x',
        'moon',
        'lambo'
      ];

      const text = document.body.innerText.toLowerCase();
      const found = [];

      suspicious.forEach(phrase => {
        if (text.includes(phrase)) {
          found.push(phrase);
        }
      });

      return found;
    } catch (error) {
      return [];
    }
  }

  detectUrgencyLanguage() {
    try {
      const urgencyPhrases = [
        'hurry',
        'limited time',
        'ending soon',
        'last chance',
        'act now',
        'don\'t miss',
        'only'
      ];

      const text = document.body.innerText.toLowerCase();
      return urgencyPhrases.filter(phrase => text.includes(phrase));
    } catch (error) {
      return [];
    }
  }

  detectWalletButtons() {
    try {
      const buttons = Array.from(document.querySelectorAll('button, a'));
      const walletButtons = buttons.filter(btn => {
        const text = btn.textContent.toLowerCase();
        return text.includes('connect wallet') || 
               text.includes('connect') ||
               text.includes('metamask') ||
               text.includes('wallet');
      });

      return walletButtons.map(btn => ({
        text: btn.textContent.trim(),
        href: btn.href || null,
        type: btn.tagName.toLowerCase()
      }));
    } catch (error) {
      return [];
    }
  }

  extractMetaTags() {
    try {
      const metas = {};
      const metaTags = document.querySelectorAll('meta');
      
      metaTags.forEach(meta => {
        const name = meta.getAttribute('name') || meta.getAttribute('property');
        const content = meta.getAttribute('content');
        if (name && content) {
          metas[name] = content;
        }
      });

      return metas;
    } catch (error) {
      return {};
    }
  }

  checkDocumentation() {
    try {
      const docLinks = Array.from(document.querySelectorAll('a'))
        .filter(a => {
          const text = a.textContent.toLowerCase();
          return text.includes('docs') || 
                 text.includes('documentation') ||
                 text.includes('whitepaper');
        });

      return docLinks.length > 0;
    } catch (error) {
      return false;
    }
  }

  checkTermsOfService() {
    try {
      const termsLinks = Array.from(document.querySelectorAll('a'))
        .filter(a => {
          const text = a.textContent.toLowerCase();
          return text.includes('terms') || text.includes('tos');
        });

      return termsLinks.length > 0;
    } catch (error) {
      return false;
    }
  }

  checkPrivacyPolicy() {
    try {
      const privacyLinks = Array.from(document.querySelectorAll('a'))
        .filter(a => {
          const text = a.textContent.toLowerCase();
          return text.includes('privacy');
        });

      return privacyLinks.length > 0;
    } catch (error) {
      return false;
    }
  }

  async analyzeWithBackend(pageContext) {
    try {
      console.log('ScamSniff: Sending to backend:', this.apiEndpoint);
      
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ pageContext }),
        mode: 'cors' // Important for CORS
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Analysis failed');
      }

      return data;
    } catch (error) {
      console.error('Backend analysis error:', error);
      
      // Provide more specific error messages
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Cannot connect to AgentBazaar. Please check if the app is running.');
      }
      
      throw error;
    }
  }

  // ELEVENLABS VOICE INTEGRATION
  async speakVerdictElevenLabs(text) {
    try {
      console.log('ScamSniff: Generating ElevenLabs voice...');
      
      // Call our server endpoint (more secure - API key hidden)
      const response = await fetch('http://localhost:3010/api/elevenlabs/speak', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
      });
  
      if (!response.ok) {
        throw new Error('Speech generation failed');
      }
  
      // Get audio blob
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Play audio
      const audio = new Audio(audioUrl);
      audio.volume = 0.8;
      
      audio.addEventListener('ended', () => {
        URL.revokeObjectURL(audioUrl);
      });
  
      await audio.play();
      
      console.log('ScamSniff: Voice played successfully');
  
      // Show toast
      this.showToast(text, 'success');
    } catch (error) {
      console.error('ElevenLabs speech error:', error);
      // Fallback to browser TTS
      this.speakVerdictFallback(text);
    }
  }

  // Fallback to Web Speech API if ElevenLabs fails
  speakVerdictFallback(text) {
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      window.speechSynthesis.speak(utterance);
      this.showToast(text, 'info');
    } catch (error) {
      console.error('Speech synthesis error:', error);
      this.showToast(text, 'info');
    }
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `scamsniff-toast scamsniff-toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 5000);
  }

  showReportOption(reportId) {
    const banner = document.createElement('div');
    banner.className = 'scamsniff-report-banner';
    banner.innerHTML = `
      <div class="banner-content">
        <span>ScamSniff scan complete</span>
        <a href="http://localhost:3010/agents/scamsniff/reports/${reportId}" target="_blank">
          View Detailed Report →
        </a>
      </div>
    `;
    
    document.body.appendChild(banner);
    
    setTimeout(() => banner.classList.add('show'), 100);
    setTimeout(() => {
      banner.classList.remove('show');
      setTimeout(() => banner.remove(), 300);
    }, 8000);
  }
}

// Initialize ScamSniff orb when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new ScamSniffOrb();
  });
} else {
  new ScamSniffOrb();
}

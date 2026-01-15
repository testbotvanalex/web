// Cookie Consent Banner
(function () {
    'use strict';

    // Check if user already accepted
    if (localStorage.getItem('cookieConsent') === 'accepted') {
        return;
    }

    // Create banner HTML
    const banner = document.createElement('div');
    banner.id = 'cookie-banner';
    banner.innerHTML = `
    <div class="cookie-content">
      <p>
        <strong>🍪 Cookies</strong><br>
        We gebruiken cookies om je ervaring te verbeteren. Door verder te gaan, ga je akkoord met ons 
        <a href="/privacy.html">privacybeleid</a>.
      </p>
      <div class="cookie-buttons">
        <button id="cookie-accept" class="btn-accept">Accepteren</button>
        <button id="cookie-decline" class="btn-decline">Weigeren</button>
      </div>
    </div>
  `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
    #cookie-banner {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba(0, 0, 0, 0.95);
      backdrop-filter: blur(10px);
      color: white;
      padding: 20px;
      z-index: 9999;
      box-shadow: 0 -4px 20px rgba(0,0,0,0.3);
      animation: slideUp 0.3s ease;
    }
    
    @keyframes slideUp {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }
    
    .cookie-content {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
    }
    
    .cookie-content p {
      margin: 0;
      font-size: 14px;
      line-height: 1.6;
    }
    
    .cookie-content strong {
      font-size: 16px;
      display: block;
      margin-bottom: 4px;
    }
    
    .cookie-content a {
      color: #10B981;
      text-decoration: underline;
    }
    
    .cookie-buttons {
      display: flex;
      gap: 12px;
      flex-shrink: 0;
    }
    
    .btn-accept,
    .btn-decline {
      padding: 10px 24px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
      font-family: inherit;
    }
    
    .btn-accept {
      background: #10B981;
      color: white;
    }
    
    .btn-accept:hover {
      background: #059669;
      transform: translateY(-1px);
    }
    
    .btn-decline {
      background: rgba(255, 255, 255, 0.1);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .btn-decline:hover {
      background: rgba(255, 255, 255, 0.15);
    }
    
    @media (max-width: 768px) {
      .cookie-content {
        flex-direction: column;
        text-align: center;
      }
      
      .cookie-buttons {
        width: 100%;
      }
      
      .btn-accept,
      .btn-decline {
        flex: 1;
      }
    }
  `;

    // Add to page
    document.head.appendChild(style);
    document.body.appendChild(banner);

    // Handle accept
    document.getElementById('cookie-accept').addEventListener('click', function () {
        localStorage.setItem('cookieConsent', 'accepted');
        banner.style.animation = 'slideDown 0.3s ease';
        setTimeout(() => banner.remove(), 300);
    });

    // Handle decline
    document.getElementById('cookie-decline').addEventListener('click', function () {
        localStorage.setItem('cookieConsent', 'declined');
        banner.style.animation = 'slideDown 0.3s ease';
        setTimeout(() => banner.remove(), 300);
    });

    // Add slide down animation
    const slideDownStyle = document.createElement('style');
    slideDownStyle.textContent = `
    @keyframes slideDown {
      from { transform: translateY(0); }
      to { transform: translateY(100%); }
    }
  `;
    document.head.appendChild(slideDownStyle);
})();

// counter.js - Creates and updates the visible user counter
(function(){
  function attachCounter(channel) {
    if (!channel) return;

    // Create counter element if missing
    if (!document.getElementById('userCounter')) {
      const counter = document.createElement('div');
      counter.id = 'userCounter';
      Object.assign(counter.style, {
        position: 'fixed',
        bottom: '15px',
        right: '15px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 14px',
        background: 'linear-gradient(90deg, #2575fc, #6a11cb)',
        color: 'white',
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        zIndex: '9999',
        opacity: '0.92',
        transition: 'opacity 0.3s ease'
      });

      counter.innerHTML = `
        <div id="statusDot" style="
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background-color: limegreen;
          box-shadow: 0 0 6px 2px rgba(0,255,0,0.5);
          animation: pulse 1.5s infinite;
        "></div>
        <span id="userText">Connecting...</span>
      `;
      document.body.appendChild(counter);

      const style = document.createElement('style');
      style.textContent = `
        @keyframes pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.25);opacity:0.8} }
      `;
      document.head.appendChild(style);

      counter.addEventListener('mouseenter', () => counter.style.opacity = '1');
      counter.addEventListener('mouseleave', () => counter.style.opacity = '0.92');
    }

    function updateCount() {
      channel.presence.get((err, members) => {
        if (err) return console.error('Presence.get error:', err);
        const count = members.length;
        const userText = document.getElementById('userText');
        if (userText) {
          userText.textContent = `${count} user${count !== 1 ? 's' : ''} online`;
        }
      });
    }

    channel.presence.subscribe('enter', updateCount);
    channel.presence.subscribe('leave', updateCount);
    setTimeout(updateCount, 1000);
  }

  if (window.siteChannel) {
    attachCounter(window.siteChannel);
  } else {
    window.addEventListener('ably-ready', () => attachCounter(window.siteChannel));
  }
})();

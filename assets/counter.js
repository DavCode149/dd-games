<script>
/*
  counter.js
  - Include only on pages where you want the visible online counter.
  - Waits for tracker to be ready (or uses existing window.siteChannel).
  - Creates #userCounter element and updates it on presence changes.
*/
(function(){
  // helper to attach update behavior once channel exists
  function attachCounter(channel) {
    if (!channel) return;

    // create counter element (if not present)
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
        transition: 'opacity 0.3s ease, transform 0.3s ease'
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
        @keyframes countChange { 0%{transform:scale(1)}50%{transform:scale(1.15)}100%{transform:scale(1)} }
      `;
      document.head.appendChild(style);

      counter.addEventListener('mouseenter', () => counter.style.opacity = '1');
      counter.addEventListener('mouseleave', () => counter.style.opacity = '0.92');
    }

    // update function with pulse on change
    let lastCount = null;
    function updateCount() {
      try {
        channel.presence.get((err, members) => {
          if (err) {
            console.error('Presence.get error:', err);
            return;
          }
          const count = members.length;
          const userText = document.getElementById('userText');
          const counterEl = document.getElementById('userCounter');
          if (userText) {
            userText.textContent = `${count} user${count !== 1 ? 's' : ''} online`;
            if (lastCount !== null && count !== lastCount && counterEl) {
              counterEl.style.animation = 'countChange 0.35s ease';
              setTimeout(() => { counterEl.style.animation = ''; }, 350);
            }
          }
          lastCount = count;
        });
      } catch (e) {
        console.error('updateCount error', e);
      }
    }

    // subscribe to presence changes
    try {
      channel.presence.subscribe('enter', updateCount);
      channel.presence.subscribe('leave',  updateCount);
      // do an initial update shortly after attach
      setTimeout(updateCount, 600);
    } catch (e) {
      console.error('Failed to subscribe to presence events:', e);
    }
  }

  // if siteChannel already exists, attach immediately
  if (window.siteChannel) {
    attachCounter(window.siteChannel);
  } else {
    // otherwise wait for the tracker to dispatch 'ably-ready' event
    window.addEventListener('ably-ready', function onReady(){
      window.removeEventListener('ably-ready', onReady);
      if (window.siteChannel) attachCounter(window.siteChannel);
    });
    // also set a fallback in case 'ably-ready' never fires
    setTimeout(() => {
      if (window.siteChannel) attachCounter(window.siteChannel);
    }, 5000);
  }
})();
</script>

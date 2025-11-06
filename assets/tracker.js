(function initTracker() {
  function startTracker() {
    try {
      const ABLY_API_KEY = "f4iV1g.CdzItg:DMBDb8oONqNtkeH6dq25U4DYKAfd-7GQ6uEKXuqUJVw";
      const CHANNEL_NAME = "site-active-users";

      window.siteAbly = new Ably.Realtime({
        key: ABLY_API_KEY,
        clientId: 'webUser-' + Math.random().toString(36).substring(2, 9)
      });

      window.siteChannel = window.siteAbly.channels.get(CHANNEL_NAME);

      window.siteAbly.connection.once('connected', () => {
        window.siteChannel.presence.enter({ page: location.pathname });
        window.dispatchEvent(new CustomEvent('ably-ready'));
      });

      window.addEventListener('beforeunload', () => {
        try { window.siteChannel.presence.leave(); } catch (e) {}
      });
    } catch (e) {
      console.error('Failed to initialize Ably tracker:', e);
    }
  }

  // Wait for Ably to load if not ready yet
  if (typeof Ably === 'undefined') {
    console.log('Waiting for Ably to load...');
    const checkInterval = setInterval(() => {
      if (typeof Ably !== 'undefined') {
        clearInterval(checkInterval);
        startTracker();
      }
    }, 200);
  } else {
    startTracker();
  }
})();

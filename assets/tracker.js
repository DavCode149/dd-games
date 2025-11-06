// tracker.js - Handles invisible presence tracking
(function(){
  if (window.siteAbly) return; // already running

  try {
    const ABLY_API_KEY = "f4iV1g.CdzItg:DMBDb8oONqNtkeH6dq25U4DYKAfd-7GQ6uEKXuqUJVw";
    const CHANNEL_NAME = "site-active-users";

    window.siteAbly = new Ably.Realtime({
      key: ABLY_API_KEY,
      clientId: 'webUser-' + Math.random().toString(36).substring(2, 9)
    });

    window.siteChannel = window.siteAbly.channels.get(CHANNEL_NAME);

    window.siteAbly.connection.once('connected', () => {
      try {
        window.siteChannel.presence.enter({ page: location.pathname });
      } catch (err) {
        console.warn('Ably presence.enter failed:', err);
      }
      window.dispatchEvent(new CustomEvent('ably-ready'));
    });

    window.addEventListener('beforeunload', () => {
      try { window.siteChannel.presence.leave(); } catch (e) {}
    });

  } catch (e) {
    console.error('Failed to initialize Ably tracker:', e);
  }
})();

<script>
/*
  tracker.js
  - Include on every page.
  - Creates window.siteAbly and window.siteChannel.
  - Dispatches a "ably-ready" event when connected.
*/
(function(){
  if (window.siteAbly) return; // already initialized

  try {
    const ABLY_API_KEY = "f4iV1g.CdzItg:DMBDb8oONqNtkeH6dq25U4DYKAfd-7GQ6uEKXuqUJVw"; // replace if needed
    const CHANNEL_NAME  = "site-active-users";

    // create ably instance with a random clientId (prevents 40012)
    window.siteAbly = new Ably.Realtime({
      key: ABLY_API_KEY,
      clientId: 'webUser-' + Math.random().toString(36).substring(2,9)
    });

    window.siteChannel = window.siteAbly.channels.get(CHANNEL_NAME);

    // join presence when connected
    window.siteAbly.connection.once('connected', () => {
      try {
        // include some lightweight info (page path) for debugging if desired
        window.siteChannel.presence.enter({ page: location.pathname });
      } catch (err) {
        console.warn('Ably presence.enter failed:', err);
      }
      // signal other scripts that Ably is ready
      window.dispatchEvent(new CustomEvent('ably-ready'));
    });

    // safe leave on unload
    window.addEventListener('beforeunload', () => {
      try {
        window.siteChannel.presence.leave();
      } catch (e) {
        // ignore
      }
    });

    // handle connection errors (log only)
    window.siteAbly.connection.on('failed', (stateChange) => {
      console.error('Ably connection failed:', stateChange);
    });

  } catch (e) {
    console.error('Failed to initialize Ably tracker:', e);
  }
})();
</script>

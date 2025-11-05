(function() {
  if (!window.siteChannel) {
    console.error("Ably not initialized yet — make sure main tracker script is loaded first.");
    return;
  }

  // === Create floating counter box ===
  const counter = document.createElement("div");
  counter.id = "userCounter";
  Object.assign(counter.style, {
    position: "fixed",
    bottom: "15px",
    right: "15px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 14px",
    background: "linear-gradient(90deg, #2575fc, #6a11cb)",
    color: "white",
    fontFamily: "Arial, sans-serif",
    fontSize: "14px",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
    zIndex: "999",
    opacity: "0.9",
    transition: "opacity 0.3s ease, transform 0.3s ease"
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

  // === Pulse animation style ===
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.3); opacity: 0.7; }
    }
    @keyframes countChange {
      0% { transform: scale(1); }
      50% { transform: scale(1.3); }
      100% { transform: scale(1); }
    }
  `;
  document.head.appendChild(style);

  // === Update user count ===
  let lastCount = null;
  function updateCount() {
    window.siteChannel.presence.get((err, members) => {
      if (err) return;
      const count = members.length;
      const userText = document.getElementById("userText");
      if (userText) {
        userText.textContent = `${count} user${count !== 1 ? "s" : ""} online`;
        if (lastCount !== null && count !== lastCount) {
          counter.style.animation = "countChange 0.4s ease";
          setTimeout(() => counter.style.animation = "", 400);
        }
      }
      lastCount = count;
    });
  }

  // === Presence updates ===
  window.siteChannel.presence.subscribe("enter", updateCount);
  window.siteChannel.presence.subscribe("leave", updateCount);

  // Initial update
  setTimeout(updateCount, 1000);

  // Hover fade effect
  counter.addEventListener("mouseenter", () => counter.style.opacity = "1");
  counter.addEventListener("mouseleave", () => counter.style.opacity = "0.9");
})();

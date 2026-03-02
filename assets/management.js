import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://lqfcntoldutgkzaboqfk.supabase.co";
const supabaseKey = "sb_publishable_Zs0J8nka95CzLZJ7BWqEAg_sqD5Wr0d";
const supabase = createClient(supabaseUrl, supabaseKey);

const PREMIUM_PAGE_URL = "/dd-games/assets/premium-info.html";

/* DEVICE ID */
function getOrCreateDeviceID() {
  let id = localStorage.getItem("device_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("device_id", id);
  }
  return id;
}

/* DEVICE INFO */
function getDeviceInfo() {
  return {
    browser: navigator.userAgent,
    os: navigator.platform,
    device: /Mobi|Android/i.test(navigator.userAgent) ? "Mobile" : "Desktop",
    page: location.pathname
  };
}

/* CHECK IF THIS PAGE IS PREMIUM */
function pageIsPremium() {
  return document.body.dataset.premium === "true";
}

const deviceID = getOrCreateDeviceID();
const info = getDeviceInfo();

/* IP */
const ipRes = await fetch("https://api.ipify.org?format=json");
const ip = (await ipRes.json()).ip;

/* LOOKUP USER */
const { data: existingUser, error: lookupError } = await supabase
  .from("users")
  .select('*')
  .eq("user_id", deviceID)
  .maybeSingle();

if (lookupError) {
  console.error("Lookup error:", lookupError);
}

/* CREATE USER */
if (!existingUser) {
  await supabase.from("users").insert({
    user_id: deviceID,
    ip,
    browser: info.browser,
    os: info.os,
    device: info.device,
    page: info.page,
    last_seen: new Date(),
    visit_count: 1,
    blocked: false,
    "Name": "",
    "Playtime": 0,
    "Premium": false
  });

} else {
  if (existingUser.blocked) {
    document.body.innerHTML = "<h1>Access denied.</h1>";
    throw new Error("Blocked");
  }

  /* 🚫 PREMIUM PAGE CHECK */
  const isPremiumPage = pageIsPremium();
  const hasPremium = existingUser.Premium === true;

  if (isPremiumPage && !hasPremium) {
    window.location.href = "/dd-games/assets/premium-info.html";
    throw new Error("Premium required");
  }
  if (hasPremium) {
    setInterval(() => {
      document
        .getElementById("atContainer-a19f6c85731f299418a7856e52d88a41")
        ?.remove();
    }, 500);
  }
  // Redirect if no name
  if (!existingUser.Name || existingUser.Name.trim() === "") {
    if (!location.pathname.endsWith("main.html")) {
      window.location.href = "/dd-games/main.html";
    }
  }

  await supabase.from("users").update({
    ip,
    browser: info.browser,
    os: info.os,
    device: info.device,
    page: info.page,
    last_seen: new Date(),
    visit_count: (existingUser.visit_count || 0) + 1
  }).eq("user_id", deviceID);
}

/* PLAYTIME TIMER (every minute) */
setInterval(async () => {
  const { data, error } = await supabase
    .from("users")
    .select('"Playtime", blocked, "Premium"')
    .eq("user_id", deviceID)
    .maybeSingle();

  if (error) {
    console.error("Playtime fetch error:", error);
    return;
  }

  if (!data) return;

  if (data.blocked) {
    document.body.innerHTML = "<h1>You have been Blocked for breaking DD Games' TOS.</h1>";
    return;
  }

  /* 🚫 STILL CHECK PREMIUM WHILE PLAYING */
  if (pageIsPremium() && data.Premium !== true) {
    window.location.href = PREMIUM_PAGE_URL;
    return;
  }

  await supabase.from("users").update({
    "Playtime": (data["Playtime"] || 0) + 1,
    last_seen: new Date()
  }).eq("user_id", deviceID);

}, 60000);
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://lqfcntoldutgkzaboqfk.supabase.co";
const supabaseKey = "sb_publishable_Zs0J8nka95CzLZJ7BWqEAg_sqD5Wr0d";
const supabase = createClient(supabaseUrl, supabaseKey);

const PREMIUM_PAGE_URL = "/dd-games/assets/premium-info.html";
const GUEST_ID = "00000000-0000-0000-0000-000000000000";

// ── Device ID ────────────────────────────────────────────
function getOrCreateDeviceID(){
  let id = localStorage.getItem("device_id");
  if(!id){
    id = crypto.randomUUID();
    localStorage.setItem("device_id", id);
  }
  return id;
}

function getDeviceInfo(){
  return {
    browser: navigator.userAgent,
    os: navigator.platform,
    device: /Mobi|Android/i.test(navigator.userAgent) ? "Mobile" : "Desktop",
    page: location.pathname
  };
}

// ── Premium page detection ───────────────────────────────
function pageIsPremium(){
  return document.body.dataset.premium === "true";
}

const deviceID = getOrCreateDeviceID();
const info = getDeviceInfo();

// ── Guest mode ───────────────────────────────────────────
if(deviceID === GUEST_ID){
  if(pageIsPremium()){
    window.location.href = PREMIUM_PAGE_URL;
    throw new Error("Guests cannot access premium pages");
  }
  throw new Error("Guest mode — skipping management");
}

// ── IP ───────────────────────────────────────────────────
const ipRes = await fetch("https://api.ipify.org?format=json");
const ip = (await ipRes.json()).ip;

// ── Lookup user ──────────────────────────────────────────
const { data: existingUser, error: lookupError } = await supabase
  .from("users").select("*")
  .eq("user_id", deviceID).maybeSingle();

if(lookupError) console.error("Lookup error:", lookupError);

// ── New user ─────────────────────────────────────────────
if(!existingUser){
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
    Name: "",
    Playtime: 0,
    Access: true,
    premium: true
  });

} else {

  // ── Blocked check ──────────────────────────────────────
  if(existingUser.blocked){
    document.body.innerHTML = "<h1>Access denied.</h1>";
    throw new Error("Blocked");
  }

  // ── Premium page check ─────────────────────────────────
  if(pageIsPremium() && existingUser.premium !== true){
    window.location.href = PREMIUM_PAGE_URL;
    throw new Error("Premium required");
  }

  // ── Name check — redirect to setup if missing ──────────
  if(!existingUser.Name || existingUser.Name.trim() === ""){
    if(!location.pathname.endsWith("main.html")){
      window.location.href = "/dd-games/main.html";
    }
  }

  // ── Update visit info ──────────────────────────────────
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

// ── Playtime timer (every minute) ────────────────────────
setInterval(async () => {
  const { data, error } = await supabase
    .from("users")
    .select('"Playtime", blocked, premium')
    .eq("user_id", deviceID).maybeSingle();

  if(error){ console.error("Playtime fetch error:", error); return; }
  if(!data) return;

  if(data.blocked){
    document.body.innerHTML = "<h1>You have been blocked for breaking DD Games' TOS.</h1>";
    return;
  }

  if(pageIsPremium() && data.premium !== true){
    window.location.href = PREMIUM_PAGE_URL;
    return;
  }

  await supabase.from("users").update({
    Playtime: (data["Playtime"] || 0) + 1,
    last_seen: new Date()
  }).eq("user_id", deviceID);

}, 60000);
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://lqfcntoldutgkzaboqfk.supabase.co";
const supabaseKey = "sb_publishable_Zs0J8nka95CzLZJ7BWqEAg_sqD5Wr0d";
const supabase = createClient(supabaseUrl, supabaseKey);

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

const deviceID = getOrCreateDeviceID();
const info = getDeviceInfo();

/* IP */
const ipRes = await fetch("https://api.ipify.org?format=json");
const ip = (await ipRes.json()).ip;

/* LOOKUP USER */
const { data: existingUser } = await supabase
  .from("users")
  .select("*")
  .eq("user_id", deviceID)
  .maybeSingle();

/* CREATE */
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
    playtime: 0,
    blocked: false,
    Name: ""
  });
} else {
  if (existingUser.blocked) {
    document.body.innerHTML = "<h1>Access denied.</h1>";
    throw new Error("Blocked");
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
  const { data } = await supabase
    .from("users")
    .select("playtime,blocked")
    .eq("user_id", deviceID)
    .single();

  if (data?.blocked) {
    document.body.innerHTML = "<h1>Access denied.</h1>";
    return;
  }

  await supabase.from("users").update({
    playtime: (data.playtime || 0) + 1,
    last_seen: new Date()
  }).eq("user_id", deviceID);

}, 60000);

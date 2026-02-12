import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://lqfcntoldutgkzaboqfk.supabase.co";
const supabaseKey = "sb_publishable_Zs0J8nka95CzLZJ7BWqEAg_sqD5Wr0d";
const supabase = createClient(supabaseUrl, supabaseKey);

function getOrCreateDeviceID() {
  let id = localStorage.getItem("device_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("device_id", id);
  }
  return id;
}

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

const ipRes = await fetch("https://api.ipify.org?format=json");
const ipData = await ipRes.json();
const ip = ipData.ip;

const { data: existingUser } = await supabase
  .from("users")
  .select("*")
  .eq("user_id", deviceID)
  .single();

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
    blocked: false
  });
} else {
  await supabase.from("users").update({
    ip,
    browser: info.browser,
    os: info.os,
    device: info.device,
    page: info.page,
    last_seen: new Date(),
    visit_count: existingUser.visit_count + 1
  }).eq("user_id", deviceID);

  if (existingUser.blocked === true) {
    document.body.innerHTML = "<h1>Access denied.</h1>";
  }
}

// src/geolocation.js
async function getCountryCodeByIP() {
  try {
    const res = await fetch('https://ipapi.co/json/');
    const data = await res.json();
    return data.country || null;
  } catch (err) {
    console.warn('IP-Geolocation failed:', err);
    return null;
  }
}

// src/geolocation.js
/**
 * Liefert den ISO-2-Ländercode des Nutzers per IP-Geolocation.
 * Nutzt https://ipapi.co (CORS-unterstützt).
 */
async function getCountryCodeByIP() {
  try {
    const res = await fetch('https://ipapi.co/json/');
    const data = await res.json();
    return data.country || null;
  } catch (err) {
    console.warn('IP-Geolocation fehlgeschlagen:', err);
    return null;
  }
}

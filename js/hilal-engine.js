/* ================================
   Hilal Astronomical Engine
   Shared by forecast + cities page
================================ */

/* ---- Utilities ---- */

function toRad(d) { return d * Math.PI / 180; }
function toDeg(r) { return r * 180 / Math.PI; }

/* ---- Julian Date ---- */

function julianDate(date) {
  return date / 86400000 + 2440587.5;
}

/* ---- Solar Position (NOAA approx) ---- */

function solarPosition(date, lat, lon) {
  const JD = julianDate(date);
  const T = (JD - 2451545.0) / 36525;

  const L0 = (280.46646 + 36000.76983*T) % 360;
  const M = 357.52911 + 35999.05029*T;
  const e = 0.016708634 - T*(0.000042037 + 0.0000001267*T);

  const C = (1.914602 - T*(0.004817 + 0.000014*T))*Math.sin(toRad(M))
          + (0.019993 - 0.000101*T)*Math.sin(toRad(2*M))
          + 0.000289*Math.sin(toRad(3*M));

  const trueLong = L0 + C;
  const epsilon = 23.439291 - 0.0130042*T;

  const RA = toDeg(Math.atan2(
    Math.cos(toRad(epsilon))*Math.sin(toRad(trueLong)),
    Math.cos(toRad(trueLong))
  ));

  const Dec = toDeg(Math.asin(
    Math.sin(toRad(epsilon))*Math.sin(toRad(trueLong))
  ));

  return { RA, Dec };
}

/* ---- Simplified Lunar Position ---- */

function lunarPosition(date) {
  const JD = julianDate(date);
  const T = (JD - 2451545.0) / 36525;

  const L = (218.316 + 13.176396 * (JD - 2451545)) % 360;
  const M = (134.963 + 13.064993 * (JD - 2451545)) % 360;

  const lambda = L + 6.289 * Math.sin(toRad(M));
  const beta = 5.128 * Math.sin(toRad(M));

  const epsilon = 23.439 - 0.0000004*T;

  const RA = toDeg(Math.atan2(
    Math.sin(toRad(lambda))*Math.cos(toRad(epsilon)) -
    Math.tan(toRad(beta))*Math.sin(toRad(epsilon)),
    Math.cos(toRad(lambda))
  ));

  const Dec = toDeg(Math.asin(
    Math.sin(toRad(beta))*Math.cos(toRad(epsilon)) +
    Math.cos(toRad(beta))*Math.sin(toRad(epsilon))*Math.sin(toRad(lambda))
  ));

  return { RA, Dec };
}

/* ---- Hour Angle ---- */

function hourAngle(lat, dec, alt) {
  return Math.acos(
    (Math.sin(toRad(alt)) -
     Math.sin(toRad(lat))*Math.sin(toRad(dec))) /
    (Math.cos(toRad(lat))*Math.cos(toRad(dec)))
  );
}

/* ---- Sunset Time ---- */

function sunsetTime(date, lat, lon) {
  const noon = new Date(date);
  noon.setUTCHours(12,0,0,0);

  const sun = solarPosition(noon, lat, lon);
  const H = hourAngle(lat, sun.Dec, -0.833); // sunset

  const delta = toDeg(H)/15;
  return new Date(noon.getTime() + delta*3600000);
}

/* ---- Altitude ---- */

function altitude(lat, dec, H) {
  return toDeg(Math.asin(
    Math.sin(toRad(lat))*Math.sin(toRad(dec)) +
    Math.cos(toRad(lat))*Math.cos(toRad(dec))*Math.cos(H)
  ));
}

/* ---- Elongation ---- */

function elongation(sunRA, sunDec, moonRA, moonDec) {
  return toDeg(Math.acos(
    Math.sin(toRad(sunDec))*Math.sin(toRad(moonDec)) +
    Math.cos(toRad(sunDec))*Math.cos(toRad(moonDec)) *
    Math.cos(toRad(sunRA - moonRA))
  ));
}

/* ---- Odeh Classification ---- */

/* ---- Odeh Classification (A/B/C/D) ---- */

function odehCategory(date, lat, lon) {

  const sunset = sunsetTime(date, lat, lon);
  const sun = solarPosition(sunset, lat, lon);
  const moon = lunarPosition(sunset);

  const H = hourAngle(lat, moon.Dec, 0);
  const alt = altitude(lat, moon.Dec, H);

  const elong = elongation(sun.RA, sun.Dec, moon.RA, moon.Dec);

  // Category A – Naked eye easily visible
  if (elong > 14 && alt > 8) return 3;

  // Category B – Visible with optical aid, possible naked eye
  if (elong > 11 && alt > 5) return 2;

  // Category C – Optical aid only
  if (elong > 8 && alt > 2) return 1;

  // Category D – Not visible
  return 0;
}

window.odehCategory = odehCategory;

/* Export for pages */
window.odehCategory = odehCategory;

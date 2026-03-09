/* ======================================================
   High Accuracy Hilal Visibility Engine
   Based on Meeus + Odeh Crescent Visibility Criterion
   ====================================================== */

const RAD = Math.PI/180;
const DEG = 180/Math.PI;

/* ---------- JULIAN DATE ---------- */

function julian(date){
  return date.getTime()/86400000 + 2440587.5;
}

/* ---------- SUN POSITION (NOAA) ---------- */

function sunCoords(d){

  const g = (357.529 + 0.98560028*d)*RAD;
  const q = (280.459 + 0.98564736*d)*RAD;

  const L = q + (1.915*Math.sin(g) + 0.020*Math.sin(2*g))*RAD;

  const e = 23.439*RAD;

  const RA = Math.atan2(Math.cos(e)*Math.sin(L),Math.cos(L));
  const dec = Math.asin(Math.sin(e)*Math.sin(L));

  return {RA,dec};
}

/* ---------- MOON POSITION (Meeus simplified) ---------- */

function moonCoords(d){

  const L = (218.316 + 13.176396*d)*RAD;
  const M = (134.963 + 13.064993*d)*RAD;
  const F = (93.272 + 13.229350*d)*RAD;

  const lon = L + 6.289*Math.sin(M)*RAD;
  const lat = 5.128*Math.sin(F)*RAD;

  const e = 23.439*RAD;

  const RA = Math.atan2(
    Math.sin(lon)*Math.cos(e) -
    Math.tan(lat)*Math.sin(e),
    Math.cos(lon)
  );

  const dec = Math.asin(
    Math.sin(lat)*Math.cos(e) +
    Math.cos(lat)*Math.sin(e)*Math.sin(lon)
  );

  return {RA,dec};
}

/* ---------- LOCAL SIDEREAL TIME ---------- */

function siderealTime(d,lon){

  const s = 280.16 + 360.9856235*d;
  return (s + lon) % 360 * RAD;

}

/* ---------- ALTITUDE ---------- */

function altitude(lat,dec,H){

  lat *= RAD;

  return Math.asin(
    Math.sin(lat)*Math.sin(dec) +
    Math.cos(lat)*Math.cos(dec)*Math.cos(H)
  );

}

/* ---------- SUNSET TIME (NOAA) ---------- */

function sunset(date,lat,lon){

  const d = julian(date) - 2451545;

  const n = Math.round(d - lon/360);

  const Jstar = 2451545 + n + lon/360;

  const M = (357.5291 + 0.98560028*(Jstar-2451545))*RAD;

  const C =
    1.9148*Math.sin(M) +
    0.0200*Math.sin(2*M) +
    0.0003*Math.sin(3*M);

  const L = (M*DEG + C + 180 + 102.9372) * RAD;

  const Jtransit =
    Jstar +
    0.0053*Math.sin(M) -
    0.0069*Math.sin(2*L);

  const dec = Math.asin(Math.sin(L)*Math.sin(23.44*RAD));

  const w = Math.acos(
    (Math.sin(-0.833*RAD) -
     Math.sin(lat*RAD)*Math.sin(dec)) /
    (Math.cos(lat*RAD)*Math.cos(dec))
  );

  const Jset = Jtransit + w/(2*Math.PI);

  return new Date((Jset-2440587.5)*86400000);

}

/* ---------- ELONGATION ---------- */

function elongation(sun,moon){

  return Math.acos(
    Math.sin(sun.dec)*Math.sin(moon.dec) +
    Math.cos(sun.dec)*Math.cos(moon.dec)*
    Math.cos(sun.RA-moon.RA)
  )*DEG;

}

/* ---------- MOON ALTITUDE AT SUNSET ---------- */

function moonAltitudeAtSunset(date,lat,lon){

  const set = sunset(date,lat,lon);

  const d = julian(set) - 2451545;

  const sun = sunCoords(d);
  const moon = moonCoords(d);

  const LST = siderealTime(d,lon);

  const H = LST - moon.RA;

  const alt = altitude(lat,moon.dec,H)*DEG;

  const el = elongation(sun,moon);

  return {
    altitude: alt,
    elongation: el
  };

}

/* ---------- ODEH Q VALUE ---------- */

function odehQ(alt,elong){

  return alt - (11.837 + 6.322*elong - 0.7319*elong*elong)/10;

}

/* ---------- ODEH VISIBILITY CATEGORY ---------- */

function odehCategory(date,lat,lon){

  const res = moonAltitudeAtSunset(date,lat,lon);

  const q = odehQ(res.altitude,res.elongation);

  if(q > 0.216) return {cat:"A",q};
  if(q > -0.014) return {cat:"B",q};
  if(q > -0.160) return {cat:"C",q};

  return {cat:"D",q};

}

/* ---------- GLOBAL VISIBILITY GRID ---------- */

function visibilityGrid(date){

  const grid=[];

  for(let lat=-60;lat<=60;lat+=2){

    for(let lon=-180;lon<=180;lon+=2){

      const v = odehCategory(date,lat,lon);

      grid.push({
        lat,
        lon,
        cat:v.cat,
        q:v.q
      });

    }

  }

  return grid;

}

/* ---------- EXPORT ---------- */

window.sunset = sunset;
window.moonAltitudeAtSunset = moonAltitudeAtSunset;
window.odehCategory = odehCategory;
window.visibilityGrid = visibilityGrid;

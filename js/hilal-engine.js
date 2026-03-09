/* Hilal Visibility Engine
   Simplified astronomical engine for Odeh classification
*/

function toJulian(date){
  return date.getTime()/86400000 + 2440587.5;
}

function sunPosition(date){
  const d = toJulian(date) - 2451545;

  const g = (357.529 + 0.98560028*d) * Math.PI/180;
  const q = (280.459 + 0.98564736*d) * Math.PI/180;

  const L = q + (1.915*Math.sin(g) + 0.020*Math.sin(2*g)) * Math.PI/180;

  const e = 23.439 * Math.PI/180;

  const RA = Math.atan2(Math.cos(e)*Math.sin(L), Math.cos(L));
  const Dec = Math.asin(Math.sin(e)*Math.sin(L));

  return {RA,Dec};
}

function moonPosition(date){
  const d = toJulian(date) - 2451545;

  const L = (218.316 + 13.176396*d) * Math.PI/180;
  const M = (134.963 + 13.064993*d) * Math.PI/180;
  const F = (93.272 + 13.229350*d) * Math.PI/180;

  const lon = L + 6.289*Math.sin(M)*Math.PI/180;
  const lat = 5.128*Math.sin(F)*Math.PI/180;

  const e = 23.439*Math.PI/180;

  const RA = Math.atan2(
    Math.sin(lon)*Math.cos(e) - Math.tan(lat)*Math.sin(e),
    Math.cos(lon)
  );

  const Dec = Math.asin(
    Math.sin(lat)*Math.cos(e) +
    Math.cos(lat)*Math.sin(e)*Math.sin(lon)
  );

  return {RA,Dec};
}

function altitude(lat, dec, H){
  lat *= Math.PI/180;

  return Math.asin(
    Math.sin(lat)*Math.sin(dec) +
    Math.cos(lat)*Math.cos(dec)*Math.cos(H)
  );
}

function elongation(sun,moon){

  return Math.acos(
    Math.sin(sun.Dec)*Math.sin(moon.Dec) +
    Math.cos(sun.Dec)*Math.cos(moon.Dec)*Math.cos(sun.RA-moon.RA)
  ) * 180/Math.PI;

}

function odehCategory(date,lat,lon){

  const sun = sunPosition(date);
  const moon = moonPosition(date);

  const el = elongation(sun,moon);

  const alt = altitude(lat,moon.Dec,0)*180/Math.PI;

  if(el>15 && alt>10) return 3; // A
  if(el>12 && alt>7) return 2;  // B
  if(el>9 && alt>4) return 1;   // C
  return 0;                     // D
}

function gregorianToHijri(date){

  const jd = Math.floor(toJulian(date)) + 0.5;

  const days = jd - 1948439.5;

  const year = Math.floor((30*days + 10646)/10631);

  const month = Math.min(
    11,
    Math.ceil((days - 29 - hijriToJD(year,0,1))/29.5)
  );

  const day = jd - hijriToJD(year,month,1) + 1;

  return {
    y:year,
    m:month+1,
    d:Math.floor(day)
  };
}

function hijriToJD(y,m,d){

  return d +
    Math.ceil(29.5*m) +
    (y-1)*354 +
    Math.floor((3+11*y)/30) +
    1948439.5;
}

window.odehCategory = odehCategory;
window.gregorianToHijri = gregorianToHijri;

/* ======================================
   HILAL ENGINE – ASTRONOMICAL MODEL
   ====================================== */

const RAD = Math.PI/180
const DEG = 180/Math.PI

/* ======================================
   JULIAN DATE
   ====================================== */

function toJulian(date){
return date.getTime()/86400000 + 2440587.5
}

function centuries(jd){
return (jd-2451545)/36525
}

/* ======================================
   SOLAR POSITION (Meeus simplified)
   ====================================== */

function solarCoords(jd){

let T = centuries(jd)

let L0 = (280.46646 + 36000.76983*T) % 360
let M  = (357.52911 + 35999.05029*T) % 360

let C =
(1.914602 - 0.004817*T)*Math.sin(M*RAD) +
0.019993*Math.sin(2*M*RAD) +
0.000289*Math.sin(3*M*RAD)

let trueLong = L0 + C

let epsilon = 23.439291 - 0.0130042*T

let RA = Math.atan2(
Math.cos(epsilon*RAD)*Math.sin(trueLong*RAD),
Math.cos(trueLong*RAD)
)*DEG

let dec = Math.asin(
Math.sin(epsilon*RAD)*Math.sin(trueLong*RAD)
)*DEG

return {RA,dec}

}

/* ======================================
   LUNAR POSITION (simplified Meeus)
   ====================================== */

function moonCoords(jd){

let D = jd - 2451545

let L = (218.316 + 13.176396*D) % 360
let M = (134.963 + 13.064993*D) % 360
let F = (93.272 + 13.229350*D) % 360

let lon = L + 6.289*Math.sin(M*RAD)
let lat = 5.128*Math.sin(F*RAD)

let epsilon = 23.439

let RA = Math.atan2(
Math.sin(lon*RAD)*Math.cos(epsilon*RAD),
Math.cos(lon*RAD)
)*DEG

let dec = Math.asin(
Math.sin(epsilon*RAD)*Math.sin(lon*RAD)
)*DEG

return {RA,dec,lon}

}

/* ======================================
   SUNSET HOUR ANGLE
   ====================================== */

function sunsetHourAngle(lat,dec){

let cosH =
(
Math.sin(-0.83*RAD) -
Math.sin(lat*RAD)*Math.sin(dec*RAD)
)/
(
Math.cos(lat*RAD)*Math.cos(dec*RAD)
)

if(cosH>1) return null
if(cosH<-1) return null

return Math.acos(cosH)*DEG

}

/* ======================================
   MOON ALTITUDE AT SUNSET
   ====================================== */

function moonAltitude(lat,moonDec,HA){

let h = Math.asin(

Math.sin(lat*RAD)*Math.sin(moonDec*RAD) +

Math.cos(lat*RAD)*Math.cos(moonDec*RAD)*
Math.cos(HA*RAD)

)

return h*DEG

}

/* ======================================
   SUN-MOON ELONGATION
   ====================================== */

function elongation(sun,moon){

return Math.acos(

Math.sin(sun.dec*RAD)*Math.sin(moon.dec*RAD)+

Math.cos(sun.dec*RAD)*Math.cos(moon.dec*RAD)*

Math.cos((sun.RA-moon.RA)*RAD)

)*DEG

}

/* ======================================
   ODEH VISIBILITY Q
   ====================================== */

function odehQ(alt,E){

return alt -

(
11.8371 -
6.3226*E +
0.7319*E*E -
0.1018*E*E*E
)

}

/* ======================================
   VISIBILITY CATEGORY
   ====================================== */

function visibilityCategory(Q){

if(Q>0.216) return "A"     // naked eye
if(Q>-0.014) return "B"    // optical aid
if(Q>-0.160) return "C"    // difficult
return "D"                 // impossible

}

/* ======================================
   GLOBAL GRID (5°)
   ====================================== */

function generateVisibility(date){

let jd = toJulian(date)

let sun = solarCoords(jd)
let moon = moonCoords(jd)

let grid=[]

for(let lat=-60; lat<=60; lat+=5){

for(let lon=-180; lon<=180; lon+=5){

let H = sunsetHourAngle(lat,sun.dec)

if(H==null) continue

let alt = moonAltitude(lat,moon.dec,H)

let E = elongation(sun,moon)

let Q = odehQ(alt,E)

let cat = visibilityCategory(Q)

grid.push({
lat,
lon,
alt,
elong:E,
Q,
cat
})

}

}

return grid

}

/* ======================================
   CURVE GENERATION
   ====================================== */

function generateCurves(grid){

let naked=[]
let optical=[]

for(let lon=-180; lon<=180; lon+=5){

let column = grid.filter(p=>p.lon===lon)

column.forEach(p=>{

if(p.cat==="A") naked.push([p.lat,p.lon])
if(p.cat==="B") optical.push([p.lat,p.lon])

})

}

return {
naked,
optical
}

}

/* ======================================
   EXPORT
   ====================================== */

window.HilalEngine={
generateVisibility,
generateCurves
}

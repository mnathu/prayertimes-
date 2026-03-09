/* --------------------------------------------------
   Hilal Visibility Engine
   Astronomical calculations for crescent visibility
   Based on Odeh crescent model
-------------------------------------------------- */

const RAD = Math.PI/180

function julianDay(date){

return date/86400000 + 2440587.5

}


/* Solar position */

function solarPosition(jd){

const n = jd - 2451545

const L = (280.46 + 0.9856474*n) % 360
const g = (357.528 + 0.9856003*n) % 360

const lambda =
L + 1.915*Math.sin(g*RAD) + 0.020*Math.sin(2*g*RAD)

const epsilon = 23.439 - 0.0000004*n

const ra = Math.atan2(
Math.cos(epsilon*RAD)*Math.sin(lambda*RAD),
Math.cos(lambda*RAD)
)/RAD

const dec = Math.asin(
Math.sin(epsilon*RAD)*Math.sin(lambda*RAD)
)/RAD

return {ra,dec}

}


/* Moon position (simplified Meeus model) */

function moonPosition(jd){

const n = jd - 2451550.1

const L = (218.316 + 13.176396*n) % 360
const M = (134.963 + 13.064993*n) % 360
const F = (93.272 + 13.229350*n) % 360

const lon = L + 6.289*Math.sin(M*RAD)
const lat = 5.128*Math.sin(F*RAD)

return {lon,lat}

}


/* Elongation */

function elongation(sunLon,moonLon){

return Math.abs(moonLon - sunLon)

}


/* Altitude calculation */

function altitude(dec,lat,ha){

return Math.asin(
Math.sin(dec*RAD)*Math.sin(lat*RAD)+
Math.cos(dec*RAD)*Math.cos(lat*RAD)*Math.cos(ha*RAD)
)/RAD

}


/* Odeh Q value */

function odehQ(alt,elong){

return alt - (11.8371 - 6.3226*elong + 0.7319*elong*elong
- 0.1018*elong*elong*elong)

}


/* Visibility classification */

function odehCategory(Q){

if(Q > 0.216) return "A"
if(Q > -0.014) return "B"
if(Q > -0.160) return "C"
return "D"

}


/* Sunset approximation */

function sunsetTime(lat,lon,date){

const jd = julianDay(date)

const n = jd - 2451545 + 0.0008

const Jstar = n - lon/360

const M = (357.5291 + 0.98560028*Jstar) % 360

const C = 1.9148*Math.sin(M*RAD)
        + 0.0200*Math.sin(2*M*RAD)
        + 0.0003*Math.sin(3*M*RAD)

const lambda = (M + C + 180 + 102.9372) % 360

const Jtransit = 2451545 + Jstar
 + 0.0053*Math.sin(M*RAD)
 - 0.0069*Math.sin(2*lambda*RAD)

const delta = Math.asin(
Math.sin(lambda*RAD)*Math.sin(23.44*RAD)
)

const H = Math.acos(
( Math.sin(-0.83*RAD) -
Math.sin(lat*RAD)*Math.sin(delta) ) /
( Math.cos(lat*RAD)*Math.cos(delta) )
)

const Jset = Jtransit + H/(2*Math.PI)

return new Date((Jset-2440587.5)*86400000)

}


/* Main visibility function */

function hilalVisibility(date,lat,lon){

const jd = julianDay(date)

const sunset = sunsetTime(lat,lon,date)

const sun = solarPosition(jd)

const moon = moonPosition(jd)

const elong = elongation(sun.ra,moon.lon)

const alt = 10 + Math.sin(lat*RAD)*5   // simplified altitude

const Q = odehQ(alt,elong)

const category = odehCategory(Q)

const age = (jd % 29.53)*24

const lag = alt * 4

return {
altitude:alt,
elongation:elong,
Q,
category,
age,
lag
}

}


/* Global grid generator */

function globalVisibility(date){

let grid=[]

for(let lat=-60; lat<=60; lat+=5){

for(let lon=-180; lon<=180; lon+=5){

let r=hilalVisibility(date,lat,lon)

grid.push({
lat,
lon,
cat:r.category
})

}

}

return grid

}

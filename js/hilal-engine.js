/* =====================================================
HILAL ENGINE v2.1
Accurate Crescent Visibility Model
===================================================== */

const HilalEngine = (function(){

const RAD = Math.PI/180
const DEG = 180/Math.PI

function rad(d){return d*RAD}
function deg(r){return r*DEG}

/* --------------------------
JULIAN DATE
-------------------------- */

function julian(date){
return date/86400000 + 2440587.5
}

/* --------------------------
SUN POSITION
-------------------------- */

function sunPosition(jd){

let n = jd - 2451545

let L = (280.460 + 0.9856474*n) % 360
let g = (357.528 + 0.9856003*n) % 360

let lambda =
L +
1.915*Math.sin(rad(g)) +
0.020*Math.sin(rad(2*g))

let epsilon = 23.439 - 0.0000004*n

let RA = Math.atan2(
Math.cos(rad(epsilon))*Math.sin(rad(lambda)),
Math.cos(rad(lambda))
)

let dec = Math.asin(
Math.sin(rad(epsilon))*Math.sin(rad(lambda))
)

return {RA,dec}

}

/* --------------------------
MOON POSITION
(Meeus simplified)
-------------------------- */

function moonPosition(jd){

let n = jd - 2451550.1

let L = (218.316 + 13.176396*n) % 360
let M = (134.963 + 13.064993*n) % 360
let F = (93.272 + 13.229350*n) % 360

let lon = L + 6.289*Math.sin(rad(M))
let lat = 5.128*Math.sin(rad(F))

let epsilon = 23.439

let RA = Math.atan2(
Math.sin(rad(lon))*Math.cos(rad(epsilon)),
Math.cos(rad(lon))
)

let dec = Math.asin(
Math.sin(rad(lat))*Math.cos(rad(epsilon)) +
Math.cos(rad(lat))*Math.sin(rad(epsilon))*Math.sin(rad(lon))
)

return {RA,dec}

}

/* --------------------------
SUNSET HOUR ANGLE
-------------------------- */

function sunsetHourAngle(lat,dec){

let latR = rad(lat)

let cosH =
(
Math.sin(rad(-0.833)) -
Math.sin(latR)*Math.sin(dec)
) /
(
Math.cos(latR)*Math.cos(dec)
)

if(cosH > 1) return null

return Math.acos(cosH)

}

/* --------------------------
MOON ALTITUDE
-------------------------- */

function altitude(lat,dec,H){

return Math.asin(
Math.sin(rad(lat))*Math.sin(dec) +
Math.cos(rad(lat))*Math.cos(dec)*Math.cos(H)
)

}

/* --------------------------
ELONGATION
-------------------------- */

function elongation(sun,moon){

return Math.acos(
Math.sin(sun.dec)*Math.sin(moon.dec) +
Math.cos(sun.dec)*Math.cos(moon.dec) *
Math.cos(sun.RA - moon.RA)
)

}

/* --------------------------
ODEH Q VALUE
-------------------------- */

function odehQ(alt,elong){

let altD = deg(alt)
let elD = deg(elong)

if(elD <= 0) return -999

return altD - (11.837 + 6.322*Math.log(elD))

}

/* --------------------------
VISIBILITY CLASSIFICATION
-------------------------- */

function classify(Q){

if(Q > 0.216) return "A" // naked eye
if(Q > -0.014) return "B" // optical aid
if(Q > -0.160) return "C" // difficult
return "D" // not visible

}

/* --------------------------
GLOBAL GRID
-------------------------- */

function generateVisibility(date){

let jd = julian(date)

let grid = []

for(let lat=-60; lat<=60; lat+=5){

for(let lon=-180; lon<=180; lon+=5){

/* adjust JD for longitude */

let jdLocal = jd + lon/360

let sun = sunPosition(jdLocal)
let moon = moonPosition(jdLocal)

let H = sunsetHourAngle(lat, sun.dec)

if(!H) continue

let alt = altitude(lat, moon.dec, H)

/* refraction + semidiameter correction */

alt -= rad(0.566)

let el = elongation(sun, moon)

let Q = odehQ(alt, el)

let cat = classify(Q)

grid.push({
lat,
lon,
alt:deg(alt),
elong:deg(el),
Q,
cat
})

}

}

return grid

}

/* --------------------------
VISIBILITY CURVES
-------------------------- */

function generateCurves(grid){

let naked=[]
let optical=[]

for(let lon=-180; lon<=180; lon+=5){

let bestA=null
let bestB=null

grid.forEach(p=>{

if(Math.abs(p.lon-lon)<3){

if(p.cat==="A" && !bestA) bestA=p
if(p.cat==="B" && !bestB) bestB=p

}

})

if(bestA) naked.push([bestA.lat,bestA.lon])
if(bestB) optical.push([bestB.lat,bestB.lon])

}

return {naked,optical}

}

/* --------------------------
EXPORT
-------------------------- */

return {

generateVisibility,
generateCurves

}

})()

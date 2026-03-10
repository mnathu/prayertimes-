/* ======================================================
HILAL ENGINE V2
Scientific crescent visibility model
Based on ICOP / Odeh methodology
====================================================== */

const HilalEngine = (function(){

/* ---------- CONSTANTS ---------- */

const RAD = Math.PI / 180
const DEG = 180 / Math.PI

function rad(d){ return d * RAD }
function deg(r){ return r * DEG }

/* ---------- JULIAN DATE ---------- */

function julian(date){

return date/86400000 + 2440587.5

}

/* ---------- SUN POSITION ---------- */

function sunPosition(jd){

let n = jd - 2451545

let L = (280.46 + 0.9856474*n) % 360
let g = (357.528 + 0.9856003*n) % 360

let lambda =
L +
1.915 * Math.sin(rad(g)) +
0.020 * Math.sin(rad(2*g))

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

/* ---------- MOON POSITION (Meeus simplified) ---------- */

function moonPosition(jd){

let n = jd - 2451550.1

let L = (218.316 + 13.176396*n) % 360
let M = (134.963 + 13.064993*n) % 360
let F = (93.272 + 13.229350*n) % 360

let lon =
L +
6.289*Math.sin(rad(M))

let lat =
5.128*Math.sin(rad(F))

let RA = Math.atan2(
Math.sin(rad(lon))*Math.cos(rad(23.44)),
Math.cos(rad(lon))
)

let dec = Math.asin(
Math.sin(rad(lat))*Math.cos(rad(23.44)) +
Math.cos(rad(lat))*Math.sin(rad(23.44))*Math.sin(rad(lon))
)

return {RA,dec}

}

/* ---------- SUNSET TIME ---------- */

function sunset(lat,lon,date){

let jd = julian(date)

let sun = sunPosition(jd)

let dec = sun.dec

let latR = rad(lat)

let cosH =
(
Math.sin(rad(-0.833)) -
Math.sin(latR)*Math.sin(dec)
)/
(
Math.cos(latR)*Math.cos(dec)
)

if(cosH > 1) return null

let H = Math.acos(cosH)

return H

}

/* ---------- ALTITUDE ---------- */

function altitude(lat,dec,H){

return Math.asin(
Math.sin(rad(lat))*Math.sin(dec) +
Math.cos(rad(lat))*Math.cos(dec)*Math.cos(H)
)

}

/* ---------- ELONGATION ---------- */

function elongation(sun,moon){

return Math.acos(
Math.sin(sun.dec)*Math.sin(moon.dec) +
Math.cos(sun.dec)*Math.cos(moon.dec)*
Math.cos(sun.RA - moon.RA)
)

}

/* ---------- ODEH Q VALUE ---------- */

function odehQ(alt,elong){

let altDeg = deg(alt)
let elDeg = deg(elong)

let W = altDeg - (11.837 + 6.322 * Math.log(elDeg))

return W

}

/* ---------- VISIBILITY CATEGORY ---------- */

function classify(Q){

if(Q > 0.216) return "A" // visible naked eye
if(Q > -0.014) return "B" // optical aid
if(Q > -0.160) return "C" // optical possible
return "D"

}

/* ---------- GRID GENERATION ---------- */

function generateVisibility(date){

let jd = julian(date)

let sun = sunPosition(jd)
let moon = moonPosition(jd)

let grid=[]

for(let lat=-60; lat<=60; lat+=5){

for(let lon=-180; lon<=180; lon+=5){

let H = sunset(lat,lon,date)

if(!H) continue

let alt = altitude(lat,moon.dec,H)

let el = elongation(sun,moon)

let Q = odehQ(alt,el)

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

/* ---------- CURVE GENERATION ---------- */

function generateCurves(grid){

let naked=[]
let optical=[]

for(let lon=-180; lon<=180; lon+=5){

let bestN=null
let bestO=null

grid.forEach(p=>{

if(Math.abs(p.lon-lon)<2){

if(p.cat==="A" && !bestN) bestN=p
if(p.cat==="B" && !bestO) bestO=p

}

})

if(bestN) naked.push([bestN.lat,bestN.lon])
if(bestO) optical.push([bestO.lat,bestO.lon])

}

return {
naked,
optical
}

}

/* ---------- EXPORT ---------- */

return {
generateVisibility,
generateCurves
}

})()

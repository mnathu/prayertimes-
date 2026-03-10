/* =====================================
   HILAL ASTRONOMY ENGINE
   ===================================== */

const RAD = Math.PI/180
const DEG = 180/Math.PI

function toJulian(date){
return date/86400000+2440587.5
}

function toCentury(jd){
return (jd-2451545)/36525
}

/* =====================================
   SOLAR POSITION
   ===================================== */

function solarCoords(jd){

let T=toCentury(jd)

let L0=(280.46646+36000.76983*T)%360
let M=(357.52911+35999.05029*T)%360

let C=
(1.914602-0.004817*T)*Math.sin(M*RAD)+
0.019993*Math.sin(2*M*RAD)+
0.000289*Math.sin(3*M*RAD)

let lambda=L0+C

let epsilon=23.439291-0.0130042*T

let RA=Math.atan2(
Math.cos(epsilon*RAD)*Math.sin(lambda*RAD),
Math.cos(lambda*RAD)
)*DEG

let dec=Math.asin(
Math.sin(epsilon*RAD)*Math.sin(lambda*RAD)
)*DEG

return{RA,dec,lambda}

}

/* =====================================
   LUNAR POSITION
   ===================================== */

function moonCoords(jd){

let D=jd-2451545

let L=(218.316+13.176396*D)%360
let M=(134.963+13.064993*D)%360
let F=(93.272+13.229350*D)%360

let lon=L+6.289*Math.sin(M*RAD)
let lat=5.128*Math.sin(F*RAD)

let epsilon=23.439

let RA=Math.atan2(
Math.sin(lon*RAD)*Math.cos(epsilon*RAD),
Math.cos(lon*RAD)
)*DEG

let dec=Math.asin(
Math.sin(epsilon*RAD)*Math.sin(lon*RAD)
)*DEG

return{RA,dec,lon}

}

/* =====================================
   SUNSET TIME
   ===================================== */

function sunsetHourAngle(lat,dec){

let cosH=(
- Math.sin(-0.83*RAD)
- Math.sin(lat*RAD)*Math.sin(dec*RAD)
)/
(
Math.cos(lat*RAD)*Math.cos(dec*RAD)
)

return Math.acos(cosH)*DEG

}

/* =====================================
   MOON ALTITUDE
   ===================================== */

function moonAltitude(lat,dec,HA){

let h=Math.asin(
Math.sin(lat*RAD)*Math.sin(dec*RAD)+
Math.cos(lat*RAD)*Math.cos(dec*RAD)*Math.cos(HA*RAD)
)

return h*DEG

}

/* =====================================
   ELONGATION
   ===================================== */

function elongation(sun,moon){

return Math.acos(
Math.sin(sun.dec*RAD)*Math.sin(moon.dec*RAD)+
Math.cos(sun.dec*RAD)*Math.cos(moon.dec*RAD)*
Math.cos((sun.RA-moon.RA)*RAD)
)*DEG

}

/* =====================================
   ODEH Q VALUE
   ===================================== */

function odehQ(alt,elong){

return alt-(11.8371-6.3226*elong+
0.7319*Math.pow(elong,2)-
0.1018*Math.pow(elong,3))

}

/* =====================================
   VISIBILITY CATEGORY
   ===================================== */

function visibilityCategory(Q){

if(Q>0.216) return "A"
if(Q>-0.014) return "B"
if(Q>-0.160) return "C"
return "D"

}

/* =====================================
   GLOBAL GRID (5° resolution)
   ===================================== */

function generateVisibility(date){

let jd=toJulian(date)

let sun=solarCoords(jd)
let moon=moonCoords(jd)

let grid=[]

for(let lat=-60;lat<=60;lat+=5){

for(let lon=-180;lon<=180;lon+=5){

let Hsun=sunsetHourAngle(lat,sun.dec)

let alt=moonAltitude(lat,moon.dec,Hsun)

let el=elongation(sun,moon)

let Q=odehQ(alt,el)

let cat=visibilityCategory(Q)

grid.push({
lat,
lon,
alt,
elong:el,
Q,
cat
})

}

}

return grid

}

/* =====================================
   VISIBILITY CURVES
   ===================================== */

function generateCurves(grid){

let naked=[]
let optical=[]

for(let lon=-180;lon<=180;lon+=5){

let row=grid.filter(p=>p.lon===lon)

row.forEach(p=>{

if(p.cat==="A") naked.push([p.lat,p.lon])
if(p.cat==="B") optical.push([p.lat,p.lon])

})

}

return{
naked,
optical
}

}

/* =====================================
   EXPORTS
   ===================================== */

window.HilalEngine={
generateVisibility,
generateCurves
}

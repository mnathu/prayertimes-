const RAD=Math.PI/180

function julianDay(date){
return date/86400000+2440587.5
}

function julianCentury(jd){
return (jd-2451545)/36525
}

function solarCoordinates(jd){

const T=julianCentury(jd)

let L0=(280.46646+36000.76983*T)%360
let M=(357.52911+35999.05029*T)%360

let C=
(1.914602-0.004817*T)*Math.sin(M*RAD)
+0.019993*Math.sin(2*M*RAD)
+0.000289*Math.sin(3*M*RAD)

let lambda=L0+C

let epsilon=23.439291-0.0130042*T

let RA=Math.atan2(
Math.cos(epsilon*RAD)*Math.sin(lambda*RAD),
Math.cos(lambda*RAD)
)/RAD

let dec=Math.asin(
Math.sin(epsilon*RAD)*Math.sin(lambda*RAD)
)/RAD

return{RA,dec,lambda}
}

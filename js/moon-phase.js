function moonCoordinates(jd){

let D=jd-2451545

let L=(218.316+13.176396*D)%360
let M=(134.963+13.064993*D)%360
let F=(93.272+13.229350*D)%360

let lon=L+6.289*Math.sin(M*RAD)
let lat=5.128*Math.sin(F*RAD)

return{lon,lat}
}

function moonAge(jd,conjunctionJD){
return (jd-conjunctionJD)*24
}

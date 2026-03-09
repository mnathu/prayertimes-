function globalVisibility(date){

let jd=julianDay(date)

let sun=solarCoordinates(jd)
let moon=moonCoordinates(jd)

let grid=[]

for(let lat=-60;lat<=60;lat+=3){

for(let lon=-180;lon<=180;lon+=3){

let alt=8+Math.sin(lat*RAD)*6
let elong=elongation(sun.lambda,moon.lon)

let Q=odehQ(alt,elong)

grid.push({
lat,
lon,
cat:odehCategory(Q)
})

}

}

return grid
}

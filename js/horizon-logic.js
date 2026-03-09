function horizonVisibility(date,userLat,userLon){

let grid=globalVisibility(date)

let region=grid.filter(p=>
Math.abs(p.lon-userLon)<=60
)

let visible=region.some(p=>
p.cat==="A"||p.cat==="B"
)

return visible
}

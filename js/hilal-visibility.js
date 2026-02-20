function computeVisibility(date,lat,lon){

 const sunset = SunCalc.getTimes(date,lat,lon).sunset;
 const moonPos = SunCalc.getMoonPosition(sunset,lat,lon);
 const sunPos = SunCalc.getPosition(sunset,lat,lon);
 const illum = SunCalc.getMoonIllumination(sunset);

 const moonAlt = moonPos.altitude*180/Math.PI;
 const sunAlt = sunPos.altitude*180/Math.PI;
 const ARCV = moonAlt - sunAlt;
 const W = illum.fraction*60;

 const fW = -0.1018*W**3 + 0.7319*W**2 - 6.3226*W + 7.1651;
 const q = ARCV - fW;

 if(q>0.216) return {class:"Easily Visible",color:"green"};
 if(q>-0.014) return {class:"Visible",color:"lime"};
 if(q>-0.16) return {class:"Optical Aid",color:"orange"};
 return {class:"Not Visible",color:"red"};
}

function initMap(){

 const conj = trueConjunction();
 const hijri = predictHijriMonth(conj);

 document.getElementById("summaryCard").innerHTML =
 `<h2>Next Islamic Month: ${hijri}</h2>
  <p>Conjunction (UTC): ${conj.toUTCString()}</p>`;

 const map = L.map('map').setView([39,-98],4);

 L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
   attribution:'© OpenStreetMap'
 }).addTo(map);

 NA_CITIES.forEach(city=>{
   const vis = computeVisibility(conj,city.lat,city.lon);

   L.circleMarker([city.lat,city.lon],{
     radius:8,
     color:vis.color,
     fillOpacity:0.8
   })
   .addTo(map)
   .bindPopup(`<strong>${city.name}</strong><br>${vis.class}`);
 });
}

document.addEventListener("DOMContentLoaded",initMap);

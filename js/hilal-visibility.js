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
 const map = L.map('map').setView([39,-98],4);

 L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
   attribution:'© OpenStreetMap'
 }).addTo(map);

 let globalVisible = false;
 let firstVisibleDate = null;
 let visibilityResults = [];

NA_CITIES.forEach(city=>{

   const sunset29 = firstSunsetAfter(conj, city.lat, city.lon);
   let vis29 = computeVisibility(sunset29, city.lat, city.lon);

   let finalSunset = sunset29;
   let finalVisible = vis29.class !== "Not Visible";

   if(!finalVisible){
       const nextDay = new Date(sunset29);
       nextDay.setDate(nextDay.getDate()+1);
       finalSunset = SunCalc.getTimes(nextDay, city.lat, city.lon).sunset;
       const vis30 = computeVisibility(finalSunset, city.lat, city.lon);
       finalVisible = vis30.class !== "Not Visible";
   }

   visibilityResults.push({
       name: city.name,
       lat: city.lat,
       lon: city.lon,
       visible: finalVisible,
       sunset: finalSunset
   });

   const markerColor = finalVisible ? "green" : "red";

   L.circleMarker([city.lat,city.lon],{
     radius:8,
     color:markerColor,
     fillOpacity:0.8
   })
   .addTo(map)
   .bindPopup(`<strong>${city.name}</strong>
   <br>${finalVisible ? "Visible" : "Not Visible"}
   <br>${finalSunset.toDateString()}`);
});

determineMonthStart(conj, visibilityResults);


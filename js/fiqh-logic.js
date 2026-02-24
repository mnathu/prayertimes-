function sharesHorizon(baseCity, testCity, sunsetDate){

    const baseMoon = SunCalc.getMoonPosition(sunsetDate, baseCity.lat, baseCity.lon);
    const testMoon = SunCalc.getMoonPosition(sunsetDate, testCity.lat, testCity.lon);

    const baseAlt = baseMoon.altitude * 180/Math.PI;
    const testAlt = testMoon.altitude * 180/Math.PI;

    const longDiff = Math.abs(baseCity.lon - testCity.lon);
    const altDiff = Math.abs(baseAlt - testAlt);

    if(longDiff <= 15 && altDiff <= 2){
        return true;
    }

    return false;
}

function determineMonthStart(conjunction, visibilityResults){

 const hijriMonth = predictHijriMonth(conjunction);
 const fiqhMode = document.getElementById("fiqhMode")?.value || "global";

 let startDate = null;

 if(fiqhMode === "global"){

     const firstVisible = visibilityResults.find(v => v.visible);

     if(firstVisible){
         startDate = new Date(firstVisible.sunset);
         startDate.setDate(startDate.getDate()+1);
     }else{
         const fallback = visibilityResults[0].sunset;
         startDate = new Date(fallback);
         startDate.setDate(startDate.getDate()+2);
     }

 }

 if(fiqhMode === "sistani"){

     const visibleCities = visibilityResults.filter(v => v.visible);

     if(visibleCities.length > 0){

         const baseCity = visibleCities[0];

         const sharedCities = visibilityResults.filter(v =>
             sharesHorizon(baseCity, v, baseCity.sunset)
         );

         if(sharedCities.length > 0){
             startDate = new Date(baseCity.sunset);
             startDate.setDate(startDate.getDate()+1);
         }
     }

     if(!startDate){
         const fallback = visibilityResults[0].sunset;
         startDate = new Date(fallback);
         startDate.setDate(startDate.getDate()+2);
     }
 }

 document.getElementById("summaryCard").innerHTML = `
   <h2>Next Islamic Month: ${hijriMonth}</h2>
   <p>Conjunction (UTC): ${conjunction.toUTCString()}</p>
   <p>Fiqh Mode: ${fiqhMode.toUpperCase()}</p>
   <p><strong>Predicted Start:</strong> ${startDate.toDateString()}</p>
 `;
}

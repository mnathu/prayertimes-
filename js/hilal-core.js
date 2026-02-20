function julianDate(date){
 return date/86400000 + 2440587.5;
}

function dateFromJulian(jd){
 return new Date((jd - 2440587.5)*86400000);
}

function trueConjunction(){
 const synodicMonth = 29.530588861;
 const refJD = 2451550.1; // Jan 6 2000 reference
 const nowJD = julianDate(new Date());
 const k = Math.round((nowJD - refJD)/synodicMonth);
 return dateFromJulian(refJD + k*synodicMonth);
}

function firstSunsetAfter(dateUTC, lat, lon){
    let testDate = new Date(dateUTC);

    // move forward hour by hour until sunset is after conjunction
    for(let i=0;i<48;i++){
        const times = SunCalc.getTimes(testDate, lat, lon);
        const sunset = times.sunset;

        if(sunset && sunset > dateUTC){
            return sunset;
        }

        testDate.setHours(testDate.getHours()+1);
    }

    return null;
}

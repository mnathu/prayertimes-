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

const HIJRI_MONTHS = [
"Muharram","Safar","Rabi al-Awwal","Rabi al-Thani",
"Jumada al-Ula","Jumada al-Akhirah",
"Rajab","Sha'ban","Ramadan","Shawwal",
"Dhul Qa'dah","Dhul Hijjah"
];

function predictHijriMonth(conjunctionDate){
 const ref = new Date("2018-09-11T00:00:00Z"); // 1 Muharram 1440
 const synodic = 29.530588861;
 const diffDays = (conjunctionDate - ref)/86400000;
 const monthsSince = Math.floor(diffDays/synodic);
 const monthIndex = (monthsSince % 12 + 12) % 12;
 return HIJRI_MONTHS[(monthIndex+1)%12]; // next month
}

function determineMonthStart(conjunction, globalVisible, firstVisibleDate){

 const hijriMonth = predictHijriMonth(conjunction);

 let startDate;
 let fiqhMode = document.getElementById("fiqhMode")?.value || "global";

 if(fiqhMode === "global"){

     if(globalVisible){
         startDate = new Date(firstVisibleDate);
         startDate.setDate(startDate.getDate()+1);
     }else{
         startDate = new Date(firstVisibleDate);
         startDate.setDate(startDate.getDate()+2);
     }

 }else if(fiqhMode === "sistani"){

     // Sistani requires:
     // - Naked eye possibility
     // - Shared horizon
     // For North America model:
     // Visible anywhere NA with same night qualifies

     if(globalVisible){
         startDate = new Date(firstVisibleDate);
         startDate.setDate(startDate.getDate()+1);
     }else{
         startDate = new Date(firstVisibleDate);
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


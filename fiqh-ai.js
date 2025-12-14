fetch('./data/fiqh_master.json')
  .then(res => res.json())
  .then(data => {
    window.FIQH_DATA = data;
    console.log("Loaded fiqh rulings:", data.length);
  });

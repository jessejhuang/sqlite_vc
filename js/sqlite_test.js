d3.request('data/raw_crunchbase.db')
  .header("X-Requested-With", "XMLHttpRequest")
  .responseType('arraybuffer')
  .get((err, data) => {
    if(err){
      console.log('err: ', err);
    }
    console.log('type of data:', typeof data);
  });

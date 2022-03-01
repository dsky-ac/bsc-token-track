const Crawler = require("crawler");
const dayjs = require('dayjs');
const low = require('lowdb');
const fs = require('fs');
const FileSync = require('lowdb/adapters/FileSync')
//
const crawlerContruct = new Crawler({
  maxConnections : 10,
  rateLimit: 1000*60,
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.67 Safari/537.36',
  // This will be called for each crawled page
  callback : function (error, res, done) {
    if(error){
      console.error('Crawler: ', error);
    }
    // var $ = res.$;
    done();
  }
});

const dayFn = dayjs().add(8, 'h');
const hour = dayFn.hour()
const day = dayFn.date()
const month = dayFn.month() + 1
const year = dayFn.year()

async function saveData(array) {
  if(array.length){
    const fileName = `data/${year}-${month}-${day}-${hour}.json`
    await fs.writeFileSync(fileName, '');
    const adapter = new FileSync(fileName);
    const db = await low(adapter);
    db.defaults({data: []}).write();
    db.set('data', array).write();
  }
}
crawlerContruct.queue([{
  uri: `https://bscscan.com/tokens?sort=percent_change_24h&order=desc`,
  // The global callback won't be called
  callback: function (error, res, done) {
    if(error){
      console.error(error);
    }else{
      const $ = res.$
      const array = []
      $('#tblResult').find('tbody').children('tr').map((index, ele) => {
        // console.log('ele', $(ele).html())
        const tdArray = $(ele).find('td').get();
        const coinName = $(tdArray[1]).find('.text-primary').text();
        const address =  $(tdArray[1]).find('.text-primary').attr('href').slice(7);
        const price = $(tdArray[2]).remove('div').text().slice(0, 7);
        const changeEle = $(tdArray[3]).children('span').remove('i');
        const change = $(changeEle).text().trim();
        const changeAttr = $(tdArray[3]).find('i').attr('class');
        let isUp = false;
        if(changeAttr.includes('up')) {
          isUp = true;
        }
        const volume = $(tdArray[4]).text();
        const marketCap = $(tdArray[5]).text().trim();
        const holders = $(tdArray[7]).text();
        // save year_month_day_hour.json
        array.push({coinName, address, price, change, isUp, volume, marketCap, holders})
      })
      saveData(array)
    }
    done();
  }
}]);

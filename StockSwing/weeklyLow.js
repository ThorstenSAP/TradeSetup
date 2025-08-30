const fs = require('fs')
const axios = require('axios')
const csv = require('csv-parser');
const yahooFinance = require('yahoo-finance2').default;
const { Utils } = require('../utils.js')
const utils = new Utils()

async function getWeeklyData(ticker) {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  try {
    const result = await yahooFinance.historical(ticker, {
      period1: oneYearAgo,
      interval: '1wk',
    });
    return result;
  } catch (err) {
    console.error(`Error fetching data for ${ticker}:`, err.message);
    return null;
  }
}

function readTickersFromCSV(filepath) {
  return new Promise((resolve, reject) => {
    const tickers = [];
    fs.createReadStream(filepath)
      .pipe(csv())
      .on('data', (row) => {
        if (row.symbol) tickers.push(row.symbol.trim());
      })
      .on('end', () => {
        resolve(tickers);
      })
      .on('error', reject);
  });
}



async function main() {
    let aWeeklyLowsGrabbed = []
    const aWeeklyEngulfings = []
    const aTickers = await readTickersFromCSV('./general/TickersUSLargeCap.csv');
    for (const sTicker of aTickers) {
      // if(sTicker === 'ASML')
      //     debugger;

        const aData = await getWeeklyData(sTicker);
        if (aData) {
            aData.pop() //crnt week is provided from monday and friday
            const oLatestCandle = aData[aData.length - 1]
            let oPrevCandle = aData[aData.length - 2]
                

            if(!oLatestCandle || !oPrevCandle){
              debugger;
            }
            if(utils.isEngulfing(oLatestCandle, oPrevCandle)){
              aWeeklyEngulfings.push({symbol: sTicker})
            }

            let cnt = 0
            while(utils.hasCandlegrabbedLows (oLatestCandle, oPrevCandle)){
                cnt = cnt + 1
                oPrevCandle = aData[aData.length - 2 - cnt]
            }

            if(cnt > 0){
                aWeeklyLowsGrabbed.push({symbol: sTicker, lowsGrabbed: cnt})
            }
        }
    }
    //sort asc
    // aWeeklyLowsGrabbed.sort((a, b) => a.lowsGrabbed - b.lowsGrabbed)
    //sort desc
    aWeeklyLowsGrabbed.sort((a, b) => b.lowsGrabbed - a.lowsGrabbed)
    
    utils.ntfyMeCSVList('StocksLowsGrabbed', "symbol,lowsGrabbed", aWeeklyLowsGrabbed)
    utils.ntfyMeCSVList('StocksWeeklyEngulfing', "symbol", aWeeklyEngulfings)
    

}

const cron = require('node-cron');

const runner = cron.schedule('0 6 * * 6', () => {
  // server is UTC -> Hence, 2 hours less
  main()
  console.log('Running Saturday 08:00 Europe/Berlin');
});
runner.start()


// main()


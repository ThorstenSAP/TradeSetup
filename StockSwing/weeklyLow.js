const fs = require('fs')
const csv = require('csv-parser');
const yahooFinance = require('yahoo-finance2').default;
const { Utils } = require('../utils.js')
const utils = new Utils()


async function getWeeklyData(ticker) {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 3);

  try {
    const result = await yahooFinance.chart(ticker, {
      period1: oneYearAgo,
      interval: '1wk',
    });
    return result.quotes;
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

async function checkEMAs(aData){
  const aClosingPrices = await utils.copyClosingPricesFromData(aData)
  const oEMAs = {
    firstEMA: await utils.calculateEMA(aClosingPrices, 8),
    secondEMA: await utils.calculateEMA(aClosingPrices, 13),
    thirdEMA: await utils.calculateEMA(aClosingPrices, 21),
    fourthEMA: await utils.calculateEMA(aClosingPrices, 55)
  }
  if (oEMAs.firstEMA >= oEMAs.secondEMA && oEMAs.secondEMA >= oEMAs.thirdEMA && oEMAs.thirdEMA >= oEMAs.fourthEMA){
    return true
  } else {
    return false
  }
}

async function main() {
    let aWeeklyLowsGrabbed = []
    const aWeeklyEngulfings = []
    let aEMAAlignmend = []
    const aTickers = await readTickersFromCSV('./general/TickersUSLargeCap.csv');
    for (const sTicker of aTickers) {
       //if(sTicker === 'ADSK')
        // debugger;

        //const aData = await getWeeklyData(sTicker);
        const aData = await getWeeklyData(sTicker)
        if (aData) {
            aData.pop() //crnt week is provided from monday and friday
            const oLatestCandle = aData[aData.length - 1]
            let oPrevCandle = aData[aData.length - 2]
                
            if (await checkEMAs(aData)){
              aEMAAlignmend.push(sTicker)
              //TODO wegschreiben für Fokusliste
            }
            /*
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
            */
        }
    }
    //sort asc
    // aWeeklyLowsGrabbed.sort((a, b) => a.lowsGrabbed - b.lowsGrabbed)
    //sort desc
    aWeeklyLowsGrabbed.sort((a, b) => b.lowsGrabbed - a.lowsGrabbed)
    
    //utils.ntfyMeCSVList('StocksLowsGrabbed', "symbol,lowsGrabbed", aWeeklyLowsGrabbed)
    //utils.ntfyMeCSVList('StocksWeeklyEngulfing', "symbol", aWeeklyEngulfings)
      utils.saveArrayToCSV(aEMAAlignmend, 'EMAWeeklyAligned')

}
/*
const cron = require('node-cron');

const runner = cron.schedule('0 4 * * 6', () => {
  // server is UTC -> Hence, 2 hours less
  main()
  console.log('Running Saturday 06:00 Europe/Berlin');
});
runner.start()
*/

main()


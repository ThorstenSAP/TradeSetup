const cron = require('node-cron')
const { DateTime } = require('luxon')
const { Utils } = require('./utils.js')
const utils = new Utils()

const sTicker = 'XAUUSD'

async function fetchGoldData(sUrl, sTimeFrame) {
    // const url = 'https://financialmodelingprep.com/stable/historical-chart/30min?symbol=XAUUSD&apikey=bmrHqCf73Wic7Arp856mK7v1g2lfa4A8';
    
  
    try {
      const response = await fetch(sUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
        const aData = await response.json();

        const oLatestCandle =  aData[0] //last candle
        const oPrevCandle = aData[1] //last of formation candle
        const oPrevPrevCandle = aData[2] //potential formation candle
        // const oPrevPrevPrevCandle =  aData[4] //potential formation candle

        // Parse and convert date to timestamp
        oLatestCandle.timestamp = DateTime.fromFormat(oLatestCandle.date, 'yyyy-MM-dd HH:mm:ss', { zone: 'UTC-4' })
        .setZone('UTC+2')
        .toFormat('HH:mm');
                
        if(utils.hasCandlegrabbedHighs (oLatestCandle, oPrevCandle) && utils.hasCandlegrabbedLows (oLatestCandle, oPrevCandle)){
            //ignore
        } else if(utils.hasCandlegrabbedHighs (oLatestCandle, oPrevCandle)){
            utils.ntfyMe(`${sTicker}`, `HighGrabbed - ${oLatestCandle.timestamp} - ${sTimeFrame} `)
            console.log(`HighGrabbed - ${oLatestCandle.timestamp} - ${sTimeFrame} `)
        } else if(utils.hasCandlegrabbedLows (oLatestCandle, oPrevCandle)){
            utils.ntfyMe(`${sTicker}`, `LowGrabbed - ${oLatestCandle.timestamp} - ${sTimeFrame} `)
            console.log(`LowGrabbed - ${oLatestCandle.timestamp} - ${sTimeFrame} `)
        }

        
        if(utils.isMCCandle(oLatestCandle, oPrevCandle)){
            utils.ntfyMe(`${sTicker}`, `MC Candle - ${oLatestCandle.timestamp} - ${sTimeFrame} `)
            console.log(`MC Candle - ${oLatestCandle.timestamp} - ${sTimeFrame} `)
        }
        if(utils.isLiquidation(oLatestCandle, oPrevCandle, oPrevPrevCandle)){
            utils.ntfyMe(`${sTicker}`, `Liquidation - ${oLatestCandle.timestamp} - ${sTimeFrame} `)
            console.log(`Liquidation ${oLatestCandle.timestamp} - ${sTimeFrame}`)
        }

        if(utils.isEveMorningStar(oLatestCandle, oPrevCandle, oPrevPrevCandle)){
            if(utils.getDirectionOfCandle(oLatestCandle) == 0){
                utils.ntfyMe(`${sTicker}`, `MorningStar ${oLatestCandle.timestamp} - ${sTimeFrame} `)
                console.log(`MorningStar ${oLatestCandle.timestamp} - ${sTimeFrame} `)
            } else {
                utils.ntfyMe(`${sTicker}`, `EveStar ${oLatestCandle.timestamp} - ${sTimeFrame} `)
                console.log(`EveStar ${oLatestCandle.timestamp} - ${sTimeFrame} `)
            }
        }

        // for (let i = 0; i < aData.length - 4 ; i++) {
                
        //     const oLatestCandle =  aData[i] //last candle
        //     const oPrevCandle = aData[i+1] //last of formation candle
        //     if(utils.hasCandlegrabbedHighs (oLatestCandle, oPrevCandle) && utils.hasCandlegrabbedLows (oLatestCandle, oPrevCandle)){
        //         //ignore
        //     } else if(utils.hasCandlegrabbedHighs (oLatestCandle, oPrevCandle)){
        //         console.log('high grabbed')
        //     } else if(utils.hasCandlegrabbedLows (oLatestCandle, oPrevCandle)){
        //         console.log('lowgrabbed')
        //     }
            

        // }

    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }
  
//   const url = 'https://financialmodelingprep.com/stable/historical-chart/30min?symbol=XAUUSD&apikey=bmrHqCf73Wic7Arp856mK7v1g2lfa4A8';  
//   fetchGoldData(url);


// const runnerM15 = cron.schedule('10 */15 * * * *', async () => { 
//     const url = 'https://financialmodelingprep.com/stable/historical-chart/15min?symbol=XAUUSD&apikey=bmrHqCf73Wic7Arp856mK7v1g2lfa4A8';
	
// 	await utils.ntfyMe('Log', `crone running XAUUSD M15 script`)
// 	fetchGoldData(url);
// })
const runnerM30 = cron.schedule('10 */30 * * * *', async () => { 
    const url = 'https://financialmodelingprep.com/stable/historical-chart/30min?symbol=XAUUSD&apikey=bmrHqCf73Wic7Arp856mK7v1g2lfa4A8';
	
	await utils.ntfyMe('Log', `crone running XAUUSD M30 script`)
	fetchGoldData(url, 'M30');
})
const runnerH1 = cron.schedule('15 0 */1 * * *', async () => { 
    const url = 'https://financialmodelingprep.com/stable/historical-chart/1hour?symbol=XAUUSD&apikey=bmrHqCf73Wic7Arp856mK7v1g2lfa4A8';
	
	await utils.ntfyMe('Log', `crone running XAUUSD H1 script`)
	fetchGoldData(url, 'H1');
})
//TODO
// const runnerH4 = cron.schedule('10 0 */4 * * *', async () => { 
//     // minute 2 of hour 01, 05, 09, 13, 17 and 21
//     const url = 'https://financialmodelingprep.com/stable/historical-chart/4hour?symbol=XAUUSD&apikey=bmrHqCf73Wic7Arp856mK7v1g2lfa4A8';
	
// 	await utils.ntfyMe('Log', `crone running XAUUSD H4 script`)
// 	fetchGoldData(url, 'H4');
// })

// runnerM15.start()
runnerM30.start()
runnerH1.start()
// runnerH4.start()
const cron = require('node-cron')
const { DateTime } = require('luxon')
const { Utils } = require('./utils.js')
const utils = new Utils()

const sTicker = 'XAUUSD-M15'

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
                
        if(!(utils.hasCandlegrabbedHighs (oLatestCandle, oPrevCandle) && utils.hasCandlegrabbedLows (oLatestCandle, oPrevCandle))){
            if(utils.hasCandlegrabbedHighs (oLatestCandle, oPrevCandle)){
                utils.ntfyMe(`${sTicker}`, `HighGrabbed - ${oLatestCandle.timestamp} - ${sTimeFrame} `)
                console.log(`HighGrabbed - ${oLatestCandle.timestamp} - ${sTimeFrame} `)
                if(utils.isEngulfing(oLatestCandle, oPrevCandle)){
                    utils.ntfyMe(`${sTicker}`, `Engulfing - ${oLatestCandle.timestamp} - ${sTimeFrame} `)
                    console.log(`Engulfing - ${oLatestCandle.timestamp} - ${sTimeFrame} `)
                }
            } else if(utils.hasCandlegrabbedLows (oLatestCandle, oPrevCandle)){
                utils.ntfyMe(`${sTicker}`, `LowGrabbed - ${oLatestCandle.timestamp} - ${sTimeFrame} `)
                console.log(`LowGrabbed - ${oLatestCandle.timestamp} - ${sTimeFrame} `)
                if(utils.isEngulfing(oLatestCandle, oPrevCandle)){
                    utils.ntfyMe(`${sTicker}`, `Engulfing - ${oLatestCandle.timestamp} - ${sTimeFrame} `)
                    console.log(`Engulfing - ${oLatestCandle.timestamp} - ${sTimeFrame} `)
                }
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


const runnerM15 = cron.schedule('0 14,29,44,59 * * * *', async () => { 
    const url = 'https://financialmodelingprep.com/stable/historical-chart/15min?symbol=XAUUSD&apikey=bmrHqCf73Wic7Arp856mK7v1g2lfa4A8';
	
	await utils.ntfyMe('Log', `crone running XAUUSD M15 script`)
	fetchGoldData(url, 'M15');
})


runnerM15.start()
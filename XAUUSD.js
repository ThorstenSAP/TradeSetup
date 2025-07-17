const cron = require('node-cron')
const { Utils } = require('./utils.js')
const utils = new Utils()

const sTicker = 'XAUUSD'

async function fetchGoldData(url) {
    // const url = 'https://financialmodelingprep.com/stable/historical-chart/30min?symbol=XAUUSD&apikey=bmrHqCf73Wic7Arp856mK7v1g2lfa4A8';
    
  
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
        const aData = await response.json();

        const oLatestCandle =  aData[0] //last candle
        const oPrevCandle = aData[1] //last of formation candle
        const oPrevPrevCandle = aData[2] //potential formation candle
        // const oPrevPrevPrevCandle =  aData[4] //potential formation candle
                
        if(utils.hasCandlegrabbedHighs (oLatestCandle, oPrevCandle) && utils.hasCandlegrabbedLows (oLatestCandle, oPrevCandle)){
            //ignore
        } else if(utils.hasCandlegrabbedHighs (oLatestCandle, oPrevCandle)){
            utils.ntfyMe(`${sTicker}`, `HighGrabbed`)
        } else if(utils.hasCandlegrabbedLows (oLatestCandle, oPrevCandle)){
            utils.ntfyMe(`${sTicker}`, `LowGrabbed`)
        }

        
        if(utils.isMCCandle(oLatestCandle, oPrevCandle)){
            utils.ntfyMe(`${sTicker}`, `MC Candle`)
            console.log(`MC Candle ${oLatestCandle.timestamp}`)
        }
        if(utils.isLiquidation(oLatestCandle, oPrevCandle, oPrevPrevCandle)){
            utils.ntfyMe(`${sTicker}`, `Liquidation`)
            console.log(`MC Candle ${oLatestCandle.timestamp}`)
        }

        if(utils.isEveMorningStar(oLatestCandle, oPrevCandle, oPrevPrevCandle)){
            if(utils.getDirectionOfCandle(oLatestCandle) == 0){
                utils.ntfyMe(`${sTicker}`, `MorningStar ${oLatestCandle.timestamp}`)
                console.log(`MorningStar ${oLatestCandle.timestamp}`)
            } else {
                utils.ntfyMe(`${sTicker}`, `EveStar ${oLatestCandle.timestamp}`)
                console.log(`EveStar ${oLatestCandle.timestamp}`)
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
  
//   fetchGoldData();


// const runnerM15 = cron.schedule('10 */15 * * * *', async () => { 
//     const url = 'https://financialmodelingprep.com/stable/historical-chart/15min?symbol=XAUUSD&apikey=bmrHqCf73Wic7Arp856mK7v1g2lfa4A8';
	
// 	await utils.ntfyMe('Log', `crone running XAUUSD M15 script`)
// 	fetchGoldData(url);
// })
const runnerM30 = cron.schedule('10 */30 * * * *', async () => { 
    const url = 'https://financialmodelingprep.com/stable/historical-chart/30min?symbol=XAUUSD&apikey=bmrHqCf73Wic7Arp856mK7v1g2lfa4A8';
	
	await utils.ntfyMe('Log', `crone running XAUUSD M30 script`)
	fetchGoldData(url);
})
const runnerH1 = cron.schedule('15 0 */1 * * *', async () => { 
    const url = 'https://financialmodelingprep.com/stable/historical-chart/1hour?symbol=XAUUSD&apikey=bmrHqCf73Wic7Arp856mK7v1g2lfa4A8';
	
	await utils.ntfyMe('Log', `crone running XAUUSD H1 script`)
	fetchGoldData(url);
})
const runnerH4 = cron.schedule('10 0 */4 * * *', async () => { 
    const url = 'https://financialmodelingprep.com/stable/historical-chart/4hour?symbol=XAUUSD&apikey=bmrHqCf73Wic7Arp856mK7v1g2lfa4A8';
	
	await utils.ntfyMe('Log', `crone running XAUUSD H4 script`)
	fetchGoldData(url);
})

// runnerM15.start()
runnerM30.start()
runnerH1.start()
runnerH4.start()
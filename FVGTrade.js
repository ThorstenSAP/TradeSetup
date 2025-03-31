const cron = require('node-cron')
const _ = require('lodash')

const { BitgetApi } = require('./api.js') // https://www.bitget.com/api-doc/contract/market/Get-Candle-Data
const { Utils } = require('./utils.js')
const utils = new Utils()
const bitget = new BitgetApi()

class FVG{
    constructor(iDirection, fRangeHigh, fRangeLow){

        this.iDirection = iDirection //0 == long - 1 == short
        this.fRangeHigh = fRangeHigh 
        this.fRangeLow = fRangeLow
    }
}

const oFVG = new FVG(1, 86123.1, 84450.0) //28.03.25 05.00 H4



const aTicker = ['BTC']
function handleTicker(sTicker, sTimeFrame){
	return new Promise((resolve, reject) => {
		bitget.getTickerData(`${sTicker}USDT`, sTimeFrame, '10')
		.then(async (aData) => {
            //check prev candles for a formation
			const oLatestCandle =  aData[aData.length - 2] //crnt candle
			const oPrevCandle = aData[aData.length - 3] //last of formation candle
			const oPrevPrevCandle = aData[aData.length - 4] //potential formation candle

            console.log(`timeframe: ${sTimeFrame}`)
            console.log('timestamp: ' + new Date().toLocaleTimeString())
            console.log(`candle: ${oLatestCandle.timestamp}`)

            //TODO check if an trade is active
            if(utils.getDirectionOfCandle(oLatestCandle) == oFVG.iDirection){
                if(utils.didCandleTouchFVG(oFVG, oLatestCandle)){

                    if(utils.isMCCandle(oLatestCandle, oPrevCandle)){
                        utils.ntfyMe(`BTC-FVG-${sTimeFrame}`, `MC Candle ${oLatestCandle.timestamp}`)
                        console.log(`MC Candle ${oLatestCandle.timestamp}`)
                    }
                    //probably needs a given level to watch for -> otherwise there will be too many alerts
                    // if(utils.isLiquidation(oLatestCandle, oPrevCandle, oPrevPrevCandle)){
                    //     utils.ntfyMe(`BTC-FVG-${sTimeFrame}`, `Liquidation ${oLatestCandle.timestamp}`)
                    //     console.log(`Liquidation ${oLatestCandle.timestamp}`)
                    // }
                    if(utils.isInsideOutFormation(oLatestCandle, oPrevCandle, oPrevPrevCandle)){
                        utils.ntfyMe(`BTC-FVG-${sTimeFrame}`, `Liquidation ${oLatestCandle.timestamp}`)
                        console.log(`InsideOut ${oLatestCandle.timestamp}`)
                    }
                    if(utils.isWyckoff(oLatestCandle, 2, aData)){
                        utils.ntfyMe(`BTC-FVG-${sTimeFrame}`, `Liquidation ${oLatestCandle.timestamp}`)
                        console.log(`Wyckoff ${oLatestCandle.timestamp}`)
                    }
                    if(utils.isEveMorningStar(oLatestCandle, oPrevCandle, oPrevPrevCandle)){
                        //already implemented without retest
                        utils.ntfyMe(`BTC-FVG-${sTimeFrame}`, `Liquidation ${oLatestCandle.timestamp}`)
                        console.log(`EveMorningStar ${oLatestCandle.timestamp}`)
                    }
                }
            }
						

		})
		.catch(err => {
			console.log(err)
            reject(err)
		})
	})
}



const runnerM5 = cron.schedule('59 */5 * * * *', async () => { 
	
	await utils.ntfyMe('Log', `crone running BTC-M5 FVG`)
	for await (const sTicker of aTicker) {
		await handleTicker(sTicker, '5m')
	}
})
const runnerM15 = cron.schedule('59 */15 * * * *', async () => { 
	
	await utils.ntfyMe('Log', `crone running BTC-M15 FVG watch`)
	for await (const sTicker of aTicker) {
		await handleTicker(sTicker, '15m')
	}
})
runnerM5.start()
runnerM15.start()




// function testFormation(sTicker, sTimeFrame){
// 	return new Promise((resolve, reject) => {
// 		bitget.getTickerData(`${sTicker}USDT`, sTimeFrame, '55')
// 		.then(async (aData) => {
//             //check prev candles for a formation
// 			// const oLatestCandle =  aData[aData.length - 1] //crnt candle
// 			// const oPrevCandle = aData[aData.length - 2] //last of formation candle
// 			// const oPrevPrevCandle = aData[aData.length - 3] //potential formation candle

//             //TODO check if an trade is active
//             // if(utils.getDirectionOfCandle(oLatestCandle) == oFVG.iDirection){
//             //     if(utils.didCandleTouchFVG(oFVG, oLatestCandle)){

//             //         if(utils.isMCCandle(oLatestCandle, oPrevCandle)){
//             //             // utils.ntfyMe(`BTC-FVG-${sTimeFrame}`, `MC Candle ${oLatestCandle.timestamp}`)
//             //             console.log(`MC Candle ${oLatestCandle.timestamp}`)
//             //         }
//             //         //probably needs a given level to watch for -> otherwise there will be too many alerts
//             //         // if(utils.isLiquidation(oLatestCandle, oPrevCandle, oPrevPrevCandle)){
//             //         //     utils.ntfyMe(`BTC-FVG-${sTimeFrame}`, `Liquidation ${oLatestCandle.timestamp}`)
//             //         //     console.log(`Liquidation ${oLatestCandle.timestamp}`)
//             //         // }
//             //         if(utils.isInsideOutFormation(oLatestCandle, oPrevCandle, oPrevPrevCandle)){
//             //             // utils.ntfyMe(`BTC-FVG-${sTimeFrame}`, `Liquidation ${oLatestCandle.timestamp}`)
//             //             console.log(`InsideOut ${oLatestCandle.timestamp}`)
//             //         }
//             //         if(utils.isWyckoff(oLatestCandle, 2, aData)){
//             //             // utils.ntfyMe(`BTC-FVG-${sTimeFrame}`, `Liquidation ${oLatestCandle.timestamp}`)
//             //             console.log(`Wyckoff ${oLatestCandle.timestamp}`)
//             //         }
//             //         if(utils.isEveMorningStar(oLatestCandle, oPrevCandle, oPrevPrevCandle)){
//             //             //already implemented without retest
//             //             // utils.ntfyMe(`BTC-FVG-${sTimeFrame}`, `Liquidation ${oLatestCandle.timestamp}`)
//             //             console.log(`EveMorningStar ${oLatestCandle.timestamp}`)
//             //         }
//             //     }
//             // }
// 			for (let i = aData.length; i >= 3 ; i--) {
//                 const oLatestCandle =  aData[i - 1] //crnt candle
//                 const oPrevCandle = aData[i - 2] //last of formation candle
//                 const oPrevPrevCandle = aData[i - 3] //potential formation candle

// 				// if(i == 14){
// 				// 	debugger
// 				// }
//                 if(utils.getDirectionOfCandle(oLatestCandle) == oFVG.iDirection){
//                     if(utils.didCandleTouchFVG(oFVG, oLatestCandle)){
//                         if(utils.isMCCandle(oLatestCandle, oPrevCandle)){
//                             // utils.ntfyMe(`BTC-FVG-${sTimeFrame}`, `MC Candle ${oLatestCandle.timestamp}`)
//                             console.log(`MC Candle ${oLatestCandle.timestamp}`)
//                         }
//                         // if(utils.isEveMorningStar(oLatestCandle, oPrevCandle, oPrevPrevCandle)){
//                         //     //already implemented without retest
//                         //     console.log(`EveMorningStar ${aData[i].timestamp}`)
//                         // }
//                     }
//                 }
//             }

// 			setTimeout(() => {resolve()}, 1000)
// 			})

// 		.catch(err => {
// 			console.log(err)
// 			setTimeout(() => {reject()}, 1000)
// 		})
// 	})
// }


// async function main () {
//     await testFormation('BTC', '15m')
// }
// main()
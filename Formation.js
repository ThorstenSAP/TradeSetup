const cron = require('node-cron')
const _ = require('lodash')

const { BitgetApi } = require('./api.js') // https://www.bitget.com/api-doc/contract/market/Get-Candle-Data
const { Utils } = require('./utils.js')
const utils = new Utils()
const bitget = new BitgetApi()


const aTicker = ['BTC']
function handleTicker(sTicker, sTimeFrame){
	return new Promise((resolve, reject) => {
		bitget.getTickerData(`${sTicker}USDT`, sTimeFrame, '10')
		.then(async (aData) => {
            //check prev candles for a formation

			
            //check prev candles for a formation

				const oLatestCandle =  aData[aData.length - 2] //latest candle
				const oPrevCandle = aData[aData.length - 3] //last of formation candle
				const oPrevPrevCandle = aData[aData.length - 4] //potential formation candle
				const oPrevPrevPrevCandle =  aData[aData.length - 5] //potential formation candle
						
			if(utils.isMCCandle(oLatestCandle, oPrevCandle)){
				utils.ntfyMe(`${sTicker}-${sTimeFrame}`, `MC Candle ${oPrevCandle.timestamp}`)
				console.log(`MC Candle ${oLatestCandle.timestamp}`)
			}
			//probably needs a given level to watch for -> otherwise there will be too many alerts
			// if(utils.isLiquidation(oLatestCandle, oPrevCandle, oPrevPrevCandle)){
		// 	utils.ntfyMe(`${sTicker}-${sTimeFrame}`, `Liquidation ${oPrevCandle.timestamp}`)
			//     console.log(`Liquidation ${oLatestCandle.timestamp}`)
			// }
			if(utils.isInsideOutFormation(oLatestCandle, oPrevCandle, oPrevPrevCandle)){
				utils.ntfyMe(`${sTicker}-${sTimeFrame}`, `InsideOut ${oPrevCandle.timestamp}`)
				console.log(`InsideOut ${oLatestCandle.timestamp}`)
			}
			if(utils.isWyckoff(oLatestCandle, 2, aData)){
				utils.ntfyMe(`${sTicker}-${sTimeFrame}`, `Wyckoff ${oLatestCandle.timestamp}`)
				console.log(`Wyckoff ${oLatestCandle.timestamp}`)
			}
			if(utils.isEveMorningStar(oLatestCandle, oPrevCandle, oPrevPrevCandle)){
				if(utils.getDirectionOfCandle(aData[i]) == 0){
					utils.ntfyMe(`${sTicker}-${sTimeFrame}`, `MorningStar ${oLatestCandle.timestamp}`)
					console.log(`MorningStar ${oLatestCandle.timestamp}`)
				} else {
					utils.ntfyMe(`${sTicker}-${sTimeFrame}`, `EveStar ${oLatestCandle.timestamp}`)
					console.log(`EveStar ${oLatestCandle.timestamp}`)
				}
			}


			// for (let i = aData.length -3; i >= 1 ; i--) {
                
			// 	// if(utils.isInsideOutFormation(aData[i+1], aData[i], aData[i-1])){
			// 	// 	utils.ntfyMe(`BTC-${sTimeFrame}`, `InsideOut ${aData[i+1].timestamp}`)
            //     //     console.log(`InsideOut ${aData[i+1].timestamp}`)
            //     // }
			// 	if(utils.isWyckoff(aData[i], i, aData)){
			// 		utils.ntfyMe(`BTC-${sTimeFrame}`, `Wyckoff ${aData[i+1].timestamp}`)
			// 		console.log(`Wyckoff ${aData[i].timestamp}`)
			// 	}
			// 	if(utils.isEveMorningStar(aData)){
			// 		//TODO retest
			// 		utils.ntfyMe(`BTC-${sTimeFrame}`, `EveMorningStar ${aData[i+1].timestamp}`)
            //         console.log(`EveMorningStar ${aData[i+1].timestamp}`)
            //     }
			// 	//TODO U-V Formation (4Candles)
			// 	// if(utils.isUFormation(aData[i], i, aData)){
			// 	// 	console.log(`u/V Formation ${aData[i+1].timestamp}`)
			// 	// }

            // }

		})
		.catch(err => {
			console.log(err)
            reject(err)
		})
	})
}

const runnerM15 = cron.schedule('59 */15 * * * *', async () => { 
	
	await utils.ntfyMe('Log', `crone running BTC-M15 formationscript`)
	for await (const sTicker of aTicker) {
		await handleTicker(sTicker, '15m')
	}
})
const runnerM30 = cron.schedule('59 0,30 * * * *', async () => { 
	
	await utils.ntfyMe('Log', `crone running BTC-M30 formationscript`)
	for await (const sTicker of aTicker) {
		await handleTicker(sTicker, '30m')
	}
})
const runnerH1 = cron.schedule('1 */1 * * *', async () => { 
	
	await utils.ntfyMe('Log', `crone running BTC-H1 formationscript`)
	for await (const sTicker of aTicker) {
		await handleTicker(sTicker, '1H')
	}
})
const runnerH2 = cron.schedule('1 */2 * * *', async () => { 
	
	await utils.ntfyMe('Log', `crone running BTC-H2 formationscript`)
	for await (const sTicker of aTicker) {
		await handleTicker(sTicker, '2H')
	}
})

const runnerH4 = cron.schedule('1 0,4,8,12,16,20 * * *', async () => { 
// minute 2 of hour 01, 05, 09, 13, 17 and 21
	
	await utils.ntfyMe('Log', `crone running BTC-H4 formationscript`)
	for await (const sTicker of aTicker) {
		await handleTicker(sTicker, '4H')
	}
})



runnerM15.start() 
runnerM30.start() 
runnerH1.start()
runnerH2.start()
runnerH4.start()


// function testFormation(sTicker, sTimeFrame){
// 	return new Promise((resolve, reject) => {
// 		bitget.getTickerData(`${sTicker}USDT`, sTimeFrame, '26')
// 		.then(async (aData) => {
//             //check prev candles for a formation
// 			const oLatestCandle =  aData[aData.length - 2] //latest candle
// 			const oPrevCandle = aData[aData.length - 3] //last of formation candle
// 			const oPrevPrevCandle = aData[aData.length - 4] //potential formation candle
// 			const oPrevPrevPrevCandle =  aData[aData.length - 5] //potential formation candle
						
// 			if(utils.isMCCandle(oLatestCandle, oPrevCandle)){
// 				utils.ntfyMe(`${sTicker}-${sTimeFrame}`, `MC Candle ${oPrevCandle.timestamp}`)
// 				console.log(`MC Candle ${oLatestCandle.timestamp}`)
// 			}
// 			//probably needs a given level to watch for -> otherwise there will be too many alerts
// 			// if(utils.isLiquidation(oLatestCandle, oPrevCandle, oPrevPrevCandle)){
// 		// 	utils.ntfyMe(`${sTicker}-${sTimeFrame}`, `Liquidation ${oPrevCandle.timestamp}`)
// 			//     console.log(`Liquidation ${oLatestCandle.timestamp}`)
// 			// }
// 			if(utils.isInsideOutFormation(oLatestCandle, oPrevCandle, oPrevPrevCandle)){
// 				utils.ntfyMe(`${sTicker}-${sTimeFrame}`, `InsideOut ${oPrevCandle.timestamp}`)
// 				console.log(`InsideOut ${oLatestCandle.timestamp}`)
// 			}
// 			if(utils.isWyckoff(oLatestCandle, aData.length - 2, aData)){
// 				utils.ntfyMe(`${sTicker}-${sTimeFrame}`, `Wyckoff ${oLatestCandle.timestamp}`)
// 				console.log(`Wyckoff ${oLatestCandle.timestamp}`)
// 			}
// 			if(utils.isEveMorningStar(oLatestCandle, oPrevCandle, oPrevPrevCandle)){
// 				if(utils.getDirectionOfCandle(aData[i]) == 0){
// 					utils.ntfyMe(`${sTicker}-${sTimeFrame}`, `MorningStar ${oLatestCandle.timestamp}`)
// 					console.log(`MorningStar ${oLatestCandle.timestamp}`)
// 				} else {
// 					utils.ntfyMe(`${sTicker}-${sTimeFrame}`, `EveStar ${oLatestCandle.timestamp}`)
// 					console.log(`EveStar ${oLatestCandle.timestamp}`)
// 				}
// 			}

// 			for (let i = aData.length -2; i >= 2 ; i--) {
// 				if(i == 20){
// 					if(utils.isWyckoff(aData[i], i - 2, aData)){
// 						// utils.ntfyMe(`${sTicker}-${sTimeFrame}`, `Wyckoff ${oLatestCandle.timestamp}`)
// 						console.log(`Wyckoff ${oLatestCandle.timestamp}`)
// 					}
// 				}
// 				if(utils.isEveMorningStar(aData[i], aData[i-1], aData[i-2])){
// 					//already implemented without retest
// 					if(utils.getDirectionOfCandle(aData[i]) == 0){
// 						console.log(`MorningStar ${aData[i].timestamp}`)
// 					} else {
// 						console.log(`EveStar ${aData[i].timestamp}`)
// 					}
//                 }
// 				//TODO U-V Formation (4Candles)
// 				// if(utils.isUFormation(aData[i], i, aData)){
// 				// 	console.log(`u/V Formation ${aData[i+1].timestamp}`)
// 				// }

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
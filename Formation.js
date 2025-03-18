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
			// aData[aData.length - 1] //crnt candle
			// aData[aData.length - 2] //last of formation candle
			// aData[aData.length - 3] //potential formation candle
			// aData[aData.length - 4] //potential formation candle
						
			if(utils.isMCCandle(aData[aData.length - 2], aData[aData.length - 3])){
				utils.ntfyMe(`BTC-${sTimeFrame}`, `MC Candle ${aData[i+1].timestamp}`)
				console.log(`MC Candle ${aData[i+1].timestamp}`)
			}
			//probably needs a given level to watch for -> otherwise there will be too many alerts
			if(utils.isLiquidation(aData[aData.length - 2], aData[aData.length - 3], aData[aData.length - 4])){
				utils.ntfyMe(`BTC-${sTimeFrame}`, `Liquidation ${aData[i+1].timestamp}`)
				console.log(`Liquidation ${aData[i+1].timestamp}`)
			}


			for (let i = aData.length -3; i >= 4 ; i--) {
                
				if(utils.isInsideOutFormation(aData[i+2], aData[i+1], aData[i])){
					utils.ntfyMe(`BTC-${sTimeFrame}`, `InsideOut ${aData[i+1].timestamp}`)
                    console.log(`InsideOut ${aData[i].timestamp}`)
                }
				if(utils.isWyckoff(aData[i], i, aData)){
					//TODO check when available
					utils.ntfyMe(`BTC-${sTimeFrame}`, `Wyckoff ${aData[i+1].timestamp}`)
					console.log(`Wyckoff ${aData[i].timestamp}`)
				}
				if(utils.isEveMorningStar(aData)){
					//already implemented without retest
					utils.ntfyMe(`BTC-${sTimeFrame}`, `EveMorningStar ${aData[i+1].timestamp}`)
                    console.log(`EveMorningStar ${aData[i].timestamp}`)
                }
				//TODO U-V Formation (4Candles)
				// if(utils.isUFormation(aData[i], i, aData)){
				// 	console.log(`u/V Formation ${aData[i+1].timestamp}`)
				// }

            }

		})
		.catch(err => {
			console.log(err)
            reject(err)
		})
	})
}

const runnerM15 = cron.schedule('0,15,30,45 * * * *', async () => { 
	
	await utils.ntfyMe('Log', `crone running BTC-M15 formationscript`)
	for await (const sTicker of aTicker) {
		await handleTicker(sTicker, '15m')
	}
})
const runnerM30 = cron.schedule('0,30 * * * *', async () => { 
	
	await utils.ntfyMe('Log', `crone running BTC-M30 formationscript`)
	for await (const sTicker of aTicker) {
		await handleTicker(sTicker, '30m')
	}
})
const runnerH1 = cron.schedule('* */1 * * *', async () => { 
	
	await utils.ntfyMe('Log', `crone running BTC-H1 formationscript`)
	for await (const sTicker of aTicker) {
		await handleTicker(sTicker, '30m')
	}
})
const runnerH2 = cron.schedule('1 */2 * * *', async () => { 
	
	await utils.ntfyMe('Log', `crone running BTC-H2 formationscript`)
	for await (const sTicker of aTicker) {
		await handleTicker(sTicker, '30m')
	}
})

const runnerH4 = cron.schedule('1 0,4,8,12,16,20 * * *', async () => { 
// minute 2 of hour 01, 05, 09, 13, 17 and 21
	
	await utils.ntfyMe('Log', `crone running BTC-H4 formationscript`)
	for await (const sTicker of aTicker) {
		await handleTicker(sTicker, '30m')
	}
})



runnerM15.start() 
runnerM30.start() 
runnerH1.start()
runnerH2.start()
runnerH4.start()


// function testFormation(sTicker, sTimeFrame){
// 	return new Promise((resolve, reject) => {
// 		bitget.getTickerData(`${sTicker}USDT`, sTimeFrame, '10')
// 		.then(async (aData) => {
			
// 			if(utils.isMCCandle(aData[aData.length - 2], aData[aData.length - 3])){
// 				console.log(`MC Candle ${aData[i+1].timestamp}`)
// 			}
// 			//probably needs a given level to watch for -> otherwise there will be too many alerts
// 			if(utils.isLiquidation(aData[aData.length - 2], aData[aData.length - 3], aData[aData.length - 4])){
// 				console.log(`Liquidation ${aData[i+1].timestamp}`)
// 			}

// 			for (let i = aData.length -3; i >= 4 ; i--) {
                
// 				if(utils.isInsideOutFormation(aData[i+2], aData[i+1], aData[i])){
//                     console.log(`InsideOut ${aData[i].timestamp}`)
//                 }
// 				if(utils.isWyckoff(aData[i], i, aData)){
// 					//TODO check when available
// 					console.log(`Wyckoff ${aData[i].timestamp}`)
// 				}
// 				if(utils.isEveMorningStar(aData)){
// 					//already implemented without retest
//                     console.log(`EveMorningStar ${aData[i].timestamp}`)
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
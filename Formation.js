const cron = require('node-cron')
const _ = require('lodash')

const { BitgetApi } = require('./api.js') // https://www.bitget.com/api-doc/contract/market/Get-Candle-Data
const { Utils } = require('./utils.js')
const utils = new Utils()
const bitget = new BitgetApi()


const aTicker = ['BTC', 'ETH', 'SOL', 'XRP']
function handleTicker(sTicker, sTimeFrame){
	return new Promise((resolve, reject) => {
		bitget.getTickerData(`${sTicker}USDT`, sTimeFrame, '20')
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
			if(utils.isInsideOutFormation(oLatestCandle, oPrevCandle, oPrevPrevCandle)){
				utils.ntfyMe(`${sTicker}-${sTimeFrame}`, `InsideOut ${oPrevCandle.timestamp}`)
				console.log(`InsideOut ${oLatestCandle.timestamp}`)
			}
			if(utils.isWyckoff(oLatestCandle, aData.length - 2, aData)){
				utils.ntfyMe(`${sTicker}-${sTimeFrame}`, `Wyckoff ${oLatestCandle.timestamp}`)
				console.log(`Wyckoff ${oLatestCandle.timestamp}`)
			}
			if(utils.isEveMorningStar(oLatestCandle, oPrevCandle, oPrevPrevCandle)){
				if(utils.getDirectionOfCandle(oLatestCandle) == 0){
					utils.ntfyMe(`${sTicker}-${sTimeFrame}`, `MorningStar ${oLatestCandle.timestamp}`)
					console.log(`MorningStar ${oLatestCandle.timestamp}`)
				} else {
					utils.ntfyMe(`${sTicker}-${sTimeFrame}`, `EveStar ${oLatestCandle.timestamp}`)
					console.log(`EveStar ${oLatestCandle.timestamp}`)
				}
			}


		})
		.catch(err => {
			console.log(err)
            reject(err)
		})
	})
}

const runnerM5 = cron.schedule('1 */5 * * * *', async () => { 
	
	await utils.ntfyMe('Log', `crone running BTC-M5 formationscript`)
	for await (const sTicker of aTicker) {
		await handleTicker(sTicker, '5m')
	}
})
const runnerM15 = cron.schedule('2 */15 * * * *', async () => { 
	
	await utils.ntfyMe('Log', `crone running BTC-M15 formationscript`)
	for await (const sTicker of aTicker) {
		await handleTicker(sTicker, '15m')
	}
})
const runnerM30 = cron.schedule('3 0,30 * * * *', async () => { 
	
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
//TODO  minute 2 of hour 01, 05, 09, 13, 17 and 21
	
	await utils.ntfyMe('Log', `crone running BTC-H4 formationscript`)
	for await (const sTicker of aTicker) {
		await handleTicker(sTicker, '4H')
	}
})



runnerM5.start()
runnerM15.start() 
runnerM30.start() 
runnerH1.start()
runnerH2.start()
runnerH4.start()


// function testFormation(sTicker, sTimeFrame){
// 	return new Promise((resolve, reject) => {
// 		bitget.getTickerData(`${sTicker}USDT`, sTimeFrame, '10')
// 		.then(async (aData) => {
// 			const oLatestCandle =  aData[aData.length - 2] //latest candle
// 			const oPrevCandle = aData[aData.length - 3] //last of formation candle
// 			const oPrevPrevCandle = aData[aData.length - 4] //potential formation candle
// 			const oPrevPrevPrevCandle =  aData[aData.length - 5] //potential formation candle
					
// 		if(utils.isMCCandle(oLatestCandle, oPrevCandle)){
// 			utils.ntfyMe(`${sTicker}-${sTimeFrame}`, `MC Candle ${oPrevCandle.timestamp}`)
// 			console.log(`MC Candle ${oLatestCandle.timestamp}`)
// 		}
// 		if(utils.isInsideOutFormation(oLatestCandle, oPrevCandle, oPrevPrevCandle)){
// 			utils.ntfyMe(`${sTicker}-${sTimeFrame}`, `InsideOut ${oPrevCandle.timestamp}`)
// 			console.log(`InsideOut ${oLatestCandle.timestamp}`)
// 		}
// 		if(utils.isWyckoff(oLatestCandle, aData.length - 2, aData)){
// 			utils.ntfyMe(`${sTicker}-${sTimeFrame}`, `Wyckoff ${oLatestCandle.timestamp}`)
// 			console.log(`Wyckoff ${oLatestCandle.timestamp}`)
// 		}
// 		if(utils.isEveMorningStar(oLatestCandle, oPrevCandle, oPrevPrevCandle)){
// 			if(utils.getDirectionOfCandle(oLatestCandle) == 0){
// 				utils.ntfyMe(`${sTicker}-${sTimeFrame}`, `MorningStar ${oLatestCandle.timestamp}`)
// 				console.log(`MorningStar ${oLatestCandle.timestamp}`)
// 			} else {
// 				utils.ntfyMe(`${sTicker}-${sTimeFrame}`, `EveStar ${oLatestCandle.timestamp}`)
// 				console.log(`EveStar ${oLatestCandle.timestamp}`)
// 			}
// 		}

// 			for (let i = aData.length -2; i >= 2 ; i--) {
// 				if(i == 8){
// 					debugger
					
// 					// if(utils.isWyckoff(oPrevPrevCandle, aData.length - 4, aData)){
// 					// 	utils.ntfyMe(`${sTicker}-${sTimeFrame}`, `Wyckoff ${oLatestCandle.timestamp}`)
// 					// 	console.log(`Wyckoff ${oLatestCandle.timestamp}`)
// 					// }
// 				}

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
//     await testFormation('BTC', '30m')
// }
// main()
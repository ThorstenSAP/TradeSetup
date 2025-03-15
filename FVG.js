const cron = require('node-cron')
const _ = require('lodash')

const { BitgetApi } = require('./api.js') // https://www.bitget.com/api-doc/contract/market/Get-Candle-Data
const { Utils } = require('./utils.js')

const utils = new Utils()
const bitget = new BitgetApi()


function handleTicker(sTicker, sTimeFrame){
	return new Promise((resolve, reject) => {
		bitget.getTickerData(`${sTicker}USDT`, sTimeFrame, '100')
		.then(async (aData) => {
			// aData[aData.length - 1] //crnt candle
			// aData[aData.length - 2] //prev candle
			// aData[aData.length - 3] //potential push candle
			// aData[aData.length - 4] //first candle

			if(utils.isStrongPush(aData[aData.length - 3])){
				if (utils.getDirectionOfCandle(aData[aData.length - 3]) == 0){
					//bull FVG
					if(aData[aData.length - 4].high < aData[aData.length - 2].high){
						//FVG
						console.log(`Bull FVG ${aData[aData.length - 3].timestamp}`)
						await utils.ntfyMe(`FVG-${sTimeFrame}`, `Bull FVG ${aData[aData.length - 3].timestamp}`)
					}
				} else {
					//bear FVG
					if(aData[aData.length - 4].low > aData[aData.length - 2].high){
						//FVG
						console.log(`Bear FVG ${aData[aData.length - 3].timestamp}`)
						await utils.ntfyMe(`FVG-${sTimeFrame}`, `Bear FVG ${aData[aData.length - 3].timestamp}`)
					}
				}
			}
			setTimeout(() => {resolve()}, 1000)
			})
		.catch(err => {
			console.log(err)
			setTimeout(() => {reject()}, 1000)
		})
	})
}


const aTicker = ['BTC']
const runnerH1 = cron.schedule('1 * * * *', async () => { 
	// console.log(`crone running BTC-M15 script -- ${new Date().toDateString()}:${new Date().toTimeString()}`)
	// 
	await utils.ntfyMe('Log', `crone running H1 FVG script`)
	for await (const sTicker of aTicker) {
		await handleTicker(sTicker, '1H')
	}
})
const runnerH2 = cron.schedule('1 */2 * * *', async () => { 
	// console.log(`crone running BTC-M15 script -- ${new Date().toDateString()}:${new Date().toTimeString()}`)
	// 
	await utils.ntfyMe('Log', `crone running H2 FVG script`)
	for await (const sTicker of aTicker) {
		await handleTicker(sTicker, '2H')
	}
})
const runnerH4 = cron.schedule('1 0,4,8,12,16,20 * * *', async () => { 
	// console.log(`crone running BTC-M15 script -- ${new Date().toDateString()}:${new Date().toTimeString()}`)
	// 
	await utils.ntfyMe('Log', `crone running H4 FVG script`)
	for await (const sTicker of aTicker) {
		await handleTicker(sTicker, '4H')
	}
})

runnerH1.start()
runnerH2.start()
runnerH4.start()





// function testFVG(sTicker, sTimeFrame){
// 	return new Promise((resolve, reject) => {
// 		bitget.getTickerData(`${sTicker}USDT`, sTimeFrame, '100')
// 		.then(async (aData) => {
// 			// await utils.ntfyMe(`FVG-${sTimeFrame}`, `test`)
// 			for (let i = aData.length -2; i > 0; i--) {
// 				//-2 start on prev candle
// 				if(utils.isStrongPush(aData[i])){
// 					if(utils.getDirectionOfCandle(aData[i]) == 0){
// 						//bull FVG
// 						if(aData[i - 1].high < aData[i + 1].low){
// 							console.log(`Bull FVG ${aData[i].timestamp}`)
// 						}
// 					} else {
// 						//bear FVG
// 						if(aData[i - 1].low > aData[i + 1].high){
// 							console.log(`Bear FVG ${aData[i].timestamp}`)
// 						}

// 					}
// 				}
// 			}
// 			setTimeout(() => {resolve()}, 1000)
// 			})
// 		.catch(err => {
// 			console.log(err)
// 			setTimeout(() => {reject()}, 1000)
// 		})
// 	})
// }

// async function main () {
// 	await testFVG('BTC', '1H')
// }
// main()
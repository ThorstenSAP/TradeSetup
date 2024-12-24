const cron = require('node-cron')
const { BitgetApi } = require('./api.js') // https://www.bitget.com/api-doc/contract/market/Get-Candle-Data
const { Engulfing } = require('./engulfing.js')
const { Utils } = require('./utils.js')
const { RsiDiv } = require('./rsiDiv.js')


//Note that 1 * * * * will fire only on the first minute of every hour - 15:01:00, 16:01:00, etc.
//const runner = cron.schedule('*/15 * * * *', () => { //runs the timer on xx:15, xx:30, xx:45 and xx:00
// const runner3 = cron.schedule('6 * * * *', () => { //runs the timer on xx:06
//const runner4 = cron.schedule('18,33,48,03 * * * *', () => { runs the timer on xx:18, xx:33, xx:48 and xx:03

// const runner = cron.schedule('*/15 * * * *', () => { //runs the timer on xx:15, xx:30, xx:45 and xx:00
//     console.log('running a task every 15 minute');
//   })
// runner.start()


const utils = new Utils()
const bitget = new BitgetApi()
const aTicker = ['BTC', 'ETH', 'XRP', 'SOL', 'ADA', 'UNI', 'LINK', 'VET', 'AAVE', 'DOGE'] 

// const aTicker = ['VET']
function handleTicker(sTicker, sTimeFrame){
	return new Promise((resolve, reject) => {
		bitget.getTickerData(`${sTicker}USDT`, sTimeFrame, '100')
		.then(async (aData) => {
			if(utils.isEveMorningStar(aData)){
				await utils.ntfyMe('BullBearSignal', {
					pair: sTicker,
					msg: 'EveMorningStar'
				})
			} else if (utils.isEngulfing(aData)){
				await utils.ntfyMe('BullBearSignal', {
					pair: sTicker,
					msg: 'Engulfing'
				})
			} else if (utils.isCloudCover(aData)){
				await utils.ntfyMe('BullBearSignal', {
					pair: sTicker,
					msg: 'CloudCover'
				})
			}
		})
		.catch(err => {
			console.log(err)
			setTimeout(() => {reject()}, 1000)
		})
	})
}

// terminal test
// (async () => {
// 	for await (const sTicker of aTicker) {
// 		await handleTicker(sTicker, '2H')
// 	}
//   })();


//https://www.npmjs.com/package/node-cron
//minute 2 of hour 01, 05, 09, 13, 17 and 21
const runner4H = cron.schedule('2 1,5,9,13,17,21 * * *', async () => { 
	console.log(`crone running 4h script -- ${new Date().toDateString()}:${new Date().toTimeString()}`)
	
	await utils.ntfyMe('Log', `crone running 4h script`)
	const sTimeFrame = '4H'
	for await (const sTicker of aTicker) {
		await handleTicker(sTicker, sTimeFrame)
	}
})

runner4H.start()

// const runner4HTest = cron.schedule('2 1,5,9,11,17,21 * * *', async () => { 
// 	console.log(`crone running script -- ${new Date().toDateString()}:${new Date().toTimeString()}`)
	
// 	await utils.ntfyMe('Log', {
// 		msg: 'Running'
// 	})
// 	const sTimeFrame = '4H'
// 	for await (const sTicker of aTicker) {
// 		await handleTicker(sTicker, sTimeFrame)
// 	}
// })
// runner4HTest.start()


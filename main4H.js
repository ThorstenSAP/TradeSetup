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
const aTicker = ['BTC', 'ETH', 'XRP', 'EOS', 'LTC', 'ADA', 'LINK', 'TRX', 'DOT', 'DOGE', 'SOL', 'MATIC', 'VET', 'BNB', 'UNI', 'ICP', 'AAVE', 'FIL', 'XLM', 'ATOM',
  'XTZ', 'SUSHI', 'AXS', 'THETA', 'AVAX', 'SHIB', 'MANA', 'PEPE' ]

// const aTicker = ['VET']
function handleTicker(sTicker, sTimeFrame){
	return new Promise((resolve, reject) => {
		bitget.getTickerData(`${sTicker}USDT`, sTimeFrame, '100')
		.then(res => {
			console.log()
			console.log(`checking ${sTicker}`)
			utils.setRsi(res)
			// engulfing.checkHistory(res)
			const rsiDiv = new RsiDiv(res, sTicker, sTimeFrame)
			rsiDiv.setRsiHighLows()
			rsiDiv.findRsiDiv()
			setTimeout(() => {resolve()}, 1000)
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


//for the server use https://github.com/foreversd/forever 

const runner4H = cron.schedule('* 2,6,10,14,18,22 * * *', async () => { //should run every 4 hours
	console.log(`crone running script -- ${new Date().toDateString()}:${new Date().toTimeString()}`)
	const sTimeFrame = '4H'
	for await (const sTicker of aTicker) {
		await handleTicker(sTicker, sTimeFrame)
	}
})
runner4H.start()

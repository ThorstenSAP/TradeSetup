const cron = require('node-cron')
const _ = require('lodash')

const { BitgetApi } = require('./api.js') // https://www.bitget.com/api-doc/contract/market/Get-Candle-Data
const { Utils } = require('./utils.js')
const utils = new Utils()
const bitget = new BitgetApi()


const aTicker = ['BTC']
function handleTicker(sTicker, sTimeFrame){
	return new Promise((resolve, reject) => {
		bitget.getTickerData(`${sTicker}USDT`, sTimeFrame, '200')
		.then(async (aData) => {
            //check prev candles for a formation
            
			// aData[aData.length - 1] //crnt candle
			// aData[aData.length - 2] //last of formation candle
			// aData[aData.length - 3] //potential formation candle
			// aData[aData.length - 4] //potential formation candle

		})
		.catch(err => {
			console.log(err)
            reject(err)
		})
	})
}

// const runnerM15 = cron.schedule('0,15,30,45 * * * *', async () => { 
// 	console.log(`crone running BTC-M15 script -- ${new Date().toDateString()}:${new Date().toTimeString()}`)
	
// 	// await utils.ntfyMe('Log', `crone running BTC-M15 script`)
// 	for await (const sTicker of aTicker) {
// 		await handleTicker(sTicker, '15m')
// 	}
// })
// runnerM15.start() 


function testFormation(sTicker, sTimeFrame){
	return new Promise((resolve, reject) => {
		bitget.getTickerData(`${sTicker}USDT`, sTimeFrame, '100')
		.then(async (aData) => {

			for (let i = aData.length -3; i >= 0 ; i--) {
                //TODO EveMorningStar
                //TODO Wyckoff
                //TODO U-V Formation (4Candles)
				if(utils.isInsideOutFormation(aData[i+2], aData[i+1], aData[i])){
                    console.log(`InsideOut ${aData[i].timestamp}`)
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


async function main () {
    await testFormation('BTC', '15m')
}
main()
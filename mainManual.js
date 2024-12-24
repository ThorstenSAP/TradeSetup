const { BitgetApi } = require('./api.js') // https://www.bitget.com/api-doc/contract/market/Get-Candle-Data
const { Utils } = require('./utils.js')

const utils = new Utils()
const bitget = new BitgetApi()
// const aTicker = ['BTC', 'ETH', 'XRP', 'SOL', 'ADA', 'UNI', 'LINK', 'VET', 'AAVE', 'DOGE'] 
// ['EOS', 'LTC', 'ADA', 'LINK', 'TRX', 'DOT', 'DOGE', 'SOL', 'MATIC', 'VET', 'BNB', 'UNI', 'ICP', 'AAVE', 'FIL', 'XLM', 'ATOM',
//   'XTZ', 'SUSHI', 'AXS', 'THETA', 'AVAX', 'SHIB', 'MANA', 'PEPE' ]


const aTicker = ['BTC']
function handleTicker(sTicker, sTimeFrame, iSma1, iSma2){
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
			setTimeout(() => {resolve()}, 1000)
			})
		.catch(err => {
			console.log(err)
			setTimeout(() => {reject()}, 1000)
		})
	})
}

async function weeklyCheck(){
    for await (const sTicker of aTicker) {
        await handleTicker(sTicker, '1W', 10, 30)
    }
}

async function check4H(){
    for await (const sTicker of aTicker) {
        await handleTicker(sTicker, '4H', 21, 50)
    }
}
async function testNTFY() {
	// await utils.ntfyMe('test', {
	// 	pair: 'test',
	// 	msg: 'EveMorningStar'
	// })
	await utils.ntfyMe('test', `crone running 4h script`)
}

check4H()			
// testNTFY()
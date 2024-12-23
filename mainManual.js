const { BitgetApi } = require('./api.js') // https://www.bitget.com/api-doc/contract/market/Get-Candle-Data
const { Utils } = require('./utils.js')

const utils = new Utils()
const bitget = new BitgetApi()
const aTicker = ['BTC', 'ETH', 'XRP', 'SOL', 'ADA', 'UNI', 'LINK', 'VET', 'AAVE', 'DOGE'] 
// ['EOS', 'LTC', 'ADA', 'LINK', 'TRX', 'DOT', 'DOGE', 'SOL', 'MATIC', 'VET', 'BNB', 'UNI', 'ICP', 'AAVE', 'FIL', 'XLM', 'ATOM',
//   'XTZ', 'SUSHI', 'AXS', 'THETA', 'AVAX', 'SHIB', 'MANA', 'PEPE' ]


// const aTicker = ['VET']
function handleTicker(sTicker, sTimeFrame, iSma1, iSma2){
	return new Promise((resolve, reject) => {
		bitget.getTickerData(`${sTicker}USDT`, sTimeFrame, '100')
		.then(async (res) => {
            //calc 10 and 30 sma
            //check if candle crossed both
			// utils.setSma(res, iSma1)
			// utils.setSma(res, iSma2)
			if(utils.isEveMorningStar(res)){
				await this.utils.ntfyMe(this.ntfyTopic, {
					pair: this.sTicker,
					msg: 'EveMorningStar'
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
	await utils.ntfyMe('test', {
		pair: 'test',
		msg: 'EveMorningStar'
	})
}
//weeklyCheck() //Problem only 13 weekly candles are returned
// dailyCheck() //SMAs are way off
			// Candles are starting at 18.00 cet - 16.00 utc
			testNTFY()			
const cron = require('node-cron')
const _ = require('lodash')

const { BitgetApi } = require('./api.js') // https://www.bitget.com/api-doc/contract/market/Get-Candle-Data
const { Utils } = require('./utils.js')
const utils = new Utils()
const bitget = new BitgetApi()

const iStopLvl = 86630
const iDirection = 0


const aTicker = ['BTC']
function handleTicker(sTicker, sTimeFrame){
	return new Promise((resolve, reject) => {
		bitget.getTickerData(`${sTicker}USDT`, sTimeFrame, '10')
		.then(async (aData) => {
            //check prev candles for a formation
			const oCrntCandle =  aData[aData.length - 1] //crnt candle
            
            if(iDirection == 0){
                if(oCrntCandle.close < iStopLvl){
                    utils.ntfyMe(`BTC-StopLvl}`, `stop per M1 close taken ${oCrntCandle.timestamp}`)
                    //TODO sent order to bitget -> market close
                }
            } else {
                if(oCrntCandle.close > iStopLvl){
                    utils.ntfyMe(`BTC-StopLvl}`, `stop per M1 close taken ${oCrntCandle.timestamp}`)
                    //TODO sent order to bitget -> market close
                }
            }

		})
		.catch(err => {
			console.log(err)
            reject(err)
		})
	})
}


const runner = cron.schedule('59 */1 * * * *', async () => { 
	
	await utils.ntfyMe('Log', `crone running stopCloseLevel M1`)
	for await (const sTicker of aTicker) {
		await handleTicker(sTicker, '1m')
	}
})
runner.start()
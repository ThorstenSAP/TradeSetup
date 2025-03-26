const cron = require('node-cron')
const _ = require('lodash')

const { BitgetApi } = require('./api.js') // https://www.bitget.com/api-doc/contract/market/Get-Candle-Data
const { Utils } = require('./utils.js')
const utils = new Utils()
const bitget = new BitgetApi()

class FVG{
    constructor(iDirection, fRangeHigh, fRangeLow){

        this.iDirection = iDirection //0 == long - 1 == short
        this.fRangeHigh = fRangeHigh 
        this.fRangeLow = fRangeLow
    }
}

const oFVG = new FVG(1, 87578.3, 87188.8) //26.03.25 14.00



const aTicker = ['BTC']
function handleTicker(sTicker, sTimeFrame){
	return new Promise((resolve, reject) => {
		bitget.getTickerData(`${sTicker}USDT`, sTimeFrame, '10')
		.then(async (aData) => {
            //TODO potential switch from oPrevCandle to oCrntCandle
            //check prev candles for a formation
			const oCrntCandle =  aData[aData.length - 1] //crnt candle
			const oPrevCandle = aData[aData.length - 2] //last of formation candle
			const oPrevPrevCandle = aData[aData.length - 3] //potential formation candle
			const oPrevPrevPrevCandle =  aData[aData.length - 4] //potential formation candle

            //TODO check if an trade is active
            if(utils.getDirectionOfCandle(oPrevCandle) == oFVG.iDirection){
                if(utils.didCandleTouchFVG(oFVG, oPrevCandle)){

                    if(utils.isMCCandle(oPrevCandle, oPrevPrevCandle)){
                        utils.ntfyMe(`BTC-FVG-${sTimeFrame}`, `MC Candle ${oPrevCandle.timestamp}`)
                        console.log(`MC Candle ${oPrevCandle.timestamp}`)
                    }
                    //probably needs a given level to watch for -> otherwise there will be too many alerts
                    if(utils.isLiquidation(oPrevCandle, oPrevPrevCandle, oPrevPrevPrevCandle)){
                        utils.ntfyMe(`BTC-FVG-${sTimeFrame}`, `Liquidation ${oPrevCandle.timestamp}`)
                        console.log(`Liquidation ${oPrevCandle.timestamp}`)
                    }
                    if(utils.isInsideOutFormation(oPrevCandle, oPrevPrevCandle, oPrevPrevPrevCandle)){
                        utils.ntfyMe(`BTC-FVG-${sTimeFrame}`, `Liquidation ${oPrevCandle.timestamp}`)
                        console.log(`InsideOut ${oPrevCandle.timestamp}`)
                    }
                    if(utils.isWyckoff(oPrevCandle, 2, aData)){
                        utils.ntfyMe(`BTC-FVG-${sTimeFrame}`, `Liquidation ${oPrevCandle.timestamp}`)
                        console.log(`Wyckoff ${oPrevCandle.timestamp}`)
                    }
                    if(utils.isEveMorningStar(oPrevCandle, oPrevPrevCandle, oPrevPrevPrevCandle)){
                        //already implemented without retest
                        utils.ntfyMe(`BTC-FVG-${sTimeFrame}`, `Liquidation ${oPrevCandle.timestamp}`)
                        console.log(`EveMorningStar ${oPrevCandle.timestamp}`)
                    }
                }
            }
						

		})
		.catch(err => {
			console.log(err)
            reject(err)
		})
	})
}



const runnerM5 = cron.schedule('59 */5 * * * *', async () => { 
	
	await utils.ntfyMe('Log', `crone running BTC-M5 FVG`)
	for await (const sTicker of aTicker) {
		await handleTicker(sTicker, '5m')
	}
})
const runnerM15 = cron.schedule('59 */15 * * * *', async () => { 
	
	await utils.ntfyMe('Log', `crone running BTC-M15 FVG watch`)
	for await (const sTicker of aTicker) {
		await handleTicker(sTicker, '15m')
	}
})
runnerM5.start()
runnerM15.start()
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

const oFVG = new FVG(0, 87300.3, 86887.3) //27.03.25 01.00 H1 + H2



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

            console.log(`timeframe: ${sTimeFrame}`)
            console.log('timestamp: ' + new Date().toLocaleTimeString())
            console.log(`candle: ${oCrntCandle.timestamp}`)

            //TODO check if an trade is active
            if(utils.getDirectionOfCandle(oCrntCandle) == oFVG.iDirection){
                if(utils.didCandleTouchFVG(oFVG, oCrntCandle)){

                    if(utils.isMCCandle(oCrntCandle, oPrevCandle)){
                        utils.ntfyMe(`BTC-FVG-${sTimeFrame}`, `MC Candle ${oCrntCandle.timestamp}`)
                        console.log(`MC Candle ${oCrntCandle.timestamp}`)
                    }
                    //probably needs a given level to watch for -> otherwise there will be too many alerts
                    // if(utils.isLiquidation(oCrntCandle, oPrevCandle, oPrevPrevCandle)){
                    //     utils.ntfyMe(`BTC-FVG-${sTimeFrame}`, `Liquidation ${oCrntCandle.timestamp}`)
                    //     console.log(`Liquidation ${oCrntCandle.timestamp}`)
                    // }
                    if(utils.isInsideOutFormation(oCrntCandle, oPrevCandle, oPrevPrevCandle)){
                        utils.ntfyMe(`BTC-FVG-${sTimeFrame}`, `Liquidation ${oCrntCandle.timestamp}`)
                        console.log(`InsideOut ${oCrntCandle.timestamp}`)
                    }
                    if(utils.isWyckoff(oCrntCandle, 2, aData)){
                        utils.ntfyMe(`BTC-FVG-${sTimeFrame}`, `Liquidation ${oCrntCandle.timestamp}`)
                        console.log(`Wyckoff ${oCrntCandle.timestamp}`)
                    }
                    if(utils.isEveMorningStar(oCrntCandle, oPrevCandle, oPrevPrevCandle)){
                        //already implemented without retest
                        utils.ntfyMe(`BTC-FVG-${sTimeFrame}`, `Liquidation ${oCrntCandle.timestamp}`)
                        console.log(`EveMorningStar ${oCrntCandle.timestamp}`)
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
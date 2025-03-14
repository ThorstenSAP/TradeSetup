const cron = require('node-cron')
const _ = require('lodash')

const { BitgetApi } = require('./api.js') // https://www.bitget.com/api-doc/contract/market/Get-Candle-Data
const { Utils } = require('./utils.js')

// class Order{
//     constructor(iEntry, iStop){
//         this.iEntry = iEntry
//         this.iStop = iStop
//     }
// }
// class Trade {
//     constructor(iDirection){
//         this.direction = iDirection
//         this.oOrder = new Order(0,0,0)
//     }
// }
class Trend{
    constructor(iDirection, fAbsHighLow, fTrendThreshold){
        this.iDirection = iDirection //0 up, 1 down, 2 unsure
        this.fAbsHighLow = fAbsHighLow
        this.fTrendThreshold = fTrendThreshold

        this.fPrevHighLow = 0.0
        this.bLiquidationAppeared = false
        this.bTrendRangeMoved = false
        this.iTrendLength = 0
        this.dLiqTimestamp = undefined
        this.iTrendThresholdIndex = undefined
        this.iTrendPrevThresholdIndex = undefined
    }

    setAbsHighLow(fAbsHighLow){
        this.fAbsHighLow = fAbsHighLow
        this.bTrendRangeMoved = false
    }
    setTrendThreshold(fTrendThreshold){
        this.fTrendThreshold = fTrendThreshold
        this.bTrendRangeMoved = true
    }
    shiftPrevHighLow(){
        this.fPrevHighLow = this.fAbsHighLow
    }
    clearPrevHighLow(){
        this.fPrevHighLow = 0.0
    }
    setTrendDirection(iDirection){
        this.iDirection = iDirection
        this.iTrendLength = 0 //reset counter
    }
    increaseTrendLengthCounter(){
        this.iTrendLength = this.iTrendLength + 1
    }
    setLiqTimestamp(dLiqTimestamp){
        this.dLiqTimestamp = dLiqTimestamp
    }
    setTrendThresholdIndex(index){
        this.iTrendPrevThresholdIndex = this.iTrendThresholdIndex
        this.iTrendThresholdIndex = index
    }
}







const utils = new Utils()
const bitget = new BitgetApi()

function handleAbsoluteNewHighLow(cTrend, oCandle, index){
    cTrend.setTrendThresholdIndex(index)
    if (utils.getDirectionOfCandle(oCandle) == 0){
        cTrend.shiftPrevHighLow()
        cTrend.setAbsHighLow(oCandle.high)
        cTrend.setTrendThreshold(oCandle.low)
        cTrend.increaseTrendLengthCounter()
        // console.log(`absolute new High at ${oCandle.high}; timestamp ${oCandle.timestamp}`)
        // console.log(`new TrendThreshold at ${oCandle.low}`)
        // console.log('')
    } else {
        cTrend.shiftPrevHighLow()
        cTrend.setAbsHighLow(oCandle.low)
        cTrend.setTrendThreshold(oCandle.high)
        cTrend.increaseTrendLengthCounter()
        // console.log(`absolute new High at ${oCandle.low}; timestamp ${oCandle.timestamp}`)
        // console.log(`new TrendThreshold at ${oCandle.high}`)
        // console.log('')
    }
}

function handleTrendChange(cTrend, oCandle, iCandleDirection, index){
    // let cOrder = createOrderOfTrendChange(oCandle, cTrend.fTrendThreshold, iCandleDirection)
    if(this.bNTFYME){
        utils.ntfyMe('BTC-M15', `TrendChanged: ${oCandle.timestamp}`)
    }
    console.log(`TrendChanged: ${oCandle.timestamp}`)

    cTrend.setTrendDirection(iCandleDirection)
    cTrend.clearPrevHighLow()
    cTrend.setTrendThresholdIndex(index)
    if(iCandleDirection == 0){
        cTrend.setAbsHighLow(oCandle.high)
        cTrend.setTrendThreshold(oCandle.low)
    } else {
        cTrend.setAbsHighLow(oCandle.low)
        cTrend.setTrendThreshold(oCandle.high)
    }  

    
    console.log(`new Trenddirection: ${cTrend.iDirection}`)
    console.log('')

}

function handleTrendThresholdLiquidation(cTrend, cPrevTrend, oCandle, iCandleDirection, index){
    if(this.bNTFYME){
        utils.ntfyMe('BTC-M15', `continue with prev trend => RangeHighLowLiquidation occured ${oCandle.timestamp}`)
    }
    console.log(`continue with prev trend => RangeHighLowLiquidation occured ${oCandle.timestamp}`)
    
    cTrend.setLiqTimestamp(oCandle.timestamp) //mark trend as liquidated
    let tmp = _.clone(cTrend)
    cTrend = _.clone(cPrevTrend)
    cPrevTrend = _.clone(tmp)

    cTrend.setTrendThresholdIndex(index)
    if(iCandleDirection == 0){
        if(cTrend.iDirection == 0){
            if(oCandle.low < cTrend.fTrendThreshold){
                cTrend.setTrendThreshold(oCandle.low)
            }
        } 
        
    } else {
        // cTrend.setTrendThreshold(oCandle.high)
        if(cTrend.iDirection == 1){
            if(oCandle.high < cTrend.fTrendThreshold){
                cTrend.setTrendThreshold(oCandle.high)
            }
        } 
    }

    cTrend.bTrendRangeMoved = false
    return {cTrend: cTrend, cPrevTrend: cPrevTrend}
}

function handleLiquidationBox(cTrend, oPrevPrevCandle, iCandleDirection){
    if(iCandleDirection == 0){
        cTrend.setTrendThreshold(oPrevPrevCandle.low)
        // cTrend.setAbsHighLow(oPrevPrevCandle.high)
    } else {
        cTrend.setTrendThreshold(oPrevPrevCandle.high)
        // cTrend.setAbsHighLow(oPrevPrevCandle.low)
    }  
}

// function createOrderOfLiquidation(oCandle, oPrevCandle, iCandleDirection){
//     let cOrder
//     if(iCandleDirection == 0){
//         //bullish liquidation - in an downtrend
//         cOrder = new Order(utils.getUpperThreshold(oCandle.open, oPrevCandle.close), 
//                             utils.getBullLiquidationBoxStop(oCandle.low, oPrevCandle.low) + 10)


//     } else {
//         //bearish liquidation - in an uptrend
//         cOrder = new Order(utils.getLowerThreshold(oCandle.open, oPrevCandle.close), 
//                             utils.getBearLiquidationBoxStop(oCandle.low, oPrevCandle.low) + 10)

//     }
// }

// function createOrderOfTrendChange(oCandle, fPrevTrendThreshold, iCandleDirection){
//     let cOrder
//     if(iCandleDirection == 0){
//         cOrder = new Order(fPrevTrendThreshold, oCandle.low)
//     } else {
//         cOrder = new Order(fPrevTrendThreshold, oCandle.low)
//     }

//     return cOrder
// }


function analyzeTrend(aData){
    return new Promise((res,rej) => {
    //aData.length -1 is the latest candle
        let cTrend = new Trend(
            utils.getDirectionOfCandle(aData[0]),
            utils.getTrendThresholds(aData[0]).fAbsHigh,
            utils.getTrendThresholds(aData[0]).fTrendThreshold
        )
        let cPrevTrend= _.clone(cTrend)

        //starts at index 0
        // for (const oCandle of aData) { 
        // }
        aData.forEach((oCandle, i) => {
            if (i != 0){
                //ignore first candle
                // if(i == 28){
                //     debugger
                // }
                if(i == aData.length - 1){
                    this.bNTFYME = true
                }
                
                const iCandleDirection = utils.getDirectionOfCandle(oCandle)
                const bDoji = utils.isCandleDoji(oCandle) //0.35% Threshold
                if(iCandleDirection == cTrend.iDirection){
                    //same direction
                    if (iCandleDirection == 0){
                        if(oCandle.high > cTrend.fAbsHighLow){
                            //new high is generated
                            if(!bDoji && oCandle.close > cTrend.fAbsHighLow){
                                //set new High, prevHigh, TrendThreshold
                                handleAbsoluteNewHighLow(cTrend, oCandle, i)
                            } else if (oCandle.high > cTrend.fAbsHighLow){
                                //it is a doji or the HighLow is extended without a close above or below it
                                cTrend.setAbsHighLow(oCandle.high)
                                cTrend.increaseTrendLengthCounter()
                            } else {
                                cTrend.increaseTrendLengthCounter()
                            }
                        } else {
                            //inside bar
                            cTrend.increaseTrendLengthCounter()
                        }

                    } else {
                        //downtrend
                        if(oCandle.low < cTrend.fAbsHighLow){
                            //new low is generated
                            if(!bDoji && oCandle.close < cTrend.fAbsHighLow){
                                //set new High, prevHigh, TrendThreshold
                                handleAbsoluteNewHighLow(cTrend, oCandle, i)
                            } else if (oCandle.low > cTrend.fAbsHighLow){
                                //it is a doji or the HighLow is extended without a close above or below it
                                cTrend.setAbsHighLow(oCandle.high)
                                cTrend.increaseTrendLengthCounter()
                            } else {
                                cTrend.increaseTrendLengthCounter()
                            }
                        } else {
                            //inside bar
                            cTrend.increaseTrendLengthCounter()
                        }

                    }

                } else {
                    // opposite direction
                    if(bDoji){
                        cTrend.bTrendRangeMoved = false
                        cTrend.increaseTrendLengthCounter()
                    } else {
                        //not a doji
                        if (iCandleDirection == 0){
                            if(oCandle.close > cTrend.fPrevHighLow && cTrend.bTrendRangeMoved){
                                if(cTrend.iTrendLength <= 1 && oCandle.close > cPrevTrend.fTrendThreshold){
                                    //RangeLiquidation occured -> continue with prev trend
                                    let tmp = handleTrendThresholdLiquidation(cTrend, cPrevTrend, oCandle, iCandleDirection, i)
                                    cTrend = tmp.cTrend
                                    cPrevTrend = tmp.cPrevTrend
                                    console.log('RangeLowLiquidation in uptrend')
                                    console.log(`macd direction ${utils.getMACDSignal(aData.slice(0,i))}`)
                                    console.log('')
                                } else {
                                    //liquidation created
                                    if(cTrend.iTrendPrevThresholdIndex){
                                        handleLiquidationBox(cTrend, aData[cTrend.iTrendPrevThresholdIndex], utils.getDirectionOfCandle(aData[cTrend.iTrendPrevThresholdIndex]))
                                    } else {
                                        //use the crnt threshold if there is no prevThreshold
                                        handleLiquidationBox(cTrend, aData[cTrend.iTrendThresholdIndex], utils.getDirectionOfCandle(aData[cTrend.iTrendThresholdIndex]))
                                    }
                                    cTrend.increaseTrendLengthCounter()
                                    cTrend.bTrendRangeMoved = false
                                    // let cOrder = createOrderOfLiquidation(oCandle, aData[i-1], iCandleDirection)
                                    // console.log(`liquidationBox created ${oCandle.timestamp}`)
                                    // console.log('')
                                }

                            } else if(oCandle.close > cPrevTrend.fTrendThreshold) {
                                //RangeLiquidation occured -> continue with prev trend
                                //ensure it is not within the crnt trend
                                if(oCandle.close > cTrend.fTrendThreshold){
                                    if(!cPrevTrend.dLiqTimestamp || (cPrevTrend.dLiqTimestamp && cPrevTrend.dLiqTimestamp == aData[i-1].timestamp)){
                                        // first liquidation or price negated the prev liquidation
                                        let tmp = handleTrendThresholdLiquidation(cTrend, cPrevTrend, oCandle, iCandleDirection, i)
                                        cTrend = tmp.cTrend
                                        cPrevTrend = tmp.cPrevTrend
                                        console.log(`macd direction ${utils.getMACDSignal(aData.slice(0,i))}`)
                                        console.log('')

                                    } else {
                                        //Threshold taken out => turnaround
                                        cPrevTrend = _.clone(cTrend)
                                        handleTrendChange(cTrend, oCandle, iCandleDirection, i)

                                    }
                                }

                            } else if(oCandle.close > cTrend.fTrendThreshold){
                                //Threshold taken out => turnaround
                                cPrevTrend = _.clone(cTrend)
                                handleTrendChange(cTrend, oCandle, iCandleDirection, i)

                            } else {
                                //candle within the Trendrange and without a liquidationBox
                                cTrend.bTrendRangeMoved = false
                            }
                        } else {
                            if(oCandle.close < cTrend.fPrevHighLow && cTrend.bTrendRangeMoved){
                                if(cTrend.iTrendLength <= 1 && oCandle.close < cPrevTrend.fTrendThreshold){
                                    //RangeLiquidation occured -> continue with prev trend
                                    let tmp = handleTrendThresholdLiquidation(cTrend, cPrevTrend, oCandle, iCandleDirection, i)
                                    cTrend = tmp.cTrend
                                    cPrevTrend = tmp.cPrevTrend
                                    console.log(`macd direction ${utils.getMACDSignal(aData.slice(0,i))}`)
                                    console.log('')
                                } else {
                                    if(cTrend.iTrendPrevThresholdIndex){
                                        handleLiquidationBox(cTrend, aData[cTrend.iTrendPrevThresholdIndex], utils.getDirectionOfCandle(aData[cTrend.iTrendPrevThresholdIndex]))
                                    } else {
                                        //use the crnt threshold if there is no prevThreshold
                                        handleLiquidationBox(cTrend, aData[cTrend.iTrendThresholdIndex], utils.getDirectionOfCandle(aData[cTrend.iTrendThresholdIndex]))
                                    }
                                    cTrend.increaseTrendLengthCounter()
                                    cTrend.bTrendRangeMoved = false
                                    // let cOrder = createOrderOfLiquidation(oCandle, aData[i-1], iCandleDirection)
                                    // console.log(`liquidationBox created ${oCandle.timestamp}`)
                                    // console.log('')
                                }

                            } else if(oCandle.close < cPrevTrend.fTrendThreshold) {
                                //RangeLiquidation occured -> continue with prev trend
                                //ensure it is not within the crnt trend
                                if(oCandle.close < cTrend.fTrendThreshold){
                                    if(!cPrevTrend.dLiqTimestamp || (cPrevTrend.dLiqTimestamp && cPrevTrend.dLiqTimestamp == aData[i-1].timestamp)){
                                        //first liquidation or price negated the prev liquidation
                                        let tmp = handleTrendThresholdLiquidation(cTrend, cPrevTrend, oCandle, iCandleDirection, i)
                                        cTrend = tmp.cTrend
                                        cPrevTrend = tmp.cPrevTrend
                                        console.log(`macd direction ${utils.getMACDSignal(aData.slice(0,i))}`)
                                        console.log('')

                                    } else {
                                        //Threshold taken out => turnaround
                                        cPrevTrend = _.clone(cTrend)
                                        handleTrendChange(cTrend, oCandle, iCandleDirection, i)

                                    }
                                }
                            } else if(oCandle.close < cTrend.fTrendThreshold){
                                //Threshold taken out => turnaround
                                cPrevTrend = _.clone(cTrend)
                                handleTrendChange(cTrend, oCandle, iCandleDirection, i)

                            } else {
                                //candle within the Trendrange and without a liquidationBox
                                cTrend.bTrendRangeMoved = false
                            }

                        }
                    }

                }
            }
        });
        setTimeout(() => {res()}, 1000)
    })
}



const aTicker = ['BTC']
function handleTicker(sTicker, sTimeFrame){
	return new Promise((resolve, reject) => {
		bitget.getTickerData(`${sTicker}USDT`, sTimeFrame, '200')
		.then(async (aData) => {
            await analyzeTrend(aData)
                .then(() => {debugger; resolve()})
		})
		.catch(err => {
			console.log(err)
            reject(err)
		})
	})
}

//stops script from ending  -> even when not started
const runnerM15 = cron.schedule('0,15,30,45 * * * *', async () => { 
	console.log(`crone running BTC-M15 script -- ${new Date().toDateString()}:${new Date().toTimeString()}`)
	
	await utils.ntfyMe('Log', `crone running BTC-M15 script`)
	for await (const sTicker of aTicker) {
		await handleTicker(sTicker, '15m')
	}
})
runnerM15.start() 

// async function main () {
//     await handleTicker('BTC', '15m')
// }
// main()
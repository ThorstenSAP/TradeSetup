// const { convertArrayToCSV } = require('convert-array-to-csv')
const fs = require('fs')
const axios = require('axios')

const XLSX = require('xlsx')
const RSI = require('calc-rsi') 

class Utils{
    constructor(sNtfyTopic){
        this.sNtfyTopic = sNtfyTopic
        
    }
    convertMiliseconds(sMiliseconds){
        let date = new Date(parseInt(sMiliseconds))
        return date.toLocaleString('de')
    }
    getMidnightMilisecondsMinusXDays(iDay){
        let now = new Date()
        now.setHours(0, 0, 0, 0)
        // now.setDate(now - iDay)

        return now.getTime()
    }

    //aData = array with objects
    // saveArrayToCSV(aDataObjects){
    //     // const header = ['number', 'first', 'last', 'handle'];
    //     // const dataArrays = [
    //     //     [1, 'Mark', 'Otto', '@mdo'],
    //     //     [2, 'Jacob', 'Thornton', '@fat'],
    //     //     [3, 'Larry', 'the Bird', '@twitter'],
    //     // ];
    //     // const csvFromArrayOfArrays = convertArrayToCSV(dataArrays, {
    //     //     header,
    //     //     separator: ';'
    //     // });
    //     // const aDataObjects = [
    //     //     {
    //     //         number: 1,
    //     //         first: 'Mark',
    //     //         last: 'Otto',
    //     //         handle: '@mdo',
    //     //     },
    //     //     {
    //     //         number: 2,
    //     //         first: 'Jacob',
    //     //         last: 'Thornton',
    //     //         handle: '@fat',
    //     //     },
    //     //     {
    //     //         number: 3,
    //     //         first: 'Larry',
    //     //         last: 'the Bird',
    //     //         handle: '@twitter',
    //     //     },
    //     // ];
        
    //     const csvFromArrayOfObjects = convertArrayToCSV(aDataObjects)
    //     const writeStream = fs.createWriteStream('result.csv');
    //     writeStream.write(csvFromArrayOfObjects);
    //     writeStream.end()
    // }
    saveArrayToXlsx(aDataObjects){
        var ws = XLSX.utils.json_to_sheet(aDataObjects);
        /* create workbook and export */
        var wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
        XLSX.writeFile(wb, "test.xlsx");
    }

    getDirectionOfCandle(oCandle){
        if(oCandle.open < oCandle.close){
            return 0 //bullish
        } else {
            return 1 //bearish
        }
    }

    getTrendThresholds(oCandle){
        if(this.getDirectionOfCandle(oCandle) == 0){
            return {
                fAbsHigh: oCandle.high,
                fTrendThreshold: oCandle.low
            }
        } else {
            return {
                fAbsHigh: oCandle.low,
                fTrendThreshold: oCandle.high
            }
        }
    }
    //Liquidation bull case
    getUpperThreshold(value1, value2){
        if(value1 > value2){
            return value1
        } else {
            return value2
        }
    }
    getBullLiquidationBoxStop(value1, value2){
        if (value1 < value2){
            return value1
        } else {
            return value2
        }
    }

    //Liq bear case
    getLowerThreshold(value1, value2){
        if(value1 < value2){
            return value1
        } else {
            return value2
        }
    }
    getBearLiquidationBoxStop(value1, value2){
        if (value1 > value2){
            return value1
        } else {
            return value2
        }
    }

    //if the candle is an inside candle return the index of the corresponding surrounding candle
    isInsideCandle(index, aData, offSet){
        let step = 2 //do not check the engulfed candle. Check the candle prior the engulfing
        offSet = offSet + step
        while (index > 0 && index - step > 0 && step <= offSet) {
            //check prev candle if body is in range of a previous candle (with high low)
            //if so it is an inside candle
            if(aData[index-step].low < aData[index].low && aData[index-step].low > aData[index].low ){
                //&& aData[index-step].low < aData[index].close && aData[index].close < aData[index-step].high){
                //if(this.getDirectionOfCandle(aData[index]) !== this.getDirectionOfCandle(aData[index-step])){
                    //only consider inside candles when there are in opposite directions
                    return index-step
                //}
            }
            
            step += 1
        }
        return -1
    }
    isInsideOutFormation(oCandle, oPrevCandle, oPrevPrevCandle){
        if(!this.isBodyCandle(oPrevPrevCandle) || !this.isBodyCandle(oCandle)){
            return false
        } else {
            if(!this.isCandleInsidePrevCandleRange(oCandle, oPrevCandle) &&
                !this.isCandleInsidePrevCandleRange(oCandle, oPrevPrevCandle) && 
                this.isCandleInsidePrevCandleRange(oPrevCandle, oPrevPrevCandle))
            {
                return true
            } else {
                return false
            }
        }
    }
    isWyckoff(oCandle, index, aData){
        //at least 3 candles taken out
        if(!this.isBodyCandle(oCandle)){
            return false
        } else {
            let i = 1
            while (index - i >= 0 && this.isEngulfing(oCandle, aData[index - i]) ){
                i++
            }
            if(i >= 4){ //at least 3 candles engulfed
                return true
            } else {
                return false
            }
        }
    }
    //check with high grab and engulfing...
    isMCCandle(oCandle, oPrevCandle){
        
        if(this.getDirectionOfCandle(oCandle) == 0){
            if(oCandle.low < oPrevCandle.low && oCandle.close > oPrevCandle.close){
                return true
            } else {
                return false
            }
        } else {
            //bear MC
                //prev bearish candle
                if(oCandle.high > oPrevCandle.high && oCandle.close < oPrevCandle.close){
                    return true
                } else {
                    return false
                }
            // if(this.getDirectionOfCandle(oPrevCandle) == 0){
            //     //prev bullish candle
            //     if(oCandle.high > oPrevCandle.high && oCandle.close < oPrevCandle.open){
            //         return true
            //     } else {
            //         return false
            //     }

            // } else {
            //     //prev bearish candle
            //     if(oCandle.high > oPrevCandle.high && oCandle.close < oPrevCandle.close){
            //         return true
            //     } else {
            //         return false
            //     }
            // }
        }
    }
    isLiquidation(oCandle, oPrevCandle, oPrevPrevCandle){
        if(this.getDirectionOfCandle(oCandle) == 0){
            //bull candle, therfore downtrend before
            if(oCandle.close > oPrevPrevCandle.close && oPrevCandle.close < oPrevPrevCandle.low){
                return true
            } else {
                return false
            }
        } else {
            if(oCandle.close < oPrevPrevCandle.close && oPrevCandle.close > oPrevPrevCandle.high){
                return true
            } else {
                return false
            }

        }
    }
    isUFormation(oCandle, index, aData){
        //strong push
        //a few dojis / weak candles
        //strong push
        
        if(this.isStrongPush(oCandle)){

        }
    }
    isCandleInsidePrevCandleRange(oCandle, oPrevCandle){
        //returns true for yes (isInside), false for no (isOutside)
        //close outside
        if(this.getDirectionOfCandle(oCandle) == 0){
            //bullish candle
            if(oCandle.close > oPrevCandle.high || oCandle.high > oPrevCandle.high || oCandle.low < oPrevCandle.low){
                return false //range expanded 
            } else {
                return true //did close within the higgh of the prev candle
            }
        } else {
            //bearish candle
            if(oCandle.close < oPrevCandle.low || oCandle.low < oPrevCandle.low || oCandle.high > oPrevCandle.high){
                return false //range expanded
            } else {
                return true //did close within the low of the prev candle
            }

        }
    }
    isEveMorningStar(oCandle, oPrevCandle, oPrevPrevCandle){
        if(!this.isBodyCandle(oCandle) || !this.isBodyCandle(oPrevPrevCandle)){
            return false
        } else {
            if(this.getDirectionOfCandle(oCandle) === 0){
                //bullish candle
                //when the candles is not a body candle (body >= 0.5% of range) it is ok for EveMorningStar
                if(!this.isBodyCandle(oPrevCandle) && (this.isBodyCandle(oPrevPrevCandle) && this.getDirectionOfCandle(oPrevPrevCandle) === 1)){
                    return true
                } else {
                    return false
                }
            } else {
                //bearish case
                //when the candles is not a body candle (body >= 0.5% of range) it is ok for EveMorningStar
                if(!this.isBodyCandle(oPrevCandle) && (this.isBodyCandle(oPrevPrevCandle) && this.getDirectionOfCandle(oPrevPrevCandle) === 0)){
                    return true
                } else {
                    return false
                }
            }
        }
    }
    isStrongPush(oCandle){
        let fBody, fCandle
        if(this.getDirectionOfCandle(oCandle) === 0){
            fBody = oCandle.close - oCandle.open
            fCandle = oCandle.high - oCandle.low
            
        } else {
            fBody = oCandle.open - oCandle.close
            fCandle = oCandle.low - oCandle.high

        }
        
        if(fBody/fCandle <= -0.75 || fBody/fCandle >= 0.75){
            return true
        } else {
            return false
        }

    }

    isBodyCandle(oCandle){
        let fBody, fCandle
        if(this.getDirectionOfCandle(oCandle) === 0){
            fBody = oCandle.close - oCandle.open
            fCandle = oCandle.high - oCandle.low
            
        } else {
            fBody = oCandle.open - oCandle.close
            fCandle = oCandle.low - oCandle.high

        }
        
        if(fBody/fCandle <= -0.5 || fBody/fCandle >= 0.5){
            return true
        } else {
            return false
        }
    }

    isCandleDoji(oCandle){
        let fBody, fCandle
        if(this.getDirectionOfCandle(oCandle) === 0){
            fBody = oCandle.close - oCandle.open
            fCandle = oCandle.high - oCandle.low
            
        } else {
            fBody = oCandle.open - oCandle.close
            fCandle = oCandle.low - oCandle.high

        }
        
        if(-0.37 <= fBody/fCandle && fBody/fCandle <= 0.37){
            return true
        } else {
            return false
        }
    }


    isEngulfing(oCandle, oPrevCandle){
            if(!this.isBodyCandle(oCandle)){
                return false
            } else {
                if(this.getDirectionOfCandle(oPrevCandle) === 0 && this.getDirectionOfCandle(oCandle) === 0){
                    //prev candle was bullish. Hence, look for bearish engulfing
                    if(oCandle.open <= oPrevCandle.open && oCandle.close >= oPrevCandle.close){
                        return true //bearish engulfing
                    }
                } else if(this.getDirectionOfCandle(oPrevCandle) == 1 && this.getDirectionOfCandle(oCandle) == 1){
                    if(oCandle.open >= oPrevCandle.open && oCandle.close <= oPrevCandle.close){
                        return true //bullish engulfing
                    }
                } else if(this.getDirectionOfCandle(oPrevCandle) == 1 && this.getDirectionOfCandle(oCandle) == 0){
                    //bull engulfing of bear candle
                    if(oCandle.close >= oPrevCandle.open && oCandle.open <= oPrevCandle.open){
                        return true //bullish engulfing
                    }
                } else if(this.getDirectionOfCandle(oPrevCandle) == 0 && this.getDirectionOfCandle(oCandle) == 1){
                    //bear engulfing of bull candle
                    if(oCandle.open >= oPrevCandle.close && oCandle.close <= oPrevCandle.open){
                        return true //bullish engulfing
                    }
                }
            }
            return false

    }
    // isEngulfing(aCandles){
    //     const oLastCandle = aCandles[aCandles.length - 2] //prev candel
    //     const oPrevCandle = aCandles[aCandles.length - 3] //two candle back
    //     if(!this.isBodyCandle(oLastCandle)){
    //         return false
    //     } else {
    //         if(this.getDirectionOfCandle(oPrevCandle) === 0){
    //             //prev candle was bullish. Hence, look for bearish engulfing
    //             if(oLastCandle.open >= oPrevCandle.close && oLastCandle.close < oPrevCandle.open){
    //                 return true //bearish engulfing
    //             }
    //         } else {
    //             if(oLastCandle.open <= oPrevCandle.close && oLastCandle.close > oPrevCandle.open){
    //                 return true //bullish engulfing
    //             }
    //         }
    //     }
    // }

    isCloudCover(aCandles){
        const oLastCandle = aCandles[aCandles.length - 2] //prev candel
        const oPrevCandle = aCandles[aCandles.length - 3] //two candle back
        if(!this.isBodyCandle(oLastCandle)){
            return false
        } else {
            if(this.getDirectionOfCandle(oLastCandle) === 0){
                //bull case
                if (oLastCandle.open > oPrevCandle.close && oLastCandle.close > oPrevCandle.open){ //red candle followed by green
                    return true
                } else  if (oLastCandle.open > oPrevCandle.open && oLastCandle.close > oPrevCandle.close){ //green on green 
                    return true
                }
            } else {
                //bear case
                if (oLastCandle.open <= oPrevCandle.close && oLastCandle.close < oPrevCandle.open){ //green candle followed by red candle
                    return true
                } else  if (oLastCandle.open < oPrevCandle.open && oLastCandle.close < oPrevCandle.close){ //red on red
                    return true
                }
            }
        }
        
    }
    hasCandlegrabbedHighs(oCandle, oPrevCandle){
        if(oCandle.high >= oPrevCandle.high && oCandle.close < oPrevCandle.high){
            return true
        } else {
            return false
        }
    }
    hasCandlegrabbedLows(oCandle, oPrevCandle){
        if(oCandle.low <= oPrevCandle.low && oCandle.close > oPrevCandle.low){
            return true
        } else {
            return false
        }
    }



    didCandleTouchFVG(oFVG, oCandle){
        if(oFVG.iDirection == 0){
            if(oCandle.close > oFVG.fRangeLow && 
                (oCandle.close < oFVG.fRangeHigh || oCandle.open < oFVG.fRangeHigh || oCandle.high < oFVG.fRangeHigh))                   
            { 
                return true
            }
        } else {
            //bearish candle
            
            if(oCandle.close < oFVG.fRangeHigh && 
                (oCandle.close > oFVG.fRangeLow || oCandle.open > oFVG.fRangeLow || oCandle.high > oFVG.fRangeLow))                   
            { 
                return true
            }
        }
        //if code comes here return false
        console.log('candle did not touch FVG')
        return false


    }

    convertApiResponseForRsiCalc(aData){
        const aPrevClose = []
        for (let i = aData.length -1; i >= 0; i--) {
            aPrevClose.push(aData[i].close)
            // for (let j = i-1; j >= 0; j--) {
            // } 
        }
        return aPrevClose
    }
    setRsi(aData){
        const rsi = new RSI(this.convertApiResponseForRsiCalc(aData), 14)
        rsi.calculate((err, data) => {
            if (err) {
                done(err);
            } else if(data.length > 0) {
                for (let i = aData.length -1; i >= 0; i--) {
                    const oLastElement = data.pop()
                    if(oLastElement.rsi){
                        aData[i].rsi = oLastElement.rsi
                    } else {
                        aData[i].rsi = null
                    }
                }
                
            }
        })
    }
    getDelta(int1, int2){
        if(int1 > int2){
            return int1 - int2
        } else {
            return int2 - int1
        }
    }

    isOneOfLatestCandles(sTimestring){
        const date = new Date()
        const iCrntDay = new Date().getDate()
        const iCrntHour = date.getHours() //+2 //server time are in utc
        const iCandleDay = parseInt(sTimestring.slice(0,2))
        const iCandleHour = parseInt(sTimestring.split(', ')[1].slice(0,2))

        if(iCrntDay == iCandleDay && this.getDelta(iCrntHour, iCandleHour) == 0){
            //same day and it happend in the last two hours
            return true
        } 
        // else if(iCrntHour <= 8){
        //     if((iCandleDay == iCrntDay - 1 && iCandleHour >= 20) || (iCandleDay == iCrntDay && iCandleHour <= 8)){
        //         //the engulfing occured between yesterday 20.00pm and today 08.00 am
        //         return true
        //     }
        // } 
        else {
            return false
        }

    }

    setSma(aData, iSma){
        let iSum = 0
        for (let index = 0; index <= iSma; index++) {
            let iIndex = (aData.length -1) - index //latest element minus the last index

            iSum = iSum + aData[iIndex].close
        }
        aData[aData.length-1][`sma${iSma}`] = iSum/iSma
    }

    getMACDSignal(closingPrices){
        if(closingPrices.length <= 30){
            return undefined
        } else {
            //is signalLine above or below MACD Line
            let macd = this.calculateMACD(closingPrices)
            let signal = this.calculateEMA(macd, 9)

            return macd < signal ? 1 : 0 //macd below signal == bearish else bullish
        }
    }
    calculateMACD(closingPrices) {
        const ema12 = this.calculateEMA(closingPrices, 12);
        const ema26 = this.calculateEMA(closingPrices, 26);
        const macd = ema12 - ema26;
        
        return macd;
    }
      
    calculateEMA(closingPrices, period) {
        const k = 2 / (period + 1);
        let ema = closingPrices[0];
        for (let i = 1; i < closingPrices.length; i++) {
          ema = (closingPrices[i] * k) + (ema * (1 - k));
        }
      
        return ema;
    }
    

    ntfyMe(topic, msg){
        return new Promise((res,rej) => {
            if(typeof msg === 'object'){
                axios.post(`http://87.106.59.125/${topic}`, {
                    message: msg
                })
                .then((response) => {
                    setTimeout(() => {res()}, 1000)
                }, (error) => {
                    console.log(error.response.data)
                    rej(error.response.data);
                });
            } else {
                // msg is probably a string
                axios.post(`http://87.106.59.125/${topic}`, msg)
                .then((response) => {
                    setTimeout(() => {res()}, 1000)
                }, (error) => {
                    console.log(error.response.data)
                    rej(error.response.data);
                });
            }

        })
        
    }
      

}
exports.Utils = Utils;
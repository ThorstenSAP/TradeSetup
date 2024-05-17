class Utils{
    convertMiliseconds(sMiliseconds){
        let date = new Date(parseInt(sMiliseconds))
        return date.toLocaleString('de')
    }

    getDirectionOfCandle(oCandle){
        if(oCandle.open < oCandle.close){
            return 0 //bullish
        } else {
            return 1 //bearish
        }
    }

    isInsideCandle(index, aData, offSet){
        let step = 2 //do not check the engulfed candle. Check the candle prior the engulfing
        offSet = offSet + step
        while (index > 0 && index - step > 0 && step <= offSet) {
            //check prev candle if body is in range of a previous candle (with high low)
            //if so it is an inside candle
            if(aData[index-step].low < aData[index].open && aData[index].open < aData[index-step].high && 
               aData[index-step].low < aData[index].close && aData[index].close < aData[index-step].high){
                if(this.getDirectionOfCandle(aData[index]) !== this.getDirectionOfCandle(aData[index-step])){
                    //only consider inside candles when there are in opposite directions
                    return true
                }
            }
            
            step += 1
        }
        return false
    }


    // isCandleInRange(aData, index, offSet){
    //     let step = 1
    //     let bInsideCandle = false
    //     while (index > 0 && index - step > 0 && step <= offSet) {
    //         const oCrntCandle = aData[index]
    //         const oCandleToCheck = aData[index-step]

    //         if(this.getDirectionOfCandle(oCrntCandle) === 0){
    //             //bull case
    //             if (oCrntCandle.open > oCandleToCheck.close){
    //                 return false
    //             }
    //         } else {
    //             if (oCandleToCheck.open < oCrntCandle.close){
    //                 return false
    //             }
    //         }
    //     }
    //     return true
    // }


    isEngulfing(oPrevCandle, oCrntCandle){
        if(this.getDirectionOfCandle(oPrevCandle) === 0){
            //prev candle was bullish. Hence, look for bearish engulfing
            if(oCrntCandle.open >= oPrevCandle.close && oCrntCandle.close < oPrevCandle.open){
                return true //bearish engulfing
            }
        } else {
            if(oCrntCandle.open <= oPrevCandle.close && oCrntCandle.close > oPrevCandle.open){
                return true //bullish engulfing
            }
        }
        return false
    }

    isCloudCover(oCrntCandle, oPrevCandle){
        if(this.getDirectionOfCandle(oCrntCandle) === 0){
            //bull case
            if (oCrntCandle.open > oPrevCandle.close && oCrntCandle.close > oPrevCandle.open){ //red candle followed by green
                return true
            } else  if (oCrntCandle.open > oPrevCandle.open && oCrntCandle.close > oPrevCandle.close){ //green on green 
                return true
            }
        } else {
            //bear case
            if (oCrntCandle.open <= oPrevCandle.close && oCrntCandle.close < oPrevCandle.open){ //green candle followed by red candle
                return true
            } else  if (oCrntCandle.open < oPrevCandle.open && oCrntCandle.close < oPrevCandle.close){ //red on red
                return true
            }
        }
        return false
    }
      

}
exports.Utils = Utils;
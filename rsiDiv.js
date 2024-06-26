const { Utils } = require('./utils.js')

class rsiDiv {
    //find rsi high and low points above or below the 70 and 30 level
    //compare those high and lows against the course highs or the course lows
    
    //mark corresponding candle in data array
    constructor(aData, sTicker, sTimeFrame){
        this.utils = new Utils(sTimeFrame)
        this.sTicker = sTicker
        this.ntfyTopic = 'RsiDiv'
        this.iUpperLvl = 60
        this.iLowerLvl = 40
        this.aData = aData
        this.aRsiHigh = []
        this.aRsiLow = []
    }

    setRsiHighLows(){
        //index 0 = last candle
        for(let i = this.aData.length -1; i > 0 ; i--){
            if(this.aData[i].rsi >= this.iUpperLvl){
                this.getRSIHigh(i)
            } else if(this.aData[i].rsi <= this.iLowerLvl){
                this.getRSILow(i)
            }
            
        }
        //this.logRSIHighsLows()

    }
    getRSIHigh(i){
        //i has to be at least 1
        if(i === this.aData.length -1){
            //latest candle only check against previous candle and set level
            if(this.aData[i-2].rsi < this.aData[i].rsi && this.aData[i-1].rsi < this.aData[i].rsi && this.aData[i].rsi >= this.iUpperLvl){
                this.aData[i].rsiHigh = true
                this.aRsiHigh.push(this.aData[i])
            } else {
                this.aData[i].rsiHigh = false
            }
        } else if(i == this.aData.length -2){
            //if the rsi of the next two days and the rsi of the previous two candles is lower than it is an rsi high
            if(this.aData[i-2].rsi < this.aData[i].rsi && this.aData[i-1].rsi < this.aData[i].rsi && this.aData[i+1].rsi < this.aData[i].rsi){
                this.aData[i].rsiHigh = true
                this.aRsiHigh.push(this.aData[i])
            } else {
                    this.aData[i].rsiLow = false
                }
        } else if(i < this.aData.length -2){
            //can look  back than two candles
            if((this.aData[i-1].rsi < this.aData[i].rsi && this.aData[i+1].rsi < this.aData[i].rsi) && 
                (this.aData[i-2].rsi < this.aData[i].rsi && this.aData[i+2].rsi < this.aData[i].rsi)){
                this.aData[i].rsiHigh = true
                this.aRsiHigh.push(this.aData[i])
            } else {
                this.aData[i].rsiHigh = false
            }
        }
    }
    getRSILow(i){
        //i has to be at least 1
        if(i === this.aData.length -1){
            //latest candle only check against previous candle and set level
            if(this.aData[i-2].rsi > this.aData[i].rsi && this.aData[i-1].rsi > this.aData[i].rsi && this.aData[i].rsi <= this.iUpperLvl){
                this.aData[i].rsiLow = true
                this.aRsiLow.push(this.aData[i])
            } else {
                this.aData[i].rsiLow = false
            }
        } else if(i == this.aData.length -2){
            //if the rsi of the next day and the rsi of the previous day is lower than it is an rsi high
            if(this.aData[i-2].rsi > this.aData[i].rsi && this.aData[i-1].rsi > this.aData[i].rsi && this.aData[i+1].rsi > this.aData[i].rsi){
                this.aData[i].rsiLow = true
                this.aRsiLow.push(this.aData[i])
            } else {
                this.aData[i].rsiLow = false
            }
        } else if(i < this.aData.length -2){
            //can look  back than two candles
            if((this.aData[i-1].rsi > this.aData[i].rsi && this.aData[i+1].rsi > this.aData[i].rsi) && 
                (this.aData[i-2].rsi > this.aData[i].rsi && this.aData[i+2].rsi > this.aData[i].rsi)){
                this.aData[i].rsiLow = true
                this.aRsiLow.push(this.aData[i])
            } else {
                this.aData[i].rsiLow = false
            }
        
        }

    }

    logRSIHighsLows(){
        console.log('highs')
        for (const oCandle of this.aData) {
            if(oCandle.rsiHigh){
                console.log(`${oCandle.timestamp}  -  RSI: ${oCandle.rsi}`)
            }
        }
        console.log('lows')
        for (const oCandle of this.aData) {
            if(oCandle.rsiLow){
                console.log(`${oCandle.timestamp}  -  RSI: ${oCandle.rsi}`)
            }
        }
    }

    async findRsiDiv(){
        let bMsgSend = false
        for(let i = 0; i < this.aRsiHigh.length -1 ; i++){
            //i = the latest high low point in the rsi
            if(!this.utils.isOneOfLatestCandles(this.aRsiHigh[i].timestamp)){
                break
            } else {
                for(let j = i+1; j < this.aRsiHigh.length -1 ; j++){
                    const rsiDiff = this.aRsiHigh[i].rsi / this.aRsiHigh[j].rsi
                    const courseDiff = this.aRsiHigh[i].high / this.aRsiHigh[j].high
                    if(this.isDivergence(rsiDiff, courseDiff) && !this.areCandleNeighbor(this.aRsiHigh[i], this.aRsiHigh[j])){
                        if(bMsgSend){
                            bMsgSend = true
                        } else{
                            await this.utils.ntfyMe(this.ntfyTopic, {
                                pair: this.sTicker,
                                timestamp1: this.aRsiHigh[i].timestamp,
                                timestamp2: this.aRsiHigh[j].timestamp
                            })
                            .then(() => {
                                console.log(`RSI Div: ${this.aRsiHigh[j].timestamp}  -  ${this.aRsiHigh[i].timestamp}`)
                                j = this.aRsiHigh.length //only send msg once
                            })
                            .catch((oErr) => {
                                console.log(oErr)
                                j = this.aRsiHigh.length //only send msg once
                            })
                        }
                    }
                }
            }
        }

        for(let i = 0; i < this.aRsiLow.length -1 ; i++){
            //i = the latest high low point in the rsi
            if(!this.utils.isOneOfLatestCandles(this.aRsiLow[i].timestamp)){
                break
            } else {
                for(let j = i+1; j < this.aRsiLow.length -1 ; j++){
                    const rsiDiff = this.aRsiLow[i].rsi / this.aRsiLow[j].rsi
                    const courseDiff = this.aRsiLow[i].low / this.aRsiLow[j].low
                    if(this.isDivergence(rsiDiff, courseDiff) && !this.areCandleNeighbor(this.aRsiLow[i], this.aRsiLow[j])){
                        if(bMsgSend){
                            bMsgSend = true
                        } else{
                            await this.utils.ntfyMe(this.ntfyTopic, {
                                pair: this.sTicker,
                                timestamp1: this.aRsiLow[i].timestamp,
                                timestamp2: this.aRsiLow[j].timestamp
                            })
                            .then(() => {
                                console.log(`RSI Div: ${this.aRsiLow[j].timestamp}  -  ${this.aRsiLow[i].timestamp}`)
                                j = this.aRsiLow.length //only send msg once
                            })
                            .catch((oErr) => {
                                console.log(oErr)
                                j = this.aRsiLow.length //only send msg once
                            })
                        }
                    }
                }
            }
        }
    }
    isDivergence(rsiDiff, courseDiff){
        if((rsiDiff < 1 && courseDiff > 1) || (rsiDiff > 1 && courseDiff < 1)){
            //one is falling the other one is rising
            return true
        } 
            // else if((rsiDiff < 1 && courseDiff < 1) || (rsiDiff > 1 && courseDiff > 1)){
            // //both are falling or rising -> check for percentage difference
            // if (courseDiff * 1.25 < rsiDiff || courseDiff / 1.25 < rsiDiff){
            //     //rsi move more than 25% more than the course
            //     return true
            // }
            // if ((0.99 <= courseDiff && courseDiff <= 1.01) && (rsiDiff <= 0.95 && rsiDiff >= 1.05) ||
            //     (0.99 <= rsiDiff && rsiDiff <= 1.01) && ( courseDiff <= 0.95 && courseDiff >= 1.05)){
            //     //one is moving more than 5% - the other one is moving 1%
            //     return true
            // } else if (courseDiff * 1.25 < rsiDiff || courseDiff / 1.25 < rsiDiff){
            //     //rsi move more than 25% more than the course
            //     return true
            // }
         else {
            return false
        }

    }
    areCandleNeighbor(oCandle1, oCandle2){
        //check delta of timestamps if the candles are neighbor of each other
        return this.utils.getDelta(parseInt(oCandle1.timestamp.split(', ')[1].slice(0,2)), parseInt(oCandle2.timestamp.split(', ')[1].slice(0,2))) <= 1 ? true : false
    }



}
exports.RsiDiv = rsiDiv

const { Utils } = require('./utils.js')

class rsiDiv {
    //find rsi high and low points above or below the 70 and 30 level
    //compare those high and lows against the course highs or the course lows
    
    //mark corresponding candle in data array
    constructor(aData, sTicker){
        this.utils = new Utils()
        this.sTicker = sTicker
        this.ntfyTopic = 'RsiDiv'
        this.iUpperLvl = 65
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
        // this.logRSIHighsLows()

    }
    getRSIHigh(i){
        //i has to be at least 1
        if(i === this.aData.length -1){
            //latest candle always accept as high or low point.
            //check against level was already made
            this.aData[i].rsiHigh = true
        } else if(i <= this.aData.length -2){
            //if the rsi of the next day and the rsi of the previous day is lower than it is an rsi high
            if(this.aData[i-1].rsi < this.aData[i].rsi && this.aData[i+1].rsi < this.aData[i].rsi){
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
            //latest candle always accept as high or low point.
            //check against level was already made
            this.aData[i].rsiLow = true
        } else if(i <= this.aData.length -2){
            //if the rsi of the next day and the rsi of the previous day is lower than it is an rsi high
            if(this.aData[i-1].rsi > this.aData[i].rsi && this.aData[i+1].rsi > this.aData[i].rsi){
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

    findRsiDivHigh(){
        for(let i = this.aRsiHigh.length -1; i > 0 ; i--){
            //i = the latest high low point in the rsi
            for(let j = i-1; j > 0 ; j--){
                const rsiDiff = this.aRsiHigh[j].rsi / this.aRsiHigh[i].rsi
                const courseDiff = this.aRsiHigh[j].high / this.aRsiHigh[i].high
                if(this.isDivergence(rsiDiff, courseDiff)){
                    this.utils.ntfyMe(this.ntfyTopic, {
                        pair: this.sTicker,
                        timestamp1: this.aRsiHigh[i].timestamp,
                        timestamp2: this.aRsiHigh[j].timestamp
                    })
                    console.log(`RSI Div: ${this.aRsiHigh[i].timestamp}  -  ${this.aRsiHigh[j].timestamp}`)
                }
            }

        }
    }
    isDivergence(rsiDiff, courseDiff){
        if((rsiDiff < 1 && courseDiff > 1) || (rsiDiff > 1 && courseDiff < 1)){
            //one is falling the other one is rising
            return true
        } else if((rsiDiff < 1 && courseDiff < 1) || (rsiDiff > 1 && courseDiff > 1)){
            //both are falling or rising -> check for percentage difference
            if ((0.99 <= courseDiff && courseDiff <= 1.01) && (rsiDiff <= 0.95 && rsiDiff >= 1.05) ||
                (0.99 <= rsiDiff && rsiDiff <= 1.01) && ( courseDiff <= 0.95 && courseDiff >= 1.05)){
                //one is moving more than 5% - the other one is moving 1%
                return true
            } else if (courseDiff * 1.25 < rsiDiff || courseDiff / 1.25 < rsiDiff){
                //rsi move more than 25% more than the course
                return true
            }
        } else {
            return false
        }

    }



}
exports.RsiDiv = rsiDiv
const { Utils } = require('./utils.js')
const { EngulfingTrade } = require('./trade.js')

class Engulfing {
    constructor(){
        this.utils = new Utils()
        this.engulfingTrade = new EngulfingTrade()
        this.iInsideCandleThreshold = 5
    }
    checkHistory(aData){
        for (let i = 1;  i< aData.length; i++) {
            //aData[0] ist letztes element
            if(this.utils.isEngulfing(aData[i-1], aData[i])){
                if(!this.utils.isInsideCandle(i, aData, this.iInsideCandleThreshold)){
                    console.log(`engulfing: ${aData[i].timestamp}`)

                }
            }
            
        }

        //bei der letzten kerze anfangen

            //ist ein eingulfing gegeben initialisiere eine Position in Richtung des Engulfings
            //Kommt ein Engulfing in die entgegengesetzte Richtung schließe die Position + öffne erneut eine Position
    }
    checkEngulfingTrade(aData){
        for (let i = 1;  i< aData.length; i++) {
            //aData[0] ist letztes element
            //if(!this.engulfingTrade.bIsInTrade && !this.engulfingTrade.iTriggerUpside && !this.engulfingTrade.iTriggerDownside){
                //init case. Start with Engulfing
                if(this.utils.isEngulfing(aData[i-1], aData[i])){
                    const iIndexTriggerCandle = this.utils.isInsideCandle(i, aData, this.iInsideCandleThreshold)
                    if(iIndexTriggerCandle === -1){
                        this.engulfingTrade.handleEngulfing(aData[i])

                    } else {
                        //set high and low of the crnt candle as entryTriggers
                        this.engulfingTrade.handleSurroundingCandle(aData[i], aData[iIndexTriggerCandle])
                    }
                } else {
                    //it is in a trade or one of the triggers is set
                    this.engulfingTrade.handleCandle(aData[i])
                }
            //}  
        }
        this.utils.saveArrayToXlsx(this.engulfingTrade.getTradeLog())

    }
      

}
exports.Engulfing = Engulfing;
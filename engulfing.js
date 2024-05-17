const { Utils } = require('./utils.js')

class Engulfing {
    constructor(){
        this.utils = new Utils()
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
      

}
exports.Engulfing = Engulfing;
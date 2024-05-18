const { Utils } = require('./utils.js')

class EngulfingTrade {
    constructor(){
        this.utils = new Utils()
        this.bIsInTrade = false
        this.iTradeDirection = null //0 is bullish - 1 is bearish
        this.iStopLoss = null
        this.iTriggerUpside = null
        this.iTriggerDownside = null
        this.iEntry = null
        this.aTrade = []

    }


    handleEngulfing(oCandle){
        if(this.bIsInTrade){
            // in trade
            if(this.utils.getDirectionOfCandle(oCandle) === this.iTradeDirection){
                //Engulfing in same direction. Thus, adjust SL
                this.setStopLoss(oCandle)
            } else {
                //Engulfing in opposite direction. Cancel Trade
                // close Trade and set new Trigger level
                this.exitTrade(oCandle, false)
                this.setEntryTrigger(oCandle)
            }
        } else {
            // not in trade -> set triggers
            this.setEntryTrigger(oCandle)
        }
    }
    handleCandle(oCandle){
        if(this.bIsInTrade){
            if(this.utils.getDirectionOfCandle(oCandle) !== this.iTradeDirection){
                //Candle in opposite direction of trade
                if(this.isStopLossHit(oCandle)){
                    this.exitTrade(oCandle, true)
                }
            }
        } else {
            //not in trade. Hence, check if entry is triggered
            this.checkCandleForEntry(oCandle)
        }
    }
    handleSurroundingCandle(oCandle, oSurroundingCandle){
        //an engulfing occured but it is part of a consolidation of a previous candle
        if(this.bIsInTrade){
            if(this.utils.getDirectionOfCandle(oCandle) === this.iTradeDirection){
                //adjust SL to surrounding candle
            } else {
                //surrounding canlde of opposite direction
                this.exitTrade(oCandle)
            }
        } else {
            //not in trade. Hence, adjust entry trigger
            if(this.utils.getDirectionOfCandle(oCandle) === 0){
                this.iTriggerUpside = oSurroundingCandle.close
                this.iTriggerDownside = oSurroundingCandle.low
            } else {
                this.iTriggerUpside = oSurroundingCandle.high
                this.iTriggerDownside = oSurroundingCandle.close
            }
        }

    }

    checkCandleForEntry(oCandle){
        if(this.utils.getDirectionOfCandle(oCandle) === 0){
            if(this.iTriggerUpside && oCandle.high > this.iTriggerUpside){
                this.entryTriggered(oCandle)
            }
        } else {
            if(this.iTriggerDownside && oCandle.low < this.iTriggerDownside){
                this.entryTriggered(oCandle)
            }
        }
    }
    isStopLossHit(oCandle){
        if(this.iTradeDirection === 0){
            return oCandle.low < this.iStopLoss
        } else {
            return oCandle.high > this.iStopLoss
        }
    }


    entryTriggered(oCandle){
        this.enterTrade(oCandle)
        this.setStopLoss(oCandle, true)
    }

    setStopLoss(oCandle, bEntryTriggered){
        if(this.utils.getDirectionOfCandle(oCandle) === 0){
            this.iStopLoss = oCandle.low
        } else {
            this.iStopLoss = oCandle.high
        }
        if(!bEntryTriggered)
            console.log(`SL moved: ${this.iStopLoss}  -  timestamp: ${oCandle.timestamp}`)
    }
    setEntryTrigger(oCandle){
        if(this.utils.getDirectionOfCandle(oCandle) === 0){
            this.iTriggerUpside = oCandle.high
            //TODO überwachung ob die Kerze getriggert wird in kleiner Zeiteinheit
        } else {
            this.iTriggerDownside = oCandle.low
            //TODO überwachung ob die Kerze getriggert wird in kleiner Zeiteinheit
        }
    }
    enterTrade(oCandle){
        this.bIsInTrade = true
        if(this.utils.getDirectionOfCandle(oCandle) === 0){
            //bullish trade
            this.iTradeDirection = 0
            this.iStopLoss = oCandle.low
            this.iEntry = this.iTriggerUpside
            this.iTriggerUpside = null
        } else {
            //bearish trade
            this.iTradeDirection = 1
            this.iStopLoss = oCandle.high
            this.iEntry = this.iTriggerDownside
            this.iTriggerDownside = null
        }
        this.aTrade.push({
            entryTime: oCandle.timestamp,
            exitTime: null,
            direction: this.iTradeDirection === 0 ? 'Long' : 'Short',
            entry: this.iEntry,
            SL: this.iStopLoss,
            exit: null
        })
        console.log(`enter trade: ${oCandle.timestamp}  -  direction: ${this.iTradeDirection}  -  entryLevel: ${this.iEntry}  -  SL: ${this.iStopLoss}`)
    }
    exitTrade(oCandle,bSLHit){
        const oTradeLog = this.aTrade.pop()
        oTradeLog.exitTime = oCandle.timestamp
        oTradeLog.exit = this.iStopLoss
        this.aTrade.push(oTradeLog)
        console.log(`exit trade: ${oCandle.timestamp}  -  direction: ${this.iTradeDirection}  -  exitLevel: ${this.iStopLoss} - ${oCandle.close}`)
        if(bSLHit){
            console.log(`reason: SL Hit  -  result: ${this.iEntry - this.iStopLoss}`)
            console.log()
        } else {
            console.log(`reason: Opposite Engulfing  -  result: ${this.iEntry - oCandle.close}`)
            console.log()
        }
        this.bIsInTrade = false
        this.iTradeDirection = null
        this.iStopLoss = null

    }

    getTradeLog(){
        return this.aTrade
    }




}
exports.EngulfingTrade = EngulfingTrade;
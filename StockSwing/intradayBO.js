import { getBars } from "./polygon.mjs";
import { Utils } from '../utils.js';
import cron from "node-cron"
const utils = new Utils()


const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

export async function checkBO(sMinute) {
    const aTickers = await utils.readTickersFromCSV('./Momentum.csv')
    // const aTickers = await utils.readTickersFromCSV('./general/TickersNasdaq100.csv')
    for (const sTicker of aTickers) {
        const aData = await getBars(
            sTicker,
            "minute",
            sMinute,
            new Date(Date.now()).toISOString().slice(0, 10), //1768573800000,
            new Date(Date.now() + 86400000).toISOString().slice(0, 10)
        )
        let aCandles = utils.calculateRVOL(aData, 10)
        const oCandle = aCandles[aCandles.length - 1]
        const oPrevCandle = aCandles[aCandles.length - 2]
        const oPrevPrevCandle = aCandles[aCandles.length - 3]
        
        //possibilities
        if(oCandle.open > oPrevCandle.close && utils.isStrongPush(oCandle)){
            //gap and go with demand candle
            utils.ntfyMe(`intradayBOMomentum`, sTicker)
        } else if(utils.isEngulfing(oCandle, oPrevCandle)){
            utils.ntfyMe(`intradayBOMomentum`, sTicker)
        } else if(utils.hasCandlegrabbedLows(oCandle, oPrevCandle)){
            utils.ntfyMe(`intradayBOMomentum`, sTicker)
        } else if(utils.isLiquidation(oCandle, oPrevCandle, oPrevPrevCandle)){
            utils.ntfyMe(`intradayBOMomentum`, sTicker)
        } else if(utils.isEveMorningStar(oCandle, oPrevCandle, oPrevPrevCandle)){
            utils.ntfyMe(`intradayBOMomentum`, sTicker)
        }
        
    }
}
export async function main() {
    //M2 BO CHECK
    cron.schedule("32 15 * * *", () => {
        checkBO("2")
        console.log("Job A running at 15:32");
    })

    cron.schedule("30-59/5 15 * * *", () => {
        checkBO("5")
        console.log("Job B running (15:30–15:59)");
    });

    // 16:00–20:59
    cron.schedule("*/5 16-20 * * *", () => {
        checkBO("5")
        console.log("Job B running (16:00–20:59)");
    })
}
// checkBO("2")
main()

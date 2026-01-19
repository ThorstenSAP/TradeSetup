import { getBars, getTicker } from "./polygon.mjs";
import { Utils } from '../utils.js';
const utils = new Utils()
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))


export async function main() {
    let aRes = []
    const date = new Date();
    date.setUTCFullYear(date.getUTCFullYear() - 1)
    // const ONE_DAY_MS = 24 * 60 * 60 * 1000
    // new Date(Date.now() - ONE_DAY_MS * 10).toISOString().slice(0, 10), //10 days back
    const aTickersQQQ = await utils.readTickersFromCSV('./general/TickersNasdaq100.csv')
    const aTickersIWM = await utils.readTickersFromCSV('./general/TickersIWM.csv')
    const aTickers = [...aTickersQQQ, ...aTickersIWM]

    for (const sTicker of aTickers) {
        sleep(3000)
        console.log(`get ${sTicker}`)
        const aData = await getBars(
            sTicker,
            "day",
            "1",
            date.toISOString().slice(0, 10),
            new Date().toISOString().slice(0, 10) //today
        )
        const oCompany = await getTicker(sTicker)
        if (aData && oCompany) {
            //check for market_cap && weighted_shares_outstanding
            if (utils.getMarketCap(oCompany.results.market_cap) == 'micro') {
                continue; // skip this ticker, keep looping
            }
            let aCandles = utils.calculateDailyRVOL(aData, 10)
            const oCandle = aCandles.pop() //removes the last element
            const oPrevCandle = aCandles.pop()
            if (utils.isInsideBar(oCandle, oPrevCandle) && utils.isStrongPush(oCandle)) {
                //TODO filter for min RVol
                aRes.push(sTicker)
                // if (oCandle.volume <= oPrevCandle.volume) {
                //     aRes.push(sTicker)
                // }
            }

        }
    }

    utils.saveArrayToCSV(aRes, 'BOInsideBar')

    utils.ntfyMeCSVList('InsideBarAfterPush', "symbol", aRes)

}
main()
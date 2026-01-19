import { getBars, getTicker } from "./polygon.mjs";
import { Utils } from '../utils.js';
const utils = new Utils()


const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
/**
 * Fetch OHLCV bars from Polygon
 * @param {string} symbol - e.g. "AAPL"
 * @param {"minute"|"hour"|"day"|"week"} timespan
 * @param {number} multiplier - e.g. 5 for 5-minute
 * @param {string} from - YYYY-MM-DD
 * @param {string} to - YYYY-MM-DD
 */
export async function getBars(
    symbol,
    timespan,
    multiplier,
    from,
    to
) {
    const result = await rest.getStocksAggregates(
        {
            stocksTicker: symbol,
            multiplier: multiplier,
            timespan: timespan,
            from: from,
            to: to,
            adjusted: false,
            sort: "asc", //oldest first for calculations
            limit: 50000
        }
    );
    if (!result.results) return [];

    return result.results.map(bar => ({
        time: new Date(bar.t),
        open: bar.o,
        high: bar.h,
        low: bar.l,
        close: bar.c,
        volume: bar.v
    }));
}
export async function main(){
  const aTickers = await utils.readTickersFromCSV('./general/TickersNasdaq100.csv');
  for (const sTicker of aTickers) {
    const aData = await getBars(
        'AAPL', //sTicker,
        "minute",
        "5",
        1768573800000, //https://currentmillis.com/
        new Date(Date.now() + 86400000).toISOString().slice(0, 10)
    )
    debugger
    }
}
main()
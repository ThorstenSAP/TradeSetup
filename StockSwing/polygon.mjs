import { restClient } from "@massive.com/client-js";
import dotenv from "dotenv"
dotenv.config()
// import { getBars } from "./polygon.mjs";
// import { Utils } from '../utils.js';
// const utils = new Utils()

const apiKey = process.env.POLY_API_KEY
const rest = restClient(apiKey, 'https://api.massive.com');

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
    try{
        const result = await rest.getStocksAggregates(
            {
                stocksTicker: symbol,
                multiplier: multiplier,
                timespan: timespan,
                from: from,
                to: to,
                adjusted: false,
                sort: "asc", //oldest first for calculations
                limit: 500
            }
        );
        if (!result.results) return null

        return result.results.map(bar => ({
            time: new Date(bar.t),
            open: bar.o,
            high: bar.h,
            low: bar.l,
            close: bar.c,
            volume: bar.v
        }));
        
    } catch (err) {
        console.warn(`Ticker not found: ${sTicker}`);
        return null;
    }

}

export async function getTicker(sTicker){
    try{
        let res = await rest.getTicker({ticker: sTicker})
        return res
    }  catch (err) {
        console.warn(`Ticker not found: ${sTicker}`);
        return null;
    }
}
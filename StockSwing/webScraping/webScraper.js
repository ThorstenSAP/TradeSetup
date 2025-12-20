import puppeteer from "puppeteer";
import cron from 'node-cron'
import { Utils } from '../../utils.js'

const URL = "https://fxverify.com/chart?s=XAU.USD-15m";

async function scrapeOHLC() {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto(URL, { waitUntil: "networkidle0" });

    // Wait for the table to appear in the DOM
    await page.waitForSelector("table.chart-price-history-table tbody tr");

    const data = await page.evaluate(() => {
        const rows = document.querySelectorAll(
            "table.chart-price-history-table tbody tr"
        );

        return Array.from(rows).map((row) => {
            const cols = Array.from(row.querySelectorAll("td")).map((td) =>
                td.textContent.trim()
            );

            return {
                time: cols[0],
                open: parseFloat(cols[1]),
                high: parseFloat(cols[2]),
                low: parseFloat(cols[3]),
                close: parseFloat(cols[4]),
            };
        });
    });

    await browser.close();
    return data;
}



async function getCrntM15Candle() {
    scrapeOHLC().then((data) => {
        return data[1] //0 contains the header row
    });
}
async function buildH4Candle(iBeginHour, iEndHour) {
    return new Promise((res, rej) => {
        scrapeOHLC().then((aData) => {
            let aCandle = []
            const dStartTime = new Date()
            dStartTime.setHours(iBeginHour)
            const dEndTime = new Date()
            dEndTime.setHours(iEndHour)
            aData.reverse()
            aData.pop()
            for (const oCandle of aData) {
                if (new Date(oCandle.time).getHours() >= dStartTime.getHours() && new Date(oCandle.time).getHours() < dEndTime.getHours()) {
                    aCandle.push(oCandle)
                }
            }
            res({
                high: Math.max(...aCandle.map(o => o.high)),
                low: Math.min(...aCandle.map(o => o.low)),
                open: aCandle[0].open,
                close: aCandle[aCandle.length - 1].close
            })
        })
    })
}

function buildCrntH4Candle(aData) {
    return new Promise((res, rej) => {
        let aCandle = []
        let cnt = 1
        do {
            aCandle.push(aData[cnt])
            cnt++
        } while (!(new Date(aData[cnt].time).getMinutes() == 0 && [3, 7, 11, 15, 19].includes(new Date(aData[cnt].time).getHours())))
            aCandle.push(aData[cnt]) //add first candle of H4 Candle - otherwise min 45 and hours -1

        res({
            high: Math.max(...aCandle.map(o => o.high)),
            low: Math.min(...aCandle.map(o => o.low)),
            open: aCandle[0].open,
            close: aCandle[aCandle.length - 1].close
        })

    })

}

async function main() {
    const utils = new Utils()
    buildH4Candle(3, 7).then(oCandle => {
        let oPrevH4Candle = oCandle
        cron.schedule('0 14,29,44,59 * * * *', () => {
            console.log('running cron runner: ' + new Date().getMinutes())
            scrapeOHLC().then(async (aData) => {
                const oCrntM15Candle = aData[1]
                const oPrevM15Candle = aData[2]
                buildCrntH4Candle(aData).then(oCandle => {
                    const oCrntH4Candle = oCandle
                    const oDate = new Date()
                    if ([59, 0o0, 0o1].includes(oDate.getMinutes())) {
                        switch (new Date().getHours()) {
                            case 7:
                                console.log('create new candle (3, 7)')
                                oPrevH4Candle = buildH4Candle(3, 7)
                            case 11:
                                console.log('create new candle (7, 11)')
                                oPrevH4Candle = buildH4Candle(7, 11)
                            case 15:
                                console.log('create new candle (11, 15)')
                                oPrevH4Candle = buildH4Candle(11, 15)
                            case 19:
                                console.log('create new candle (15, 19)')
                                oPrevH4Candle = buildH4Candle(15, 19)
                        }
                    }
                    //prev H4 candle high low check
                    if (utils.hasCandlegrabbedHighs(oCrntM15Candle, oPrevH4Candle)) {
                        console.log('prev H4 high grabbed')
                    } else if (utils.hasCandlegrabbedLows(oCrntM15Candle, oPrevH4Candle)) {
                        console.log('prev H4 low grabbed')
                    }
                    if (utils.isEngulfing(oCrntM15Candle, oPrevM15Candle)) {
                        const oM30Candle = {
                            high: Math.max(oCrntM15Candle.high, oPrevM15Candle.high),
                            low: Math.min(oCrntM15Candle.low, oPrevM15Candle.low),
                            open: oPrevM15Candle.open,
                            close: oCrntM15Candle.close
                        }
                        if (utils.hasCandlegrabbedHighs(oM30Candle, oPrevH4Candle)) {
                            console.log('prev H4 high grabbed + Engulfing')
                        } else if (utils.hasCandlegrabbedLows(oM30Candle, oPrevH4Candle)) {
                            console.log('prev H4 low grabbed + Engulfing')
                        }
                    }

                    //intracandle check
                    if (utils.hasCandlegrabbedHighs(oCrntM15Candle, oCrntH4Candle) && utils.hasCandlegrabbedHighs(oCrntM15Candle, oPrevM15Candle)) {
                        console.log('intraCandle high rejection')
                    } else if (utils.hasCandlegrabbedLows(oCrntM15Candle, oCrntH4Candle) && utils.hasCandlegrabbedLows(oCrntM15Candle, oPrevM15Candle)) {
                        console.log('intraCandle low rejection')
                    }
                })

            })



            //TODO check if high or low was grabbed
            //if a new H4 candle start -> overwrite existing prevCandle
            //intracandle Reversion
        })
    })
}
main()



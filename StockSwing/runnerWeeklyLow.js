const fs = require('fs')
const axios = require('axios')
const csv = require('csv-parser');
const yahooFinance = require('yahoo-finance2').default;
const { Utils } = require('../utils.js')
const utils = new Utils()


async function getChartData(ticker, sInterval) {
    const date = new Date('2025-11-01');
    //date.setFullYear(date.getFullYear() - 1);

    try {
        const result = await yahooFinance.chart(ticker, {
            period1: date,
            interval: sInterval
        });
        return result.quotes;
    } catch (err) {
        console.error(`Error fetching data for ${ticker}:`, err.message);
        return null;
    }
}

function readTickersFromCSV(filepath) {
    return new Promise((resolve, reject) => {
        const tickers = [];
        fs.createReadStream(filepath)
            .pipe(csv())
            .on('data', (row) => {
                if (row.symbol) tickers.push(row.symbol.trim());
            })
            .on('end', () => {
                resolve(tickers);
            })
            .on('error', reject);
    });
}

function createCandle(aHourlyData, openingDateTime, closingDateTime) {
    let aHourCandles = []
    for (const oCandle of aHourlyData) {
        if (oCandle.date >= openingDateTime && oCandle.date <= closingDateTime) {
            aHourCandles.push(oCandle)
        }
    }
    if(aHourCandles.length == 0){
        return {}
    } else {
        return {
            open: aHourCandles[0].open,
            close: aHourCandles[aHourCandles.length - 1].close,
            high: Math.max(...aHourCandles.map(elem => elem.high)),
            low: Math.min(...aHourCandles.map(elem => elem.low))
        }
    }
}


async function dailyCheck() {
    //TODO adjust tickers
    const aTickers = await readTickersFromCSV('./EMAWeeklyAligned.csv');
    for (const sTicker of aTickers) {
        const aWeeklyData = await getChartData(sTicker, '1wk')
        if (aWeeklyData) {
            aWeeklyData.pop() //crnt week is provided from monday and friday
            const oPrevWeekCandle = aWeeklyData[aWeeklyData.length - 2]
            const aDailyData = await getChartData(sTicker, '1d') //doesnt work
            const aH1Data = await getChartData(sTicker, '1h')
            aH1Data.pop()

            const now = new Date();
            const yesterdayNYSEOpeningUTC = new Date(Date.UTC(
                now.getUTCFullYear(),
                now.getUTCMonth(),
                now.getUTCDate() - 1,
                14, 30, 0, 0
            ))
            const yesterdayNYSEClosingUTC = new Date(Date.UTC(
                now.getUTCFullYear(),
                now.getUTCMonth(),
                now.getUTCDate() - 1,
                20, 30, 0, 0
            ))
            const oPrevDay = createCandle(aH1Data, yesterdayNYSEOpeningUTC, yesterdayNYSEClosingUTC)

            if(utils.hasCandlegrabbedLows (oPrevWeekCandle, oPrevDay)){
                console.log(sTicker)
            }
        }

    }
}

async function intradayCheck() {
    //TODO adjust tickers
    const aTickers = await readTickersFromCSV('./general/TickersUSLargeCap.csv');
    for (const sTicker of aTickers) {
        const aWeeklyData = await getChartData(sTicker, '1wk')
        if (aWeeklyData) {
            aWeeklyData.pop() //crnt week is provided from monday and friday
            const oPrevWeekCandle = aWeeklyData[aWeeklyData.length - 2]
            const aH1Data = await getChartData(sTicker, '1h')
            aH1Data.pop()

            const now = new Date();
            const todayNYSEOpeningUTC = new Date(Date.UTC(
                now.getUTCFullYear(),
                now.getUTCMonth(),
                now.getUTCDate(),
                14, 30, 0, 0
            ))
            const todayNYSEH4CloseUTC = new Date(Date.UTC(
                now.getUTCFullYear(),
                now.getUTCMonth(),
                now.getUTCDate(),
                18, 30, 0, 0
            ))

            const oPrevH4 = createCandle(aH1Data, todayNYSEOpeningUTC, todayNYSEH4CloseUTC)
            const oPrevHour = aH1Data[aH1Data.length - 2]
            
            if(utils.hasCandlegrabbedLows (oPrevWeekCandle, oPrevH4)){
                console.log(sTicker)
            }
        }

    }
}
//intradayCheck()
dailyCheck()
const fs = require('fs')
const cron = require('node-cron')
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



async function dailyPrevWeekCheck() {
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
                21, 30, 0, 0
            ))
            const oPrevDay = utils.createCandle(aH1Data, yesterdayNYSEOpeningUTC, yesterdayNYSEClosingUTC)

            if(utils.hasCandlegrabbedLows (oPrevDay, oPrevWeekCandle)){
                console.log(sTicker)
            }
        }

    }
}

async function intradayPrevWeekCheck(sCSVName) {
    const today = new Date()
    const aTickers = await readTickersFromCSV(`./${sCSVName}.csv`);
    for (const sTicker of aTickers) {
        const aWeeklyData = await getChartData(sTicker, '1wk')
        if (aWeeklyData) {
            if(today.getDay() != 1 || aWeeklyData[aWeeklyData.length - 1].date.getDate() == today.getDate()){
                aWeeklyData.pop() //crnt week is provided from monday and friday
            }
            const oPrevWeekCandle = aWeeklyData[aWeeklyData.length - 2]
            const aH1Data = await getChartData(sTicker, '1h')
            aH1Data.pop()

            const oPrevCandle = {}
            if(today.getHours() == 19){
                const oPrevH4 = utils.createCandle(aH1Data,
                    new Date(Date.UTC(
                        today.getUTCFullYear(),
                        today.getUTCMonth(),
                        today.getUTCDate(),
                        14, 30, 0, 0
                    )),
                    new Date(Date.UTC(
                        today.getUTCFullYear(),
                        today.getUTCMonth(),
                        today.getUTCDate(),
                        18, 30, 0, 0
                    )))
                if(utils.hasCandlegrabbedLows (oPrevH4, oPrevWeekCandle)){
                    console.log(`${sTicker} - H4`)
                }
            } 
            // if ([17,19,21].includes(today.getHours())){
            //     const beginHour =today.getHours() -3 
            //     const crntHour = today.getHours() -1 
            //     const oPrevCandle = utils.createCandle(aH1Data,
            //                         new Date(Date.UTC(
            //                             today.getUTCFullYear(),
            //                             today.getUTCMonth(),
            //                             today.getUTCDate(),
            //                             beginHour, 30, 0, 0
            //                         )),
            //                         new Date(Date.UTC(
            //                             today.getUTCFullYear(),
            //                             today.getUTCMonth(),
            //                             today.getUTCDate(),
            //                             crntHour, 30, 0, 0
            //                         )))
            //     if(utils.hasCandlegrabbedLows (oPrevCandle, oPrevWeekCandle)){
            //         console.log(`${sTicker} - H2`)
            //     }
            // }

            // const oPrevHour = aH1Data[aH1Data.length - 2]
            // if(utils.hasCandlegrabbedLows (oPrevHour, oPrevWeekCandle)){
            //     console.log(sTicker)
            // }
        }

    }
}
dailyPrevWeekCheck('EMAWeeklyAligned')

// cron.schedule('0 30 15-23 * * *', () => {
//   console.log('Running job at :30 every hour from 15:30 onward')
//     const today = new Date()
//     if(today.getHours() >= 15 && today.getHours() <= 21){
//         intradayPrevWeekCheck('EMAWeeklyAligned')
//     }
//   intradayPrevWeekCheck('EMAWeeklyAligned')
// });
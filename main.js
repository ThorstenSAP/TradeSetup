const cron = require('node-cron')
const { BitgetApi } = require('./api.js') // https://www.bitget.com/api-doc/contract/market/Get-Candle-Data
const { Engulfing } = require('./engulfing.js')
const { Utils } = require('./utils.js')
const { RsiDiv } = require('./rsiDiv.js')


//Note that 1 * * * * will fire only on the first minute of every hour - 15:01:00, 16:01:00, etc.
//const runner = cron.schedule('*/15 * * * *', () => { //runs the timer on xx:15, xx:30, xx:45 and xx:00
// const runner3 = cron.schedule('6 * * * *', () => { //runs the timer on xx:06
//const runner4 = cron.schedule('18,33,48,03 * * * *', () => { runs the timer on xx:18, xx:33, xx:48 and xx:03

// const runner = cron.schedule('*/15 * * * *', () => { //runs the timer on xx:15, xx:30, xx:45 and xx:00
//     console.log('running a task every 15 minute');
//   })
// runner.start()


//mock engulfing data 1H
// const aMock = [
//   {
//     timestamp: '15.5.2024, 09:00:00',
//     open: 61910.2,
//     high: 62223.8,
//     low: 61840.1,
//     close: 62138.4,
//     volume: 19294514.8702
//   },
//   {
//     timestamp: '15.5.2024, 10:00:00',
//     open: 62138.4,
//     high: 62208.7,
//     low: 61993,
//     close: 62103.6,
//     volume: 21007209.024,
//     rsi: null
//   },
//   {
//     timestamp: '15.5.2024, 11:00:00',
//     open: 62103.6,
//     high: 62880.5,
//     low: 61887,
//     close: 62617.7,
//     volume: 26573147.5741,
//     rsi: null
//   },
//   {
//     timestamp: '15.5.2024, 12:00:00',
//     open: 62617.7,
//     high: 62945.4,
//     low: 62346.3,
//     close: 62631.7,
//     volume: 29991077.958,
//     rsi: null
//   },
//   {
//     timestamp: '15.5.2024, 13:00:00',
//     open: 62631.7,
//     high: 62784.2,
//     low: 62222.8,
//     close: 62426.6,
//     volume: 23158761.2932,
//     rsi: null
//   },
//   {
//     timestamp: '15.5.2024, 14:00:00',
//     open: 62426.6,
//     high: 64151.4,
//     low: 62383.5,
//     close: 63710.2,
//     volume: 82484728.6053,
//     rsi: null
//   },
//   {
//     timestamp: '15.5.2024, 15:00:00',
//     open: 63710.2,
//     high: 64630.4,
//     low: 63492.3,
//     close: 64110.2,
//     volume: 86021779.4896,
//     rsi: null
//   },
//   {
//     timestamp: '15.5.2024, 16:00:00',
//     open: 64110.2,
//     high: 64462,
//     low: 63965.5,
//     close: 64448,
//     volume: 56823045.4903,
//     rsi: null
//   },
//   {
//     timestamp: '15.5.2024, 17:00:00',
//     open: 64448,
//     high: 65050.2,
//     low: 64339.2,
//     close: 64721.3,
//     volume: 40374247.5596,
//     rsi: null
//   },
//   {
//     timestamp: '15.5.2024, 18:00:00',
//     open: 64721.3,
//     high: 65115.1,
//     low: 64707.8,
//     close: 64745.4,
//     volume: 29401485.8672,
//     rsi: null
//   },
//   {
//     timestamp: '15.5.2024, 19:00:00',
//     open: 64745.4,
//     high: 65118.3,
//     low: 64745.4,
//     close: 65049.4,
//     volume: 21796364.0989,
//     rsi: null
//   },
//   {
//     timestamp: '15.5.2024, 20:00:00',
//     open: 65049.4,
//     high: 65793.4,
//     low: 64960.3,
//     close: 65700.6,
//     volume: 30613682.4291,
//     rsi: null
//   },
//   {
//     timestamp: '15.5.2024, 21:00:00',
//     open: 65700.6,
//     high: 66399.4,
//     low: 65297.6,
//     close: 65994.7,
//     volume: 43719322.5223,
//     rsi: null
//   },
//   {
//     timestamp: '15.5.2024, 22:00:00',
//     open: 65994.7,
//     high: 66066.7,
//     low: 65729.4,
//     close: 65932.6,
//     volume: 36238404.6605,
//     rsi: null
//   },
//   {
//     timestamp: '15.5.2024, 23:00:00',
//     open: 65932.6,
//     high: 66182.1,
//     low: 65795.3,
//     close: 65844.9,
//     volume: 23063236.0758,
//     rsi: null
//   },
//   {
//     timestamp: '16.5.2024, 00:00:00',
//     open: 65844.9,
//     high: 66272.2,
//     low: 65834,
//     close: 66119.1,
//     volume: 19336974.1043,
//     rsi: 91.31278004413831
//   },
//   {
//     timestamp: '16.5.2024, 01:00:00',
//     open: 66119.1,
//     high: 66429,
//     low: 66062.8,
//     close: 66190.7,
//     volume: 23074637.9583,
//     rsi: 91.84931341554649
//   },
//   {
//     timestamp: '16.5.2024, 02:00:00',
//     open: 66190.7,
//     high: 66650,
//     low: 65937.1,
//     close: 66064.4,
//     volume: 27333863.3772,
//     rsi: 91.98845673483444
//   },
//   {
//     timestamp: '16.5.2024, 03:00:00',
//     open: 66064.4,
//     high: 66194.1,
//     low: 65826,
//     close: 65962.9,
//     volume: 30043018.4693,
//     rsi: 89.09900121754326
//   },
//   {
//     timestamp: '16.5.2024, 04:00:00',
//     open: 65962.9,
//     high: 66084.9,
//     low: 65777,
//     close: 65887.7,
//     volume: 22331822.9134,
//     rsi: 86.74094473743314
//   },
//   {
//     timestamp: '16.5.2024, 05:00:00',
//     open: 65887.7,
//     high: 66064.8,
//     low: 65805.7,
//     close: 65960.2,
//     volume: 19943458.8853,
//     rsi: 84.94717460814294
//   },
//   {
//     timestamp: '16.5.2024, 06:00:00',
//     open: 65960.2,
//     high: 65995.1,
//     low: 65772.1,
//     close: 65805.7,
//     volume: 17232605.317,
//     rsi: 85.26357686473389
//   },
//   {
//     timestamp: '16.5.2024, 07:00:00',
//     open: 65805.7,
//     high: 65896.1,
//     low: 65735.3,
//     close: 65768.6,
//     volume: 15945595.9317,
//     rsi: 81.3398387264469
//   },
//   {
//     timestamp: '16.5.2024, 08:00:00',
//     open: 65768.6,
//     high: 65977.7,
//     low: 65642.4,
//     close: 65946.2,
//     volume: 20009363.3287,
//     rsi: 80.38323502323443
//   },
//   {
//     timestamp: '16.5.2024, 09:00:00',
//     open: 65946.2,
//     high: 66249.4,
//     low: 65916.8,
//     close: 66126.5,
//     volume: 27238043.1311,
//     rsi: 81.5045981168177
//   },
//   {
//     timestamp: '16.5.2024, 10:00:00',
//     open: 66126.5,
//     high: 66421.8,
//     low: 66085.6,
//     close: 66264.6,
//     volume: 26073850.8939,
//     rsi: 82.59250705756833
//   },
//   {
//     timestamp: '16.5.2024, 11:00:00',
//     open: 66264.6,
//     high: 66337.2,
//     low: 66067.7,
//     close: 66336.8,
//     volume: 23838269.0307,
//     rsi: 83.39801782824472
//   },
//   {
//     timestamp: '16.5.2024, 12:00:00',
//     open: 66336.8,
//     high: 66337,
//     low: 66085,
//     close: 66137.6,
//     volume: 15863256.7244,
//     rsi: 83.8195719434351
//   },
//   {
//     timestamp: '16.5.2024, 13:00:00',
//     open: 66137.6,
//     high: 66545,
//     low: 65986.3,
//     close: 66518.4,
//     volume: 17130458.7801,
//     rsi: 77.93943471569324
//   },
//   {
//     timestamp: '16.5.2024, 14:00:00',
//     open: 66518.4,
//     high: 66730.9,
//     low: 65891.9,
//     close: 66010,
//     volume: 35003398.018,
//     rsi: 80.72340522138894
//   },
//   {
//     timestamp: '16.5.2024, 15:00:00',
//     open: 66010,
//     high: 66356.4,
//     low: 65777,
//     close: 66318.7,
//     volume: 16610224.9687,
//     rsi: 68.32608508401839
//   },
//   {
//     timestamp: '16.5.2024, 16:00:00',
//     open: 66318.7,
//     high: 66383.2,
//     low: 65550,
//     close: 65577,
//     volume: 20255633.278,
//     rsi: 71.2166664808733
//   },
//   {
//     timestamp: '16.5.2024, 17:00:00',
//     open: 65577,
//     high: 65871.4,
//     low: 65349.3,
//     close: 65807.6,
//     volume: 25193497.702,
//     rsi: 57.612384099539014
//   },
//   {
//     timestamp: '16.5.2024, 18:00:00',
//     open: 65807.6,
//     high: 65819.4,
//     low: 65073.2,
//     close: 65097.5,
//     volume: 21935209.7492,
//     rsi: 60.16052429318686
//   },
//   {
//     timestamp: '16.5.2024, 19:00:00',
//     open: 65097.5,
//     high: 65357.2,
//     low: 64570,
//     close: 64960.1,
//     volume: 26230635.0531,
//     rsi: 50.16069154215259
//   },
//   {
//     timestamp: '16.5.2024, 20:00:00',
//     open: 64960.1,
//     high: 65168.2,
//     low: 64796.8,
//     close: 65084.5,
//     volume: 13717138.6161,
//     rsi: 48.481466973170086
//   },
//   {
//     timestamp: '16.5.2024, 21:00:00',
//     open: 65084.5,
//     high: 65543.4,
//     low: 65052.4,
//     close: 65098.7,
//     volume: 20018980.4629,
//     rsi: 50.109929296341825
//   },
//   {
//     timestamp: '16.5.2024, 22:00:00',
//     open: 65098.7,
//     high: 65254.2,
//     low: 65004.8,
//     close: 65234.1,
//     volume: 13738917.4382,
//     rsi: 50.3030357263414
//   },
//   {
//     timestamp: '16.5.2024, 23:00:00',
//     open: 65234.1,
//     high: 65480.8,
//     low: 65200.1,
//     close: 65427.8,
//     volume: 11708835.4856,
//     rsi: 52.20280150933354
//   },
//   {
//     timestamp: '17.5.2024, 00:00:00',
//     open: 65427.8,
//     high: 65451.5,
//     low: 65112,
//     close: 65377.3,
//     volume: 17950431.6552,
//     rsi: 54.86117553513085
//   },
//   {
//     timestamp: '17.5.2024, 01:00:00',
//     open: 65377.3,
//     high: 65386.9,
//     low: 65160.4,
//     close: 65209.6,
//     volume: 9916125.6426,
//     rsi: 54.01765471234696
//   },
//   {
//     timestamp: '17.5.2024, 02:00:00',
//     open: 65209.6,
//     high: 65448.7,
//     low: 65203.6,
//     close: 65448.7,
//     volume: 8823290.4346,
//     rsi: 51.202217560626046
//   },
//   {
//     timestamp: '17.5.2024, 03:00:00',
//     open: 65448.7,
//     high: 65468.6,
//     low: 65072.5,
//     close: 65311.7,
//     volume: 16580527.9833,
//     rsi: 54.818034454937354
//   },
//   {
//     timestamp: '17.5.2024, 04:00:00',
//     open: 65311.7,
//     high: 65427.5,
//     low: 65145.2,
//     close: 65349.6,
//     volume: 12793018.2055,
//     rsi: 52.42119505572759
//   },
//   {
//     timestamp: '17.5.2024, 05:00:00',
//     open: 65349.6,
//     high: 65831.1,
//     low: 65309.2,
//     close: 65526.6,
//     volume: 19796591.0714,
//     rsi: 53.03299810870605
//   },
//   {
//     timestamp: '17.5.2024, 06:00:00',
//     open: 65526.6,
//     high: 65575.4,
//     low: 65311.5,
//     close: 65394.8,
//     volume: 19787291.6084,
//     rsi: 55.88594588392475
//   },
//   {
//     timestamp: '17.5.2024, 07:00:00',
//     open: 65394.8,
//     high: 65648.4,
//     low: 65383.1,
//     close: 65648.4,
//     volume: 14637193.3128,
//     rsi: 53.29012598209989
//   },
//   {
//     timestamp: '17.5.2024, 08:00:00',
//     open: 65648.4,
//     high: 66137.1,
//     low: 65531.1,
//     close: 65910.7,
//     volume: 12199982.6473,
//     rsi: 57.391132551344214
//   },
//   {
//     timestamp: '17.5.2024, 09:00:00',
//     open: 65910.7,
//     high: 66460.6,
//     low: 65910.7,
//     close: 66372,
//     volume: 19849914.2883,
//     rsi: 61.186854045597734
//   },
//   {
//     timestamp: '17.5.2024, 10:00:00',
//     open: 66372,
//     high: 66434.6,
//     low: 66037.6,
//     close: 66059.8,
//     volume: 10858827.0081,
//     rsi: 66.79001254091146
//   }
// ]

const utils = new Utils()
const engulfing = new Engulfing()
const bitget = new BitgetApi()
const aTicker = ['ETHUSDT' ] //, 'SHIBUSDT', 'SOLUSDT',
for (const sTicker of aTicker) {
    bitget.getTickerData(sTicker, '1H', '50')
    .then(res => {
		console.log()
		console.log(`checking ${sTicker}`)
    utils.setRsi(res)
		engulfing.checkHistory(res)
    const rsiDiv = new RsiDiv(res, sTicker)
    rsiDiv.setRsiHighLows()
    rsiDiv.findRsiDivHigh()
		// engulfing.checkEngulfingTrade(res)
	})
    .catch(err => {console.log(err)})
}


// const runner = cron.schedule('57,12,27,42 * * * *', () => { //runs the timer on xx:15, xx:30, xx:45 and xx:00
//   console.log('sending msg to ntfy')
//   const utils = new Utils()
//   utils.ntfyMe('sending msg every 15 min')
// })
// runner.start()
const cron = require('node-cron')
const { BitgetApi } = require('./api.js')

//Note that 1 * * * * will fire only on the first minute of every hour - 15:01:00, 16:01:00, etc.
//const runner = cron.schedule('*/15 * * * *', () => { //runs the timer on xx:15, xx:30, xx:45 and xx:00
// const runner3 = cron.schedule('6 * * * *', () => { //runs the timer on xx:06
//const runner4 = cron.schedule('18,33,48,03 * * * *', () => { runs the timer on xx:18, xx:33, xx:48 and xx:03

const runner = cron.schedule('*/15 * * * *', () => { //runs the timer on xx:15, xx:30, xx:45 and xx:00
    console.log('running a task every 15 minute');
  })
runner.start()

// const bitget = new BitgetApi()
// const aTicker = ['BTCUSD']
// for (const sTicker of aTicker) {
//     bitget.getTickerData(sTicker)
//     .then(res => {console.log(res)})
//     .catch(err => {console.log(err)})
// }

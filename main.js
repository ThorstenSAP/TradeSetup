// import { api } from 'api.js'
const { BitgetApi } = require('./api.js')



const bitget = new BitgetApi()
const aTicker = ['BTCUSD']
for (const sTicker of aTicker) {
    bitget.getTickerData(sTicker)
    .then(res => {console.log(res)})
    .catch(err => {console.log(err)})
}

import { getBars, getTicker } from "./polygon.mjs";
import { Utils } from '../utils.js';
const utils = new Utils()
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))


export function emaStrength(s) {
  return s.ema5Slope + s.ema10Slope * 2 + s.ema20Slope * 1.5;
}

export async function calcDelta(aTickersScan, sCapName) {
  const aTickersSaved = await utils.readTickersFromCSV(`Hot${sCapName}.csv`)

  const aNewTickers = aTickersScan.filter(ticker => !aTickersSaved.includes(ticker))
  const aTickersRemoved = aTickersSaved.filter(ticker => !aTickersScan.includes(ticker))

  for (const sTicker of aNewTickers) {
    sleep(2000)
    utils.ntfyMe(`Hot_${sCapName}Cap_Added`, sTicker)
  }
  for (const sTicker of aTickersRemoved) {
    sleep(2000)
    utils.ntfyMe(`Hot_${sCapName}Cap_Removed`, sTicker)
  }
}


export async function main() {
  let aRes = []
  const date = new Date();
  date.setUTCFullYear(date.getUTCFullYear() - 1)
  const aTickersQQQ = await utils.readTickersFromCSV('./general/TickersNasdaq100.csv')
  const aTickersIWM = await utils.readTickersFromCSV('./general/TickersIWM.csv')
  const aTickers = [...aTickersQQQ, ...aTickersIWM]
  // const aTickers = await utils.readTickersFromCSV('./general/TickersNasdaq100.csv')
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

      let aCandles = utils.calculateRVOL(aData, 10)
      aCandles = utils.calculateRollingBBWidth(aCandles, 20)
      aCandles = utils.rollingAvgBBW(aCandles, 20)
      const iBBWLookbackPeriod = 20

      // utils.checkEMAStacked(aData, 'bull', 5, 10, 20, 50) && 
      // utils.calculateEMASlope(aData, 10) > 1 && 
      // utils.calculateEMASlope(aData, 20) > 1 && 

      if (utils.checkEMAStacked(aData, 'bull', 20, 50) &&
        // utils.calculateEMASlope(aData, 20) > 0.5 && 
        // utils.calculateEMASlope(aData, 50) > 0.3 && 
        aCandles.slice(-iBBWLookbackPeriod).every(d => aCandles.at(-1).bbw <= d.bbw)) {

        if (utils.getMarketCap(oCompany.results.market_cap) == 'large' && utils.calculateEMASlope(aData, 50) > 0.3) {
          aRes.push({
            ticker: sTicker,
            marketCap: utils.getMarketCap(oCompany.results.market_cap),
            sharesOutstanding: oCompany.results.weighted_shares_outstanding.toLocaleString('de-DE'),
            ema5Slope: utils.calculateEMASlope(aData, 5),
            ema10Slope: utils.calculateEMASlope(aData, 10),
            ema20Slope: utils.calculateEMASlope(aData, 20),
          })
        } else if (utils.getMarketCap(oCompany.results.market_cap) == 'mid' && utils.calculateEMASlope(aData, 50) > 0.3) {
          aRes.push({
            ticker: sTicker,
            marketCap: utils.getMarketCap(oCompany.results.market_cap),
            sharesOutstanding: oCompany.results.weighted_shares_outstanding.toLocaleString('de-DE'),
            ema5Slope: utils.calculateEMASlope(aData, 5),
            ema10Slope: utils.calculateEMASlope(aData, 10),
            ema20Slope: utils.calculateEMASlope(aData, 20),
          })
        } else if (utils.getMarketCap(oCompany.results.market_cap) == 'small' && utils.calculateEMASlope(aData, 50) > 0.4) {
          aRes.push({
            ticker: sTicker,
            marketCap: utils.getMarketCap(oCompany.results.market_cap),
            sharesOutstanding: oCompany.results.weighted_shares_outstanding.toLocaleString('de-DE'),
            ema5Slope: utils.calculateEMASlope(aData, 5),
            ema10Slope: utils.calculateEMASlope(aData, 10),
            ema20Slope: utils.calculateEMASlope(aData, 20),
          })
        }
        // aRes.push({
        //   ticker: sTicker,
        //   marketCap: utils.getMarketCap(oCompany.results.market_cap),
        //   sharesOutstanding: oCompany.results.weighted_shares_outstanding.toLocaleString('de-DE'),
        //   ema5Slope: utils.calculateEMASlope(aData, 5),
        //   ema10Slope: utils.calculateEMASlope(aData, 10),
        //   ema20Slope: utils.calculateEMASlope(aData, 20),
        // })

      }


    }

  }
  aRes = aRes.sort((a, b) => emaStrength(b) - emaStrength(a))
  const aLargeCap = aRes.filter(stock => stock.marketCap == 'large')
  const aLargeCapTickers = utils.copyTickersFromListForExport(aLargeCap)

  const aMidCap = aRes.filter(stock => stock.marketCap == 'mid')
  const aMidCapTickers = utils.copyTickersFromListForExport(aMidCap)

  const aSmallCap = aRes.filter(stock => stock.marketCap == 'small')
  const aSmallCapTickers = utils.copyTickersFromListForExport(aSmallCap)

  await calcDelta(aMidCapTickers, 'mid')
  await calcDelta(aSmallCapTickers, 'small')

  // utils.saveArrayToCSV(aLargeCapTickers, 'HotLarge')
  // utils.saveArrayToCSV(aMidCapTickers, 'HotMid')
  // utils.saveArrayToCSV(aSmallCapTickers, 'HotSmall')

  // utils.ntfyMeCSVList('Hot_largeCap_List', "symbol", aLargeCapTickers)
  // utils.ntfyMeCSVList('Hot_midCap_List', "symbol", aMidCapTickers)
  // utils.ntfyMeCSVList('Hot_smallCap_List', "symbol", aSmallCapTickers)

  // await calcDelta(aLargeCapTickers, 'large')

}
main()
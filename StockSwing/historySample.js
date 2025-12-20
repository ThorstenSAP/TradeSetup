const yahooFinance = require('yahoo-finance2').default;
const { Utils } = require('../utils.js');
const utils = new Utils()

async function getChartData(ticker, sInterval) {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1)

    try {
        const result = await yahooFinance.chart(ticker, {
            period1: startOfYear,
            period2: now,
            interval: sInterval
        });
        return result.quotes;
    } catch (err) {
        console.error(`Error fetching data for ${ticker}:`, err.message);
        return null;
    }
}

function calculateDailyRVOL(candles, lookback = 10) {
  return candles.map((candle, index) => {
    if (index < lookback) {
      return {
        ...candle,
        rvol: null // not enough history yet
      };
    }

    const pastVolumes = candles
      .slice(index - lookback, index)
      .map(c => c.volume)
      .filter(v => v > 0);

    if (pastVolumes.length === 0) {
      return {
        ...candle,
        rvol: null
      };
    }

    const avgVolume =
      pastVolumes.reduce((sum, v) => sum + v, 0) / pastVolumes.length;

    return {
      ...candle,
      rvol: candle.volume / avgVolume
    };
  });
}

// function calculateBBWidth(candles, period = 20, stdDevMult = 2) {
//   if (candles.length < period) return null;

//   const closes = candles
//     .slice(-period)
//     .map(c => c.close)
//     .filter(v => typeof v === "number");

//   if (closes.length < period) return null;

//   const mean =
//     closes.reduce((sum, v) => sum + v, 0) / closes.length;

//   const variance =
//     closes.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) /
//     closes.length;

//   const stdDev = Math.sqrt(variance);

//   const upper = mean + stdDevMult * stdDev;
//   const lower = mean - stdDevMult * stdDev;

//   return (upper - lower) / mean;
// }
function calculateBollingerBands(candles, period = 20, stdDevMult = 2) {
  if (candles.length < period) return null;

  // Use ONLY the last `period` closes
  const closes = candles
    .slice(-period)
    .map(c => Number(c.close));

  // Mean (SMA)
  const mean =
    closes.reduce((sum, v) => sum + v, 0) / period;

  // Sample variance (N - 1)
  const variance =
    closes.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) /
    (period - 1);

  const stdDev = Math.sqrt(variance);

  return {
    mean,
    upper: mean + stdDevMult * stdDev,
    lower: mean - stdDevMult * stdDev
  };
}


function calculateRollingBBWidth(candles, period = 20, stdDevMult = 2) {
  // Clone candles to avoid side effects
  const enriched = candles.map(c => ({
    ...c,
    bbw: null,
    bbUpper: null,
    bbLower: null
  }));

  for (let i = candles.length - 1; i >= period; i--) {
    const window = candles.slice(i - period, i);

    const { mean, upper, lower } =
      calculateBollingerBands(window, period, stdDevMult);

    const bbw = ((upper - lower) / mean) * 100;

    enriched[i].bbw = bbw;
    enriched[i].bbUpper = upper;
    enriched[i].bbLower = lower;
  }

  return enriched;
}
function filterCloseNearBands(candles, thresholdPct = 1) {
  const pct = thresholdPct / 100;
  const result = [];

  //BBBands are only calculated for at least 20 candles
  for (let i = candles.length - 1; i > 20; i--) {
    const prev = candles[i - 1];
    const curr = candles[i];

    if (
      prev.bbUpper == null ||
      prev.bbLower == null ||
      curr.bbUpper == null ||
      curr.bbLower == null
    ) {
      continue;
    }

    const prevWidth = prev.bbUpper - prev.bbLower;
    const currWidth = curr.bbUpper - curr.bbLower;

    if (currWidth <= prevWidth * (1 - pct)) {
      result.push({
        ...curr,
        bbwChangePct:
          ((currWidth - prevWidth) / prevWidth) * 100
      });
    }
  }

  return result.reverse();
}






async function main(){
    let aRVOL = []
    let aBBWidth = []
    let aBBClosing = []
    const aTickers = await utils.readTickersFromCSV('./general/TickersNasdaq100.csv');
    for (const sTicker of aTickers) {
        const aData = await getChartData(sTicker, '1d')
        if (aData) {
            // let tmp = aData.reverse()
            const aCandles = calculateDailyRVOL(aData, 10)
            const aHighRVOLDays = aCandles.filter(c => c.rvol > 3)
            const aCandlesWithBb = calculateRollingBBWidth(aCandles, 20)
            //TODO combine bbWidth + BBBandsClosing
            const aBbwDays = aCandlesWithBb.filter(
                c => c.bbw !== null && c.bbw < 5 
            )
            const aClosingBBBands = filterCloseNearBands(aCandlesWithBb, 5)

            if(aHighRVOLDays.length > 1){
                aRVOL.push({
                    ticker: sTicker,
                    relVolDays: aHighRVOLDays
                })
            }
            if(aBbwDays.length > 1){
                aBBWidth.push({
                    ticker: sTicker,
                    bbWidth: aBbwDays                    
                })
            }
            if(aClosingBBBands.length > 1){
                aBBClosing.push({
                    ticker: sTicker,
                    bbClosing: aClosingBBBands                    
                })
            }
        debugger;
        }
    }
        debugger;
}
main()
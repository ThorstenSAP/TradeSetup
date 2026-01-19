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

export async function calculateDailyRVOL(candles, lookback = 10) {
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


export async function calculateRollingBBWidth(candles, period = 20, stdDevMult = 2) {
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

export async function filterClosingBands(candles, thresholdPct = 1) {
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
export async function isContextCandle(candle, prevCandle) {
  //TODO green candle on green candle
  //TODO Vol threshold of 0.1%
  if (utils.getDirectionOfCandle(candle) == 0) {
    if (prevCandle.close > candle.open && prevCandle.close < candle.close &&
      utils.getDirectionOfCandle(prevCandle) == 1 //&& !utils.isInsideCandle()
    ) {
      //gap down and push
      return true
    } else if (candle.low < prevCandle.low && candle.close > prevCandle.low) {
      //lowgrab
      return true
    } else if (candle.close > prevCandle.close) {
      //prev candle negated
      //cloud cover - engulfing
      return true
    }
  } else {
    if (prevCandle.close < candle.open && prevCandle.close > candle.close &&
      utils.getDirectionOfCandle(prevCandle) == 1 //&& !utils.isInsideCandle()
    ) {
      //gap down and push
      return true
    } else if (candle.high > prevCandle.high && candle.close < prevCandle.high) {
      //lowgrab
      return true
    } else if (candle.close < prevCandle.close) {
      //prev candle negated
      //cloud cover - engulfing
      return true
    }
  }
}
export async function getContextCandles(candles) {
  let result = []
  candles.forEach((candle, index) => {
    index++
    if (index >= candles.length)
      return
    if (candles[index].volume > candle.volume && candles[index].rvol >= 1) {
      if (isContextCandle(candles[index], candle)) {
        result.push(candles[index])
      }
    }
  });
  return result
}

export async function main(){
    const today = new Date().toISOString().slice(0, 10) 
  let result = {
    RVol: [],
    TightBB: [],
    BBClosing: [],
    CC: []
  }
  let aRVOL = []
  let aBBWidth = []
  let aBBClosing = []
  let aContextCandles = []
  const aTickers = await utils.readTickersFromCSV('./general/TickersNasdaq100.csv');
  for (const sTicker of aTickers) {
    const aData = await getBars(
        sTicker,
        "day",
        "1",
        "2025-01-01",
        today
    )
    if (aData) {
      let aCandles = await calculateDailyRVOL(aData, 10)
      const aHighRVOLDays = aCandles.filter(c => c.rvol > 3)
      aCandles = await calculateRollingBBWidth(aCandles, 20)
      const aTighBBWidth = aCandles.filter(c => c.bbw !== null && c.bbw < 5)
      const aClosingBBBands = await filterClosingBands(aCandles, 5)
      aContextCandles = await getContextCandles(aCandles)//.reverse()
      aContextCandles.reverse()

      if (aHighRVOLDays.length > 1) {
        aRVOL.push({
          ticker: sTicker,
          relVolDays: aHighRVOLDays.reverse()
        })
      }
      if (aTighBBWidth.length > 1) {
        aBBWidth.push({
          ticker: sTicker,
          bbWidth: aTighBBWidth.reverse()
        })
      }
      if (aClosingBBBands.length > 1) {
        aBBClosing.push({
          ticker: sTicker,
          bbClosing: aClosingBBBands.reverse()
        })
      }

        if (aHighRVOLDays.length > 0 && aHighRVOLDays[0].time == aData[aData.length - 1].time) {
        result.RVol.push({ ticker: sTicker, entry: aHighRVOLDays[0] })
        }
        if (aTighBBWidth.length > 0 && aTighBBWidth[0].time == aData[aData.length - 1].time) {
        result.TightBB.push({ ticker: sTicker, entry: aTighBBWidth[0] })

        }
        if (aClosingBBBands.length > 0 && aClosingBBBands[0].time == aData[aData.length - 1].time) {
        result.BBClosing.push({ ticker: sTicker, entry: aClosingBBBands[0] })

        }
        if (aContextCandles.length > 0 && aContextCandles[0].time == aData[aData.length - 1].time) {
        result.CC.push({ ticker: sTicker, entry: aContextCandles[0] })
        }
    }



    }
    debugger
}

main()
// const daily = await getBars(
//     "AAPL",
//     "day",
//     "1",
//     "2025-01-01",
//     "2026-01-10"
// );

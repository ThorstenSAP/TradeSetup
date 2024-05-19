// const { convertArrayToCSV } = require('convert-array-to-csv')
const fs = require('fs')
const axios = require('axios')

const XLSX = require('xlsx')
const RSI = require('calc-rsi') 

class Utils{
    constructor(){
        
    }
    convertMiliseconds(sMiliseconds){
        let date = new Date(parseInt(sMiliseconds))
        return date.toLocaleString('de')
    }

    //aData = array with objects
    // saveArrayToCSV(aDataObjects){
    //     // const header = ['number', 'first', 'last', 'handle'];
    //     // const dataArrays = [
    //     //     [1, 'Mark', 'Otto', '@mdo'],
    //     //     [2, 'Jacob', 'Thornton', '@fat'],
    //     //     [3, 'Larry', 'the Bird', '@twitter'],
    //     // ];
    //     // const csvFromArrayOfArrays = convertArrayToCSV(dataArrays, {
    //     //     header,
    //     //     separator: ';'
    //     // });
    //     // const aDataObjects = [
    //     //     {
    //     //         number: 1,
    //     //         first: 'Mark',
    //     //         last: 'Otto',
    //     //         handle: '@mdo',
    //     //     },
    //     //     {
    //     //         number: 2,
    //     //         first: 'Jacob',
    //     //         last: 'Thornton',
    //     //         handle: '@fat',
    //     //     },
    //     //     {
    //     //         number: 3,
    //     //         first: 'Larry',
    //     //         last: 'the Bird',
    //     //         handle: '@twitter',
    //     //     },
    //     // ];
        
    //     const csvFromArrayOfObjects = convertArrayToCSV(aDataObjects)
    //     const writeStream = fs.createWriteStream('result.csv');
    //     writeStream.write(csvFromArrayOfObjects);
    //     writeStream.end()
    // }
    saveArrayToXlsx(aDataObjects){
        var ws = XLSX.utils.json_to_sheet(aDataObjects);
        /* create workbook and export */
        var wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
        XLSX.writeFile(wb, "test.xlsx");
    }

    getDirectionOfCandle(oCandle){
        if(oCandle.open < oCandle.close){
            return 0 //bullish
        } else {
            return 1 //bearish
        }
    }

    //if the candle is an inside candle return the index of the corresponding surrounding candle
    isInsideCandle(index, aData, offSet){
        let step = 2 //do not check the engulfed candle. Check the candle prior the engulfing
        offSet = offSet + step
        while (index > 0 && index - step > 0 && step <= offSet) {
            //check prev candle if body is in range of a previous candle (with high low)
            //if so it is an inside candle
            if(aData[index-step].low < aData[index].low && aData[index-step].low > aData[index].low ){
                //&& aData[index-step].low < aData[index].close && aData[index].close < aData[index-step].high){
                //if(this.getDirectionOfCandle(aData[index]) !== this.getDirectionOfCandle(aData[index-step])){
                    //only consider inside candles when there are in opposite directions
                    return index-step
                //}
            }
            
            step += 1
        }
        return -1
    }


    // isCandleInRange(aData, index, offSet){
    //     let step = 1
    //     let bInsideCandle = false
    //     while (index > 0 && index - step > 0 && step <= offSet) {
    //         const oCrntCandle = aData[index]
    //         const oCandleToCheck = aData[index-step]

    //         if(this.getDirectionOfCandle(oCrntCandle) === 0){
    //             //bull case
    //             if (oCrntCandle.open > oCandleToCheck.close){
    //                 return false
    //             }
    //         } else {
    //             if (oCandleToCheck.open < oCrntCandle.close){
    //                 return false
    //             }
    //         }
    //     }
    //     return true
    // }


    isEngulfing(oPrevCandle, oCrntCandle){
        if(this.getDirectionOfCandle(oPrevCandle) === 0){
            //prev candle was bullish. Hence, look for bearish engulfing
            if(oCrntCandle.open >= oPrevCandle.close && oCrntCandle.close < oPrevCandle.open){
                return true //bearish engulfing
            }
        } else {
            if(oCrntCandle.open <= oPrevCandle.close && oCrntCandle.close > oPrevCandle.open){
                return true //bullish engulfing
            }
        }
        return false
    }

    isCloudCover(oCrntCandle, oPrevCandle){
        if(this.getDirectionOfCandle(oCrntCandle) === 0){
            //bull case
            if (oCrntCandle.open > oPrevCandle.close && oCrntCandle.close > oPrevCandle.open){ //red candle followed by green
                return true
            } else  if (oCrntCandle.open > oPrevCandle.open && oCrntCandle.close > oPrevCandle.close){ //green on green 
                return true
            }
        } else {
            //bear case
            if (oCrntCandle.open <= oPrevCandle.close && oCrntCandle.close < oPrevCandle.open){ //green candle followed by red candle
                return true
            } else  if (oCrntCandle.open < oPrevCandle.open && oCrntCandle.close < oPrevCandle.close){ //red on red
                return true
            }
        }
        return false
    }

    convertApiResponseForRsiCalc(aData){
        const aPrevClose = []
        for (let i = aData.length -1; i >= 0; i--) {
            aPrevClose.push(aData[i].close)
            // for (let j = i-1; j >= 0; j--) {
            // } 
        }
        return aPrevClose
    }
    setRsi(aData){
        const rsi = new RSI(this.convertApiResponseForRsiCalc(aData), 14)
        rsi.calculate((err, data) => {
            if (err) {
                done(err);
            } else if(data.length > 0) {
                for (let i = aData.length -1; i >= 0; i--) {
                    const oLastElement = data.pop()
                    if(oLastElement.rsi){
                        aData[i].rsi = oLastElement.rsi
                    } else {
                        aData[i].rsi = null
                    }
                }
                
            }
        })
    }
    getDelta(int1, int2){
        if(int1 > int2){
            return int1 - int2
        } else {
            return int2 - int1
        }
    }

    isOneOfLatestCandles(sTimestring){
        const date = new Date()
        const iCrntDay = new Date().getDate()
        const iCrntHour = date.getHours()
        const iCandleDay = parseInt(sTimestring.slice(0,2))
        const iCandleHour = parseInt(sTimestring.split(', ')[1].slice(0,2))

        if(iCrntDay == iCandleDay && this.getDelta(iCrntHour, iCandleHour) == 0){
            //same day and it happend in the last two hours
            return true
        } 
        else if(iCrntHour <= 8){
            if((iCandleDay == iCrntDay - 1 && iCandleHour >= 20) || (iCandleDay == iCrntDay && iCandleHour <= 8)){
                //the engulfing occured between yesterday 20.00pm and today 08.00 am
                return true
            }
        } 
        else {
            return false
        }

    }
    

    ntfyMe(topic, msg){
        return new Promise((res,rej) => {
            if(typeof msg === 'object'){
                axios.post(`http://213.160.75.69/${topic}`, {
                    message: msg
                })
                .then((response) => {
                    setTimeout(() => {res()}, 1000)
                }, (error) => {
                    console.log(error.response.data)
                    rej(error.response.data);
                });
            } else {
                // msg is probably a string
                axios.post(`http://213.160.75.69/${topic}`, msg)
                .then((response) => {
                    setTimeout(() => {res()}, 1000)
                }, (error) => {
                    console.log(error.response.data)
                    rej(error.response.data);
                });
            }

        })
        
    }
      

}
exports.Utils = Utils;
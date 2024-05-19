const { RestClientV2 } = require('bitget-api') //node module
const { Utils } = require('./utils.js')

class BitgetApi{
    constructor() {
        this.API_PASS = 'ApiRsa052024';
        this.API_KEY = 'bg_5db40e3b9671e84a0b8049c3d74f4275';
        this.API_SECRET = `-----BEGIN PRIVATE KEY-----
        MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC1PSbGotpjE20G
        /qGNE93coLBDboL5N+4mDgCcyvGjpQOFQaQ02MvK4QYcBnIBiP6QdO9JhKkDe2m3
        c2d+WHFTYkf4fUdvfFTfXdoMENuIRTzdugfU0TLsuBGw2aJr4ZZ4T1sU7IfVbA95
        dMKJReC7UvUW7wNQO6VyLfludrWym9AUtu5EvmIDoc+leXurynv5z2XHXs0l8DPQ
        uOEWgqeGiILs+SpIhUgsfI/rVSKJyhfS5JxoiSg139kl0JZzUopowZnTqlV78FjI
        lFeVP+a0ye9JqP5+r0H/Uc8dtNV2AvIKEe6tLM9hompdniARX54jQalYaTBlr+Cl
        ve6BZh5VAgMBAAECggEAAVN5u/CAEbrPm20T9bEk+HG9aPRdISGEnbYIBFloHuke
        3Kg5vyKCFPOMxuCM/uUuBvsfhH0S2U7KRnIQvHkSsKpY6NQWxDwCM9V0ccFSsATY
        eJ0MOdrBIb/4Kl4T8/BaoQJ95jKkyKeYq9sL1QIyEFXhvH+asxXegWE3PD9TV7bq
        YobsoZ+qD/H8tPY5u66gC0yDYhFXd23yMYFvfcznfplfjkKVWrlq53IklPmDsLC4
        apgcw9+PFsxjHfWGDfTdx5Mq7tEdJms6oxlOtRuEgznO3QHXTcw/Uhf/m7cCUXpi
        jFS4U/hS7S850qjSBUguXnCI8oEDkt4aG4bd+Pl+UQKBgQD64BTJEwLCRcUiQ+cl
        3IO7J4h/WQf8R19XPzx2PhhX2ax2paqshAOWCvNvCC9+WGG+DHXQCz8RyzaMzHPo
        dAc3Pne/p1ww3uTqQqJ/ZN4ybB4jNxSpuTkcHHxkSxQVd9I76S+aVexqbN+dG3AO
        +0eeWrcs1UacayC/auUkP51EhQKBgQC48Op0IM14vwTgaS4GBwjmLfTakkqAMvkY
        ucuuVYxLeUBeXr2OLhXtf8iFCn7KNgLU4MOUt04TfD9MgJj9rd4n2uvOhm7sLLq3
        VlOKHH2Pwv8fVuLJVIeD/pWwl7J3NyTIgL+q5UBTNZSb78oZ5Nfc7abeXiiUBjFS
        /TLD8+3DkQKBgQCQpvvVJJ0Gn2wXYce50PgzxYuywgcUs6KJj/CwzQUEQoJqtwM+
        DbBzp0TN1I5t71AMYOrdVl67R8zgSlLayWwPsnkhjMJfe2XKnTlM80AbGrQV4gCM
        DDydtN8UhSXDax9RZBcKiliS1MvqrpNiUAjviabsttzL/AkZ1ezhhbyMcQKBgBeO
        uI6qTwH+cwSS4UXrR3rqh7H/yHWkCI7Zu9QtGX3TqBtdPhAKVsi16jjoKVZgouOy
        7bbX0p4wyW9ZQiOuLgotnLPl8+Mpn28TE/kXv/a8A/td+e1jUw/BMhgYeqcs4waX
        P9Lo+NSgkpl6Zef+enCt5P+WRtz0HPxRPFIxlCvBAoGBAKXS1CgSf1LckK6xSWnJ
        MJymVNO3yXk24mq4VhEXkVCZ8YCZGuyRE2uSemW7qdiugfszPC/sCA1s6Vut5oMh
        IBCfDfu+ANtIAQrbWo60ZtuaCd58CIJDFS4t9sc35oqJYx2BMRNWFUQ522PSEGYG
        JBWfGSxza2KtlqWEDo/rvszw
        -----END PRIVATE KEY-----`;

        this.client = new RestClientV2(
            {
              apiKey: this.API_KEY,
              apiSecret: this.API_SECRET,
              apiPass: this.API_PASS,
            }
          );
        this.utils = new Utils()

    }
    getTickerData(sTicker, sTimeFrame, sLimit){
        return new Promise((resolve, reject) => {
            this.client.getFuturesCandles({
                symbol: sTicker,
                productType: 'USDT-FUTURES',
                granularity: sTimeFrame,
                limit: sLimit,
            })
            .then((aResponse) => {
                let res = []
                for (const aCandle of aResponse.data) {
                    res.push({ //unshift
                        timestamp: this.utils.convertMiliseconds(aCandle[0]),
                        open: parseFloat(aCandle[1]),
                        high: parseFloat(aCandle[2]),
                        low: parseFloat(aCandle[3]),
                        close: parseFloat(aCandle[4]),
                        volume: parseFloat(aCandle[6])
                    })
                }
                
                resolve(res)
            })
            .catch((err) => {
                reject(err)
            });
        })
    }
}
exports.BitgetApi = BitgetApi;

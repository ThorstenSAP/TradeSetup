class Utils{
    convertMiliseconds(sMiliseconds){
        let date = new Date(parseInt(sMiliseconds))
        return date.toLocaleString('de')
    }
      

}
exports.Utils = Utils;
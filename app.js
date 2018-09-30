let async = require('async');
let Dbapi = require('./api/dbapi');
const tradeDoubler = require('./task/trade-doubler');
let dateNull = 0;
const tradeDoublerUser=[
    {"_aff_accountid":"72","_aff_type":"25","aff_type":"TradeDoubler","name":"tradedoubler.it@sammydress.com1","account":"tradedoubler.it@sammydress.com1","pwd":"123123123","linkid":"2147483576"},
    {"_aff_accountid":"73","_aff_type":"25","aff_type":"TradeDoubler","name":"afiliados.pt@fshion.me","account":"afiliados.pt@fshion.me","pwd":"TDfsion2017","linkid":"2147483575"},
    {"_aff_accountid":"74","_aff_type":"25","aff_type":"TradeDoubler","name":"tradedoubler.fr@fshion.me","account":"tradedoubler.fr@fshion.me","pwd":"sdrgdztd%123","linkid":"2147483574"},
    {"_aff_accountid":"75","_aff_type":"25","aff_type":"TradeDoubler","name":"afiliado.es@fshion.me","account":"afiliado.es@fshion.me","pwd":"452017sz","linkid":"2147483573"},
    {"_aff_accountid":"76","_aff_type":"25","aff_type":"TradeDoubler","name":"tradedoubler.de@rosegal.com","account":"tradedoubler.de@rosegal.com","pwd":"8354619","linkid":"2147483572"},
    {"_aff_accountid":"77","_aff_type":"25","aff_type":"TradeDoubler","name":"tradedoubler.de@rosegal.com1","account":"tradedoubler.de@rosegal.com1","pwd":"806957@1","linkid":"2147483571"}
];
process.on('uncaughtException', function (err) {
    console.error('!!!uncaughtException', new Date().toString(), err.stack);
});
console.log('log start');
mainFunction();

function mainFunction(callback) {
    console.log('===mainFunction start', new Date().toString());
    async.waterfall([
        // function (cb) {
        //     Dbapi.sendMsg({json: {actionid: 131, noat: true}}, function (err, result) {
        //         tradeDoublerUser.length = 0;
        //        // console.log('get user err', err, 'result', JSON.stringify(result));
        //         result.accounts.account.forEach(function (account) {
        //             switch (account.aff_type) {
        //                 case 'TradeDoubler':
        //                     tradeDoublerUser.push(account);
        //                     break;
        //             }
        //         });
        //         cb(null);
        //     });
        // },
        function (cb) {
            let date={
                startDate:'5/01/17', //月日年
                endDate:'11/30/17'
            };
            if (dateNull) date = null;
            readTradeDoubler(date, function (err) {
                console.log('readTradeDoubler', 'end', err);
                cb(null);
            })
        },
    ], function (err) {
        console.log('===mainFunction end', 'err', err, new Date().toString());

        return setTimeout(function () {
         mainFunction()
         }, 1000 * 60 * 60 * 5)

    });
}


function readTradeDoubler(date, callback) {
    console.log('+++readTradeDoubler start', new Date().toString());
    console.log('tradeDoublerUser.length=',tradeDoublerUser.length);
    async.eachSeries(tradeDoublerUser, function (user, cb) {
        let date_str=JSON.stringify(date);
        let date_new=JSON.parse(date_str);
        tradeDoubler.getTransacion(user, date_new, cb)
    }, function (err) {
        callback(err);
    });
}
const async=require('async');
const cheerio = require('cheerio');
const request=require('request');
function get_doupai(callback) {
    request.get('http://www.doupai.cc/',function (err,res,body) {
        console.log(body);
        callback(err);
    });
}
let flag=true;
async.whilst(
    function () {
        return flag;
    },
    function (fn_cb) {
        get_doupai(function (err) {
            fn_cb(err);
        });
    },
    function (err) {
        console.log(err);
    });



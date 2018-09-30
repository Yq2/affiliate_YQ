let request = require('request');
let qs = require('querystring');
let https = require('https');
let http = require('http');
function FUNCTIONAPI() {

	this.combinUrl = function (obj) {
        let result = "";
		for (let prop in obj) {
			if (obj.hasOwnProperty(prop) && typeof obj[prop] !== 'function') {
				if (typeof obj[prop] === 'object') {
					result += prop + '=' + qs.escape(JSON.stringify(obj[prop])) + '&';
				} else {
					result += prop + '=' + qs.escape(obj[prop]) + '&';
				}
			}
		}
		return result;
	};

	this.postRequest = function (url, data, headers, auth, callback, query, type) {
        let _this = this;
		postRequest(url, data, headers, auth, function (err, body, headers) {
			if (err) {
				console.log(err);
				console.log('retrying......', url);
				setTimeout(function () {
					_this.postRequest(url, data, headers, auth, callback, query, type);
				}, 10*1000);
			} else {
				callback(err, body, headers);
			}
		}, query, type);
	};
	this.getRequest = function (url, data, headers, auth, callback) {
        let _this = this;
		getRequest(url, data, headers, auth, function (err, body, headers, res) {
			if (err) {
				console.log(err);
				console.log('retrying......', url);
				setTimeout(function () {
					_this.getRequest(url, data, headers, auth, callback);
				}, 10*1000);
			} else {
				callback(err, body, headers, res);
			}
		});
	};
	this.startEndDate = startEndDate;
	this.dateFormate = dateFormate;

	this.httpsRequest = function (options, data, callback) {
		if (typeof data !== 'string') data = qs.stringify(data);
        let body;
		const req = https.request(options, function (res) {
			res.setEncoding('utf8');
			res.on('data', function (chunk) {
				body = body ? body + chunk : chunk;
			});
			res.on('end', function () {
				callback(null, body, res)
			});
		});
		req.on('error', function (e) {
			callback(e, null);
		});
		req.write(data);
		req.end();
	};
	this.httpRequest = function (options, data, callback) {
		data = qs.stringify(data);
        let body;
		const req = http.request(options, function (res) {
			res.setEncoding('utf8');
			res.on('data', function (chunk) {
				body = body ? body + chunk : chunk;
			});
			res.on('end', function () {
				callback(null, body, res)
			});
		});
		req.on('error', function (e) {
			callback(e, null);
		});
		req.write(data);
		req.end();
	};

    // this.getDateIndex=function(startDate, endDate) {
    //     //startDate, endDate日期格式'2017-09-07'
    //     const DAYTIME = 1000 * 60 * 60 * 24;
    //     startDate = startDate.split('-');
    //     startDate = new Date(startDate[0], Number(startDate[1])-1, startDate[2]);
    //     endDate = endDate.split('-');
    //     endDate = new Date(endDate[0], Number(endDate[1])-1, endDate[2]);
    //     var nowDate = new Date();
    //     var startIndex = parseInt((startDate.getTime() - nowDate.getTime()) / DAYTIME);
    //     var endIndex = parseInt((endDate.getTime() - nowDate.getTime()) / DAYTIME);
    //     return {
    //         startIndex:startIndex,
    //         endIndex:endIndex
    //     }
    // }
}
function postRequest(url, data, headers, auth, callback, query, type) {
	type = type || 'form';
    let options = {
		url: url,
		timeout: 20*1000,
		rejectUnauthorized: false
	};
	if (data) options[type] = data;
	if (headers) options.headers = headers;
	if (auth) options.auth = auth;
	if (query) options.qs = query;

	request.post(options, function (err, res, body) {
		if (err) return callback(err);
		try {
			body = JSON.parse(body);
		} catch (e) {
		}
		callback(null, body, res.headers);
	});
}
function getRequest(url, data, headers, auth, callback) {
    let options = {
		url: url,
		timeout: 20*1000,
		rejectUnauthorized: false
	};
	if (data) options.qs = data;
	if (headers) options.headers = headers;
	if (auth) options.auth = auth;
	request.get(options, function (err, res, body) {
		if (err) return callback(err);
		try {
			body = JSON.parse(body);
		} catch (e) {

		}
		callback(null, body, res.headers, res);
		//callback(null, body, res);
	});
}

function startEndDate(startDayNum, endDayNum) {
    let startEndDate = {};
    let nowDay = new Date();
	nowDay = new Date(nowDay.getFullYear(), nowDay.getMonth(), nowDay.getDate(), 0, 0, 0, 0);
	//if (timeZone) nowDay.setHours(nowDay.getHours() - (8 - timeZone));

	nowDay.setDate(nowDay.getDate() + startDayNum);
    let startDayAr = nowDay.toLocaleDateString().split('-');
	startEndDate.startyear = parseInt(startDayAr[0]);
	startEndDate.startmonth = parseInt(startDayAr[1]);
	startEndDate.startday = parseInt(startDayAr[2]);

	nowDay.setDate(nowDay.getDate() + (endDayNum - startDayNum));
    let endDayAr = nowDay.toLocaleDateString().split('-');
	startEndDate.endyear = parseInt(endDayAr[0]);
	startEndDate.endmonth = parseInt(endDayAr[1]);
	startEndDate.endday = parseInt(endDayAr[2]);
	return startEndDate;

}

function dateFormate(dateStr, modefiyNum) {
	// '03/27/2017 12:10:34 UTC-0700'
	modefiyNum = 0;//时间目前无法修正
    let dateAr = dateStr.split(' ');
    let dayAr = dateAr[0].split('/');
    let timeAr = dateAr[1].split(':');
	//PM 12:00是中午十二點 AM 12:00是凌晨十二點
	if (dateStr.indexOf('AM') > 0) {
		if (Number(timeAr[0]) === 12) timeAr[0] = 0;
		//dayAr[1] = Number(dayAr[1]) + 1;
	} else if (dateStr.indexOf('PM') > 0) {
		if (Number(timeAr[0]) !== 12) {
			timeAr[0] = Number(timeAr[0]) + 12
		}
	}
	//注意月份
    let target = new Date(Number(dayAr[2]), Number(dayAr[0]) - 1, Number(dayAr[1]), (Number(timeAr[0]) + modefiyNum || 0), Number(timeAr[1]), Number(timeAr[2]), 0);
	//个位补零2017-3-7 1:2:3->2017-03-07 01:02:03
    let temMon = target.getMonth() + 1;
    let mon = temMon < 10 ? '0' + temMon : temMon;
    let day = target.getDate() < 10 ? '0' + target.getDate() : target.getDate();
    let hour = target.getHours() < 10 ? '0' + target.getHours() : target.getHours();
    let minu = target.getMinutes() < 10 ? '0' + target.getMinutes() : target.getMinutes();
    let sec = target.getSeconds() < 10 ? '0' + target.getSeconds() : target.getSeconds();
	return target.getFullYear() + '-' + mon + '-' + day + ' ' + hour + ':' + minu + ':' + sec;

}
module.exports = new FUNCTIONAPI();
let Functions = require('./function.js');

function Dbapi() {
	this.sendMsg = function (data, callback, lastCount) {
		lastCount = lastCount || 5;
		if (data.json.orders && data.json.orders.length === 0)return callback(null, null);
		if (data.json.website && data.json.orders) {
			data = parseData(data);
		}
        let dataUrl = Functions.combinUrl(data);
        let time = new Date().getTime();
        let _this = this;
		Functions.postRequest('http://localhost:8001/affiliate/save', dataUrl, null, null, function (err, resData) {
			console.log('Dbapi time:', new Date().getTime() - time);
			if (typeof resData === 'string' && lastCount > 1) {
				lastCount--;
				console.log('!!!!send err', lastCount, JSON.stringify(data));
				return _this.sendMsg(data, callback, lastCount)
			}
			callback(err, resData);
		});
		//callback(null, null);
	};
}
module.exports = new Dbapi();

function parseData(data) {
	data.json.orders.map(function (order) {
		if (!order.website) order.website = data.json.website;
		return order
	});
	delete data.json.website;
	return data;
}


#!/usr/bin/env node
var fs = require('fs');
var http = require('http');
var path = require('path');
var mysql = require('mysql');
//The url we want is `www.nodejitsu.com:1337/`
var current_rate_api = {
    host: 'api.coindesk.com',
    path: '/v1/bpi/currentprice.json',
    method: 'GET'
};
//var current_price = "http://api.coindesk.com/v1/bpi/currentprice.json"
//crontab -e: edit and add:
//*\1 * * * * /home/santi/ejercicios/bitcoin/find_btc_rate.js -> each 1 minutes

function twoDigits(d) {
    if(0 <= d && d < 10) return "0" + d.toString();
    if(-10 < d && d < 0) return "-0" + (-1*d).toString();
    return d.toString();
}

var toMysqlFormat = function(d) {
    return d.getUTCFullYear() + "-" + twoDigits(1 + d.getUTCMonth()) + "-" + twoDigits(d.getUTCDate()) + " " + twoDigits(d.getUTCHours()) + ":" + twoDigits(d.getUTCMinutes()) + ":" + twoDigits(d.getUTCSeconds());
};

var mysqlInsert = function(dolars, euros, gbp){
	var con = mysql.createConnection({
	  host: "localhost",
	  user: "root",
	  password: "root",
	  database: "bitcoin"
	});

	var rates = { USD: dolars, EUR: euros, GBP: gbp, time: toMysqlFormat(new Date()) };
	con.query('INSERT INTO exchange_rate SET ?', rates, function(err,res){
	  if(err) throw err;

	  console.log('Last insert ID:', res.insertId);
	});
	con.end(function(err) {
	  // The connection is terminated gracefully
	  // Ensures all previously enqueued queries are still
	  // before sending a COM_QUIT packet to the MySQL server.
	});
}

var on_received_rate = function(response) {
    var str = '', dolars, euros;
    response.on('data', function (chunk) {
        str += chunk;
    });

    response.on('end', function () {
        var btcdata = JSON.parse(str);
        var msg = '';
        if(btcdata && btcdata.bpi){
            dolars = btcdata.bpi.USD.rate_float;
            euros =  btcdata.bpi.EUR.rate_float;
			gbp = btcdata.bpi.GBP.rate_float;
            //console.log(str)
            msg = "1 bitcoin = " + dolars+"$ "+ euros +"€"+" "+(new Date()) +"\n";
            fs.appendFile(path.resolve(__dirname, 'bitcoin_rates.txt'), msg, function(err){
                if (err) throw err;
                //console.log('The "data to append" was appended to file!');
            });
			mysqlInsert(dolars, euros, gbp);
        }
    });
};
fs.appendFile(path.resolve(__dirname, 'called.txt'), 'called at '+(new Date()) +"\n", function(err){
    if (err) throw err;
    //console.log('The "data to append" was appended to file!');
});
var req = http.request(current_rate_api, on_received_rate);
//This is the data we are posting, it needs to be a string or a buffer
//req.write("hello world!");
req.end();
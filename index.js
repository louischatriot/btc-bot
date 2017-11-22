const Gdax = require('gdax');
const concat = require('concat-stream');
const Writable = require('stream').Writable;
const Transform = require('stream').Transform;

const publicClient = new Gdax.PublicClient("btc-eur");


var trades = publicClient.getProductTradeStream(5560405,5560622);
trades.on('error', err => { console.log(err); process.exit(1); })
trades.on('end', noMoreTrades);

//var timeSeries = [];
//var currentDirection;
//var previousTrade;
//var timeSeriesStream = Transform({ objectMode: true });
//timeSeriesStream._transform = function (trade, enc, next) {
  //console.log("======================");
  ////console.log(trade);

  //if (currentDirection === undefined) { previousTrade = trade; }   // First trade is always recorded

  //if (currentDirection === undefined || currentDirection !== trade.side) {
    //currentDirection = trade.side;
    //timeSeries.push({ price: previousTrade.price, time: previousTrade.time });   // Recording the previous trade once we change directions
    //this.push({ price: previousTrade.price, time: previousTrade.time });
  //}

  //previousTrade = trade;
  //next();
//}



var timeSeries = [];
var currentDirection;
var previousTrade;

var timeSeriesStream = Writable({ objectMode: true });
timeSeriesStream._write = function (trade, enc, next) {
  console.log("======================");
  console.log(trade);

  if (currentDirection === undefined) {
    previousTrade = trade;   // First trade is always recorded
  }

  if (currentDirection === undefined || currentDirection !== trade.side) {
    currentDirection = trade.side;
    timeSeries.push({ price: previousTrade.price, time: previousTrade.time });   // Recording the previous trade once we change directions
  }

  previousTrade = trade;
  next();
}





trades.pipe(timeSeriesStream);

function noMoreTrades () {
  console.log("======================================");
  console.log("===~ No more trades to be handled ~===");
  console.log(timeSeries);
  console.log("======================================");

  var sumOfPriceIncreases = 0;
  var min = max = timeSeries[0].price;
  for (var i = 0; i < timeSeries.length - 1; i += 1) {
    //console.log(typeof timeSeries[i].price);
    //console.log(timeSeries[i].price);
    sumOfPriceIncreases += Math.max(0, timeSeries[i+1].price - timeSeries[i].price);
    min = Math.min(min, timeSeries[i + 1].price);
    max = Math.max(max, timeSeries[i + 1].price);
  }

  console.log("Sum of all price increases: " + sumOfPriceIncreases);
  console.log("Minimum price of the period: " + min);
  console.log("Maximum price of the period: " + max);
  console.log("Delta between minimum and maximum on the period: " + (max - min));
}









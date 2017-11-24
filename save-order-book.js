const Gdax = require('gdax');
const concat = require('concat-stream');
const Writable = require('stream').Writable;
const Transform = require('stream').Transform;
const Nedb = require('nedb');
const Logger = require('nedb-logger')

const publicClient = new Gdax.PublicClient("btc-eur");
const orderBooksLogger = new Logger({ autoload: true
                                    , filename: 'data/order-books-logs.nedb'
                                    });
const movementsLogger = new Logger({ autoload: true
                                   , filename: 'data/movements-logs.nedb'
                                   });
const longPollIntervall = 1000;   // In ms

var startTimestamp = Date.now();


// Detecting ups and downs
var detectionThreshold = 0.0005;   // Don't react to movements less in size than this fraction of current price
var currentMovement;
var currentMax, currentMin;
var basePosition;


setInterval(function () {

  publicClient.getProductOrderBook({ level: 2 }, function (err, res, orderBook) {
    if (err || !orderBook) {
      console.log("Error");
      console.log(err); return;
    }

    augmentOrderBook(orderBook);
    orderBooksLogger.insert(orderBook, function () {});

    // Ups and dows analyzer
    if (!currentMax) { currentMax = orderBook.price; }
    if (!currentMin) { currentMin = orderBook.price; }
    if (!basePosition) { basePosition = orderBook.price; }

    if ((orderBook.price - basePosition > detectionThreshold * basePosition) && (currentMovement !== 'up')) {
      console.log("UP   movement starting at: " + (new Date()) + "   - and price: " + orderBook.price);
      currentMovement = 'up';
    }

    if ((orderBook.price - basePosition < - detectionThreshold * basePosition) && (currentMovement !== 'down')) {
      console.log("DOWN movement starting at: " + (new Date()) + "   - and price: " + orderBook.price);
      currentMovement = 'down';
    }

    if (orderBook.price > basePosition && currentMovement === 'up') { basePosition = orderBook.price; }
    if (orderBook.price < basePosition && currentMovement === 'down') { basePosition = orderBook.price; }



    console.log("Elapsed time (s): " + Math.floor((Date.now() - startTimestamp) / 1000));
  });

}, longPollIntervall);


// Make all numbers true numbers and add some metadata
function augmentOrderBook (orderBook) {
  orderBook.timestamp = Date.now();
  orderBook.date = new Date(orderBook.timestamp);
  orderBook.bids.forEach(function (d) {
    d[0] = parseFloat(d[0]);
    d[1] = parseFloat(d[1]);
  });

  orderBook.asks.forEach(function (d) {
    d[0] = parseFloat(d[0]);
    d[1] = parseFloat(d[1]);
  });

  orderBook.price = getMidMarketPrice(orderBook);
}

function saveOrderBook(orderBook) {
  augmentOrderBook(orderBook);
  orderBooks.insert(orderBook, function (err, newDoc) {
    console.log(Math.floor((newDoc.timestamp - startTimestamp) / 1000));
  });
}


function getMidMarketPrice (orderBook) {
  return (orderBook.bids[0][0] + orderBook.asks[0][0]) / 2;
}





// Websocket API is differential so could lead to errors
// Using the standard API with long polling instead
//const websocket = new Gdax.WebsocketClient( ['BTC-USD']
                                          //, 'wss://ws-feed.gdax.com'
                                          //, null
                                          //, { heartbeat: false, channels: [{ name: 'level2' }] }
                                          //);
//websocket.on('message', data => { console.log(data); });
//websocket.on('error', err => { console.log(err); });
//websocket.on('close', () => { console.log("Websocket Closed"); });


//websocket.send({
    //"type": "subscribe",
    //"product_ids": [
        //"ETH-USD",
        //"ETH-EUR"
    //],
    //"channels": [
        //"level2",
        //"heartbeat",
        //{
            //"name": "ticker",
            //"product_ids": [
                //"ETH-BTC",
                //"ETH-GBP"
            //]
        //},
    //]
//});




// OrderBookSync and Websocket APIs are very unclear
//const orderbookSync = new Gdax.OrderbookSync(['btc-eur']);
//console.log(orderbookSync.books['btc-eur'].state());


//setInterval(function () {
  //console.log(orderbookSync.books['btc-eur'].state());

//}, 1000);





const Writable = require('stream').Writable;
const Transform = require('stream').Transform;
const EventEmitter = require('events')
const Gdax = require('gdax');
const concat = require('concat-stream');
const Nedb = require('nedb');
const Logger = require('nedb-logger')

const GDAXCredentials = require('./credentials/gdax');

// Databases
const orderBooksLogger = new Logger({ autoload: true
                                    , filename: 'data/order-books-logs.nedb'
                                    });
const movementsLogger = new Logger({ autoload: true
                                   , filename: 'data/movements-logs.nedb'
                                   });
const trades = new Nedb({ autoload: true
                        , filename: 'data/trades.nedb'
                        });

const longPollIntervall = 700;   // In ms
const liveGDAXApiUrl = "https://api.gdax.com";
const testGDAXApiUrl = "https://api-public.sandbox.gdax.com";
const environment = ['dev', 'prod'].indexOf(process.env.BTCBOT_ENV) !== -1 ? process.env.BTCBOT_ENV : 'dev';

const publicClient = new Gdax.PublicClient("btc-eur");
const authedClient = new Gdax.AuthenticatedClient(GDAXCredentials.apiKey, GDAXCredentials.b64Secret, GDAXCredentials.passphrase, liveGDAXApiUrl);

class Btcbot extends EventEmitter {}
const btcbot = new Btcbot();



authedClient.getAccounts(function (err, res, accounts) {
  console.log("==========================");
  console.log(err);
  console.log(accounts);
});




return;   // Don't use process.exit or the code exits before receiving the results


// Up/down movement analyzer
var detectionThreshold = 0.0005;   // Don't react to movements less in size than this fraction of current price
var currentMovement;
var basePosition;

btcbot.on('new-order-book', function (orderBook) {
  if (!basePosition) { basePosition = orderBook.price; }

  if ((orderBook.price - basePosition > detectionThreshold * basePosition) && (currentMovement !== 'up')) {
    console.log("UP   movement starting at: " + (new Date()) + "   - and price: " + orderBook.price);
    movementsLogger.insert({ direction: 'up', date: new Date(), price: orderBook.price, orderBook: orderBook });
    currentMovement = 'up';
  }

  if ((orderBook.price - basePosition < - detectionThreshold * basePosition) && (currentMovement !== 'down')) {
    console.log("DOWN movement starting at: " + (new Date()) + "   - and price: " + orderBook.price);
    movementsLogger.insert({ direction: 'down', date: new Date(), price: orderBook.price, orderBook: orderBook });
    currentMovement = 'down';
  }

  if (orderBook.price > basePosition && currentMovement === 'up') { basePosition = orderBook.price; }
  if (orderBook.price < basePosition && currentMovement === 'down') { basePosition = orderBook.price; }
});



// Make all numbers true numbers (and not floats) and add some metadata
// Modifies the order book in place
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


function getMidMarketPrice (orderBook) {
  return (orderBook.bids[0][0] + orderBook.asks[0][0]) / 2;
}




// Main loop, long polling the order book changes
var startTimestamp = Date.now();
setInterval(function () {
  publicClient.getProductOrderBook({ level: 2 }, function (err, res, orderBook) {
    if (err || !orderBook) {
      console.log("Error");
      console.log(err); return;
    }

    augmentOrderBook(orderBook);
    orderBooksLogger.insert(orderBook, function () {});
    btcbot.emit('new-order-book', orderBook);
    console.log("Elapsed time (s): " + Math.floor((Date.now() - startTimestamp) / 1000));
  });
}, longPollIntervall)





const Gdax = require('gdax');
const concat = require('concat-stream')

const publicClient = new Gdax.PublicClient("btc-eur");

// Promise API actually still not released
//publicClient.getProducts().then(products => { console.log(products) });

//publicClient.getProductTrades({ limit: 5 }, function (err, res, trades) {
  //console.log(trades);
//});


// ~10k latest trades
var trades = publicClient.getProductTradeStream(5560619,5560622);



var concatStream = concat(receivedData)
trades.on('error', err => { console.log(err); process.exit(1); })
trades.pipe(concatStream)



function receivedData(data) {
  console.log(data);
}

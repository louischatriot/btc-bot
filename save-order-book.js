const Gdax = require('gdax');
const concat = require('concat-stream');
const Writable = require('stream').Writable;
const Transform = require('stream').Transform;
const Nedb = require('nedb');

const publicClient = new Gdax.PublicClient("btc-eur");
const orderBooks = new Nedb({ autoload: true
                            , filename: 'data/order-books.nedb'
                            });


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





const orderbookSync = new Gdax.OrderbookSync(['BTC-USD']);
//console.log(orderbookSync.books['ETH-USD'].state());
console.log(orderbookSync.book.state());

setInterval(function () { console.log(orderBooks.book); }, 1000);






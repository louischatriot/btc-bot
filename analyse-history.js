const Nedb = require('nedb');
const fs = require('fs');
const Papa = require('papaparse');

const orderBooks = new Nedb({ autoload: true
                            , filename: 'data/ob-snapshot-cut.nedb'
                            });

orderBooks.find({}).sort({ date: 1 }).exec(function (err, docs) {
  var data = getHistoricPriceData(docs);

  // Create a CSV to get visual aspect of historic data
  //fileContents = Papa.unparse(data);
  //fs.writeFileSync("data/ob-snap-cut-graph.csv", fileContents);

  getPriceIncreases(data);
});





function getMidMarketPrice (orderBook) {
  return (orderBook.bids[0][0] + orderBook.asks[0][0]) / 2;
}

function getHistoricPriceData (orderBooks) {
  var data = [], firstTimeStamp;
  orderBooks.forEach(function (ob) {
    if (!firstTimeStamp) { firstTimeStamp = ob.timestamp; }
    data.push({ timestamp: ob.timestamp, delta: Math.floor((ob.timestamp - firstTimeStamp) / 1000), price: getMidMarketPrice(ob) });
  });
  return data;
}

// Pinpoint price increases
// Only in a backward-looking way: data that has not been seen yet is not used to simulate real world conditions
// data is [{ timestamp, delta, price }, ...]
// Order book not used at this point
function getPriceIncreases (data) {
  var detectionThreshold = 0.0005;   // Don't react to movements less in size than this fraction of current price
  var currentMovement;
  var currentMax, currentMin;
  var basePosition;

  data.forEach(function (d) {
    if (!currentMax) { currentMax = d.price; }
    if (!currentMin) { currentMin = d.price; }
    if (!basePosition) { basePosition = d.price; }

    if ((d.price - basePosition > detectionThreshold * basePosition) && (currentMovement !== 'up')) {
      console.log("UP movement starting at: " + d.delta);
      currentMovement = 'up';
    }

    if ((d.price - basePosition < - detectionThreshold * basePosition) && (currentMovement !== 'down')) {
      console.log("DOWN movement starting at: " + d.delta);
      currentMovement = 'down';
    }

    if (d.price > basePosition && currentMovement === 'up') { basePosition = d.price; }
    if (d.price < basePosition && currentMovement === 'down') { basePosition = d.price; }
  });
}




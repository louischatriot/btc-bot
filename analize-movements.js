const Nedb = require('nedb');

const movements = new Nedb({ autoload: true
                            , filename: 'data/movements-logs.nedb'
                            });

movements.find({}).sort({ date: 1 }).exec(function (err, docs) {
  var gain = 0, thisTrade, min = docs[0].price, max = docs[0].price;

  docs.forEach(function (m) {
    if (thisTrade === undefined && m.direction === 'up') {
      thisTrade = m.price;
    } else {
      gain += m.price - thisTrade;
      thisTrade = undefined;
    }

    min = Math.min(min, m.price);
    max = Math.max(max, m.price);
  });

  console.log("Absolute gain on trading on one bitcoin: " + gain);
  console.log("Relative gain: " + (gain / docs[0].price));
  console.log("================================================");
  console.log("Beginning: " + docs[0].price);
  console.log("End: " + docs[docs.length - 1].price);
  console.log("Delta: " + (docs[docs.length - 1].price - docs[0].price));
  console.log("================================================");
  console.log("Minimum: " + min);
  console.log("Maximum: " + min);
  console.log("Delta: " + (max - min));
});


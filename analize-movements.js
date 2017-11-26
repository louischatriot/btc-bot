const Nedb = require('nedb');

const movements = new Nedb({ autoload: true
                            , filename: 'data/movements-logs.nedb'
                            });

movements.find({}).sort({ date: 1 }).exec(function (err, docs) {
  var gain = 0, thisTrade;

  docs.forEach(function (m) {
    if (thisTrade === undefined && m.direction === 'up') {
      thisTrade = m.price;
    } else {
      gain += m.price - thisTrade;
      thisTrade = undefined;
    }
  });

  console.log("Absolute gain on trading on one bitcoin: " + gain);
  console.log("Relative gain: " + (gain / docs[0].price));
});


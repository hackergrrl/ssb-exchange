var pull = require('pull-stream')
var path = require('path')
var fs = require('fs')
var ssbKeys = require('ssb-keys')

function createDbAndFeed (dir) {
  var keys = require('ssb-keys').loadOrCreateSync(path.join(dir, 'secret'))
  var ssb = require('secure-scuttlebutt/create')(path.join(dir, 'db'))
  var feed = ssb.createFeed(keys)
  return {ssb: ssb, feed: feed}
}

var alice = createDbAndFeed('alice')
var bob = createDbAndFeed('bob')

// alice.feed.add({ type: 'post', text: 'alice\'s First Post!' }, function (err, msg, hash) {
//   bob.feed.add({ type: 'post', text: 'bob\'s First Post!' }, function (err, msg, hash) {
//     var ws = bob.ssb.createWriteStream(function (err, writes) {
//       console.log('done', err, writes)
//     })
//     pull(
//       alice.ssb.createLogStream({keys: false, values: true}),
//       pull.asyncMap(function (msg, next) {
//         console.log('alice msg', msg)
//         bob.ssb.add(msg, next)
//       }),
//       pull.collect(function (err, msgs) {
//         console.log('wrote', msgs.length, 'to bob\'s db')
//       })
//     )
//   })
// })

// stream all messages for all keypairs.
// pull(
//   ssb.createFeedStream(),
//   pull.collect(function (err, ary) {
//     console.log(ary)
//   })
// )

printFeed(bob)

// stream all messages for a particular keypair.
function printFeed (db) {
  pull(
    db.ssb.createHistoryStream({id: db.feed.id, seq: 0}),
    // db.ssb.createLogStream({}),
    pull.drain(function (msg) {
      console.log(msg)
    })
  )
}

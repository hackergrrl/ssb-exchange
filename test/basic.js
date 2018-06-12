var test = require('tape')
var pull = require('pull-stream')
var path = require('path')
var fs = require('fs')
var ssbKeys = require('ssb-keys')
var through = require('through2')
var rimraf = require('rimraf')
var exchange = require('../')

function createDbAndFeed (dir) {
  var keys = require('ssb-keys').loadOrCreateSync(path.join(dir, 'secret'))
  var ssb = require('secure-scuttlebutt/create')(path.join(dir, 'db'))
  var feed = ssb.createFeed(keys)
  return {ssb: ssb, feed: feed}
}

// stream all messages for a particular keypair.
function printFeed (db) {
  pull(
    db.ssb.createHistoryStream({id: db.feed.id, seq: 0}),
    pull.drain(function (msg) {
      console.log(msg)
    })
  )
}

test('alice & bob', function (t) {
  t.plan(5)

  rimraf.sync('alice')
  rimraf.sync('bob')

  var alice = createDbAndFeed('alice')
  var bob = createDbAndFeed('bob')

  alice.feed.add({ type: 'post', text: 'alice\'s First Post!' }, function (err, msg, hash) {
    t.error(err)
    alice.feed.add({ type: 'post', text: 'alice\'s Second Post!' }, function (err, msg, hash) {
      t.error(err)
      bob.feed.add({ type: 'post', text: 'bob\'s First Post!' }, function (err, msg, hash) {
        t.error(err)
        sync()
      })
    })
  })

  function sync () {
    var r1 = exchange(alice.ssb, 'alice')
    var r2 = exchange(bob.ssb, 'bob')

    r1.pipe(r2).pipe(r1)

    r1.on('end', function () {
      pull(
        alice.ssb.createLogStream({keys: false, values: true}),
        pull.map(function (msg) {
          return [ msg.author, msg.sequence ]
        }),
        pull.collect(function (err, actual) {
          var expected = [
            [ alice.feed.id, 1 ],
            [ alice.feed.id, 2 ],
            [ bob.feed.id,   1 ]
          ]
          t.deepEquals(actual, expected)
        })
      )
    })

    r2.on('end', function () {
      pull(
        bob.ssb.createLogStream({keys: false, values: true}),
        pull.map(function (msg) {
          return [ msg.author, msg.sequence ]
        }),
        pull.collect(function (err, actual) {
          var expected = [
            [ bob.feed.id,   1 ],
            [ alice.feed.id, 1 ],
            [ alice.feed.id, 2 ]
          ]
          t.deepEquals(actual, expected)
        })
      )
    })
  }
})

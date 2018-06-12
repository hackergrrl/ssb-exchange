var pull = require('pull-stream')
var path = require('path')
var replicate = require('.')

var alice = createDbAndFeed('alice')
var bob = createDbAndFeed('bob')

alice.feed.add({ type: 'post', text: 'alice\'s First Post!' }, function (err, msg, hash) {
  alice.feed.add({ type: 'post', text: 'alice\'s Second Post!' }, function (err, msg, hash) {
    bob.feed.add({ type: 'post', text: 'bob\'s First Post!' }, function (err, msg, hash) {
      sync()
    })
  })
})

function sync () {
  var r1 = replicate(alice.ssb, 'alice')
  var r2 = replicate(bob.ssb, 'bob')

  r1.pipe(r2).pipe(r1)

  r1.on('end', function () {
    pull(
      alice.ssb.createLogStream({keys: false, values: true}),
      pull.drain(console.log)
    )
  })
}

function createDbAndFeed (dir) {
  var keys = require('ssb-keys').loadOrCreateSync(path.join(dir, 'secret'))
  var ssb = require('secure-scuttlebutt/create')(path.join(dir, 'db'))
  var feed = ssb.createFeed(keys)
  return {ssb: ssb, feed: feed}
}


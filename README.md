# ssb-exchange

> fully exchange two secure-scuttlebutt databases over a duplex stream

## Usage

```js
var replicate = require('ssb-exchange')
var path = require('path')
var pull = require('pull-stream')

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
  var r1 = exchange(alice.ssb, 'alice')
  var r2 = exchange(bob.ssb, 'bob')

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
```

outputs

```
{ previous: null,
  sequence: 1,
  author: '@6VKBcLTLgL8vDuLHtgFlYEg/yTgYqI1WoPENQrzJNs4=.ed25519',
  timestamp: 1528823339650,
  hash: 'sha256',
  content: { type: 'post', text: 'alice\'s First Post!' },
  signature: 'aBLQHwohD2FlTtLU1tsrFovoRQk+cTjgEi2SWZw+A1/Z+RlkDuRvFDplwI9oATzAprWhm1KuA69D9dUAnzMICA==.sig.ed25519' }
{ previous: '%spHHU8AUpoLU7+tTvdPrfFoGmST/twD/xRH0Jd2Jhgw=.sha256',
  sequence: 2,
  author: '@6VKBcLTLgL8vDuLHtgFlYEg/yTgYqI1WoPENQrzJNs4=.ed25519',
  timestamp: 1528823339700,
  hash: 'sha256',
  content: { type: 'post', text: 'alice\'s Second Post!' },
  signature: 'mZJqo73/jHAyoOajkInsAMicSx/iTvZg0f5FONuXspuXfzkxKtVUH8atYFmL5JNPxEXc6IR0dhpeMhAN/CHZDg==.sig.ed25519' }
{ previous: null,
  sequence: 1,
  author: '@SWgLOnMBG7wEnmyP+vjueVluNj46IYRiktfyErVbjhA=.ed25519',
  timestamp: 1528823339717,
  hash: 'sha256',
  content: { type: 'post', text: 'bob\'s First Post!' },
  signature: 'xrhWyHx129zjk7Bg2CPUQtASqehoeK7Yp6m9n3Yd2DgtMLzDlj1LPBCQIEglnUK2h7uLzKZQnAFrDrYjLYopAQ==.sig.ed25519' }
```

## API

```js
var replicate = require('ssb-exchange')
```

### var stream = replicate(ssb)

Returns a duplex stream, `stream`, that can be piped into another ssb-exchange
duplex stream. The two will exchange information about what feeds they have, and
send only new information to the other end. The stream terminates once all data
has been sent and written to the local ssb database.

## Install

With [npm](https://npmjs.org/) installed, run

```
$ npm install ssb-exchange
```

## License

ISC

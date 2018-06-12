var pull = require('pull-stream')
var cat = require('pull-cat')
var path = require('path')
var fs = require('fs')
var ssbKeys = require('ssb-keys')
var through = require('through2')

module.exports = function (ssb, name) {
  var t = through.obj(write)

  var localClock = null
  var remoteClock = null
  var localDone = false
  var remoteDone = false

  ssb.getVectorClock(function (err, clock) {
    if (err) return t.emit('error', err)
    // console.log('local', clock)
    localClock = clock
    t.push(clock)
    computeAndSend()
  })

  return t

  function write (data, _, next) {
    if (!remoteClock) {
      remoteClock = data
      computeAndSend()
      next()
    } else if (data === 'done') {
      remoteDone = true 
      if (localDone && remoteDone) t.push(null)
      next()
    } else if (remoteDone) {
      next()
    } else {
      // console.log('add to', name, 'db', data)
      ssb.add(data, function (err) {
        next(err)
      })
    }
  }

  function computeAndSend () {
    if (!localClock || !remoteClock) return
    var toSend = computeWhatToSend(localClock, remoteClock)
    // console.log('gonna send from', name, toSend)
    var sources = Object.keys(toSend)
      .map(function (key) {
        return ssb.createHistoryStream({id: key, seq: toSend[key], keys: false, values: true})
      })
    pull(
      cat(sources),
      pull.drain(function (msg) {
      // console.log('sending from', name, msg)
        t.push(msg)
      }, function () {
        t.push('done')
        localDone = true
        if (localDone && remoteDone) t.push(null)
      })
    )
  }
}

function computeWhatToSend (myClock, yourClock) {
  var res = {}
  Object.keys(myClock).forEach(function (key) {
    // remote feed knows at least as much as we do
    if (yourClock[key] && yourClock[key] >= myClock[key]) return

    // send their clock seq and onward
    res[key] = yourClock[key] || 0
  })
  return res
}

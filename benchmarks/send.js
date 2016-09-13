const Benchmark = require('benchmark')
const pull = require('pull-stream')
const pair = require('pull-pair/duplex')
const PeerId = require('peer-id')
const crypto = require('libp2p-crypto')
const pushable = require('pull-pushable')

const secio = require('../src')

const suite = new Benchmark.Suite('secio')
const ids = []

suite.add('createKey', function (d) {
  crypto.generateKeyPair('RSA', 2048, (err, key) => {
    const id = PeerId.createFromPrivKey(key.bytes)
    ids.push(id)
    d.resolve()
  })
}, {
  defer: true
})
.add('send', function (d) {
  const p = pair()

  createSession(p[0], (err, local) => {
    if (err) throw err
    createSession(p[1], (err, remote) => {
      if (err) throw err
      sendMessages(local, remote)
    })
  })

  function sendMessages (local, remote) {
    pull(
      pull.infinite(),
      pull.take(100),
      pull.map((val) => Buffer(val.toString())),
      local
    )

    pull(
      remote,
      pull.take(100),
      pull.collect((err, chunks) => {
        if (err) throw err
        if (chunks.length !== 100) throw new Error('Did not receive enough chunks')
        d.resolve()
      })
    )
  }
}, {
  defer: true
})
.on('cycle', (event) => {
  console.log(String(event.target))
})
// run async
.run({
  'async': true
})


function createSession (insecure, cb) {
  crypto.generateKeyPair('RSA', 2048, (err, key) => {
    if (err) return cb(err)
    const id = PeerId.createFromPrivKey(key.bytes)

    cb(null, secio.encrypt(id, key, insecure))
  })
}

'use strict'

/* eslint-disable no-console */

const Benchmark = require('benchmark')
const PeerId = require('peer-id')

const pipe = require('it-pipe')
const { reduce } = require('streaming-iterables')
const DuplexPair = require('it-pair/duplex')

const secio = require('..')

const suite = new Benchmark.Suite('secio')
let peers

async function sendData (a, b, opts, finish) {
  opts = Object.assign({ times: 1, size: 100 }, opts)

  let i = opts.times

  pipe(
    function * () {
      while (i--) {
        yield Buffer.allocUnsafe(opts.size)
      }
    },
    a.sink
  )

  const res = await pipe(
    b.source,
    reduce((acc, val) => acc + val.length, 0)
  )

  if (res !== opts.times * opts.size) {
    throw new Error('Did not receive enough chunks')
  }
}

suite.add('create peers for test', async () => {
  peers = await Promise.all([
    PeerId.createFromJSON(require('./peer-a')),
    PeerId.createFromJSON(require('./peer-b'))
  ])
})

suite.add('establish an encrypted channel', async () => {
  const p = DuplexPair()

  const peerA = peers[0]
  const peerB = peers[1]

  const aToB = await secio.secureInbound(peerA, p[0], peerB)
  const bToA = await secio.secureOutbound(peerB, p[1], peerA)

  await sendData(aToB.conn, bToA.conn, {})
})

const cases = [
  [10, 262144],
  [100, 262144],
  [1000, 262144]
  // [10000, 262144],
  // [100000, 262144],
  // [1000000, 262144]
]
cases.forEach((el) => {
  const times = el[0]
  const size = el[1]

  suite.add(`send plaintext ${times} x ${size} bytes`, async () => {
    const p = DuplexPair()

    await sendData(p[0], p[1], { times: times, size: size })
  })

  suite.add(`send encrypted ${times} x ${size} bytes`, async () => {
    const p = DuplexPair()

    const peerA = peers[0]
    const peerB = peers[1]

    const aToB = await secio.secureInbound(peerA, p[0], peerB)
    const bToA = await secio.secureOutbound(peerB, p[0], peerA)

    await sendData(aToB.conn, bToA.conn, { times: times, size: size })
  })
})

suite.on('cycle', (event) => {
  console.log(String(event.target))
})

// run async
suite.run({ async: true })

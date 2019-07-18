'use strict'

const mh = require('multihashing-async')
const lp = require('pull-length-prefixed')
const pull = require('pull-stream/pull')
const values = require('pull-stream/sources/values')
const collect = require('pull-stream/sinks/collect')
const crypto = require('libp2p-crypto')

exports.exchanges = [
  'P-256',
  'P-384',
  'P-521'
]

exports.ciphers = [
  'AES-256',
  'AES-128'
]

exports.hashes = [
  'SHA256',
  'SHA512'
]

// Determines which algorithm to use.  Note:  f(a, b) = f(b, a)
exports.theBest = (order, p1, p2) => {
  let first
  let second

  if (order < 0) {
    first = p2
    second = p1
  } else if (order > 0) {
    first = p1
    second = p2
  } else {
    return p1[0]
  }

  for (let firstCandidate of first) {
    for (let secondCandidate of second) {
      if (firstCandidate === secondCandidate) {
        return firstCandidate
      }
    }
  }

  throw new Error('No algorithms in common!')
}

exports.makeMacAndCipher = async (target) => {
  const macAndCipher = [ // they will run in parallel
    makeMac(target.hashT, target.keys.macKey),
    makeCipher(target.cipherT, target.keys.iv, target.keys.cipherKey)
  ]

  target.mac = await macAndCipher[0] // ..but get awaited after each other
  target.cipher = await macAndCipher[1]
}

function makeMac (hash, key) {
  return crypto.hmac.create(hash, key)
}

function makeCipher (cipherType, iv, key) {
  if (cipherType === 'AES-128' || cipherType === 'AES-256') {
    return crypto.aes.create(key, iv)
  }

  // TODO: figure out if Blowfish is needed and if so find a library for it.
  throw new Error(`unrecognized cipher type: ${cipherType}`)
}

exports.selectBest = async (local, remote) => {
  const oh1 = await exports.digest(Buffer.concat([
    remote.pubKeyBytes,
    local.nonce
  ]))
  const oh2 = await exports.digest(Buffer.concat([
    local.pubKeyBytes,
    remote.nonce
  ]))

  const order = Buffer.compare(oh1, oh2)

  if (order === 0) {
    throw new Error('you are trying to talk to yourself')
  }

  return {
    curveT: exports.theBest(order, local.exchanges, remote.exchanges),
    cipherT: exports.theBest(order, local.ciphers, remote.ciphers),
    hashT: exports.theBest(order, local.hashes, remote.hashes),
    order
  }
}

exports.digest = (buf) => {
  return mh.digest(buf, 'sha2-256', buf.length)
}

exports.write = function write (state, msg) {
  return new Promise((resolve, reject) => {
    pull(
      values([msg]),
      lp.encode({ fixed: true, bytes: 4 }),
      collect((err, res) => {
        if (err) {
          return reject(err)
        }
        state.shake.write(res[0])
        resolve()
      })
    )
  })
}

exports.read = function read (reader) {
  return new Promise((resolve, reject) => {
    lp.decodeFromReader(reader, { fixed: true, bytes: 4 }, (err, res) => err ? reject(err) : resolve(res))
  })
}

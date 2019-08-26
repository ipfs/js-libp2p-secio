'use strict'
/**
 * @module support
 */

const mh = require('multihashing-async')
const lp = require('pull-length-prefixed')
const pull = require('pull-stream/pull')
const values = require('pull-stream/sources/values')
const collect = require('pull-stream/sinks/collect')
const crypto = require('libp2p-crypto')
const parallel = require('async/parallel')

/**
 * @exports support/exchanges
 */
exports.exchanges = [
  'P-256',
  'P-384',
  'P-521'
]

/**
 * @exports support/ciphers
 */
exports.ciphers = [
  'AES-256',
  'AES-128'
]

/**
 * @exports support/hashes
 */
exports.hashes = [
  'SHA256',
  'SHA512'
]

/**
 *  @exports support/theBest
 * Determines which algorithm to use.  Note:  f(a, b) = f(b, a)
 * @param {number} order
 * @param {Array<*>} p1
 * @param {*} p2
 */
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
/**
 * @param {object} target
 * @param {function} callback
 */
exports.makeMacAndCipher = (target, callback) => {
  parallel([
    (cb) => makeMac(target.hashT, target.keys.macKey, cb),
    (cb) => makeCipher(target.cipherT, target.keys.iv, target.keys.cipherKey, cb)
  ], (err, macAndCipher) => {
    if (err) {
      return callback(err)
    }

    target.mac = macAndCipher[0]
    target.cipher = macAndCipher[1]
    callback()
  })
}

function makeMac (hash, key, callback) {
  crypto.hmac.create(hash, key, callback)
}

function makeCipher (cipherType, iv, key, callback) {
  if (cipherType === 'AES-128' || cipherType === 'AES-256') {
    return crypto.aes.create(key, iv, callback)
  }

  // TODO: figure out if Blowfish is needed and if so find a library for it.
  callback(new Error(`unrecognized cipher type: ${cipherType}`))
}

/**
 * @param {object} local
 * @param {object} remote
 * @param {function} cb
 */
exports.selectBest = (local, remote, cb) => {
  exports.digest(Buffer.concat([
    remote.pubKeyBytes,
    local.nonce
  ]), (err, oh1) => {
    if (err) {
      return cb(err)
    }

    exports.digest(Buffer.concat([
      local.pubKeyBytes,
      remote.nonce
    ]), (err, oh2) => {
      if (err) {
        return cb(err)
      }

      const order = Buffer.compare(oh1, oh2)

      if (order === 0) {
        return cb(new Error('you are trying to talk to yourself'))
      }

      cb(null, {
        curveT: exports.theBest(order, local.exchanges, remote.exchanges),
        cipherT: exports.theBest(order, local.ciphers, remote.ciphers),
        hashT: exports.theBest(order, local.hashes, remote.hashes),
        order
      })
    })
  })
}

/**
 * @param {Buffer} buf
 * @param {function} cb
 */
exports.digest = (buf, cb) => {
  mh.digest(buf, 'sha2-256', buf.length, cb)
}

/**
 * @param {object} state
 * @param {string} msg
 * @param {function} cb
 */
exports.write = function write (state, msg, cb) {
  cb = cb || (() => {})
  pull(
    values([msg]),
    lp.encode({ fixed: true, bytes: 4 }),
    collect((err, res) => {
      if (err) {
        return cb(err)
      }
      state.shake.write(res[0])
      cb()
    })
  )
}

/**
 * @param {*} reader
 * @param {function} cb
 */
exports.read = function read (reader, cb) {
  lp.decodeFromReader(reader, { fixed: true, bytes: 4 }, cb)
}

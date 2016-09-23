'use strict'

const debug = require('debug')

const support = require('../support')
const crypto = require('./crypto')

const log = debug('libp2p:secio')
log.error = debug('libp2p:secio:error')

// step 2. Exchange
// -- exchange (signed) ephemeral keys. verify signatures.
module.exports = function exchange (state, cb) {
  log('2. exchange - start')

  log('2. exchange - writing exchange')
  crypto.createExchange(state, (err, ex) => {
    if (err) {
      return cb(err)
    }

    support.write(state, ex)
    support.read(state.shake, (err, msg) => {
      if (err) {
        return cb(err)
      }

      log('2. exchange - reading exchange')

      crypto.verify(state, msg, (err) => {
        if (err) {
          return cb(err)
        }

        try {
          crypto.generateKeys(state)
        } catch (err) {
          return cb(err)
        }

        log('2. exchange - finish')
        cb()
      })
    })
  })
}

'use strict'

const debug = require('debug')

const support = require('../support')
const crypto = require('./crypto')

const log = debug('libp2p:secio')
log.error = debug('libp2p:secio:error')

// step 1. Propose
// -- propose cipher suite + send pubkeys + nonce
module.exports = async function propose (state, wrapped) {
  log('1. propose - start')

  log('1. propose - writing proposal')
  await wrapped.writeSingle(crypto.createProposal(state))

  log('1. propose - reading proposal')
  const msg = await wrapped.readSingle()
  log('1. propose - read proposal', msg)

  await crypto.identify(state, msg)
  await crypto.selectProtocols(state)

  log('1. propose - finish')
}

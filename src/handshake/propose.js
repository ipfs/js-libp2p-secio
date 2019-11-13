'use strict'

const crypto = require('./crypto')

const debug = require('debug')
const log = debug('libp2p:secio')
log.error = debug('libp2p:secio:error')

// step 1. Propose
// -- propose cipher suite + send pubkeys + nonce
module.exports = async function propose (state, wrapped) {
  log('1. propose - start')

  log('1. propose - writing proposal')
  await wrapped.writeLP(crypto.createProposal(state))

  log('1. propose - reading proposal')
  const msg = (await wrapped.readLP()).slice()
  log('1. propose - read proposal', msg.slice())

  await crypto.identify(state, msg.slice())
  await crypto.selectProtocols(state)

  log('1. propose - finish')
}

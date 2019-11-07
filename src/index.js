'use strict'

const assert = require('assert')
const debug = require('debug')
const log = debug('libp2p:secio')
log.error = debug('libp2p:secio:error')

const handshake = require('./handshake')
const State = require('./state')
const Wrap = require('it-pb-rpc')

async function secure (localPeer, duplex, remotePeer) { // returns duplex
  assert(localPeer, 'no local private key provided')
  assert(duplex, 'no connection for the handshake provided')

  const timeout = 60 * 1000 * 5
  const state = new State(localPeer, remotePeer, timeout)

  const wrapped = Wrap(duplex)
  await handshake(state, wrapped)

  return state.secure
}

module.exports = {
  protocol: '/secio/1.0.0',

  // since SECIO is symetric, we only need one function here
  secureInbound: secure,
  secureOutbound: secure
}

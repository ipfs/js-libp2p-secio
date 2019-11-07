'use strict'

const debug = require('debug')
const log = debug('libp2p:secio')
log.error = debug('libp2p:secio:error')

const DuplexPair = require('it-pair/duplex')
const pipe = require('it-pipe')

const etm = require('../etm')
const crypto = require('./crypto')

// step 3. Finish
// -- send expected message to verify encryption works (send local nonce)
module.exports = async function finish (state, wrapped) {
  log('3. finish - start')

  const proto = state.protocols

  wrapped.write(state.proposal.in.rand)
  const nonceBack = await wrapped.read(state.proposal.in.rand.length)

  crypto.verifyNonce(state, nonceBack.slice())

  log('3. finish - finish')

  const network = wrapped.unwrap()
  const [secure, user] = DuplexPair()

  pipe(
    secure.source, // this is FROM the user
    etm.createBoxStream(proto.local.cipher, proto.local.mac),
    network.sink // and gets piped INTO the network
  )

  pipe(
    network.source, // this is FROM the network
    etm.createUnboxStream(proto.remote.cipher, proto.remote.mac),
    secure.sink // and gets piped TO the user
  )

  // Awesome that's all folks.
  state.secure = user
}

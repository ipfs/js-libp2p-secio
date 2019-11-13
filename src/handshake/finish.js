'use strict'

const debug = require('debug')
const log = debug('libp2p:secio')
log.error = debug('libp2p:secio:error')

const DuplexPair = require('it-pair/duplex')
const pipe = require('it-pipe')
const lp = require('it-length-prefixed')
const ensureBuffer = require('it-buffer')

const etm = require('../etm')
const crypto = require('./crypto')

const lengthEncoder = (value, target, offset) => {
  target = target || Buffer.allocUnsafe(4)
  target.writeInt32BE(value, offset)
  return target
}
lengthEncoder.bytes = 4 // Always because fixed length

// TODO: maybe make this part of it-length-prefixed?
const lpOptions = {
  lengthEncoder
}

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
    ensureBuffer,
    etm.createBoxStream(proto.local.cipher, proto.local.mac),
    lp.encode(lpOptions),
    network.sink // and gets piped INTO the network
  )

  pipe(
    network.source, // this is FROM the network
    lp.decode(lpOptions),
    ensureBuffer,
    etm.createUnboxStream(proto.remote.cipher, proto.remote.mac),
    secure.sink // and gets piped TO the user
  )

  // Awesome that's all folks.
  state.secure = user
}

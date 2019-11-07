'use strict'

const debug = require('debug')
const log = debug('libp2p:secio')
log.error = debug('libp2p:secio:error')

const etm = require('../etm')
const crypto = require('./crypto')

// step 3. Finish
// -- send expected message to verify encryption works (send local nonce)
module.exports = async function finish (state) {
  log('3. finish - start')

  const proto = state.protocols
  const stream = state.shake.rest()
  const shake = handshake({ timeout: state.timeout }, (err) => { // TODO: refactor this to catch error
    if (err) {
      throw err
    }
  })

  pull(
    stream,
    etm.createUnboxStream(proto.remote.cipher, proto.remote.mac),
    shake,
    etm.createBoxStream(proto.local.cipher, proto.local.mac),
    stream
  )

  const fail = (err) => {
    log.error(err)
    state.secure.resolve({
      source: pullError(err),
      sink (read) {
      }
    })
    throw err
  }

  shake.handshake.write(state.proposal.in.rand)
  const nonceBack = await shake.handshake.read(state.proposal.in.rand.length) // FIXME: this isn't async? need prom() wrapper

  try {
    crypto.verifyNonce(state, nonceBack)
  } catch (err) {
    return fail(err)
  }

  log('3. finish - finish')

  // Awesome that's all folks.
  state.secure.resolve(shake.handshake.rest())
}

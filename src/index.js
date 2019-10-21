'use strict'

const assert = require('assert')
const PeerInfo = require('peer-info')
const debug = require('debug')
const log = debug('libp2p:secio')
log.error = debug('libp2p:secio:error')

const handshake = require('./handshake')
const State = require('./state')

async function secure (localPeer, duplex, remotePeer) {
  /* assert(localId, 'no local private key provided')
  assert(conn, 'no connection for the handshake  provided')

  const timeout = 60 * 1000 * 5
  const state = new State(localId, remoteId, timeout)

  const { handler, awaitConnected } = handshake(state)

  const encryptedConnection = new Connection(undefined, conn)
  encryptedConnection.awaitConnected = (async () => { // NOTE: all errors this throws should ideally be also sent down the wire of the connection
    await awaitConnected

    await new Promise((resolve, reject) => { // TODO: promisify
      conn.getPeerInfo((err, peerInfo) => {
        encryptedConnection.setInnerConn(new Connection(state.secure, conn))

        if (err) { // no peerInfo yet, means I'm the receiver
          encryptedConnection.setPeerInfo(new PeerInfo(state.id.remote))
        }

        resolve()
      })
    })
  })()

  pull(
    conn,
    handler,
    conn
  )

  return encryptedConnection */
}

module.exports = {
  protocol: '/secio/1.0.0',

  // since SECIO is symetric, we only need one function here
  secureInbound: secure,
  secureOutbound: secure

}

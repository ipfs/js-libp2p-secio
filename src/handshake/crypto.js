'use strict'

const protobuf = require('protocol-buffers')
const PeerId = require('peer-id')
const crypto = require('libp2p-crypto')
const debug = require('debug')
const log = debug('libp2p:secio')
log.error = debug('libp2p:secio:error')

const pbm = protobuf(require('./secio.proto'))

const support = require('../support')

// nonceSize is the size of our nonces (in bytes)
const nonceSize = 16

exports.createProposal = (state) => {
  state.proposal.out = {
    rand: support.randomBytes(nonceSize),
    pubkey: state.key.local.public.bytes,
    exchanges: support.exchanges.join(','),
    ciphers: support.ciphers.join(','),
    hashes: support.hashes.join(',')
  }

  state.proposalEncoded.out = pbm.Propose.encode(state.proposal.out)
  return state.proposalEncoded.out
}

exports.createExchange = (state, cb) => {
  const res = crypto.generateEphemeralKeyPair(state.protocols.local.curveT)
  state.ephemeralKey.local = res.key
  state.shared.generate = res.genSharedKey

  // Gather corpus to sign.
  const selectionOut = Buffer.concat([
    state.proposalEncoded.out,
    state.proposalEncoded.in,
    state.ephemeralKey.local
  ])

  state.key.local.sign(selectionOut, (err, sig) => {
    if (err) {
      return cb(err)
    }

    state.exchange.out = {
      epubkey: state.ephemeralKey.local,
      signature: sig
    }

    cb(null, pbm.Exchange.encode(state.exchange.out))
  })
}

exports.identify = (state, msg) => {
  log('1.1 identify')

  state.proposalEncoded.in = msg
  state.proposal.in = pbm.Propose.decode(msg)
  const pubkey = state.proposal.in.pubkey

  state.key.remote = crypto.unmarshalPublicKey(pubkey)
  state.id.remote = PeerId.createFromPubKey(pubkey.toString('base64'))

  log('1.1 identify - %s - identified remote peer as %s', state.id.local.toB58String(), state.id.remote.toB58String())
}

exports.selectProtocols = (state, cb) => {
  log('1.2 selection')

  const local = {
    pubKeyBytes: state.key.local.public.bytes,
    exchanges: support.exchanges,
    hashes: support.hashes,
    ciphers: support.ciphers,
    nonce: state.proposal.out.rand
  }

  const remote = {
    pubKeyBytes: state.proposal.in.pubkey,
    exchanges: state.proposal.in.exchanges.split(','),
    hashes: state.proposal.in.hashes.split(','),
    ciphers: state.proposal.in.ciphers.split(','),
    nonce: state.proposal.in.rand
  }

  support.selectBest(local, remote, (err, selected) => {
    if (err) {
      return cb(err)
    }
    // we use the same params for both directions (must choose same curve)
    // WARNING: if they dont SelectBest the same way, this won't work...
    state.protocols.remote = {
      order: selected.order,
      curveT: selected.curveT,
      cipherT: selected.cipherT,
      hashT: selected.hashT
    }

    state.protocols.local = {
      order: selected.order,
      curveT: selected.curveT,
      cipherT: selected.cipherT,
      hashT: selected.hashT
    }
    cb()
  })
}

exports.verify = (state, msg, cb) => {
  log('2.1. verify')

  state.exchange.in = pbm.Exchange.decode(msg)
  state.ephemeralKey.remote = state.exchange.in.epubkey

  const selectionIn = Buffer.concat([
    state.proposalEncoded.in,
    state.proposalEncoded.out,
    state.ephemeralKey.remote
  ])

  state.key.remote.verify(selectionIn, state.exchange.in.signature, (err, sigOk) => {
    if (err) {
      return cb(err)
    }

    if (!sigOk) {
      return cb(new Error('Bad signature'))
    }

    log('2.1. verify - signature verified')
    cb()
  })
}

exports.generateKeys = (state) => {
  log('2.2. keys')

  state.shared.secret = state.shared.generate(state.exchange.in.epubkey)

  const keys = crypto.keyStretcher(
    state.protocols.local.cipherT,
    state.protocols.local.hashT,
    state.shared.secret
  )

  // use random nonces to decide order.
  if (state.protocols.local.order > 0) {
    state.protocols.local.keys = keys.k1
    state.protocols.remote.keys = keys.k2
  } else if (state.protocols.local.order < 0) {
    // swap
    state.protocols.local.keys = keys.k2
    state.protocols.remote.keys = keys.k1
  } else {
    // we should've bailed before state. but if not, bail here.
    throw new Error('you are trying to talk to yourself')
  }

  log('2.3. mac + cipher')

  support.makeMacAndCipher(state.protocols.local)
  support.makeMacAndCipher(state.protocols.remote)
}

exports.verifyNonce = (state, n2) => {
  const n1 = state.proposal.out.rand

  if (n1.equals(n2)) return

  throw new Error(
    `Failed to read our encrypted nonce: ${n1.toString('hex')} != ${n2.toString('hex')}`
  )
}

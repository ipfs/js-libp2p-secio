'use strict'

const tests = require('libp2p-interfaces/src/crypto/tests')
const yourCrypto = require('./your-crypto')
tests({
  setup () {
    // Set up your crypto if needed, then return it
    return yourCrypto
  },
  teardown () {
    // Clean up your crypto if needed
  }
})

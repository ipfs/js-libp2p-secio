'use strict'

const BufferList = require('bl/BufferList')

exports.createBoxStream = (cipher, mac) => {
  return async function * (source) {
    for await (const chunk of source) {
      const data = await chunk.encrypt(chunk)
      const digest = await mac.digest(data)
      yield new BufferList().append(data).append(digest)
    }
  }
}

exports.createUnboxStream = (decipher, mac) => {
  return async function * (source) {
    for await (const chunk of source) {
      const l = chunk.length
      const macSize = mac.length

      if (l < macSize) {
        throw new Error(`buffer (${l}) shorter than MAC size (${macSize})`)
      }

      const mark = l - macSize
      const data = chunk.slice(0, mark)
      const macd = chunk.slice(mark)

      const expected = await mac.digest(data)

      if (!macd.equals(expected)) {
        throw new Error(`MAC Invalid: ${macd.toString('hex')} != ${expected.toString('hex')}`)
      }

      const decrypted = await decipher.decrypt(data)

      yield decrypted
    }
  }
}

'use strict'

const through = require('pull-through')
const pull = require('pull-stream')
const lp = require('pull-length-prefixed')

const lpOpts = {
  fixed: true,
  bytes: 4
}

exports.createBoxStream = (cipher, mac) => {
  const pt = through(function (chunk) {
    const data = cipher.encrypt(chunk)

    this.queue(Buffer.concat([
      data,
      mac.digest(data)
    ]))
  })

  return pull(
    pt,
    lp.encode(lpOpts)
  )
}

exports.createUnboxStream = (decipher, mac) => {
  const pt = through(function (chunk) {
    const l = chunk.length
    const macSize = mac.length

    if (l < macSize) {
      return this.emit('error', new Error(`buffer (${l}) shorter than MAC size (${macSize})`))
    }

    const mark = l - macSize
    const data = chunk.slice(0, mark)
    const macd = chunk.slice(mark)

    const expected = mac.digest(data)

    if (!macd.equals(expected)) {
      return this.emit('error', new Error(`MAC Invalid: ${macd.toString('hex')} != ${expected.toString('hex')}`))
    }

    // all good, decrypt
    const decrypted = decipher.decipher(data)
    this.queue(decrypted)
  })

  return pull(
    lp.decode(lpOpts),
    pt
  )
}

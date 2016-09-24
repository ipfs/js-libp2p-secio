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
    cipher.encrypt(chunk, (err, data) => {
      if (err) {
        return this.emit('error', err)
      }

      mac.digest(data, (err, digest) => {
        if (err) {
          return this.emit('error', err)
        }

        this.queue(Buffer.concat([
          data,
          digest
        ]))
      })
    })
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

    mac.digest(data, (err, expected) => {
      if (err) {
        return this.emit('error', err)
      }

      if (!macd.equals(expected)) {
        return this.emit('error', new Error(`MAC Invalid: ${macd.toString('hex')} != ${expected.toString('hex')}`))
      }

      // all good, decrypt
      decipher.decrypt(data, (err, decrypted) => {
        if (err) {
          return this.emit('error', err)
        }
        this.queue(decrypted)
      })
    })
  })

  return pull(
    lp.decode(lpOpts),
    pt
  )
}

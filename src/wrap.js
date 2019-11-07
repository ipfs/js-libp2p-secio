'use strict'

const pipe = require('it-pipe')
const lp = require('it-length-prefixed')
const pushable = require('it-pushable')

module.exports = (duplex) => {
  const out = lp.decode()(duplex.source)

  const src = pushable()
  duplex.sink(src)

  let isDone = false

  module.exports = {
    async readSingle (pb) {
      const { value, done } = await out.next()
      if (done) { isDone = true }
      if (value) { return pb ? pb.decode(value) : value }
      throw new Error('Got null value')
    },
    async writeSingle (data, pb) {
      if (pb) { data = pb.encode(data) }
      src.push(data)
    }
  }
}

'use strict'

const BFX = require('bitfinex-api-node')
const authArr = require('../config/bfx-api.json')
const authLength = authArr.length - 1
let lastAuth = 0
console.log('Amount of api keys added: ', authArr.length)

const auth = () => {
  const { apiKey, apiSecret } = authArr[lastAuth]
  // Goes interacting for all apis
  if (authLength > lastAuth) lastAuth++
  else lastAuth = 0

  return {
    apiKey,
    apiSecret,
    conf: {
      company: 'bitfinex'
    },
    rest: {
      url: 'https://api.bitfinex.com'
    }
  }
}

function getApiRest (transform = true) {
  const bfx = new BFX(auth())
  return bfx.rest(2, { transform })
}

function reqPubTrades (opts) {
  const {
    symbol, start, end, limit
  } = opts

  const tradeSymbol = `t${symbol.toUpperCase()}`
  return getApiRest().trades(tradeSymbol, start, end, limit)
}

async function getPairs () {
  const rest = getApiRest()
  const allPairs = await rest.symbolDetails()
  return allPairs.map(p => p.pair)
}

module.exports = {
  reqPubTrades,
  getPairs
}

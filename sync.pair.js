'use strict'

const { minStart, maxEnd } = require('./config/bfx-sync.json')
const mongoQ = require('./helpers/mongo')
const { reqPubTrades } = require('./helpers/apiFunctions')
const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}
/*
  id: 0,
  mts: 1,
  amount: 2,
  price: 3
  pair:''
*/
// name: 1 (mas chico arriba)
const collection = 'pubTrades'

async function syncPair (db, pair) {
  const newer = await mongoQ._find(db, { pair }, collection, 1, 0, { mts: -1 })

  if (!newer) { // Had never been sync
    await _syncPair(db, pair, minStart, maxEnd)
  }

  if (newer && newer[0].mts < maxEnd) {
    await _syncPair(db, pair, newer[0].mts, maxEnd)
    const older = await mongoQ._find(db, { pair }, collection, 1, 0, { mts: 1 })
    if (older && older[0].mts > minStart) {
      await _syncPair(db, pair, minStart, older[0].mts)
    }
  }
}

async function _syncPair (db, pair, start, sendEnd) {
  const limit = 5000 // Max limit
  let end = sendEnd
  let next = true
  const symbol = pair
  const till = new Date(start)

  while (next) {
    try {
      const trades = await reqPubTrades({ symbol, start, end, limit })

      next = trades.length === limit

      const mapTrades = trades.map(t => {
        const { id, mts, amount, price } = t
        return { id, mts, amount, price, pair }
      })

      end = await _saveTrades(db, next, mapTrades)

      process.stdout.write(`Date: ${new Date(end)} Till ${till} .\r`)
    } catch (e) {
      const waitMs = parseInt(Math.random() * 4000) + 1000
      await sleep(waitMs)
    }
  }
}

async function _saveTrades (db, next, trades) {
  let end = false
  if (next) {
    const last = trades.pop()
    end = last.mts
    while (trades[trades.length - 1].mts === end) {
      trades.pop()
    }
  }
  // Ver que pasa con los id repetidos si se pueden hacer unicos con el tipo de trade
  await mongoQ._insertMany(db, trades, collection)
  return end
}

module.exports = {
  syncPair
}

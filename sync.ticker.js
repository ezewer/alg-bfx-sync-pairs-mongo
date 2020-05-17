'use strict'

const { minStart, maxEnd } = require('./config/bfx-sync.json')
const mongoQ = require('./helpers/mongo')
const { reqTikerHistory } = require('./helpers/apiFunctions')
const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/*
    symbol: 'tBTCUSD',
    bid: 9755.4,
    ask: 9755.5,
    mtsUpdate: 1589502526000
*/

const collection = 'tickers'

async function syncTicker (db, pair) {
  const newer = await mongoQ._find(db, { pair }, collection, 1, 0, { mts: -1 })

  if (!newer) { // Had never been sync
    await _syncTicker(db, pair, minStart, maxEnd)
  }

  if (newer && newer[0].mts < maxEnd) {
    await _syncTicker(db, pair, newer[0].mts, maxEnd)
    const older = await mongoQ._find(db, { pair }, collection, 1, 0, { mts: 1 })
    if (older && older[0].mts > minStart) {
      await _syncTicker(db, pair, minStart, older[0].mts)
    }
  }
}

async function _syncTicker (db, pair, start, sendEnd) {
  console.log('_syncTicker: ', pair)
  const limit = 250 // Max limit
  let end = sendEnd
  let next = true
  const symbol = pair
  const till = new Date(start)

  while (next) {
    try {
      const tickers = await reqTikerHistory({ symbol, start, end, limit })
      next = tickers.length === limit

      const mapTickers = tickers.map(t => {
        const { bid, ask, mtsUpdate } = t
        return { bid, ask, mts: mtsUpdate, pair }
      })

      end = await _saveTickers(db, mapTickers)

      process.stdout.write(`Date: ${new Date(end)} Till ${till} .\r`)
    } catch (e) {
      const waitMs = parseInt(Math.random() * 4000) + 1000
      await sleep(waitMs)
    }
  }
}

async function _saveTickers (db, tickers) {
  const end = tickers[tickers.length - 1].mts - 5 // Remove 5 ms from last end
  await mongoQ._insertMany(db, tickers, collection)
  return end
}

module.exports = {
  syncTicker
}

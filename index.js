'use strict'

const lngLine = '############################################################################################################################'
const srtLine = '#########################'

const { syncPair } = require('./sync.pair.js')
const { syncTicker } = require('./sync.ticker.js')
const mongoConnect = require('./helpers/mongo.connect.js')
const { getPairs } = require('./helpers/apiFunctions.js')
const { minStart, maxEnd } = require('./config/bfx-sync.json')

async function main () {
  console.log('Start Running Pairs')
  console.log(`Start ${new Date(minStart)}`)
  console.log(`End ${new Date(maxEnd)}`)
  const db = await mongoConnect()
  const pairs = await getPairs()
  let count = 0
  for (const pair of pairs) {
    await syncPair(db, pair)
    count++
    console.log(srtLine)
    console.log(`Sync pair ${count} of ${pairs.length}`)
    console.log(srtLine)
    console.log(lngLine)
  }

  console.log('Start Running Tickers')
  count = 0
  for (const pair of pairs) {
    await syncTicker(db, pair)
    count++
    console.log(srtLine)
    console.log(`Sync ticker ${count} of ${pairs.length}`)
    console.log(srtLine)
    console.log(lngLine)
  }
  console.log('End')
}

main()

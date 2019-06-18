'use strict'

const lngLine = '############################################################################################################################'
const srtLine = '#########################'

const { syncPair } = require('./sync.pair.js')
const mongoConnect = require('./helpers/mongo.connect.js')
const { getPairs } = require('./helpers/apiFunctions.js')

async function main () {
  console.log('Start Running')
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
}

main()

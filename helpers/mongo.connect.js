'user strict'

const conf = require('../config/db-mongo.config.json')
const Driver = require('mongodb')
const { MongoClient } = Driver

const fmt = require('util').format

const client = (cb) => {
  const url = fmt(
    'mongodb://%s:%s@%s:%s/%s?authMechanism=DEFAULT&maxPoolSize=' + (conf.maxPoolSize || 150),
    conf.user, conf.password, conf.host, conf.port, conf.database
  )

  return MongoClient.connect(url, cb)
}

const connectMongoDb = async () => {
  return new Promise((resolve, reject) => {
    client((err, cli) => {
      if (err) return reject(err)
      resolve(cli.db(conf.database))
    })
  })
}

module.exports = connectMongoDb

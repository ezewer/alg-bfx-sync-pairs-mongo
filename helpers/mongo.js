'use strict'

const ObjectID = require('mongodb').ObjectID
const _ = require('lodash')

const parseUpserts = (upserts = []) => {
  return _.reduce(upserts, (acc, val) => {
    acc.push(val._id)
    return acc
  }, [])
}

function _update (db, collection, query, update, upsert = true) {
  return new Promise((resolve, reject) => {
    db.collection(collection).update(
      query, update, { upsert }, (err, res) => {
        if (err) return reject(err)
        const { upserted = [] } = res.result
        const ids = parseUpserts(upserted)
        resolve(!!ids && !!ids[0] && ids)
      })
  })
}

function _insertMany (db, query, collection) {
  return new Promise((resolve, reject) => {
    db.collection(collection).insertMany(
      query, (err, res) => {
        if (err) return reject(err)

        const { insertedIds = [] } = res
        const ids = _.values(insertedIds)
        resolve(!!ids && !!ids[0] && ids)
      })
  })
}

function _insertOne (db, query, collection) {
  return new Promise((resolve, reject) => {
    db.collection(collection).insertOne(
      query, (err, res) => {
        if (err) return reject(err)

        const { insertedId } = res
        resolve(insertedId)
      })
  })
}

function _find (db, query, collection, limit = 0, skip = 0, sort = { $natural: 1 }) {
  return new Promise((resolve, reject) => {
    db.collection(collection).find(
      query
    ).limit(limit).skip(skip)
      .sort(sort).toArray((err, res) => {
        if (err) return reject(err)
        resolve(!!res && !!res[0] && res)
      })
  })
}

function _countDocuments (db, query, collection, options = {}) {
  return new Promise((resolve, reject) => {
    db.collection(collection).countDocuments(
      query, options,
      (err, res) => {
        if (err) return reject(err)
        resolve(res)
      })
  })
}

function _aggregate (db, query, collection, limit = 0, skip = 0) {
  return new Promise((resolve, reject) => {
    const start = db.collection(collection).aggregate(query)
    const search = (limit > 0)
      ? start.skip(skip).limit(limit)
      : start

    search.toArray((err, res) => {
      if (err) return reject(err)
      resolve(!!res && !!res[0] && res)
    })
  })
}

function _delete (db, collection, query) {
  return new Promise(async (resolve, reject) => {
    const { uid } = query
    if (!uid) return reject(new Error('NO_UID_SENDED'))

    if (collection !== 'documents' && collection !== 'compliances') {
      return reject(new Error('ONLY_DOCUMENTS_OR_COMPLIANCES_CAN_BE_DELETED'))
    }

    const securityCheck = {
      uid,
      digital_signature_verified: { $exists: true }
    }

    const isVerified = await _find(db, securityCheck, 'compliances')

    if (isVerified) {
      return reject(new Error('CANT_DELETE_DATA_FROM_VERIFIED_ACCOUNTS'))
    }

    db.collection(collection).deleteMany(
      query, (err) => {
        if (err) return reject(err)
        resolve()
      }
    )
  })
}

function _distinct (db, field, query, collection) {
  return new Promise((resolve, reject) => {
    db.collection(collection).distinct(
      field, query, (err, res) => {
        if (err) return reject(err)
        resolve(!!res && !!res[0] && res)
      })
  })
}

function _saveDocsDb (db, docs, collection) {
  return new Promise((resolve, reject) => {
    const bulk = db.collection(collection).initializeOrderedBulkOp()
    const updateIds = []
    _.forEach(docs, (doc) => {
      const { _id, d } = doc
      if (_id) updateIds.push(_id)
      const update = {
        $set: d
      }
      bulk.find({ _id: ObjectID(_id) })
        .upsert()
        .updateOne(update)
    })

    bulk.execute((err, result = {}) => {
      if (err) return reject(err)

      const { getUpsertedIds = () => [] } = result
      const upserts = getUpsertedIds()
      const upsertIds = parseUpserts(upserts)
      const ids = _.union(upsertIds, updateIds)

      const data = _.reduce(ids, (res, val, i) => {
        const { timestamp, type } = docs[i].d
        res.push({ _id: val, timestamp, type })
        return res
      }, [])
      resolve(data)
    })
  })
}

module.exports = {
  _saveDocsDb,
  _update,
  _insertOne,
  _insertMany,
  _find,
  _countDocuments,
  _aggregate,
  _delete,
  _distinct
}

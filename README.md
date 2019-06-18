# alg-bfx-sync-pairs-mongo
Syncs trading pairs adding the public trades into a mongo DB

## Create Mongo DB database if it does not exists
use algo;
db.createUser(
  {
    user: "bfx",
    pwd: "XXXXX",
    roles: [ { role: "userAdminAnyDatabase", db: "admin" } ]
  }
)

## bfx-api.json
Set as much api keys as you want, if they are more keys it would sync faster

## Indexes for mongodb
This would speed up transactions

```console
use algo;
db.pubTrades.createIndex({ pair: 1, mts: -1, id: -1 }, { background: true });
```

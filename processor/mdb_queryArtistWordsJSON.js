// mongo.exe" --quiet muse_ack < mdb_queryArtistWordsJSON.js > ratios.js

db.artistWords.find({"value.totalWordCount":{$gt: 10000}},{"value.wordCounts":0}).sort({"value.ratio": 1}).toArray();

//c:\work\node\muse_ack>"c:\Program Files\MongoDB 2.6 Standard\bin\mongo.exe" --quiet muse_ack < query_script.js > out.js

//db.artistWords.find({"value.totalWordCount":{$gt: 10000}},{_id:0,"value.wordCounts":0}).sort({"value.ratio": 1}).toArray();

db.artistWords.find({"value.totalWordCount":{$gt: 10000}},{"value.wordCounts":0}).sort({"value.ratio": 1}).toArray();

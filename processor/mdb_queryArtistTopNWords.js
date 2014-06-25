// mongo.exe muse_ack < processor\mdb_queryArtistTopNWords.js > pages\top20Words.js
db.artistWords.group(
   {
    key: { _id: 1 },
	//cond: { _id: { $eq: "NOFX" } },
    reduce: function( curr, result ) {
				result.artistName = curr.value.artistName;
				for (var i in curr.value.wordCounts) {
					if (curr.value.wordCounts.hasOwnProperty(i)) {
						result.topWords.push({word:i, count:curr.value.wordCounts[i]});
					}
				}
            },
    initial: { artistName: "", topWords: [] },
    finalize: function(result) {
				result.topWords.sort(function(a, b) {return b.count - a.count});
				result.topWords = result.topWords.slice(0,20);
              }
   });
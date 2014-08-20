// mongo.exe muse_ack < processor\mdb_queryArtistTopNWords.js > pages\top20Words.js
db.subWords.group(
   {
    key: { _id: 1 },
	//cond: { _id: { $eq: "philosophy" } },
    reduce: function( curr, result ) {
				result.submissionSub = curr.value.submissionSub;
				for (var i in curr.value.wordCounts) {
					if (curr.value.wordCounts.hasOwnProperty(i)) {
						result.topWords.push({word:i, count:curr.value.wordCounts[i]});
					}
				}
            },
    initial: { submissionSub: "", topWords: [] },
    finalize: function(result) {
				result.topWords.sort(function(a, b) {return b.count - a.count});
				result.topWords = result.topWords.slice(0,100);
              }
   });
// need to run mdb_createSubRedditCommentWordCounts.js first
// mongo.exe muse_ack < processor\mdb_queryArtistTopNWords.js > pages\top20Words.js
db.subComments.group(
   {
    key: { submissionSub: 1 },
	//cond: { submissionSub: { $eq: "announcements" } },
    reduce: function( curr, result ) {
			result.totalWordCount = result.totalWordCount + curr.totalWordCount;
				result.submissionSub = curr.submissionSub;
				for (var i in curr.words) {
					if (curr.words.hasOwnProperty(i)) {
						result.allWords.push({commentId: curr.commentId, word: curr.words[i]});
					}
				}
            },
    //initial: { totalWordCount: 0, submissionSub: "", allWords: [], uniqueWordCount: 0, smryWordCount: 0 , wordCounter: {} },
	initial: { totalWordCount: 0, submissionSub: "", allWords: [], uniqueWordCount: 0, smryWordCount: 0 },
    finalize: function(result) {
				var wordCounter = {};
				var uniqueWordCount = 0;
				//result.allWords.sort(function(a, b) {return b.commentId - a.commentId});
				result.allWords = result.allWords.slice(0,50000);
				// for each word in the comment
				for (var i = 0; i < result.allWords.length; i++) {
					// if this words does not exist in the counter yet then add it
					if (!wordCounter[result.allWords[i].word]) {
						wordCounter[result.allWords[i].word] = 1;
						uniqueWordCount++;
					// otherwise if it's already there then just increment the count
					} else {
						wordCounter[result.allWords[i].word]++;
					}
				}
				result.uniqueWordCount = uniqueWordCount;
				result.smryWordCount = result.allWords.length;
				result.allWords = [];
				//result.wordCounter = wordCounter;
            }
   });
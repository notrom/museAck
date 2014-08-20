
// run mdb_createSubRedditCommentWordCounts.js first

var commentWordsMapFunction = function() {
			var key = this.submissionSub;
			
			// put together the summarised object
            var subWords = {	submissionSub: this.submissionSub,
                                totalWordCount: this.words.length,
                                wordCounts: this.wordCounts,
								uniqueWordCount: this.uniqueWordCount };

            emit( key, subWords );
        };

var commentWordsReduceFunction = function(key, listSubWords) {
            var reducedObject = {	submissionSub: key,
                                    totalWordCount: 0,
                                    wordCounts: {},
									uniqueWordCount: 0 };
			var wordCounter = {};
            listSubWords.forEach( function(subWords) {
				//if (artistWords && artistWords.totalWordCount > 0) { 
				//if (reducedObject.totalWordCount < 10000) {
					reducedObject.totalWordCount += subWords.totalWordCount;
					for (var i in subWords.wordCounts) {
						if (subWords.wordCounts.hasOwnProperty(i)) {
							if (wordCounter.hasOwnProperty(i)) {
								wordCounter[i] += subWords.wordCounts[i];
							} else {
								wordCounter[i] = subWords.wordCounts[i];
								reducedObject.uniqueWordCount++;
							}
						}
					}
				//}
				//}
            });
			reducedObject.wordCounts = wordCounter;
            return reducedObject;
        };

var finalizeFunction = function (key, reducedValue) {
			reducedValue.ratio = reducedValue.uniqueWordCount / reducedValue.totalWordCount;
			return reducedValue;
		};
	
//db.artistWords.drop();
	
//query: { artistName: { $in: ["Nirvana", "Tool", "The Beatles", "NOFX"] } },
						 //query: { artistName: { $ne: "blah blah blah" } },
                         //out: { reduce: "artistStats" },
db.subComments.mapReduce( commentWordsMapFunction,
                       commentWordsReduceFunction,
					{
						//query: { artistName: { $in: ["Nirvana", "Tool", "The Beatles", "NOFX"] } },
						 //sort: { albumYear: 1 },
						 out: "subWords",
                         finalize: finalizeFunction
                    }
                );
				
//db.artistStats.find({"value.artistName": "Nirvana"}, {"value.wordCounts.if":1});
//db.artistStats.find({},{"value.uniqueWordRatio":1});
//db.allSongs.remove({artistName:"Nirvana"});
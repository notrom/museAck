
var songWordsMapFunction = function() {
			var key = this.artistName;
			
			// put together the summarised object
            var artistWords = {	artistName: this.artistName,
                                totalWordCount: this.words.length,
                                wordCounts: this.wordCounts,
								uniqueWordCount: this.uniqueWordCount };

            emit( key, artistWords );
        };

var songWordsReduceFunction = function(key, listArtistWords) {
            var reducedObject = {	artistName: key,
                                    totalWordCount: 0,
                                    wordCounts: {},
									uniqueWordCount: 0 };
			var wordCounter = {};
            listArtistWords.forEach( function(artistWords) {
				//if (artistWords && artistWords.totalWordCount > 0) { 
				//if (reducedObject.totalWordCount < 10000) {
					reducedObject.totalWordCount += artistWords.totalWordCount;
					for (var i in artistWords.wordCounts) {
						if (artistWords.wordCounts.hasOwnProperty(i)) {
							if (wordCounter.hasOwnProperty(i)) {
								wordCounter[i] += artistWords.wordCounts[i];
							} else {
								wordCounter[i] = artistWords.wordCounts[i];
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
db.allSongsTemp.mapReduce( songWordsMapFunction,
                       songWordsReduceFunction,
					{
						//query: { artistName: { $in: ["Nirvana", "Tool", "The Beatles", "NOFX"] } },
						 //sort: { albumYear: 1 },
						 out: "artistWords",
                         finalize: finalizeFunction
                    }
                );
				
//db.artistStats.find({"value.artistName": "Nirvana"}, {"value.wordCounts.if":1});
//db.artistStats.find({},{"value.uniqueWordRatio":1});
//db.allSongs.remove({artistName:"Nirvana"});
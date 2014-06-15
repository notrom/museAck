db.allSongsTemp.find().forEach( function (x) {

	var uniqueWordCount = 0;
	var words = [];
	var wordCounter = {};
	// if we've got lyrics
	if (x.lyrics) {
		// clean up the lyrics
		var s = x.lyrics.replace(/(^\s*)|(\s*$)/gi,"");//exclude  start and end white-space
		s = s.replace(/\r?\n|\r/g, " "); // get rid of all of the newline chars
		s = s.replace(/[ ]{2,}/gi," ");//2 or more space to 1
		s = s.replace(/[^\w\s]/gi, ""); // remove all non-alphanumeric chars
		// make it all lower case
		s = s.toLowerCase(); // make it all lowercase
		// split on space
		words = s.split(' ');
	}
	
	// for each word in the lyrics
	for (var i = 0; i < words.length; i++) {
		// if this words does not exist in the counter yet then add it
		if (!wordCounter[words[i]]) {
			wordCounter[words[i]] = 1;
			uniqueWordCount++;
		// otherwise if it's already there then just increment the count
		} else {
			wordCounter[words[i]]++;
		}
	}

	x.totalWordCount = words.length;
	x.words = words;
	x.wordCounts = wordCounter;
	x.uniqueWordCount = uniqueWordCount;
	db.allSongsTemp.save(x);
});
// http://rappers.mdaniels.com.s3-website-us-east-1.amazonaws.com/
//
// discography link http://lyrics.wikia.com/api.php?func=getArtist&artist=Tool&fmt=realjson
//					http://lyrics.wikia.com/api.php?func=getArtist&artist=tool&fmt=xml&fixXML
// 
// Search Song Lyrics API:
// 	http://api.chartlyrics.com/apiv1.asmx/SearchLyric?artist=tool&song=Sober
//
//	http://www.chartlyrics.com/search.aspx?q=smokey+robinson
//
// Song Lyric HTML:
//	http://www.chartlyrics.com/-Fv8ZqTaQUKzeJvJB3k50g/Prison+Sex.aspx
//
//	http://www.rollingstone.com/music/lists/100-greatest-artists-of-all-time-19691231/talking-heads-20110426
//
// Mongo:
//
// Start Server:
// C:\work\node\muse_ack>"c:\Program Files\MongoDB 2.6 Standard\bin\mongod.exe" --dbpath c:\work\node\muse_ack\data
// Connect:
// C:\work\node\muse_ack>"c:\Program Files\MongoDB 2.6 Standard\bin\mongo.exe" 
//	> use muse_ack
//  > 
// 
// Run query from file:
// "c:\Program Files\MongoDB 2.6 Standard\bin\mongo.exe" muse_ack < mapRedceAttempt.js
//
// Get all songs for Tool
// node app.js "Tool" 1 | tee -filepath "Tool.log"

var querystring = require('querystring');
var http = require('http');
var fs = require('fs');
var parseString = require('xml2js').parseString;
var MongoClient = require('mongodb').MongoClient;
var cheerio = require('cheerio');
var beep = require('beepbeep');

// add dts to all console messages
var log = console.log;
console.log = function(){
  log.apply(console, [new Date().toLocaleString().replace(" GMT+1200 (New Zealand Standard Time)", "")].concat(arguments));
};

var argOutFile = "";
var argArtist = "";
var requestDelay = 5;
var apiStopWords = "about after all also an and another any are as at be because been before being between both but by came can come could did do does each else for from get got had has have he her here him himself his how if in into is it its just like make many me might more most much must my never no now of on only or other our out over re said same see should since so some still such take than that the their them then there these they this those through to too under up use very want was way we well were what when where which while who will with would you your";
var apiStopWordRegEx =/(about\b|\bafter\b|\ball\b|\balso\b|\ban\b|\band\b|\banother\b|\bany\b|\bare\b|\bas\b|\bat\b|\bbe\b|\bbecause\b|\bbeen\b|\bbefore\b|\bbeing\b|\bbetween\b|\bboth\b|\bbut\b|\bby\b|\bcame\b|\bcan\b|\bcome\b|\bcould\b|\bdid\b|\bdo\b|\bdoes\b|\beach\b|\belse\b|\bfor\b|\bfrom\b|\bget\b|\bgot\b|\bhad\b|\bhas\b|\bhave\b|\bhe\b|\bher\b|\bhere\b|\bhim\b|\bhimself\b|\bhis\b|\bhow\b|\bif\b|\bin\b|\binto\b|\bis\b|\bit\b|\bits\b|\bjust\b|\blike\b|\bmake\b|\bmany\b|\bme\b|\bmight\b|\bmore\b|\bmost\b|\bmuch\b|\bmust\b|\bmy\b|\bnever\b|\bno\b|\bnow\b|\bof\b|\bon\b|\bonly\b|\bor\b|\bother\b|\bour\b|\bout\b|\bover\b|\bre\b|\bsaid\b|\bsame\b|\bsee\b|\bshould\b|\bsince\b|\bso\b|\bsome\b|\bstill\b|\bsuch\b|\btake\b|\bthan\b|\bthat\b|\bthe\b|\btheir\b|\bthem\b|\bthen\b|\bthere\b|\bthese\b|\bthey\b|\bthis\b|\bthose\b|\bthrough\b|\bto\b|\btoo\b|\bunder\b|\bup\b|\buse\b|\bvery\b|\bwant\b|\bwas\b|\bway\b|\bwe\b|\bwell\b|\bwere\b|\bwhat\b|\bwhen\b|\bwhere\b|\bwhich\b|\bwhile\b|\bwho\b|\bwill\b|\bwith\b|\bwould\b|\byou\b|\byour)/g;

var host = 'api.chartlyrics.com';
function performXMLRequest(endpoint, method, data, success) {
  var dataString = JSON.stringify(data);
  var headers = {};
  
  if (method == 'GET') {
    endpoint += '?' + querystring.stringify(data);
  }
  else {
    headers = {
      'Content-Type': 'text/xml',
      'Content-Length': Buffer.byteLength(dataString)
    };
  }
  //console.log(endpoint);
  var options = {
    host: host,
    path: endpoint,
    method: method,
    headers: headers
  };
  //console.log(endpoint);
  var req = http.request(options, function(res) {
    //res.setEncoding('utf-8');

    var responseString = '';

    res.on('data', function(data) {
      responseString += data;
    });

    res.on('end', function() {
	  //console.log(responseString);
	  parseString(responseString, function (err, result) {
			//console.dir(result);
			//var responseObject = JSON.parse(result);
			//console.dir(responseObject);
			success(result);
		});
    });
  });

  req.write(dataString);
  
  req.on('error', function(err) {
	console.log(err);
  });
  
  req.end();
}

function performHTMLRequest(endpoint, method, data, callback) {
	var dataString = JSON.stringify(data);
	var headers = {};
	
	if (method == 'GET') {
		endpoint += '?' + querystring.stringify(data);
	}
	else {
		headers = {
		'Content-Type': 'text/xml',
		'Content-Length': Buffer.byteLength(dataString)
		};
	}
	//console.log(endpoint);
	var options = {
		host: host,
		path: endpoint,
		method: method,
		headers: headers
	};
	console.log("looking for - " + endpoint);
	var req = http.request(options, function(res) {
		var responseString = '';
		var statusCode = res.statusCode;
	
		if (statusCode < 400) {
		
			res.on('data', function(data) {
				responseString += data;
				});
			
				res.on('end', function() {
					//console.log("finished reading - " + endpoint);
					// so we've got the HTML, find the lyrics in here
					$ = cheerio.load(responseString);
					//console.log($('#content').find('p')[0]);
					// looks like there's jsut one <p> tag and that's the lyrics one
					$('p').each(function(i, elem) {
						//console.log($(this).text());
						callback($(this).text());
					});
					
					//success(responseString);
				});
			//});
		} else {
			console.log("HTTP ERROR (" + statusCode + ") - " + endpoint);
			callback();
		}
	});
	req.write(dataString);
	
	//req.on('socket', function (socket) {
	//	socket.setTimeout(5000);  
	//	socket.on('timeout', function() {
	//		req.abort();
	//	});
	//});
	
	req.on('error', function(err) {
		console.log(err);
		callback();
	});
  
	req.end();
}

function waitFor (interval, callback) {
	setTimeout(callback, interval * 1000);
}

function p(str, callback) {
	console.log("CB: " + str);
	callback("CB result: " + str);
}

function pend(data) {
	fs.writeFile(argOutFile, JSON.stringify(data), function(err) {
		if(err) {
			console.log(err);
		} else {
			console.log("The file '" + argOutFile + "' was saved!");
		}
	}); 
}

function requestIfNotInDb (artist, album, song) {
	MongoClient.connect('mongodb://127.0.0.1:27017/muse_ack', function(err, db) {
		if(err) throw err;
	
		var collection = db.collection('allSongs');
		var exists = collection.findOne({artist: artist, album: album, song: song});
		console.log(exists);
		//console.log(db);
		//db.close();
		if (!exists) {
			songsSeries.push(function(next) {
				getLyrics(artistName, albumName, songName, next);
			});
			songsSeries.push(function(next) {
				waitFor(20, next);
			});
		} else {
			console.log("ALREADY EXISTS IN DB: " + artist + ", " +
						album + ", " + song);
		}
	})
}

function getAlbums(artist) {
host = 'lyrics.wikia.com';
var songsSeries = [];
// ?func=getArtist&artist='+artist+'&fmt=xml&fixXML=1'
performXMLRequest('/api.php', 'GET', 
					{ 	func: "getArtist",
						artist: artist,
						fmt: "xml",
						fixXML: 1
					}, 
		function(data) {
			if (data && data.getArtistResponse && data.getArtistResponse.albums) {
				var artistSongs = [];
				for (a in data.getArtistResponse.albums) {
					allAlbums = data.getArtistResponse.albums[a].albumResult;
					for (al in allAlbums) {					
						for (s in allAlbums[al].songs[0].item) {
							var songName = allAlbums[al].songs[0].item[s];
							var albumName = allAlbums[al].album[0];
							var albumYear = parseInt(allAlbums[al].year[0]);
							var artistName = data.getArtistResponse.artist[0];
							
							// only bother handling the song if there is a year recorded for the album
							// this is an attempt to filter out the "cruft" songs
							if (!isNaN(albumYear)) {
								// add song to list
								artistSongs.push({	artistName: artistName, 
													albumName: albumName, 
													albumYear: albumYear,
													songName: songName,
													trackNumber: s });
							} else {
								console.log("NO YEAR RECORDED, NOT GOING TO LOOK FOR " +
											artistName + ", " + albumName + ", " + songName);
							}
						}
					}
				}
				
				console.log(artistSongs);
				
				// get the artists url using the first song we find
				var firstUsefulSongName = allAlbums[0].songs[0].item[0];
				console.log(allAlbums[0].songs[0]);
				// find a song name that's not full of stop words
				for (var i = 0; i < allAlbums[0].songs[0].item.length; i++) {
					var songName = allAlbums[0].songs[0].item[i].toLowerCase();
					var songNameWords = songName.split(" ");
					var songNameWordsNonStop = songName.replace(apiStopWordRegEx, "")
														.replace(/[ ]{2,}/gi,"|")
														.split("|");
					console.log(songNameWords);
					console.log(songNameWordsNonStop);
					if (songNameWordsNonStop.length === songNameWords.length &&
						songNameWordsNonStop[0] !== "") {
						firstUsefulSongName = songName;
						console.log("firstUsefulSongName:" + firstUsefulSongName);
						break;
					}
				}
				
				// get the artist url using the first good song name (ie no stop words)
				var thisArtistName = data.getArtistResponse.artist[0];
				getArtistSongUrl(thisArtistName, firstUsefulSongName, 
					function (artistUrl) {
						if (artistUrl) {
							console.log("ARTIST URL TO BE USED FOR ARTIST: " + artistUrl)
							// so we've got a list of songs and an artist URL
							getArtistSongsJsonFromHtml(artistUrl, artistSongs);
						}
					}
				);
			}
			//series(songsSeries, pend, storeResult);
		});
}

function getArtistSongsJsonFromHtml(artistUrl, songsList) {
	var songsSeries = [];
	var countSongsToGet = 0;
	var countSongsProcessed = 0;
	var countSongsFoundLyrics = 0;
	var countSongsNoLyrics = 0;
	// get the URL used to request a song via HTML
	host = 'www.chartlyrics.com';
	var songUrlPath = artistUrl.replace(".aspx", "/");
	// get the endpoint from the url
	var songUrlEndpoint = songUrlPath.replace("http://" + host, "");
	//var songsProcessedCount = 0;
	var songsUrlsToGet = {};
	for (song in songsList) {
		(function () {
			var song_i = song;
			//var songName = songsList[song].songName;
			//var artistName = songsList[song].artistName;
			//var albumName = songsList[song].albumName;
			var songHtmlUrl = songUrlPath + encodeURI(songsList[song_i].songName) + ".aspx";
			//console.log(songHtmlUrl);
			
			// only get each URL once so keep a list
			if (!songsUrlsToGet[songHtmlUrl]) {
			
				songsUrlsToGet[songHtmlUrl] = 1;
			
				MongoClient.connect('mongodb://127.0.0.1:27017/muse_ack', function(err, db) {
					if(err) {
						db.close();
						throw err;
					}
					// use this collection
					var collection = db.collection('allSongs');
					var thisSong = {songUrl: songHtmlUrl};
					//collection.findOne(songsList[song_i], function(err, document) {
					collection.findOne(thisSong, function(err, document) {
						// close db connection early
						db.close();
						// do we need to collect this song?
						if (document) {
							console.log("FOUND THIS ONE, NO NEED TO PROCESS AGAIN - " + document.songName +
										"( " + document.albumName + " )");
						} else {
							console.log("WILL ATTEMPT TO COLLECT SONG LYRICS - " + songsList[song_i].songName);
							countSongsToGet++;
							// push the html get then save data
							songsSeries.push(function(next) {			
								performHTMLRequest(songUrlEndpoint + encodeURI(songsList[song_i].songName) + ".aspx", 
									'GET', {}, 
									function(data) {
										var songWithLyrics = songsList[song_i];
										songWithLyrics.songUrl = songHtmlUrl;
										countSongsProcessed++;
										if (data) {
											countSongsFoundLyrics++;
											console.log("==== :) Found and will record lyrics for " + songsList[song_i].songName);
											console.log("( " + countSongsProcessed + " / " + countSongsToGet + " )" +
														" [ found: " + countSongsFoundLyrics + ", not: " + countSongsNoLyrics + "]");
											songWithLyrics.lyrics = data;
											beep();
											next(songWithLyrics);
										} else {
											countSongsNoLyrics++;
											// no lyrics added so don't write song without lyrics so we don't try again next time
											console.log("==== :( No lyrics found for " + songsList[song_i].songName);
											console.log("( " + countSongsProcessed + " / " + countSongsToGet + " )" +
														" [ found: " + countSongsFoundLyrics + ", not: " + countSongsNoLyrics + "]");
											beep(3);
											next(songWithLyrics);
										}
									})
							});
							songsSeries.push(function(next) {
								waitFor(requestDelay, next);
							});
						}
						
					});
				});
			} else {
				console.log("SONG ALREADY IN LIST FOR THIS RUN - " + songsList[song_i].songName);
			}
			//songsProcessedCount++;
			// on the last lick off the collection series
			//if (songsProcessedCount === songsList.length) {
			//	series(songsSeries, pend, storeResult);
			//}
		}());
	}
	//console.log(songsSeries.length);
	// gah, got to put a delay here, not ideal
	setTimeout(series, 10000, songsSeries, pend, storeResult);
}

function getArtistSongUrl (artist, song, cb) {
	var artistSongUrl = "";
	
	host = 'api.chartlyrics.com';
	performXMLRequest('/apiv1.asmx/SearchLyric', 'GET', 
		{ "artist": artist, "song": song }, 
		function(data) { 
			if (data&& data.ArrayOfSearchLyricResult && 
				data.ArrayOfSearchLyricResult.SearchLyricResult &&
				data.ArrayOfSearchLyricResult.SearchLyricResult.length > 0) {
				var lyricResults = data.ArrayOfSearchLyricResult.SearchLyricResult;
				// find the highest ranked song for this artist
				var topRankedLyric = {};
				// try the first one if no other match is found
				topRankedLyric = lyricResults[0];
				for (d in lyricResults) {
					console.log("lyricResults[d].Artist: " + lyricResults[d].Artist +
								" Looking for " + artist);
					if (lyricResults[d].Artist[0] === artist)
					{
						console.log("WOOOHOO!!");
						topRankedLyric = lyricResults[d];
						break;
					}
				}
				cb(topRankedLyric.ArtistUrl[0]);
			} else {
				cb();
			}
			
		});
}

function getLyrics (artist, album, song, callback) {
  host = 'api.chartlyrics.com';
  performXMLRequest('/apiv1.asmx/SearchLyric', 'GET', 
	{	"artist": artist,
		"song": song 
	}, 
	function(data) {
	console.log(JSON.stringify(data));
	if (data && data.ArrayOfSearchLyricResult && 
		data.ArrayOfSearchLyricResult.SearchLyricResult &&
		data.ArrayOfSearchLyricResult.SearchLyricResult.length > 0) {
		var lyricResults = data.ArrayOfSearchLyricResult.SearchLyricResult;
		var topRankedLyric  = {};
		topRankedLyric = lyricResults[0];
		for (d in lyricResults) {
			if (lyricResults[d].SongRank > topRankedLyric.SongRank)
			{
				topRankedLyric = lyricResults[d];
			}
		}
		
		setTimeout(performXMLRequest, 20000, '/apiv1.asmx/GetLyric', 'GET', 
						{"lyricId": topRankedLyric.LyricId, "lyricCheckSum": topRankedLyric.LyricChecksum}, 
						function(data) {
							if (data && data.GetLyricResult && data.GetLyricResult.Lyric) {
								callback({artist: artist, album: album, 
											song: song, lyrics: data.GetLyricResult.Lyric[0]});
							} else { 
								callback({artist: artist, album: album, song: song, lyrics: ""});
							}
						});
		
	} else {
		callback({artist: artist, album: album, song: song, lyrics: ""});
	}
  });
}

// execute if not exist in db
function notExistsInDb(artist, album, song, fn) {
	MongoClient.connect('mongodb://127.0.0.1:27017/muse_ack', function(err, db) {
		if(err) throw err;
	
		var collection = db.collection('allSongs');
		var exists = collection.findOne({artist: artist, album: album, song: song});
		console.log(exists);
		//console.log(db);
		//db.close();
		if (!exists) {
			fn.call();
			//return true;
		} else {
			console.log("ALREADY EXISTS IN DB: " + artist + ", " +
						album + ", " + song);
		}
	})
}

// store the result
function storeResult(res) {
	var res = res[0];
	//console.log(JSON.stringify(res));
	MongoClient.connect('mongodb://127.0.0.1:27017/muse_ack', function(err, db) {
		if(err) throw err;
	
		var collection = db.collection('allSongs');
		collection.findOne({songUrl: res.songUrl}, function(err, document) {
			if (!document) {
				//console.log(document);
				collection.insert(res, function(err, docs) {
					console.log("WRITTEN TO DB: " + res.artistName + ", " + res.albumName + ", " + res.songName);
					db.close();
				});
			} else {
				console.log("ALREADY EXISTS IN DB: " + res.artistName + ", " + res.albumName + ", " + res.songName);
				db.close();
			}
		});
	})
}

function series(callbacks, last, resultCallback) {
  var results = [];
  function next() {
    var callback = callbacks.shift();
    if(callback) {
      callback(function() {
	    var res = Array.prototype.slice.call(arguments);
		//console.log(res);
		// ignore empty results
		if (res.length !== 0) {
			resultCallback(res);
			results.push(res);
		}
        next();
      });
    } else {
      last(results);
    }
  }
  next();
}

function final(results) { console.log('Done', results); }

// Example task
function async(arg, callback) {
  var delay = Math.floor(Math.random() * 5 + 1) * 100; // random ms
  console.log('async with \''+arg+'\', return in '+delay+' ms');
  setTimeout(function() { callback(arg * 2); }, delay);
}

//series([
//  function(next) { async(1, next); },
//  function(next) { async(2, next); },
//  function(next) { async(3, next); },
//  function(next) { async(4, next); },
//  function(next) { async(5, next); },
//  function(next) { async(6, next); }
//], final);

//getAlbums("Nirvana");

argArtist = process.argv[2];
argOutFile = process.argv[2]+".json";

if (process.argv.length > 3){
	requestDelay = parseInt(process.argv[3]);
}

// START THE WORK HERE
getAlbums(argArtist);

/////////////////////////////////////////////////////////////////////////////////////////
function performJSONRequest(endpoint, method, data, success) {
  var dataString = JSON.stringify(data);
  var headers = {};
  
  if (method == 'GET') {
    endpoint += '?' + querystring.stringify(data);
  }
  else {
    headers = {
      'Content-Type': 'text/xml',
      'Content-Length': Buffer.byteLength(dataString),
	  'User-Agent': 'Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/34.0.1847.116 Safari/537.36'
    };
  }
  var options = {
    host: host,
    path: endpoint,
    method: method,
    headers: headers
  };
  //console.log(endpoint);
  var req = http.request(options, function(res) {
    //res.setEncoding('utf-8');

    var responseString = '';

    res.on('data', function(data) {
      responseString += data;
    });

    res.on('end', function() {
      //console.log(responseString);
      success(responseString);
    });
  });

  req.write(dataString);
  
  req.on('error', function(err) {
	console.log(err);
  });
  
  req.end();
}


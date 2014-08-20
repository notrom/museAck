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
var db;
var dbCollection;
var apiStopWords = "about after all also an and another any are as at be because been before being between both but by came can come could did do does each else for from get got had has have he her here him himself his how if in into is it its just like make many me might more most much must my never no now of on only or other our out over re said same see should since so some still such take than that the their them then there these they this those through to too under up use very want was way we well were what when where which while who will with would you your";
var apiStopWordRegEx =/(about\b|\bafter\b|\ball\b|\balso\b|\ban\b|\band\b|\banother\b|\bany\b|\bare\b|\bas\b|\bat\b|\bbe\b|\bbecause\b|\bbeen\b|\bbefore\b|\bbeing\b|\bbetween\b|\bboth\b|\bbut\b|\bby\b|\bcame\b|\bcan\b|\bcome\b|\bcould\b|\bdid\b|\bdo\b|\bdoes\b|\beach\b|\belse\b|\bfor\b|\bfrom\b|\bget\b|\bgot\b|\bhad\b|\bhas\b|\bhave\b|\bhe\b|\bher\b|\bhere\b|\bhim\b|\bhimself\b|\bhis\b|\bhow\b|\bif\b|\bin\b|\binto\b|\bis\b|\bit\b|\bits\b|\bjust\b|\blike\b|\bmake\b|\bmany\b|\bme\b|\bmight\b|\bmore\b|\bmost\b|\bmuch\b|\bmust\b|\bmy\b|\bnever\b|\bno\b|\bnow\b|\bof\b|\bon\b|\bonly\b|\bor\b|\bother\b|\bour\b|\bout\b|\bover\b|\bre\b|\bsaid\b|\bsame\b|\bsee\b|\bshould\b|\bsince\b|\bso\b|\bsome\b|\bstill\b|\bsuch\b|\btake\b|\bthan\b|\bthat\b|\bthe\b|\btheir\b|\bthem\b|\bthen\b|\bthere\b|\bthese\b|\bthey\b|\bthis\b|\bthose\b|\bthrough\b|\bto\b|\btoo\b|\bunder\b|\bup\b|\buse\b|\bvery\b|\bwant\b|\bwas\b|\bway\b|\bwe\b|\bwell\b|\bwere\b|\bwhat\b|\bwhen\b|\bwhere\b|\bwhich\b|\bwhile\b|\bwho\b|\bwill\b|\bwith\b|\bwould\b|\byou\b|\byour)/g;

function performJSONRequest(host, endpoint, method, data, success) {
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
  //console.dir(options);
  var req = http.request(options, function(res) {
    //res.setEncoding('utf-8');

    var responseString = '';

    res.on('data', function(data) {
      responseString += data;
    });

    res.on('end', function() {
	  //console.log(responseString);
	  //parseString(responseString, function (err, result) {
			//console.dir(responseString);
			var responseObject = JSON.parse(responseString);
			//console.dir(responseObject);
			success(responseObject);
		//});
    });
  });

  req.write(dataString);
  
  req.on('error', function(err) {
	console.log(err);
  });
  
  req.end();
}

function waitFor (interval, callback) {
	setTimeout(callback, interval * 1000);
}

function getCommentAndReplies(commentThread, submissionData, d) {
	var res = {};
	res.submissionSub = submissionData.subreddit;
	res.submissionId = submissionData.id;
	res.submissionTitle = submissionData.title;
	res.submissionAuthor = submissionData.author;
	res.submissionUrl = submissionData.url;
	res.commentId = commentThread.data.id;
	res.commentAuthor = commentThread.data.author;
	res.commentText = commentThread.data.body;
	
	storeResult(res);
	
	//console.dir(commentThread.data.id + " : " + commentThread.data.body);
	if (commentThread.data.hasOwnProperty("replies")) {
		if (commentThread.data.replies.hasOwnProperty("data")) {
			for (var i = 0; i < commentThread.data.replies.data.children.length; i++) {
				if (commentThread.data.replies.data.children[i].kind !== "more") {
					var childComment = commentThread.data.replies.data.children[i];
					getCommentAndReplies(childComment, submissionData, d+1);
				}
			}
		}
	}
	
}

// http://www.reddit.com/r/music/comments/2bu0cz.json
function getSubmissionComments(submissionData, waitIntrvl, countToGet) {
	setTimeout(function () {performJSONRequest('www.reddit.com', '/r/'+argSubName+'/comments/'+submissionData.id+'/.json', 'GET', {limit:1000}, 
			function (res) {
				console.log("++++++++++++++++++++++ " + submissionData.id + " ++++++++++++++++++++++");
				console.dir(submissionData);
				for (var i = 0; i < res[1].data.children.length; i ++) {
					getCommentAndReplies(res[1].data.children[i],submissionData,countToGet);
				}
			})},
		waitIntrvl);
}


function startCollection() {
	console.log("Starting collection of subreddit "+ argSubName + " here ...");
	// START THE WORK HERE
	performJSONRequest('www.reddit.com', '/r/'+argSubName+'/.json', 'GET', {limit:100}, 
			function (res) {
				// lazy rate limit
				var minWait = 60000/10;
				for (var i = 0; i < res.data.children.length; i ++) {
					console.dir(res.data.children[i].data.id);
					getSubmissionComments(res.data.children[i].data, minWait*i, res.data.children.length);
				}
				// close the db after everything SHOULD be completed, this is bad
				setTimeout(function () {
								console.log("Closing the db now, hopefully everything is finished with it ...");
								db.close();
							}, 
							minWait*(res.data.children.length+10));
			});
}

// store the result
function storeResult(res) {
	dbCollection.findOne({commentId: res.commentId}, function(err, document) {
		if (!document) {
			dbCollection.insert(res, function(err, docs) {
				console.log("WRITTEN TO DB: " + res.submissionSub + ", " + res.submissionId + ", " + res.commentId);
			});
		} else {
			console.log("ALREADY EXISTS IN DB: " + res.submissionSub + ", " + res.submissionId + ", " + res.commentId)
		}
	})
}

argSubName = process.argv[2];
argOutFile = process.argv[2]+".json";

MongoClient.connect('mongodb://127.0.0.1:27017/muse_ack', function(err, database) {
		if(err) {
			console.log(err);
			console.dir(res);
			throw err;
		} else {
			db = database;
			dbCollection = db.collection('subComments');
			console.log("Connected to db");
			startCollection();
		}
	});


////DONE remove people who left matchmaking
////DONE what id someone leaves the whole match
////DONE winning/losing page
////DONE find a method to keep track of users(if needed in the first place)
////DONE transmit opponents moves
////DONE block access to opponents disk
////DONE store in data structure that allows wins and losses
////DONE move in ratios based on clients screen size
////DONE update game state on clients
////DONE prevent moves in bad positions
////DONE work around the limitation of using absolute positions
////DONE remove the timer thing that stops multiple clicks

var express = require("express");
var http = require("http");;
var websocket = require("ws");
var url = require("url");
var path = require("path");
var cookies = require("cookie-parser");

var app = express();
var port = 3000; 

var server = http.createServer(app).listen(port);

var waiting = [];
var playing = [];

var played = 0;
var idle = 1;
var visits = 0;

var ids = 0;

//app.use(express.static(__dirname + "/public/splashscreen"));
app.use(express.static(__dirname + "/public"));
app.set("views", path.join(__dirname, "views"));
app.use(cookies());

const wss = new websocket.Server({server});

app.get("/", function(req, res, next)
{
	if(req.cookies["visits"])
	{
		visits = parseInt(req.cookies["visits"]); 
		visits++;
	}
	else
	{
		visits = "1";
	}
	res.cookie("visits", visits.toString());
	res.sendFile(__dirname + "/public/splash.html");	
	next();
	
});

app.get("/", function(req, res)
{
	res.render("splash.ejs", {
		visits: visits,
		played: played - playing.length*2,				
		playing: playing.length*2					
	})

});

app.get("/play", function(req, res)
{
	res.sendFile(__dirname + "/public/main.html");
});

app.get("/*", function(req, res)
{
	res.send("404, lost your way kiddo?")
});


wss.on("connection", function(ws, require)
{
	var id = ids;
	ids++;

	var forstats = false;

	ws.on('close', function close() {
		if(forstats && idle > 0)
			idle--;	

		var status = {
			status: "finale",
			content: "Sorry, opponent disconnected."
		};
		for(var i = 0; i < playing.length; i++)
		{
			if(playing[i].red.id == id)
			{
				playing[i].blue.ws.send(JSON.stringify(status));
				break;
			}
			else if(playing[i].blue.id == id)
			{
				playing[i].red.ws.send(JSON.stringify(status));
				break;
			}

		}
		for(var i = 0; i < waiting.length; i++)
		{
			if(waiting[i].id == id)
			{
				waiting.splice(i,1);
				break;
			}
		}

		for(var i = 0; i < playing.length; i++)
		{
			if(playing[i].red.id == id || playing[i].blue.id == id)
			{
				playing.splice(i,1);
				break;
			}
		}

	});
	ws.on("message", function incoming(message)
	{
		//temporary message status
		
		try
		{
			message = JSON.parse(message);
			if(message.status == "play")
			{
				//allow client to enter session
				waiting.push({
					id: id,
					ws: ws
				});
				//check if two people are connected
				if(waiting.length >= 2)
				{
					played += 2;
					playing.push({
						red: waiting.pop(),
						blue: waiting.pop(),
						matrix: []
						
					});
					var curr = playing.length-1;	
					for(var i = 0; i < 7; i++)
					{
						playing[curr].matrix[i] = [];
					}

					playing[curr].red.ws.send(JSON.stringify(
					{
						status: "play"
					}));
				
					playing[curr].blue.ws.send(JSON.stringify(
					{
						status: "play"
					}));

					playing[curr].blue.ws.send(JSON.stringify(
					{
						status: "turn",
						content: true
					}));
				
					playing[curr].red.ws.send(JSON.stringify(
					{
						status: "turn",
						content: false
					}));
					

				}
			}
			else if(message.status == "message")
			{
				//send message to opponent;
				for(var i = 0; i < playing.length; i++)
				{
					if(playing[i].red.id == id)
					{
						playing[i].blue.ws.send(JSON.stringify(message.content));
						break;
					}
					else if(playing[i].blue.id == id)
					{
						playing[i].red.ws.send(JSON.stringify(message.content));
						break;
					}
				}
			}
			else if(message.status == "move")
			{
				var playing_index = 0;
				for(var i = 0; i < playing.length; i++)
				{
					if(playing[i].blue.id == id || playing[i].red.id == id)
					{
						playing_index = i;
					}
				}
				
				ws.send(JSON.stringify(
				{
					status: "turn",
					content: false
				}));

				var sendto;
				if(id % 2 == 0)
				{
					sendto = playing[playing_index].red.ws;		
					playing[playing_index].matrix[message.column].push("Blue");	
				}
				else
				{
					sendto = playing[playing_index].blue.ws;		
					playing[playing_index].matrix[message.column].push("Red");					
				}

				sendto.send(JSON.stringify({
				status: "move",
					column: message.column
				}));
				sendto.send(JSON.stringify({
					status: "turn",
					content: true
				}));
				
				checkgamestats(playing_index,ws,sendto,message,id);
			}
		}
		catch(error)
		{
			console.log(error);			
		}

	});
});

function checkgamestats(playing_index, lastmover, opponent, message, id)
{
	var status;
	var col;
	//check if draw
	if(id % 2 == 0)	
	{
		//is blue
		col = "Blue";
	}
	else
	{
		col = "Red";

	}
	
	var matrix = playing[playing_index].matrix;
	for(var i = 0; i < playing[playing_index].matrix.length; i++)
	{
   		if(playing[playing_index].matrix[i].length < 6)
   	 	{
			//not a draw;
			//check for win here
			let counter = 0; 
			let j = message.column;
			let ii = matrix[j].length-1;
			for(var a = 0; a < 7; a++)
			{
				if(matrix[a].length>=ii && matrix[a][ii]== col)
				{
					counter++;
					if(counter>=4)
					{
						status = {
							status: "finale",
							content: col + " Wins!"
						}
					}
				}
				else
					counter = 0;
			}
			counter = 0;
			for(var a=0; a<=ii; a++)
			{
				if(matrix[j][a]== col)
				{
					counter++;
					if(counter>=4)
					{
						//the winning scenario should be applied
						status = {
							status: "finale",
							content: col + " Wins!"
						}
					}
				}
				else
					counter = 0;
			}
			counter = 0;
			let counter2 = 0;
			for(var a=0; a<=6; a++)
			{
				for(var b=0; b<=5; b++)
				{
					if(a-b==j-ii)
					{
						if(matrix[a].length>=b&&matrix[a][b]== col)
						{
							counter++;
							if(counter>=4)
							{
								status = {
									status: "finale",
									content: col + " Wins!"
								}
							}
						}
						else
							counter = 0;

					}
					if(a+b==j+ii)
					{
						if(matrix[a].length>=b&&matrix[a][b]== col)
						{
							counter2++;
							if(counter2>=4)
							{
								status = {
									status: "finale",
									content: col + " Wins!"
								}
							}
						}
						else
							counter2 = 0;

					}
				}
			}			
			if(status == undefined)
			{
				return false;
			}
			else
			{
				lastmover.send(JSON.stringify(status));
				opponent.send(JSON.stringify(status));	
				return false;
			}
   	 	} 
	}
	//is a draw

	status = {
		status: "finale",
		content: "Its a Draw!"
	}
	lastmover.send(JSON.stringify(status));
	opponent.send(JSON.stringify(status));	
	


}


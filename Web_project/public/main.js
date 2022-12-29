var MouseX;
var MouseY;
var mouseDown;
var turn = false;

var game = document.getElementById("main");
game.style.display = "none";
var finale = document.getElementById("final_menu");
finale.style.display = "none";

var socket = new WebSocket("ws://" + window.location.host);


socket.onopen= function()
{
	//request matchmaking from server
	setTimeout(function()
	{
		socket.send(JSON.stringify({
			status: "play"
		}));
	}, 000);

}

socket.onmessage = function(event)
{
	var stats = JSON.parse(event.data);	

	if(stats.status == "play")
	{
		game.style.display = "block";
		document.getElementById("waiting").style.display = "none";
		setTimer();						
	}
	else if(stats.status == "turn")
	{
		turn = stats.content;
	}
	else if(stats.status == "move")
	{
		turn = stats.content;
		matrix[stats.column].push("whatever");
		switchcolors();	
		blobs[current_index].x = boardX + 100 * stats.column + 50;
		blobs[current_index].column = stats.column;
		blobs[current_index].row = matrix[stats.column].length-1;
		blobs[current_index].fall = true;
		current_index++;
		blobs.push(new blob(blobs[current_index-1].x,boardY-65,50, current_index%2==0 ? colors.blue:colors.red));
	}
	else if(stats.status == "mouseX")
	{
		MouseX = stats.content;
	}
	else if(stats.status == "finale" && finale.style.display == "none")
	{
		turn = false;
		setTimeout(function() {
			document.getElementById("message").innerHTML = stats.content;
			if(stats.content.includes("disconnected"))
			{
				console.log("here");
				document.getElementById("play").style.marginTop = "20px";
			}
			document.getElementById("container").style.animation = "finale";
  			document.getElementById("container").style.animationDuration = "0.7s";
			finale.style.display = "block";

		},1000);
	}
};

let sec = 0;
let min = 0;

function setTimer()
{
	setTimeout(setTimer, 1000);
	document.getElementById("timer").innerHTML = ("0" + min).slice(-2) + ":" + ("0" + sec).slice(-2);

	sec++;
	if(sec >= 60)
	{
		sec-=60;
		min++;
	}
}


window.addEventListener('resize', onResize);

window.addEventListener('mousedown', e => {
	mouseDown = true;
});

window.addEventListener('mouseup', e => {
  mouseDown = false;
});

window.addEventListener("mousemove", () => {
	if(turn)
	{
	 	MouseX = event.clientX;
	 	MouseY = event.clientY;
	}
 }); 

var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");


function repeatDraw()
{
	requestAnimationFrame(repeatDraw);
	draw();
}

function execSetup()
{
	setup();
}

function size(width, height)
{
	canvas.width = width;
	canvas.height = height;	
}

function background(color)
{
	ctx.fillStyle = color;
	ctx.fillRect(0,0,canvas.width,canvas.height);
}

//sending a message to opponent
//for fun ig
function sendmsg(msg)
{
	socket.send(JSON.stringify(
	{
		status: "message",
		content: msg
	}));	
}

function fullscreen()
{
	var element = document.documentElement;
    var isFullscreen = document.webkitIsFullScreen || document.mozFullScreen || false;

	element.requestFullScreen = element.requestFullScreen || element.webkitRequestFullScreen || element.mozRequestFullScreen || function () { return false; };
	document.cancelFullScreen = document.cancelFullScreen || document.webkitCancelFullScreen || document.mozCancelFullScreen || function () { return false; };

	isFullscreen ? document.cancelFullScreen() : element.requestFullScreen();
}


//do these once the game runs
execSetup();
repeatDraw();


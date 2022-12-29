let blobs = [];
let current_index;
let width;
let height;
let wobble = false;


let matrix = [];

for(var i = 0; i < 7; i++)
{
	matrix[i] = [];
}

const colors = {
	bg: "#444455",
	blue: "#606080",
	red: "#806060",
	stroke: "#777777"
};


function setup()
{
	size(window.innerWidth, window.innerHeight);
	height =  window.innerHeight;
	width = window.innerWidth;
	current_index = 0;
	background(colors.bg);

	blobs.push(new blob(window.innerWidth/2,boardY-65,50, colors.blue));
}

function switchcolors()
{
	var turn = document.getElementById("turn");

	var ref; 
	if(blobs[current_index].color == colors.red)
	{
		//turn blue
		ref = {
			bg: "#444455",
			turn: "Blue"
		}

	}
	else
	{
		//turn red
		ref = {
			bg: "#554444",
			turn: "Red"
		}

	}
	
	turn.innerHTML = ref.turn;
	colors.bg = ref.bg;

}

var x = 0;
var y = 0;

var boardX = window.innerWidth/2-325;
var boardY  = window.innerHeight/2-250;

function draw()
{
	background(colors.bg);
	
	if(mouseDown)
	{
	}
	
	if(wobble)
	{
		blobs[current_index].x += Math.random()*6-3
		blobs[current_index].y += Math.random()*6-3
	}
	for(var i = 0; i < blobs.length; i++)
	{
		blobs[i].show();
		blobs[i].update();
		if(i != current_index)
		{
			for(var j = 0; j < current_index; j++)
			{
				//check if collision happened
				if(i!=j && Math.abs(blobs[i].x - blobs[j].x) <= blobs[i].size + blobs[j].size-25)
				{
					if(Math.abs(blobs[i].y - blobs[j].y) <= blobs[i].size + blobs[j].size && blobs[i].stop != true)
					{
						new Audio("resources/click.wav").play();	
						blobs[i].stop = true;
					}
				}
			}	
		}
					
	}

	try
	{
		sendmsg({
			status: "mouseX",
			content: MouseX
		});
	}catch{}

	var img = new Image();
	img.src = "resources/image.png";
	ctx.drawImage(img,boardX, boardY, 700, 600);	
}

//temporary thing; to prevent annoying accidental clicks
var lastclicked=-1;
function mouseClicked()
{
	if(turn && lastclicked!=sec+60*min)
	{
		lastclicked = sec+60*min;
		//check if blob is in decent place
		if(checkblob())
		{
			var temp_col = Math.floor((blobs[current_index].x-boardX)/100);
			switchcolors();
			matrix[temp_col].push(blobs[current_index].color);
			
			//sending col number
			socket.send(JSON.stringify(
			{
				status: "move",
				column: temp_col
			}));
			
			blobs.push(new blob(blobs[current_index].x,boardY-65,50, blobs[current_index].color == colors.red ? colors.blue:colors.red));
			
			//snap blob to that place
			blobs[current_index].x = boardX + 100 * temp_col + 50;
			
			blobs[current_index].column = temp_col;
			blobs[current_index].row = matrix[temp_col].length-1;
			
			blobs[current_index].fall = true;
			current_index++;
			
			blobs[current_index].column = temp_col;
			blobs[current_index].row = matrix[temp_col].length;

		}
		else
		{
			wobble = true;
			setTimeout(function()
			{
				wobble = false;
				blobs[current_index].y = boardY-65 ;
			},200);

		}

	}
	else
	{
		wobble = true;
		setTimeout(function()
		{
			wobble = false;
			blobs[current_index].y = boardY-65 ;
		},200);
	}
	
}

function checkblob()
{
	if(blobs[current_index].x > boardX+40 && blobs[current_index].x < boardX+660)
	{
		for(var i = boardX+100; i < boardX+700; i+=100)
		{
			if(blobs[current_index].x > i - 20 && blobs[current_index].x < i + 20)
			{
				return false;
			}
		}
		if(matrix[Math.floor((blobs[current_index].x-boardX)/100)].length >= 6 )
		{
			return false;	
		}
		return true;
	}
	return false;
}


function onResize()
{
	size(window.innerWidth, window.innerHeight);
	boardX = window.innerWidth/2-325;
 	boardY  = window.innerHeight/2-250;

	for(var i = 0; i < current_index; i++)
	{
		blobs[i].correctPos(width,height);
	}

	blobs[current_index].y = boardY-65 ;
		
	width = window.innerWidth;
	height = window.innerHeight;
}

function blob(x,y,size,color)
{
	this.color = color;
	this.fall = false;
	this.stop = false;	
	this.vx = 0;
	this.vy = 0;
	this.x = x;
	this.y = y;
	this.size = size;
}

blob.prototype.show = function()
{
	ctx.fillStyle = this.color;
	//ctx.strokeStyle = colors.stroke;	
	//ctx.lineWidth = 7;
	ctx.beginPath();
	ctx.arc(this.x, this.y, this.size, 0, 2 * Math.PI);
	ctx.fill();	
	//ctx.stroke();
	
	ctx.fillStyle = colors.bg;
}

blob.prototype.update = function()
{
	if(!this.stop)
	{
		if(!this.fall)
		{
			this.vx = (MouseX - this.x)/20;

			if(isNaN(this.vx))
			{
				this.vx = 0;
			}
			if(isNaN(this.vy))
			{
				this.vy = 0;
			}
		}
		else
		{
			this.vx = 0;
			this.vy = 10;
		}
	
		if(this.y > window.innerHeight/2-250+600+(-this.size+15)*2+15)
		{
			this.vy = 0;
		}

		this.x += this.vx;
		this.y += this.vy;
	}
}

blob.prototype.correctPos = function(width, height)
{
	//corrects position of a single blob based
	// on column and row
	
	this.x = boardX + 100 * this.column + 50;
	
	this.y = boardY + 100 * (6-this.row) - 50;



}









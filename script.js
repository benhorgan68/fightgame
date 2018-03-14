var player;
var sock = io();

sock.on('msg', onMessage);
sock.on('pl', playerSet);
sock.on('d', playerDisconnect);

function playerSet(playerNum) {
	console.log(player);
	if(!(player + 1)) {
		player = playerNum;
		init();
	}
}

var SPEED = 3, ROTATE_SPEED = .5, MAX_VEL = 150;

var playerX, playerY, img1, canv, ctx, hVelocity, hAcceleration, vVelocity, vAcceleration = -0.6;

var mouseX = 0, mouseY = 0;

var punching = false, jumping = false;

var upK = false, downK = false, rightK = false, leftK = false, spaceK = false, rK = false;

var facing = "right", facing = "right";

var frameNum = 0, frameTimer = 0, lAction = 11, rAction = 9, jumpCooldown = 0, punchCooldown = 0;

var enemies = [" ", " "];

var playerHealth = 3, enemyHealth = 3;

var name;

function init() {
	console.log("test");
	document.getElementById("canvas1").setAttribute("width", $(window).width());
	document.getElementById("canvas1").setAttribute("height", $(window).height()-4);
	canv = document.getElementById("canvas1");
	ctx = canv.getContext("2d");
	ctx.font = "20px Arial";
	img1 = new Image();
	img1.src = "player1.png";
	img1.style.opacity = "0.5";
	playerX = canv.width/2;
	playerY = canv.height/2;
	name = "Player " + (player + 1);
	document.getElementById('name').value = name;
	
	gameLoop();
}

function onMessage(info) {
	//var playerNum = info.slice(0, info.indexOf('~'));
	if(player != info.playerNum) {
		//console.log('player: ' + player + '. playerNum: ' + playerNum);
		parseDataString(info);
	}
}

function playerDisconnect(num) {
	enemies[num] = null;
}

function setName() {
	name = document.getElementById('name').value;
}

function gameLoop() {
	clear();
	playerScript();
	enemyScript();
	setTimeout(gameLoop, 10);
	dataString = prepareDataString();
	sock.emit('msg', dataString);
}

function prepareDataString() {
	return {playerNum:player, name:name, X:playerX, Y:playerY, frameNum:frameNum, facing:facing, lAction:lAction, rAction:rAction};
}

function parseDataString(info) {
	enemies[info.playerNum] = info;
}

function playerScript() {
	cooldown();
	if((upK || jumping) && jumpCooldown == 0) jump();
	if(downK && !jumping) {
		crouch();
	}
	else if((spaceK || punching) && punchCooldown == 0) {
		resetSpeed();
		punch();
	}
	else if(leftK) move("left");
	else if(rightK) move("right");
	else {
		frameNum = 0;
		frameTimer = 1;
		resetSpeed();
	}
	ctx.fillText(name, playerX + 25, playerY);
	if(facing == "right") {
		ctx.drawImage(img1, 64*frameNum, 64*lAction + 1, 64, 64, playerX, playerY, 128, 128);
	}
	else if(facing == "left") {
		ctx.drawImage(img1, 64*frameNum, 64*rAction + 1, 64, 64, playerX, playerY, 128, 128);
	}
}

function enemyScript() {
	for(i = 0; i < enemies.length; i++) {
		if(enemies[i]) {
			ctx.fillText(enemies[i].name, enemies[i].X + 25, enemies[i].Y);
			if(enemies[i].facing == "right") {
				ctx.drawImage(img1, 64*enemies[i].frameNum, 64*enemies[i].lAction + 1, 64, 64, enemies[i].X, enemies[i].Y, 128, 128);
			}
			else if(enemies[i].facing == "left") {
				ctx.drawImage(img1, 64*enemies[i].frameNum, 64*enemies[i].rAction + 1, 64, 64, enemies[i].X, enemies[i].Y, 128, 128);
			}
		}
	}
}

function move(dir) {
	hVelocity += hAcceleration;
	hAcceleration -= 0.001;
	if(hAcceleration < 0) hAcceleration = 0;
	lAction = 11;
	rAction = 9;
	frameTimer = ((frameTimer + 1) % 5);
	if(frameTimer == 0) frameNum = (frameNum + 1) % 9;
	if(dir == "left") {
		playerX -= hVelocity;
		facing = "left";
	}
	else if(dir == "right") {
		playerX += hVelocity;
		facing = "right";
	}
}

function crouch() {
	frameNum = 4;
	lAction = 20;
	rAction = 20;
}

function jump() {
	if(!jumping) vVelocity = 15;
	jumping = true;
	if(!punching) {
		vVelocity += vAcceleration;
		playerY -= vVelocity;
	}
	if(playerY > canv.height/2) {
		playerY = canv.height/2;
		jumping = false;
		jumpCooldown = 15;
	}
}

function punch() {
	if(!punching) frameNum = 0;
	punching = true;
	lAction = 7;
	rAction = 5;
	frameTimer = ((frameTimer + 1) % 3);
	if(frameTimer == 0) frameNum += 1;
	if(frameNum == 8) {
		frameNum = 0;
		punching = false;
		punchCooldown = 20;
	}
}

function cooldown() {
	jumpCooldown--;
	if(jumpCooldown < 0) jumpCooldown = 0;
	punchCooldown--;
	if(punchCooldown < 0) punchCooldown = 0;
}

function resetSpeed() {
	hVelocity = 1.5;
	hAcceleration = 0.1;
}

document.onkeydown = function(e) {
	keyPress(e, true);
};
document.onkeyup = function(e) {
	keyPress(e, false);
};
function keyPress(e, TorF) {
	if (e.keyCode == '37') { //left
        leftK = TorF;
    }
	else if(e.keyCode == '39') { //right
		rightK = TorF;
	}
	else if(e.keyCode == '38') { //up
		upK = TorF;
	}
	else if(e.keyCode == '40') { //down
		downK = TorF;
	}
	else if(e.keyCode == '32') { //space
		spaceK = TorF;
	}
	else if(e.keyCode == '82') { //R
		rK = TorF;
	}
};

function clear() {
	ctx.save();
	ctx.setTransform(1, 0, 0, 1, 0, 0);
	ctx.clearRect(0, 0, canv.width, canv.height);
	ctx.restore();
}

document.onmousemove = function(e) {
	mouseX = e.pageX;
	mouseY = e.pageY;
}






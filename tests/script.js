var player;
var sock = io();

sock.on('msg', onMessage);
sock.on('pl', playerSet);

function playerSet(playerNum) {
	player = playerNum;
	console.log(playerNum);
	init();
	//document.getElementById('player').innerHTML = player;
}

var SPEED = 3, ROTATE_SPEED = .5, MAX_VEL = 150;

var playerX, playerY, enemyX, enemyY, img1, canv, ctx, hVelocity, hAcceleration, vVelocity, vAcceleration = -0.6;

var mouseX = 0, mouseY = 0;

var punching = false, jumping = false;

var upK = false, downK = false, rightK = false, leftK = false, spaceK = false, rK = false;

var facing = "right", enemyFacing = "right";

var frameNum = 0, frameTimer = 0, lAction = 11, rAction = 9, jumpCooldown = 0, punchCooldown = 0;

var enemyFrameNum = 0, enemyLAction = 11, enemyRAction = 9;

var playerHealth = 3, enemyHealth = 3;

var player2On = false;

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
	enemyX = 200;
	enemyY = canv.height/2;
	
	gameLoop();
}

function onMessage(info) {
	if(player != info.slice(0, 8)) {
		console.log('message sent! info: ' + info);
		player2On = true;
		parseDataString(info);
	}
}

function gameLoop() {
	clear();
	playerScript();
	if(player2On) enemyScript();
	setTimeout(gameLoop, 10);
	dataString = prepareDataString();
	sock.emit('msg', player + dataString);
}

function prepareDataString() {
	return playerX + '~' + playerY + '~' + frameNum + '~' + facing + '~' + lAction + '~' + rAction;
}

function parseDataString(info) {
	str = info.slice(8);
	
	enemyX = str.slice(0, str.indexOf('~'));
	str = str.slice(str.indexOf('~') + 1);
	
	enemyY = str.slice(0, str.indexOf('~'));
	str = str.slice(str.indexOf('~') + 1);
	
	enemyFrameNum = str.slice(0, str.indexOf('~'));
	str = str.slice(str.indexOf('~') + 1);
	
	enemyFacing = str.slice(0, str.indexOf('~'));
	str = str.slice(str.indexOf('~') + 1);
	
	enemyLAction = str.slice(0, str.indexOf('~'));
	str = str.slice(str.indexOf('~') + 1);
	
	enemyRAction = str.slice(0);
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
	ctx.fillText(player, playerX + 25, playerY);
	if(facing == "right") {
		ctx.drawImage(img1, 64*frameNum, 64*lAction + 1, 64, 64, playerX, playerY, 128, 128);
	}
	else if(facing == "left") {
		ctx.drawImage(img1, 64*frameNum, 64*rAction + 1, 64, 64, playerX, playerY, 128, 128);
	}
}

function enemyScript() {
	if(enemyFacing == "right") {
		ctx.drawImage(img1, 64*enemyFrameNum, 64*enemyLAction + 1, 64, 64, enemyX, enemyY, 128, 128);
	}
	else if(enemyFacing == "left") {
		ctx.drawImage(img1, 64*enemyFrameNum, 64*enemyRAction + 1, 64, 64, enemyX, enemyY, 128, 128);
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






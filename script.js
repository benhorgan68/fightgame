var player;
var sock = io();

sock.on('i', onInfo);
sock.on('pl', playerSet);
sock.on('d', playerDisconnect);
sock.on('msg', onMessage);
sock.on('rerr', regError);
sock.on('lerr', loginError);

function playerSet(playerNum) {
	if(!(player + 1)) {
		player = playerNum;
		init();
	}
	else {
		document.getElementById('chat').innerHTML += '<p><span class="server">Player ' + (playerNum + 1) + ' has connected</span></p>';
		document.getElementById('chat').scrollTop = document.getElementById("chat").scrollHeight;
	}
}

var DEVMODE = false;

var PLAYER_WIDTH = 64.0*2, PLAYER_HEIGHT = 64.0*2, PUNCH_COOLDOWN = 350, JUMP_COOLDOWN = 30, ORB_COOLDOWN = 1200, ORB_WIDTH = 32, ORB_HEIGHT = 32, ORB_SPEED = 1.5, PUNCHED_TIME = 300, MAX_H_VELOCITY = 16, STARTING_H_VELOCITY = 5, H_ACCELERATION = 0.5, STARTING_V_VELOCITY = 0.005, V_ACCELERATION = -PLAYER_HEIGHT/30000;

var playerX, playerY, playerImg, canv, ctx, hVelocity, hAcceleration, vVelocity, groundLevel,
mouseX = 0, mouseY = 0, camX = 0, camY = 0,
action = "STANDING",
jumping = false, knocked = false,
facing = "right", knockBackDir,
frameNum = 0, frameTimer = 1, lAction = 9, rAction = 11, jumpCooldown = 0, punchCooldown = 0, orbCooldown = 0, punchedTimer = 0, knockBackTimer = 0,
jumpTimer = 0,
enemies = [],
health = 10,
name, 
skin = 1,
currency = 0,
pressed = [], KeyEvent,
now = Date.now(), clock = 1,
orb = 0, jumps = 0,
chatting = false,
diffTab = false,
jumpReady = true,
orbs = [],
player1ping = Date.now();

function init() {
	canv = document.getElementById("canvas1");
	canv.width = 1920;
	canv.height = 1080;	
	canv.style.width = '100%';
	ctx = canv.getContext("2d");
	ctx.font = "20px Arial";
	ctx.fillStyle = "black";
	
	playerImg = new Image();
	playerImg.src = "player1.png";
	orbImg = new Image();
	orbImg.src = "orb.png";
	bgImg = new Image();
	bgImg.src = "tiledbg.png";
	
	groundLevel = 230;
	playerX = 0;
	playerY = groundLevel + PLAYER_HEIGHT;
	name = "Player " + (player + 1);
	document.getElementById('name').value = name;
	document.getElementById('chat').style = 'width:100%; height:60%; font-size: ' + (canv.offsetWidth / 100) + 'px;';
	initializeKeys();
	resetSpeed();
	window.focus();
	
	gameLoop();
}

function onInfo(info) {
	if(player != info.playerNum) {
		parseDataString(info);
		if(info.playerNum == 1) {
			console.log(Date.now() - player1ping)
			player1ping = Date.now();
		}
	}
}

function focusCanvas() {
	canvas1.focus();
}

document.getElementById('chat-form').addEventListener('submit', function(e) {
	message = document.getElementById('message');
	if(message.value != '')
		sock.emit('msg', [name, message.value]);
	message.value = '';
	message.style.visibility = 'hidden';
	e.preventDefault();
});

document.getElementById('name-change').addEventListener('submit', function(e) {
	setName(document.getElementById('name').value);
	document.getElementById('name').blur();
	e.preventDefault();
});

document.getElementById('register').addEventListener('submit', function(e) {
	sock.emit('reg', {username: document.getElementById('registeruser').value, password: document.getElementById('registerpass').value, skin: skin});
	e.preventDefault();
});

document.getElementById('login').addEventListener('submit', function(e) {
	sock.emit('log', {username: document.getElementById('loginuser').value, password: document.getElementById('loginpass').value});
	e.preventDefault();
});

function playerDisconnect(num) {
	document.getElementById('chat').innerHTML += '<p><span class="server">' + enemies[num].name + ' has disconnected</span></p>';
	enemies[num] = null;
	document.getElementById('chat').scrollTop = document.getElementById("chat").scrollHeight;
}

function setName() {
	name = document.getElementById('name').value;
}

function gameLoop() {
	window.focus();
//	window.requestAnimationFrame(gameLoop);
	//console.log(clock);
	clear();
	clock = Date.now() - now;
	now = Date.now();
	if(diffTab) {
		orbs = [];
		action = "STANDING";
	}
//	ctx.drawImage(bgImg, 0, 0);
	environmentScript();
	playerScript();
	enemyScript();
	sleep(0);
	dataString = prepareDataString();
	sock.emit('i', dataString);
	window.requestAnimationFrame(gameLoop);
}

function sleep(miliseconds) {
   var currentTime = new Date().getTime();

   while (currentTime + miliseconds >= new Date().getTime()) {
   }
}

window.onblur = function() {
	diffTab = true;
	if(DEVMODE) {
		console.log('blur');
	}
	/*if(!DEVMODE) {
		diffTab = true;
	} else {	
		console.log('blur');
	}*/
}

window.onfocus = function() {
	diffTab = false;
	if(DEVMODE) {
		console.log('focus');
	}
}

function prepareDataString() {
	return {playerNum:player, name, X:playerX, Y:playerY, frameNum, facing, lAction, rAction, action, skin, health, orbs, diffTab};
}

function parseDataString(info) {
	enemies[info.playerNum] = info;
}

function onMessage(txt) {
	document.getElementById('chat').innerHTML += '<p><span class="user">' + txt[0] + ': </span><span class="message">' + txt[1] + '</span></p>';
	document.getElementById("chat").scrollTop = document.getElementById("chat").scrollHeight;
}

function regError(msg) {
	if(typeof msg == "string") {
		document.getElementById('regerr').innerHTML = msg;
	}
	else {
		document.getElementById('regerr').innerHTML = "";
		document.getElementById('account').style = "visibility: hidden;";
		document.getElementById('accountName').innerHTML = "Logged in as " + msg.username;
		document.getElementById('accountName').style = "visibility: visible;";
	}
}

function loginError(msg) {
	if(typeof msg == "string") {
		document.getElementById('logerr').innerHTML = msg;
	}
	else {
		document.getElementById('logerr').innerHTML = "";
		document.getElementById('account').style = "visibility: hidden;";
		document.getElementById('accountName').innerHTML = "Logged in as " + msg.username;
		document.getElementById('accountName').style = "visibility: visible;";
		skin = msg.skin;
	}
}

function draw3(img, x, y) {
	ctx.drawImage(img, x - camX, camY - y);
}

function draw5(img, x, y, w, h) {
	ctx.drawImage(img, x - camX, camY - y, w, h);
}

function draw9(img, cx, cy, cw, ch, x, y, w, h) {
	ctx.drawImage(img, cx, cy, cw, ch, x - camX, camY - y, w, h);
}

function playerScript() {
	cooldown();
	checkAttacks(); //check if player is being attacked
	for(var i = 0; i < orbs.length; i++) {
		if(orbs[i]) {
			if(orbs[i].facing == "left") {
				orbs[i].X -= clock*ORB_SPEED;
			}
			else
				orbs[i].X += clock*ORB_SPEED;
			if((orbs[i].facing == "left" && orbs[i].X <= orbs[i].orbEnd) || (orbs[i].facing == "right" && orbs[i].X >= orbs[i].orbEnd)) {
				orbs[i] = 0;
			}
			//check if hitting enemy
			for(var j = 0; j < enemies.length; j++) {
				if(enemies[j]) {
					if((orbs[i].X > enemies[j].X - ORB_WIDTH && orbs[i].X < enemies[j].X + PLAYER_WIDTH)
					&& (orbs[i].Y > enemies[j].Y - ORB_HEIGHT && orbs[i].Y < enemies[j].Y + PLAYER_HEIGHT)
					&& enemies[j].action == "PUNCHED"
					) {
						console.log("deleted orb");
						delete orbs[i];
					}	
				}
			}
		}
	}
	if(jumping) {
		if(!pressed[KeyEvent.W])
			jumpReady = true;
		jump();
	}
	if(knocked) knockback();
	if(action == "PUNCHED"){
		getPunched();
	}
	else if(document.activeElement.id != "name" && document.activeElement.id != "message") {
		if((pressed[KeyEvent.W]) && jumpReady && jumps < 2 && jumpCooldown == 0) initiateJump();
		if(pressed[KeyEvent.S] && !jumping) {
			action = "CROUCHING";
			crouch();
		}
		else if((pressed[KeyEvent.LEFT] || action == "PUNCHING") && punchCooldown == 0) {
			resetSpeed();
			punch();
		}
		else if(pressed[KeyEvent.RIGHT] && orbCooldown == 0) {
			var i = 0;
			while(orbs[i]) i++;
			orbs[i] = {X: playerX + (PLAYER_WIDTH/2), Y: playerY - (PLAYER_HEIGHT/3), facing: facing, orbEnd: 0};
			if(facing == "left") orbs[i].orbEnd = orbs[i].X - 2000;
			else orbs[i].orbEnd = orbs[i].X + 2000;
			orbCooldown = ORB_COOLDOWN;
		}
		else if(pressed[KeyEvent.A] && !knocked) {
			if(action != "WALKING") {
				hVelocity = STARTING_H_VELOCITY;
				hAcceleration = H_ACCELERATION;
			}
			walk("left");
		}
		else if(pressed[KeyEvent.D] && !knocked) {
			if(action != "WALKING") {
				hVelocity = STARTING_H_VELOCITY;
				hAcceleration = H_ACCELERATION;
			}
			walk("right");
		}
		else {
			frameNum = 0;
			frameTimer = 1;
			lAction = 9;
			rAction = 11;
			action = "STANDING";
			resetSpeed();
		}
		if(pressed[KeyEvent.R]) {
			skin = 2;
		}
		if(pressed[KeyEvent.T]) {
			skin = 1;
		}
	}
	else {
		frameNum = 0;
		frameTimer = 1;
		lAction = 9;
		rAction = 11;
	}
	ctx.fillStyle = "black";
	
	for(var i = 0; i < orbs.length; i++) {
		if(orbs[i]) {
			draw5(orbImg, orbs[i].X, orbs[i].Y, ORB_WIDTH, ORB_HEIGHT);
			console.log(orbs[i].X + " " + orbs[i].Y);
		}
	}
	
	if(facing == "left") dir = lAction;
	else dir = rAction;
	//checkPosition();
	cameraScript();
	ctx.fillStyle = "red";
	writeCenteredText(name, playerX + PLAYER_WIDTH/2, playerY); //write name
	writeCenteredText('HP ' + health + '/10', playerX + PLAYER_WIDTH/2, playerY - 20); //write health
	if(diffTab)
		writeCenteredText('PAUSED', playerX + PLAYER_WIDTH/2, playerY + 30);
	draw9(playerImg, 64*frameNum, 64*dir + 1, 64, 64, playerX, playerY, PLAYER_WIDTH, PLAYER_HEIGHT);
	draw9(playerImg, 64*0, 64*0 + 1, 64, 64, 300, groundLevel + PLAYER_HEIGHT, PLAYER_WIDTH, PLAYER_HEIGHT);
	playerImg.src = 'player' + skin + '.png';
	ctx.fillStyle = "blue";
	if(DEVMODE) {
		ctx.fillText("Clock: " + clock, 50, 50);
		ctx.fillText("X: " + playerX + "  Y: " + playerY + " Height: " + playerImg.height, 50, 150);
		//console.log("X: " + playerX + "  Y: " + playerY);
	}
		
}

function enemyScript() {
	for(var i = 0; i < enemies.length; i++) {
		if(enemies[i]) {
			writeCenteredText(enemies[i].name, enemies[i].X + PLAYER_WIDTH/2, enemies[i].Y); //write name
			writeCenteredText('HP ' + enemies[i].health + '/10', enemies[i].X + PLAYER_WIDTH/2, enemies[i].Y - 20); //write health
			if(enemies[i].diffTab)
				writeCenteredText('PAUSED', enemies[i].X + PLAYER_WIDTH/2, enemies[i].Y + 30);
			
			for(var j = 0; j < enemies[i].orbs.length; j++) {
				if(enemies[i].orbs[j]) {
					draw5(orbImg, enemies[i].orbs[j].X, enemies[i].orbs[j].Y, ORB_WIDTH, ORB_HEIGHT);
				}
			}
			var im = new Image(); 
			im.src = 'player' + enemies[i].skin + '.png';
			if(enemies[i].facing == "left") dir = enemies[i].lAction;
			else dir = enemies[i].rAction;
			draw9(im, 64*enemies[i].frameNum, 64*dir + 1, 64, 64, enemies[i].X, enemies[i].Y, PLAYER_WIDTH, PLAYER_HEIGHT);
		}
	}
}

function environmentScript() {
	draw5(bgImg, Math.floor((playerX + PLAYER_WIDTH / 2) / canv.width) * canv.width, canv.height, canv.width, canv.height);
	draw5(bgImg, Math.floor((playerX + PLAYER_WIDTH / 2) / canv.width) * canv.width + canv.width, canv.height, canv.width, canv.height);
	draw5(bgImg, Math.floor((playerX + PLAYER_WIDTH / 2) / canv.width) * canv.width - canv.width, canv.height, canv.width, canv.height);
}

function checkAttacks() {
	for(var i = 0; i < enemies.length; i++) {
		if(enemies[i]) {
			for(var j = 0; j < enemies[i].orbs.length; j++) {
				if(enemies[i].orbs[j]) {
					if((enemies[i].orbs[j].X > playerX - ORB_WIDTH && enemies[i].orbs[j].X < playerX + PLAYER_WIDTH)
					&& (enemies[i].orbs[j].Y > playerY - ORB_HEIGHT && enemies[i].orbs[j].Y < playerY + PLAYER_HEIGHT)
					) {
						if(action != "PUNCHED" && action != "CROUCHING") {
							action = "PUNCHED";
							health -= 1;
							punchedCooldown = PUNCHED_TIME;
							knocked = true;
							knockBackTimer = 500;
							knockBackDir = enemies[i].orbs[j].facing;
						}	
					}
				}
			}
			
			if(enemies[i].action == "PUNCHING" 
			&& ((enemies[i].facing == "right" && playerX >= enemies[i].X) || (enemies[i].facing == "left" && playerX <= enemies[i].X))
			&& (enemies[i].X > playerX - PLAYER_WIDTH && enemies[i].X < playerX + PLAYER_WIDTH)
			&& (enemies[i].Y > playerY - PLAYER_HEIGHT && enemies[i].Y < playerY + PLAYER_HEIGHT)
			) {
				if(action != "PUNCHED") {
					action = "PUNCHED";
					health -= 1;
					punchedCooldown = PUNCHED_TIME;
					knocked = true;
					knockBackTimer = 500;
					knockBackDir = enemies[i].facing;
				}
			}
		}
	}
	if(health <= 0) {
		playerX = canv.width / 2;
		playerY = groundLevel - PLAYER_HEIGHT;
		health = 10;
		action="STANDING";
		jumping = false;
		knocked = false;
		jumpReady = true;
	}
}

function cameraScript() {
	camX = playerX - ((canv.width - PLAYER_WIDTH) / 2);
	camY = playerY + ((canv.height - PLAYER_HEIGHT) / 2);
	if(camY < canv.height) camY = canv.height;
	if(camY > canv.height) camY = canv.height;
}

function checkPosition() {
	if(playerX < 0) playerX = 0;
	if(playerX > canv.width - PLAYER_WIDTH) playerX = canv.width - PLAYER_WIDTH;
}

function writeCenteredText(txt, x, y) {
	var fontTest = document.getElementById('font-test');
	fontTest.innerHTML = txt;
	fontTest.style.fontSize = '20px';
	var fontHeight = fontTest.clientHeight + 1;
	var fontWidth = fontTest.clientWidth + 1;
	ctx.fillText(txt, (x - fontWidth/2) - camX, camY - y);
}	

function walk(dir) {
	action = "WALKING";
	hVelocity += (hAcceleration*clock)/20;// hAcceleration;
	//hAcceleration -= 0.001;
	if(hVelocity > MAX_H_VELOCITY) {
		hAcceleration = 0;
		hVelocity = MAX_H_VELOCITY;
	}
	hVelocity = MAX_H_VELOCITY;
	lAction = 9;
	rAction = 11;
	frameTimer = (frameTimer + clock);
	if(frameTimer >= 30) {
		frameNum = (frameNum + 1) % 9;
		frameTimer = 1;
	}
	if(dir == "left") {
		playerX -= hVelocity*clock/20;
		facing = "left";
	}
	else if(dir == "right") {
		playerX += hVelocity*clock/20;
		facing = "right";
	}
}

function knockback(dir) {
	if(knockBackDir == "left") {
		playerX -= 2*clock;
	} else if(knockBackDir == "right") {
		playerX += 2*clock;
	}
	knockBackTimer -= 50
	if(knockBackTimer <= 0) {
		knocked = false;
		knockBackTimer = 0;
	}
}

function crouch() {
	frameNum = 4;
	lAction = 20;
	rAction = 20;
}

function getPunched() {
	frameNum = 5;
	lAction = 1;
	rAction = 3;
	punchedCooldown -= clock;
	if(punchedCooldown <= 0) action = "STANDING";
}

function initiateJump() {
	if(jumps == 0) {
		jumps = 1;
	} else {
		jumps = 2;
	}
	jumpReady = false;
//	vVelocity = (PLAYER_HEIGHT*STARTING_V_VELOCITY);
//	vVelocity = 0;
	jumping = true;
	jumpTimer = 0;
}

function jump() {
	jumpTimer += clock;
	
	/*vVelocity += (V_ACCELERATION*clock);
	playerY += vVelocity*clock*clock;*/
	var jumpHeight = 300;
	var jumpTimeHeight = 400;
	playerY += clock*(-jumpTimer + clock + jumpTimeHeight) / jumpHeight;
	//increase the first constant to increase jump time and height,
	//increase the second to decrease jump height
	
	if(!pressed[KeyEvent.W]) {
		jumpReady = true;
	}
	if(playerY <= groundLevel + PLAYER_HEIGHT) {
		playerY = groundLevel + PLAYER_HEIGHT;
		jumping = false;
		jumpReady = true;
		jumps = 0;
		jumpCooldown = JUMP_COOLDOWN;
	}
}

function punch() {
	if(action != "PUNCHING") frameNum = 0;
	action = "PUNCHING";
	lAction = 5;
	rAction = 7;
	frameTimer = frameTimer + clock;
	if(frameTimer >= 15) {
		frameNum += 1;
		frameTimer = 1;
	}
	if(frameNum == 8) {
		frameNum = 0;
		action = "STANDING";
		punchCooldown = PUNCH_COOLDOWN;
	}
}

function cooldown() {
	jumpCooldown -= clock;
	if(jumpCooldown < 0) jumpCooldown = 0;
	punchCooldown -= clock;
	if(punchCooldown < 0) punchCooldown = 0;
	orbCooldown -= clock;
	if(orbCooldown < 0) orbCooldown = 0;
}

function resetSpeed() {
	hVelocity = 0;
	hAcceleration = 0;
}

document.addEventListener('keydown', function(e) {
	keyPress(e, true);
	
	var message = document.getElementById('message');
	if(e.keyCode == KeyEvent.RETURN && document.activeElement.id == 'main') {
		message.style.visibility = 'visible';
	}
});

document.addEventListener('keyup', function(e) {
	keyPress(e, false);
	
	var message = document.getElementById('message');
	if(e.keyCode == KeyEvent.RETURN && message.style.visibility == 'visible') {
		//message.style.visibility = 'visible';
		message.focus();	
		chatting = true;
	}
});

function keyPress(e, TorF) {
	if(document.activeElement.id == 'main')
		pressed[e.keyCode] = TorF;
};

function resize() {
//	canv.style.width = '100%';
	var divisor = 100;
	document.getElementById('chat').style = 'font-size: ' + (canv.offsetWidth / divisor) + 'px;';
	document.getElementById('name').style = 'font-size: ' + (canv.offsetWidth / divisor) + 'px;';
	document.getElementById('name-change-button').style = 'font-size: ' + (canv.offsetWidth / divisor) + 'px;';
	document.getElementById('loginuser').style = 'font-size: ' + (canv.offsetWidth / divisor) + 'px;';
	document.getElementById('loginpass').style = 'font-size: ' + (canv.offsetWidth / divisor) + 'px;';
	document.getElementById('registeruser').style = 'font-size: ' + (canv.offsetWidth / divisor) + 'px;';
	document.getElementById('registerpass').style = 'font-size: ' + (canv.offsetWidth / divisor) + 'px;';
	document.getElementById('loginButton').style = 'font-size: ' + (canv.offsetWidth / divisor) + 'px;';
	document.getElementById('registerButton').style = 'font-size: ' + (canv.offsetWidth / divisor) + 'px;';
}

function clear() {
	ctx.save();
	ctx.setTransform(1, 0, 0, 1, 0, 0);
	ctx.clearRect(0, 0, canv.width, canv.height);
	ctx.restore();
}

function toggleSidebar() {
	var sidebar = document.getElementById("sidebardiv");
	if(sidebar.style.visibility == "hidden")
		sidebar.style.visibility = "visible";
	else
		sidebar.style.visibility = "hidden";
	window.focus();
	document.getElementById("toggleSidebarButton").blur();
}

document.onmousewalk = function(e) {
	mouseX = e.pageX;
	mouseY = e.pageY;
}

function initializeKeys() {
	KeyEvent = {
		CANCEL: 3,
		HELP: 6,
		BACK_SPACE: 8,
		TAB: 9,
		CLEAR: 12,
		RETURN: 13,
		ENTER: 14,
		SHIFT: 16,
		CONTROL: 17,
		ALT: 18,
		PAUSE: 19,
		CAPS_LOCK: 20,
		ESCAPE: 27,
		SPACE: 32,
		PAGE_UP: 33,
		PAGE_DOWN: 34,
		END: 35,
		HOME: 36,
		LEFT: 37,
		UP: 38,
		RIGHT: 39,
		DOWN: 40,
		PRINTSCREEN: 44,
		INSERT: 45,
		DELETE: 46,
		0: 48,
		1: 49,
		2: 50,
		3: 51,
		4: 52,
		5: 53,
		6: 54,
		7: 55,
		8: 56,
		9: 57,
		SEMICOLON: 59,
		EQUALS: 61,
		A: 65,
		B: 66,
		C: 67,
		D: 68,
		E: 69,
		F: 70,
		G: 71,
		H: 72,
		I: 73,
		J: 74,
		K: 75,
		L: 76,
		M: 77,
		N: 78,
		O: 79,
		P: 80,
		Q: 81,
		R: 82,
		S: 83,
		T: 84,
		U: 85,
		V: 86,
		W: 87,
		X: 88,
		Y: 89,
		Z: 90,
		CONTEXT_MENU: 93,
		NUMPAD0: 96,
		NUMPAD1: 97,
		NUMPAD2: 98,
		NUMPAD3: 99,
		NUMPAD4: 100,
		NUMPAD5: 101,
		NUMPAD6: 102,
		NUMPAD7: 103,
		NUMPAD8: 104,
		NUMPAD9: 105,
		MULTIPLY: 106,
		ADD: 107,
		SEPARATOR: 108,
		SUBTRACT: 109,
		DECIMAL: 110,
		DIVIDE: 111,
		F1: 112,
		F2: 113,
		F3: 114,
		F4: 115,
		F5: 116,
		F6: 117,
		F7: 118,
		F8: 119,
		F9: 120,
		F10: 121,
		F11: 122,
		F12: 123,
		F13: 124,
		F14: 125,
		F15: 126,
		F16: 127,
		F17: 128,
		F18: 129,
		F19: 130,
		F20: 131,
		F21: 132,
		F22: 133,
		F23: 134,
		F24: 135,
		NUM_LOCK: 144,
		SCROLL_LOCK: 145,
		COMMA: 188,
		PERIOD: 190,
		SLASH: 191,
		BACK_QUOTE: 192,
		OPEN_BRACKET: 219,
		BACK_SLASH: 220,
		CLOSE_BRACKET: 221,
		QUOTE: 222,
		META: 224
	};
}


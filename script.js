var player;
var sock = io();

sock.on('i', onInfo);
sock.on('pl', playerSet);
sock.on('d', playerDisconnect);
sock.on('msg', onMessage);

function playerSet(playerNum) {
	if(!(player + 1)) {
		player = playerNum;
		init();
	}
	else {
		document.getElementById('chat').innerHTML += '<p><span class="server">Player ' + (playerNum + 1) + ' has connected</span></p>';
	}
}

var SPEED = 3, ROTATE_SPEED = .5, MAX_VEL = 150, PLAYER_WIDTH = 64.0*2, PLAYER_HEIGHT = 64.0*2, PUNCHED_TIME = 40;

var playerX, playerY, playerImg, canv, ctx, hVelocity, hAcceleration, vVelocity, vAcceleration = -PLAYER_HEIGHT/100, groundLevel,
mouseX = 0, mouseY = 0,
action = "STANDING",
jumping = false,
facing = "right",
frameNum = 0, frameTimer = 0, lAction = 9, rAction = 11, jumpCooldown = 0, punchCooldown = 0, punchedTimer = 0,
enemies = [],
health = 10,
name, 
skin = 1,
pressed = [], KeyEvent;

function init() {
	canv = document.getElementById("canvas1");
	canv.width = 1920;
	canv.height = 1080;
	canv.style.width = '80%';
	ctx = canv.getContext("2d");
	ctx.font = "20px Arial";
	ctx.fillStyle = "black";
	playerImg = new Image();
	playerImg.src = "player1.png";
	groundLevel = canv.height;
	playerX = canv.width / 2;
	playerY = groundLevel - PLAYER_HEIGHT;
	name = "Player " + (player + 1);
	document.getElementById('name').value = name;
	document.getElementById('chat').style = 'width:100%; height:80%; font-size: ' + (canv.offsetWidth / 100) + 'px;';
	initializeKeys();
	
	gameLoop();
}

function onInfo(info) {
	if(player != info.playerNum) {
		parseDataString(info);
	}
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

function playerDisconnect(num) {
	document.getElementById('chat').innerHTML += '<p><span class="server">' + enemies[num].name + ' has disconnected</span></p>';
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
	sock.emit('i', dataString);
}

function prepareDataString() {
	return {playerNum:player, name:name, X:playerX, Y:playerY, frameNum:frameNum, facing:facing, lAction:lAction, rAction:rAction, action:action, skin:skin, health:health};
}

function parseDataString(info) {
	enemies[info.playerNum] = info;
}

function onMessage(txt) {
	document.getElementById('chat').innerHTML += '<p><span class="user">' + txt[0] + ': </span><span class="message">' + txt[1] + '</span></p>';
	document.getElementById("chat").scrollTop = document.getElementById("chat").scrollHeight;
}

function playerScript() {
	cooldown();
	checkAttacks(); //check if player is being attacked
	if(document.activeElement.id != "name" && document.activeElement.id != "message") {
		if(action == "PUNCHED"){
			getPunched();
		} else {
			if((pressed[KeyEvent.UP] || jumping) && jumpCooldown == 0) jump();
			if(pressed[KeyEvent.DOWN] && !jumping) {
				action = "CROUCHING";
				crouch();
			}
			else if((pressed[KeyEvent.SPACE] || action == "PUNCHING") && punchCooldown == 0) {
				resetSpeed();
				punch();
			}
			else if(pressed[KeyEvent.LEFT]) walk("left");
			else if(pressed[KeyEvent.RIGHT]) walk("right");
			else {
				frameNum = 0;
				frameTimer = 1;
				lAction = 9;
				rAction = 11;
				action = "STANDING";
				resetSpeed();
			}
		}
		if(pressed[KeyEvent.R]) {
			skin = 2;
		}
		if(pressed[KeyEvent.T]) {
			skin = 1;
		}
	}
	
	ctx.fillStyle = "red";
	writeCenteredText(name, playerX + PLAYER_WIDTH/2, playerY - 30); //write name
	writeCenteredText('HP ' + health + '/10', playerX + PLAYER_WIDTH/2, playerY); //write health
	ctx.fillStyle = "black";
	
	if(facing == "left") dir = lAction;
	else dir = rAction;
	ctx.drawImage(playerImg, 64*frameNum, 64*dir + 1, 64, 64, playerX, playerY, PLAYER_WIDTH, PLAYER_HEIGHT);
	playerImg.src = 'player' + skin + '.png';
}

function enemyScript() {
	for(i = 0; i < enemies.length; i++) {
		if(enemies[i]) {
			writeCenteredText(enemies[i].name, enemies[i].X + PLAYER_WIDTH/2, enemies[i].Y - 30); //write name
			writeCenteredText('HP ' + enemies[i].health + '/10', enemies[i].X + PLAYER_WIDTH/2, enemies[i].Y); //write health
			
			var im = new Image(); 
			im.src = 'player' + enemies[i].skin + '.png';
			if(enemies[i].facing == "left") dir = enemies[i].lAction;
			else dir = enemies[i].rAction;
			ctx.drawImage(im, 64*enemies[i].frameNum, 64*dir + 1, 64, 64, enemies[i].X, enemies[i].Y, PLAYER_WIDTH, PLAYER_HEIGHT);
		}
	}
}

function checkAttacks() {
	for(var i = 0; i < enemies.length; i++) {
		if(enemies[i]) {
			if(enemies[i].action == "PUNCHING" 
			&& ((enemies[i].facing == "right" && playerX >= enemies[i].X) || (enemies[i].facing == "left" && playerX <= enemies[i].X))
			&& (enemies[i].X > playerX - PLAYER_WIDTH && enemies[i].X < playerX + PLAYER_WIDTH)
			&& (enemies[i].Y > playerY - PLAYER_HEIGHT && enemies[i].Y < playerY + PLAYER_HEIGHT)
			) {
				if(action != "PUNCHED") {
					action = "PUNCHED";
					health -= 1;
					punchedCooldown = PUNCHED_TIME;
				}
			}
		}
	}
	if(health <= 0) {
		playerX = canv.width / 2;
		playerY = groundLevel - PLAYER_HEIGHT;
		health = 10;
	}
}

function writeCenteredText(txt, x, y) {
	var fontTest = document.getElementById('font-test');
	fontTest.innerHTML = txt;
	fontTest.style.fontSize = '20px';
	var fontHeight = fontTest.clientHeight + 1;
	var fontWidth = fontTest.clientWidth + 1;
	ctx.fillText(txt, x - fontWidth/2, y);
}	

function walk(dir) {
	action = "WALKING";
	hVelocity += hAcceleration;
	hAcceleration -= 0.001;
	if(hAcceleration < 0) hAcceleration = 0;
	lAction = 9;
	rAction = 11;
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

function move(dir) {
	hVelocity += hAcceleration;
	hAcceleration -= 0.001;
	if(hAcceleration < 0) hAcceleration = 0;
	lAction = 9;
	rAction = 11;
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

function getPunched() {
	frameNum = 5;
	lAction = 1;
	rAction = 3;
	punchedCooldown--;
	if(punchedCooldown <= 0) action = "STANDING";
}

function jump() {
	if(!jumping) vVelocity = PLAYER_HEIGHT / 4.0;
	jumping = true;
	if(action != "PUNCHING") {
		vVelocity += vAcceleration;
		playerY -= vVelocity;
	}
	if(playerY > groundLevel - PLAYER_HEIGHT) {
		playerY = groundLevel - PLAYER_HEIGHT;
		jumping = false;
		jumpCooldown = 15;
	}
}

function punch() {
	if(action != "PUNCHING") frameNum = 0;
	action = "PUNCHING";
	lAction = 5;
	rAction = 7;
	frameTimer = ((frameTimer + 1) % 3);
	if(frameTimer == 0) frameNum += 1;
	if(frameNum == 8) {
		frameNum = 0;
		action = "STANDING";
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
	
	var message = document.getElementById('message');
	if(e.keyCode == KeyEvent.SLASH) {
		message.style.visibility = 'visible';
	}
};
document.onkeyup = function(e) {
	keyPress(e, false);
	
	var message = document.getElementById('message');
	if(e.keyCode == KeyEvent.SLASH) {
		message.focus();
	}
};
function keyPress(e, TorF) {
	pressed[e.keyCode] = TorF;
};

function resize() {
	canv.style.width = '80%';
	document.getElementById('chat').style = 'font-size: ' + (canv.offsetWidth / 100) + 'px;';
}

function clear() {
	ctx.save();
	ctx.setTransform(1, 0, 0, 1, 0, 0);
	ctx.clearRect(0, 0, canv.width, canv.height);
	ctx.restore();
}

function nameFocused() {
	document.getElementById('name').select();
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


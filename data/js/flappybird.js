function getQueryVariable(variable) {
	var query = window.location.search.substring(1);
	var vars = query.split("&");
	for (var i=0;i<vars.length;i++) {
		var pair = vars[i].split("=");
		if (pair[0] == variable) {
			return pair[1];
		}
	} 
	return null;
}

function kill(thread) {
	clearInterval(thread);
}

function killAll() {
	for (var id = 0; id < 10000; id++) {
		kill(id);
	}
}

function playSound(sound) {
	var audioAPI = new Audio();
	audioAPI.src = 'data/audio/sfx_'+sound+'.mp3';
	audioAPI.autoplay = true;
}

function modHtmlPos(pos) {
	return (360+pos)+'px';
}

function rand(min, max) {
	var rnd = Math.round(Math.random() * (max - min));
	return rnd + min;
}

function tryResetContainer() {
	var c = document.getElementsByClassName('ContainerFrame');
	if (screenWidth == 0) {
		screenWidth = c[0].parentNode.clientWidth;
	}
	for (var i = 0; i < c.length; i++) {
		c[i].style.width = screenWidth;
	}
}

/*    <Settings>   */
	var pipesSpeed = 2;
	var gravityPower = 1;
	var gravitySuppress = 0.65;
	var pipesDistance = 375;
	var gravityAcceleration = 20;
	
	var generatorRadius = 200;
	var pipesStartDelta = 1000;
	
	var screenWidth = 0;

	var noClip = false;
	var useFancyGraphics = getQueryVariable('lowgraphics') != 'true';
	var debugMode = getQueryVariable('debug') == 'true';
	
	var backgroundPlainsSpeed = 1.5;
	var backgroundCitySpeed = 1;
	
	var birdCenterSlide = -150;
/*   </Settings>   */

var bird = null;

var time = 0;
var modUpTime = 0;

var position = 0;

var started = false;
var canControl = false;

var timeBackground = 0;
var timeBackgroundCity = 0;
var timeBackgroundOverlay = 0;

var thread_gravityBorderControl = -1;
var thread_backgroundRotator = -1;
var thread_pipesUpdater = -1;
var thread_gameplayController = -1;
var thread_birdFlyTicker = -1;
var thread_hiboxes_All = -1;

var score = 0;

var pipes = [];
var visiblePipes = [];
var visitedPipes = [];

var pipesTimer = 0;

var pointEvent = new Event('point');
var hitEvent = new Event('hit');
var dieEvent = new Event('die');

var audi = [];

function genaratePipes(count) {
	pipes = [];
	for (var i = 0; i < count; i++) {
		pipes[i] = rand(-generatorRadius, generatorRadius);
	}
}

function g() {
	return gravityAcceleration;
}

function kickBird() {
	if (canControl && started) {
		time = 0;
		modUpTime = 1;
		playSound('wing');
	}
}

function getDelta(time) {
	return ((g()*(time)*(time)/2) - (g()*(time-0.01)*(time-0.01)/2)) * 60;
}

function activateBGRotation() {
	kill(thread_backgroundRotator);
	if (useFancyGraphics) {
		thread_backgroundRotator = setInterval(function(){
			var gameCenter = document.getElementById('GameCenter');
			gameCenter.style.backgroundPositionX = timeBackground + 'px';
			var gameWindow = document.getElementById('GameWindow');
			gameWindow.style.backgroundPositionX = timeBackgroundCity + 'px';
			
			timeBackground -= backgroundPlainsSpeed;
			if (timeBackground < -460) timeBackground = 0;
			
			timeBackgroundCity -= backgroundCitySpeed;
			if (timeBackgroundCity < -460) timeBackgroundCity = 0;
		}, 10);
	}
}

function outliner(element){
	var child = element.childNodes;
	for (var i = 0; i < child.length; i++) {
		if (child[i].style != undefined && child[i].classList.toString().indexOf('PipeControler') === -1) {
			child[i].style.outline = '1px solid #F00';
		}
		for(var f = 0; f < child[i].childNodes.length; f++) {
			outliner(child[i].childNodes[f]);
		}
	}
}

function runBird() {
	audi = [document.getElementById('pointSound'), document.getElementById('hitSound'), document.getElementById('dieSound')];

	genaratePipes(10000);
	
	score = 0;
	
	visiblePipes = [];
	visitedPipes = [];
	
	playSound('swooshing');
	activateBGRotation(); 
	document.getElementById('CtrlPlayOverlay').style.display = 'none';
	
	position = 0;
	time = 0
	bird = document.getElementById('HitBox');
	
	bird.style.marginLeft = 'calc(50% + '+birdCenterSlide+'px)';
	
	if (debugMode) {
		if (document.getElementById('BirdHitbox') == null) {
			bird.parentNode.innerHTML += '<div class="DrawableHitbox" id="BirdHitbox" style="display: none;"></div><div class="DrawableHitbox" id="PipeHitboxUp" style="display: none;"></div><div class="DrawableHitbox" id="PipeHitboxDown" style="display: none;"></div>';
			bird = document.getElementById('HitBox');
		}
		thread_hiboxes_All = setInterval(function(){outliner(document.body);}, 50);
	}
	
	if (useFancyGraphics) {
		var bTimer = 0;
		var deadTimer = 0;
		var birdPNG = [
			'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'
		];
		thread_birdFlyTicker = setInterval(function() {
			if (started) {
				if (!canControl) {
					bird.childNodes[0].style.backgroundImage = "url('data/images/birdDead.png')";
					bird.style.transform = 'rotate('+deadTimer+'deg)';
					deadTimer += 3;		
				} else {
					bird.childNodes[0].style.backgroundImage = "url('data:image/png;base64,"+birdPNG[Math.round(bTimer)]+"')";
					bTimer+=0.1;
					if (bTimer > 2) bTimer = 0;
					bird.style.transform = '';
				}
			}
		}, 10);
	}
	
	thread_gravityBorderControl = setInterval(function() {
		// Gravity
		time += 0.01;
		position += (getDelta(time) * 1.75 * gravityPower) - (getDelta(modUpTime * gravitySuppress));
		
		if (modUpTime > 0) {
			modUpTime -= 0.01;
		}
		
		// Border
		if (position >= 360) {
			if (canControl) {
				window.dispatchEvent(hitEvent);
			}
			bird.childNodes[0].style.backgroundImage = "url('data/images/birdDead.png')";
			position = 360;
			pipesTimer = 0;
			document.getElementById('CtrlPlayOverlay').style.display = '';
			started = false;
			killAll();
			if (canControl && useFancyGraphics) {
				document.getElementById('CtrlPlayOverlay').outerHTML += '<div class="GameStart" id="FlashLight455" style="background-color: rgba(255,255,255,0.8);"></div>';
				setTimeout(function() {
					document.getElementById('FlashLight455').outerHTML = '';
				}, 75);
			}
		}
		if (position < -360) {
			position = -360;
			modUpTime = 0;
		}
		
		var scoreBoard = document.getElementById('Scoreboard');
		scoreBoard.innerHTML = score;
	}, 10);
	
	thread_pipesUpdater = setInterval(function(){
		var overlay = document.getElementById('PipeOverlay');
		var generator = '';
		var visiblePipesUpdate = [];
		var timer = 0;
		
		pipes.forEach(function (pipe, id, list) {
			var data = pipesStartDelta + screenWidth + id*pipesDistance - pipesTimer;
			
			if (data > -100 && data < screenWidth + 100) {
				visiblePipesUpdate[timer] = [pipe, data - screenWidth / 2, id];
				generator += '<div class="PipeControler" style="'+(debugMode ? 'outline: none; ' : '')+'left: '+data+'px;"><div class="PipeTest1" style="'+(debugMode ? 'outline: 1px solid #F00; ' : '')+'top: '+(-440+pipe)+'px;"></div><div class="PipeTest2" style="'+(debugMode ? 'outline: 1px solid #F00; ' : '')+'top: '+(450+pipe)+'px; height: '+(270 - pipe)+'px;"></div></div>';
				timer++;
			}
			
		});
		
		visiblePipes = visiblePipesUpdate;
		overlay.innerHTML = generator;
		overlay.style.backgroundPositionX = timeBackgroundOverlay+'px';
		timeBackgroundOverlay-=pipesSpeed*2;
		if (timeBackgroundOverlay < -460) timeBackgroundOverlay = 0;
		pipesTimer+=pipesSpeed*2;
	}, 10);
	
	thread_gameplayController = setInterval(function() {
		bird.style.top = modHtmlPos(position);
		
		// visiblePipes [] => [pipeCenter, pipePosition, pipeId]
		// position
		if (debugMode) {
			var hitboxMarker = true;
			var pipeHitboxUp = document.getElementById('PipeHitboxUp');
			var pipeHitboxDown = document.getElementById('PipeHitboxDown');
		}
		
		visiblePipes.forEach(function(pipe, id, list) {
			if (-49-18+birdCenterSlide < pipe[1] && pipe[1] < 49+18+birdCenterSlide) {
				
				if (pipe[1] < 30 && visitedPipes.indexOf(pipe[2]) === -1) {
					score = pipe[2]+1;
					visitedPipes[visitedPipes.length] = pipe[2];
					window.dispatchEvent(pointEvent);
				}
				
				if ((position < (pipe[0] - (90 - 18)) || position > (pipe[0] + (90 - 18))) && !noClip) {
					if (useFancyGraphics) {
						document.getElementById('CtrlPlayOverlay').outerHTML += '<div class="GameStart" id="FlashLight" style="background-color: rgba(255,255,255,0.8);"></div>';
					}
					
					window.dispatchEvent(hitEvent);
					setTimeout(function(){
						if (useFancyGraphics) {
							document.getElementById('FlashLight').outerHTML = '';
						}
						window.dispatchEvent(dieEvent);
					}, 75);
					
					canControl = false;
					time = 0;
					modUpTime = 1;
					kill(thread_gameplayController);
					thread_gameplayController = setInterval(function(){
						bird.style.top = modHtmlPos(position);
					}, 20);
				}
				
				if (debugMode) {
					pipeHitboxUp.outerHTML = '<div class="DrawableHitbox" id="PipeHitboxUp" style="display: block; width: 96px; height: '+(360+pipe[0]-90)+'px; top:0px; left: '+(screenWidth/2+pipe[1]-50)+'px;">Pipe:<br/>&nbsp;&nbsp;center: '+pipe[0]+'<br/>&nbsp;&nbsp;position: '+pipe[1]+'<br/>&nbsp;&nbsp;pipeId: '+pipe[2]+'<br/><br/>BirdPos: '+position+'</div>';
					pipeHitboxDown.outerHTML = '<div class="DrawableHitbox" id="PipeHitboxDown" style="display: block; width: 96px; height: '+(360-pipe[0]-90)+'px; bottom: 80px; left: '+(screenWidth/2+pipe[1]-50)+'px;"></div>';
					hitboxMarker = false;
				}
			}
		});
		if (debugMode) {
			if (hitboxMarker) {
				pipeHitboxUp.outerHTML = '<div class="DrawableHitbox" id="PipeHitboxUp" style="display: none;"></div>';
				pipeHitboxDown.outerHTML = '<div class="DrawableHitbox" id="PipeHitboxDown" style="display: none;"></div>';
			}
			var birdHitbox = document.getElementById('BirdHitbox');
			birdHitbox.outerHTML = '<div class="DrawableHitbox" id="BirdHitbox" style="display: block; width: 34px; height: 32px; left: '+(screenWidth/2 - 18 + birdCenterSlide)+'px; top: '+(-17+position+360)+'px"></div>';
		}
	}, 10);
	
	started = true;
	canControl = true;
}

window.addEventListener("keypress", function (event) {
	if (event.charCode == 32) {
		if (started) {
			kickBird();
		} else {
			runBird();
		}
	}
	if (event.charCode == 107) {
		if (started) {
			if (canControl && modUpTime > 0) {
				time -= (1 - modUpTime)/4;
				modUpTime = 0;
			}
		}
	}
}, true);

window.addEventListener("touchstart", function (event) {
	kickBird();
}, true);

window.addEventListener("click", function (event) {
	kickBird();
}, true);

window.addEventListener("point", function () {
	audi[0].currentTime = 0;
	audi[0].play();
}, true);

window.addEventListener("hit", function () {
	audi[1].currentTime = 0;
	audi[1].play();
}, true);

window.addEventListener("die", function () {
	audi[2].currentTime = 0;
	audi[2].play();
}, true);
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
		if (id != thread_adaptiveWidth) {
			kill(id);
		}
	}
}

var audioEnabled = true;

function toggleAudio(element) {
	audioEnabled = !audioEnabled;
	for (var i = 0; i < element.childNodes.length; i++) {
		if (element.childNodes[i].className == 'AudioSwitchDynamic') {
			element.childNodes[i].style.backgroundImage = 'url(\'data/images/'+(audioEnabled ? 'sound' : 'mute')+'.png\')';
		}
	}
}

function playSound(sound) {
	if (audioEnabled) {
		var audioAPI = new Audio();
		audioAPI.src = 'data/audio/sfx_'+sound+'.mp3';
		audioAPI.autoplay = true;
	}
}

function modHtmlPos(pos) {
	return (360+pos)+'px';
}

function rand(min, max) {
	var rnd = Math.round(Math.random() * (max - min));
	return rnd + min;
}

function tryResetContainer() {
	var body = document.getElementsByClassName('ContainerFrame');
	thread_adaptiveWidth = setInterval(function() {
		screenWidth = body[0].parentNode.clientWidth;
		
		for (var i = 0; i < body.length; i++) {
			body[i].style.width = screenWidth;
		}
	}, 100);
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
var thread_adaptiveWidth = -1;

var score = 0;

var pipes = [];
var visiblePipes = [];
var visitedPipes = [];

var pipesTimer = 0;

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
		
		thread_birdFlyTicker = setInterval(function() {
			if (started) {
				if (!canControl) {
					bird.childNodes[0].style.backgroundImage = "url('data/images/birdDead.png')";
					bird.style.transform = 'rotate('+deadTimer+'deg)';
					deadTimer += 3;		
				} else {
					bird.childNodes[0].style.backgroundImage = "url('data/images/bird"+Math.round(bTimer)+".png')";
					bird.style.transform = '';
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
				playSound('hit');
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
				
				if (position < (pipe[0] - (90 - 18)) || position > (pipe[0] + (90 - 18))) {
					if (!noClip) {
						if (useFancyGraphics) {
							document.getElementById('CtrlPlayOverlay').outerHTML += '<div class="GameStart" id="FlashLight" style="background-color: rgba(255,255,255,0.8);"></div>';
						}
						
						playSound('hit');
						setTimeout(function(){
							if (useFancyGraphics) {
								document.getElementById('FlashLight').outerHTML = '';
							}
							playSound('die');
						}, 75);
						
						canControl = false;
						time = 0;
						modUpTime = 1;
						kill(thread_gameplayController);
						thread_gameplayController = setInterval(function(){
							bird.style.top = modHtmlPos(position);
						}, 20);
					}
				} else {
					if (pipe[1] < 30 && visitedPipes.indexOf(pipe[2]) === -1) {
						score = pipe[2]+1;
						visitedPipes[visitedPipes.length] = pipe[2];
						playSound('point');
					}
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

var isMobile = false;

window.addEventListener("touchstart", function (event) {
	isMobile = true;
	kickBird();
}, true);

window.addEventListener("click", function (event) {
	if (!isMobile) {
		kickBird();
	}
}, true);
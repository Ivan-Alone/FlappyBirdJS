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

var sounds_distr = [

];

function playSound(sound) {
    if (audioEnabled) {
        if (sounds_distr[sound] == undefined) {
            sounds_distr[sound] = [];
            for (var i = 0; i < 10; i++) {
                sounds_distr[sound][i] = new Audio();
                sounds_distr[sound][i].src = 'data/audio/sfx_'+sound+'.mp3';
            }
        }
        sounds_distr[sound][rand(0,9)].play();
    }
}

/*    <Settings>   */
    var pipesSpeed = 2;
    var pipesDistance = 375;
    var gravityAcceleration = 20;
    var gravityPower = 1;
    var gravitySuppress = 0.65;
    
    var generatorRadius = 200;
    var pipesStartDelta = 1000;

    var noClip = false;
    var useFancyGraphics = true;
    var debugMode = false;
    
    var backgroundPlainsSpeed = 1.5;
    var backgroundCitySpeed = 1;
    
    var showFPS = false;
    
    var birdCenterSlide = -150;
    
    var threadsUpdateTime = 10;
/*   </Settings>   */

var gameSettings = false;
var thread_gameSettings = -1;
var settingsData = {
    "generatorRadius" : ["range", "generatorRadius", generatorRadius],
    "rightDistance" : ["range", "pipesStartDelta", pipesStartDelta],
    "pipesSpeed" : ["range", "pipesSpeed", pipesSpeed],
    "pipesDistance" : ["range", "pipesDistance", pipesDistance],
    "birdCenterSlide" : ["range", "birdCenterSlide", birdCenterSlide],
    "gravityAcceleration" : ["range", "gravityAcceleration", gravityAcceleration],
    "gravityPower" : ["range", "gravityPower", gravityPower],
    "gravitySuppress" : ["range", "gravitySuppress", gravitySuppress],
    "plainsSpeed" : ["range", "backgroundPlainsSpeed", backgroundPlainsSpeed],
    "citySpeed" : ["range", "backgroundCitySpeed", backgroundCitySpeed],
    "fancyGraphics" : ["switch", "useFancyGraphics", useFancyGraphics],
    "debugMode" : ["debug", "debugMode", debugMode],
    "noClip" : ["switch", "noClip", noClip],
    "showFPS" : ["switch", "showFPS", showFPS],
    "fpsResolver" : ["fps", "threadsUpdateTime", threadsUpdateTime]
}

function toggleGameSettings() {
    var gameSettingsE = document.getElementById('GameSettings');
    gameSettings = !gameSettings;
    if (gameSettings) {
        gameSettingsE.style.display = 'block';
        thread_gameSettings = setInterval(function(){
            if (!gameSettings) {
                kill(thread_gameSettings);
            } else {
                var ctrlElements = document.getElementsByClassName('ctrlElement');
                for (i in ctrlElements) {
                    var ctrlElement = ctrlElements[i];
                    
                    for (classId in ctrlElement.classList) {
                        var type = settingsData[ctrlElement.classList[classId]];
                        if (type == undefined) continue;
                        switch (type[0]) {
                            case 'range':
                                if (window[type[1]].toString() != 'NaN') {
                                    ctrlElement.value = window[type[1]];
                                }
                            break;
                            case 'switch':
                            case 'debug':
                                var text = ctrlElement.innerHTML.split(':')[0];
                                ctrlElement.innerHTML = text + ': ' + (window[type[1]] ? 'ON' : 'OFF');
                            break;
                            case 'fps':
                                ctrlElement.value = Math.round(1000 / threadsUpdateTime);
                            break;
                        }
                    }
                }
            }
        }, 100);
    } else {
        gameSettingsE.style.display = '';
    }
}

function setDefault(element) {
    window[settingsData[element][1]] = settingsData[element][2];
}

function configure(element) {
    for (classId in element.classList) {
        var type = settingsData[element.classList[classId]];
        if (type == undefined) continue;
        switch (type[0]) {
            case 'range':
                window[type[1]] = parseFloat(element.value);
            break;
            case 'debug':
                if (window[type[1]]) {
                    kill(thread_hiboxes_All);
                    outliner(document.body, false);
                    try {
                        document.getElementById('BirdHitbox').outerHTML = '';
                        document.getElementById('PipeHitboxUp').outerHTML = '';
                        document.getElementById('PipeHitboxDown').outerHTML = '';
                    } catch (e) {};
                } else {
                    thread_hiboxes_All = setInterval(function(){outliner(document.body, true);}, 50);
                }
            case 'switch':
                window[type[1]] = !window[type[1]];
            break;
            case 'fps':
                window[type[1]] = 1000 / parseFloat(parseInt(element.value));
            break;
        }
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

var bird = null;
var fpsScorer = null;
    
var screenWidth = 0;

var time = 0;
var modUpTime = 0;

var position = 0;

var started = false;
var canControl = false;

var timeBackground = 0;
var timeBackgroundCity = 0;
var timeBackgroundOverlay = 0;

var thread_physicsEngine = -1;
var thread_backgroundRotator = -1;
var thread_gameplayController = -1;
var thread_birdFlyTicker = -1;
var thread_hiboxes_All = -1;
var thread_adaptiveWidth = -1;
var thread_showFPS = -1;

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
            
            timeBackground -= backgroundPlainsSpeed * (threadsUpdateTime / 10);
            if (timeBackground < -460) timeBackground = 0;
            
            timeBackgroundCity -= backgroundCitySpeed * (threadsUpdateTime / 10);
            if (timeBackgroundCity < -460) timeBackgroundCity = 0;
			
            if (showFPS) {
                fps++;
			}
        }, threadsUpdateTime);
    }
}

function outliner(element, mode){
    var child = element.childNodes;
    for (var i = 0; i < child.length; i++) {
        if (child[i].style != undefined && child[i].classList.toString().indexOf('PipeControler') === -1) {
            child[i].style.outline = mode ? '1px solid #F00' : '';
        }
        for(var f = 0; f < child[i].childNodes.length; f++) {
            outliner(child[i].childNodes[f], mode);
        }
    }
}

function gameOver() {
    if (canControl) {
        playSound('hit');
    }
    bird.childNodes[0].style.backgroundImage = "url('data/images/birdDead.png')";
    position = 360;
    pipesTimer = 0;
    document.getElementById('CtrlPlayOverlay').style.display = '';
    started = false;
    killAll();
    fpsScorer.innerHTML = '';
    if (canControl && useFancyGraphics) {
        document.getElementById('CtrlPlayOverlay').outerHTML += '<div class="GameStart" id="FlashLight455" style="background-color: rgba(255,255,255,0.8);"></div>';
        setTimeout(function() {
            document.getElementById('FlashLight455').outerHTML = '';
        }, 75);
    }
}

var inDeadTimer = 0;
            
var birdPNG = [
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADMAAAAkCAYAAAAkcgIJAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABl0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC4yMfEgaZUAAAHZSURBVFhH7ZUxTsNQEER9IDqanIALcCEOwH24BH1aKs6AIiTQyiP0vB7/bL4dksIjvSae3f+2yrBVng9PP1ugdbeNE+tB624bJ9aD1v1PnEBwOr6eZdI/nSzs6MnrhY8RJ5+Z9M0hATt68nrhY8TJZyZ9c0jAjp7cNnzASQZfb4+WyayRb8FZqawPl7pDAndIMJk1wi04K5X14VJ3SOAOCSazRrgFZ6VSD4crOPkM+8fP9z+cfMD+0u/SbYcDFZx8hv39GPO7dOdhicMVOOsOCdjZjzG/S30eljhcgbPukICduz6GcI87KmCnchjhrNTnYcktqcI97pCAnf0YIfV5WJr8q5uFM9DnHndIhv016Iwx/EA5K59Bn3ucfIb9NeiMMfxAOSufQZ97nHyG/TXojHlYougS7DvhDPvfh2ETuFNnjOEHJ59h38ln2HdiPXCnzhjDD04+w76Tz7DvxHrgTp0xD0tLfLw8nIX9JYk1SLcdN5hx8hn292POIN12OOAke+BOHnYp3CPddjjgxHrgTidZhXuk2w4HnFgP3Okkq3CPdOvhMHHCVdy+KtLqi1sYOMkqbl8VafXFLQycZBW3r4q0to17qIpW3E+cZBWtuJ84ySpasWGG4RdJ6S+g8RWekgAAAABJRU5ErkJggg==',
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADMAAAAkCAYAAAAkcgIJAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABl0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC4yMfEgaZUAAAGzSURBVFhH7ZXBTcNAEEVdEDcuqYAGaIgC6IcmuOfKiRqQhQQa+St6Xn9vxmsnzsFfepd45u8bCYluq7yeXv62QHX7xom1oLp948RaUN194gSC/vx+ldF831s4oydvFz5GnHzJaN4cEnBGT94ufIw4+ZLRvDkk4Iye3DZ8wEkGPx/PltGuka/BXamsD0vdIYE7JBjtGuEa3JXK+rDUHRK4Q4LRrhGuwV2ptIVFGek52HP+/rzg5APOz/0uxXy4fBwj2HPXY7jgxFpg53GM+V269XDBibXAzt2OWYo7pITzmcMId6VbDxeW4uRLOH8cI6Q7DYdcSRb2uENKOL8GnTGEH5xkFvY4+RLOr0FnDOEHJ5mFPU6+hPNr0BlD+IH/6Z3wBMyzx8kHnPk9dZvAzuOYC5hnjzsk4IwTa4Gd+mMbwg9L+Xp7snBmTmINUp/GDWdxhwScOY65gtTr4YKTbIGdPGwp7JFuPVxwYi2w00lmYY906+GCE2uBnU4yC3ukmw+XiRPO4vqySKstrjBwkllcXxZptcUVBk4yi+vLIq1t4x7KoorHiZPMoorHiZPMoooN03X/heTgv3QvlIcAAAAASUVORK5CYII=',
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADMAAAAkCAYAAAAkcgIJAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABl0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC4yMfEgaZUAAAGpSURBVFhH7ZXLTQNBEEQ3IG5cHAEJkBABkA9JcPeVEzGgFRJo2JJV433bbs+uP0hT0rvY3TWvJSyGrfK8e/rZAtXdNiTWgupuGxJrQXXXCQkUxv3rSar5cUR8Rk9eLv6YQ/LHVPNwSMFn9OTl4o85JH9MNQ+HFHxGT24bf4AkC19vj0i1C/IRviuV9fFSOqRAhxSqXRCO8F2prI+X0iEFOqRQ7YJwhO9KpS1elJFewnv2n+8HSL7g80ufSzEfX+7HCO+56jG+QGIteGc/Bj6XbhxfILEWvPPfH+N4f+Ywx3elG8cXSGYt3t+PEdKN4wvnQvIR1NGC1Oeh4SwkHEEdLUh9HhrOQsIR1NGC1Kf4F/6fnv5uZ9i895B8wWe+d8MmeGc/5oDNew8dUvAZEmvBO+tjSDjAdz9eHhCfWZJYg34tU/wLEo7wXTqk4DP9mBPojCn+BQn/sfDbIPkI3/XDzsV7dMYU/wIPKfRj5vguSWbxHp0xjw9lIOEs1JdFunFoMYIks1BfFunGocUIksxCfVmku23ooSyquJ+QZBZV3E9IMosqNsww/AI+pGXWCe2dCwAAAABJRU5ErkJggg=='
];

function runBird() {
    if (!gameSettings) {
        genaratePipes(10000);
        
        score = 0;
        
        visiblePipes = [];
        visitedPipes = [];
        
        inDeadTimer = 0;
        
        playSound('swooshing');
        activateBGRotation(); 
        document.getElementById('CtrlPlayOverlay').style.display = 'none';
        
        position = 0;
        time = 0
        
        bird = document.getElementById('HitBox');
        fpsScorer = document.getElementById('FPS');
        
        bird.childNodes[0].style.backgroundImage = "url('"+birdPNG[0]+"')";
        bird.style.transform = '';
        
        var fps = 0;
        var fpsTime = new Date();
        
        bird.style.marginLeft = 'calc(50% + '+birdCenterSlide+'px)';
        
        if (debugMode) {
            if (document.getElementById('BirdHitbox') == null) {
                bird.parentNode.innerHTML += '<div class="DrawableHitbox" id="BirdHitbox" style="display: none;"></div><div class="DrawableHitbox" id="PipeHitboxUp" style="display: none;"></div><div class="DrawableHitbox" id="PipeHitboxDown" style="display: none;"></div>';
                bird = document.getElementById('HitBox');
            }
            kill(thread_hiboxes_All);
            thread_hiboxes_All = setInterval(function(){
				outliner(document.body, true);
				if (showFPS) {
					fps++;
				}
			}, threadsUpdateTime);
        }
        
        thread_physicsEngine = setInterval(function() {
            // Gravity
            time += 0.01 * (threadsUpdateTime / 10);
            position += ((getDelta(time) * 1.75 * gravityPower) - (getDelta(modUpTime * gravitySuppress))) * (threadsUpdateTime / 10);
            
            if (modUpTime > 0) {
                modUpTime -= 0.01 * (threadsUpdateTime / 10);
            }
            
            // Border
            if (position >= 360) {
                gameOver();
            }
            if (position < -360) {
                position = -360;
                modUpTime = 0;
            }
            
            if (started && !canControl) inDeadTimer += 1;
            
            if (inDeadTimer > 1000) gameOver();
            
			
			// Scoreboard
            var scoreBoard = document.getElementById('Scoreboard');
            scoreBoard.innerHTML = score;
            
			
			// Pipes Controller
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
            timeBackgroundOverlay -= pipesSpeed * 2 * (threadsUpdateTime / 10);
            if (timeBackgroundOverlay < -460) timeBackgroundOverlay = 0;
            pipesTimer += pipesSpeed * 2 * (threadsUpdateTime / 10);
            
            if (showFPS) {
                fps++;
			}
        }, threadsUpdateTime);
        
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
                if (-49-18 < pipe[1]-birdCenterSlide && pipe[1]-birdCenterSlide < 49+18) {
                    
                    if (position < (pipe[0] - (90 - 18)) || position > (pipe[0] + (90 - 18))) {
                        if (!noClip) {
                            if (useFancyGraphics) {
                                document.getElementById('CtrlPlayOverlay').outerHTML += '<div class="GameStart" id="FlashLight" style="background-color: rgba(255,255,255,0.8);"></div>';
                            }
                            
                            playSound('hit');
                            bird.childNodes[0].style.backgroundImage = "url('data/images/birdDead.png')";
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
                        if (pipe[1]-birdCenterSlide < 75 && visitedPipes.indexOf(pipe[2]) === -1) {
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
            
            if (showFPS) {
                fps++;
            }
        }, threadsUpdateTime);
        
        if (useFancyGraphics) {
            var bTimer = 0;
            var deadTimer = 0;

            thread_birdFlyTicker = setInterval(function() {
                if (started) {
                    if (!canControl) {
                        bird.style.transform = 'rotate('+deadTimer+'deg)';
                        deadTimer += 3 * (threadsUpdateTime / 10);        
                    } else {
                        bird.childNodes[0].style.backgroundImage = "url('"+birdPNG[Math.round(bTimer)]+"')";
                        bird.style.transform = '';
                        bTimer+=0.1 * (threadsUpdateTime / 10);
                        if (bTimer > 2) bTimer = 0;
                        bird.style.transform = '';
                    }
                }
				if (showFPS) {
					fps++;
				}
            }, threadsUpdateTime);
        }
        
		if (showFPS) {
			thread_showFPS = setInterval(function() {
                var timerOne = new Date();
                if (timerOne - fpsTime >= 1000) {
                    fpsTime = timerOne;
                    fpsScorer.innerHTML = fps / (useFancyGraphics ? 4+(debugMode?1:0) : 2+(debugMode?1:0));
                    fps = 0;
                } 
			}, 500);
			
		}
		
        started = true;
        canControl = true;
    }
}

window.addEventListener("keypress", function (event) {
    if (event.charCode == 32) {
        if (started) {
            kickBird();
        } else {
            runBird();
        }
    } else if (event.charCode == 107) {
        if (started) {
            if (canControl && modUpTime > 0) {
                time -= (1 - modUpTime)/4;
                modUpTime = 0;
            }
        }
    }
    if (event.keyCode == 27 && !started) {
        toggleGameSettings();
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

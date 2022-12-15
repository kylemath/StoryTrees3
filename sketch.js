let positions;
let videoInput;
let cnv;
let outputArea = 0;
let outputSmile = 0;
let soundFile;
let panning;
let scene_num = 0; // index of which screen of the UX flow you are in
let wind_on = false;
let backvoices_on = false;
let voices_on = false;
let first_time = 1; // to only maximize on first time
let sceneTimerStart = true; // for auto advance after x time

let autoadvance_delay = 180; // seconds
const locPrefix = "assets/auditory/clips/";
const fileSufix = "_story.mp3";

function setup() {
  // setup camera capture
  videoInput = createCapture(VIDEO);
  videoInput.size(displayWidth, displayHeight);
  videoInput.position(0, 0);

  // setup canvas
  cnv = createCanvas(1000, 528);
  cnv.position(0, 0);

  // setup tracker
  ctracker = new clm.tracker();
  ctracker.init(pModel);
  ctracker.start(videoInput.elt);

  // setup emotion classifier
  classifier = new emotionClassifier();
  classifier.init(emotionModel);
  emotionData = classifier.getBlank();
}

function preload() {
  soundFormats("mp3", "ogg");

  //randomize the clip order
  clipNums = [];
  for (var i = 1; i < 49; i++) {
    clipNums = concat(clipNums, i);
  }
  clipNums = shuffle(clipNums);
  const sounds = {};
  for (let i = 0; i < clipNums.length; i++) {
    let page = Math.floor(i / 4) + 1;
    let index = (i % 4) + 1;
    let variableName = `soundFile${String.fromCharCode(page + 64)}${index}`;
    let filePath = join([locPrefix, nf(clipNums[i], 2), fileSufix], "");
    sounds[variableName] = loadSound(filePath);
  }
  soundFiles = [...Object.values(sounds)];

  soundFileWind = loadSound("assets/auditory/wind only_ST2.mp3");
  soundFileVoices = loadSound("assets/auditory/all voices_ST2.mp3");

  bg_title = loadImage("assets/visual/Page_01.jpg");
  bg_cam = loadImage("assets/visual/Page_02.jpg");
  bg_intro = loadImage("assets/visual/Page_03.jpg");
  bg_credits = loadImage("assets/visual/Page_10.jpg");
  bg_credits2 = loadImage("assets/visual/Page_11.jpg");
  bg_outro = loadImage("assets/visual/Page_12.jpg");

  hotspot1 = loadImage("assets/visual/Page_04.jpg");
  hotspot2 = loadImage("assets/visual/Page_05.jpg");
  hotspot3 = loadImage("assets/visual/Page_06.jpg");
  hotspot4 = loadImage("assets/visual/Page_07.jpg");
  hotspot5 = loadImage("assets/visual/Page_08.jpg");
  hotspot6 = loadImage("assets/visual/Page_09.jpg");

  hotspots = [hotspot1, hotspot2, hotspot3, hotspot4, hotspot5, hotspot6];

  nose_spot = loadImage("assets/visual/nose_button.png");
  nose_spot_red = loadImage("assets/visual/nose_button_red.png");
  nose_spot_green = loadImage("assets/visual/nose_button_green.png");

  setupSounds();
}

function setupSounds() {
  // setup background gain
  backgroundGain = new p5.Gain();
  backgroundGain.connect();
  backgroundGain.amp(0.2);

  soundFileWind.disconnect();
  soundFileWindGain = new p5.Gain();
  soundFileWindGain.setInput(soundFileWind);
  soundFileWindGain.connect(backgroundGain);

  soundFileVoices.disconnect();
  soundFileVoicesGain = new p5.Gain();
  soundFileVoicesGain.setInput(soundFileVoices);
  soundFileVoicesGain.connect(backgroundGain);

  // setup foreground gain
  masterGain = new p5.Gain();
  masterGain.connect();

  const gains = {};
  soundFileGains = [];
  for (let i = 0; i < clipNums.length; i++) {
    let page = Math.floor(i / 4) + 1;
    let index = (i % 4) + 1;
    let variableName = `soundFile${String.fromCharCode(page + 64)}${index}Gain`;
    gains[variableName] = new p5.Gain();
    soundFileGains.push(gains[variableName]);
  }

  for (let i = 0; i < soundFiles.length; i++) {
    soundFiles[i].disconnect();
    soundFileGains[i].setInput(soundFiles[i]);
    soundFileGains[i].connect(masterGain);
  }
  //adjust foreground voices so one on left one on right
  const pans = [1.0, 0.5, -0.5, -1.0, 0.0, 0.0, 0.0, 0.0];
  for (let i = 0; i < soundFiles.length; i++) {
    soundFiles[i].pan(pans[i % 8]);
  }
}

function mousePressed() {
  if (scene_num == 0 && first_time == 1) {
    first_time = 0;
    let fs = fullscreen();
    fullscreen(!fs);
    resizeCanvas(displayWidth, displayHeight);
  }
  if (scene_num == 0) {
    scene_start = millis();
  }
  voices_on = false;
  scene_num++;
  sceneTimerStart = true;
  if (scene_num == 12) {
    restartShow();
  }
}

function autoAdvance() {
  if (sceneTimerStart) {
    scene_start = millis();
    sceneTimerStart = false;
  }

  // auto advance after 180 seconds
  if (millis() - scene_start > autoadvance_delay * 1000) {
    voices_on = false;
    scene_num++;
    sceneTimerStart = true;
    if (scene_num == 12) {
      restartShow();
    }
  }
}

function restartShow() {
  scene_num = 0;
  wind_on = false;
  backvoices_on = false;
  voices_on = false;

  soundFileWind.stop();
  soundFileVoices.stop();

  soundFiles.forEach((soundFile) => soundFile.fade(1, 0));
  soundFiles.forEach((soundFile) => soundFile.stop());
}

function draw() {
  clear();
  switch (scene_num) {
    case 0:
      scene0();
      break;
    case 1:
      scene1();
      break;
    case 2:
      scene2();
      break;

    // Main scenes
    case 3:
      scene();
      break;
    case 4:
      scene();
      break;
    case 5:
      scene();
      break;

    case 6:
      scene();
      break;
    case 7:
      scene();
      break;
    case 8:
      scene();
      break;

    //Outros
    case 9:
      scene9();
      break;
    case 10:
      scene10();
      break;
    case 11:
      scene11();
    default:
    //
  }
}

function scene0() {
  background(bg_title);
}

function scene1() {
  autoAdvance();
  background(bg_cam);
  if (!wind_on) {
    soundFileWind.loop();
    soundFileWind.pan(0);
    soundFileWindGain.amp(0.9);
    soundFileWind.fade(1, 1);
    wind_on = true;
  }
  if (millis() - scene_start > 3000) {
    drawStatic();
  }
}

function scene2() {
  autoAdvance();
  background(bg_intro);
  if (!backvoices_on) {
    soundFileVoices.loop();
    soundFileVoices.pan(0);
    soundFileVoicesGain.amp(0.5);
    soundFileVoices.fade(1, 1);
    backvoices_on = true;
  }

  drawStatic();
}

function drawStatic() {
  for (var ispot = 0; ispot < 2500; ispot++) {
    squareColor = color(random(0, 255));
    squareColor.setAlpha(35);
    fill(squareColor);
    strokeWeight(0);
    rect(random(0, width), random(0, height), 10, 10);
  }
}

function scene() {
  //put hotspot background on

  autoAdvance();

  background(hotspots[scene_num - 3]);

  drawStatic();

  // flip camera to match head movement
  if (videoInput) {
    translate(videoInput.width, 0);
    scale(-1, 1);
  }
  // get array of face marker positions [x, y] format
  positions = ctracker.getCurrentPosition();
  parameters = ctracker.getCurrentParameters();

  // predict emotion
  emotionRecognition = classifier.meanPredict(parameters);

  // once these are working
  if (positions && emotionRecognition) {
    // check on smile
    outputSmile = emotionRecognition[5].value;
    // console.log(emotionRecognition);
    // 0: {emotion: "angry", value: 0.05873836091453903}
    // 1: {emotion: "disgusted", value: 0.006970389350505129}
    // 2: {emotion: "fear", value: 0.007838597025081209}
    // 3: {emotion: "sad", value: 0.3644606514967711}
    // 4: {emotion: "surprised", value: 0.006303609805024607}
    // 5: {emotion: "happy", value: 0.02721371664183402}
    // console.log('Smile = ' + round(outputSmile * 100) + '%')

    // calculate face size
    let minX = width;
    let maxX = 0;
    let minY = height;
    let maxY = 0;
    for (var i = 0; i < positions.length; i++) {
      if (positions[i][0] < minX) {
        minX = positions[i][0];
      }
      if (positions[i][0] > maxX) {
        maxX = positions[i][0];
      }
      if (positions[i][1] < minY) {
        minY = positions[i][1];
      }
      if (positions[i][1] > maxY) {
        maxY = positions[i][1];
      }
    }
    boxWidth = maxX - minX;
    boxHeight = maxY - minY;
    outputArea = (boxWidth * boxHeight) / (width * height);
    outputArea = outputArea + 0.35;

    // Draw box on face
    push();
    noFill();
    strokeWeight(1);
    rect(minX, minY, boxWidth, boxHeight);

    // draw nose position
    noStroke();
    fill(0, 255, 255);
    outputX = positions[62][0];
    outputY = positions[62][1];
    if (outputSmile > 0.9) {
      image(nose_spot_green, outputX, outputY, 25, 25);
    } else if (outputSmile < 0.1 && outputSmile != 0.0) {
      image(nose_spot_red, outputX, outputY, 25, 25);
    } else {
      image(nose_spot, outputX, outputY, 25, 25);
    }
    pop();

    pan_sounds((scene_num - 3) * 8);
  }
}

function pan_sounds(startSound) {
  if (!voices_on) {
    for (let i = startSound; i < startSound + 8; i++) {
      if (startSound > 0) {
        soundFiles[i - 8].fade(0, 1);
      }
      soundFileGains[i].amp(0);
      soundFiles[i].loop();
    }
    voices_on = true;
  }

  //get nose position
  gazeX = constrain(outputX, 0, width);
  voicebalance = map(gazeX, 0, width, 0, 1);
  //adjust relative sound amplitude based on gaze location
  let thisBal = 0;
  if (voicebalance < 0.25) {
    thisBal = 0;
  } else if (voicebalance >= 0.25 && voicebalance < 0.5) {
    thisBal = 1;
  } else if (voicebalance >= 0.5 && voicebalance < 0.75) {
    thisBal = 2;
  } else {
    thisBal = 3;
  }

  soundFileGains[startSound + thisBal].amp(1);
  soundFileGains[startSound + thisBal + 4].amp(1 - outputSmile);

  //adjust foreground voices based on proximity
  soundVolume = constrain(outputArea, 0, 1);
  masterGain.amp(soundVolume);
}

function scene9() {
  autoAdvance();
  background(bg_credits);
  soundFileK1.fade(0, 1);
  soundFileL1.fade(0, 1);
  soundFileK2.fade(0, 1);
  soundFileL2.fade(0, 1);
  soundFileK3.fade(0, 1);
  soundFileL3.fade(0, 1);
  soundFileK4.fade(0, 1);
  soundFileL4.fade(0, 1);
  drawStatic();
}

function scene10() {
  autoAdvance();
  background(bg_credits2);
  drawStatic();
}

function scene11() {
  autoAdvance();
  background(bg_outro);
  soundFileWind.fade(0, 1);
  soundFileVoices.fade(0, 1);
}

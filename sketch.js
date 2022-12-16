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

let autoadvance_delay = 360; // seconds
const locPrefix = "assets/auditory/";
const fileSufix = ".mp3";
const locPrefixOrig = "assets/auditory/clips/";
const fileSufixOrig = "_story.mp3";
const CURSOR_SIZE = 50;

const NUM_BACKGROUND = 19;
const NUM_MIDGROUND = 16;
const NUM_FOREGROUND = 25;

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

  // pick 6 random background sounds

  //randomize the clip order
  BGclipNums = [];
  for (var i = 2; i < NUM_BACKGROUND; i++) {
    BGclipNums = concat(BGclipNums, i);
  }
  BGclipNums = shuffle(BGclipNums);
  BGclipNums = BGclipNums.slice(0, 6);

  let BGsounds = {};
  for (let i = 0; i < BGclipNums.length; i++) {
    let variableName = `BGsoundFile${i}`;
    let filePath = join(
      [locPrefix, "background/BG-", BGclipNums[i], fileSufix],
      ""
    );
    BGsounds[variableName] = loadSound(filePath);
  }
  BGsoundFiles = [...Object.values(BGsounds)];

  // pick 12 random midground sounds
  //randomize the clip order
  MGclipNums = [];
  for (var i = 1; i < NUM_MIDGROUND; i++) {
    MGclipNums = concat(MGclipNums, i);
  }
  MGclipNums = shuffle(MGclipNums);
  MGclipNums = MGclipNums.slice(0, 12);

  let MGsounds = {};
  for (let i = 0; i < MGclipNums.length; i++) {
    let variableName = `MGsoundFile${i}`;
    let filePath = join(
      [locPrefix, "midground/MG-", MGclipNums[i], fileSufix],
      ""
    );
    MGsounds[variableName] = loadSound(filePath);
  }
  MGsoundFiles = [...Object.values(MGsounds)];

  // pick 12 random foreground sounds
  //randomize the clip order
  FGclipNums = [];
  for (var i = 1; i < NUM_FOREGROUND; i++) {
    FGclipNums = concat(FGclipNums, i);
  }
  FGclipNums = shuffle(FGclipNums);
  FGclipNums = FGclipNums.slice(0, 12);

  let FGsounds = {};
  for (let i = 0; i < FGclipNums.length; i++) {
    let variableName = `FGsoundFile${i}`;
    let filePath = join(
      [locPrefix, "foreground/FG-", FGclipNums[i], fileSufix],
      ""
    );
    FGsounds[variableName] = loadSound(filePath);
  }
  FGsoundFiles = [...Object.values(FGsounds)];

  soundFileWind = loadSound("assets/auditory/background/BG-1.mp3");

  bg_title = loadImage("assets/visual/Page_01.jpg");
  bg_cam = loadImage("assets/visual/Page_02.jpg");
  bg_intro = loadImage("assets/visual/Page_03.jpg");
  bg_credits = loadImage("assets/visual/Page_10.jpg");
  bg_outro = loadImage("assets/visual/Page_11.jpg");

  hotspot1 = loadImage("assets/visual/Page_04.jpg");
  hotspot2 = loadImage("assets/visual/Page_05.jpg");
  hotspot3 = loadImage("assets/visual/Page_06.jpg");
  hotspot4 = loadImage("assets/visual/Page_07.jpg");
  hotspot5 = loadImage("assets/visual/Page_08.jpg");
  hotspot6 = loadImage("assets/visual/Page_09.jpg");

  hotspots = [hotspot1, hotspot2, hotspot3, hotspot4, hotspot5, hotspot6];

  nose_spot = loadImage("assets/visual/raven_button_1.png");
  nose_spot_red = loadImage("assets/visual/raven_button_2.png");
  nose_spot_green = loadImage("assets/visual/raven_button_3.png");

  setupSounds();
}

function setupSounds() {
  masterGain = new p5.Gain();
  masterGain.connect();
  masterGain.amp(0.5);

  // setup background gain
  backgroundGain = new p5.Gain();
  backgroundGain.connect();
  backgroundGain.amp(0.2);

  soundFileWind.disconnect();
  soundFileWindGain = new p5.Gain();
  soundFileWindGain.setInput(soundFileWind);
  soundFileWindGain.connect(backgroundGain);

  // setup foreground gain
  midgroundGain = new p5.Gain();
  midgroundGain.connect(masterGain);
  midgroundGain.amp(0.2);

  // setup foreground gain
  foregroundGain = new p5.Gain();
  foregroundGain.connect(masterGain);
  foregroundGain.amp(0.2);

  const BGgains = {};
  BGsoundFileGains = [];
  for (let i = 0; i < BGclipNums.length; i++) {
    let variableName = `BGsoundFile${i}Gain`;
    BGgains[variableName] = new p5.Gain();
    BGsoundFileGains.push(BGgains[variableName]);
  }
  const MGgains = {};
  MGsoundFileGains = [];
  for (let i = 0; i < MGclipNums.length; i++) {
    let variableName = `MGsoundFile${i}Gain`;
    MGgains[variableName] = new p5.Gain();
    MGsoundFileGains.push(MGgains[variableName]);
  }
  const FGgains = {};
  FGsoundFileGains = [];
  for (let i = 0; i < FGclipNums.length; i++) {
    let variableName = `FGsoundFile${i}Gain`;
    FGgains[variableName] = new p5.Gain();
    FGsoundFileGains.push(FGgains[variableName]);
  }

  for (let i = 0; i < BGsoundFiles.length; i++) {
    BGsoundFiles[i].disconnect();
    BGsoundFileGains[i].setInput(BGsoundFiles[i]);
    BGsoundFileGains[i].connect(backgroundGain);
  }

  for (let i = 0; i < MGsoundFiles.length; i++) {
    MGsoundFiles[i].disconnect();
    MGsoundFileGains[i].setInput(MGsoundFiles[i]);
    MGsoundFileGains[i].connect(midgroundGain);
  }
  for (let i = 0; i < FGsoundFiles.length; i++) {
    FGsoundFiles[i].disconnect();
    FGsoundFileGains[i].setInput(FGsoundFiles[i]);
    FGsoundFileGains[i].connect(foregroundGain);
  }

  for (let i = 0; i < MGsoundFiles.length; i++) {
    if (i % 2 == 0) {
      MGsoundFiles[i].pan(1.0);
    } else {
      MGsoundFiles[i].pan(-1.0);
    }
  }
  for (let i = 0; i < FGsoundFiles.length; i++) {
    if (i % 2 == 0) {
      FGsoundFiles[i].pan(0.5);
    } else {
      FGsoundFiles[i].pan(-0.5);
    }
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
  if (scene_num == 11) {
    restartShow();
  }
}

function autoAdvance() {
  if (sceneTimerStart) {
    scene_start = millis();
    sceneTimerStart = false;
  }

  // auto advance after autoadvance_delay seconds
  if (millis() - scene_start > autoadvance_delay * 1000) {
    voices_on = false;
    scene_num++;
    sceneTimerStart = true;
    if (scene_num == 11) {
      restartShow();
    }
  }
}

function restartShow() {
  scene_num = 0;
  wind_on = false;
  voices_on = false;

  soundFileWind.stop();

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
    soundFileWindGain.amp(1);
    soundFileWind.fade(1, 1);
    wind_on = true;
  }
}

function scene2() {
  autoAdvance();
  background(bg_intro);
}

function scene() {
  //put hotspot background on

  autoAdvance();

  background(hotspots[scene_num - 3]);

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
      image(nose_spot_green, outputX, outputY, CURSOR_SIZE, CURSOR_SIZE);
    } else if (outputSmile < 0.1 && outputSmile != 0.0) {
      image(nose_spot_red, outputX, outputY, CURSOR_SIZE, CURSOR_SIZE);
    } else {
      image(nose_spot, outputX, outputY, CURSOR_SIZE, CURSOR_SIZE);
    }
    pop();

    pan_sounds(scene_num - 3);
  }
}

function pan_sounds(mixSceneNum) {
  if (mixSceneNum == 0) {
    soundFileWind.fade(0, 1);
  } else {
    BGsoundFiles[mixSceneNum - 1].fade(0, 1);
  }
  BGsoundFiles[mixSceneNum].loop();
  BGsoundFiles[mixSceneNum].pan(0);
  BGsoundFileGains[mixSceneNum].amp(0.1);
  BGsoundFiles[mixSceneNum].fade(1, 1);

  if (!voices_on) {
    if (mixSceneNum > 0) {
      MGsoundFiles[(mixSceneNum - 1) * 2].fade(0, 1);
      MGsoundFiles[(mixSceneNum - 1) * 2 + 1].fade(0, 1);
      FGsoundFiles[(mixSceneNum - 1) * 2].fade(0, 1);
      FGsoundFiles[(mixSceneNum - 1) * 2 + 1].fade(0, 1);
    }
    // Midground Sounds on two sides

    MGsoundFiles[mixSceneNum * 2].loop();
    MGsoundFiles[mixSceneNum * 2 + 1].loop();

    // Foreground Sounds on two middles
    FGsoundFiles[mixSceneNum * 2].loop();
    FGsoundFiles[mixSceneNum * 2 + 1].loop();

    voices_on = true;
  }

  //get nose position
  gazeX = constrain(outputX, 0, width);
  voicebalance = map(gazeX, 0, width, 0, 1);
  //adjust relative sound amplitude based on gaze location
  let thisGaze = 0;
  if (voicebalance < 0.25) {
    thisGaze = 0;
    MGsoundFileGains[mixSceneNum * 2].amp(0.5);
    FGsoundFileGains[mixSceneNum * 2].amp(0);
    FGsoundFileGains[mixSceneNum * 2 + 1].amp(0);
    MGsoundFileGains[mixSceneNum * 2 + 1].amp(0);
  } else if (voicebalance >= 0.25 && voicebalance < 0.5) {
    thisGaze = 1;
    MGsoundFileGains[mixSceneNum * 2].amp(0);
    FGsoundFileGains[mixSceneNum * 2].amp(0.5);
    FGsoundFileGains[mixSceneNum * 2 + 1].amp(0);
    MGsoundFileGains[mixSceneNum * 2 + 1].amp(0);
  } else if (voicebalance >= 0.5 && voicebalance < 0.75) {
    thisGaze = 2;
    MGsoundFileGains[mixSceneNum * 2].amp(0);
    FGsoundFileGains[mixSceneNum * 2].amp(0);
    FGsoundFileGains[mixSceneNum * 2 + 1].amp(0.5);
    MGsoundFileGains[mixSceneNum * 2 + 1].amp(0);
  } else {
    thisGaze = 3;
    MGsoundFileGains[mixSceneNum * 2].amp(0);
    FGsoundFileGains[mixSceneNum * 2].amp(0);
    FGsoundFileGains[mixSceneNum * 2 + 1].amp(0);
    MGsoundFileGains[mixSceneNum * 2 + 1].amp(0.5);
  }

  //adjust foreground voices based on proximity
  soundVolume = constrain(outputArea, 0, 1);
  masterGain.amp(soundVolume);
}

function scene9() {
  autoAdvance();
  background(bg_credits);
  for (let i = 0; i < FGsoundFiles.length; i++) {
    FGsoundFiles[i].fade(0, 1);
  }
  for (let i = 0; i < MGsoundFiles.length; i++) {
    MGsoundFiles[i].fade(0, 1);
  }
  for (let i = 0; i < BGsoundFiles.length; i++) {
    BGsoundFiles[i].fade(0, 1);
  }
  soundFileWindGain.amp(0.5);
  soundFileWind.fade(1, 1);
}

function scene10() {
  autoAdvance();
  background(bg_outro);
  soundFileWind.fade(0, 1);
}

let positions;
let videoInput;
let outputSmile = 0;
let soundFile;
let panning;
let scene_num = 0; // index of which screen of the UX flow you are in
let wind_on = false;
let voices_on = false;
let background_on = false;
let first_time = 1; // to only maximize on first time
let sceneTimerStart = true; // for auto advance after x time

let autoadvance_delay = 200; // seconds
const locPrefix = "assets/auditory/";
const fileSufix = ".mp3";
const locPrefixOrig = "assets/auditory/clips/";
const fileSufixOrig = "_story.mp3";
const CURSOR_SIZE = 50;

const NUM_BACKGROUND = 19;
const NUM_MIDGROUND = 16;
const NUM_FOREGROUND = 25;

let ctracker;
let classifier;
let BGsoundFiles;
let MGsoundFiles;
let FGsoundFiles;

let soundFileWind;
let bg_title;
let bg_cam;
let bg_intro;
let bg_credits;
let bg_outro;
let hotspots;

let nose_spot;
let nose_spot_red;
let nose_spot_green;

let scene_start;

let masterGain;
let backgroundGain;
let midgroundGain;
let foregroundGain;
let soundFileWindGain;

let BGsoundFileGains;
let MGsoundFileGains;
let FGsoundFileGains;

let BGclipNums;
let MGclipNums;
let FGclipNums;

let outputArea;
let outputX;

let randBG;
let randMG;
let randFG;

let first_scene9 = true;

function setup() {
  // setup camera capture
  videoInput = createCapture(VIDEO);
  videoInput.size(displayWidth, displayHeight);
  videoInput.position(0, 0);

  // setup canvas
  let cnv = createCanvas(1000, 528);
  cnv.position(0, 0);

  // setup tracker
  ctracker = new clm.tracker();
  ctracker.init(pModel);
  ctracker.start(videoInput.elt);

  // setup emotion classifier
  classifier = new emotionClassifier();
  classifier.init(emotionModel);
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
    console.log(BGsounds[variableName]);
    BGsounds[variableName].setVolume(1);
    BGsounds[variableName].amp(1);
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
    console.log(MGsounds[variableName]);
    MGsounds[variableName].setVolume(1);
    MGsounds[variableName].amp(1);
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
    console.log(FGsounds[variableName]);
    FGsounds[variableName].setVolume(1);
    FGsounds[variableName].amp(1);
  }
  FGsoundFiles = [...Object.values(FGsounds)];

  soundFileWind = loadSound("assets/auditory/background/BG-1.mp3");
  soundFileWind.setVolume(1);
  soundFileWind.amp(1);

  bg_title = loadImage("assets/visual/Page_01.jpg");
  bg_cam = loadImage("assets/visual/Page_02.jpg");
  bg_intro = loadImage("assets/visual/Page_03.jpg");
  bg_credits = loadImage("assets/visual/Page_10.jpg");
  bg_outro = loadImage("assets/visual/Page_11.jpg");

  let hotspot1 = loadImage("assets/visual/Page_04.jpg");
  let hotspot2 = loadImage("assets/visual/Page_05.jpg");
  let hotspot3 = loadImage("assets/visual/Page_06.jpg");
  let hotspot4 = loadImage("assets/visual/Page_07.jpg");
  let hotspot5 = loadImage("assets/visual/Page_08.jpg");
  let hotspot6 = loadImage("assets/visual/Page_09.jpg");

  hotspots = [hotspot1, hotspot2, hotspot3, hotspot4, hotspot5, hotspot6];

  nose_spot = loadImage("assets/visual/raven_button_1.png");
  nose_spot_red = loadImage("assets/visual/raven_button_2.png");
  nose_spot_green = loadImage("assets/visual/raven_button_3.png");

  setupSounds();
}

function setupSounds() {
  masterGain = new p5.Gain();
  masterGain.connect();
  masterGain.amp(1);

  // setup background gain
  backgroundGain = new p5.Gain();
  backgroundGain.connect(masterGain);
  backgroundGain.amp(1);

  // setup foreground gain
  midgroundGain = new p5.Gain();
  midgroundGain.connect(masterGain);
  midgroundGain.amp(0.3);

  // setup foreground gain
  foregroundGain = new p5.Gain();
  foregroundGain.connect(masterGain);
  foregroundGain.amp(0.3);

  soundFileWind.disconnect();
  soundFileWindGain = new p5.Gain();
  soundFileWindGain.setInput(soundFileWind);
  soundFileWindGain.connect(backgroundGain);

  let BGgains = {};
  BGsoundFileGains = [];
  for (let i = 0; i < BGclipNums.length; i++) {
    let variableName = `BGsoundFile${i}Gain`;
    BGgains[variableName] = new p5.Gain();
    BGsoundFileGains.push(BGgains[variableName]);
  }
  let MGgains = {};
  MGsoundFileGains = [];
  for (let i = 0; i < MGclipNums.length; i++) {
    let variableName = `MGsoundFile${i}Gain`;
    MGgains[variableName] = new p5.Gain();
    MGsoundFileGains.push(MGgains[variableName]);
  }
  let FGgains = {};
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
  background_on = false;
  voices_on = false;
  scene_num++;
  console.log("Scene Number Incremented to ", scene_num);

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
    background_on = false;
    voices_on = false;
    sceneTimerStart = true;
    scene_num++;
    console.log("Scene Number Incremented to ", scene_num);
    return true;
    if (scene_num == 11) {
      restartShow();
    }
  } else {
    return false;
  }
}

function restartShow() {
  scene_num = 0;
  wind_on = false;
  voices_on = false;
  background_on = false;
  first_scene_draw = true;
  first_scene9 = true;

  soundFileWind.stop();

  BGsoundFiles.forEach((soundFile) => {
    soundFile.stop();
  });
  MGsoundFiles.forEach((soundFile) => {
    soundFile.stop();
  });
  FGsoundFiles.forEach((soundFile) => {
    soundFile.stop();
  });
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
  console.log("Start Of Show, intro 1/3");
  console.log("scence_num:", scene_num);

  background(bg_title);
}

function scene1() {
  console.log("Intro 2/3");
  console.log("scence_num:", scene_num);

  autoAdvance();
  background(bg_cam);
  if (!wind_on) {
    soundFileWind.loop();
    soundFileWindGain.amp(1, 1);
    wind_on = true;
  }
}

function scene2() {
  console.log("Intro 3/3");
  console.log("scence_num:", scene_num);

  autoAdvance();
  background(bg_intro);
}

function scene() {
  //put hotspot background on

  doneScence = autoAdvance();

  if (!doneScence) {
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
      let boxWidth = maxX - minX;
      let boxHeight = maxY - minY;
      outputArea = (boxWidth * boxHeight) / (width * height);
      outputArea = outputArea;

      // Draw box on face
      push();
      noFill();
      strokeWeight(1);
      rect(minX, minY, boxWidth, boxHeight);

      // draw nose position
      noStroke();
      fill(0, 255, 255);
      outputX = positions[62][0];
      let outputY = positions[62][1];
      // outputX = width - mouseX;
      // outputY = mouseY;

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
}

let first_scene_draw = true;

function pan_sounds(mixSceneNum) {
  if (first_scene_draw) {
    first_scene_draw = false;
    if (mixSceneNum == 0) {
      // stop wind on first draw of first scene
      wind_on = false;
      soundFileWindGain.amp(0, 2);
    } else {
      // stop previous background sound on first draw
      BGsoundFileGains[mixSceneNum - 1].amp(0, 2);
      background_on = false;
      MGsoundFileGains[(mixSceneNum - 1) * 2].amp(0, 1);
      MGsoundFilesGains[(mixSceneNum - 1) * 2 + 1].amp(0, 1);
      FGsoundFilesGains[(mixSceneNum - 1) * 2].amp(0, 1);
      FGsoundFilesGains[(mixSceneNum - 1) * 2 + 1].amp(0, 1);
      voices_on = false;
    }
  }

  if (!background_on) {
    console.log("Scene Number:", scene_num);
    console.log(BGsoundFiles[mixSceneNum]);

    BGsoundFiles[mixSceneNum].loop();
    BGsoundFileGains[mixSceneNum].amp(1, 1);
    background_on = true;
  }

  if (!voices_on) {
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
  // voicebalance = mouseX / width;
  //adjust relative sound amplitude based on gaze location
  if (voicebalance < 0.25) {
    MGsoundFileGains[mixSceneNum * 2].amp(0.8, 0.1);
    FGsoundFileGains[mixSceneNum * 2].amp(0.4, 0.1);
    FGsoundFileGains[mixSceneNum * 2 + 1].amp(0.2, 0.1);
    MGsoundFileGains[mixSceneNum * 2 + 1].amp(0.1, 0.1);
  } else if (voicebalance >= 0.25 && voicebalance < 0.5) {
    MGsoundFileGains[mixSceneNum * 2].amp(0.4, 0.1);
    FGsoundFileGains[mixSceneNum * 2].amp(0.8, 0.1);
    FGsoundFileGains[mixSceneNum * 2 + 1].amp(0.4, 0.1);
    MGsoundFileGains[mixSceneNum * 2 + 1].amp(0.2, 0.1);
  } else if (voicebalance >= 0.5 && voicebalance < 0.75) {
    MGsoundFileGains[mixSceneNum * 2].amp(0.2, 0.1);
    FGsoundFileGains[mixSceneNum * 2].amp(0.4, 0.1);
    FGsoundFileGains[mixSceneNum * 2 + 1].amp(0.8, 0.1);
    MGsoundFileGains[mixSceneNum * 2 + 1].amp(0.4, 0.1);
  } else {
    MGsoundFileGains[mixSceneNum * 2].amp(0.1, 0.1);
    FGsoundFileGains[mixSceneNum * 2].amp(0.2, 0.1);
    FGsoundFileGains[mixSceneNum * 2 + 1].amp(0.4, 0.1);
    MGsoundFileGains[mixSceneNum * 2 + 1].amp(0.8, 0.1);
  }
  //adjust foreground voices based on proximity
  soundVolume = map(outputArea, 0, 1, 0.5, 1);
  foregroundGain.amp(soundVolume, 0.1);
  midgroundGain.amp(soundVolume, 0.1);
}

function scene9() {
  console.log("Credit Scene 1/2");
  console.log("scence_num:", scene_num);
  autoAdvance();
  background(bg_credits);
  if (first_scene9) {
    first_scene9 = false;
    for (let i = 0; i < FGsoundFiles.length; i++) {
      FGsoundFileGains[i].amp(0, 3);
    }
    background_on = false;
    for (let i = 0; i < MGsoundFiles.length; i++) {
      MGsoundFileGains[i].amp(0, 3);
    }
    for (let i = 0; i < BGsoundFiles.length; i++) {
      BGsoundFileGains[i].amp(0, 3);
    }
    voices_on = false;

    randBG = Math.floor(Math.random() * 6);
    randMG = Math.floor(Math.random() * 12);
    randFG = Math.floor(Math.random() * 12);
  }

  if (!background_on) {
    BGsoundFiles[randBG].loop();
    BGsoundFileGains[randBG].amp(1, 3);
    background_on = true;
  }

  if (!voices_on) {
    MGsoundFiles[randMG].loop();
    MGsoundFileGains[randMG].amp(0.5, 3);
    FGsoundFiles[randFG].loop();
    FGsoundFileGains[randFG].amp(0.7, 3);
    voices_on = true;
  }

  if (!wind_on) {
    soundFileWind.loop();
    soundFileWindGain.amp(1, 3);
    wind_on = true;
  }
}

function scene10() {
  console.log("Credit Scene 2/2");
  console.log("scence_num:", scene_num);
  autoAdvance();
  background(bg_outro);
  BGsoundFileGains[randBG].amp(0, 2);
  MGsoundFileGains[randMG].amp(0, 2);
  FGsoundFileGains[randFG].amp(0, 2);
  soundFileWindGain.amp(0, 2);
}

let font;

let red,blue,green;
let soundEngineStarted = false;

let oscR,oscG,oscB,fft;

let sliderR,sliderG,sliderB,brightnessSlider,tempoSlider,satSlider;

let textBoxR,textBoxG,textBoxB;

let toggleSoundButton;
let playButton;
let addColorButton;
let eraseButton;
let quantizeButton;

let rainbowBox;
let rainbowShader;

let title;

let colorPickerX,colorPickerY;
let colorPicking = false;
let enteringNumber = false;

let palette;

const rectSize = 50;

const waveStartX = 700;
const waveWidth = 100;
const waveStartY = 100;
const waveHeight = 200;

function preload(){
  font = loadFont('data/Lostar.ttf');
}

function setup() {
  let canv = createCanvas(800,800);
  //canv.style("margin","auto");
  //canv.style("display","block");
  
  rainbowBox = createGraphics(250,250,WEBGL);
  rainbowShader = rainbowBox.createShader(rainbowVert,rainbowFrag);
  
  palette = new Palette();
  
  colorPickerX = 100;
  colorPickerY = 100;
  
  sliderR = createSlider(0,255,255);
  sliderR.position(80,90);
  sliderG = createSlider(0,255,0);
  sliderG.position(80,190);
  sliderB = createSlider(0,255,0);
  sliderB.position(80,290);
  
  brightnessSlider = createSlider(0.0,2.0,1.0,0.01);
  brightnessSlider.position(80,620);
  brightnessSlider.mousePressed(activateBrightnessSlider);
  brightnessSlider.mouseReleased(deactivateBrightnessSlider);
  satSlider = createSlider(0.1,3.0,0.5,0.01);
  satSlider.position(80,660);
  satSlider.mousePressed(activateBrightnessSlider);
  satSlider.mouseReleased(deactivateBrightnessSlider);
  
  tempoSlider = createSlider(1,120,60,1);
  tempoSlider.position(400,620);
  
  textBoxR = createInput();
  textBoxR.position(300,90);
  textBoxR.value('255');
  textBoxR.mousePressed(enteringNumber = true);
  
  textBoxG = createInput();
  textBoxG.position(300,190);
  textBoxG.value('0');
  textBoxG.mousePressed(enteringNumber = true);
  
  textBoxB = createInput();
  textBoxB.position(300,290);
  textBoxB.value('0');
  textBoxB.mousePressed(enteringNumber = true);
  
  toggleSoundButton = createButton('audio on');
  toggleSoundButton.position(20,80);
  toggleSoundButton.mousePressed(toggleSound);
  
  addColorButton = createButton('add');
  addColorButton.position(20,120);
  addColorButton.mousePressed(addColor);

  playButton = createButton('play');
  playButton.position(20,160);
  playButton.mousePressed(playPalette);
  
  eraseButton = createButton('erase');
  eraseButton.position(20,200);
  eraseButton.mousePressed(erasePalette);
  
  quantizeButton = createButton('quantize');
  quantizeButton.position(20,240);
  quantizeButton.mousePressed(quantizePaletteToTET);
  
  oscR = new p5.TriOsc();
  oscG = new p5.SinOsc();
  oscB = new p5.SinOsc();
  
  oscR.amp(0.5);
  oscG.amp(0.5);
  oscB.amp(0.5);
  
  fft = new p5.FFT();
  
  oscR.start();
  oscG.start();
  oscB.start();
  
  title = createGraphics(700,110,WEBGL);
  title.textFont(font);
  title.textSize(66);
  title.textAlign(CENTER);
  title.rotateY(radians(15));
  title.background(255);
  title.strokeWeight(10);
  title.stroke(255,0,0);
  title.fill(0);
  title.text("Colorsynth",20,20,0);
  
  colorMode(RGB);
}

function draw() {
  //console.log(palette);
  background(255);
  image(title,100,0);
  if(colorPicking && mouseX>80 && mouseX<330 && mouseY>350 && mouseY<600){
    colorPickerX = mouseX - 80;
    colorPickerY = mouseY - 350;
  }
  
  //updateControls();
  if(!palette.isPlaying){
    updateColors();
  }
  palette.update();
  updateOscillators();
  palette.display();
  drawColors();
  drawOscWaveform();
  
  rainbowShader.setUniform('brightness',brightnessSlider.value());
  rainbowShader.setUniform('saturation',satSlider.value());
  rainbowBox.clear();
  rainbowBox.background(255);
  rainbowBox.shader(rainbowShader);
  rainbowBox.noStroke();
  rainbowBox.rect(0,0,rainbowBox.width,rainbowBox.height);
  //rainbowBox.ellipse(rainbowBox.width/2,rainbowBox.height/2,rainbowBox.width/2,rainbowBox.height/2);
  image(rainbowBox,80,350);
  noFill();
  strokeWeight(1);
  stroke(0);
  rect(80+colorPickerX,350+colorPickerY,10,10,2);
}

function keyPressed(){
  if(keyCode == ENTER){
    sliderR.value(textBoxR.value());
    sliderG.value(textBoxG.value());
    sliderB.value(textBoxB.value());
    enteringNumber = false;
  }
}

class Palette{
  constructor(){
    this.colors = [];
    this.activeColor = 0;
    this.timer = 60;
    this.isPlaying = false;
  }
  display(){
    let x = 360;
    let y = 360;
    if(this.isPlaying){
      stroke(0);
      rect(x-10,y-10,width-x,height-y,5);
    }
    let i = 0;
    for(let c of this.colors){
      fill(c.levels[0],c.levels[1],c.levels[2]);
      strokeWeight((i==this.activeColor?2:0));
      rect(x,y,50,50,5);
      x+=60;
      i++;
      if(x>width-50){
        x = 360;
        y += 60;
      }
    }
  }
  update(){
    if(this.isPlaying){
      this.timer--;
      //once timer reaches zero, move to next color
      if(!this.timer){
        this.activeColor++;
        this.timer = tempoSlider.value();
        if(this.activeColor>=this.colors.length){
          this.activeColor = 0;
        }
        red = this.colors[this.activeColor].levels[0];
        green = this.colors[this.activeColor].levels[1];
        blue = this.colors[this.activeColor].levels[2];
        updateTextBoxes();
      }
    }
  }
  addColor(r,g,b){
    let c = color(r,g,b);
    this.colors.push(c);
  }
  toggle(){
    if(palette.colors.length>0){
      this.isPlaying = !this.isPlaying;
    }
    else{
      this.isPlaying = false;
    }
  }
}

function addColor(){
  if(palette.isPlaying){
    let newRGB = getColorWheelColor();
    palette.addColor(floor(newRGB[0]),floor(newRGB[1]),floor(newRGB[2]));
  }
  else{
    palette.addColor(red,green,blue);
  }
}

function playPalette(){
  palette.toggle();
  playButton.html(palette.isPlaying?"pause":"play");
}

function erasePalette(){
  palette.isPlaying = false;
  palette.activeColor = 0;
  palette.colors = [];
}

function activateBrightnessSlider(){
  colorPicking = true;
}
function deactivateBrightnessSlider(){
  colorPicking = false;
}
//got this formula from 
//https://www.rapidtables.com/convert/color/hsv-to-rgb.html
function HSVtoRGB(H,S,V){
  //H is between 0 and 360
  let C = V*S;
  let X = C * (1-abs((H/60)%2-1));
  let m = V - C;
  let primes = [];
  if(H<60){
    primes = [C,X,0];
  }
  else if(H<120){
    primes = [X,C,0];
  }
  else if(H<180){
    primes = [0,C,X];
  }
  else if(H<240){
    primes = [0,X,C];
  }
  else if(H<300){
    primes = [X,0,C];
  }
  else if(H<360){
    primes = [C,0,X];
  }
  let newColor = [(primes[0]+m)*255,(primes[1]+m)*255,(primes[2]+m)*255]
  return newColor;
}

function getColorWheelColor(){
    let x = colorPickerX-rainbowBox.width/2;
    let y = -colorPickerY+rainbowBox.height/2;
    let dist = sqrt(pow(x,2)+pow(y,2))/satSlider.value();
    //let theta = atan(y/x)+(y<0?0:0);
    let theta = atan(y/x)+(x<0?PI:(y<0?TWO_PI:0));
    let b = brightnessSlider.value();
    
    return HSVtoRGB((degrees(theta))%360,dist/(rainbowBox.width),b);
}

function updateColors(){
  if(colorPicking){
    let newRGB = getColorWheelColor();
    
    red = floor(newRGB[0]);
    green = floor(newRGB[1]);
    blue = floor(newRGB[2]);
    
    sliderR.value(red);
    sliderG.value(green);
    sliderB.value(blue);
    textBoxR.value(red);
    textBoxG.value(green);
    textBoxB.value(blue);
  }
  else{
    red = sliderR.value();
    green = sliderG.value();
    blue = sliderB.value();
    updateTextBoxes();
  }
}

function updateOscillators(){
  oscR.freq(map(red,0,255,0,1000));
  oscG.freq(map(green,0,255,0,1000));
  oscB.freq(map(blue,0,255,0,1000));
}

function updateTextBoxes(){
  if(!enteringNumber){
    textBoxR.value(red);
    textBoxG.value(green);
    textBoxB.value(blue);
  }
}

function drawOscWaveform(){
  noStroke();
  fill(red,green,blue);
  push();
  translate(500,100);
  rect(0,0,200,200);
  pop();
  let waveform = fft.waveform();
  noFill();
  stroke(red,green,blue);
  beginShape();
  strokeWeight(5);
  for (let i = 0; i < waveform.length; i++) {
    let y = map(i, 0, waveform.length, waveStartY, waveStartY + waveHeight);
    let x = map(waveform[i], -1, 1, waveStartX, waveStartX + waveWidth);
    vertex(x, y);
  }
  endShape();
}

function drawColors(){
  for(let i = 0; i<3; i++){
    push();
    translate(250,100+i*100);
    rectMode(CENTER);
    noStroke();
    switch(i){
      case 0:
        fill(red,0,0);
        break;
      case 1:
        fill(0,green,0);
        break;
      case 2:
        fill(0,0,blue);
        break;
    }
    rect(0,0,rectSize,rectSize,rectSize/4);
    pop();
  }
}


function log2_12(val){
  const t12 = pow(2.0,1.0/12.0);
  return Math.log(val)/Math.log(t12);
}

function quantizePaletteToTET(){
  const t12 = pow(2.0,1.0/12.0);
  console.log(palette.colors);
  for(let c of palette.colors){
    let f1 = map(c.levels[0],0,255,0,1000);
    let f2 = map(c.levels[1],0,255,0,1000);
    let f3 = map(c.levels[2],0,255,0,1000);
    let frequencies = [f1,f2,f3];
    for(let i = 0; i<3; i++){
      let testFreq = 55;
      while(testFreq<frequencies[i]){
        testFreq*=t12;
        //console.log(testFreq);
      }
      frequencies[i] = testFreq;
    }
    f1 = frequencies[0];
    f2 = frequencies[1];
    f3 = frequencies[2];

    c.levels[0] = map(f1,0,1000,0,255);
    c.levels[1] = map(f2,0,1000,0,255);
    c.levels[2] = map(f3,0,1000,0,255);
  }
  console.log(palette.colors);
}

function mouseReleased(){
  if(!enteringNumber){
    textBoxR.value(red);
    textBoxG.value(green);
    textBoxB.value(blue);
  }
  colorPicking = false;
}

function toggleSound(){
  //starting audio if it hasn't been yet
  if(!soundEngineStarted){
    userStartAudio();
    soundEngineStarted = true;
  }
  else{
    getAudioContext().suspend();
    soundEngineStarted = false;
  }
  toggleSoundButton.html(soundEngineStarted?"audio off":"audio on");
}

function mousePressed(){
  if(mouseX>80 && mouseX<330 && mouseY>350 && mouseY<600){
    colorPicking = true;
    colorPickerX = mouseX - 80;
    colorPickerY = mouseY - 350;
  }
}

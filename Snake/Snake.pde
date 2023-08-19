import java.util.Date; //only for randomSeed, nothing else.

class Snake {
  color hColor;
  color tColor;
  float hSize;
  float tSize;
  int len;
  float heading;
  float speed;
  float[] xs;
  float[] ys;
  
  Snake(color head, color tail, int spd) {
    hColor = head;
    tColor = tail;
    hSize = 20;
    tSize = 5;
    len = 20;
    heading = 0;
    speed = spd;
    xs = new float[len];
    ys = new float[len];
    xs[0] = random(width);
    ys[0] = random(height);
  }
  
  void display() {
    //draw the body
    for (int i = len-1; i > 1; i--) {
      float d = tSize + (((hSize-tSize) / (float)len)*(len - (float)i)); //map() threw an error here
      
      float Ra = red(hColor); float Rb = red(tColor);
      float Ga = green(hColor); float Gb = green(tColor);
      float Ba = blue(hColor); float Bb = blue(tColor);
      float r = map(i, 0, len, Ra, Rb);
      float g = map(i, 0, len, Ga, Gb);
      float b = map(i, 0, len, Ba, Bb);
      
      stroke(color(r, g, b));
      
      strokeWeight(d);
      
      if (dist(xs[i], ys[i], xs[i-1], ys[i-1])<(speed+10)) line(xs[i], ys[i], xs[i-1], ys[i-1]);
    }
    //draw eyes
    noStroke(); fill(0);
    float d = hSize / 5.6;
    float r = hSize / 4.0;
    float e1x = xs[0] + (d * cos(heading+1));
    float e1y = ys[0] + (d * sin(heading+1));
    float e2x = xs[0] + (d * cos(heading-1));
    float e2y = ys[0] + (d * sin(heading-1));
    ellipse(e1x, e1y, r, r);
    ellipse(e2x, e2y, r, r);
    
    //draw tongue
    stroke(color(255, 0, 0)); strokeWeight(hSize / 5.0);
    float x1 = xs[0] + ((hSize / 2.0) * cos(heading));
    float y1 = ys[0] + ((hSize / 2.0) * sin(heading));
    float x2 = xs[0] + (hSize  * cos(heading));
    float y2 = ys[0] + (hSize  * sin(heading));
    line(x1, y1, x2, y2);
  }
  
  void move() {
    //shift the values to the right
    for (int i = len-1; i > 0; i--) {
      xs[i] = xs[i-1];
      ys[i] = ys[i-1];
    }
    
    //add the new point
    //float r = random(-1, 1);
    float dx = cos(heading/*+r*/) * speed;
    float dy = sin(heading/*+r*/) * speed;
    xs[0] = (width + xs[1] + dx) % width;
    ys[0] = (height + ys[1] + dy) % height;
  }
  
  void digest(int amount) {
    len += amount;
    for (int bbb = 0; bbb < amount; bbb++) {
      xs = append(xs, xs[xs.length - 1]);
      ys = append(ys, ys[ys.length - 1]);
    }
  }
  
  void eat(Apple a) {
    if ((dist(a.x, a.y, xs[0], ys[0]) < ((a.nutrition + hSize) / 2.0))) {
      digest(a.nutrition);
      a.randomize();
    }
  }
  
  void up() {seth(PI + (PI / 2.0));}
  void down() {seth(PI / 2.0);}
  void left() {seth(PI);}
  void right() {seth(0);}
  
  void seth(float h) {heading = h;}
}

class AutoSnake extends Snake {
  AutoSnake(color head, color tail, int spd) {
    super(head, tail, spd);
  }
  
  void home(Apple a1, Apple a2) {
    //find closer apple
    float d1 = dist(a1.x, a1.y, xs[0], ys[0]);
    float d2 = dist(a2.x, a2.y, xs[0], ys[0]);
    Apple a;
    if (d1 < d2) a = a1;
    else a = a2;
    
    //set heading
    seth(atan2(a.y - ys[0], a.x - xs[0]));
  }
}

class Apple {
  int colorValue;
  float x;
  float y;
  int nutrition;
  float size;
  
  Apple() {
    colorValue = int(random(255));
    x = random(width);
    y = random(height);
    nutrition = int(random(10, 20));
  }
  
  void display() {
    float t = 5;
    noStroke(); strokeWeight(0);
    fill(color(255-colorValue, colorValue, 0));
    ellipse(x, y, 2*nutrition, 2*nutrition);
    strokeWeight(5);
    stroke(color(50, 200, 0));
    line(x, y-nutrition, x, y-nutrition-t);
  }
  
  void randomize() {
    colorValue = int(random(255));
    x = random(width);
    y = random(height);
    nutrition = int(random(10, 20));
  }
}

Snake player;
AutoSnake computer;

Apple apple1;
Apple apple2;

void setup() {
  randomSeed(new Date().getTime());
  
  player = new Snake(color(255, 0, 0), color(0, 0, 255), 5);
  computer = new AutoSnake(color(0, 255, 0), color(255, 50, 0), 3);
  
  apple1 = new Apple();
  apple2 = new Apple();
  
  size(1000, 1000);
  
  for (int bbb = 0; bbb < player.len; bbb++) player.move();
  for (int bbb = 0; bbb < computer.len; bbb++) computer.move();
  noLoop();
  frameRate(30);
}

void draw() {
  background(0);
  apple1.display();
  apple2.display();
  
  player.move();
  player.display();
  player.eat(apple1);
  player.eat(apple2);
  
  computer.home(apple1, apple2);
  computer.move();
  computer.display();
  computer.eat(apple1);
  computer.eat(apple2);
  
  player.seth(atan2(player.ys[0] - mouseY, player.xs[0] - mouseX) - PI);
}

void mousePressed() {
  loop();
}

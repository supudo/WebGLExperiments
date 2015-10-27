function Point(x, y, z) {
  this.x = (typeof x == "undefined") ? 0 : x;
  this.y = (typeof y == "undefined") ? 0 : y;
  this.z = (typeof z == "undefined") ? 0 : z;
}

function Star(x, y, translation, rotation, velocity, starSize, texture, rotationSpeed, rotationAngle, rotationDirection) {
  this.x = (typeof x == "undefined") ? 0 : x;
  this.y = (typeof y == "undefined") ? 0 : y;
  this.translation = (typeof translation == "undefined") ? [x, y] : translation;
  this.rotation = (typeof rotation == "undefined") ? [0, 0] : rotation;
  this.velocity = (typeof velocity == "undefined") ? 0 : velocity;
  this.starSize = (typeof starSize == "undefined") ? 0 : starSize;
  this.texture = (typeof texture == "undefined") ? 0 : texture;
  this.rotationSpeed = (typeof rotationSpeed == "undefined") ? 0 : rotationSpeed;
  this.rotationAngle = (typeof rotationAngle == "undefined") ? 0 : rotationAngle;
  this.rotationDirection = (typeof rotationDirection == "undefined") ? 0 : rotationDirection;
}

function Star2(x1, y1, x2, y2, velocity, starSize, texture, rotationSpeed, rotationAngle, rotationDirection) {
  this.x1 = (typeof x1 == "undefined") ? 0 : x1;
  this.y1 = (typeof y1 == "undefined") ? 0 : y1;
  this.x2 = (typeof x2 == "undefined") ? 0 : x2;
  this.y2 = (typeof y2 == "undefined") ? 0 : y2;
  this.velocity = (typeof velocity == "undefined") ? 0 : velocity;
  this.starSize = (typeof starSize == "undefined") ? 0 : starSize;
  this.texture = (typeof texture == "undefined") ? 0 : texture;
  this.rotationSpeed = (typeof rotationSpeed == "undefined") ? 0 : rotationSpeed;
  this.rotationAngle = (typeof rotationAngle == "undefined") ? 0 : rotationAngle;
  this.rotationDirection = (typeof rotationDirection == "undefined") ? 0 : rotationDirection;
}
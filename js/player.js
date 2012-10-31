var Dungeon = Dungeon || {};

Dungeon.Player = function (startposition, startdirection) {
    this.position = vec3.create(startposition);
    this.direction = startdirection;

    this.posDelta = vec3.create([0,0,0]);
    this.dirDelta = 0;

    this.stepTime = 0;
    this.turnTime = 0;
    this.moveSpeed = 30;
    this.turnSpeed = 15;

    this.steps = [
        vec3.create([0,0,-1]), vec3.create([1,0,0]),
        vec3.create([0,0,1]),  vec3.create([-1,0,0])
    ];

    this.moveForward = function(steps) {
        //if(getMapTile(mapdata, this.position.x, this.position.y, this.position.z) != 0) {
        this.posDelta = this.steps[this.direction%4];
        vec3.add(this.position, this.posDelta);
        this.moveTime = this.moveSpeed;
        //this.posDelta = $V([0,0,0]);
    };

    this.moveBackward = function(steps) {
        this.posDelta = this.steps[(this.direction+2)%4];
        vec3.add(this.position, this.posDelta);
        this.moveTime = this.moveSpeed;
    };

    this.moveLeft = function(steps) {
        this.posDelta = this.steps[(this.direction+3)%4];
        vec3.add(this.position, this.posDelta);
        this.moveTime = this.moveSpeed;
    };

    this.moveRight = function(steps) {
        this.posDelta = this.steps[(this.direction+1)%4];
        vec3.add(this.position, this.posDelta);
        this.moveTime = this.moveSpeed;
    };

    this.turnLeft = function(steps) {
        this.dirDelta -= 1;
        this.direction += this.dirDelta;
        if(this.direction<0) {
            this.direction = 4+this.direction;
        }
        this.turnTime += this.turnSpeed;
    };

    this.turnRight = function(steps) {
        this.dirDelta += 1;
        this.direction += this.dirDelta;
        if(this.direction>3) {
            this.direction = this.direction-4;
        }
        this.turnTime += this.turnSpeed;
    };
}

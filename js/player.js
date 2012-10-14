var Dungeon = Dungeon || {};

Dungeon.Player = function (startposition, startdirection) {
    this.position = startposition;
    this.direction = startdirection;

    this.posDelta = $V([0,0,0]);
    this.dirDelta = 0;

    this.stepTime = 0;
    this.turnTime = 0;
    this.moveSpeed = 10;
    this.turnSpeed = 10;

    this.steps = [
        $V([0,0,-1]), $V([1,0,-1]), $V([1,0,0]), $V([1,0,1]),
        $V([0,0,1]), $V([-1,0,1]), $V([-1,0,0]), $V([-1,0,-1])
    ];

    this.moveForward = function(steps) {
        //if(getMapTile(mapdata, this.position.x, this.position.y, this.position.z) != 0) {
        this.posDelta = this.steps[this.direction%8];
        this.position = this.position.add(this.posDelta);
        this.moveTime = this.moveSpeed;
        //this.posDelta = $V([0,0,0]);
    };

    this.moveBackward = function(steps) {
        this.posDelta = this.steps[(this.direction+4)%8];
        this.position = this.position.add(this.posDelta);
        this.moveTime = this.moveSpeed;
    };

    this.moveLeft = function(steps) {
        this.posDelta = this.steps[(this.direction+6)%8];
        this.position = this.position.add(this.posDelta);
        this.moveTime = this.moveSpeed;
    };

    this.moveRight = function(steps) {
        this.posDelta = this.steps[(this.direction+2)%8];
        this.position = this.position.add(this.posDelta);
        this.moveTime = this.moveSpeed;
    };

    this.turnLeft = function(steps) {
        this.dirDelta -= 1;
        this.direction += this.dirDelta;
        if(this.direction<0) {
            this.direction = 8+this.direction;
        }
        this.turnTime += this.turnSpeed;
    };

    this.turnRight = function(steps) {
        this.dirDelta += 1;
        this.direction += this.dirDelta;
        if(this.direction>7) {
            this.direction = this.direction-8;
        }
        this.turnTime += this.turnSpeed;
    };
}

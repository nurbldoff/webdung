var canvas;
var gl;

var squareVerticesBuffer;
var squareVerticesTextureCoordBuffer;
var squareVerticesNormalBuffer;
var squareVerticesIndexBuffer;

var cubeVerticesBuffer;
var cubeVerticesTextureCoordBuffer;
var cubeVerticesNormalBuffer;
var cubeVerticesIndexBuffer;
var cubeWorldPositionsBuffer;
var cubeRotation = 0.0;
var lastCubeUpdateTime = 0;

var cubeImage;
var cubeTexture;

var mvMatrix;
var shaderProgram;
var viewShaderProgram;
var vertexPositionAttribute;
var vertexNormalAttribute;
var textureCoordAttribute;
var perspectiveMatrix;

var mapdata;
var nWalls = 0;

//
// start
//
// Called when the canvas is created to get the ball rolling.
//

// shim layer with setTimeout fallback
window.requestAnimFrame = (function(){
    return  window.requestAnimationFrame       ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame    ||
        window.oRequestAnimationFrame      ||
        window.msRequestAnimationFrame     ||
        function(/* function */ callback, /* DOMElement */ element){
            window.setTimeout(callback, 1000 / 60);
        };
})();

function start() {
    canvas = document.getElementById("glcanvas");

    initWebGL(canvas);      // Initialize the GL context
    // Only continue if WebGL is available and working

    mapdata = loadMap("map.png");

    if (gl) {
        initTextureFramebuffer();   // FBO init
        gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
        gl.clearDepth(1.0);                 // Clear everything
        gl.enable(gl.DEPTH_TEST);           // Enable depth testing
        gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

        // Initialize the shaders; this is where all the lighting for the
        // vertices and so forth is established.

        initShaders();

        // Here's where we call the routine that builds all the objects
        // we'll be drawing.

        initSquareBuffers();
        initCubeBuffers();

        // Next, load and set up the textures we'll be using.

        initTextures();

        // Set up to draw the scene periodically.

        document.onkeydown = handleKeyDown;
        document.onkeyup = handleKeyUp;


        var lastLoop = new Date();

        (function animloop(){
            var thisLoop = new Date();
            var diff = thisLoop - lastLoop;
            //var fps = 1000 / (thisLoop - lastLoop);
            //console.log(diff);
            setTimeout(function() {
                drawScene();
                requestAnimFrame(animloop, canvas);
            }, 33-diff);  // I guess this doesn't really work, but it limits the cpu usage a bit
            lastLoop = new Date();
        })();
    }
}

var currentlyPressedKeys = {};
var moveDelta = $V([0,0,0]);
var playerPos = $V([2,1,19]);
var playerDirection = 0;   // 0..7, 0 is in -Z direction
var filter=0;

function Player(startposition, startdirection) {
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

var player = new Player(playerPos, 0);

function handleKeyDown(event) {
    currentlyPressedKeys[event.keyCode] = true;

    if (String.fromCharCode(event.keyCode) == "W") {
        console.log("w");
        player.moveForward(1);
    }

    if (String.fromCharCode(event.keyCode) == "S") {
        console.log("s");
        player.moveBackward(1);
    }

    if (String.fromCharCode(event.keyCode) == "A") {
        console.log("d");
        player.moveLeft(1);
    }

    if (String.fromCharCode(event.keyCode) == "D") {
        console.log("s");
        player.moveRight(1);
    }

    if (String.fromCharCode(event.keyCode) == "E") {
        console.log("e");
        player.turnRight(1);
    }

    if (String.fromCharCode(event.keyCode) == "Q") {
        console.log("q");
        player.turnLeft(1);
    }
    console.log(player.direction);
    console.log(player.posDelta.elements);
    console.log(player.position.elements);
}

function handleKeyUp(event) {
    currentlyPressedKeys[event.keyCode] = false;
}

function loadMap (filename) {
    var map_img = new Image();   // Create new img element
    map_img.src = filename; // Set source path
    var buffer = document.createElement('canvas');
    buffer.width = map_img.width;
    buffer.height = map_img.height;
    var ctx = buffer.getContext('2d');
    ctx.drawImage(map_img, 0, 0);
    var imgd = ctx.getImageData(0, 0, buffer.width, buffer.height);
    var mapdata = imgd.data;
    return mapdata;
}

function getMapTile (mapdata, x, y, z) {
    return mapdata[4*(32*3*y+32*z+x)+3];
}


//
// initWebGL
//
// Initialize WebGL, returning the GL context or null if
// WebGL isn't available or could not be initialized.
//
function initWebGL() {
  gl = null;

  try {
    gl = canvas.getContext("experimental-webgl");
  }
  catch(e) {
  }

  // If we don't have a GL context, give up now

  if (!gl) {
    alert("Unable to initialize WebGL. Your browser may not support it.");
  }
}

var rttFramebuffer;
var rttTexture;

function initTextureFramebuffer() {
    rttFramebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, rttFramebuffer);
    rttFramebuffer.width = 512;
    rttFramebuffer.height = 512;

    rttTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, rttTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, rttFramebuffer.width, rttFramebuffer.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    var renderbuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, rttFramebuffer.width, rttFramebuffer.height);

    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, rttTexture, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);

    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}


//
// initBuffers
//
// Initialize the buffers we'll need. For this demo, we just have
// one object -- a simple two-dimensional cube.
//
function initSquareBuffers() {

    // Plane to act as viewport

    squareVerticesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesBuffer);

    var square_vertices = [
        1.0,  1.0,  .0,
        -1.0, 1.0,  .0,
        1.0,  -1.0, .0,
        -1.0, -1.0, .0
    ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(square_vertices), gl.STATIC_DRAW);

    squareVerticesNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesNormalBuffer);
    var square_vertexNormals = [
        // Front
        0.0,  0.0,  1.0,
        0.0,  0.0,  1.0,
        0.0,  0.0,  1.0,
        0.0,  0.0,  1.0
    ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(square_vertexNormals),
                  gl.STATIC_DRAW);

    squareVerticesTextureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesTextureCoordBuffer);

    var square_textureCoordinates = [
        // Front
        1.0,  1.0,
        0.0,  1.0,
        1.0,  0.0,
        0.0,  0.0
    ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(square_textureCoordinates),
                  gl.STATIC_DRAW);

    squareVerticesIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, squareVerticesIndexBuffer);

    // This array defines each face as two triangles, using the
    // indices into the vertex array to specify each triangle's
    // position.

    var square_VertexIndices = [
        0,  1,  2,      0,  2,  3    // front
    ];

    // Now send the element array to GL

    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
                  new Uint16Array(square_VertexIndices), gl.STATIC_DRAW);
}

function initCubeBuffers() {
    var vertices = [];
    var vertexWorldPositions = [];
    var vertexNormals = [];
    var textureCoordinates = [];
    var cubeVertexIndices = [];

    var x, y, z=1;
    var o = 0;

    for(x=0; x<16; x++) {
        for(y=16; y<32;y++) {
            for(z=0; z<3; z++) {

            //console.log(getMapTile(mapdata, x, y, z));
            if(getMapTile(mapdata, x, y, z) > 0) {

                // Create a buffer for the cube's vertices.

                nWalls += 1;

                // Select the cubeVerticesBuffer as the one to apply vertex
                // operations to from here out.



                // Now create an array of vertices for the cube.

                vertices = vertices.concat( [
                    // Front face
                        -0.5, -0.5,  0.5,
                    0.5, -0.5,  0.5,
                    0.5,  0.5,  0.5,
                        -0.5,  0.5,  0.5,

                    // Back face
                        -0.5, -0.5, -0.5,
                        -0.5,  0.5, -0.5,
                    0.5,  0.5, -0.5,
                    0.5, -0.5, -0.5,

                    // Top face
                        -0.5,  0.5, -0.5,
                        -0.5,  0.5,  0.5,
                    0.5,  0.5,  0.5,
                    0.5,  0.5, -0.5,

                    // Bottom face
                        -0.5, -0.5, -0.5,
                    0.5, -0.5, -0.5,
                    0.5, -0.5,  0.5,
                        -0.5, -0.5,  0.5,

                    // Right face
                    0.5, -0.5, -0.5,
                    0.5,  0.5, -0.5,
                    0.5,  0.5,  0.5,
                    0.5, -0.5,  0.5,

                    // Left face
                        -0.5, -0.5, -0.5,
                        -0.5, -0.5,  0.5,
                        -0.5,  0.5,  0.5,
                        -0.5,  0.5, -0.5
                ] );

                vertexWorldPositions = vertexWorldPositions.concat( [
                    x,z,y,
                    x,z,y,
                    x,z,y,
                    x,z,y,
                    x,z,y,
                    x,z,y,
                    x,z,y,
                    x,z,y,
                    x,z,y,
                    x,z,y,
                    x,z,y,
                    x,z,y,
                    x,z,y,
                    x,z,y,
                    x,z,y,
                    x,z,y,
                    x,z,y,
                    x,z,y,
                    x,z,y,
                    x,z,y,
                    x,z,y,
                    x,z,y,
                    x,z,y,
                    x,z,y
                ] );

                //console.log(x,y,z);

                // Now pass the list of vertices into WebGL to build the shape. We
                // do this by creating a Float32Array from the JavaScript array,
                // then use it to fill the current vertex buffer.



                // Set up the normals for the vertices, so that we can compute lighting.


                vertexNormals = vertexNormals.concat( [
                    // Front
                    0.0,  0.0,  1.0,
                    0.0,  0.0,  1.0,
                    0.0,  0.0,  1.0,
                    0.0,  0.0,  1.0,

                    // Back
                    0.0,  0.0, -1.0,
                    0.0,  0.0, -1.0,
                    0.0,  0.0, -1.0,
                    0.0,  0.0, -1.0,

                    // Top
                    0.0,  1.0,  0.0,
                    0.0,  1.0,  0.0,
                    0.0,  1.0,  0.0,
                    0.0,  1.0,  0.0,

                    // Bottom
                    0.0, -1.0,  0.0,
                    0.0, -1.0,  0.0,
                    0.0, -1.0,  0.0,
                    0.0, -1.0,  0.0,

                    // Right
                    1.0,  0.0,  0.0,
                    1.0,  0.0,  0.0,
                    1.0,  0.0,  0.0,
                    1.0,  0.0,  0.0,

                    // Left
                        -1.0,  0.0,  0.0,
                        -1.0,  0.0,  0.0,
                        -1.0,  0.0,  0.0,
                        -1.0,  0.0,  0.0
                ]);


                // Map the texture onto the cube's faces.


                textureCoordinates = textureCoordinates.concat( [
                    // Front
                    0.0,  0.0,
                        1.0,  0.0,
                        1.0,  1.0,
                    0.0,  1.0,
                    // Back
                        1.0,  0.0,
                        1.0,  1.0,
                    0.0,  1.0,
                    0.0,  0.0,
                    // Top
                    0.0,  0.0,
                        1.0,  0.0,
                        1.0,  1.0,
                    0.0,  1.0,
                    // Bottom
                    0.0,  0.0,
                        1.0,  0.0,
                        1.0,  1.0,
                    0.0,  1.0,
                    // Right
                        1.0,  0.0,
                        1.0,  1.0,
                    0.0,  1.0,
                    0.0,  0.0,
                    // Left
                    0.0,  0.0,
                        1.0,  0.0,
                        1.0,  1.0,
                    0.0,  1.0
                ] );


                // Build the element array buffer; this specifies the indices
                // into the vertex array for each face's vertices.


                // This array defines each face as two triangles, using the
                // indices into the vertex array to specify each triangle's
                // position.

                cubeVertexIndices = cubeVertexIndices.concat( [
                    o+0,  o+1,  o+2,      o+0,  o+2,  o+3,    // front
                    o+4,  o+5,  o+6,      o+4,  o+6,  o+7,    // back
                    o+8,  o+9,  o+10,     o+8,  o+10, o+11,   // top
                    o+12, o+13, o+14,     o+12, o+14, o+15,   // bottom
                    o+16, o+17, o+18,     o+16, o+18, o+19,   // right
                    o+20, o+21, o+22,     o+20, o+22, o+23    // left
                ] );

                o += 24;
                // // Now send the element array to GL

            }
        }
    } }
    console.log(vertexWorldPositions.length);

    cubeVerticesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    cubeWorldPositionsBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeWorldPositionsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexWorldPositions), gl.STATIC_DRAW);

    cubeVerticesNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals),
                  gl.STATIC_DRAW);

    cubeVerticesTextureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesTextureCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates),
                  gl.STATIC_DRAW);

    cubeVerticesIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVerticesIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
                  new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);

}

//
// initTextures
//
// Initialize the textures we'll be using, then initiate a load of
// the texture images. The handleTextureLoaded() callback will finish
// the job; it gets called each time a texture finishes loading.
//
function initTextures() {
  cubeTexture = gl.createTexture();
  cubeImage = new Image();
  cubeImage.onload = function() { handleTextureLoaded(cubeImage, cubeTexture); }
  cubeImage.src = "cube.png";
}

function handleTextureLoaded(image, texture) {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.bindTexture(gl.TEXTURE_2D, null);
}

//
// drawScene
//
// Draw the scene.
//
function drawScene() {

    // Clear the canvas before we start drawing on it.
    gl.bindFramebuffer(gl.FRAMEBUFFER, rttFramebuffer);
    drawCubes();
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    // Restore the original matrix

    // draw the "outer" scene
    //gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    drawSquare();

    // Update the rotation for the next draw, if it's time to do so.

    var currentTime = (new Date).getTime();
    if (lastCubeUpdateTime) {
        var delta = currentTime - lastCubeUpdateTime;

        cubeRotation += (30 * delta) / 1000.0;
    }

    lastCubeUpdateTime = currentTime;
    //requestAnimFrame(drawScene, canvas);
}

function drawSquare() {
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(viewShaderProgram);
    perspectiveMatrix = makePerspective(45, 1.0, 0.1, 100.0);
    loadIdentity();
    mvTranslate([-0.0, 0.0, -2.0]);

    mvPushMatrix();

    gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesBuffer);
    gl.vertexAttribPointer(viewShaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesTextureCoordBuffer);
    gl.vertexAttribPointer(viewShaderProgram.textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);



    // Bind the normals buffer to the shader attribute.

    gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesNormalBuffer);
    gl.vertexAttribPointer(viewShaderProgram.vertexNormalAttribute, 3, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, rttTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.uniform1i(gl.getUniformLocation(viewShaderProgram, "uSampler"), 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, squareVerticesIndexBuffer);
    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    mvPopMatrix();

}

function drawCubes() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Establish the perspective with which we want to view the
    // scene. Our field of view is 45 degrees, with a width/height
    // ratio of 640:480, and we only want to see objects between 0.1 units
    // and 100 units away from the camera.

    gl.useProgram(shaderProgram);
    perspectiveMatrix = makePerspective(90, 1.0, 0.1, 100.0);

    // Set the drawing position to the "identity" point, which is
    // the center of the scene.

    loadIdentity();

    // Now move the drawing position a bit to where we want to start
    // drawing the cube.

    //mvTranslate([-1.0, -1.0, -19.0]);

    // Save the current matrix

    mvPushMatrix();

    // rotate the world in the opposite direction of the camera
    if(player.turnTime > 0) {
        subdelta = player.dirDelta*(player.turnTime/player.turnSpeed);
        player.turnTime -= 1;
        mvRotate((player.direction-subdelta)*45, [0, 1, 0]);
        console.log("turn");
    } else {
        player.dirDelta = 0;
        mvRotate(player.direction*45, [0, 1, 0]);
    }
    // translate accordingly
    if(player.moveTime > 0) {
        subdelta = player.posDelta.x(-player.moveTime/player.moveSpeed);
        //player.position = player.position.add(subdelta);
        player.moveTime -= 1;
        mvTranslate(player.position.add(subdelta).multiply(-1).elements);
    } else {
        player.posDelta=$V([0,0,0]);
        mvTranslate(player.position.multiply(-1).elements);
    }


    // Draw the cube by binding the array buffer to the cube's vertices
    // array, setting attributes, and pushing it to GL.

    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, cubeWorldPositionsBuffer);
    gl.vertexAttribPointer(shaderProgram.worldPositionAttribute, 3, gl.FLOAT, false, 0, 0);

    // Set the texture coordinates attribute for the vertices.

    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesTextureCoordBuffer);
    gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);

    // Bind the normals buffer to the shader attribute.

    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesNormalBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 3, gl.FLOAT, false, 0, 0);

    // Specify the texture to map onto the faces.

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, cubeTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.uniform1i(gl.getUniformLocation(shaderProgram, "uSampler"), 0);

    // Draw the cube.

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVerticesIndexBuffer);

    // mvTranslate([x*2, 0.0, y*2]);
    //setMatrixUniforms();
    //gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
    setMatrixUniforms();
    gl.drawElements(gl.TRIANGLES, 36*nWalls, gl.UNSIGNED_SHORT, 0);
    mvPopMatrix();

    gl.bindTexture(gl.TEXTURE_2D, rttTexture);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);
}


//
// initShaders
//
// Initialize the shaders, so WebGL knows how to light our scene.
//
function initShaders() {
    viewShaderProgram = createProgram("shader-view-fs", "shader-view-vs");
    shaderProgram = createProgram("shader-wall-fs", "shader-wall-vs");
}

function createProgram(fragmentShaderID, vertexShaderID) {
    var fragmentShader = getShader(gl, fragmentShaderID);
    var vertexShader = getShader(gl, vertexShaderID);

    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }

    program.vertexPositionAttribute = gl.getAttribLocation(program, "aVertexPosition");
    gl.enableVertexAttribArray(program.vertexPositionAttribute);

    program.worldPositionAttribute = gl.getAttribLocation(program, "aWorldPosition");
    gl.enableVertexAttribArray(program.worldPositionAttribute);

    program.vertexNormalAttribute = gl.getAttribLocation(program, "aVertexNormal");
    gl.enableVertexAttribArray(program.vertexNormalAttribute);

    program.textureCoordAttribute = gl.getAttribLocation(program, "aTextureCoord");
    gl.enableVertexAttribArray(program.textureCoordAttribute);

    program.pMatrixUniform = gl.getUniformLocation(program, "uPMatrix");
    program.mvMatrixUniform = gl.getUniformLocation(program, "uMVMatrix");
    program.nMatrixUniform = gl.getUniformLocation(program, "uNMatrix");
    program.samplerUniform = gl.getUniformLocation(program, "uSampler");
    program.useTexturesUniform = gl.getUniformLocation(program, "uUseTextures");
    program.useLightingUniform = gl.getUniformLocation(program, "uUseLighting");
    program.ambientColorUniform = gl.getUniformLocation(program, "uAmbientColor");
    program.pointLightingLocationUniform = gl.getUniformLocation(program, "uPointLightingLocation");
    program.pointLightingColorUniform = gl.getUniformLocation(program, "uPointLightingColor");

    return program;
}

//
// getShader
//
// Loads a shader program by scouring the current document,
// looking for a script with the specified ID.
//

function getShader(gl, id) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript) {
        return null;
    }

    var str = "";
    var k = shaderScript.firstChild;
    while (k) {
        if (k.nodeType == 3) {
            str += k.textContent;
        }
        k = k.nextSibling;
    }

    var shader;
    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}
//
// Matrix utility functions
//

function loadIdentity() {
  mvMatrix = Matrix.I(4);
}

function multMatrix(m) {
  mvMatrix = mvMatrix.x(m);
}

function mvTranslate(v) {
  multMatrix(Matrix.Translation($V([v[0], v[1], v[2]])).ensure4x4());
}

function setMatrixUniforms() {
  var pUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  gl.uniformMatrix4fv(pUniform, false, new Float32Array(perspectiveMatrix.flatten()));

  var mvUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  gl.uniformMatrix4fv(mvUniform, false, new Float32Array(mvMatrix.flatten()));

  var normalMatrix = mvMatrix.inverse();
  normalMatrix = normalMatrix.transpose();
  var nUniform = gl.getUniformLocation(shaderProgram, "uNormalMatrix");
  gl.uniformMatrix4fv(nUniform, false, new Float32Array(normalMatrix.flatten()));

  pUniform = gl.getUniformLocation(viewShaderProgram, "uPMatrix");
  gl.uniformMatrix4fv(pUniform, false, new Float32Array(perspectiveMatrix.flatten()));

  mvUniform = gl.getUniformLocation(viewShaderProgram, "uMVMatrix");
  gl.uniformMatrix4fv(mvUniform, false, new Float32Array(mvMatrix.flatten()));

  normalMatrix = mvMatrix.inverse();
  normalMatrix = normalMatrix.transpose();
  nUniform = gl.getUniformLocation(viewShaderProgram, "uNormalMatrix");
  gl.uniformMatrix4fv(nUniform, false, new Float32Array(normalMatrix.flatten()));

}

var mvMatrixStack = [];

function mvPushMatrix(m) {
  if (m) {
    mvMatrixStack.push(m.dup());
    mvMatrix = m.dup();
  } else {
    mvMatrixStack.push(mvMatrix.dup());
  }
}

function mvPopMatrix() {
  if (!mvMatrixStack.length) {
    throw("Can't pop from an empty matrix stack.");
  }

  mvMatrix = mvMatrixStack.pop();
  return mvMatrix;
}

function mvRotate(angle, v) {
  var inRadians = angle * Math.PI / 180.0;

  var m = Matrix.Rotation(inRadians, $V([v[0], v[1], v[2]])).ensure4x4();
  multMatrix(m);
}

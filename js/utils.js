var glUtils = glUtils || {};

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


//
// initWebGL
//
// Initialize WebGL, returning the GL context or null if
// WebGL isn't available or could not be initialized.
//
glUtils.init_webgl = function (canvas) {
    gl = null;

    try {
        gl = canvas.getContext("experimental-webgl");
    }
    catch(e) {
    }

    // If we don't have a GL context, give up now

    if (!gl) alert("Unable to initialize WebGL. Your browser may not support it.");
    else return gl;
};


glUtils.init_framebuffer = function (gl, size) {
    var rttFramebuffer;

    rttFramebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, rttFramebuffer);
    rttFramebuffer.width = size.x;
    rttFramebuffer.height = size.y;

    return rttFramebuffer;
};

glUtils.init_framebuffer_texture = function (gl, framebuffer) {
    var rttTexture;
    rttTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, rttTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, framebuffer.width, framebuffer.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    var renderbuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, framebuffer.width, framebuffer.height);

    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, rttTexture, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);

    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    return rttTexture;
}

//
// Initshaders
//
// Initialize the shaders, so WebGL knows how to light our scene.
//
glUtils.init_shaders = function (gl, shader_names) {
    var shaders = {};
    for (var i=0; i < shader_names.length; i++) {
        var name = shader_names[i];
        shaders[name] = (glUtils.create_program(gl, name + "-fs", name + "-vs"));
    }
    return shaders;
}

glUtils.create_program = function (gl, fragmentShaderID, vertexShaderID) {
    var fragmentShader = glUtils.get_shader(gl, fragmentShaderID);
    var vertexShader = glUtils.get_shader(gl, vertexShaderID);

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
};

//
// Loads a shader program by scouring the current document,
// looking for a script with the specified ID.
//

glUtils.get_shader = function(gl, id) {
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

glUtils.prepare_view = function (gl) {
    gl.clearColor(0.0, 1.0, 0.0, 1.0);  // Clear to black, fully opaque
    gl.clearDepth(1.0);                 // Clear everything
    gl.enable(gl.DEPTH_TEST);           // Enable depth testing
    gl.depthFunc(gl.LEQUAL);            // Near things obscure far things
};


glUtils.mht = function(m) {
    var s = "", i;
    if (m.length == 16) {
        for (i = 0; i < 4; i++) {
            s += "<span style='font-family: monospace'>[" + m[i*4+0].toFixed(4) + "," + m[i*4+1].toFixed(4) + "," + m[i*4+2].toFixed(4) + "," + m[i*4+3].toFixed(4) + "]</span><br>";
        }
    } else if (m.length == 9) {
        for (i = 0; i < 3; i++) {
            s += "<span style='font-family: monospace'>[" + m[i*3+0].toFixed(4) + "," + m[i*3+1].toFixed(4) + "," + m[i*3+2].toFixed(4) + "]</font><br>";
        }
    } else {
        return m.toString();
    }
    return s;
};

//
// gluLookAt
//
glUtils.makeLookAt = function (ex, ey, ez,
                    cx, cy, cz,
                    ux, uy, uz)
{
    var eye = $V([ex, ey, ez]);
    var center = $V([cx, cy, cz]);
    var up = $V([ux, uy, uz]);

    var mag;

    var z = eye.subtract(center).toUnitVector();
    var x = up.cross(z).toUnitVector();
    var y = z.cross(x).toUnitVector();

    var m = $M([[x.e(1), x.e(2), x.e(3), 0],
                [y.e(1), y.e(2), y.e(3), 0],
                [z.e(1), z.e(2), z.e(3), 0],
                [0, 0, 0, 1]]);

    var t = $M([[1, 0, 0, -ex],
                [0, 1, 0, -ey],
                [0, 0, 1, -ez],
                [0, 0, 0, 1]]);
    return m.x(t);
};

//
// glOrtho
//
glUtils.makeOrtho = function (left, right,
                   bottom, top,
                   znear, zfar)
{
    var tx = -(right+left)/(right-left);
    var ty = -(top+bottom)/(top-bottom);
    var tz = -(zfar+znear)/(zfar-znear);

    return $M([[2/(right-left), 0, 0, tx],
               [0, 2/(top-bottom), 0, ty],
               [0, 0, -2/(zfar-znear), tz],
               [0, 0, 0, 1]]);
};

//
// gluPerspective
//
glUtils.makePerspective = function (fovy, aspect, znear, zfar)
{
    var ymax = znear * Math.tan(fovy * Math.PI / 360.0);
    var ymin = -ymax;
    var xmin = ymin * aspect;
    var xmax = ymax * aspect;

    return glUtils.makeFrustum(xmin, xmax, ymin, ymax, znear, zfar);
};

//
// glFrustum
//
glUtils.makeFrustum = function(left, right,
                     bottom, top,
                     znear, zfar)
{
    var X = 2*znear/(right-left);
    var Y = 2*znear/(top-bottom);
    var A = (right+left)/(right-left);
    var B = (top+bottom)/(top-bottom);
    var C = -(zfar+znear)/(zfar-znear);
    var D = -2*zfar*znear/(zfar-znear);

    return $M([[X, 0, A, 0],
               [0, Y, B, 0],
               [0, 0, C, D],
               [0, 0, -1, 0]]);
};

//
// glOrtho
//
glUtils.makeOrtho = function (left, right, bottom, top, znear, zfar)
{
    var tx = - (right + left) / (right - left);
    var ty = - (top + bottom) / (top - bottom);
    var tz = - (zfar + znear) / (zfar - znear);

    return $M([[2 / (right - left), 0, 0, tx],
           [0, 2 / (top - bottom), 0, ty],
           [0, 0, -2 / (zfar - znear), tz],
           [0, 0, 0, 1]]);
};


//
// Matrix utility functions
//

glUtils.loadIdentity = function (c) {
    c.mvMatrix = Matrix.I(4);
};

glUtils.multMatrix = function (c, m) {
    c.mvMatrix = c.mvMatrix.x(m);
};

glUtils.mvTranslate = function (c, v) {
    glUtils.multMatrix(c, Matrix.Translation($V([v[0], v[1], v[2]])).ensure4x4());
};

glUtils.setMatrixUniforms = function (gl, context, shader) {
    var pUniform = gl.getUniformLocation(shader, "uPMatrix");
    gl.uniformMatrix4fv(pUniform, false, new Float32Array(context.perspectiveMatrix.flatten()));

    var mvUniform = gl.getUniformLocation(shader, "uMVMatrix");
    gl.uniformMatrix4fv(mvUniform, false, new Float32Array(context.mvMatrix.flatten()));

    var normalMatrix = context.mvMatrix.inverse();
    normalMatrix = normalMatrix.transpose();
    var nUniform = gl.getUniformLocation(shader, "uNormalMatrix");
    gl.uniformMatrix4fv(nUniform, false, new Float32Array(normalMatrix.flatten()));
};

glUtils.mvPushMatrix = function (c, m) {
    if (!!m) {
        c.mvMatrixStack.push(m.dup());
        c.mvMatrix = m.dup();
    } else {
        c.mvMatrixStack.push(c.mvMatrix.dup());
    }
};

glUtils.mvPopMatrix = function (c) {
    if (!c.mvMatrixStack.length) {
        throw("Can't pop from an empty matrix stack.");
    }

    c.mvMatrix = c.mvMatrixStack.pop();
    return c.mvMatrix;
};

glUtils.mvRotate = function (c, angle, v) {
    var inRadians = angle * Math.PI / 180.0;
    var m = Matrix.Rotation(inRadians, $V([v[0], v[1], v[2]])).ensure4x4();
    glUtils.multMatrix(c, m);
};

/* WebGL dungeon
 * Copyright 2012, Johan Forsberg
 */

var Dungeon = Dungeon || {};

Dungeon.start = function (view_size) {
    var canvas = document.getElementById("glcanvas"),
        gl = glUtils.init_webgl(canvas),
        player_startpos = [2, 1, 19], player_startdir = 3;

    if (gl) {
        // The context holds the model-view and perspective matrices
        var context = new Dungeon.GLContext();

        // The dungeon view is drawn to a framebuffer, which in turn is
        // used as a texture on the viewplane. This enables visual effects.
        var framebuffer = glUtils.init_framebuffer(gl, view_size);   // FBO init
        var fbtexture = glUtils.init_framebuffer_texture(gl, framebuffer);

        // Load textures.
        var cube_texture = Dungeon.init_texture(gl, "images/cube.png");
        var lightmap_texture = Dungeon.init_texture(gl, "images/lightmap.png");

        // Compile shaders
        var shaders = glUtils.init_shaders(gl, ["cube", "view"]);

        // The player
        var start_pos = player_startpos;
        var start_direction = player_startdir;   // 0..7, 0 is in -Z direction
        var player = new Dungeon.Player(start_pos, start_direction);
        Dungeon.setup_input(player);

        var on_map_loaded = function (mapdata) {
            // Generate object buffers
            var view_buffers = Dungeon.init_view_buffers(gl);
            Dungeon.init_map(gl, ["cube"], mapdata, run.bind(this, view_buffers));
            //var cube_buffers = Dungeon.init_map_buffers(gl, mapdata);
        };

        var run = function (view_buffers, cube_buffers) {
            glUtils.prepare_view(gl);
            var loading_text = document.getElementById("loading_text");
            loading_text.parentNode.removeChild(loading_text);

            Dungeon.setup_buffers(gl, shaders.view, view_buffers);

            // Main loop
            (function animloop(){
                Dungeon.draw_scene(gl, context, view_size, framebuffer, fbtexture,
                                   view_buffers, cube_buffers,
                                   cube_texture, shaders,
                                   lightmap_texture, player);
                requestAnimFrame(animloop, canvas);
            })();
        };

        // Load meshes


        // Load map
        Dungeon.load_map("images/map.png", on_map_loaded);
    }
};


Dungeon.setup_input = function (player) {

    var currently_held_keys = {};
    document.onkeydown = function (event) {
        currently_held_keys[event.keyCode] = true;
        switch (String.fromCharCode(event.keyCode)) {
        case "W": player.moveForward(1); break;
        case "S": player.moveBackward(1); break;
        case "A": player.moveLeft(1); break;
        case "D": player.moveRight(1); break;
        case "E": player.turnRight(1); break;
        case "Q": player.turnLeft(1); break;
        }
    };

    document.onkeyup = function (event) {
        currently_held_keys[event.keyCode] = false;
    };

    document.getElementById("turn_left").onclick = function(event) { player.turnLeft(1); };
    document.getElementById("turn_right").onclick = function(event) { player.turnRight(1); };
    document.getElementById("move_forward").onclick = function(event) { player.moveForward(1); };
    document.getElementById("move_backward").onclick = function(event) { player.moveBackward(1); };
    document.getElementById("move_left").onclick = function(event) { player.moveLeft(1); };
    document.getElementById("move_right").onclick = function(event) { player.moveRight(1); };
};

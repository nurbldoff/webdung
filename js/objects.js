var Dungeon = Dungeon || {};


Dungeon.init_map = function (gl, meshfiles, mapdata, callback) {
    var n = 0;
    var on_loaded = function (data) {
        callback(Dungeon.init_map_buffers(gl, new Mesh(data), mapdata));
    };
    glUtils.load_obj_file("meshes/cube.obj", on_loaded);
    //glUtils.load_threejs_files(meshfiles, on_loaded);
};


Dungeon.init_view_buffers = function (gl) {
    var buffers = {};

    // Plane to act as viewport

    buffers.vertices = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertices);

    var square_vertices = [
        1.0,  1.0,  .0,
        -1.0, 1.0,  .0,
        1.0,  -1.0, .0,
        -1.0, -1.0, .0
    ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(square_vertices), gl.STATIC_DRAW);

    buffers.vertex_normals = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertex_normals);
    var square_vertexNormals = [
        // Front
        0.0,  0.0,  1.0,
        0.0,  0.0,  1.0,
        0.0,  0.0,  1.0,
        0.0,  0.0,  1.0
    ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(square_vertexNormals),
                  gl.STATIC_DRAW);

    buffers.texture_coords = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.texture_coords);

    var square_textureCoordinates = [
        // Front
        1.0,  1.0,
        0.0,  1.0,
        1.0,  0.0,
        0.0,  0.0
    ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(square_textureCoordinates),
                  gl.STATIC_DRAW);

    buffers.vertex_indices = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.vertex_indices);

    // This array defines each face as two triangles, using the
    // indices into the vertex array to specify each triangle's
    // position.
    var square_VertexIndices = [
        0,  1,  2,      0,  2,  3    // front
    ];

    // Now send the element array to GL
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
                  new Uint16Array(square_VertexIndices), gl.STATIC_DRAW);

    return buffers;
};


Dungeon.init_map_buffers = function (gl, mesh, mapdata) {
    console.log(mesh);

    var buffers = {},
        vertices = [],
        world_positions = [],
        texture_coords = [],
        vertex_normals = [],
        vertex_indices = [];

    var x, y, z;
    var o = 0;
    var n_walls = 0;

    for(x=0; x<16; x++) {
        for(y=16; y<32;y++) {
            for(z=0; z<4; z++) {
                if(Dungeon.getMapTile(mapdata, x, y, z) > 0) {

                    vertices.push.apply( vertices, mesh.vertices );
                    for (i=0; i<mesh.indices.length; i++) {
                        world_positions.push.apply( world_positions, [x,z,y]);
                    }
                    texture_coords.push.apply( texture_coords, mesh.textures );
                    vertex_normals.push.apply( vertex_normals, mesh.vertexNormals);
                    for (i=0; i<mesh.indices.length; i++) {
                        vertex_indices.push( mesh.indices[i] + n_walls*mesh.vertices.length/3 );
                    }
                    n_walls++;
                }
            }
        }
    }
    buffers.n_walls = n_walls;
    console.log("buffers", buffers, vertices, world_positions);

    buffers.vertices = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertices);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    buffers.world_positions = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.world_positions);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(world_positions), gl.STATIC_DRAW);

    buffers.vertex_normals = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertex_normals);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertex_normals),
                  gl.STATIC_DRAW);

    buffers.texture_coords = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.texture_coords);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texture_coords),
                  gl.STATIC_DRAW);

    buffers.vertex_indices = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.vertex_indices);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
                  new Uint16Array(vertex_indices), gl.STATIC_DRAW);

    return buffers;
};




Dungeon.init_cube_buffers = function (gl, mapdata) {
    var buffers = {},
        vertices = [],
        world_positions = [],
        texture_coords = [],
        vertex_normals = [],
        vertex_indices = [];

    var x, y, z;
    var o = 0;
    buffers.n_walls = 0;

    for(x=0; x<16; x++) {
        for(y=16; y<32;y++) {
            for(z=0; z<4; z++) {

                if(Dungeon.getMapTile(mapdata, x, y, z) > 0) {

                    buffers.n_walls += 1;

                    // Create a buffer for the cube's vertices.
                    vertices.push.apply( vertices, [
                        // Front face
                            -0.5, -0.5,  0.5,
                        0.5, -0.5,  0.5,
                        0.5,  0.5,  0.5,
                            -0.5,  0.5,  0.5,
                        0.0,  0.0,  0.5,

                        // Back face
                            -0.5, -0.5, -0.5,
                            -0.5,  0.5, -0.5,
                        0.5,  0.5, -0.5,
                        0.5, -0.5, -0.5,
                        0.0, 0.0, -0.5,

                        // Top face
                            -0.5,  0.5, -0.5,
                            -0.5,  0.5,  0.5,
                        0.5,  0.5,  0.5,
                        0.5,  0.5, -0.5,
                        0.0, 0.5, 0.0,

                        // Bottom face
                            -0.5, -0.5, -0.5,
                        0.5, -0.5, -0.5,
                        0.5, -0.5,  0.5,
                            -0.5, -0.5,  0.5,
                        0.0, -0.5, 0.0,

                        // Right face
                        0.5, -0.5, -0.5,
                        0.5,  0.5, -0.5,
                        0.5,  0.5,  0.5,
                        0.5, -0.5,  0.5,
                        0.5, 0.0, 0.0,

                        // Left face
                            -0.5, -0.5, -0.5,
                            -0.5, -0.5,  0.5,
                            -0.5,  0.5,  0.5,
                            -0.5,  0.5, -0.5,
                            -0.5, 0.0, 0.0
                    ] );

                    world_positions.push.apply( world_positions, [
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


                    vertex_normals.push.apply( vertex_normals, [
                        // Front
                        0.0,  0.0,  1.0,
                        0.0,  0.0,  1.0,
                        0.0,  0.0,  1.0,
                        0.0,  0.0,  1.0,
                        0.0,  0.0,  1.0,

                        // Back
                        0.0,  0.0, -1.0,
                        0.0,  0.0, -1.0,
                        0.0,  0.0, -1.0,
                        0.0,  0.0, -1.0,
                        0.0,  0.0, -1.0,

                        // Top
                        0.0,  1.0,  0.0,
                        0.0,  1.0,  0.0,
                        0.0,  1.0,  0.0,
                        0.0,  1.0,  0.0,
                        0.0,  1.0,  0.0,

                        // Bottom
                        0.0, -1.0,  0.0,
                        0.0, -1.0,  0.0,
                        0.0, -1.0,  0.0,
                        0.0, -1.0,  0.0,
                        0.0, -1.0,  0.0,


                        // Right
                        1.0,  0.0,  0.0,
                        1.0,  0.0,  0.0,
                        1.0,  0.0,  0.0,
                        1.0,  0.0,  0.0,
                        1.0,  0.0,  0.0,

                        // Left
                            -1.0,  0.0,  0.0,
                            -1.0,  0.0,  0.0,
                            -1.0,  0.0,  0.0,
                            -1.0,  0.0,  0.0,
                            -1.0,  0.0,  0.0
                    ]);


                    // Map the texture onto the cube's faces.


                    texture_coords.push.apply( texture_coords, [
                        // Front
                        0.0,  0.0,
                        1.0,  0.0,
                        1.0,  1.0,
                        0.0,  1.0,
                        0.5, 0.5,
                        // Back
                        1.0,  0.0,
                        1.0,  1.0,
                        0.0,  1.0,
                        0.0,  0.0,
                        0.5, 0.5,
                        // Top
                        0.0,  0.0,
                        1.0,  0.0,
                        1.0,  1.0,
                        0.0,  1.0,
                        0.5, 0.5,
                        // Bottom
                        0.0,  0.0,
                        1.0,  0.0,
                        1.0,  1.0,
                        0.0,  1.0,
                        0.5, 0.5,
                        // Right
                        1.0,  0.0,
                        1.0,  1.0,
                        0.0,  1.0,
                        0.0,  0.0,
                        0.5, 0.5,
                        // Left
                        0.0,  0.0,
                        1.0,  0.0,
                        1.0,  1.0,
                        0.0,  1.0,
                        0.5, 0.5
                    ] );


                    // Build the element array buffer; this specifies the indices
                    // into the vertex array for each face's vertices.


                    // This array defines each face as two triangles, using the
                    // indices into the vertex array to specify each triangle's
                    // position.

                    vertex_indices.push.apply( vertex_indices, [
                        o+0,  o+1,  o+4,      o+1,  o+2,  o+4,    // front
                        o+2,  o+3,  o+4,      o+3,  o+0,  o+4,

                        o+5,  o+6,  o+9,      o+6,  o+7,  o+9,    // back
                        o+7,  o+8,  o+9,      o+8,  o+5,  o+9,

                        o+10,  o+11,  o+14,    o+11,  o+12, o+14,   // top
                        o+12, o+13, o+14,     o+13,  o+10,  o+14,

                        o+15, o+16, o+19,     o+16, o+17, o+19,   // bottom
                        o+17, o+18, o+19,     o+18, o+15, o+19,

                        o+20, o+21, o+24,     o+21, o+22, o+24,   // right
                        o+22, o+23, o+24,     o+23, o+20, o+24,

                        o+25, o+26, o+29,     o+26, o+27, o+29,    // left
                        o+27, o+28, o+29,     o+28, o+25, o+29
                    ] );

                    o += 30;
                }
            }
        }
    }

    buffers.vertices = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertices);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    buffers.world_positions = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.world_positions);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(world_positions), gl.STATIC_DRAW);

    buffers.vertex_normals = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertex_normals);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertex_normals),
                  gl.STATIC_DRAW);
    buffers.texture_coords = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.texture_coords);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texture_coords),
                  gl.STATIC_DRAW);

    buffers.vertex_indices = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.vertex_indices);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
                  new Uint16Array(vertex_indices), gl.STATIC_DRAW);

    return buffers;
};

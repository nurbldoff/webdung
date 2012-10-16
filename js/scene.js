var Dungeon = Dungeon || {};

//
// drawScene
//
// Draw the scene.
//
Dungeon.draw_scene = function (gl, context, size, framebuffer, fbtexture,
                               view_buffers, cube_buffers,
                               cube_texture, shaders,
                               lightmap, player) {

    // Draw the dungeon into the framebuffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    Dungeon.draw_cubes(gl, context, cube_buffers, cube_texture, shaders.cube,
                        lightmap, player);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    // Draw the viewplane with the framebuffer as texture
    gl.viewport(0, 0, size.x, size.y);
    Dungeon.draw_viewplane(gl, context, view_buffers, fbtexture, shaders.view);
};


Dungeon.draw_viewplane = function (gl, context, buffer, texture, shader) {
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(shader);
    context.mvMatrix = mat4.identity();
    mat4.translate(context.mvMatrix, vec3.create([-0.0, 0.0, -1.5]));
    // FIXME: this seems pointless to do each frame
    //context.perspectiveMatrix = glUtils.makePerspective(45, 1.0, 0.1, 100.0);
    context.perspectiveMatrix = mat4.perspective(45, 1.0, 0.1, 100);
    glUtils.mvPushMatrix(context);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer.vertices);
    gl.vertexAttribPointer(shader.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer.texture_coords);
    gl.vertexAttribPointer(shader.textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);

    // Bind the normals buffer to the shader attribute.

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer.vertex_normals);
    gl.vertexAttribPointer(shader.vertexNormalAttribute, 3, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.uniform1i(gl.getUniformLocation(shader, "uSampler"), 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer.vertex_indices);
    glUtils.setMatrixUniforms(gl, context, shader);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    glUtils.mvPopMatrix(context);
};

Dungeon.draw_cubes = function (gl, context, buffers, texture, shader, lightmap, player) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Establish the perspective with which we want to view the
    // scene. Our field of view is 45 degrees, with a width/height
    // ratio of 640:480, and we only want to see objects between 0.1 units
    // and 100 units away from the camera.

    gl.useProgram(shader);
    context.perspectiveMatrix = mat4.perspective(110, 1.0, 0.1, 100.0);

    // Set the drawing position to the "identity" point, which is
    // the center of the scene.
    context.mvMatrix = mat4.identity();

    // Save the current matrix
    glUtils.mvPushMatrix(context);

    var subdelta, tmpvec = vec3.create();
    if(player.turnTime > 0) {
        subdelta = player.dirDelta*(player.turnTime/player.turnSpeed);
        player.turnTime -= 1;
        mat4.rotate(context.mvMatrix, glUtils.radians(player.direction-subdelta)*45, context.yaxis);
        console.log("turn");
    } else {
        player.dirDelta = 0;
        mat4.rotate(context.mvMatrix, glUtils.radians(player.direction*45), context.yaxis);
    }
    // translate accordingly
    if(player.moveTime > 0) {
        subdelta = vec3.create();
        vec3.scale(player.posDelta, -player.moveTime/player.moveSpeed, subdelta);
        //player.position = player.postion.add(subdelta);
        player.moveTime -= 1;
        mat4.translate(context.mvMatrix, vec3.scale(vec3.add(subdelta, player.position), -1));
    } else {
        player.posDelta = vec3.create([0,0,0]);
        mat4.translate(context.mvMatrix, vec3.scale(player.position, -1, tmpvec));
    }


    // Draw the cube by binding the array buffer to the cube's vertices
    // array, setting attributes, and pushing it to GL.
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertices);
    gl.vertexAttribPointer(shader.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.world_positions);
    gl.vertexAttribPointer(shader.worldPositionAttribute, 3, gl.FLOAT, false, 0, 0);

    // Set the texture coordinates attribute for the vertices.

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.texture_coords);
    gl.vertexAttribPointer(shader.textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);

    // Bind the normals buffer to the shader attribute.

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertex_normals);
    gl.vertexAttribPointer(shader.vertexNormalAttribute, 3, gl.FLOAT, false, 0, 0);

    // Specify the texture to map onto the faces.

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.uniform1i(gl.getUniformLocation(shader, "uSampler"), 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, lightmap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.uniform1i(gl.getUniformLocation(shader, "uSamplerLightmap"), 1);


    // Draw the cube.

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.vertex_indices);

    // mvTranslate([x*2, 0.0, y*2]);
    //setMatrixUniforms();
    //gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
    glUtils.setMatrixUniforms(gl, context, shader);

    gl.drawElements(gl.TRIANGLES, 72*buffers.n_walls, gl.UNSIGNED_SHORT, 0);
    glUtils.mvPopMatrix(context);
}

var Dungeon = Dungeon || {};

Dungeon.GLContext = function () {
    this.mvMatrix = null;
    this.mvMatrixStack = [];
    this.perspectiveMatrix = null;

    this.xaxis = vec3.create([1, 0, 0]);
    this.yaxis = vec3.create([0, 1, 0]);
    this.zaxis = vec3.create([0, 0, 1]);
};

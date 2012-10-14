var Dungeon = Dungeon || {};

Dungeon.GLContext = function () {
    this.mvMatrix = null;
    this.mvMatrixStack = [];
    this.perspectiveMatrix = null;
};

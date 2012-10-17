var Dungeon = Dungeon || {};

Dungeon.GLContext = function () {
    this.mvMatrix = null;
    this.mvMatrixStack = [];
    this.perspectiveMatrix = null;

    this.xaxis = vec3.create([1, 0, 0]);
    this.yaxis = vec3.create([0, 1, 0]);
    this.zaxis = vec3.create([0, 0, 1]);
};

Dungeon.GLContext.prototype.push_matrix = function (m) {
    if (!!m) {
        this.mvMatrixStack.push(m.subarray(0));
        this.mvMatrix = m.subarray(0);
    } else {
        this.mvMatrixStack.push(this.mvMatrix.subarray(0));
    }
};

Dungeon.GLContext.prototype.pop_matrix = function () {
    if (!this.mvMatrixStack.length) {
        throw("Can't pop from an empty matrix stack.");
    }
    this.mvMatrix = this.mvMatrixStack.pop();
    return this.mvMatrix;
};

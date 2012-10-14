var Dungeon = Dungeon || {};

Dungeon.load_map = function (filename, callback) {
    var map_img = new Image();   // Create new img element
    map_img.src = filename; // Set source path
    map_img.onload = function() {
        var buffer = document.createElement('canvas');
        buffer.width = map_img.width;
        buffer.height = map_img.height;
        var ctx = buffer.getContext('2d');
        ctx.drawImage(map_img, 0, 0);
        var imgd = ctx.getImageData(0, 0, buffer.width, buffer.height);
        var mapdata = imgd.data;
        callback(mapdata);
    };
};

Dungeon.getMapTile = function (mapdata, x, y, z) {
    return mapdata[4*(32*4*y+32*z+x)+3];
};

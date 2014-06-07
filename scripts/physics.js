var d3 = require('d3');

var size = [100, 100]
    , forceChild = d3.layout.force()
        .stop()
        .size(size)
        .friction(.75)
        .gravity(0)
        .charge(function(d) { return -d.size * .064; })
        .on("tick", tick)
        .nodes([])
    ;

function tick() {
    if (forceChild.nodes()) {
        forceChild.nodes()
            .forEach(cluster(0.025));
    }
    forceChild.resume();
}

function cluster(alpha) {

    return function(d) {
        if (!d.parent || !d.visible)
            return;

        var node = d.parent
            , l
            , r
            , x
            , y
            ;

        if (node == d) return;

        x = d.x - node.x;
        y = d.y - node.y;
        l = Math.sqrt(x * x + y * y);
        r = +d.size * .064;
        if (l != r) {
            l = (l - r) / (l || 1) * (alpha || 1);
            x *= l;
            y *= l;

            d.x -= x;
            d.y -= y;
        }
    };
}

module.exports = forceChild;


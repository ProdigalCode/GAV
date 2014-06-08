var d3 = require('../node_modules/d3/d3.min');

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

        if (node === d) return;

        !d.alive && d.opacity > 0 && (d.opacity -= .3);
        d.opacity = d.opacity > 0 ? d.opacity : 0;
        d.visible = !!d.opacity;
        if (!d.visible) {
            delete d.paths;
        }

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

        d.paths && d.paths.push({
            x : d.x,
            y : d.y
        });
        if (d.alive && r >= l) {
            d.alive = false;
            d.parent.visitors++;
            if(d.parent.links-- < 0)
                d.parent.links = 0;
        }
    };
}

module.exports = forceChild;


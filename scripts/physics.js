var d3 = require('../node_modules/d3/d3.min');

function cluster(alpha) {
    return function(d) {
        if (!d.parent || !d.visible) {
            return;
        }

        var node = d.parent
            , l
            , r
            , x
            , y
            ;

        if (node === d) {
            return;
        }

        if (!d.alive && d.opacity > 0) {
            d.opacity -= 0.75;
        }
        d.opacity = d.opacity > 0 ? d.opacity : 0;
        d.visible = !!d.opacity;
        if (!d.visible) {
            delete d.paths;
        }

        x = d.x - node.x;
        y = d.y - node.y;
        l = Math.sqrt(x * x + y * y);
        r = +d.size * 0.064;
        if (l != r) {
            l = (l - r) / (l || 1) * (alpha || 1);
            x *= l;
            y *= l;

            d.x -= x;
            d.y -= y;
        }

        if (d.paths) {
            d.paths.push({
                x : d.x,
                y : d.y
            });
        }
        if (d.alive && r >= l) {
            d.alive = false;
            d.parent.visitors++;
            if(d.parent.links-- < 0) {
                d.parent.links = 0;
            }
        }
    };
}

var size = [100, 100]
    , forceChild = d3.layout.force();

function tick() {
    if (forceChild.nodes()) {
        forceChild.nodes()
            .forEach(cluster(0.025));
    }
    forceChild.resume();
}

forceChild.stop()
    .size(size)
    .friction(0.75)
    .gravity(0)
    .charge(function(d) { return -d.size * 0.064; })
    .on('tick', tick)
    .nodes([])
    ;

module.exports = forceChild;


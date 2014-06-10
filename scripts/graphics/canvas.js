var d3 = require('../../node_modules/d3/d3.min');

var neonBallCache = d3.map({});

var render = {
    size : [500, 500]
};

var trackCanvas
    , trackCtx
    , bufCanvas
    , bufCtx
    ;

render.reset = function() {
    trackCanvas =
        trackCtx =
            bufCanvas =
                bufCtx = null;
};

function sortByColor(a, b) {
    return d3.ascending(b.color, a.color);
}

function sortByOpacity(a, b) {
    return d3.ascending(b.opacity, a.opacity);
}

/**
 * Draw tracks of particles
 * @param nodes
 * @param lastEvent
 * @returns {HTMLCanvasElement|null}
 */
function drawTrack(nodes) {
    if(!nodes || !nodes.length) {
        return null;
    }

    if (!trackCtx) {
        trackCanvas = document.createElement('canvas');
        trackCanvas.width = render.size[0];
        trackCanvas.height = render.size[1];

        trackCtx = trackCanvas.getContext('2d');
        trackCtx.lineJoin = 'round';
        trackCtx.lineWidth = 1;//(radius(nr(d)) / 4)  || 1;
    }

    trackCtx.save();

    trackCtx.globalCompositeOperation = 'destination-out';

    trackCtx.fillStyle = 'rgba(0, 0, 0, .2)';
    trackCtx.fillRect(0, 0, render.size[0], render.size[1]);

    trackCtx.globalCompositeOperation = 'source-over';

    var d, l = nodes.length, curColor, c = null;

    trackCtx.fillStyle = 'none';

    while(--l > -1) {
        d = nodes[l];

        curColor = d.color;
        if (!c || d.color.r != c.r || d.color.b != c.b || d.color.g != c.g) {
            c = curColor;
            trackCtx.strokeStyle = c.toString();
        }

        if (!d.paths) {
            continue;
        }

        trackCtx.beginPath();

        var rs = d.paths.slice(0).reverse()
            , p
            ;

        /*if (d.paths.length < 3)
            d.paths = [];*/

        if (d.paths.length > 3) {
            d.paths.splice(0, 5);
        }

        trackCtx.moveTo(Math.floor(d.x), Math.floor(d.y));
        for (p in rs) {
            if (!rs.hasOwnProperty(p)) {
                continue;
            }

            trackCtx.lineTo(
                Math.floor(rs[p].x),
                Math.floor(rs[p].y)
            );
        }
        trackCtx.stroke();
        if (d.parent) {
            d.paths.push({
                x : d.x,
                y : d.y
            });
        }
    }

    trackCtx.restore();
    return trackCanvas;
}

/**
 * Generate a neon ball
 * @param {Number} w width
 * @param {Number} h height
 * @param {Number} r red
 * @param {Number} g green
 * @param {Number} b blue
 * @param {Number} a alpha
 * @returns {HTMLCanvasElement}
 */
function generateNeonBall(w, h, r, g, b, a) {

    var tempCanvas = document.createElement('canvas');

    tempCanvas.width = w;
    tempCanvas.height = h;

    var imgCtx = tempCanvas.getContext('2d');
    var gradient = imgCtx.createRadialGradient( w/2, h/2, 0, w/2, h/2, w/2 );

    gradient.addColorStop( 0, 'rgba(255,255,255,' + a + ')' );
    gradient.addColorStop( 0.3, 'rgba(' + [r, g, b, a * 0.5] + ')' );
    gradient.addColorStop( 1, 'rgba(' + [r, g, b, 0] + ')' ); //0,0,64

    imgCtx.fillStyle = gradient;
    imgCtx.fillRect( 0, 0, w, h);

    return tempCanvas;
}

render.draw = function(nodes) {

    if (!bufCtx) {
        bufCanvas = document.createElement('canvas');

        bufCtx = bufCanvas.getContext('2d');
        bufCtx.globalCompositeOperation = 'lighter';

        bufCtx.textAlign = 'center';
    }

    if (bufCanvas.width !== render.size[0] || bufCanvas.height !== render.size[1]) {
        bufCanvas.width = render.size[0];
        bufCanvas.height = render.size[1];
    }

    var  cn
        , l
        , i
        , img
        , d
        , c
        , x
        , y
        , s
        , currentCache
        , tracksImg
        ;

    bufCtx.save();
    bufCtx.clearRect(0, 0, render.size[0], render.size[1]);

    cn = (nodes || [])
        .sort(sortByOpacity)
        .sort(sortByColor);

    tracksImg = drawTrack(cn);
    if (tracksImg) {
        bufCtx.drawImage(tracksImg, 0, 0, render.size[0], render.size[1]);
    }

    /*bufCtx.translate(lastEvent.translate[0], lastEvent.translate[1]);
    bufCtx.scale(lastEvent.scale, lastEvent.scale);*/

    bufCtx.globalCompositeOperation = 'source-over';

    cn = cn || (nodes || [])
        .sort(sortByOpacity)
        .sort(sortByColor);

    currentCache = neonBallCache;

    /*if (render.setting.compositeOperation
        && bufCtx.globalCompositeOperation != render.setting.compositeOperation)
        bufCtx.globalCompositeOperation = render.setting.compositeOperation;*/

    l = cn.length;
    c = null;
    i = 100;

    bufCtx.strokeStyle = 'none';
    bufCtx.globalAlpha = i * 0.01;

    while(--l > -1) {
        d = cn[l];

        if (i != d.opacity) {
            i = d.opacity;
            bufCtx.globalAlpha = i * 0.01;
        }

        if (!c || d.color.r != c.r || d.color.b != c.b || d.color.g != c.g) {
            c = d.color;

            bufCtx.strokeStyle = c.toString();
            img = currentCache.get(bufCtx.strokeStyle);
            if (!img) {
                img = generateNeonBall(64, 64, c.r, c.g, c.b, 1);
                currentCache.set(bufCtx.strokeStyle, img);
            }
        }

        x = Math.floor(d.x);
        y = Math.floor(d.y);
        s = Math.sqrt(+d.size) * 8;

        bufCtx.drawImage(img, x - s / 2, y - s / 2, s, s);
    }

    bufCtx.restore();

    return bufCanvas;
};


render.resize = function(arg) {
    if(!arguments.length) {
        return render.size;
    }
    render.size = arg;

    if (bufCanvas) {
        bufCanvas.width = arg[0];
        bufCanvas.height = arg[1];
    }

    if (trackCanvas) {
        trackCanvas.width = arg[0];
        trackCanvas.height = arg[1];
    }
};

module.exports = render;
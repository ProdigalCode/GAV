var d3 = require('../node_modules/d3/d3.min');
var delay = 1000;

function asyncForEach(items, fn, time) {
    if (!(items instanceof Array)) {
        return;
    }

    var workArr = items.concat();

    (function loop() {
        if (workArr.length > 0) {
            fn(workArr.pop(), workArr);
            setTimeout(loop, time || 10);
        }
    })();
}

var pause
    , stop
    , worker
    , tempTimeout
    ;

function killWorker() {
    if (worker) {
        clearInterval(worker);
        worker = null;
    }

    if (tempTimeout) {
        clearTimeout(tempTimeout);
        tempTimeout = null;
    }
}

var processor = {
    killWorker : killWorker
};

var dispatch = d3.dispatch('start', 'stop', 'finish', 'tick', 'calc', 'error', 'filter', 'calcrightbound');



var boundRange = [0, 0];
processor.bounds = function(bounds) {
    if (!arguments.length || !(bounds instanceof Array)) {
        return boundRange;
    }
    boundRange = bounds;
    return processor;
};

function loop() {

    if (tempTimeout) {
        clearTimeout(tempTimeout);
        tempTimeout = null;
    }

    if (stop) {
        killWorker();
        return;
    }

    if (pause) {
        return;
    }

    var dl, dr;

    dl = processor.leftBound = boundRange[0];
    dispatch.calcrightbound.call(processor, dl);
    dr = boundRange[0] = processor.leftBound;

    dispatch.filter.call(processor, dl, dr);

    var visTurn = processor.items;

    if (visTurn && visTurn.length) {
        asyncForEach(visTurn, dispatch.calc, delay / (visTurn.length || delay));
    }

    dispatch.tick.call(processor, visTurn, dl, dr);

    if (dl > boundRange[1]) {
        killWorker();
        dispatch.finish.call(processor, dl, dr);
    } else {
        if (!visTurn || !visTurn.length) {
            tempTimeout = setTimeout(loop, 1);
        }
    }
}

processor.start = function() {
    stop = pause = false;
    killWorker();

    dispatch.start.call(processor);

    worker = setInterval(loop, delay);
    return processor;
};

processor.pause = function() {
    pause = true;
    return processor;
};

processor.stop = function() {
    stop = true;
    killWorker();
    dispatch.stop.call(processor);
    return processor;
};

processor.resume = function() {
    pause = false;
    return processor;
};

/**
 * Check that process is paused
 * @returns {boolean}
 */
processor.IsPaused = function() {
    return worker && pause && !stop;
};

/**
 * Check that process is running
 * @returns {boolean}
 */
processor.IsRun = function() {
    return !!worker;
};

d3.rebind(processor, dispatch, 'on');

module.exports = processor;

var d3 = require('d3')
    , gaapi = require('./gaapi')
    , processor = require('./processor')
    , physics = require('./physics')
    , graphic = require('./graphics/canvas')
    , prbr = require('./prbr')
    , getData = require('./gendata')
    ;

function log(label, data) {
    if (arguments.length < 2) {
        console.log(label);
    }
    else {
        console.log(label, data);
    }
}


function logError(error) {
    log('error', error);
}

var ui = {
        accounts : d3.select('#accounts')
        , webProperties : d3.select('#webProperties')
        , profiles : d3.select('#profiles')
        , from : d3.select('#from')
        , to : d3.select('#to')
        , buttons : {
            run : d3.select('#run')
        }
        , chRealtime : d3.select('#realtime')
    }
    , uiSelected = {
        account : null,
        webProperty : null,
        profile : null
    }
    , size = [
        window.innerWidth,
        window.innerHeight
    ]
    ;

function keyItem(d) {
    return d.id;
}

function handle(sel_prop, ui_prop, css_class, click_fn) {
    return function(err, data) {
        if(err) {
            uiSelected[sel_prop] = null;
            logError(err);
            return;
        }

        var prop = uiSelected[sel_prop] = data[0];
        var items = ui[ui_prop].selectAll(css_class)
            .data(data, keyItem);
        items.enter()
            .append('option')
            .attr('class', css_class.substr(1))
            .text(function(d) {
                return d.name;
            })
            .on('click', click_fn)
            .each(function(d) {
                if (prop && (prop.id === d.id) && (d3.select(this).attr('selected', 'selected'))) {
                    click_fn.call(ui[ui_prop].node(), prop);
                }
            });
        items.exit().remove();
        ui[ui_prop].on('change', click_fn);
    };
}

function clickTopMenu(click_fn) {
    return function() {
        if (click_fn && this.selectedIndex) {
            click_fn(this[this.selectedIndex].__data__);
        }
    };
}

var provider;

function clickProfile(d) {
    uiSelected.profile = d;
}

function clickWebProperty(d) {
    uiSelected.webProperty = d;
    if (uiSelected.account && uiSelected.webProperty) {
        provider.profiles.list(
            uiSelected.account.id,
            uiSelected.webProperty.id,
            handle(
                'profile',
                'profiles',
                '.profile',
                clickTopMenu(clickProfile)
            )
        );
    }
}

function clickAccount(d) {
    uiSelected.account = d;
    if (uiSelected.account) {
        provider.webproperties.list(
            uiSelected.account.id,
            handle(
                'webProperty',
                'webProperties',
                '.webProperty',
                clickTopMenu(clickWebProperty)
            )
        );
    }
}


function handleSignIn(err) {
    if (err) {
        logError(err);
        return;
    }

    provider.accounts.list(handle(
        'account',
        'accounts',
        '.account',
        clickTopMenu(clickAccount)
    ));
}

function singIn(prd) {
    provider = prd;
    if (!provider) {
        return;
    }
    provider.on('signIn', handleSignIn);
    provider.signIn();
    resize();
}

var state = {
    hashFrom : d3.map({})
    , hashTo : d3.map({})
    , sizes :  d3.scale.linear().range([1, 40]).domain([0, 1])
    , colors : d3.scale.category20()
};

function ofSize() {
    return {
        valueOf : function() {
            return 16;//state.sizes(d.weight);
        }
    };
}

function initNode(d) {
    d.fixed = true;
    state.sizes.domain([state.sizes.domain()[0], state.sizes.domain()[1] < d.weight ? d.weight : state.sizes.domain()[1]]);
    d.size = ofSize(d);
    d.color = d3.rgb(state.colors(d.to.pagePath.name));
    if (!state.hashFrom.has(d.from.socialNetwork.name)) {
        d.from.socialNetwork.x = 0;
        d.from.socialNetwork.y = Math.random() * size[1];
        state.hashFrom.set(d.from.socialNetwork.name, d.from.socialNetwork);
    }
    if (!state.hashTo.has(d.to.pagePath.name)) {
        d.to.pagePath.x = size[0];
        d.to.pagePath.y = Math.random() * size[1];
        state.hashTo.set(d.to.pagePath.name, d.to.pagePath);
    }
}

function keyHash(d) {
    return d.key;
}

function liXl(li) {
    return {
        valueOf : function() {
            var rect = li.getBoundingClientRect();
            return rect.right;
        }
    };
}

function liXr(li) {
    return {
        valueOf : function() {
            var rect = li.getBoundingClientRect();
            return rect.left - 15;
        }
    };
}

function liY(li) {
    return {
        valueOf : function() {
            //li.offsetTop + li.parentNode.offsetTop + li
            var rect = li.getBoundingClientRect();
            return rect.top + rect.height / 2;
        }
    };
}

function getVisitors(d) {
    d = d.key ? d.value : d;
    return d.visitors || 0;
}

function getSpanColor(d) {
    return state.colors(d.value.name);
}

function getBolderColor(d) {
    return d3.rgb(getSpanColor(d)).brighter().brighter();
}

var redrawCounters = function(ui) {
    ui.selectAll('li>span')
        .datum(function() {
            return this.parentNode.__data__;
        })
        .style('background', getSpanColor)
        .style('bolder-color', getBolderColor)
        .text(getVisitors);
};

function updatePadding(ui) {
    var height = 0;
    ui.style('padding-top', 0);
    ui.selectAll('li').each(function() {
        height += this.getBoundingClientRect().height;
    });

    var uih = ui.node().getBoundingClientRect().height;

    var padding = Math.max(0, (uih - height) / 2);
    ui.style('padding-top', padding + 'px');
    ui.style('height', (size[1] - 185 - padding) + 'px');
}

function updateParent(ui, hash) {
    var lis = ui.selectAll('li')
        .data(hash.entries(), keyHash);

    lis.enter().append('li')
        .attr('title', keyHash)
        .each(function(d) {
            d = d.value;
            d.x = hash === state.hashFrom ? liXl(this) : liXr(this);
            d.y = liY(this);
            d3.select(this).html(hash === state.hashFrom ? (d.name + ' <span>' + getVisitors(d) + '</span>') : ('<span>' + getVisitors(d) + '</span> ' + d.name));
        });
    updatePadding(ui);
}

var temp = 3600 * 1000;

function refresh(data) {
    if (!data || !data.length) {
        return;
    }

    var lb = !state.needsRefresh && processor.bounds()[0] ? processor.bounds()[0] : data[0].date
        , rb = data.length > 1 ? data.slice(-1).pop().date : lb
        ;

    state.data = !state.needsRefresh && state.data ? state.data : [];

    data.forEach(initNode);

    physics.size(size);

    state.data = state.data.concat(data);
    state.needsRefresh = false;

    processor.bounds([lb - (ui.chRealtime && ui.chRealtime.node().checked ? temp : 0), rb]);

    if (!processor.IsRun()) {
        processor.start();
    }

    progress.data(d3.nest()
        .key(function (d) {
            return +d.date;
        })
        .rollup(function (leaves) {
            return {
                count : d3.sum(leaves, function(d) {
                    return d.amount;
                }),
                sum : d3.sum(leaves, function (d) {
                    return d.weight;
                })
            };
        })
        .entries(state.data)
    );
}


var reqFormat = d3.time.format('%Y-%m-%d')
    ;

function handleData(err, data) {
    if (err) {
        logError(err);
        return;
    }

    document.getElementById('spinner').style['display'] = 'none';
    refresh(data);
    if (ui.chRealtime.node().checked) {
        setTimeout(runClick, 5000);
    }
}
function runClick() {
    document.getElementById('spinner').style['display'] = '';
    if (!uiSelected.profile) {
        return;
    }

    var now = Date.now()
        , old = now - (14 * 24 * 60 * 60 * 100)
        ;

    if (global.location.search === '?demo' && !state.demo) {
        handleData(null, getData(200));
    }
    else {
        if (!ui.chRealtime.node().checked) {
            provider.reports.social(uiSelected.profile.id, reqFormat(new Date(old)), reqFormat(new Date(now)), handleData);
        } else {
            provider.reports.social_realtime(uiSelected.profile.id, handleData);
        }
    }
}



ui.buttons.run.on('click', function() {

    state.needsRefresh = true;
    state.hashFrom = d3.map({});
    state.hashTo = d3.map({});
    state.colors = d3.scale.category20();
    progress.data([]);
    processor.bounds([0, 0]);
    physics.nodes([]);

    runClick();
});

var rqId;
function filterChild(d) {
    return d.visible && d.parent && d.parent.y > 0;
}
function rending() {

    rqId = global.requestAnimationFrame(rending, undefined);

    var n = physics.nodes().filter(filterChild);

    if (!ctx || valid || !n || !n.length) {
        return;
    }

    valid = true;

    ctx.save();
    ctx.clearRect(0, 0, size[0], size[1]);

    ctx.drawImage(graphic.draw(n), 0, 0);
    ctx.restore();

    valid = false;
}

processor.on('start', function() {
    if (!rqId) {
        rending();
    }
    resize();
});

processor.on('stop', function() {

});

processor.on('finish', function() {

});

processor.on('tick', function(items, l, r) {
    redrawCounters(ui.from, state.hashFrom);
    redrawCounters(ui.to, state.hashTo);
    progress.inc(l, r);
});

function getVisible(d) {
    return !!d.opacity;
}

processor.on('calc', function (d) {
    if (!processor.IsRun()) {
        return;
    }

    var p = d.from.socialNetwork;

    if (d.fixed) {
        d.x = +p.x;
        d.y = +p.y;
        d.alive = true;
        d.opacity = 100;
        p.visitors = p.visitors || 0;
        p.visitors++;
        d.paths = [];
    }

    d.fixed = false;

    d.parent = d.to.pagePath;
    d.parent.visitors = d.parent.visitors || 0;
    d.parent.links = d.parent.links || 0;
    d.parent.links++;

    d.visible = getVisible(d);

    if (physics) {
        physics.nodes(state.data.filter(filterChild)).start();
    }
});

processor.on('calcrightbound', function() {
    processor.leftBound += temp;
});

processor.on('filter', function(l, r) {
    processor.items = state.data.filter(function(d) {
        return d.date >= l && d.date < r;
    });
});

/**
 * rAF & cAF
 */
(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame =
            window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = function(callback/*, element*/) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
                timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
    }

    if (!window.cancelAnimationFrame) {
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
    }
})();

var valid = false
    , canvas = d3.select('#canvas').append('canvas')
        .text('This browser don not support element type of Canvas.')
        .attr('width', size[0])
        .attr('height', size[1])
        //.call(zoom)
        //.on('mousemove.tooltip', moveMouse)
        .node()
    , ctx = canvas.getContext('2d')
    ;

function resize() {
    size = [
        window.innerWidth,
        window.innerHeight
    ];

    canvas.width = size[0];
    canvas.height = size[1];

    graphic.size = size;
    physics.size(size);

    progress.size(size[0], 100);

    // ui.from.style('height', (size[1] - 185) + 'px');
    // ui.to.style('height', (size[1] - 185) + 'px');

    updateParent(ui.from, state.hashFrom);
    updateParent(ui.to, state.hashTo);
}

d3.select(window).on('resize', resize);

var progress = prbr(d3.select('#barcont'), 0, 0)
    .on('getAxisXValue', function (d) {
        return +d.key;
    })
    .on('getAxisYValue', function (d) {
        return +d.values.sum;
    })
    .on('getAxisYEvent', function (d) {
        return +d.values.count;
    })
    .maxLabelValue('Максимьное кол-во визитеров день: ')
    .maxLabelEvent('Максимьное кол-во времени день: ');

gaapi(singIn);


var explosion = new Image();
explosion.src = 'images/explosion.gif';

window.onhashchange = function () {
    var number = parseInt(window.location.hash.slice(1));
    updateParent = function(ui, hash) {
        if (hash === state.hashFrom) {
            ui.selectAll('li').html('<img src="images/gun.png" style="width:30;height:30px;margin-top: 15px">');
        } else {
            ui.selectAll('li').each(function(d) {
                d3.select(this).html('<img src="images/screem.png" style="width:30;height:30px;margin:0;margin-top: 10px;">' + d.value.name );
            });
        }
    };
    redrawCounters = function(ui, hash) {
        if (hash === state.hashTo) {
            ui.selectAll('li')
                .datum(function() {
                    return this.__data__;
                })
                .style('opacity', function(d) {
                    var opacity = 1 - (getVisitors(d) / number);

                    if (opacity < 0.1 && !this.done) {
                        this.done = true;
                        this.innerHTML = '<img src="images/explosion.gif" style="width:30;height:30px;">';
                        var that = this;
                        setTimeout(function(){
                            that.parentNode.removeChild(that);
                        }, 5000);
                        return 1;
                    } else {
                        return opacity;
                    }
                    
                });
        }
    };
    updateParent(ui.from, state.hashFrom);
    updateParent(ui.to, state.hashTo);
};

(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
    (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
    m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','//www.google-analytics.com/analytics.js','ga');

ga('create', 'UA-28343295-13', 'artzub.com');
ga('send', 'pageview');

function loop() {
    ga('set', 'page', '?' + Math.random()  * 20);
    ga('send', 'pageview');
    setTimeout(loop, 5000);
}


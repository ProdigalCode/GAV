var d3 = require('d3')
    , gaapi = require('./gaapi')
    , processor = require('./processor')
    , physics = require('./physics')
    , graphic = require('./graphic')
    , prbr = require('./prbr')
    ;

function log(label, data) {
    if (arguments.length < 2)
        console.log(label);
    else
        console.log(label, data);
}

function logError(error) {
    log("error", error);
}

var ui = {
        accounts : d3.select('#accounts'),
        webProperties : d3.select("#webProperties"),
        profiles : d3.select("#profiles"),
        from : d3.select("#from"),
        to : d3.select("#to"),
        buttons : {
            run : d3.select("#run")
        }
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

var provider;

function singIn(prd) {
    provider = prd;
    if (!provider)
        return;
    provider.on('signIn', handleSignIn);
    //provider.signIn()
    ui.buttons.run.on('click')();
    resize();
}

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
            .append('li')
            .attr('class', css_class.substr(1))
            .text(function(d) {
                return d.name;
            })
            .on('click', click_fn)
            .each(function(d) {
                prop
                && prop.id == d.id
                && click_fn.call(this, prop);
            });
        items.exit().remove();
    }
}

function clickTopMenu(click_fn) {
    return function(d) {
        d3.select(this.parentNode)
            .selectAll('li')
            .classed('uiSelected', false);
        d3.select(this.parentNode.parentNode)
            .select('span').text(d.name);
        d3.select(this)
            .classed('uiSelected', true);

        click_fn &&
        click_fn(d);
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

function clickAccount(d) {
    uiSelected.account = d;
    uiSelected.account &&
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

function clickWebProperty(d) {
    uiSelected.webProperty = d;
    uiSelected.account && uiSelected.webProperty &&
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

var state = {
    hashFrom : d3.map({})
    , hashTo : d3.map({})
    , sizes :  d3.scale.linear().range([1, 40]).domain([0, 1])
    , colors : d3.scale.category20()
};

function ofSize(d) {
    return {
        valueOf : function() {
            return 16;//state.sizes(d.weight);
        }
    }
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
            return (rect.top + rect.height) / 2 + 55;
        }
    };
}

function sortFrom(a, b) {
    return d3.ascending(b.visitors, a.visitors);
}

function sortTo(b, a) {
    return d3.ascending(b.links, a.links);
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

function sortFun(a, b) {
    return d3.ascending(a.value.visitors, b.value.visitors);
}

function updateParent(ui, hash) {
    var lis = ui.selectAll('li')
        .data(hash.entries(), keyHash);

    lis.enter().append('li')
        .each(function(d) {
            d = d.value;
            d.x = hash === state.hashFrom ? liXl(this) : liXr(this);
            d.y = liY(this);
            d3.select(this).html(hash === state.hashFrom ? (d.name + ' <span>' + getVisitors(d) + '</span>') : ('<span>' + getVisitors(d) + '</span> ' + d.name));
        });

    ui.selectAll('li>span')
        .datum(function() {
            return this.parentNode.__data__;
        })
        .style('background', getSpanColor)
        .style('bolder-color', getBolderColor)
        .text(getVisitors);
}

function refresh(data) {
    if (!data || !data.length)
        return;

    var lb = processor.bounds()[0] || data[0].date
        , rb = data.length > 1 ? data.slice(-1).pop().date : lb
        ;

    data.forEach(initNode);

    physics.size(size);

    state.data = state.data || [].concat(data);

    processor.bounds([lb, rb]);

    !processor.IsRun() && processor.start();

    progress.data(d3.nest()
        .key(function (d) {
            return d.date
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
        .entries(state.data));

}

ui.buttons.run.on('click', function() {
    provider.reports.social(/*uiSelected.profile.id*/'111', '2014-03-01', '2014-03-30', function(err, data) {
        if (err) {
            logError(err);
            return;
        }

        refresh(data);
    });
});

function clickProfile(d) {
    uiSelected.profile = d;
}

processor.on('start', function() {
    if (!rqId) rending();
    resize();
});

processor.on('stop', function() {

});

processor.on('finish', function() {

});

processor.on('tick', function(items, l, r) {
    updateParent(ui.from, state.hashFrom);
    updateParent(ui.to, state.hashTo);
    progress.inc(l, r);
});

processor.on('calc', function (d) {
    if (!processor.IsRun())
        return;

    p = d.from.socialNetwork;

    if (d.fixed) {
        d.x = +p.x;
        d.y = +p.y;
        d.alive = true;
        d.opacity = 100;
        p.visitors = p.visitors || 0;
        p.visitors++;
    }

    d.fixed = false;

    d.parent = d.to.pagePath;
    d.parent.visitors = d.parent.visitors || 0;
    d.parent.links = d.parent.links || 0;
    d.parent.links++;

    d.visible = getVisible(d);

    physics && physics.nodes(state.data.filter(filterChild)).start();
});

var temp = 120;
processor.on('calcrightbound', function(l) {
    processor.leftBound += temp;
});

processor.on('filter', function(l, r) {
    processor.items = state.data.filter(function(d) {
        return d.date >= l && d.date < r;
    });
});

function getVisible(d) {
    return !!d.opacity;
}

function filterChild(d) {
    return d.visible;
}

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

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback/*, element*/) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
                timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
})();

var valid = false
    , rqId
    , canvas = d3.select("#canvas").append('canvas')
        .text("This browser don't support element type of Canvas.")
        .attr("width", size[0])
        .attr("height", size[1])
        //.call(zoom)
        //.on('mousemove.tooltip', moveMouse)
        .node()
    , ctx = canvas.getContext('2d')
    ;

function rending() {

    rqId = requestAnimationFrame(rending, undefined);

    var n = physics.nodes();

    if (!ctx || valid || !n || !n.length)
        return;

    valid = true;

    ctx.save();
    ctx.clearRect(0, 0, size[0], size[1]);

    ctx.drawImage(graphic.draw(n), 0, 0);
    ctx.restore();

    valid = false;
}

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

    ui.from.style('height', (size[1] - 185) + 'px');
    ui.to.style('height', (size[1] - 185) + 'px');

    updateParent(ui.from, state.hashFrom);
    updateParent(ui.to, state.hashTo);
}

d3.select(window).on('resize', resize);

var progress = prbr(d3.select('#barcont'), 0, 0)
    .on('getAxisXValue', function (d) {
        return d.key;
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

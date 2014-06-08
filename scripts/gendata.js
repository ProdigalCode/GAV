function Node(that, name, d) {
    that.name = name;
    that.nodeValue = d;
}

function FromNode(name, d) {
    Node(this, name, d);
}

function ToNode(name, d) {
    Node(this, name, d);
}

function genData(len) {
    var res = [];
    var from = {};
    var to = {};

    var ft = new FromNode('test', 'test');

    var pages = [
        new ToNode('/our_best_product', '/our_best_product'),
        new ToNode('/contacts', '/contacts'),
        new ToNode('/about', '/about'),
        new ToNode('/home', '/home'),
        new ToNode('/money', '/money'),
        new ToNode('/IloveDataViz', '/IloveDataViz'),
        new ToNode('/aboutLife', '/aboutLife'),
        new ToNode('/Hackphone', '/Hackphone'),
        new ToNode('/GoogleVpered', '/GoogleVpered'),
        new ToNode('/our_best_product1', '/our_best_product'),
        new ToNode('/contacts1', '/contacts'),
        new ToNode('/about1', '/about'),
        new ToNode('/home1', '/home'),
        new ToNode('/money1', '/money'),
        new ToNode('/IloveDataViz1', '/IloveDataViz'),
        new ToNode('/aboutLife1', '/aboutLife'),
        new ToNode('/Hackphone1', '/Hackphone'),
        new ToNode('/GoogleVpered1', '/GoogleVpered'),
        new ToNode('/our_best_product12', '/our_best_product'),
        new ToNode('/contacts12', '/contacts'),
        new ToNode('/about12', '/about'),
        new ToNode('/home12', '/home'),
        new ToNode('/money12', '/money'),
        new ToNode('/IloveDataViz12', '/IloveDataViz'),
        new ToNode('/aboutLife12', '/aboutLife'),
        new ToNode('/Hackphone12', '/Hackphone'),
        new ToNode('/GoogleVpered12', '/GoogleVpered'),
        new ToNode('/our_best_product121', '/our_best_product'),
        new ToNode('/contacts112', '/contacts'),
        new ToNode('/about112', '/about'),
        new ToNode('/home112', '/home'),
        new ToNode('/money112', '/money'),
        new ToNode('/IloveDataViz112', '/IloveDataViz'),
        new ToNode('/aboutLife112', '/aboutLife'),
        new ToNode('/Hackphone112', '/Hackphone'),
        new ToNode('/GoogleVpered112', '/GoogleVpered')
    ];

    var froms = [
        new FromNode('Google+', 'Google+'),
        new FromNode('Facebook', 'Facebook'),
        new FromNode('Twitter', 'Twitter'),
        new FromNode('VKontakte', 'VKontakte'),
        new FromNode('Vine', 'Vine'),
        new FromNode('Youtube', 'Youtube')

    ];

    var lp = pages.length;
    var lf = froms.length;

    var startTime = +new Date('2014-01-01 00:00');
    var step = 3 * 60 * 60 * 1000;

    for (var i = 0; i < len; i++) {

        var time = (startTime += step);
        var counts = Math.floor(Math.random() * ((i < 50) || (i > 150) ? 10 : 80 ));

        for (var j = 0; j < (counts || 1); j++ )
            res.push({
                date : time /*+ Math.floor(kof * i)*/
                , from : {
                    fullReferrer : ft
                    , sourceMedium  : ft
                    , browser  : ft
                    , country  : ft
                    , socialNetwork  : froms[Math.floor(Math.random() * lf)]
                }
                , to : {
                    pagePath : pages[Math.floor(Math.random() * lp)]
                }
                , amount : 1
                , weight : Math.random() * 2000
            });
    }
    return res;
}

module.exports = genData;
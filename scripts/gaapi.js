/**
 * Function makes a node
 * @param that
 * @param name
 * @param d
 * @returns {{type: *, name: *, nodeValue: *}}
 * @constructor
 */
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

function IProvider() {
    return {
        signIn : function() {

        }
        , signOut : function () {

        }
        , getAccount : function () {

        }
        , getProperty : function () {

        }
        , getView : function () {

        }
        , parse : function() {
            return [];
        }
    }
}


var CLIENT_ID = '125867639228-55svp06ntafe8b2uf27m7llvk2ernk3s.apps.googleusercontent.com'
    , SCOPES = 'https://www.googleapis.com/auth/analytics.readonly'
    , MaxResults = 1000000000
    ;

module.exports = function(callback) {
    var script = document.createElement('script');
    window.LOADERAPI = handleClientLoad;
    script.src = "https://apis.google.com/js/client.js?onload=LOADERAPI";
    script.onerror = console.log.bind(console, 'error');
    document.body.appendChild(script);

    function handleClientLoad() {
        callback && callback(new GAClient(CLIENT_ID));
    }
};

var GAClient = function(key) {
    GAClient.ClientId = key;
};

(function(proto) {
    var actions = {}
        ;

    function isFn(arg) {
        return arg && typeof arg === 'function';
    }

    function dispatch(action) {
        if (action == '')
            return;
        var act = action.toString().toLowerCase();
        isFn(actions[act]) &&
            actions[act].apply(GAClient, Array.prototype.slice.call(arguments, 1));
    }

    function error(msg) {
        return {
            message : msg
        };
    }

    function handle(action, prop) {
        return function(data) {
            var err = null;
            if (!data) {
                err = error('data not found');
            }
            else if (data.code) {
                err = {code: data.code, message: data.message};
            }
            else if (prop) {
                if (data[prop] && data[prop].length) {
                    data = data[prop];
                }
                else {
                    err = error('data not found');
                }
            }
            dispatch(action, err, data);
        }
    }

    function report(dim, profileId, datebegin, dateend, callback) {
        gapi.client.analytics.data.ga.get({
            ids: 'ga:' + profileId,
            'start-date': datebegin,
            'end-date': dateend,
            metrics: 'ga:visitors,ga:timeOnSite',
            dimensions: dim
        }).execute(callback);
    }

    proto.on = function(action, callback) {
        if (action == '')
            return;
        var act = action.toString().toLowerCase();

        if (arguments.length < 2)
            return actions[act];
        actions[act] = callback;
    };

    proto.signIn = function(key) {
        key = key || GAClient.ClientId;
        if (key.error) {
            localStorage.removeItem("ga-access_token");
            dispatch('signIn', key.error);
        }
        else if (key.access_token) {
            var now = Date.now();
            var msToAdd = (parseInt(key.expires_in) - 100) * 1000;
            at = {};
            at.expiration = now + msToAdd;
            at.access_token = key.access_token;
            localStorage.setItem("ga-access_token", at);
            dispatch('signIn', null);
        }
        else {
            at = localStorage.getItem("ga-access_token");

            gapi && gapi.auth.authorize({
                client_id: key,
                scope: SCOPES,
                immediate: at && at.expiration > Date.now()
            }, proto.signIn);
        }
    };

    proto.signOut = function() {
        localStorage.removeItem("ga-access_token");
        dispatch('signout');
    };

    proto.accounts = {
        list : function(callback) {
            var act = 'accounts.list';
            proto.on(act, callback);

            gapi.client.load('analytics', 'v3', function() {
                gapi.client.analytics
                    .management
                    .accounts
                    .list()
                    .execute(handle(act, 'items'));
            });
        }
    };

    proto.webproperties = {
        list : function(accountId, callback) {
            var act = 'webproperties.list';
            proto.on(act, callback);
            gapi.client.analytics
                .management
                .webproperties
                .list({'accountId': accountId})
                .execute(handle(act, 'items'));
        }
    };

    proto.profiles = {
        list : function(accountId, webPropertyId, callback) {
            var act = 'profiles.list';
            proto.on(act, callback);
            gapi.client.analytics
                .management
                .profiles
                .list({
                    accountId: accountId,
                    webPropertyId: webPropertyId
                }).execute(handle(act, 'items'));
        }
    };

    proto.reports = {
        social : function(profileId, datebegin, dateend, callback) {
            var act = 'reports.social';
            //proto.on(act, wrapperParser(parserSocial, callback));

            wrapperParser(parserSocial, callback)(null, require('./data'));
            /*report('ga:dateHour,ga:fullReferrer,ga:sourceMedium,ga:browser,ga:country,ga:socialNetwork,ga:pagePath',
                profileId,
                datebegin,
                dateend,
                handle(act)
            );*/
        },
        geo : function(datebegin, dateend, callback) {
            var act = 'reports.geo';
            proto.on(act, wrapperParser(parserSocial, callback));
            report('ga:dateHour,ga:fullReferrer,ga:country,ga:pagePath,ga:city,ga:latitude,ga:longitude',
                profileId,
                datebegin,
                dateend,
                handle(act)
            );
        }
    };

    function wrapperParser(parser, callback) {
        return function (err, data) {
            callback && callback(err, parser(data));
        }
    }

    function parserSocial(data) {
        if (!data || !data[0] || !(data = data[0].result) || !data.rows)
            return [];

        var rows = data.rows
            , l = rows.length
            , d
            , res = []
            , from = {}
            , to = {}
            ;

        var fr, sm, b, c, sn;

        while(--l > -1) {
            d = rows[l];
            fr = d[1];
            sm = d[2];
            b = d[3];
            c = d[4];
            sn = d[5];
            res.push({
                date : parseInt(d[0])
                , from : {
                    fullReferrer : from[fr] || (from[fr] = new FromNode(fr, fr))
                    , sourceMedium  : from[sm] || (from[sm] = new FromNode(sm, sm))
                    , browser  : from[b] || (from[b] = new FromNode(b, b))
                    , country  : from[c] || (from[c] = new FromNode(c, c))
                    , socialNetwork  : from[sn] || (from[sn] = new FromNode(sn, sn))
                }
                , to : {
                    pagePath : to[d[6]] || (to[d[6]] = new ToNode(d[6], d[6]))
                }
                , amount : parseInt(d[7])
                , weight : parseFloat(d[8])
            });
        }

        return res.reverse();
    }
})(GAClient.prototype);

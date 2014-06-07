var CLIENT_ID = '125867639228-55svp06ntafe8b2uf27m7llvk2ernk3s.apps.googleusercontent.com'
    , SCOPES = 'https://www.googleapis.com/auth/analytics.readonly'
    , MaxResults = 1000000000
    ;

module.exports = function(callback) {
    var script = document.createElement('script');
    script.src = "https://apis.google.com/js/client.js";
    script.onload = handleClientLoad;
    script.onerror = console.log.bind(console, 'error');
    document.body.appendChild(script);

    function handleClientLoad() {
        console.log(callback);
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
            proto.on(act, callback);
            report('ga:dateHour,ga:fullReferrer,ga:sourceMedium,ga:browser,ga:country,ga:socialNetwork,ga:pagePath',
                profileId,
                datebegin,
                dateend,
                handle(act)
            );
        },
        geo : function(datebegin, dateend, callback) {
            var act = 'reports.geo';
            proto.on(act, callback);
            report('ga:dateHour,ga:fullReferrer,ga:country,ga:pagePath,ga:city,ga:latitude,ga:longitude',
                profileId,
                datebegin,
                dateend,
                handle(act)
            );
        }
    }
})(GAClient.prototype);

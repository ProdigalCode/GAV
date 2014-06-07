(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var loader = require('./loader');
loader('google', function(client) {
    console.log('google is loaded', client);
});

},{"./loader":3}],2:[function(require,module,exports){
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

},{}],3:[function(require,module,exports){
var gaapi = require('./gaapi');

var loader = function(name, callback) {
    if (name === 'google') {
        gaapi(function() {
            callback();
        });
    }
};

module.exports = loader;
},{"./gaapi":2}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9sYXZydG9uL1Byb2plY3RzL0dBVi9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvaG9tZS9sYXZydG9uL1Byb2plY3RzL0dBVi9zY3JpcHRzL2Zha2VfZDZmZjU0ZDIuanMiLCIvaG9tZS9sYXZydG9uL1Byb2plY3RzL0dBVi9zY3JpcHRzL2dhYXBpLmpzIiwiL2hvbWUvbGF2cnRvbi9Qcm9qZWN0cy9HQVYvc2NyaXB0cy9sb2FkZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgbG9hZGVyID0gcmVxdWlyZSgnLi9sb2FkZXInKTtcbmxvYWRlcignZ29vZ2xlJywgZnVuY3Rpb24oY2xpZW50KSB7XG4gICAgY29uc29sZS5sb2coJ2dvb2dsZSBpcyBsb2FkZWQnLCBjbGllbnQpO1xufSk7XG4iLCJ2YXIgQ0xJRU5UX0lEID0gJzEyNTg2NzYzOTIyOC01NXN2cDA2bnRhZmU4YjJ1ZjI3bTdsbHZrMmVybmszcy5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbSdcclxuICAgICwgU0NPUEVTID0gJ2h0dHBzOi8vd3d3Lmdvb2dsZWFwaXMuY29tL2F1dGgvYW5hbHl0aWNzLnJlYWRvbmx5J1xyXG4gICAgLCBNYXhSZXN1bHRzID0gMTAwMDAwMDAwMFxyXG4gICAgO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihjYWxsYmFjaykge1xyXG4gICAgdmFyIHNjcmlwdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xyXG4gICAgc2NyaXB0LnNyYyA9IFwiaHR0cHM6Ly9hcGlzLmdvb2dsZS5jb20vanMvY2xpZW50LmpzXCI7XHJcbiAgICBzY3JpcHQub25sb2FkID0gaGFuZGxlQ2xpZW50TG9hZDtcclxuICAgIHNjcmlwdC5vbmVycm9yID0gY29uc29sZS5sb2cuYmluZChjb25zb2xlLCAnZXJyb3InKTtcclxuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoc2NyaXB0KTtcclxuXHJcbiAgICBmdW5jdGlvbiBoYW5kbGVDbGllbnRMb2FkKCkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGNhbGxiYWNrKTtcclxuICAgICAgICBjYWxsYmFjayAmJiBjYWxsYmFjayhuZXcgR0FDbGllbnQoQ0xJRU5UX0lEKSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG52YXIgR0FDbGllbnQgPSBmdW5jdGlvbihrZXkpIHtcclxuICAgIEdBQ2xpZW50LkNsaWVudElkID0ga2V5O1xyXG59O1xyXG5cclxuKGZ1bmN0aW9uKHByb3RvKSB7XHJcbiAgICB2YXIgYWN0aW9ucyA9IHt9XHJcbiAgICAgICAgO1xyXG5cclxuICAgIGZ1bmN0aW9uIGlzRm4oYXJnKSB7XHJcbiAgICAgICAgcmV0dXJuIGFyZyAmJiB0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGRpc3BhdGNoKGFjdGlvbikge1xyXG4gICAgICAgIGlmIChhY3Rpb24gPT0gJycpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB2YXIgYWN0ID0gYWN0aW9uLnRvU3RyaW5nKCkudG9Mb3dlckNhc2UoKTtcclxuICAgICAgICBpc0ZuKGFjdGlvbnNbYWN0XSkgJiZcclxuICAgICAgICAgICAgYWN0aW9uc1thY3RdLmFwcGx5KEdBQ2xpZW50LCBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBlcnJvcihtc2cpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBtZXNzYWdlIDogbXNnXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBoYW5kbGUoYWN0aW9uLCBwcm9wKSB7XHJcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGRhdGEpIHtcclxuICAgICAgICAgICAgdmFyIGVyciA9IG51bGw7XHJcbiAgICAgICAgICAgIGlmICghZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgZXJyID0gZXJyb3IoJ2RhdGEgbm90IGZvdW5kJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSBpZiAoZGF0YS5jb2RlKSB7XHJcbiAgICAgICAgICAgICAgICBlcnIgPSB7Y29kZTogZGF0YS5jb2RlLCBtZXNzYWdlOiBkYXRhLm1lc3NhZ2V9O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKHByb3ApIHtcclxuICAgICAgICAgICAgICAgIGlmIChkYXRhW3Byb3BdICYmIGRhdGFbcHJvcF0ubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZGF0YSA9IGRhdGFbcHJvcF07XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBlcnIgPSBlcnJvcignZGF0YSBub3QgZm91bmQnKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBkaXNwYXRjaChhY3Rpb24sIGVyciwgZGF0YSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHJlcG9ydChkaW0sIHByb2ZpbGVJZCwgZGF0ZWJlZ2luLCBkYXRlZW5kLCBjYWxsYmFjaykge1xyXG4gICAgICAgIGdhcGkuY2xpZW50LmFuYWx5dGljcy5kYXRhLmdhLmdldCh7XHJcbiAgICAgICAgICAgIGlkczogJ2dhOicgKyBwcm9maWxlSWQsXHJcbiAgICAgICAgICAgICdzdGFydC1kYXRlJzogZGF0ZWJlZ2luLFxyXG4gICAgICAgICAgICAnZW5kLWRhdGUnOiBkYXRlZW5kLFxyXG4gICAgICAgICAgICBtZXRyaWNzOiAnZ2E6dmlzaXRvcnMsZ2E6dGltZU9uU2l0ZScsXHJcbiAgICAgICAgICAgIGRpbWVuc2lvbnM6IGRpbVxyXG4gICAgICAgIH0pLmV4ZWN1dGUoY2FsbGJhY2spO1xyXG4gICAgfVxyXG5cclxuICAgIHByb3RvLm9uID0gZnVuY3Rpb24oYWN0aW9uLCBjYWxsYmFjaykge1xyXG4gICAgICAgIGlmIChhY3Rpb24gPT0gJycpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB2YXIgYWN0ID0gYWN0aW9uLnRvU3RyaW5nKCkudG9Mb3dlckNhc2UoKTtcclxuXHJcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPCAyKVxyXG4gICAgICAgICAgICByZXR1cm4gYWN0aW9uc1thY3RdO1xyXG4gICAgICAgIGFjdGlvbnNbYWN0XSA9IGNhbGxiYWNrO1xyXG4gICAgfTtcclxuXHJcbiAgICBwcm90by5zaWduSW4gPSBmdW5jdGlvbihrZXkpIHtcclxuICAgICAgICBrZXkgPSBrZXkgfHwgR0FDbGllbnQuQ2xpZW50SWQ7XHJcbiAgICAgICAgaWYgKGtleS5lcnJvcikge1xyXG4gICAgICAgICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbShcImdhLWFjY2Vzc190b2tlblwiKTtcclxuICAgICAgICAgICAgZGlzcGF0Y2goJ3NpZ25JbicsIGtleS5lcnJvcik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKGtleS5hY2Nlc3NfdG9rZW4pIHtcclxuICAgICAgICAgICAgdmFyIG5vdyA9IERhdGUubm93KCk7XHJcbiAgICAgICAgICAgIHZhciBtc1RvQWRkID0gKHBhcnNlSW50KGtleS5leHBpcmVzX2luKSAtIDEwMCkgKiAxMDAwO1xyXG4gICAgICAgICAgICBhdCA9IHt9O1xyXG4gICAgICAgICAgICBhdC5leHBpcmF0aW9uID0gbm93ICsgbXNUb0FkZDtcclxuICAgICAgICAgICAgYXQuYWNjZXNzX3Rva2VuID0ga2V5LmFjY2Vzc190b2tlbjtcclxuICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oXCJnYS1hY2Nlc3NfdG9rZW5cIiwgYXQpO1xyXG4gICAgICAgICAgICBkaXNwYXRjaCgnc2lnbkluJywgbnVsbCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBhdCA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKFwiZ2EtYWNjZXNzX3Rva2VuXCIpO1xyXG5cclxuICAgICAgICAgICAgZ2FwaSAmJiBnYXBpLmF1dGguYXV0aG9yaXplKHtcclxuICAgICAgICAgICAgICAgIGNsaWVudF9pZDoga2V5LFxyXG4gICAgICAgICAgICAgICAgc2NvcGU6IFNDT1BFUyxcclxuICAgICAgICAgICAgICAgIGltbWVkaWF0ZTogYXQgJiYgYXQuZXhwaXJhdGlvbiA+IERhdGUubm93KClcclxuICAgICAgICAgICAgfSwgcHJvdG8uc2lnbkluKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIHByb3RvLnNpZ25PdXQgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbShcImdhLWFjY2Vzc190b2tlblwiKTtcclxuICAgICAgICBkaXNwYXRjaCgnc2lnbm91dCcpO1xyXG4gICAgfTtcclxuXHJcbiAgICBwcm90by5hY2NvdW50cyA9IHtcclxuICAgICAgICBsaXN0IDogZnVuY3Rpb24oY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgdmFyIGFjdCA9ICdhY2NvdW50cy5saXN0JztcclxuICAgICAgICAgICAgcHJvdG8ub24oYWN0LCBjYWxsYmFjayk7XHJcblxyXG4gICAgICAgICAgICBnYXBpLmNsaWVudC5sb2FkKCdhbmFseXRpY3MnLCAndjMnLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIGdhcGkuY2xpZW50LmFuYWx5dGljc1xyXG4gICAgICAgICAgICAgICAgICAgIC5tYW5hZ2VtZW50XHJcbiAgICAgICAgICAgICAgICAgICAgLmFjY291bnRzXHJcbiAgICAgICAgICAgICAgICAgICAgLmxpc3QoKVxyXG4gICAgICAgICAgICAgICAgICAgIC5leGVjdXRlKGhhbmRsZShhY3QsICdpdGVtcycpKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBwcm90by53ZWJwcm9wZXJ0aWVzID0ge1xyXG4gICAgICAgIGxpc3QgOiBmdW5jdGlvbihhY2NvdW50SWQsIGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgIHZhciBhY3QgPSAnd2VicHJvcGVydGllcy5saXN0JztcclxuICAgICAgICAgICAgcHJvdG8ub24oYWN0LCBjYWxsYmFjayk7XHJcbiAgICAgICAgICAgIGdhcGkuY2xpZW50LmFuYWx5dGljc1xyXG4gICAgICAgICAgICAgICAgLm1hbmFnZW1lbnRcclxuICAgICAgICAgICAgICAgIC53ZWJwcm9wZXJ0aWVzXHJcbiAgICAgICAgICAgICAgICAubGlzdCh7J2FjY291bnRJZCc6IGFjY291bnRJZH0pXHJcbiAgICAgICAgICAgICAgICAuZXhlY3V0ZShoYW5kbGUoYWN0LCAnaXRlbXMnKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBwcm90by5wcm9maWxlcyA9IHtcclxuICAgICAgICBsaXN0IDogZnVuY3Rpb24oYWNjb3VudElkLCB3ZWJQcm9wZXJ0eUlkLCBjYWxsYmFjaykge1xyXG4gICAgICAgICAgICB2YXIgYWN0ID0gJ3Byb2ZpbGVzLmxpc3QnO1xyXG4gICAgICAgICAgICBwcm90by5vbihhY3QsIGNhbGxiYWNrKTtcclxuICAgICAgICAgICAgZ2FwaS5jbGllbnQuYW5hbHl0aWNzXHJcbiAgICAgICAgICAgICAgICAubWFuYWdlbWVudFxyXG4gICAgICAgICAgICAgICAgLnByb2ZpbGVzXHJcbiAgICAgICAgICAgICAgICAubGlzdCh7XHJcbiAgICAgICAgICAgICAgICAgICAgYWNjb3VudElkOiBhY2NvdW50SWQsXHJcbiAgICAgICAgICAgICAgICAgICAgd2ViUHJvcGVydHlJZDogd2ViUHJvcGVydHlJZFxyXG4gICAgICAgICAgICAgICAgfSkuZXhlY3V0ZShoYW5kbGUoYWN0LCAnaXRlbXMnKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBwcm90by5yZXBvcnRzID0ge1xyXG4gICAgICAgIHNvY2lhbCA6IGZ1bmN0aW9uKHByb2ZpbGVJZCwgZGF0ZWJlZ2luLCBkYXRlZW5kLCBjYWxsYmFjaykge1xyXG4gICAgICAgICAgICB2YXIgYWN0ID0gJ3JlcG9ydHMuc29jaWFsJztcclxuICAgICAgICAgICAgcHJvdG8ub24oYWN0LCBjYWxsYmFjayk7XHJcbiAgICAgICAgICAgIHJlcG9ydCgnZ2E6ZGF0ZUhvdXIsZ2E6ZnVsbFJlZmVycmVyLGdhOnNvdXJjZU1lZGl1bSxnYTpicm93c2VyLGdhOmNvdW50cnksZ2E6c29jaWFsTmV0d29yayxnYTpwYWdlUGF0aCcsXHJcbiAgICAgICAgICAgICAgICBwcm9maWxlSWQsXHJcbiAgICAgICAgICAgICAgICBkYXRlYmVnaW4sXHJcbiAgICAgICAgICAgICAgICBkYXRlZW5kLFxyXG4gICAgICAgICAgICAgICAgaGFuZGxlKGFjdClcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGdlbyA6IGZ1bmN0aW9uKGRhdGViZWdpbiwgZGF0ZWVuZCwgY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgdmFyIGFjdCA9ICdyZXBvcnRzLmdlbyc7XHJcbiAgICAgICAgICAgIHByb3RvLm9uKGFjdCwgY2FsbGJhY2spO1xyXG4gICAgICAgICAgICByZXBvcnQoJ2dhOmRhdGVIb3VyLGdhOmZ1bGxSZWZlcnJlcixnYTpjb3VudHJ5LGdhOnBhZ2VQYXRoLGdhOmNpdHksZ2E6bGF0aXR1ZGUsZ2E6bG9uZ2l0dWRlJyxcclxuICAgICAgICAgICAgICAgIHByb2ZpbGVJZCxcclxuICAgICAgICAgICAgICAgIGRhdGViZWdpbixcclxuICAgICAgICAgICAgICAgIGRhdGVlbmQsXHJcbiAgICAgICAgICAgICAgICBoYW5kbGUoYWN0KVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufSkoR0FDbGllbnQucHJvdG90eXBlKTtcclxuIiwidmFyIGdhYXBpID0gcmVxdWlyZSgnLi9nYWFwaScpO1xuXG52YXIgbG9hZGVyID0gZnVuY3Rpb24obmFtZSwgY2FsbGJhY2spIHtcbiAgICBpZiAobmFtZSA9PT0gJ2dvb2dsZScpIHtcbiAgICAgICAgZ2FhcGkoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICB9KTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGxvYWRlcjsiXX0=

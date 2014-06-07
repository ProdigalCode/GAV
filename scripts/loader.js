var gaapi = require('./gaapi');

var loader = function(name, callback) {
    if (name === 'google') {
        gaapi(function() {
            callback();
        });
    }
};

module.exports = loader;
var loader = require('./loader');
loader('google', function(client) {
    console.log('google is loaded', client);
});

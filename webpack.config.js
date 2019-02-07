const path = require('path');

module.exports = {
    entry: "./lib/globe.js",
    output: {
        path: path.resolve(__dirname, 'lib'),
        filename: "bundle.js",
        publicPath: "/globalData/"
    },
    devtool: 'source-map',
};
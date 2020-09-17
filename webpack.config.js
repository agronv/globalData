const path = require('path');
var webpack = require('webpack');

module.exports = {
    entry: "./lib/index.js",
    output: {
        path: path.resolve(__dirname, 'lib'),
        filename: "bundle.js",
        publicPath: "/globalData/"
    },
    plugins: [
        new webpack.ProvidePlugin({
            'THREE': require.resolve('three')
        })
    ],
    devtool: 'source-map',
};
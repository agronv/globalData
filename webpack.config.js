const path = require('path');
var webpack = require('webpack');

module.exports = {
    entry: "./src/index.js",
    output: {
        path: path.resolve(__dirname, 'src'),
        filename: "bundle.js",
        // publicPath: "/globalData/"
    },
    plugins: [
        new webpack.ProvidePlugin({
            'THREE': require.resolve('three')
        })
    ],
    devServer: {
        // static: {
        //     publicPath: "/globalData/"
        // },
        port: 3000,
        open: true,
        hot: true,
        compress: true,
        historyApiFallback:{
            index: 'index.html'
        }
    },
    devtool: 'source-map',
};

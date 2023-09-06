const path = require('path');
var webpack = require('webpack');

module.exports = {
    mode: 'development',
    entry: path.resolve(__dirname, 'src/index.js'),
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: "bundle.js"
        // publicPath: "/globalData/"
    },
    plugins: [
        new webpack.ProvidePlugin({
            'THREE': require.resolve('three')
        })
    ],
    devServer: {
        static: {
            directory: path.resolve(__dirname, 'dist')
        },
        open: true,
        hot: true,
        compress: true,
        historyApiFallback: true
    },
    devtool: 'source-map',
};

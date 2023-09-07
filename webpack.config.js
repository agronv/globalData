const path = require('path');
var webpack = require('webpack');

module.exports = {
    mode: 'development',
    entry: path.resolve(__dirname, 'src/index.js'),
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: "bundle.js"
    },
    plugins: [
        new webpack.ProvidePlugin({
            'THREE': require.resolve('three')
        })
    ],
    devServer: {
        static: {
            directory: path.resolve(__dirname, './')
        },
        open: true,
        hot: true,
        compress: true,
        historyApiFallback: true
    },
    devtool: 'source-map',
};

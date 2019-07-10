const path = require('path');

module.exports = {
    mode: 'development',
    entry: './client/main.ts',
    output: {
        filename: 'bundle.js',
        path: path.join(__dirname, 'public/js')
    },
    devServer: {
        contentBase: './public',
        publicPath: '/js/',
        watchContentBase: true,
        compress: true,
        port: 3000,
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: ['.ts', '.js']
    }
};
const webpack = require('webpack');

module.exports = {
    module: {
        rules: [
            {
                test: /\.wasm$/,
                type: 'javascript/auto',
                loaders: ['arraybuffer-loader'],
            },
        ],
    },
};

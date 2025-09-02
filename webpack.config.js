const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

/** @type {import('webpack').Configuration} */
module.exports = (env, argv) => {
    const isProd = argv.mode === 'production';
    return {
        entry: path.resolve(__dirname, 'src/hub.tsx'),
        output: {
            filename: 'assets/hub.js',
            clean: true,
            publicPath: '',
        },
        resolve: {
            extensions: ['.tsx', '.ts', '.js', '.jsx'],
        },
        devtool: isProd ? 'source-map' : 'eval-cheap-module-source-map',
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'ts-loader',
                    },
                },
                {
                    test: /\.css$/,
                    use: ['style-loader', 'css-loader'],
                },
                {
                    test: /\.(woff2?|ttf|eot|svg)$/i,
                    type: 'asset/resource',
                    generator: {
                        filename: 'assets/[name][hash][ext]'
                    }
                }
            ],
        },
        plugins: [
            new CopyWebpackPlugin({
                patterns: [
                    { from: 'images', to: 'images', noErrorOnMissing: true },
                    { from: "public/hub.html", to: "./hub.html" }
                ],
            }),
        ],
        devServer: {
            static: {
                directory: __dirname,
            },
            port: 5173,
            open: false,
        },
        performance: { hints: false },
        mode: isProd ? 'production' : 'development',
    };
};

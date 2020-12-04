const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackPugPlugin = require('html-webpack-pug-plugin');
const webpack = require('webpack');

const make_entries = (file) => {
    return [
        path.resolve(__dirname, 'src', 'common'),
        path.resolve(__dirname, 'src', file),
    ];
};

const inject_entry = (page, pug = true) => {
    let name = 'src-' + page.split('/').join('-');
    if (page === '.') {
        name = 'src-home';
    }
    const ext = pug ? 'pug' : 'html';
    module.exports.entry[name] = make_entries(`${page}/index.js`);
    module.exports.plugins.push(
        new HtmlWebpackPlugin({
            filename: `${page}/index.html`,
            template: path.resolve(__dirname, 'src', `${page}/index.${ext}`),
            chunks: [name],
        })
    );
};

const make_blog = () => {
    const blog_root = path.resolve(__dirname, 'src', 'blog');
    module.exports.entry['blog'] = make_entries(`${blog_root}/index.js`);
    module.exports.plugins.push(
        new HtmlWebpackPlugin({
            filename: `blog/index.html`,
            template: path.resolve(blog_root, 'index.pug'),
            chunks: ['blog'],
            main_post: 'Hello World',
        })
    );
};

module.exports = {
    devtool: 'source-map',
    devServer: {
        quiet: false,
        noInfo: false,
        stats: {
            assets: true,
            children: false,
            chunks: true,
            chunkModules: false,
            colors: true,
            entrypoints: true,
            hash: false,
            modules: false,
            timings: false,
            version: false,
        },
    },
    entry: {},
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js',
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: ['babel-loader'],
            },
            {
                test: /\.pug$/,
                use: ['pug-loader'],
            },
            {
                test: /\.(gltf)$/,
                use: ['gltf-webpack-loader'],
            },
            {
                test: /\.(png|jpe?g|gif|mp3|mp4|bin|glb)$/i,
                use: ['file-loader'],
            },
        ],
    },
    plugins: [
        new webpack.IgnorePlugin({
            resourceRegExp: /\.fbx$/,
            contextRegExp: /rabbit/,
        }),
        new webpack.IgnorePlugin({
            resourceRegExp: /Material/,
            contextRegExp: /rabbit/,
        }),
    ],
};

inject_entry('.');
// inject_entry('fun');
// inject_entry('fun/neon-dystopia');
// inject_entry('fun/rabbit');
make_blog();
module.exports.plugins.push(new HtmlWebpackPugPlugin());

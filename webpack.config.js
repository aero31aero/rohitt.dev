const path = require('path');
const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackPugPlugin = require('html-webpack-pug-plugin');
const webpack = require('webpack');
const glob = require('glob-promise');
const matter = require('gray-matter');
const md = require('markdown-it')();
const { post } = require('jquery');

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
    webpack_config.entry[name] = make_entries(`${page}/index.js`);
    webpack_config.plugins.push(
        new HtmlWebpackPlugin({
            filename: `${page}/index.html`,
            template: path.resolve(__dirname, 'src', `${page}/index.${ext}`),
            chunks: [name],
        })
    );
};

const get_posts_data = (posts) => {
    const post_data = [];
    posts.forEach((post) => {
        const path_to_post = `${path.resolve(__dirname, 'src')}/${post}`;
        const post_text = fs.readFileSync(path_to_post, {
            encoding: 'utf8',
            flag: 'r',
        });
        const post_info = matter(post_text);
        post_info.rendered = md.render(post_info.content);
        post_info.data.url = `/blog/${post_info.data.slug}`;
        post_data.push(post_info);
    });
    return post_data;
};

const make_blog = async () => {
    const blog_root = path.resolve(__dirname, 'src', 'blog');
    webpack_config.entry['blog'] = make_entries(`${blog_root}/index.js`);
    await glob(`${blog_root}/posts/*.md`)
        .then((posts) => {
            posts = posts.map((e) => {
                return e.replace(blog_root, '/blog');
            });
            console.log('posts', posts);
            const posts_data = get_posts_data(posts);
            webpack_config.plugins.push(
                new HtmlWebpackPlugin({
                    filename: `blog/index.html`,
                    template: path.resolve(blog_root, 'index.pug'),
                    chunks: ['blog'],
                    posts: posts_data.map((p) => p.data),
                })
            );
            posts_data.forEach((post) => {
                webpack_config.plugins.push(
                    new HtmlWebpackPlugin({
                        filename: `blog/${post.data.slug}`,
                        template: path.resolve(blog_root, 'post.pug'),
                        chunks: ['blog'],
                        post: post,
                    })
                );
            });
        })
        .catch(console.error);
};

const webpack_config = {
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

const main = async () => {
    inject_entry('.');
    inject_entry('fun');
    inject_entry('fun/neon-dystopia');
    inject_entry('fun/rabbit');
    await make_blog();
    webpack_config.plugins.push(new HtmlWebpackPugPlugin());
    return webpack_config;
};

module.exports = main;

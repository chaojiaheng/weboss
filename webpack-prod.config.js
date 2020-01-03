/*
 * @desc 生产环境webpack配置文件
 */
var path = require('path');
var webpack = require('webpack');
var ExtractTextPlugin = require("extract-text-webpack-plugin");
var HtmlWebpackPlugin = require('html-webpack-plugin');
var CleanPlugin = require('clean-webpack-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');
// var WebpackShellPlugin = require('webpack-shell-plugin');
var autoprefixer = require('autoprefixer');
var pkgInfo = require('./package.json');
var version = pkgInfo.version;

module.exports = {
  entry: {
    'app': './src/app-entry.jsx',
    'vendor': [
      'react',
      'react-dom',
      // 项目使用redux的话，打开下面的注释
      // 'redux',
      // 'react-redux',
      // 'redux-thunk',
      'react-router',
    ]
  },
  // 为了满足cdn场景，所以使用了cdnFilePath变量，后台会在html中填充
  // 同时带来了两个限制
  // 1. 图片必须全部压缩在代码中，拿到UI的图片后先在https://tinypng.com/网站进行压缩，
  //   然后放在图片目录中，保证图片都要小于10K
  // 2. 不能使用webpack的异步加载，即按需加载
  output: {
    path: path.resolve(__dirname, 'public'),
    // publicPath: '<%- cdnFilePath %>/' + version,
    publicPath: '',
    filename: '[name].js'
  },
  module: {
    preLoaders: [
      // 语法检查
      {
        test: /(\.jsx|\.js)$/,
        loader: 'eslint-loader',
        exclude: /node_modules/,
      }
    ],
    loaders: [{
      test: /\.css$/,
      loader: ExtractTextPlugin.extract("style-loader", "css-loader!postcss-loader")
    }, {
      test: /(\.jsx|\.js)$/,
      loader: 'babel-loader',
      exclude: /node_modules/,
      query: {
        presets: ['es2015', 'react', 'stage-0'],
        plugins: [['import', {"libraryName": "antd", "style": "css"}]]
      }
    }, {
      test: /\.(png|jpg|jpeg)$/,
      loader: "url-loader?limit=10240&name=images/[name].[ext]"
    }, {
      test: /\.gif$/,
      loader: "url-loader?limit=10240&name=images/[name].[ext]"
    }],
  },
  postcss: function() {
    return [autoprefixer({
      browsers: ['ios >= 5.0']
    })];
  },
  resolve: {
    extensions: ['', '.js', '.jsx'],
    alias: {
      webworkify: 'webworkify-webpack-dropin'
    }
  },
  plugins: [
    new webpack.DefinePlugin({
      "process.env": {
        NODE_ENV: '"production"'
      }
    }),
    new CleanPlugin('public/*'),
    new webpack.optimize.CommonsChunkPlugin({
      names: ['vendor', 'init']
    }),
    new ExtractTextPlugin("[name].css"),
    new HtmlWebpackPlugin({
      hash: true,
      template: 'src/index.html',
      chunksSortMode: 'dependency',
      filename: 'index.html',
      minify: {
        minifyCSS: true,
        minifyJS: true,
        removeComments: true
      },
      // globalSystemOptions: '<%- globalSystemOptions %>',
      // staticPath: '<%- cdnFilePath %>/' + version,
      staticPath: '.',
      // cookies: ''
    }),
    new CopyWebpackPlugin([
      {
        from: './src/third',
        to: 'third'
      }
    ]),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false,
        drop_console: true,
        drop_debugger: true
      }
    }),
    // new WebpackShellPlugin({
    //   onBuildEnd: [
    //     'echo "Transfering files ... "',
    //     'node ./copy-static-to-cdn.js',
    //     'echo "DONE ... "',
    //   ]
    // })
  ]
};

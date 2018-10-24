const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const baseConfiguration = {
	mode: process.env.NODE_ENV || 'development',

	plugins: [
		new ExtractTextPlugin('[name].bundle.less') // To import in less
	],

	devtool: '#eval-source-map'
};

if(process.env.NODE_ENV === 'production'){
	baseConfiguration.devtool = '#source-map';
}


const uiConfiguration = Object.assign({}, baseConfiguration, {
	entry: {
		disui: path.resolve(__dirname, 'src', 'ui', 'DisUI.js')
	},

	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: '[name].bundle.js',
		publicPath: 'dist',
		library: 'DisUI',
		libraryTarget: 'umd'
	},

	module: {
		rules: [
			{
				test:/\.vue$/,
				loader: 'vue-loader',
				options: {
					loaders: {
						'less': ExtractTextPlugin.extract({
							use: [
								{
									loader: 'css-loader',
									options: {
										importLoaders: 1
									}
								},

								'less-loader'
							],
							fallback: 'vue-style-loader'
						}),

						css: ExtractTextPlugin.extract({
							use: [{
								loader: 'css-loader',
								options: {
									importLoaders: 1
								}
							}],
							fallback: 'vue-style-loader'
						})
					}
				}
			},

			{
				test: /\.js$/,
				loader: 'babel-loader',
				options: {
					presets: ['env']
				},
				exclude: /node_modules/
			}
		]
	}
});

//babeled discord-rpc because of async/await
const rpcConfiguration = Object.assign({}, baseConfiguration, {
	entry: {
		rpc: path.resolve(__dirname, 'src', 'rpc', 'rpc.js'),
	},

	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: '[name].bundle.js',
		library: 'rpc',
		libraryTarget: 'umd'
	},

	module: {
		rules: [
			{
				test: /\.m?js$/,
				loader: 'babel-loader',
				options: {
					presets: ['env'],
					plugins: [
						"transform-runtime"
					]
				},
				exclude: /node_modules(?!(\/|\\)discord-rpc)/
			},

			{
				type: 'javascript/auto',
				test: /\.mjs$/,
				use: []
			}
		]
	},

	target: 'node'
});


module.exports = [
	rpcConfiguration,
	uiConfiguration
];

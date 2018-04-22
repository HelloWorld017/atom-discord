const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
	entry: {
		disui: path.resolve(__dirname, 'src', 'ui', 'DisUI.js'),
		example: path.resolve(__dirname, 'examples', 'index.js')
	},

	mode: process.env.NODE_ENV || 'development',

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
			},
		]
	},

	plugins: [
		new ExtractTextPlugin('[name].bundle.css')
	],

	devtool: '#eval-source-map'
};

if(process.env.NODE_ENV === 'production'){
	module.exports.devtool = '#source-map';
}

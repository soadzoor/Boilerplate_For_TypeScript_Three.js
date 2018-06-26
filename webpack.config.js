const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const UglifyJSWebpackPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
	entry: './src/ts/Main.ts',
	plugins: [
		new CleanWebpackPlugin(['build']),
		new HtmlWebpackPlugin({
			template: './src/index.html'
		}),
		new UglifyJSWebpackPlugin()
	],
    devtool: 'source-map',
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				loader: 'awesome-typescript-loader',
				exclude: '/node_modules/',
				options: {
					// disable type checker - we will use it in fork plugin
					transpileOnly: true,
					happyPackMode: true,
					sideEffects: false
				}
			},
			{
				test: /\.css$/,
				use: [
					'style-loader',
					'css-loader'
				]
			},
			{
				test: /\.(png|svg|jpg|gif)$/,
				use: [
					'file-loader'
				]
			},
			{
				test: /\.(woff|woff2|eot|ttf|otf)$/,
				use: [
					'file-loader'
				]
			}
		]
	},
	resolve: {
		extensions: [ '.tsx', '.ts', '.js' ]
	},
	output: {
		filename: '[name].js',
		path: path.resolve(__dirname, 'build/')
	},
	// When importing a module whose path matches one of the following, just
	// assume a corresponding global variable exists and use that instead.
	// This is important because it allows us to avoid bundling all of our
	// dependencies, which allows browsers to cache those libraries between builds.
	externals: {
		'THREE': 'three'
	}
};
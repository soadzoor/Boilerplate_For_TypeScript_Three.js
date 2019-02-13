
// this is only the prod build

var args = process.argv.slice(2);
var arg0 = args[0];


var bt = require("./build_tools");
var fs = require("fs");

var LOCAL_ROOT = ".";
var BUILD_PROD = LOCAL_ROOT + "/build/prod";
var BUILD_DIST = LOCAL_ROOT + "/build/dist";

var config = {
	root: ""
};

function init(pConfig) {

	config = pConfig;

	// Change cwd to the root project directory
	process.chdir(config.root);
}


function build(pArg0) {

	arg0 = pArg0 || arg0;

	switch (arg0)
	{
		case 'dev':
			build_all();
			break;

		case 'prod':
			build_all(true);

			var arrayOfJsFiles = [];

			var indexContent = require('fs').readFileSync(BUILD_PROD + '/index.html', 'utf-8');
			var lines = indexContent.split('\n');
			for (var i = 0; i < lines.length; ++i)
			{
				var line = lines[i];
				if (line.indexOf('<script src="libs') !== -1)
				{
					var libFile = line.split('"')[1];
					console.log(libFile);
					arrayOfJsFiles.push(libFile);
				}
			}
			arrayOfJsFiles.push(BUILD_PROD + '/js/app.js');


			bt.exec_module("concat -o " + BUILD_PROD + "/js/app.js " + arrayOfJsFiles.join(' '));

			for (var i = 0; i < arrayOfJsFiles.length - 1; ++i)
			{
				bt.rm(BUILD_PROD + arrayOfJsFiles[i].substr(1));
			}

			/** --mangle-props reserved=[THREE,WEBVR] --> breaks code! */
			bt.exec_module("uglifyjs", BUILD_PROD + "/js/app.js" + " --compress --mangle toplevel --output " + BUILD_PROD + "/js/app.js");


			var newIndexContent = indexContent.replace(/^.*<script src="libs\/.*$/mg, "");

			bt.rm(BUILD_PROD + '/index.html');

			fs.writeFile(BUILD_PROD + '/index.html', newIndexContent, function (err) {
				if (err) {
					throw err;
				}
			});

			break;

		default:
			build_all();
	}
}

function build_all(isProd) {

	// clean prod dir
	bt.clean_dir(BUILD_PROD);

	// copy tiff.min.js and index.html
	bt.cp(LOCAL_ROOT + "/src/index.html", BUILD_PROD + "/index.html");
	bt.cp(LOCAL_ROOT + "/src/css/style.css", BUILD_PROD + "/css/style.css");

	if (isProd) {
		bt.cp(LOCAL_ROOT + "/libs/draco", BUILD_PROD + "/libs/draco");
	} else {
		bt.cp(LOCAL_ROOT + "/libs", BUILD_PROD + "/libs");
	}

	ts();

	assets();
}

function ts() {

	var JS_DIR = BUILD_PROD + "/js";
	bt.clean_dir(JS_DIR);
	bt.tsc("--target es5 -d --lib es5,dom,es2015,es2015.iterable,es6 --out " + JS_DIR + "/app.js " + " --sourcemap " + LOCAL_ROOT + "/src/ts/Main.ts");
}

function assets() {

	bt.clean_dir(BUILD_PROD + "/assets");

	bt.cp(LOCAL_ROOT + "/src/assets", BUILD_PROD + "/assets");
}

function build_dist() {

	build_all();

	bt.rm(BUILD_DIST);

	bt.cp(BUILD_PROD + "/assets", BUILD_DIST + "/assets");
	bt.cp(BUILD_PROD + "/css/style.css", BUILD_DIST + "/css/style.css");
	bt.cp(BUILD_PROD + "/js/app.js", BUILD_DIST + "/js/app.js");
	bt.cp(BUILD_PROD + "/index.html", BUILD_DIST + "/index.html");

	bt.exec_module("uglifyjs", BUILD_DIST + "/js/app.js" + " --compress --mangle" + " --output " + BUILD_DIST + "/js/app.js");

	bt.exec_module("cleancss", BUILD_DIST + "/css/style.css" + " -o " + BUILD_DIST + "/css/style.css");
}

// ----------------------------------------------------------------------------------------------------------
// Export

module.exports = {
	init: init,
	build: build
};

build();
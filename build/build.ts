import fs from "fs"; // it's included in node.js by default, no need for any additional packages
import child_process from "child_process";
import * as esbuild from "esbuild";
import {sassPlugin} from "esbuild-sass-plugin";

const {build} = esbuild;

const BUILD_DEV = "build/dev";
const BUILD_PROD = "build/prod";
const NODE_MODULES_PATH = "./node_modules";
const args = process.argv.slice(2);

process.env.NODE_ENV = args.includes("--prod") ? "production" : "development";

const jsSubFolder = "src";
const timeStamp = getDateTime();
let jsFile = "App.js";

const splitCode = true; // for dynamic import (await import)
const isProduction = process.env.NODE_ENV === "production";
const buildFolder = isProduction ? BUILD_PROD : BUILD_DEV;

const yellowConsole = "\x1b[33m%s\x1b[0m";
const greenConsole = "\x1b[32m%s\x1b[0m";

buildFEApp();

function tsc() {
	console.log(yellowConsole, "Looking for type errors...");

	try {
		if (isProduction) {
			exec_module("tsc", "--tsBuildInfoFile null --incremental false");
		} else {
			exec_module("tsc", "--incremental true");
		}
	} catch (e) {
		// typescript error
		process.exit(1);
	}
}

async function buildFEApp() {
	console.time("Build time");

	tsc();

	console.log(yellowConsole, "Copying static files...");

	if (fs.existsSync(buildFolder)) {
		fs.rmSync(buildFolder, {recursive: true, force: true});
	}
	fs.mkdirSync(buildFolder, {recursive: true});
	shx(`cp index.html ${buildFolder}/index.html`);

	assets(buildFolder);

	const methodsToDoAfterBundling: (() => void | Promise<any>)[] = [
		() => {
			const newFile = `main.${timeStamp}.css`;
			const originalFileFull = `${buildFolder}/${jsSubFolder}/sass/main.css`;
			const newFileFull = `${buildFolder}/${jsSubFolder}/sass/${newFile}`;

			shx(`mv ${originalFileFull} ${newFileFull}`);

			const promises: Promise<any>[] = [replaceTextInFile(`${buildFolder}/index.html`, `href="src/sass/main.scss"`, `href="src/sass/${newFile}"`)];

			if (!isProduction) {
				shx(`mv ${originalFileFull}.map ${newFileFull}.map`);
				promises.push(replaceTextInFile(newFileFull, "/*# sourceMappingURL=main.css.map */", `/*# sourceMappingURL=${newFile}.map */`));
			}

			return Promise.all(promises);
		},
	];

	const originalScriptSourceInIndexHtml = `src="src/ts/App.ts"`;
	let finalJsFullPath = "";

	if (splitCode) {
		const originalJsFilePath = `${jsSubFolder}/ts/App.js`;
		const newJsFilePath = `${jsSubFolder}/ts/App.${timeStamp}.js`;

		finalJsFullPath = `${buildFolder}/${newJsFilePath}`;

		methodsToDoAfterBundling.push(() => {
			shx(`mv ${buildFolder}/${originalJsFilePath} ${finalJsFullPath}`);
		});

		await replaceTextInFile(`${buildFolder}/index.html`, originalScriptSourceInIndexHtml, `src="${newJsFilePath}"`);
	} else {
		const originalJsFile = jsFile;

		jsFile = originalJsFile.replace(".js", `.${timeStamp}.js`);
		finalJsFullPath = `${buildFolder}/${jsSubFolder}/ts/${jsFile}`;
		methodsToDoAfterBundling.push(() => {
			shx(`mv ${buildFolder}/${jsSubFolder}/ts/${originalJsFile} ${finalJsFullPath}`);
		});
		await replaceTextInFile(`${buildFolder}/index.html`, originalScriptSourceInIndexHtml, `src="${jsSubFolder}/ts/${jsFile}"`);
		await replaceTextInFile(`${buildFolder}/index.html`, `type="module"`, "");
	}

	const promises = [buildJsAndCss(["./src/ts/App.ts", "./src/sass/main.scss"], `${buildFolder}/${jsSubFolder}`)];

	await Promise.all(promises);

	console.log(yellowConsole, "Adding timestamps to filenames...");

	for (const method of methodsToDoAfterBundling) {
		await method();
	}

	if (isProduction) {
		console.log(yellowConsole, "Minifying shaders...");
		await minifyShaders(finalJsFullPath);
	}

	console.log(greenConsole, "Build done!");
	console.timeEnd("Build time");
}

function assets(buildFolder: string) {
	console.log(yellowConsole, "Copying assets...");
	shx(`rm -rf ${buildFolder}/assets`);
	shx(`mkdir -p ${buildFolder}/src/assets`);
	shx(`cp -R ./src/assets ${buildFolder}/src/assets`);
}

async function minifyShaders(finalJsFullPath: string) {
	// Assumes we're using backticks (`) for shaders, and define "precision highp float" in the beginning
	const bundleJs = await readTextFile(finalJsFullPath);

	let optimizedBundleJs = bundleJs;

	let shaderStartIndex = 0;

	const keyword = "precision highp float;";

	shaderStartIndex = optimizedBundleJs.indexOf(keyword, shaderStartIndex);

	while (shaderStartIndex > -1) {
		const shaderEndIndex = optimizedBundleJs.indexOf("`", shaderStartIndex);
		const shader = optimizedBundleJs.substring(shaderStartIndex, shaderEndIndex);
		const minifiedShader = minifyGlsl(shader);

		optimizedBundleJs = `${optimizedBundleJs.substring(0, shaderStartIndex)}${minifiedShader}${optimizedBundleJs.substring(shaderEndIndex)}`;

		++shaderStartIndex;
		shaderStartIndex = optimizedBundleJs.indexOf(keyword, shaderStartIndex);
	}

	await writeTextFile(finalJsFullPath, optimizedBundleJs);
}

function minifyGlsl(input: string) {
	// remove all comments
	// https://stackoverflow.com/questions/5989315/regex-for-match-replacing-javascript-comments-both-multiline-and-inline
	let output = input
		.replace(/(\/\*(?:(?!\*\/).|[\n\r])*\*\/)/g, "") // multiline comment
		.replace(/(\/\/[^\n\r]*[\n\r]+)/g, ""); // single line comment

	// replace defitionions with values throughout the whole glsl code
	let indexOfDefine = output.indexOf("#define");

	while (indexOfDefine > -1) {
		const endOfLineIndex = output.indexOf("\n", indexOfDefine);
		const row = output.substring(indexOfDefine, endOfLineIndex);

		// replace #define rows with empty string
		output = `${output.substring(0, indexOfDefine)}${output.substring(endOfLineIndex)}`;

		const definitions = row.split(" ");
		const key = definitions[1];
		const value = definitions.slice(2).join(" "); // value might contain spaces, like vec3(0.0, 0.5, 0.2)

		const regExp = new RegExp(key, "gm");

		output = output.replace(regExp, value);

		indexOfDefine = output.indexOf("#define");
	}

	// Remove whitespaces
	output = output.replace(/(\s)+/gm, " ").replace(/; /gm, ";");

	return output;
}

function formatDateSegment(dateSegment: number) {
	return `${dateSegment}`.length < 2 ? `0${dateSegment}` : `${dateSegment}`;
}

function getDateTime() {
	const d = new Date();
	let year = d.getFullYear();
	let month = formatDateSegment(d.getMonth() + 1);
	let day = formatDateSegment(d.getDate());

	let hours = formatDateSegment(d.getHours());
	let minutes = formatDateSegment(d.getMinutes());
	let seconds = formatDateSegment(d.getSeconds());

	return [year, month, day, hours, minutes, seconds].join("");
}

function shx(command: string) {
	const module = "shx";
	const args = command;

	return exec_module(module, args);
}

function exec_module(module: string, args: string) {
	return exec(`"${NODE_MODULES_PATH}/.bin/${module}"`, args);
}

function exec(command: string, args: string) {
	//console.log("command", command, args);

	args = args || "";

	// http://stackoverflow.com/questions/30134236/use-child-process-execsync-but-keep-output-in-console
	// https://nodejs.org/api/child_process.html#child_process_child_stdio

	const stdio = [
		0,
		1, // !
		2,
	];

	// eslint-disable-next-line sonarjs/os-command
	return child_process.execSync(`${command} ${args}`, {stdio: stdio});
}

function readTextFile(filePath: string) {
	return new Promise<string>((resolve, reject) => {
		fs.readFile(filePath, function (err, data) {
			if (err) {
				reject(err);
			} else {
				resolve(data.toString());
			}
		});
	});
}

function writeTextFile(filePath: string, data: string) {
	return new Promise<string>((resolve, reject) => {
		fs.writeFile(filePath, data, function (err) {
			if (err) {
				reject(err);
			} else {
				resolve(data);
			}
		});
	});
}

async function replaceTextInFile(filePath: string, oldText: string, newText: string) {
	// https://stackoverflow.com/questions/12398640/javascript-regex-pattern-that-contains-parentheses
	oldText = oldText.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
	const regExp = new RegExp(oldText, "g");
	const fileContent = await readTextFile(filePath);

	return writeTextFile(filePath, fileContent.replace(regExp, newText));
}

function buildJsAndCss(entryPoints: string[], buildFolder: string) {
	const define: Record<string, any> = {};

	// See these for explanation: https://github.com/evanw/esbuild/issues/69
	// https://github.com/evanw/esbuild/issues/438
	for (const k in process.env) {
		if (!k.includes("(") && !k.includes(")")) {
			define[`process.env.${k}`] = JSON.stringify(process.env[k]);
		}
	}

	const options: esbuild.BuildOptions = {
		entryPoints: entryPoints,
		target: "es2022",
		minify: isProduction,
		sourcemap: !isProduction,
		bundle: true,
		splitting: splitCode,
		outdir: buildFolder,
		define: define,
		treeShaking: true,
		metafile: true,
		loader: {
			".ttf": "file",
			".svg": "file",
		},
		plugins: [
			sassPlugin({
				sourceMap: !isProduction,
				sourceMapIncludeSources: !isProduction,
				style: isProduction ? "compressed" : "expanded",
			}),
		],
	};

	if (splitCode) {
		delete options.outfile;
		options.outdir = `${buildFolder}`;
		options.format = "esm";
	}

	console.log(yellowConsole, `Bundling js${entryPoints.length > 1 ? ", css, copying assets" : ""}...`);

	return build(options);
}

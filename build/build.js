import fs from "fs";
import child_process from "child_process";
import esbuild from "esbuild";
import sass from "sass";

const {build} = esbuild;

const LOCAL_ROOT = ".";
const BUILD_DEV = "build/dev";
const BUILD_PROD = "build/prod";
const BUILD_TEMP = "build/temp";
const NODE_MODULES_PATH = "./node_modules";
const args = process.argv.slice(2);
if (args.includes("--prod"))
{
	process.env.NODE_ENV = "production";
}
const splitCode = true; // for dynamic import (await import)
const isProduction = process.env.NODE_ENV === "production";
const buildFolder = isProduction ? BUILD_PROD : BUILD_DEV;
const checkForTypeErrors = !args.includes("--fast");

const yellowConsole = "\x1b[33m%s\x1b[0m";

const timeStamp = getDateTime();
let jsFile = "App.ts";
const jsSubFolder = "src";

buildApp();

async function buildApp()
{
	console.time("Build time");

	if (checkForTypeErrors)
	{
		console.log(yellowConsole, "Looking for type errors...");

		try
		{
			if (isProduction)
			{
				exec("tsc");
			}
			else
			{
				exec("tsc", `--incremental --composite false --tsBuildInfoFile ${BUILD_TEMP}/tsconfig.tsbuildinfo`);
			}
		}
		catch (e)
		{
			// typescript error
			process.exit(1);
		}
	}

	console.log(yellowConsole, "Copying static files...");

	shx(`rm -rf ${buildFolder}`);
	shx(`mkdir ${buildFolder}/`);
	shx(`cp src/index.html ${buildFolder}/index.html`);

	assets(buildFolder);


	const promises = [
		buildJs(`${buildFolder}/${jsSubFolder}`),
		css(buildFolder)
	];

	await Promise.all(promises);

	console.log(yellowConsole, "Adding timestamps to filenames...");
	
	const methodsToDoAfterBundling = [];
	let finalJsFullPath = "";
	if (splitCode)
	{
		const originalJsFilePath = `${jsSubFolder}/App.js`;
		const newJsFilePath = `${jsSubFolder}/App.${timeStamp}.js`;
		finalJsFullPath = `${buildFolder}/${newJsFilePath}`;

		methodsToDoAfterBundling.push(() =>
		{
			shx(`mv ${buildFolder}/${originalJsFilePath} ${finalJsFullPath}`);
		});
		await replaceTextInFile(`${buildFolder}/index.html`, `<script type="module" src="./ts/${jsFile}"></script>`, `<script type="module" src="${newJsFilePath}"></script>`);
	}
	else
	{
		const originalJsFile = jsFile;
		jsFile = originalJsFile.replace(".js", `.${timeStamp}.js`);
		finalJsFullPath = `${buildFolder}/${jsSubFolder}/${jsFile}`
		await replaceTextInFile(`${buildFolder}/index.html`, `<script type="module" src="${jsSubFolder}/${originalJsFile}"></script>`, `<script src="${jsSubFolder}/${jsFile}"></script>`);
	}

	for (const methodToDo of methodsToDoAfterBundling)
	{
		methodToDo();
	}

	if (isProduction)
	{
		console.log("\x1b[33m%s\x1b[0m", "Minifying shaders...");
		await minifyShaders(finalJsFullPath);
	}

	console.log("\x1b[32m%s\x1b[0m", "Build done!");
	console.timeEnd("Build time");
}

async function minifyShaders(finalJsFullPath)
{
	// Assumes we're using backticks (`) for shaders, and define "precision highp float" in the beginning
	const bundleJs = await readTextFile(finalJsFullPath);

	let optimizedBundleJs = bundleJs;

	let shaderStartIndex = 0;

	const keyword = "precision highp float;";

	shaderStartIndex = optimizedBundleJs.indexOf(keyword, shaderStartIndex);

	while (shaderStartIndex > -1)
	{
		const shaderEndIndex = optimizedBundleJs.indexOf("`", shaderStartIndex);
		const shader = optimizedBundleJs.substring(shaderStartIndex, shaderEndIndex);
		const minifiedShader = minifyGlsl(shader);

		optimizedBundleJs = `${optimizedBundleJs.substring(0, shaderStartIndex)}${minifiedShader}${optimizedBundleJs.substring(shaderEndIndex)}`;

		++shaderStartIndex;
		shaderStartIndex = optimizedBundleJs.indexOf(keyword, shaderStartIndex);
	}

	await writeTextFile(finalJsFullPath, optimizedBundleJs);
}

function minifyGlsl(input)
{
	// remove all comments
	// https://stackoverflow.com/questions/5989315/regex-for-match-replacing-javascript-comments-both-multiline-and-inline
	let output = input
		.replace(/(\/\*(?:(?!\*\/).|[\n\r])*\*\/)/g, "") // multiline comment
		.replace(/(\/\/[^\n\r]*[\n\r]+)/g, ""); // single line comment

	// replace defitionions with values throughout the whole glsl code
	let indexOfDefine = output.indexOf("#define");
	while (indexOfDefine > -1)
	{
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

function formatDateSegment(dateSegment /* number */)
{
	return `${dateSegment}`.length < 2 ? `0${dateSegment}` : `${dateSegment}`;
}

function getDateTime()
{
	const d = new Date();
	let year = d.getFullYear();
	let month = formatDateSegment(d.getMonth() + 1);
	let day = formatDateSegment(d.getDate());

	let hours = formatDateSegment(d.getHours());
	let minutes = formatDateSegment(d.getMinutes());
	let seconds = formatDateSegment(d.getSeconds());

	return [year, month, day, hours, minutes, seconds].join("");
}

function shx(command)
{
	const module = "shx";
	const args = command;

	return exec_module(module, args);
}

function exec_module(module, args)
{
	return exec(`"${NODE_MODULES_PATH}/.bin/${module}"`, args);
}

function exec(command, args)
{
	//console.log("command", command, args);

	args = args || "";

	// http://stackoverflow.com/questions/30134236/use-child-process-execsync-but-keep-output-in-console
	// https://nodejs.org/api/child_process.html#child_process_child_stdio

	const stdio = [
		0,
		1, // !
		2
	];

	let result;
	try
	{
		result = child_process.execSync(command + " " + args, {stdio: stdio});
	}
	catch (e)
	{
		// this is needed for messages to display when from the typescript watcher
		throw e;
	}

	return result;
}

function assets(buildFolder)
{
	console.log(yellowConsole, "Copying assets...");
	shx(`rm -rf ${buildFolder}/assets`);
	shx(`cp -R ${LOCAL_ROOT}/src/assets ${buildFolder}/assets`);
}

function readTextFile(filePath)
{
	return new Promise((resolve, reject) =>
	{
		fs.readFile(filePath, function (err, data)
		{
			if (err)
			{
				reject(err);
			}
			else
			{
				resolve(data.toString());
			}
		});
	});
}

function writeTextFile(filePath, data)
{
	return new Promise((resolve, reject) =>
	{
		fs.writeFile(filePath, data, function (err)
		{
			if (err)
			{
				reject(err);
			}
			else
			{
				resolve(data);
			}
		});
	});
}

async function replaceTextInFile(filePath, oldText, newText)
{
	const regExp = new RegExp(oldText, "g");
	const fileContent = await readTextFile(filePath);
	await writeTextFile(filePath, fileContent.replace(regExp, newText));
}

function css(buildFolder)
{
	return new Promise(async (resolve, reject) =>
	{
		console.log(yellowConsole, "Creating CSS from SASS...");

		const outFolder = `${buildFolder}/css`;
		const originalFileName = `main.scss`;
		const timeStampedFileName = `main.${timeStamp}.css`;
		const outFile = `${outFolder}/${timeStampedFileName}`;

		try
		{
			const result = await sass.compileAsync(
				`${LOCAL_ROOT}/src/sass/main.scss`,
				{
					sourceMap: !isProduction
				}
			);

			shx(`mkdir ${outFolder}`);
			const promises = [
				writeTextFile(outFile, result.css)
			];
			if (result.map)
			{
				promises.push(
					writeTextFile(`${outFile}.map`, result.map.toString())
				);
			}
			await Promise.all(promises);

			if (isProduction)
			{
				exec_module("uglifycss", `${outFile} --output ${outFile}`);
			}

			await replaceTextInFile(`${buildFolder}/index.html`, `./sass/${originalFileName}`, `./css/${timeStampedFileName}`);

			resolve();
		}
		catch (err)
		{
			console.error(err);
			reject();
		}
	});
}

function buildJs(buildFolder)
{
	const define = {}

	// See these for explanation: https://github.com/evanw/esbuild/issues/69
	// https://github.com/evanw/esbuild/issues/438
	for (const k in process.env)
	{
		if (!k.includes("(") && !k.includes(")"))
		{
			define[`process.env.${k}`] = JSON.stringify(process.env[k])
		}
	}

	const options = {
		entryPoints: ["./src/ts/App.ts"],
		target: "es2017",
		minify: isProduction,
		sourcemap: !isProduction,
		bundle: true,
		splitting: splitCode,
		outfile: `${buildFolder}/${jsFile}`,
		define: define,
		treeShaking: true
	};

	if (splitCode)
	{
		delete options.outfile;
		options.outdir = `${buildFolder}`;
		options.format = "esm";
	}

	console.log(yellowConsole, "Bundling js...");

	return build(options);
}
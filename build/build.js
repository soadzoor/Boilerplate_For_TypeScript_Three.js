const LOCAL_ROOT = ".";
const BUILD_DEV = "build/dev";
const BUILD_PROD = "build/prod";
const NODE_MODULES_PATH = "./node_modules";

const args = process.argv.slice(2);

const {build} = require("esbuild");

if (args.indexOf("--prod") > -1)
{
	process.env.NODE_ENV = "production";
}

buildApp();

function buildApp()
{
	const isProduction = process.env.NODE_ENV === "production";
	const buildFolder = isProduction ? BUILD_PROD : BUILD_DEV;

	shx(`rm -rf ${buildFolder}`);
	shx(`mkdir ${buildFolder}/`);
	shx(`cp src/index.html ${buildFolder}/index.html`);
	assets(buildFolder);
	css(buildFolder);

	if (isProduction)
	{
		exec_module("uglifycss", `${buildFolder}/css/style.css --output ${buildFolder}/css/style.css`);
	}

	const options = {
		stdio: "inherit",
		entryPoints: ["./src/ts/Main.ts"],
		outfile: [`${buildFolder}/js/app.bundle.js`],
		target: "es2017",
		minify: isProduction,
		sourcemap: !isProduction,
		bundle: true
	};

	build(options).catch(() => process.exit(1));
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

	var stdio = [
		0,
		1, // !
		2
	];

	try
	{
		var result = require("child_process").execSync(command + " " + args, {stdio: stdio});

	} catch (e)
	{
		// this is needed for messages to display when from the typescript watcher
		throw e;
	}

	return result;
}

function assets(buildFolder)
{

	shx(`rm -rf ${buildFolder}/assets`);
	shx(`cp -R ${LOCAL_ROOT}/src/assets ${buildFolder}/assets`);
}

function css(buildFolder)
{
	shx(`cp -R src/css ${buildFolder}/css`);
}
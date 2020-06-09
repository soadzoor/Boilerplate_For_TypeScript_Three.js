import {Scene, PerspectiveCamera, WebGLRenderer, AmbientLight, DirectionalLight, HemisphereLight, Vector3, GammaEncoding} from "three";
import {CameraControls} from "./CameraControls";
import {SceneLoader} from "./SceneLoader";
import {VignetteBackground} from "./VignetteBackground";
import {Convergence, Easing} from "utils/Convergence";
import {BoundedConvergence} from "utils/BoundedConvergence";
import {Constants} from "utils/Constants";

export class SceneManager
{
	private _canvas: HTMLCanvasElement;
	private _scene: Scene;
	private _camera: PerspectiveCamera;
	private _controls: CameraControls;
	private _renderer: WebGLRenderer;
	private _distance: BoundedConvergence = new BoundedConvergence(10, 10, 1, 100, Easing.EASE_OUT, Constants.ANIMATION_DURATION);
	private _normalizedCameraPosition: number[] = [0, 0, 1];
	private _sceneLoader: SceneLoader;
	private static _timeStamp: number = 0;
	public needsRender = true;

	constructor()
	{
		this._canvas = <HTMLCanvasElement>document.getElementById("myCanvas");
		this._scene = new Scene();
		this._camera = new PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.05, 70);

		this.initBackground();
		this.initLights();
		this.initControls();
		this.initRenderer();
		this.initMeshes();
		this.onWindowResize();
		this.animate(0);
	}

	private initBackground()
	{
		const IS_IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !((<any>window).MSStream);

		this._scene.add(new VignetteBackground({
			aspect: this._camera.aspect,
			grainScale: IS_IOS ? 0 : 0.001, // mattdesl/three-vignette-background#1
			colors: ["#ffffff", "#353535"]
		}).mesh);
	}


	private initLights()
	{
		const light1 = new AmbientLight(0xFFFFFF, 0.1);

		const light2 = new DirectionalLight(0xFFFFFF, 0.1);
		light2.position.set(0.5, 0, 0.866); // ~60ยบ

		const light3 = new HemisphereLight(0xffffbb, 0x080820, 0.8);

		this._scene.add(light1, light2, light3);
	}

	private initControls()
	{
		this._controls = new CameraControls(this._canvas, this);
		this._controls.activate();
	}

	private initMeshes()
	{
		this._sceneLoader = new SceneLoader(this, "assets/models/test.glb");
	}

	private initRenderer()
	{
		const contextAttributes = {
			alpha: false,
			antialias: true
		};
		const context = this._canvas.getContext("webgl2", contextAttributes) || this._canvas.getContext("experimental-webgl2", contextAttributes);
		this._renderer = new WebGLRenderer({
			canvas: this._canvas,
			context: context as WebGL2RenderingContext,
			...contextAttributes
		});
		this._renderer.setPixelRatio(window.devicePixelRatio);
		this._renderer.setClearColor(0xECF8FF);
		this._renderer.outputEncoding = GammaEncoding;

		this._canvas.addEventListener("webglcontextlost", this.onContextLost);

		window.addEventListener("resize", this.onWindowResize);
	}

	private onWindowResize = () =>
	{
		this._canvas.width = 0;
		this._canvas.height = 0;

		const width = window.innerWidth;
		const height = window.innerHeight;

		this._renderer.setSize(width, height);
		this._camera.aspect = width / height;
		this._camera.updateProjectionMatrix();
	};

	private onContextLost = (event: Event) =>
	{
		event.preventDefault();

		alert("Unfortunately WebGL has crashed. Please reload the page to continue!");
	};

	public get scene()
	{
		return this._scene;
	}

	private update = (time: number) =>
	{
		SceneManager._timeStamp = performance.now();
		this.needsRender = Convergence.updateActiveOnes(SceneManager._timeStamp) || this.needsRender;
		if (this.needsRender)
		{
			this._normalizedCameraPosition = this._controls.update();
			this._camera.position.set(
				this._normalizedCameraPosition[0] * this._distance.value,
				this._normalizedCameraPosition[1] * this._distance.value,
				this._normalizedCameraPosition[2] * this._distance.value
			);
			this._camera.lookAt(0, 0, 0);
			this._renderer.render(this._scene, this._camera);
			this.needsRender = false;
		}
	};

	private animate = (time: number) =>
	{
		this.update(time);
		this._renderer.setAnimationLoop(this.update);
	};

	/** Returns the timestamp of the newest render run  */
	public static get timeStamp()
	{
		return SceneManager._timeStamp;
	}

	public get distance()
	{
		return this._distance;
	}
}
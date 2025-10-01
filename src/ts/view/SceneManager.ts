import {AmbientLight, DirectionalLight, HemisphereLight, PerspectiveCamera, Scene, WebGLRenderer} from "three";
import {WarningWindow} from "../popups/WarningWindow";
import {Convergence, Easing} from "../utils/Convergence";
import {BoundedConvergence} from "../utils/BoundedConvergence";
import {Constants} from "../utils/Constants";
import {CameraControls} from "./CameraControls";
import {SceneLoader} from "./SceneLoader";
import {VignetteBackground} from "./VignetteBackground";
import type {ISceneManager} from "./SceneManagerType";

export default class SceneManager implements ISceneManager {
	private readonly _canvas: HTMLCanvasElement;
	private readonly _scene: Scene;
	private readonly _camera: PerspectiveCamera;
	private readonly _controls: CameraControls;
	private readonly _renderer: WebGLRenderer;
	private readonly _distance: BoundedConvergence;
	private _normalizedCameraPosition: number[] = [0, 0, 1];
	private _prevTimeStamp: number = 0;
	private _timeStamp: number = 0;
	private _deltaFrame: number = 1000;
	public needsRender = true;

	constructor() {
		this._canvas = document.getElementById("myCanvas") as HTMLCanvasElement;
		this._scene = new Scene();
		this._camera = new PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.05, 70);

		this._distance = new BoundedConvergence(this, 10, 10, 1, 100, Easing.EASE_OUT, Constants.ANIMATION_DURATION);

		this._controls = new CameraControls(this._canvas.parentElement!, this);

		this._renderer = new WebGLRenderer({
			canvas: this._canvas,
			antialias: true,
		});
	}

	public async init() {
		this.initBackground();
		this.initLights();
		this.initControls();
		this.initRenderer();
		await this.initMeshes();
		this.onWindowResize();
		this.animate(0);
	}

	private initBackground() {
		this._scene.add(
			new VignetteBackground({
				aspect: this._camera.aspect,
				grainScale: Constants.isIOS ? 0 : 0.001, // See mattdesl/three-vignette-background#1
				colors: ["#ffffff", "#353535"],
			}).mesh,
		);
	}

	private initLights() {
		const light1 = new AmbientLight(0xffffff, 0.3);

		const light2 = new DirectionalLight(0xffffff, 0.8);
		light2.position.set(0.5, 0, 0.866); // ~60ยบ

		const light3 = new HemisphereLight(0xffffff, 0x080820, 0.75);

		this._scene.add(light1, light2, light3);
	}

	private initControls() {
		this._controls.activate();
	}

	private async initMeshes() {
		this._scene.add(await SceneLoader.loadScene("src/assets/models/test.glb"));
	}

	private initRenderer() {
		this._renderer.setPixelRatio(window.devicePixelRatio);
		this._renderer.setClearColor(0xecf8ff);

		this._canvas.addEventListener("webglcontextlost", this.onContextLost);

		window.addEventListener("resize", this.onWindowResize);
	}

	private onWindowResize = () => {
		this._canvas.width = 0;
		this._canvas.height = 0;

		const width = window.innerWidth;
		const height = window.innerHeight;

		this._renderer.setSize(width, height);
		this._camera.aspect = width / height;
		this._camera.updateProjectionMatrix();
	};

	private onContextLost = async (event: Event) => {
		event.preventDefault();

		await WarningWindow.open("Unfortunately WebGL has crashed. Please reload the page to continue!");
	};

	public get scene() {
		return this._scene;
	}

	private update = (time: number) => {
		this._timeStamp = performance.now();
		this._deltaFrame = this._timeStamp - this._prevTimeStamp;
		this._prevTimeStamp = this._timeStamp;
		this.needsRender = Convergence.updateActiveOnes(this._timeStamp) || this.needsRender;
		if (this.needsRender) {
			this._normalizedCameraPosition = this._controls.update();
			this._camera.position.set(
				this._normalizedCameraPosition[0] * this._distance.value,
				this._normalizedCameraPosition[1] * this._distance.value,
				this._normalizedCameraPosition[2] * this._distance.value,
			);
			this._camera.lookAt(0, 0, 0);
			this._renderer.render(this._scene, this._camera);
			this.needsRender = false;
		}
	};

	private animate = (time: number) => {
		this.update(time);
		this._renderer.setAnimationLoop(this.update);
	};

	/** Returns the timestamp of the newest render run  */
	public get timeStamp() {
		return this._timeStamp;
	}

	/** Returns the time between the last 2 frames, so we can get an idea of the user's FPS */
	public get deltaFrame() {
		return this._deltaFrame;
	}

	public get distance() {
		return this._distance;
	}
}

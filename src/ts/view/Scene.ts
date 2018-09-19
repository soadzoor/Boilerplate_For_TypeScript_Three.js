///<reference path='../../../types/three-orbitcontrols'/>
///<reference path='./LookAroundControls'/>

class Scene
{
	private _canvas: HTMLCanvasElement;
	private _scene: THREE.Scene;
	private _camera: THREE.PerspectiveCamera;
	private _controls: LookAroundControls;
	private _renderer: THREE.WebGLRenderer;

	constructor()
	{
		this._canvas = <HTMLCanvasElement>document.getElementById('myCanvas');
		this._scene = new THREE.Scene();
		this._camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.05, 70);
		this._camera.position.set(5, 10, 20);

		this.initLights();
		this.initControls();
		this.initRenderer();
		this.initMeshes();
		this.onWindowResize();
		this.animate(0);
	}

	private initLights()
	{
		const light1  = new THREE.AmbientLight(0xFFFFFF, 0.1);

		const light2  = new THREE.DirectionalLight(0xFFFFFF, 0.1);
		light2.position.set(0.5, 0, 0.866); // ~60ยบ

		const light3 = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.8);

		this._scene.add(light1, light2, light3);
	}

	private initControls()
	{
		this._controls = new LookAroundControls(this._camera, this._canvas);
		this._controls.activate();
	}

	private initMeshes()
	{
		const boxGeometry = new THREE.BoxBufferGeometry(5, 5, 5);
		const boxMaterial = new THREE.MeshStandardMaterial({color: 0x00AABB});
		const boxMesh     = new THREE.Mesh(boxGeometry, boxMaterial);

		this._scene.add(boxMesh);

		const gridHelper = new THREE.GridHelper(10, 10);
		this._scene.add( gridHelper );
	}

	private initRenderer()
	{
		this._renderer = new THREE.WebGLRenderer({
			antialias: true,
			canvas: this._canvas
		});
		this._renderer.setPixelRatio(window.devicePixelRatio);
		this._renderer.setClearColor(0xECF8FF);
		this._renderer.gammaOutput = true;

		this._renderer.context.canvas.addEventListener('webglcontextlost', this.onContextLost);

		window.addEventListener('resize', this.onWindowResize);
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

		alert('Unfortunately WebGL has crashed. Please reload the page to continue!');
	};

	private update = (time: number) =>
	{
		this._controls.update();
		this._renderer.render(this._scene, this._camera);
	};

	private animate = (time: number) =>
	{
		this.update(time);
		this._renderer.setAnimationLoop(this.update);
	};
}
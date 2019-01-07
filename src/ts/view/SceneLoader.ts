///<reference path='../../../types/three-gltfloader.d.ts'/>
///<reference path='../../../types/three-dracoloader.d.ts'/>
///<reference path='./Scene.ts'/>

class SceneLoader
{
	private _scene: Scene;
	private _url: string;
	
	constructor(scene: Scene, url: string)
	{
		this._scene = scene;
		this._url = url;

		this.loadScene(this._url);
	}

	private loadScene = (url: string) =>
	{
		DRACOLoader.setDecoderPath('libs/draco/gltf/');
		const gltfLoader = new GLTFLoader();
		gltfLoader.setDRACOLoader(new DRACOLoader());

		gltfLoader.load(url, (gltf: any) =>
		{
			this.onLoad(gltf);
		});
	};

	private onLoad = (gltf: any) =>
	{
		const object = gltf.scene;
		this._scene.scene.add(object);
	};
}
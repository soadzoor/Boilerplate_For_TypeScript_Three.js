import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { SceneManager } from './SceneManager';

export class SceneLoader
{
	private _sceneManager: SceneManager;
	private _url: string;
	
	constructor(scene: SceneManager, url: string)
	{
		this._sceneManager = scene;
		this._url = url;

		this.loadScene(this._url);
	}

	private loadScene = (url: string) =>
	{
		const gltfLoader = new GLTFLoader();

		gltfLoader.load(url, (gltf: any) =>
		{
			this.onLoad(gltf);
		});
	};

	private onLoad = (gltf: any) =>
	{
		const object = gltf.scene;
		this._sceneManager.scene.add(object);
	};
}
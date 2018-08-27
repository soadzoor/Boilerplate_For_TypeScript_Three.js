///<reference path='../node_modules/@types/three/three-core'/>

declare class GLTFLoader
{
	constructor(manager?: THREE.LoadingManager);
	manager: THREE.LoadingManager;

	load(url: string, onLoad: (group: any) => void, onProgress?: (event: ProgressEvent) => void, onError?: (event: ErrorEvent) => void): void;
	setDRACOLoader(dracoLoader): any;
}
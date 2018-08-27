///<reference path='../node_modules/@types/three/three-core'/>

declare class DRACOLoader
{
	constructor(manager?: THREE.LoadingManager);
	manager: THREE.LoadingManager;

	static setDecoderPath(url: string): void;
}
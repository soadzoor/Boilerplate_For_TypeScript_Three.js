import {EquirectangularReflectionMapping, TextureLoader} from "three";
import type {Group, Mesh, MeshStandardMaterial, Object3D, Texture} from "three";
import type {GLTF} from "three/examples/jsm/loaders/GLTFLoader.js";
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader.js";

export class SceneLoader
{
	private static _envMap: Texture;

	private static get envMap()
	{
		if (!this._envMap)
		{
			this._envMap = new TextureLoader().load("assets/images/environment.jpg");
			this._envMap.mapping = EquirectangularReflectionMapping;
		}

		return this._envMap;
	}

	public static loadScene(url: string)
	{
		return new Promise<Group>((resolve, reject) =>
		{
			const gltfLoader = new GLTFLoader();

			gltfLoader.load(url, (gltf: GLTF) =>
			{
				gltf.scene.traverse((object: Object3D) =>
				{
					const objectAsMesh = object as Mesh;
					if (objectAsMesh.isMesh)
					{
						const material = objectAsMesh.material as MeshStandardMaterial;
						if (material.envMap === null)
						{
							material.envMap = this.envMap;
						}
					}
				});
				resolve(gltf.scene);
			});
		});
	}
}

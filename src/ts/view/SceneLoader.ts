import {EquirectangularReflectionMapping, Group, Mesh, MeshStandardMaterial, Object3D, Texture, TextureLoader} from "three";
import {GLTFLoader, GLTF} from "three/examples/jsm/loaders/GLTFLoader";

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
					if (object instanceof Mesh)
					{
						const material = object.material as MeshStandardMaterial;
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
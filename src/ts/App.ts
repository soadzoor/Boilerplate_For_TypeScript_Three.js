import {SceneManager} from "./view/SceneManager";
import {Model} from "./model/Model";

export class App
{
	private _model: Model;
	private _sceneManager: SceneManager;

	constructor()
	{
		this._model = new Model();
		this._sceneManager = new SceneManager();
	}

	public get scene()
	{
		return this._sceneManager;
	}

	public get model()
	{
		return this._model;
	}
}

const app = new App();
import type {IConvergence} from "../utils/ConvergenceType";

export interface ISceneManager
{
	distance: IConvergence;
	deltaFrame: number;
	timeStamp: number;
	needsRender: boolean;
}

import type {ISceneManager} from "../view/SceneManagerType";
import {Convergence, Easing} from "./Convergence";
import {MathUtils} from "./MathUtils";
import {Constants} from "./Constants";

export class BoundedConvergence extends Convergence
{
	private _originalMax: number;
	private _originalMin: number;

	constructor(sceneManager: ISceneManager, start: number, end: number, min: number, max: number, easing: Easing = Easing.EASE_OUT, animationTime: number = Constants.ANIMATION_DURATION, triggerRender: boolean = true)
	{
		super(sceneManager, start, end, easing, animationTime, triggerRender);
		this._originalMin = this._min = min;
		this._originalMax = this._max = max;
	}

	public get min()
	{
		return this._min;
	}

	public get max()
	{
		return this._max;
	}

	public get originalMin()
	{
		return this._originalMin;
	}

	public get originalMax()
	{
		return this._originalMax;
	}

	public setMin(min: number)
	{
		this._min = min;

		const newStart = MathUtils.clamp(this._start, this._min, this._max);
		const newEnd = MathUtils.clamp(this._end, this._min, this._max);
		super.reset(newStart, newEnd);
	}

	public setMax(max: number)
	{
		this._max = max;

		const newStart = MathUtils.clamp(this._start, this._min, this._max);
		const newEnd = MathUtils.clamp(this._end, this._min, this._max);
		super.reset(newStart, newEnd);
	}

	public override reset(start?: number, end?: number, min?: number, max?: number, clampBetweenMinAndMax: boolean = false)
	{
		this._min = min != null ? min : this._min;
		this._max = max != null ? max : this._max;
		const newStartCandidate = start != null ? start : this._originalStart;
		const newStart = clampBetweenMinAndMax ? MathUtils.clamp(newStartCandidate, this._min, this._max) : newStartCandidate;
		const newEndCandidate = end != null ? end : this._originalEnd;
		const newEnd = clampBetweenMinAndMax ? MathUtils.clamp(newEndCandidate, this._min, this._max) : newEndCandidate;
		super.reset(newStart, newEnd);
	}

	public isPlaying()
	{
		return this.value !== this.end;
	}
}

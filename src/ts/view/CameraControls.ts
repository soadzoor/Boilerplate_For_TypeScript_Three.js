import {Signal} from "../utils/Signal";
import {BoundedConvergence} from "../utils/BoundedConvergence";
import {Constants} from "../utils/Constants";
import {Easing} from "../utils/Convergence";
import {VectorUtils} from "../utils/VectorUtils";
import type {ISceneManager} from "./SceneManagerType";

export class CameraControls
{
	private _domElement: HTMLElement;
	private _isPointerDown: boolean = false;
	private _sceneManager: ISceneManager;
	private _mouseMoved: boolean = true;
	private _triggerClickThreshold: {
		deltaCursor: number;
		deltaTime: number;
	} = {
			deltaCursor: 3,
			deltaTime: 1000
		};
	private _pointer: {
		downTimeStamp: number;
		startX: number;
		startY: number;
		prevX: number | null;
		prevY: number | null;
		prevDeltaX: number;
		prevDeltaY: number;
		prevTimeStamp: number;
		prevDeltaTime: number;
		triggerClickOnPointerUp: boolean;
	} = {
			downTimeStamp: -1,
			startX: -1,
			startY: -1,
			prevX: null,
			prevY: null,
			prevDeltaX: 0,
			prevDeltaY: 0,
			prevTimeStamp: 0,
			prevDeltaTime: 1,
			triggerClickOnPointerUp: false
		};
	private _u: BoundedConvergence;
	private _v: BoundedConvergence;
	private _pinch: {
		startValue: {
			touchDistance: number;
			distanceValue: number;
		};
		currentValue: {
			touchDistance: number;
			distanceValue: number;
		};
	} = {
			startValue: {
				touchDistance: -1,
				distanceValue: -1
			},
			currentValue: {
				touchDistance: -1,
				distanceValue: -1
			}
		};
	private _cameraNormalizedPosition: number[] = VectorUtils.normalize([-1, 0.3, 0]);
	private _timeoutId: number = -1;
	private _dampOnPointerUp: boolean = false;

	private _enabled: boolean = false;
	private _autoRotation: number[] = [Constants.AUTOROTATION_SPEED, 0];

	private readonly SENSITIVITY = 1.2;
	private _prevSpeed: number[] = [];

	public signals = {
		click: Signal.create<{clientX: number; cientY: number}>()
	};

	constructor(domElement: HTMLElement, sceneManager: ISceneManager)
	{
		this._domElement = domElement;
		this._sceneManager = sceneManager;

		this._u = new BoundedConvergence(this._sceneManager, 0, 0, -Infinity, Infinity, Easing.EASE_OUT, Constants.DAMPING_DURATION);
		this._v = new BoundedConvergence(this._sceneManager, Math.PI / 2, Math.PI / 2, 0.01, 3.14, Easing.EASE_OUT, Constants.DAMPING_DURATION);
	}

	/**
	 * Returns the distance between 2 touch points
	 * @param touch0
	 * @param touch1
	 */
	private getTouchDistance(event: TouchEvent)
	{
		const touch0 = {
			x: event.touches[0].clientX,
			y: event.touches[0].clientY
		};

		const touch1 = {
			x: event.touches[1].clientX,
			y: event.touches[1].clientY
		};

		const delta = {
			x: touch1.x - touch0.x,
			y: touch1.y - touch0.y
		};

		const distance = Math.sqrt(delta.x * delta.x + delta.y * delta.y);

		return distance;
	}

	private onWheel = (event: WheelEvent) =>
	{
		event.preventDefault();
		const zoomStepSize = 1.1;

		const distance = this._sceneManager.distance;
		const newDistanceValue = Math.sign(-event.deltaY) > 0 ? distance.end / zoomStepSize : distance.end * zoomStepSize;
		distance.setEnd(newDistanceValue, true);
	};

	private onMouseDown = (event: MouseEvent) =>
	{
		if (event.button === Constants.MOUSE_BUTTON.LEFT)
		{
			this.onPointerDown(event.clientX, event.clientY);
		}
	};

	private onTouchStart = (event: TouchEvent) =>
	{
		event.preventDefault();

		if (event.touches.length === 1)
		{
			this.onPointerDown(event.touches[0].clientX, event.touches[0].clientY);
		}
		else if (event.touches.length === 2)
		{
			this._isPointerDown = false;
			this._pinch.startValue.touchDistance = this.getTouchDistance(event);
			this._pinch.startValue.distanceValue = this._sceneManager.distance.value;
		}
		else
		{
			this.onPointerUp(event);
		}
	};

	private onPointerDown(clientX: number, clientY: number)
	{
		this.stopRotating();
		this._isPointerDown = true;
		this._mouseMoved = false;

		this._pointer.startX = this._pointer.prevX = clientX;
		this._pointer.startY = this._pointer.prevY = clientY;

		this._pointer.downTimeStamp = performance.now();
		this._pointer.prevTimeStamp = this._pointer.downTimeStamp;
		this._pointer.triggerClickOnPointerUp = true;

		this._domElement.classList.add("rotating");

		this._u.reset(this._u.value, this._u.value);
		this._v.reset(this._v.value, this._v.value);
	}

	private onMouseMove = (event: MouseEvent) =>
	{
		this.onPointerMove(event.clientX, event.clientY);
	};

	private onTouchMove = (event: TouchEvent) =>
	{
		if (event.touches.length === 1)
		{
			this.onPointerMove(event.touches[0].clientX, event.touches[0].clientY);
		}
		else if (event.touches.length === 2 && this._pinch.startValue.touchDistance)
		{
			this._pinch.currentValue.touchDistance = this.getTouchDistance(event);
			this._pinch.currentValue.distanceValue = (this._pinch.startValue.touchDistance / this._pinch.currentValue.touchDistance) * this._pinch.startValue.distanceValue;

			this._sceneManager.distance.setEnd(this._pinch.currentValue.distanceValue);
		}
		else
		{
			this.onPointerUp(event);
		}
	};

	private onPointerMove(clientX: number, clientY: number)
	{
		if (this._isPointerDown)
		{
			this._mouseMoved = clientX !== this._pointer.prevX || clientY !== this._pointer.prevY; /** Sometimes pointermove is fired when the mouse is clicked, but the mouse doesn't even move. We have to check if the mouse really moved, or not */

			if (this._mouseMoved)
			{
				this._domElement.classList.add("rotating");

				if (this._pointer.prevX != null && this._pointer.prevY != null)
				{
					const distance = this._sceneManager.distance.value;
					const pointerDeltaX = this._pointer.prevX - clientX;
					const pointerDeltaY = clientY - this._pointer.prevY;
					const deltaU = (pointerDeltaX * this.SENSITIVITY / window.innerHeight) * distance;
					const deltaV = (pointerDeltaY * this.SENSITIVITY / window.innerHeight) * distance;

					const currentXToStartX = this._pointer.startX - clientX;
					const currentYToStartY = this._pointer.startY - clientY;

					if (this._triggerClickThreshold.deltaCursor < Math.abs(currentXToStartX) || this._triggerClickThreshold.deltaCursor < Math.abs(currentYToStartY))
					{
						this._pointer.triggerClickOnPointerUp = false;
					}

					this._pointer.prevDeltaX = this._pointer.prevX - clientX;
					this._pointer.prevDeltaY = clientY - this._pointer.prevY;

					this._u.reset(this._u.end - deltaU, this._u.end - deltaU);
					this._v.reset(this._v.end - deltaV, this._v.end - deltaV);
				}

				this._pointer.prevX = clientX;
				this._pointer.prevY = clientY;

				const timeStamp = performance.now();

				if (this._triggerClickThreshold.deltaTime < (timeStamp - this._pointer.downTimeStamp))
				{
					this._pointer.triggerClickOnPointerUp = false;
				}

				this._pointer.prevDeltaTime = timeStamp - this._pointer.prevTimeStamp;
				this._pointer.prevTimeStamp = timeStamp;

				this._dampOnPointerUp = true;
				clearTimeout(this._timeoutId);
				this._timeoutId = window.setTimeout(this.cancelDamping, 100);
			}
		}
	}

	private onPointerUp = (event: MouseEvent | TouchEvent) =>
	{
		if (this._isPointerDown)
		{
			const timeStamp = performance.now();
			this._domElement.classList.remove("rotating");

			const speed = this._prevSpeed;
			const speedAbsSq = VectorUtils.lengthOfSquared(speed);

			if (this._dampOnPointerUp && !isNaN(speedAbsSq) && 0 < speedAbsSq && speedAbsSq < Infinity)
			{
				this._dampOnPointerUp = false;

				const multiplicator = this._u.derivateAt0;

				// s = v * t => delta
				const time = this._u.originalAnimationDuration;
				const delta = [
					time * speed[0] / multiplicator,
					time * speed[1] / multiplicator
				];

				this._u.setEnd(this._u.value + delta[0]);
				this._v.setEnd(this._v.value + delta[1]);
			}

			if (this._triggerClickThreshold.deltaTime < (timeStamp - this._pointer.downTimeStamp))
			{
				this._pointer.triggerClickOnPointerUp = false;
			}

			if (this._pointer.triggerClickOnPointerUp)
			{
				this.signals.click.dispatch({clientX: this._pointer.prevX, clientY: this._pointer.prevY});
			}
		}

		this._isPointerDown = false;
		this._pointer.triggerClickOnPointerUp = false;
		this._pointer.downTimeStamp = -1;
		this._pointer.startX = -1;
		this._pointer.startY = -1;
		this._pointer.prevX = null;
		this._pointer.prevY = null;
		this._pointer.prevTimeStamp = 0;
		this._pointer.prevDeltaX = 0;
		this._pointer.prevDeltaY = 0;
		this._pointer.prevDeltaTime = 1;

		this._pinch.startValue.touchDistance = this._pinch.startValue.distanceValue =
			this._pinch.currentValue.touchDistance = this._pinch.currentValue.distanceValue = -1;
	};

	private cancelDamping = () =>
	{
		this._dampOnPointerUp = false;
	};

	/** See this for explanation: https://en.wikipedia.org/wiki/UV_mapping#Finding_UV_on_a_sphere */
	private setUVFromSphereSufracePoint(point: number[])
	{
		const u = Math.PI - Math.atan2(point[2], point[0]);
		this._u.reset(u, u);
		const v = (Math.PI / 2) - Math.asin(point[1]);
		this._v.reset(v, v);
	}

	public activate()
	{
		if (!this._enabled)
		{
			this._enabled = true;
			this.setUVFromSphereSufracePoint(this._cameraNormalizedPosition);

			this._domElement.addEventListener("mousedown", this.onMouseDown);
			this._domElement.addEventListener("touchstart", this.onTouchStart);
			this._domElement.addEventListener("wheel", this.onWheel);

			window.addEventListener("mousemove", this.onMouseMove);
			window.addEventListener("touchmove", this.onTouchMove);

			window.addEventListener("mouseup", this.onPointerUp);
			window.addEventListener("touchend", this.onPointerUp);
			window.addEventListener("touchcancel", this.onPointerUp);
		}
	}

	public deactivate()
	{
		if (this._enabled)
		{
			this._enabled = false;
			this._isPointerDown = false;

			this._domElement.classList.remove("rotating");

			this._domElement.removeEventListener("mousedown", this.onMouseDown);
			this._domElement.removeEventListener("touchstart", this.onTouchStart);
			this._domElement.removeEventListener("wheel", this.onWheel);

			window.removeEventListener("mousemove", this.onMouseMove);
			window.removeEventListener("touchmove", this.onTouchMove);

			window.removeEventListener("mouseup", this.onPointerUp);
			window.removeEventListener("touchend", this.onPointerUp);
			window.removeEventListener("touchcancel", this.onPointerUp);
		}
	}

	private stopRotating()
	{
		this._autoRotation[0] = 0;
		this._autoRotation[1] = 0;

		this._u.reset(this._u.value, this._u.value);
		this._v.reset(this._v.value, this._v.value);
	}

	public update()
	{
		if (this._enabled)
		{
			if (this._autoRotation[0] !== 0)
			{
				this._u.reset(this._u.end + this._autoRotation[0] * this._sceneManager.deltaFrame, this._u.end + this._autoRotation[0] * this._sceneManager.deltaFrame);
			}

			if (this._autoRotation[1] !== 0)
			{
				this._v.reset(this._v.end + this._autoRotation[1] * this._sceneManager.deltaFrame, this._v.end + this._autoRotation[1] * this._sceneManager.deltaFrame, undefined, undefined, true);
			}

			if (this._u.hasChangedSinceLastTick || this._v.hasChangedSinceLastTick)
			{
				this._prevSpeed[0] = this._u.prevDeltaValue / this._u.prevDeltaTime;
				this._prevSpeed[1] = this._v.prevDeltaValue / this._v.prevDeltaTime;
				this._cameraNormalizedPosition = VectorUtils.getWorldPositionFromUV(this._u.value, this._v.value);
				this._sceneManager.needsRender = true;
			}
		}

		return this._cameraNormalizedPosition;
	}
}

///<reference path='../utils/BoundedConvergence.ts'/>

class LookAroundControls
{
	private _camera: THREE.PerspectiveCamera;
	private _canvas: HTMLCanvasElement;
	private _target: THREE.Vector3;
	private _quat: THREE.Quaternion;
	private _quatInverse: THREE.Quaternion;
	private _spherical: THREE.Spherical;
	private _offset: THREE.Vector3;
	private _polarAngle: BoundedConvergence;
	private _azimuthAngle: BoundedConvergence;
	private _enabled: boolean;
	private _mouseSensitivity: number;

	private _pointer: {x: number, y: number, prevX: number, prevY: number, isDown: boolean};

	constructor(camera, canvas)
	{
		this._camera = camera;
		this._canvas = canvas;

		this._target = new THREE.Vector3();
		this._camera.getWorldDirection(this._target);
		this._target.normalize();
		this._quat = new THREE.Quaternion().setFromUnitVectors(this._camera.up, new THREE.Vector3(0, 1, 0));
		this._quatInverse = this._quat.clone().inverse();
		this._spherical = new THREE.Spherical();

		this._offset = new THREE.Vector3();
		this._offset.copy(this._target).sub(this._camera.position);
		this._offset.applyQuaternion(this._quat);
		this._spherical.setFromVector3(this._offset);
		this._spherical.makeSafe();

		this._polarAngle = new BoundedConvergence(this._spherical.phi, this._spherical.phi, 0, Math.PI);
		this._azimuthAngle = new BoundedConvergence(this._spherical.theta, this._spherical.theta, -Infinity, Infinity);

		this._pointer = {x: null, y: null, prevX: null, prevY: null, isDown: false};
		this._mouseSensitivity = 1;
	}

	public setSensitivity = (value: number) =>
	{
		this._mouseSensitivity = value;
	};

	public activate()
	{
		this._enabled = true;
		this._canvas.addEventListener( 'mousedown',  this.onMouseDown);
		this._canvas.addEventListener( 'mousemove',  this.onMouseMove);
		this._canvas.addEventListener( 'mouseup',    this.onPointerUp);
		this._canvas.addEventListener( 'mouseleave', this.onPointerUp);


	}

	public deactivate()
	{
		this._enabled = false;
		this._canvas.classList.remove('rotating');
		this._canvas.classList.remove('rotatable');
		this._canvas.removeEventListener( 'mousedown',  this.onMouseDown);
		this._canvas.removeEventListener( 'mousemove',  this.onMouseMove);
		this._canvas.removeEventListener( 'mouseup',    this.onPointerUp);
		this._canvas.removeEventListener( 'mouseleave', this.onPointerUp);
	}

	private onMouseDown = (event: MouseEvent) =>
	{
		this._pointer.x = event.clientX;
		this._pointer.y = event.clientY;
		this._pointer.isDown = true;

		this._canvas.classList.add('rotating');
		this._canvas.classList.remove('rotatable');
	};

	private onMouseMove = (event: MouseEvent) =>
	{
		event.preventDefault();

		if (this._pointer.isDown)
		{
			this._canvas.classList.add('rotating');
			this._canvas.classList.remove('rotatable');
			this.rotate(event.clientX, event.clientY);
		}
		else
		{
			this._canvas.classList.remove('rotating');
			this._canvas.classList.add('rotatable');
		}
	};

	private rotate = (x: number, y: number) =>
	{
		this._pointer.x = x;
		this._pointer.y = y;

		if (this._pointer.prevX !== null && this._pointer.prevY !== null)
		{
			const deltaX = THREE.Math.degToRad(this._pointer.x - this._pointer.prevX) * this._mouseSensitivity / 10;
			const deltaY = THREE.Math.degToRad(this._pointer.y - this._pointer.prevY) * this._mouseSensitivity / 10;

			this._polarAngle.decreaseEndBy(deltaY);
			this._azimuthAngle.increaseEndBy(deltaX);
		}

		this._pointer.prevX = x;
		this._pointer.prevY = y;
	};

	private onPointerUp = () =>
	{
		this._pointer.isDown = false;
		this._pointer.x = null;
		this._pointer.y = null;
		this._pointer.prevX = null;
		this._pointer.prevY = null;
		this._canvas.classList.remove('rotating');
		this._canvas.classList.remove('rotatable');
	};

	public update = () =>
	{
		this._azimuthAngle.update();
		this._polarAngle.update();

		this._offset.copy(this._target).sub(this._camera.position);
		this._offset.applyQuaternion(this._quat);
		this._spherical.setFromVector3(this._offset);
		this._spherical.theta = this._azimuthAngle.start;
		this._spherical.phi = this._polarAngle.start;
		this._spherical.makeSafe();

		this._offset.setFromSpherical(this._spherical);
		this._offset.applyQuaternion(this._quatInverse);
		//this._camera.position.copy(this._target).add(this._offset);
		this._target.copy(this._camera.position).add(this._offset);
		this._camera.lookAt(this._target);
	};
}
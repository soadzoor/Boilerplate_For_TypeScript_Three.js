import {Signal} from "./Signal";
export class KeyboardListener
{
	private static _isCtrlDown = false;
	private static _isShiftDown = false;
	private static _isAltDown = false;
	private static _isTabDown = false;
	private static _isSpaceDown = false;

	private static _instance: KeyboardListener;
	public static getInstance(): KeyboardListener
	{
		return KeyboardListener._instance || (KeyboardListener._instance = new KeyboardListener());
	}

	/**
	 * Returns if we allow the given event as keyboard event.
	 * We don't allow it if the current focus is on an input/textarea because in that case
	 * the user is typing and we don't want to mess with that.
	 */
	public static allowEvent(event: KeyboardEvent): boolean
	{
		if (event.key === KeyboardListener.KEY_ESCAPE || event.key === KeyboardListener.KEY_ENTER)
		{
			return true;
		}

		// const target = event.target as HTMLElement

		if (KeyboardListener.isEventTargetAnInput(event))
		{
			// Currently the focus is on an
			return false;
		}

		return true;
	}

	public static isEventTargetAnInput(event: Event): boolean
	{
		const target = event.target as HTMLElement;
		const name = target.nodeName.toLowerCase();

		return name === "input" || name === "textarea" || document.querySelectorAll(":focus").length > 0;
	}

	public static readonly KEY_DOWN = "ArrowDown";
	public static readonly KEY_UP = "ArrowUp";
	public static readonly KEY_LEFT = "ArrowLeft";
	public static readonly KEY_RIGHT = "ArrowRight";
	public static readonly KEY_ESCAPE = "Escape";
	public static readonly KEY_DELETE = "Delete";
	public static readonly KEY_BACKSPACE = "Backspace";
	public static readonly KEY_ENTER = "Enter";
	public static readonly KEY_SPACE = " ";
	public static readonly KEY_TAB = "Tab";
	public static readonly KEY_CTRL = "Control";
	public static readonly KEY_SHIFT = "Shift";
	public static readonly KEY_ALT = "Alt";
	public static readonly KEY_ARROW_UP = "ArrowUp";
	public static readonly KEY_ARROW_RIGHT = "ArrowRight";
	public static readonly KEY_ARROW_DOWN = "ArrowDown";
	public static readonly KEY_ARROW_LEFT = "ArrowLeft";

	public signals = {
		down: Signal.create<KeyboardEvent>(),
		up: Signal.create<KeyboardEvent>(),
		windowBlur: Signal.create<Event>(), // AKA: focus is lost -> the user clicked outside the browser, or changed tabs, or something similar
	};

	protected _domElement: any;

	constructor(domElement?: HTMLElement)
	{
		this._domElement = domElement || document.body;

		this.setEnabled(true);
	}

	public setEnabled(value: boolean): void
	{
		if (value)
		{
			this.addListeners();
		}
		else
		{
			this.removeListeners();
		}
	}

	protected addListeners(): void
	{
		this._domElement.addEventListener("keydown", this.onKeyDown);
		this._domElement.addEventListener("keyup", this.onKeyUp);
		window.addEventListener("blur", this.windowBlur);
	}

	protected removeListeners(): void
	{
		this._domElement.removeEventListener("keydown", this.onKeyDown);
		this._domElement.removeEventListener("keyup", this.onKeyUp);
		window.removeEventListener("blur", this.windowBlur);
	}

	private windowBlur = (event: Event): void =>
	{
		this.resetFlags();
		this.signals.windowBlur.dispatch(event);
	};

	private resetFlags(): void
	{
		KeyboardListener._isAltDown =
			KeyboardListener._isCtrlDown =
			KeyboardListener._isShiftDown =
			KeyboardListener._isTabDown =
			KeyboardListener._isSpaceDown =
			false;
	}

	private onKeyDown = (event: KeyboardEvent): void =>
	{
		switch (event.key)
		{
			case KeyboardListener.KEY_ALT:
				KeyboardListener._isAltDown = true;
				break;
			case KeyboardListener.KEY_CTRL:
				KeyboardListener._isCtrlDown = true;
				break;
			case KeyboardListener.KEY_SHIFT:
				KeyboardListener._isShiftDown = true;
				break;
			case KeyboardListener.KEY_TAB:
				KeyboardListener._isTabDown = true;
				break;
			case KeyboardListener.KEY_SPACE:
				KeyboardListener._isSpaceDown = true;
				break;
		}

		if (this.allow(event))
		{
			this.signals.down.dispatch(event);
		}

		// This is not a good idea, users might add enter listener in keydown.dispatch
		// if (event.key === KeyboardListener.KEY_ESCAPE)
		// {
		// 	this.escape.dispatch(event);
		// }
		// else if (event.key === KeyboardListener.KEY_DELETE)
		// {
		// 	this.delete.dispatch(event);
		// }
		// else if (event.key === KeyboardListener.KEY_ENTER)
		// {
		// 	this.enter.dispatch(event);
		// }
	};

	private onKeyUp = (event: KeyboardEvent): void =>
	{
		switch (event.key)
		{
			case KeyboardListener.KEY_ALT:
				KeyboardListener._isAltDown = false;
				// When alt is released, a blur event is triggered, so we need to prevent that
				// Consider preventdefault regardless of which key was released..?
				event.preventDefault();
				break;
			case KeyboardListener.KEY_CTRL:
				KeyboardListener._isCtrlDown = false;
				break;
			case KeyboardListener.KEY_SHIFT:
				KeyboardListener._isShiftDown = false;
				break;
			case KeyboardListener.KEY_TAB:
				KeyboardListener._isTabDown = false;
				break;
			case KeyboardListener.KEY_SPACE:
				KeyboardListener._isSpaceDown = false;
				break;
		}

		if (this.allow(event))
		{
			this.signals.up.dispatch(event);
		}
	};

	protected allow(event: KeyboardEvent): boolean
	{
		return KeyboardListener.allowEvent(event);
	}

	public get element(): HTMLElement
	{
		return this._domElement;
	}

	public static get isAltDown(): boolean
	{
		return KeyboardListener._isAltDown;
	}

	public static get isCtrlDown(): boolean
	{
		return KeyboardListener._isCtrlDown;
	}

	public static get isShiftDown(): boolean
	{
		return KeyboardListener._isShiftDown;
	}

	public static get isTabDown(): boolean
	{
		return KeyboardListener._isTabDown;
	}

	public static get isSpaceDown(): boolean
	{
		return KeyboardListener._isSpaceDown;
	}

	public dispose(): void
	{
		this.removeListeners();
	}
}

/**
 * You should use one of the descendants of this class: WarningWindow, ConfirmWindow, or PromptWindow
 * Example: const isConfirmed = await ConfirmWindow.open("Are you sure you want to delete this item?");
 */

import {ObjectUtils} from "../utils/ObjectUtils";
import {KeyboardListener} from "../utils/KeyboardListener";

export interface IPopupWindowConfig
{
	backdrop?: boolean;
	ok?: string; // The label of the OK button
	cancel?: string; // The label of the Cancel button
	parentElement?: HTMLElement;
}

interface IPopupWindowProps
{
	message: string;
	config?: IPopupWindowConfig;
}

export abstract class PopupWindow<T>
{
	private static _instances: PopupWindow<any>[] = [];
	private static _lastStateId = 1;
	private _isOkButtonEnabled: boolean = true;
	private _container: HTMLDivElement = document.createElement("div");
	private _okButton: HTMLDivElement = document.createElement("div");
	private readonly _props: IPopupWindowProps;
	private readonly _config: IPopupWindowConfig;
	protected static readonly _defaultConfig: IPopupWindowConfig = {
		backdrop: true,
		ok: "Yes",
		cancel: "No",
		parentElement: document.body
	};
	protected abstract _okValue: T; // the return value when the user clicks "ok"
	protected abstract _cancelValue: T; // the return value when the user clicks "cancel"
	protected _additionalElements: HTMLElement | null = null;
	protected resolve: (isOk: T | PromiseLike<T>) => void = () => { /* */ };

	constructor(props: IPopupWindowProps)
	{
		this._props = props;
		this._config = ObjectUtils.mergeConfig(PopupWindow._defaultConfig, props.config || {});
	}

	private onKeyDown = (event: KeyboardEvent) =>
	{
		if (!KeyboardListener.isEventTargetAnInput(event))
		{
			event.preventDefault();
		}

		switch (event.key)
		{
			case "Enter":
				this.onOkClick(event);
				break;
			case "Escape":
				this.onCancelClick();
				break;
		}
	};

	protected close()
	{
		PopupWindow._instances.length--;
		window.removeEventListener("keydown", this.onKeyDown);
		this._container.remove();
	}

	private onCancelClick = () =>
	{
		this.close();
		this.resolve?.(this._cancelValue);
	};

	private onOkClick = (event: Event) =>
	{
		if (this._isOkButtonEnabled)
		{
			event.stopImmediatePropagation(); // to prevent backdrop
			this.close();
			this.resolve?.(this._okValue);
		}
	};

	protected enableOkButton()
	{
		this._isOkButtonEnabled = true;
		this._okButton.classList.remove("disabled");
	}

	protected disableOkButton()
	{
		this._isOkButtonEnabled = false;
		this._okButton.classList.add("disabled");
	}

	protected open()
	{
		window.addEventListener("keydown", this.onKeyDown);

		this.draw();

		PopupWindow._instances.push(this);
		window.history.pushState(
			{
				browserState: "popup",
				id: PopupWindow._lastStateId++,
			},
			""
		);

		return new Promise<T>((resolve, reject) =>
		{
			this.resolve = resolve;
		});
	}

	private draw()
	{
		this._container.className = "popupBackdrop flexCenter";
		if (this._config.backdrop)
		{
			this._container.onclick = this.onCancelClick;
		}

		const popupWindow = document.createElement("div");
		popupWindow.className = "popupWindow flexCenter vbox";

		const message = document.createElement("div");
		message.className = "message";
		message.innerHTML = this._props.message;
		popupWindow.appendChild(message);

		if (this._additionalElements)
		{
			popupWindow.appendChild(this._additionalElements);
		}

		const buttonContainer = document.createElement("div");
		buttonContainer.className = "buttonContainer hbox flexCenter";

		if (this._config.cancel)
		{
			const cancelButton = document.createElement("div");
			cancelButton.className = "cancel btn";
			cancelButton.textContent = this._config.cancel;
			cancelButton.onclick = this.onCancelClick;
			buttonContainer.appendChild(cancelButton);
		}

		this._okButton.className = "ok btn";
		this._okButton.textContent = this._config.ok || "";
		this._okButton.onclick = this.onOkClick;

		if (!this._isOkButtonEnabled)
		{
			this._okButton.classList.add("disabled");
		}

		buttonContainer.appendChild(this._okButton);

		popupWindow.appendChild(buttonContainer);

		this._container.appendChild(popupWindow);

		this._config.parentElement?.appendChild(this._container);
	}

	public static cancelLast(): boolean
	{
		const length = PopupWindow._instances.length;
		if (length > 0)
		{
			PopupWindow._instances[length - 1].onCancelClick();

			return true;
		}
		else
		{
			return false;
		}
	}
}

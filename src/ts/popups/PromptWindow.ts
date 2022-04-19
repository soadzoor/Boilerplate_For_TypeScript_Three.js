import {ObjectUtils} from "../utils/ObjectUtils";
import type {IPopupWindowConfig} from "./PopupWindow";
import {PopupWindow} from "./PopupWindow";

interface IPromptWindowConfig extends IPopupWindowConfig
{
	isPassword?: boolean;
}

/**
 * Can be used as an alternative for `prompt("alertMessage");`
 */
// eslint-disable-next-line import/no-unused-modules
export class PromptWindow extends PopupWindow<string>
{
	protected static override readonly _defaultConfig: IPromptWindowConfig = {
		ok: "Submit",
		cancel: "Cancel",
		backdrop: false,
		isPassword: false,
		parentElement: document.body
	};

	protected _okValue = "";
	protected _cancelValue: string = "";

	constructor(message: string, placeholder: string, defaultValue: string, config: IPromptWindowConfig = {})
	{
		super({
			message: message,
			config: ObjectUtils.mergeConfig(PromptWindow._defaultConfig, config)
		});

		const htmlElement = document.createElement("input");
		htmlElement.placeholder = placeholder;
		htmlElement.value = defaultValue;

		if (config.isPassword)
		{
			htmlElement.type = "password";
		}

		this._additionalElements = htmlElement;

		this._okValue = defaultValue;
		this._additionalElements.oninput = this.onInputFieldChange;

		requestAnimationFrame(() =>
		{
			if (this._additionalElements?.parentElement)
			{
				this._additionalElements.focus();
			}
		});
	}

	private onInputFieldChange = (event: Event) =>
	{
		this._okValue = (event.currentTarget as HTMLInputElement).value;
	};

	public static open(message: string, placeholder: string = "", defaultValue: string = "", config?: IPromptWindowConfig)
	{
		return new PromptWindow(message, placeholder, defaultValue, config).open();
	}
}

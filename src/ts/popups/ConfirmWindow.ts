import {ObjectUtils} from "../utils/ObjectUtils";
import type {IPopupWindowConfig} from "./PopupWindow";
import {PopupWindow} from "./PopupWindow";

/**
 * Can be used as an alternative for `confirm("confirmMessage");`
 */
// eslint-disable-next-line import/no-unused-modules
export class ConfirmWindow extends PopupWindow<boolean>
{
	protected _okValue = true;
	protected _cancelValue = false;

	protected static override readonly _defaultConfig = {
		ok: "Yes",
		cancel: "No",
		backdrop: false
	};

	constructor(message: string, params: Partial<IPopupWindowConfig> = {})
	{
		super({
			message: message,
			config: ObjectUtils.mergeConfig(ConfirmWindow._defaultConfig, params)
		});
	}

	public static open(message: string, params?: Partial<IPopupWindowConfig>)
	{
		return new ConfirmWindow(message, params).open();
	}
}

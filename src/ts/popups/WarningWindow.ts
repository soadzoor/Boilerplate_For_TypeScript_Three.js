import {ObjectUtils} from "../utils/ObjectUtils";

import type {IPopupWindowConfig} from "./PopupWindow";
import {PopupWindow} from "./PopupWindow";

/**
 * Can be used as an alternative for `alert("alertMessage");`
 */
export class WarningWindow extends PopupWindow<boolean>
{
	protected static override readonly _defaultConfig = {
		ok: "Ok",
		cancel: "",
		backdrop: true
	};
	protected _okValue = true;
	protected _cancelValue = false;

	constructor(message: string, params: Partial<IPopupWindowConfig> = {})
	{
		super({
			message: message,
			config: ObjectUtils.mergeConfig(WarningWindow._defaultConfig, params)
		});
	}

	public static open(message: string, params?: Partial<IPopupWindowConfig>)
	{
		return new WarningWindow(message, params).open();
	}
}

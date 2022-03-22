export class Constants
{
	public static readonly ANIMATION_DURATION = 400;
	public static readonly DAMPING_DURATION = 2000;

	public static readonly MOUSE_BUTTON = {
		LEFT: 0,
		MIDDLE: 1,
		RIGHT: 2
	};

	// radian / millisec. Multiply by deltaframe to get the actual radian you need to change per frame
	public static readonly AUTOROTATION_SPEED = 0.0002;

	public static get isIOS()
	{
		return [
			"iPad Simulator",
			"iPhone Simulator",
			"iPod Simulator",
			"iPad",
			"iPhone",
			"iPod"
		].includes(navigator.platform)
			// iPad on iOS 13 detection
			|| (navigator.userAgent.includes("Mac") && "ontouchend" in document);
	}
}

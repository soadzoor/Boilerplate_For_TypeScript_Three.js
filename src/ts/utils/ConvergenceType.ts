export interface IConvergence
{
	value: number;
	setEnd: (value: number, clampBetweenMinAndMax?: boolean) => void;
	end: number;
}

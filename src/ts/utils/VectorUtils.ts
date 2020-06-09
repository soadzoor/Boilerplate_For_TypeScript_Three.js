export class VectorUtils
{
	public static lengthOfSquared(vector: number[])
	{
		let sumSq = 0;
		for (const element of vector)
		{
			sumSq += element * element;
		}

		return sumSq;
	}

	public static lengthOf(vector: number[])
	{
		return Math.sqrt(VectorUtils.lengthOfSquared(vector));
	}

	public static normalize(vector: number[])
	{
		const length = VectorUtils.lengthOf(vector);

		for (let i = 0; i < vector.length; ++i)
		{
			vector[i] /= length;
		}

		return vector;
	}

	public static getWorldPositionFromUV(u: number, v: number)
	{
		const vector = [
			Math.cos(u) * Math.sin(v),
			Math.cos(v),
			Math.sin(u) * Math.sin(v)
		];

		return VectorUtils.normalize(vector);
	}
}
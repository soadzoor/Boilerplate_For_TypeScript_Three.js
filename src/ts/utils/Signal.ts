interface ISignal<T>
{
	add(listener: (p1: T) => any, listenerContext?: any): void;
	remove(listener: () => any, listenerContext?: any): boolean;
	removeAll(): void;
	halt(): void;
	dispatch(...args: any[]): void;
	bindings: IBinding<T>[];
}

interface IBinding<T>
{
	listener: (p1: T) => any;
	context?: any;
	isOnce: boolean;
	priority: number;
}

export class Signal<T> implements ISignal<T>
{
	// --------------------------------------------------------------------------------------------------
	// static create method

	// public static create<T>()          : ISignalP1<T>;
	// public static create<T0, T1>()     : ISignalP2<T0, T1>;
	// public static create<T0, T1, T2>() : ISignalP3<T0, T1, T2>;

	public static create<T>(): Signal<T>
	{
		return new Signal<T>();
	}

	// --------------------------------------------------------------------------------------------------
	// private members, constructor

	protected _bindings: IBinding<T>[];

	protected _shouldPropagate = true;

	constructor()
	{
		this._bindings = [];
	}

	// --------------------------------------------------------------------------------------------------
	// add methods


	public add(listener: (p1: T) => any, context?: any, priority = 0): void
	{
		this.registerListener(listener, false, context, priority);
	}

	protected registerListener(listener: (p1: T) => any, isOnce: boolean, context: any, priority = 0): void
	{
		const prevIndex = this.indexOfListener(listener, context);
		let binding: IBinding<T> | null = null;

		if (prevIndex !== -1)
		{
			binding = this._bindings[prevIndex];
			if (binding.isOnce !== isOnce)
			{
				throw new Error(
					`You cannot add${
						isOnce ? "" : "Once"
					}() then add${
						!isOnce ? "" : "Once"
					}() the same listener without removing the relationship first.`
				);
			}
		}
		else
		{
			binding = {
				listener: listener,
				context: context,
				isOnce: isOnce,
				priority: priority,
			};

			this.addBinding(binding);
		}
	}

	protected addBinding(binding: IBinding<T>): void
	{
		let n = this._bindings.length;

		do
		{
			--n;
		} while (this._bindings[n] && binding.priority <= this._bindings[n].priority);

		this._bindings.splice(n + 1, 0, binding);

		//if (this._highestPriority < binding.pr)
	}


	protected indexOfListener(listener: (p1: T) => any, context: any): number
	{
		for (let i = this._bindings.length - 1; i >= 0; --i)
		{
			const binding = this._bindings[i];
			if (binding.listener === listener && binding.context === context)
			{
				return i;
			}
		}

		return -1;
	}

	public halt(): void
	{
		this._shouldPropagate = false;
	}

	//--------------------------------------------------------------------------------------------------
	// remove Methods

	/**
	 * If context is given -> remove the matching listener with that context.
	 * If no context given -> remove all matching listeners (regardless of context).
	 *
	 * TODO return listener?
	 */

	public remove(listener: (p1: T) => any, context?: any): boolean
	{
		const i = this.indexOfListener(listener, context);

		if (i !== -1)
		{
			this._bindings.splice(i, 1);

			return true;
		}

		return false;
	}

	public removeAll(): void
	{
		this._bindings.length = 0;
	}

	// --------------------------------------------------------------------------------------------------
	// dispatch

	public dispatch(...args: any[]): void
	{
		const paramsArr = Array.prototype.slice.call(args);
		this._shouldPropagate = true; //in case `halt` was called before dispatch or during the previous dispatch.

		const bindings = this._bindings;
		// TODO
		// Clone array in case add/remove items during dispatch
		// Eg.: add a key listener in a key listener, in this case you
		// only want the listener to be triggered for the next key event, not the current one.
		// (although that isn't a problem because the for loop is decremental)
		// Another potential bug: when you remove the event listener with index 2 and 3 in the event listener
		// with index 3 -> in that case the next step in the for loop will try to access index 2 which
		// doesn't exist anymore.
		//
		// const bindings = this._bindings.slice();

		for (let i = bindings.length - 1; i >= 0; --i)
		{
			const result = bindings[i].listener.apply(bindings[i].context, paramsArr as any);

			if (result === false || !this._shouldPropagate)
			{
				break;
			}
		}
	}

	public dispose(): void
	{
		this.removeAll();
	}

	public get bindings(): IBinding<T>[]
	{
		return this._bindings;
	}
}

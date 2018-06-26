import '../css/style.css';
// import * as THREE from 'three';

import {C} from './model/C';

export class Main
{
	constructor()
	{
		const c = new C();
		c.calculateX();
	}
}

const main = new Main();
/*!
 * Copyright (c) The Free MRE Foundation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Actor, User, ColliderType, CollisionLayer, AttachPoint, ScaledTransformLike, ButtonBehavior, AssetContainer, Context } from '@microsoft/mixed-reality-extension-sdk';
import { translate } from './utils';

export const DEFAULT_GUN_DIMENSIONS = {
	width: 0.4, height: 0.7, depth: 0.2
};
const DEFAULT_BULLET_TTL = 5;

export const GUN_COMMONS = {
	trigger: {
		dimensions: {
			width: 0.04,
			height: 0.04,
			depth: 0.04
		},
		transform: {
			position: {
				x: 0.06,
				y: -0.035,
				z: 0.14
			}
		}
	},
}

export interface GunOptions {
	name: string,
	attachPoint?: AttachPoint,
	transform?: Partial<ScaledTransformLike>,
	anchor: {
		dimensions: { width: number, height: number, depth: number },
		transform?: Partial<ScaledTransformLike>,
	},
	trigger: {
		dimensions: { width: number, height: number, depth: number },
		transform?: Partial<ScaledTransformLike>,
	},
	model: {
		resourceId: string,
		transform?: Partial<ScaledTransformLike>,
	},
	bullet: {
		resourceId: string,
		transform: Partial<ScaledTransformLike>,
		ttl: number,
	},
	dimensions?: {
		width: number,
		height: number,
		depth: number,
	},
	user: User,
}

export class Gun {
	private anchor: Actor;
	private trigger: Actor;

	get name() { return this.options.name; }
	get user() { return this.options.user; }

	constructor(private context: Context, private assets: AssetContainer, private options: GunOptions) {
		this.init();
	}

	private init() {
		this.createAnchor();
		this.createModel();
		this.createTrigger();
	}

	private createAnchor() {
		const local = translate(this.options.transform ? this.options.transform : {}).toJSON();
		this.anchor = Actor.Create(this.context, {
			actor: this.options.attachPoint ? {
				attachment: {
					userId: this.user.id,
					attachPoint: this.options.attachPoint
				}
			} : {
				transform: {
					local
				}
			},
		});
	}

	private createModel() {
		const local = translate(this.options.model.transform ? this.options.model.transform : {}).toJSON();
		Actor.CreateFromLibrary(this.context, {
			resourceId: this.options.model.resourceId,
			actor: {
				parentId: this.anchor.id,
				transform: {
					local
				}
			}
		});
	}

	private createTrigger() {
		const local = translate(this.options.trigger.transform ? this.options.trigger.transform : {}).toJSON();
		const dim = this.options.trigger.dimensions;
		const name = `${dim.width},${dim.height},${dim.depth}`;
		let mesh = this.assets.meshes.find(m => m.name === name);
		if (!mesh) {
			mesh = this.assets.createBoxMesh(name, dim.width, dim.height, dim.depth);
		}
		const material = this.assets.materials.find(m => m.name === 'invisible');

		this.trigger = Actor.Create(this.context, {
			actor: {
				name: "trigger",
				parentId: this.anchor.id,
				appearance: {
					meshId: mesh.id,
					materialId: material.id,
				},
				transform: {
					local
				},
				collider: {
					geometry: { shape: ColliderType.Auto },
					layer: CollisionLayer.Hologram
				},
			}
		});

		this.setButtonBehavior();
	}

	private setButtonBehavior() {
		this.trigger.setBehavior(ButtonBehavior).onClick(async (u, _) => {
			if (this.user && u.id != this.user.id) { return; }

			const local = translate(this.options.bullet.transform ? this.options.bullet.transform : {}).toJSON();
			const resourceId = this.options.bullet.resourceId;
			const actor = Actor.CreateFromLibrary(this.context, {
				resourceId,
				actor: {
					parentId: this.anchor.id,
					transform: {
						local
					}
				}
			});

			const timeout = this.options.bullet.ttl ? this.options.bullet.ttl : DEFAULT_BULLET_TTL;
			setTimeout(() => {
				actor.destroy();
			}, timeout * 1000);
		});
	}

	public remove() {
		this.trigger?.destroy();
		this.anchor.destroy();
	}

	public reattach() {
		if (this.user === undefined) { return; }

		const attachPoint = this.options.attachPoint ? this.options.attachPoint : 'right-hand';
		this.anchor.detach();
		this.anchor.attach(this.user, attachPoint as AttachPoint);

		this.setButtonBehavior();
	}
}
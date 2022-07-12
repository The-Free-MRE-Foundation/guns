/*!
 * Copyright (c) The Free MRE Foundation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Actor, AlphaMode, AssetContainer, BoxAlignment, ButtonBehavior, ColliderType, CollisionLayer, Color3, Color4, Context, Guid, ParameterSet, PlanarGridLayout, User } from "@microsoft/mixed-reality-extension-sdk";
import { DEFAULT_GUN_DIMENSIONS, Gun, GunOptions, GUN_COMMONS } from "./gun";
import { fetchJSON, translate } from "./utils";

const MIN_SYNC_INTERVAL = 1;

const DEFAULT_GUN_OPTIONS = [
        {
                name: "revolver",
                attachPoint: "left-hand",
                dimensions: {
                        width: 0.04,
                        height: 0.1,
                        depth: 0.25,
                },
                model: {
                        resourceId: "artifact:2044161675715674908",
                        transform: {
                                position: {
                                        x: 0.0445,
                                        y: 0,
                                        z: 0.2255
                                },
                                rotation: {
                                        x: 0,
                                        y: 0,
                                        z: -90
                                }
                        }
                },
                bullet: {
                        resourceId: "artifact:2044161675061363483",
                        transform: {
                                position: {
                                        x: 0,
                                        y: 0.0447,
                                        z: 0.1548
                                }
                        },
                        ttl: 10,
                },
        },
        {
                name: "confetti",
                transform: {
                        position: {
                                x: -1,
                                y: 0,
                                z: 0
                        },
                },
                model: {
                        resourceId: "artifact:2044223538646221085",
                        transform: {
                                position: {
                                        x: 0,
                                        y: 0,
                                        z: 0
                                },
                                rotation: {
                                        x: 0,
                                        y: 0,
                                        z: 0
                                }
                        }
                },
                bullet: {
                        resourceId: "artifact:2044223538260345116",
                        transform: {
                                position: {
                                        x: 0,
                                        y: 0,
                                        z: 0.06
                                }
                        },
                        ttl: 10,
                },
                trigger: {
                        transform: {
                                position: {
                                        x: 0,
                                        y: 0,
                                        z: 0
                                }
                        },
                        dimensions: {
                                width: 0.05,
                                height: 0.05,
                                depth: 0.05
                        }
                }
        },
];

/**
 * The main class of this app. All the logic goes here.
 */
export default class App {
        private url: string;
        private assets: AssetContainer;
        // sync fix
        private syncTimeout: NodeJS.Timeout;

        private anchor: Actor;
        private gunOptions: Partial<GunOptions>[];
        private grid: PlanarGridLayout;
        private buttons: Actor[];
        private equippedGuns: Map<Guid, Gun>;
        private spawnedGuns: Map<string, Gun>;

        constructor(private context: Context, params: ParameterSet) {
                this.url = params['url'] as string;
                this.assets = new AssetContainer(this.context);
                this.equippedGuns = new Map<Guid, Gun>();
                this.spawnedGuns = new Map<string, Gun>();
                this.context.onStarted(() => this.started());
                this.context.onUserJoined((u: User) => this.userjoined(u));
                this.context.onUserLeft((u: User) => this.userleft(u));
        }

        /**
         * Once the context is "started", initialize the app.
         */
        private async started() {
                this.gunOptions = this.url ? await fetchJSON(this.url) : DEFAULT_GUN_OPTIONS;
                this.assets.createMaterial('invisible', { color: Color4.FromColor3(Color3.Red(), 0.0), alphaMode: AlphaMode.Blend });
                this.createMenu();
                this.spawnGuns();
        }

        private createMenu() {
                this.anchor = Actor.Create(this.context);
                this.grid = new PlanarGridLayout(this.anchor);
                this.buttons = this.gunOptions.filter(g => g.attachPoint).map((g, i) => {
                        // model
                        const local = translate(g.model.transform).toJSON();
                        local.rotation.z = 0;
                        const model = Actor.CreateFromLibrary(this.context, {
                                resourceId: g.model.resourceId,
                                actor: {
                                        parentId: this.anchor.id,
                                        transform: {
                                                local
                                        }
                                }
                        });

                        // collider
                        const dim = g.dimensions ? g.dimensions : DEFAULT_GUN_DIMENSIONS;
                        const name = `${dim.width},${dim.height},${dim.depth}`;
                        let mesh = this.assets.meshes.find(m => m.name == name);
                        if (!mesh) {
                                mesh = this.assets.createBoxMesh(name, dim.width, dim.height, dim.depth);
                        }

                        const material = this.assets.materials.find(m => m.name === 'invisible');
                        const collider = Actor.Create(this.context, {
                                actor: {
                                        parentId: model.id,
                                        appearance: {
                                                meshId: mesh.id,
                                                materialId: material.id,
                                        },
                                        collider: {
                                                geometry: { shape: ColliderType.Box },
                                                layer: CollisionLayer.Hologram
                                        }
                                }
                        });
                        this.grid.addCell({
                                row: 0,
                                column: i,
                                width: dim.width,
                                height: dim.height,
                                contents: model
                        });
                        return collider;
                });

                this.grid.defaultCellAlignment = BoxAlignment.MiddleCenter;
                this.grid.applyLayout();

                this.setButtonBehavior();
        }

        private setButtonBehavior() {
                this.buttons.forEach((b, i) => {
                        b.setBehavior(ButtonBehavior).onClick((user, _) => {
                                const gunOption = this.gunOptions[i];
                                this.equipGun(user, gunOption);
                        });
                });
        }

        private equipGun(user: User, options: Partial<GunOptions>) {
                if (this.equippedGuns.has(user.id)) {
                        this.removeGun(user);
                        return;
                }
                const gun = new Gun(this.context, this.assets, {
                        ...GUN_COMMONS,
                        ...options,
                        user
                } as GunOptions);
                this.equippedGuns.set(user.id, gun);
        }

        private spawnGuns() {
                this.gunOptions.filter(g => !g.attachPoint).forEach(g => {
                        this.spawnGun(g);
                });
        }

        private spawnGun(options: Partial<GunOptions>) {
                if (this.spawnedGuns.has(options.name)) return;
                const gun = new Gun(this.context, this.assets, {
                        ...GUN_COMMONS,
                        ...options,
                } as GunOptions);
                this.spawnedGuns.set(options.name, gun);
        }

        private removeGun(user: User) {
                this.equippedGuns.get(user.id)?.remove();
                this.equippedGuns.delete(user.id);
        }

        private async userjoined(user: User) {
                if (!this.syncTimeout) {
                        this.syncTimeout = setTimeout(() => {
                                this.sync();
                        }, MIN_SYNC_INTERVAL * 1000);
                }
        }

        private sync() {
                this.syncTimeout = null;
                this.equippedGuns.forEach(g=>g.reattach());
                this.spawnedGuns.forEach(g=>g.reattach());
                this.setButtonBehavior();
        }

        private async userleft(user: User) {
                this.removeGun(user);
        }
}
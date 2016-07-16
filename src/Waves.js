/*
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

foam.CLASS({
  package: 'tabletop',
  name: 'EnemyWave',
  extends: 'tabletop.EntityManager',
  requires: [
    'tabletop.Entity',
    'tabletop.Hull',
  ],
  imports: [
    'worldDAO',
    'worldWidth',
    'worldHeight',
  ],
  properties: [
    'id',
    {
      /** Array of args objects to create Entity instances */
      name: 'enemyDefs',
      factory: function() { return []; }
    },
    {
      name: 'enemyCounts',
      factory: function() { return []; }
    },
  ],
  listeners: [
    function install(opt_x, opt_y) {
      opt_x = opt_x || this.worldWidth/2;
      opt_y = opt_y || this.worldHeight/2;

      for ( var ct = 0; ct < this.enemyCounts.length; ++ct ) {
        var def = this.enemyDefs[ct];
        if ( ! def ) { continue; }
        for ( var en = 0; en < this.enemyCounts[ct]; ++en ) {
          var e = this.Entity.create(def());
          this.position(e, ct, en, opt_x, opt_y);
          e.install();
        }
      }
    },
  ],
  methods: [
    function position(e, ct, i, x, y) {
      // distribute radially:
      // ct is the ring number,
      // count is the total number in the ring
      // i is the index within that total
      var count = this.enemyCounts[ct];

      var angle = ( 2*Math.PI / count ) * i;
      var dist = 0;
      for ( var d = 0; d <= ct; ++d ) {
        dist += this.enemyDefs[d]().br*2; // bounding radius
      }

      e.x = x + Math.cos(angle) * dist;
      e.y = y + Math.sin(angle) * dist;
      e.rotation = angle;
      //e.vx = Math.cos(angle) * dist;
      //e.vy = Math.sin(angle) * dist;
      e.bplane = 0;
    }
  ],
});


foam.CLASS({
  package: 'tabletop',
  name: 'EnemyWaveData',
  requires: [
    'tabletop.EnemyWave',
    'tabletop.EntityController',
    'tabletop.BasicController',
    'tabletop.TargetPlayerController',
    'tabletop.ShootPlayerController',
    'tabletop.CarrierController',
    'tabletop.Damage'
  ],
  properties: [
    'data'
  ],
  methods: [
    function init() {

      // hard coded wave data
      var waveCt = -1;
      var self = this;
      this.data = [
        this.EnemyWave.create({
          id: ++waveCt,
          enemyDefs: [
            function() { return {
              br: 20,
              hull: {basehp:3, currhp: 3},
              engine: { thrust: 800 },
              vrotation: 5 * (Math.random() - 0.5),
              mass: 10,
              sprite: {
                imageIndex: 'drone',
                scaleX: 0.4,
                scaleY: 0.4,
              },
              controller: self.ShootPlayerController.create(),
            }; },
            function() { return {
              br: 10,
              hull: {basehp:1, currhp: 1},
              engine: { thrust: 800 },
              mass: 5,
              sprite: {
                imageIndex: 'missileflight',
                scaleX: 0.2,
                scaleY: 0.2,
              },
              collisionPlane: 3,
              controller: self.TargetPlayerController.create(),
              damage: self.Damage.create({
                damaging: true,
                hurt: 1
              }),
            }; },
          ],
          enemyCounts: [
            10,
            0,
          ],
        }),
        this.EnemyWave.create({
          id: ++waveCt,
          enemyDefs: [
            function() { return {
              br: 100,
              hull: {basehp:100, currhp: 100},
              engine: { thrust: 80000 },
              mass: 10000,
              sprite: {
                imageIndex: 'carrier',
                scaleX: 0.5,
                scaleY: 0.5,
              },
              controller: self.CarrierController.create({
                wave: self.EnemyWave.create({
                  id: waveCt+"drones",
                  enemyDefs: [
                    function() { return {
                      br: 10,
                      hull: {basehp:2, currhp: 2},
                      engine: { thrust: 500 },
                      mass: 5,
                      //arotation: Math.random() - 0.5,
                      sprite: {
                        imageIndex: 'drone',
                        scaleX: 0.5,
                        scaleY: 0.5,
                      },
                      controller: self.ShootPlayerController.create(),
                    }; },
                  ],
                  enemyCounts: [
                    6,
                  ],
                }),
              }),
            }; },
            function() { return {
              br: 10,
              hull: {basehp:1, currhp: 1},
              engine: { thrust: 800 },
              mass: 5,
              sprite: {
                imageIndex: 'drone',
                scaleX: 0.5,
                scaleY: 0.5,
              },
              controller: self.ShootPlayerController.create(),
            }; },
          ],
          enemyCounts: [
            2,
            10,
          ],
        }),
        this.EnemyWave.create({
          id: ++waveCt,
          enemyDefs: [
            function() { return {
              br: 10,
              hull: {basehp:1, currhp: 1},
              engine: { thrust: 800 },
              mass: 5,
              sprite: {
                imageIndex: 'missileflight',
                scaleX: 0.2,
                scaleY: 0.2,
              },
              collisionPlane: 3,
              controller: self.TargetPlayerController.create(),
              damage: self.Damage.create({
                damaging: true,
                hurt: 1
              }),
            }; },
          ],
          enemyCounts: [
            6,
          ],
        }),
        this.EnemyWave.create({
          id: ++waveCt,
          enemyDefs: [
            function() { return {
              br: 30,
              hull: {basehp:15, currhp: 15},
              engine: { thrust: 8000 },
              mass: 500,
              sprite: {
                imageIndex: 'enemy',
                scaleX: 0.4,
                scaleY: 0.4,
              },
              controller: self.CarrierController.create({
                wave: self.EnemyWave.create({
                  id: waveCt+"missiles",
                  enemyDefs: [
                    function() { return {
                      br: 10,
                      hull: {basehp:1, currhp: 1},
                      engine: { thrust: 800 },
                      mass: 3,
                      sprite: {
                        imageIndex: 'missileflight',
                        scaleX: 0.2,
                        scaleY: 0.2,
                      },
                      collisionPlane: 3,
                      controller: self.TargetPlayerController.create(),
                      damage: self.Damage.create({
                        damaging: true,
                        hurt: 1
                      }),
                    }; },
                  ],
                  enemyCounts: [
                    2,
                  ],
                }),
              })
            }; },
          ],
          enemyCounts: [
            4,
          ],
        }),
        this.EnemyWave.create({
          id: ++waveCt,
          enemyDefs: [
            function() { return {
              br: 30,
              hull: {basehp:15, currhp: 15},
              engine: { thrust: 10000 },
              mass: 300,
              sprite: {
                imageIndex: 'drone',
                scaleX: 1,
                scaleY: 1,
              },
              controller: self.CarrierController.create({
                wave: self.EnemyWave.create({
                  id: waveCt+"missiles",
                  enemyDefs: [
                    function() { return {
                      br: 20,
                      hull: {basehp:3, currhp: 3},
                      engine: { thrust: 800 },
                      mass: 3,
                      sprite: {
                        imageIndex: 'enemyprojectile',
                        scaleX: 1,
                        scaleY: 1,
                      },
                      collisionPlane: 3,
                      controller: self.TargetPlayerController.create(),
                      damage: self.Damage.create({
                        damaging: true,
                        hurt: 1
                      }),
                    }; },
                  ],
                  enemyCounts: [
                    1,
                  ],
                }),
              })
            }; },
          ],
          enemyCounts: [
            6,
          ],
        }),
      ]
    },
  ]
});
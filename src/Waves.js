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
  ],
  imports: [
    'worldDAO',
    'worldWidth',
    'worldHeight',
    'entityPool',
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
    function install() {
      for ( var ct = 0; ct < this.enemyCounts.length; ++ct ) {
        var def = this.enemyDefs[ct];
        if ( ! def ) { continue; }
        for ( var en = 0; en < this.enemyCounts[ct]; ++en ) {
          var e = this.entityPool.pop(def);
          this.position(e, ct, en);
          e.install();
        }
      }
    },
  ],
  methods: [
    function position(e, ct, i) {
      // distribute radially:
      // ct is the ring number,
      // count is the total number in the ring
      // i is the index within that total
      var count = this.enemyCounts[ct];
      
      var angle = ( 2*Math.PI / count ) * i;
      var dist = 0;
      for ( var d = 0; d <= ct; ++d ) {
        dist += this.enemyDefs[d].br; // bounding radius
      }
      
      e.x = this.worldWidth/2 + Math.cos(angle) * dist;
      e.y = this.worldHeight/2 + Math.sin(angle) * dist;
      e.rotation = -angle - Math.PI/2;
      e.ax = e.vx = Math.cos(angle) * dist;
      e.ay = e.vy = Math.sin(angle) * dist;
      e.bplane = 0;
    }
  ],
});


foam.CLASS({
  package: 'tabletop',
  name: 'EnemyWaveData',
  requires: [
    'tabletop.EnemyWave',
    'tabletop.BasicController',
  ],
  properties: [
    'data'
  ],
  methods: [
    function init() {
  
      // hard coded wave data
      var waveCt = -1;
      this.data = [
        this.EnemyWave.create({
          id: ++waveCt,
          enemyDefs: [
            {
              br: 20,
              hp: {basehp: {hull: 1}, currhp: {hull: 1}},
              sprite: {
                imageIndex: 0,
                scaleX: 0.4,
                scaleY: 0.4,
              },
              controller: this.BasicController.create(),
            },
            {
              br: 10,
              hp: {basehp: {hull: 1}, currhp: {hull: 1}},
              sprite: {
                imageIndex: 1,
                scaleX: 0.2,
                scaleY: 0.2,
              },
              controller: this.BasicController.create(),
            },
          ],
          enemyCounts: [
            20,
            10,
          ],
        }),
      ]
    },
  ]
});
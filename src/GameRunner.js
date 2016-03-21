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
  name: 'GameRunner',
  requires: [
    'foam.graphics.Canvas',
    'tabletop.TestEntity',
    'foam.dao.SpatialHashDAO',
    'foam.graphics.CView',
    'foam.dao.ArraySink',
    'tabletop.Entity',
    'foam.mlang.sink.Map',
    'tabletop.Physics',
    'tabletop.AudioManager',
    'tabletop.PlayerManager',
  ],
  exports: [
    'worldDAO',
    'canvas',
    'time',
    'audioManager',
  ],
  properties: [
    {
      name: 'worldDAO',
      factory: function() {
        return this.SpatialHashDAO.create();
      }
    },
    {
      name: 'physicsManager',
      factory: function() {
        return this.Physics.create();
      }
    },
    {
      name: 'audioManager',
      factory: function() {
        return this.AudioManager.create();
      }
    },
    {
      name: 'canvas',
    },
    {
      name: 'time',
      defaultValue: 0
    },
    {
      name: 'players',
      factory: function() {
        return [
          this.PlayerManager.create({ corner: [0,0] }),
          this.PlayerManager.create({ corner: [0,1] }),
          this.PlayerManager.create({ corner: [1,0] }),
          this.PlayerManager.create({ corner: [1,1] })
        ];
      }
    }
  ],
  methods: [
    function init() {
      // for now, avoid infinite recursion (exported thing with factory that creates something that uses context)
      this.canvas = this.Canvas.create({
        width:  document.body.clientWidth,
        height: document.body.clientHeight,
        id: 'game-runner'
      }, foam.X);
      this.canvas.cview = this.CView.create();
      this.time$.subscribe(this.canvas.paint);

      this.players;


//       // create test entities
//       var x, y;
//       var spacing = 80;
//       for (var k = 0; k < 10; ++k) {
// //        x = Math.random() * this.canvas.width;
// //        y = Math.random() * this.canvas.height;
//         if (Math.random() > 0.8) {
//           this.worldDAO.put(this.TestEntity.create({
//             id: 'test'+k,
//             x: (k%10) * spacing,
//             y: Math.floor(k/10) * spacing,
//             br: 20,
//             ax: Math.random() * 10 - 5,
//             ay: Math.random() * 10 - 5,
//             arotation: Math.random() * 0.02 - 0.01,
//             vx: Math.random() * 10 - 5,
//             vy: Math.random() * 10 - 5,
//           }));
//         } else {
//           this.worldDAO.put(this.TestEntity.create({
//             id: 'test'+k,
//             x: (k%10) * spacing,
//             y: Math.floor(k/10) * spacing,
//             br: 20,
//           }));
//         }
//       }
//
//       this.worldDAO.put(this.TestEntity.create({
//         id: 'testbullet',
//         x: 2000,
//         y: 300,
//         br: 20,
//         ax: -20,
//       }));
//       this.worldDAO.put(this.TestEntity.create({
//         id: 'testbullet2',
//         x: 4000,
//         y: 500,
//         br: 20,
//         ax: -20,
//       }));
//       this.worldDAO.put(this.TestEntity.create({
//         id: 'testbullet3',
//         x: 6000,
//         y: 400,
//         br: 20,
//         ax: -20,
//       }));
//       this.worldDAO.put(this.TestEntity.create({
//         id: 'testbullet4',
//         x: 7000,
//         y: 200,
//         br: 20,
//         ax: -20,
//       }));
//       this.worldDAO.put(this.TestEntity.create({
//         id: 'testbullet5',
//         x: 8000,
//         y: 300,
//         br: 20,
//         ax: -20,
//       }));
//
//
//       // make views
//       var views = this.ArraySink.create();
//       this.worldDAO.select(this.Map.create({ f: this.Entity.SPRITE.f, delegate: views }));
//       this.canvas.cview.children = views.a;

      // insert canvas
      document.body.innerHTML = this.canvas.toHTML() + document.body.innerHTML;

      window.onresize = this.windowResize;

      this.physicsManager;
    }
  ],
  listeners: [
    {
      name: 'step',
      isFramed: true,
      code: function() {
        this.time = Date.now();
      }
    },
    {
      name: 'windowResize',
      isFramed: true,
      code: function() {
        this.canvas.width = document.body.clientWidth;
        this.canvas.height = document.body.clientHeight;
        this.canvas.element = this.canvas.element;
      }
    }
  ]
});
var g = tabletop.GameRunner.create();
setInterval(g.step, 16);


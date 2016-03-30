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
/**
  Steps through calculations for each frame
*/
foam.CLASS({
  package: 'tabletop',
  name: 'FrameStepper',
  requires: [
    'foam.mlang.Expressions as EXPRS',
    'foam.dao.ArraySink',
  ],
  imports: [
    'worldDAO',
    'time',
  ],

  properties: [
    [ 'previousTime', -1 ],
    {
      /** Queries the world for entities with velocity or acceleration above zero */
      name: 'entitesToMoveDAO',
      factory: function() {
        var m = this.EXPRS.create();
        return this.worldDAO.where(m.EQ(tabletop.Entity.MOVE_REQUIRED, true));
      }
    },
  ],

  methods: [
    function init() {
      this.previousTime = this.time;
      this.time$.sub(this.runFrame);
    },
  ],

  listeners: [
    {
      name: 'runFrame',
      code: function() {
        // time since last frame computed (in seconds)
        var ft = Math.min((this.time - this.previousTime) / 1000, 0.1);
        this.previousTime = this.time;

        var sink = {
          put: function(e) {
            e.moveStep(ft);
          },
          remove: function() {},
          error: function() {},
          eof: function() {},
        };
        this.entitesToMoveDAO.select(sink);
      }
    }
  ]

});



foam.CLASS({
  package: 'tabletop',
  name: 'GameRunner',
  requires: [
    'foam.graphics.Canvas',
    'tabletop.TestEntity',
    'tabletop.TestBoom',
    'foam.dao.SpatialHashDAO',
    'foam.graphics.CView',
    'foam.dao.ArraySink',
    'tabletop.Entity',
    'foam.mlang.sink.Map',
    'tabletop.FrameStepper',
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
        return this.SpatialHashDAO.create({
          space: [
            [ this.Entity.BX, this.Entity.BX2 ],
            [ this.Entity.BY, this.Entity.BY2 ],
            [ this.Entity.BPLANE, this.Entity.BPLANE2 ]
          ],
          bucketWidths: [20, 20, 1]
        });
      }
    },
    {
      name: 'frameStepper',
      factory: function() {
        return this.FrameStepper.create();
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
      this.time$.sub(this.canvas.paint);

      this.players;


      // create test entities
      var x, y;
      var spacing = 80;
      for (var k = 0; k < 40; ++k) {
//        x = Math.random() * this.canvas.width;
//        y = Math.random() * this.canvas.height;
          this.worldDAO.put(this.TestEntity.create({
            id: 'test'+k,
            x: (k%10) * spacing + 100,
            y: Math.floor(k/10) * spacing + 200,
            br: 10,
//            ax: Math.random() * 20 - 10,
//            ay: Math.random() * 20 - 10,
            vx: Math.random() * 10 - 5,
            vy: Math.random() * 10 - 5,
          }));
      }
      this.worldDAO.put(this.TestBoom.create({
        id: 'blast',
        br: 11,
        x: 300,
        y: 200,
      }));
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
      // make views
      var views = this.ArraySink.create();
      this.worldDAO.select(this.Map.create({ f: this.Entity.SPRITE.f, delegate: views }));
      this.canvas.cview.children = views.a;

      // insert canvas
      document.body.innerHTML = this.canvas.toHTML() + document.body.innerHTML;

      window.onresize = this.windowResize;

      this.frameStepper;
    },
    function audioStart() {
      this.audioManager.play("impact", "startup");
    }
  ],
  listeners: [
    {
      name: 'step',
      isFramed: true,
      code: function() {
        var t = Date.now();
        //if ( ( t - this.time ) < 32 ) return;
        this.time = t;
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
window.onload = function() {
  var introbox = document.createElement("DIV");
  introbox.id = "intro";
  document.body.appendChild(introbox);
  introbox.addEventListener("click", function() {
    g.audioStart();
    introbox.style.display = "none";
    setInterval(g.step, 16);
  });
};



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
  implements: ['foam.dao.Sink'],
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
    {
      /** the duration of this frame, in seconds */
      class: 'Simple',
      name: 'ft',
    }
  ],

  methods: [
    function init() {
      this.previousTime = this.time;
      this.time$.sub(this.runFrame);
    },
    function put(e) {
      e.moveStep(this.ft);
    },
  ],

  listeners: [
    {
      name: 'runFrame',
      code: function() {
        // time since last frame computed (in seconds)
        this.ft = Math.min((this.time - this.previousTime) / 1000, 0.1);
        this.previousTime = this.time;

        this.entitesToMoveDAO.select(this);
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
    'foam.core.ObjectPool',
    'tabletop.EnemyWaveData',
  ],
  exports: [
    'worldDAO',
    'canvas',
    'time',
    'audioManager',
    'worldWidth',
    'worldHeight',
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
      value: 0
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
    },
    [ 'worldWidth', 1600 ],
    [ 'worldHeight', 900 ],
    // {
    //   name: 'entityPool',
    //   factory: function() {
    //     var ret = this.ObjectPool.create({
    //       of: this.Entity,
    //     });
    //     ret.resetArgs = {
    //       x: 99999,
    //       vx: 0,
    //       vy: 0,
    //       ax: 0,
    //       ay: 0,
    //       vrotation: 0,
    //       arotation: 0,
    //       objectPool: ret,
    //     };
    //     return ret;
    //   }
    // },
    {
      name: 'enemyWaves',
      factory: function() {
        return this.EnemyWaveData.create();
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
//       var x, y;
//       var spacing = 80;
//       var cx = 1600 / 2 - (5 * spacing);
//       var cy = 900 / 2 - (2 * spacing);
//       for (var k = 0; k < 40; ++k) {
// //        x = Math.random() * this.canvas.width;
// //        y = Math.random() * this.canvas.height;
//           this.TestEntity.create({
//             id: 'test'+k,
//             x: (k%10) * spacing + cx,
//             y: Math.floor(k/10) * spacing + cy,
//             br: 10,
// //            ax: Math.random() * 20 - 10,
// //            ay: Math.random() * 20 - 10,
//             vx: Math.random() * 10 - 5,
//             vy: Math.random() * 10 - 5,
//
//             hp: {basehp: {hull: 3}, currhp: {hull: 3}},
//           }).install();
//       }
      // this.TestBoom.create({
      //   id: 'blast',
      //   br: 11,
      //   x: 300,
      //   y: 200,
      // }).install();

      // insert canvas
      document.body.innerHTML = this.canvas.toHTML() + document.body.innerHTML;

      window.onresize = this.windowResize;
      this.windowResize();
      this.canvas.element.addEventListener("mousedown", this.mouseDownEvent, false);

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

        var ratio = 1600 / 900;
        if ( this.canvas.height * ratio > this.canvas.width ) {
          this.canvas.height = this.canvas.width / ratio;
        } else if ( this.canvas.width / ratio > this.canvas.height ) {
          this.canvas.width = this.canvas.height * ratio;
        }

        var scale = Math.min(this.canvas.width / 1600,
                             this.canvas.height / 900);
        this.canvas.cview.scaleX = scale;
        this.canvas.cview.scaleY = scale;

        // reset DOM canvas element
        this.canvas.element = this.canvas.element;
      }
    },
    {
      name: 'mouseDownEvent',
      code: function(e) {
        // find event location in world coords
        var scale = Math.min(this.canvas.width / 1600,
                             this.canvas.height / 900);
        var x = (e.clientX - this.canvas.element.offsetLeft) / scale;
        var y = (e.clientY - this.canvas.element.offsetTop) / scale;

        // deliver to player based on quadrant
        var corner = [ x > 1600/2, y > 900/2 ];
        for (var i = 0; i < this.players.length; ++i) {
          if ( ( ( !!this.players[i].corner[0] ) == corner[0] ) &&
               ( ( !!this.players[i].corner[1] ) == corner[1] )) {
            this.players[i].clickEvent(x, y);
            break;
          }
        }
      }
    },
  ]
});
var g = tabletop.GameRunner.create();
window.onload = function() {
  var introbox = document.getElementById("intro");
  introbox.addEventListener("click", function() {
    g.audioStart();
    introbox.style.display = "none";
    setInterval(g.step, 16);
    setInterval(g.enemyWaves.data[0].install, 4000);
  });
};



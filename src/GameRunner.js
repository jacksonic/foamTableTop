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
  ],
  exports: [
    'worldDAO'
  ],
  properties: [
    {
      name: 'worldDAO',
      factory: function() {
        return this.SpatialHashDAO.create();
      }
    },
    {
      name: 'canvas',
      factory: function() {
        var c = this.Canvas.create({
          width:  document.body.clientWidth,
          height: document.body.clientHeight,
          id: 'game-runner'
        });
        c.cview = this.CView.create();
        return c;
      }
    },
    {
      name: 'time',
      defaultValue: 0
    }
  ],
  methods: [
    function init() {
      // create test entities
      var x, y;
      for (var k = 0; k < 100; ++k) {
        x = Math.random() * this.canvas.width,
        y = Math.random() * this.canvas.height,
        this.worldDAO.put(this.TestEntity.create({
          id: 'test'+k,
          x: x,
          y: y,
          x2: x+1,
          y2: y+1,
        }));
      }

      // make views
      var views = this.ArraySink.create();
      this.worldDAO.select(this.Map.create({ f: this.Entity.SPRITE.f, delegate: views }));
      this.canvas.cview.children = views.a;
    }
  ],
  listeners: [
    {
      name: 'step',
      isFramed: true,
      code: function() {
        this.time = Date.now();
        //this.canvas.cview.invalidated.publish();

        var self = this;
        this.worldDAO.select({
          put: function(o) {
            o.x += Math.random() * 2 - 1;
            o.y += Math.random() * 2 - 1;
            o.x2 = o.x + 1;
            o.y2 = o.y + 1;
            o.rotation += Math.random() * 0.02 - 0.01;
            self.worldDAO.put(o); // TODO: automate putting back in a framed listener
          }
        });
      }
    }
  ]
});
var g = tabletop.GameRunner.create();
document.body.innerHTML = g.canvas.toHTML() + '<img id="spritesheet" src="img/testspritesheet.png" height="4000px" width="4000px" style="display:none" />';
window.onresize = function() {
  g.canvas.width = document.body.clientWidth;
  g.canvas.height = document.body.clientHeight;
  g.canvas.element = g.canvas.element;
};
setInterval(g.step, 16);


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
  name: 'TestSprite',
  extends: 'foam.graphics.CView',
  implements: ['tabletop.Sprite'],
  properties: [
    [ 'imageIndex', 0 ],
    {
      name: 'imageElement',
      factory: function() {
        return document.getElementById('spritesheet');
      }
    },
    {
      name: 'bitblt',
      factory: function() {
        return spritesheetplot;
      }
    }
  ],
  methods: [
    function paintSelf(x) {
      var hw = window.innerWidth / 3840 / 2;
      var imageInfo = this.bitblt[this.imageIndex];
      x.drawImage(this.imageElement,imageInfo.left,imageInfo.top,imageInfo.width,imageInfo.height,
        -(imageInfo.centerX - imageInfo.left) * hw,
        -(imageInfo.centerY - imageInfo.top) * hw,
        imageInfo.width*hw*2,
        imageInfo.height*hw*2
      );
    }
  ]
});

foam.CLASS({
  package: 'tabletop',
  name: 'TestEntity',
  implements: ['tabletop.Entity' ],
  requires: [ 'tabletop.TestSprite' ],
  properties: [
    {
      name: 'sprite',
      factory: function() {
        this.propertyChange.subscribe(this.updateSprite);
        return this.TestSprite.create({
          x: this.x,
          y: this.y,
          rotation: this.rotation,
          imageIndex: 0,
        });
      }
    }
  ],
  listeners: [
    {
      /** This is standing in for buggy direct bindings */
      name: 'updateSprite',
      //isFramed: true, // ends up taking too much time
      code: function() {
        var s = this.sprite;
        s.x = this.x;
        s.y = this.y;
        s.rotation = this.rotation;
      }
    }
  ]
});

foam.CLASS({
  package: 'tabletop',
  name: 'BulletEntity',
  implements: ['tabletop.Entity' ],
  requires: [ 'tabletop.TestSprite' ],
  imports: ['canvas'],
  properties: [
    {
      name: 'sprite',
      factory: function() {
        this.propertyChange.subscribe(this.updateSprite);
        var s = this.TestSprite.create({
          x: this.x,
          y: this.y,
          rotation: this.rotation,
          imageIndex: 2,
        });
        this.canvas.get().cview.children.push(s);
        this.canvas.get().cview.addChild_(s);
        return s;
      }
    }
  ],

  methods: [
    /** Also check for out of bounds and destroy self */
    function moveStep(/* number // seconds since the last frame */ ft) {
      this.SUPER(ft);

      if ( this.x > 5000 || this.y > 3000 || this.x < -1000 || this.y < -1000 ) {
        this.worldDAO.get().remove(this);

        var childs = this.canvas.get().cview.children;
        var idx = childs.indexOf(this.sprite);
        if ( idx >= 0 ) { childs.splice(idx, 1); }
        this.canvas.get().cview.removeChild_(this.sprite);
      }
    },
  ],

  listeners: [
    {
      /** This is standing in for buggy direct bindings */
      name: 'updateSprite',
      //isFramed: true, // ends up taking too much time
      code: function() {
        var s = this.sprite;
        s.x = this.x;
        s.y = this.y;
        s.rotation = this.rotation;
      }
    }
  ]
});



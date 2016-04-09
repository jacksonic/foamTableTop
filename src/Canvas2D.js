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
  refines: 'foam.graphics.CView',

  methods: [
    function addChild(c) {
      cs = this.children;
      for (var i = 0; i < cs.length; ++i) {
        if ( cs[i] == c ) {
          return false;
        }
      }
      cs.push(c);
      this.addChild_(c);
      return true;
    },
    function removeChild(c) {
      cs = this.children;
      for (var i = 0; i < cs.length; ++i) {
        if ( cs[i] == c ) {
          this.removeChild_(c);
          cs.splice(i, 1);
          return true;
        }
      }
      return false;
    },
  ]
});


foam.CLASS({
  package: 'tabletop',
  name: 'ImageSprite',
  extends: 'foam.graphics.CView',
  implements: [
    'tabletop.Sprite'
  ],
  axioms: [ foam.pattern.Pooled.create() ],
  imports: [
    'time',
    'canvas',
  ],
  properties: [
    {
      name: 'transform',
      expression: function() { return null; }
    },
    { /** image to display */
      name: 'imageIndex'
    },
    { /** loop or terminating animation */
      name: 'loop',
      class: 'Boolean',
      value: false,
    },
    { /** framerate of animation, in milliseconds per frame */
      name: 'framerate',
      value: 33,
    },
    { /** last time the animation was updated */
      name: 'lastDrawn',
      value: 0,
    },
    { /** next frame in the animation to draw */
      name: 'nextFrame',
      value: 0,
    },
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
    function install() {
      this.canvas.cview.addChild(this);
    },

    function uninstall() {
      this.canvas.cview.removeChild(this);
    },

    function doTransform(x) {
      // quick path to skip caluclating the matrix
      x.translate(this.x, this.y);
      x.rotate(-this.rotation);
      x.scale(this.scaleX, this.scaleY);
    },
    function paintSelf(x) {
      var imageInfo = this.bitblt[this.imageIndex];
      if (Object.prototype.toString.apply(imageInfo.sequence) === '[object Array]') {
        if (this.lastDrawn + this.framerate < this.time) {
          if (this.nextFrame + 1 === imageInfo.sequence.length) {
            if (this.loop) {
              this.nextFrame = -1;
            } else {
              this.uninstall(); //code for terminating upon animation completion
              return;
            }
          }
          this.nextFrame++;
          this.lastDrawn = this.time;
        }
        x.drawImage(this.imageElement,imageInfo.sequence[this.nextFrame].left,imageInfo.sequence[this.nextFrame].top,imageInfo.sequence[this.nextFrame].width,imageInfo.sequence[this.nextFrame].height,
          -(imageInfo.sequence[this.nextFrame].centerX - imageInfo.sequence[this.nextFrame].left),
          -(imageInfo.sequence[this.nextFrame].centerY - imageInfo.sequence[this.nextFrame].top),
          imageInfo.sequence[this.nextFrame].width,
          imageInfo.sequence[this.nextFrame].height
        );
      }
      else {
        x.drawImage(this.imageElement,imageInfo.left,imageInfo.top,imageInfo.width,imageInfo.height,
          -(imageInfo.centerX - imageInfo.left),
          -(imageInfo.centerY - imageInfo.top),
          imageInfo.width,
          imageInfo.height
        );
      }
    }
  ]
});

/*foam.CLASS({
  package: 'tabletop',
  name: 'TestSprite',
  extends: 'foam.graphics.CView',
  implements: ['tabletop.ImageSprite'],
  properties: [
    [ 'imageIndex', 0 ],
  ]
});

foam.CLASS({
  package: 'tabletop',
  name: 'TestExplosion',
  extends: 'foam.graphics.CView',
  implements: ['tabletop.ImageSprite'],
  properties: [
    [ 'imageIndex', 8 ],
  ]
});*/

foam.CLASS({
  package: 'tabletop',
  name: 'TestEntity',
  requires: [
    'tabletop.ImageSprite',
    'tabletop.BasicController',
  ],
  extends: 'tabletop.Entity',
  imports: [
    'canvas'
  ],
  properties: [
    {
      name: 'sprite',
      factory: function() {
        this.propertyChange.sub(this.updateSprite);
        return this.ImageSprite.create({
          x: this.x,
          y: this.y,
          rotation: this.rotation,
          imageIndex: 0,
          scaleX: 0.4,
          scaleY: 0.4
        });
      }
    },
    {
      name: 'controller',
      factory: function() {
        return this.BasicController.create();
      }
    }
  ],
});

foam.CLASS({
  package: 'tabletop',
  name: 'TestBoom',
  extends: 'tabletop.Entity',
  requires: [
    'tabletop.ImageSprite',
    'tabletop.BasicController',
  ],
  imports: [
    'canvas'
  ],
  properties: [
    [ 'ax', 100 ],
    {
      name: 'controller',
      factory: function() {
        return this.BasicController.create();
      }
    },
    {
      name: 'sprite',
      factory: function() {
        this.propertyChange.sub(this.updateSprite);
        return this.ImageSprite.create({
          x: this.x,
          y: this.y,
          rotation: this.rotation,
          imageIndex: 8,
          loop: true,
          framerate:33,
          scaleX: 0.2,
          scaleY: 0.2
        });
      }
    },
  ],
});


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
  name: 'ImageSprite',
  extends: 'foam.graphics.CView',
  implements: ['tabletop.Sprite'],
  imports: [
    'time'
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
      defaultValue: false,
    },
    { /** framerate of animation, in milliseconds per frame */
      name: 'framerate',
      defaultValue: 33,
    },
    { /** last time the animation was updated */
      name: 'lastDrawn',
      defaultValue: 0,
    },
    { /** next frame in the animation to draw */
      name: 'nextFrame',
      defaultValue: 0,
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
    function doTransform(x) {
      // quick path to skip caluclating the matrix
      x.translate(this.x, this.y);
      x.rotate(-this.rotation);
      x.scale(this.scaleX, this.scaleY);
    },
    function paintSelf(x) {
      var hw = 0.2;
      var imageInfo = this.bitblt[this.imageIndex];
      if (Object.prototype.toString.apply(imageInfo.sequence) === '[object Array]') {
        if (this.lastDrawn + this.framerate < this.time) {
          if (this.nextFrame + 1 === imageInfo.sequence.length) {
            if (this.loop) {
              this.nextFrame = -1;
            } else {
              this.x = 99999; //code for terminating upon animation completion // TODO destroy properly
              return;
            }
          }
          this.nextFrame++;
          this.lastDrawn = this.time;
        }
        x.drawImage(this.imageElement,imageInfo.sequence[this.nextFrame].left,imageInfo.sequence[this.nextFrame].top,imageInfo.sequence[this.nextFrame].width,imageInfo.sequence[this.nextFrame].height,
          -(imageInfo.sequence[this.nextFrame].centerX - imageInfo.sequence[this.nextFrame].left) * hw,
          -(imageInfo.sequence[this.nextFrame].centerY - imageInfo.sequence[this.nextFrame].top) * hw,
          imageInfo.sequence[this.nextFrame].width*hw*2,
          imageInfo.sequence[this.nextFrame].height*hw*2
        );
      }
      else {
        x.drawImage(this.imageElement,imageInfo.left,imageInfo.top,imageInfo.width,imageInfo.height,
          -(imageInfo.centerX - imageInfo.left) * hw,
          -(imageInfo.centerY - imageInfo.top) * hw,
          imageInfo.width*hw*2,
          imageInfo.height*hw*2
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
  requires: [ 'tabletop.ImageSprite' ],
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
          imageIndex: 8,
          //loop: true,
          framerate: 200,
        });
      }
    },
  ],
});


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
  name: 'imageSprite',
  extends: 'foam.graphics.CView',
  implements: ['tabletop.Sprite'],
  imports: [
    'time'
  ],
  properties: [
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
    function paintSelf(x) {
      var hw = window.innerWidth / 3840 / 2;
      var imageInfo = this.bitblt[this.imageIndex];
      if (Object.prototype.toString.apply(imageInfo.sequence) === '[object Array]') {
        if (this.lastDrawn + this.framerate < this.time) {
          if (this.nextFrame === imageInfo.sequence.length) {
            if (this.loop) {
              this.nextFrame = 0;
            } else {
             //this.destroy() //code for terminating upon animation completion
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
  implements: ['tabletop.imageSprite'],
  properties: [
    [ 'imageIndex', 0 ],
  ]
});

foam.CLASS({
  package: 'tabletop',
  name: 'TestExplosion',
  extends: 'foam.graphics.CView',
  implements: ['tabletop.imageSprite'],
  properties: [
    [ 'imageIndex', 8 ],
  ]
});*/

foam.CLASS({
  package: 'tabletop',
  name: 'TestEntity',
  implements: ['tabletop.Entity' ],
  requires: [ 'tabletop.imageSprite' ],
  imports: [
    'canvas'
  ],
  properties: [
    {
      name: 'sprite',
      factory: function() {
        this.propertyChange.sub(this.updateSprite);
        return this.imageSprite.create({
          x: this.x,
          y: this.y,
          rotation: this.rotation,
          imageIndex: 0,
        });
      }
    }
  ],
  methods: [
    /** Also check for out of bounds and destroy self */
    function moveStep(/* number // seconds since the last frame */ ft) {
      this.SUPER(ft);

      if ( this.x > 1101 || this.y > 801 || this.x < -101 || this.y < -101 ) {
        //this.destroy();
        this.vx = 0;
        this.vy = 0;
        switch (Math.floor(Math.random() * 4)) {
        case 0:
          this.x = -100;
          this.y = 350 + Math.random() * 50;
          this.ax = 40 + Math.random()*50;
          this.ay = 0;
          this.rotation = Math.PI*1.5;
          break;
        case 1:
          this.x = 1100;
          this.y = 350 + Math.random() * 50;
          this.ax = -(40 + Math.random()*50);
          this.ay = 0;
          this.rotation = Math.PI*0.5;
          break;
        case 2:
          this.y = -80;
          this.x = 500 + Math.random() * 50;
          this.ax = 0;
          this.ay = 40 + Math.random()*50;
          this.rotation = Math.PI;
          break;
        case 3:
          this.y = 800;
          this.x = 500 + Math.random() * 50;
          this.ax = 0;
          this.ay = -(40 + Math.random()*50);
          this.rotation = 0;
          break;
        };
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
foam.CLASS({
  package: 'tabletop',
  name: 'TestBoom',
  implements: ['tabletop.Entity' ],
  requires: [ 'tabletop.imageSprite' ],
  imports: [
    'canvas'
  ],
  properties: [
    {
      name: 'sprite',
      factory: function() {
        this.propertyChange.sub(this.updateSprite);
        return this.imageSprite.create({
          x: this.x,
          y: this.y,
          rotation: this.rotation,
          imageIndex: 8,
          loop: true,
          framerate: 100,
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
        /*s.x = this.x;
        s.y = this.y;
        s.rotation = this.rotation;*/
      }
    }
  ]
});


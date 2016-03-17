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
    [ 'image', 'spritesheet' ],
    {
      name: 'imageElement',
      factory: function() {
        return document.getElementById(this.image);
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
      var hw = window.innerWidth / 3840;
      x.drawImage(this.imageElement,this.bitblt[0].left,this.bitblt[0].top,this.bitblt[0].width,this.bitblt[0].height, -this.bitblt[0].width, -this.bitblt[0].height, this.bitblt[0].width*hw, this.bitblt[0].height*hw);
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
          rotation: this.rotation
        });
      }
    }
  ],
  listeners: [
    {
      /** This is standing in for buggy direct bindings, though being framed is handy */
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




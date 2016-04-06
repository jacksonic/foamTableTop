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
  name: 'PlayerController',
  extends: 'tabletop.EntityController',
  requires: [
    'tabletop.BulletController',
    'tabletop.Entity',
  ],
  constants: {
    SHOT_COOL_DOWN: 0.1
  },
  properties: [
    [ 'coolDown', 1 ],
    {
      name: 'target',
      factory: function() { return { x: 800, y: 450 }; }
    },
    
    
  ],

  methods: [
    /** Applies movement and physics calculations required for a frame. */
    function move() {
      // Doesn't move, no super
      
      this.coolDown -= this.frameTime;
      if ( this.coolDown < 0 ) {
        this.coolDown = this.SHOT_COOL_DOWN;
        this.shoot();
      }
    },
  ],

  listeners: [
    {
      name: 'shoot',
      code: function() {
        var e = this.owner;
        var b = this.Entity.create({
          x: e.x,
          y: e.y,
          br: 3,
          bplane: 1,
          collisionPlane: 0,
          rotation: e.rotation,
          manager: e,
          controller: this.BulletController.create(),
        });
        b.damage.damaging = true;
        b.damage.hurt = 1;
        
        // TODO: clean up sprite init
        b.sprite.x = e.x;
        b.sprite.y = e.y;
        b.sprite.rotation = e.rotation;
        b.sprite.imageIndex = 2;
        b.sprite.scaleX = 0.2;
        b.sprite.scaleY = 0.2;
        
        this.aimTowards({ x: this.target.x, y: this.target.y }, b, 1000, Math.random() * 0.2 - 0.1);
        e.rotation = b.rotation + Math.PI; // TODO: off by 180?
        b.install();
        e.audioManager.play("impact", e);
      }
    }
  ]
});


foam.CLASS({
  package: 'tabletop',
  name: 'PlayerManager',
  extends: 'tabletop.EntityManager',
  requires: [
    'tabletop.Entity',
    'tabletop.ImageSprite',
    'tabletop.Hull',
    'tabletop.PlayerController'
  ],
  imports: [
    'worldDAO',
    'worldWidth',
    'worldHeight',
  ],
  properties: [
    {
      name: 'main',
      factory: function() {
        return this.Entity.create({ 
          id: 'player' + this.$UID,
          bplane: 3,
          vx: 1,
          br: 30,
          sprite: this.ImageSprite.create({
            x: this.x,
            y: this.y,
            rotation: this.rotation,
            imageIndex: 0,
          }),
          hull: this.Hull.create({
            basehp: 10,
            currhp: 10
          }),
          controller: this.PlayerController.create()
        });
      }
    },
    {
      name: 'corner',
      factory: function() { return [0,0]; },
      postSet: function(old,nu) {
        this.main.x = nu[0] ? 1600 - 20 : 20;
        this.main.y = nu[1] ? 900 - 20 : 20;
        this.main.rotation = Math.PI * ( nu[0] ? 1 : -1 ) * ( nu[1] ? 1/4 : 3/4 );
      }
    }

  ],
  methods: [
    function init() {
      this.main.install();
      this.corner = this.corner;
      this.main.onDestroy(this.clearEntity);
    },
    /** Click/tap from user, in world coordinates */
    function clickEvent(x,y) {
      console.log('player click', this.corner, x, y);

      this.main.controller.target = { x: x, y: y };
    }
  ],
  listeners: [
    {
      name: 'clearEntity',
      code: function() {
        this.main = null;
      }
    }
  ]
});

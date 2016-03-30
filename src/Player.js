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
  name: 'PlayerEntity',
  extends: 'tabletop.Entity',
  implements: [
    'tabletop.Physics'
  ],
  requires: [
    'tabletop.ImageSprite',
    'tabletop.BulletEntity',
    'foam.core.ObjectPool',
  ],
  imports: [
    'canvas',
    'audioManager',
  ],
  constants: {
    SHOT_COOL_DOWN: 0.1
  },
  properties: [
    {
      name: 'sprite',
      factory: function() {
        //this.propertyChange.sub(this.updateSprite);
        var s = this.ImageSprite.create({
          x: this.x,
          y: this.y,
          rotation: this.rotation,
          imageIndex: 0,
        });
        this.canvas.cview.children.push(s);
        //this.canvas.cview.addChild_(s);
        return s;
      }
    },
    {
      name: 'moveRequired',
      getter: function() { return true; }
    },
    [ 'coolDown', 1 ],
    {
      name: 'bulletPool',
      factory: function() { return this.ObjectPool.create({
        of: this.BulletEntity,
        resetArgs: {
          x: 99999
        }
      }); }
    },
  ],

  methods: [
    /** Applies movement and physics calculations required for a frame. */
    function moveStep(/* number // seconds since the last frame */ ft) {
      this.SUPER(ft);

      // Doesn't move
      this.coolDown -= ft;
      if ( this.coolDown < 0 ) {
        this.coolDown = this.SHOT_COOL_DOWN;
        this.shoot();
      }
    },
    function returnToPool(e) {
      this.worldDAO.remove(e);
      this.bulletPool.push(e);
    },
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
    },
    {
      name: 'shoot',
      code: function() {
        var b = this.bulletPool.pop({
            x: this.x,
            y: this.y,
            rotation: this.rotation,
            manager: this,
          });
        this.aimTowards({ x: Math.random()*200+400, y: Math.random()*200+250 }, b, 400);
        b.sprite;
        this.worldDAO.put(b);
        this.audioManager.play("impact", this);
      }
    }
  ]
});


foam.CLASS({
  package: 'tabletop',
  name: 'BulletEntity',
  extends: 'tabletop.Entity',
  requires: [
    'tabletop.ImageSprite',
    'tabletop.BulletController',
  ],
  imports: ['canvas'],
  properties: [
    [ 'br', 3 ],
    {
      name: 'sprite',
      factory: function() {
        //this.propertyChange.sub(this.updateSprite);
        var s = this.ImageSprite.create({
          x: this.x,
          y: this.y,
          rotation: this.rotation,
          imageIndex: 2,
        });
        this.canvas.cview.children.push(s);
        //this.canvas.cview.addChild_(s);
        return s;
      }
    },
    {
      name: 'controller',
      factory: function() {
        return this.BulletController.create();
      },
    }
  ],
});



foam.CLASS({
  package: 'tabletop',
  name: 'PlayerManager',
  extends: 'tabletop.EntityManager',
  requires: [
    'tabletop.PlayerEntity',
  ],
  imports: [
    'worldDAO',
  ],
  properties: [
    {
      name: 'main',
      factory: function() {
        return this.PlayerEntity.create();
      }
    },
    {
      name: 'corner',
      factory: function() { return [0,0]; },
      postSet: function(old,nu) {
        this.main.x = nu[0] ? 1000 - 20 : 20;
        this.main.y = nu[1] ? 700 - 20 : 20;
        this.main.rotation = Math.PI * ( nu[0] ? 1 : -1 ) * ( nu[1] ? 1/4 : 3/4 );
      }
    }

  ],
  methods: [
    function init() {
      this.worldDAO.put(this.main);
      this.corner = this.corner;
      this.main.sprite;
    }
  ],
});

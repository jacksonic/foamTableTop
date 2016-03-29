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
  implements: [
    'tabletop.Entity',
    'tabletop.Physics'
  ],
  requires: [
    'tabletop.imageSprite',
    'tabletop.BulletEntity',
  ],
  imports: [
    'canvas',
    'audioManager',
  ],
  constants: {
    SHOT_COOL_DOWN: 0.3
  },
  properties: [
    {
      name: 'sprite',
      factory: function() {
        //this.propertyChange.sub(this.updateSprite);
        var s = this.imageSprite.create({
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
      factory: function() { return []; }
    },
  ],

  methods: [
    /** Applies movement and physics calculations required for a frame. */
    function moveStep(/* number // seconds since the last frame */ ft) {
      this.updateSprite();

      // Doesn't move
      this.coolDown -= ft;
      if ( this.coolDown < 0 ) {
        this.coolDown = this.SHOT_COOL_DOWN;
        this.shoot();
      }
    },
    function returnToPool(e) {
      this.bulletPool.push(e);
      e.x = 9999999;
      this.worldDAO.remove(e);
    },
    function grabFromPool(args) {
      if (this.bulletPool.length) {
        var b = this.bulletPool.splice(-1, 1)[0];
        for (var key in args) {
          b[key] = args[key];
        }
        return b;
      } else {
        return this.BulletEntity.create(args);
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
    },
    {
      name: 'shoot',
      code: function() {
        var b = this.grabFromPool({
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
  implements: ['tabletop.Entity' ],
  requires: [ 'tabletop.imageSprite' ],
  imports: ['canvas'],
  properties: [
    [ 'br', 3 ],
    {
      name: 'sprite',
      factory: function() {
        this.propertyChange.sub(this.updateSprite);
        var s = this.imageSprite.create({
          x: this.x,
          y: this.y,
          rotation: this.rotation,
          imageIndex: 2,
        });
        this.canvas.cview.children.push(s);
        //this.canvas.cview.addChild_(s);
        return s;
      }
    }
  ],

  methods: [
    /** Also check for out of bounds and destroy self */
    function moveStep(/* number // seconds since the last frame */ ft) {
      this.SUPER(ft);

      if ( this.x > 1100 || this.y > 800 || this.x < -100 || this.y < -100 ) {
        //this.destroy();
        this.manager.returnToPool(this);
      }
    },
  ],

  listeners: [
    {
      name: 'collideWith',
      code: function(e) {
        if ( this === e ) return;

        // don't collide with other bullets
        if ( this.cls_.isInstance(e) || tabletop.PlayerEntity.isInstance(e) ) return;

        // cheat to only check one of each pair of colliders, only check the one with the smaller X
        // this is not required for things that collide with only certain classes of other things (bullets)
        // moveRequired indicates that the other entity will have collision checking done
        //if ( this.x > e.x && e.moveRequired ) return;

        //TODO: hurt e

        //play impact sound
        this.audioManager.play("impact", this);

        // position angle
        var ax = this.x - e.x, ay = this.y - e.y;
        var len = Math.sqrt(ax*ax+ay*ay) || 1;
        ax = ax / len; // normal vector for direction between the ents
        ay = ay / len;

        // velocity based
        var dx = (this.vx - e.vx),
            dy = (this.vy - e.vy);
        var vlen = (Math.sqrt(dx*dx+dy*dy) || 1) / 2;

        this.x = 9999999; // remove self

        e.vx = -ax * vlen;
        e.vy = -ay * vlen;
      }
    },
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

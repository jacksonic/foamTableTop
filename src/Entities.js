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
  Base class for entities. Includes world position, rendering information, etc.
*/
foam.CLASS({
  package: 'tabletop',
  name: 'Entity',
  extends: 'foam.mlang.Expressions',
  imports: [
    'worldDAO',
    'audioManager',
    'canvas',
  ],

  properties: [
    {
      name: 'id',
      factory: function() { return this.$UID; }
    },
    { /** World coords */
      class: 'Simple',
      name: 'x',
    },
    { /** World coords */
      class: 'Simple',
      name: 'y',
    },
    { /** World relative */
      class: 'Simple',
      name: 'rotation',
    },

    { /** x velocity, world units/sec */
      class: 'Simple',
      name: 'vx',
    },
    { /** y velocity, world units/sec */
      class: 'Simple',
      name: 'vy',
    },
    { /** rotational velocity, radians/sec */
      class: 'Simple',
      name: 'vrotation',
    },

    { /** x acceleration, world units/sec */
      class: 'Simple',
      name: 'ax',
    },
    { /** y acceleration, world units/sec */
      class: 'Simple',
      name: 'ay',
    },
    { /** rotational acceleration, radians/sec */
      class: 'Simple',
      name: 'arotation',
    },

    { /** Computed, true if a new moveStep() call is needed */
      name: 'moveRequired',
      getter: function() {
        return !! (this.vx || this.vy || this.vrotation ||
          this.ax || this.ay || this.arotation);
      }
    },

    { /** Bounding box size (radius from x,y) */
      name: 'br',
    },
    { /** Axis aligned bounding box, World coords */
      name: 'bx',
      getter: function() {
        return this.x - this.br;
      }
    },
    { /** AABB, World coords */
      name: 'by',
      getter: function() {
        return this.y - this.br;
      }
    },
    { /** AABB, World coords */
      name: 'bx2',
      getter: function() {
        return this.x + this.br;
      }
    },
    { /** AABB, World coords */
      name: 'by2',
      getter: function() {
        return this.y + this.br;
      }
    },
    {
      /** AABB, third dimension: player, bullet, enemy, etc. */
      class: 'Simple',
      name: 'bplane',
    },
    {
      /** AABB, by default objects occupy a single plane */
      name: 'bplane2',
      getter: function() { return this.bplane; }
    },
    {
      /** The EntityManager that owns this entity. */
      name: 'manager'
    },
    {
      /** The renderable Sprite for this entity. */
      name: 'sprite'
    },
    {
      /** The plane to check for collisions against */
      class: 'Simple',
      name: 'collisionPlane',
    },
    {
      /** The bounding box of the collision target area. (search
        for entities in this box when colliding) */
      name: 'targetBounds_',
      factory: function() {
//         var proxy = Object.create(this);
//         proxy.bplane = this.collisionPlane;
//         proxy.bplane2 = this.collisionPlane;
//         return proxy;
        return this;
//         var self = this;
//         var obj = { owner_: this };
//         Object.defineProperty(obj, 'bx', { get: function() { return this.owner_.bx; } });
//         Object.defineProperty(obj, 'by', { get: function() { return this.owner_.by; } });

//         Object.defineProperty(obj, 'bx2', { get: function() { return this.owner_.bx2; } });
//         Object.defineProperty(obj, 'by2', { get: function() { return this.owner_.by2; } });

//         Object.defineProperty(obj, 'bplane', { get: function() { return this.owner_.collisionPlane; } });
//         Object.defineProperty(obj, 'bplane2', { get: function() { return this.owner_.collisionPlane; } });
//         return obj;
      }
    },
    {
      name: 'overlappingEntities',
      factory: function() {
        return this.worldDAO.where(this.INTERSECTS(
          this.worldDAO.space,
          this.BY_REF(this.targetBounds_)
        ));
      }
    }
  ],

  methods: [
    function init() {
      this.x = this.x || 0;
      this.y = this.y || 0;
      this.rotation = this.rotation || 0;
      this.vx = this.vx || 0;
      this.vy = this.vy || 0;
      this.vrotation = this.vrotation || 0;
      this.ax = this.ax || 0;
      this.ay = this.ay || 0;
      this.arotation = this.arotation || 0;

      this.br = this.br || 10;
      this.bplane = this.bplane || 0;
      this.collisionPlane = this.collisionPlane || 0;
    },

    /** Applies movement and physics calculations required for a frame. */
    function moveStep(/* number // seconds since the last frame */ ft) {
      /** Changes velocity of the given entity. */
      this.vx += this.ax * ft;
      this.vy += this.ay * ft;
      this.vrotation += this.arotation * ft;

      /** Changes position of the given entity. */
      this.x += this.vx * ft;
      this.y += this.vy * ft;
      this.rotation += this.vrotation * ft;

      this.collide();

      this.updateSprite();
      this.worldDAO.put(this);
    },

    function destroy() {
      this.worldDAO.remove(this);

      var childs = this.canvas.cview.children;
      var idx = childs.indexOf(this.sprite);
      if ( idx >= 0 ) { childs.splice(idx, 1); }
      //this.canvas.cview.removeChild_(this.sprite);

      //this.propertyChange.unsubscribe(this.updateSprite);
    }
  ],

  listeners: [
    /** Checks for collisions with nearby entities */
    {
      name: 'collide',
      //isMerged: true,
      //mergeDelay: 500,
      code: function() {
        if ( Math.random() > 0.33 ) return; // skip out on random checks to save time

        var self = this;
        // TODO: radius check too
        this.overlappingEntities.select({
          put: function(e) {
            self.collideWith(e)
          },
          remove: function() {},
          error: function() {},
          eof: function() {},
        });
      }
    },
    {
      name: 'collideWith',
      code: function(e) {
        if ( this === e ) return;

        // cheat to only check one of each pair of colliders, only check the one with the smaller X
        // this is not required for things that collide with only certain classes of other things (bullets)
        // moveRequired indicates that the other entity will have collision checking done
        if ( this.x > e.x && e.moveRequired ) return;

        // position based
        // var dx = this.x - e.x, dy = this.y - e.y;
        // var len = Math.sqrt(dx*dx+dy*dy) || 1;
        //
        // var nx = -(dx / len) * (this.br - len);
        // var ny = -(dy / len) * (this.br - len);
        // this.vx += nx;
        // this.vy += ny;
        // e.vx -= nx;
        // e.vy -= ny;

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

        this.vx = (ax * vlen);
        this.vy = (ay * vlen);
        e.vx = -ax * vlen;
        e.vy = -ay * vlen;
      }
    }
  ]
});

/**
  Base class for entity Sprites. Sprites can form trees, so a single
  Sprite for an Entity may have many sub-sprites inside, which the entity
  may control (turrets, for instance)
*/
foam.CLASS({
  package: 'tabletop',
  name: 'Sprite',
  properties: [
    { /** Rendering coords */
      name: 'x'
    },
    { /** Rendering coords */
      name: 'y'
    },
    { /** Parent sprite relative */
      name: 'rotation'
    },
//     {
//       /** The entity that owns this sprite. */
//       name: 'entity'
//     },
    // TODO: image, offset....
  ],
});

/**
  Base class for a thing that manages a group of entities. Such things include
  human players, computer enemy waves, and bullet groups.
*/
foam.CLASS({
  package: 'tabletop',
  name: 'EntityManager',
  requires: [
    'tabletop.Entity',
  ],
  properties: [
    {
      /** The group of managed entities */
      name: 'entities',
      class: 'foam.core.Array',
      of: 'tabletop.Entity',
    }
  ],
});

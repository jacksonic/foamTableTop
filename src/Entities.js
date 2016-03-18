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
  requires: [
    'foam.mlang.Expressions',
	'tabletop.Audio',
  ],
  imports: [
    'worldDAO',
  ],

  properties: [
    {
      name: 'id',
      factory: function() { return this.$UID; }
    },
    { /** World coords */
      name: 'x',
      defaultValue: 0,
    },
    { /** World coords */
      name: 'y',
      defaultValue: 0,
    },
    { /** World relative */
      name: 'rotation',
      defaultValue: 0,
    },

    { /** x velocity, world units/sec */
      name: 'vx',
      defaultValue: 0,
    },
    { /** y velocity, world units/sec */
      name: 'vy',
      defaultValue: 0,
    },
    { /** rotational velocity, radians/sec */
      name: 'vrotation',
      defaultValue: 0,
    },

    { /** x acceleration, world units/sec */
      name: 'ax',
      defaultValue: 0,
    },
    { /** y acceleration, world units/sec */
      name: 'ay',
      defaultValue: 0,
    },
    { /** rotational acceleration, radians/sec */
      name: 'arotation',
      defaultValue: 0,
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
      defaultValue: 10
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
      /** The EntityManager that owns this entity. */
      name: 'manager'
    },
    {
      /** The renderable Sprite for this entity. */
      name: 'sprite'
    },

    {
      name: 'overlappingEntities',
      factory: function() {
        var m = this.Expressions.create();
        var self = this;
        var bx =  { f: function() { return self.bx;  } };
        var by =  { f: function() { return self.by;  } };
        var bx2 = { f: function() { return self.bx2; } };
        var by2 = { f: function() { return self.by2; } };
        // TODO: this should be an intersect mlang
        // TODO: radius check too
        return this.worldDAO.get().where(m.AND(
          m.GTE(this.cls_.BX2, bx), m.LTE(this.cls_.BX, bx2),
          m.GTE(this.cls_.BY2, by), m.LTE(this.cls_.BY, by2)
        ));
      }
    }
  ],

  methods: [
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
    },
  ],

  listeners: [
    /** Checks for collisions with nearby entities */
    {
      name: 'collide',
      //isMerged: true,
      //mergeDelay: 500,
      code: function() {
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
		impact.playInstance();
        var dx = this.x - e.x, dy = this.y - e.y;
        var len = Math.sqrt(dx*dx+dy*dy) || 1;
//if ( len > 40 ) console.log("long length", len, this, e);
        this.vx = -(dx / len) * (this.br - len);
        this.vy = -(dy / len) * (this.br - len);
        e.vx = -this.vx;
        e.vy = -this.vy;
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


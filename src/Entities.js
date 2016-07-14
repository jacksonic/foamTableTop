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
  //axioms: [    foam.pattern.Pooled.create(),  ], // still some dangling references left when re-using entities
  requires: [
    'tabletop.EntityController',
    'tabletop.Sprite',
    'tabletop.ImageSprite',
    'tabletop.Hull',
    'tabletop.Damage',
    'tabletop.Engine',
  ],
  imports: [
    'worldDAO',
    'audioManager',
    'canvas',
    'worldWidth',
    'worldHeight',
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

    {
      name: 'mass',
      value: 1,
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
      name: 'sprite',
      factory: function() {
        return this.ImageSprite.create();
      },
      adapt: function(old,nu) {
        if ( ! nu.cls_ ) {
          return this.ImageSprite.create(nu);
        }
        return nu;
      }
    },
    {
      /** The controller responsible to moving/targetting the entity */
      name: 'controller',
      postSet: function(old,nu) {
        if ( old ) { old.owner = null; old.destroy(); }
        if ( nu ) { nu.owner = this; }
      }
    },
    {
      /** the object pool this entity should be returned to */
      name: 'objectPool'
    },
    {
      /** The single plane to check for collisions against // TODO: allow multiple? */
      class: 'Simple',
      name: 'collisionPlane',
    },
    {
      /** The bounding box of the collision target area. (search
        for entities in this box when colliding) */
      name: 'targetBounds_',
      factory: function() {
        // TODO: make this a proxy
        var obj = Object.create(this.BOUNDS_WRAPPER);
        obj.owner_ = this;
        return obj;
      }
    },
    {
      /** select from this DAO to get the entities that overlap this one */
      name: 'overlappingEntities',
      factory: function() {
        return this.worldDAO.where(this.INTERSECTS(
          this.worldDAO.space,
          this.BY_REF(this.targetBounds_)
        ));
      }
    },
    {
      name: 'hull',
      factory: function() {
        return this.Hull.create();
      },
      adapt: function(old,nu) {
        if ( ! nu.cls_ ) {
          return this.Hull.create(nu);
        }
        return nu;
      }
    },
    {
      name: 'damage',
      factory: function() {
        return this.Damage.create();
      },
      adapt: function(old,nu) {
        if ( ! nu.cls_ ) {
          return this.Damage.create(nu);
        }
        return nu;
      }
    },
    {
      name: 'engine',
      factory: function() {
        return this.Engine.create();
      },
      adapt: function(old,nu) {
        if ( ! nu.cls_ ) {
          return this.Engine.create(nu);
        }
        return nu;
      }
    },

  ],

  constants: {
    /** Experimental proxy thing, to change the apparent bplane of the object to its collisionPlane */
    BOUNDS_WRAPPER: (function() {
        var obj = {};
        Object.defineProperty(obj, 'bx', { get: function() { return this.owner_.bx; } });
        Object.defineProperty(obj, 'by', { get: function() { return this.owner_.by; } });

        Object.defineProperty(obj, 'bx2', { get: function() { return this.owner_.bx2; } });
        Object.defineProperty(obj, 'by2', { get: function() { return this.owner_.by2; } });
        // redirect collisionPlane's value into bplane for colliding
        Object.defineProperty(obj, 'bplane', { get: function() { return this.owner_.collisionPlane; } });
        Object.defineProperty(obj, 'bplane2', { get: function() { return this.owner_.collisionPlane; } });
        return obj;
      })()
  },

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

      this.onDestroy(this.clearSubModules);
    },

    /** Applies movement and physics calculations required for a frame. */
    function moveStep(/* number // seconds since the last frame */ ft) {
      this.controller && this.controller.frameStep(ft);
    },

    function install() {
      this.worldDAO.put(this);
      this.sprite.install();
    },

    function uninstall() {
      this.destroy();
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
    },
    {
      name: 'clearSubModules',
      code: function() {
        this.controller = null;
        this.worldDAO.remove(this);
        this.sprite.uninstall();

      }
    }
  ]
});


/**
  Interface for entity Sprites. Sprites can form trees, so a single
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
  methods: [
    /** Adds the sprite to the scene */
    function install() {

    },
    /** Removes the sprite from the scene */
    function uninstall() {

    }
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
      class: 'foam.core.FObjectArray',
      of: 'tabletop.Entity',
    }
  ],
});

foam.CLASS({
  package: 'tabletop',
  name: 'Engine',
  axioms: [
    foam.pattern.Pooled.create(),
  ],
  properties: [
    {
      name: 'thrust',
      value: 0,
    },
  ],
  methods: [
    function applyThrust(e) {
      var v = this.thrust / e.mass;
      if ( ! v ) return;
      var a = e.rotation;
      e.ax = v*Math.cos(a);
      e.ay = v*Math.sin(a);
    }
  ]
})

foam.CLASS({
  package: 'tabletop',
  name: 'Hull',
  axioms: [
    foam.pattern.Pooled.create(),
  ],
  properties: [
    {
      /** can actually take hitpoint damage */
      name: 'destroyable',
      value: true,
    },
    {
      /** order for default damage application */
      name: 'order',
      value: 0,
    },
    {
      /** base starting HP */
      name: 'basehp',
      value: 1,
    },
    {
      /** current HP */
      name: 'currhp',
      value: 1,
    },
  ],
  methods: [
    function heal(amount) {
      if ( this.currhp < this.basehp ) {
        this.currhp += 1;
      }
    }
  ]
});
foam.CLASS({
  package: 'tabletop',
  name: 'Damage',
  requires: [
    'tabletop.ExplodingController',
  ],
  imports: [
    'worldDAO'
  ],

  topics: [
    'killed',
  ],
  axioms: [
    foam.pattern.Pooled.create(),
  ],
  properties: [
    {
      /** does this deal damage on impact */
      name: 'damaging',
      value: false,
    },
    {
      /** damage type. */
      name: 'type',
      value: 'untyped',
    },
    {
      /** source entity for projectile/damage */
      name: 'source',
    },
    {
      /** hit point damage */
      name: 'hurt',
      value: 0,
    },
    {
      /** radius if an area damage weapon. 0 if not*/
      name: 'blast',
      value: 0,
    },
    {
      /** any special modifers*/
      name: 'modifers',
      value: false,
    },
  ],
  methods: [
    /** destroys the entity */
    function iHitYou(o) {
      if ( ! o.controller ) {
        console.log("Removed bad collider", o.$UID);
        this.worldDAO.remove(o);
        return; //TODO: clean up life cycle
      }
      if (this.damaging) {
        if (o.hull.destroyable) {
          //checks for immunities, special conditions or resistances on-hit go here
          o.hull.currhp -= this.hurt;
          //checks for triggering hit consequences go here
          if (o.hull.currhp <= 0) {
            o.sprite.imageIndex = 8;
            o.sprite.loop = false;
            o.sprite.framerate = 60;
            o.controller = this.ExplodingController.create({ timeToLive: 0.3 }, o);

            this.killed.pub(o);
          }
        }
      }
    },
  ],
});


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
    'tabletop.Point',
    'tabletop.RadialBoundingBox',
    'tabletop.ProxyBoundingBox',
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
      factory: function() { return ""+this.$UID; }
    },
    {
      class: 'foam.geo.PointProperty',
      of: 'tabletop.Point',
      name: 'location',
      factory: function() { return this.Point.create(); }
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
    {
      class: 'foam.geo.BoundingBoxProperty',
      of: 'tabletop.Point',
      name: 'bounds',
      factory: function() { 
        var ret = this.RadialBoundingBox.create(); 
        ret.location$.linkFrom(this.location$);
        ret.radius$.linkFrom(this.br$);
        return ret;
      }
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
      },
      postSet: function(o, n) {
        n.owner = this;
        if ( o && ( o.owner === this ) ) o.owner = null;
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
      expression: function(bounds, collisionPlane) {
        return this.ProxyBoundingBox.create({
          source: bounds,
          overridePlane: collisionPlane
        })
      }
    },
    {
      /** select from this DAO to get the entities that overlap this one */
      name: 'overlappingEntities',
      factory: function() {
        return this.worldDAO.where(this.INTERSECTS(
          this.BOUNDS,
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

  methods: [
    function init() {
      this.location.x = this.location.x || 0;
      this.location.y = this.location.y || 0;
      this.rotation = this.rotation || 0;
      this.vx = this.vx || 0;
      this.vy = this.vy || 0;
      this.vrotation = this.vrotation || 0;
      this.ax = this.ax || 0;
      this.ay = this.ay || 0;
      this.arotation = this.arotation || 0;

      this.br = this.br || 10;
      this.collisionPlane = this.collisionPlane || 0;

      this.onDestroy(this.clearSubModules);
    },

    function pooledDestroy() {
      this.location.x = 0;
      this.location.y = 0;
      this.rotation = 0;
      this.vx = 0;
      this.vy = 0;
      this.vrotation = 0;
      this.ax = 0;
      this.ay = 0;
      this.arotation = 0;

      this.br = 10;
      this.collisionPlane = 0;

      this.controller = undefined;
      this.hull = undefined;
      this.damage = undefined;
      this.engine = undefined;
      this.manager = undefined;
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
    },

  ],
  listeners: [
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
    { /** owner entity, must have x,y,rotation */
      name: 'owner'
    },
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
    },
    function pooledDestroy() {
      this.thrust = 0;
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
    },
    function pooledDestroy() {
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
            o.sprite.imageIndex = 'explosion';
            o.sprite.loop = false;
            o.sprite.framerate = 60;
            o.controller = this.ExplodingController.create({ timeToLive: 0.3 }, o);
            o.audioManager.play("Big_Explosion_Cut_Off", o);
            this.killed.pub(o);
          }
        }
      }
    },
    function pooledDestroy() {
      this.hurt = 0;
    }

  ],
});


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
    { /** World coords */
      name: 'x2',
      defaultValue: 0,
    },
    { /** World coords */
      name: 'y2',
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
    { /** World relative */
      name: 'rotation',
      defaultValue: 0,
    },
    {
      /** The EntityManager that owns this entity. */
      name: 'manager'
    },
    {
      /** The renderable Sprite for this entity. */
      name: 'sprite'
    },
  ],
  // listener for property changes, framed, put back to worldDAO when changed?
  methods: [
    function getBounds() {
      /** Override to calculate the bounding box of this entity, in world coords. */
      // default to a point
      return { x: this.x, y: this.y, x2: this.x2, y2: this.y2 };
    },
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
    {
      /** The entity that owns this sprite. */
      name: 'entity'
    },
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


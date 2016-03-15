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


/** Binary expression for bounds check of the first argument within the
 range given by the second argument (an array of [min, max]). */
foam.CLASS({
  package: 'foam.mlang.predicate',
  name: 'Bounded',
  extends: 'foam.mlang.predicate.Binary',
  properties: [
    {
      name: 'arg2',
      adapt: function(old,nu) {
        if ( Array.isArray(nu) ) {
          return foam.mlang.predicate.Constant.create({ value: nu });
        } else {
          return nu;
        }
      }
    }
  ],
  methods: [
    function f(o) {
      return !!
        ( foam.util.compare(this.arg1.f(o), this.arg2.f(o)[0]) >= 0 ) &&
        ( foam.util.compare(this.arg1.f(o), this.arg2.f(o)[1]) <= 0 );
    }
  ]
});

// TODO: implement CONTAINED_BY, INTERSECTS, etc.
// They should accept a 'space' that also works with the spatial DAOs, to
// define which properties to use for axes. For mlangs you could set that
// once on creation, and only specify the range values when querying.

/**
  Spatial hashing DAO
  A grid of buckets, similar to an array grid but more efficient for
  sparse distributions. The spatial hash rounds off the real coordinates
  to give the bucket's key.

  TODO: This will become an index for an MDAO/IndexedDAO
*/
foam.CLASS({
  package: 'foam.dao',
  name: 'SpatialHashDAO',
  extends: 'foam.dao.AbstractDAO',
  requires: [
    'foam.dao.ArraySink',
    'foam.mlang.predicate.True',
    'foam.mlang.predicate.Bounded',
    'foam.mlang.predicate.Eq',
    'foam.mlang.predicate.Lt',
    'foam.mlang.predicate.Gt',
    'foam.mlang.predicate.Lte',
    'foam.mlang.predicate.Gte'
  ],

  properties: [
    {
      /** A map of the items stored, by id. Helps removal of items. */
      name: 'items',
      factory: function() { return {}; }
    },
    {
      /** The buckets of items, by spatial hash. For fast lookups. */
      name: 'buckets',
      factory: function() { return {}; }
    },
    {
      /** The size of each bucket (effectively divide each coordinate by this
        value and round off to get the hash). Changing this value invalidates
        the existing buckets. */
      name: 'bucketWidth',
      defaultValue: 10,
      postSet: function(old, nu) {
        // TODO: removeAll and re-add
      }
    },
  ],

  methods: [
    /** A default hash for any object with an x, y, x2, y2.
      Returns an array of buckets the object should occupy. if createMode is
      true, buckets will be created if not present. */
    function hashXY_(x, y) {
      var bw = this.bucketWidth;
      return "x" + Math.floor( ( x ) / bw ) * bw +
             "y" + Math.floor( ( y ) / bw ) * bw;
    },

    /** Find all the buckets the given bounds overlaps */
    function findBuckets_(bounds, createMode /* array */) {
      var ret = [];
      var bw = this.bucketWidth;

      var width = bounds.x2 - bounds.x;
      var height = bounds.y2 - bounds.y;
      // if infinite area, don't try to filter (not optimal: we might only
      // want half, but this data structure is not equipped for space partitioning)
      if ( width === Infinity || height === Infinity ) {
        return null;
      }

      var xOffs = bounds.x - Math.floor( ( bounds.x ) / bw ) * bw;
      var yOffs = bounds.y - Math.floor( ( bounds.y ) / bw ) * bw;
      for ( var w = 0; w < ( width+xOffs || 0.000001 ); w += bw ) {
        for ( var h = 0; h < ( height+yOffs || 0.000001 ); h += bw ) {
          var key = this.hashXY_(bounds.x + w, bounds.y + h);
          var bucket = this.buckets[key];
          if ( ( ! bucket ) && createMode ) {
            bucket = this.buckets[key] = {};
          }
          bucket && ret.push(bucket);
        }
      }
      ret.object = bounds;
      return ret;
    },

    function listen(sink, options) {
    },

    function put(obj, sink) {
      if ( this.items[obj.id] ) {
        var prev = this.items[obj.id];
        // If the object moved, but the min/max points are in the same buckets
        // as before, none of the buckets need to be altered.
        var min = this.hashXY_(obj.x, obj.y);
        var max = this.hashXY_(obj.x2, obj.y2);
        if ( min == prev.min && max == prev.max ) {
          // hashes match, no change in buckets
          sink && sink.put(obj);
          this.on.put.publish(obj);
          return Promise.resolve(obj);
        }
        // otherwise remove the old bucket entries and continue to re-insert
        this.remove(obj);
      }

      // add to the buckets the item overlaps
      var buckets = this.findBuckets_(obj, true);
      buckets.min = this.hashXY_(obj.x, obj.y); // if the object moves, we might
      buckets.max = this.hashXY_(obj.x2, obj.y2); // not need to alter any buckets
      this.items[obj.id] = buckets; // for fast removal later
      for (var i = 0; i < buckets.length; ++i) {
        buckets[i][obj.id] = obj;
      }

      sink && sink.put(obj);
      this.on.put.publish(obj);
      return Promise.resolve(obj);
    },

    function remove(obj, sink) {
      var buckets = this.items[obj.id];

      if (! buckets || ! buckets.length ) {
        var err = this.ObjectNotFoundException.create({ id: obj.id });
        sink && sink.error(err);
        return Promise.reject(err);
      } else {
        for (var i = 0; i < buckets.length; ++i) {
          delete buckets[i][obj.id];
          // TODO: delete empty buckets
        }
        delete this.items[obj.id];
        sink && sink.remove(obj);
        this.on.remove.publish(obj);
        return Promise.resolve(sink);
      }
    },

    function select(sink, options) {
      var resultSink = sink || this.ArraySink.create();

      sink = this.decorateSink_(resultSink, options);
      // TODO: fast bucket lookup for ranges and comparisons to hashed axes
      // in 2d case, x, y: BOUNDED comparisons should be fast

      var query = options.where.clone();

      // TODO: the axis properties will be configurable for any number of axes
      // named whatever you want (as long as they are properties on your model)
      var axes = { x: true, y: true, x2: true, y2: true };
      var isIndexed = function(mlangArg) {
        // any old x and y will do
        return !! axes[mlangArg.name];
      }

      // TODO: make sure a top level OR is handled

      // Actually want to grab all nested bounds and filter buckets based
      // on all of them... the intersection for AND, and the
      // union for OR.
      // In the AND/intersection case, we want to know all the bounds together and
      // do the search once, since any unspecified bound will catch lots of
      // buckets.
      var isExprMatch = function(model) {
        if ( ! model ) return undefined;

        if ( query ) {

          if ( model.isInstance(query) && isIndexed(query.arg1)  ) {
            var arg2 = query.arg2;
            query = undefined;
            return arg2;
          }

          if ( foam.mlang.predicate.And.isInstance(query) ) {
            for ( var i = 0 ; i < query.args.length ; i++ ) {
              var q = query.args[i];
              if ( model.isInstance(q) && isIndexed(q.arg1) ) {
                query = query.clone();
                query.args[i] = this.True;
                query = query.partialEval();
                if ( query === this.True ) query = null;
                return q;
              }
            }
          }
        }
        return undefined;
      };

      // accumulate range limits so we can make as specific query as possible
      var ranges = {
        x: [-Infinity, Infinity],
        y: [-Infinity, Infinity],
        x2: [-Infinity, Infinity],
        y2: [-Infinity, Infinity]
      }

      var args;
      // Each hit of isExprMatch will pick off one thing ANDed at the top
      // level. Since all these bounds apply at once, keep shrinking the
      // search bounds.
      // TODO: use compare instead of Math.min, to allow for non-number ranges
      while ( args = isExprMatch(this.Bounded) ) {
        var name = args.arg1.name;
        var r = args.arg2.f();
        // accumulate the bounds (largest minimum, smallest maximum)
        ranges[name][0] = Math.max( ranges[name][0], r[0] );
        ranges[name][1] = Math.min( ranges[name][1], r[1] );
      }

      // Equals will completely restrict one axis to a zero-width range (one value)
      while ( args = isExprMatch(this.Eq) ) {
        var name = args.arg1.name;
        var r = args.arg2.f();
        // accumulate the bounds (largest minimum, smallest maximum)
        ranges[name][0] = r;
        ranges[name][1] = r;
      }

      // Less than restricts the maximum for an axis
      while ( args = isExprMatch(this.Lte) ) {
        var name = args.arg1.name;
        var r = args.arg2.f();
        // accumulate the bounds(smallest maximum)
        ranges[name][1] = Math.min( ranges[name][1], r );
      }
      while ( args = isExprMatch(this.Lt) ) {
        var name = args.arg1.name;
        var r = args.arg2.f();
        // accumulate the bounds(smallest maximum)
        ranges[name][1] = Math.min( ranges[name][1], r );
      }

      // Greater than restricts the minimum for an axis
      while ( args = isExprMatch(this.Gte) ) {
        var name = args.arg1.name;
        var r = args.arg2.f();
        // accumulate the bounds(smallest maximum)
        ranges[name][0] = Math.max( ranges[name][0], r );
      }
      while ( args = isExprMatch(this.Gt) ) {
        var name = args.arg1.name;
        var r = args.arg2.f();
        // accumulate the bounds(smallest maximum)
        ranges[name][0] = Math.max( ranges[name][0], r );
      }

      var fc = this.FlowControl.create();

      // if bounds end up infinite, hash will return null, forcing all
      // items through the predicatedSink by default.
      var bounds = {};
      bounds.x = ranges.x[0];
      bounds.y = ranges.y[0];
      bounds.x2 = ranges.x2[1];
      bounds.y2 = ranges.y2[1];

      var duplicates = {};
      var buckets = this.findBuckets_(bounds);
      if ( buckets ) {
        for ( var i = 0; ( i < buckets.length ) && ! fc.stopped; ++i ) {
          for ( var key in buckets[i] ) {
            // skip things we've already seen from other buckets
            if ( duplicates[key] ) { continue; }
            duplicates[key] = true;
            var obj = buckets[i][key];
            if ( obj.id ) {
              if ( fc.stopped ) break;
              if ( fc.errorEvt ) {
                sink.error(fc.errorEvt);
                return Promise.reject(fc.errorEvt);
              }
              sink.put(obj, null, fc);
            }
          }
        }
      } else {
        // no optimal filtering available, so run all items through
        var items = this.items;
        for ( var key in items ) {
          if ( fc.stopped ) break;
          if ( fc.errorEvt ) {
            sink.error(fc.errorEvt);
            return Promise.reject(fc.errorEvt);
           }
          sink.put(items[key].object, null, fc);
        }
      }
      sink && sink.eof && sink.eof();

      return Promise.resolve(resultSink);
    },

    function removeAll(sink, options) {
      var predicate = ( options && options.where ) || this.True.create();

      for ( var key in this.items ) {
        if ( predicate.f(this.items[key].object) ) {
          var obj = this.items[key];
          this.remove(obj);
          sink && sink.remove(obj);
          this.on.remove.publish(obj);
        }
      }

      sink && sink.eof && sink.eof();

      return Promise.resolve(sink || '');
    },

    function find(id) {
      var obj = this.items[id] && this.items[id].object;
      if ( obj ) {
        return Promise.resolve(obj);
      } else {
        return Promise.reject(this.ObjectNotFoundException.create({ id: id }));
      }
    }
  ]
});


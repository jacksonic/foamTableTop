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


/** Binary expression for bounds check of the first argument within the
 range given by the second argument (an array of [min, max]). */
foam.CLASS({
  package: 'foam.mlang.sink',
  name: 'Map',
  implements: ['foam.dao.Sink'],
  properties: [
    {
      name: 'f',
    },
    {
      name: 'delegate',
    }
  ],
  methods: [
    function put(o) {
      this.delegate.put(this.f(o));
    },
    function toString() {
      return 'MAP('+this.f.toString()+":"+this.delegate.toString()+')';
    },
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
      /** Swaps to the appropriate findBuckets function depending on the number
        of dimensions in the space. */
      name: 'findBucketsFn',
      factory: function() { return this.findBuckets2_; }
    },
    {
      /**
        The space contains the names of the properties that define the
        range on each axis.
        <p>For example, a simple 2D space might use bx, by, bx2, by2. An item's
        axis-aligned bounding box would range from bx to bx2 on one axis,
        and by to by2 on the other.
        <p>Spaces can have any number of dimensions, so a z, time, level, etc.
        axis can also be added.
      */
      name: 'space',
      factory: function() {
        return [
          [ 'bx', 'bx2' ],
          [ 'by', 'by2' ]
        ];
      },
      postSet: function(old, nu) {
        if ( nu.length === 2 ) {
          this.findBucketsFn = this.findBuckets2_;
        } else if ( nu.length === 3 ) {
          this.findBucketsFn = this.findBuckets3_;
        } else if ( nu.length === 4 ) {
          this.findBucketsFn = this.findBuckets4_;
        } else {
          throw new Error("Unsupported dimensions in SpatialHashDAO: " + nu.length);
        }
      }
    },
    {
      /** The size of each bucket, per axis (effectively divide each coordinate by this
        value and round off to get the hash). Changing this value invalidates
        the existing buckets. The default is for 10 unit buckets on the x and y axes. */
      name: 'bucketWidths',
      factory: function() { return [10, 10]; },
      postSet: function(old, nu) {
        // TODO: removeAll and re-add
      }
    },
  ],

  methods: [
    /** A default hash for any object with an x, y, x2, y2.
      Returns an array of buckets the object should occupy. if createMode is
      true, buckets will be created if not present. */
    function hash2_(x, y) {
      var bw = this.bucketWidths;
      return "p" + Math.floor( ( x ) / bw[0] ) * bw[0] +
             "p" + Math.floor( ( y ) / bw[1] ) * bw[1];
    },
    function hash3_(x, y, z) {
      var bw = this.bucketWidths;
      return "p" + Math.floor( ( x ) / bw[0] ) * bw[0] +
             "p" + Math.floor( ( y ) / bw[1] ) * bw[1] +
             "p" + Math.floor( ( z ) / bw[2] ) * bw[2];
    },
    function hash4_(x, y, z, w) {
      var bw = this.bucketWidths;
      return "p" + Math.floor( ( x ) / bw[0] ) * bw[0] +
             "p" + Math.floor( ( y ) / bw[1] ) * bw[1] +
             "p" + Math.floor( ( z ) / bw[2] ) * bw[2] +
             "p" + Math.floor( ( w ) / bw[3] ) * bw[3];
    },
    /** Calculates the hash for an item, using the minimum bound point by default
      or the maximum if max is true. In 2D space, the default is to use the
      top-left corner of the bounding box, max == true uses the bottom-right. */
    function hash_(/* object */ bounds, /* boolean */ max) {
      var bw = this.bucketWidths;
      var s = this.space;
      var minmax = max ? 1 : 0;
      var ret = "";
      for (var axis = 0; axis < s.length; ++axis) {
        ret += "p" + Math.floor( bounds[s[axis][minmax]] / bw[axis] ) * bw[axis];
      }
      return ret;
    },

    /** Find all the buckets the given bounds overlaps */
    function findBuckets2_(bounds, createMode /* array */) {
      var bw = this.bucketWidths;
      var s = this.space;

      var lowerBx = bounds[s[0][0]];
      var lowerBy = bounds[s[1][0]];
      var width = bounds[s[0][1]] - lowerBx;
      var height = bounds[s[1][1]] - lowerBy;
      // if infinite area, don't try to filter (not optimal: we might only
      // want half, but this data structure is not equipped for space partitioning)
      if ( width !== width || height !== height ||
           width === Infinity || height === Infinity ) {
        return null;
      }

      var ret = [];
      // Ensure we catch the last buckets of the range by adding the offset
      // from the first bucket's start to our actual start point (we are
      // incrementing by bucketWidth each time, so the last increment may fall
      // outside the actual bounds and would fail the loop test without the offset)
      var xOffs = lowerBx - Math.floor( lowerBx / bw[0] ) * bw[0];
      var yOffs = lowerBy - Math.floor( lowerBy / bw[1] ) * bw[1];
      for ( var w = 0; w < ( width+xOffs || 0.000001 ); w += bw[0] ) {
        for ( var h = 0; h < ( height+yOffs || 0.000001 ); h += bw[1] ) {
          var key = this.hash2_(lowerBx + w, lowerBy + h);
          var bucket = this.buckets[key];
          if ( ( ! bucket ) && createMode ) {
            bucket = this.buckets[key] = { _hash_: key };
          }
          if ( bucket ) {
            ret.push(bucket);
          }
        }
      }
      ret.object = bounds;
      return ret;
    },

    function findBuckets3_(bounds, createMode /* array */) {
      var bw = this.bucketWidths;
      var s = this.space;

      var lowerBx = bounds[s[0][0]];
      var lowerBy = bounds[s[1][0]];
      var lowerBz = bounds[s[2][0]];
      var width = bounds[s[0][1]] - lowerBx;
      var height = bounds[s[1][1]] - lowerBy;
      var depth = bounds[s[2][1]] - lowerBz;
      // if infinite area, don't try to filter (not optimal: we might only
      // want half, but this data structure is not equipped for space partitioning)
      if ( width !== width || height !== height || depth !== depth ||
           width === Infinity || height === Infinity || depth === Infinity ) {
        return null;
      }

      var ret = [];
      // Ensure we catch the last buckets of the range by adding the offset
      // from the first bucket's start to our actual start point (we are
      // incrementing by bucketWidth each time, so the last increment may fall
      // outside the actual bounds and would fail the loop test without the offset)
      var xOffs = lowerBx - Math.floor( lowerBx / bw[0] ) * bw[0];
      var yOffs = lowerBy - Math.floor( lowerBy / bw[1] ) * bw[1];
      var zOffs = lowerBz - Math.floor( lowerBz / bw[2] ) * bw[2];
      for ( var w = 0; w < ( width+xOffs || 0.000001 ); w += bw[0] ) {
        for ( var h = 0; h < ( height+yOffs || 0.000001 ); h += bw[1] ) {
          for ( var d = 0; d < ( depth+zOffs || 0.000001 ); d += bw[2] ) {
            var key = this.hash3_(lowerBx + w, lowerBy + h, lowerBz + d);
            var bucket = this.buckets[key];
            if ( ( ! bucket ) && createMode ) {
              bucket = this.buckets[key] = { _hash_: key };
            }
            if ( bucket ) {
              ret.push(bucket);
            }
          }
        }
      }
      ret.object = bounds;
      return ret;
    },

    function findBuckets4_(bounds, createMode /* array */) {
      var bw = this.bucketWidths;
      var s = this.space;

      var lowerBx = bounds[s[0][0]];
      var lowerBy = bounds[s[1][0]];
      var lowerBz = bounds[s[2][0]];
      var lowerBw = bounds[s[3][0]];
      var width = bounds[s[0][1]] - lowerBx;
      var height = bounds[s[1][1]] - lowerBy;
      var depth = bounds[s[2][1]] - lowerBz;
      var wert = bounds[s[3][1]] - lowerBw;
      // if infinite area, don't try to filter (not optimal: we might only
      // want half, but this data structure is not equipped for space partitioning)
      if ( width !== width || height !== height || depth !== depth || wert !== wert ||
          width === Infinity || height === Infinity || depth == Infinity || wert == Infinity ) {
        return null;
      }

      var ret = [];
      // Ensure we catch the last buckets of the range by adding the offset
      // from the first bucket's start to our actual start point (we are
      // incrementing by bucketWidth each time, so the last increment may fall
      // outside the actual bounds and would fail the loop test without the offset)
      var xOffs = lowerBx - Math.floor( lowerBx / bw[0] ) * bw[0];
      var yOffs = lowerBy - Math.floor( lowerBy / bw[1] ) * bw[1];
      var zOffs = lowerBz - Math.floor( lowerBz / bw[2] ) * bw[2];
      var wOffs = lowerBw - Math.floor( lowerBw / bw[3] ) * bw[3];
      for ( var w = 0; w < ( width+xOffs || 0.000001 ); w += bw[0] ) {
        for ( var h = 0; h < ( height+yOffs || 0.000001 ); h += bw[1] ) {
          for ( var d = 0; d < ( depth+zOffs || 0.000001 ); d += bw[2] ) {
            for ( var t = 0; t < ( wert+wOffs || 0.000001 ); t += bw[3] ) {
              var key = this.hash3_(lowerBx + w, lowerBy + h, lowerBz + d, lowerBw + t);
              var bucket = this.buckets[key];
              if ( ( ! bucket ) && createMode ) {
                bucket = this.buckets[key] = { _hash_: key };
              }
              if ( bucket ) {
                ret.push(bucket);
              }
            }
          }
        }
      }
      ret.object = bounds;
      return ret;
    },

    function listen(sink, options) {
    },

    function put(obj, sink) {
      var min = this.hash_(obj, false);
      var max = this.hash_(obj, true);

      if ( this.items[obj.id] ) {
        var prev = this.items[obj.id];
        // If the object moved, but the min/max points are in the same buckets
        // as before, none of the buckets need to be altered.
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
      var buckets = this.findBucketsFn(obj, true);
      buckets.min = min;
      buckets.max = max;
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

          // check for empty bucket
          // TODO: maybe batch this on the next frame to avoid churn when removing
          // and re-adding immediately
          if ( Object.keys( buckets[i] ).length == 1 ) {
            delete this.buckets[buckets[i]._hash_];
          }
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

      var whereQuery = options ? options.where.clone() : null;

      var space = this.space;
      var isIndexed = function(mlangArg) {
        var n = mlangArg.name;
        for (var ax = 0; ax < space.length; ++ax) {
          if ( space[ax][0] == n || space[ax][1] == n ) {
            return true;
          }
        }
        return false;
      }

      // Actually want to grab all nested bounds and filter buckets based
      // on all of them... the intersection for AND, and the
      // union for OR.
      // In the AND/intersection case, we want to know all the bounds together and
      // do the search once, since any unspecified bound will catch lots of
      // buckets.
      var isExprMatch = function(model, opt_query) {
        if ( ! model ) return undefined;
        var query = opt_query || whereQuery;

        if ( query ) {

          if ( model.isInstance(query) && isIndexed(query.arg1)  ) {
            var arg2 = query.arg2;
            query = undefined;
            return arg2;
          }

          // in the AND or OR case, cycle through each arg, removing them as they are processed
          if ( foam.mlang.predicate.And.isInstance(query) ||
               foam.mlang.predicate.Or.isInstance(query) ) {
            for ( var i = 0 ; i < query.args.length ; i++ ) {
              var q = query.args[i];

              // recurse into nested OR
              if ( foam.mlang.predicate.Or.isInstance(q) ) {
                q = isExprMatch(model, q);
                if ( q ) return q;
                continue;
              }

              if ( model.isInstance(q) && isIndexed(q.arg1) ) {
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
      var ranges = {};
      for (var ax = 0; ax < space.length; ++ax) {
        ranges[space[ax][0]] = [Infinity, -Infinity];
        ranges[space[ax][1]] = [Infinity, -Infinity];
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
        ranges[name][0] = Math.min( ranges[name][0], r[0] );
        ranges[name][1] = Math.max( ranges[name][1], r[1] );
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
        // accumulate the bounds(biggest maximum)
        ranges[name][1] = Math.max( ranges[name][1], r );
      }
      while ( args = isExprMatch(this.Lt) ) {
        var name = args.arg1.name;
        var r = args.arg2.f();
        // accumulate the bounds(biggest maximum)
        ranges[name][1] = Math.max( ranges[name][1], r );
      }

      // Greater than restricts the minimum for an axis
      while ( args = isExprMatch(this.Gte) ) {
        var name = args.arg1.name;
        var r = args.arg2.f();
        // accumulate the bounds(smallest minimum)
        ranges[name][0] = Math.min( ranges[name][0], r );
      }
      while ( args = isExprMatch(this.Gt) ) {
        var name = args.arg1.name;
        var r = args.arg2.f();
        // accumulate the bounds(smallest maximum)
        ranges[name][0] = Math.min( ranges[name][0], r );
      }

      var fc = this.FlowControl.create();

      // if bounds end up infinite, hash will return null, forcing all
      // items through the predicatedSink by default.
      var bounds = {};
      for (var ax = 0; ax < space.length; ++ax) {
        var a = ranges[space[ax][0]][1];
        var b = ranges[space[ax][1]][0];
        bounds[space[ax][0]] = Math.min(a,b);
        bounds[space[ax][1]] = Math.max(a,b);
      }

      var duplicates = {};
      var buckets = this.findBucketsFn(bounds);
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
        var obj = this.items[key].object;
        if ( predicate.f(obj) ) {
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


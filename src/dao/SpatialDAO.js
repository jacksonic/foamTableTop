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
  methods: [
    function f(o) {
      return
        ( foam.util.compare(this.arg1.f(o), this.arg2.f(o)[0]) >= 0 ) &&
        ( foam.util.compare(this.arg1.f(o), this.arg2.f(o)[1]) <= 0 );
    }
  ]
});


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
    },
  ],

  methods: [
    /** A default hash for any object with an x, y, width, height.
      Returns an array of buckets the object should occupy. if createMode is
      true, buckets will be created if not present. */
    function hashXY_(bounds, createMode /* array */) {
      var ret = [];
      var bw = this.bucketWidth;

      // if infinite area, don't try to filter (not optimal: we might only
      // want half, but this data structure is not equipped for space partitioning)
      if ( bounds.width === Infinity || bounds.height === Infinity ) {
        return this.buckets;
      }

      for ( var w = 0; w < ( obj.width || 0.000001 ); w += bw ) {
        for ( var h = 0; h < ( obj.height || 0.000001 ); h += bw ) {
          var key = "x" +
            Math.floor( ( obj.x + w ) / bw ) * bw + "y" +
            Math.floor( ( obj.y + h ) / bw ) * bw;
          var bucket = this.buckets[key];
          if ( ( ! bucket ) && createMode ) {
            bucket = this.buckets[key] = {};
          }
          bucket && ret.push(bucket);
        }
      }
      ret.object = obj;
      return ret;
    },

    function listen(sink, options) {
    },

    function put(obj, sink) {
      sink = sink || this.ArraySink.create();

      this.remove(obj); // TODO: don't remove from buckets it's going back into

      // add to the buckets the item overlaps
      var buckets = this.hashXY_(obj, true);
      this.items[obj.id] = buckets; // for fast removal later
      for (var i = 0; i < buckets.length; ++i) {
        buckets[i][obj.id] = obj;
      }

      sink.put(obj);
      this.on.put.publish(obj);

      return Promise.resolve(obj);
    },

    function remove(obj, sink) {
      sink = sink || this.ArraySink.create();

      var buckets = this.items[obj.id];
      for (var i = 0; i < buckets.length; ++i) {
        delete buckets[i][obj.id];
        // TODO: delete empty buckets
      }

      if (! buckets.length ) {
        var err = this.ObjectNotFoundException.create({ id: obj.id });
        sink.error(err);
        return Promise.reject(err);
      } else {
        delete this.items[obj.id];
        sink.remove(obj);
        this.on.remove.publish(obj);
        return Promise.resolve(sink);
      }
    },

    function select(sink, options) {
      var resultSink = sink || this.ArraySink.create();

      sink = this.decorateSink_(resultSink, options);
      // TODO: fast bucket lookup for ranges and comparisons to hashed axes
      // in 2d case, x, y: BOUNDED comparisons should be fast

      // limit result set if BOUNDED filter is found
//////////////////////// from MDAO
      var items = this.items;
      var query = options.where.clone();

      var axes = { x: true, y: true };
      var isIndexed = function(mlangArg) {
        // any old x and y will do
        // TODO: these will be configurable
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

          if ( AndExpr.isInstance(query) ) {
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
        y: [-Infinity, Infinity]
      }

      var args;
      // Each hit of isExprMatch will pick off one thing ANDed at the top
      // level. Since all these bounds apply at once, keep shrinking the
      // search bounds.
      // TODO: use compare instead of Math.min, to allow for non-number ranges
      while ( args = isExprMatch(this.Bounded) ) {
        // accumulate the bounds (largest minimum, smallest maximum)
        ranges[args.arg1.name][0] = Math.max( ranges[args.arg1.name][0], args.arg2[0] );
        ranges[args.arg1.name][1] = Math.min( ranges[args.arg1.name][1], args.arg2[1] );
      }

      // Equals will completely restrict one axis to a zero-width range (one value)
      while ( args = isExprMatch(this.Eq) ) {
        // accumulate the bounds (largest minimum, smallest maximum)
        ranges[args.arg1.name][0] = args.arg2;
        ranges[args.arg1.name][1] = args.arg2;
      }

      // Less than restricts the maximum for an axis
      while ( args = isExprMatch(this.Lte) ) {
        // accumulate the bounds(smallest maximum)
        ranges[args.arg1.name][1] = Math.min( ranges[args.arg1.name][1], args.arg2 );
      }
      while ( args = isExprMatch(this.Lt) ) {
        // accumulate the bounds(smallest maximum)
        ranges[args.arg1.name][1] = Math.min( ranges[args.arg1.name][1], args.arg2 );
      }

      // Greater than restricts the minimum for an axis
      while ( args = isExprMatch(this.Gte) ) {
        // accumulate the bounds(smallest maximum)
        ranges[args.arg1.name][0] = Math.max( ranges[args.arg1.name][0], args.arg2 );
      }
      while ( args = isExprMatch(this.Gt) ) {
        // accumulate the bounds(smallest maximum)
        ranges[args.arg1.name][0] = Math.max( ranges[args.arg1.name][0], args.arg2 );
      }

////////////////////////
      var fc = this.FlowControl.create();

      // if bounds end up infinite, hash will return all buckets, forcing all
      // items through the predicatedSink by default.
      var bounds = {};
      bounds.x = ranges.x[0];
      bounds.y = ranges.y[1];
      bounds.width = ranges.x[1] - ranges.x[0];
      bounds.height = ranges.y[1] - ranges.y[0];

      var buckets = this.hashXY_(bounds);
      for ( var i = 0; ( i < buckets.length ) && ! fc.stopped; ++i ) {
        for ( var key in buckets[i] ) {
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


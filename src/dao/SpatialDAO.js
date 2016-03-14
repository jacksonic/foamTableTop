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


/** Ternary expression for bounds check of the first argument within the
 bounds given by the second argument array. */
foam.CLASS({
  package: 'foam.mlang.predicate',
  name: 'Bounded',
  extends: 'foam.mlang.predicate.Binary',
  methods: [
    function f(o) {
      return
        ( foam.util.compare(this.arg1.f(o), this.arg2.f(o)[0]) <= 0 ) &&
        ( foam.util.compare(this.arg1.f(o), this.arg2.f(o)[1]) >= 0 );
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
    'foam.mlang.predicate.Bounded'
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
        value and round off to get the hash) */
      name: 'bucketWidth',
      defaultValue: 10,
    },
  ],

  methods: [
    /** A default hash for an object with an x, y, width, height.
      Returns an array of keys for the buckets the object should occupy. */
    function hashXY_(obj /* array */) {
      var ret = [];



      ret.object = obj;
      return ret;
    },

    function listen(sink, options) {
    },

    function put(obj, sink) {
      sink = sink || this.ArraySink.create();

      this.remove(obj); // TODO: don't remove from buckets it's going back into

      // add to the buckets the item overlaps
      var buckets = this.hashXY_(obj);
      this.items[obj.id] = buckets; // for fast removal later
      for (var i = 0; i < buckets.length; ++i) {
        this.buckets[buckets[i]][obj.id] = obj;
      }

      sink.put(obj);
      this.on.put.publish(obj);

      return Promise.resolve(obj);
    },

    function remove(obj, sink) {
      sink = sink || this.ArraySink.create();

      var buckets = this.items[obj.id];
      for (var i = 0; i < buckets.length; ++i) {
        delete this.buckets[buckets[i]][obj.id];
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
      var query = options.where;

      var propX = this.of.getAxiomByName('x');
      var propY = this.of.getAxiomByName('y');
      var isIndexed = function(mlangArg) {
        return mlangArg === propX || mlangArg === propY;
      }

      var isExprMatch = function(model) {
        if ( ! model ) return undefined;

        if ( query ) {

          if ( model.isInstance(query) && query.arg1 === prop ) {
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
                return q.arg2;
              }
            }
          }
        }
        return undefined;
      };

      var arg2 = isExprMatch(this.Bounded);
      if ( arg2 ) {
        // filter out the buckets not in the bounded range

      }
////////////////////////

      var fc = this.FlowControl.create();
      for ( var key in items ) {
        if ( fc.stopped ) break;
        if ( fc.errorEvt ) {
          sink.error(fc.errorEvt);
          return Promise.reject(fc.errorEvt);
        }
        sink.put(this.items[key].object, null, fc);
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


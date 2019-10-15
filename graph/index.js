const assert = require('assert').strict
const { Map, ReverseMap } = require('./maps')
const Lookup = require('./lookup')
const pruneMap = require('./tools/prune-map')
const isFirst = require('../lib/is-first')

module.exports = function buildEdgeMap (entryNode, otherNodes, opts = {}) {
  const {
    getThread = _getThread
  } = opts

  assert(isFirst(entryNode, getThread))
  assert(Array.isArray(otherNodes))
  assert(typeof getThread === 'function')

  // build map of each hop which runs forward causally
  var map = Map(otherNodes, getThread)
  var reverseMap = ReverseMap(map)
  // and the inverse

  var lookup = Lookup(map, entryNode, otherNodes)

  return {
    getNode: lookup.getNode,
    getEntryNode: () => entryNode,
    getLinks: (key) => {
      if (!map.hasOwnProperty(key)) return []
      return Object.keys(map[key])
    },
    getReverseLinks: (key) => {
      if (!reverseMap.hasOwnProperty(key)) return []
      return Object.keys(reverseMap[key])
    },

    isBranchNode: (key) => {
      if (!map.hasOwnProperty(key)) return false
      return Object.keys(map[key]).length > 1
    },
    isMergeNode: (key) => {
      if (!reverseMap.hasOwnProperty(key)) return false
      return Object.keys(reverseMap[key]).length > 1
    },
    isHeadNode: (key) => {
      if (!lookup.getNode(key)) return false
      if (!map.hasOwnProperty(key)) return true
      return Object.keys(map[key]).length === 0
    },

    prune: (invalidKeys) => {
      map = pruneMap(map, entryNode.key, invalidKeys)
      reverseMap = ReverseMap(map)

      // TODO pruneLookup ?
    },

    getRaw: () => {
      return { map, reverseMap }
    }
  }
}

function _getThread (node) {
  return node.thread
}

/*!
 * better-scroll / nested-scroll
 * (c) 2016-2020 ustbhuangyi
 * Released under the MIT License.
 */

// Slightly modified to for Noodl to fix a problem:
// - click bug. Click could be disabled and never enabled again when scrolling
// - click bug 2. Click option didn't support the scroller being moved around in the dom tree
//                It assumed the nested scroll relationships always stay the same
//                (so doesn't work with delta updates)

var compatibleFeatures = {
  duplicateClick: function (_a) {
    var parentScroll = _a[0],
      childScroll = _a[1];
    // no need to make childScroll's click true
    if (parentScroll.options.click && childScroll.options.click) {
      childScroll.options.click = false;
    }
  },
  nestedScroll: function (scrollsPair) {
    var parentScroll = scrollsPair[0],
      childScroll = scrollsPair[1];
    var parentScrollX = parentScroll.options.scrollX;
    var parentScrollY = parentScroll.options.scrollY;
    var childScrollX = childScroll.options.scrollX;
    var childScrollY = childScroll.options.scrollY;
    // vertical nested in vertical scroll and horizontal nested in horizontal
    // otherwise, no need to handle.
    if (parentScrollX === childScrollX || parentScrollY === childScrollY) {
      scrollsPair.forEach(function (scroll, index) {
        var oppositeScroll = scrollsPair[(index + 1) % 2];
        scroll.on('scrollStart', function () {
          if (oppositeScroll.pending) {
            oppositeScroll.stop();
            oppositeScroll.resetPosition();
          }
          setupData(oppositeScroll);
          oppositeScroll.disable();
        });
        scroll.on('touchEnd', function () {
          oppositeScroll.enable();
        });
      });
      childScroll.on('scrollStart', function () {
        if (checkBeyondBoundary(childScroll)) {
          childScroll.disable();
          parentScroll.enable();
        }
      });
    }
  }
};
var NestedScroll = /** @class */ (function () {
  function NestedScroll(scroll) {
    var singleton = NestedScroll.nestedScroll;
    if (!(singleton instanceof NestedScroll)) {
      singleton = NestedScroll.nestedScroll = this;
      singleton.stores = [];
    }
    singleton.setup(scroll);
    singleton.addHooks(scroll);
    return singleton;
  }
  NestedScroll.prototype.setup = function (scroll) {
    this.appendBScroll(scroll);
    this.handleContainRelationship();
    this.handleCompatible();
  };
  NestedScroll.prototype.addHooks = function (scroll) {
    var _this = this;
    scroll.on('destroy', function () {
      _this.teardown(scroll);
    });
  };
  NestedScroll.prototype.teardown = function (scroll) {
    this.removeBScroll(scroll);
    this.handleContainRelationship();
    this.handleCompatible();
  };
  NestedScroll.prototype.appendBScroll = function (scroll) {
    this.stores.push(scroll);
  };
  NestedScroll.prototype.removeBScroll = function (scroll) {
    var index = this.stores.indexOf(scroll);
    if (index === -1) return;
    scroll.wrapper.isBScrollContainer = undefined;
    this.stores.splice(index, 1);
  };
  NestedScroll.prototype.handleContainRelationship = function () {
    // bs's length <= 1
    var stores = this.stores;
    if (stores.length <= 1) {
      // there is only a childBScroll left.
      if (stores[0] && stores[0].__parentInfo) {
        stores[0].__parentInfo = undefined;
      }
      return;
    }
    var outerBS;
    var outerBSWrapper;
    var innerBS;
    var innerBSWrapper;
    // Need two layers of "For loop" to calculate parent-child relationship
    for (var i = 0; i < stores.length; i++) {
      outerBS = stores[i];
      outerBSWrapper = outerBS.wrapper;
      for (var j = 0; j < stores.length; j++) {
        innerBS = stores[j];
        innerBSWrapper = innerBS.wrapper;
        // same bs
        if (outerBS === innerBS) continue;
        // now start calculating
        if (!innerBSWrapper.contains(outerBSWrapper)) continue;
        // now innerBS contains outerBS
        // no parentInfo yet
        if (!outerBS.__parentInfo) {
          outerBS.__parentInfo = {
            parent: innerBS,
            depth: calculateDepths(outerBSWrapper, innerBSWrapper)
          };
        } else {
          // has parentInfo already!
          // just judge the "true" parent by depth
          // we regard the latest node as parent, not the furthest
          var currentDepths = calculateDepths(outerBSWrapper, innerBSWrapper);
          var prevDepths = outerBS.__parentInfo.depth;
          // refresh currentBS as parentScroll
          if (prevDepths > currentDepths) {
            outerBS.__parentInfo = {
              parent: innerBS,
              depth: currentDepths
            };
          }
        }
      }
    }
  };
  NestedScroll.prototype.handleCompatible = function () {
    var pairs = this.availableBScrolls();
    var keys = ['duplicateClick', 'nestedScroll'];
    pairs.forEach(function (pair) {
      keys.forEach(function (key) {
        compatibleFeatures[key](pair);
      });
    });
  };
  NestedScroll.prototype.availableBScrolls = function () {
    var ret = [];
    ret = this.stores
      .filter(function (bs) {
        return !!bs.__parentInfo;
      })
      .map(function (bs) {
        return [bs.__parentInfo.parent, bs];
      });
    return ret;
  };
  NestedScroll.pluginName = 'nestedScroll';
  return NestedScroll;
})();
function calculateDepths(childNode, parentNode) {
  var depth = 0;
  var parent = childNode.parentNode;
  while (parent && parent !== parentNode) {
    depth++;
    parent = parent.parentNode;
  }
  return depth;
}
function checkBeyondBoundary(scroll) {
  var _a = hasScroll(scroll),
    hasHorizontalScroll = _a.hasHorizontalScroll,
    hasVerticalScroll = _a.hasVerticalScroll;
  var _b = scroll.scroller,
    scrollBehaviorX = _b.scrollBehaviorX,
    scrollBehaviorY = _b.scrollBehaviorY;
  var hasReachLeft = scroll.x >= scroll.minScrollX && scrollBehaviorX.movingDirection === -1;
  var hasReachRight = scroll.x <= scroll.maxScrollX && scrollBehaviorX.movingDirection === 1;
  var hasReachTop = scroll.y >= scroll.minScrollY && scrollBehaviorY.movingDirection === -1;
  var hasReachBottom = scroll.y <= scroll.maxScrollY && scrollBehaviorY.movingDirection === 1;
  if (hasVerticalScroll) {
    return hasReachTop || hasReachBottom;
  } else if (hasHorizontalScroll) {
    return hasReachLeft || hasReachRight;
  }
  return false;
}
function setupData(scroll) {
  var _a = hasScroll(scroll),
    hasHorizontalScroll = _a.hasHorizontalScroll,
    hasVerticalScroll = _a.hasVerticalScroll;
  var _b = scroll.scroller,
    actions = _b.actions,
    scrollBehaviorX = _b.scrollBehaviorX,
    scrollBehaviorY = _b.scrollBehaviorY;
  actions.startTime = +new Date();
  if (hasVerticalScroll) {
    scrollBehaviorY.startPos = scrollBehaviorY.currentPos;
  } else if (hasHorizontalScroll) {
    scrollBehaviorX.startPos = scrollBehaviorX.currentPos;
  }
}
function hasScroll(scroll) {
  return {
    hasHorizontalScroll: scroll.scroller.scrollBehaviorX.hasScroll,
    hasVerticalScroll: scroll.scroller.scrollBehaviorY.hasScroll
  };
}

export default NestedScroll;

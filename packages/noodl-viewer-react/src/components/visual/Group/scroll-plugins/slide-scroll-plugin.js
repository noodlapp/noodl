/*!
 * better-scroll / slide
 * (c) 2016-2020 ustbhuangyi
 * Released under the MIT License.
 */

//adapted to Noodl's more dynamic delta update environment:
// - A scroll refresh doesn't reset the current slide page position
// - Horizontal slider doesn't break when there are no children

function warn(msg) {
  console.error('[BScroll warn]: ' + msg);
}

// ssr support
var inBrowser = typeof window !== 'undefined';
var ua = inBrowser && navigator.userAgent.toLowerCase();
var isWeChatDevTools = ua && /wechatdevtools/.test(ua);
var isAndroid = ua && ua.indexOf('android') > 0;

function extend(target) {
  var rest = [];
  for (var _i = 1; _i < arguments.length; _i++) {
    rest[_i - 1] = arguments[_i];
  }
  for (var i = 0; i < rest.length; i++) {
    var source = rest[i];
    for (var key in source) {
      target[key] = source[key];
    }
  }
  return target;
}
function fixInboundValue(x, min, max) {
  if (x < min) {
    return min;
  }
  if (x > max) {
    return max;
  }
  return x;
}

var elementStyle = inBrowser && document.createElement('div').style;
var vendor = (function () {
  if (!inBrowser) {
    return false;
  }
  var transformNames = {
    webkit: 'webkitTransform',
    Moz: 'MozTransform',
    O: 'OTransform',
    ms: 'msTransform',
    standard: 'transform'
  };
  for (var key in transformNames) {
    if (elementStyle[transformNames[key]] !== undefined) {
      return key;
    }
  }
  return false;
})();
function prefixStyle(style) {
  if (vendor === false) {
    return style;
  }
  if (vendor === 'standard') {
    if (style === 'transitionEnd') {
      return 'transitionend';
    }
    return style;
  }
  return vendor + style.charAt(0).toUpperCase() + style.substr(1);
}
var cssVendor = vendor && vendor !== 'standard' ? '-' + vendor.toLowerCase() + '-' : '';
var transform = prefixStyle('transform');
var transition = prefixStyle('transition');
var hasPerspective = inBrowser && prefixStyle('perspective') in elementStyle;
var style = {
  transform: transform,
  transition: transition,
  transitionTimingFunction: prefixStyle('transitionTimingFunction'),
  transitionDuration: prefixStyle('transitionDuration'),
  transitionDelay: prefixStyle('transitionDelay'),
  transformOrigin: prefixStyle('transformOrigin'),
  transitionEnd: prefixStyle('transitionEnd')
};
function getRect(el) {
  if (el instanceof window.SVGElement) {
    var rect = el.getBoundingClientRect();
    return {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height
    };
  } else {
    return {
      top: el.offsetTop,
      left: el.offsetLeft,
      width: el.offsetWidth,
      height: el.offsetHeight
    };
  }
}
function prepend(el, target) {
  var firstChild = target.firstChild;
  if (firstChild) {
    before(el, firstChild);
  } else {
    target.appendChild(el);
  }
}
function before(el, target) {
  target.parentNode.insertBefore(el, target);
}
function removeChild(el, child) {
  el.removeChild(child);
}

var ease = {
  // easeOutQuint
  swipe: {
    style: 'cubic-bezier(0.23, 1, 0.32, 1)',
    fn: function (t) {
      return 1 + --t * t * t * t * t;
    }
  },
  // easeOutQuard
  swipeBounce: {
    style: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    fn: function (t) {
      return t * (2 - t);
    }
  },
  // easeOutQuart
  bounce: {
    style: 'cubic-bezier(0.165, 0.84, 0.44, 1)',
    fn: function (t) {
      return 1 - --t * t * t * t;
    }
  }
};

var DEFAULT_INTERVAL = 100 / 60;
var windowCompat = inBrowser && window;
function noop() {}
var requestAnimationFrame = (function () {
  if (!inBrowser) {
    /* istanbul ignore if */
    return noop;
  }
  return (
    windowCompat.requestAnimationFrame ||
    windowCompat.webkitRequestAnimationFrame ||
    windowCompat.mozRequestAnimationFrame ||
    windowCompat.oRequestAnimationFrame ||
    // if all else fails, use setTimeout
    function (callback) {
      return window.setTimeout(callback, (callback.interval || DEFAULT_INTERVAL) / 2); // make interval as precise as possible.
    }
  );
})();
var cancelAnimationFrame = (function () {
  if (!inBrowser) {
    /* istanbul ignore if */
    return noop;
  }
  return (
    windowCompat.cancelAnimationFrame ||
    windowCompat.webkitCancelAnimationFrame ||
    windowCompat.mozCancelAnimationFrame ||
    windowCompat.oCancelAnimationFrame ||
    function (id) {
      window.clearTimeout(id);
    }
  );
})();

var PagesPos = /** @class */ (function () {
  function PagesPos(scroll, slideOpt) {
    this.scroll = scroll;
    this.slideOpt = slideOpt;
    this.slideEl = null;
    this.init();
  }
  PagesPos.prototype.init = function () {
    var scrollerIns = this.scroll.scroller;
    var scrollBehaviorX = scrollerIns.scrollBehaviorX;
    var scrollBehaviorY = scrollerIns.scrollBehaviorY;
    var wrapper = getRect(scrollerIns.wrapper);
    var scroller = getRect(scrollerIns.content);
    this.wrapperWidth = wrapper.width;
    this.wrapperHeight = wrapper.height;
    this.scrollerHeight = scrollBehaviorY.hasScroll ? scroller.height : wrapper.height;
    this.scrollerWidth = scrollBehaviorX.hasScroll ? scroller.width : wrapper.width;
    var stepX = this.slideOpt.stepX || this.wrapperWidth;
    var stepY = this.slideOpt.stepY || this.wrapperHeight;
    var slideEls = scrollerIns.content;
    var el = this.slideOpt.el;
    if (typeof el === 'string') {
      this.slideEl = slideEls.querySelectorAll(el);
    }
    this.pages = this.slideEl ? this.computePagePosInfoByEl(this.slideEl) : this.computePagePosInfo(stepX, stepY);
    this.xLen = this.pages ? this.pages.length : 0;
    this.yLen = this.pages && this.pages[0] ? this.pages[0].length : 0;
  };
  PagesPos.prototype.hasInfo = function () {
    if (!this.pages || !this.pages.length) {
      return false;
    }
    return true;
  };
  PagesPos.prototype.getPos = function (x, y) {
    return this.pages[x] ? this.pages[x][y] : null;
  };
  PagesPos.prototype.getNearestPage = function (x, y) {
    if (!this.hasInfo()) {
      return;
    }
    var pageX = 0;
    var pageY = 0;
    var l = this.pages.length;
    for (; pageX < l - 1; pageX++) {
      if (x >= this.pages[pageX][0].cx) {
        break;
      }
    }
    l = this.pages[pageX].length;
    for (; pageY < l - 1; pageY++) {
      if (y >= this.pages[0][pageY].cy) {
        break;
      }
    }
    return {
      pageX: pageX,
      pageY: pageY
    };
  };
  PagesPos.prototype.computePagePosInfo = function (stepX, stepY) {
    var pages = [];
    var x = 0;
    var y;
    var cx;
    var cy;
    var i = 0;
    var l;
    var maxScrollPosX = this.scroll.scroller.scrollBehaviorX.maxScrollPos;
    var maxScrollPosY = this.scroll.scroller.scrollBehaviorY.maxScrollPos;
    cx = Math.round(stepX / 2);
    cy = Math.round(stepY / 2);
    while (x > -this.scrollerWidth) {
      pages[i] = [];
      l = 0;
      y = 0;
      while (y > -this.scrollerHeight) {
        pages[i][l] = {
          x: Math.max(x, maxScrollPosX),
          y: Math.max(y, maxScrollPosY),
          width: stepX,
          height: stepY,
          cx: x - cx,
          cy: y - cy
        };
        y -= stepY;
        l++;
      }
      x -= stepX;
      i++;
    }
    return pages;
  };
  PagesPos.prototype.computePagePosInfoByEl = function (el) {
    var pages = [];
    var x = 0;
    var y = 0;
    var cx;
    var cy;
    var i = 0;
    var l = el.length;
    var m = 0;
    var n = -1;
    var rect;
    var maxScrollX = this.scroll.scroller.scrollBehaviorX.maxScrollPos;
    var maxScrollY = this.scroll.scroller.scrollBehaviorY.maxScrollPos;
    for (; i < l; i++) {
      rect = getRect(el[i]);
      if (i === 0 || rect.left <= getRect(el[i - 1]).left) {
        m = 0;
        n++;
      }
      if (!pages[m]) {
        pages[m] = [];
      }
      x = Math.max(-rect.left, maxScrollX);
      y = Math.max(-rect.top, maxScrollY);
      cx = x - Math.round(rect.width / 2);
      cy = y - Math.round(rect.height / 2);
      pages[m][n] = {
        x: x,
        y: y,
        width: rect.width,
        height: rect.height,
        cx: cx,
        cy: cy
      };
      if (x > maxScrollX) {
        m++;
      }
    }
    return pages;
  };
  return PagesPos;
})();

var PageInfo = /** @class */ (function () {
  function PageInfo(scroll, slideOpt) {
    this.scroll = scroll;
    this.slideOpt = slideOpt;
  }
  PageInfo.prototype.init = function () {
    this.currentPage = {
      x: 0,
      y: 0,
      pageX: 0,
      pageY: 0
    };
    this.pagesPos = new PagesPos(this.scroll, this.slideOpt);
    this.checkSlideLoop();
  };
  PageInfo.prototype.changeCurrentPage = function (newPage) {
    this.currentPage = newPage;
  };
  PageInfo.prototype.change2safePage = function (pageX, pageY) {
    if (!this.pagesPos.hasInfo()) {
      return;
    }
    if (pageX >= this.pagesPos.xLen) {
      pageX = this.pagesPos.xLen - 1;
    } else if (pageX < 0) {
      pageX = 0;
    }
    if (pageY >= this.pagesPos.yLen) {
      pageY = this.pagesPos.yLen - 1;
    } else if (pageY < 0) {
      pageY = 0;
    }
    var _a = this.pagesPos.getPos(pageX, pageY);
    return {
      pageX: pageX,
      pageY: pageY,
      x: _a ? _a.x : 0,
      y: _a ? _a.y : 0
    };
  };
  PageInfo.prototype.getInitPage = function () {
    var initPageX = this.loopX ? 1 : 0;
    var initPageY = this.loopY ? 1 : 0;
    return {
      pageX: initPageX,
      pageY: initPageY
    };
  };
  PageInfo.prototype.getRealPage = function (page) {
    var fixedPage = function (page, realPageLen) {
      var pageIndex = [];
      for (var i = 0; i < realPageLen; i++) {
        pageIndex.push(i);
      }
      pageIndex.unshift(realPageLen - 1);
      pageIndex.push(0);
      return pageIndex[page];
    };
    var currentPage = page ? extend({}, page) : extend({}, this.currentPage);
    if (this.loopX) {
      currentPage.pageX = fixedPage(currentPage.pageX, this.pagesPos.xLen - 2);
    }
    if (this.loopY) {
      currentPage.pageY = fixedPage(currentPage.pageY, this.pagesPos.yLen - 2);
    }
    return {
      pageX: currentPage.pageX,
      pageY: currentPage.pageY
    };
  };
  PageInfo.prototype.getPageSize = function () {
    return this.pagesPos.getPos(this.currentPage.pageX, this.currentPage.pageY);
  };
  PageInfo.prototype.realPage2Page = function (x, y) {
    if (!this.pagesPos.hasInfo()) {
      return;
    }
    var lastX = this.pagesPos.xLen - 1;
    var lastY = this.pagesPos.yLen - 1;
    var firstX = 0;
    var firstY = 0;
    if (this.loopX) {
      x += 1;
      firstX = firstX + 1;
      lastX = lastX - 1;
    }
    if (this.loopY) {
      y += 1;
      firstY = firstY + 1;
      lastY = lastY - 1;
    }
    x = fixInboundValue(x, firstX, lastX);
    y = fixInboundValue(y, firstY, lastY);
    return {
      realX: x,
      realY: y
    };
  };
  PageInfo.prototype.nextPage = function () {
    return this.changedPageNum('positive' /* Positive */);
  };
  PageInfo.prototype.prevPage = function () {
    return this.changedPageNum('negative' /* Negative */);
  };
  PageInfo.prototype.nearestPage = function (x, y, directionX, directionY) {
    var pageInfo = this.pagesPos.getNearestPage(x, y);
    if (!pageInfo) {
      return {
        x: 0,
        y: 0,
        pageX: 0,
        pageY: 0
      };
    }
    var pageX = pageInfo.pageX;
    var pageY = pageInfo.pageY;
    var newX;
    var newY;
    if (pageX === this.currentPage.pageX) {
      pageX += directionX;
      pageX = fixInboundValue(pageX, 0, this.pagesPos.xLen - 1);
    }
    if (pageY === this.currentPage.pageY) {
      pageY += directionY;
      pageY = fixInboundValue(pageInfo.pageY, 0, this.pagesPos.yLen - 1);
    }
    newX = this.pagesPos.getPos(pageX, 0).x;
    newY = this.pagesPos.getPos(0, pageY).y;
    return {
      x: newX,
      y: newY,
      pageX: pageX,
      pageY: pageY
    };
  };
  PageInfo.prototype.getLoopStage = function () {
    if (!this.needLoop) {
      return 'middle' /* Middle */;
    }
    if (this.loopX) {
      if (this.currentPage.pageX === 0) {
        return 'head' /* Head */;
      }
      if (this.currentPage.pageX === this.pagesPos.xLen - 1) {
        return 'tail' /* Tail */;
      }
    }
    if (this.loopY) {
      if (this.currentPage.pageY === 0) {
        return 'head' /* Head */;
      }
      if (this.currentPage.pageY === this.pagesPos.yLen - 1) {
        return 'tail' /* Tail */;
      }
    }
    return 'middle' /* Middle */;
  };
  PageInfo.prototype.resetLoopPage = function () {
    if (this.loopX) {
      if (this.currentPage.pageX === 0) {
        return {
          pageX: this.pagesPos.xLen - 2,
          pageY: this.currentPage.pageY
        };
      }
      if (this.currentPage.pageX === this.pagesPos.xLen - 1) {
        return {
          pageX: 1,
          pageY: this.currentPage.pageY
        };
      }
    }
    if (this.loopY) {
      if (this.currentPage.pageY === 0) {
        return {
          pageX: this.currentPage.pageX,
          pageY: this.pagesPos.yLen - 2
        };
      }
      if (this.currentPage.pageY === this.pagesPos.yLen - 1) {
        return {
          pageX: this.currentPage.pageX,
          pageY: 1
        };
      }
    }
  };
  PageInfo.prototype.isSameWithCurrent = function (page) {
    if (page.pageX !== this.currentPage.pageX || page.pageY !== this.currentPage.pageY) {
      return false;
    }
    return true;
  };
  PageInfo.prototype.changedPageNum = function (direction) {
    var x = this.currentPage.pageX;
    var y = this.currentPage.pageY;
    if (this.slideX) {
      x = direction === 'negative' /* Negative */ ? x - 1 : x + 1;
    }
    if (this.slideY) {
      y = direction === 'negative' /* Negative */ ? y - 1 : y + 1;
    }
    return {
      pageX: x,
      pageY: y
    };
  };
  PageInfo.prototype.checkSlideLoop = function () {
    this.needLoop = this.slideOpt.loop;
    if (this.pagesPos.xLen > 1) {
      this.slideX = true;
    }
    if (this.pagesPos.pages[0] && this.pagesPos.yLen > 1) {
      this.slideY = true;
    }
    this.loopX = this.needLoop && this.slideX;
    this.loopY = this.needLoop && this.slideY;
    if (this.slideX && this.slideY) {
      warn('slide does not support two direction at the same time.');
    }
  };
  return PageInfo;
})();

var sourcePrefix = 'plugins.slide';
var propertiesMap = [
  {
    key: 'next',
    name: 'next'
  },
  {
    key: 'prev',
    name: 'prev'
  },
  {
    key: 'goToPage',
    name: 'goToPage'
  },
  {
    key: 'getCurrentPage',
    name: 'getCurrentPage'
  }
];
var propertiesConfig = propertiesMap.map(function (item) {
  return {
    key: item.key,
    sourceKey: sourcePrefix + '.' + item.name
  };
});

var Slide = /** @class */ (function () {
  function Slide(scroll) {
    this.scroll = scroll;
    this.resetLooping = false;
    this.isTouching = false;
    this.scroll.proxy(propertiesConfig);
    this.scroll.registerType(['slideWillChange']);
    this.slideOpt = this.scroll.options.slide;
    this.page = new PageInfo(scroll, this.slideOpt);
    this.hooksFn = [];
    this.willChangeToPage = {
      pageX: 0,
      pageY: 0
    };
    this.init();
  }
  Slide.prototype.init = function () {
    var _this = this;
    var slide = this.slideOpt;
    var slideEls = this.scroll.scroller.content;
    var lazyInitByRefresh = false;
    if (slide.loop) {
      var children = slideEls.children;
      if (children.length > 1) {
        this.cloneSlideEleForLoop(slideEls);
        lazyInitByRefresh = true;
      } else {
        // Loop does not make any sense if there is only one child.
        slide.loop = false;
      }
    }
    var shouldRefreshByWidth = this.setSlideWidth(slideEls);
    var shouldRefreshByHeight = this.setSlideHeight(this.scroll.scroller.wrapper, slideEls);
    var shouldRefresh = shouldRefreshByWidth || shouldRefreshByHeight;
    var scrollHooks = this.scroll.hooks;
    var scrollerHooks = this.scroll.scroller.hooks;
    this.registorHooks(scrollHooks, 'refresh', this.initSlideState);
    this.registorHooks(scrollHooks, 'destroy', this.destroy);
    this.registorHooks(scrollerHooks, 'momentum', this.modifyScrollMetaHandler);
    // scrollEnd handler should be called before customized handlers
    this.registorHooks(this.scroll, 'scrollEnd', this.amendCurrentPage);
    this.registorHooks(scrollerHooks, 'beforeStart', this.setTouchFlag);
    this.registorHooks(scrollerHooks, 'scroll', this.scrollMoving);
    this.registorHooks(scrollerHooks, 'resize', this.resize);
    // for mousewheel event
    if (this.scroll.eventTypes.mousewheelMove && this.scroll.eventTypes.mousewheelEnd) {
      this.registorHooks(this.scroll, 'mousewheelMove', function () {
        // prevent default action of mousewheelMove
        return true;
      });
      this.registorHooks(this.scroll, 'mousewheelEnd', function (delta) {
        if (delta.directionX === 1 /* Positive */ || delta.directionY === 1 /* Positive */) {
          _this.next();
        }
        if (delta.directionX === -1 /* Negative */ || delta.directionY === -1 /* Negative */) {
          _this.prev();
        }
      });
    }
    if (slide.listenFlick !== false) {
      this.registorHooks(scrollerHooks, 'flick', this.flickHandler);
    }
    if (!lazyInitByRefresh && !shouldRefresh) {
      this.initSlideState();
    } else {
      this.scroll.refresh();
    }
  };
  Slide.prototype.resize = function () {
    var _this = this;
    var slideEls = this.scroll.scroller.content;
    var slideWrapper = this.scroll.scroller.wrapper;
    clearTimeout(this.resizeTimeout);
    this.resizeTimeout = window.setTimeout(function () {
      _this.clearSlideWidth(slideEls);
      _this.clearSlideHeight(slideEls);
      _this.setSlideWidth(slideEls);
      _this.setSlideHeight(slideWrapper, slideEls);
      _this.scroll.refresh();
    }, this.scroll.options.resizePolling);
    return true;
  };
  Slide.prototype.next = function (time, easing) {
    var _a = this.page.nextPage(),
      pageX = _a.pageX,
      pageY = _a.pageY;
    this.goTo(pageX, pageY, time, easing);
  };
  Slide.prototype.prev = function (time, easing) {
    var _a = this.page.prevPage(),
      pageX = _a.pageX,
      pageY = _a.pageY;
    this.goTo(pageX, pageY, time, easing);
  };
  Slide.prototype.goToPage = function (x, y, time, easing) {
    var pageInfo = this.page.realPage2Page(x, y);
    if (!pageInfo) {
      return;
    }
    this.goTo(pageInfo.realX, pageInfo.realY, time, easing);
  };
  Slide.prototype.getCurrentPage = function () {
    return this.page.getRealPage();
  };
  Slide.prototype.nearestPage = function (x, y) {
    var scrollBehaviorX = this.scroll.scroller.scrollBehaviorX;
    var scrollBehaviorY = this.scroll.scroller.scrollBehaviorY;
    var triggerThreshold = true;
    if (
      Math.abs(x - scrollBehaviorX.absStartPos) <= this.thresholdX &&
      Math.abs(y - scrollBehaviorY.absStartPos) <= this.thresholdY
    ) {
      triggerThreshold = false;
    }
    if (!triggerThreshold) {
      return this.page.currentPage;
    }
    return this.page.nearestPage(
      fixInboundValue(x, scrollBehaviorX.maxScrollPos, scrollBehaviorX.minScrollPos),
      fixInboundValue(y, scrollBehaviorY.maxScrollPos, scrollBehaviorY.minScrollPos),
      scrollBehaviorX.direction,
      scrollBehaviorY.direction
    );
  };
  Slide.prototype.destroy = function () {
    var slideEls = this.scroll.scroller.content;
    if (this.slideOpt.loop) {
      var children = slideEls.children;
      if (children.length > 2) {
        removeChild(slideEls, children[children.length - 1]);
        removeChild(slideEls, children[0]);
      }
    }
    this.hooksFn.forEach(function (item) {
      var hooks = item[0];
      var hooksName = item[1];
      var handlerFn = item[2];
      if (hooks.eventTypes[hooksName]) {
        hooks.off(hooksName, handlerFn);
      }
    });
    this.hooksFn.length = 0;
  };
  Slide.prototype.initSlideState = function () {
    const prevPage = this.page.currentPage;
    this.page.init();
    if (prevPage) {
      this.page.currentPage = prevPage;
    } else {
      var initPage = this.page.getInitPage();
      this.goTo(initPage.pageX, initPage.pageY, 0);
    }

    this.initThreshold();
  };
  Slide.prototype.initThreshold = function () {
    var slideThreshold = this.slideOpt.threshold || 0.1;
    if (slideThreshold % 1 === 0) {
      this.thresholdX = slideThreshold;
      this.thresholdY = slideThreshold;
    } else {
      var pageSize = this.page.getPageSize();
      if (pageSize) {
        this.thresholdX = Math.round(pageSize.width * slideThreshold);
        this.thresholdY = Math.round(pageSize.height * slideThreshold);
      }
    }
  };
  Slide.prototype.cloneSlideEleForLoop = function (slideEls) {
    var children = slideEls.children;
    prepend(children[children.length - 1].cloneNode(true), slideEls);
    slideEls.appendChild(children[1].cloneNode(true));
  };
  Slide.prototype.amendCurrentPage = function () {
    this.isTouching = false;
    if (!this.slideOpt.loop) {
      return;
    }
    // triggered by resetLoop
    if (this.resetLooping) {
      this.resetLooping = false;
      return;
    }
    // fix bug: scroll two page or even more page at once and fetch the boundary.
    // In this case, momentum won't be trigger, so the pageIndex will be wrong and won't be trigger reset.
    var isScrollToBoundary = false;
    if (
      this.page.loopX &&
      (this.scroll.x === this.scroll.scroller.scrollBehaviorX.minScrollPos ||
        this.scroll.x === this.scroll.scroller.scrollBehaviorX.maxScrollPos)
    ) {
      isScrollToBoundary = true;
    }
    if (
      this.page.loopY &&
      (this.scroll.y === this.scroll.scroller.scrollBehaviorY.minScrollPos ||
        this.scroll.y === this.scroll.scroller.scrollBehaviorY.maxScrollPos)
    ) {
      isScrollToBoundary = true;
    }
    if (isScrollToBoundary) {
      var scrollBehaviorX = this.scroll.scroller.scrollBehaviorX;
      var scrollBehaviorY = this.scroll.scroller.scrollBehaviorY;
      var newPos = this.page.nearestPage(
        fixInboundValue(this.scroll.x, scrollBehaviorX.maxScrollPos, scrollBehaviorX.minScrollPos),
        fixInboundValue(this.scroll.y, scrollBehaviorY.maxScrollPos, scrollBehaviorY.minScrollPos),
        0,
        0
      );
      var newPage = {
        x: newPos.x,
        y: newPos.y,
        pageX: newPos.pageX,
        pageY: newPos.pageY
      };
      if (!this.page.isSameWithCurrent(newPage)) {
        this.page.changeCurrentPage(newPage);
      }
    }
    var changePage = this.page.resetLoopPage();
    if (changePage) {
      this.resetLooping = true;
      this.goTo(changePage.pageX, changePage.pageY, 0);
      return true; // stop trigger chain
    }
    // amend willChangeToPage, because willChangeToPage maybe wrong when sliding quickly
    this.pageWillChangeTo(this.page.currentPage);
  };
  Slide.prototype.shouldSetWidthHeight = function (checkType) {
    var checkMap = {
      width: ['scrollX', 'disableSetWidth'],
      height: ['scrollY', 'disableSetHeight']
    };
    var checkOption = checkMap[checkType];
    if (!this.scroll.options[checkOption[0]]) {
      return false;
    }
    if (this.slideOpt[checkOption[1]]) {
      return false;
    }
    return true;
  };
  Slide.prototype.clearSlideWidth = function (slideEls) {
    if (!this.shouldSetWidthHeight('width')) {
      return;
    }
    var children = slideEls.children;
    for (var i = 0; i < children.length; i++) {
      var slideItemDom = children[i];
      slideItemDom.removeAttribute('style');
    }
    slideEls.removeAttribute('style');
  };
  Slide.prototype.setSlideWidth = function (slideEls) {
    if (!this.shouldSetWidthHeight('width')) {
      return false;
    }
    var children = slideEls.children;
    var slideItemWidth = children[0].clientWidth;
    for (var i = 0; i < children.length; i++) {
      var slideItemDom = children[i];
      slideItemDom.style.width = slideItemWidth + 'px';
    }
    slideEls.style.width = slideItemWidth * children.length + 'px';
    return true;
  };
  Slide.prototype.clearSlideHeight = function (slideEls) {
    if (!this.shouldSetWidthHeight('height')) {
      return;
    }
    var children = slideEls.children;
    for (var i = 0; i < children.length; i++) {
      var slideItemDom = children[i];
      slideItemDom.removeAttribute('style');
    }
    slideEls.removeAttribute('style');
  };
  // height change will not effect minScrollY & maxScrollY
  Slide.prototype.setSlideHeight = function (slideWrapper, slideEls) {
    if (!this.shouldSetWidthHeight('height')) {
      return false;
    }
    var wrapperHeight = slideWrapper.clientHeight;
    var children = slideEls.children;
    for (var i = 0; i < children.length; i++) {
      var slideItemDom = children[i];
      slideItemDom.style.height = wrapperHeight + 'px';
    }
    slideEls.style.height = wrapperHeight * children.length + 'px';
    return true;
  };
  Slide.prototype.goTo = function (pageX, pageY, time, easing) {
    if (pageY === void 0) {
      pageY = 0;
    }
    var newPageInfo = this.page.change2safePage(pageX, pageY);
    if (!newPageInfo) {
      return;
    }
    var scrollEasing = easing || this.slideOpt.easing || ease.bounce;
    var posX = newPageInfo.x;
    var posY = newPageInfo.y;
    var deltaX = posX - this.scroll.scroller.scrollBehaviorX.currentPos;
    var deltaY = posY - this.scroll.scroller.scrollBehaviorY.currentPos;
    if (!deltaX && !deltaY) {
      return;
    }
    time = time === undefined ? this.getAnimateTime(deltaX, deltaY) : time;
    this.page.changeCurrentPage({
      x: posX,
      y: posY,
      pageX: newPageInfo.pageX,
      pageY: newPageInfo.pageY
    });
    this.pageWillChangeTo(this.page.currentPage);
    this.scroll.scroller.scrollTo(posX, posY, time, scrollEasing);
  };
  Slide.prototype.flickHandler = function () {
    var scrollBehaviorX = this.scroll.scroller.scrollBehaviorX;
    var scrollBehaviorY = this.scroll.scroller.scrollBehaviorY;
    var deltaX = scrollBehaviorX.currentPos - scrollBehaviorX.startPos;
    var deltaY = scrollBehaviorY.currentPos - scrollBehaviorY.startPos;
    var time = this.getAnimateTime(deltaX, deltaY);
    this.goTo(
      this.page.currentPage.pageX + scrollBehaviorX.direction,
      this.page.currentPage.pageY + scrollBehaviorY.direction,
      time
    );
  };
  Slide.prototype.getAnimateTime = function (deltaX, deltaY) {
    if (this.slideOpt.speed) {
      return this.slideOpt.speed;
    }
    return Math.max(Math.max(Math.min(Math.abs(deltaX), 1000), Math.min(Math.abs(deltaY), 1000)), 300);
  };
  Slide.prototype.modifyScrollMetaHandler = function (scrollMeta) {
    var newPos = this.nearestPage(scrollMeta.newX, scrollMeta.newY);
    scrollMeta.time = this.getAnimateTime(scrollMeta.newX - newPos.x, scrollMeta.newY - newPos.y);
    scrollMeta.newX = newPos.x;
    scrollMeta.newY = newPos.y;
    scrollMeta.easing = this.slideOpt.easing || ease.bounce;
    this.page.changeCurrentPage({
      x: scrollMeta.newX,
      y: scrollMeta.newY,
      pageX: newPos.pageX,
      pageY: newPos.pageY
    });
    this.pageWillChangeTo(this.page.currentPage);
  };
  Slide.prototype.scrollMoving = function (point) {
    if (this.isTouching) {
      var newPos = this.nearestPage(point.x, point.y);
      this.pageWillChangeTo(newPos);
    }
  };
  Slide.prototype.pageWillChangeTo = function (newPage) {
    var changeToPage = this.page.getRealPage(newPage);
    if (changeToPage.pageX === this.willChangeToPage.pageX && changeToPage.pageY === this.willChangeToPage.pageY) {
      return;
    }
    this.willChangeToPage = changeToPage;
    this.scroll.trigger('slideWillChange', this.willChangeToPage);
  };
  Slide.prototype.setTouchFlag = function () {
    this.isTouching = true;
  };
  Slide.prototype.registorHooks = function (hooks, name, handler) {
    hooks.on(name, handler, this);
    this.hooksFn.push([hooks, name, handler]);
  };
  Slide.pluginName = 'slide';
  return Slide;
})();

export default Slide;

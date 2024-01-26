const Model = require('../../../shared/model');
const { tracker } = require('../utils/tracker');

var LessonModel = function (args) {
  Model.call(this);

  this.index = args.index;
  this.url = args.url;
  this.name = args.name;
  this.header = args.header;
  this.title = args.title;
  this.completionBadge = args.completionBadge;

  this.numberOfLessons = args.numberOfLessons;
  this.baseURL = args.baseURL;
  this.absoluteURL = this.url.startsWith('http') ? this.url : this.baseURL + this.url;
};
LessonModel.prototype = Object.create(Model.prototype);

LessonModel.prototype.fetch = function (callback) {
  var _this = this;

  var url = this.url.startsWith('http') ? this.url : this.baseURL + this.url;

  function extractAnnotations() {
    _this.annotations = [];

    for (var j in _this.lessons) {
      var annotations = _this.lessons[j].match(/data-[^=]+="[^"]+"/g);
      if (annotations) {
        var _a = {};
        for (var i in annotations) {
          var a = annotations[i];
          var name = a.substring(0, a.indexOf('='));
          var value = a.substring(a.indexOf('=') + 2, a.length - 1);
          _a[name] = value;
        }
        _this.annotations.push(_a);
      }
    }
  }

  $.ajax({
    url: url,
    cache: false,
    headers: {
      Accept: 'text/html'
    },
    success: function (html) {
      _this.lessons = html
        .split('<!-- # -->')
        .map((step) => step.trim())
        .filter((step) => step.length > 0);
      _this.numberOfLessons = _this.lessons.length;
      extractAnnotations();
      callback && callback();
    },
    error: function (err) {
      _this.lessons = undefined;
      callback && callback();
    }
  });
};

LessonModel.prototype.start = function () {
  this.fetch(() => {
    if (this.lessons) {
      if (this.index === 0) {
        // Track the the lesson is started
        tracker.track('Lesson started', {
          url: this.absoluteURL,
          name: this.name
        });
      }

      this.notifyListeners('instructionsFetched');
    }
  });
};

LessonModel.prototype.reportChanged = function () {
  if (this.index >= this.lessons.length - 1) {
    tracker.track('Lesson completed', {
      // Track that lesson is completed
      url: this.absoluteURL,
      name: this.name
    });
  } else if (this.index > 0) {
    tracker.track('Lesson next', {
      // Track that user moves to next lesson
      index: this.index,
      url: this.absoluteURL,
      name: this.name
    });
    tracker.increment('TotalLessonPartsCompleted', 1);
  }

  this.notifyListeners('instructionsChanged');
};

LessonModel.prototype.next = function () {
  if (this.index >= this.numberOfLessons - 1) {
    return;
  }

  this.index++;
  this.reportChanged();
};

LessonModel.prototype.getInstructions = function (step) {
  if (!this.lessons) return;
  if (step === undefined) step = 0;

  return this.lessons[step];
};

LessonModel.prototype.getAnnotations = function (step) {
  if (!this.annotations) return;
  if (step === undefined) step = 0;

  return this.annotations[step];
};

LessonModel.prototype.getCurrentSuggestedNodes = function () {
  if (!this.annotations) return;

  for (var i = this.index; i >= 0; i--) {
    var nodes = this.annotations[i]['data-suggested-nodes'];
    if (nodes) return nodes.split(',');
  }
};

LessonModel.prototype.getCurrentIconsDisabled = function () {
  let disabledIcons = [];

  if (this.annotations) {
    for (var i = this.index; i >= 0; i--) {
      const icons = this.annotations[i]['data-disable-icons'];
      if (icons) {
        disabledIcons = icons.split(',');
        break;
      }
    }
  }

  return disabledIcons.concat(['deploy', 'cloudServices']); //always disable deploy and cloudServices
};

LessonModel.prototype.getLength = function () {
  if (!this.lessons) return 0;
  return this.lessons.length;
};

LessonModel.prototype.getProgress = function () {
  if (!this.numberOfLessons || !this.index) return 0;

  var progress = Math.min(Math.round((this.index / this.numberOfLessons) * 100), 100);
  return progress;
};

LessonModel.prototype.toJSON = function () {
  return {
    index: this.index,
    numberOfLessons: this.numberOfLessons,
    url: this.url,
    name: this.name,
    header: this.header,
    title: this.title,
    baseURL: this.baseURL,
    completionBadge: this.completionBadge
  };
};

LessonModel.fromJSON = function (json) {
  return new LessonModel(json);
};

module.exports = LessonModel;

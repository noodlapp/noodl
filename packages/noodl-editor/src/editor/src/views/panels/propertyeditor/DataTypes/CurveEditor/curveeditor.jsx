const React = require('react');

const Styles = {
  curveIcon: {
    backgroundColor: '#222',
    width: '40px',
    height: '40px',
    display: 'flex',
    justifyContent: 'center',
    padding: '2px'
  },
  curveIconImage: {
    opacity: 0.7,
    ':hover': {
      opacity: 1
    }
  },
  animationPlup: {
    height: '21px',
    width: '21px',
    borderRadius: '15px',
    backgroundColor: '#999',
    position: 'relative',
    top: '2px',
    left: '2px'
  }
};

class CurveEditor extends React.Component {
  _curtop = 0;

  constructor(props) {
    super(props);

    this.value = props.value || props.default;
    this.default = props.default;

    this.state = {
      duration: this.value.dur,
      isDurationDefault: this.value === undefined,
      delay: this.value.delay,
      isDelayDefault: this.value === undefined,
      cssBezierValues: this.value.curve
    };

    this.onUpdate = props.onUpdate;
  }

  getDevicePixelRatio(ctx) {
    var dpr = window.devicePixelRatio || 1;
    var bsr =
      ctx.webkitBackingStorePixelRatio ||
      ctx.mozBackingStorePixelRatio ||
      ctx.msBackingStorePixelRatio ||
      ctx.oBackingStorePixelRatio ||
      ctx.backingStorePixelRatio ||
      1;
    var r = dpr / bsr;
    return r;
  }

  componentDidMount() {
    const canvas = this.refs.canvas;
    const ctx = canvas.getContext('2d');

    canvas.ratio = this.getDevicePixelRatio(ctx);
    //console.log(this.canvas.ratio);

    var oldWidth = canvas.width;
    var oldHeight = canvas.height;

    canvas.width = oldWidth * canvas.ratio;
    canvas.height = oldHeight * canvas.ratio;

    canvas.width = canvas.width;
    canvas.height = canvas.height;

    canvas.style.width = oldWidth + 'px';
    canvas.style.height = oldHeight + 'px';

    this.canvas = canvas;

    this.endPoints = [
      {
        x: 20,
        y: 180
      },
      {
        x: 180,
        y: 20
      }
    ];

    this.controlPoints = [
      {
        x: 0,
        y: 0
      },
      {
        x: 0,
        y: 0
      }
    ];

    this.presetTo(this.value.curve);

    this.setState({
      cssBezierValues: this.value.curve
    });

    this.paint();

    this._mouseMoveListener = this.onMouseMove.bind(this);
    document.addEventListener('mousemove', this._mouseMoveListener);
    this._mouseUpListener = this.onMouseUp.bind(this);
    document.addEventListener('mouseup', this._mouseUpListener);
  }

  canvasTopLeft() {
    var obj = this.canvas;
    var curleft = (this._curtop = 0);
    if (obj.offsetParent) {
      do {
        curleft += obj.offsetLeft;
        this._curtop += obj.offsetTop;
      } while ((obj = obj.offsetParent));
    }
    return [curleft, this._curtop];
  }

  isCloseTo(x, y, pnt) {
    return x >= pnt.x - 10 && x <= pnt.x + 10 && y >= pnt.y - 10 && y <= pnt.y + 10;
  }

  componentWillReceiveProps(props) {
    this.value = props.value || props.default;
    this.default = props.default;

    this.setState({
      duration: this.value.dur,
      isDurationDefault: this.value === undefined,
      delay: this.value.delay,
      isDelayDefault: this.value === undefined,
      cssBezierValues: this.value.curve
    });

    this.onUpdate = props.onUpdate;
    this.presetTo(this.value.curve);
    this.paint();
  }

  onMouseMove(evt) {
    if (this.trackMove) {
      var tl = this.canvasTopLeft();
      var x = evt.pageX - tl[0];
      var y = evt.pageY - tl[1];

      this.trackMove.x = x;
      this.trackMove.y = y;
      this.paint();

      this.setState({
        cssBezierValues: this.getCssBezierValues()
      });
      this.updateValues(true);
    }

    //    console.log(evt);
  }

  onMouseDown(evt) {
    var tl = this.canvasTopLeft();
    var x = evt.pageX - tl[0];
    var y = evt.pageY - tl[1];

    this.trackMove = undefined;
    if (this.isCloseTo(x, y, this.controlPoints[0]) || this.isCloseTo(x, y, this.endPoints[0])) {
      this.trackMove = this.controlPoints[0];
    }

    if (this.isCloseTo(x, y, this.controlPoints[1]) || this.isCloseTo(x, y, this.endPoints[1])) {
      this.trackMove = this.controlPoints[1];
    }

    //   console.log('down',evt)
  }

  onMouseUp(evt) {
    if (this.trackMove) {
      this.updateValues();
      this.testTiming();
    }
    this.trackMove = false;
  }

  componentWillUnmount() {
    document.removeEventListener('mousemove', this._mouseMoveListener);
    document.removeEventListener('mouseup', this._mouseUpListener);
  }

  presetTo(p) {
    const presets = {
      linear: [0.0, 0.0, 1.0, 1.0],
      'ease-in': [0.42, 0.0, 1.0, 1.0],
      'ease-out': [0.0, 0.0, 0.58, 1.0],
      'ease-in-out': [0.42, 0.0, 0.58, 1.0]
    };

    if (typeof p === 'string') p = presets[p];

    var size = 160;
    this.controlPoints[0].x = p[0] * size + this.endPoints[0].x;
    this.controlPoints[0].y = -(p[1] * size) + this.endPoints[0].y;

    this.controlPoints[1].x = p[2] * size + this.endPoints[0].x;
    this.controlPoints[1].y = -(p[3] * size) + this.endPoints[0].y;

    this.setState({
      cssBezierValues: p
    });

    this.paint();
  }

  updateValues(drag) {
    var curve = this.getCssBezierValues();
    var dur = parseFloat(this.state.duration);
    var delay = parseFloat(this.state.delay);

    this.onUpdate &&
      this.onUpdate(
        { curve: curve, dur: isNaN(dur) ? this.default.dur : dur, delay: isNaN(delay) ? this.default.delay : delay },
        drag
      );
  }

  getCssBezierValues() {
    var size = 160;
    function round(num) {
      return Math.round((num + Number.EPSILON) * 100) / 100;
    }
    return [
      round((this.controlPoints[0].x - this.endPoints[0].x) / size),
      round(-(this.controlPoints[0].y - this.endPoints[0].y) / size),
      round((this.controlPoints[1].x - this.endPoints[0].x) / size),
      round(-(this.controlPoints[1].y - this.endPoints[0].y) / size)
    ];
  }

  onDurationChange(evt) {
    const v = evt.target.value;

    this.setState({
      duration: v,
      isDurationDefault: false
    });
  }

  onDurationBlur(evt) {
    const v = evt.target.value;

    this.setState({
      duration: v == undefined || v === '' ? this.default.dur : v,
      isDurationDefault: v == undefined || v === ''
    });
    this.updateValues();
    this.testTiming();
  }

  onDelayChange(evt) {
    const v = evt.target.value;

    this.setState({
      delay: v,
      isDelayDefault: false
    });
  }

  onDelayBlur(evt) {
    const v = evt.target.value;

    this.setState({
      delay: v == undefined || v === '' ? this.default.delay : v,
      isDelayDefault: v == undefined || v === ''
    });
    this.updateValues();
    this.testTiming();
  }

  testTiming() {
    this.refs.animationPlup.style.transition = 'none';
    this.refs.animationPlup.style.transform = 'translate(30px)';
    void this.refs.animationPlup.offsetWidth;
    this.refs.animationPlup.style.transition = 'transform';
    this.refs.animationPlup.style.transitionDuration = this.state.duration + 'ms';
    this.refs.animationPlup.style.transitionDelay = this.state.delay + 'ms';
    this.refs.animationPlup.style.transitionTimingFunction =
      'cubic-bezier(' + this.getCssBezierValues().join(',') + ')';
    void this.refs.animationPlup.offsetWidth;
    this.refs.animationPlup.style.transform = 'translate(180px)';
  }

  paint() {
    const canvas = this.refs.canvas;
    const ctx = canvas.getContext('2d');

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(canvas.ratio, canvas.ratio);

    const w = 200,
      h = 200;
    const m = 20;

    var cps = this.controlPoints;

    // Background
    ctx.fillStyle = '#222222';
    ctx.fillRect(0, 0, w, h);

    // Control lines
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(m, h - m);
    ctx.lineTo(cps[0].x, cps[0].y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(w - m, m);
    ctx.lineTo(cps[1].x, cps[1].y);
    ctx.stroke();

    // Curve
    ctx.strokeStyle = '#555555';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(m, h - m);
    ctx.bezierCurveTo(cps[0].x, cps[0].y, cps[1].x, cps[1].y, w - m, m);
    ctx.stroke();

    // End points
    ctx.fillStyle = '#777777';
    ctx.beginPath();
    ctx.arc(m, h - m, 7, 0, 2 * Math.PI);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(w - m, m, 7, 0, 2 * Math.PI);
    ctx.fill();

    // Control points
    ctx.fillStyle = '#dddddd';
    ctx.beginPath();
    ctx.arc(cps[0].x, cps[0].y, 7, 0, 2 * Math.PI);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cps[1].x, cps[1].y, 7, 0, 2 * Math.PI);
    ctx.fill();
  }

  onCurveInputChanged(index, evt) {
    const v = evt.target.value;

    this.state.cssBezierValues[index] = v;
    this.setState({
      cssBezierValues: this.state.cssBezierValues
    });
  }

  onCurveInputBlur(index, evt) {
    this.presetTo(this.state.cssBezierValues);
    this.testTiming();
    this.updateValues();
  }

  renderCurveInputs() {
    return this.state.cssBezierValues.map((c, index) => {
      return (
        <div style={{ width: '59px', height: '35px', position: 'relative', marginRight: '5px' }}>
          <input
            type="string"
            style={{ position: 'absolute', width: '100%', height: '100%', textAlign: 'right', paddingRight: '10px' }}
            className={'sidebar-panel-dark-input' + (this.state.isDurationDefault ? ' property-input-default' : '')}
            value={c}
            onChange={this.onCurveInputChanged.bind(this, index)}
            onBlur={this.onCurveInputBlur.bind(this, index)}
            onKeyDown={(e) => e.keyCode === 13 && e.target.blur()}
          ></input>
        </div>
      );
    });
  }

  render() {
    return (
      <div style={{ width: '270px', height: '370px' }}>
        <canvas
          style={{ position: 'relative', marginLeft: '10px', marginTop: '10px' }}
          ref="canvas"
          width="200"
          height="200"
          onMouseDown={this.onMouseDown.bind(this)}
        ></canvas>

        <div
          style={{ position: 'absolute', top: '10px', right: '10px', ...Styles.curveIcon }}
          onClick={() => {
            this.presetTo('ease-in');
            this.updateValues();
          }}
        >
          <img key="ease-in-icon" src="../assets/icons/curve-ease-in.svg" style={Styles.curveIconImage}></img>
        </div>

        <div
          style={{ position: 'absolute', top: '62px', right: '10px', ...Styles.curveIcon }}
          onClick={() => {
            this.presetTo('ease-out');
            this.updateValues();
          }}
        >
          <img key="ease-out-icon" src="../assets/icons/curve-ease-out.svg" style={Styles.curveIconImage}></img>
        </div>

        <div
          style={{ position: 'absolute', top: '113px', right: '10px', ...Styles.curveIcon }}
          onClick={() => {
            this.presetTo('ease-in-out');
            this.updateValues();
          }}
        >
          <img key="ease-in-out-icon" src="../assets/icons/curve-ease-in-out.svg" style={Styles.curveIconImage}></img>
        </div>

        <div
          style={{ position: 'absolute', top: '165px', right: '10px', ...Styles.curveIcon }}
          onClick={() => {
            this.presetTo('linear');
            this.updateValues();
          }}
        >
          <img key="ease-linear-icon" src="../assets/icons/curve-linear.svg" style={Styles.curveIconImage}></img>
        </div>

        <div style={{ position: 'relative', height: '35px', display: 'flex', marginLeft: '10px', marginBottom: '5px' }}>
          {this.renderCurveInputs()}
        </div>

        <div style={{ height: '35px', position: 'relative' }}>
          <label className="property-label">Duration (ms)</label>
          <div className="property-value">
            <input
              type="string"
              className={'sidebar-panel-dark-input' + (this.state.isDurationDefault ? ' property-input-default' : '')}
              style={{ position: 'absolute', width: '100%', height: '100%' }}
              value={this.state.duration}
              onChange={this.onDurationChange.bind(this)}
              onBlur={this.onDurationBlur.bind(this)}
              onKeyDown={(e) => e.keyCode === 13 && e.target.blur()}
            ></input>
          </div>
        </div>

        <div style={{ height: '35px', position: 'relative' }}>
          <label className="property-label">Delay (ms)</label>
          <div className="property-value">
            <input
              type="string"
              className={'sidebar-panel-dark-input' + (this.state.isDelayDefault ? ' property-input-default' : '')}
              style={{ position: 'absolute', width: '100%', height: '100%' }}
              value={this.state.delay}
              onChange={this.onDelayChange.bind(this)}
              onBlur={this.onDelayBlur.bind(this)}
              onKeyDown={(e) => e.keyCode === 13 && e.target.blur()}
            ></input>
          </div>
        </div>

        <div
          style={{
            height: '25px',
            position: 'relative',
            backgroundColor: '#222',
            marginTop: '5px',
            marginLeft: '10px',
            marginRight: '10px',
            borderRadius: '15px'
          }}
          onClick={this.testTiming.bind(this)}
        >
          <div ref="animationPlup" style={{ ...Styles.animationPlup, transform: 'translate(30px)' }}></div>
        </div>
      </div>
    );
  }
}

module.exports = CurveEditor;

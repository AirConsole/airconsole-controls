var SwipePattern = function(el, opts) {
  var me = this;
  opts = opts || {}
  //
  this.container = el;
  this.touchend_cb = opts.touchend || null;
  this.onTouchCircle = opts.onTouchCircle || null;
  this.style = opts.style || {
    circle: {
      fill_color: '#ADEE00',
      stroke_color: "#222222",
      stroke_width: 10
    },
    line: {
      stroke_color: "#54D7FF",
      stroke_width: 8
    }
  };
  //
  this.circles = [];
  this.touched_circles = [];
  this.current_line = null;
  this.canvas = null;
  this.ctx = null;
  this.is_mousedown = false;
  //
  this.setup(opts);
};

SwipePattern.prototype = {

  setup: function(opts) {
    this.canvas = document.createElement("canvas");
    var container_rect = this.container.getBoundingClientRect();
    this.canvas.width = container_rect.width;
    this.canvas.height = container_rect.height;
    this.canvas.className = 'swipe-pattern-canvas';
    this.container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext("2d");
    this.bindEvents();
    this.createCircleObjects(opts.circles || []);
    this.drawCircles();
  },

  bindEvents: function() {
    this.container.addEventListener("touchstart", this.onTouchStartHandler.bind(this));
    this.container.addEventListener("touchmove", this.onTouchMoveHandler.bind(this));
    this.container.addEventListener("touchend", this.onTouchEndHandler.bind(this));

    // Mouse fallback
    if (!("ontouchstart" in document.createElement("div"))) {
      this.container.addEventListener("mousedown", this.onTouchStartHandler.bind(this));
      this.container.addEventListener("mousemove", this.onTouchMoveHandler.bind(this));
      this.container.addEventListener("mouseup", this.onTouchEndHandler.bind(this));
    }
  },

  mousePointInCircle: function(point) {
    var is_in = null;
    for (var i = 0; i < this.circles.length; i++) {
      var circle = this.circles[i];
      if (this.pointInCircle(point, circle)) {
        is_in = circle;
        break;
      }
    }
    return is_in;
  },

  addConnectionLine: function(circle) {
    var last_circle = this.touched_circles[this.touched_circles.length - 1];
    // Set next link if it is not the same circle
    if ((last_circle && last_circle.id !== circle.id) || !last_circle) {
      this.addTouchedCircle(circle);
      if (last_circle) {
        this.current_line = null;
        this.drawConnections();
      }
    }
  },

  addTouchedCircle: function(circle) {
    this.touched_circles.push(circle);
    if (this.onTouchCircle) {
      this.onTouchCircle(circle);
    }
  },

  onTouchStartHandler: function(e) {
    this.is_mousedown = true;
    this.update();
    e.preventDefault();
  },

  onTouchMoveHandler: function(e) {
    if (this.is_mousedown) {
      var point = this.getEventPoint(e);
      var circle = this.mousePointInCircle(point);
      if (circle) {
        this.addConnectionLine(circle);
      } else {
        this.current_line = {x: point.x, y: point.y};
      }
    }
    e.preventDefault();
  },

  onTouchEndHandler: function(e) {
    this.is_mousedown = false;
    if (this.touchend_cb) {
      this.touchend_cb(this.touched_circles);
    }
    this.touched_circles = [];
    this.clearCanvas();
    this.drawCircles();
    e.preventDefault();
  },

  // ======================================================

  clearCanvas: function() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  },

  draw: function() {
    this.clearCanvas();
    this.drawCircles();
    this.drawConnections();
    this.drawDragLine();
  },

  drawDragLine: function() {
    var last_circle = this.touched_circles[this.touched_circles.length - 1];
    if (last_circle && this.current_line) {
      this.drawLine(last_circle, this.current_line);
    }
  },

  update: function() {
    if (!this.is_mousedown) return;
    this.draw();
    requestAnimationFrame(this.update.bind(this));
  },

  drawCircles: function() {
    for (var i = 0; i < this.circles.length; i++) {
      var circle = this.circles[i];
      this.drawCircle(circle);
    }
  },

  drawConnections: function(connections) {
    connections = connections || this.touched_circles;
    for (var i = 0; i < connections.length; i++) {
      var circle = connections[i];
      if (i === 0) continue;
      var prev = connections[i - 1];
      if (prev) {
        this.drawLine(circle, prev);
      }
    }
  },

  createCircleObjects: function(circles) {
    for (var i = 0; i < circles.length; i++) {
      var p = circles[i];
      var opts = {
        id: p.id || (i + 1),
        x: p.x,
        y: p.y,
        radius: p.radius || 30,
        style: p.style || null
      };
      this.circles.push(opts);
    }
  },

  pathIsTouched: function(sequence, order_matters) {
    if (!this.touched_circles.length) return false;
    var len = sequence.length;
    var counter = 0;
    for (var i = 0; i < sequence.length; i++) {
      // Order matters
      if (order_matters) {
        if (this.touched_circles[i]) {
          if (sequence[i] === this.touched_circles[i].id) {
            counter++;
          }
        }
      // Order does not matter, just check if they are touched
      } else {
        for (var t = 0; t < this.touched_circles.length; t++) {
          if (this.touched_circles[t].id === sequence[i]) {
            counter++;
            break;
          }
        }
      }
    }
    return counter === len;
  },

  // ======================================================

  drawCircle: function(circle) {
    this.ctx.beginPath();
    this.ctx.arc(circle.x, circle.y, circle.radius, 0, 2 * Math.PI, false);
    var style = circle.style || this.style.circle;
    this.ctx.fillStyle = style.fill_color;
    this.ctx.fill();
    this.ctx.lineWidth = style.stroke_width;
    this.ctx.strokeStyle = style.stroke_color;
    this.ctx.stroke();
  },

  drawLine: function(start, end) {
    var style = this.style.line;
    this.ctx.beginPath();
    this.ctx.moveTo(start.x, start.y);
    this.ctx.lineTo(end.x, end.y);
    this.ctx.closePath();
    this.ctx.lineWidth = style.stroke_width;
    // set line color
    this.ctx.strokeStyle = style.stroke_color;
    this.ctx.stroke();
  },

  getRelativePos: function(e) {
    var pos = this.getEventPoint(e);
    var rect = this.container.getBoundingClientRect();
    return { "x": pos.x - rect.left, "y": pos.y - rect.top };
  },

  pointInCircle: function(point, circle) {
    var distance = Math.pow(circle.x - point.x, 2) + Math.pow(circle.y - point.y, 2);
    return distance <= (circle.radius * circle.radius);
  },

  /**
   * Returns the event point coordinates considering both touch and mouse events
   * @param {Event} e - An event
   * @return {DPad~Coordinate}
   */
  getEventPoint: function(e) {
    var out = { x: 0, y: 0 };
    if(e.touches && (e.type == 'touchstart' || e.type == 'touchmove' ||
      e.type == 'touchend' || e.type == 'touchcancel')) {
      var touch = e.targetTouches[0] || e.changedTouches[0] || e.touches[0];
      out.x = touch.pageX;
      out.y = touch.pageY;
    } else if (e.type == 'mousedown' || e.type == 'mouseup' || e.type == 'mousemove' ||
               e.type == 'mouseover'|| e.type=='mouseout' || e.type=='mouseenter' ||
               e.type=='mouseleave') {
      out.x = e.pageX;
      out.y = e.pageY;
    }
    return out;
  }

};

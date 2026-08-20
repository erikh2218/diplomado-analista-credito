
class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

class AnswerText {
  constructor(label, x, y, maxX, yStep) {
    this.x = x;
    this.y = y;
    this.label = label;
    this.imagePath = '';
    this.textSize = 16;
    this.maxX = maxX;
    this.yStep = yStep;
    this.brightness = 0;
  }

  show() {
    stroke(255);
    strokeWeight(2);
    textStyle(BOLD);
    fill(this.brightness, 125);
    textSize(this.textSize);
    text(this.label, this.x, this.y);
  }

  move(deltaX, deltaY) {
    this.x = this.x + deltaX;
    this.y = this.y + deltaY;
  }

  select(x, y) {
    if (this.isMouseOver(x, y)) {
      this.brightness = 150;
      return true;
    } else {
      this.brightness = 0;
      return false;
    }
  }

  unselect() {
    this.brightness = 0;
  }

  isMouseOver(x, y) {
    if (x >= this.x && x <= this.maxX && y >= this.y - 15 && y <= this.y) {
      return true;
    } else {
      return false;
    }
  }
}

class AnswerFigure {
  constructor(sketchHolder, points, figureType, figureOptions, resizeRatio) {
    this.points = points;
    this.figureType = figureType;
    this.figureOptions = figureOptions;
    this.brightness = 0;
    this.state = 'new';
    this.order = 0;
    this.inputText = '';
    this.sketchHolder = sketchHolder;
    this.resizeRatio = resizeRatio ? resizeRatio : sketchHolder.resizeRatio;
  }

  data() {
    return JSON.stringify({
      "type": this.figureType,
      "points": this.points,
      "options": this.figureOptions,
      "position": this.order,
      "resizeRatio": this.sketchHolder.resizeRatio,
      "canvasWidth": this.sketchHolder.helperCanvasWidth,
    })
  }

  move(deltaX, deltaY) {
    for (var i = 0; i < this.points.length; i++) {
      this.points[i].x = this.points[i].x + deltaX;
      this.points[i].y = this.points[i].y + deltaY;
    }

    $('#choice_text_' + this.order).val(this.data());
  }

  update(x, y) {
    if (this.figureType === 'Circle') {
      this.figureOptions.r = this.sketchHolder.dist(this.points[0].x, this.points[0].y, x, y);
    } else if (this.figureType === 'Rectangle') {
      this.figureOptions.width = x - this.points[0].x;
      this.figureOptions.heigth = y - this.points[0].y;
    } else if (this.figureType === 'Polygon') {
      this.points.push(new Point(x, y));
    }
  }

  clear() {
    $(`#inputContainer_${this.order}`).remove();
    this.sketchHolder.updateAttributes();
  }

  buildControls() {
    $("#canvas-controlls").append(`<p id='inputContainer_${this.order}' >${this.order}. </p>`);
    $(`#inputContainer_${this.order}`).append(`<input id="item_text_${this.order}" name="item_text[${this.order}]" style="width: 170px" size="70" type="text" value="${this.inputText}">`);
    $(`#inputContainer_${this.order}`).append(`<input id="choice_text_${this.order}" name="choice_text[${this.order}]" type="hidden">`);
    $(`#inputContainer_${this.order}`).append(`<a id="delete_answer_figure_${this.order}" href="javascript:void(0)" title="Delete hotspot" onclick="myp5s[0].deleteFigure(${this.order})"><i class="delete single"></i></a>`);
    $(`#choice_text_${this.order}`).val(this.data());
  }

  done(fromKeyCode = false) {
    if (this.state === 'new') {
      if (this.figureType === 'Rectangle') {
        this.transformRect();
      } else if (this.figureType === 'Polygon' && !fromKeyCode) {
        // remove last point added by double click
        this.points.pop();
      }

      this.buildControls();
    }

    this.state = 'done';

    return this.isValidFigure();
  }

  isValidFigure() {
    if (this.figureType === 'Polygon') {
      return this.points.length > 2;
    } else if (this.figureType === 'Circle') {
      return this.figureOptions.r > 5;
    } else if (this.figureType === 'Rectangle') {
      return Math.abs(this.figureOptions.width) > 2 && Math.abs(this.figureOptions.heigth) > 2;
    } else {
      return false;
    }
  }

  transformRect() {
    if (this.figureOptions.width < 0) {
      this.figureOptions.width = Math.abs(this.figureOptions.width);
      this.points[0].x -= this.figureOptions.width;
    }

    if (this.figureOptions.heigth < 0) {
      this.figureOptions.heigth = Math.abs(this.figureOptions.heigth);
      this.points[0].y -= this.figureOptions.heigth;
    }
  }

  select(x, y) {
    if (this.isMouseOver(x, y)) {
      this.brightness = 150;
      return true
    } else {
      this.brightness = 0;
      return false
    }
  }

  isMouseOver(x, y) {
    if (this.figureType === 'Circle' && this.sketchHolder.dist(this.points[0].x, this.points[0].y, x, y) <= this.figureOptions.r) {
      return true;
    } else if (this.figureType === 'Rectangle' && this.points[0].x + this.figureOptions.width >= x && this.points[0].y + this.figureOptions.heigth >= y && this.points[0].x <= x && this.points[0].y <= y) {
      return true;
    } else if (this.figureType === 'Polygon' && pointInPolygon([x, y], this.points)) {
      return true;
    } else {
      return false;
    }
  }

  unselect() {
    this.brightness = 0;
  }

  show(x, y) {
    var drawResizeRatio = this.sketchHolder.drawResizeRatio;
    this.sketchHolder.stroke(255);
    this.sketchHolder.strokeWeight(2);
    this.sketchHolder.fill(this.brightness, 125);
    if (this.figureType === 'Circle') {
      this.sketchHolder.circle(this.points[0].x * drawResizeRatio, this.points[0].y * drawResizeRatio, this.figureOptions.r * 2 * drawResizeRatio)
    } else if (this.figureType === 'Rectangle') {
      this.sketchHolder.rect(this.points[0].x * drawResizeRatio, this.points[0].y * drawResizeRatio, this.figureOptions.width * drawResizeRatio, this.figureOptions.heigth * drawResizeRatio);
    } else if (this.figureType === 'Polygon') {
      this.sketchHolder.beginShape();
      for (var i = 0; i < this.points.length; i++) {
        this.sketchHolder.vertex(this.points[i].x * drawResizeRatio, this.points[i].y * drawResizeRatio);
      }
      if (x && y && this.state === 'new')
        this.sketchHolder.vertex(x, y);
      this.sketchHolder.endShape(this.sketchHolder.CLOSE);
    }

    if (this.state === 'done') {
      this.showNumber();
    }
  }

  showNumber() {
    var resizeRatio = this.sketchHolder.resizeRatio;
    var drawResizeRatio = this.sketchHolder.drawResizeRatio;
    this.sketchHolder.stroke(255);
    this.sketchHolder.strokeWeight(1);
    this.sketchHolder.fill(this.brightness, 125);
    let circleX = this.points[0].x * drawResizeRatio;
    let circleY = this.points[0].y * drawResizeRatio;

    if (this.figureType === 'Rectangle') {
      circleX += this.figureOptions.width * drawResizeRatio / 2;
      circleY += this.figureOptions.heigth * drawResizeRatio / 2;
    } else if (this.figureType === 'Polygon') {
      let centroid = polygonCentroid(this.points);
      circleX = centroid.x * drawResizeRatio;
      circleY = centroid.y * drawResizeRatio;
    }

    this.sketchHolder.fill('#7cd6a1');
    this.sketchHolder.circle(circleX, circleY, 35 * resizeRatio);
    this.sketchHolder.fill('#222');
    this.sketchHolder.noStroke();
    this.sketchHolder.textSize(20 * resizeRatio);
    let moveLeft = 0;
    if (this.order == 10){
      moveLeft = 7;
    }
    this.sketchHolder.text(this.order, circleX - moveLeft - 5 * resizeRatio, circleY + 7 * resizeRatio);
  }
}

function deleteFigure(itemId) {

  let answerFigure = answerFigures.find(function (element) {
    return element.order === itemId;
  });
  answerFigures = answerFigures.filter(function (element) {
    element.inputText = $(`#item_text_${element.order}`).val();
    return element !== answerFigure;
  });
  answerFigure.clear();
};

function pointInPolygon(point, points, start, end) {
  var x = point[0], y = point[1];
  var inside = false;
  if (start === undefined) start = 0;
  if (end === undefined) end = points.length;
  var len = end - start;
  for (var i = 0, j = len - 1; i < len; j = i++) {
    var xi = points[i + start].x, yi = points[i + start].y;
    var xj = points[j + start].x, yj = points[j + start].y;
    var intersect = ((yi > y) !== (yj > y))
      && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

function polygonCentroid(pts) {
  var first = pts[0], last = pts[pts.length - 1];
  if (first.x != last.x || first.y != last.y) pts.push(first);
  var twicearea = 0,
    x = 0, y = 0,
    nPts = pts.length,
    p1, p2, f;
  for (var i = 0, j = nPts - 1; i < nPts; j = i++) {
    p1 = pts[i]; p2 = pts[j];
    f = (p1.y - first.y) * (p2.x - first.x) - (p2.y - first.y) * (p1.x - first.x);
    twicearea += f;
    x += (p1.x + p2.x - 2 * first.x) * f;
    y += (p1.y + p2.y - 2 * first.y) * f;
  }
  f = twicearea * 3;
  last = pts[pts.length - 1];
  if (first.x === last.x && first.y === last.y) pts.pop();
  return { x: x / f + first.x, y: y / f + first.y };
}

var myp5s = [];

function stopExistingSketch() {
  for (var i = 0; i < myp5s.length; i++) {
    myp5s[i].noLoop();
  }
  myp5s = [];
}

var sketch = function (p) {

  let canvas;
  p.questionId;
  let canvasWidth = 0;
  let canvasHeight = 0;
  let canvasMaxWidth = 600;
  let canvasMaxHeight = 800;
  let canvasControlWidth = 0;
  let hotspotImage;
  let originX = originY = 0;
  let answerFigures = [];
  let selectedFigure;
  let clickedX = clickedY = 0;
  let selectedAnswer;
  let resizeRatio = 1;

  p.answerCircles = [];
  p.isEdit = true;
  p.answerPrefix = '';
  p.printSketchHolderWidth = true;
  p.showOnlyCorrectAnswers = false;
  p.helperCanvasWidth;
  p.previousCanvasWidth;
  p.doUpdateAnswersPositions;

  p.minAllowedWidth = 20;

  p.setup = function () {
    canvas = p.createCanvas(canvasWidth, canvasHeight);

    window.addEventListener("keydown", function (e) {
      var $focused = $(':focus');
      if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(e.code) > -1 && $focused.hasClass("hotspot_number") && p.isEdit) {
        e.preventDefault();
      }
    }, false);
  };

  p.draw = function () {
    p.background(0);

    if (hotspotImage) {
      let imgProportion = hotspotImage.width / hotspotImage.height;
      if (hotspotImage.width <= canvasMaxWidth - canvasControlWidth && hotspotImage.heitht <= canvasMaxHeight) {
        canvasWidth = hotspotImage.width;
        canvasHeight = hotspotImage.height;
      } else if (imgProportion >= (canvasMaxWidth - canvasControlWidth) / canvasMaxHeight) {
        canvasWidth = canvasMaxWidth - canvasControlWidth;
        canvasHeight = (canvasMaxWidth - canvasControlWidth) / imgProportion;
      } else {
        canvasHeight = canvasMaxHeight;
        canvasWidth = imgProportion * canvasMaxHeight;
      }
      p.setSketchHolderDivs();
      p.resizeCanvas(p.previousCanvasWidth * resizeRatio, p.previousCanvasWidth * resizeRatio / imgProportion);
      p.image(hotspotImage, 0, 0, p.previousCanvasWidth * resizeRatio, p.previousCanvasWidth * resizeRatio / imgProportion);
      p.updateAnswersPositions();
    }

    p.showFigures();

    var $focused = $(':focus');
    if ($focused.hasClass("hotspot_number") && p.keyIsPressed && p.isEdit) {
      p.moveByKeyCode($focused, p.keyCode);
    }
  };

  p.answerMouseOver = function () {
    if (selectedAnswer === undefined) {
      selectedAnswer = this;
    }
  };

  p.answerMouseOut = function () {
    if (selectedAnswer && this === selectedAnswer && !p.mouseIsPressed) {
      selectedAnswer = undefined;
    }
  };

  p.answerTouchEnded = function () {
    if (selectedAnswer && this === selectedAnswer) {
      selectedAnswer = undefined;
    }
  };

  p.loadMainImage = function (imagePath) {
    if (imagePath) {
      hotspotImage = p.loadImage(imagePath);
    } else {
      hotspotImage = null;
    }
  };

  p.loadAnswers = function (answerPrefix, itemPrefix, holderPrefix, className) {
    if (p.showOnlyCorrectAnswers) {
      return;
    }

    p.answerPrefix = answerPrefix;
    p.holderPrefix = holderPrefix;
    let i = 1;
    while ($(`#${itemPrefix}_${i}`).val()) {
      let answerCircle = p.createDiv(i);
      answerCircle.parent(`${holderPrefix}_${i}`);
      answerCircle.class(className);
      answerCircle.attribute('index', i);
      answerCircle.attribute('id', `hotspot_number_${p.questionId}_${i}`);
      answerCircle.attribute('tabindex', 0);
      if (p.isEdit) {
        answerCircle.mouseOver(p.answerMouseOver);
        answerCircle.mouseOut(p.answerMouseOut);
        answerCircle.touchStarted(p.answerMouseOver);
        answerCircle.touchEnded(p.answerTouchEnded);
      }

      let answer = $(`#${answerPrefix}_${i}`).val();
      if (answer !== undefined && answer !== '') {
        answer = JSON.parse(answer);
        let itemWidth = $(`#hotspot_number_${p.questionId}_${i}`).width() / 2;
        let itemHeight = $(`#hotspot_number_${p.questionId}_${i}`).height() / 2;
        let canvasOffset = $(`#sketch-holder-${p.questionId}`).offset();
        let canvasProportion = $(`#sketch-holder-${p.questionId}`).width() / answer["canvasWidth"];

        $(`#hotspot_number_${p.questionId}_${i}`).offset({left: canvasOffset.left - itemWidth + answer["mouseX"] * canvasProportion, top: canvasOffset.top - itemHeight + answer["mouseY"] * canvasProportion});

        if (answer["correct"] !== undefined && !answer["correct"]) {
          answerCircle.style('background-color', 'red');
        }
      }
      p.answerCircles.push(answerCircle);
      i += 1;
    }
  };

  p.loadAnswerFigures = function (choicePrefix, itemPrefix) {
    let i = 1;
    while ($(`#${choicePrefix}_${i}`).val()) {
      let choice = JSON.parse($(`#${choicePrefix}_${i}`).val());
      let inputText = $(`#${itemPrefix}_${i}`).val();
      let points = [];

      for (var j = 0; j < choice.points.length; j++) {
        points.push(new Point(choice.points[j].x, choice.points[j].y));
      }

      let answerFigure = new AnswerFigure(p, points, choice.type, choice.options);
      answerFigure.state = 'done';
      answerFigure.inputText = inputText;
      answerFigure.order = i;
      answerFigures.push(answerFigure);

      i += 1;
    }
  };

  p.setSketchHolderDivs = function () {
    if (p.questionId) {
      if ($(`#sketch-holder-${p.questionId}`).width() < p.minAllowedWidth && $(`#sketch-holder-${p.questionId}`).parent().width() < p.minAllowedWidth) {
        $(`#sketch-holder-${p.questionId}`).width(canvasMaxWidth);
        $(`#sketch-holder-${p.questionId}`).parent().width(canvasMaxWidth);
      } else if ($(`#sketch-holder-${p.questionId}`).width() < p.minAllowedWidth) {
        let sketchWidth = Math.min(canvasMaxWidth, $(`#sketch-holder-${p.questionId}`).parent().width());
        $(`#sketch-holder-${p.questionId}`).width(sketchWidth);
      } else if ($(`#sketch-holder-${p.questionId}`).width() > canvasMaxWidth) {
        $(`#sketch-holder-${p.questionId}`).width(canvasMaxWidth);
      }

      resizeRatio = $(`#sketch-holder-${p.questionId}`).width() / p.previousCanvasWidth;
      p.helperCanvasWidth = $(`#sketch-holder-${p.questionId}`).width();
      $(`#canvas-sketch-${p.questionId}`).width(p.helperCanvasWidth);
    }
  };

  p.showFigures = function () {
    for (var i = 0; i < answerFigures.length; i++) {
      p.show(answerFigures[i]);
    }
  };

  p.show = function (answerFigure, x, y) {
    let answer = $(`#${p.answerPrefix}_${answerFigure.order}`).val();
    if (answer !== undefined && answer !== '') {
      answer = JSON.parse(answer);
    }

    p.stroke(255);
    p.strokeWeight(2);

    if (p.showOnlyCorrectAnswers || answer !== undefined && answer !== '' && answer["correct"]) {
      p.fill(answerFigure.brightness, 125);
    }
    else {
      p.fill(255, 0, 0, 170);
    }

    if (answerFigure.figureType === 'Circle') {
      p.circle(answerFigure.points[0].x * resizeRatio, answerFigure.points[0].y * resizeRatio, answerFigure.figureOptions.r * resizeRatio * 2)
    } else if (answerFigure.figureType === 'Rectangle') {
      p.rect(answerFigure.points[0].x * resizeRatio, answerFigure.points[0].y * resizeRatio, answerFigure.figureOptions.width * resizeRatio, answerFigure.figureOptions.heigth * resizeRatio);
    } else if (answerFigure.figureType === 'Polygon') {
      p.beginShape();
      for (var i = 0; i < answerFigure.points.length; i++) {
        p.vertex(answerFigure.points[i].x * resizeRatio, answerFigure.points[i].y * resizeRatio);
      }
      if (x && y && answerFigure.state === 'new')
        p.vertex(x, y);
      p.endShape(p.CLOSE);
    }

    if (p.showOnlyCorrectAnswers) {
      p.showNumber(answerFigure);
    }
  }

  p.showNumber = function (answerFigure) {
    p.stroke(255);
    p.strokeWeight(1);
    p.fill(answerFigure.brightness, 125);
    let circleX = answerFigure.points[0].x * resizeRatio;
    let circleY = answerFigure.points[0].y * resizeRatio;

    if (answerFigure.figureType === 'Rectangle') {
      circleX += answerFigure.figureOptions.width * resizeRatio / 2;
      circleY += answerFigure.figureOptions.heigth * resizeRatio / 2;
    } else if (answerFigure.figureType === 'Polygon') {
      let centroid = polygonCentroid(answerFigure.points);
      circleX = centroid.x * resizeRatio;
      circleY = centroid.y * resizeRatio;
    }

    let circleProportion = Math.min(resizeRatio, 1);

    p.fill('#7cd6a1');
    p.circle(circleX, circleY, 35 * circleProportion);
    p.fill('#222');
    p.noStroke();
    p.textSize(20 * circleProportion);
    let moveLeft = 0;
    if (answerFigure.order == 10){
      moveLeft = 7;
    }
    p.text(answerFigure.order, circleX - moveLeft - 5 * circleProportion, circleY + 7 * circleProportion);
  }

  p.mousePressed = function () {
    if (selectedAnswer === undefined || !p.isEdit) return;

    clickedX = p.mouseX;
    clickedY = p.mouseY;
  };

  p.mouseDragged = function () {
    if (selectedAnswer === undefined || !p.isEdit) return;

    let currentPosition = selectedAnswer.position();

    selectedAnswer.position(currentPosition.x + p.mouseX - clickedX, currentPosition.y + p.mouseY - clickedY);

    clickedX = p.mouseX;
    clickedY = p.mouseY;
    p.setAnswer(selectedAnswer.attribute('index'), p.mouseX, p.mouseY);
  };

  p.touchMoved = function () {
    if (selectedAnswer === undefined || !p.isEdit) return;

    let currentPosition = selectedAnswer.position();

    selectedAnswer.position(currentPosition.x + p.mouseX - clickedX, currentPosition.y + p.mouseY - clickedY);

    clickedX = p.mouseX;
    clickedY = p.mouseY;
    p.setAnswer(selectedAnswer.attribute('index'), p.mouseX, p.mouseY);

    return false;
  };

  p.windowResized = function () {
    if (p.questionId) {
      clearTimeout(p.doUpdateAnswersPositions);
      p.doUpdateAnswersPositions = setTimeout(p.updateAnswersPositions, 300);
    }
  }

  p.updateAnswersPositions = function () {
    let sketchHolderWidth = $(`#sketch-holder-${p.questionId}`).width();
    if (sketchHolderWidth === undefined || sketchHolderWidth === 0 || sketchHolderWidth === '') {
      return;
    }
    resizeRatio = $(`#sketch-holder-${p.questionId}`).width() / p.previousCanvasWidth;

    for (var i = 0; i < p.answerCircles.length; i++) {
      let index = p.answerCircles[i].attribute('index');
      let answerItem = $(`#${p.answerPrefix}_${index}`).val();

      if (answerItem === undefined || answerItem === '') {
        continue;
      }

      let answer = JSON.parse($(`#${p.answerPrefix}_${index}`).val());

      let newCanvasProportion = sketchHolderWidth / answer["canvasWidth"];
      let newAnswerMouseX = answer.mouseX * newCanvasProportion;
      let newAnswerMouseY = answer.mouseY * newCanvasProportion;

      let itemWidth = $(`#${p.answerCircles[i].attribute('id')}`).width() / 2;
      let itemHeight = $(`#${p.answerCircles[i].attribute('id')}`).height() / 2;
      let canvasOffset = $(`#sketch-holder-${p.questionId}`).offset();

      $(`#${p.answerCircles[i].attribute('id')}`).offset({left: canvasOffset.left - itemWidth + newAnswerMouseX, top: canvasOffset.top - itemHeight + newAnswerMouseY});

      if (p.isEdit) {
        answer = JSON.stringify({
          "clickedX": answer.clickedX,
          "clickedY": answer.clickedY,
          "mouseX": newAnswerMouseX,
          "mouseY": newAnswerMouseY,
          "position": index,
          "resizeRatio": resizeRatio,
          "canvasWidth": p.helperCanvasWidth,
        });

        $(`#${p.answerPrefix}_${index}`).val(answer);
      }
    }
  };

  p.keyPressed = function () {
    var $focused = $(':focus');
    if ($focused.hasClass("hotspot_number") && p.isEdit) {
      p.moveByKeyCode($focused, p.keyCode);
    }
  };

  p.moveByKeyCode = function (element, keyCode) {
    let answerCircle = p.answerCircles.find(answer => answer.attribute('index') === element.attr('index'));
    let currentPosition = answerCircle.position();

    if (keyCode === p.UP_ARROW) {
      answerCircle.position(currentPosition.x, currentPosition.y - 1);
    } else if (keyCode === p.DOWN_ARROW) {
      answerCircle.position(currentPosition.x, currentPosition.y + 1);
    } else if (keyCode === p.LEFT_ARROW) {
      answerCircle.position(currentPosition.x - 1, currentPosition.y);
    } else if (keyCode === p.RIGHT_ARROW) {
      answerCircle.position(currentPosition.x + 1, currentPosition.y);
    } else {
      return;
    }

    let canvasPosition = $(`#sketch-holder-${p.questionId}`).position();
    let answerHolderPosition = $(`#${p.holderPrefix}_${answerCircle.attribute('index')}`).position();
    clickedX = answerHolderPosition.left - canvasPosition.left + 10 + currentPosition.x;
    clickedY = answerHolderPosition.top - canvasPosition.top + 10 + currentPosition.y;
    p.setAnswer(answerCircle.attribute('index'), answerHolderPosition.left - canvasPosition.left + 10 + currentPosition.x, answerHolderPosition.top - canvasPosition.top + 10 + currentPosition.y);
  }

  p.setAnswer = function (index, positionX, positionY) {
    let answer = $(`#${p.answerPrefix}_${index}`).val();
    let itemWidth = $(`#hotspot_number_${p.questionId}_${index}`).width() / 2;
    let itemHeight = $(`#hotspot_number_${p.questionId}_${index}`).height() / 2;
    let itemOffset = $(`#hotspot_number_${p.questionId}_${index}`).offset();
    let canvasOffset = $(`#sketch-holder-${p.questionId}`).offset();
    let answerX = itemOffset.left + itemWidth - canvasOffset.left;
    let answerY = itemOffset.top + itemHeight - canvasOffset.top;

    if (answer === undefined || answer === '') {
      answer = JSON.stringify({
        "clickedX": 0,
        "clickedY": 0,
        "mouseX": answerX,
        "mouseY": answerY,
        "position": index,
        "resizeRatio": resizeRatio,
        "canvasWidth": p.helperCanvasWidth,
      });

    } else {
      answer = JSON.parse(answer);

      answer = JSON.stringify({
        "clickedX": 0,
        "clickedY": 0,
        "mouseX": answerX,
        "mouseY": answerY,
        "position": index,
        "resizeRatio": resizeRatio,
        "canvasWidth": p.helperCanvasWidth,
      });
    }
    $(`#${p.answerPrefix}_${index}`).val(answer);
  };
};

var showSketch = function (p) {

  var answerFigures = [];
  p.questionId;
  var canvasWidth = 0;
  var canvasHeight = 0;
  var canvasMaxWidth = 600;
  var canvasResizeWidth = 600;
  var canvasMaxHeight = 800;
  var hotspotImage;
  var canvasControlWidth = 255;
  p.resizeRatio = 1;
  p.helperCanvasWidth;
  p.helperCanvasMaxWidth;
  p.helperHotspotImageWidth;
  p.isPrint = false;
  p.isCanvasControlBuild = false;
  p.previousCanvasWidth;
  p.drawResizeRatio;

  p.setup = function () {
    // put setup code here
    var canvas = p.createCanvas(canvasWidth, canvasHeight);
    p.background(220);
  }

  p.buildCanvasControl = function () {
    if (p.isCanvasControlBuild) {
      return;
    }

    let i = 1;
    while ($(`#item_choice_${p.questionId}_${i}`).val()) {
      let choice = JSON.parse($(`#item_choice_${p.questionId}_${i}`).val());
      let inputText = $(`#item_text_${p.questionId}_${i}`).val();
      let points = []

      for (var j = 0; j < choice.points.length; j++) {
        points.push(new Point(choice.points[j].x, choice.points[j].y));
      }

      let answerFigure = new AnswerFigure(p, points, choice.type, choice.options, p.resizeRatio);
      answerFigure.state = 'done';
      answerFigure.inputText = inputText;
      answerFigure.order = i;
      answerFigures.push(answerFigure);

      let pTag = p.createP(`${i}. ${inputText}`);
      pTag.parent(`canvas-controlls-${p.questionId}`);
      pTag.style('margin: 10px');

      i += 1;
    }
    p.isCanvasControlBuild = true;
  }

  p.draw = function () {
    p.background(0);

    if (hotspotImage) {
      let imgProportion = hotspotImage.width / hotspotImage.height;
      if (hotspotImage.width <= canvasMaxWidth && hotspotImage.heitht <= canvasMaxHeight) {
        canvasWidth = hotspotImage.width;
        canvasHeight = hotspotImage.height;
      } else if (imgProportion >= canvasMaxWidth / canvasMaxHeight) {
        canvasWidth = canvasMaxWidth;
        canvasHeight = canvasMaxWidth / imgProportion;
      } else {
        canvasHeight = canvasMaxHeight;
        canvasWidth = imgProportion * canvasMaxHeight;
      }
      p.helperCanvasWidth = canvasWidth;
      p.helperCanvasMaxWidth = canvasMaxWidth;
      p.helperHotspotImageWidth = hotspotImage.width;
      p.resizeRatio = canvasWidth / p.previousCanvasWidth;
      p.drawResizeRatio = canvasWidth / p.previousCanvasWidth;
      p.resizeCanvas(canvasWidth, canvasHeight);
      p.image(hotspotImage, 0, 0, canvasWidth, canvasHeight);
      p.setSketchHolderDivs();
    }

    p.buildCanvasControl();

    if (p.isPrint) {
      canvasMaxWidth = 400;
    } else {
      // put drawing code here
      for (var i = 0; i < answerFigures.length; i++) {
        answerFigures[i].show();
      }
    }
  }

  p.setSketchHolderDivs = function () {
    if (p.questionId) {
      if ($(`#sketch-holder-${p.questionId}`).width() < canvasMaxWidth) {
        canvasControlWidth = $(`#sketch-holder-${p.questionId}`).width();
        canvasMaxWidth = $(`#sketch-holder-${p.questionId}`).width();
        $(`#canvas-controlls-${p.questionId}`).height(200);
      } else {
        $(`#canvas-controlls-${p.questionId}`).height(canvasHeight);
      }

      if ($('#centreColumn').width() < canvasControlWidth + canvasMaxWidth) {
        canvasControlWidth = $(`#sketch-holder-${p.questionId}`).width();
        $(`#canvas-controlls-${p.questionId}`).height(200);
      }

      $(`#canvas-sketch-${p.questionId}`).height(canvasHeight);
      $(`#canvas-sketch-${p.questionId}`).width(canvasWidth);
      $(`#sketch-holder-${p.questionId}`).height(canvasHeight);
      $(`#canvas-controlls-${p.questionId}`).width(canvasControlWidth);
    }
  }

  p.loadMainImage = function (imagePath) {
    if (imagePath) {
      hotspotImage = p.loadImage(imagePath);
    } else {
      hotspotImage = null;
    }
  }
};

var editSketch = function (p) {
  var isDrawing = false;
  var originX = originY = 0;
  var answerFigures = [];
  var canvasWidth = 0;
  var canvasHeight = 0;
  var canvasMaxWidth = 600;
  var canvasResizeWidth = 600;
  var canvasMaxHeight = 800;
  var selectedFigure;
  var clickedX = clickedY = 0;
  var hotspotImage;
  var canvasControlWidth = 0;
  var p5State = 'None';
  var maxFigures = 10;
  p.resizeRatio = 1;
  p.drawResizeRatio = 1;
  p.helperCanvasWidth;
  p.previousCanvasWidth;

  p.setup = function () {
    // put setup code here
    var canvas = p.createCanvas(canvasWidth, canvasHeight);

    p.background(220);

    // load image after validation fail
    if ($("input[type='hidden'][name='question[misc]']").val()) {
      p.loadMainImage($("input[type='hidden'][name='question[misc]']").val());
    }

    let i = 1;
    while ($(`#helper_item_choice_${i}`).val()) {
      let choice = JSON.parse($(`#helper_item_choice_${i}`).val());
      let inputText = $(`#helper_item_text_${i}`).val() || '';
      let points = []

      for (var j = 0; j < choice.points.length; j++) {
        points.push(new Point(choice.points[j].x, choice.points[j].y));
      }

      let answerFigure = new AnswerFigure(p, points, choice.type, choice.options, choice.resizeRatio);
      answerFigure.inputText = inputText;
      answerFigure.order = i;
      answerFigure.state = 'done';

      answerFigures.push(answerFigure);

      i += 1;
    }
    p.updateAttributes();
  }

  p.draw = function () {
    p.background(0);

    if (hotspotImage) {
      canvasMaxWidth = Math.min(canvasMaxWidth, $(`#hotspot_image`).width());
      let imgProportion = hotspotImage.width / hotspotImage.height;
      if (hotspotImage.width <= canvasMaxWidth) {
        canvasWidth = hotspotImage.width;
        canvasHeight = hotspotImage.height;
      } else {
        canvasWidth = canvasMaxWidth;
        canvasHeight = canvasMaxWidth / imgProportion;
      }
      p.helperCanvasWidth = canvasWidth;
      if (p.resizeRatio !== canvasWidth / canvasResizeWidth){
        p.resizeRatio = canvasWidth / canvasResizeWidth;
        p.updateAttributes();
      }
      p.resizeCanvas(canvasWidth, canvasHeight);
      p.image(hotspotImage, 0, 0, canvasWidth, canvasHeight);
      p.setSketchHolderDivs();
    }

    // put drawing code here
    if (p.isMouseIn() && p.mouseIsPressed && p.getFigureType() !== 'Polygon') {
      p.drawFigure(p.mouseX, p.mouseY);
    } else if (p.isMouseIn() && p.getFigureType() !== 'Polygon' && isDrawing) {
      p.finilizeDrawing();
    }

    for (var i = 0; i < answerFigures.length; i++) {
      if (p.getFigureType() === 'Polygon' && isDrawing) {
        answerFigures[i].show(p.mouseX, p.mouseY);
      } else {
        answerFigures[i].show();
      }
    }
  }

  p.setSketchHolderDivs = function () {
    $('#canvas-sketch').height(canvasHeight);
    $('#canvas-sketch').width(canvasWidth);
    $('#canvas-controlls').height('auto');
    $('#canvas-controlls').width(255);
  }

  p.handleImage = function (file) {
    if (file.type === 'image') {
      hotspotImage = p.createImg(file.data, '');
      hotspotImage.hide();
    } else {
      hotspotImage = null;
    }
  }

  p.loadMainImage = function (imagePath) {
    if (imagePath) {
      p.resetCanvas();
      hotspotImage = p.loadImage(imagePath);
    } else {
      hotspotImage = null;
    }
  }

  p.resetCanvasItems = function () {
    selectedFigure = undefined;

    for (var i = 0; i < answerFigures.length; i++) {
      answerFigures[i].unselect();
    }
  }

  p.resetCanvas = function () {
    selectedFigure = undefined;

    canvasWidth = canvasHeight = 0;
    p.resizeCanvas(canvasWidth, canvasHeight);

    answerFigures = [];

    $("#canvas-controlls").empty();
  }

  p.mouseClicked = function () {
    if (!p.isMouseIn()) return;

    if (p.getFigureType() === 'Polygon' && selectedFigure === undefined) {
      $('#polygonDrawing').prop('disabled', false);
      p.drawFigure(p.mouseX, p.mouseY);
    }
  }

  p.doubleClicked = function () {
    if (!p.isMouseIn()) return;

    if (p.getFigureType() === 'Polygon') {
      p.finilizeDrawing();
    }
  }

  p.mousePressed = function () {
    if (!p.isMouseIn()) return;

    p.selectFigure();

    clickedX = p.mouseX;
    clickedY = p.mouseY;
  }

  p.mouseMoved = function () {
    if (!p.isMouseIn()) return;

    p.cursor(p.ARROW);

    for (var i = 0; i < answerFigures.length; i++) {
      if (answerFigures[i].isMouseOver(p.mouseX, p.mouseY)) {
        p.cursor(p.HAND);
      }
    }
  }

  p.selectFigure = function () {
    if (p5State === 'None') {
      selectedFigure = undefined;

      for (var i = 0; i < answerFigures.length; i++) {
        if (selectedFigure === undefined && answerFigures[i].select(p.mouseX, p.mouseY)) {
          selectedFigure = answerFigures[i];
        } else {
          answerFigures[i].unselect();
        }
      }
    }
  }

  p.mouseDragged = function () {
    if (!p.isMouseIn()) return;

    if (selectedFigure) {
      selectedFigure.move(p.mouseX - clickedX, p.mouseY - clickedY);
      clickedX = p.mouseX;
      clickedY = p.mouseY;
    }
  }

  p.touchMoved = function () {
    if (!p.isMouseIn()) return;

    if (selectedFigure) {
      selectedFigure.move(p.mouseX - clickedX, p.mouseY - clickedY);
      clickedX = p.mouseX;
      clickedY = p.mouseY;
    }

    return false;
  }

  p.keyPressed = function () {
    if (selectedFigure && (p.keyCode === p.BACKSPACE || p.keyCode === p.DELETE)) {
      answerFigures = answerFigures.filter(function (element) {
        element.inputText = $(`#item_text_${element.order}`).val();
        return selectedFigure !== element;
      });
      selectedFigure.clear();
      selectedFigure = undefined;

      p.updateAttributes();
    } else if (p.keyCode === p.ENTER && !$('#question_description').is(':focus')) {
      return false;
    } else if (p.keyCode === p.ESCAPE && p.getFigureType() === 'Polygon') {
      p.finilizeDrawing(true);
    }
  }

  p.drawFigure = function (x, y) {
    const figureType = p.getFigureType();

    if (p5State === 'Drawing') {
      let answerFigure = answerFigures[answerFigures.length - 1];
      answerFigure.update(x, y);
    } else if (figureType === undefined || selectedFigure) {
      originX = x;
      originY = y;
    } else if (p5State === 'None' && answerFigures.length < maxFigures) {
      isDrawing = true;
      p5State = 'Drawing';
      originX = x;
      originY = y;
      let answerFigure = new AnswerFigure(p, [new Point(x, y)], p.getFigureType(), { r: 0 });
      answerFigures.push(answerFigure);
    }
  }

  p.finilizeDrawing = function (fromKeyCode = false) {
    isDrawing = false;
    p5State = 'None';
    if (answerFigures.length > 0) {
      if (answerFigures[answerFigures.length - 1].isValidFigure()) {
        answerFigures[answerFigures.length - 1].order = answerFigures.length;
        answerFigures[answerFigures.length - 1].done(fromKeyCode);
      } else {
        answerFigures.pop();
      }
      $('#polygonDrawing').prop('disabled', true);
    }
  }

  p.isMouseIn = function () {
    return (p.mouseX <= canvasWidth && p.mouseX >= 0 && p.mouseY <= canvasHeight && p.mouseY >= 0)
  }

  p.deleteFigure = function (itemId) {
    let answerFigure = answerFigures.find(function (element) {
      return element.order === itemId;
    });
    answerFigures = answerFigures.filter(function (element) {
      element.inputText = $(`#item_text_${element.order}`).val();
      return element !== answerFigure;
    });
    answerFigure.clear();
  };

  p.updateAttributes = function () {
    $("#canvas-controlls").empty();
    for (var i = 0; i < answerFigures.length; i++) {
      answerFigures[i].order = i + 1;
      answerFigures[i].buildControls();
    }
  }

  p.getFigureType = function () {
    return $("input[name='figure_type']:checked").val();
  }

  p.updateCanvasImage = function (uploadedImageLink) {
    if (uploadedImageLink) {
      p.loadMainImage(uploadedImageLink);
      $("input[type='hidden'][name='question[misc]']").val(uploadedImageLink);
      $('.progress-bar-container').remove();
      $('.single_file_upload_button').html('Change picture');
    } else {
      $('.single_file_upload_button').html('Add picture');
    }
  }

}

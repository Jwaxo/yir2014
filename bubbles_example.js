

$(document).ready(function() {
  var Drupal = {settings: {}};
  $.getJSON('bubbles_example_settings.json', function(data) {
    $.each(data.setting, function(i, f) {
      Drupal.settings = f;
    });

  });

  var countryCode = 'global';
  var vitorders = Drupal.settings.vitPositions;

  // test for url query param
  var hrefRgx = /cc=(gb|jp|br|in)/i;
  var winhref = window.location.href.split('?');
  var locQuery = hrefRgx.exec(winhref[1]);

  if (locQuery) {

    countryCode = locQuery[1].toUpperCase();

    setDOMElementsToLocale();
  }

  function setDOMElementsToLocale() {
    // if country code is in list
    if (countryCode !== 'global') {
      // show country in moments nav
      $('.Mainnav-menu ul li.country[data-cc=' + countryCode + ']').addClass('active-country');
      $('.Pageheader--mobilenav ul li.country[data-cc=' + countryCode + ']').addClass('active-country');

      // reorder main nav. done on every page
      var mainNav = $(".Contentnav--perspectives");
      reorderVitElements({
        cont: mainNav,
        elems: mainNav.children("li")
      });

      //reorder mobile nav. only call if on perspectives page
      var mobileNav = $('.Yir2014--perspectives .Pageheader--mobilenav ul');
      if (mobileNav.length) {
        reorderVitElements({
          cont: mobileNav,
          elems: mobileNav.children("li")
        });
      }

      // reorder perspectives homepage avatars
      var avatarGrid = $('.Section--perspectives-container--vits .Container.Grid--withGutter');
      if (avatarGrid.length) {
        reorderVitElements({
          cont: avatarGrid,
          elems: avatarGrid.children("a")
        });
      }
    }
  }

  function reorderVitElements(obj) {
    obj.elems.hide();

    obj.elems.detach().sort(function(a, b) {
      var a = getVitIndex($(a).data('name'));
      var b = getVitIndex($(b).data('name'));

      return a - b;
    });

    obj.cont.append(obj.elems);
    obj.elems.show();
  }

  function getVitIndex(name) {
    var vitorder = vitorders[countryCode];

    for (var i = 0; i < vitorder.length; i++) {
      if ($.trim(vitorder[i].name) === name) {
        return i;
      }
    }
  }

});


$(document).ready(function() {
  var $win = $(window);
  var container = $('.Yir2014--moments');
  var padFix = 300;
  var momentsCollapsable = $('.MomentsHead--detail');
  var momentsIsMini = $win.scrollTop() > 150;
  var momentsHeadNav = $('.MomentsHead--nav li');
  var momentsMobileNav = $('.MomentsHead--mobilenav');
  var momentBubbles = $('.Yir2014--moments-timeline-container .Moment--circle');
  var timeline = new Timeline(container, padFix);
  var currentWidth = container.width();
  var reposition;

  var lastRad = 0;

  for (var i = 0; i < momentBubbles.length; i++) {
    var cir = new Circle(momentBubbles[i]);

    timeline.addItem(cir);
  }

  timeline.positionCircles(currentWidth);

  $win.on("load", function(e) {
    for (var j = 0; j < momentBubbles.length; j++) {
      if ( j < 11 ) {
        timeline.getAt(j).showCircle(j);
      } else {
        timeline.getAt(j).el.classList.remove('hidden');
        timeline.getAt(j).showRings();
      }
    }
  });


  $win.resize(function() {
    clearTimeout(reposition);
    reposition = setTimeout(function(){
      if (Math.abs(container.width() - currentWidth) > 50) {
        currentWidth = container.width();
        timeline.positionCircles(currentWidth);
      }
    }, 2000);
  });

  momentsHeadNav.on('click', toggleMobileNav);

  function toggleMobileNav(e) {
    momentsMobileNav.toggleClass('viz');
  }
});
function Timeline(container, paddingFix) {
  this.items = [];
  this.container = container;
  this.paddingFix = paddingFix;
}

Timeline.prototype.getRandomInt = function(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
};

Timeline.prototype.addItem = function(item) {
  this.items.push(item);
};

Timeline.prototype.getAt = function(index) {
  return this.items[index];
};

Timeline.prototype.resetCircles = function(){
  for(var i = 0; i < this.items.length; i++) {
    var circle = this.getAt(i);

    circle.setPos(0, 0);
  }
};

Timeline.prototype.clearCircles = function(top, width, verticalEnds, horizontalSpaceAvailable) {
  // Loop through the circles that end at this point, since there may be more.
  for (var k = 0; k < verticalEnds[top].length; k++) {
    // Loop through the available spaces to find where the left and right points are.
    for (var j = 0; j < horizontalSpaceAvailable.length; j++) {
      if (horizontalSpaceAvailable[j][1] === verticalEnds[top][k][0]) {
        var leftFuse = horizontalSpaceAvailable[j][0];
        var rightFuse = width;

        if (horizontalSpaceAvailable[j + 1]) {
          // Assuming we're not at the far right, j+1 is the right side that we fuse.
          rightFuse = horizontalSpaceAvailable[j + 1][1];
        }
        var newEmptySpace = [leftFuse, rightFuse];
        horizontalSpaceAvailable.splice(j, 2, newEmptySpace);
      }
    }
  }
  return horizontalSpaceAvailable;
};

Timeline.prototype.positionCircles = function(width) {

  this.resetCircles();

  var space = 1.1; // minimum spacing between circles
  var monthPadding = 200;
  var rightConstraint = 0;
  var horizontalSpaceAvailable = [[0, width]]; // This will track the space available on the horizontal.
  var verticalEnds = []; // This reflects the row count that individual circles will end on.

  var top = 0;

  // cycle through timeline nodes
  for (var i = 0; i < this.items.length; i++) {
    var circle = this.getAt(i);
    var bufferedCircle = Math.round(circle.width * space);
    var left = 0;
    var vertOverlapping = false;
    var horizOverlapping = false;
    var lastFailedHorizCheck = [];

    do {

      vertOverlapping = false;

      // Give months some extra padding.
      if (i !== 0 && circle.$el.hasClass('month')) {
        // We need to clear space in this extra padding.
        for (var j = top; j < (top + monthPadding); j++) {
          if (verticalEnds[j]) {
            lastFailedHorizCheck = [];
            horizontalSpaceAvailable = this.clearCircles(j, width, verticalEnds, horizontalSpaceAvailable);
          }
        }
        top += monthPadding;
      }

      // Now check to see if we need to clear up space because we've reached a vertical endpoint of a circle.
      if (verticalEnds[top]) {
        lastFailedHorizCheck = [];
        horizontalSpaceAvailable = this.clearCircles(top, width, verticalEnds, horizontalSpaceAvailable);
      }

      var testHorizSpaceAvailable = horizontalSpaceAvailable.slice(0);
      var spaceAvailableKeys = [];

      // Since testHoriz will get reduced, we need a lookup of which indexes remain for when we later get a horizSpace value.
      for (var j = 0; j < testHorizSpaceAvailable.length; j++) {
        spaceAvailableKeys[j] = j;
      }

      if (lastFailedHorizCheck !== horizontalSpaceAvailable) {
        // Don't bother running this loop if we've already determined this circle won't fit inside the current config of horizontal space.
        do {
          horizOverlapping = false;

          // First, pick a chunk of horizontal space, and make sure the circle can fit within it.
          var reservedSpaceKey = this.getRandomInt(0, testHorizSpaceAvailable.length);
          var reservedSpace = testHorizSpaceAvailable[reservedSpaceKey];

          if ((reservedSpace[1] - reservedSpace[0]) < bufferedCircle) {
            // This reservedSpace is too small. Pick another one in the next loop!
            testHorizSpaceAvailable.splice(reservedSpaceKey, 1);
            spaceAvailableKeys.splice(reservedSpaceKey, 1);
            horizOverlapping = true;

            if (testHorizSpaceAvailable.length === 0) {
              // None of the open spaces on this line will fit our circle.
              lastFailedHorizCheck = horizontalSpaceAvailable.slice(0);
              vertOverlapping = true;
            }
          }
          else {
            lastFailedHorizCheck = [];

            // It looks like it will fit, so pick a place for it.
            rightConstraint = reservedSpace[1] - bufferedCircle; // Because we're picking from the left side of the circle.
            left = this.getRandomInt(reservedSpace[0], rightConstraint);

            // Now that we have a location, we need to split up the remaining available spots.
            var horizSpaceAvailKey = spaceAvailableKeys[reservedSpaceKey];
            var tempLeft = [reservedSpace[0], left];
            var tempRight = [left + bufferedCircle, reservedSpace[1]];

            horizontalSpaceAvailable.splice(spaceAvailableKeys[reservedSpaceKey], 1, tempLeft, tempRight);

            // And set up the space on the verticalEnds.
            if (verticalEnds[(top + bufferedCircle)]) {
              verticalEnds[(top + bufferedCircle)].push([left, (left + bufferedCircle)]);
            }
            else {
              verticalEnds[(top + bufferedCircle)] = [[left, (left + bufferedCircle)]];
            }
          }
        } while (testHorizSpaceAvailable.length > 0 && horizOverlapping); // If we have not yet checked all horizontal spots.
      }

      top++;

    } while (vertOverlapping);

    circle.setPos(left, top);

    // set container height
    this.container.height(top + circle.height + this.paddingFix);
  }

};

function Circle(el) {
  this.ringContainer = $('.Yir2014--moments-timeline-circles');

  this.el = el;
  this.$el = $(el);
  // make these set in func
  console.log(el);
  try {
    this.width = $(el).width();
  }
  catch (err) {
    console.log(el);
  }
  this.height = $(el).height();
  this.radius = this.width / 2;
  // end sizes
  this.weight = parseInt(this.$el.data('weight'));
  this.numRings = Math.ceil(this.weight / 3);
  this.rings = [];

  this.createCircle();
}

Circle.prototype.createCircle = function() {
  this.createRings();

  var src = this.$el.data('image');
  if (src) {
    this.$el.css('backgroundImage', 'url(' + src + ')');
  }
};

Circle.prototype.getPos = function() {
  return {
    'left': this.left,
    'top': this.top,
    'center': this.getCenter(),
    'radius': this.radius,
    'width': this.width
  };
};

Circle.prototype.setPos = function(x, y) {
  this.left = x;
  this.el.style.left = x + 'px';

  this.top = y;
  this.el.style.top = y + 'px';

  for (var i = 0; i < this.rings.length; i++) {
    this.rings[i].css({
      'top': y + 'px',
      'left': x + 'px',
      'width': this.width,
      'height': this.height
    });
  }
};

Circle.prototype.getCenter = function() {
  var left = this.left + this.radius;
  var right = this.top + this.radius;

  return [left, right];
};

Circle.prototype.showCircle = function(count) {
  var self = this;
  var ms = count ? count * 200 : 0;

  window.setTimeout(function() {
    self.el.classList.remove('hidden');
    self.showRings();
  }, ms);
};

Circle.prototype.createRings = function() {
  // fix for one circle coming back with NaN
  if (isNaN(this.numRings)) {
    this.numRings = 1;
  }

  for (var i = 0; i < this.numRings; i++) {
    var ring = jQuery('<span>');
    this.ringContainer.append(ring);
    this.rings.push(ring);
  }
};

Circle.prototype.showRings = function() {
  for (var i = 0; i < this.rings.length; i++) {
    this.animateRing(this.rings[i], i);
  }
};

Circle.prototype.animateRing = function(ring, index) {
  window.setTimeout(function() {
    ring.css({
      'opacity': 0.4,
      'transform': 'scale(' + (1.22 + (0.22 * index)) + ')'
    });
  }, index * 75);
};

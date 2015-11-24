/*!
 * jQuery slideshow plugin SLIM
 * Original author: @Yan Zhang
 * Version: 1.0.0
 * Licensed under the MIT license
 */

(function(factory){
	'use strict';

	if (typeof define === 'function' && define.amd) {
		define(['jquery'], factory);
	} else if (typeof exports !== 'undefined') {
		module.exports = factory(require('jquery'));
	} else {
		factory(jQuery);
	}

}(function($) {
	'use strict';

	var Slim = window.Slim || {};

	Slim = (function(){

		function Slim(element, settings) {

			var _ = this;

			_.defaults = {
				initialSlide: 0,
				slidesToShow: 2,
				slidesToScroll: 2,
				arrows: true,
				appendArrows: $(element),
				prevArrow: '<button type="button" class="slim-prev" aria-label="Previous">Previous</button>',
                nextArrow: '<button type="button" class="slim-next" aria-label="Next">Next</button>',
				speed: 500,
				easing: 'linear',
				touchThreshold: 5,
				edgeFriction: 0.35
			};

			_.initials = {
				animating: false,
				dragging: false,
				currentSlide: 0,
				listWidth: null,
				$slideTrack: null,
				$slides: null,
				slideCount: null,
				$list: null,
				$prevArrow: null,
				$nextArrow: null,
				slideWidth: null,
				windowWidth: 0,
				touchObject: {}
			};
			$.extend(_, _.initials);

			_.$slider = $(element);

			_.options = $.extend({}, _.defaults, settings);

			_.currentSlide = _.options.initialSlide;

			_.changeSlide = $.proxy(_.changeSlide, _);
			_.setDimensions = $.proxy(_.setDimensions, _);
			_.swipeHandler = $.proxy(_.swipeHandler, _);
			_.resize = $.proxy(_.resize, _);

			// A simple way to check for HTML strings
            // Strict HTML recognition (must start with <)
            // Extracted from jQuery v1.11 source
            _.htmlExpr = /^(?:\s*(<[\w\W]+>)[^>]*)$/;

			_.init();

		}

		return Slim;

	}());

	Slim.prototype.init = function() {
		var _ = this;

		if (!_.$slider.hasClass('slim-initialized')) {
			_.$slider.addClass('slim-initialized');

			_.buildOut();
			_.startLoad();
			_.loadSlider();
			_.initializeEvents();
			_.updateArrows();
		}
	};

	Slim.prototype.buildOut = function() {
		var _ = this;

		_.$slides = _.$slider.children().addClass('slim-slide');
		_.slideCount = _.$slides.length;

		_.$slides.each(function(index, element) {
			$(element)
				.attr('data-slide-index', index)
				.data('originalStyling', $(element).attr('style') || '');
		});

		_.$slider.addClass('slim-slider');

		_.$slideTrack = _.$slides.wrapAll('<div class="slim-track"/>').parent();

		_.$list = _.$slideTrack.wrap('<div class="slim-list"/>').parent();

		_.$slideTrack.css('opacity', 0).addClass('group');

		_.buildArrows();

		_.setSlideClasses(typeof _.currentSlide === 'number' ? _.currentSlide : 0);
	};

	Slim.prototype.startLoad = function() {
		var _ = this;

		_.$slider.addClass('slim-loading');
	};

	Slim.prototype.loadSlider = function() {
		var _ = this;

		_.$slideTrack.css({ opacity: 1 });
		_.$slider.removeClass('slim-loading');
	};

	Slim.prototype.buildArrows = function() {
		var _ = this;

		if (_.options.arrows === true) {
			_.$prevArrow = $(_.options.prevArrow).addClass('slim-arrow');
			_.$nextArrow = $(_.options.nextArrow).addClass('slim-arrow');

			if (_.slideCount > _.options.slidesToShow) {
				_.$prevArrow.removeClass('slim-hidden').removeAttr('aria-hidden');
				_.$nextArrow.removeClass('slim-hidden').removeAttr('aria-hidden');

				if (_.htmlExpr.test(_.options.prevArrow)) {
					_.$prevArrow.prependTo(_.options.appendArrows);
				}

				if (_.htmlExpr.test(_.options.nextArrow)) {
					_.$nextArrow.appendTo(_.options.appendArrows);
				}

			} else {

				_.$prevArrow.add(_.$nextArrow)
					.addClass('slim-hidden')
					.attr({
						'aria-disabled': 'true'
					});
			}
		}
	};

	Slim.prototype.updateArrows = function() {
		var _ = this;

		if (_.options.arrows === true && _.slideCount > _.options.slidesToShow) {

			_.$prevArrow.removeClass('slim-disabled').attr('aria-disabled', 'false');
			_.$nextArrow.removeClass('slim-disabled').attr('aria-disabled', 'false');

			if (_.currentSlide === 0) {
				_.$prevArrow.addClass('slim-disabled').attr('aria-disabled', 'true');
				_.$nextArrow.removeClass('slim-disabled').attr('aria-disabled', 'false');				
			} else if (_.currentSlide >= _.slideCount - _.options.slidesToShow) {
				_.$nextArrow.addClass('slim-disabled').attr('aria-disabled', 'true');				
				_.$prevArrow.removeClass('slim-disabled').attr('aria-disabled', 'false');				
			}
		}
	};

	Slim.prototype.setSlideClasses = function(index) {
		var _ = this, allSlides;

		allSlides = _.$slider
			.find('.slim-slide')
			.removeClass('slim-active')
			.attr('aria-hidden', 'true');

		if (index >= 0 && index <= (_.slideCount - _.options.slidesToShow)) {
			_.$slides
				.slice(index, index * 1 + _.options.slidesToShow * 1)
				.addClass('slim-active')
				.attr('aria-hidden', 'false');
		}
	};

	Slim.prototype.setDimensions = function() {
		var _ = this,
			targetLeft;

		_.listWidth = _.$list.width();

		_.slideWidth = Math.ceil(_.listWidth / _.options.slidesToShow);
		_.$slideTrack.width(Math.ceil(_.slideWidth * _.slideCount));

		var offset = _.$slides.first().outerWidth(true) - _.$slides.first().width();
		_.$slideTrack.children('.slim-slide').width(_.slideWidth - offset);

		targetLeft = _.getLeft(_.currentSlide);
		_.$slideTrack.css({ left: targetLeft });
	};

	Slim.prototype.getLeft = function(slideIndex) {
		var _ = this,
			targetLeft;

		targetLeft = slideIndex * _.slideWidth * -1;
		return targetLeft;
	};

	Slim.prototype.changeSlide = function(event) {
		var _ = this;

		switch (event.data.message) {
			case 'previous': 
				_.slideHandler(-1);
				break;

			case 'next':
				_.slideHandler(1);
				break;

			default: 
				return;
		}
	};

	Slim.prototype.slideHandler = function(slideOffset) {
		var _ = this,
			maxCurrentSlide = _.slideCount - _.options.slidesToShow,
			newCurrentSlide = _.currentSlide + _.options.slidesToScroll * slideOffset;

		if (_.animating === true) {
			return;
		}

		if (newCurrentSlide < 0) {
			_.currentSlide = 0;
		} else if (newCurrentSlide > maxCurrentSlide) {
			_.currentSlide = maxCurrentSlide;
		} else {
			_.currentSlide = newCurrentSlide;
		}

		_.animating = true;

		_.animateSlide(_.currentSlide);

		_.setSlideClasses(_.currentSlide);

		_.updateArrows();
	};

	Slim.prototype.animateSlide = function(currentSlide) {
		var _ = this, 
			targetLeft = _.getLeft(currentSlide);

		_.$slideTrack.animate({
			left: targetLeft
		}, _.options.speed, _.options.easing, function() {
			_.animating = false;
		});

	};

	Slim.prototype.swipeHandler = function(event) {
		var _ = this;

		_.touchObject.fingerCount = event.originalEvent & event.originalEvent.touches !== undefined ?
			event.originalEvent.touches.length : 1;

		_.touchObject.minSwipe = _.listWidth / _.options.touchThreshold;

		switch (event.data.action) {
			case 'start':
				_.swipeStart(event);
				break;

			case 'move':
				_.swipeMove(event);
				break;

			case 'end':
				_.swipeEnd(event);
		}
	};

	Slim.prototype.swipeStart = function(event) {
		var _ = this, touches;

		if (_.touchObject.fingerCount !== 1 || _.slideCount <= _.options.slidesToShow) {
			_.touchObject = {};
			return false;
		}

		if (event.originalEvent !== undefined && event.originalEvent.touches !== undefined) {
			touches = event.originalEvent.touches[0];
		}

		_.touchObject.startX = _.touchObject.curX = touches !== undefined ? touches.pageX : event.clientX;
		_.touchObject.startY = _.touchObject.curY = touches !== undefined ? touches.pageY : event.clientY;

		_.dragging = true;
	};

	Slim.prototype.swipeMove = function(event) {
		var _ = this, curLeft, swipeDirection, swipeLength, swipeLeft, positionOffset, touches;

		touches = event.originalEvent !== undefined ? event.originalEvent.touches : null;

		if (!_.dragging || touches && touches.length !== 1) {
			return false;
		}

		if (_.animating === true) {
			return false;
		}

		curLeft = _.getLeft(_.currentSlide);

		_.touchObject.curX = touches !== undefined ? touches[0].pageX : event.clientX;
		_.touchObject.curY = touches !== undefined ? touches[0].pageY : event.clientY;

		_.touchObject.swipeLength = Math.round(Math.sqrt(
			Math.pow(_.touchObject.curX - _.touchObject.startX, 2)));

		swipeDirection = _.swipeDirection();

		if (swipeDirection === 'stay') {
			return;
		}

		positionOffset = _.touchObject.curX > _.touchObject.startX ? 1 : -1;

		swipeLength = _.touchObject.swipeLength;

		if ((_.currentSlide === 0 && swipeDirection === 'left') || (_.currentSlide === _.slideCount - _.options.slidesToShow && swipeDirection === 'right')) {
			swipeLength = _.touchObject.swipeLength * _.options.edgeFriction;
		}

		swipeLeft = curLeft + swipeLength * positionOffset;

		_.$slideTrack.css({ left: swipeLeft });
	};

	Slim.prototype.swipeEnd = function(event) {
		var _ = this;

		_.dragging = false;

		if (_.touchObject.swipeLength >= _.touchObject.minSwipe) {

			switch (_.swipeDirection()) {
				case 'left': 
					_.slideHandler(-1);
					_.touchObject = {};
					break;
				case 'right':
					_.slideHandler(1);
					_.touchObject = {};
					break;
			}

		} else {
			if (_.touchObject.startX !== _.touchObject.curX) {
				_.animateSlide(_.currentSlide);
				_.touchObject = {};
			}
		}
	};

	Slim.prototype.swipeDirection = function() {
		var _ = this, xDist, yDist, r, swipeAngle;

		xDist = _.touchObject.startX - _.touchObject.curX;
		yDist = _.touchObject.startY - _.touchObject.curY;
		r = Math.atan2(yDist, xDist);

		swipeAngle = Math.round(r * 180 / Math.PI);

		if (swipeAngle < 0) {
			swipeAngle = 360 - Math.abs(swipeAngle);
		}

		if ((swipeAngle >= 0 && swipeAngle <= 45) || (swipeAngle >= 315 && swipeAngle <= 360)) { 
			return 'right';
		} else if (swipeAngle >= 135 && swipeAngle <= 225) {
			return 'left';
		} else {
			return 'stay';
		}

	};

	Slim.prototype.initArrowEvents = function() {
		var _ = this;

		if (_.options.arrows === true && _.slideCount > _.options.slidesToShow) {
            _.$prevArrow.on('click.slim', {
                message: 'previous'
            }, _.changeSlide);
            _.$nextArrow.on('click.slim', {
                message: 'next'
            }, _.changeSlide);
        }
	};

	Slim.prototype.initializeEvents = function() {
		var _ = this;

		_.initArrowEvents();

		_.$list.on('touchstart.slim mousedown.slim', {
			action: 'start'
		}, _.swipeHandler);

		_.$list.on('touchmove.slim mousemove.slim', {
			action: 'move'
		}, _.swipeHandler);	

		_.$list.on('touchend.slim mouseup.slim', {
			action: 'end'
		}, _.swipeHandler);	

		_.$list.on('touchcancel.slim mouseout.slim', {
			action: 'end'
		}, _.swipeHandler);			

		$(window).on('resize.slim orientationchange.slim', _.resize);
		$(window).on('load.slim', _.setDimensions);
		$(document).on('ready.slim', _.setDimensions);
	};

	Slim.prototype.resize = function() {
		var _ = this;

		if ($(window).width() !== _.windowWidth) {
			clearTimeout(_.windowDelay);

			_.windowDelay = window.setTimeout(function() {
				_.windowWidth = $(window).width();
				_.setDimensions();
			}, 50);
		}
	};

	Slim.prototype.cleanUpEvents = function() {
		var _ = this;

		if (_.options.arrows === true && _.slideCount > _.options.slidesToShow) {
			_.$prevArrow && _.$prevArrow.off('click.slim', _.changeSlide);
			_.$nextArrow && _.$nextArrow.off('click.slim', _.changeSlide);
		}

		_.$list.off('touchstart.slim mousedown.slim', _.swipeHandler);
		_.$list.off('touchmove.slim mousemove.slim', _.swipeHandler);
		_.$list.off('touchend.slim mouseup.slim', _.swipeHandler);
		_.$list.off('touchcancel.slim mouseout.slim', _.swipeHandler);

		$(window).off('resize.slim orientationchange.slim', _.resize);
		$(window).off('load.slim', _.setDimensions);
		$(document).off('ready.slim', _.setDimensions);
	};

	Slim.prototype.destroy = function() {
		var _ = this;

		_.touchObject = {};

		_.cleanUpEvents();

		if (_.$prevArrow && _.$prevArrow.length) {
			_.$prevArrow
				.removeClass('slim-disabled slim-arrow slim-hidden')
				.removeAttr('aria-hidden aria-disabled')
				.css("display", "");

			if (_.htmlExpr.test(_.options.prevArrow)) {
				_.$prevArrow.remove();
			}
		}

		if (_.$nextArrow && _.$nextArrow.length) {
			_.$nextArrow
				.removeClass('slim-disabled slim-arrow slim-hidden')
				.removeAttr('aria-hidden aria-disabled')
				.css("display", "");

			if (_.htmlExpr.test(_.options.nextArrow)) {
				_.$nextArrow.remove();
			}
		}

		if (_.$slides) {
			_.$slides
				.removeClass('slim-slide slim-active')
				.removeAttr('aria-hidden')
				.removeAttr('data-slide-index')
				.each(function() {
					$(this).attr('style', $(this).data('originalStyling'));
				});

			_.$slideTrack.children().detach();

			_.$slideTrack.detach();

			_.$list.detach();

			_.$slider.append(_.$slides);
		}

		_.$slider.removeClass('slim-initialized slim-slider');

	};

	$.fn.slim = function() {
		var _ = this,
			opt = arguments[0],
			args = Array.prototype.slice.call(arguments, 1),
			l = _.length,
			i = 0,
			ret;

		for (i; i < l; i++) {
			if (typeof opt === 'object' || typeof opt === 'undefined') 
				_[i].slim = new Slim(_[i], opt);
			else 
				ret = _[i].slim[opt].apply(_[i].slim, args);

			if (typeof ret !== 'undefined') return ret;
		}

		return _;
	};

}));
(function( factory ) {
	if ( typeof define === "function" && define.amd ) {

		// AMD. Register as an anonymous module.
		define([ "jquery" ], factory );
	} else {

		// Browser globals
		factory( jQuery );
	}
}(function( $ ) {

/*!
 * jQuery UI AreaSelector 1.0.0
 * https://github.com/borgboyone/jquery-ui-areaselector
 *
 * Copyright 2019 Anthony Wells
 * Released under the MIT license.
 * https://raw.githubusercontent.com/borgboyone/jquery-ui-areaselector/master/LICENSE
 *
 * http://borgboyone.github.io/jquery-ui-areaselector/
 */

var areaSelector = $.widget('aw.areaSelector', $.ui.mouse, {
	version: '1.0.0',
	options: {
		'disabled': false,
		'appendTo': "self",
		'visible': true,
		'aspectRatio': null,
		'selection': null, // initialSelection
		'unscaledSize': null,
		'minSelectionSize': null,
		'maxSelectionSize': null,
		'enableKeyboard': false,
		'hideMask': false,
		/* callbacks */
		'start': null,
		'resize': null,
		'drag': null,
		'stop': null,
		'move': null
	},
	/** Mouse Functions **/
	_mouseCapture: function( event ) {
		return !this.options.disabled && this.capture;
	},
	_mouseDown: function( event ) {
		if (this.options.disabled) return false;
		this.capture = !(this.helper.find('.ui-areaselector-selectedarea')[0] === event.target || $.contains( this.helper.find('.ui-areaselector-selectedarea')[0], event.target ) ) && (event.which === 1);
		if (this.capture) {
			this.temporarySelection = this.selection;
			// this.proxy = true?
			var selection = this._processSelection({x:Math.round((event.pageX - this.position.left - this.gutter.left) / this.scaleX), y:Math.round((event.pageY - this.position.top - this.gutter.left) / this.scaleY), width:1, height:1});
			this._updateUI();
			this.helper.find('.ui-areaselector-selectedarea').focus();
			this.pageX = event.pageX; this.pageY = event.pageY;
		}
		return this._super( event );
	},
	// if _mouseUp and capture && not _mouseStart, selection to null? or if capture capture = true?
	_mouseStart: function( event ) {
		event.pageX = event.pageX - this.pageX + (this.selection.width + this.selection.x) - (this.pageX - this.position.left - this.gutter.left); // difference between areaWidth and displacedWidth from mouseDown ((selection.width + selection.x) - this.pageX)
		event.pageY = event.pageY - this.pageY + (this.selection.height + this.selection.y) - (this.pageY - this.position.top - this.gutter.top);
		event.target = this.helper.find('.ui-areaselector-selectedarea');
		var resizable = event.target.resizable('instance');
		resizable.axis = 'se'; // might be able to set this based on the difference compared to this.selection.height, etc...
		// in case they don't move the mouse! So _mouseStart would look for proxyOriginalSelection, which it will delete
		this.proxyOriginalSelection = this.temporarySelection;
		delete this.temporarySelection;
		return resizable._mouseStart(event);
	},
	_mouseDrag: function( event ) {
		event.pageX = event.pageX - this.pageX;
		event.pageY = event.pageY - this.pageY;
		event.target = this.helper.find('.ui-areaselector-selectedarea');
		return event.target.resizable('instance')._mouseDrag(event);
	},
	_mouseStop: function( event ) {
		this.capture = false; // should this be true?
		event.pageX = event.pageX - this.pageX;
		event.pageY = event.pageY - this.pageY;
		event.target = this.helper.find('.ui-areaselector-selectedarea');
		return event.target.resizable('instance')._mouseStop(event);
	},
	/** UI Widget Functions **/
	_create: function() {
		this._super();

		// validate options (there is no easy way to validate the user supplied options alone in the jquery ui widget framework)
		// overriding _createWidget would allow for this but it's not guaranteed that this function will be available
		this.processedOptions = this._validateOptions( this.options );

		// set-up working environment variables
		this._setUpEnvironment();

		this.element.addClass("ui-areaselector");

		// create UI and initialize UI elements based on options
		this._createUI();
		this._updateUI();

		// set-up resizable and draggable
		var areaSelector = this;
		this.helper.find('.ui-areaselector-selectedarea')
			.resizable({
				disabled:this.disabled,
				containment:"parent",
				handles:"all",
				classes:null,
				aspectRatio: this.aspectRatio ? this.aspectRatio['width'] / this.aspectRatio['height'] : false,
				minWidth:  this.minSelectionSize && this.minSelectionSize['width'] ? this.minSelectionSize['width'] : null,
				minHeight: this.minSelectionSize && this.minSelectionSize['height'] ? this.minSelectionSize['height'] : null,
				// we don't need start if we set up the mask in mouseDown (verify this) We'll still need the trigger
				start: function( event, ui ) {
					areaSelector.originalSelection =  'proxyOriginalSelector' in areaSelector ? areaSelector.proxyOriginalSelector : areaSelector.selection;
					delete areaSelector.proxyOriginalSelector;
					var selection = {'x': ui.position['left'], 'y': ui.position['top'], 'width': ui.size['width'], 'height': ui.size['height']};
					if (areaSelector._trigger("start", event, {action:"resize", selection:selection, originalSelection:areaSelector.originalSelection}) === false)
						return false;
					areaSelector.element.addClass('ui-areaselector-selecting');
					areaSelector.selection = selection;
					areaSelector._updateUI(true);
				},
				resize: function( event, ui ) {
					var selection = {'x': ui.position['left'], 'y': ui.position['top'], 'width': Math.max(ui.size['width'], 0), 'height': Math.max(ui.size['height'], 0)};
					// should we get the result from _trigger before updating the UI?  Allow for false and then cancel?
					if (areaSelector._trigger("resize", event, {action:"resize", selection:selection, originalSelection:areaSelector.originalSelection}) === false)
						return false;
					areaSelector.selection = selection;
					areaSelector._updateUI(true);
				},
				stop: function(event, ui ) {
					if (areaSelector._trigger("stop", event, {action:"resize", selection:areaSelector.selection, originalSelection:areaSelector.originalSelection}) === false)
						return false;

					areaSelector.element.removeClass('ui-areaselector-selecting');
					if ((areaSelector.selection['width'] === 0) || (areaSelector.selection['height'] === 0)) {
						areaSelector.selection = null;
						areaSelector._updateUI();
					}
				}
			})
			.draggable({
				disabled:this.disabled,
				containment:"parent",
				cursor:"move",
				start: function( event, ui ) {
					areaSelector.originalSelection = areaSelector.selection;
					var selection = {'x': ui.position['left'], 'y': ui.position['top'], 'width': areaSelector.selection['width'], 'height': areaSelector.selection['height']};
					if (areaSelector._trigger("start", event, {action:"drag", selection:selection, originalSelection:areaSelector.originalSelection}) === false)
						return false;
					areaSelector.element.addClass('ui-areaselector-selecting');
					areaSelector.selection = selection;
					areaSelector._updateUI(true);
				},
				drag: function( event, ui ) {
					var selection = {'x': ui.position['left'], 'y': ui.position['top'], 'width': areaSelector.selection['width'], 'height': areaSelector.selection['height']};
					if (areaSelector._trigger("drag", event, {action:"drag", selection:selection, originalSelection:areaSelector.originalSelection}) === false)
						return false;
					areaSelector.selection = selection;
					areaSelector._updateUI(true);
				},
				stop: function( event, ui ) {
					if (areaSelector._trigger("stop", event, {action:"drag", selection:areaSelector.selection, originalSelection:areaSelector.originalSelection}) === false)
						return false;
					areaSelector.element.removeClass('ui-areaselector-selecting');
				}
			});

		this._mouseInit();

		// can we implement this using the $.ui.plugin.add feature?  I don't think so
		if (this.options.enableKeyboard) {
			var keyHandler = function(event) {
				// return false if the keyCode doesn't match the events we handle
				if ( ![$.ui.keyCode.ESCAPE, $.ui.keyCode.UP, $.ui.keyCode.DOWN, $.ui.keyCode.LEFT, $.ui.keyCode.RIGHT].includes(event.keyCode) ) return false;

				var active = this.element.is(".ui-areaselector-selecting");
				if ((active && [$.ui.keyCode.UP, $.ui.keyCode.DOWN, $.ui.keyCode.LEFT, $.ui.keyCode.RIGHT].includes(event.keyCode)) || (!active && [$.ui.keyCode.ESCAPE].includes(event.keyCode))) return false;

				if ( event.keyCode === $.ui.keyCode.ESCAPE ) {
					this.cancel();
					return true;
				}

				var x = this.selection['x'], y = this.selection['y'], handled = false;

				switch(event.keyCode) {
					case $.ui.keyCode.UP:
						if (this.selection['y'] > 0) {
							y = Math.max(this.selection['y'] - 1, 0);
							handled = true;
						}
						break;
					case $.ui.keyCode.DOWN:
						if (this.selection['y'] < this.height - this.selection['height']) {
							y = Math.min(this.selection['y'] + 1, this.height - this.selection['height']);
							handled = true;
						}
						break;
					case $.ui.keyCode.LEFT:
						if (this.selection['x'] > 0) {
							x = Math.max(this.selection['x'] - 1, 0);
							handled = true;
						}
						break;
					case $.ui.keyCode.RIGHT:
						if (this.selection['x'] < this.width - this.selection['width']) {
							x = Math.min(this.selection['x'] + 1, this.width - this.selection['width']);
							handled = true;
						}
						break;
				}
				if (handled) {
					var selection = {'x': x, 'y': y, 'width': this.selection['width'], 'height': this.selection['height']};
					if (this._trigger('move', event, {action: 'move', selection: selection, originalSelection: this.selection}) !== false) {
						this.selection = selection;
						this._updateUI();
						return true;
					}
				}
				return false;
			};

			// should we allow the selector to be focusable regardless? what about ui-focusable?  Check that
			// also mouseDown should make areSelector have the focus in this case
			this._on(this.helper.find('.ui-areaselector-selectedarea'), {
				'keydown':function (event) {
					if (keyHandler.call(this, event)) {
						event.preventDefault();
						event.stopPropagation();
					}
				}
			});
		}

		if (this.options.visible) this._setOptionVisible(true);
	},
	_destroy: function() {
		var selectedArea = this.helper.find('.ui-areaselector-selectedarea');
		selectedArea.draggable('instance').destroy(); // not really necessary
		selectedArea.resizable('instance').destroy(); // not really necessary
		this.helper = this.helper.remove();
		if (this.appendToWrapped) this._unwrap( this.appendToWrapped );
		this.element.removeClass('ui-areaselector');
		this._super();
	},
	_setOption: function( key, value ) {
		//this._validateOption?
		this._super(key, value);
		if ( key === "visible" ) this._setOptionVisible( value );
		else if ( key === "hideMask" ) this._setOptionHideMask( value );
	},
	_setOptionDisabled: function( value ) {
		this._super();

		var selectedArea = this.helper.find('.ui-areaselector-selectedarea');
		if ( value ) {
			this.stop();
			selectedArea.draggable('instance').disable();
			selectedArea.resizable('instance').disable();
		} else {
			selectedArea.draggable('instance').enable();
			selectedArea.resizable('instance').enable();
		}
	},
	_setOptionVisible: function( value ) {
		if ( value ) {
			this.helper.css('visibility', 'visible');
		} else {
			this.stop();
			this.helper.css('visibility', 'hidden');
		}
	},
	_setOptionHideMask: function( value ) {
		if ( value ) {
			this._addClass(this.helper, 'ui-areaselector-hidemask');
		} else {
			this._removeClass(this.helper, 'ui-areaselector-hidemask');
		}
	},
	/** Publically Accessible Functions **/
	enable: function() {
		return this._setOptions( { disabled: false } );
	},
	disable: function() {
		return this._setOptions( { disabled: true } );
	},
	show: function() {
		return this._setOptions( { visible: true } );
	},
	hide: function() {
		return this._setOptions( { visible: false } );
	},
	area: function(selection) {
		if (typeof selection !== "undefined") {
			this.stop();
			if (selection === null) {
				this.selection = null;
			} else {
				this._processSelection(this._validateSelection(selection)); // this.options.skipOptionValidation ? selection : this._validate...
			}
			this._updateUI();
			return this;
		} else {
			return this.selection === null ? null : {x:this.selection['x'] / this.scaleX, y:this.selection['y'] / this.scaleY, width:this.selection['width'] / this.scaleX, height:this.selection['height'] / this.scaleY};
		}
	},
	stop: function() {
		if (this.element.is(".ui-areaselector-selecting")) {
			var selectedArea = this.helper.find('.ui-areaselector-selectedarea');
			if (selectedArea.is(".ui-resizable-resizing")) {
				selectedArea.resizable('instance').cancel();
			} else if (selectedArea.is(".ui-draggable-dragging")) {
				selectedArea.draggable('instance').cancel();
			}
			// CHECK: if (this.capture) we may need to issue mouseUp here
			this.capture = false;

			this.element.removeClass("ui-areaselector-selecting");
		}
	},
	cancel: function() {
		if (this.element.is(".ui-areaselector-selecting")) {
			this.stop();

			this.selection = this.originalSelection;
			this._updateUI();
		}
		return this;
	},
	refresh: function( options ) {
		var isDisabled = !!this.options.disabled,
			isVisible = !!this.options.visible;

		// this.stop(); redundant
		if (!isDisabled) this.disable();
		if (isVisible) this.hide();
		//this.selection = null; // not necessary
		if ( options ) {
			this.processedOptions = $.extend(this.processedOptions, this._validateOptions(options));
		}
		this._setUpEnvironment();
		this._updateOverlay();
		this._updateUI();
		if (!isDisabled) this.enable();
		if (isVisible) this.show();

		return this;
	},
	resize: function() {
		var origProcessedSelectionOption = this.processedOptions['selection'];

		// if size hasn't changed should we return?
		this.stop();
		this.processedOptions['selection'] = this.area();
		this._setUpEnvironment();
		this._updateOverlay(); // not expected for resize, but for consistency
		this._updateUI();
		this.processedOptions['selection'] = origProcessedSelectionOption;

		return this;
	},
	/** Area Selector Specific Internal Functions **/
	_validateOptions: function( o ) {
		var po = {};

		// appendTo
		if (!o.appendTo) throw new Error("Option 'appendTo' must be a non empty value");
		if ( !((o.appendTo === "self") || (o.appendTo === "parent")) && ($(o.appendTo).length === 0) ) throw new Error("No DOM element matching option 'appendTo' found in the document");

		// aspectRatio
		if (o.aspectRatio) {
			if (typeof o.aspectRatio === "string") {
				if (/^\d+:\d+$/.test(o.aspectRatio)) {
					var values = o.aspectRatio.split(":");
					po.aspectRatio = {width:parseInt(values[0]), height:parseInt(values[1])};
				} else throw new Error("Option 'aspectRatio' must be of the form integer:integer");
			} else if ( (typeof o.aspecRatio === "object") && !Array.isArray(o.aspectRatio)) {
				if (!(('width' in o.aspectRatio) && this._isStrictPositiveInteger(o.aspectRatio['width']) && (o.aspectRatio['width'] > 0) && ('height' in o.aspectRatio) && this._isStrictPositiveInteger(o.aspectRatio['height']) && (o.aspectRatio['height'] > 0)))
					throw new Error("Option 'aspectRatio' must contain both 'width' and 'height' properties with positive integer values greater than zero");
				po.aspectRatio = {width: o.aspectRatio['width'] + 0, height: o.aspectRatio['height'] + 0};
			} else if ( typeof o.aspectRatio === "number" ) {
				if (o.aspectRatio <= 0 )
					throw new Error("Option 'aspectRatio' must be larger than 0");
				po.aspectRatio = {width: o.aspectRatio + 0, height: 1};
			} else throw new Error("Unknown format for provided option 'aspectRatio'");
		} else { po.aspectRatio = null; }

		// unscaledSize
		if (o.unscaledSize) {
			if ( !((typeof o.unscaledSize == "object") && ('width' in o.unscaledSize) && ('height' in o.unscaledSize)
					&& this._isStrictPositiveInteger(o.unscaledSize['width']) && this._isStrictPositiveInteger(o.unscaledSize['height'])
					&& (o.unscaledSize['width'] > 0) && (o.unscaledSize['height'] > 0)) )
				throw new Error("Option 'unscaledSize' must contain both 'width' and 'height' properties with positive integer values greater than zero");
			po.unscaledSize = {width:o.unscaledSize['width'] + 0, height:o.unscaledSize['height'] + 0};
		} else { po.unscaledSize = null; }

		// initialSelection
		po.selection = this._validateSelection( o.selection );

		// minSelectionSize
		if (o.minSelectionSize) {
			// width or height may be omitted, must not be larger than unscaledSize (if provided)
			if (!((typeof o.minSelectionSize === "object") && (('width' in o.minSelectionSize) || ('height' in o.minSelectionSize))) ||
					((('width' in o.minSelectionSize) && !this._isStrictInteger(o.minSelectionSize['width']))
					|| (('height' in o.minSelectionSize) && !this._isStrictInteger(o.minSelectionSize['height']))))
				throw new Error("Option 'minSelectionSize' must contain either of or both 'width' and 'height' properties with positive integer values");

			po.minSelectionSize = {width:'width' in o.minSelectionSize ? o.minSelectionSize['width'] + 0 : null,
									height:'height' in o.minSelectionSize ? o.minSelectionSize['height'] + 0 : null};

			if (po.aspectRatio && po.minSelectionSize['width'] && po.minSelectionSize['height'] && ((po.aspectRatio['width'] / po.aspectRatio['height']) != (po.minSelectionSize['width'] / po.minSelectionSize['height']))) {
				po.minSelectionSize = this._adjustForAspectRatio(po.minSelectionSize, "smallest_exterior");
				console.warn("Option 'minSelectionSize' width and height does not match provided 'aspectRatio'. Adjusting accordingly.");
			}

			if (po.unscaledSize && ('width' in po.minSelectionSize) && (po.minSelectionSize['width'] > po.unscaledSize['width']))
				throw new Error("Option 'minSelectionSize.width' cannot be larger than 'unscaledSize.width");
			if (po.unscaledSize && ('height' in po.minSelectionSize) && (po.minSelectionSize['height'] > po.unscaledSize['height']))
				throw new Error("Option 'minSelectionSize.height' cannot be larger than 'unscaledSize.height");
		} else { po.minSelectionSize = null; }

		// maxSelectionSize
		if (o.maxSelectionSize) {
			// width or height may be omitted must not be less than minSelectionSize
			if (!((typeof o.maxSelectionSize === "object") && (('width' in o.maxSelectionSize) || ('height' in o.maxSelectionSize))) ||
					((('width' in o.maxSelectionSize) && !this._isStrictPositiveInteger(o.maxSelectionSize['width']))
					|| (('height' in o.maxSelectionSize) && !this._isStrictPositiveInteger(o.maxSelectionSize['height']))))
				throw new Error("Option 'maxSelectionSize' must contain either of or both 'width' and 'height' properties with positive integer values");

			po.maxSelectionSize = {width:'width' in o.maxSelectionSize ? o.maxSelectionSize['width'] + 0 : null,
									height:'height' in o.maxSelectionSize ? o.maxSelectionSize['height'] + 0: null};

			if (po.minSelectionSize && (po.minSelectionSize['width']) && (po.maxSelectionSize['width']) && (po.minSelectionSize['width'] > po.maxSelectionSize['width']))
				throw new Error("Option 'minSelectionSize.width' cannot be larger than 'maxSelectionSize.width");
			if (po.minSelectionSize && (po.minSelectionSize['height']) && (po.maxSelectionSize['height']) && (po.minSelectionSize['height'] > po.maxSelectionSize['height']))
				throw new Error("Option 'minSelectionSize.height' cannot be larger than 'maxSelectionSize.height");
		}

		return po;
	},
	_validateSelection: function( selection ) {
		if (selection) {
			if (typeof selection === "string") {
				if (!['auto', 'none'].includes(selection))
					throw new Error("Option 'initialSelection' must be one of 'auto', or 'none'");
				return selection;
			} else if ( (typeof selection === "object") && !Array.isArray(selection) ) {
				if ( !(('x' in selection) && this._isStrictInteger(selection['x']) && ('y' in selection) && this._isStrictInteger(selection['y'])
						&& ('width' in selection) && this._isStrictInteger(selection['width']) && ('height' in selection) && this._isStrictInteger(selection['height'])) )
					throw new Error("Option 'initialSelection' must contain 'x', 'y', 'width' and 'height' properties with positive integer values");
				return {'x': selection['x'] + 0, 'y': selection['y'] + 0, 'width': selection['width'] + 0, 'height': selection['height'] + 0};
			} else throw new Error("Unknown format for provided option 'initialSelection'");
		}
		return null;
	},
	_setUpEnvironment: function() {
		var o = this.processedOptions;

		this.position = this.element.position();
		this.gutter = {left: (parseFloat(this.element.css('border-left-width')) || 0) + (parseFloat(this.element.css('margin-left')) || 0), top: (parseFloat(this.element.css('border-top-width')) || 0) + (parseFloat(this.element.css('margin-top')) || 0)};

		this.width = this.element.innerWidth();
		this.height = this.element.innerHeight();
		this.scaleX = o.unscaledSize ? this.width / o.unscaledSize['width'] : 1;
		this.scaleY = o.unscaledSize ? this.height / o.unscaledSize['height'] : 1;
		this.minSelectionSize = o.minSelectionSize ? {'width': o.minSelectionSize['width'] ? Math.min(this.width, o.minSelectionSize['width'] * this.scaleX) : null, 'height': o.minSelectionSize['height'] ? Math.min(this.height, o.minSelectionSize['height'] * this.scaleY) : null} : null;
		if (!o.unscaledSize) {
			if (this.minSelectionSize['width'] && (this.minSelectionSize['width'] > this.width)) {
				console.warn("Option 'minSelectionSize.width' is larger than the current width.  Dropping 'minSelectionSize.width'.");
				this.minSelectionSize['width'] = null;
			}
			if (this.minSelectionSize['height'] && (this.minSelectionSize['height'] > this.height)) {
				console.warn("Option 'minSelectionSize.height' is larger than the current height.  Dropping 'minSelectionSize.height'.");
				this.minSelectionSize['height'] = null;
			}
		}
		this.aspectRatio = o.aspectRatio;
		if (this.aspectRatio) {
			if (this.minSelectionSize['width'] && (this.minSelectionSize['width'] / this.aspectRatio['width'] * this.aspectRatio['height'] > this.height)) {
				console.warn("Option 'minSelectionSize.width' in conjunction with the provided 'aspectRatio' results in a value that is larger than the current height.  Dropping 'minSelectionSize.width'.");
				this.minSelectionSize['height'] = null;
			}
			if (this.minSelectionSize['height'] && (this.minSelectionSize['height'] / this.aspectRatio['height'] * this.aspectRatio['width'] > this.width)) {
				console.warn("Option 'minSelectionSize.height' in conjunction with the provided 'aspectRatio' results in a value that is larger than the current width.  Dropping 'minSelectionSize.height'.");
				this.minSelectionSize['height'] = null;
			}
		}
		this.maxSelectionSize = o.maxSize ? {'width': o.maxSize['width'] ? o.maxSize['width'] * this.scaleX : null, 'height': o.maxSize['height'] ? o.maxSize['height'] * this.scaleY : null} : null;
		this._processSelection(o.selection);
	},
	_processSelection: function( selection ) {
		if ( selection ) {
			if ( selection === 'auto' && this.aspectRatio === null ) {
				this.selection = {'x':0,'y':0,'width':this.width,'height':this.height};
			} else if ( (selection === 'auto') ) { // autoCrop based on aspectRatio
				var largestRectangle = this._adjustForAspectRatio( {width:this.width, height:this.height} );
				this.selection = this._processSelection({'x': (this.width - largestRectangle['width']) / 2, 'y': (this.height - largestRectangle['height']) / 2, 'width': largestRectangle['width'], 'height': largestRectangle['height']});
			} else if (selection == 'none') {
				this.selection = null;
			} else {
				var x = Math.max(Math.min(selection['x'] * this.scaleX, this.width), 0),
					y = Math.max(Math.min(selection['y'] * this.scaleY, this.height), 0),
					width = Math.max(this.minSelectionSize ? this.minSelectionSize['width'] : 0, Math.min(this.maxSelectionSize ? this.maxSelectionSize['width'] : Infinity, selection['width'] * this.scaleX)),
					height = Math.max(this.minSelectionSize ? this.minSelectionSize['height'] : 0, Math.min(this.maxSelectionSize ? this.maxSelectionSize['height'] : Infinity, selection['height'] * this.scaleY));
				// , this.width - o.selection['x'] * this.scaleX
				if ( x + width > this.width ) {
					width = Math.max(this.minSelectionSize ? this.minSelectionSize['width'] : 0, this.width - x);
					x = this.width - width; /*<= adjusts x for minSelectionSize and truncates*/
				}
				if ( y + height > this.height ) { 
					height = Math.max(this.minSelectionSize ? this.minSelectionSize['height'] : 0, this.height - y);
					y = this.height - height;
				}

				if (this.aspectRatio) {
					var temp = this._adjustForAspectRatio( {width: width, height: height}, "smallest_exterior" );
					width = temp['width'];
					height = temp['height'];
					if (width > this.width) {
						width = this.width;
						height = this.aspectRatio['height'] / this.aspectRatio['width'] * width;
						x = 0;
					} else if (x + width > this.width) {
						x = this.width - width;
					}
					if (height > this.height) {
						height = this.height;
						width = this.aspectRatio['width'] / this.aspectRatio['height'] * height;
						y = 0;
					} else if (y + height > this.height) {
						y = this.height - height;
					}
				}
				this.selection = {'x':x, 'y':y, 'width':width, 'height':height};
			}
		} else this.selection = null;

		return this.selection;
	},
	_adjustForAspectRatio: function( size, method ) {
		if ( !method ) method = "largest_interior";

		var arw = this.aspectRatio['width'],
			arh = this.aspectRatio['height'],
			width = size['width'],
			height = size['height'];

		if ( method === "largest_interior") {
			if (arh * width > arw * height) {
				width = height * arw / arh;
			} else if (arh * width < arw * height) {
				height = width * arh / arw;
			}
		} else { // smallest_exterior or smallest_encapsulating
			if (arh * width > arw * height) {
				height = width * arh / arw;
			} else if (arh * width < arw * height) {
				width = height * arw / arh;
			}
		}

		return {width:width, height:height};
	},
	_createUI: function() {
		var appendTo = !this.options.appendTo || this.options.appendTo === "self" ? this.element : (this.options.appendTo === "parent" ? this.element.parent() : $(this.options.appendTo)),
			helper = $(
			'<div class="ui-areaselector-overlay" style="position:absolute;visibility:hidden;width:' + this.width + 'px;height:' + this.height + 'px;">' + 
				'<div class="ui-areaselector-selectedarea" style="display:none;"></div>' +
 				'<div class="ui-areaselector-mask ui-areaselector-mask-top"></div>' +
				'<div class="ui-areaselector-mask ui-areaselector-mask-left"></div>' +
				'<div class="ui-areaselector-mask ui-areaselector-mask-right"></div>' +
				'<div class="ui-areaselector-mask ui-areaselector-mask-bottom"></div>' +
			'</div>');

		// Wrap appendTo if it cannot hold child nodes
		if ( appendTo[ 0 ].nodeName.match( /^(canvas|textarea|input|select|button|img)$/i ) ) {
			this.appendToWrapped = appendTo;
			appendTo = this._wrap( appendTo );
		}

		if ( !/^relative|absolute|fixed$/.test(appendTo.css('position')) )
			helper.css({left: this.position.left, top: this.position.top, 'margin-left': this.gutter.left, 'margin-top': this.gutter.top});

		// allow selectedarea to be focusable
		/*this._focusable(*/helper.find('.ui-areaselector-selectedarea').attr('tabindex', -1)/*)*/;

		this.helper = helper.appendTo(appendTo);
	},
	_updateOverlay: function() {
		if ( !/^relative|absolute|fixed$/.test(this.helper.parent().css('position')) )
			this.helper.css({left: this.position.left, top: this.position.top, 'margin-left': this.gutter.left, 'margin-top': this.gutter.top});
	},
	// call this to initialize the UI as well!
	_updateUI: function( maskOnly ) {
			if (this.selection === null) {
				if ( !maskOnly ) {
					this.helper.find('.ui-areaselector-selectedarea').hide();
				}
				this.helper
					.find('.ui-areaselector-mask-top').css({left:'0', top:'0', width:'0', height:'0'}).end()
					.find('.ui-areaselector-mask-left').css({left:'0', top:'0', width:'0', height:'0'}).end()
					.find('.ui-areaselector-mask-right').css({left:'0', top:'0', width:'0', height:'0'}).end()
					.find('.ui-areaselector-mask-bottom').css({left:'0', top: '0', width:'0', height:'0'});
			} else {
				var selection = this.selection;
				if ( !maskOnly ) {
					this.helper.find('.ui-areaselector-selectedarea').css({left:selection.x, top:selection.y, width:selection.width, height:selection.height}).show();
				}
				this.helper
					.find('.ui-areaselector-mask-top').css({left:'0', top:'0', width:this.width, height:selection.y}).end()
					.find('.ui-areaselector-mask-left').css({left:'0', top:selection.y, width:selection.x, height:selection.height}).end()
					.find('.ui-areaselector-mask-right').css({left:(selection.width + selection.x), top:selection.y, width: (this.width - (selection.width + selection.x)), height:selection.height}).end()
					.find('.ui-areaselector-mask-bottom').css({left:'0', top: (selection.y + selection.height), width:this.width, height: (this.height - (selection.y + selection.height))});
			}
	},
	_wrap: function( element ) {
		var wrapper = element.wrap(
				$( "<div class='ui-wrapper' style='overflow: hidden;'></div>" ).css( {
					position: element.css( "position" ),
					width: element.outerWidth(),
					height: element.outerHeight(),
					top: element.css( "top" ),
					left: element.css( "left" )
				} )
			).parent(),
			margins = {
				marginTop: element.css( "marginTop" ),
				marginRight: element.css( "marginRight" ),
				marginBottom: element.css( "marginBottom" ),
				marginLeft: element.css( "marginLeft" )
			};

		wrapper.css( margins );
		element.css( "margin", 0 );

		return wrapper;
	},
	_unwrap: function ( element ) {
		var	wrapper = element.parent(),
			margins = {
				marginTop: wrapper.css( "marginTop" ),
				marginRight: wrapper.css( "marginRight" ),
				marginBottom: wrapper.css( "marginBottom" ),
				marginLeft: wrapper.css( "marginLeft" )
			};

		element.css( {
			position: wrapper.css( "position" ),
			width: wrapper.outerWidth(),
			height: wrapper.outerHeight(),
			top: wrapper.css( "top" ),
			left: wrapper.css( "left" )
		} );

		element.unwrap().css( margins );
	},
	_isStrictInteger: function( value ) {
		return typeof value === 'number' && isFinite(value) && Math.floor(value) === value;
		//return !isNaN( parseInt( value ));
	},
	_isStrictPositiveInteger: function( value ) {
		return this._isStrictInteger( value ) && value >= 0;
	}
});

}));

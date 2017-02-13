/*
 * NASA Worldview
 *
 * This code was originally developed at NASA/Goddard Space Flight Center for
 * the Earth Science Data and Information System (ESDIS) project.
 *
 * Copyright (C) 2013 - 2016 United States Government as represented by the
 * Administrator of the National Aeronautics and Space Administration.
 * All Rights Reserved.
 *
 * Licensed under the NASA Open Source Agreement, Version 1.3
 * http://opensource.gsfc.nasa.gov/nosa.php
 */
 /* jshint undef: true, unused: true */
var wv = wv || {};
wv.map = wv.map || {};

/*
 * @Class
 */
wv.map.datelinebuilder = wv.map.ui || function(models, config) {
	var self = {};
	var map, overlay1, overlay2, lineBeingHovered, textFactory, lineFactory, textOverlay1, textOverlay2,
        lineLeft, lineRight, textLeft, textRight;

	self.init = function(Parent, olMap, date) {
        var height, y, dimensions;
		map = olMap;
        lineFactory = React.createFactory(WVC.DateLine);
        textFactory = React.createFactory(WVC.LineText);
        drawDatelines(map, date);

        Parent.events.on('moveend', function() {
            updateLineVisibility(true);
			dimensions = position(map);
            update(dimensions);
        });
        Parent.events.on('drag', function() {
            updateLineVisibility(false);
        });
        Parent.events.on('movestart', function() {
            updateLineVisibility(false);
        });
        models.date.events.on('select', function() {
            updateDate(models.date.selected)
        });
    };

    /*
     * Add Props to React Compents that creates
     *  a hoverable line SVG
     *
     * @method setLineDefaults
     * @static
     *
     * @param {object} Factory - React component Factory
     * @param {number} height - Lenght of line
     * @param {number} lineX - x coord value
     * @param {object} overlay - OL overlay
     * @param {object} reactCase - Dom El in which to render component
     * @param {object} tooltip - OL overlay that is associated with this widget
     *
     * @returns {object} React Component
     */
    var setLineDefaults = function(Factory, height, lineX, overlay, reactCase, tooltip) {
        var props = {
            height: height,
            lineOver: onHover,
            lineOut: onMouseOut,
            lineX: lineX,
            overlay: overlay,
            tooltip: tooltip
        };
        return ReactDOM.render(initWidget(Factory, props), reactCase);
    };

    /*
     * Add Props to React Compents that creates an
     *  SVG text component
     *
     * @method setTextDefaults
     * @static
     *
     * @param {object} Factory - React component Factory
     * @param {object} reactCase - Dom El in which to render component
     * @param {object} date - JS date object
     *
     * @returns {object} React Component
     */
    var setTextDefaults = function(Factory, reactCase, date) {
        var props = {
            dateLeft: wv.util.toISOStringDate(wv.util.dateAdd(date, 'day', 1)),
            dateRight: wv.util.toISOStringDate(date)
        };
        return ReactDOM.render(initWidget(Factory, props), reactCase);
    };

    /*
     * Creates new instance of react component
     *
     * @method initWidget
     * @static
     *
     * @param {object} Factory - React component Factory
     * @param {object} props - component props
     *
     * @returns {object} React Component
     */
    var initWidget = function(Factory, props) {
        return Factory(props);
    };

    /*
     * Updates active state of line Components
     *
     * @method updateLineVisibility
     * @static
     *
     * @param {boolean} boo - component deactivation boolean
     *
     * @returns {void}
     */
    var updateLineVisibility = function(boo) {
        var state = {active: boo};
        lineRight.setState(state);
        lineLeft.setState(state);
    };

    /*
     * constructs dateline components
     *
     * @method drawDatelines
     * @static
     *
     * @param {boolean} boo - component deactivation boolean
     *
     * @returns {void}
     */
    var drawDatelines = function(map, date) {
        var height, leftLineCase, rightLineCase, leftTextCase, rightTextCase;
        
        leftLineCase = document.createElement("div");
        rightLineCase = document.createElement("div");
        leftTextCase = document.createElement("div");
        rightTextCase = document.createElement("div");
        height = 0;

        overlay1 = drawOverlay([-180, 90], leftLineCase);
        overlay2 = drawOverlay([180, 90], rightLineCase);
        textOverlay1 = drawOverlay([-180, 90], leftTextCase);
        textOverlay2 = drawOverlay([180, 90], rightTextCase);

        map.addOverlay(overlay1);
        map.addOverlay(overlay2);
        map.addOverlay(textOverlay1);
        map.addOverlay(textOverlay2);

        textLeft = setTextDefaults(textFactory, leftTextCase, date);
        textRight = setTextDefaults(textFactory, rightTextCase, wv.util.dateAdd(date, 'day', -1));
        lineLeft = setLineDefaults(lineFactory, height, -180, textOverlay1, leftLineCase, textLeft);
        lineRight = setLineDefaults(lineFactory, height, 180, textOverlay2, rightLineCase, textRight);
    };

    var onHover = function(pixels, overlay, lineX, tooltip) {
        var coords;
        coords = map.getCoordinateFromPixel(pixels);
        overlay.setPosition([lineX, coords[1]]);
        tooltip.setState({active: true});
    };
    var onMouseOut = function(tooltip) {
        tooltip.setState({active: false});
    };
    var updateDate = function(date) {
        var leftState, rightState;
        leftState = {
            dateLeft: wv.util.toISOStringDate(wv.util.dateAdd(date, 'day', 1)),
            dateRight: wv.util.toISOStringDate(date)
        };
        rightState = {
            dateLeft: wv.util.toISOStringDate(date),
            dateRight: wv.util.toISOStringDate(wv.util.dateAdd(date, 'day', -1))
        };
        textLeft.setState(leftState);
        textRight.setState(rightState);

    };
    var position = function(map) {
        var extent, top, topY, bottomY, bottom, height, startY, topExtent, bottomExtent;

        if(map.getSize()[0] === 0) {
            return;
        }
        extent = map.getView().calculateExtent(map.getSize());
        top = [extent[2] -1, extent[3] + 5];
        bottom = [extent[2] -1, extent[1] - 5];
        topExtent = map.getPixelFromCoordinate([extent[2] -1, extent[3] - 1]);
        bottomExtent = map.getPixelFromCoordinate([extent[0] + 1, extent[1] + 1]);
        topY = Math.round(topExtent[1] + 5);
        bottomY = Math.round(bottomExtent[1] - 5);
        startY = Math.round(extent[3] + 5);

		if (startY > 90) {
			startY = 90;
			topY = map.getPixelFromCoordinate([extent[2], 90])[1];
		} else {
			topY = map.getPixelFromCoordinate(top)[1];
		}
		if (extent[1] > -90) {
			bottomY = map.getPixelFromCoordinate(bottom)[1];
		} else {
			bottomY = map.getPixelFromCoordinate([extent[2], -90])[1];
		}
        height = Math.round(Math.abs(bottomY - topY));

        return [height, startY];
    };
    var update = function(dimensions) {
        var state = {height: dimensions[0]};
        lineRight.setState(state);
        lineLeft.setState(state);
        overlay1.setPosition([-180, dimensions[1]]);
        overlay2.setPosition([180, dimensions[1]]);
    };
    var drawOverlay = function(coordinate, el) {
        var overlay = new ol.Overlay({
            element: el,
            stopEvent: false
        });
        overlay.setPosition(coordinate);
        return overlay;
    };

    return self;
};
# jQuery-UI-AreaSelector
Intuitive with useful options.

Extensive features:

- Work entirely in unscaled dimensions by providing the `unscaledSize` option.
- Keyboard support provided.
- Available refresh function to update dimensional options.
- Available resize function to interally refresh the size of the underlying target.
- Limit selection to a minimum and/or maximum size.
- Limit selection to a specified aspect ratio.
- Mask area provided to highlight the selected area.
- Ability to hide the mask area.
- All quadrant and side resizing handles are provided.
- Callback options supported for all activity.
- Ability to censor any activity through the callbacks.
- Ability to provide the initial selection.
- Wraps the selectable area element as needed.
- Target element and selectable area can be distinct by specifying separate `appendTo`.

Demos and further information is available at http://borgboyone.github.io/jquery-ui-areaselector/

Options
-------
-	`disabled`: Disables the areaSelector if set to `true`. (default: `false`)
-	`visible`: Hides the areaSelector if set to `false`. (default: `true`)
-	`hideMask`: Hides the mask if set to `true`. (default: `false`)
-	`appendTo`: The DOM element in which to append the overlay. Accepts "self", "parent", or a jQuery selector. (default: "self")
-	`unscaledSize`: The unscaled size of the areaSelector.  Used to scale the min and max selection sizes, and the selection if provided. Accepts a plain object with both 'width' and 'height' properties with positive integer values. (default: `null`)
-	`aspectRatio`: The aspect ratio to maintain for the selected area.  Accepts various formats: "<width>:<height>", {width:<width>,height:<height>}, or a positive (non zero) number. (default: `null`)
-	`selection`: The initialSelection of the areaSelector.  Either `null`, "auto", "none" or an object with 'x', 'y', 'width', and 'height' properties containing positive integer values. Values maybe altered according to other option criteria. (default: `null`)
-	`minSelectionSize`: The minimum size of the selection area. Accepts a plain object with either or both 'width' and 'height' properties with positive integer values (zero inclusive) or `null`. Validated against `unscaledSize` and `aspectRatio` accordingly. (default: `null`)
-	`maxSelectionSize`: The maximum size of the selection area. Accepts a plain object with either or both 'width' and 'height' properties with positive integer values (non zero) or `null`. Validated against `aspectRatio` and `minSelectionSize` accordingly. (default: `null`)
-	`enableKeyboard`: Enable keyboard interaction if set to `true`. (default: `false`)

Callbacks
--------
All callbacks are passed the parameters event and ui. The type of activity being performed on the selection area is accessible from ui.action in order to distinguish whether the start or stop is the result of resizing or dragging. The yet to be applied position and size are accessible from ui.position and ui.size respectively. The original position and size at the start of the activity are accessible from ui.originalPosition and ui.originalSize respectively. Returning false will prevent the activity from being applied to the selection area. Note that `start` and `stop` are not called for the keyboard event `move`.

-	`start`:
-	`resize`:
-	`drag`:
-	`stop`:
-	`move`:

Methods
-------
-	`enable`: Enables the areaSelector widget.
-	`disable`: Ends any activity and disables the areaSelector widget. The widget continues to stay visible.
-	`hide`: Ends any activity and hides the areaSelector widget.
-	`show`: Displays the areaSelector widget.
-	`refresh`: Provides the user the ability to update options (aspectRatio, unscaledSize, minSelectionSize, maxSelectionSize, and selection). Ends any activity, disables and hides the widget (if necessary), updates the widget with the provided options (if supplied), updates the working environment, displays and enables the widget (as necessary).  Useful if the underlying DOM changes (ie. changing an image).
-	`resize`: Refreshes the width and height values based on the widget target and updates the working environment, including the selector, accordingly. Useful for user magnification or fullscreen editing of the area.
-	`area`: Either alters the selection (if a selection argument is provided) or returns the current unscaled selection. Returns null if there is no selected area.
-   `cancel`: Ends any activity and reverts the position and size of the selectable area to its preactivity metrics.
-	`stop`: Ends any activity.

Usage
-----
Typical:
```js
    $(window).on('load', (function () {
        $('#area-select img').areaSelector({});
    }));
```

Note, it is necessary to sync the initialization of the areaSelector (or when calling `refresh`) with image loading. When creating an img tag or changing the src attribute of an existing image tag, be sure to follow these steps:

```js
    var img = $(new Image());
    $img.prop('id', 'area-select').prop('style', "width:100%;max-width:" + file['width'] + "px;");
    $('.img-wrapper').append($img);
    $img.on('load', function() {
        $('#area-select').areaSelector({
            unscaledWidth: {width: file['width'], height: file['height']},
            aspectRatio: "2:3",
            minimumSize: {width: 100, height: 150},
            selection: "auto"
        });
    });
    $img.attr('src', "https://....");
```

Auxilliary
----------
The areaSelector widget requires the resizable widget included in the package. It provides numerous bug fixes and enhancements. (It does not fix all issues associated with resizable!) This widget must be referenced after the jquery ui library has loaded, as it replaces the jquery ui resizable stock implementation.

The provided CSS file provides all necessary styling. It is not necessary to load the jquery ui core css or theme css. The provided CSS targets areaSelector widgets only and does not influence or interfere with other resizable or draggable instances.

ToDo
----
There is really only one outstanding item that would provide significant improvement to the areaSelector widget.
-	Add unit selection...that is integer only values are returned in the selection and selection metrics adhere to unscaled unit measurements. While this works well for draggable via the grid option, it does not remotely work for resizable. A new "plugin" is required that correctly snaps to aspect ratio correct grid points. In testing such a plugin, further severe issues were found in west and north associated resizing. While some users may find these issues only to be an annoyance, I consider them severe enough to make the widget unsuitable for professional usage.

License
-------
MIT License. Copyright 2019, Anthony Wells.

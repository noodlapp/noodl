function isPercentage(size) {
  return size && size[size.length - 1] === '%';
}

function getPercentage(size) {
  return Number(size.slice(0, -1));
}

function getSizeWithMargins(size, startMargin, endMargin) {
  if (!startMargin && !endMargin) {
    return size;
  }

  let css = `calc(${size}`;
  if (startMargin) {
    css += ` - ${startMargin}`;
  }
  if (endMargin) {
    css += ` - ${endMargin}`;
  }
  css += ')';

  return css;
}

export default {
  size(style, props) {
    if (props.parentLayout === 'none') {
      style.position = 'absolute';
    }

    if (props.sizeMode === 'explicit') {
      style.width = props.width;
      style.height = props.height;
    } else if (props.sizeMode === 'contentHeight') {
      style.width = props.width;
    } else if (props.sizeMode === 'contentWidth') {
      style.height = props.height;
    }

    style.flexShrink = 0;

    if (props.parentLayout === 'row' && style.position === 'relative') {
      if (isPercentage(style.width) && !props.fixedWidth) {
        style.flexGrow = getPercentage(style.width);
        style.flexShrink = 1;
      }

      if (isPercentage(style.height) && !props.fixedHeight) {
        style.height = getSizeWithMargins(style.height, style.marginTop, style.marginBottom);
      }
    } else if (props.parentLayout === 'column' && style.position === 'relative') {
      if (isPercentage(style.width) && !props.fixedWidth) {
        style.width = getSizeWithMargins(style.width, style.marginLeft, style.marginRight);
      }

      if (isPercentage(style.height) && !props.fixedHeight) {
        style.flexGrow = getPercentage(style.height);
        style.flexShrink = 1;
      }
    } else if (style.position !== 'relative') {
      if (isPercentage(style.width)) {
        style.width = getSizeWithMargins(style.width, style.marginLeft, style.marginRight);
      }
      if (isPercentage(style.height)) {
        style.height = getSizeWithMargins(style.height, style.marginTop, style.marginBottom);
      }
    }
  },
  align(style, props) {
    const { position } = style;
    let { alignX, alignY } = props;

    //Elements with position absolute get's a default alignment.
    //This keeps backward compability, and makes sense for most use cases of
    //absolutely positioned elements
    if (position !== 'relative') {
      alignX = alignX || 'left';
      alignY = alignY || 'top';
    }

    let transform = '';

    const parentFlexDirection = props.parentLayout || 'column';
    if (alignX) {
      if (position !== 'relative') {
        if (alignX === 'left') {
          style.left = 0;
        } else if (alignX === 'center') {
          style.left = '50%';
          transform += 'translateX(-50%) ';
        } else {
          style.right = 0;
        }
      } else if (position === 'relative' && parentFlexDirection === 'row') {
        switch (alignX) {
          case 'left':
            style.marginRight = style.marginRight ? style.marginRight : 'auto';
            break;
          case 'center':
            style.marginRight = style.marginRight ? style.marginRight : 'auto';
            style.marginLeft = style.marginLeft ? style.marginLeft : 'auto';
            break;
          case 'right':
            style.marginLeft = style.marginLeft ? style.marginLeft : 'auto';
            break;
        }
      } else if (position === 'relative' && parentFlexDirection === 'column') {
        switch (alignX) {
          case 'left':
            style.alignSelf = 'flex-start';
            break;
          case 'center':
            style.alignSelf = 'center';
            break;
          case 'right':
            style.alignSelf = 'flex-end';
            break;
        }
      }
    }

    if (alignY) {
      if (position !== 'relative') {
        if (alignY === 'top') {
          style.top = 0;
        } else if (alignY === 'center') {
          style.top = '50%';
          transform += 'translateY(-50%)';
        } else {
          style.bottom = 0;
        }
      } else if (position === 'relative' && parentFlexDirection === 'column') {
        switch (alignY) {
          case 'top':
            style.marginBottom = style.marginBottom ? style.marginBottom : 'auto';
            break;
          case 'center':
            style.marginTop = style.marginTop ? style.marginTop : 'auto';
            style.marginBottom = style.marginBottom ? style.marginBottom : 'auto';
            break;
          case 'bottom':
            style.marginTop = style.marginTop ? style.marginTop : 'auto';
            break;
        }
      } else if (position === 'relative' && parentFlexDirection === 'row') {
        switch (alignY) {
          case 'top':
            style.alignSelf = 'flex-start';
            break;
          case 'center':
            style.alignSelf = 'center';
            break;
          case 'bottom':
            style.alignSelf = 'flex-end';
            break;
        }
      }
    }

    if (transform) {
      style.transform = transform + (style.transform || '');
    }
  }
};

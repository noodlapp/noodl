const { ipcRenderer } = require('electron');
const { useEffect, useRef, useState } = require('react');
const React = require('react');
const { default: useOnUnmount } = require('../../hooks/useOnUnmount');
const PopupLayer = require('../popuplayer');

function LessonItem({
  itemContent,
  popupContent,
  hasNextButton,
  isComplete,
  isSelected,
  showPopupWhenSelected,
  stepWidth,
  performActions
}) {
  const ref = useRef();
  const popoutRef = useRef();

  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    //scroll into view when selected, and check if popup should be shown
    const scrollIntoView = async () => {
      await scrollToElement(ref.current);
      showPopupWhenSelected && setShowPopup(true);
    };

    if (isSelected) {
      scrollIntoView();
      performActions();
    }
  }, [isSelected, popupContent]);

  //check if popup should be shown
  useEffect(() => {
    if (!showPopup || !popupContent) {
      return;
    }

    const container = document.createElement('div');
    container.className = 'lesson-item-popup';
    container.appendChild(popupContent);

    PopupLayer.instance.hidePopouts(); //hide all other popouts that might be showing

    popoutRef.current = PopupLayer.instance.showPopout({
      content: { el: $(container) },
      attachTo: $(ref.current),
      position: 'top',
      arrowColor: 'var(--theme-color-secondary)',
      animate: true,
      offsetY: -8,
      manualClose: hasNextButton,
      onClose: () => {
        setShowPopup(false);
        ipcRenderer.send('viewer-show');
      }
    });

    ipcRenderer.send('viewer-hide');

    //make sure any videos start playing
    const videos = container.querySelectorAll('video');
    videos.forEach((video) => {
      video.play();
    });

    return () => {
      //pause videos, otherwise they run in the background and consume resources
      videos.forEach((video) => {
        video.pause();
      });
      PopupLayer.instance.hidePopout(popoutRef.current);
    };
  }, [showPopup, popupContent]);

  //This solves an issue where popups aren't closed when using the debug keyboard shortcut to skip steps
  useEffect(() => {
    if (showPopup && popoutRef.current.manualClose && hasNextButton === false) {
      setShowPopup(false);
    }
  }, [showPopup, hasNextButton]);

  useOnUnmount(() => {
    /**
     * an ugly fix for an ugly edge case
     * where the popuplayer renders a step
     * with a "next" button on the projectspage
     * if you close the popout and exit the project
     *
     * right now it will show for a split second, and then
     * it will be removed. not the cleanest solution, but this
     * will probably happen pretty rarely, and the popuplayer
     * is scheduled to be replaced by the react dialoglayer
     * sometime in the near future anyways
     */
    setTimeout(() => {
      PopupLayer.instance.hidePopouts();
    }, 10);
  });

  const style = {};
  if (stepWidth) {
    style.width = stepWidth;
  }

  return (
    <div
      ref={ref}
      style={style}
      className={`lesson-item ${isSelected ? 'selected' : ''} ${isComplete ? 'completed' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        setShowPopup(true);
      }}
      dangerouslySetInnerHTML={{ __html: itemContent.innerHTML }}
    />
  );
}

//Scroll to this element
// - assumes the parent is the scroll container
// - leaves a margin of one item (left sibling)
// Returns a promise that resolves once the scrolling animation is done
async function scrollToElement(element) {
  const parent = element.parentElement;
  const parentPos = parent.getBoundingClientRect();

  const itemPosition = element.getBoundingClientRect();

  const scrollPos = itemPosition.left - parentPos.left + parent.scrollLeft;

  let scrollMargin = 0;
  if (element.previousElementSibling) {
    const siblingSize = element.previousElementSibling.getBoundingClientRect();
    scrollMargin = siblingSize.width;
  }

  const newScrollPos = scrollPos - scrollMargin;

  if (element.parentElement.scrollLeft !== newScrollPos) {
    element.parentElement.scrollTo({
      left: newScrollPos,
      behavior: 'smooth'
    });

    await asyncTimeout(500);
  }
}

function asyncTimeout(dur) {
  return new Promise((resolve) => {
    setTimeout(resolve, dur);
  });
}

module.exports = LessonItem;

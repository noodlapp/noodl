const { ipcRenderer } = require('electron');
const { useEffect } = require('react');
const React = require('react');
const PopupLayer = require('../popuplayer');
const LessonItem = require('./LessonItem');
const { EventDispatcher } = require('../../../../shared/utils/EventDispatcher');

require('./LessonLayerView.css');

function LessonLayerView({ steps, currentStepIndex }) {
  if (!steps) return null; //steps are probably still being fetched

  const currentStep = steps && steps[currentStepIndex];

  useEffect(() => {
    //the first step has no item in the bottom bar, it's just a popup. Show it when selected
    const showPopupStep = currentStep && !currentStep.itemContent && currentStep.popupContent;

    if (!showPopupStep) return;

    const popupContainer = document.createElement('div');
    popupContainer.className = 'lesson-item-popup';
    popupContainer.appendChild(currentStep.popupContent);

    let videos = [];

    PopupLayer.instance.showModal({
      content: { el: $(popupContainer) },
      position: 'screen-center',
      onClose() {
        ipcRenderer.send('viewer-show');
        //pause videos, otherwise they run in the background and consume resources
        videos.forEach((video) => {
          video.stop();
        });
      }
    });

    //make sure any videos start playing
    videos = popupContainer.querySelectorAll('video');
    videos.forEach((video) => {
      video.play();
    });

    ipcRenderer.send('viewer-hide');
  }, [currentStep]);

  const errors = steps.filter((step) => step.error).map((step) => step.error);

  let errorMsg = null;
  if (errors.length) {
    errorMsg = (
      <div style={{ padding: '5px', backgroundColor: 'red', color: 'white', fontSize: '14px' }}>
        {errors.map((e, i) => (
          <div key={i} style={{ userSelect: 'text', cursor: 'text' }}>
            {e}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="lesson-bottombar">
      {errorMsg}
      <div className="lesson-steps">
        {steps.map((step, i) => {
          if (!step.itemContent) return null;

          const hasConditions = step.conditions && step.conditions.length ? true : false;

          return (
            <LessonItem
              key={i}
              itemContent={step.itemContent}
              hasNextButton={step.hasNextButton}
              popupContent={step.popupContent}
              isSelected={currentStepIndex === i}
              isComplete={step.isComplete}
              stepWidth={step.width}
              showPopupWhenSelected={hasConditions === false}
              performActions={() => performActions(step.actions)}
            />
          );
        })}
      </div>
      <div className="lesson-layer-progressbar">
        <div
          className="lesson-layer-progressbar-fill"
          style={{ width: calculateProgress(steps, currentStepIndex) * 100 + '%' }}
        />
      </div>
    </div>
  );
}

//For the progress bar we're only concered with items in the bar, not steps that only show a popup and no item.
//Calculate progress by just excluding them
function calculateProgress(steps, currentStepIndex) {
  const progressTotalSteps = steps.filter((step) => (step.itemContent ? true : false)).length;
  let progressCurrentStep = currentStepIndex;

  for (let i = 0; i < currentStepIndex; i++) {
    if (!steps[i].itemContent) {
      progressCurrentStep--;
    }
  }

  return progressCurrentStep / (progressTotalSteps - 1); //Minus one so the last step will result in progress being 1
}

function performActions(actions) {
  if (!actions?.length) return;

  for (const action of actions) {
    performAction(action);
  }
}

function performAction(action) {
  switch (action.action) {
    case 'selectNode':
      EventDispatcher.instance.emit('inspectNodes', {
        nodeIds: [action.nodeId]
      });
      break;
    case 'navigatePreview':
      EventDispatcher.instance.emit('setPreviewRoute', {
        url: action.url
      });
      break;
    case 'selectComponent':
      EventDispatcher.instance.emit('selectComponent', {
        componentName: action.componentName
      });
      break;
  }
}

module.exports = LessonLayerView;

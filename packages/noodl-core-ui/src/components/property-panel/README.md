Components are very basic at the moment, bnut here is the philosophy

- everything is not properly styled yet, and not all components are built, but at least its a start :D
- components are isoloated from rest of design system and are not using any components outside of components/property-panel. this is so that we can bundle them separately for the future editor SDK. maybe this has to be rethought in the future.
- PropertyPanelInput takes a config object and returns the type of input specified
- all components are controlled
- value is sent through value prop, other details are sent with the properties prop
- the typable inputs save the value in a displayedInputValue state to allow for a decoupling of updating the value and showing it. this is done to allow manipulating the value before storing it. storing is done on enter press or blur.

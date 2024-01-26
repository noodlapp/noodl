import '../../editor/src/styles/custom-properties/animations.css';
import '../../editor/src/styles/custom-properties/fonts.css';
import '../../editor/src/styles/custom-properties/colors.css';
import PopupLayer from '../../editor/src/views/popuplayer';
import Viewer from './src/views/viewer';

Viewer.instance = new Viewer();
Viewer.instance.render();
$('body').append(Viewer.instance.el);

//add popup and dialog layers for the right click inspect menu to work
PopupLayer.instance = new PopupLayer();
document.body.appendChild(PopupLayer.instance.render().get(0));

const dialogLayer = document.createElement('div');
dialogLayer.classList.add('dialog-layer');
$('body').append(dialogLayer);

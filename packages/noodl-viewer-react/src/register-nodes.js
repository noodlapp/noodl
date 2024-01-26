// Controls
import Button from './nodes/controls/button.ts';
import CheckBox from './nodes/controls/checkbox.ts';
import Options from './nodes/controls/options.ts';
import RadioButton from './nodes/controls/radiobutton.ts';
import RadioButtonGroup from './nodes/controls/radiobuttongroup.ts';
import Range from './nodes/controls/slider.ts';
import TextInput from './nodes/controls/text-input.ts';
import NavigationStack from './nodes/navigation/navigation-stack.jsx';
import Page from './nodes/navigation/page.js';
import Router from './nodes/navigation/router.tsx';
import ExternalLink from './nodes/std-library/externallink';
import Circle from './nodes/visual/circle.js';
import Columns from './nodes/visual/columns.js';
import CSSDefinition from './nodes/visual/css-definition';
import DragNode from './nodes/visual/drag.js';
import Group from './nodes/visual/group.js';
import Icon from './nodes/visual/icon.js';
import Image from './nodes/visual/image.js';
import TextNode from './nodes/visual/text.js';
import Video from './nodes/visual/video.js';
import './assets/style.css';
//Deprecated
import ButtonOld from './nodes-deprecated/controls/button.jsx';
import CheckBoxOld from './nodes-deprecated/controls/checkbox.jsx';
import FieldSet from './nodes-deprecated/controls/fieldset.jsx';
import Form from './nodes-deprecated/controls/form.jsx';
import Label from './nodes-deprecated/controls/label.jsx';
import OptionsOld from './nodes-deprecated/controls/options.jsx';
import RadioButtonOld from './nodes-deprecated/controls/radiobutton.jsx';
import RangeOld from './nodes-deprecated/controls/range.jsx';
import TextInputOld from './nodes-deprecated/controls/text-input.jsx';

export default function registerNodes(noodlRuntime) {
  [
    // require('./nodes/std-library/counter'), // moved to runtime
    //  require('./nodes/std-library/expression'), // moved to runtime
    //require('./nodes/std-library/condition'),
    //require('./nodes/std-library/and'),
    //require('./nodes/std-library/or'),
    require('./nodes/std-library/switch'),
    //require('./nodes/std-library/booleantostring'), // moved to runtime
    //require('./nodes/std-library/datetostring'),
    //require('./nodes/std-library/stringmapper'),
    //require('./nodes/std-library/inverter'),
    require('./nodes/std-library/timer'),
    require('./nodes/std-library/variables/color'),
    //require('./nodes/std-library/substring'), // moved to runtime
    require('./nodes/std-library/eventsender'),
    require('./nodes/std-library/eventreceiver'),
    require('./nodes/std-library/screenresolution'),
    require('./nodes/std-library/javascript'),
    //require('./nodes/std-library/simplejavascript'), // moved to runtime
    require('./nodes/std-library/numberremapper'),
    require('./nodes/std-library/valuechanged'),
    require('./nodes/std-library/states'),
    //require('./nodes/std-library/stringformat'), // moved to runtime
    require('./nodes/std-library/data/foreach'),
    require('./nodes/std-library/data/foreachactions'),
    require('./nodes/std-library/colorblend'),
    require('./nodes/std-library/animate-to-value'),

    //require('./nodes/std-library/variables/number'), // moved to runtime
    //require('./nodes/std-library/variables/string'),
    //require('./nodes/std-library/variables/boolean'),
    require('./nodes/std-library/variables/color'),

    // Component Object
    require('./nodes/std-library/componentutils/componentobject'),
    require('./nodes/std-library/componentutils/parentcomponentobject'),
    require('./nodes/std-library/componentutils/setcomponentobjectproperties'),
    require('./nodes/std-library/componentutils/setparentcomponentobjectproperties'),

    // Variable
    require('./nodes/std-library/data/variablenode2'),
    require('./nodes/std-library/data/setvariablenode'),

    // New object
    // require('./nodes/std-library/data/modelnode2'), // moved to runtime
    // require('./nodes/std-library/data/setmodelpropertiesnode'),
    // require('./nodes/std-library/data/newmodelnode'),

    // New record
    //require('./nodes/std-library/data/dbmodelnode2'), // moved to runtime
    //require('./nodes/std-library/data/dbcollectionnode2'), // moved to runtime
    // require('./nodes/std-library/data/setdbmodelpropertiesnode'),
    // require('./nodes/std-library/data/deletedbmodelpropertiesnode'),
    // require('./nodes/std-library/data/newdbmodelpropertiesnode'),
    // require('./nodes/std-library/data/dbmodelnode-addrelation'),
    // require('./nodes/std-library/data/dbmodelnode-removerelation'),
    // require('./nodes/std-library/data/filterdbmodelsnode'),

    // New array
    require('./nodes/std-library/data/collectionnode2'),
    require('./nodes/std-library/data/collectionnode-insert'),
    require('./nodes/std-library/data/collectionnode-remove'),
    require('./nodes/std-library/data/collectionnode-clear'),
    require('./nodes/std-library/data/collectionnode-new'),
    require('./nodes/std-library/data/filtercollectionnode'),

    require('./nodes/std-library/data/staticdata'),

    require('./nodes/std-library/data/mapcollectionnode'),
    //require('./nodes/std-library/data/restnode'), // moved to runtime
    require('./nodes/std-library/data/cloudfunction2'),
    //require('./nodes/std-library/uniqueid'), // moved to runtime

    // Files
    require('./nodes/std-library/openfilepicker'),
    require('./nodes/std-library/uploadfile'),
    //require('./nodes/std-library/data/cloudfilenode'), // moved to runtime

    // Navigation
    require('./nodes/navigation/navigate-back'),
    require('./nodes/navigation/navigate-to-path'),
    require('./nodes/navigation/navigate'),
    require('./nodes/navigation/showpopup'),
    require('./nodes/navigation/closepopup'),

    require('./nodes/navigation/page-inputs'),
    require('./nodes/navigation/router-navigate'),

    // User
    require('./nodes/std-library/user/login'),
    require('./nodes/std-library/user/logout'),
    require('./nodes/std-library/user/signup'),
    //require('./nodes/std-library/user/user'), // moved to runtime
    //require('./nodes/std-library/user/setuserproperties'), // moved to runtime
    require('./nodes/std-library/user/verifyemail'),
    require('./nodes/std-library/user/sendemailverification'),
    require('./nodes/std-library/user/resetpassword'),
    require('./nodes/std-library/user/requestpasswordreset'),

    // Deprecated
    require('./nodes/std-library/data/cloudfunction'),
    require('./nodes-deprecated/std-library/componentstate'),
    require('./nodes-deprecated/std-library/parentcomponentstate'),
    require('./nodes-deprecated/std-library/data/modelnode'),
    require('./nodes-deprecated/std-library/data/variablenode'),
    require('./nodes-deprecated/std-library/gyroscope'),
    require('./nodes-deprecated/std-library/globals'),
    require('./nodes-deprecated/std-library/signaltoindex'),
    require('./nodes-deprecated/std-library/numberblend'),
    require('./nodes-deprecated/std-library/stringselector'),
    require('./nodes-deprecated/std-library/animation'),
    require('./nodes-deprecated/std-library/transition'),
    require('./nodes-deprecated/std-library/data/dbmodelnode'),
    require('./nodes-deprecated/std-library/data/dbcollectionnode'),
    require('./nodes-deprecated/std-library/data/collectionnode'),
    require('./nodes-deprecated/std-library/scriptdownloader')
  ].forEach(function (nodeDefinition) {
    noodlRuntime.registerNode(nodeDefinition);
  });

  noodlRuntime.registerNode(CSSDefinition);
  noodlRuntime.registerNode(Group);
  noodlRuntime.registerNode(TextNode);
  noodlRuntime.registerNode(Image);
  noodlRuntime.registerNode(Icon);
  noodlRuntime.registerNode(Circle);
  noodlRuntime.registerNode(Video);
  noodlRuntime.registerNode(DragNode);
  noodlRuntime.registerNode(ExternalLink);
  noodlRuntime.registerNode(Columns);

  // Deprecated UI Controls
  noodlRuntime.registerNode(ButtonOld);
  noodlRuntime.registerNode(CheckBoxOld);
  noodlRuntime.registerNode(RadioButtonOld);
  noodlRuntime.registerNode(OptionsOld);
  noodlRuntime.registerNode(RangeOld);
  noodlRuntime.registerNode(Label);
  noodlRuntime.registerNode(TextInputOld);
  noodlRuntime.registerNode(Form);
  noodlRuntime.registerNode(FieldSet);

  // UI Controls
  noodlRuntime.registerNode(Button);
  noodlRuntime.registerNode(CheckBox);
  noodlRuntime.registerNode(RadioButtonGroup);
  noodlRuntime.registerNode(RadioButton);
  noodlRuntime.registerNode(Options);
  noodlRuntime.registerNode(Range);
  noodlRuntime.registerNode(TextInput);

  // Navigation
  noodlRuntime.registerNode(NavigationStack);
  noodlRuntime.registerNode(Page);
  noodlRuntime.registerNode(Router);
}

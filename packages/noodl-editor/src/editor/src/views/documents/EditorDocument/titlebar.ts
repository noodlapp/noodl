import { WarningsModel } from '@noodl-models/warningsmodel';

export class TitleBar {
  public static instance = new TitleBar();

  warningsComponent: TSFixme;
  warningsAmount: number;
  allWarnings: TSFixme;

  constructor() {
    this.warningsAmount = 0;
    this.allWarnings = [];

    var _this = this;

    // Watch for the project changed on file system and ask user to reload
    /* EventDispatcher.instance.on('ProjectModel.changedOnFileSystem',function() {
      _this.projectChangedOnFileSystem();
    }); */
    WarningsModel.instance.on('warningsChanged', function () {
      if (!_this.warningsComponent) return;

      _this.getWarningsAmount(_this.warningsComponent);
      _this.allWarnings = _this.getAllWarnings();
    });
  }

  getWarningsAmount(c) {
    this.warningsComponent = c;
    var warnings = WarningsModel.instance.getNumberOfWarningsForComponent(c, {
      levels: ['error', 'warning'],
      excludeGlobal: true
    });
    warnings += WarningsModel.instance.getNumberOfWarningsForComponent(undefined, { levels: ['error', 'warning'] }); // Include warnings for the project level
    warnings += WarningsModel.instance.getTotalNumberOfWarningsMatching(
      (key, ref, warning) => warning.warning.showGlobally
    );

    this.warningsAmount = warnings;
  }

  getWarningsForComponent(component?: TSFixme) {
    const warnings = [];
    // Get all warnings for this selector
    WarningsModel.instance.forEachWarningInComponent(
      component,
      (warning) => {
        //don't render conflicts since they're rendered separately
        if (!warning.warning.showGlobally) {
          warnings.push(warning);
        }
      },
      { levels: ['error', 'warning'] }
    );

    return warnings;
  }

  getAllWarnings() {
    if (!this.warningsComponent) return [];

    const projectWideWarnings = this.getWarningsForComponent();

    const componentSpecificWarnings = [];

    WarningsModel.instance.forEachWarning((c, ref, key, warning) => {
      if (warning.warning.showGlobally) {
        componentSpecificWarnings.push(warning);
      }
    });

    const componentWarnings = this.getWarningsForComponent(this.warningsComponent);

    return [...projectWideWarnings, ...componentSpecificWarnings, ...componentWarnings];
  }
}

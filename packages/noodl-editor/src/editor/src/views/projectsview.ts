import { filesystem, platform } from '@noodl/platform';

import { DialogLayerModel } from '@noodl-models/DialogLayerModel';
import { LessonsProjectsModel } from '@noodl-models/LessonsProjectModel';
import { CloudServiceMetadata } from '@noodl-models/projectmodel';
import { setCloudServices } from '@noodl-models/projectmodel.editor';
import { LocalProjectsModel, ProjectItem } from '@noodl-utils/LocalProjectsModel';

import View from '../../../shared/view';
import LessonTemplatesModel from '../models/lessontemplatesmodel';
import TutorialsModel from '../models/tutorialsmodel';
import CloudFormation from '../utils/cloudformation';
import { templateRegistry } from '../utils/forge';
import { tracker } from '../utils/tracker';
import { timeSince } from '../utils/utils';
import { getLessonsState } from './projectsview.lessonstate';
import { ToastLayer } from './ToastLayer/ToastLayer';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ProjectsViewTemplate = require('../templates/projectsview.html');

// Styles
require('../styles/projectsview.css');
require('../styles/projectsview.lessoncards.css');

const _cache = {};

type ProjectItemScope = {
  project: ProjectItem;
  label: string;
  latestAccessedTimeAgo: string;
};

export class ProjectsView extends View {
  _popupLayerElem = null;
  lessonTemplatesModel: LessonTemplatesModel;
  lessonProjectsModel: LessonsProjectsModel;
  projectsModel: LocalProjectsModel;
  tutorialsModel: TutorialsModel;
  from: TSFixme;

  private _backgroundUpdateTimeout: TSFixme;
  private _backgroundUpdateListener: () => void;
  selectedTutorialCategory: TSFixme;
  currentBigFeedItem: TSFixme;
  selectedProjectTemplate: TSFixme;
  projectTemplateLongDesc: TSFixme;
  isRenamingProject: boolean;
  projectFilter: TSFixme;

  constructor({ from }: { from: string }) {
    super();

    this.lessonTemplatesModel = LessonTemplatesModel.instance;
    this.lessonProjectsModel = new LessonsProjectsModel();
    this.projectsModel = LocalProjectsModel.instance;
    this.tutorialsModel = new TutorialsModel();
    this.from = from;

    this.attachBackgroundUpdateListener();
  }

  attachBackgroundUpdateListener() {
    this._backgroundUpdateListener = () => {
      if (!this._backgroundUpdateTimeout) {
        this._backgroundUpdateTimeout = setTimeout(async () => {
          await this.projectsModel.fetch();
          this._backgroundUpdateTimeout = undefined;
        }, 3000);
      }
    };

    document.addEventListener('mousemove', this._backgroundUpdateListener);
  }

  dispose() {
    document.removeEventListener('mousemove', this._backgroundUpdateListener);
    clearTimeout(this._backgroundUpdateTimeout);
    this._backgroundUpdateTimeout = undefined;

    this.projectsModel.off(this);

    this.lessonTemplatesModel.off(this);
    this.lessonProjectsModel.off(this);
  }

  render() {
    this.el = this.bindView($(ProjectsViewTemplate), this);

    this.showSpinner();
    this.projectsModel.fetch().then(() => this.hideSpinner());

    // Lesson items
    // this.renderLessonItems();
    this.lessonTemplatesModel.on(
      ['templatesChanged'],
      () => {
        this.renderTutorialItems();
      },
      this
    );
    this.lessonProjectsModel.on(
      'lessonProgressChanged',
      () => {
        this.renderTutorialItems();
      },
      this
    );

    // Project items
    this.renderProjectItemsPane();

    this.projectsModel.on('myProjectsChanged', () => this.renderProjectItemsPane(), this);

    this.switchPane('projects');

    // this.$('#top-bar').css({ height: this.topBarHeight + 'px' });
    // this.$('#projects-header').css({ top: this.topBarHeight + 'px' });
    this.$('#search').on('keyup', this.onProjectsSearchChanged.bind(this));

    return this.el;
  }

  switchPane(pane) {
    const panes = ['start', 'learn', 'projects'];

    /* if (this.isShowingAdminSettings) {
      this.hideAdminSettings();
    }*/
    panes.forEach((p) => {
      if (pane === p) {
        this.$('#' + p + 'PaneTab').addClass('projects-header-tab-selected');
        this.$('#' + p + 'Pane').show();
      } else {
        this.$('#' + p + 'PaneTab').removeClass('projects-header-tab-selected');
        this.$('#' + p + 'Pane').hide();
      }
    });
  }

  // Start or resume a lesson
  onLessonItemClicked(scope) {
    const _this = this;
    const activityId = 'starting-lesson';

    ToastLayer.showActivity('Starting lesson', activityId);

    this.lessonProjectsModel.loadLessonProject(
      scope.template,
      function (project) {
        ToastLayer.hideActivity(activityId);

        if (!project) {
          ToastLayer.showError("Couldn't load project.");
          return;
        }

        _this.notifyListeners('projectLoaded', project);
      },
      function (progress) {
        ToastLayer.showProgress('Starting lesson', (progress.progress / progress.total) * 100, activityId);
      }
    );
  }
  // Restart a lesson
  onRestartLessonItemClicked(scope, el, evt) {
    const _this = this;
    const activityId = 'restart-lesson';

    ToastLayer.showActivity('Restarting lesson', activityId);

    this.lessonProjectsModel.restartLessonProject(
      scope.template,
      function (project) {
        ToastLayer.hideActivity(activityId);

        if (!project || project.result === 'failure') {
          ToastLayer.showError('Could not restart lesson');
          return;
        }

        _this.notifyListeners('projectLoaded', project);
      },
      function (progress) {
        ToastLayer.showProgress('Restarting lesson', (progress.progress / progress.total) * 100, activityId);
      }
    );

    evt.stopPropagation();
    evt.preventDefault();
  }
  renderProjectItemsPane() {
    const localProjects = this.projectsModel.getProjects();

    this.$('#local-projects').css({ display: localProjects.length ? 'initial' : 'none' });
    this.renderProjectItems({
      items: localProjects,
      appendProjectItemsTo: '.local-projects-items',
      filter: this.projectFilter
    });

    this.$('#no-projects').css({
      display: localProjects.length == 0 ? 'initial' : 'none'
    });

    // Render project template items (basic)
    templateRegistry.list({}).then((templates) => {
      this.$('.projects-create-from-template').html('');
      if (templates) {
        // Sort templates into categories
        const categories = [];
        templates.forEach((t) => {
          let c = categories.find((c) => c.label === t.category);
          if (c === undefined) {
            c = { label: t.category, templates: [] };
            categories.push(c);
          }
          c.templates.push(t);
        });

        categories.forEach((c) => {
          const cel = this.bindView(this.cloneTemplate('projects-template-category'), c);
          this.$('.projects-create-from-template').append(cel);

          c.templates.forEach((i) => {
            if (i.type !== undefined) return; // Only basic types

            const el = this.bindView(this.cloneTemplate('projects-template-item'), i);

            i.iconURL &&
              this._downloadImageAsURI(i.iconURL, function (uri) {
                el.find('.feed-item-image').css('background-image', 'url(' + uri + ')');
              });

            View.$(cel, '.templates').append(el);
          });
        });
      }
    });

    // Always start at lessons
    this.selectedTutorialCategory = 'Lessons';

    // Render tutorials
    this.tutorialsModel.list((items) => {
      this.renderTutorialItems();
    });

    // Create new project popup
    this.$('#create-new-project-from-feed-item-name').on('keyup', () => {
      const val = this.$('#create-new-project-from-feed-item-name').val();
      this.$('#create-new-project-button').prop('disabled', val === undefined || val === '');
    });

    // Import project popup
    this.$('#import-existing-project-name').on('keyup', () => {
      const val = this.$('#import-existing-project-name').val();
      this.$('#import-new-project-button').prop('disabled', val === undefined || val === '');
    });
  }
  _getTutorialCategories() {
    const lessonCategories = this.lessonTemplatesModel.getCategories();
    const tutorialCategories = this.tutorialsModel.getCategories();

    const allCategories = Array.from(new Set(lessonCategories.concat(tutorialCategories)));
    return allCategories;
  }

  renderProjectItems(options: {
    items?: ProjectItem[];
    appendProjectItemsTo?: string;
    filter?: string;
    template?: string;
  }) {
    options = options || {};

    const items = options.items;
    const projectItemsSelector = options.appendProjectItemsTo || '.projects-items';
    const template = options.template || 'projects-item';
    this.$(projectItemsSelector).html('');

    for (const i in items) {
      const label = items[i].name;
      if (options.filter && label.toLowerCase().indexOf(options.filter) === -1) continue;

      const latestAccessed = items[i].latestAccessed || Date.now();

      const scope: ProjectItemScope = {
        project: items[i],
        label: label,
        latestAccessedTimeAgo: timeSince(latestAccessed) + ' ago'
      };

      const el = this.bindView(this.cloneTemplate(template), scope);
      if (items[i].thumbURI) {
        // Set the thumbnail image if there is one
        View.$(el, '.projects-item-thumb').css('background-image', 'url(' + items[i].thumbURI + ')');
      } else {
        // No thumbnail, show cloud download icon
        View.$(el, '.projects-item-cloud-download').show();
      }

      this.$(projectItemsSelector).append(el);
    }
  }

  renderTutorialItems() {
    // Render categories
    const categories = this._getTutorialCategories();

    this.$('.tutorial-categories').html('');

    if (categories.length > 1) {
      for (const category of categories) {
        const el = this.bindView(this.cloneTemplate('tutorial-category-item'), {
          name: category,
          selected: this.selectedTutorialCategory === category
        });

        this.$('.tutorial-categories').append(el);
      }
    }

    const lessons = this.lessonTemplatesModel
      .getTemplates()
      .filter((lesson) => lesson.category === this.selectedTutorialCategory);

    const categoryHasLessons = lessons.length > 0;

    this.$('.tutorial-items').html('');
    if (categoryHasLessons) {
      this.$('#lesson-items-scroll-controls-left').attr('class', 'disabled');
      this.$('#lesson-items-scroll-controls-right').attr('class', '');
      this.$('.tutorial-items')
        .off('scroll')
        .on('scroll', (e) => {
          this.$('#lesson-items-scroll-controls-left').attr('class', e.target.scrollLeft > 0 ? '' : 'disabled');
          const canScrollRight = e.target.scrollLeft + e.target.clientWidth < e.target.scrollWidth;
          this.$('#lesson-items-scroll-controls-right').attr('class', canScrollRight ? '' : 'disabled');
        });
    }

    this.$('.lesson-items-scroll-controls').css('display', categoryHasLessons ? 'flex' : 'none');

    if (categoryHasLessons) {
      this.$('.tutorial-items').addClass('with-lessons');
    } else {
      this.$('.tutorial-items').removeClass('with-lessons');
    }

    //start by adding lessons, then tutorial cards
    //1. lessons
    const lessonProgress = lessons.map(
      (l) => this.lessonProjectsModel.getLessonProjectProgress(l.name) || { index: 0, end: 0 }
    );

    const lessonStates = getLessonsState(lessonProgress);

    lessons.forEach((lesson, index) => {
      const state = lessonStates[index];

      let buttonText = 'Start lesson';
      if (state.name === 'in-progress') {
        buttonText = 'Continue lesson';
      } else if (state.name === 'completed') {
        buttonText = 'Open lesson';
      }

      const el = this.bindView(this.cloneTemplate('tutorial-lesson-item'), {
        template: lesson,
        showRestart: state.progressPercent > 0,
        buttonText,
        completionText: state.progressPercent + '%',
        completed: state.name === 'completed',
        isFeatureHighlight: lesson?.type === 'highlight'
      });

      el.addClass(state.name);
      if (state.isNextUp) {
        el.addClass('next-up');
      }

      const imageUrl = this.tutorialsModel.absoluteUrl(lesson.thumb);
      el.find('.projects-tutorial-item-thumb').attr('srcset', imageUrl + ' 2x');

      const badgeUrl = this.tutorialsModel.absoluteUrl(lesson.completionBadge);
      el.find('.projects-lesson-item-badge').attr('srcset', badgeUrl + ' 2x');

      el.find('.progress').css({ width: state.progressPercent + '%' });
      this.$('.tutorial-items').append(el);
    });

    const tutorials = this.tutorialsModel.tutorials.filter((t) => t.category === this.selectedTutorialCategory);

    //2. tutorial cards
    for (const item of tutorials) {
      const el = this.bindView(this.cloneTemplate('tutorial-item'), item);
      const imageUrl = this.tutorialsModel.absoluteUrl(item.thumb);
      el.find('.projects-tutorial-item-thumb').attr('srcset', imageUrl + ' 2x');
      this.$('.tutorial-items').append(el);
    }
  }
  _getLessonScrollState() {
    const parentRect = this.$('.tutorial-items').get(0).getBoundingClientRect();

    const lessonDivs: HTMLDivElement[] = Array.from(this.$('.tutorial-items').get(0).children);
    const rects = lessonDivs.map((child) => child.getBoundingClientRect());

    const scrollIndex = Math.max(
      0,
      rects.findIndex(({ left }) => left >= parentRect.left)
    );

    const itemSize = rects[0].width + 10;
    const itemsPerPage = Math.floor(parentRect.width / itemSize);

    return {
      scrollIndex,
      itemsPerPage,
      lessonDivs
    };
  }
  onLessonsScrollLeftClicked() {
    const { scrollIndex, itemsPerPage, lessonDivs } = this._getLessonScrollState();
    const targetIndex = Math.max(0, scrollIndex - itemsPerPage);

    lessonDivs[targetIndex].scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'start'
    });
  }
  onLessonsScrollRightClicked() {
    const { scrollIndex, itemsPerPage, lessonDivs } = this._getLessonScrollState();
    const targetIndex = Math.min(lessonDivs.length - 1, Math.max(0, scrollIndex + itemsPerPage));

    lessonDivs[targetIndex].scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'start'
    });
  }

  onTutorialCategoryClicked(scope) {
    this.selectedTutorialCategory = scope.name;
    this.renderTutorialItems();
  }
  onTutorialItemClicked(scope) {
    tracker.track('Tutorial Card Clicked', {
      label: scope.label,
      url: scope.url
    });
    platform.openExternal(this.tutorialsModel.absoluteUrl(scope.url));
  }
  _downloadImageAsURI(url, callback) {
    if (_cache[url]) {
      if (_cache[url].isCompleted) return callback(_cache[url].uri);
      else return _cache[url].waiting.push(callback);
    }

    _cache[url] = {
      waiting: [callback]
    };

    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.setRequestHeader('Accept', 'image/*');
    xhr.responseType = 'blob';
    xhr.onload = function (e) {
      _cache[url].isCompleted = true;

      if (this.status === 200) {
        _cache[url].uri = URL.createObjectURL(this.response);
        _cache[url].waiting.forEach((c) => c(_cache[url].uri));
      } else _cache[url].waiting.forEach((c) => c());
    };
    xhr.onerror = function () {
      callback();
    };
    xhr.responseType = 'blob';
    xhr.send();
  }
  _downloadVideoAsURI(url, callback) {
    if (_cache[url]) {
      if (_cache[url].isCompleted) return callback(_cache[url].uri);
      else return _cache[url].waiting.push(callback);
    }

    _cache[url] = {
      waiting: [callback]
    };

    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.setRequestHeader('Accept', 'video/*');
    xhr.responseType = 'blob';
    xhr.onload = function (e) {
      _cache[url].isCompleted = true;

      if (this.status === 200) {
        _cache[url].uri = URL.createObjectURL(this.response);
        _cache[url].waiting.forEach((c) => c(_cache[url].uri));
      } else _cache[url].waiting.forEach((c) => c());
    };
    xhr.onerror = function () {
      callback();
    };
    xhr.responseType = 'blob';
    xhr.send();
  }

  onExitBigFeedItemClicked(scope) {
    this.$('#start-pane-feed-big').hide();
  }

  onCreateNewProjectClicked() {
    this.$('.projects-create-new-project').show();
    //enable scrolling on the entire parent pane so the templates can be scrolled
    //TODO: clean this up so no JS is required to scroll
    this.$('#projectsPane').css({ overflowY: 'auto' });

    this.$('.projects-list').hide();
  }

  onBackToProjectsListClicked() {
    this.$('.projects-create-new-project').hide();
    this.$('.projects-import-existing-project').hide();
    this.$('.projects-list').show();
    this.$('#projectsPane').css({ overflowY: '' });
  }

  async onImportExistingProjectClicked() {
    const direntry = await filesystem.openDialog({
      allowCreateDirectory: false
    });

    if (!direntry) return;

    const activityId = 'opening-project';

    ToastLayer.showActivity('Opening project', activityId);

    try {
      const project = await this.projectsModel.openProjectFromFolder(direntry);

      if (!project.name) {
        project.name = filesystem.basename(direntry);
      }

      this.notifyListeners('projectLoaded', project);
    } catch (e) {
      ToastLayer.showError('Could not open project');
    } finally {
      ToastLayer.hideActivity(activityId);
    }
  }

  onRenameProjectClicked(scope: ProjectItemScope, el, evt) {
    const input = el.parents('.projects-item').find('#project-name-input');
    const container = el.parents('.projects-item').find('#project-name');

    input.val(scope.label);
    container.show();

    this.isRenamingProject = true;

    input.off('blur').on('blur', () => {
      container.hide();

      //hack to make sure this isn't set to false before the click event
      //on the project item has had a chance to see this flag (blur comes before click)
      setTimeout(() => {
        this.isRenamingProject = false;
      }, 100);

      const newName = input.val();
      if (newName !== scope.label) {
        this.projectsModel.renameProject(scope.project.id, input.val());
      }
    });

    input.off('keyup').on('keyup', (e) => {
      if (e.keyCode === 13) {
        input.blur();
      }
    });

    input.off('click').on('click', (e) => {
      e.stopPropagation();
    });

    input.focus();

    evt.stopPropagation();
  }

  onProjectsSearchChanged() {
    const filter = this.$('#search').val();
    this.projectFilter = filter === '' ? undefined : filter.toLowerCase();
    this.renderProjectItemsPane();
  }

  // Launch a project from the recent list
  async onProjectItemClicked(scope: ProjectItemScope, el) {
    if (this.isRenamingProject) {
      const input = el.find('#project-name-input');
      input.blur();
      return;
    }

    const activityId = 'opening-project';

    ToastLayer.showActivity('Opening project', activityId);

    const project = await this.projectsModel.loadProject(scope.project);
    ToastLayer.hideActivity(activityId);

    if (!project) {
      ToastLayer.showError("Couldn't load project.");
      return;
    }

    this.notifyListeners('projectLoaded', project);
  }

  onDeleteProjectClicked(scope: ProjectItemScope, el, evt) {
    evt.stopPropagation();

    DialogLayerModel.instance.showConfirm({
      title: 'Remove project ' + scope.project.name + '?',
      text: 'Do you want to remove the project from the list? Note that the project folder is still left intact, and can be opened again',
      onConfirm: () => this.projectsModel.removeProject(scope.project.id)
    });
  }

  // Import a project from a URL
  importFromUrl(uri) {
    // Extract and remove query from url
    const query = {} as any;
    if (uri.indexOf('?') !== -1) {
      // Has query string
      const queryStr = uri.split('?')[1];
      queryStr.split('&').forEach((pair) => {
        pair = pair.split('=');
        query[pair[0]] = pair[1];
      });

      uri = uri.substring(0, uri.indexOf('?'));
    }

    const iconURL = query.thumb;
    const defaultProjectName = query.name !== undefined ? decodeURIComponent(query.name) : '';

    this.currentBigFeedItem = {
      projectURL: uri,
      useCloudServices: query.cf !== undefined,
      cloudServicesTemplateURL: query.cf !== undefined ? decodeURIComponent(query.cf) : undefined,
      title: defaultProjectName
    };
    this.projectTemplateLongDesc = '';

    if (iconURL !== undefined)
      this._downloadImageAsURI(decodeURIComponent(iconURL), (uri) => {
        this.$('#start-pane-feed-item-big-image').css('background-image', 'url(' + uri + ')');
      });

    this.$('#create-new-project-button').prop(
      'disabled',
      defaultProjectName === undefined || defaultProjectName === ''
    );
    this.$('#create-new-project-from-feed-item-name').val(defaultProjectName || '');
    this.$('#start-pane-feed-item-big-content').hide();
    this.$('#start-pane-feed-item-big-create-new-project').show();

    this.$('#start-pane-feed-big').show();
  }

  onSelectTemplateClicked(scope) {
    const _this = this;
    //this.selectedProjectTemplate = scope;
    this.currentBigFeedItem = scope;
    this.projectTemplateLongDesc = scope.desc;

    this._downloadImageAsURI(scope.iconURL, function (uri) {
      _this.$('#start-pane-feed-item-big-image').css('background-image', 'url(' + uri + ')');
    });

    // this._setupCloudServicesSelection(scope);
    this.$('#create-new-project-from-feed-item-name').val(scope.defaultProjectName || '');
    this.$('#start-pane-feed-item-big-content').hide();
    this.$('#start-pane-feed-item-big-create-new-project').show();

    this.$('#create-new-project-button').prop(
      'disabled',
      scope.defaultProjectName === undefined || scope.defaultProjectName === ''
    );
    this.$('#start-pane-feed-big').show();

    this.$('#create-new-project-from-feed-item-name').focus();
  }

  async onNewProjectFromSampleClicked() {
    const projectTemplate = this.currentBigFeedItem;
    if (!projectTemplate) return;
    if (!projectTemplate.projectURL) return;

    let direntry;

    try {
      direntry = await filesystem.openDialog({
        allowCreateDirectory: true
      });
    } catch (e) {
      return;
    }
    const activityId = 'creating-project';
    ToastLayer.showActivity('Creating new project', activityId);

    const name = this.$('#create-new-project-from-feed-item-name').val() || 'Untitled';

    const path = filesystem.makeUniquePath(filesystem.join(direntry, name));

    const options = {
      name,
      path,
      projectTemplate: projectTemplate.projectURL
    };

    async function _prepareCloudServices(): Promise<CloudServiceMetadata> {
      const cloudServices = {
        name: projectTemplate.title + ' cloud services',
        desc: 'Cloud services created for the ' + projectTemplate.title + ' project template'
      };

      const cf = new CloudFormation();

      return new Promise((resolve, reject) => {
        cf.setup({
          templateUrl: projectTemplate.cloudServicesTemplateURL,
          cloudServices: cloudServices,
          success: resolve,
          error: reject
        });
      });
    }

    this.projectsModel.newProject(async (project) => {
      if (!project) {
        ToastLayer.hideActivity(activityId);
        ToastLayer.showError('Could not create new project.');
        this.$('#start-pane-feed-item-big-create-new-project').hide();
        this.$('#start-pane-feed-big').hide();
        return;
      }

      // Project is create, now setup cloud services
      if (projectTemplate.useCloudServices) {
        try {
          // Refresh the cloud services acccess token so it's ready for the cloud formation
          const cloudServices = await _prepareCloudServices();
          ToastLayer.hideActivity(activityId);
          if (projectTemplate.useCloudServices && cloudServices === undefined) {
            ToastLayer.showError('Failed to setup cloud services.');
            return;
          }

          setCloudServices(project, cloudServices);
          this.notifyListeners('projectLoaded', project);
        } catch (e) {
          ToastLayer.hideActivity(activityId);
          ToastLayer.showError('Failed to create cloud services for project.');
        }
      }

      ToastLayer.hideActivity(activityId);

      tracker.track('Create New Project', {
        templateLabel: projectTemplate.title,
        templateUrl: projectTemplate.projectURL
      });

      this.notifyListeners('projectLoaded', project);
    }, options);
  }

  showSpinner() {
    if (!this.el) return;

    this.$('.page-spinner').show();
  }

  hideSpinner() {
    if (!this.el) return;

    this.$('.page-spinner').hide();
  }
}

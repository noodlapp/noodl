import { IconName } from '@noodl-core-ui/components/common/Icon';

export enum PopupItemType {
  Visual = 'is-visual',
  Data = 'is-data',
  Custom = 'is-custom'
}

export type CommandMetadata = {
  title: string;
  tag: string;
  description: string;
  placeholder: string;
  type: PopupItemType;
  icon: IconName;
  examples: string[];
  availableOnFrontend: boolean;
  availableOnBackend: boolean;
  requireGPT4: boolean;
};

type CopilotCommandMetadata = CommandMetadata & {
  templateId: string;
};

export const promptToNodeCommands: CommandMetadata[] = [
  {
    title: '/UI',
    tag: 'UI Prompt',
    description: 'Create UI elements from a text prompt',
    placeholder: 'What should it be?',
    type: PopupItemType.Visual,
    icon: IconName.UI,
    availableOnFrontend: true,
    availableOnBackend: false,
    requireGPT4: true,
    examples: [
      'A login form',
      'A dropdown with values 1 to 10',
      'Landing page of a car rental company'
      // 'A vertical list with five popular car brands. Each list item should have the brand name, most popular vechicle name and type, and a button that says "view". The items should use a horizontal layout.',
      // 'Pokemon card creator form',
      // 'A group that contains two columns. First column has the text "Left column" and the other column the text "Right column". Left column is twice the size of the right one.'
    ]
  },
  {
    title: '/Image',
    tag: 'Image Prompt',
    description: 'Create an image with DALL·E 2',
    placeholder: 'How should it look?',
    type: PopupItemType.Visual,
    icon: IconName.Image,
    availableOnFrontend: true,
    availableOnBackend: false,
    requireGPT4: true,
    examples: [
      'A big, steaming bowl of noodles',
      'Four kittens with cool sunshades',
      'The worlds fastest car on holiday'
    ]
  }
];

export const copilotNodeInstaPromptable = ['/function', '/read from database', '/write to database'];
export const copilotNodeCommands: CopilotCommandMetadata[] = [
  {
    requireGPT4: false,
    templateId: 'function',
    title: '/Function',
    tag: 'Function',
    description: 'Create custom JavaScript function from a text prompt',
    placeholder: 'What should it do?',
    type: PopupItemType.Custom,
    icon: IconName.Code,
    availableOnFrontend: true,
    availableOnBackend: true,
    examples: [
      'Create inputs for Array1 and Array2 and output all items with the same ID',
      'Get a random number between the min and max inputs',
      'Get the current location of the device'
    ]
  },
  {
    requireGPT4: true,
    templateId: 'function-query-database',
    title: '/Read from database',
    tag: 'Read from database',
    description: 'This will create a node that queries the database and returns the results',
    placeholder: 'What data you want?',
    type: PopupItemType.Data,
    icon: IconName.CloudDownload,
    availableOnFrontend: true,
    availableOnBackend: true,
    examples: [
      'Get all users that belong to the "Vendor" group',
      'Get all products, sort from lowest to highest price',
      'Get all unread messages for the currently logged in user'
    ]
  },
  // {
  //   templateId: 'rest',
  //   title: '/REST API',
  //   tag: 'REST',
  //   description: 'Connects to an external REST API via an HTTP from a text prompt',
  //   placeholder: 'Where and what do you want to get?',
  //   type: PopupItemType.Data,
  //   icon: IconName.RestApi,
  //   examples: [
  //     'Get the current weather at the inputs "Lat" and "Lon" from OpenWeather API',
  //     'POST Inputs.Message to the "/messages" endpoint of Inputs.APIBasePath'
  //   ]
  // },
  {
    requireGPT4: true,
    templateId: 'function-crud',
    title: '/Write to database',
    tag: 'Write to database',
    description: 'Create, read, update or delete records in the database',
    placeholder: 'What should be edited in the database?',
    type: PopupItemType.Data,
    icon: IconName.CloudUpload,
    availableOnFrontend: true,
    availableOnBackend: true,
    examples: ['Get an array of numbers, calculate the average, and save that to the current users score attribute']
  }
];

export const comingSoonCommands: CommandMetadata[] = [
  {
    requireGPT4: true,
    // templateId: 'chart',
    title: '/Chart',
    tag: 'Chart Prompt',
    description: 'Generate a chart that can display data',
    placeholder: '',
    type: PopupItemType.Visual,
    icon: IconName.Question,
    availableOnFrontend: true,
    availableOnBackend: false,
    examples: []
  },
  {
    title: '/Suggest',
    requireGPT4: true,
    tag: 'Suggest Prompt',
    description: 'Get suggestions',
    placeholder: 'What to get suggestions for',
    type: PopupItemType.Visual,
    icon: IconName.Question,
    availableOnFrontend: true,
    availableOnBackend: false,
    examples: ['What feature should I add next?', 'How can the form be improved?']
  }
];

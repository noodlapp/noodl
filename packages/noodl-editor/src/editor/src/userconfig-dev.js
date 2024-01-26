module.exports = {
  importLocalProject: true,
  deployToFolder: true,
  git: true,
  previewWithApp: true,
  lessons: [
    {
      name: 'com-noodlapp-gettingstarted',
      url: './external/lessons/gettingstarted.zip',
      label: 'Getting started',
      thumbURL: 'gettingstarted-thumb.png'
    },
    {
      name: 'com-noodlapp-data1',
      url: './external/lessons/data1.zip',
      label: 'Working with data',
      thumbURL: 'data1-thumb.png'
    },
    {
      name: 'com-noodlapp-layouting',
      url: './external/lessons/layouting.zip',
      label: 'Layouting',
      thumbURL: 'layouting-thumb.png'
    },
    {
      name: 'com-noodlapp-models',
      url: './external/lessons/models.zip',
      label: 'Models',
      thumbURL: 'models-thumb.png'
    },
    {
      name: 'com-noodlapp-collections',
      url: './external/lessons/collections.zip',
      label: 'Collections',
      thumbURL: 'collections-thumb.png'
    },
    {
      name: 'com-noodlapp-messaging',
      url: './external/lessons/messaging.zip',
      label: 'Events and messaging',
      thumbURL: 'messaging-thumb.png'
    },
    {
      name: 'com-noodlapp-navigation',
      url: './external/lessons/navigation.zip',
      label: 'Navigation Part 1',
      thumbURL: 'navigation-thumb.png'
    },
    {
      name: 'com-noodlapp-navigation2',
      url: './external/lessons/navigation2.zip',
      label: 'Navigation Part 2',
      thumbURL: 'navigation2-thumb.png'
    },
    {
      name: 'com-noodlapp-drag2',
      url: './external/lessons/drag2.zip',
      label: 'Drag',
      thumbURL: 'drag2-thumb.png'
    }
  ],
  library: [
    {
      name: 'uikit-0.5',
      url: './external/library/uikit.zip',
      label: 'UI Kit',
      desc: 'A collection of UI components that make it quick and easy to prototype great looking app UIs.'
    },
    {
      name: 'date-and-time-0.1',
      url: './external/library/date-and-time.zip',
      label: 'Date and time Kit',
      desc: 'Contains components that help you work with time and dates.'
    },
    {
      name: 'awsiot-0.3.3',
      url: './external/library/awsiot/dist/awsiot-0.3.2.zip',
      label: 'AWS IoT',
      desc: 'A module that enables connecting to the AWS IoT cloud services, as well as user management through AWS Cognito and calling AWS Lambda functions.'
    },
    {
      name: 'nfc-0.1.0',
      url: './external/library/nfc/dist/nfc-0.1.0.zip',
      label: 'NFC',
      desc: 'A module that enables connecting with NFC tags. The module only works when running in the Noodl Shell app.'
    }
  ],
  feed: [
    {
      imageURL: './external/feed/sl/big.png',
      title: 'Designing data driven user experiences',
      body: 'Noodl is a platform for data driven experience design. With it, designers and developers can quickly prototype data driven experiences built on real or mock data, cloud services and connected devices. Lead times for doing design experiements, that can be tested in live scenarios, can be drastically reduced. Read how Stockholm Transit, SL, with over 800 000 passengers daily used Noodl to iterate user experiences in the subway. You can find the post <a target="_blank" href="http://www.topp.se/project/stockholm-public-transportation">here</a>.',
      bigImageURL: './external/feed/sl/big.png'
    },
    {
      imageURL: './external/feed/autodata/big.png',
      title: 'Designing automotive experiences with real data',
      body: 'Most products collect vast amounts of data, some even in real-time, such as in automotive. It is a challenge for designers and developers to figure out how to best use this data to solve problems for the driver.  Check out this post for inspiration of how Noodl was used to design an experimental dashboard experience for Ford using previously recorded vehicle data. You can find the post <a target="_blank" href="http://www.topp.se/blog/2015/11/5/exploring-the-future-of-automotive">here</a>.',
      bigImageURL: './external/feed/autodata/big.png'
    },
    {
      imageURL: './external/feed/ikea/big.png',
      title: 'Making IKEAs night light smart',
      body: 'On top of the Noodl platform we can build tailored prototyping environments for connected products and services. As an example we built an environment for prototyping a smart product based on one of IKEAs night lights, with it we prototyped a number of digital services that can add user value to the original product. If you need some inspiration to get you started with a fun project, take a look at the post <a target="_blank" href="http://www.topp.se/blog/2016/5/19/hacking-ikea-night-light">here</a>.',
      bigImageURL: './external/feed/ikea/big.png'
    },
    {
      imageURL: './external/feed/tv/big.png',
      title: 'Prototyping cross device experiences',
      body: 'Connected application experiences flow seamlessly and in real-time across many screens and interaction points; phones, watches, tablets, web and voice interactions. Noodl makes it easy to create distributed experiences that work together coherently with built in support for common patters for connected applications, such as topic based messaging. Check out this <a target="_blank" href="http://www.topp.se/blog/2015/11/12/shared-tv-experience">post</a> for inspiration of how this can be used for future shared TV experiences.',
      bigImageURL: './external/feed/tv/big.png'
    },
    {
      imageURL: './external/feed/physdig/big.png',
      title: 'Physical and digital prototyping',
      body: 'Smart connected products and services are fundamentally different than traditional products and apps. It’s difficult to point at a single object and say, “That’s a connected product!”. Instead, what we find is a system of connected objects, cloud components and data that together becomes a user experience. Noodl makes it easy to design experiences where objects become part of your screen experiences. Check out <a target="_blank" href="http://www.topp.se/blog/connectivity-and-data">this post</a> for more inspiration.',
      bigImageURL: './external/feed/physdig/big.png'
    },
    {
      imageURL: './external/feed/voice/big.jpg',
      title: 'Voice interactions',
      body: 'Interacting with ever listening objects and apps using nothing but your voice is an emerging pattern for many connected consumer applications. There are tons of different ways to use these techniques in your products and services, and how to you most effectively provide visual feedback to the user during speach interaction. Check out <a target="_blank" href="http://www.topp.se/blog/2015/8/17/what-we-talk-about-when-we-talk-about-patterns">this post</a> for more inspiration.',
      bigImageURL: './external/feed/voice/big.jpg'
    },
    {
      imageURL: './external/feed/clock/clock-small.jpg',
      title: 'Smart watch incoming call',
      body: 'Will smart watches become one of our main interaction points for services in the future? For inspiration how Noodl was used to create and explore new experiences for one of the largest smart watch manufacturers in the world, check out <a target="_blank" href="http://www.topp.se/blog/2015/5/6/what-will-make-smart-watches-tick">this post</a>. Also explore an incoming call scenario on a smart watch. <a class="clone-project-template">Download the project</a>.',
      projectURL: './external/feed/clock/clock.zip',
      bigImageURL: './external/feed/clock/clock-large.gif'
    },
    {
      imageURL: './external/feed/swipelist/swipe-list-thumb.png',
      title: 'Master/detail and swipe patterns',
      body: 'A very common pattern for interacting with data is the master/detail and swipe patterns. This neat example show how to create a list with tappable items that bring up a detail view with a consistent transition. Also swiping to remove an item is a common pattern for deleting data.This can easily be extended to support swiping left and right to, for instance, tagging or removing items. Each item can also be clicked to show a details screen. <a class="clone-project-template">Download</a> the project into an empty folder.',
      projectURL: './external/feed/swipelist/swipe-list.zip'
    },
    {
      imageURL: './external/feed/news/news-thumb.png',
      title: 'Paged content',
      body: 'A common pattern for orginising information is paged content. This example will show you how to use scroll views and how to use the scrolling to offset other elements such as images to create parallax effects. Give this project a whirl and you will be amazed at the flexibility of what you can do! <a class="clone-project-template">Download</a> the project into an empty folder.',
      projectURL: './external/feed/news/news.zip'
    },
    {
      imageURL: './external/feed/snippets/snippets-thumb.png',
      title: 'Snippets',
      body: 'A collection of tips and tricks on how to build various UI components and design patterns. <a class="clone-project-template">Download</a> the project into an empty folder.',
      projectURL: './external/feed/snippets/snippets.zip'
    }
  ]
};

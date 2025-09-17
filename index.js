import { NavigationWrapper } from './NavigationWrapper.js';
import { LazyLoadPlugin } from './LazyLoading.js';
import EventBus from './EventBus.js';

// Multi-level nav data structure for navigation item behaviour as another plugin for NavigationWrapper
const navData = [
    { label: 'Home', href: '/' },
    { label: 'About', children: [
        { label: 'Team', href: '/team' },
        { label: 'Company', children: [
            { label: 'History', href: '/company/history' },
            { label: 'Career', href: '/company/Career' }
        ]}
    ]},
    { label: 'Services', children: [
        { label: 'Web Development', href: '/web' },
        { label: 'App Development', href: '/app' }
    ]},
    { label: 'Contact', href: '/contact' }
];


// Initialize plugins
const lazyLoadPlugin = new LazyLoadPlugin({ type: 'observer'});

// Initialize NavigationWrapper
const wrapperContainer= new NavigationWrapper({
    containerId: 'navContainer',
    plugins: [
        lazyLoadPlugin
    ],
    height: '5vh',
    bgColor: '#ffffff',
    eventBus: new EventBus() // optional, can omit
});

// default event bus
wrapperContainer.onEvent("plugin:loaded", (name) => {
    console.log("Loaded:", name);
  });

// External listener for custom event bus
// customBus.on("dropdown:open", (item) => {
//     console.log("External system caught dropdown open:", item);
//   });
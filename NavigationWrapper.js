import EventBus from './EventBus.js';

export class NavigationWrapper{
    // #eventBus; // private event-bus instance
    constructor({ 
        containerId, 
        plugins = [], 
        height = '10vh', 
        bgColor = '#ffffff', 
        theme = {},
        eventBus= null,
    }) {
        this.container = document.getElementById(containerId);
        this.plugins = plugins;
        this.height = height;
        this.bgColor = bgColor;
        this.theme = theme;
        this.navElement = null;
        this.renderedPlugins = [];
        this.mode = window.innerWidth <= 768 ? 'click' : 'hover';

        // Event bus with an optional external instance of custom EventBus
        this.eventBus = eventBus instanceof EventBus? eventBus : new EventBus();

        // Bind methods centrally
        this._bindMethods();

        this.render();

        // Responsive mode change
        window.addEventListener('resize', this._handleResize);
    }

    /*
        Every method that needs binding is listed in one place.
        If you rename/remove a method but forget to update the list, you get a warning.
    */
    _bindMethods() {
        const methods = [
            "render",
            "destroy",
            "filterNavItems",
            "emitEvent",
            "offEvent",
            "onEvent",
        ];
        
        methods.forEach(m => {
            if (typeof this[m] === "function") {
                this[m] = this[m].bind(this);
            } else {
                console.warn(`[Binding Warning] Method "${m}" is missing in ${this.constructor.name}`);
            }
        });
    }
    _handleResize() {
        this.mode = window.innerWidth <= 768 ? 'click' : 'hover';
    }

    /*
        Filter nav items across all plugins that implement a filter method
    */
    filterNavItems(query) {
        this.renderedPlugins.forEach(plugin => plugin.filter && plugin.filter(query));
    }

    /*
        Event bus passthrough
    */
    emitEvent(event, payload) {
        this.eventBus.emit(event, payload);
    }

    onEvent(event, callback) {
        this.eventBus.on(event, callback);
    }

    offEvent(event, callback) {
        this.eventBus.off(event, callback);
    } 

    #handlePlugin(plugin){
        // assign this class as wrapper for the plugin
        plugin.wrapper= this;
        this.#initPlugin(plugin);
        this.#renderPlugin(plugin);
    }
    
    #renderPlugin(plugin){
        if(typeof plugin.render === 'function'){   
            const el = plugin.render();
            if (el) {
                this.renderedPlugins.push(plugin);   
                this.navElement.appendChild(el);
            }
        }
    }

    #initPlugin(plugin){ 
        // initialize plugin if init method exists
        if (typeof plugin.init === 'function') {
           plugin.init(this);
        }
    }

    #setInitialAria(navEl){
        if(!navEl) return;
        navEl.setAttribute('role','navigation');
        navEl.setAttribute('aria-label','Main navigation');
    }

    // Set default styles for the nav element
    #setDefaultStyles(nav){
        Object.assign(nav.style,{
            display: 'flex',
            alignItems: 'center',
            height: this.height,
            backgroundColor: this.bgColor||'#ffffff',
            position: 'relative',
            padding: '0',
            boxShadow:'0 2px 5px rgba(0,0,0,0.1)',
            zIndex:10
        });
    }
    // clean up
    destroy() {
        this.renderedPlugins.forEach(plugin => plugin.destroy && plugin.destroy());
        this.eventBus.clear();
        this.container.innerHTML = '';
    }

    // Render the navigation bar and initialize plugins
    render(){
        const nav = document.createElement('nav');
        this.#setDefaultStyles(nav);
        this.#setInitialAria(nav);
        this.navElement= nav;
        this.plugins.forEach(plugin=> this.#handlePlugin(plugin));
        if(this.container){
            this.container.appendChild(nav);    
        } else {
            console.warn('Container not found for NavigationWrapper');
        }
    }
}
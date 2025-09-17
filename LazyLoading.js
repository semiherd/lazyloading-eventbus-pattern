export class LazyLoadPlugin {
    /**
     * @param {string} type - "scroll" => scroll-event-listenet (default) or "observer" => intersection observer api
     * @param {object} options - configuration
     *   options.offset -> default offset for wrappers (0 = strict visibility)
     *   options.wrapperOffsets -> per-wrapper default offsets, e.g., { wrapper1: 200 }
     *   options.debug -> boolean, show debug overlay on images
     *   options.showDistance -> boolean, show distance label in debug mode
    */
    constructor({type = 'scroll', options = {}}) {
      this.type = type;
      this.defaultOffset = options.offset || 0; 
      this.wrapperOffsets = options.wrapperOffsets || {};
      this.debug = options.debug || false;
      this.showDistance = options.showDistance || false; 
      this.wrappers = {};
      this.scrollListenerAdded = false;
      this.onScroll = this.onScroll.bind(this);
    }
  
    init(wrapper, wrapperId) {
      const offset = this.wrapperOffsets[wrapperId] ?? this.defaultOffset;

      const wrapperData = {
        wrapper,
        images: [],
        offset,
        observer: null,
        labels: []
      };
  
      this.wrappers.wrapper= wrapperData;
  
      wrapper.onEvent('render', () => {
        this.observeImages(wrapperData);
  
        if (this.debug) this.setupDebug(wrapperData);
  
        if (this.type === 'observer' && window.IntersectionObserver) {
          this.#setupObserver(wrapperData);
        } else if(this.type === 'scroll') {
          this.#setupScroll();
        }else return; //'LazyLoadPlugin: Unknown type, use "scroll" or "observer"'
      });
    }
  
    observeImages(wrapperData) {
        if(wrapperData?.wrapper?.navElement){
            const imgs = wrapperData.wrapper.navElement.querySelectorAll('img[data-src]');
            if(!imgs.length) return;
            wrapperData.images = Array.from(imgs);
        }else return;
    }
  
    // Debug mode
    setupDebug(wrapperData) {
      wrapperData.images.forEach(img => {
        img.style.outline = '2px dashed tomato';
        img.style.position = 'relative';
        img.style.transition = 'outline-color 0.2s';
        if (this.showDistance) {
          const label = document.createElement('span');
          label.style.position = 'absolute';
          label.style.top = '0';
          label.style.left = '0';
          label.style.background = 'rgba(0,0,0,0.5)';
          label.style.color = 'white';
          label.style.fontSize = '12px';
          label.style.padding = '1px 3px';
          label.style.zIndex = '1000';
          label.style.pointerEvents = 'none';
          img.parentNode?.appendChild(label);
          wrapperData.labels.push(label);
        }
      });
    }
  
    // Intersection Observer Mode
    #setupObserver(wrapperData) {
      const ioOptions= { 
        root: wrapperData.wrapper.navElement, // nav html element as root
        threshold: 0.2, // 25% of the image is visible
        rootMargin: `${wrapperData.offset}px 0px` // define margin for the target as top, right, bottom, left
      }
      const ioCallback= (entries, obs) => {
        entries.forEach(entry => {
          const img = entry.target;
  
          if (this.debug) {
            img.style.outlineColor = entry.isIntersecting ? 'green' : 'tomato';
          }
  
          if (entry.isIntersecting) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            obs.unobserve(img);
          }
        });
      }
      wrapperData.observer = new IntersectionObserver(ioCallback, ioOptions);
      wrapperData.images.forEach(img => wrapperData.observer.observe(img));
    }
  
    // Scroll Event Listener Mode
    #setupScroll() {
      if (!this.scrollListenerAdded) {
        /* 
          Passive Event Listeners:
            We tell the browser upfront that we won’t call preventDefault(). 
            This lets the browser continue scrolling without waiting, which makes the scroll smoother. 
          Benefits:
            Smoother Scrolling: 
              The browser doesn’t pause to check for preventDefault(), so scrolling stays smooth.
            Better User Experience: 
              Users get a more seamless and responsive interaction with your site.
            Improved Performance: 
              The site responds faster because the browser can handle scroll events more efficiently.
        */
        window.addEventListener('scroll', this.#onScroll, { passive: true });
        window.addEventListener('resize', this.#onScroll, { passive: true });
        this.scrollListenerAdded = true;
      }
      this.onScroll();
    }
    
    filterImages() {
        const rect = img.getBoundingClientRect();
          const imgTop = rect.top + scrollTop;
          const imgBottom = imgTop + rect.height;
  
          const distanceToViewport = Math.max(0, imgTop - (scrollTop + windowHeight));
          const inOffsetZone = imgTop < scrollTop + windowHeight + wrapperData.offset && imgBottom > scrollTop - wrapperData.offset;
  
          if (this.debug) {
            img.style.outlineColor = inOffsetZone ? 'orange' : 'red';
            if (this.showDistance && wrapperData.labels[index]) {
              wrapperData.labels[index].textContent = `${Math.round(distanceToViewport)}px`;
            }
          }
  
          if (inOffsetZone) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            if (this.showDistance && wrapperData.labels[index]) {
              wrapperData.labels[index].remove();
            }
            return false;
          }
          return true;
    }

    #onScroll() {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
  
      let allImagesLoaded = true;
  
      this.wrappers.forEach(wrapperData => {
        if (!wrapperData.images || wrapperData.images.length === 0) return;
  
        allImagesLoaded = false;
  
        wrapperData.images = wrapperData.images.filter((img, index) => filterImages.call(this, img, index, wrapperData, scrollTop, windowHeight));
      });
  
      if (allImagesLoaded && this.scrollListenerAdded) {
        window.removeEventListener('scroll', this.onScroll);
        window.removeEventListener('resize', this.onScroll);
        this.scrollListenerAdded = false;
      }
    }
  
    setOffset(wrapper, offset) {
      const wrapperData = this.wrappers.wrapper;
      if (!wrapperData) return;
  
      wrapperData.offset = offset;
  
      if (this.type === 'observer' && wrapperData.observer) {
        wrapperData.observer.disconnect();
        this.#setupObserver(wrapperData);
      } else {
        this.onScroll();
      }
    }
  
    destroy() {
      this.wrappers.forEach(wrapperData => {
        if (wrapperData.observer) 
          wrapperData.observer.disconnect();
        if (this.debug) {
          wrapperData.images.forEach((img, i) => {
            img.style.outline = '';
            img.style.transition = '';
            if (wrapperData.labels[i]) 
              wrapperData.labels[i].remove();
          });
        }
      });
  
      if (this.scrollListenerAdded) {
        window.removeEventListener('scroll', this.onScroll);
        window.removeEventListener('resize', this.onScroll);
        this.scrollListenerAdded = false;
      }
  
      this.wrappers={};
    }
  }
  
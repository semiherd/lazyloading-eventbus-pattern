export default class EventBus {
    // private field (isolated, cannot be accessed outside)
    #listeners = {};
  
    constructor() {
      // binding standardization
      this.on = this.on.bind(this);
      this.off = this.off.bind(this);
      this.emit = this.emit.bind(this);
    }
  
    on(event, callback) {
      if (!this.#listeners[event])
        this.#listeners[event] = [];

      this.#listeners[event].push(callback);
    }
  
    off(event, callback) {
      if (!this.#listeners[event]) return;
      this.#listeners[event] = this.#listeners[event].filter(cb => cb !== callback);
    }
  
    emit(event, data) {
      if (!this.#listeners[event]) return;
      this.#listeners[event].forEach(callback => callback(data));
    }

    clear() {
      this.#listeners = {};
    }
}
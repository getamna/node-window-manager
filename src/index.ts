import { Window } from "./classes/window";
import { EventEmitter } from "events";
import { platform } from "os";
import { Monitor } from "./classes/monitor";

let addon: any;

if (platform() === "win32" || platform() === "darwin") {
  let path_addon: string = (process.env.NODE_ENV != "dev") ? "Release" : "Debug";
  addon = require(`../build/${path_addon}/addon.node`);
}

let interval: any = null;

let registeredEvents: string[] = [];

class WindowManager extends EventEmitter {
  constructor() {
    super();

    let lastId: number;

    if (!addon) return;

    this.on("newListener", event => {
      if (registeredEvents.indexOf(event) !== -1) return;

      if (event === "window-activated") {
        interval = setInterval(async () => {
          const win = addon.getActiveWindow();
          
          if (lastId !== win) {
            lastId = win;
            this.emit("window-activated", new Window(win));
          }
        }, 50);
      } else {
        return;
      }

      registeredEvents.push(event);
    });

    this.on("removeListener", event => {
      if (this.listenerCount(event) > 0) return;

      if (event === "window-activated") {
        clearInterval(interval);
      }

      registeredEvents = registeredEvents.filter(x => x !== event);
    });
  }

  requestAccessibility = () => {
    if (platform() !== 'darwin') return true;
    return addon.requestAccessibility();
  }

  getActiveWindow = () => {
    if (!addon) return;
    return new Window(addon.getActiveWindow());
  };

  getWindows = (): Window[] => {
    if (!addon || !addon.getWindows) return;
    return addon.getWindows().map((win: any) => new Window(win)).filter((x: Window) => x.isWindow());
  };

  getMonitors = (): Monitor[] => {
    if (!addon || !addon.getMonitors) return;
    return addon.getMonitors().map((mon: any) => new Monitor(mon));
  };
}

const windowManager = new WindowManager();

export { windowManager, Window, addon };

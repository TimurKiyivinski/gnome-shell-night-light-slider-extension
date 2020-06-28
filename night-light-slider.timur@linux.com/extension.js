/* global imports log */
const St = imports.gi.St;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Main = imports.ui.main;
const Slider = imports.ui.slider;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;
const GObject = imports.gi.GObject;

// Globals
const INDEX = 2;
const BUS_NAME = "org.gnome.SettingsDaemon.Color";
const OBJECT_PATH = "/org/gnome/SettingsDaemon/Color";
const COLOR_SCHEMA = "org.gnome.settings-daemon.plugins.color";

/* eslint-disable */
const ColorInterface =
  '<node> \
<interface name="org.gnome.SettingsDaemon.Color"> \
  <property name="Temperature" type="d" access="readwrite"/> \
  <property name="NightLightActive" type="b" access="read"/> \
</interface> \
</node>';
/* eslint-enable */

const NightLightSlider = GObject.registerClass(
  {
    GType: "NightLightSlider",
  },
  class NightLightSlider extends PanelMenu.SystemIndicator {
    _init(schema, settings) {
      super._init("night-light-symbolic");
      this._schema = schema;
      this._min = settings.minimum;
      this._max = settings.maximum;
      this._listeners = [];

      // Set up view
      this._item = new PopupMenu.PopupBaseMenuItem({ activate: false });
      this.menu.addMenuItem(this._item);

      if (settings.enable_icon) {
        this._icon = new St.Icon({
          icon_name: "night-light-symbolic",
          style_class: "popup-menu-icon",
        });
        this._item.add(this._icon);
      }

      // Slider
      this._slider = new Slider.Slider(0);
      this._slider.connect("notify::value", this._sliderChanged.bind(this));
      this._slider.accessible_name = "Temperature";
      this._item.add(this._slider, { expand: true });

      // Connect events
      this._item.connect("button-press-event", (o, event) =>
        this._slider.startDragging(event)
      );
      this._item.connect("key-press-event", (o, event) =>
        this._slider.onKeyPressEvent(actor, event)
      );

      // Update initial view
      this._updateView();
    }

    _proxyHandler(proxy, error) {
      if (error) {
        log(error.message);
        return;
      }
      this.proxy.connect("g-properties-changed", this.update_view.bind(this));
    }

    _sliderChanged(slider) {
      const temperature =
        parseInt(this._slider.value * (this._max - this._min)) + this._min;
      this._schema.set_uint("night-light-temperature", temperature);

      this._listeners.forEach((callback) => {
        callback(temperature, this._slider.value);
      });
    }

    _onSliderChanged(callback) {
      this._listeners.push(callback);
    }

    _updateView() {
      // Update temperature view
      const temperature = this._schema.get_uint("night-light-temperature");
      const value = (temperature - this._min) / (this._max - this._min);
      this._slider.value = value;
    }

    _scroll(event) {
      this._slider.scroll(event);
    }
  }
);

class NightLightSchedule {
  constructor(schema) {
    this._schema = schema;
    this._enabled = false;
  }

  _updateSchedule() {
    if (!this._enabled) {
      return false;
    }
    const date = new Date();
    const hours = date.getHours();
    date.setHours(hours - 6);
    const from = date.getHours();
    date.setHours(hours + 6);
    const to = date.getHours();
    log(
      `[night-light-slider] Setting night light schedule from ${from} to ${to}`
    );
    this._schema.set_boolean("night-light-schedule-automatic", false);
    this._schema.set_double("night-light-schedule-to", to);
    this._schema.set_double("night-light-schedule-from", from);
    return true;
  }

  _enableLoop() {
    this._enabled = true;
    // Get original values to reset to
    this._to = this._schema.get_double("night-light-schedule-to");
    this._from = this._schema.get_double("night-light-schedule-from");
    this._auto = this._schema.get_boolean("night-light-schedule-automatic");

    // Start loop
    this.loopId = GLib.timeout_add(
      GLib.PRIORITY_DEFAULT,
      1000 * 60 * 60,
      this._updateSchedule.bind(this)
    );
    this._updateSchedule();
  }

  _disableLoop() {
    if (this._enabled) {
      this._schema.set_double("night-light-schedule-to", this._to);
      this._schema.set_double("night-light-schedule-from", this._from);
      this._schema.set_boolean("night-light-schedule-automatic", this._auto);
    }
  }
}

class NightLightExtension {
  constructor() {
    this._schema = new Gio.Settings({ schema: COLOR_SCHEMA });
    this._colorProxy = Gio.DBusProxy.makeProxyWrapper(ColorInterface);
    this._scheduleUpdater = new NightLightSchedule(this._schema);

    // Night light icon
    this._icon = Main.panel.statusArea.aggregateMenu._nightLight;
    // This will be defined if icon is set to hide
    this._indicator = null;
    this._indicators = null;
    this._construct = () =>
      new Error("[night-light-slider] View construct stub not set up!");
    this._deconstruct = () =>
      new Error("[night-light-slider] View deconstruct stub not set up!");
  }

  enable() {
    // Settings
    const settings = Convenience.getSettings();

    // Enable night light, otherwise why use this extension :D?
    this._schema.set_boolean("night-light-enabled", true);

    // Create and add widget
    this._indicator = new NightLightSlider(this._schema, {
      minimum: settings.get_int("minimum"),
      maximum: settings.get_int("maximum"),
      enable_icon: !settings.get_boolean("show-in-submenu"),
    });

    // Set up display construction stubs
    if (settings.get_boolean("show-in-submenu")) {
      this._construct = () => {
        Main.panel.statusArea.aggregateMenu._nightLight.menu
          ._getMenuItems()[0]
          .menu.addMenuItem(this._indicator.menu);
      };
    } else {
      this._construct = () => {
        Main.panel.statusArea.aggregateMenu.menu.addMenuItem(
          this._indicator.menu,
          INDEX
        );
      };
    }

    this._deconstruct = () => this._indicator.menu.destroy();

    // Run construct function
    this._construct();

    // Set up updater loop to set night light schedule if update always is enabled
    if (settings.get_boolean("enable-always")) {
      this._scheduleUpdater._enableLoop();
    }

    // Hide status icon if set to disable
    if (!settings.get_boolean("show-status-icon") && this._icon) {
      log(`[night-light-slider] Hiding status icon`);
      this._indicators = this._icon.indicators;
      this._icon.indicators.hide();
      this._icon.indicators = new St.BoxLayout();
    }

    // When scrolling the indicator, change night light intensity
    this._icon.connect("scroll-event", (o, event) => {
      this._indicator._scroll(event);
      return true;
    });

    // Set up proxy to update slider view
    this._colorProxy(
      Gio.DBus.session,
      BUS_NAME,
      OBJECT_PATH,
      (proxy, error) => {
        if (error) {
          log(error.message);
          return;
        }

        const updateView = () => {
          this._indicator._updateView();
          if (!settings.get_boolean("show-always")) {
            const active = proxy.NightLightActive;
            const menuItems = Main.panel.statusArea.aggregateMenu.menu._getMenuItems();
            menuItems[INDEX].actor.visible = active;
          }
        };

        proxy.connect("g-properties-changed", updateView);

        // Update view once on init
        updateView();
      }
    );

    // Event hooks
    this._indicator._onSliderChanged((temperature, value) => {
      // Set up night light to sync with brightness if changed
      if (settings.get_boolean("brightness-sync")) {
        Main.panel.statusArea.aggregateMenu._brightness._slider.value = value;
      }
    });
  }

  disable() {
    // Run deconstruct function
    this._deconstruct();

    // Restore default status icon behaviour
    if (this._indicators) {
      Main.panel.statusArea.aggregateMenu._nightLight.indicators.destroy();
      Main.panel.statusArea.aggregateMenu._nightLight.indicators = this._indicators;
      Main.panel.statusArea.aggregateMenu._nightLight.indicators.show();
    }

    // Disable updater loop
    this._scheduleUpdater._disableLoop();
  }
}

function init() {
  // eslint-disable-line
  return new NightLightExtension();
}

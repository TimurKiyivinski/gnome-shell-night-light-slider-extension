/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

/* exported init */

const {Gio, GLib, GObject, St} = imports.gi;

const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Slider = imports.ui.slider;

// Get running panel instance
const {panel} = imports.ui.main;

const ExtensionUtils = imports.misc.extensionUtils;

const Me = ExtensionUtils.getCurrentExtension();
const {debounce, setInterval} = Me.imports.convenience;

// GSettings schema
const COLOR_SCHEMA = 'org.gnome.settings-daemon.plugins.color';

// D-Bus
const BUS_NAME = 'org.gnome.SettingsDaemon.Color';
const OBJECT_PATH = '/org/gnome/SettingsDaemon/Color';

const ColorInterface = `<node>
  <interface name="org.gnome.SettingsDaemon.Color">
    <property name="NightLightActive" type="b" access="read"/>
    <property name="Temperature" type="d" access="read"/>
  </interface>
</node>`;
const ColorProxy = Gio.DBusProxy.makeProxyWrapper(ColorInterface);

// Brightness D-Bus
const {loadInterfaceXML} = imports.misc.fileUtils;

const BRIGHTNESS_BUS_NAME = 'org.gnome.SettingsDaemon.Power';
const BRIGHTNESS_OBJECT_PATH = '/org/gnome/SettingsDaemon/Power';

const BrightnessInterface = loadInterfaceXML('org.gnome.SettingsDaemon.Power.Screen');
const BrightnessProxy = Gio.DBusProxy.makeProxyWrapper(BrightnessInterface);

var Indicator = GObject.registerClass(
class Indicator extends PanelMenu.SystemIndicator {
    _init(indicator, options) {
        super._init();

        // Decorate _sync method
        this._sync = debounce(this.__sync.bind(this), 500);

        // Hijacked indicator instance
        this._indicator = indicator;

        // Indicator options
        this._options = options;

        // Night Light GSettings
        this._settings = new Gio.Settings({schema_id: COLOR_SCHEMA});

        // Night Light D-Bus
        this._proxy = new ColorProxy(Gio.DBus.session, BUS_NAME, OBJECT_PATH,
            (proxy, error) => {
                if (error) {
                    log(`ColorProxy: ${error.message}`);
                    return;
                }
                this._proxyChangedId = this._proxy.connect('g-properties-changed',
                    this._sync.bind(this));
                this._sync();
            });


        // Write-only Brightness D-Bus
        this._brightnessProxy = new BrightnessProxy(Gio.DBus.session, BRIGHTNESS_BUS_NAME, BRIGHTNESS_OBJECT_PATH,
            (proxy, error) => {
                if (error)
                    log(`BrightnessProxy: ${error.message}`);
            });

        // We create our slider for the Panel AggregateMenu
        this._item = new PopupMenu.PopupBaseMenuItem({activate: false});
        this.menu.addMenuItem(this._item);

        // Create the slider
        this._slider = new Slider.Slider(0);
        this._sliderChangedId = this._slider.connect('notify::value',
            this._sliderChanged.bind(this));
        this._slider.accessible_name = _('Night Light Temperature');

        this._slider_icon = new St.Icon({icon_name: 'night-light-symbolic',
            style_class: 'popup-menu-icon'});

        // Add the slider & its icon to the base menu
        this._item.add(this._slider_icon);
        this._item.add_child(this._slider);

        // Connect menu signals to the slider
        this._item.connect('button-press-event', (actor, event) => {
            return this._slider.startDragging(event);
        });
        this._item.connect('key-press-event', (actor, event) => {
            return this._slider.emit('key-press-event', event);
        });
        this._item.connect('scroll-event', (actor, event) => {
            return this._slider.emit('scroll-event', event);
        });

        // Connect indicator signals to the slider
        this._indicatorShowId = this._indicator.connect('show', () => {
            this._updateIndicatorVisibility();
        });
        this._indicatorScrollId = this._indicator.connect('scroll-event', (actor, event) => {
            return this._slider.emit('scroll-event', event);
        });

        // Because SystemIndicator is a ClutterActor, overriding the destroy()
        // method directly is bad idea. Instead PanelMenu.Button connects to
        // the signal, so we can override that callback and chain-up.
        this.connect('destroy', this._onDestroy.bind(this));
    }

    _sliderChanged() {
        const {swapAxis, minimum, maximum, brightnessSync} = this._options;
        const percent = swapAxis
            ? 1 - this._slider.value
            : this._slider.value;
        const temperature = percent * (maximum - minimum) + minimum;

        // Block updates from ColorProxy over the 5s smear duration
        this._proxy.block_signal_handler(this._proxyChangedId);
        GLib.timeout_add(GLib.PRIORITY_DEFAULT, 5000,
            () => this._proxy.unblock_signal_handler(this._proxyChangedId));

        // Update GSettings
        this._settings.set_uint('night-light-temperature', temperature);

        if (brightnessSync && this._brightnessProxy.Brightness >= 0)
            this._brightnessProxy.Brightness = this._slider.value * 100;
    }

    _changeSlider(value) {
        this._slider.block_signal_handler(this._sliderChangedId);
        this._slider.value = value;
        this._slider.unblock_signal_handler(this._sliderChangedId);
    }

    _updateIndicatorVisibility() {
        this._indicator.visible = this._indicator_visibility;
    }

    __sync() {
        const {showAlways, showStatusIcon, swapAxis, minimum, maximum} = this._options;
        const active = this._proxy.NightLightActive;
        this._item.visible = active || showAlways;
        this._indicator_visibility = active && showStatusIcon;
        this._updateIndicatorVisibility();

        if (active) {
            const percent = (this._proxy.Temperature - minimum) / (maximum - minimum);
            if (swapAxis)
                this._changeSlider(1 - percent);
            else
                this._changeSlider(percent);
        }
    }

    updateOption(option, value) {
        this._options[option] = value;
        switch (option) {
        case 'showAlways':
        case 'showStatusIcon':
            return this._sync();
        }
    }

    _onDestroy() {
        // Unassign DBus proxies
        this._proxy.disconnect(this._proxyChangedId);
        this._proxy = null;
        this._brightnessProxy = null;

        // Delete top-level items
        this._item.destroy();
        this._slider = null;
        this._slider_icon = null;
        this._item = null;

        // Disconnect external signals
        this._indicator.disconnect(this._indicatorShowId);
        this._indicator.disconnect(this._indicatorScrollId);
    }
});

class NightLightSchedule {
    constructor(settings) {
        this._settings = settings;
    }

    enableTimer() {
        this._settings.set_boolean('night-light-schedule-automatic', false);
        // Update schedule every 1 hour
        this._timerId = setInterval(this._updateSchedule.bind(this), 60 * 60 * 1000);
        this._updateSchedule();
    }

    disableTimer() {
        if (this._timerId) {
            this._settings.set_boolean('night-light-schedule-automatic', true);
            GLib.Source.remove(this._timerId);
            this._timerId = null;
        }
    }

    _updateSchedule() {
        const now = Date.now();
        // Set a schedule span of 6 hours to & from now
        const to = new Date(now + 6 * 60 * 60 * 1000);
        const from = new Date(now - 6 * 60 * 60 * 1000);
        this._settings.set_double('night-light-schedule-to', to.getHours());
        this._settings.set_double('night-light-schedule-from', from.getHours());
    }
}

class Extension {
    constructor() {
        this._settings = new Gio.Settings({schema_id: COLOR_SCHEMA});
        this._scheduler = new NightLightSchedule(this._settings);
        this._preferences = ExtensionUtils.getSettings();

        // We set up listeners for GSettings last because:
        // > Note that @settings only emits this signal if you have read key at
        // > least once while a signal handler was already connected for key.
        this._preferences.connect('changed::minimum', () =>
            this._updateOption('minimum', this._preferences.get_int('minimum')));
        this._preferences.connect('changed::maximum', () =>
            this._updateOption('maximum', this._preferences.get_int('maximum')));
        this._preferences.connect('changed::swap-axis', () =>
            this._updateOption('swapAxis', this._preferences.get_boolean('swap-axis')));
        this._preferences.connect('changed::show-always', () =>
            this._updateOption('showAlways', this._preferences.get_boolean('show-always')));
        this._preferences.connect('changed::show-status-icon', () =>
            this._updateOption('showStatusIcon', this._preferences.get_boolean('show-status-icon')));
        this._preferences.connect('changed::brightness-sync', () =>
            this._updateOption('brightnessSync', this._preferences.get_boolean('brightness-sync')));

        // Set up hook to recreate indicator on settings change
        this._preferences.connect('changed::show-in-submenu', () => {
            if (!this._nightLight)
                return;
            this._nightLight.destroy();
            this._create();
        });

        // Set up hook to update scheduler
        this._preferences.connect('changed::enable-always', () => {
            if (!this._nightLight)
                return;
            this._setupScheduler();
        });
    }

    _setupScheduler() {
        if (this._preferences.get_boolean('enable-always'))
            this._scheduler.enableTimer();
        else
            this._scheduler.disableTimer();
    }

    _create() {
        const indicator = panel.statusArea.aggregateMenu._nightLight;
        this._nightLight = new Indicator(indicator, {
            minimum: this._preferences.get_int('minimum'),
            maximum: this._preferences.get_int('maximum'),
            swapAxis: this._preferences.get_boolean('swap-axis'),
            showAlways: this._preferences.get_boolean('show-always'),
            showStatusIcon: this._preferences.get_boolean('show-status-icon'),
            brightnessSync: this._preferences.get_boolean('brightness-sync'),
        });

        // Assign slider to AggregateMenu, just like other indicators
        // This also makes it easier to debug the extension
        panel.statusArea.aggregateMenu._nightLightSlider = this._nightLight;

        if (this._preferences.get_boolean('show-in-submenu'))
            panel.statusArea.aggregateMenu._nightLight._item.menu.addMenuItem(this._nightLight.menu);
        else
            panel.statusArea.aggregateMenu.menu.addMenuItem(this._nightLight.menu, 2);
    }

    _updateOption(key, value) {
        if (!this._nightLight)
            return;
        this._nightLight.updateOption(key, value);
    }

    enable() {
        this._create();
        this._setupScheduler();
    }

    disable() {
        this._nightLight.destroy();
        this._nightLight = null;
        panel.statusArea.aggregateMenu._nightLightSlider = null;
        this._scheduler.disableTimer();
    }
}

function init() {
    return new Extension();
}

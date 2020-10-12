/* exported buildPrefsWidget init */
imports.gi.versions.Gtk = '3.0';
imports.gi.versions.Handy = '0.0';
const {GObject, Gio, Gtk, Handy} = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

// Register resources
const resource = Me.metadata['data-gresource'];
const resourceFile = Me.dir.get_child(resource);
Gio.resources_register(Gio.Resource.load(resourceFile.get_path()));

// GSettings schema
const COLOR_SCHEMA = 'org.gnome.settings-daemon.plugins.color';

var NightLightExtensionPrefs = GObject.registerClass({
    GTypeName: 'NightLightExtensionPrefs',
    Template: 'resource:///org/gnome/shell/extensions/nightlightslider/ui/prefs.ui',
    InternalChildren: [
        /* Night Light status infobar */
        'infobar_status', 'btn_enable_night_light',
        /* Slider position option */
        'show_in_submenu_combo',
        /* Boolean switch options */
        'show_always_toggle_switch',
        'show_status_icon_toggle_switch',
        'swap_axis_toggle_switch',
        'brightness_sync_toggle_switch',
        'enable_always_toggle_switch',
        /* Temperature range */
        'spinbutton_maximum', 'spinbutton_minimum',
    ],
}, class NightLightExtensionPrefs extends Gtk.Box {
    _init(preferences) {
        super._init();
        this._preferences = preferences;
        this._settings = new Gio.Settings({schema_id: COLOR_SCHEMA});

        // Initialize application state
        this._syncInfobar();
        this._syncPreferences();

        // Connect settings change signals
        this._settings.connect('changed::night-light-enabled', this._syncInfobar.bind(this));
        this._preferences.connect('changed', this._syncPreferences.bind(this));

        // Set up alert CTA to enable night light
        this._btn_enable_night_light.connect('clicked',
            () => this._settings.set_boolean('night-light-enabled', true));

        // Set up combo changed listener
        this._show_in_submenu_combo.connect('changed',
            self => this._preferences.set_boolean('show-in-submenu',
                // The possible options are show_in_submenu_{true,false}
                self.active_id === 'show_in_submenu_true'));

        // Set up switch state-set listeners
        // We negate the returns of `set_boolean` such that the state updates
        this._show_always_toggle_switch.connect('state-set',
            (_, state) => !this._preferences.set_boolean('show-always', state));
        this._show_status_icon_toggle_switch.connect('state-set',
            (_, state) => !this._preferences.set_boolean('show-status-icon', state));
        this._swap_axis_toggle_switch.connect('state-set',
            (_, state) => !this._preferences.set_boolean('swap-axis', state));
        this._brightness_sync_toggle_switch.connect('state-set',
            (_, state) => !this._preferences.set_boolean('brightness-sync', state));
        this._enable_always_toggle_switch.connect('state-set',
            (_, state) => !this._preferences.set_boolean('enable-always', state));

        // Set up spinner value-changed listeners
        this._spinbutton_maximum.connect('value-changed',
            self => this._preferences.set_int('maximum', self.value));
        this._spinbutton_minimum.connect('value-changed',
            self => this._preferences.set_int('minimum', self.value));
    }

    _syncInfobar() {
        const visible = !this._settings.get_boolean('night-light-enabled');
        this._infobar_status.set_revealed(visible);
    }

    _syncPreferences() {
        // Focus on slider position option based on index
        this._show_in_submenu_combo.set_active(this._preferences.get_boolean('show-in-submenu') ? 1 : 0);

        // Update switch active states
        this._show_always_toggle_switch.active = this._preferences.get_boolean('show-always');
        this._show_status_icon_toggle_switch.active = this._preferences.get_boolean('show-status-icon');
        this._swap_axis_toggle_switch.active = this._preferences.get_boolean('swap-axis');
        this._brightness_sync_toggle_switch.active = this._preferences.get_boolean('brightness-sync');
        this._enable_always_toggle_switch.active = this._preferences.get_boolean('enable-always');

        // Update temperature range values
        this._spinbutton_maximum.value = this._preferences.get_int('maximum');
        this._spinbutton_minimum.value = this._preferences.get_int('minimum');
    }
});

function buildPrefsWidget() {
    const preferences = ExtensionUtils.getSettings();
    return new NightLightExtensionPrefs(preferences);
}

function init() {
    Gtk.init(null);
    Handy.init(null);
}

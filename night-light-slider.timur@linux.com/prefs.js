/* exported buildPrefsWidget init */
imports.gi.versions.Gtk = '3.0';
const {GObject, Gio, Gtk} = imports.gi;

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
    Template: 'resource:///org/gnome/shell/extensions/nightlightslider/prefs.ui',
    InternalChildren: ['infobar_status'],
}, class NightLightExtensionPrefs extends Gtk.Box {
    _init(preferences) {
        super._init();
        this._preferences = preferences;
        this._settings = new Gio.Settings({schema_id: COLOR_SCHEMA});

        this._syncInfobar();

        // Connect settings change signals
        this._settings.connect('changed::night-light-enabled', this._syncInfobar.bind(this));
    }

    _syncInfobar() {
        const visible = !this._settings.get_boolean('night-light-enabled');
        this._infobar_status.set_revealed(visible);
    }
});

function buildPrefsWidget() {
    const preferences = ExtensionUtils.getSettings();
    return new NightLightExtensionPrefs(preferences);
}

function init() {
    log(`initializing ${Me.metadata.name} Preferences`);
}

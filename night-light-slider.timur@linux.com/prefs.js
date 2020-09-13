/* exported buildPrefsWidget init */
const Gtk = imports.gi.Gtk;

// Extension specific
const ExtensionUtils = imports.misc.extensionUtils;

function buildPrefsWidget() {
    const schema = ExtensionUtils.getSettings();

    // Text and descriptions
    const showAlwaysName = schema.settings_schema
    .get_key('show-always')
    .get_summary();
    const showAlwaysDescription = schema.settings_schema
    .get_key('show-always')
    .get_description();
    const showIconName = schema.settings_schema
    .get_key('show-status-icon')
    .get_summary();
    const showIconDescription = schema.settings_schema
    .get_key('show-status-icon')
    .get_description();
    const enableAlwaysName = schema.settings_schema
    .get_key('enable-always')
    .get_summary();
    const enableAlwaysDescription = schema.settings_schema
    .get_key('enable-always')
    .get_description();
    const minimumName = schema.settings_schema.get_key('minimum').get_summary();
    const minimumDescription = schema.settings_schema
    .get_key('minimum')
    .get_description();
    const maximumName = schema.settings_schema.get_key('maximum').get_summary();
    const maximumDescription = schema.settings_schema
    .get_key('maximum')
    .get_description();
    const brightnessSyncName = schema.settings_schema
    .get_key('brightness-sync')
    .get_summary();
    const brightnessSyncDescription = schema.settings_schema
    .get_key('brightness-sync')
    .get_description();
    const showInSubmenuName = schema.settings_schema
    .get_key('show-in-submenu')
    .get_summary();
    const showInSubmenuDescription = schema.settings_schema
    .get_key('show-in-submenu')
    .get_description();
    const swapAxisName = schema.settings_schema
    .get_key('swap-axis')
    .get_summary();
    const swapAxisDescription = schema.settings_schema
    .get_key('swap-axis')
    .get_description();

    // Create children objects
    const widgets = [
        {
            type: 'Label',
            params: {label: `${showAlwaysName}: `},
            tooltip: showAlwaysDescription,
            align: Gtk.Align.END,
            attach: [0, 1, 1, 1],
        },
        {
            type: 'Switch',
            params: {active: schema.get_boolean('show-always')},
            tooltip: showAlwaysDescription,
            align: Gtk.Align.START,
            attach: [1, 1, 1, 1],
            connect: {
                'state-set': self => {
                    schema.set_boolean('show-always', self.active);
                },
            },
        },
        {
            type: 'Label',
            params: {label: `${showIconName}: `},
            tooltip: showAlwaysDescription,
            align: Gtk.Align.END,
            attach: [0, 2, 1, 1],
        },
        {
            type: 'Switch',
            params: {active: schema.get_boolean('show-status-icon')},
            tooltip: showIconDescription,
            align: Gtk.Align.START,
            attach: [1, 2, 1, 1],
            connect: {
                'state-set': self => {
                    schema.set_boolean('show-status-icon', self.active);
                },
            },
        },
        {
            type: 'Label',
            params: {label: `${enableAlwaysName}: `},
            tooltip: enableAlwaysDescription,
            align: Gtk.Align.END,
            attach: [0, 3, 1, 1],
        },
        {
            type: 'Switch',
            params: {active: schema.get_boolean('enable-always')},
            tooltip: enableAlwaysDescription,
            align: Gtk.Align.START,
            attach: [1, 3, 1, 1],
            connect: {
                'state-set': self => {
                    schema.set_boolean('enable-always', self.active);
                },
            },
        },
        {
            type: 'Label',
            params: {label: `${brightnessSyncName}: `},
            tooltip: brightnessSyncDescription,
            align: Gtk.Align.END,
            attach: [0, 4, 1, 1],
        },
        {
            type: 'Switch',
            params: {active: schema.get_boolean('brightness-sync')},
            tooltip: brightnessSyncDescription,
            align: Gtk.Align.START,
            attach: [1, 4, 1, 1],
            connect: {
                'state-set': self => {
                    schema.set_boolean('brightness-sync', self.active);
                },
            },
        },
        {
            type: 'Label',
            params: {label: `${showInSubmenuName}: `},
            tooltip: showInSubmenuDescription,
            align: Gtk.Align.END,
            attach: [0, 5, 1, 1],
        },
        {
            type: 'Switch',
            params: {active: schema.get_boolean('show-in-submenu')},
            tooltip: showInSubmenuDescription,
            align: Gtk.Align.START,
            attach: [1, 5, 1, 1],
            connect: {
                'state-set': self => {
                    schema.set_boolean('show-in-submenu', self.active);
                },
            },
        },
        {
            type: 'Label',
            params: {label: `${minimumName}: `},
            tooltip: minimumDescription,
            align: Gtk.Align.END,
            attach: [0, 6, 1, 1],
        },
        {
            type: 'Entry',
            params: {text: schema.get_int('minimum').toString()},
            tooltip: minimumDescription,
            align: Gtk.Align.START,
            attach: [1, 6, 1, 1],
            connect: {
                changed: self => {
                    schema.set_int('minimum', parseInt(self.text));
                },
            },
        },
        {
            type: 'Label',
            params: {label: `${maximumName}: `},
            tooltip: maximumDescription,
            align: Gtk.Align.END,
            attach: [0, 7, 1, 1],
        },
        {
            type: 'Entry',
            params: {text: schema.get_int('maximum').toString()},
            tooltip: maximumDescription,
            align: Gtk.Align.START,
            attach: [1, 7, 1, 1],
            connect: {
                changed: self => {
                    schema.set_int('maximum', parseInt(self.text));
                },
            },
        },
        {
            type: 'Label',
            params: {label: `${swapAxisName}: `},
            tooltip: swapAxisDescription,
            align: Gtk.Align.END,
            attach: [0, 8, 1, 1],
        },
        {
            type: 'Switch',
            params: {active: schema.get_boolean('swap-axis')},
            tooltip: swapAxisDescription,
            align: Gtk.Align.START,
            attach: [1, 8, 1, 1],
            connect: {
                'state-set': self => {
                    schema.set_boolean('swap-axis', self.active);
                },
            },
        },
        {
            type: 'Label',
            params: {
                label:
          'Changes require restarting shell (logging in and out) to take place.',
            },
            tooltip: showAlwaysDescription,
            align: Gtk.Align.CENTER,
            attach: [0, 9, 2, 1],
        },
    ];

    // Perform side-effects
    const vbox = new Gtk.Grid({
        column_spacing: 20,
        row_spacing: 20,
        margin: 10,
    });

    widgets.forEach(function createWidget({
        type,
        params,
        tooltip,
        align,
        attach,
        connect,
    }) {
        const widget = new Gtk[type](params);

        // Set description
        widget.set_tooltip_text(tooltip);

        // Set alignment
        widget.set_halign(align);
        widget.set_hexpand(true);

        // Add event handler if exists
        if (connect) {
            Object.keys(connect).forEach(function performConnect(signal) {
                widget.connect(signal, () => connect[signal](widget));
            });
        }

        vbox.attach(widget, ...attach);
    });

    vbox.show_all();
    return vbox;
}

function init() {
    log('Setting up night light slider preferences');
}

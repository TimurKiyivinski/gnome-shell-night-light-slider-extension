/* eslint-disable no-unused-vars */
/* global imports log */

const Gtk = imports.gi.Gtk

// Extension specific
const Me = imports.misc.extensionUtils.getCurrentExtension()
const Lang = Me.imports.lang
const Convenience = Me.imports.convenience

function buildPrefsWidget () {
  const schema = Convenience.getSettings()

  // Create children objects
  const widgets = [
    {
      type: 'Label',
      params: { label: `${Lang.preferences.showAlways.label}: ` },
      tooltip: Lang.preferences.showAlways.tooltip,
      align: Gtk.Align.END,
      attach: [0, 1, 1, 1]
    },
    {
      type: 'Switch',
      params: { active: schema.get_boolean('show-always') },
      tooltip: Lang.preferences.showAlways.tooltip,
      align: Gtk.Align.START,
      attach: [1, 1, 1, 1],
      connect: {
        'state-set': self => {
          schema.set_boolean('show-always', self.active)
        }
      }
    },
    {
      type: 'Label',
      params: { label: `${Lang.preferences.showStatusIcon.label}: ` },
      tooltip: Lang.preferences.showStatusIcon.tooltip,
      align: Gtk.Align.END,
      attach: [0, 2, 1, 1]
    },
    {
      type: 'Switch',
      params: { active: schema.get_boolean('show-status-icon') },
      tooltip: Lang.preferences.showStatusIcon.tooltip,
      align: Gtk.Align.START,
      attach: [1, 2, 1, 1],
      connect: {
        'state-set': self => {
          schema.set_boolean('show-status-icon', self.active)
        }
      }
    },
    {
      type: 'Label',
      params: { label: `${Lang.preferences.enableAlways.label}: ` },
      tooltip: Lang.preferences.enableAlways.tooltip,
      align: Gtk.Align.END,
      attach: [0, 3, 1, 1]
    },
    {
      type: 'Switch',
      params: { active: schema.get_boolean('enable-always') },
      tooltip: Lang.preferences.enableAlways.tooltip,
      align: Gtk.Align.START,
      attach: [1, 3, 1, 1],
      connect: {
        'state-set': self => {
          schema.set_boolean('enable-always', self.active)
        }
      }
    },
    {
      type: 'Label',
      params: { label: `${Lang.preferences.brightnessSync.label}: ` },
      tooltip: Lang.preferences.brightnessSync.tooltip,
      align: Gtk.Align.END,
      attach: [0, 4, 1, 1]
    },
    {
      type: 'Switch',
      params: { active: schema.get_boolean('brightness-sync') },
      tooltip: Lang.preferences.brightnessSync.tooltip,
      align: Gtk.Align.START,
      attach: [1, 4, 1, 1],
      connect: {
        'state-set': self => {
          schema.set_boolean('brightness-sync', self.active)
        }
      }
    },
    {
      type: 'Label',
      params: { label: `${Lang.preferences.showInSubmenu.label}: ` },
      tooltip: Lang.preferences.showInSubmenu.tooltip,
      align: Gtk.Align.END,
      attach: [0, 5, 1, 1]
    },
    {
      type: 'Switch',
      params: { active: schema.get_boolean('show-in-submenu') },
      tooltip: Lang.preferences.showInSubmenu.tooltip,
      align: Gtk.Align.START,
      attach: [1, 5, 1, 1],
      connect: {
        'state-set': self => {
          schema.set_boolean('show-in-submenu', self.active)
        }
      }
    },
    {
      type: 'Label',
      params: { label: `${Lang.preferences.minimum.label}: ` },
      tooltip: Lang.preferences.minimum.tooltip,
      align: Gtk.Align.END,
      attach: [0, 6, 1, 1]
    },
    {
      type: 'Entry',
      params: { text: schema.get_int('minimum').toString() },
      tooltip: Lang.preferences.minimum.tooltip,
      align: Gtk.Align.START,
      attach: [1, 6, 1, 1],
      connect: {
        'changed': self => {
          schema.set_int('minimum', parseInt(self.text))
        }
      }
    },
    {
      type: 'Label',
      params: { label: `${Lang.preferences.maximum.label}: ` },
      tooltip: Lang.preferences.maximum.tooltip,
      align: Gtk.Align.END,
      attach: [0, 7, 1, 1]
    },
    {
      type: 'Entry',
      params: { text: schema.get_int('maximum').toString() },
      tooltip: Lang.preferences.maximum.tooltip,
      align: Gtk.Align.START,
      attach: [1, 7, 1, 1],
      connect: {
        'changed': self => {
          schema.set_int('maximum', parseInt(self.text))
        }
      }
    },
    {
      type: 'Label',
      params: { label: Lang.preferences.restartRequired.label },
      align: Gtk.Align.CENTER,
      attach: [0, 8, 2, 1]
    }
  ]

  // Perform side-effects
  const vbox = new Gtk.Grid({
    column_spacing: 20,
    row_spacing: 20,
    margin: 10
  })

  widgets.map(function createWidget ({ type, params, tooltip, align, attach, connect }) {
    const widget = new Gtk[type](params)

    if (tooltip) {
      // Set description
      widget.set_tooltip_text(tooltip)
    }

    // Set alignment
    widget.set_halign(align)
    widget.set_hexpand(true)

    // Add event handler if exists
    if (connect) {
      Object.keys(connect).map(function performConnect (signal) {
        widget.connect(signal, () => connect[signal](widget))
      })
    }

    vbox.attach(widget, ...attach)
  })

  vbox.show_all()
  return vbox
}

function init () {
  log('Setting up night light slider preferences')
}

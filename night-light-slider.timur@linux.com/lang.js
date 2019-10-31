/* eslint-disable no-unused-vars */
/* global imports */

const Gettext = imports.gettext
const Me = imports.misc.extensionUtils.getCurrentExtension()

;(function () {
  // Initialize gettext
  const localeDir = Me.dir.get_child('locale').get_path()
  Gettext.bindtextdomain('night-light-slider', localeDir)
})()

// Assign gettext as _
const { gettext: _ } = Gettext.domain('night-light-slider')

const preferences = {
  showAlways: {
    label: _('Show always'),
    tooltip: _('Show slider even when night light is off')
  },
  showStatusIcon: {
    label: _('Show status icon'),
    tooltip: _('Show status icon in status area')
  },
  enableAlways: {
    label: _('Enable always'),
    tooltip: _('Enable night light throughout the day')
  },
  brightnessSync: {
    label: _('Brightness sync'),
    tooltip: _('Sync brightness slider with night light slider')
  },
  showInSubmenu: {
    label: _('Show in submenu'),
    tooltip: _('Display slider in night light submenu')
  },
  minimum: {
    label: _('Minimum value'),
    tooltip: _('Minimum night light slider value')
  },
  maximum: {
    label: _('Maximum value'),
    tooltip: _('Maximum night light slider value')
  },
  restartRequired: {
    label: _('Changes require restarting shell (logging in and out) to take place.')
  }
}

/* global imports log */
const Gio = imports.gi.Gio;
const Me = imports.misc.extensionUtils.getCurrentExtension();

function getSettings() {
  // eslint-disable-line no-unused-vars
  const schema = Me.metadata["settings-schema"];
  const schemaDir = Me.dir.get_child("schemas");

  log(`Attempting to load schema ${schema} from path ${schemaDir.get_path()}`);
  const schemaSource = schemaDir.query_exists(null)
    ? Gio.SettingsSchemaSource.new_from_directory(
        schemaDir.get_path(),
        Gio.SettingsSchemaSource.get_default(),
        false
      )
    : Gio.SettingsSchemaSource.get_default();
  const settingsSchema = schemaSource.lookup(schema, true);

  if (!settingsSchema) {
    throw new Error(
      `Schema ${schema} could not be loaded for night light slider extension.`
    );
  }

  return new Gio.Settings({ settings_schema: settingsSchema });
}

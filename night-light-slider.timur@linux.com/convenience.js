/* exported debounce setInterval */
const {GLib} = imports.gi;

function debounce(func, wait, options = {priority: GLib.PRIORITY_DEFAULT}) {
    let sourceId;
    return function (...args) {
        const debouncedFunc = () => {
            sourceId = null;
            func.apply(this, args);
        };

        // It is a programmer error to attempt to remove a non-existent source
        if (sourceId)
            GLib.Source.remove(sourceId);
        sourceId = GLib.timeout_add(options.priority, wait, debouncedFunc);
    };
}

function setInterval(func, delay, ...args) {
    const wrappedFunc = () => {
        return func.apply(this, args) || true;
    };
    return GLib.timeout_add(GLib.PRIORITY_DEFAULT, delay, wrappedFunc);
}

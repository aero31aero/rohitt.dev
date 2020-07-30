module.exports = {
    get_y: (u, t, a) => {
        // think class 10th physics
        // s = ut + 1/2at^2
        const cycle_time = (2 * u) / a;
        t = t % cycle_time;
        return Math.max(u * t - (a * t * t) / 2, 0); // remain positive
    },
    dumpObject: (obj, lines = [], isLast = true, prefix = '') => {
        const localPrefix = isLast ? '└─' : '├─';
        lines.push(
            `${prefix}${prefix ? localPrefix : ''}${obj.name || '*no-name*'} [${
                obj.type
            }]`
        );
        const newPrefix = prefix + (isLast ? '  ' : '│ ');
        const lastNdx = obj.children.length - 1;
        obj.children.forEach((child, ndx) => {
            const isLast = ndx === lastNdx;
            module.exports.dumpObject(child, lines, isLast, newPrefix);
        });
        return lines;
    },
};

module.exports = {
    get_y: (u, t, a) => {
        // think class 10th physics
        // s = ut + 1/2at^2
        const cycle_time = (2 * u) / a;
        t = t % cycle_time;
        return Math.max(u * t - (a * t * t) / 2, 0); // remain positive
    },
};

const fetch = require('node-fetch');
const cheerio = require('cheerio');

const root = 'https://pkgbuild.com/%7Ejelle/logo-contest';

const main = async () => {
    const $ = cheerio.load(await (await fetch(root)).text());
    const data = {};
    for (link of $('a')) {
        let href = link.attribs.href;
        if (href === '../' || href === 'submission-blank.png') {
            continue;
        }
        let new_link = `${root}/${href}`;
        const $2 = cheerio.load(await (await fetch(new_link)).text());
        const image_links = [];
        for (link of $2('a')) {
            let href = link.attribs.href;
            if (href === '../' || !href.endsWith('png')) {
                continue;
            }
            let image_link = `${new_link}${href}`;
            image_links.push(image_link);
        }
        data[href.replace('/', '')] = image_links;
    }
    return data;
};

module.exports = main;

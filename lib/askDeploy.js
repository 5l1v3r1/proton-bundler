const { logCommits } = require('./git');
const { debug, success, error, about, warn } = require('./helpers/log')('proton-bundler');

const URLS = {
    'protonmail-web': {
        prod: 'mail',
        tor: 'https://protonirockerxow.onion'
    },
    'proton-vpn-settings': {
        prod: 'account'
    }
};

const getURL = (name, env, homepage) => {
    const { [env]: scope = env } = URLS[name] || {};

    if (env === 'tor') {
        return scope;
    }

    if (homepage) {
        return homepage;
    }

    return `${scope}.${process.env.DEPLOY_MESSAGE_URL}`;
};

const generateTplURL = ({ env, name, hash, branch, homepage }) => {
    return `- *[${hash.slice(0, 10)}]*: ${getURL(name, env, homepage)}  _${branch}_`.replace(/\*\[|\]\*/g, '`');
};

async function createUrls({ branch, website, flow, name, homepage }) {
    try {
        const hashes = await logCommits(branch, flow, website);
        debug(hashes, 'log commits');
        const { output } = hashes.split('\n').reduce(
            (acc, line) => {
                const [branch, hash] = line.split(' ').filter(Boolean);
                const [, env] = branch.match(/deploy-(beta|prod|old|tor|dev|a|b)/);
                acc.output.push(generateTplURL({ env, name, hash, branch, homepage }));
                return acc;
            },
            { map: {}, output: ['Hash(es) and URL(s):'] }
        );
        return output.join('\n');
    } catch (e) {
        warn(e);
    }
}

async function main({ branch, flow, website }, { name, homepage }) {
    const urls = await createUrls({ branch, website, flow, name, homepage });

    debug(urls, 'askDeploy');
}

module.exports = main;

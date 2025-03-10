/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const fetch = require('node-fetch');
const { join } = require('path');
const cheerio = require('cheerio');
const glob = require('glob');
const uniq = require('lodash/uniq');
const { createServer } = require('http-server');
const zhCN = require('../site/theme/zh-CN');
const enUS = require('../site/theme/en-US');

const components = uniq(
  glob
    .sync('components/*/*.md', {
      ignore: '**/{__tests__,_util,version,index.tsx}',
      cwd: join(process.cwd()),
      dot: false,
    })
    .map(path => path.replace(/(\/index)?((\.zh-CN)|(\.en-US))?\.md$/i, '')),
);

describe('site test', () => {
  let server;
  const host = 3000;
  const render = async path => {
    const resp = await fetch(`http://localhost:${host}${path}`).then(async res => {
      const html = await res.text();
      const $ = cheerio.load(html, { decodeEntities: false, recognizeSelfClosing: true });
      return {
        html,
        status: res.status,
        $,
      };
    });
    return resp;
  };
  const handleComponentName = name => {
    const componentMap = {
      descriptions: 'description list',
    };
    // eslint-disable-next-line no-unused-vars
    const [_, componentName] = name.split('/');
    const compName = componentName.toLowerCase().replace('-', '');
    return componentMap[compName] || compName;
  };

  const expectComponent = async component => {
    const { status, $ } = await render(`/${component}/`);
    expect(status).toBe(200);
    expect(
      $('.markdown > h1')
        .text()
        .toLowerCase(),
    ).toMatch(handleComponentName(component));
  };

  beforeAll(() => {
    server = createServer({
      root: join(process.cwd(), '_site'),
    });
    server.listen(host);
    console.log('site static server run: http://localhost:3000');
  });

  afterAll(() => {
    if (server) {
      server.close();
    }
  });

  it('Basic Pages en', async () => {
    const { status, $ } = await render('/');
    expect($('title').text()).toEqual(`Ant Design - ${enUS.messages['app.home.slogan']}`);
    expect(status).toBe(200);
  });

  it('Basic Pages zh', async () => {
    const { status, $ } = await render('/index-cn');
    expect($('title').text()).toEqual(`Ant Design - ${zhCN.messages['app.home.slogan']}`);
    expect(status).toBe(200);
  });

  for (const component of components) {
    it(`Component ${component} zh Page`, async () => {
      await expectComponent(component);
    });

    it(`Component ${component} en Page`, async () => {
      await expectComponent(component);
    });
  }
});

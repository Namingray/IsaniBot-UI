class BaseWrapper {
  constructor() {

    this._content = {};
    this._isReady = $.Deferred();
    this._endpoints = [];
  }

  _downloadContent(type) {
    let counter = this._endpoints.length;

    if (DEBUG_FLAG) {
      this._content = {
        'css': CSS_SOURCE,
        'html': HTML_SOURCE,
        'locales': LOCALES_SOURCE
      }[type];

      this._isReady.resolve();
    }
    else {
      this._endpoints.forEach(endpoint => {
        setTimeout(() => {
          request({url: endpoint}, (error, response, body) => {
            if (!error && response.statusCode === 200) {
              this._content[endpoint.match(/([^/]+)(?=\.\w+$)/)[0]] = body.replace(/(\r\n|\n|\r)/gm, "");
            }
            counter -= 1;
            if (counter === 0) {
              this._isReady.resolve();
            }
          });
        }, 1);
      });
    }
  }

  getContent(name) {
    return this._content[name];
  }

  isReady() {
    return this._isReady;
  }
}

class CssWrapper extends BaseWrapper {
  constructor() {

    super();
    this._endpoints = [
        'http://iiss.me/discord/plugin/src/css/isaniBotUI.css'
    ];

    this._downloadContent('css');
  }
}

class HtmlWrapper extends BaseWrapper {
  constructor() {
    super();
    this._endpoints = [
        'http://iiss.me/discord/plugin/src/html/newEventPanel.html',
        'http://iiss.me/discord/plugin/src/html/settings.html'
    ];

    this._downloadContent('html')
  }
}

class LocalesWrapper extends BaseWrapper {
  constructor() {
    super();
    this._endpoints = [
        'http://iiss.me/discord/plugin/src/data/locales.json'
    ]

    this._downloadContent('locales')
  }
}
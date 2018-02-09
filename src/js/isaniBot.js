class IsaniBot {

  constructor(id) {
    try {
      this._theme = $('[class^="theme-"]').attr('class');
      this._botID = id;
      this._username = $('[class^="accountDetails-"]').find('.username').text();
      this._usernameID = $('[class^="accountDetails-"]').parent().find('.avatar-small').css('background-image').split('/')[4];
      this._guilds = null;
      this._selectedGuild = null;
      this._updateInterval = 120 * 1000;
      this._interval = null;
      this._html = new HtmlWrapper();
      this._css = new CssWrapper();
      this._locales = new LocalesWrapper();
      this._isReady = $.Deferred();

      $.when(this._locales.isReady()).then(() => {
        this._locales.setContent(JSON.parse(this._locales.getContent('locales')));
        this._locale = this._locales.getContent(navigator.language) || this._locales.getContent('default');
      });

      $.when(this._css.isReady(), this._html.isReady(), this._locales.isReady()).then(() => {
        this._injectCSS();
        this._addUpdateChannels();
      });
    }
    catch(error) {
      console.log('%c IsaniBot UI exception - ' + error.stack, 'background: #222; color: #bada55');
    }
  }

  static getEndpoints() {
    return {
      'events': 'http://iiss.me:8080/discord/events',
      'guilds': 'http://iiss.me:8080/discord/channels'
    };
  }

  isReady() {
    return this._isReady;
  }

  destroy() {
    const $elements = $('.bot-event-reg-button, .bot-event-unreg-button, .bot-event-reg-icon, .bot-event-reg-panel, .bot-event-reg-panel');
    $elements.remove();

    $(document).off("click.erb");
    $(document).off("click.erp");
  }

  _injectCSS() {
    BdApi.injectCSS('isaniBotUI', this._css.getContent('isaniBotUI'));

    if (bdPluginStorage.get('isaniBotUI', 'longChannelNames')) {
      BdApi.injectCSS('longChannelNames', this._css.getContent('longChannelNames'));
    }

    if (bdPluginStorage.get('isaniBotUI', 'titleBar')) {
      BdApi.injectCSS('titleBar', this._css.getContent('titleBar'));
      this._tweakTitleBar();
    }
  }

  _getSelectedChannel() {
    return $.grep(this._guilds[this._selectedGuild], channel => channel.channel === $('.container-1').parent().find('[class^="wrapperSelectedText"]').text() && channel.available === true);
  }

  _waitForPinnedMessages(callback) {
    if ($('.empty-placeholder').length) {
      setTimeout(() => {
        this._waitForPinnedMessages(callback);
      }, 100);
    }
    else {
      callback();
    }
  }

  _tweakTitleBar() {
    $('.guilds-wrapper').prepend($('<div class="tweakedTitleBar"></div>'))

    $('[name*="TitleBarMinimize"]').parent().prependTo('.tweakedTitleBar');
    $('[name*="TitleBarMaximize"]').parent().prependTo('.tweakedTitleBar');
    $('[name*="TitleBarClose"]').parent().prependTo('.tweakedTitleBar');
  }

  _untweakTitleBar() {
    $('.tweakedTitleBar [name*="TitleBarClose"]').parent().appendTo($('#app-mount').children().eq(0));
    $('.tweakedTitleBar [name*="TitleBarMaximize"]').parent().appendTo($('#app-mount').children().eq(0));
    $('.tweakedTitleBar [name*="TitleBarMinimize"]').parent().appendTo($('#app-mount').children().eq(0));

    $('.tweakedTitleBar').remove();
  }

  updateSettings() {
    const longChannelNamesValue = $('#longChannelNames').is(':checked');
    if (longChannelNamesValue) {
      BdApi.injectCSS('longChannelNames', this._css.getContent('longChannelNames'));
    }
    else {
      BdApi.clearCSS('longChannelNames');
    }

    bdPluginStorage.set('isaniBotUI', 'longChannelNames', longChannelNamesValue);

    const titleBarValue = $('#titleBar').is(':checked');
    if (titleBarValue) {
      BdApi.injectCSS('titleBar', this._css.getContent('titleBar'));
      this._tweakTitleBar();
    }
    else {
      BdApi.clearCSS('titleBar');
      this._untweakTitleBar();
    }

    bdPluginStorage.set('isaniBotUI', 'titleBar', titleBarValue);

    const locale = this._locales.getContent(navigator.language) || this._locales.getContent('default');
    $('#saveUpdateButton').text(locale.saved);
  }

  checkBotPresence() {
    let exist = false;
    const $selectedGuild = $('.guilds-wrapper .guilds .guild.selected');
    if ($selectedGuild.length && this._guilds) {
      const uri = $selectedGuild.find('a').attr('href');
      const match = uri.match(/\/channels\/(\d+)\/(\d+)/);
      this._selectedGuild = match[1];
      if (this._selectedGuild in this._guilds) {
        //TODO find the way to handle channels with the same name
        if (this._getSelectedChannel().length === 1) {
          exist = true;
        }
      }
    }
    return exist;
  }

  _addUpdateChannels() {
    const self = this;

    self._updateChannels = function() {
      request(IsaniBot.getEndpoints().guilds, (error, response, body) => {
        if (!error && response.statusCode === 200) {
          self._guilds = JSON.parse(body);
        } else {
          self._guilds = null;
        }
        if (this._isReady && this._isReady.state() === 'pending') {
          this._isReady.resolve();
        }
      });
    };

    self._updateChannels();
    self._interval = setInterval(self._updateChannels, self._updateInterval);
  }

  _getEventParams(event_url) {
    try {
      const params = event_url.replace('https://discordapp.com/', '');
      return JSON.parse(decodeURIComponent(params));
    }
    catch(error) {
      return null;
    }
  }

  _setRegPanelText(selector) {
    const str = selector.prop('outerHTML')
        .replace(/\{\{createEvent}}/g, this._locale.createEvent)
        .replace(/\{\{eventName}}/g, this._locale.eventName)
        .replace(/\{\{eventWhen}}/g, this._locale.eventWhen)
        .replace(/\{\{eventNum}}/g, this._locale.eventNum)
        .replace(/\{\{eventDesc}}/g, this._locale.eventDesc)
        .replace(/\{\{eventImg}}/g, this._locale.eventImg);

    return $(str);
  }

  addEventRegButtons() {
    try {
      $(document).on('click.erb', event => {
        const $target = $(event.target);
        if ($target.attr('name') === 'Pin' || $target.parent().parent().attr('name') === 'Pin') {
          this._waitForPinnedMessages(() => {
            if (this.checkBotPresence()) {
              const $pinnedEvents = $('.popouts .scroller .message-group').filter((index, event) => {
                const json = this._getEventParams($(event).find('[class^="embedTitleLink-"]').attr('href'));
                return json !== null;
              });

              $.each($pinnedEvents, (index, value) => {
                const $embedField = $(value).find('.comment .accessory').find('[class^="embedFields"]');
                const registeredUsers = $embedField.find('[class^="embedFieldValue"]').last().text().split(', ');
                const eventID = $(value).find('[class^="embedTitle"]').text().split(' ').pop();
                const $buttonReg = $('<button type="button" class="button btn-default bot-event-reg-button"></button>');
                const $buttonUnreg = $('<button type="button" class="button btn-success bot-event-unreg-button"></button>');
                const $buttonDelete = $('<button type="button" class="button bot-event-delete-button">X</button>');

                const _handler = (requestAction, button1, button2) => () => {
                  button1.attr('disabled', 'disabled');
                  request({
                    uri: IsaniBot.getEndpoints().events,
                    method: 'PUT',
                    json: {
                      "action": requestAction,
                      "channel_id": this._getSelectedChannel()[0].channel_id.toString(),
                      "event_id": eventID,
                      "user": {
                        "nickname": this._username,
                        "usr_id": this._usernameID
                      }
                    }
                  }, (error, response, body) => {
                    button1.removeAttr('disabled');
                    if (!error && response.statusCode === 200) {
                      if (body.status) {
                        button2.show();
                        button1.hide();
                      }
                    }
                  });
                };

                $buttonReg
                    .text(this._locale.subscribe)
                    .click(_handler('join', $buttonReg, $buttonUnreg));

                $buttonUnreg
                    .text(this._locale.subscribed)
                    .mouseover(() => {
                      $buttonUnreg.text(this._locale.unsubscribe);
                    })
                    .mouseleave(() => {
                      $buttonUnreg.text(this._locale.subscribed);
                    })
                    .click(_handler('part', $buttonUnreg, $buttonReg));

                $buttonDelete.click(() => {
                  $('.bot-event-delete-button').attr('disabled', '');

                  request({
                    uri: IsaniBot.getEndpoints().events,
                    method: 'DELETE',
                    json: {
                      "channel_id": this._getSelectedChannel()[0].channel_id.toString(),
                      "event_id": eventID,
                      "user": {
                        "nickname": this._username,
                        "usr_id": this._usernameID
                      }
                    }
                  }, () => {
                    $('.bot-event-delete-button').removeAttr('disabled');
                  });
                });

                $(value).find('.action-buttons').remove();

                const eventData = this._getEventParams($(value).find('[class^="embedTitleLink-"]').attr('href'));
                const id = parseInt(this._usernameID);

                if (eventData && (id === eventData.author_id || eventData.admins.indexOf(id) !== -1)) {
                  $(value).find('.comment').append($buttonDelete);
                  $buttonReg.css('right', '53px');
                  $buttonUnreg.css('right', '53px');
                }

                if (!$(value).find('.comment .body').length) {
                  $buttonReg.addClass('compact-button');
                  $buttonUnreg.addClass('compact-button');
                  $buttonDelete.addClass('compact-button');

                  $buttonReg.css('right', '49px');
                  $buttonUnreg.css('right', '49px');
                  $(value).find('.accessory').css('margin-top', '7px');
                }

                $(value).find('.comment').append($buttonReg).append($buttonUnreg);

                if ($.inArray(this._username, registeredUsers) === -1) {
                  $buttonReg.show();
                  $buttonUnreg.hide();
                }
                else {
                  $buttonUnreg.show();
                  $buttonReg.hide();
                }
              });
            }
          });
        }
      });
    }
    catch(error) {
      console.log('%c IsaniBot UI exception - addEventRegButtons - ' + error.stack, 'background: #222; color: #bada55');
    }
  }

  addEventRegPanel() {
    try {
      const $button = $('<button type="button" class="bot-event-reg-icon"></button>');

      let $panel = $(this._html.getContent('newEventPanel'));

      $panel = this._setRegPanelText($panel);

      $('#app-mount .platform-win .app').append($('<div></div>').addClass(this._theme).append($panel));

      const _setIconState = () => {
        if (this.checkBotPresence()) {
          $button.removeClass('disabled-image').removeAttr('disabled');
        }
        else {
          $button.addClass('disabled-image').attr('disabled', 'disabled');
        }
      };

      const _createButton = () => {
        $button.click(event => {

          const $panel = $('.bot-event-reg-panel');

          if ($('.bot-event-reg-panel').css('display') === 'none') {
            $panel.show();
            $panel.css({
              'top': '43px',
              'left': ($('body').width() - 238) + 'px'
            });
          }
          else {
            $panel.hide();
            $(".server-response").text('');
          }
          event.stopImmediatePropagation();
        });

        $(".chat").find('[class^="titleWrapper"]').children().eq(0).children().eq(2).prepend($button);
      };

      const _guildClickLogic = (event) => {
        setTimeout(() => {
          if (event && $(event.target).is('div')) {
            $('.scroller.guilds').find('.guild').click((event) => _guildClickLogic(event));
          }
          if (!$('.bot-event-reg-icon').length) {
            _createButton();
          }
          $('.scroller.guild-channels').find('.channel-text').click(() => {
            setTimeout(() => {
              _setIconState();
            }, 100);
          });
          _setIconState();

          //TODO check other possible channel states
          $('[class^="containerDefault-"]').find('[class^="wrapperSelectedText-"], [class^="wrapperDefaultText-"], [class^="wrapperMutedText-"]').click(() => {
            setTimeout(() => {
              _setIconState();
            }, 100)
          });
        }, 100);
      };

      _createButton();
      _guildClickLogic();

      $('.scroller.guilds').find('.guild').click((event) => _guildClickLogic(event));

      $(document).on('click.erp', event => {
        const $panel = $('.bot-event-reg-panel');
        const $icon = $('.bot-event-reg-icon');

        if (!$panel.is(event.target) && !$panel.has(event.target).length && !$icon.is(event.target)) {
          $panel.hide();
          $(".server-response").text('');
        }
      });

      $('.bot-create-event-button').click(() => {
        $('.bot-create-event-button').attr('disabled', '');
        const eventName = $(".textarea-title").val();
        const at = $(".textarea-time").val();
        const part = parseInt($(".textarea-amount").val());
        const desc = $(".textarea-desc").val();
        const imgURL = $(".textarea-image").val();

        try {
          if (eventName.length > 30) {
            throw this._locale.eventNameErrorMore;
          }
          if (eventName.length < 2) {
            throw this._locale.eventNameErrorLess;
          }
          if (at && at.length > 30) {
            throw this._locale.eventTimeErrorMore;
          }
          if (at && at.length < 2) {
            throw this._locale.eventTimeErrorLess;
          }
          if (isNaN(part)) {
            throw this._locale.eventPartErrorNaN;
          }
          if (part > 20) {
            throw this._locale.eventPartErrorMore;
          }
          if (part < 1) {
            throw this._locale.eventPartErrorLess;
          }
          if (desc && desc.length > 300) {
            throw this._locale.eventDescErrorMore;
          }
          if (desc && desc.length < 2) {
            throw this._locale.eventDescErrorLess;
          }
          if (imgURL && !/^http[s]?:\/\/(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\(\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+\.(?:jpg|jpeg|png|gif)$/.test(imgURL)) {
            throw this._locale.eventURLError;
          }

          request({
            uri: IsaniBot.getEndpoints().events,
            method: 'POST',
            json: {
              "channel_id": this._getSelectedChannel()[0].channel_id.toString(),
              "event_name": eventName,
              "at": at,
              "part": part,
              "desc": desc,
              "img_url": imgURL,
              "user": {
                "nickname": this._username,
                "usr_id": this._usernameID
              }
            }
          }, (error, response, body) => {
            if (!error && response.statusCode === 200) {
              if (body.status) {
                $('.bot-event-reg-panel').find('textarea').val('');
                $(".server-response").text(this._locale.eventSuccess);
              }

              setTimeout(() => {
                $('.bot-create-event-button').removeAttr('disabled');
              }, 5000);
            }
            else {
              $(".server-response").text(body);
              $('.bot-create-event-button').removeAttr('disabled');
            }
          });
        }
        catch (error) {
          $(".server-response").text(error);
          $('.bot-create-event-button').removeAttr('disabled');
        }
      });
    }
    catch(error) {
      console.log('%c IsaniBot UI exception - addEventRegPanel - ' + error.stack, 'background: #222; color: #bada55');
    }
  }
}
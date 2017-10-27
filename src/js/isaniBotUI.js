let isaniBot = null;

const getName = () => 'isani-bot UI';

const getDescription = () => 'Extends default discord UI with isani-bot functionality';

const getVersion = () => '1.0.0';

const getAuthor = () => 'Namingray';

const onMessage = () => {};

const onSwitch = () => {}

const getSettingsPanel = () => {
  const locales = {
    'ru-RU': {
      longChannelNames: 'Показывать полностью длинные имена голосовых каналов',
      titleBar: 'Скрыть верхнюю полосу',
      updateSettings: 'Сохранить и обновить'
    },
    'default': {
      longChannelNames: 'Show full names of voice channels',
      titleBar: 'Hide top title bar',
      updateSettings: 'Save & Update'
    }
  }

  const locale = locales[navigator.language] || locales.default;

  const getTemplate = (saved_locale) => `
    <div style="background: #292b2f; color: #f6f6f7; margin-top: -15px">
        <label style="color: #7289da">UI</label>
        <hr style="border-color: #7289da">
        
        <form>
          <div>
            <input type="checkbox" onchange="(() => { $('#saveUpdateButton').text('${saved_locale}'); })()"
                   id="longChannelNames" ${bdPluginStorage.get('isaniBotUI', 'longChannelNames') ? 'checked' : ''}>
            <label for="longChannelNames">${locale.longChannelNames}</label>
          </div>
        </form>
        
        <form>
          <div>
            <input type="checkbox" onchange="(() => { $('#saveUpdateButton').text('${saved_locale}'); })()"
                   id="titleBar" ${bdPluginStorage.get('isaniBotUI', 'titleBar') ? 'checked' : ''}>
            <label for="titleBar">${locale.titleBar}</label>
          </div>
        </form>
        
        <br/><br/>
        <button id="saveUpdateButton" class="discord-settings-btn" style="float: right" onclick="isaniBot.updateSettings()">${locale.updateSettings}</button>
      </div>
  `

  return getTemplate(locale.updateSettings);
}

const load = () => {
  isaniBot = new IsaniBot('215243788162039809');
};

const unload = () => {};

const start = () => {
  $.when(isaniBot.isReady()).then(() => {
    isaniBot.addEventRegButtons();
    isaniBot.addEventRegPanel();
  });
};

const stop = () => {
  isaniBot.destroy();
};

module.exports = {
  getName,
  getDescription,
  getVersion,
  getAuthor,
  onMessage,
  onSwitch,
  getSettingsPanel,
  load,
  unload,
  start,
  stop
}
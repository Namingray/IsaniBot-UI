module.exports = function(grunt) {

  grunt.initConfig({
    concat: {
      dev : {
        src: [
          'dev/pluginDummy.js',
          'dev/tmp/*',
          'src/js/*',
        ],
        dest: 'dev/isaniBotUI.plugin.js'
      }
    },
    'file-creator': {
      dev: {
        'dev/tmp/html.js': (fs, fd, done) => {
          const HTML_PATH = 'src/html/';
          const html_source = {};
          const files = fs.readdirSync(HTML_PATH);

          files.forEach(file => {
            html_source[file.match(/([^/]+)(?=\.\w+$)/)[0]] = fs.readFileSync(HTML_PATH + file, 'utf8');
          });

          fs.writeSync(fd, 'const HTML_SOURCE = ' + JSON.stringify(html_source));
          done();
        },
        'dev/tmp/css.js': (fs, fd, done) => {
          const CSS_PATH = 'src/css/';
          const css_source = {};
          const files = fs.readdirSync(CSS_PATH);

          files.forEach(file => {
            css_source[file.match(/([^/]+)(?=\.\w+$)/)[0]] = fs.readFileSync(CSS_PATH + file, 'utf8');
          });

          fs.writeSync(fd, 'const CSS_SOURCE = ' + JSON.stringify(css_source));
          done();
        },
        'dev/tmp/locales.js': (fs, fd, done) => {
          const LOCALES_PATH = 'src/data/locales.json';
          const locales_source = {};

          locales_source.locales = fs.readFileSync(LOCALES_PATH, 'utf8');

          fs.writeSync(fd, 'const LOCALES_SOURCE = ' + JSON.stringify(locales_source));
          done();
        }
      }
    },
    clean: {
      dev: {
        src: ['dev/tmp/*', 'dev/tmp/']
      }
    }
  })

  grunt.loadNpmTasks('grunt-file-creator');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');

  grunt.registerTask('dev', [
    'file-creator:dev',
    'concat:dev',
    'clean:dev'
  ]);
};

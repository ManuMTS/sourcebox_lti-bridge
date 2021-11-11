const _ = require('lodash');
const $ = require('jquery');
const EventEmitter = require('events');
const getSlug = require('speakingurl');
require('jstree/dist/jstree');

/**
 * Klasse, welchen den Dateibaum eines Workspace händelt
 */
class Filetree extends EventEmitter {
  /**
   * Initiert einen Dateibaum
   * @param {Object} files Objekt mit Dateinamen als Keys und Inhalt als Values.
   */
  constructor(files) {
    if (!_.isObject(files)) {
      throw new Error('Filetree constructor: invalid parameter exception');
    }
    super();
    const self = this;
    this.files = files;
    const filetreeFiles = [];
    _.each(this.files, (file, filename) => {
      const filenameClear = getSlug(filename);
      filetreeFiles.push({
        text: filename,
        id: `${filenameClear}_tree`,
        state: {},
        icon: 'fa fa-file',
      });
    });
    if (filetreeFiles.length > 0) {
      filetreeFiles[0].state.opened = true;
      filetreeFiles[0].state.selected = true;
    }
    $('#treecontainer').jstree({
      core: {
        check_callback: true,
        data: [
          {
            text: globalOptions.projectName,
            id: 'project_root',
            icon: 'fa fa-folder',
            state: {
              opened: true,
            },
            children: filetreeFiles,
          },
        ],
      },
      plugins: ['contextmenu', 'unique'],
      contextmenu: {
        items($node) {
          if ($node.id === 'project_root') {
            return {
              Create: {
                label: 'New',
                action() {
                  self.newFile();
                },
              },
            };
          }
          return {
            Create: {
              label: 'New',
              action() {
                self.newFile();
              },
            },
            Rename: {
              label: 'Rename',
              action() {
                self.rename();
              },
            },
            Delete: {
              label: 'Remove',
              action() {
                self.remove();
              },
            },
          };
        },
      },
    })
      .bind('select_node.jstree', (event, data) => {
        const filenameClear = getSlug(data.node.text);
        const link = $(`a[href="#${filenameClear}"]`);
        if (filenameClear && link) {
          link.tab('show');
        }
      })
      .bind('rename_node.jstree', (event, data) => {
        if (!data.text || data.text.length === 0) {
          data.instance.rename_node(data.node, data.old);
          data.instance.set_id(data.node, `${getSlug(data.old)}_tree`);
          return;
        }
        const filenameClear = getSlug(data.text);
        data.instance.set_id(data.node, `${filenameClear}_tree`);
        if (data.old) {
          this.emit('fileRenamed', data);
        } else {
          let html = `<li>
  <a href="#${filenameClear}" role="tab" data-toggle="tab">${data.text}</a>
</li>`;
          $('#fileTabs').append(html);

          html = `<div class="tab-pane" id="${filenameClear}" data-id="${data.text}">
<h4>
  <span class="fa fa-file"></span> <span class="title">${data.text}</span>
</h4>
<div class="btn-group" role="group">
  <button class="btn btn-default btn-xs undo" type="button" data-id="${data.text}" disabled>
    <span class="fa fa-rotate-left"></span> Undo
  </button>
  <button class="btn btn-default btn-xs redo" type="button" data-id="${data.text}" disabled>
    <span class="fa fa-rotate-right"></span> Redo
  </button>
  <button class="btn btn-default btn-xs search" type="button" data-id="${data.text}">
    <span class="fa fa-search"></span> Search
  </button>
  <button class="btn btn-default btn-xs replace" type="button" data-id="${data.text}">
    <span class="fa fa-exchange"></span> Replace
  </button>
</div>
<div class="editor" id="${filenameClear}_editor"></div>`;
          $('#fileTabsContent').append(html);
          this.emit('fileAdded', data);
        }
      })
      .bind('delete_node.jstree', (event, data) => {
        if (data.node.text.length > 0) {
          const filenameClear = getSlug(data.node.text);
          $(`a[href="#${filenameClear}"]`).parent().remove();
          $(`#${filenameClear}`).remove();
          this.emit('fileRemoved', data);
        }
      });
    this.jstree = $('#treecontainer').jstree();
  }

  /**
   * Erstellt eine neue Datei
   * @return {undefined}
   */
  newFile() {
    const nrOfFiles = Object.keys(this.files).length;
    if (nrOfFiles < globalOptions.maxNumberOfFiles) {
      const newNode = this.jstree.create_node('project_root', {
        text: '',
        icon: 'fa fa-file',
      });
      this.jstree.edit(newNode);
    }
  }

  /**
   * Nennt die aktuell gewählte Datei um
   * @return {undefined}
   */
  rename() {
    const selected = this.jstree.get_selected();
    if (selected) {
      this.jstree.edit(selected);
    }
  }

  /**
   * Löscht die aktuell gewählte Datei
   * @return {undefined}
   */
  remove() {
    const selected = this.jstree.get_selected();
    if (selected) {
      this.jstree.delete_node(selected);
    }
  }

  /**
   * Setzt Status des Editors abhängig vom Zustandsautomat
   * @param {String} state Zeichenkette des aktuellen Zustandes
   * @return {undefined}
   */
  setState(state) {
    if (!_.isString(state)) {
      throw new Error('Filetree setState: invalid parameter exception');
    }
    this.state = state;
    switch (this.state) {
      case 'unsaved':
      case 'saving':
        $('#project_root_anchor').addClass('unsaved');
        break;
      default:
        $('#project_root_anchor').removeClass('unsaved');
    }
  }

  /**
   * Setzt die Annotationen vom Kompiler im Dateibaum
   * @param {Object} annotations Objekt mit allen Annotationen
   * @return {undefined}
   */
  setAnnotations(annotations) {
    if (!_.isObject(annotations)) {
      throw new Error('Filetree setAnnotations: invalid parameter exception');
    }
    _.each(this.files, (file, filename) => {
      const filenameClear = getSlug(filename);
      const annotation = annotations[filename];
      if (annotation && annotation.filter(element => (element.type === 'error')).length > 0) {
        $(`#${filenameClear}_tree_anchor`).addClass('hasError');
        $(`#${filenameClear}_tree_anchor`).removeClass('hasWarning');
        $(`#${filenameClear}_tree_anchor .fa`).removeClass('fa-file');
        $(`#${filenameClear}_tree_anchor .fa`).addClass('fa-window-close');
        $(`#${filenameClear}_tree_anchor .fa`).removeClass('fa-exclamation-triangle');
      } else if (annotation && annotation.filter(element => (element.type === 'warning')).length > 0) {
        $(`#${filenameClear}_tree_anchor`).removeClass('hasError');
        $(`#${filenameClear}_tree_anchor`).addClass('hasWarning');
        $(`#${filenameClear}_tree_anchor .fa`).removeClass('fa-file');
        $(`#${filenameClear}_tree_anchor .fa`).removeClass('fa-window-close');
        $(`#${filenameClear}_tree_anchor .fa`).addClass('fa-exclamation-triangle');
      } else {
        $(`#${filenameClear}_tree_anchor`).removeClass('hasError');
        $(`#${filenameClear}_tree_anchor`).removeClass('hasWarning');
        $(`#${filenameClear}_tree_anchor .fa`).addClass('fa-file');
        $(`#${filenameClear}_tree_anchor .fa`).removeClass('fa-window-close');
        $(`#${filenameClear}_tree_anchor .fa`).removeClass('fa-exclamation-triangle');
      }
    });
  }
}

exports = Filetree;
module.exports = exports;

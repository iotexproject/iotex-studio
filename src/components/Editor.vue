<template lang="pug">
  div.h-full.w-full
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from "vue-property-decorator";
import ace, { edit } from "brace";
import { Sync, Get } from "vuex-pathify";
import { eventBus } from "../utils/eventBus";
import { _ } from "../utils/lodash";
import solcjs from "solc-js";
import { Helper } from "../utils/helper";
import { EditorStore } from "../store/type";
import jsBeautify from "js-beautify";

@Component
export default class Editor extends Vue {
  @Sync("editor/solc") solc: EditorStore["solc"];
  @Sync("editor/ace@editor") editor: ace.Editor;
  @Sync("editor/ace@theme") theme: string;
  @Sync("editor/ace@lang") lang: string;
  @Sync("editor/ace@options") options: any;
  @Sync("editor/ace@content") content: string;
  @Sync("storage/fileManager@curFilePath") curFilePath: string;
  @Sync("editor/fileManager@files") files: EditorStore["fileManager"]["files"];
  @Get("editor/curFile") curFile: EditorStore["fileManager"]["file"];

  mounted() {
    this.initAceEditor();
    eventBus
      .on("menubar.undo", () => {
        this.editor.undo();
      })
      .on("menubar.redo", () => {
        this.editor.redo();
      });
    // .on("editor.save", () => {
    //   const content = jsBeautify(this.curFile.content, { indent_size: 4, space_before_conditional: false, space_in_empty_paren: false, space_after_anon_function: false });
    //   this.editor.session.setValue(content);
    // });
  }
  beforeDestory() {
    this.editor.destroy();
    this.editor.container.remove();
  }

  initAceEditor() {
    const { lang, theme, options, curFilePath } = this;
    const editor = (this.editor = ace.edit(this.$el as HTMLElement));
    editor.$blockScrolling = Infinity;
    editor.setShowPrintMargin(false);

    this.$emit("init", editor);
    eventBus.emit("editor.init", editor);

    editor.getSession().setMode(`ace/mode/${lang}`);
    require(`brace/theme/${theme}`);

    editor.setTheme(`ace/theme/${theme}`);

    this.oncurFilePathNameChange();

    editor.on("change", () => {
      const content = editor.getValue();
      this.content = content;
      eventBus.emit("editor.content.update", this.content);
    });
    if (this.options) {
      editor.setOptions(options);
    }
  }

  @Watch("theme")
  onThemeChange(val) {
    this.editor.setTheme(`ace/theme/${val}`);
  }

  @Watch("lang")
  onLangChange(val) {
    this.editor.getSession().setMode(`ace/theme/${val}`);
  }

  @Watch("options")
  onOptionsChange(val) {
    this.editor.setOptions(val);
  }

  @Watch("style")
  onLayoutChange(val) {
    this.$nextTick(() => {
      this.editor.resize();
    });
  }

  @Watch("curFile")
  oncurFilePathNameChange() {
    if (!this.curFile) return;
    this.editor.session.setValue(this.curFile.content);
  }
}
</script>

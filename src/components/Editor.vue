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
import { EditorStore } from "../store/editor";

@Component
export default class Editor extends Vue {
  @Sync("editor/solc") solc: EditorStore["solc"];
  @Sync("editor/ace@editor") editor: ace.Editor;
  @Sync("storage/ace@theme") theme: string;
  @Sync("storage/ace@lang") lang: string;
  @Sync("storage/ace@options") options: any;
  @Sync("storage/ace@content") content: string;
  @Sync("storage/curProject@fileManager.curFilePath") curFilePath: string;
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

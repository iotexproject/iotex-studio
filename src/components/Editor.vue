<template lang="pug">
  div(:style="{height: height, width: width}")
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

@Component
export default class Editor extends Vue {
  @Prop({ type: String }) height: string;
  @Prop({ type: String }) width: string;

  @Sync("editor/solc") solc: EditorStore["solc"];
  @Sync("editor/ace@editor") editor: ace.Editor;
  @Sync("editor/ace@theme") theme: string;
  @Sync("editor/ace@lang") lang: string;
  @Sync("editor/ace@options") options: any;

  @Sync("editor/fileManager@curFilePath") curFilePath: string;
  @Sync("editor/fileManager@files") files: EditorStore["fileManager"]["files"];

  @Get("editor/curFile") curFile: EditorStore["fileManager"]["file"];

  mounted() {
    this.initAceEditor();
  }
  beforeDestory() {
    this.editor.destroy();
    this.editor.container.remove();
  }

  initAceEditor() {
    const { lang, theme, options, curFilePath } = this;
    const editor = (this.editor = ace.edit(this.$el as HTMLElement));
    editor.$blockScrolling = Infinity;

    this.$emit("init", editor);
    eventBus.emit("editor.init", editor);

    editor.getSession().setMode(`ace/mode/${lang}`);
    editor.setTheme(`ace/theme/${theme}`);

    if (this.curFilePath) {
      if (!this.curFile) return;
      this.editor.session.setValue(this.curFile.content);
    }

    editor.on("change", () => {
      const content = editor.getValue();
      eventBus.emit("editor.content.update", content);
    });
    if (this.options) {
      editor.setOptions(options);
    }
  }

  @Watch("value")
  onValueChange(val) {
    this.editor.session.setValue(val);
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

  @Watch("width")
  @Watch("height")
  onLayoutChange(val) {
    this.$nextTick(() => {
      this.editor.resize();
    });
  }

  @Watch("curFilePath")
  oncurFilePathNameChange() {
    this.editor.session.setValue(this.curFile.content);
  }
}
</script>

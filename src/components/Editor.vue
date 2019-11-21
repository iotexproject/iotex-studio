<template lang="pug">
  div(:style="{height: height, width: width}")
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from "vue-property-decorator";
import ace, { edit } from "brace";
import { EditorStore } from "../store/editor";
import { Sync } from "vuex-pathify";
import { eventBus } from "../utils/eventBus";
import { _ } from "../utils/lodash";
import solcjs from "solc-js";
import { Helper } from "../utils/helper";

@Component
export default class Editor extends Vue {
  @Prop({ type: String }) height: string;
  @Prop({ type: String }) width: string;
  @Prop({ type: String, default: "text" }) lang: string;
  @Prop({ type: String, default: "chrome" }) theme: string;
  @Prop({ type: Object }) options: any;

  @Sync("editor/content")
  content: string;

  @Sync("editor/solc")
  solc: EditorStore["solc"];

  editor: ace.Editor = null;

  created() {
    eventBus.$on("solc:compile", () => {
      this.compile();
    });
  }

  mounted() {
    this.initAceEditor();
    this.initBrowserSolc();
  }
  beforeDestory() {
    this.editor.destroy();
    this.editor.container.remove();
  }

  async compile() {
    const [errs, result] = await Helper.runAsync(this.solc.compiler(this.content, 1));
    this.editor.session.clearAnnotations();
    if (errs) {
      this.editor.session.setAnnotations(
        errs.map(err => {
          const [m] = err.formattedMessage.match(/\d+:\d+/);
          const [row, column] = m.split(":");
          return {
            type: "error",
            text: err.formattedMessage,
            row: row - 1,
            column
          };
        })
      );
      return;
    }

    const compileResult = _.keyBy(result, "name");
    this.solc = { ...this.solc, ...{ compileResult, currentContract: _.get(result, "0") } };
    this.$emit("compile", compileResult);
    eventBus.$emit("solc:compiled", compileResult);
  }

  async initBrowserSolc() {
    const versions = await solcjs.versions();
    this.solc = { ...this.solc, ...{ versions } };

    await this.onSolcVersionChange();
  }

  initAceEditor() {
    const { lang, theme, options } = this;
    const editor = (this.editor = ace.edit(this.$el as HTMLElement));
    editor.$blockScrolling = Infinity;

    this.$emit("init", editor);

    editor.getSession().setMode(`ace/mode/${lang}`);
    editor.setTheme(`ace/theme/${theme}`);
    if (this.content) {
      editor.setValue(this.content, 1);
    }

    editor.on("change", () => {
      const content = editor.getValue();
      this.content = content;
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

  @Watch("solc.version")
  async onSolcVersionChange(val = this.solc.version) {
    this.solc = { ...this.solc, ...{ loading: true } };
    const compiler = await solcjs(val);
    this.solc = { ...this.solc, ...{ compiler, loading: false } };
  }
}
</script>

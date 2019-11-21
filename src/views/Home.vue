<template lang="pug">
  div.flex.justify-center
    compiler
    editor(ref="editor" height='70vh' width='70vw' lang="solidity" theme="chrome" @init="editorInit" )
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import Editor from "../components/Editor.vue";
import { Sync } from "vuex-pathify";
import { eventBus } from "../utils/eventBus";

@Component
export default class Home extends Vue {
  editorInit() {
    require("brace/ext/language_tools");
    require("brace/mode/javascript");
    require("brace/theme/chrome");
    require("ace-mode-solidity/build/remix-ide/mode-solidity");
    require("brace/snippets/javascript");
  }
}
</script>

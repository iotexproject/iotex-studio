<template lang="pug">
  div.flex.justify-center
    compiler
    editor.ml-4(ref="editor" height='70vh' width='70vw')
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";

@Component
export default class Home extends Vue {}
</script>

<template lang="pug">

  .file-manager.flex.flex-col.relative(v-contextmenu:contextmenu)
    div
      .file(v-for="item in files" :key="item.path" :class="{'bg-gray-500': item.path == curFilePath}" @click.prevent="curFilePath = item.path") 
        span {{item.name}}
    v-contextmenu(ref="contextmenu")
      v-contextmenu-item Create new file
      v-contextmenu-item(disabled) Rename file
      v-contextmenu-item(disabled) Delete file

</template>

<script lang="ts">
import { Vue, Component, Watch } from "vue-property-decorator";
import git from "isomorphic-git";
import { FS, fs } from "../utils/fs";
import { defaultContract } from "../utils/constant";
import { Sync, Get } from "vuex-pathify";
import { EditorStore } from "../store/type";
import { _ } from "../utils/lodash";
import { eventBus } from "../utils/eventBus";

//@ts-ignore
BrowserFS.configure({ fs: "LocalStorage" }, e => {
  if (e) console.error(e);
});
@Component
export default class FileManager extends Vue {
  WriteFileType: Partial<{ path: string; content: string; ensure?: boolean }>;
  @Sync("editor/fileManager@curDir") curDir: string;
  @Sync("editor/fileManager@curFilePath") curFilePath: string;
  @Sync("editor/fileManager@defaultFiles") defaultFiles: EditorStore["fileManager"]["defaultFiles"];
  @Sync("editor/fileManager@files") files: EditorStore["fileManager"]["files"];
  @Get("editor/curFileIndex") curFileIndex: number;

  fileManager: FS = new FS({});

  async created() {
    eventBus.on("editor.init", async () => {
      await this.initProject();
      await this.loadFiles();
    });

    eventBus.on("editor.content.update", async content => {
      this.files[this.curFileIndex].content = content;
      await this.writeFile({ path: this.curFilePath, content });
    });
  }

  async initProject() {
    const { curDir } = this;
    const exists = await this.fileManager.ensureDir(curDir);
    if (exists) return;
    await this.writeFiles(this.defaultFiles);
  }

  async loadFiles() {
    const { curDir } = this;
    const files = await this.fileManager.list(curDir);
    this.files = files;
    this.curFilePath = localStorage.getItem("curFilePath") || files[0].path;
  }

  async writeFile({ path, content, ensure = false }: FileManager["WriteFileType"]) {
    if (ensure) {
      return this.fileManager.ensureWrite(path, content);
    }
    return this.fileManager.writeFile(path, content);
  }
  async writeFiles(files: FileManager["WriteFileType"][]) {
    return Promise.all(files.map(file => this.writeFile(file)));
  }

  @Watch("curFilePath")
  oncurFilePathChange() {
    localStorage.setItem("curFilePath", this.curFilePath);
  }
}
</script>

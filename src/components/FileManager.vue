<template lang="pug">

  .file-manager.flex.flex-col.relative(v-contextmenu:contextmenu)
    .flex.flex-col
      .file(
        v-for="item in files" 
        :key="item.path" 
        :class="{'bg-gray-500': item.path == curFilePath}" 
        @click.prevent="curFilePath = item.path" 
        @mouseover="mouseoverFile(item)" 
        ) 
        span {{item.name}}
    v-contextmenu(ref="contextmenu" @hide="onContextMenuHide")
      v-contextmenu-item(@click="createFileForm.visible = true") Create new file
      v-contextmenu-item(:disabled="!cursor.isFile") Rename file
      v-contextmenu-item(:disabled="!cursor.isFile" @click="deleteFile") Delete file

    el-dialog( :visible.sync="createFileForm.visible" title="Create new File" width="30%")
      el-form(:model="createFileForm" ref="createFileForm" :rules="createFileForm.rules" v-if="createFileForm.visible")
        el-form-item(prop="name" )
          el-input(v-model="createFileForm.name"  autofocus placeholder="file name")
      span(slot="footer")
        el-button(@click="createFileForm.visible= false") Cancel
        el-button(type="primary" @click="createNewFile") Confirm

    

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
import { debounce } from "helpful-decorators";
import { Helper } from "../utils/helper";

//@ts-ignore
BrowserFS.configure(
  {
    fs: "MountableFileSystem",
    options: {
      "/": { fs: "IndexedDB", options: {} },
      "/tmp": { fs: "InMemory" }
    }
  },
  e => {
    if (e) console.error(e);
    eventBus.emit("fs.ready");
  }
);
@Component
export default class FileManager extends Vue {
  WriteFileType: Partial<{ path: string; content: string; ensure?: boolean }>;
  @Sync("editor/fileManager@curDir") curDir: string;
  @Sync("editor/fileManager@curFilePath") curFilePath: string;
  @Sync("editor/fileManager@defaultFiles") defaultFiles: EditorStore["fileManager"]["defaultFiles"];
  @Sync("editor/fileManager@files") files: EditorStore["fileManager"]["files"];

  fileManager: FS = new FS({});

  cursor: {
    isFile: boolean;
    file: EditorStore["fileManager"]["file"];
  } = {
    isFile: false,
    file: null
  };

  createFileForm = {
    visible: false,
    name: "",
    rules: { name: [{ required: true }] }
  };

  @debounce(100)
  mouseoverFile(item) {
    this.cursor = {
      isFile: true,
      file: item
    };
  }

  onContextMenuHide() {
    this.cursor = {
      isFile: false,
      file: null
    };
  }

  async initProject() {
    const { curDir } = this;
    const exists = await this.fileManager.ensureDir(curDir);
    if (exists) return;
    await this.writeFiles(this.defaultFiles);
  }

  async createNewFile() {
    //@ts-ignore
    this.$refs.createFileForm.validate(async valid => {
      if (!valid) return;
      const { name } = this.createFileForm;
      const { curDir } = this;
      const fileName = name.replace(".sol", "") + ".sol";
      await this.writeFile({ path: `${curDir}/${fileName}`, content: "" });
      this.loadFiles();

      this.createFileForm = {
        ...this.createFileForm,
        visible: false,
        name: ""
      };
    });
  }

  async deleteFile() {
    const { file } = this.cursor;
    if (!file) return;

    const [err] = await Helper.runAsync(
      this.$msgbox({
        title: "Delete a file",
        message: "Are you sure you want to delete this file?",
        showCancelButton: true,
        confirmButtonText: "OK"
      })
    );
    if (err) return;

    await fs.promises.unlink(file.path);
    await this.loadFiles();
  }

  async loadFiles() {
    const { curDir } = this;
    let files = await this.fileManager.list(curDir);
    files = _.orderBy(files, "name", "asc");
    this.files = _.keyBy(files, "path");
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

  async beforeCreate() {
    eventBus.on("fs.ready", async () => {
      await this.initProject();
      await this.loadFiles();
    });

    eventBus.on("editor.content.update", async content => {
      this.files[this.curFilePath].content = content;
      await this.writeFile({ path: this.curFilePath, content });
    });
  }
}
</script>

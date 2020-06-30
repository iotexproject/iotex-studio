<template lang="pug">
  .file-manager.flex.flex-col.relative
    p.pt-1.pb-2.text-sm.font-bold.ml-4.flex.items-center
      span FILE EXPLORERS
      span.px-4.cursor-pointer(style="margin-left: auto" @click="handleLinkLocalhost")
        i.el-icon-link(title="link sharefolder" :class="['hover:text-grey-400', curLinkStatus=='connected' &&'text-teal-400', curLinkStatus == 'failed' && 'text-red-400' ]")
    .file-explorer.flex.flex-col.flex-1
      el-tree(:data="filesLoaded" ref="tree" node-key="path" highlight-current default-expand-all :props="{label: 'name'}" @node-click="handleNodeClick" @node-contextmenu="handleNodeContextMenu")
        div.custom-tree-node.w-full.h-full.px-4(slot-scope="{node, data}" v-contextmenu:contextmenu)
          div.el-tree-node_label.h-full
            el-icon(:class="[node.expanded? 'el-icon-folder-opened' : 'el-icon-folder']" v-if="data.isDir")
            el-icon.el-icon-document(v-if="!data.isDir")
            el-input.edit-name(v-model="data.editName" v-if="data.edit" v-focus :placeholder="data.name" @blur="renameFile" @keyup.enter.native="renameFile")
            span.ml-2.text-sm.select-none(v-else) {{data.name}}
      .space.h-full(v-contextmenu:contextmenu)
    v-contextmenu(ref="contextmenu" @hide="onContextMenuHide")
      v-contextmenu-item(v-if="!cursor.file || cursor.isDir" @click="showCreateNewFile(cursor.file, 'file')") New File
      v-contextmenu-item(v-if="!cursor.file || cursor.isDir"  @click="showCreateNewFile(cursor.file, 'dir')") New Folder
      v-contextmenu-item(v-if="cursor.file" @click="startRenameFile(cursor.file)") Rename
      v-contextmenu-item(v-if="cursor.file" @click="deleteFile") Delete
    el-dialog(:visible.sync="createFileForm.visible" title="Create new File" width="30%")
      el-form(:model="createFileForm" ref="createFileForm" :rules="createFileForm.rules" v-if="createFileForm.visible" @submit.native.prevent)
        el-form-item(prop="name")
          el-input(v-model="createFileForm.name" v-focus placeholder="file name" @keyup.enter.native="createNewFile")
      span(slot="footer")
        el-button(@click="createFileForm.visible= false") Cancel
        el-button(type="primary" @click="createNewFile") Confirm

    

</template>

<script lang="ts">
import { Vue, Component, Watch } from "vue-property-decorator";
import { FS, fs } from "@/utils/fs";
import { defaultContract } from "@/utils/constant";
import { Sync, Get } from "vuex-pathify";
import { _ } from "@/utils/lodash";
import { eventBus } from "@/utils/eventBus";
import { debounce } from "helpful-decorators";
import * as path from "path";
import { sf } from "../utils/sharefolder";
import { EditorStore } from "../store/editor";
import { app } from "../utils";
import { StorageStore } from "../store/storage";

//@ts-ignore
BrowserFS.configure(
  {
    fs: "MountableFileSystem",
    options: {
      "/": { fs: "IndexedDB", options: {} },
      "/tmp": { fs: "InMemory" },
    },
  },
  (e) => {
    if (e) console.error(e);
    eventBus.emit("fs.ready");
  }
);
@Component
export default class FileManager extends Vue {
  WriteFileType: Partial<{ path: string; content: string; ensure?: boolean; force?: boolean }>;
  @Sync("editor/ace@content") content: string;
  @Sync("editor/fileManager@curDir") curDir: string;
  @Sync("editor/fileManager@defaultFiles") defaultFiles: EditorStore["fileManager"]["defaultFiles"];
  @Sync("editor/fileManager@files") files: EditorStore["fileManager"]["files"];
  @Sync("editor/fileManager@filesLoaded") filesLoaded: EditorStore["fileManager"]["filesLoaded"];
  @Sync("storage/fileManager@curFilePath") curFilePath: string;
  @Sync("storage/fileManager@curLinkStatus") curLinkStatus: StorageStore["fileManager"]["curLinkStatus"];
  @Get("editor/curFile") curFile: EditorStore["fileManager"]["file"];

  name = "filemanager";
  fileManager: FS = new FS({});

  cursor: {
    file: EditorStore["fileManager"]["file"];
    isDir: boolean;
  } = {
    file: null,
    isDir: false,
  };

  curEditFile?: FS["file"] = null;
  createFileForm: {
    visible: boolean;
    name: string;
    type: "file" | "dir";
    target: Partial<FS["file"]> | null;
    rules: any;
  } = {
    visible: false,
    name: "",
    type: "file",
    target: null,
    rules: { name: [{ required: true }] },
  };

  @Watch("curFile")
  oncurFilePathChange() {
    this.$nextTick(() => {
      this.setCurrentNode();
    });
  }

  async created() {
    eventBus
      .on("fs.ready", async () => {
        await this.initProject();
        await this.loadFiles();
        if (this.curLinkStatus == "connected") {
          await this.loadLocalhostFile();
        }
      })
      .on("toolbar.tab.select", (file) => {
        this.curFilePath = file.path;
      })
      .on("solc.compiled", () => {
        this.saveCurrentFile();
      })
      .on("editor.content.update", async (content) => {
        this.files[this.curFilePath].content = content;
      })
      .on("menubar.newFile", () => {
        this.showCreateNewFile(null, "file");
      })
      .on("menubar.newFolder", () => {
        this.showCreateNewFile(null, "dir");
      })
      .on("menubar.saveAll", () => {
        this.saveCurrentFile();
      })
      .on("sharefolder.ws.connected", async () => {
        this.curLinkStatus = "connected";
      })
      .on("sharefolder.ws.closed", async () => {
        await this.clearLocalhostHostFile();
        await this.loadFiles();
        this.curLinkStatus = "init";
      })
      .on("sharefolder.ws.error", async (e) => {
        await this.clearLocalhostHostFile();
        await this.loadFiles();
        this.curLinkStatus = "failed";
      });
  }

  async initProject() {
    const { curDir } = this;
    const exists = await this.fileManager.ensureDir(curDir);
    if (!exists) {
      await this.writeFiles(this.defaultFiles);
    }
  }

  async createNewFile() {
    //@ts-ignore
    this.$refs.createFileForm.validate(async (valid) => {
      if (!valid) return;
      const { name, target, type } = this.createFileForm;

      if (type == "file") {
        const fileName = name.replace(".sol", "") + ".sol";
        const filePath = path.join(target.path, fileName);

        await this.writeFile({ path: filePath, content: "" });
      } else if (type == "dir") {
        const filePath = path.join(target.path, name);
        await this.fileManager.ensureDir(filePath);
      }

      this.loadFiles();

      this.createFileForm = {
        ...this.createFileForm,
        visible: false,
        name: "",
      };
    });
  }

  async startRenameFile(file: FS["file"]) {
    this.$set(file, "edit", true);
    this.curEditFile = file;
  }

  async renameFile() {
    const file = this.curEditFile;
    this.$set(file, "edit", false);
    if (!file.editName) return;
    const dir = path.dirname(file.path);
    const newFileName = file.editName.replace(".sol", "") + ".sol";
    const newPath = `${dir}/${newFileName}`;
    await fs.promises.rename(file.path, newPath);
    this.curEditFile = null;
    this.loadFiles();
  }

  async deleteFile() {
    const { file } = this.cursor;
    if (!file) return;
    const [err] = await app.helper.runAsync(
      this.$msgbox({
        title: `Delete a ${file.isDir ? "Folder" : "File"}`,
        message: `Are you sure you want to delete this ${file.isDir ? "Folder" : "File"}?`,
        showCancelButton: true,
        confirmButtonText: "OK",
      })
    );
    if (err)
      return eventBus.emit("term.error", {
        text: err.message,
      });
    await this.fileManager.rm(file.path);
    await this.loadFiles();
  }

  async loadFiles() {
    const { curDir } = this;
    const fileMapping: EditorStore["fileManager"]["files"] = {};
    let files = await this.fileManager.list(curDir, {
      onFile: async (data) => {
        fileMapping[data.path] = data;
      },
    });
    this.files = fileMapping;
    this.filesLoaded = files;
    eventBus.emit("fs.loadFiles", fileMapping);
  }

  async writeFile({ path: filePath, content, ensure = false }: FileManager["WriteFileType"]) {
    if (ensure) {
      return this.fileManager.ensureWrite(filePath, content);
    }
    return this.fileManager.writeFile(filePath, content);
  }
  async writeFiles(files: FileManager["WriteFileType"][]) {
    for (let file of files) {
      await this.writeFile(file);
    }
  }

  async clearLocalhostHostFile() {
    const localhostDir = `${this.curDir}/localhost`;
    if (await this.fileManager.ensureDir(localhostDir)) {
      await this.fileManager.rm(localhostDir);
    }
  }

  async handleLinkLocalhost() {
    if (["init"].includes(this.curLinkStatus)) {
      this.curLinkStatus = "connecting";
      await this.loadLocalhostFile();
      return;
    }
    if (["connecting", "connected"].includes(this.curLinkStatus)) {
      await app.sf.close();
    }
    if (["failed"].includes(this.curLinkStatus)) {
      this.curLinkStatus = "init";
    }
  }

  async loadLocalhostFile() {
    await this.clearLocalhostHostFile();
    const files = await sf.dir();
    if (files) {
      const fileList = Object.keys(files).filter((i) => !i.includes(".git"));
      for (let path of fileList) {
        const data = await sf.get({ path });
        await this.writeFile({ path: `${this.curDir}/localhost/${path}`, content: data.content, ensure: true });
      }
      await this.loadFiles();
    }
  }

  expandNode(node) {
    //@ts-ignore
    if (node.parent) {
      if (!node.parent.expanded) {
        this.expandNode(node.parent);
      }
    }
    node.expanded = true;
  }

  setCurrentNode() {
    const filePath = this.curFilePath;
    //@ts-ignore
    const tree = this.$refs.tree as any;
    const node = tree.store.nodesMap[filePath];
    tree.setCurrentKey(filePath);
    node && this.expandNode(node);
  }

  onContextMenuHide() {
    this.cursor = {
      file: null,
      isDir: false,
    };
  }

  saveCurrentFile() {
    this.writeFile({ path: this.curFilePath, content: this.content });
  }

  handleNodeContextMenu(e, node: FS["file"]) {
    this.cursor = {
      file: node,
      isDir: node.isDir,
    };
  }

  handleNodeClick(node: FS["file"]) {
    if (node.isDir) return;

    this.curFilePath = node.path;
    eventBus.emit("fs.select", this.files[node.path]);
  }

  showCreateNewFile(file: FS["file"], type: any) {
    this.createFileForm = {
      ...this.createFileForm,
      visible: true,
      type,
      target: file
        ? { ...file }
        : {
            isDir: true,
            path: this.curDir,
          },
    };
  }
}
</script>

<style lang="stylus">
.file-manager
  .file-explorer
    .edit-name
      height 100%
      background-color transparent
    .el-input__inner
      height 100%
      border-radius 2px
      padding 0 0.5rem
</style>
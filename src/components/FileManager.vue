<template lang="pug">
  .file-manager.flex.flex-col.relative
    p.pb-4 File Explorers
    .flex.flex-col.flex-1.ml-2
      el-tree(:data="filesLoaded" ref="tree" node-key="path" highlight-current default-expand-all :props="{label: 'name'}" @node-click="handleNodeClick" @node-contextmenu="handleNodeContextMenu")
        div.custom-tree-node.w-full(slot-scope="{node, data}" v-contextmenu:contextmenu)
          div.el-tree-node_label
            el-icon(:class="[node.expanded? 'el-icon-folder-opened' : 'el-icon-folder']" v-if="data.isDir")
            el-icon.el-icon-document(v-if="!data.isDir")
            span.ml-2.text-sm {{data.name}}
      .space.h-full(v-contextmenu:contextmenu)
    v-contextmenu(ref="contextmenu" @hide="onContextMenuHide")
      v-contextmenu-item(v-if="!cursor.file || cursor.isDir" @click="showCreateNewFile(cursor.file, 'file')") New File
      v-contextmenu-item(v-if="!cursor.file || cursor.isDir"  @click="showCreateNewFile(cursor.file, 'dir')") New Folder
      v-contextmenu-item(v-if="cursor.file" disabled @click="renameFile") Rename
      v-contextmenu-item(v-if="cursor.file" @click="deleteFile") Delete

    el-dialog( :visible.sync="createFileForm.visible" title="Create new File" width="30%")
      el-form(:model="createFileForm" ref="createFileForm" :rules="createFileForm.rules" v-if="createFileForm.visible")
        el-form-item(prop="name")
          el-input(v-model="createFileForm.name"  autofocus placeholder="file name")
      span(slot="footer")
        el-button(@click="createFileForm.visible= false") Cancel
        el-button(type="primary" @click="createNewFile") Confirm

    

</template>

<script lang="ts">
import { Vue, Component, Watch } from "vue-property-decorator";
import git from "isomorphic-git";
import { FS, fs } from "@/utils/fs";
import { defaultContract } from "@/utils/constant";
import { Sync, Get } from "vuex-pathify";
import { EditorStore } from "@/store/type";
import { _ } from "@/utils/lodash";
import { eventBus } from "@/utils/eventBus";
import { debounce } from "helpful-decorators";
import { Helper } from "@/utils/helper";
import * as path from "path";
import { FuncBus } from "../utils/funcBus";

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
  @Sync("editor/fileManager@filesLoaded") filesLoaded: EditorStore["fileManager"]["filesLoaded"];

  name = "filemanager";
  fileManager: FS = new FS({});

  cursor: {
    file: EditorStore["fileManager"]["file"];
    isDir: boolean;
  } = {
    file: null,
    isDir: false
  };

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
    rules: { name: [{ required: true }] }
  };

  loadConfig() {
    const config = FuncBus.getConfig(this.name);
    Object.assign(this, config);
  }

  @debounce(500)
  saveConfig() {
    const { curFilePath } = this;
    FuncBus.setConfig(this.name, {
      curFilePath
    });
  }

  setCurrentNode() {
    const filePath = this.curFilePath;
    //@ts-ignore
    const tree = this.$refs.tree as any;
    const node = tree.store.nodesMap[filePath];
    tree.setCurrentKey(filePath);
    this.expandNode(node);
  }

  onContextMenuHide() {
    this.cursor = {
      file: null,
      isDir: false
    };
  }

  handleNodeContextMenu(e, node: FS["file"]) {
    this.cursor = {
      file: node,
      isDir: node.isDir
    };
  }

  handleNodeClick(node: FS["file"]) {
    if (node.isDir) return;

    this.curFilePath = node.path;
    eventBus.emit("fs.select", this.files[node.path]);
  }

  async initProject() {
    const { curDir } = this;
    await this.writeFiles(this.defaultFiles);
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
            path: this.curDir
          }
    };
  }

  async createNewFile() {
    //@ts-ignore
    this.$refs.createFileForm.validate(async valid => {
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
        name: ""
      };
    });
  }

  async renameFile() {}

  async deleteFile() {
    const { file } = this.cursor;
    if (!file) return;
    const [err] = await Helper.runAsync(
      this.$msgbox({
        title: `Delete a ${file.isDir ? "Folder" : "File"}`,
        message: `Are you sure you want to delete this ${file.isDir ? "Folder" : "File"}?`,
        showCancelButton: true,
        confirmButtonText: "OK"
      })
    );
    if (err)
      return eventBus.emit("term.error", {
        text: err.message
      });
    await this.fileManager.rm(file.path);
    await this.loadFiles();
  }

  async loadFiles() {
    const { curDir } = this;
    const fileMapping: EditorStore["fileManager"]["files"] = {};
    let files = await this.fileManager.list(curDir, {
      onFile: async data => {
        fileMapping[data.path] = data;
      }
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

  expandNode(node) {
    //@ts-ignore
    if (node.parent) {
      if (!node.parent.expanded) {
        this.expandNode(node.parent);
      }
    }
    node.expanded = true;
  }

  @Watch("curFilePath")
  oncurFilePathChange() {
    this.setCurrentNode();
    this.saveConfig();
  }

  async created() {
    eventBus
      .on("fs.ready", async () => {
        await this.initProject();
        await this.loadFiles();
        this.loadConfig();
      })
      .on("toolbar.tab.select", file => {
        this.curFilePath = file.path;
      })
      .on("editor.content.update", async content => {
        this.files[this.curFilePath].content = content;
        await this.writeFile({ path: this.curFilePath, content });
      });
  }
}
</script>

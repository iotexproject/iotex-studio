import util from "util";
import _fs, { stat } from "fs";
import { Helper } from "./helper";
import * as path from "path";
import { app } from "./index";

export const promisify = (obj) => {
  return new Proxy(obj, {
    get: (target, name) => {
      if (name in target) {
        if (target[name] instanceof Function) {
          return util.promisify(target[name]);
        }
      }
      return target[name];
    },
  });
};

export const fs = _fs;
if (!fs.promises) {
  fs.promises = promisify(fs);
}

export class FS {
  file: { name: string; content: string | null; edit?: boolean; editName?: string; isDir: boolean; path: string; children: FS["files"] | null };
  files: FS["file"][];

  constructor(props: Partial<FS>) {
    Object.assign(this, props);
  }
  async list(dir, options: { ensure?: boolean; onDir?: (data: FS["file"]) => any; onFile?: (data: FS["file"]) => any } = {}): Promise<FS["files"]> {
    const { ensure = true, onDir, onFile } = options;
    if (ensure) await this.ensureDir(dir);
    const filesInDir = await fs.promises.readdir(dir);
    const files = await Promise.all(
      filesInDir.map(async (file) => {
        const filePath = path.join(dir, file);
        const stats = await fs.promises.stat(filePath);
        const isDir = stats.isDirectory();

        let data = {
          name: file,
          isDir,
          path: filePath,
          content: null,
          children: null,
        };
        if (isDir) {
          data.children = await this.list(filePath, options);
          onDir && (await onDir(data));
        } else {
          data.content = (await fs.promises.readFile(filePath)).toString();
          onFile && (await onFile(data));
        }

        return data;
      })
    );
    return files;
  }
  async ensureDir(dir) {
    if (dir == "/") return;
    //@ts-ignore
    const [exists] = await app.helper.runAsync(fs.promises.exists(dir));
    if (!exists) {
      await this.ensureDir(path.dirname(dir));
      await fs.promises.mkdir(dir);
      return false;
    }
    return true;
  }
  async ensureWrite(filePath, content, options?) {
    await this.ensureDir(path.dirname(filePath));
    const [err, stats] = await app.helper.runAsync(fs.promises.stat(filePath));
    if (err || !stats.isFile()) {
      await fs.promises.writeFile(filePath, content, options);
    }
  }
  async writeFile(filePath, content, options?) {
    return fs.promises.writeFile(filePath, content, options);
  }

  async rm(path) {
    const [err, stat] = await app.helper.runAsync(fs.promises.lstat(path));
    if (err) throw err;
    if (stat.isDirectory()) {
      const files = await fs.promises.readdir(path);

      for (let file of files) {
        const curPath = `${path}/${file}`;
        const stat = await fs.promises.lstat(curPath);
        if (stat.isDirectory) {
          await this.rm(curPath);
        } else {
          await fs.promises.unlink(curPath);
        }
      }
      await fs.promises.rmdir(path);
    } else if (stat.isFile()) {
      await fs.promises.unlink(path);
    }
  }
}

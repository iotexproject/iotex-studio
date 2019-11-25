import util from "util";
import _fs from "fs";
import { Helper } from "./helper";
import * as path from "path";

export const promisify = obj => {
  return new Proxy(obj, {
    get: (target, name) => {
      if (name in target) {
        if (target[name] instanceof Function) {
          return util.promisify(target[name]);
        }
      }
      return target[name];
    }
  });
};

export const fs = _fs;
if (!fs.promises) {
  fs.promises = promisify(fs);
}

export class FS {
  file: { name: string; content: string; ext?: string };
  files: { name: string; content: string; ext?: string }[];

  constructor(props: Partial<FS>) {
    Object.assign(this, props);
  }
  async list(dir, { ensure = true }: { ensure?: boolean } = {}) {
    if (ensure) await this.ensureDir(dir);
    const files = await fs.promises.readdir(dir);
    const stats = await Promise.all(
      files.map(async file => {
        const content = await fs.promises.readFile(`${dir}/${file}`);
        return {
          name: file,
          path: `${dir}/${file}`,
          content: content.toString()
        };
      })
    );
    return stats;
  }
  async ensureDir(dir) {
    //@ts-ignore
    const [err, exists] = await Helper.runAsync(fs.promises.exists(dir));
    if (!exists && !err) {
      await fs.promises.mkdir(dir);
      return false;
    }
    return true;
  }
  async ensureWrite(path, content, options?) {
    const [err, stats] = await Helper.runAsync(fs.promises.stat(path));
    if (err || !stats.isFile()) {
      await fs.promises.writeFile(path, content, options);
    }
  }
  async writeFile(path, content, options?) {
    return fs.promises.writeFile(path, content, options);
  }
}

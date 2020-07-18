// ref: https://github.com/alincode/resolve-github/blob/master/src/resolver.js
import { replaceContent } from "solc-import";
import gh from "parse-github-url";

const match = /^(https?:\/\/)?(www.)?github.com\/([^/]*\/[^/]*)\/(.*)/;

const resolver = (content, from, subImportPath) => {
  let newContent = content;
  let url = new window.URL(subImportPath, from);
  let fixedPath = url.href;
  newContent = newContent.replace(`import '${subImportPath}'`, `import '${fixedPath}'`);
  newContent = newContent.replace(`import "${subImportPath}"`, `import "${fixedPath}"`);
  return newContent;
};

const parser = async function (importPath) {
  const { owner, name, repo, branch, filepath } = gh(importPath);

  let url = `https://raw.githubusercontent.com/${repo}/${branch}/${filepath}`;
  try {
    let data = await getData(url);
    if (isSymbolicLink(data)) {
      const tmps = url.split("/");
      const filename = tmps[tmps.length - 1];
      url = url.replace(filename, data);
      data = await getData(url);
    } else {
      data = replaceContent(data, importPath, resolver);
    }
    return data;
  } catch (error) {
    throw error;
  }
};

async function getData(url) {
  let response = await fetch(url, { method: "GET" });
  let data = await response.text();
  if (!response.ok || response.status !== 200) throw Error("Content " + data);
  return data;
}

function isSymbolicLink(data) {
  if (data.length < 50 && data.indexOf(".sol")) return true;
  return false;
}

// async function getSource(importPath, root, path) {
//   const url = `https://api.github.com/repos/${root}/contents/${path}`;
//   // console.log('url:', url);
//   try {
//     const response = await fetch(url, { method: 'GET' });
//     let data = await response.text();
//     if (!response.ok || response.status !== 200) throw Error(data);
//     data = JSON.parse(data);
//     data.content = window.atob(data.content);
//     data.content = replaceContent(data.content, importPath, pathResolve);
//     if ('content' in data) return data.content;
//     if ('message' in data) throw Error(data.message);
//     throw Error('Content not received');
//   } catch (error) {
//     // Unknown transport error
//     throw error;
//   }
// }

export default {
  type: "github",
  parser,
  resolver,
  match,
};

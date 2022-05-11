import * as fs from "fs"
import * as  path from "path"
import * as babelc from "@babel/core"
import * as babelt from "@babel/types"
import { normalizePath } from "vite"
import * as chokidar from "chokidar"



function readDir(path) {
  try {
    return fs.readdirSync(path);
  } catch (error) {
    console.error("读取文件夹失败", error);
    return []
  }
}

function isFile(path) {
  try {
    return fs.statSync(path).isFile();
  } catch (error) {
    console.error("获取文件信息失败", error);
    return false
  }
}

function isDir(path) {
  try {
    return fs.statSync(path).isDirectory();
  } catch (error) {
    console.error("获取文件夹失败", error);
    return false
  }
}
function getString(path) {
  try {
    if (!fs.existsSync(path)) {
      return null;
    }
    return fs.readFileSync(path, "utf8");
  } catch (error) {
    return log("error", error)
  }
}
function getExtName(filePath) {
  return path.extname(filePath)
}
function getRelativePath(form, to) {
  return path.relative(path.dirname(form), to)
}
function getTagName(relativePath = '') {
  let path = relativePath.replace(/\.|\\|\//g, "")
  return path.slice(0, 1).toLocaleUpperCase() + path.slice(1)
}
function log(type, msg) {
  console[type](`vite-plugin-react-router-generator[${type}]:${msg}`)
}

// ast 解析函数
function getRouterString(nodes, routerVar) {
  return getAstString([
    babelt.variableDeclaration("const", [
      babelt.variableDeclarator(
        babelt.identifier(routerVar),
        babelt.arrayExpression(nodes)
      ),
    ]),
  ])
}

function getAstString(nodes) {
  const ast = babelt.file(babelt.program(nodes), "", "")
  return babelc.transformFromAstSync(ast, "", { filename: "test" }).code;
}

function getRouterNodeInfo(KeyWord, body) {
  // 是否有 export default
  const defaultDeclaration = body.find((node) => {
    if (babelt.isExportDefaultDeclaration(node)) {
      defaultName = node.declaration.id ? node.declaration.id.name : null
      return true;
    }
    return false;
  });
  // 是否有 `export const ${KeyWord} = {  ...  }`
  const routesDeclaration = body.find((node) => {
    if (
      babelt.isExportNamedDeclaration(node) &&
      babelt.isVariableDeclaration(node.declaration) &&
      babelt.isVariableDeclarator(node.declaration.declarations[0]) &&
      KeyWord === node.declaration.declarations[0].id.name &&
      babelt.isObjectExpression(node.declaration.declarations[0].init)
    ) {
      return true;
    }
    return false;
  });
  let routerInfoDeclaration;
  if (routesDeclaration) {
    routerInfoDeclaration = routesDeclaration.declaration.declarations[0].init
  } else if (defaultDeclaration) {
    let name = null;
    const { declaration } = defaultDeclaration;
    if (
      babelt.isFunctionDeclaration(declaration) ||
      babelt.isClassDeclaration(declaration)
    ) {
      name = declaration.id.name;
    } else if (babelt.isIdentifier(declaration)) {
      name = declaration.name;
    }
    if (!name) {
      return null;
    }
    const currentDefaultRouterInfo = findRouterNode(KeyWord, body, name)
    if (!currentDefaultRouterInfo) {
      return null;
    }
    routerInfoDeclaration = currentDefaultRouterInfo.expression.right;
  }
  return routerInfoDeclaration
}
function findRouterNode(KeyWord, body, name) {
  return body.find((node) => {
    if (babelt.isExpressionStatement(node)) {
      const { left } = node.expression;
      if (
        babelt.isMemberExpression(left) &&
        babelt.isIdentifier(left.object)
      ) {
        if (
          left.object.name === name &&
          babelt.isIdentifier(left.property) &&
          KeyWord === left.property.name
        ) {
          return true;
        }
      }
    }
    return false;
  });
}
function sortNode(node, orderName) {
  if (!node.properties) {
    return 0;
  }
  const orderNode = node.properties.find((i) => {
    if (!babelt.isObjectProperty(i)) {
      return false;
    }
    return i.key.name === orderName;
  });
  if (orderNode) {
    if (babelt.isNumericLiteral(orderNode.value)) {
      return orderNode.value.value;
    }
    if (babelt.isUnaryExpression(orderNode.value)) {
      const { value } = orderNode;
      return Number(value.operator + value.argument.value);
    }
  }
  return 0;
}
function getIdentifierExpression(name) {
  return babelt.identifier(name)
}
function getArrowFunctionExpression(parmas, body) {
  return babelt.arrowFunctionExpression(parmas, body)
}
function getCallExpression(name, args) {
  return babelt.callExpression(name, args)
}
function getStringExpression(val) {
  return babelt.stringLiteral(val)
}
function getObjectPropty(name, value) {
  return babelt.objectProperty(
    babelt.identifier(name),
    value
  );
}

function getJsxTag(tagName, jsxAttr = [], selfClose = true) {
  return babelt.jsxElement(
    babelt.jsxOpeningElement(
      babelt.jsxIdentifier(tagName), jsxAttr, selfClose
    ),
    null,
    []
  )
}

function getImportDeclaration(defaultName, sourceName) {
  return babelt.importDeclaration(
    [
      babelt.importDefaultSpecifier(
        babelt.identifier(defaultName)
      )
    ],
    babelt.stringLiteral(sourceName)
  )
}


const Options = {
  KeyWord: "route",
  fileDir: path.join(process.cwd(), "./src/pages"),
  comKey: "component",
  outputFile: path.join(process.cwd(), "./src/router.js"),
  exts: [".js", ".jsx", ".tsx", ".ts"],
  routerVar: "routes",
  insertBeforeStr: "",
  insertAfterStr: "",
  isLazy: true
}

/**
 * 配置信息
 * @param {Options} o 
 */
function ReactRouterGenerator(o) {
  const opt = Object.assign(Options, o)
  const ctx = {
    files: [],
    nodes: [],
    nodeMap: new Map(),
    timer: null,
    isWatch: false,
    mode: "serve",
    readPath(appPath) {
      if (isDir(appPath)) {
        readDir(appPath).forEach((file) =>
          ctx.readPath(path.join(appPath, file))
        );
        return;
      }
      if (isFile(appPath) && opt.exts.includes(getExtName(appPath))) {
        ctx.files.push(appPath);
      }
    },
    getLazyCompnentNode(filePath) {
      return getObjectPropty(
        opt.comKey,
        getArrowFunctionExpression(
          [],
          getCallExpression(
            getIdentifierExpression("import"),
            [getStringExpression(normalizePath(filePath))]
          )
        )
      )
    },
    getCompnentNode(tagName) {
      return getObjectPropty(opt.comKey, getJsxTag(tagName))
    },
    setCurrentPageNode(filePath) {
      const str = getString(filePath)
      if (!str) {
        ctx.nodeMap.set(normalizePath(filePath), null)
        return null
      }
      const ast = babelc.parseSync(str, {
        filename: filePath,
        presets: [[require.resolve("@a8k/babel-preset"), { target: "web" }]]
      })
      const { body } = ast.program;
      // fs.writeFileSync("./test.json", JSON.stringify(body))
      const routerNode = getRouterNodeInfo(opt.KeyWord, body)
      if (!routerNode) {
        ctx.nodeMap.set(normalizePath(filePath), null)
        return null
      }
      const relative = normalizePath(getRelativePath(opt.outputFile, filePath))
      const tagName = getTagName(relative)
      const componentNode = opt.isLazy ? ctx.getLazyCompnentNode(filePath) : ctx.getCompnentNode(tagName)
      const isObjectNode = babelt.isObjectExpression(routerNode)

      if (!isObjectNode) {
        log("warn", "提取的路由信息必须为Object类型，例如：{ key:val }")
        return null
      }
      routerNode.properties.push(componentNode)
      const mapData = {
        node: routerNode,
        filePath,
        relative
      }
      ctx.nodeMap.set(normalizePath(filePath), mapData)
      return routerNode
    },
    getImportStr() {
      if (opt.isLazy) {
        return ''
      }
      const nodes = []
      ctx.nodeMap.forEach((value) => {
        if (value) {
          nodes.push(value)
        }
      })
      const importNode = nodes.map(item => {
        const tagName = getTagName(item.relative)
        return getImportDeclaration(tagName, item.relative)
      })
      return getAstString(importNode)
    },
    getTmpStr(routerStr, importStr) {
      return `// 本文件为脚本自动生成，请勿修改
${importStr}

${opt.insertBeforeStr || ''}
      
${routerStr}
      
${opt.insertAfterStr || ''}
      
export default ${opt.routerVar}`
    },
    setNodes() {
      const { nodeMap } = ctx
      const nodes = []
      nodeMap.forEach((value) => {
        if (value) {
          nodes.push(value.node)
        }
      })
      nodes.sort((a, b) => sortNode(a, "order") - sortNode(b, "order"))
      ctx.nodes = nodes
    },
    writeFile() {
      const { outputFile, routerVar } = opt
      const { nodes } = ctx
      if (nodes.length === 0) {
        log("warn", "未提取出文件暴露的路由信息！")
        return
      }
      const genStr = getRouterString(nodes, routerVar) || `const ${routerVar} = []`
      const genImportStr = ctx.getImportStr()
      const tmpStr = ctx.getTmpStr(genStr, genImportStr)
      try {
        fs.writeFileSync(outputFile, tmpStr, "utf8");
      } catch (error) {
        log("warn", "写入路由信息失败:" + error)
      }
    },
    watch() {
      return new Promise((resolve) => {
        if (ctx.isWatch) {
          return resolve()
        }
        ctx.isWatch = true
        const watchFileType = path.join(
          opt.fileDir,
          `**/*.{${opt.exts.map((i) => i.replace(".", "")).join(",")}}`
        );
        const watchEvent = ["add", "unlink", "change"];
        chokidar.watch([watchFileType], {}).on("all", (eventName, filePath) => {
          if (watchEvent.includes(eventName)) {
            const hasNode = ctx.setCurrentPageNode(filePath)
            if (!hasNode) {
              return
            }
            clearTimeout(ctx.timer)
            log("log", `${eventName} ${filePath} 1s后更新路由文件！`)
            ctx.timer = setTimeout(() => {
              ctx.setNodes()
              ctx.writeFile()
              resolve()
            }, 1000);
          }
        })
      })
    }
  }
  return {
    name: "vite-plugin-react-router-generator",
    async buildStart() {
      process.env.BABEL_ENV = process.env.BABEL_ENV || (ctx.mode === "serve" ? "development" : "production")
      await ctx.watch()
    },
    apply(config, { command }) {
      ctx.mode = command
      return true
    }
  }
}

module.exports = ReactRouterGenerator;

ReactRouterGenerator.default = ReactRouterGenerator;

export default ReactRouterGenerator
const babelt = require("@babel/types")
const { parse } = require("@babel/parser")
const generator = require("@babel/generator").default
const fs = require("fs")
const path = require("path")
const chokidar = require("chokidar")
const { normalizePath } = require("vite")



function readDir(path) {
  try {
    return fs.readdirSync(path);
  } catch (error) {
    log("error", "读取文件夹失败" + error);
    return []
  }
}
function isExists(filePath) {
  try {
    return fs.existsSync(filePath)
  } catch (error) {
    log("error", "读取文件夹失败" + error);
    return false
  }
}
function getNormaPath(filePath = "", isAbsolute = true) {
  if (isAbsolute) {
    return normalizePath(filePath)
  }
  if (/^(\.(\/|\\)|\.\.(\/|\\))/.test(filePath)) {
    return normalizePath(filePath)
  }
  const concatPath = "." + normalizePath(path.sep) + normalizePath(filePath)
  return concatPath
}
function isFile(path) {
  try {
    return fs.statSync(path).isFile();
  } catch (error) {
    log("error", "获取文件信息失败" + error);
    return false
  }
}
function isDir(path) {
  try {
    return fs.statSync(path).isDirectory();
  } catch (error) {
    log("error", "获取文件夹失败" + error);
    return false
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
  return getAstCodeStr([
    babelt.variableDeclaration("const", [
      babelt.variableDeclarator(
        babelt.identifier(routerVar),
        babelt.arrayExpression(nodes)
      ),
    ]),
  ])
}
// 返回节点 指定的 排序值 默认 0
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

function getFileAstNode(filePath) {
  const hasExist = isExists(filePath)
  if (!hasExist) {
    return null
  }
  const str = fs.readFileSync(filePath, "utf-8")
  if (!str) {
    return null
  }
  try {
    const { program } = parse(str, {
      sourceType: "module",
      plugins: ["jsx", "typescript"]
    })
    if (!program.body.length) {
      return null
    }
    return program.body
  } catch (error) {
    return null
  }

}
function hasExportDefaultNode(node) {
  const hasDefaultNode = babelt.isExportDefaultDeclaration(node)
  if (!hasDefaultNode) {
    return false
  }
  const isFn = babelt.isFunctionDeclaration(node.declaration)
  const isClass = babelt.isClassDeclaration(node.declaration)
  if ((isFn || isClass) && node.declaration.id) {
    return node.declaration.id.name
  }
  const isIdentifier = babelt.isIdentifier(node.declaration)
  if (isIdentifier) {
    return node.declaration.name
  }
  return false
}
function hasExportNameNode(node, keyWord) {
  const isExportName = babelt.isExportNamedDeclaration(node)
  if (!isExportName) {
    return false
  }
  if (node.declaration && node.declaration.declarations) {
    return node.declaration.declarations.find(declarations => {
      return declarations.id.name === keyWord && babelt.isObjectExpression(declarations.init)
    })
  }
  return false
}
function getDefaultRouteNode(nodes, defaultName, keyWord) {
  return nodes.find(node => {
    if (
      babelt.isExpressionStatement(node) &&
      node.expression.left &&
      babelt.isMemberExpression(node.expression.left) &&
      babelt.isIdentifier(node.expression.left.object) &&
      node.expression.left.object.name === defaultName &&
      babelt.isIdentifier(node.expression.left.property) &&
      node.expression.left.property.name === keyWord
    ) {
      return true
    }
    return false
  })
}
function getRouteInfoNode(filePath, keyWord) {
  const astNodes = getFileAstNode(filePath)
  if (!astNodes) {
    return null
  }
  let defaultName, exportNameNode;
  astNodes.forEach(node => {
    if (!defaultName && (defaultName = hasExportDefaultNode(node))) {
      return
    }
    if (!exportNameNode && (exportNameNode = hasExportNameNode(node, keyWord))) {
      return
    }
  })
  if (exportNameNode) {
    return exportNameNode.init
  }
  if (defaultName) {
    const defaultNode = getDefaultRouteNode(astNodes, defaultName, keyWord)
    if (defaultNode) {
      return defaultNode.expression.right
    }
  }
  return null
}
function getAstCodeStr(body) {
  const { code } = generator({ type: "Program", body })
  return code
}

const Options = {
  keyWord: "route",
  fileDir: path.join(process.cwd(), "./src/pages"),
  comKey: "component",
  outputFile: path.join(process.cwd(), "./src/router.jsx"),
  exts: [".js", ".jsx", ".tsx"],
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
    watcher: null,
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
            [getStringExpression(filePath)]
          )
        )
      )
    },
    getCompnentNode(tagName) {
      return getObjectPropty(opt.comKey, getJsxTag(tagName))
    },
    setCurrentPageNode(filePath) {
      const routerNode = getRouteInfoNode(filePath, opt.keyWord)
      if (!routerNode) {
        ctx.nodeMap.set(getNormaPath(filePath), null)
        return null
      }
      const relative = getNormaPath(getRelativePath(opt.outputFile, filePath), false)
      const tagName = getTagName(relative)
      const componentNode = opt.isLazy ? ctx.getLazyCompnentNode(relative) : ctx.getCompnentNode(tagName)
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
      ctx.nodeMap.set(getNormaPath(filePath), mapData)
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
      return getAstCodeStr(importNode)
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
        const hasDir = isExists(opt.fileDir)
        if (!hasDir) {
          return resolve()
        }
        let fileExtistsNode = false, isResolve = false
        const watchFileType = path.join(
          opt.fileDir,
          `**/*.{${opt.exts.map((i) => i.replace(".", "")).join(",")}}`
        );

        const watchEvent = ["add", "unlink", "change"];
        ctx.watcher = chokidar.watch([watchFileType], {}).on("all", (eventName, filePath) => {
          if (!watchEvent.includes(eventName)) return
          const hasNode = ctx.setCurrentPageNode(filePath)
          if (!hasNode) return
          clearTimeout(ctx.timer)
          fileExtistsNode = true
          log("log", `${eventName} ${filePath} 1s后更新路由文件！`)
          ctx.timer = setTimeout(() => {
            ctx.setNodes()
            ctx.writeFile()
            if (!isResolve) {
              isResolve = true
              resolve()
            }
          }, 1000);
        })
        // 超时处理，若1s之后还未发现监听文件 结束 plugin buildStart运行
        setTimeout(() => {
          if (!fileExtistsNode) {
            resolve()
          }
        }, 1000)
      })

    },
  }
  return {
    name: "vite-plugin-react-router-generator",
    apply(config, { command }) {
      ctx.mode = command
      return true
    },
    async buildStart() {
      process.env.BABEL_ENV = process.env.BABEL_ENV || (ctx.mode === "serve" ? "development" : "production")
      await ctx.watch()
    },
    buildEnd() {
      if (ctx.watcher && ctx.watcher.close) {
        ctx.watcher.close()
      }
    }
  }
}

module.exports = ReactRouterGenerator;

ReactRouterGenerator.default = ReactRouterGenerator;

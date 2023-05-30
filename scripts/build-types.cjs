const path = require('path')
const fs = require('fs')
const glob = require('fast-glob')
const { Project } = require('ts-morph')

main()

async function main() {
  const project = new Project({
    compilerOptions: {
      noEmit: false,
      declaration: true,
      emitDeclarationOnly: true,
      noEmitOnError: true,
      allowJs: true,
      outDir: 'dist'
    },
    tsConfigFilePath: path.resolve(__dirname, '../tsconfig.json'),
    skipAddingFilesFromTsConfig: true
  })
  const diagnostics = project.getPreEmitDiagnostics()

  // 获取 src 下的 .ts 文件
  const files = await glob(['src/**/*.ts'])
  const sourceFiles = []

  await Promise.all(
    files.map(async (file) => {
      sourceFiles.push(project.addSourceFileAtPath(file))
    })
  )

  // 输出解析过程中的错误信息
  console.log(project.formatDiagnosticsWithColorAndContext(diagnostics))

  project.emitToMemory()

  // 随后将解析完的文件写道打包路径
  for (const sourceFile of sourceFiles) {
    const emitOutput = sourceFile.getEmitOutput()

    for (const outputFile of emitOutput.getOutputFiles()) {
      const filePath = outputFile.getFilePath()

      await fs.promises.mkdir(path.dirname(filePath), { recursive: true })
      await fs.promises.writeFile(filePath, outputFile.getText(), 'utf8')
    }
  }
}

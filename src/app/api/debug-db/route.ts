import fs from "fs"
import path from "path"

// Temporary diagnostics endpoint (remove after deploy debugging)
export async function GET() {
  const src = path.join(process.cwd(), "db", "custom.db")
  const diag = {
    cwd: process.cwd(),
    vercel: process.env.VERCEL || null,
    databaseUrl: process.env.DATABASE_URL || null,
    srcExists: fs.existsSync(src),
    srcSize: fs.existsSync(src) ? fs.statSync(src).size : 0,
    dbDirList: fs.existsSync(path.join(process.cwd(), "db"))
      ? fs.readdirSync(path.join(process.cwd(), "db"))
      : "no db dir",
    tmpExists: fs.existsSync("/tmp/nova-leads.db"),
    tmpSize: fs.existsSync("/tmp/nova-leads.db") ? fs.statSync("/tmp/nova-leads.db").size : 0,
    tmpWritable: (() => {
      try {
        fs.writeFileSync("/tmp/.nova-write-test", "1")
        fs.unlinkSync("/tmp/.nova-write-test")
        return true
      } catch {
        return false
      }
    })(),
    nodeVersion: process.version,
    files: fs.readdirSync(process.cwd()).slice(0, 40),
  }
  return Response.json(diag)
}

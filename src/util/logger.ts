function info(...params: any[]): void {
  console.log(...params)
}

function error(...params: any[]): void {
  console.error(...params)
}

export default {
  info,
  error,
}

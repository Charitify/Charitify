export default async function (ms, isError) {
  return new Promise((res, rej) => setTimeout(isError ? rej : res, ms))
}

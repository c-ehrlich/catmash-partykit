/**
 * This app doesn't really need a loading.tsx, just doing this to suppress https://github.com/vercel/next.js/issues/55608
 */

export default async function Loading() {
  return <h1>loading...</h1>;
}

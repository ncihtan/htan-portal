// from https://github.com/vercel/next.js/issues/21498#issuecomment-1499435299
// We can remove this when we upgrade next
// src/middleware.ts

export function middleware(request: Request) {
  const url = new URL(request.url)

  // Don't modify files
  // Without this bundled js files and assets (e.g. fonts, images) will break
  if (/\.[a-z0-9]+$/i.test(url.pathname)) {
    return
  }

  // Note: we're excluding origin, search, and hash from normalization
  const lowerCaseUrl = new URL(
    `${url.origin}${url.pathname.toLowerCase()}${url.search}${url.hash}`
  )

  if (lowerCaseUrl.toString() !== url.toString()) {
    // For some reason Vercel rewrite doesn't seem to be working
    //rewrite(lowerCaseUrl)

   return Response.redirect(lowerCaseUrl.toString())
  }
}
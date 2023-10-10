import { NextResponse } from 'next/server';

const Middleware = (req) => {
    // A hack to deal with this case sensitive silliness
    // https://github.com/vercel/next.js/issues/21498
    // Restrict to HTA pages because otherwise it breaks some images/fonts
    if (
        req.nextUrl.pathname.startsWith('/HTA') &&
        !req.nextUrl.pathname.endsWith('.jpeg') &&
        !req.nextUrl.pathname.endsWith('.png')
    ) {
        return NextResponse.redirect(
            new URL(req.nextUrl.origin + req.nextUrl.pathname.toLowerCase())
        );
    } else {
        return NextResponse.next();
    }
};

export default Middleware;

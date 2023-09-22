// A hack to deal with this silliness https://github.com/vercel/next.js/issues/21498
import { NextResponse } from 'next/server';

const Middleware = (req) => {
    if (req.nextUrl.pathname === req.nextUrl.pathname.toLowerCase())
        return NextResponse.next();

    return NextResponse.redirect(
        new URL(req.nextUrl.origin + req.nextUrl.pathname.toLowerCase())
    );
};

export default Middleware;

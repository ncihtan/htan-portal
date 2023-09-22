import { NextResponse } from 'next/server';

const Middleware = (req) => {
  if (req.nextUrl.pathname === req.nextUrl.pathname.toLowerCase())
    return NextResponse.next();

  return NextResponse.redirect(new URL(req.nextUrl.origin + req.nextUrl.pathname.toLowerCase()));
};

export default Middleware;
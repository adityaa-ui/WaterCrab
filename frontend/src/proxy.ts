import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/** Auth is now handled entirely by Firebase on the client.
 *  This proxy is kept as a passthrough so middleware config remains intact. */
export async function proxy(request: NextRequest) {
  return NextResponse.next({ request });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4)$).*)"],
};

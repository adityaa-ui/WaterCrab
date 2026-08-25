import { NextResponse } from "next/server";

/** Auth callback is now handled entirely by Firebase on the client side.
 *  This route is kept as a passthrough to avoid 404s for any old links
 *  and to redirect cleanly to the workspace or homepage. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const next = searchParams.get("next");
  const destination = next?.startsWith("/") ? next : "/workspace";

  // Firebase auth is handled client-side — just redirect to destination.
  return NextResponse.redirect(`${origin}${destination}`);
}

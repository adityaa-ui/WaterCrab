import Workspace from "./workspace";

export const dynamic = "force-dynamic";

/** The workspace page now uses Firebase client-side auth.
 *  The client-side workspace.tsx handles redirect-to-login via onAuthStateChanged.
 *  We render the shell with a placeholder email; the client fills it in from Firebase. */
export default function WorkspacePage() {
  return <Workspace email="" />;
}

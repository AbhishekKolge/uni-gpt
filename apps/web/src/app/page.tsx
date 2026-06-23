import { redirect } from "next/navigation";

export default function RootPage() {
	// "/" is not a real screen — the dashboard guard bounces to /login when
	// there is no session, so this routes signed-in users to the app and
	// everyone else to sign-in.
	redirect("/dashboard");
}

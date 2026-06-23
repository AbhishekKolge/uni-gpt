import { Suspense } from "react";

import ResetPasswordForm from "../components/forms/reset-password-form";

export function ResetPasswordPage() {
	return (
		<Suspense>
			<ResetPasswordForm />
		</Suspense>
	);
}

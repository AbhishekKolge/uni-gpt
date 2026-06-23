"use client";

import { PASSWORD_MAX_LENGTH } from "@uni-gpt/auth/lib/password-strength";
import { Input } from "@uni-gpt/ui/components/input";
import { cn } from "@uni-gpt/ui/lib/utils";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { type ComponentProps, useState } from "react";

/**
 * Password field with a show/hide toggle (ui-ux-pro-max `password-toggle`).
 * Spreads all input props onto the inner Input so it slots into the base-ui
 * `FormControl render={<PasswordInput {...field} />}` pattern — the injected
 * id / aria-describedby / aria-invalid land on the real <input> for correct
 * label + error association.
 */
export default function PasswordInput({
	className,
	maxLength = PASSWORD_MAX_LENGTH,
	...props
}: ComponentProps<"input">) {
	const [visible, setVisible] = useState(false);

	return (
		<div className="relative">
			<Input
				className={cn("pr-9", className)}
				maxLength={maxLength}
				type={visible ? "text" : "password"}
				{...props}
			/>
			<button
				aria-label={visible ? "Hide password" : "Show password"}
				aria-pressed={visible}
				className="absolute inset-y-0 right-0 flex w-9 items-center justify-center rounded-r-md text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
				onClick={() => setVisible((v) => !v)}
				tabIndex={-1}
				type="button"
			>
				{visible ? (
					<EyeOffIcon className="size-4" />
				) : (
					<EyeIcon className="size-4" />
				)}
			</button>
		</div>
	);
}

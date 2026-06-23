"use client";

import { Button } from "@uni-gpt/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@uni-gpt/ui/components/card";
import { Input } from "@uni-gpt/ui/components/input";
import { Label } from "@uni-gpt/ui/components/label";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";

// Derive the element types from the better-auth client so they track the API
// instead of being hand-maintained shapes that need a cast.
type Passkey = NonNullable<
	Awaited<ReturnType<typeof authClient.passkey.listUserPasskeys>>["data"]
>[number];
type Session = NonNullable<
	Awaited<ReturnType<typeof authClient.listSessions>>["data"]
>[number];

export function SecurityPage() {
	const router = useRouter();
	const { data: session, isPending } = authClient.useSession();
	const [passkeys, setPasskeys] = useState<Passkey[]>([]);
	const [sessions, setSessions] = useState<Session[]>([]);
	const [password, setPassword] = useState("");

	const loadPasskeys = useCallback(async () => {
		const { data } = await authClient.passkey.listUserPasskeys();
		setPasskeys(data ?? []);
	}, []);

	const loadSessions = useCallback(async () => {
		const { data } = await authClient.listSessions();
		setSessions(data ?? []);
	}, []);

	useEffect(() => {
		if (!(isPending || session)) {
			router.push("/login");
		}
	}, [isPending, session, router]);

	useEffect(() => {
		if (session) {
			loadPasskeys().catch(() => undefined);
			loadSessions().catch(() => undefined);
		}
	}, [session, loadPasskeys, loadSessions]);

	const addPasskey = async () => {
		const res = await authClient.passkey.addPasskey();
		if (res?.error) {
			toast.error(res.error.message ?? "Could not add passkey");
			return;
		}
		toast.success("Passkey added");
		await loadPasskeys();
	};

	const removePasskey = async (id: string) => {
		await authClient.passkey.deletePasskey({ id });
		toast.success("Passkey removed");
		await loadPasskeys();
	};

	const revoke = async (token: string) => {
		await authClient.revokeSession({ token });
		toast.success("Session revoked");
		await loadSessions();
	};

	const deleteAccount = async () => {
		await authClient.deleteUser(
			{ password },
			{
				onSuccess: () => {
					toast.success("Account deleted");
					router.push("/login");
				},
				onError: (error) => {
					toast.error(error.error.message || error.error.statusText);
				},
			}
		);
	};

	if (isPending || !session) {
		return null;
	}

	return (
		<div className="mx-auto mt-10 w-full max-w-2xl space-y-6 p-6">
			<Card>
				<CardHeader>
					<CardTitle>Passkeys</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					{passkeys.length === 0 ? (
						<p className="text-muted-foreground text-sm">No passkeys yet.</p>
					) : (
						passkeys.map((pk) => (
							<div className="flex items-center justify-between" key={pk.id}>
								<span>{pk.name ?? "Passkey"}</span>
								<Button
									onClick={() => {
										removePasskey(pk.id).catch(() => undefined);
									}}
									size="sm"
									variant="destructive"
								>
									Remove
								</Button>
							</div>
						))
					)}
					<Button
						onClick={() => {
							addPasskey().catch(() => undefined);
						}}
						variant="outline"
					>
						Add passkey
					</Button>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Active sessions</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					{sessions.map((s) => (
						<div className="flex items-center justify-between" key={s.token}>
							<span className="truncate text-sm">
								{s.userAgent ?? "Unknown device"}
							</span>
							<Button
								onClick={() => {
									revoke(s.token).catch(() => undefined);
								}}
								size="sm"
								variant="outline"
							>
								Revoke
							</Button>
						</div>
					))}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Delete account</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<p className="text-muted-foreground text-sm">
						Permanently delete your account and all data. This cannot be undone.
					</p>
					<div className="space-y-2">
						<Label htmlFor="confirm-password">Confirm password</Label>
						<Input
							id="confirm-password"
							onChange={(e) => setPassword(e.target.value)}
							type="password"
							value={password}
						/>
					</div>
					<Button
						onClick={() => {
							deleteAccount().catch(() => undefined);
						}}
						variant="destructive"
					>
						Delete my account
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}

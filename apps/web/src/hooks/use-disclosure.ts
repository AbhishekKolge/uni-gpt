"use client";

import { useState } from "react";

export const useDisclosure = (initialState = false) => {
	const [isOpen, setIsOpen] = useState(initialState);

	const onOpen = () => setIsOpen(true);
	const onClose = () => setIsOpen(false);
	const onToggle = () => setIsOpen((current) => !current);

	return { isOpen, onOpen, onClose, onToggle };
};

export type UseDisclosure = ReturnType<typeof useDisclosure>;

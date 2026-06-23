import { useEffect, useState } from "react";

const DEBOUNCE_DELAY = 500;

export function useDebounce<T>(value: T, delay = DEBOUNCE_DELAY) {
	const [debouncedValue, setDebouncedValue] = useState(value);

	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedValue(value);
		}, delay);

		return () => {
			clearTimeout(handler);
		};
	}, [value, delay]);

	return debouncedValue;
}

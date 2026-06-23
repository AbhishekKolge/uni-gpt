export const getInitials = (str: string) => {
	const words = str.split(" ");
	const firstTwoLetters = words.map((word) => word.charAt(0)).slice(0, 2);
	const result = firstTwoLetters.join("");

	return result;
};

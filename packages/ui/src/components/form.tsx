"use client";

import { useRender } from "@base-ui/react/use-render";
import { Label } from "@uni-gpt/ui/components/label";
import { cn } from "@uni-gpt/ui/lib/utils";
import { type ComponentProps, createContext, useContext, useId } from "react";
import {
	Controller,
	type ControllerProps,
	type FieldPath,
	type FieldValues,
	FormProvider,
	useFormContext,
	useFormState,
} from "react-hook-form";

const Form = FormProvider;

interface FormFieldContextValue<
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
	name: TName;
}

const FormFieldContext = createContext<FormFieldContextValue>(
	{} as FormFieldContextValue
);

function FormField<
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(props: ControllerProps<TFieldValues, TName>) {
	return (
		<FormFieldContext.Provider value={{ name: props.name }}>
			<Controller {...props} />
		</FormFieldContext.Provider>
	);
}

interface FormItemContextValue {
	id: string;
}

const FormItemContext = createContext<FormItemContextValue>(
	{} as FormItemContextValue
);

function useFormField() {
	const fieldContext = useContext(FormFieldContext);
	const itemContext = useContext(FormItemContext);
	const { getFieldState } = useFormContext();
	const formState = useFormState({ name: fieldContext.name });
	const fieldState = getFieldState(fieldContext.name, formState);

	if (!fieldContext) {
		throw new Error("useFormField should be used within <FormField>");
	}

	const { id } = itemContext;

	return {
		id,
		name: fieldContext.name,
		formItemId: `${id}-form-item`,
		formDescriptionId: `${id}-form-item-description`,
		formMessageId: `${id}-form-item-message`,
		...fieldState,
	};
}

function FormItem({ className, ...props }: ComponentProps<"div">) {
	const id = useId();

	return (
		<FormItemContext.Provider value={{ id }}>
			<div
				className={cn("grid gap-2", className)}
				data-slot="form-item"
				{...props}
			/>
		</FormItemContext.Provider>
	);
}

function FormLabel({ className, ...props }: ComponentProps<typeof Label>) {
	const { error, formItemId } = useFormField();

	return (
		<Label
			className={cn("data-[error=true]:text-destructive", className)}
			data-error={Boolean(error)}
			data-slot="form-label"
			htmlFor={formItemId}
			{...props}
		/>
	);
}

function FormControl({ render, ...props }: useRender.ComponentProps<"input">) {
	const { error, formItemId, formDescriptionId, formMessageId } =
		useFormField();

	return useRender({
		render: render ?? <input />,
		defaultTagName: "input",
		props: {
			"aria-describedby": error
				? `${formDescriptionId} ${formMessageId}`
				: formDescriptionId,
			"aria-invalid": Boolean(error),
			id: formItemId,
			"data-slot": "form-control",
			...props,
		},
	});
}

function FormDescription({ className, ...props }: ComponentProps<"p">) {
	const { formDescriptionId } = useFormField();

	return (
		<p
			className={cn("text-muted-foreground text-sm", className)}
			data-slot="form-description"
			id={formDescriptionId}
			{...props}
		/>
	);
}

function FormMessage({ className, children, ...props }: ComponentProps<"p">) {
	const { error, formMessageId } = useFormField();
	const body = error ? String(error.message ?? "") : children;

	if (!body) {
		return null;
	}

	return (
		<p
			className={cn("text-destructive text-sm", className)}
			data-slot="form-message"
			id={formMessageId}
			{...props}
		>
			{body}
		</p>
	);
}

export {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	useFormField,
};

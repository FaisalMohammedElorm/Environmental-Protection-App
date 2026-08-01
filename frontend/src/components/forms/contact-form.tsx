"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { sendContactMessage } from "@/lib/api/contact";
import { contactSchema, type ContactFormValues } from "@/lib/validators/contact";

export function ContactForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<ContactFormValues>({ resolver: zodResolver(contactSchema) });

  const mutation = useMutation({
    mutationFn: sendContactMessage,
    onSuccess: () => {
      toast.success("Message sent — we'll get back to you shortly");
      reset();
    },
    onError: () => toast.error("Couldn't send that message. Please try again.")
  });

  return (
    <form className="card flex flex-col gap-5 p-8" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
      <div className="grid gap-5 sm:grid-cols-2">
        <Input label="Name" error={errors.name?.message} {...register("name")} />
        <Input label="Email" type="email" error={errors.email?.message} {...register("email")} />
      </div>
      <Input label="Subject" error={errors.subject?.message} {...register("subject")} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="message" className="text-sm font-medium text-canopy-700 dark:text-canopy-200">
          Message
        </label>
        <textarea
          id="message"
          rows={5}
          className="rounded-xl border border-canopy-100 dark:border-canopy-700 bg-paper dark:bg-canopy-800 px-4 py-2.5 text-sm text-canopy-800 dark:text-canopy-100 outline-none focus:border-moss focus:ring-2 focus:ring-moss/20"
          {...register("message")}
        />
        {errors.message && <p className="text-xs font-medium text-alert-clay">{errors.message.message}</p>}
      </div>
      <Button type="submit" isLoading={mutation.isPending}>
        Send message
      </Button>
    </form>
  );
}

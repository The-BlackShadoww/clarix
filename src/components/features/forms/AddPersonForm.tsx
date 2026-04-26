import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusCircle } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const personSchema = z.object({
  name: z.string().min(1, "Name is required"),
  age: z.string().min(1, "Age is required"),
  avatar: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type AddPersonFormProps = {
  onAdd: (name: string, age: number, avatar?: string) => void;
};

export const AddPersonForm: React.FC<AddPersonFormProps> = ({ onAdd }) => {
  const form = useForm<z.infer<typeof personSchema>>({
    resolver: zodResolver(personSchema),
    defaultValues: { name: "", age: "", avatar: "" },
  });

  const onSubmit = (values: z.infer<typeof personSchema>) => {
    onAdd(values.name, Number(values.age), values.avatar || undefined);
    form.reset({ name: "", age: "", avatar: "" });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Card className="bg-[#fff8f6] border-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-[16px] flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#ffc6c6] flex items-center justify-center">
              <PlusCircle className="w-3.5 h-3.5 text-[#600000]" />
            </div>
            Add Person
          </CardTitle>
          <CardDescription>Create a new node in the graph.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3.5">
          <div className="space-y-1.5">
            <Label
              htmlFor="name"
              className="text-[13px] font-medium text-[#555a6a]"
            >
              Name
            </Label>
            <Input
              id="name"
              placeholder="e.g. Alice"
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-xs text-[#e53e3e]">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label
              htmlFor="age"
              className="text-[13px] font-medium text-[#555a6a]"
            >
              Age
            </Label>
            <Input
              id="age"
              type="number"
              placeholder="e.g. 28"
              {...form.register("age")}
            />
            {form.formState.errors.age && (
              <p className="text-xs text-[#e53e3e]">
                {form.formState.errors.age.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label
              htmlFor="avatar"
              className="text-[13px] font-medium text-[#555a6a]"
            >
              Avatar URL <span className="text-[#a5a8b5]">(Optional)</span>
            </Label>
            <Input
              id="avatar"
              type="url"
              placeholder="https://..."
              {...form.register("avatar")}
            />
            {form.formState.errors.avatar && (
              <p className="text-xs text-[#e53e3e]">
                {form.formState.errors.avatar.message}
              </p>
            )}
          </div>
          <Button type="submit" className="w-full mt-1">
            Create Person
          </Button>
        </CardContent>
      </Card>
    </form>
  );
};

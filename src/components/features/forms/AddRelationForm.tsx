import React from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link as LinkIcon } from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Person } from "@/types";

const relationSchema = z.object({
  sourceId: z.string().min(1, "Please select a source person"),
  targetId: z.string().min(1, "Please select a target person"),
  relationLabel: z.string().min(1, "Relation label is required"),
});

type AddRelationFormProps = {
  persons: Person[];
  onAdd: (sourceId: number, targetId: number, relationLabel: string) => void;
};

export const AddRelationForm: React.FC<AddRelationFormProps> = ({
  persons,
  onAdd,
}) => {
  const form = useForm<z.infer<typeof relationSchema>>({
    resolver: zodResolver(relationSchema),
    defaultValues: { relationLabel: "", sourceId: "", targetId: "" },
  });

  const onSubmit = (values: z.infer<typeof relationSchema>) => {
    const sId = Number(values.sourceId);
    const tId = Number(values.targetId);
    if (sId === tId) {
      form.setError("targetId", { message: "Cannot relate to same person" });
      return;
    }
    onAdd(sId, tId, values.relationLabel);
    form.reset({ relationLabel: "", sourceId: "", targetId: "" });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Card className="bg-[#f5fffe] border-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-[16px] flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#c3faf5] flex items-center justify-center">
              <LinkIcon className="w-3.5 h-3.5 text-[#187574]" />
            </div>
            Add Relation
          </CardTitle>
          <CardDescription>Link two existing people together.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3.5">
          <div className="space-y-1.5">
            <Label className="text-[13px] font-medium text-[#555a6a]">
              From (Person 1)
            </Label>
            <Controller
              name="sourceId"
              control={form.control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  value={field.value?.toString()}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a person..." />
                  </SelectTrigger>
                  <SelectContent>
                    {persons.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.sourceId && (
              <p className="text-xs text-[#e53e3e]">
                {form.formState.errors.sourceId.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-[13px] font-medium text-[#555a6a]">
              To (Person 2)
            </Label>
            <Controller
              name="targetId"
              control={form.control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  value={field.value?.toString()}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select another person..." />
                  </SelectTrigger>
                  <SelectContent>
                    {persons.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.targetId && (
              <p className="text-xs text-[#e53e3e]">
                {form.formState.errors.targetId.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="relationLabel"
              className="text-[13px] font-medium text-[#555a6a]"
            >
              How are they related?
            </Label>
            <Input
              id="relationLabel"
              placeholder="e.g. friend, sibling, manager"
              {...form.register("relationLabel")}
            />
            {form.formState.errors.relationLabel && (
              <p className="text-xs text-[#e53e3e]">
                {form.formState.errors.relationLabel.message}
              </p>
            )}
          </div>

          <Button type="submit" variant="outline" className="w-full mt-1">
            Create Link
          </Button>
        </CardContent>
      </Card>
    </form>
  );
};

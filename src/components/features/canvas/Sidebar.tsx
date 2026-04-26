import React, { useState } from "react";
import { Sparkles, Code2, Check, Copy } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { AddPersonForm } from "@/components/features/forms/AddPersonForm";
import { AddRelationForm } from "@/components/features/forms/AddRelationForm";
import { Person } from "@/types";

type SidebarProps = {
  isOpen: boolean;
  persons: Person[];
  onAddPerson: (name: string, age: number, avatar?: string) => void;
  onAddRelation: (
    sourceId: number,
    targetId: number,
    relationLabel: string,
  ) => void;
};

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  persons,
  onAddPerson,
  onAddRelation,
}) => {
  const [showJson, setShowJson] = useState(true);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(persons, null, 2));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div
      className={`absolute top-0 left-0 h-full w-full sm:w-[400px] bg-white z-20 flex flex-col ring-shadow transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
    >
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="w-8 h-8 rounded-lg bg-[#5b76fe] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-[24px] font-semibold tracking-[-0.72px] leading-[1.15] text-[#1c1c1e]">
                Relation Builder
              </h1>
            </div>
            <p className="text-[14px] text-[#555a6a] leading-relaxed ml-[42px]">
              Create nodes and link them on the canvas.
            </p>
          </div>

          <Separator className="bg-[#e0e2e8]" />

          {/* Add Person Form */}
          <AddPersonForm onAdd={onAddPerson} />

          <Separator className="bg-[#e0e2e8]" />

          {/* Add Relation Form */}
          <AddRelationForm persons={persons} onAdd={onAddRelation} />

          <Separator className="bg-[#e0e2e8]" />

          {/* JSON Output toggle */}
          <div className="space-y-2.5 pb-4">
            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-2 text-[#555a6a] hover:text-[#1c1c1e] transition-colors duration-200"
              onClick={() => setShowJson(!showJson)}
            >
              <Code2 className="w-4 h-4" />
              {showJson ? "Hide" : "Show"} Raw JSON
            </Button>
            {showJson && (
              <div className="relative group">
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyJson}
                    className="h-7 w-7 bg-[#282c34] border-[#3e4451] hover:bg-[#3e4451] text-[#a5a8b5] hover:text-white"
                    title="Copy JSON"
                  >
                    {isCopied ? (
                      <Check className="w-3.5 h-3.5 text-[#00b473]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </div>
                <pre className="ring-shadow rounded-xl p-4 text-[12px] font-mono overflow-x-auto whitespace-pre bg-[#1c1c1e] text-[#a5a8b5]">
                  <code>{JSON.stringify(persons, null, 2)}</code>
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

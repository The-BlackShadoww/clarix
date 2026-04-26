import React from "react";
import { Trash2, X, ArrowRight } from "lucide-react";
import { Person } from "@/types";
import { getColorFromName, getSizeFromAge } from "@/utils";

type PersonPopupProps = {
  person: Person;
  position: { x: number; y: number };
  allPersons: Person[];
  onClose: () => void;
  onRemovePerson: (id: number) => void;
  onRemoveRelation: (sourceId: number, targetId: number) => void;
};

export const PersonPopup: React.FC<PersonPopupProps> = ({
  person,
  position,
  allPersons,
  onClose,
  onRemovePerson,
  onRemoveRelation,
}) => {
  const size = getSizeFromAge(person.age);
  const nodeColor = getColorFromName(person.name);

  const inboundRelations = allPersons.flatMap((p) =>
    p.relations
      .filter((r) => r.id === person.id)
      .map((r) => ({ ...r, sourceName: p.name, sourceId: p.id })),
  );

  const totalRelations = person.relations.length + inboundRelations.length;

  const isNearBottom = position.y > 400;
  const popupTop = isNearBottom ? position.y - 16 : position.y + size + 16;
  const popupTransform = isNearBottom
    ? "translate(-50%, -100%)"
    : "translateX(-50%)";

  return (
    <div
      className="absolute z-50 pointer-events-auto cursor-auto person-popup"
      style={{
        left: position.x + size / 2,
        top: popupTop,
        transform: popupTransform,
        width: 340,
      }}
    >
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(20px) saturate(1.4)",
          WebkitBackdropFilter: "blur(20px) saturate(1.4)",
          boxShadow:
            "0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06), 0 0 0 1px rgba(224,226,232,0.8)",
        }}
      >
        <div
          className="relative px-6 pt-6 pb-5"
          style={{
            background: `linear-gradient(135deg, ${nodeColor}44 0%, ${nodeColor}18 100%)`,
          }}
        >
          <button
            onClick={() => onRemovePerson(person.id)}
            className="absolute top-3 right-12 w-7 h-7 rounded-full bg-white/70 hover:bg-[#fbd4d4] text-[#c7cad5] hover:text-[#e53e3e] flex items-center justify-center transition-all duration-200"
            style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}
            title="Delete person"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/70 hover:bg-white flex items-center justify-center transition-all duration-200"
            style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}
          >
            <X className="w-3.5 h-3.5 text-[#555a6a]" />
          </button>

          <div className="flex items-center gap-4">
            {person.avatar ? (
              <div
                className="w-14 h-14 rounded-full bg-cover bg-center shrink-0"
                style={{
                  backgroundImage: `url(${person.avatar})`,
                  boxShadow: `0 4px 14px rgba(0,0,0,0.12), 0 0 0 2.5px white`,
                }}
              />
            ) : (
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-semibold text-[#1c1c1e] shrink-0"
                style={{
                  backgroundColor: nodeColor,
                  boxShadow: `0 4px 14px ${nodeColor}66, 0 0 0 2.5px white`,
                }}
              >
                {person.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <h3 className="text-[20px] font-semibold tracking-[-0.4px] text-[#1c1c1e] truncate">
                {person.name}
              </h3>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-[13px] text-[#555a6a] font-medium">
                  Age {person.age}
                </span>
                <span className="w-1 h-1 rounded-full bg-[#c7cad5]"></span>
                <span className="text-[13px] text-[#555a6a] font-medium">
                  {totalRelations} {totalRelations === 1 ? "link" : "links"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[320px] overflow-y-auto popup-scroll">
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#5b76fe]"></div>
              <h4 className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#a5a8b5]">
                Relationships Added By {person.name}
              </h4>
            </div>
            {person.relations.length > 0 ? (
              <div className="space-y-1.5">
                {person.relations.map((r, i) => {
                  const target = allPersons.find((p) => p.id === r.id);
                  const targetColor = target
                    ? getColorFromName(target.name)
                    : "#e0e2e8";
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl group/rel transition-colors duration-150 hover:bg-[#f5f6f8]"
                    >
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0"
                        style={{ backgroundColor: targetColor }}
                      >
                        {target?.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[13px] text-[#1c1c1e] font-medium truncate block">
                          {target?.name}
                        </span>
                        <span className="text-[11px] text-[#5b76fe] font-medium italic">
                          {r.relation}
                        </span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-[#c7cad5]" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveRelation(person.id, r.id);
                        }}
                        className="text-[#c7cad5] hover:text-[#e53e3e] hover:bg-[#fbd4d4] p-1 rounded-md transition-all duration-200 opacity-0 group-hover/rel:opacity-100"
                        title="Delete relation"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[12px] text-[#a5a8b5] italic pl-3.5">
                No outgoing links.
              </p>
            )}
          </div>

          <div className="border-t border-[#e0e2e8]/60"></div>

          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00b473]"></div>
              <h4 className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#a5a8b5]">
                Relationships Added By Others
              </h4>
            </div>
            {inboundRelations.length > 0 ? (
              <div className="space-y-1.5">
                {inboundRelations.map((r, i) => {
                  const sourceColor = getColorFromName(r.sourceName);
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl group/rel transition-colors duration-150 hover:bg-[#f5f6f8]"
                    >
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0"
                        style={{ backgroundColor: sourceColor }}
                      >
                        {r.sourceName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[13px] text-[#1c1c1e] font-medium truncate block">
                          {r.sourceName}
                        </span>
                        <span className="text-[11px] text-[#00b473] font-medium italic">
                          {r.relation}
                        </span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-[#c7cad5] rotate-180" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveRelation(r.sourceId, person.id);
                        }}
                        className="text-[#c7cad5] hover:text-[#e53e3e] hover:bg-[#fbd4d4] p-1 rounded-md transition-all duration-200 opacity-0 group-hover/rel:opacity-100"
                        title="Delete relation"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[12px] text-[#a5a8b5] italic pl-3.5">
                No incoming links.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

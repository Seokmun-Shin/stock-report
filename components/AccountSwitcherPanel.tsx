"use client";

import { useState } from "react";
import type { AppData } from "@/lib/types";
import { addAccount, listAccounts, renameAccount, switchAccount } from "@/lib/multiAccount";
import { AreaCardHeader, BtnCreate, BtnTextAction, PanelCard, UI } from "./ui/PanelCard";

export function AccountSwitcherPanel({
  data,
  onPersist,
}: {
  data: AppData;
  onPersist: (next: AppData) => void;
}) {
  const accounts = listAccounts(data);
  const activeId = data.activeAccountId ?? accounts[0]?.id;
  const [newName, setNewName] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  function handleSwitch(id: string) {
    if (id === activeId) return;
    onPersist(switchAccount(data, id));
  }

  function handleAdd() {
    onPersist(addAccount(data, newName || "새 계좌"));
    setNewName("");
  }

  function handleRename(id: string) {
    onPersist(renameAccount(data, id, renameValue));
    setRenamingId(null);
    setRenameValue("");
  }

  return (
    <PanelCard>
      <AreaCardHeader
        title="계좌"
        subtitle="ISA·연금·일반 등 계좌별로 매매 기록을 분리합니다 (Phase D)"
      />
      <ul className="mt-3 space-y-2">
        {accounts.map((acc) => {
          const selected = acc.id === activeId;
          return (
            <li
              key={acc.id}
              className={`flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2 ${
                selected ? "border-gain/50 bg-gain/5" : "border-white/10 bg-white/5"
              }`}
            >
              {renamingId === acc.id ? (
                <>
                  <input
                    className={`${UI.input} min-w-[8rem] flex-1`}
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    autoFocus
                  />
                  <BtnCreate onClick={() => handleRename(acc.id)}>저장</BtnCreate>
                  <BtnTextAction type="button" onClick={() => setRenamingId(null)}>
                    취소
                  </BtnTextAction>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handleSwitch(acc.id)}
                    className={`min-w-0 flex-1 text-left text-sm font-semibold ${
                      selected ? "text-gain" : "text-white hover:text-gain"
                    }`}
                  >
                    {acc.name}
                    {selected && <span className="ml-2 text-xs font-normal text-zinc-400">(활성)</span>}
                  </button>
                  <BtnTextAction
                    type="button"
                    className="text-xs"
                    onClick={() => {
                      setRenamingId(acc.id);
                      setRenameValue(acc.name);
                    }}
                  >
                    이름
                  </BtnTextAction>
                </>
              )}
            </li>
          );
        })}
      </ul>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          className={`${UI.input} min-w-[8rem] flex-1`}
          placeholder="새 계좌 이름 (예: ISA)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <BtnCreate onClick={handleAdd}>+ 계좌 추가</BtnCreate>
      </div>
    </PanelCard>
  );
}

"use server";

import { revalidatePath } from "next/cache";

import { deleteMessage, setMessageRead } from "@/server/admin/engage";
import { runAdminAction } from "@/server/admin/run-action";

export async function setMessageReadAction(id: string, read: boolean) {
  return runAdminAction("messages", async () => {
    await setMessageRead(id, read);
    revalidatePath("/admin", "layout");
  });
}

export async function deleteMessageAction(id: string) {
  return runAdminAction("messages", async () => {
    await deleteMessage(id);
    revalidatePath("/admin", "layout");
  }, "Message deleted.");
}

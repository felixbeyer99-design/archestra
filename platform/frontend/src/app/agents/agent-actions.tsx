import { archestraApiSdk, E2eTestId } from "@shared";
import {
  Clock,
  Download,
  Eye,
  MessageSquare,
  Pencil,
  Plug,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  type TableRowAction,
  TableRowActions,
} from "@/components/table-row-actions";
import type { useProfilesPaginated } from "@/lib/agent.query";

type Agent = NonNullable<
  ReturnType<typeof useProfilesPaginated>["data"]
>["data"][number];

type AgentActionsProps = {
  agent: Agent;
  canModify: boolean;
  onConnect: (agent: Pick<Agent, "id" | "name" | "agentType">) => void;
  onEdit: (agent: Agent) => void;
  onView: (agent: Agent) => void;
  onDelete: (agentId: string) => void;
};

export function AgentActions({
  agent,
  canModify,
  onConnect,
  onEdit,
  onView,
  onDelete,
}: AgentActionsProps) {
  const isBuiltIn = Boolean(agent.builtIn);

  const handleExport = async () => {
    try {
      const { data: exportedAgent, error } = await archestraApiSdk.exportAgent({
        path: { id: agent.id },
      });
      if (error || !exportedAgent) {
        throw new Error(error?.error?.message ?? "Failed to export agent");
      }
      const blob = new Blob([JSON.stringify(exportedAgent, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const safeName = agent.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      link.href = url;
      link.download = `${safeName || "agent"}-export.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success("Agent exported");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to export agent",
      );
    }
  };

  const editOrViewAction: TableRowAction =
    canModify || isBuiltIn
      ? {
          icon: <Pencil className="h-4 w-4" />,
          label: "Edit",
          permissions: { agent: ["update"] },
          disabled: !canModify && !isBuiltIn,
          onClick: () => onEdit(agent),
          testId: `${E2eTestId.EditAgentButton}-${agent.name}`,
        }
      : {
          icon: <Eye className="h-4 w-4" />,
          label: "View",
          onClick: () => onView(agent),
          testId: `${E2eTestId.EditAgentButton}-${agent.name}`,
        };

  const actions: TableRowAction[] = [
    {
      icon: <Plug className="h-4 w-4" />,
      label: "Connect",
      disabled: isBuiltIn,
      disabledTooltip: "Built-in agents cannot be connected",
      onClick: () => onConnect(agent),
      testId: `${E2eTestId.ConnectAgentButton}-${agent.name}`,
    },
    {
      icon: <MessageSquare className="h-4 w-4" />,
      label: "Chat",
      disabled: isBuiltIn,
      disabledTooltip: "Built-in agents cannot be chatted with",
      href: `/chat/new?agent_id=${agent.id}`,
    },
    {
      icon: <Clock className="h-4 w-4" />,
      label: "Schedule",
      disabled: isBuiltIn,
      disabledTooltip: "Built-in agents cannot be scheduled",
      permissions: { scheduledTask: ["read"] },
      href: `/scheduled-tasks?agentId=${agent.id}`,
    },
    editOrViewAction,
    {
      icon: <Download className="h-4 w-4" />,
      label: "Export",
      onClick: handleExport,
    },
    {
      icon: <Trash2 className="h-4 w-4" />,
      label: "Delete",
      permissions: { agent: ["delete"] },
      disabled: isBuiltIn || !canModify,
      disabledTooltip: isBuiltIn
        ? "Built-in agents cannot be deleted"
        : undefined,
      variant: "destructive",
      onClick: () => onDelete(agent.id),
      testId: `${E2eTestId.DeleteAgentButton}-${agent.name}`,
    },
  ];

  return <TableRowActions actions={actions} />;
}

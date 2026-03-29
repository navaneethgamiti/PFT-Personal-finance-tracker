import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useAppSelector } from "@/hooks/redux";
import { backendApi } from "@/services/backendApi";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface MemberForm {
  accountId: string;
  memberUserId: string;
  role: "Owner" | "Editor" | "Viewer";
}

export const FamilyModePage = () => {
  const accounts = useAppSelector((s) => s.finance.accounts);
  const queryClient = useQueryClient();
  const defaultAccountId = accounts[0]?.id ?? "";

  const { register, handleSubmit, watch, reset } = useForm<MemberForm>({ defaultValues: { accountId: defaultAccountId, role: "Viewer" } });
  const selectedAccountId = watch("accountId");

  const { data: members = [] } = useQuery({
    queryKey: ["shared-members", selectedAccountId],
    queryFn: () => (selectedAccountId ? backendApi.getSharedMembers(selectedAccountId) : Promise.resolve([])),
    enabled: Boolean(selectedAccountId)
  });

  const addMutation = useMutation({
    mutationFn: (payload: MemberForm) => backendApi.addSharedMember(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shared-members", selectedAccountId] });
      reset({ accountId: selectedAccountId, role: "Viewer", memberUserId: "" });
    }
  });

  const removeMutation = useMutation({
    mutationFn: (memberId: string) => backendApi.removeSharedMember(memberId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shared-members", selectedAccountId] })
  });

  const currentAccountName = useMemo(() => accounts.find((a) => a.id === selectedAccountId)?.name ?? "-", [accounts, selectedAccountId]);

  return (
    <section className="space-y-6" data-testid="family-mode-page">
      <PageHeader title="Shared Accounts" subtitle="Invite family members and manage account roles." />

      <Card>
        <h3 className="mb-3 text-base font-semibold">Invite Member</h3>
        <form className="form-grid" onSubmit={handleSubmit((values) => addMutation.mutate(values))}>
          <label className="form-field">Account
            <select className="select" {...register("accountId", { required: true })}>
              <option value="">Select account</option>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </label>
          <label className="form-field">Member User Id<input className="input" {...register("memberUserId", { required: true })} /></label>
          <label className="form-field">Role
            <select className="select" {...register("role")}> 
              <option value="Viewer">Viewer</option>
              <option value="Editor">Editor</option>
              <option value="Owner">Owner</option>
            </select>
          </label>
          <Button type="submit">Add Member</Button>
        </form>
      </Card>

      <Card>
        <h3 className="mb-2 text-base font-semibold">Members for {currentAccountName}</h3>
        <table className="table">
          <thead><tr><th>User ID</th><th>Role</th><th>Joined</th><th>Action</th></tr></thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id}>
                <td>{m.memberUserId}</td>
                <td>{m.role}</td>
                <td>{new Date(m.createdAtUtc).toLocaleDateString("en-IN")}</td>
                <td><Button type="button" variant="ghost" size="sm" onClick={() => removeMutation.mutate(m.id)}>Remove</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </section>
  );
};

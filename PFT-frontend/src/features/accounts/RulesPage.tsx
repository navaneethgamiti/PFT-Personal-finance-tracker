import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { backendApi } from "@/services/backendApi";
import { useAppSelector } from "@/hooks/redux";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface RuleForm {
  name: string;
  merchantContains: string;
  categoryId?: string;
  addTag?: string;
  priority: number;
}

export const RulesPage = () => {
  const queryClient = useQueryClient();
  const categories = useAppSelector((state) => state.finance.categories);
  const { data: rules = [] } = useQuery({ queryKey: ["rules"], queryFn: () => backendApi.getRules() });
  const [editingId, setEditingId] = useState<string | null>(null);

  const { register, handleSubmit, reset } = useForm<RuleForm>({ defaultValues: { priority: 1 } });

  const createMutation = useMutation({
    mutationFn: (payload: RuleForm) => backendApi.createRule({ ...payload, isActive: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rules"] });
      reset({ priority: 1 });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => backendApi.deleteRule(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rules"] })
  });

  return (
    <section className="space-y-6" data-testid="rules-page">
      <PageHeader title="Rules Engine" subtitle="Automate categorization and tagging based on merchant patterns." />

      <Card>
        <h3 className="mb-3 text-base font-semibold">Create Rule</h3>
        <form className="form-grid" onSubmit={handleSubmit((values) => createMutation.mutate(values))}>
          <label className="form-field">Name<input className="input" {...register("name", { required: true })} /></label>
          <label className="form-field">Merchant Contains<input className="input" {...register("merchantContains", { required: true })} /></label>
          <label className="form-field">Category
            <select className="select" {...register("categoryId")}>
              <option value="">No change</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className="form-field">Add Tag<input className="input" {...register("addTag")} /></label>
          <label className="form-field">Priority<input className="input" type="number" {...register("priority", { valueAsNumber: true })} /></label>
          <Button type="submit">Save Rule</Button>
        </form>
      </Card>

      <Card>
        <h3 className="mb-3 text-base font-semibold">Active Rules</h3>
        <table className="table">
          <thead><tr><th>Name</th><th>Condition</th><th>Action</th><th>Priority</th><th>Actions</th></tr></thead>
          <tbody>
            {rules.map((rule) => (
              <tr key={rule.id}>
                <td>{rule.name}</td>
                <td>merchant contains "{rule.merchantContains}"</td>
                <td>{rule.categoryId ? "Set category" : "-"}{rule.addTag ? ` + tag ${rule.addTag}` : ""}</td>
                <td>{rule.priority}</td>
                <td>
                  <div className="flex gap-2">
                    <Button type="button" variant="secondary" size="sm" onClick={() => setEditingId(rule.id)}>{editingId === rule.id ? "Editing" : "Edit"}</Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => deleteMutation.mutate(rule.id)}>Delete</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </section>
  );
};

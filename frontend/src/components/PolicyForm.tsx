"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { api, type Policy } from "@/lib/api";
import { toast } from "sonner";
interface PolicyFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  policy?: Policy | null;
}


export default function PolicyForm({ open, onOpenChange, onSuccess, policy }:PolicyFormProps) {
    const [name, setName] = useState(policy?.name ?? "");
    const [description, setDescription] = useState(policy?.description ?? "");
    const [effect, setEffect] = useState(policy?.effect ?? "allow");
    const [priority, setPriority] = useState(policy?.priority ?? 0);
    const [active, setActive] = useState(policy?.active ?? true);
    const [conditions, setConditions] = useState<string>(
      policy?.conditions ? JSON.stringify(policy.conditions, null, 2) : "[]"
    );
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);
  
    const isEdit = !!policy;
  
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      try {
        let parsedConditions: Record<string, unknown>[] = [];;
        try {
          parsedConditions = JSON.parse(conditions);
        } catch {
          toast.error("Conditions must be valid JSON array");
          setLoading(false);
          return;
        }
  
        const data = {
          name,
          description,
          effect,
          priority,
          active,
          conditions: parsedConditions,
        };
  
        if (isEdit && policy) {
          await api.policies.update(policy.id, data);
          toast.success("Policy updated successfully");
        } else {
          await api.policies.create(data);
          toast.success("Policy created successfully");
        }
        onSuccess();
        onOpenChange(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Operation failed");
      } finally {
        setLoading(false);
      }
    };
  
    const handleDelete = async () => {
      if (!policy) return;
      if (!window.confirm(`Delete policy "${policy.name}"?`)) return;
      setDeleting(true);
      try {
        await api.policies.delete(policy.id);
        toast.success("Policy deleted");
        onSuccess();
        onOpenChange(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Delete failed");
      } finally {
        setDeleting(false);
      }
    };
  
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Policy" : "Create Policy"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the policy details below."
              : "Fill in the policy details below to create a new policy."}
          </DialogDescription>
        </DialogHeader>
  
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-ink">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter policy name"
              required
            />
          </div>
  
          <div className="space-y-2">
            <label className="text-sm font-medium text-ink">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={3}
            />
          </div>
  
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-ink">Effect</label>
              <Select value={effect} onValueChange={setEffect}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="allow">Allow</SelectItem>
                  <SelectItem value="deny">Deny</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-ink">Priority</label>
              <Input
                type="number"
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                min={0}
                placeholder="Enter priority (higher = higher priority)"
              />
            </div>
          </div>
  
          <div className="flex items-center gap-2">
            <Checkbox
              id="active"
              checked={active}
              onCheckedChange={(checked) => setActive(typeof checked === "boolean" ? checked : false)}
              className="h-4 w-4"
            />
            <label htmlFor="active" className="text-sm text-ink">Active</label>
          </div>
  
          <div className="space-y-2">
            <label className="text-sm font-medium text-ink">Conditions (JSON)</label>
            <Textarea
              value={conditions}
              onChange={(e) => setConditions(e.target.value)}
              placeholder='[{"field": "plan", "operator": "in", "value": ["pro", "enterprise"]}]'
              rows={4}
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted mt-1">
              Array of condition objects: e.g., [{'{'}"field": "plan", "operator": "in", "value": ["pro", "enterprise"]{'}'}]
            </p>
          </div>
        </form>
  
        <DialogFooter className="flex justify-between pt-4">
          <div className="flex space-x-3">
            {isEdit && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2"
              >
                {deleting ? "Deleting..." : "Delete Policy"}
              </Button>
            )}
          </div>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2"
            >
              {loading ? "Saving..." : isEdit ? "Update Policy" : "Create Policy"}
            </Button>
          </div>
        </DialogFooter>
        </DialogContent>
      </Dialog>
    );
}

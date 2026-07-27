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
import { api, type Entity } from "@/lib/api";
import { toast } from "sonner";

interface EntityFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entity?: Entity | null;
  onSuccess: () => void;
}

export function EntityForm({ open, onOpenChange, entity, onSuccess }: EntityFormProps) {
  const [externalId, setExternalId] = useState(entity?.externalId ?? "");
  const [type, setType] = useState(entity?.type ?? "user");
  const [attributes, setAttributes] = useState<string>(
    entity?.attributes ? JSON.stringify(entity.attributes, null, 2) : "{}"
  );
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isEdit = !!entity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let parsedAttributes: Record<string, unknown> = {};
      try {
        parsedAttributes = JSON.parse(attributes);
      } catch {
        toast.error("Attributes must be valid JSON object");
        setLoading(false);
        return;
      }

      const data = {
        externalId,
        type,
        attributes: parsedAttributes,
      };

      if (isEdit && entity) {
        await api.entities.update(entity.id, data);
        toast.success("Entity updated successfully");
      } else {
        await api.entities.create(data);
        toast.success("Entity created successfully");
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
    if (!entity) return;
    if (!window.confirm(`Delete entity "${entity.externalId}"?`)) return;
    setDeleting(true);
    try {
      await api.entities.delete(entity.id);
      toast.success("Entity deleted");
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
          <DialogTitle>{isEdit ? "Edit Entity" : "Create Entity"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the entity details below."
              : "Fill in the entity details below to create a new entity."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-ink">External ID</label>
            <Input
              value={externalId}
              onChange={(e) => setExternalId(e.target.value)}
              placeholder="External identifier"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-ink">Type</label>
            <Input
              value={type}
              onChange={(e) => setType(e.target.value)}
              placeholder="entity type (user, service, api_key, etc.)"
              list="entity-types"
            />
          </div>

          <datalist id="entity-types">
            <option value="user" />
            <option value="service" />
            <option value="api_key" />
            <option value="device" />
            <option value="application" />
          </datalist>

          <div className="space-y-2">
            <label className="text-sm font-medium text-ink">Attributes (JSON)</label>
            <Textarea
              value={attributes}
              onChange={(e) => setAttributes(e.target.value)}
              placeholder='{"plan": "pro", "role": "admin", "email": "user@example.com"}'
              rows={6}
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted mt-1">
              Object of key-value pairs for entity attributes
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
                {deleting ? "Deleting..." : "Delete Entity"}
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
              {loading ? "Saving..." : isEdit ? "Update Entity" : "Create Entity"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
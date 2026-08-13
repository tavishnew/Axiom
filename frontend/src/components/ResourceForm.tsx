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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription as AlertDescription, AlertDialogFooter as AlertFooter, AlertDialogHeader as AlertHeader, AlertDialogTitle as AlertTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api, type Resource } from "@/lib/api";
import { toast } from "sonner";

interface ResourceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resource?: Resource | null;
  onSuccess: () => void;
}

export function ResourceForm({ open, onOpenChange, resource, onSuccess }: ResourceFormProps) {
  const [type, setType] = useState(resource?.type ?? "document");
  const [name, setName] = useState(resource?.name ?? "");
  const [description, setDescription] = useState(resource?.description ?? "");
  const [attributes, setAttributes] = useState<string>(
    resource?.attributes ? JSON.stringify(resource.attributes, null, 2) : "{}"
  );
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const isEdit = !!resource;

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
        type,
        name,
        description,
        attributes: parsedAttributes,
      };

      if (isEdit && resource) {
        await api.resources.update(resource.id, data);
        toast.success("Resource updated successfully");
      } else {
        await api.resources.create(data);
        toast.success("Resource created successfully");
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
    if (!resource) return;
    setDeleting(true);
    try {
      await api.resources.delete(resource.id);
      toast.success("Resource deleted");
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
          <DialogTitle>{isEdit ? "Edit Resource" : "Create Resource"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the resource details below."
              : "Fill in the resource details below to create a new resource."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-ink">Type</label>
            <Input
              value={type}
              onChange={(e) => setType(e.target.value)}
              placeholder="resource type (document, database, api, billing, etc.)"
              list="resource-types"
            />
          </div>

          <datalist id="resource-types">
            <option value="document" />
            <option value="database" />
            <option value="api" />
            <option value="billing" />
            <option value="storage" />
            <option value="compute" />
            <option value="network" />
          </datalist>

          <div className="space-y-2">
            <label className="text-sm font-medium text-ink">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Resource name"
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

          <div className="space-y-2">
            <label className="text-sm font-medium text-ink">Attributes (JSON)</label>
            <Textarea
              value={attributes}
              onChange={(e) => setAttributes(e.target.value)}
              placeholder='{"department": "finance", "sensitivity": "confidential"}'
              rows={6}
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted mt-1">
              Object of key-value pairs for resource attributes
            </p>
          </div>
        </form>

        <DialogFooter className="flex justify-between pt-4">
          <div className="flex space-x-3">
            {isEdit && (
              <Button
                variant="destructive"
                onClick={() => setDeleteConfirmOpen(true)}
                disabled={deleting}
                className="px-4 py-2"
              >
                {deleting ? "Deleting..." : "Delete Resource"}
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
              {loading ? "Saving..." : isEdit ? "Update Resource" : "Create Resource"}
            </Button>
          </div>
        </DialogFooter>
        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertHeader>
              <AlertTitle>Delete {resource?.name}?</AlertTitle>
              <AlertDescription>This permanently removes the protected resource and may change the access decisions that depend on it.</AlertDescription>
            </AlertHeader>
            <AlertFooter>
              <AlertDialogCancel disabled={deleting}>Keep resource</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={deleting}>{deleting ? "Deleting…" : "Delete resource"}</AlertDialogAction>
            </AlertFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}
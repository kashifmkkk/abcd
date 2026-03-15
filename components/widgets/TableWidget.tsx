"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { EntityDef } from "@/types/spec";

interface TableWidgetProps {
  projectId: string;
  entity: EntityDef;
  records: Array<{ id: string; data: Record<string, unknown> }>;
  onRefresh: () => Promise<void>;
}

export function TableWidget({ projectId, entity, records, onRefresh }: TableWidgetProps) {
  const initialForm = useMemo(
    () => Object.fromEntries(entity.fields.map((f) => [f.name, ""])) as Record<string, string>,
    [entity.fields]
  );
  const [form, setForm] = useState<Record<string, string>>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    try {
      await fetch(`/api/entities/${entity.name}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, data: form }),
      });
      setForm(initialForm);
      await onRefresh();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      await fetch(`/api/entities/${entity.name}/${id}?projectId=${projectId}`, {
        method: "DELETE",
      });
      await onRefresh();
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (id: string, row: Record<string, unknown>) => {
    setEditingId(id);
    setEditingForm(
      Object.fromEntries(entity.fields.map((f) => [f.name, String(row[f.name] ?? "")])) as Record<string, string>
    );
  };

  const saveEdit = async (id: string) => {
    setLoading(true);
    try {
      await fetch(`/api/entities/${entity.name}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, data: editingForm }),
      });
      setEditingId(null);
      setEditingForm({});
      await onRefresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader>
        <CardTitle>{entity.label ?? entity.name}</CardTitle>
      </CardHeader>
      <CardContent className="flex h-[calc(100%-64px)] min-h-0 flex-col gap-4 overflow-hidden">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {entity.fields.map((field) => (
            <Input
              key={field.name}
              placeholder={field.name}
              value={form[field.name] ?? ""}
              onChange={(e) => setForm((prev) => ({ ...prev, [field.name]: e.target.value }))}
            />
          ))}
          <Button disabled={loading} onClick={handleCreate} className="sm:col-span-2 lg:col-span-1">Create</Button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto rounded-md border border-slate-200">
        <Table>
          <TableHeader>
            <TableRow>
              {entity.fields.map((f) => (
                <TableHead key={f.name}>{f.name}</TableHead>
              ))}
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={entity.fields.length + 1} className="text-center text-slate-500">
                  No records yet
                </TableCell>
              </TableRow>
            ) : null}
            {records.map((record) => (
              <TableRow key={record.id}>
                {entity.fields.map((f) => (
                  <TableCell key={`${record.id}-${f.name}`}>
                    {editingId === record.id ? (
                      <Input
                        value={editingForm[f.name] ?? ""}
                        onChange={(e) =>
                          setEditingForm((prev) => ({ ...prev, [f.name]: e.target.value }))
                        }
                      />
                    ) : (
                      String(record.data[f.name] ?? "")
                    )}
                  </TableCell>
                ))}
                <TableCell className="space-x-2">
                  {editingId === record.id ? (
                    <>
                      <Button size="sm" onClick={() => saveEdit(record.id)} disabled={loading}>Save</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                    </>
                  ) : (
                    <>
                      <Button size="sm" variant="outline" onClick={() => startEdit(record.id, record.data)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(record.id)} disabled={loading}>
                        Delete
                      </Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface EventFormData {
  name: string;
  description: string;
  location: string;
  coverImage: string;
  startTime: string;
  endTime: string;
}

interface EventFormProps {
  initialData?: EventFormData;
  eventId?: string;
}

export function EventForm({ initialData, eventId }: EventFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [data, setData] = useState<EventFormData>(
    initialData || {
      name: "",
      description: "",
      location: "",
      coverImage: "",
      startTime: "",
      endTime: "",
    }
  );

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const result = await res.json();
      if (res.ok) {
        setData({ ...data, coverImage: result.url });
      } else {
        setError(result.error || "上传失败");
      }
    } catch {
      setError("上传失败");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const url = eventId ? `/api/events/${eventId}` : "/api/events";
      const method = eventId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (!res.ok) {
        setError(result.error || "操作失败");
        return;
      }

      router.push("/admin/events");
      router.refresh();
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md">{error}</div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium">活动名称 *</label>
        <Input
          value={data.name}
          onChange={(e) => setData({ ...data, name: e.target.value })}
          placeholder="输入活动名称"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">活动描述</label>
        <Textarea
          value={data.description}
          onChange={(e) => setData({ ...data, description: e.target.value })}
          placeholder="描述活动详情"
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">活动地点 *</label>
        <Input
          value={data.location}
          onChange={(e) => setData({ ...data, location: e.target.value })}
          placeholder="输入活动地点"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">开始时间 *</label>
          <Input
            type="datetime-local"
            value={data.startTime}
            onChange={(e) => setData({ ...data, startTime: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">结束时间 *</label>
          <Input
            type="datetime-local"
            value={data.endTime}
            onChange={(e) => setData({ ...data, endTime: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">封面图片</label>
        <Input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          disabled={uploading}
        />
        {uploading && <p className="text-sm text-muted-foreground">上传中...</p>}
        {data.coverImage && (
          <img
            src={data.coverImage}
            alt="封面预览"
            className="mt-2 w-full max-w-sm rounded-md object-cover h-48"
          />
        )}
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "保存中..." : eventId ? "更新活动" : "创建活动"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          取消
        </Button>
      </div>
    </form>
  );
}

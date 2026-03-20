"use client";

import { useState, useRef } from "react";

interface PhotoUploadProps {
  studentId: string;
  currentPhotoUrl: string | null;
  studentName: string;
}

export default function PhotoUpload({
  studentId,
  currentPhotoUrl,
  studentName,
}: PhotoUploadProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(currentPhotoUrl);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initials = studentName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n.charAt(0).toUpperCase())
    .join("");

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Show preview immediately
    const previewUrl = URL.createObjectURL(selectedFile);
    setPhotoUrl(previewUrl);

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("photo", selectedFile);

      const res = await fetch(`/api/students/${studentId}/photo`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to upload photo");
        // Revert preview on error
        setPhotoUrl(currentPhotoUrl);
      } else {
        const data = await res.json();
        if (data.photoUrl) {
          setPhotoUrl(data.photoUrl);
        }
      }
    } catch {
      alert("Something went wrong while uploading the photo");
      setPhotoUrl(currentPhotoUrl);
    } finally {
      setUploading(false);
      // Reset the input so the same file can be re-selected
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleRemove() {
    if (!confirm("Remove photo?")) return;
    setUploading(true);
    try {
      const res = await fetch(`/api/students/${studentId}/photo`, {
        method: "DELETE",
      });
      if (res.ok) {
        setPhotoUrl(null);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to remove photo");
      }
    } catch {
      alert("Something went wrong");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex-shrink-0 relative group">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={uploading}
      />

      {/* Avatar / Photo */}
      <div className="relative">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={studentName}
            className="w-16 h-16 rounded-2xl object-cover"
          />
        ) : (
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white"
            style={{ background: "var(--primary)" }}
          >
            {initials}
          </div>
        )}

        {/* Loading overlay */}
        {uploading && (
          <div
            className="absolute inset-0 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.45)" }}
          >
            <div
              className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin"
            />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-1 mt-1">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="btn btn-secondary text-[10px] px-2 py-1"
          style={{ fontSize: "10px", lineHeight: 1.2 }}
        >
          {photoUrl ? "Change Photo" : "Add Photo"}
        </button>
        {photoUrl && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={uploading}
            className="btn text-[10px] px-2 py-1"
            style={{
              fontSize: "10px",
              lineHeight: 1.2,
              background: "var(--danger-bg)",
              color: "var(--danger)",
              border: "1px solid var(--danger)",
            }}
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}

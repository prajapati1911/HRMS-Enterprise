import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ title: "New passwords do not match", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "New password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const token = localStorage.getItem("hrms_token");
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to change password");
      }
      toast({ title: "Password changed successfully" });
      handleClose();
    } catch (err: any) {
      toast({ title: err.message || "Failed to change password", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="currentPwd">Current Password</Label>
            <Input
              id="currentPwd"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="newPwd">New Password</Label>
            <Input
              id="newPwd"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="Min. 6 characters"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmPwd">Confirm New Password</Label>
            <Input
              id="confirmPwd"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Change Password"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
